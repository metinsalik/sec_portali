import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/incidents';
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) cb(null, true);
    else cb(new Error('Sadece .jpg, .jpeg, .png ve .pdf dosyaları yüklenebilir.'));
  }
});

router.use(authMiddleware);

// Tüm olayları getir (Admin her şeyi, kullanıcı kendi tesislerini görür)
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;
    const user = req.user!;
    const isAdmin = user.roles.includes('admin') || user.roles.includes('management');

    const where: any = {};
    
    // Filtreleme
    if (facilityId) {
      where.facilityId = facilityId;
    }

    // Yetkilendirme
    if (!isAdmin) {
      const userFacilities = await prisma.userFacility.findMany({
        where: { username: user.username },
        select: { facilityId: true }
      });
      const allowedIds = userFacilities.map(uf => uf.facilityId);
      
      if (facilityId && !allowedIds.includes(facilityId as string)) {
        return res.status(403).json({ error: 'Bu tesise erişim yetkiniz yok.' });
      }
      
      where.facilityId = { in: allowedIds };
    }

    const incidents = await prisma.extraordinaryIncident.findMany({
      where,
      include: {
        facility: { select: { name: true } },
        category: true,
        rootCause: true,
        department: true,
        supportUnit: true,
        emergencyCode: true
      },
      orderBy: { incidentDate: 'desc' }
    });

    res.json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Olaylar getirilemedi.' });
  }
});

// Tekil olay getir
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user!;
    const isAdmin = user.roles.includes('admin') || user.roles.includes('management');

    const incident = await prisma.extraordinaryIncident.findUnique({
      where: { id },
      include: {
        facility: { select: { name: true } },
        category: true,
        rootCause: true,
        department: true,
        supportUnit: true,
        emergencyCode: true
      }
    });

    if (!incident) return res.status(404).json({ error: 'Olay bulunamadı.' });

    // Yetki kontrolü
    if (!isAdmin) {
      const hasAccess = await prisma.userFacility.findFirst({
        where: { username: user.username, facilityId: incident.facilityId }
      });
      if (!hasAccess) return res.status(403).json({ error: 'Bu olayı görmeye yetkiniz yok.' });
    }

    res.json(incident);
  } catch (error) {
    res.status(500).json({ error: 'Olay detayları getirilemedi.' });
  }
});

// Yeni olay kaydet
router.post('/', upload.array('files', 4), async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      facilityId, categoryId, rootCauseId, departmentId, locationDetail,
      incidentDate, interventionRequired, interventionTime, controlTime,
      supportReceived, supportUnitId, announcementMade, emergencyCodeId,
      serviceInterrupted, interruptionDuration,
      evacuatedStaffCount, evacuatedPatientCount, injuredCount, deceasedCount,
      summary, causeDetail, detectedEffect, observations, actionsTaken, resultEvaluation
    } = req.body;

    // Yetki kontrolü
    const hasAccess = await prisma.userFacility.findFirst({
      where: { username: user.username, facilityId }
    });
    const isAdmin = user.roles.includes('admin') || user.roles.includes('management');
    
    if (!hasAccess && !isAdmin) {
      return res.status(403).json({ error: 'Bu tesis için olay kaydetme yetkiniz yok.' });
    }

    // Dosyaları işle
    const attachments = (req.files as Express.Multer.File[] || []).map(f => ({
      name: f.originalname,
      url: `/uploads/incidents/${f.filename}`,
      type: f.mimetype
    }));

    const incident = await prisma.extraordinaryIncident.create({
      data: {
        facilityId,
        categoryId: parseInt(categoryId),
        rootCauseId: parseInt(rootCauseId),
        departmentId: parseInt(departmentId),
        locationDetail,
        incidentDate: new Date(incidentDate),
        interventionRequired: interventionRequired === 'true' || interventionRequired === true,
        interventionTime: interventionTime ? new Date(interventionTime) : null,
        controlTime: new Date(controlTime),
        supportReceived: supportReceived === 'true' || supportReceived === true,
        supportUnitId: supportUnitId ? parseInt(supportUnitId) : null,
        announcementMade: announcementMade === 'true' || announcementMade === true,
        emergencyCodeId: emergencyCodeId ? parseInt(emergencyCodeId) : null,
        serviceInterrupted: serviceInterrupted === 'true' || serviceInterrupted === true,
        interruptionDuration: parseFloat(interruptionDuration) || 0,
        evacuatedStaffCount: parseInt(evacuatedStaffCount) || 0,
        evacuatedPatientCount: parseInt(evacuatedPatientCount) || 0,
        injuredCount: parseInt(injuredCount) || 0,
        deceasedCount: parseInt(deceasedCount) || 0,
        summary,
        causeDetail,
        detectedEffect,
        observations,
        actionsTaken,
        resultEvaluation,
        attachments: attachments.length > 0 ? attachments : undefined,
        createdBy: user.username
      }
    });

    res.status(201).json(incident);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Olay kaydedilemedi: ' + error.message });
  }
});

