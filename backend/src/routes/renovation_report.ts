import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import crypto from 'crypto';
import { syncPublishedAuditToImprovements } from '../services/auditImprovementSync';

const router = Router();
const prisma = new PrismaClient();

// Setup Multer for facility-grouped image & document uploads
const baseUploadDir = path.join(__dirname, '../../uploads/integrated_audits');
if (!fs.existsSync(baseUploadDir)) {
  fs.mkdirSync(baseUploadDir, { recursive: true });
}

function toFacilityFolderSlug(raw?: string): string {
  if (!raw) return 'genel';
  const trMap: Record<string, string> = {
    ç: 'c', Ç: 'c', ğ: 'g', Ğ: 'g', ı: 'i', İ: 'i',
    ö: 'o', Ö: 'o', ş: 's', Ş: 's', ü: 'u', Ü: 'u',
  };
  const slug = raw
    .replace(/[çÇğĞıİöÖşŞüÜ]/g, (c) => trMap[c] || c)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);
  return slug || 'genel';
}

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const facilityName = String(req.query.facilityName || req.query.facilityId || '');
    const slug = toFacilityFolderSlug(facilityName);
    const targetDir = path.join(baseUploadDir, slug);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    cb(null, targetDir);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname) || '.webp';
    cb(null, `audit-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 15 * 1024 * 1024 },
});

// Upload files for findings/actions (facility-grouped folder, WebP compressed on client)
router.post('/upload', authMiddleware, upload.array('files', 20), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const facilityName = String(req.query.facilityName || req.query.facilityId || '');
    const slug = toFacilityFolderSlug(facilityName);
    const files = req.files as Express.Multer.File[];

    const uploadedFiles = files.map(file => ({
      name: file.originalname,
      url: `/uploads/integrated_audits/${slug}/${file.filename}`,
      type: file.mimetype,
      size: file.size
    }));

    res.json(uploadedFiles);
  } catch (error) {
    console.error('Upload Error:', error);
    res.status(500).json({ error: 'Dosya yükleme başarısız.' });
  }
});

// Get all audits (optionally filtered by facility)
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { facilityId } = req.query as Record<string, string>;
  const isManager = req.user?.isAdmin || req.user?.isManagement || req.user?.roles?.includes('admin') || req.user?.roles?.includes('management') || req.user?.roles?.includes('safety');

  try {
    const whereClause: any = {};
    if (facilityId) whereClause.facilityId = facilityId;
    if (!isManager) whereClause.status = { not: 'DRAFT' };

    const audits = await prisma.integratedAudit.findMany({
      where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
      include: {

        findings: {
          include: {
            actions: {
              include: { files: true },
              orderBy: { order: 'asc' }
            },
            files: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(audits);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Denetimler alınamadı.' });
  }
});

// Create or update a report (we use a bulk save approach since it's a complex object)
router.post('/save', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id, facilityId, status, saved, meta, team, findings } = req.body;
  if (!facilityId) return res.status(400).json({ error: 'facilityId zorunludur' });

  try {
    const actorRecord = req.user?.username
      ? await prisma.user.findUnique({
        where: { username: req.user.username },
        select: { username: true, fullName: true, title: true }
      })
      : null;

    const result = await prisma.$transaction(async (tx) => {
      // Create or update the main audit
      const auditData = {
        facilityId,
        status: status || 'DRAFT',
        saved: saved === undefined ? true : saved,
        round: meta.round || 1,
        startDate: meta.start ? new Date(meta.start) : new Date(),
        endDate: meta.end ? new Date(meta.end) : new Date(),
        reportDate: meta.reportDate ? new Date(meta.reportDate) : new Date(),
        reportNo: meta.reportNo || '',
        reporter: meta.reporter || '',
        auditStatus: meta.auditStatus || 'Devam Ediyor',
        purpose: meta.purpose || '',
        executive: meta.executive || '',
        conclusion: meta.conclusion || '',
        team: meta.team || [],
        participants: meta.participants || [],
        criteria: meta.criteria || []
      };

      let auditId = id;

      if (!id || id.startsWith('draft_')) {
        // Create new
        const createdAudit = await tx.integratedAudit.create({
          data: {
            ...auditData,
            createdBy: req.user?.username || req.user?.fullName || 'unknown'
          }
        });
        auditId = createdAudit.id;
      } else {
        // Update existing
        await tx.integratedAudit.update({
          where: { id },
          data: auditData
        });
      }

      // 2. Sync Findings WITH PERMANENT UUIDs (Upsert existing, create new with UUID, delete only removed)
      const incomingFindings = Array.isArray(findings) ? findings : [];
        const resolvedFindings: any[] = [];
        for (const finding of incomingFindings) {
          const rawId = typeof finding.id === 'string' ? finding.id.trim() : '';
          const isPersistentId = Boolean(rawId) && !rawId.startsWith('f_') && !rawId.startsWith('temp_');
            let candidateId = isPersistentId ? rawId : crypto.randomUUID();

            // Başka bir denetimde (auditId) aynı primary key varsa yeni UUID ver, kök kimliği koru
            if(isPersistentId) {
              const otherAuditOwner = await tx.integratedFinding.findUnique({
                where: { id: candidateId },
                select: { auditId: true, rootFindingId: true }
              });
              if (otherAuditOwner && otherAuditOwner.auditId !== auditId) {
                finding.rootFindingId = finding.rootFindingId || otherAuditOwner.rootFindingId || candidateId;
                finding.isCarryover = true;
                candidateId = crypto.randomUUID();
              }
            }

        resolvedFindings.push({
              ...finding,
      _resolvedId: candidateId,
        });
  }

      const keepFindingIds = resolvedFindings.map((f: any) => f._resolvedId);

  // Delete ONLY findings that were removed from this audit
  await tx.integratedFinding.deleteMany({
    where: {
      auditId,
      ...(keepFindingIds.length > 0 ? { id: { notIn: keepFindingIds } } : {}),
    },
  });

  // Upsert each finding preserving its exact UUID & rootFindingId
  for (const finding of resolvedFindings) {
    const findingId = finding._resolvedId;
    const isClosed = (finding.status || 'Yeni Tespit Edilen') === 'Tamamlanan';
    const stepMaxProg = Array.isArray(finding.steps)
      ? finding.steps.reduce((m: number, s: any) => Math.max(m, Number(s?.progress) || 0), 0)
      : 0;
    const computedProgress = isClosed
      ? 100
      : Math.min(99, Math.max(Number(finding.progress) || 0, stepMaxProg));

    const findingPayload = {
      rootFindingId: finding.rootFindingId || findingId,
      originReportNo: finding.originReportNo || meta.reportNo || null,
      originReportDate: finding.originReportDate
        ? new Date(finding.originReportDate)
        : meta.reportDate
          ? new Date(meta.reportDate)
          : new Date(),
      isCarryover: Boolean(
        finding.isCarryover ||
        (typeof finding.history === 'string' && finding.history.includes('Devreden Bulgu'))
      ),
      progress: computedProgress,
      closedInReportNo: isClosed ? (finding.closedInReportNo || meta.reportNo || null) : null,
      closedAt: isClosed
        ? finding.closedAt
          ? new Date(finding.closedAt)
          : new Date()
        : null,
      no: finding.no,
      area: finding.area || '',
      subarea: finding.subarea || null,
      category: finding.category || '',
      subcategory: finding.subcategory || null,
      risk: finding.risk || 'Önemli',
      targetDate: finding.targetDate ? new Date(finding.targetDate) : null,
      isStarted: Boolean(finding.isStarted || computedProgress > 0 || (finding.steps && finding.steps.length > 0)),
      residualRisk: finding.residualRisk || null,
      riskReasoning: finding.riskReasoning || null,
      findingDesc: finding.findingDesc || '',
      riskDesc: finding.riskDesc || '',
      recommendation: finding.recommendation || '',
      status: finding.status || 'Yeni Tespit Edilen',
      history: finding.history || null,
      departments: finding.departments || [],
    };

    const existingFinding = await tx.integratedFinding.findFirst({
      where: { id: findingId, auditId },
      select: { id: true },
    });

    if (existingFinding) {
      await tx.integratedFinding.update({
        where: { id: findingId },
        data: findingPayload,
      });
      // Replace finding-level files cleanly
      await tx.integratedFile.deleteMany({ where: { findingId } });
    } else {
      await tx.integratedFinding.create({
        data: {
          id: findingId,
          auditId,
          ...findingPayload,
        },
      });
    }

    // Finding Files
    if (finding.files && finding.files.length > 0) {
      await tx.integratedFile.createMany({
        data: finding.files.map((f: any) => ({
          findingId,
          name: f.name || 'dosya',
          url: f.url,
          type: f.type || 'unknown',
        })),
      });
    }

    // 3. Sync Actions (preserve persistent action UUIDs too)
    const incomingSteps = Array.isArray(finding.steps) ? finding.steps : [];
      const resolvedSteps: any[] = [];
      for (const step of incomingSteps) {
        const rawStepId = typeof step.id === 'string' ? step.id.trim() : '';
        const isPersistentStepId = Boolean(rawStepId) && !rawStepId.startsWith('step_');
          let candidateStepId = isPersistentStepId ? rawStepId : crypto.randomUUID();

          if(isPersistentStepId) {
            const otherStepOwner = await tx.integratedAction.findUnique({
              where: { id: candidateStepId },
              select: { findingId: true }
            });
            if (otherStepOwner && otherStepOwner.findingId !== findingId) {
              candidateStepId = crypto.randomUUID();
            }
          }

          resolvedSteps.push({
            ...step,
    _resolvedStepId: candidateStepId,
          });
        }
const keepStepIds = resolvedSteps.map((s: any) => s._resolvedStepId);

await tx.integratedAction.deleteMany({
  where: {
    findingId,
    ...(keepStepIds.length > 0 ? { id: { notIn: keepStepIds } } : {}),
  },
});

  for (let sIdx = 0; sIdx < resolvedSteps.length; sIdx++) {
    const step = resolvedSteps[sIdx];
    const actionId = step._resolvedStepId;
    const existingAction = await tx.integratedAction.findFirst({
      where: { id: actionId, findingId },
      select: { id: true, performedBy: true, performedByName: true, performedByTitle: true, sourceHistoryId: true },
    });

    // sourceHistoryId yalnızca başka bir satırda kullanılmıyorsa korunsun (devreden kopyalarda çakışmayı önler)
    let safeSourceHistoryId: string | null = existingAction?.sourceHistoryId || step.sourceHistoryId || null;
    if (safeSourceHistoryId && !existingAction) {
      const alreadyLinked = await tx.integratedAction.findUnique({
        where: { sourceHistoryId: safeSourceHistoryId },
        select: { id: true }
      });
      if (alreadyLinked) safeSourceHistoryId = null;
    }

    const actionPayload = {
      department: step.department || 'İlgili Birim',
      order: step.order || sIdx + 1,
      status: step.status || 'Devam Ediyor',
      actionDate: step.actionDate ? new Date(step.actionDate) : new Date(),
      title: step.title || null,
      explanation: step.explanation || null,
      completedAt:
        step.completedAt
          ? new Date(step.completedAt)
          : step.status === 'Tamamlandı'
            ? new Date(step.actionDate || Date.now())
            : null,
      stepType: step.stepType || null,
      progress: step.progress !== undefined && step.progress !== null ? Number(step.progress) : null,
      progressAdded: step.progressAdded !== undefined && step.progressAdded !== null ? Number(step.progressAdded) : null,
      performedBy: step.performedBy || existingAction?.performedBy || actorRecord?.username || req.user?.username || null,
      performedByName:
        step.performedByName ||
        existingAction?.performedByName ||
        actorRecord?.fullName ||
        req.user?.fullName ||
        req.user?.username ||
        null,
      performedByTitle:
        step.performedByTitle ||
        existingAction?.performedByTitle ||
        actorRecord?.title ||
        null,
      ...(safeSourceHistoryId ? { sourceHistoryId: safeSourceHistoryId } : {}),
    };

    if (existingAction) {
      await tx.integratedAction.update({
        where: { id: actionId },
        data: actionPayload,
      });
      await tx.integratedFile.deleteMany({ where: { actionId } });
    } else {
      await tx.integratedAction.create({
        data: {
          id: actionId,
          findingId,
          ...actionPayload,
        },
      });
    }

    if (step.files && step.files.length > 0) {
      await tx.integratedFile.createMany({
        data: step.files.map((f: any) => ({
          actionId,
          name: f.name || 'dosya',
          url: f.url,
          type: f.type || 'unknown',
        })),
      });
    }
  }
}

// Fetch the full constructed audit
const completeAudit = await tx.integratedAudit.findUnique({
  where: { id: auditId },
  include: {

    findings: {
      include: {
        actions: { include: { files: true }, orderBy: { order: 'asc' } },
        files: true
      }
    }
  }
});
return completeAudit;
    });

if ((status || 'DRAFT') === 'PUBLISHED' && result?.id) {
  await syncPublishedAuditToImprovements(result.id, req.user?.username);
}

res.status(200).json(result);
  } catch (err) {
  console.error('Save Audit Error:', err);
  res.status(500).json({ error: 'Rapor kaydedilemedi.' });
}
});

// ============================================================================
// DENETİM HAVUZU (IRSC STANDART BULGU ŞABLON KÜTÜPHANESİ)
// ============================================================================

const TR_STOP_WORDS = new Set([
  've', 'ile', 'bir', 'bu', 'da', 'de', 'için', 'olarak', 'olan', 'olup',
  'veya', 'gibi', 'daha', 'çok', 'her', 'var', 'yok', 'içinde', 'üzerinde',
  'kat', 'bina', 'oda', 'alan', 'mahal', 'tesis', 'hastane', 'bulunmaktadır',
  'bulunmamaktadır', 'tespit', 'edilmiştir', 'gerekmektedir', 'yapılmalıdır'
]);

function tokenizeTurkish(text: string): Set<string> {
  const clean = String(text || '')
    .toLocaleLowerCase('tr-TR')
    .replace(/[^a-zçğıöşü0-9\s]/g, ' ')
    .split(/\s+/)
    .map((w) => w.trim())
    .filter((w) => w.length >= 3 && !TR_STOP_WORDS.has(w));
  return new Set(clean);
}

function computeSimilarity(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let overlap = 0;
  a.forEach((word) => {
    if (b.has(word)) overlap++;
  });
  const union = new Set([...a, ...b]).size;
  return union > 0 ? Math.round((overlap / union) * 100) : 0;
}

const isIrscManager = (req: AuthRequest): boolean => !!(
  req.user?.isAdmin ||
  req.user?.isManagement ||
  req.user?.roles?.includes('admin') ||
  req.user?.roles?.includes('management') ||
  req.user?.roles?.includes('safety')
);

// 1. Havuz şablonlarını listele
router.get('/pool', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { q, category, risk, tag, includeInactive } = req.query as Record<string, string>;
    const where: any = {};
    if (includeInactive !== 'true') {
      where.isActive = true;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (risk && risk !== 'ALL') {
      where.defaultRisk = risk;
    }
    if (tag && tag !== 'ALL') {
      where.tags = { has: tag };
    }
    if (q && q.trim()) {
      const term = q.trim();
      where.OR = [
        { title: { contains: term, mode: 'insensitive' } },
        { code: { contains: term, mode: 'insensitive' } },
        { findingDesc: { contains: term, mode: 'insensitive' } },
        { riskDesc: { contains: term, mode: 'insensitive' } },
        { recommendation: { contains: term, mode: 'insensitive' } },
        { category: { contains: term, mode: 'insensitive' } },
        { legislationRef: { contains: term, mode: 'insensitive' } },
        { tags: { has: term } },
      ];
    }

    const templates = await prisma.irscFindingTemplate.findMany({
      where,
      orderBy: [{ usageCount: 'desc' }, { updatedAt: 'desc' }],
    });
    res.json(templates);
  } catch (err) {
    console.error('Fetch Pool Error:', err);
    res.status(500).json({ error: 'Denetim havuzu yüklenemedi.' });
  }
});

// 2. Benzerlik kontrolü (Çöp/mükerrer kayıt önleyici)
router.post('/pool/check-similar', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { title = '', findingDesc = '', category = '' } = req.body || {};
    const inputTokens = tokenizeTurkish(`${title} ${findingDesc}`);
    if (inputTokens.size === 0) {
      return res.json([]);
    }

    const activeTemplates = await prisma.irscFindingTemplate.findMany({
      where: { isActive: true },
    });

    const scored = activeTemplates
      .map((tpl) => {
        const tplTokens = tokenizeTurkish(`${tpl.title} ${tpl.findingDesc} ${(tpl.tags || []).join(' ')}`);
        let score = computeSimilarity(inputTokens, tplTokens);
        if (category && tpl.category && category === tpl.category && score > 0) {
          score = Math.min(100, score + 10);
        }
        return { template: tpl, similarity: score };
      })
      .filter((item) => item.similarity >= 25)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, 3);

    res.json(scored);
  } catch (err) {
    console.error('Check Similar Pool Error:', err);
    res.status(500).json({ error: 'Benzerlik kontrolü yapılamadı.' });
  }
});

// 3. Yeni şablon ekle
router.post('/pool', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isIrscManager(req)) {
      return res.status(403).json({ error: 'Denetim havuzuna yalnızca yetkililer şablon ekleyebilir.' });
    }
    const {
      code,
      title,
      mainCategory,
      category,
      subcategory,
      tags = [],
      findingDesc,
      riskDesc,
      recommendation,
      defaultRisk = 'Önemli',
      defaultDepartments = [],
      legislationRef,
    } = req.body || {};

    if (!title?.trim() || !findingDesc?.trim()) {
      return res.status(400).json({ error: 'Şablon başlığı ve standart tespit metni zorunludur.' });
    }

    const cleanTags = Array.from(
      new Set(
        (Array.isArray(tags) ? tags : String(tags || '').split(','))
          .map((t: any) => String(t || '').replace(/^#/, '').trim())
          .filter(Boolean)
      )
    );

    let finalCode = code?.trim() || null;
    if (!finalCode) {
      const total = await prisma.irscFindingTemplate.count();
      finalCode = `HVZ-${String(total + 1).padStart(3, '0')}`;
    }

    const created = await prisma.irscFindingTemplate.create({
      data: {
        code: finalCode,
        title: title.trim(),
        mainCategory: mainCategory?.trim() || null,
        category: category?.trim() || null,
        subcategory: subcategory?.trim() || null,
        tags: cleanTags,
        findingDesc: findingDesc.trim(),
        riskDesc: riskDesc?.trim() || null,
        recommendation: recommendation?.trim() || null,
        defaultRisk: defaultRisk || 'Önemli',
        defaultDepartments: Array.isArray(defaultDepartments) ? defaultDepartments : [],
        legislationRef: legislationRef?.trim() || null,
        createdBy: req.user?.username || null,
        createdByName: req.user?.fullName || req.user?.username || null,
      },
    });

    res.status(201).json(created);
  } catch (err) {
    console.error('Create Pool Template Error:', err);
    res.status(500).json({ error: 'Şablon kaydedilemedi.' });
  }
});

// 4. Şablonu güncelle
router.put('/pool/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isIrscManager(req)) {
      return res.status(403).json({ error: 'Şablon düzenleme yetkiniz yok.' });
    }
    const { id } = req.params;
    const {
      code,
      title,
      mainCategory,
      category,
      subcategory,
      tags,
      findingDesc,
      riskDesc,
      recommendation,
      defaultRisk,
      defaultDepartments,
      legislationRef,
      isActive,
    } = req.body || {};

    const updateData: any = {};
    if (code !== undefined) updateData.code = code?.trim() || null;
    if (title !== undefined) updateData.title = String(title).trim();
    if (mainCategory !== undefined) updateData.mainCategory = mainCategory?.trim() || null;
    if (category !== undefined) updateData.category = category?.trim() || null;
    if (subcategory !== undefined) updateData.subcategory = subcategory?.trim() || null;
    if (tags !== undefined) {
      updateData.tags = Array.from(
        new Set(
          (Array.isArray(tags) ? tags : String(tags || '').split(','))
            .map((t: any) => String(t || '').replace(/^#/, '').trim())
            .filter(Boolean)
        )
      );
    }
    if (findingDesc !== undefined) updateData.findingDesc = String(findingDesc).trim();
    if (riskDesc !== undefined) updateData.riskDesc = riskDesc?.trim() || null;
    if (recommendation !== undefined) updateData.recommendation = recommendation?.trim() || null;
    if (defaultRisk !== undefined) updateData.defaultRisk = defaultRisk;
    if (Array.isArray(defaultDepartments)) updateData.defaultDepartments = defaultDepartments;
    if (legislationRef !== undefined) updateData.legislationRef = legislationRef?.trim() || null;
    if (isActive !== undefined) updateData.isActive = Boolean(isActive);

    const updated = await prisma.irscFindingTemplate.update({
      where: { id },
      data: updateData,
    });
    res.json(updated);
  } catch (err) {
    console.error('Update Pool Template Error:', err);
    res.status(500).json({ error: 'Şablon güncellenemedi.' });
  }
});

// 5. Şablon kullanım sayacını artır
router.post('/pool/:id/use', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const updated = await prisma.irscFindingTemplate.update({
      where: { id: req.params.id },
      data: { usageCount: { increment: 1 } },
    });
    res.json(updated);
  } catch (err) {
    console.error('Increment Pool Usage Error:', err);
    res.status(500).json({ error: 'Kullanım sayacı güncellenemedi.' });
  }
});

// 6. Benzer şablonları tek şablonda birleştir (Merge)
router.post('/pool/merge', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isIrscManager(req)) {
      return res.status(403).json({ error: 'Birleştirme yetkiniz yok.' });
    }
    const { targetId, sourceIds } = req.body as { targetId?: string; sourceIds?: string[] };
    if (!targetId || !Array.isArray(sourceIds) || sourceIds.length === 0) {
      return res.status(400).json({ error: 'Hedef şablon ve en az bir kaynak şablon seçilmelidir.' });
    }

    const cleanSourceIds = sourceIds.filter((sid) => sid && sid !== targetId);
    if (cleanSourceIds.length === 0) {
      return res.status(400).json({ error: 'Geçerli kaynak şablon bulunamadı.' });
    }

    const [target, sources] = await Promise.all([
      prisma.irscFindingTemplate.findUnique({ where: { id: targetId } }),
      prisma.irscFindingTemplate.findMany({ where: { id: { in: cleanSourceIds } } }),
    ]);

    if (!target) {
      return res.status(404).json({ error: 'Hedef şablon bulunamadı.' });
    }

    const addedUsage = sources.reduce((sum, s) => sum + (s.usageCount || 0), 0);
    const mergedTags = Array.from(
      new Set([...(target.tags || []), ...sources.flatMap((s) => s.tags || [])])
    );

    const updated = await prisma.$transaction(async (tx) => {
      const upd = await tx.irscFindingTemplate.update({
        where: { id: targetId },
        data: {
          usageCount: (target.usageCount || 0) + addedUsage,
          tags: mergedTags,
        },
      });
      await tx.irscFindingTemplate.deleteMany({
        where: { id: { in: cleanSourceIds } },
      });
      return upd;
    });

    res.json({ success: true, mergedCount: cleanSourceIds.length, target: updated });
  } catch (err) {
    console.error('Merge Pool Templates Error:', err);
    res.status(500).json({ error: 'Şablonlar birleştirilemedi.' });
  }
});

// 7. Şablon sil
router.delete('/pool/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    if (!isIrscManager(req)) {
      return res.status(403).json({ error: 'Şablon silme yetkiniz yok.' });
    }
    await prisma.irscFindingTemplate.delete({ where: { id: req.params.id } });
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Pool Template Error:', err);
    res.status(500).json({ error: 'Şablon silinemedi.' });
  }
});

// Delete a report
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const existing = await prisma.integratedAudit.findUnique({
      where: { id: req.params.id },
      select: { id: true, status: true, reportNo: true }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Rapor bulunamadı.' });
    }

    const isAdminOrMgmt = !!(
      req.user?.isAdmin ||
      req.user?.isManagement ||
      req.user?.roles?.includes('admin') ||
      req.user?.roles?.includes('management')
    );

    if (existing.status === 'PUBLISHED') {
      if (!isAdminOrMgmt) {
        return res.status(403).json({ error: 'Yayınlanmış raporları yalnızca yöneticiler silebilir.' });
      }
      const confirmUsername = String(req.query.confirmUsername || req.body?.confirmUsername || '').trim().toLowerCase();
      const actualUsername = String(req.user?.username || '').trim().toLowerCase();
      if (!actualUsername || confirmUsername !== actualUsername) {
        return res.status(400).json({ error: 'Silme işlemini onaylamak için kullanıcı adınızı doğru girmelisiniz.' });
      }
    } else if (!isIrscManager(req)) {
      return res.status(403).json({ error: 'Bu raporu silme yetkiniz yok.' });
    }

    await prisma.integratedAudit.delete({
      where: { id: req.params.id }
    });

    console.log(`[RenovationReport] Rapor silindi: ${existing.reportNo || existing.id} (status=${existing.status}) - silen: ${req.user?.username}`);
    res.json({ success: true });
  } catch (err) {
    console.error('Delete Report Error:', err);
    res.status(500).json({ error: 'Rapor silinemedi.' });
  }
});

// Get Renovation Report Settings
router.get('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let settings = await prisma.renovationReportSetting.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.renovationReportSetting.create({
        data: {
          id: 'default',
          categories: [],
          departments: [],
          areas: [],
          criteria: []
        }
      });
    }

    res.json(settings);
  } catch (err) {
    console.error('Get Settings Error:', err);
    res.status(500).json({ error: 'Ayarlar alınamadı.' });
  }
});

// Update Renovation Report Settings
router.post('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { categories, departments, areas, criteria } = req.body;

    const settings = await prisma.renovationReportSetting.upsert({
      where: { id: 'default' },
      update: {
        categories: categories || [],
        departments: departments || [],
        areas: areas || [],
        criteria: criteria || []
      },
      create: {
        id: 'default',
        categories: categories || [],
        departments: departments || [],
        areas: areas || [],
        criteria: criteria || []
      }
    });

    res.json(settings);
  } catch (err) {
    console.error('Update Settings Error:', err);
    res.status(500).json({ error: 'Ayarlar kaydedilemedi.' });
  }
});

export default router;
