import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { calculateICRAClass, calculateRiskScoreAndLevel, checkProjectGate, createProject } from '../services/buildManagementService';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

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
        creator: { select: { fullName: true } }
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
    const { facilityId, name, location, floor, department, workType, buildType, riskGroup, plannedStartDate, plannedEndDate, contractorCompany, projectManager, description } = req.body;
    
    if (!facilityId || !name || !workType || !buildType || !riskGroup) {
      return res.status(400).json({ error: 'Eksik bilgi' });
    }

    const createdById = req.user?.username || '';
    
    const project = await createProject(req.body, createdById);

    // Başlangıç durumunda boş bir ICRA kaydı da oluşturalım
    await prisma.buildICRA.create({
      data: {
        projectId: project.id,
        calculatedClass: project.icraClass,
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
        designForm: true,
        riskAssessment: true,
        icra: true,
        approvals: true,
        documents: true,
        permits: true,
        handover: true,
        inspectionsOHS: true,
        inspectionsInfection: true,
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
         return res.status(400).json({ error: 'Teslim alma kuralları sağlanmadı. Eksik onay/aksiyon var.', gateCheck });
       }
    }

    const updated = await prisma.buildProject.update({
      where: { id: id as string },
      data: { status: status as string }
    });
    res.json(updated);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Proje durumu güncellenemedi' });
  }
});

// --- FORMLAR VE DEĞERLENDİRMELER ---

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

// Hizmet Tasarım Formu Ekle/Güncelle
router.post('/projects/:id/design-form', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const form = await prisma.buildDesignForm.upsert({
      where: { projectId: id as string },
      update: { ...req.body },
      create: { projectId: id as string, ...req.body }
    });

    res.json(form);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tasarım formu kaydedilemedi' });
  }
});

export default router;