// Olay güncelle
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user!;
    const isAdmin = user.roles.includes('admin') || user.roles.includes('management');
    
    const {
      categoryId, rootCauseId, departmentId, locationDetail,
      incidentDate, interventionRequired, interventionTime, controlTime,
      supportReceived, supportUnitId, announcementMade, emergencyCodeId,
      serviceInterrupted, interruptionDuration,
      evacuatedStaffCount, evacuatedPatientCount, injuredCount, deceasedCount,
      summary, causeDetail, detectedEffect, observations, actionsTaken, resultEvaluation
    } = req.body;

    const existing = await prisma.extraordinaryIncident.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Olay bulunamadı.' });

    // Yetki kontrolü
    if (!isAdmin) {
      const hasAccess = await prisma.userFacility.findFirst({
        where: { username: user.username, facilityId: existing.facilityId }
      });
      if (!hasAccess) return res.status(403).json({ error: 'Bu olayı güncellemeye yetkiniz yok.' });
    }

    const updated = await prisma.extraordinaryIncident.update({
      where: { id },
      data: {
        categoryId: categoryId ? parseInt(categoryId) : undefined,
        rootCauseId: rootCauseId ? parseInt(rootCauseId) : undefined,
        departmentId: departmentId ? parseInt(departmentId) : undefined,
        locationDetail,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined,
        interventionRequired: interventionRequired !== undefined ? !!interventionRequired : undefined,
        interventionTime: interventionTime ? new Date(interventionTime) : (interventionRequired === false ? null : undefined),
        controlTime: controlTime ? new Date(controlTime) : undefined,
        supportReceived: supportReceived !== undefined ? !!supportReceived : undefined,
        supportUnitId: supportUnitId ? parseInt(supportUnitId) : (supportReceived === false ? null : undefined),
        announcementMade: announcementMade !== undefined ? !!announcementMade : undefined,
        emergencyCodeId: emergencyCodeId ? parseInt(emergencyCodeId) : (announcementMade === false ? null : undefined),
        serviceInterrupted: serviceInterrupted !== undefined ? !!serviceInterrupted : undefined,
        interruptionDuration: interruptionDuration !== undefined ? parseFloat(interruptionDuration) : undefined,
        evacuatedStaffCount: evacuatedStaffCount !== undefined ? parseInt(evacuatedStaffCount) : undefined,
        evacuatedPatientCount: evacuatedPatientCount !== undefined ? parseInt(evacuatedPatientCount) : undefined,
        injuredCount: injuredCount !== undefined ? parseInt(injuredCount) : undefined,
        deceasedCount: deceasedCount !== undefined ? parseInt(deceasedCount) : undefined,
        summary,
        causeDetail,
        detectedEffect,
        observations,
        actionsTaken,
        resultEvaluation
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Olay güncellenemedi.' });
  }
});

// Olay sil
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const user = req.user!;
    const isAdmin = user.roles.includes('admin') || user.roles.includes('management');

    const existing = await prisma.extraordinaryIncident.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Olay bulunamadı.' });

    // Yetki kontrolü
    if (!isAdmin) {
      const hasAccess = await prisma.userFacility.findFirst({
        where: { username: user.username, facilityId: existing.facilityId }
      });
      if (!hasAccess) return res.status(403).json({ error: 'Bu olayı silmeye yetkiniz yok.' });
    }

    await prisma.extraordinaryIncident.delete({ where: { id } });
    res.json({ message: 'Olay başarıyla silindi.' });
  } catch (error) {
    res.status(500).json({ error: 'Olay silinemedi.' });
  }
});

export default router;
