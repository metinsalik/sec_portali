"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FMS_PROGRAMS = void 0;
exports.suggestFmsProgram = suggestFmsProgram;
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
// FMS.02.00 8 Program Sabitleri
exports.FMS_PROGRAMS = [
    'Güvenlik',
    'Emniyet',
    'Tehlikeli maddeler ve atıklar',
    'Yangın Güvenliği',
    'Tıbbi Cihazlar',
    'Altyapı Sistemleri',
    'Acil durum ve afet yönetimi',
    'İnşaat ve renovasyon'
];
// Otomatik FMS Program Tahmin Fonksiyonu
function suggestFmsProgram(categoryName, subCategoryName) {
    const text = `${categoryName} ${subCategoryName || ''}`.toLowerCase();
    if (/yangın|itfaiye|sprinkler|duman|flasor|flasör|yangin|söndürme|tüpü|hidrant|perde|kaçış/i.test(text)) {
        return 'Yangın Güvenliği';
    }
    if (/tıbbi atık|atık|kimyasal|radyasyon|biyolojik|tehlikeli|msds|asit|solvent|ilaç|zehir/i.test(text)) {
        return 'Tehlikeli maddeler ve atıklar';
    }
    if (/tıbbi cihaz|cihaz|biyomedikal|ventilatör|monitör|defibrilatör|kalibrasyon|sterilizatör/i.test(text)) {
        return 'Tıbbi Cihazlar';
    }
    if (/elektrik|pano|trafo|jeneratör|ups|kesintisiz|hvac|havalandırma|iklimlendirme|asansör|su deposu|kazan|tesisat|altyapı|mekanik/i.test(text)) {
        return 'Altyapı Sistemleri';
    }
    if (/inşaat|tadilat|renovasyon|şantiye|yıkım|toz|pcra|kazı|iskele|boya/i.test(text)) {
        return 'İnşaat ve renovasyon';
    }
    if (/afet|acil durum|tahliye|deprem|tatbikat|sel|kriz|toplanma/i.test(text)) {
        return 'Acil durum ve afet yönetimi';
    }
    if (/güvenlik|kamera|cctv|fiziki güvenlik|bekçi|nizamiye|kartlı|turnike|saldırı|hırsızlık/i.test(text)) {
        return 'Güvenlik';
    }
    return 'Emniyet';
}
// GET /api/risks/settings/fms-categories?facilityId=xxx
// Tesisin mevcut kategorilerini ve risk sayılarını FMS önerisiyle listeler
router.get('/fms-categories', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId } = req.query;
        if (!facilityId)
            return res.status(400).json({ error: 'facilityId gereklidir.' });
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess)
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        // Tesisin lokasyonlarına bağlı riskleri çek
        const risks = await prisma.riskLifecycle.findMany({
            where: { location: { facilityId } },
            select: { riskCategory: true, subCategory: true, fmsProgram: true }
        });
        const categoryMap = {};
        risks.forEach(r => {
            const cat = (r.riskCategory || 'Genel').trim();
            if (!categoryMap[cat]) {
                categoryMap[cat] = {
                    category: cat,
                    riskCount: 0,
                    currentFmsProgram: r.fmsProgram || null,
                    suggestedFmsProgram: r.fmsProgram || suggestFmsProgram(cat, r.subCategory)
                };
            }
            categoryMap[cat].riskCount += 1;
            if (r.fmsProgram && !categoryMap[cat].currentFmsProgram) {
                categoryMap[cat].currentFmsProgram = r.fmsProgram;
            }
        });
        res.json({
            categories: Object.values(categoryMap),
            fmsPrograms: exports.FMS_PROGRAMS
        });
    }
    catch (error) {
        console.error('Get FMS categories error:', error);
        res.status(500).json({ error: 'Kategoriler listelenemedi.' });
    }
});
// POST /api/risks/settings/fms-map
// Kategori bazında veya tekil olarak toplu FMS Programı ataması yapar
router.post('/fms-map', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId, mappings } = req.body;
        if (!facilityId || !Array.isArray(mappings) || mappings.length === 0) {
            return res.status(400).json({ error: 'facilityId ve mappings listesi zorunludur.' });
        }
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess)
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        let totalUpdated = 0;
        for (const item of mappings) {
            if (!item.category || !item.fmsProgram)
                continue;
            const result = await prisma.riskLifecycle.updateMany({
                where: {
                    location: { facilityId },
                    riskCategory: { equals: item.category.trim(), mode: 'insensitive' }
                },
                data: {
                    fmsProgram: item.fmsProgram
                }
            });
            totalUpdated += result.count;
            // RiskCategorySetting varsa onu da güncelle
            await prisma.riskCategorySetting.updateMany({
                where: {
                    facilityId,
                    name: { equals: item.category.trim(), mode: 'insensitive' }
                },
                data: {
                    fmsProgram: item.fmsProgram
                }
            });
        }
        res.json({
            success: true,
            message: `${totalUpdated} adet risk kaydı başarıyla FMS.02 programlarıyla eşleştirildi.`,
            totalUpdated
        });
    }
    catch (error) {
        console.error('FMS map error:', error);
        res.status(500).json({ error: 'FMS eşleştirmesi yapılırken hata oluştu.' });
    }
});
exports.default = router;
