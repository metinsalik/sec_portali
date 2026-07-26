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
const uploadDir = path_1.default.join(__dirname, '../../uploads/renovation');
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
        cb(null, `renovation-${uniqueSuffix}${ext}`);
    }
});
const upload = (0, multer_1.default)({ storage });
// Get all reports for a facility
router.get('/', auth_1.authMiddleware, async (req, res) => {
    const { facilityId } = req.query;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId zorunludur' });
    try {
        const reports = await prisma.renovationReport.findMany({
            where: { facilityId },
            orderBy: { createdAt: 'desc' }
        });
        res.json(reports);
    }
    catch (err) {
        res.status(500).json({ error: 'Raporlar alınamadı.' });
    }
});
// Get a single report
router.get('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        const report = await prisma.renovationReport.findUnique({
            where: { id: req.params.id }
        });
        if (!report)
            return res.status(404).json({ error: 'Rapor bulunamadı.' });
        res.json(report);
    }
    catch (err) {
        res.status(500).json({ error: 'Rapor alınamadı.' });
    }
});
// Create a new report
router.post('/', auth_1.authMiddleware, async (req, res) => {
    const { facilityId, projectName, location, startDate, endDate, controlledBy, assessmentDate, reportDate, status, checks, tests, certificates, findings, evaluation } = req.body;
    if (!facilityId)
        return res.status(400).json({ error: 'facilityId zorunludur' });
    try {
        const report = await prisma.renovationReport.create({
            data: {
                facilityId,
                projectName: projectName || '',
                location: location || '',
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                controlledBy: controlledBy || '',
                assessmentDate: assessmentDate ? new Date(assessmentDate) : null,
                reportDate: reportDate ? new Date(reportDate) : null,
                status: status || 'DRAFT',
                checks: checks || [],
                tests: tests || [],
                certificates: certificates || [],
                findings: findings || {},
                evaluation: evaluation || {},
                createdBy: req.user?.username || 'system'
            }
        });
        res.status(201).json(report);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Rapor oluşturulamadı.' });
    }
});
// Update a report
router.put('/:id', auth_1.authMiddleware, async (req, res) => {
    const { projectName, location, startDate, endDate, controlledBy, assessmentDate, reportDate, status, checks, tests, certificates, findings, evaluation } = req.body;
    try {
        const report = await prisma.renovationReport.update({
            where: { id: req.params.id },
            data: {
                projectName,
                location,
                startDate: startDate ? new Date(startDate) : null,
                endDate: endDate ? new Date(endDate) : null,
                controlledBy,
                assessmentDate: assessmentDate ? new Date(assessmentDate) : null,
                reportDate: reportDate ? new Date(reportDate) : null,
                status,
                checks: checks !== undefined ? checks : undefined,
                tests: tests !== undefined ? tests : undefined,
                certificates: certificates !== undefined ? certificates : undefined,
                findings: findings !== undefined ? findings : undefined,
                evaluation: evaluation !== undefined ? evaluation : undefined
            }
        });
        res.json(report);
    }
    catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Rapor güncellenemedi.' });
    }
});
// Delete a report
router.delete('/:id', auth_1.authMiddleware, async (req, res) => {
    try {
        await prisma.renovationReport.delete({
            where: { id: req.params.id }
        });
        res.json({ success: true });
    }
    catch (err) {
        res.status(500).json({ error: 'Rapor silinemedi.' });
    }
});
// Upload images for findings
router.post('/upload', auth_1.authMiddleware, upload.array('files', 10), async (req, res) => {
    try {
        if (!req.files || req.files.length === 0) {
            return res.status(400).json({ error: 'Dosya yüklenmedi.' });
        }
        const files = req.files;
        const urls = files.map(file => `/uploads/renovation/${file.filename}`);
        res.json({ urls });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Dosya yükleme başarısız.' });
    }
});
exports.default = router;
