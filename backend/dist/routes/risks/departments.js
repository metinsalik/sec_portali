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
// Helper to check facility access
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
// Helper to generate a 3-letter code from a department name
function generateDeptCode(name) {
    const charMap = {
        'ı': 'i', 'i': 'i', 'ş': 's', 'ğ': 'g', 'ü': 'u', 'ö': 'o', 'ç': 'c',
        'I': 'I', 'İ': 'I', 'Ş': 'S', 'Ğ': 'G', 'Ü': 'U', 'Ö': 'O', 'Ç': 'C'
    };
    const str = name.replace(/[ıişğüöçIİŞĞÜÖÇ]/g, (m) => charMap[m]);
    return str.replace(/[^a-zA-Z]/g, '').substring(0, 3).toUpperCase() || 'GEN';
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
        const departments = await prisma.riskDepartment.findMany({
            where: { facilityId: facilityId },
            include: {
                _count: { select: { risks: true } },
                risks: {
                    select: { status: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        const withStats = departments.map((d) => {
            const statusMap = {};
            d.risks.forEach((r) => {
                statusMap[r.status] = (statusMap[r.status] || 0) + 1;
            });
            return {
                id: d.id,
                facilityId: d.facilityId,
                name: d.name,
                riskCount: d._count.risks,
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
// GET /api/risks/departments/:id
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dept = await prisma.riskDepartment.findUnique({ where: { id } });
        if (!dept)
            return res.status(404).json({ error: 'Departman bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        res.json(dept);
    }
    catch (error) {
        console.error('Get department by id error:', error);
        res.status(500).json({ error: 'Departman alınamadı.' });
    }
});
// POST /api/risks/departments — yeni departman oluştur
router.post('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId, name } = req.body;
        if (!facilityId || !name)
            return res.status(400).json({ error: 'facilityId ve name gerekli.' });
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const existing = await prisma.riskDepartment.findUnique({
            where: { facilityId_name: { facilityId, name } },
        });
        if (existing)
            return res.status(409).json({ error: 'Bu departman zaten mevcut.' });
        const dept = await prisma.riskDepartment.create({
            data: { facilityId, name, code: generateDeptCode(name) },
        });
        res.status(201).json(dept);
    }
    catch (error) {
        console.error('Risk department create error:', error);
        res.status(500).json({ error: 'Departman oluşturulamadı.' });
    }
});
// PUT /api/risks/departments/:id
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        const dept = await prisma.riskDepartment.findUnique({ where: { id } });
        if (!dept)
            return res.status(404).json({ error: 'Departman bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const updatedDept = await prisma.riskDepartment.update({
            where: { id },
            data: { name, code: generateDeptCode(name) },
        });
        res.json(updatedDept);
    }
    catch (error) {
        res.status(500).json({ error: 'Departman güncellenemedi.' });
    }
});
// DELETE /api/risks/departments/:id
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dept = await prisma.riskDepartment.findUnique({ where: { id } });
        if (!dept)
            return res.status(404).json({ error: 'Departman bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        await prisma.riskDepartment.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: 'Departman silinemedi.' });
    }
});
exports.default = router;
