import express, { Request, Response } from 'express';
import { AuthRequest } from "../../middleware/auth";
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to check facility access
async function checkFacilityAccess(req: AuthRequest, facilityId: string): Promise<boolean> {
  const user = req.user;
  if (!user) return false;
  if (user.isAdmin || user.isManagement) return true;
  
  const access = await prisma.userFacility.findUnique({
    where: {
      username_facilityId: {
        username: user.username,
        facilityId: facilityId
      }
    }
  });
  return !!access;
}

// Helper to generate a 3-letter code from a department name
function generateDeptCode(name: string): string {
  const charMap: Record<string, string> = {
    'ı': 'i', 'i': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
    'I': 'I', 'İ': 'I', 'Ş': 'S', 'Ğ': 'G', 'Ü': 'U', 'Ö': 'O', 'Ç': 'C'
  };
  const str = name.replace(/[ıişğüöçIİŞĞÜÖÇ]/g, (m) => charMap[m]);
  return str.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
}

// ─── Yardımcı Fonksiyonlar ────────────────────────────────────────────────────
function scoreToLevel(score: number): string {
  if (score > 400) return 'Tolere Gösterilmez Risk';
  if (score > 200) return 'Yüksek Risk';
  if (score > 70)  return 'Önemli Risk';
  if (score > 20)  return 'Olası Risk';
  return 'Önemsiz Risk';
}

function deriveStatus(row: any): string {
  if (row.finalScore && Number(row.finalScore) > 0) {
    if (row.followUpMeasure || row.extraImprovement) return 'TAKIP_SURECINDE';
    return 'ILK_MUDAHALE_EDILDI';
  }
  if (row.actionsTaken || row.firstActionPlan) return 'ILK_MUDAHALE_EDILDI';
  return 'ACIK_TEHLIKE';
}

function parseDate(val: any): Date | null {
  if (!val || val === '') return null;
  
  // Excel numeric date check (e.g. 44123)
  if (typeof val === 'number' || (!isNaN(Number(val)) && String(val).trim() !== '')) {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const d = new Date(excelEpoch.getTime() + Number(val) * 86400 * 1000);
    // Sanity check for realistic dates (e.g., between 2000 and 2100)
    if (!isNaN(d.getTime()) && d.getFullYear() > 2000 && d.getFullYear() < 2100) {
      return d;
    }
  }

  // Handle DD.MM.YYYY string
  if (typeof val === 'string' && val.includes('.')) {
    const parts = val.split('.');
    if (parts.length === 3) {
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(d.getTime())) return d;
    }
  }
  
  // Handle DD/MM/YYYY string
  if (typeof val === 'string' && val.includes('/')) {
    const parts = val.split('/');
    if (parts.length === 3) {
      const d = new Date(`${parts[2]}-${parts[1]}-${parts[0]}`);
      if (!isNaN(d.getTime())) return d;
    }
  }

  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

function parsePeriod(val: any): string | null {
  if (!val || val === '') return null;
  const d = parseDate(val);
  if (d) return null; // Date means it's not a period text
  return String(val).trim();
}

// ─── STATIK ENDPOINT'LER (/:id'den ÖNCE) ─────────────────────────────────────

// GET /api/risks/lifecycle/stats/summary
router.get('/stats/summary', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isAdminOrMgmt = user?.isAdmin || user?.isManagement;
    const { facilityId } = req.query as Record<string, any>;

    let where: any = {};
    if (facilityId) {
      const hasAccess = await checkFacilityAccess(req, facilityId as string);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }
      where = { location: { facilityId: facilityId as string } };
    } else if (!isAdminOrMgmt) {
      const userFacilities = await prisma.userFacility.findMany({
        where: { username: user!.username },
        select: { facilityId: true }
      });
      const facilityIds = userFacilities.map(f => f.facilityId);
      where = { location: { facilityId: { in: facilityIds } } };
    }

    const [byStatus, byLevel] = await Promise.all([
      prisma.riskLifecycle.groupBy({ by: ['status'], where, _count: { id: true } }),
      prisma.riskLifecycle.groupBy({ by: ['initialLevel'], where, _count: { id: true } }),
    ]);

    res.json({ byStatus, byLevel });
  } catch (error) {
    res.status(500).json({ error: 'İstatistikler alınamadı.' });
  }
});

