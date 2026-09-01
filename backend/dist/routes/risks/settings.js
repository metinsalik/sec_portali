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
// Default initializer helper
async function initializeFacilityRiskSettings(facilityId) {
    const deptCount = await prisma.riskDepartmentSetting.count({ where: { facilityId } });
    const hdeptCount = await prisma.facilityLocation.count({ where: { facilityId } });
    if (deptCount > 0 || hdeptCount > 0) {
        return;
    }
    // 1. Default Hastane Bölümleri (RiskDepartment)
    const defaultHospitalDepts = ['Acil Servis', 'Yatan Hasta Servisi', 'Yetişkin Yoğun Bakım'];
    for (const name of defaultHospitalDepts) {
        await prisma.facilityLocation.upsert({
            where: { facilityId_name: { facilityId, name } },
            update: {},
            create: { facilityId, name, code: generateDeptCode(name) }
        });
    }
    // 2. Default Departmanlar (RiskDepartmentSetting)
    const defaultDepts = [
        'Başhekimlik',
        'Bilgi Sistemleri Müdürlüğü',
        'Biyomedikal Müdürlüğü',
        'Hasta Bakım Hizmetleri Müdürlüğü',
        'İnsan Kaynakları Müdürlüğü',
        'İş Sağlığı ve Güvenliği',
        'Kalite Müdürlüğü',
        'Misafir Hizmetleri Müdürlüğü',
        'Otelcilik ve Destek Hizmetleri Müdürlüğü',
        'Teknik Hizmetler Müdürlüğü',
        'Satınalma Müdürlüğü',
        'Üst Yönetim',
        'Diğer'
    ];
    for (const name of defaultDepts) {
        await prisma.riskDepartmentSetting.upsert({
            where: { facilityId_name: { facilityId, name } },
            update: {},
            create: { facilityId, name }
        });
    }
    // 3. Default Kategoriler ve Alt Kategoriler
}
// GET /api/risks/settings?facilityId=xxx
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId } = req.query;
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId gereklidir.' });
        }
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        // Initialize defaults if they don't exist yet
        await initializeFacilityRiskSettings(facilityId);
        const [departments] = await Promise.all([
            prisma.riskDepartmentSetting.findMany({
                where: { facilityId: facilityId },
                orderBy: { name: 'asc' }
            })
        ]);
        res.json({
            departments
        });
    }
    catch (error) {
        console.error('Get settings error:', error);
        res.status(500).json({ error: 'Ayarlar yüklenemedi.' });
    }
});
// POST /api/risks/settings/departments
router.post('/departments', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId, name } = req.body;
        if (!facilityId || !name) {
            return res.status(400).json({ error: 'facilityId ve name gereklidir.' });
        }
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const existing = await prisma.riskDepartmentSetting.findUnique({
            where: { facilityId_name: { facilityId, name } }
        });
        if (existing) {
            return res.status(400).json({ error: 'Bu departman zaten mevcut.' });
        }
        const dept = await prisma.riskDepartmentSetting.create({
            data: { facilityId, name }
        });
        res.status(201).json(dept);
    }
    catch (error) {
        console.error('Create department setting error:', error);
        res.status(500).json({ error: 'Departman eklenemedi.' });
    }
});
// PUT /api/risks/settings/departments/:id
router.put('/departments/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const { name } = req.body;
        if (!name) {
            return res.status(400).json({ error: 'name gereklidir.' });
        }
        const dept = await prisma.riskDepartmentSetting.findUnique({ where: { id } });
        if (!dept)
            return res.status(404).json({ error: 'Departman bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const updated = await prisma.riskDepartmentSetting.update({
            where: { id },
            data: { name }
        });
        res.json(updated);
    }
    catch (error) {
        console.error('Update department setting error:', error);
        res.status(500).json({ error: 'Departman güncellenemedi.' });
    }
});
// DELETE /api/risks/settings/departments/:id
router.delete('/departments/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const id = parseInt(req.params.id);
        const dept = await prisma.riskDepartmentSetting.findUnique({ where: { id } });
        if (!dept)
            return res.status(404).json({ error: 'Departman bulunamadı.' });
        const hasAccess = await checkFacilityAccess(req, dept.facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        await prisma.riskDepartmentSetting.delete({ where: { id } });
        res.json({ success: true });
    }
    catch (error) {
        console.error('Delete department setting error:', error);
        res.status(500).json({ error: 'Departman silinemedi.' });
    }
});
// POST /api/risks/settings/categories
exports.default = router;
