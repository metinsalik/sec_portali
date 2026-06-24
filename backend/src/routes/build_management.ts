import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { calculateICRAClass, calculateRiskScoreAndLevel, checkProjectGate, createProject } from '../services/buildManagementService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

const uploadDir = path.join(__dirname, '../../uploads/build');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + ext);
  }
});
const upload = multer({ storage });


// Tüm router isteklerinde token doğrulaması yapıyoruz
router.use(authMiddleware);

// --- PROJELER ---

// Tüm projeleri getir
router.get('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.query.facilityId as string;
    // Eğer tesis ID bulamadıysa, tüm tesisleri getirebiliriz (admin ise vs.)
    const whereClause = facilityId ? { facilityId } : {};

    const projects = await prisma.buildProject.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        creator: { select: { fullName: true } },
        location: true,
        workType: true,
        contractor: true
      }
    });
    res.json(projects);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Projeler getirilirken bir hata oluştu' });
  }
});

// Proje oluştur
router.post('/projects', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, name, locationId, workTypeId, contractorId, buildType, riskGroup, plannedStartDate, plannedEndDate, projectManager, description } = req.body;
    
    if (!facilityId || !name || !workTypeId || !buildType || !riskGroup) {
      return res.status(400).json({ error: 'Eksik bilgi' });
    }

    const createdById = req.user?.username || '';
    
    const project = await createProject(req.body, createdById);

    // Başlangıç durumunda boş bir ICRA kaydı da oluşturalım
    await prisma.buildICRA.create({
      data: {
        projectId: project.id,
        calculatedClass: project.icraClass || 'Belirsiz',
        precautions: []
      }
    });

    res.status(201).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proje oluşturulurken bir hata oluştu' });
  }
});

// Proje detay getir
router.get('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const project = await prisma.buildProject.findUnique({
      where: { id: id as string },
      include: {
        creator: { select: { fullName: true } },
        location: true,
        workType: true,
        contractor: true,
        designForm: true,
        riskAssessment: true,
        icra: true,
        approvals: true,
        documents: true,
        permits: true,
        handover: true,
        inspectionsOHS: true,
        inspectionsInfection: true,
        handoverOHSInspections: true,
        handoverInfectionInspections: true,
        findings: { include: { actions: true } }
      }
    });

    if (!project) return res.status(404).json({ error: 'Proje bulunamadı' });

    // Gate Check yapıp duruma göre response a ekleyelim
    const gateCheck = await checkProjectGate(id as string);

    res.json({ ...project, gateCheck });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proje detayı getirilirken hata oluştu' });
  }
});

// Proje durumu güncelle
router.patch('/projects/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (status === 'Başlamaya Uygun') {
      const gateCheck = await checkProjectGate(id as string);
      if (!gateCheck.canStart) {
         // Durumu zorla "Başlatılamaz" yapalım eksik varsa
         await prisma.buildProject.update({ where: { id: id as string }, data: { status: 'Başlatılamaz' } });
         return res.status(400).json({ error: 'Kritik iş kuralları sağlanmadı. Eksik onay/evrak var.', gateCheck });
      }
    }

    if (status === 'Tamamlandı' || status === 'Teslim Edildi') {
       const gateCheck = await checkProjectGate(id as string);
       if (!gateCheck.canHandover) {
         return res.status(400).json({ error: 'Projenin kapanabilmesi için tüm bulguların kapatılması ve teslim evraklarının tamamlanması gerekir.', gateCheck });
       }
    }

    const project = await prisma.buildProject.update({
      where: { id: id as string },
      data: { status }
    });
    res.json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proje durumu güncellenirken hata oluştu' });
  }
});

// Projeyi sil
router.delete('/projects/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Projeyi sil (Cascade ile ilişkili tüm veriler silinir)
    await prisma.buildProject.delete({
      where: { id: id as string }
    });

    res.json({ success: true, message: 'Proje başarıyla silindi' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proje silinirken hata oluştu' });
  }
});

// --- FORMLAR VE DEĞERLENDİRMELER ---

// Risk Değerlendirmesi Getir
router.get('/projects/:id/risk-assessment', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const assessment = await prisma.buildRiskAssessment.findUnique({
      where: { projectId: id as string }
    });
    if (!assessment) return res.status(404).json({ error: 'Risk değerlendirmesi bulunamadı' });
    res.json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Risk değerlendirmesi getirilemedi' });
  }
});

// Risk Değerlendirmesi Ekle/Güncelle
router.post('/projects/:id/risk-assessment', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { score, level } = calculateRiskScoreAndLevel(req.body);

    const assessment = await prisma.buildRiskAssessment.upsert({
      where: { projectId: id as string },
      update: { ...req.body, riskScore: score, riskLevel: level },
      create: { projectId: id as string, ...req.body, riskScore: score, riskLevel: level }
    });

    res.json(assessment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Risk değerlendirmesi kaydedilemedi' });
  }
});

