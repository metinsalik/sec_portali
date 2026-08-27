import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../middleware/auth';
import { authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Setup Multer for image uploads
const uploadDir = path.join(__dirname, '../../uploads/integrated_audits');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `audit-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// Upload files for findings/actions (Option 1: Upload immediately)
router.post('/upload', authMiddleware, upload.array('files', 20), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const files = req.files as Express.Multer.File[];
    // Return array of objects with url, name, type matching the frontend
    const uploadedFiles = files.map(file => ({
      name: file.originalname,
      url: `/uploads/integrated_audits/${file.filename}`,
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
  const isManager = req.user?.isAdmin || req.user?.isManagement || req.user?.roles?.includes('admin') || req.user?.roles?.includes('management');

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
              include: { files: true }
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
        
        // Delete all existing relations so we can recreate them clean (team, findings, actions, files)
        // Cascade delete on findings will delete actions and finding files. Team is deleted separately.
        
        await tx.integratedFinding.deleteMany({ where: { auditId } });
      }



      // 2. Create Findings
      if (findings && findings.length > 0) {
        for (const finding of findings) {
          const createdFinding = await tx.integratedFinding.create({
            data: {
              auditId,
              no: finding.no,
              area: finding.area,
              subarea: finding.subarea || null,
              category: finding.category,
              subcategory: finding.subcategory || null,
              risk: finding.risk,
              targetDate: finding.targetDate ? new Date(finding.targetDate) : null,
              isStarted: finding.isStarted || false,
              residualRisk: finding.residualRisk || null,
              riskReasoning: finding.riskReasoning || null,
              findingDesc: finding.findingDesc || '',
              riskDesc: finding.riskDesc || '',
              recommendation: finding.recommendation || '',
              status: finding.status,
              history: finding.history || null,
              departments: finding.departments || [],
            }
          });

          // Finding Files
          if (finding.files && finding.files.length > 0) {
            await tx.integratedFile.createMany({
              data: finding.files.map((f: any) => ({
                findingId: createdFinding.id,
                name: f.name || 'dosya',
                url: f.url,
                type: f.type || 'unknown'
              }))
            });
          }

          // 3. Actions
          if (finding.steps && finding.steps.length > 0) {
            for (const step of finding.steps) {
              const createdAction = await tx.integratedAction.create({
                data: {
                  findingId: createdFinding.id,
                  department: step.department,
                  order: step.order || 1,
                  status: step.status,
                  actionDate: step.actionDate ? new Date(step.actionDate) : null,
                  title: step.title || null,
                  explanation: step.explanation || null,
                  completedAt: step.completedAt ? new Date(step.completedAt) : null,
                }
              });

              // Action Files
              if (step.files && step.files.length > 0) {
                await tx.integratedFile.createMany({
                  data: step.files.map((f: any) => ({
                    actionId: createdAction.id,
                    name: f.name || 'dosya',
                    url: f.url,
                    type: f.type || 'unknown'
                  }))
                });
              }
            }
          }
        }
      }

      // Fetch the full constructed audit
      const completeAudit = await tx.integratedAudit.findUnique({
        where: { id: auditId },
        include: {
          
          findings: {
            include: {
              actions: { include: { files: true } },
              files: true
            }
          }
        }
      });
      return completeAudit;
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Save Audit Error:', err);
    res.status(500).json({ error: 'Rapor kaydedilemedi.' });
  }
});

// Delete a report
router.delete('/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.integratedAudit.delete({
      where: { id: req.params.id }
    });
    res.json({ success: true });
  } catch (err) {
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
