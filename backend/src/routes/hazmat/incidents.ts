import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

const INCIDENT_INCLUDE = {
  facility: { select: { name: true, logoUrl: true, commercialTitle: true } },
  creator: { select: { fullName: true } },
  materials: true,
  category: true,
  incidentType: true,
  location: true,
  supportUnit: true,
  emergencyCode: true,
};

const isUserAdmin = (user: AuthRequest['user']) =>
  Boolean(user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management'));

// Get all incidents
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query as Record<string, any>;
    const user = req.user!;
    const isAdmin = isUserAdmin(user);

    const where: any = {};

    if (facilityId && facilityId !== 'all') {
      where.facilityId = String(facilityId);
    }

    if (!isAdmin) {
      const userFacilities = await prisma.userFacility.findMany({
        where: { username: user.username },
        select: { facilityId: true }
      });
      const allowedIds = userFacilities.map(uf => uf.facilityId);

      if (facilityId && facilityId !== 'all' && !allowedIds.includes(String(facilityId))) {
        return res.status(403).json({ error: 'Bu tesise erişim yetkiniz yok.' });
      }

      if (!where.facilityId) {
        where.facilityId = { in: allowedIds };
      }
    }

    const incidents = await prisma.hazmatIncident.findMany({
      where,
      include: INCIDENT_INCLUDE,
      orderBy: { incidentDate: 'desc' }
    });

    res.json(incidents);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Olaylar getirilemedi.' });
  }
});

// Get single incident
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const user = req.user!;
    const isAdmin = isUserAdmin(user);

    const incident = await prisma.hazmatIncident.findUnique({
      where: { id },
      include: INCIDENT_INCLUDE,
    });

    if (!incident) return res.status(404).json({ error: 'Olay bulunamadı.' });

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

// Create new incident
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      facilityId, categoryId, incidentTypeId, rootCause, locationId, departmentId,
      incidentDate, interventionRequired, interventionTime, controlTime,
      supportReceived, supportUnitId, announcementMade, emergencyCodeId,
      serviceInterrupted, interruptionDuration,
      evacuatedStaffCount, evacuatedPatientCount, injuredCount, deceasedCount,
      incidentMode, causeDetail, detectedEffect, observations, actionsTaken, resultEvaluation,
      kitUsed, spillKitId, materialIds
    } = req.body;

    if (!facilityId) {
      return res.status(400).json({ error: 'Tesis seçimi zorunludur.' });
    }
    if (!incidentDate || !controlTime) {
      return res.status(400).json({ error: 'Olay tarihi ve kontrol altına alma saati zorunludur.' });
    }

    const hasAccess = await prisma.userFacility.findFirst({
      where: { username: user.username, facilityId }
    });
    const isAdmin = isUserAdmin(user);
    
    if (!hasAccess && !isAdmin) {
      return res.status(403).json({ error: 'Bu tesis için olay kaydetme yetkiniz yok.' });
    }

    const isKitUsed = kitUsed === true || kitUsed === 'true';
    const resolvedLocationId = locationId || departmentId || null;

    const incident = await prisma.hazmatIncident.create({
      data: {
        facilityId,
        categoryId: categoryId || null,
        incidentTypeId: incidentTypeId || null,
        rootCause: rootCause || '',
        locationId: resolvedLocationId,
        incidentDate: new Date(incidentDate),
        interventionRequired: interventionRequired === true || interventionRequired === 'true',
        interventionTime: interventionTime ? new Date(interventionTime) : null,
        controlTime: new Date(controlTime),
        supportReceived: supportReceived === true || supportReceived === 'true',
        supportUnitId: supportUnitId ? parseInt(supportUnitId) : null,
        announcementMade: announcementMade === true || announcementMade === 'true',
        emergencyCodeId: emergencyCodeId ? parseInt(emergencyCodeId) : null,
        serviceInterrupted: serviceInterrupted === true || serviceInterrupted === 'true',
        interruptionDuration: parseFloat(interruptionDuration) || 0,
        evacuatedStaffCount: parseInt(evacuatedStaffCount) || 0,
        evacuatedPatientCount: parseInt(evacuatedPatientCount) || 0,
        injuredCount: parseInt(injuredCount) || 0,
        deceasedCount: parseInt(deceasedCount) || 0,
        incidentMode: incidentMode || '',
        causeDetail: causeDetail || '',
        detectedEffect: detectedEffect || '',
        observations: observations || '',
        actionsTaken: actionsTaken || '',
        resultEvaluation: resultEvaluation || '',
        kitUsed: isKitUsed,
        spillKitId: spillKitId || null,
        createdBy: user.username,
        materials: {
          connect: Array.isArray(materialIds) ? materialIds.map((id: string) => ({ id })) : []
        }
      },
      include: INCIDENT_INCLUDE,
    });

    // If kit was used, create a check record for it
    if (isKitUsed && spillKitId) {
      await prisma.hazmatSpillKitCheck.create({
        data: {
          placementId: spillKitId,
          lastCheck: new Date(),
          result: "Eksik",
          checkedBy: user.username,
          contentOk: false,
          qtyOk: false,
          note: `Olağan dışı olay sebebiyle kullanıldı (Olay ID: ${incident.id}). Eksiklerin tamamlanması gerekmektedir.`
        }
      });
      // Also record the incident in the kit's history
      await prisma.hazmatSpillKitIncident.create({
        data: {
          placementId: spillKitId,
          incidentDate: new Date(incidentDate),
          incidentType: "Olağan Dışı Olay",
          incidentDesc: incidentMode || '',
          incidentOutcome: "Kit kullanıldı ve eksildi."
        }
      });
    }

    res.status(201).json(incident);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Olay kaydedilemedi: ' + error.message });
  }
});