// --- TESLİM ALMA İSG FORMU ---

router.get('/projects/:id/handover-ohs', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const inspections = await prisma.buildHandoverOHSInspection.findMany({
      where: { projectId: id as string },
      orderBy: { createdAt: 'desc' }
    });
    // Her proje için 1 tane teslim alma İSG formu olmasını bekliyoruz
    if (inspections.length === 0) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(inspections[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Getirilemedi' });
  }
});

router.post('/projects/:id/handover-ohs', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    // Eğer varsa güncelleyelim, yoksa oluşturalım
    const existing = await prisma.buildHandoverOHSInspection.findFirst({
      where: { projectId: id as string }
    });

    if (existing) {
      const updated = await prisma.buildHandoverOHSInspection.update({
        where: { id: existing.id },
        data: req.body
      });
      return res.json(updated);
    }

    const created = await prisma.buildHandoverOHSInspection.create({
      data: {
        projectId: id as string,
        ...req.body
      }
    });

    // Otomatik Tamamlandı Kontrolü
    const infectionHandover = await prisma.buildHandoverInfectionInspection.findFirst({ where: { projectId: id as string } });
    if (infectionHandover) {
      await prisma.buildProject.update({
        where: { id: id as string },
        data: { status: 'Tamamlandı' }
      });
    }

    res.json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kaydedilemedi' });
  }
});

// --- TESLİM ALMA ENFEKSİYON FORMU ---

router.get('/projects/:id/handover-infection', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const inspections = await prisma.buildHandoverInfectionInspection.findMany({
      where: { projectId: id as string },
      orderBy: { createdAt: 'desc' }
    });
    if (inspections.length === 0) return res.status(404).json({ error: 'Bulunamadı' });
    res.json(inspections[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Getirilemedi' });
  }
});

router.post('/projects/:id/handover-infection', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.buildHandoverInfectionInspection.findFirst({
      where: { projectId: id as string }
    });

    if (existing) {
      const updated = await prisma.buildHandoverInfectionInspection.update({
        where: { id: existing.id },
        data: req.body
      });
      return res.json(updated);
    }

    const created = await prisma.buildHandoverInfectionInspection.create({
      data: {
        projectId: id as string,
        ...req.body
      }
    });

    // Otomatik Tamamlandı Kontrolü
    const ohsHandover = await prisma.buildHandoverOHSInspection.findFirst({ where: { projectId: id as string } });
    if (ohsHandover) {
      await prisma.buildProject.update({
        where: { id: id as string },
        data: { status: 'Tamamlandı' }
      });
    }

    res.json(created);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kaydedilemedi' });
  }
});

// --- ONAYLAR ---
router.post('/projects/:id/approvals', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { approvalType, status } = req.body;

    const approval = await prisma.buildApproval.upsert({
      where: {
        projectId_approvalType: {
          projectId: id as string,
          approvalType: approvalType
        }
      },
      update: {
        status: status || 'Onaylandı',
        approvedBy: req.user?.username || 'Bilinmiyor',
        approvedAt: new Date()
      },
      create: {
        projectId: id as string,
        approvalType: approvalType,
        status: status || 'Onaylandı',
        approvedBy: req.user?.username || 'Bilinmiyor',
        approvedAt: new Date()
      }
    });

    const permits = await prisma.buildPermit.findMany({ where: { projectId: id as string } });

    res.json([...[approval], ...permits]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Onay kaydedilemedi' });
  }
});

// --- RAPORLAR ---
router.get('/reports', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = (req.user as any)?.facilityId || req.query.facilityId as string;
    const whereClause = facilityId ? { facilityId } : {};

    // Get all projects for this facility including their handovers and inspections
    const projects = await prisma.buildProject.findMany({
      where: whereClause,
      include: {
        handoverOHSInspections: true,
        handoverInfectionInspections: true,
        inspectionsOHS: true,
        inspectionsInfection: true,
        contractor: true,
      }
    });

    const reports: any[] = [];

    for (const p of projects) {
      // Add Handover OHS
      for (const h of p.handoverOHSInspections) {
        reports.push({
          id: h.id,
          projectId: p.id,
          projectName: p.name,
          contractorName: p.contractor?.name,
          type: 'handover_ohs',
          title: 'İSG Teslim Alma Formu',
          date: h.inspectionDate,
          data: h,
          projectData: p
        });
      }
      // Add Handover Infection
      for (const h of p.handoverInfectionInspections) {
        reports.push({
          id: h.id,
          projectId: p.id,
          projectName: p.name,
          contractorName: p.contractor?.name,
          type: 'handover_infection',
          title: 'Enfeksiyon Teslim Alma Formu',
          date: h.inspectionDate,
          data: h,
          projectData: p
        });
      }
    }

    // Sort by date descending
    reports.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    res.json(reports);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Raporlar getirilemedi' });
  }
});