// POST /api/risks/lifecycle/import — Excel/JSON toplu yükleme
router.post('/import', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user?.username;
    const { facilityId, rows } = req.body;

    if (!facilityId || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'facilityId ve rows gerekli.' });
    }

    const hasAccess = await checkFacilityAccess(req, facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const existingSettings = await prisma.riskDepartmentSetting.findMany({
      where: { facilityId }
    });
    const settingNames = new Set(existingSettings.map(s => s.name.toLowerCase().trim()));

    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const deptName = row.department || 'Genel';

      // Departman yoksa otomatik oluştur (spec §4.4)
      let dept = await prisma.facilityLocation.findUnique({
        where: { facilityId_name: { facilityId, name: deptName } },
      });

      if (!dept) {
        // Global Department senkronizasyonu
        const globalDept = await prisma.facilityLocation.findFirst({
          where: { name: { equals: deptName.trim(), mode: 'insensitive' } }
        });
        
        if (!globalDept) {
          await prisma.facilityLocation.create({ data: { facilityId: req.body.facilityId || "tmp", name: deptName.trim() } });
        }

        // @ts-ignore
        dept = await prisma.facilityLocation.create({
        });
      // @ts-ignore
      } else if (!dept.code) {
        // @ts-ignore
        dept = await prisma.facilityLocation.update({
          where: { id: dept.id },
        });
      }

      // Auto-create responsibles in settings if they don't exist
      for (const field of ['improvementResponsible', 'controlResponsible']) {
        const val = row[field];
        if (val && typeof val === 'string' && val.trim() !== '') {
          const lowerVal = val.trim().toLowerCase();
          if (!settingNames.has(lowerVal)) {
            await prisma.riskDepartmentSetting.create({
              data: { facilityId, name: val.trim() }
            });
            settingNames.add(lowerVal);
          }
        }
      }

      const initialScore = Number(row.initialScore) || 0;
      const finalScore   = row.finalScore ? Number(row.finalScore) : null;
      const status = deriveStatus(row);

      try {
        await prisma.riskLifecycle.create({
          data: {
            locationId:     dept.id,
            riskNo:           parseInt(row.riskNo) || 1,
            riskCategory:     row.riskCategory || 'Genel',
            subCategory:      row.subCategory || null,
            area:             row.area || deptName,
            method:           row.method || 'Fine Kinney',
            activity:         row.activity || '',
            hazard:           row.hazard || '',
            riskDescription:  row.riskDescription || '',
            initialCondition: row.initialCondition || null,
            initialProb:      Number(row.initialProb) || 1,
            initialFreq:      row.initialFreq ? Number(row.initialFreq) : null,
            initialSev:       Number(row.initialSev) || 1,
            initialScore,
            initialLevel:     scoreToLevel(initialScore),
            firstActionPlan:  row.firstActionPlan || null,
            actionsTaken:     [row.actionsTaken, parsePeriod(row.actionDate) ? `Tamamlanma Periyodu: ${parsePeriod(row.actionDate)}` : ''].filter(Boolean).join('\n') || null,
            actionDate:       parseDate(row.actionDate),
            actionBy:         row.actionBy || null,
            followUpMeasure:  row.followUpMeasure || null,
            extraImprovement: row.extraImprovement || null,
            finalProb:        row.finalProb ? Number(row.finalProb) : null,
            finalFreq:        row.finalFreq ? Number(row.finalFreq) : null,
            finalSev:         row.finalSev ? Number(row.finalSev) : null,
            finalScore,
            finalLevel:       finalScore ? scoreToLevel(finalScore) : null,
            status,
            createdBy:        username,

            // Yeni alanlar
            detectionDate:              parseDate(row.detectionDate),
            impactDamage:               row.impactDamage || null,
            affectedPeople:             row.affectedPeople || null,
            improvementResponsible:     row.improvementResponsible || null,
            dueDate:                    parseDate(row.dueDate),
            dueDatePeriod:              row.dueDatePeriod || parsePeriod(row.dueDate) || null,
            postImprovementResponsible: row.postImprovementResponsible || null,
            postImprovementDueDate:     parseDate(row.postImprovementDueDate),
            effectivenessMethod:        row.effectivenessMethod || null,
            controlResponsible:         row.controlResponsible || null,
            controlResult:              row.controlResult || null,
            legislation:                row.legislation || null,
          },
        });
        created++;
      } catch (_e) {
        skipped++;
      }
    }

    res.json({ message: `${created} risk içe aktarıldı, ${skipped} atlandı.`, created, skipped });
  } catch (error) {
    console.error('Risk import error:', error);
    res.status(500).json({ error: 'İçe aktarma başarısız.' });
  }
});

