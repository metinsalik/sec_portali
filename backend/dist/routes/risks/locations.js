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
async function checkFacilityAccess(req, facilityId) {
    const user = req.user;
    if (!user)
        return false;
    if (user.isAdmin || user.isManagement)
        return true;
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
// GET /api/risks/departments?facilityId=xxx
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const facilityId = req.query.facilityId;
        const flat = req.query.flat === 'true';
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId zorunludur.' });
        }
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const locations = await prisma.facilityLocation.findMany({
            where: { facilityId: facilityId },
            include: {
                risks: {
                    select: { status: true },
                },
            },
        });
        const mapped = locations.map(loc => {
            let riskCount = loc.risks.length;
            let stats = { acik: 0, mudahale: 0, takip: 0, kapali: 0 };
            loc.risks.forEach((r) => {
                if (r.status === 'ACIK_TEHLIKE')
                    stats.acik++;
                if (r.status === 'ILK_MUDAHALE_EDILDI')
                    stats.mudahale++;
                if (r.status === 'TAKIP_SURECINDE')
                    stats.takip++;
                if (r.status === 'KAPATILDI_GUVENLI')
                    stats.kapali++;
            });
            return { ...loc, riskCount, stats };
        });
        res.json(mapped);
    }
    catch (error) {
        console.error('Risk locations error:', error);
        res.status(500).json({ error: 'Lokasyonlar alınamadı.' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const dept = await prisma.facilityLocation.findUnique({
            where: { id },
            include: {
                facility: {
                    include: {
                        assignments: {
                            include: {
                                professional: true,
                                employerRep: true,
                            }
                        }
                    }
                }
            }
        });
        if (!dept)
            return res.status(404).json({ error: 'Lokasyon bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        res.json({
            ...dept,
            name: dept.department || dept.floor || dept.building || dept.name || 'Lokasyon'
        });
    }
    catch (error) {
        res.status(500).json({ error: 'Lokasyon alınamadı.' });
    }
});
// We disable areas for now
router.post('/areas', auth_1.authMiddleware, async (req, res) => {
    res.status(400).json({ error: 'Alan yönetimi artık Merkezi Lokasyon modülünden yapılmaktadır.' });
});
router.put('/areas/:id', auth_1.authMiddleware, async (req, res) => {
    res.status(400).json({ error: 'Alan yönetimi artık Merkezi Lokasyon modülünden yapılmaktadır.' });
});
router.delete('/areas/:id', auth_1.authMiddleware, async (req, res) => {
    res.status(400).json({ error: 'Alan yönetimi artık Merkezi Lokasyon modülünden yapılmaktadır.' });
});
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId, name } = req.body;
        if (!facilityId || !name)
            return res.status(400).json({ error: 'facilityId ve name gerekli.' });
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess)
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        const existing = await prisma.facilityLocation.findFirst({
            where: { facilityId, name: { equals: name.trim(), mode: 'insensitive' } },
        });
        if (existing)
            return res.status(409).json({ error: 'Bu lokasyon zaten mevcut.' });
        const dept = await prisma.facilityLocation.create({
            data: { facilityId, name: name.trim() },
        });
        res.status(201).json(dept);
    }
    catch (error) {
        res.status(500).json({ error: 'Lokasyon oluşturulamadı.' });
    }
});
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const { name } = req.body;
        const dept = await prisma.facilityLocation.findUnique({ where: { id } });
        if (!dept)
            return res.status(404).json({ error: 'Lokasyon bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess)
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        const updatedDept = await prisma.facilityLocation.update({
            where: { id },
            data: { name },
        });
        res.json(updatedDept);
    }
    catch (error) {
        res.status(500).json({ error: 'Lokasyon güncellenemedi.' });
    }
});
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const dept = await prisma.facilityLocation.findUnique({ where: { id } });
        if (!dept)
            return res.status(404).json({ error: 'Lokasyon bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess)
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        await prisma.facilityLocation.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Lokasyon silinemedi.' });
    }
});
exports.default = router;