// --- HİZMET TASARIM FORMU ---

// Tasarım formu getir
router.get('/projects/:id/design-form', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const form = await prisma.buildDesignForm.findUnique({
      where: { projectId: id as string }
    });
    
    // Eğer form yoksa 404 dönebilir veya boş dönebilir, UI boş olduğunu anlayıp dolduracak
    res.json(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tasarım formu getirilirken hata oluştu' });
  }
});

// Tasarım formu kaydet / güncelle
router.post('/projects/:id/design-form', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const data = req.body;

    const form = await prisma.buildDesignForm.upsert({
      where: { projectId: id as string },
      update: {
        formType: data.formType || 'Tasarım',
        formDate: new Date(data.formDate),
        description: data.description,
        requester: data.requester,
        projectSponsor: data.projectSponsor,
        notes: data.notes,
        relatedDepartments: data.relatedDepartments, // JSON.stringify edilmiş array veya comma-separated string olabilir
        projectManager: data.projectManager,
        otherTeamMembers: data.otherTeamMembers,
        projectGoal: data.projectGoal,
        projectPlan: data.projectPlan,
        inputs: data.inputs,
        outputs: data.outputs,
        verification: data.verification,
        review: data.review,
        validityCheck: data.validityCheck,
        validityStudies: data.validityStudies,
        postServiceValidity: data.postServiceValidity,
        changeControl: data.changeControl
      },
      create: {
        projectId: id as string,
        formType: data.formType || 'Tasarım',
        formDate: new Date(data.formDate),
        description: data.description,
        requester: data.requester,
        projectSponsor: data.projectSponsor,
        notes: data.notes,
        relatedDepartments: data.relatedDepartments,
        projectManager: data.projectManager,
        otherTeamMembers: data.otherTeamMembers,
        projectGoal: data.projectGoal,
        projectPlan: data.projectPlan,
        inputs: data.inputs,
        outputs: data.outputs,
        verification: data.verification,
        review: data.review,
        validityCheck: data.validityCheck,
        validityStudies: data.validityStudies,
        postServiceValidity: data.postServiceValidity,
        changeControl: data.changeControl
      }
    });

    res.json(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tasarım formu kaydedilirken hata oluştu' });
  }
});

// --- DOKÜMANLAR ---

// Doküman yükle
router.post('/projects/:id/documents', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { documentType, status } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya yüklenmedi' });
    }

    const fileUrl = `/uploads/build/${req.file.filename}`;
    
    const document = await prisma.buildDocument.create({
      data: {
        projectId: id as string,
        documentType: documentType || 'Diğer',
        name: req.file.originalname,
        fileUrl,
        uploadedBy: req.user?.username,
        status: status || 'Yüklendi'
      }
    });

    res.status(201).json(document);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Doküman yüklenirken hata oluştu' });
  }
});

// Dokümanları getir
router.get('/projects/:id/documents', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const docs = await prisma.buildDocument.findMany({
      where: { projectId: id as string },
      orderBy: { createdAt: 'desc' },
      include: { uploader: { select: { fullName: true } } }
    });
    res.json(docs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Dokümanlar getirilemedi' });
  }
});