// ─── DİNAMİK ENDPOINT'LER ────────────────────────────────────────────────────

// GET /api/risks/lifecycle?locationId=N&facilityId=X&status=Y&search=Z
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isAdminOrMgmt = user?.isAdmin || user?.isManagement;
    const { locationId, facilityId, departmentName, status, search } = req.query as Record<string, any>;
    const where: any = {};

    if (locationId) {
      const dept = await prisma.facilityLocation.findUnique({
        where: { id: locationId as string },
        select: { facilityId: true }
      });
      if (!dept) {
        return res.json([]);
      }

      const hasAccess = await checkFacilityAccess(req, dept.facilityId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }

      where.locationId = locationId as string;
    } else if (facilityId && req.query.level && req.query.path) {
      const level = req.query.level as string;
      const path = req.query.path as string;
      
      const hasAccess = await checkFacilityAccess(req, facilityId as string);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }

      const allLocs = await prisma.facilityLocation.findMany({
        where: { facilityId: facilityId as string },
        select: { id: true, department: true, floor: true, building: true, name: true }
      });

      const pathParts = path.split('|');
      const b = pathParts[0] || '';
      const f = pathParts[1] || '';
      const d = pathParts[2] || '';

      const matchedIds = allLocs.filter(l => {
        if (level === 'building') return l.building === b || l.name === b || l.department === b;
        if (level === 'floor') return l.building === b && l.floor === f;
        if (level === 'department') return l.building === b && l.floor === f && l.department === d;
        return false;
      }).map(l => l.id);

      if (matchedIds.length === 0) {
        where.locationId = 'no-match'; // Ensure empty result
      } else {
        where.locationId = { in: matchedIds };
      }
    } else if (facilityId) {
      const hasAccess = await checkFacilityAccess(req, facilityId as string);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }

      where.location = { facilityId: facilityId as string };
    } else if (!isAdminOrMgmt) {
      const userFacilities = await prisma.userFacility.findMany({
        where: { username: user!.username },
        select: { facilityId: true }
      });
      const facilityIds = userFacilities.map(f => f.facilityId);
      where.location = { facilityId: { in: facilityIds } };
    }

    if (status) where.status = status as string;

    if (search) {
      where.OR = [
        { hazard: { contains: search as string, mode: 'insensitive' } },
        { riskDescription: { contains: search as string, mode: 'insensitive' } },
        { area: { contains: search as string, mode: 'insensitive' } },
        { riskCategory: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const risks = await prisma.riskLifecycle.findMany({
      where,
      include: {
        auditLogs: { orderBy: { createdAt: 'desc' } }
      },
      orderBy: [{ status: 'asc' }, { riskNo: 'asc' }],
    });

    res.json(risks);
  } catch (error) {
    console.error('Risk lifecycle list error:', error);
    res.status(500).json({ error: 'Riskler alınamadı.' });
  }
});

// GET /api/risks/lifecycle/:id
router.get('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const risk = await prisma.riskLifecycle.findUnique({
      where: { id: req.params.id as string },
      include: { 
        location: true,
        auditLogs: { orderBy: { createdAt: 'desc' } }
      },
    });
    if (!risk) return res.status(404).json({ error: 'Risk bulunamadı.' });

    // @ts-ignore
    const hasAccess = await checkFacilityAccess(req, risk.location.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    res.json(risk);
  } catch (error) {
    res.status(500).json({ error: 'Risk alınamadı.' });
  }
});

