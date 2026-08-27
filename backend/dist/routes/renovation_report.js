"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
// Setup Multer for image uploads
const uploadDir = path_1.default.join(__dirname, '../../uploads/integrated_audits');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        cb(null, `audit-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({ storage });
// Upload files for findings/actions (Option 1: Upload immediately)
router.post('/upload', auth_1.authMiddleware, upload.array('files', 20), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }
        const files = req.files;
        // Return array of objects with url, name, type matching the frontend
        const uploadedFiles = files.map(file => ({
            name: file.originalname,
            url: `/uploads/integrated_audits/${file.filename}`,
            type: file.mimetype,
            size: file.size
        }));
        res.json(uploadedFiles);
    }
    catch (error) {
        console.error('Upload Error:', error);
        res.status(500).json({ error: 'Dosya yükleme başarısız.' });
    }
});
// Get all audits (optionally filtered by facility)
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
    const isManager = req.user?.isAdmin || req.user?.isManagement;
    try {
        const whereClause = {};
        if (facilityId)
            whereClause.facilityId = facilityId;
        if (!isManager)
            whereClause.status = { not: 'DRAFT' };
        const audits = await prisma.integratedAudit.findMany({
            where: Object.keys(whereClause).length > 0 ? whereClause : undefined,
            include: {
                findings: {
                    include: {
                        actions: {
                            include: { files: true }
                        },
                        files: true
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });
        res.json(audits);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Denetimler alınamadı.' });
    }
});
// Create or update a report (we use a bulk save approach since it's a complex object)
router.post('/save', auth_1.authMiddleware, async (req, res) => {
    const { id, facilityId, status, saved, meta, team, findings } = req.body;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId zorunludur' });
    try {
        const result = await prisma.$transaction(async (tx) => {
            // Create or update the main audit
            const auditData = {
                facilityId,
                status: status || 'DRAFT',
                saved: saved === undefined ? true : saved,
                round: meta.round || 1,
                startDate: meta.start ? new Date(meta.start) : new Date(),
                endDate: meta.end ? new Date(meta.end) : new Date(),
                reportDate: meta.reportDate ? new Date(meta.reportDate) : new Date(),
                reportNo: meta.reportNo || '',
                reporter: meta.reporter || '',
                auditStatus: meta.auditStatus || 'Devam Ediyor',
                purpose: meta.purpose || '',
                executive: meta.executive || '',
                conclusion: meta.conclusion || '',
                team: meta.team || [],
                participants: meta.participants || [],
                criteria: meta.criteria || []
            };
            let auditId = id;
            if (!id || id.startsWith('draft_')) {
                // Create new
                const createdAudit = await tx.integratedAudit.create({
                    data: { ...auditData }
                });
                auditId = createdAudit.id;
            }
            else {
                // Update existing
                await tx.integratedAudit.update({
                    where: { id },
                    data: auditData
                });
                // Delete all existing relations so we can recreate them clean (team, findings, actions, files)
                // Cascade delete on findings will delete actions and finding files. Team is deleted separately.
                await tx.integratedFinding.deleteMany({ where: { auditId } });
            }
            // 2. Create Findings
            if (findings && findings.length > 0) {
                for (const finding of findings) {
                    const createdFinding = await tx.integratedFinding.create({
                        data: {
                            auditId,
                            no: finding.no,
                            area: finding.area,
                            subarea: finding.subarea || null,
                            category: finding.category,
                            subcategory: finding.subcategory || null,
                            risk: finding.risk,
                            targetDate: finding.targetDate ? new Date(finding.targetDate) : null,
                            isStarted: finding.isStarted || false,
                            residualRisk: finding.residualRisk || null,
                            riskReasoning: finding.riskReasoning || null,
                            findingDesc: finding.findingDesc || '',
                            riskDesc: finding.riskDesc || '',
                            recommendation: finding.recommendation || '',
                            status: finding.status,
                            history: finding.history || null,
                            departments: finding.departments || [],
                        }
                    });
                    // Finding Files
                    if (finding.files && finding.files.length > 0) {
                        await tx.integratedFile.createMany({
                            data: finding.files.map((f) => ({
                                findingId: createdFinding.id,
                                name: f.name || 'dosya',
                                url: f.url,
                                type: f.type || 'unknown'
                            }))
                        });
                    }
                    // 3. Actions
                    if (finding.steps && finding.steps.length > 0) {
                        for (const step of finding.steps) {
                            const createdAction = await tx.integratedAction.create({
                                data: {
                                    findingId: createdFinding.id,
                                    department: step.department,
                                    order: step.order || 1,
                                    status: step.status,
                                    actionDate: step.actionDate ? new Date(step.actionDate) : null,
                                    title: step.title || null,
                                    explanation: step.explanation || null,
                                    completedAt: step.completedAt ? new Date(step.completedAt) : null,
                                }
                            });
                            // Action Files
                            if (step.files && step.files.length > 0) {
                                await tx.integratedFile.createMany({
                                    data: step.files.map((f) => ({
                                        actionId: createdAction.id,
                                        name: f.name || 'dosya',
                                        url: f.url,
                                        type: f.type || 'unknown'
                                    }))
                                });
                            }
                        }
                    }
                }
            }
            // Fetch the full constructed audit
            const completeAudit = await tx.integratedAudit.findUnique({
                where: { id: auditId },
                include: {
                    findings: {
                        include: {
                            actions: { include: { files: true } },
                            files: true
                        }
                    }
                }
            });
            return completeAudit;
        });
        res.status(200).json(result);
    }
    catch (err) {
        console.error('Save Audit Error:', err);
        res.status(500).json({ error: 'Rapor kaydedilemedi.' });
    }
});
// Delete a report
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.integratedAudit.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Rapor silinemedi.' });
    }
});
// Get Renovation Report Settings
router.get('/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        let settings = await prisma.renovationReportSetting.findUnique({
            where: { id: 'default' }
        });
        if (!settings) {
            settings = await prisma.renovationReportSetting.create({
                data: {
                    id: 'default',
                    categories: [],
                    departments: [],
                    areas: [],
                    criteria: []
                }
            });
        }
        res.json(settings);
    }
    catch (err) {
        console.error('Get Settings Error:', err);
        res.status(500).json({ error: 'Ayarlar alınamadı.' });
    }
});
// Update Renovation Report Settings
router.post('/settings', auth_1.authMiddleware, async (req, res) => {
    try {
        const { categories, departments, areas, criteria } = req.body;
        const settings = await prisma.renovationReportSetting.upsert({
            where: { id: 'default' },
            update: {
                categories: categories || [],
                departments: departments || [],
                areas: areas || [],
                criteria: criteria || []
            },
            create: {
                id: 'default',
                categories: categories || [],
                departments: departments || [],
                areas: areas || [],
                criteria: criteria || []
            }
        });
        res.json(settings);
    }
    catch (err) {
        console.error('Update Settings Error:', err);
        res.status(500).json({ error: 'Ayarlar kaydedilemedi.' });
    }
});
exports.default = router;
