"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authMiddleware);
// Get all incidents
router.get('/', async (req, res) => {
    try {
        const { facilityId } = req.query;
        const user = req.user;
        const isAdmin = user.roles.includes('admin') || user.roles.includes('management');
        const where = {};
        if (facilityId) {
            where.facilityId = facilityId;
        }
        if (!isAdmin) {
            const userFacilities = await prisma.userFacility.findMany({
                where: { username: user.username },
                select: { facilityId: true }
            });
            const allowedIds = userFacilities.map(uf => uf.facilityId);
            if (facilityId && !allowedIds.includes(facilityId)) {
                return res.status(403).json({ error: 'Bu tesise erişim yetkiniz yok.' });
            }
            where.facilityId = { in: allowedIds };
        }
        const incidents = await prisma.hazmatIncident.findMany({
            where,
            include: {
                facility: { select: { name: true, logoUrl: true, commercialTitle: true } },
                creator: { select: { fullName: true } },
                materials: true,
                category: true,
                department: true,
                supportUnit: true,
                emergencyCode: true
            },
            orderBy: { incidentDate: 'desc' }
        });
        res.json(incidents);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Olaylar getirilemedi.' });
    }
});
// Get single incident
router.get('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const isAdmin = user.roles.includes('admin') || user.roles.includes('management');
        const incident = await prisma.hazmatIncident.findUnique({
            where: { id },
            include: {
                facility: { select: { name: true, logoUrl: true, commercialTitle: true } },
                creator: { select: { fullName: true } },
                materials: true,
                category: true,
                department: true,
                supportUnit: true,
                emergencyCode: true
            }
        });
        if (!incident)
            return res.status(404).json({ error: 'Olay bulunamadı.' });
        if (!isAdmin) {
            const hasAccess = await prisma.userFacility.findFirst({
                where: { username: user.username, facilityId: incident.facilityId }
            });
            if (!hasAccess)
                return res.status(403).json({ error: 'Bu olayı görmeye yetkiniz yok.' });
        }
        res.json(incident);
    }
    catch (error) {
        res.status(500).json({ error: 'Olay detayları getirilemedi.' });
    }
});
// Create new incident
router.post('/', async (req, res) => {
    try {
        const user = req.user;
        const { facilityId, categoryId, rootCause, departmentId, incidentDate, interventionRequired, interventionTime, controlTime, supportReceived, supportUnitId, announcementMade, emergencyCodeId, serviceInterrupted, interruptionDuration, evacuatedStaffCount, evacuatedPatientCount, injuredCount, deceasedCount, incidentMode, causeDetail, detectedEffect, observations, actionsTaken, resultEvaluation, kitUsed, spillKitId, materialIds } = req.body;
        const hasAccess = await prisma.userFacility.findFirst({
            where: { username: user.username, facilityId }
        });
        const isAdmin = user.roles.includes('admin') || user.roles.includes('management');
        if (!hasAccess && !isAdmin) {
            return res.status(403).json({ error: 'Bu tesis için olay kaydetme yetkiniz yok.' });
        }
        const isKitUsed = kitUsed === true || kitUsed === 'true';
        const incident = await prisma.hazmatIncident.create({
            data: {
                facilityId,
                categoryId,
                rootCause,
                departmentId,
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
                incidentMode,
                causeDetail,
                detectedEffect,
                observations,
                actionsTaken,
                resultEvaluation,
                kitUsed: isKitUsed,
                spillKitId: spillKitId || null,
                createdBy: user.username,
                materials: {
                    connect: Array.isArray(materialIds) ? materialIds.map((id) => ({ id })) : []
                }
            }
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
                    incidentDesc: incidentMode,
                    incidentOutcome: "Kit kullanıldı ve eksildi."
                }
            });
        }
        res.status(201).json(incident);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Olay kaydedilemedi: ' + error.message });
    }
});
// Update incident
router.put('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const isAdmin = user.roles.includes('admin') || user.roles.includes('management');
        const { categoryId, rootCause, departmentId, incidentDate, interventionRequired, interventionTime, controlTime, supportReceived, supportUnitId, announcementMade, emergencyCodeId, serviceInterrupted, interruptionDuration, evacuatedStaffCount, evacuatedPatientCount, injuredCount, deceasedCount, incidentMode, causeDetail, detectedEffect, observations, actionsTaken, resultEvaluation, kitUsed, spillKitId, materialIds } = req.body;
        const existing = await prisma.hazmatIncident.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Olay bulunamadı.' });
        if (!isAdmin) {
            const hasAccess = await prisma.userFacility.findFirst({
                where: { username: user.username, facilityId: existing.facilityId }
            });
            if (!hasAccess)
                return res.status(403).json({ error: 'Bu olayı güncellemeye yetkiniz yok.' });
        }
        const isKitUsed = kitUsed === true || kitUsed === 'true';
        const updated = await prisma.hazmatIncident.update({
            where: { id },
            data: {
                categoryId: categoryId || undefined,
                rootCause: rootCause !== undefined ? rootCause : undefined,
                departmentId: departmentId || undefined,
                incidentDate: incidentDate ? new Date(incidentDate) : undefined,
                interventionRequired: interventionRequired === true || interventionRequired === 'true',
                interventionTime: interventionTime ? new Date(interventionTime) : (interventionRequired === 'false' || interventionRequired === false ? null : undefined),
                controlTime: controlTime ? new Date(controlTime) : undefined,
                supportReceived: supportReceived === true || supportReceived === 'true',
                supportUnitId: supportUnitId ? parseInt(supportUnitId) : (supportReceived === 'false' || supportReceived === false ? null : undefined),
                announcementMade: announcementMade === true || announcementMade === 'true',
                emergencyCodeId: emergencyCodeId ? parseInt(emergencyCodeId) : (announcementMade === 'false' || announcementMade === false ? null : undefined),
                serviceInterrupted: serviceInterrupted === true || serviceInterrupted === 'true',
                interruptionDuration: interruptionDuration !== undefined ? parseFloat(interruptionDuration) : undefined,
                evacuatedStaffCount: evacuatedStaffCount !== undefined ? parseInt(evacuatedStaffCount) : undefined,
                evacuatedPatientCount: evacuatedPatientCount !== undefined ? parseInt(evacuatedPatientCount) : undefined,
                injuredCount: injuredCount !== undefined ? parseInt(injuredCount) : undefined,
                deceasedCount: deceasedCount !== undefined ? parseInt(deceasedCount) : undefined,
                incidentMode,
                causeDetail,
                detectedEffect,
                observations,
                actionsTaken,
                resultEvaluation,
                kitUsed: isKitUsed,
                spillKitId: spillKitId || null
            }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Olay güncellenemedi.' });
    }
});
// Delete incident
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const user = req.user;
        const isAdmin = user.roles.includes('admin') || user.roles.includes('management');
        const existing = await prisma.hazmatIncident.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Olay bulunamadı.' });
        if (!isAdmin) {
            const hasAccess = await prisma.userFacility.findFirst({
                where: { username: user.username, facilityId: existing.facilityId }
            });
            if (!hasAccess)
                return res.status(403).json({ error: 'Bu olayı silmeye yetkiniz yok.' });
        }
        await prisma.hazmatIncident.delete({ where: { id } });
        res.json({ message: 'Olay başarıyla silindi.' });
    }
    catch (error) {
        res.status(500).json({ error: 'Olay silinemedi.' });
    }
});
exports.default = router;