// GET /projects/:id/findings - Get open findings
router.get('/projects/:id/findings', async (req, res) => {
  try {
    const { id } = req.params;
    const findings = await prisma.buildFinding.findMany({
      where: { projectId: id },
      include: {
        actions: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(findings);
  } catch (error) {
    console.error('Error fetching findings:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /projects/:id/inspections/ohs - Get past OHS inspections
router.get('/projects/:id/inspections/ohs', async (req, res) => {
  try {
    const { id } = req.params;
    const inspections = await prisma.buildInspectionOHS.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching OHS inspections:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /projects/:id/inspections/ohs - Create new OHS inspection
router.post('/projects/:id/inspections/ohs', async (req, res) => {
  try {
    const { id } = req.params;
    const { inspectionDate, inspector, checklistData, notes } = req.body;
    const activeDate = inspectionDate ? new Date(inspectionDate) : new Date();

    let hasUygunDegil = false;
    // Iterate to find any UD and process findings automatically
    for (const [qId, answer] of Object.entries(checklistData)) {
      if (answer === 'UD') {
        hasUygunDegil = true;
        
        // Check if there's ANY existing finding for this exact question
        let finding = await prisma.buildFinding.findFirst({
          where: { 
            projectId: id, 
            sourceType: 'İSG Denetimi', 
            sourceRef: qId
          }
        });

        if (!finding) {
          // Create new finding
          finding = await prisma.buildFinding.create({
            data: {
              projectId: id,
              sourceType: 'İSG Denetimi',
              sourceRef: qId,
              description: `Saha denetiminde uygunsuzluk tespit edildi.`,
              createdAt: activeDate
            }
          });
        }

        // Check if this finding already has an OPEN action
        const openAction = await prisma.buildAction.findFirst({
          where: {
            findingId: finding.id,
            status: 'Açık'
          }
        });

        if (!openAction) {
          // Create new action (this represents the new occurrence of the nonconformity)
          await prisma.buildAction.create({
            data: {
              projectId: id,
              findingId: finding.id,
              description: `Saha denetiminde tespit edilen uygunsuzluğun giderilmesi.`,
              sourceType: 'İSG',
              riskLevel: 'Orta',
              status: 'Açık',
              createdAt: activeDate
            }
          });
        }
      } else if (answer === 'U') {
        // If it's Uygun, find any open actions related to this question and close them
        const openActions = await prisma.buildAction.findMany({
          where: {
            projectId: id,
            status: 'Açık',
            finding: { sourceRef: qId, sourceType: 'İSG Denetimi' }
          }
        });

        for (const action of openActions) {
          await prisma.buildAction.update({
            where: { id: action.id },
            data: { 
              status: 'Kapatıldı', 
              closedAt: activeDate, 
              closeNotes: 'Saha denetiminde Uygun (U) olarak tespit edilerek otomatik kapatıldı.' 
            }
          });
        }
      }
    }

    const resultStatus = hasUygunDegil ? 'UYGUN DEĞİLDİR' : 'UYGUNDUR';

    const newInspection = await prisma.buildInspectionOHS.create({
      data: {
        projectId: id,
        inspectionDate: new Date(inspectionDate),
        inspector,
        checklistData,
        result: resultStatus,
        notes
      }
    });

    res.json(newInspection);
  } catch (error) {
    console.error('Error creating OHS inspection:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /projects/:id/inspections/infection - Get past Infection inspections
router.get('/projects/:id/inspections/infection', async (req, res) => {
  try {
    const { id } = req.params;
    const inspections = await prisma.buildInspectionInfection.findMany({
      where: { projectId: id },
      orderBy: { createdAt: 'desc' }
    });
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching Infection inspections:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /projects/:id/inspections/infection - Create new Infection inspection
router.post('/projects/:id/inspections/infection', async (req, res) => {
  try {
    const { id } = req.params;
    const { inspectionDate, inspector, checklistData, notes } = req.body;
    const activeDate = inspectionDate ? new Date(inspectionDate) : new Date();

    let hasUygunDegil = false;
    for (const [qId, answer] of Object.entries(checklistData)) {
      if (answer === 'UD') {
        hasUygunDegil = true;
        
        let finding = await prisma.buildFinding.findFirst({
          where: { 
            projectId: id, 
            sourceType: 'Enfeksiyon Denetimi', 
            sourceRef: qId
          }
        });

        if (!finding) {
          finding = await prisma.buildFinding.create({
            data: {
              projectId: id,
              sourceType: 'Enfeksiyon Denetimi',
              sourceRef: qId,
              description: `Enfeksiyon denetiminde uygunsuzluk tespit edildi.`,
              createdAt: activeDate
            }
          });
        }

        const openAction = await prisma.buildAction.findFirst({
          where: {
            findingId: finding.id,
            status: 'Açık'
          }
        });

        if (!openAction) {
          await prisma.buildAction.create({
            data: {
              projectId: id,
              findingId: finding.id,
              description: `Enfeksiyon denetiminde tespit edilen uygunsuzluğun giderilmesi.`,
              sourceType: 'Enfeksiyon Kontrol',
              riskLevel: 'Orta',
              status: 'Açık',
              createdAt: activeDate
            }
          });
        }
      } else if (answer === 'U') {
        const openActions = await prisma.buildAction.findMany({
          where: {
            projectId: id,
            status: 'Açık',
            finding: { sourceRef: qId, sourceType: 'Enfeksiyon Denetimi' }
          }
        });

        for (const action of openActions) {
          await prisma.buildAction.update({
            where: { id: action.id },
            data: { 
              status: 'Kapatıldı', 
              closedAt: activeDate, 
              closeNotes: 'Enfeksiyon denetiminde Uygun (U) olarak tespit edilerek otomatik kapatıldı.' 
            }
          });
        }
      }
    }

    const resultStatus = hasUygunDegil ? 'UYGUN DEĞİLDİR' : 'UYGUNDUR';

    const newInspection = await prisma.buildInspectionInfection.create({
      data: {
        projectId: id,
        inspectionDate: new Date(inspectionDate),
        inspector,
        checklistData,
        result: resultStatus,
        notes
      }
    });

    res.json(newInspection);
  } catch (error) {
    console.error('Error creating Infection inspection:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
