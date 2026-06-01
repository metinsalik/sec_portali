import express, { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// Helper to check facility access
async function checkFacilityAccess(req: Request, facilityId: string): Promise<boolean> {
  // @ts-ignore
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
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : d;
}

// ─── STATIK ENDPOINT'LER (/:id'den ÖNCE) ─────────────────────────────────────

// GET /api/risks/lifecycle/stats/summary
router.get('/stats/summary', authMiddleware, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const isAdminOrMgmt = user?.isAdmin || user?.isManagement;
    const { facilityId } = req.query;

    let where: any = {};
    if (facilityId) {
      const hasAccess = await checkFacilityAccess(req, facilityId as string);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }
      where = { department: { facilityId: facilityId as string } };
    } else if (!isAdminOrMgmt) {
      const userFacilities = await prisma.userFacility.findMany({
        where: { username: user.username },
        select: { facilityId: true }
      });
      const facilityIds = userFacilities.map(f => f.facilityId);
      where = { department: { facilityId: { in: facilityIds } } };
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
router.post('/import', authMiddleware, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const username = req.user?.username;
    const { facilityId, rows } = req.body;

    if (!facilityId || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ error: 'facilityId ve rows gerekli.' });
    }

    const hasAccess = await checkFacilityAccess(req, facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }



    let created = 0;
    let skipped = 0;

    for (const row of rows) {
      const deptName = row.department || 'Genel';

      // Departman yoksa otomatik oluştur (spec §4.4)
      let dept = await prisma.riskDepartment.findUnique({
        where: { facilityId_name: { facilityId, name: deptName } },
      });

      if (!dept) {
        dept = await prisma.riskDepartment.create({
          data: { facilityId, name: deptName },
        });
      }

      const initialScore = Number(row.initialScore) || 0;
      const finalScore   = row.finalScore ? Number(row.finalScore) : null;
      const status = deriveStatus(row);

      try {
        await prisma.riskLifecycle.create({
          data: {
            departmentId:     dept.id,
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
            actionsTaken:     row.actionsTaken || null,
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

// GET /api/risks/lifecycle?departmentId=N&facilityId=X&status=Y&search=Z
router.get('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const user = req.user;
    const isAdminOrMgmt = user?.isAdmin || user?.isManagement;
    const { departmentId, facilityId, status, search } = req.query;
    const where: any = {};

    if (departmentId) {
      const dept = await prisma.riskDepartment.findUnique({
        where: { id: parseInt(departmentId as string) },
        select: { facilityId: true }
      });
      if (!dept) return res.status(404).json({ error: 'Departman bulunamadı.' });

      const hasAccess = await checkFacilityAccess(req, dept.facilityId);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }

      where.departmentId = parseInt(departmentId as string);
    } else if (facilityId) {
      const hasAccess = await checkFacilityAccess(req, facilityId as string);
      if (!hasAccess) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }

      where.department = { facilityId: facilityId as string };
    } else if (!isAdminOrMgmt) {
      const userFacilities = await prisma.userFacility.findMany({
        where: { username: user.username },
        select: { facilityId: true }
      });
      const facilityIds = userFacilities.map(f => f.facilityId);
      where.department = { facilityId: { in: facilityIds } };
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
        department: { select: { id: true, name: true, facilityId: true, code: true } },
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
router.get('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const risk = await prisma.riskLifecycle.findUnique({
      where: { id: req.params.id as string },
      include: { 
        department: true,
        auditLogs: { orderBy: { createdAt: 'desc' } }
      },
    });
    if (!risk) return res.status(404).json({ error: 'Risk bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, risk.department.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    res.json(risk);
  } catch (error) {
    res.status(500).json({ error: 'Risk alınamadı.' });
  }
});

// POST /api/risks/lifecycle
router.post('/', authMiddleware, async (req: Request, res: Response) => {
  try {
    // @ts-ignore
    const username = req.user?.username;
    const {
      departmentId, riskNo, riskCategory, subCategory, area, method,
      activity, hazard, riskDescription, initialCondition, initialImage,
      initialProb, initialFreq, initialSev, initialScore, status,
      // New fields
      detectionDate, impactDamage, affectedPeople, improvementResponsible, dueDate,
      actionsTaken, actionDate, actionImage,
      finalProb, finalFreq, finalSev, finalScore, postImprovementResponsible, postImprovementDueDate,
      effectivenessMethod, controlResponsible, controlResult, legislation
    } = req.body;

    let dept = await prisma.riskDepartment.findUnique({
      where: { id: parseInt(departmentId) },
      select: { id: true, facilityId: true, name: true, code: true }
    });
    if (!dept) return res.status(404).json({ error: 'Departman bulunamadı.' });

    // Eğer departmanın kodu yoksa, isminden oluşturup kaydet
    if (!dept.code) {
      const generatedCode = dept.name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, '') || 'GEN';
      await prisma.riskDepartment.update({
        where: { id: dept.id },
        data: { code: generatedCode }
      });
    }

    const hasAccess = await checkFacilityAccess(req, dept.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    // Dinamik Risk No oluşturma
    const maxRisk = await prisma.riskLifecycle.findFirst({
      where: { departmentId: parseInt(departmentId) },
      orderBy: { riskNo: 'desc' }
    });
    const nextRiskNo = maxRisk ? maxRisk.riskNo + 1 : 1;

    const risk = await prisma.riskLifecycle.create({
      data: {
        departmentId:    parseInt(departmentId),
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
        initialProb:     Number(initialProb) || 0,
        initialFreq:     initialFreq ? Number(initialFreq) : null,
        initialSev:      Number(initialSev) || 0,
        initialScore:    Number(initialScore) || 0,
        initialLevel:    scoreToLevel(Number(initialScore) || 0),
        status:          status || 'ACIK_TEHLIKE',
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
      include: { department: true, auditLogs: { orderBy: { createdAt: 'desc' } } },
    });

    res.status(201).json(risk);
  } catch (error) {
    console.error('Risk create error:', error);
    res.status(500).json({ error: 'Risk oluşturulamadı.' });
  }
});

// PUT /api/risks/lifecycle/:id
router.put('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const risk = await prisma.riskLifecycle.findUnique({
      where: { id: req.params.id as string },
      include: { department: true }
    });
    if (!risk) return res.status(404).json({ error: 'Risk bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, risk.department.facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const data: any = { ...req.body };

    // id alanını temizle (Prisma'ya gönderilmemeli)
    delete data.id;
    delete data.department;
    delete data.createdAt;
    delete data.updatedAt;

    if (data.departmentId) {
      const newDept = await prisma.riskDepartment.findUnique({
        where: { id: parseInt(data.departmentId) },
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
      'departmentId', 'riskNo', 'initialProb', 'initialFreq', 'initialSev', 'initialScore',
      'finalProb', 'finalFreq', 'finalSev', 'finalScore',
    ];
    numFields.forEach(f => {
      if (data[f] !== undefined && data[f] !== null && data[f] !== '') {
        data[f] = Number(data[f]);
      } else if (data[f] === '') {
        data[f] = null;
      }
    });

    const dateFields = ['actionDate', 'detectionDate', 'dueDate', 'postImprovementDueDate'];
    dateFields.forEach(f => {
      if (data[f] !== undefined) {
        data[f] = parseDate(data[f]);
      }
    });

    const updatedRisk = await prisma.riskLifecycle.update({
      where: { id: req.params.id as string },
      data,
      include: { department: true, auditLogs: { orderBy: { createdAt: 'desc' } } },
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
          // @ts-ignore
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
router.delete('/:id', authMiddleware, async (req: Request, res: Response) => {
  try {
    const risk = await prisma.riskLifecycle.findUnique({
      where: { id: req.params.id as string },
      include: { department: true }
    });
    if (!risk) return res.status(404).json({ error: 'Risk bulunamadı.' });

    const hasAccess = await checkFacilityAccess(req, risk.department.facilityId);
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
