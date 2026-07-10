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
        const { facilityId } = req.query;
        if (!facilityId)
            return res.status(400).json({ error: 'facilityId gerekli.' });
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const locations = await prisma.facilityLocation.findMany({
            where: { facilityId: facilityId },
            include: {
                _count: { select: { risks: true } },
                risks: {
                    select: { status: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        const withStats = locations.map((d) => {
            const statusMap = {};
            d.risks.forEach((r) => {
                statusMap[r.status] = (statusMap[r.status] || 0) + 1;
            });
            return {
                id: d.id,
                facilityId: d.facilityId,
                name: d.name,
                riskCount: d._count.risks,
                areas: [],
                stats: {
                    acik: statusMap['ACIK_TEHLIKE'] || 0,
                    mudahale: statusMap['ILK_MUDAHALE_EDILDI'] || 0,
                    takip: statusMap['TAKIP_SURECINDE'] || 0,
                    kapali: statusMap['KAPATILDI_GUVENLI'] || 0,
                },
            };
        });
        res.json(withStats);
    }
    catch (error) {
        console.error('Risk departments error:', error);
        res.status(500).json({ error: 'Departmanlar alınamadı.' });
    }
});
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = req.params.id;
        const dept = await prisma.facilityLocation.findUnique({
            where: { id },
            include: { facility: true }
        });
        if (!dept)
            return res.status(404).json({ error: 'Lokasyon bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        res.json(dept);
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