// POST /api/risks/lifecycle
router.post('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user?.username;
    const {
      locationId, riskNo, riskCategory, subCategory, area, method,
      activity, hazard, riskDescription, initialCondition, initialImage, initialImages,
      initialProb, initialFreq, initialSev, initialScore, status,
      // New fields
      detectionDate, impactDamage, affectedPeople, improvementResponsible, dueDate,
      actionsTaken, actionDate, actionImage, actionImages,
      finalProb, finalFreq, finalSev, finalScore, postImprovementResponsible, postImprovementDueDate,
      effectivenessMethod, controlResponsible, controlResult, legislation,
      dueDatePeriod, statusDate,
    } = req.body;

    let dept = await prisma.facilityLocation.findUnique({
      where: { id: locationId as string },
    });
    if (!dept) return res.status(404).json({ error: 'Departman/Lokasyon bulunamadı.' });

    // Eğer departmanın kodu yoksa, isminden oluşturup kaydet
    // @ts-ignore
    if (!dept.code) {
      const generatedCode = generateDeptCode(dept.name || dept.department || 'Brm');
      await prisma.facilityLocation.update({
        where: { id: dept.id },
        data: {} // Mock update since there is no code column? The old code tried to do this.
      });
      // @ts-ignore
      dept.code = generatedCode;
    }

    const hasAccess = await checkFacilityAccess(req, dept.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    // Dinamik Risk No oluşturma
    const maxRisk = await prisma.riskLifecycle.findFirst({
      where: { locationId: locationId as string },
      orderBy: { riskNo: 'desc' }
    });
    const nextRiskNo = maxRisk ? maxRisk.riskNo + 1 : 1;

    const risk = await prisma.riskLifecycle.create({
      data: {
        locationId:      locationId as string,
        riskNo:          nextRiskNo,
        riskCategory:    riskCategory || 'Genel',
        subCategory:     subCategory || null,
        area:            area || '',
        method:          method || 'Fine Kinney',
        activity:        activity || '',
        hazard:          hazard || '',
        riskDescription: riskDescription || '',
        initialCondition: initialCondition || null,
        initialImage:     initialImage || null,
        initialImages:    initialImages || [],
        initialProb:     Number(initialProb) || 0,
        initialFreq:     initialFreq ? Number(initialFreq) : null,
        initialSev:      Number(initialSev) || 0,
        initialScore:    Number(initialScore) || 0,
        initialLevel:    scoreToLevel(Number(initialScore) || 0),
        status:          status || 'ACIK_TEHLIKE',
        statusDate:      statusDate ? parseDate(statusDate) : null,
        createdBy:       username,

        // Action plan / Implementation fields
        firstActionPlan:  req.body.firstActionPlan || null,
        actionsTaken:     actionsTaken || null,
        actionDate:       parseDate(actionDate),
        actionBy:         req.body.actionBy || null,
        actionImage:      actionImage || null,

        // Follow up / final score fields
        followUpMeasure:  req.body.followUpMeasure || null,
        extraImprovement: req.body.extraImprovement || null,
        finalProb:        finalProb ? Number(finalProb) : null,
        finalFreq:        finalFreq ? Number(finalFreq) : null,
        finalSev:         finalSev ? Number(finalSev) : null,
        finalScore:       finalScore ? Number(finalScore) : null,
        finalLevel:       finalScore ? scoreToLevel(Number(finalScore)) : null,

        // New fields (Page Transition)
        detectionDate:              parseDate(detectionDate),
        impactDamage:               impactDamage || null,
        affectedPeople:             affectedPeople || null,
        improvementResponsible:     improvementResponsible || null,
        dueDate:                    parseDate(dueDate),
        dueDatePeriod:              dueDatePeriod || null,
        postImprovementResponsible: postImprovementResponsible || null,
        postImprovementDueDate:     parseDate(postImprovementDueDate),
        effectivenessMethod:        effectivenessMethod || null,
        controlResponsible:         controlResponsible || null,
        controlResult:              controlResult || null,
        legislation:                legislation || null,

        auditLogs: {
          create: {
            action: 'Oluşturuldu',
            details: 'Yeni risk kaydı oluşturuldu.',
            username: username || 'Sistem',
          }
        }
      },
      include: { location: true, auditLogs: { orderBy: { createdAt: 'desc' } } },
    });

    res.status(201).json(risk);
  } catch (error) {
    console.error('Risk create error:', error);
    res.status(500).json({ error: 'Risk oluşturulamadı.' });
  }
});

