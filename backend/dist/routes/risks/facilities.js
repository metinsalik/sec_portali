"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// GET /api/risks/facilities
// Admin/Management → tüm tesisler; Specialist → atandığı tesisler
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        const isAdminOrMgmt = user?.isAdmin || user?.isManagement;
        let facilities;
        if (isAdminOrMgmt) {
            facilities = await prisma.facility.findMany({
                where: { isActive: true },
                select: {
                    id: true,
                    name: true,
                    shortName: true,
                    city: true,
                    dangerClass: true,
                    commercialTitle: true,
                    fullAddress: true,
                    district: true,
                    logoUrl: true,
                    phone: true,
                    assignments: {
                        include: {
                            professional: true,
                            employerRep: true,
                        }
                    },
                    locations: {
                        select: {
                            id: true,
                            name: true,
                            _count: { select: { risks: true } },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
        }
        else {
            // Uzman: sadece atandığı tesisler
            const userFacilities = await prisma.userFacility.findMany({
                where: { username: user.username },
                select: { facilityId: true },
            });
            const facilityIds = userFacilities.map((f) => f.facilityId);
            facilities = await prisma.facility.findMany({
                where: { id: { in: facilityIds }, isActive: true },
                select: {
                    id: true,
                    name: true,
                    shortName: true,
                    city: true,
                    dangerClass: true,
                    commercialTitle: true,
                    fullAddress: true,
                    district: true,
                    logoUrl: true,
                    phone: true,
                    assignments: {
                        include: {
                            professional: true,
                            employerRep: true,
                        }
                    },
                    locations: {
                        select: {
                            id: true,
                            name: true,
                            _count: { select: { risks: true } },
                        },
                    },
                },
                orderBy: { name: 'asc' },
            });
        }
        // Her tesis için risk özeti hesapla
        const withStats = await Promise.all(facilities.map(async (f) => {
            const stats = await prisma.riskLifecycle.groupBy({
                by: ['status'],
                where: {
                    location: { facilityId: f.id },
                },
                _count: { id: true },
            });
            const statusMap = {};
            stats.forEach((s) => {
                statusMap[s.status] = s._count.id;
            });
            return {
                ...f,
                riskStats: {
                    total: Object.values(statusMap).reduce((a, b) => a + b, 0),
                    acik: statusMap['ACIK_TEHLIKE'] || 0,
                    mudahale: statusMap['ILK_MUDAHALE_EDILDI'] || 0,
                    takip: statusMap['TAKIP_SURECINDE'] || 0,
                    kapali: statusMap['KAPATILDI_GUVENLI'] || 0,
                },
            };
        }));
        res.json(withStats);
    }
    catch (error) {
        console.error('Risk facilities error:', error);
        res.status(500).json({ error: 'Tesisler alınamadı.' });
    }
});
// Locations endpoints for experts
router.get('/:id/locations', auth_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    try {
        const locations = await prisma.facilityLocation.findMany({
            where: { facilityId: id },
            orderBy: { name: 'asc' }
        });
        res.json(locations);
    }
    catch (err) {
        res.status(500).json({ error: 'Lokasyonlar getirilemedi.' });
    }
});
router.post('/:id/locations', auth_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { building, floor, department, description, name } = req.body;
    if (!building && !name)
        return res.status(400).json({ error: 'Blok veya Lokasyon Adı zorunludur.' });
    try {
        const loc = await prisma.facilityLocation.create({
            data: { facilityId: id, name, building, floor, department, description }
        });
        res.status(201).json(loc);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Lokasyon oluşturulamadı.' });
    }
});
router.put('/:id/locations/:locationId', auth_1.authMiddleware, async (req, res) => {
    const { locationId } = req.params;
    const { building, floor, department, description, name } = req.body;
    if (!building && !name)
        return res.status(400).json({ error: 'Blok veya Lokasyon Adı zorunludur.' });
    try {
        const loc = await prisma.facilityLocation.update({
            where: { id: locationId },
            data: { name, building, floor, department, description }
        });
        res.json(loc);
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Lokasyon güncellenemedi.' });
    }
});
router.post('/:id/locations/rename-node', auth_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { level, oldValue, newValue, parentBuilding, parentFloor } = req.body;
    if (!newValue || newValue.trim() === '')
        return res.status(400).json({ error: 'Yeni isim boş olamaz.' });
    try {
        let whereClause = { facilityId: id };
        let dataClause = {};
        const cleanOld = oldValue.startsWith('Belirtilmemiş') ? '' : oldValue;
        const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
        const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;
        if (level === 'building') {
            whereClause.building = cleanOld;
            dataClause.building = newValue;
        }
        else if (level === 'floor') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanOld;
            dataClause.floor = newValue;
        }
        else if (level === 'department') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanPF;
            whereClause.department = cleanOld;
            dataClause.department = newValue;
        }
        else {
            return res.status(400).json({ error: 'Geçersiz seviye.' });
        }
        await prisma.facilityLocation.updateMany({
            where: whereClause,
            data: dataClause
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'İsim güncellenemedi.' });
    }
});
router.post('/:id/locations/delete-node', auth_1.authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { level, value, parentBuilding, parentFloor } = req.body;
    try {
        let whereClause = { facilityId: id };
        let dataClause = {};
        const cleanVal = value.startsWith('Belirtilmemiş') ? '' : value;
        const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
        const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;
        if (level === 'building') {
            whereClause.building = cleanVal;
            dataClause.building = '';
        }
        else if (level === 'floor') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanVal;
            dataClause.floor = '';
        }
        else if (level === 'department') {
            whereClause.building = cleanPB;
            whereClause.floor = cleanPF;
            whereClause.department = cleanVal;
            dataClause.department = '';
        }
        else {
            return res.status(400).json({ error: 'Geçersiz seviye.' });
        }
        await prisma.facilityLocation.updateMany({
            where: whereClause,
            data: dataClause
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Düğüm silinemedi.' });
    }
});
router.delete('/:id/locations/:locationId', auth_1.authMiddleware, async (req, res) => {
    const { locationId } = req.params;
    try {
        await prisma.facilityLocation.delete({
            where: { id: locationId }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Lokasyon silinemedi.' });
    }
});
exports.default = router;