// Update incident
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const user = req.user!;
    const isAdmin = isUserAdmin(user);
    
    const {
      categoryId, incidentTypeId, rootCause, locationId, departmentId,
      incidentDate, interventionRequired, interventionTime, controlTime,
      supportReceived, supportUnitId, announcementMade, emergencyCodeId,
      serviceInterrupted, interruptionDuration,
      evacuatedStaffCount, evacuatedPatientCount, injuredCount, deceasedCount,
      incidentMode, causeDetail, detectedEffect, observations, actionsTaken, resultEvaluation,
      kitUsed, spillKitId, materialIds
    } = req.body;

    const existing = await prisma.hazmatIncident.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Olay bulunamadı.' });

    if (!isAdmin) {
      const hasAccess = await prisma.userFacility.findFirst({
        where: { username: user.username, facilityId: existing.facilityId }
      });
      if (!hasAccess) return res.status(403).json({ error: 'Bu olayı güncellemeye yetkiniz yok.' });
    }

    const isKitUsed = kitUsed === true || kitUsed === 'true';
    const resolvedLocationId = locationId !== undefined ? (locationId || null) : (departmentId !== undefined ? (departmentId || null) : undefined);

    const updated = await prisma.hazmatIncident.update({
      where: { id },
      data: {
        categoryId: categoryId !== undefined ? (categoryId || null) : undefined,
        incidentTypeId: incidentTypeId !== undefined ? (incidentTypeId || null) : undefined,
        rootCause: rootCause !== undefined ? rootCause : undefined,
        locationId: resolvedLocationId,
        incidentDate: incidentDate ? new Date(incidentDate) : undefined,
        interventionRequired: interventionRequired === true || interventionRequired === 'true',
        interventionTime: interventionTime ? new Date(interventionTime) : (interventionRequired === 'false' || interventionRequired === false ? null : undefined),
        controlTime: controlTime ? new Date(controlTime) : undefined,
        supportReceived: supportReceived === true || supportReceived === 'true',
        supportUnitId: supportUnitId ? parseInt(supportUnitId) : (supportReceived === 'false' || supportReceived === false ? null : undefined),
        announcementMade: announcementMade === true || announcementMade === 'true',
        emergencyCodeId: emergencyCodeId ? parseInt(emergencyCodeId) : (announcementMade === 'false' || announcementMade === false ? null : undefined),
        serviceInterrupted: serviceInterrupted === true || serviceInterrupted === 'true',
        interruptionDuration: interruptionDuration !== undefined ? (parseFloat(interruptionDuration) || 0) : undefined,
        evacuatedStaffCount: evacuatedStaffCount !== undefined ? (parseInt(evacuatedStaffCount) || 0) : undefined,
        evacuatedPatientCount: evacuatedPatientCount !== undefined ? (parseInt(evacuatedPatientCount) || 0) : undefined,
        injuredCount: injuredCount !== undefined ? (parseInt(injuredCount) || 0) : undefined,
        deceasedCount: deceasedCount !== undefined ? (parseInt(deceasedCount) || 0) : undefined,
        incidentMode: incidentMode !== undefined ? incidentMode : undefined,
        causeDetail: causeDetail !== undefined ? (causeDetail || '') : undefined,
        detectedEffect: detectedEffect !== undefined ? (detectedEffect || '') : undefined,
        observations: observations !== undefined ? (observations || '') : undefined,
        actionsTaken: actionsTaken !== undefined ? (actionsTaken || '') : undefined,
        resultEvaluation: resultEvaluation !== undefined ? (resultEvaluation || '') : undefined,
        kitUsed: isKitUsed,
        spillKitId: spillKitId || null,
        materials: Array.isArray(materialIds)
          ? { set: materialIds.map((mid: string) => ({ id: mid })) }
          : undefined,
      },
      include: INCIDENT_INCLUDE,
    });

    res.json(updated);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Olay güncellenemedi.' });
  }
});

// Delete incident
router.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const id = req.params.id;
    const user = req.user!;
    const isAdmin = isUserAdmin(user);

    const existing = await prisma.hazmatIncident.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Olay bulunamadı.' });

    if (!isAdmin) {
      const hasAccess = await prisma.userFacility.findFirst({
        where: { username: user.username, facilityId: existing.facilityId }
      });
      if (!hasAccess) return res.status(403).json({ error: 'Bu olayı silmeye yetkiniz yok.' });
    }

    await prisma.hazmatIncident.delete({ where: { id } });
    res.json({ message: 'Olay başarıyla silindi.' });
  } catch (error) {
    res.status(500).json({ error: 'Olay silinemedi.' });
  }
});

export default router;