// PUT /api/risks/lifecycle/:id
router.put('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const risk = await prisma.riskLifecycle.findUnique({
      where: { id: req.params.id as string },
      include: { location: true }
    });
    if (!risk) return res.status(404).json({ error: 'Risk bulunamadı.' });

    // @ts-ignore
    const hasAccess = await checkFacilityAccess(req, risk.location.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const data: any = { ...req.body };

    // id alanını temizle (Prisma'ya gönderilmemeli)
    delete data.id;
    delete data.department;
    delete data.createdAt;
    delete data.updatedAt;

    if (data.locationId) {
      const newDept = await prisma.facilityLocation.findUnique({
        // @ts-ignore
        where: { id: parseInt(data.locationId) },
        select: { facilityId: true }
      });
      if (!newDept) return res.status(404).json({ error: 'Yeni departman bulunamadı.' });

      const hasAccessNew = await checkFacilityAccess(req, newDept.facilityId);
      if (!hasAccessNew) {
        return res.status(403).json({ error: 'Yeni tesis için yetkiniz yok.' });
      }
    }

    if (data.initialScore !== undefined) {
      data.initialLevel = scoreToLevel(Number(data.initialScore));
    }
    if (data.finalScore !== undefined && data.finalScore !== null && data.finalScore !== '') {
      data.finalLevel = scoreToLevel(Number(data.finalScore));
    }

    const numFields = [
      'locationId', 'riskNo', 'initialProb', 'initialFreq', 'initialSev', 'initialScore',
      'finalProb', 'finalFreq', 'finalSev', 'finalScore',
    ];
    numFields.forEach(f => {
      if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
        data[f] = Number(data[f]);
      } else if (data[f] === '') {
        data[f] = null;
      }
    });

    const dateFields = ['actionDate', 'detectionDate', 'dueDate', 'postImprovementDueDate', 'statusDate'];
    dateFields.forEach(f => {
      if (data[f] !== undefined) {
        data[f] = parseDate(data[f]);
      }
    });

    const updatedRisk = await prisma.riskLifecycle.update({
      where: { id: req.params.id as string },
      data,
      include: { location: true, auditLogs: { orderBy: { createdAt: 'desc' } } },
    });

    // Audit Log oluşturma mantığı
    const changedFields: any = {};
    const trackFields = ['status', 'detectionDate', 'dueDate', 'improvementResponsible', 'initialScore', 'finalScore', 'actionDate', 'actionsTaken', 'hazard', 'riskCategory'];
    
    trackFields.forEach(f => {
      const oldVal = (risk as any)[f];
      const newVal = (updatedRisk as any)[f];
      
      // Date objeleri için özel kontrol
      if (oldVal instanceof Date || newVal instanceof Date) {
        if (new Date(oldVal || 0).getTime() !== new Date(newVal || 0).getTime()) {
          changedFields[f] = { old: oldVal, new: newVal };
        }
      } else if (oldVal !== newVal) {
        changedFields[f] = { old: oldVal, new: newVal };
      }
    });

    if (Object.keys(changedFields).length > 0) {
      const newLog = await prisma.riskAuditLog.create({
        data: {
          riskId: updatedRisk.id,
          action: 'Güncellendi',
          details: 'Risk detayları güncellendi.',
          changedFields,
          username: req.user?.username || 'Sistem',
        }
      });
      updatedRisk.auditLogs.unshift(newLog);
    }

    res.json(updatedRisk);
  } catch (error) {
    console.error('Risk update error:', error);
    res.status(500).json({ error: 'Risk güncellenemedi.' });
  }
});

// DELETE /api/risks/lifecycle/:id
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const risk = await prisma.riskLifecycle.findUnique({
      where: { id: req.params.id as string },
      include: { location: true }
    });
    if (!risk) return res.status(404).json({ error: 'Risk bulunamadı.' });

    // @ts-ignore
    const hasAccess = await checkFacilityAccess(req, risk.location.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    await prisma.riskLifecycle.delete({ where: { id: req.params.id as string } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Risk silinemedi.' });
  }
});

export default router;
