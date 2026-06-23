"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const buildManagementService_1 = require("../services/buildManagementService");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Tüm router isteklerinde token doğrulaması yapıyoruz
router.use(auth_1.authMiddleware);
// --- PROJELER ---
// Tüm projeleri getir
router.get('/projects', async (req, res) => {
    try {
        const facilityId = req.user?.facilityId || req.query.facilityId;
        // Eğer tesis ID bulamadıysa, tüm tesisleri getirebiliriz (admin ise vs.)
        const whereClause = facilityId ? { facilityId } : {};
        const projects = await prisma.buildProject.findMany({
            where: whereClause,
            orderBy: { createdAt: 'desc' },
            include: {
                creator: { select: { fullName: true } }
            }
        });
        res.json(projects);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Projeler getirilirken bir hata oluştu' });
    }
});
// Proje oluştur
router.post('/projects', async (req, res) => {
    try {
        const { facilityId, name, location, floor, department, workType, buildType, riskGroup, plannedStartDate, plannedEndDate, contractorCompany, projectManager, description } = req.body;
        if (!facilityId || !name || !workType || !buildType || !riskGroup) {
            return res.status(400).json({ error: 'Eksik bilgi' });
        }
        const createdById = req.user?.username || '';
        const project = await (0, buildManagementService_1.createProject)(req.body, createdById);
        // Başlangıç durumunda boş bir ICRA kaydı da oluşturalım
        await prisma.buildICRA.create({
            data: {
                projectId: project.id,
                calculatedClass: project.icraClass,
                precautions: []
            }
        });
        res.status(201).json(project);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Proje oluşturulurken bir hata oluştu' });
    }
});
// Proje detay getir
router.get('/projects/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const project = await prisma.buildProject.findUnique({
            where: { id: id },
            include: {
                designForm: true,
                riskAssessment: true,
                icra: true,
                approvals: true,
                documents: true,
                permits: true,
                handover: true,
                inspectionsOHS: true,
                inspectionsInfection: true,
                findings: { include: { actions: true } }
            }
        });
        if (!project)
            return res.status(404).json({ error: 'Proje bulunamadı' });
        // Gate Check yapıp duruma göre response a ekleyelim
        const gateCheck = await (0, buildManagementService_1.checkProjectGate)(id);
        res.json({ ...project, gateCheck });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Proje detayı getirilirken hata oluştu' });
    }
});
// Proje durumu güncelle
router.patch('/projects/:id/status', async (req, res) => {
    try {
        const { id } = req.params;
        const { status } = req.body;
        if (status === 'Başlamaya Uygun') {
            const gateCheck = await (0, buildManagementService_1.checkProjectGate)(id);
            if (!gateCheck.canStart) {
                // Durumu zorla "Başlatılamaz" yapalım eksik varsa
                await prisma.buildProject.update({ where: { id: id }, data: { status: 'Başlatılamaz' } });
                return res.status(400).json({ error: 'Kritik iş kuralları sağlanmadı. Eksik onay/evrak var.', gateCheck });
            }
        }
        if (status === 'Tamamlandı' || status === 'Teslim Edildi') {
            const gateCheck = await (0, buildManagementService_1.checkProjectGate)(id);
            if (!gateCheck.canHandover) {
                return res.status(400).json({ error: 'Teslim alma kuralları sağlanmadı. Eksik onay/aksiyon var.', gateCheck });
            }
        }
        const updated = await prisma.buildProject.update({
            where: { id: id },
            data: { status: status }
        });
        res.json(updated);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Proje durumu güncellenemedi' });
    }
});
// --- FORMLAR VE DEĞERLENDİRMELER ---
// Risk Değerlendirmesi Ekle/Güncelle
router.post('/projects/:id/risk-assessment', async (req, res) => {
    try {
        const { id } = req.params;
        const { score, level } = (0, buildManagementService_1.calculateRiskScoreAndLevel)(req.body);
        const assessment = await prisma.buildRiskAssessment.upsert({
            where: { projectId: id },
            update: { ...req.body, riskScore: score, riskLevel: level },
            create: { projectId: id, ...req.body, riskScore: score, riskLevel: level }
        });
        res.json(assessment);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Risk değerlendirmesi kaydedilemedi' });
    }
});
// Hizmet Tasarım Formu Ekle/Güncelle
router.post('/projects/:id/design-form', async (req, res) => {
    try {
        const { id } = req.params;
        const form = await prisma.buildDesignForm.upsert({
            where: { projectId: id },
            update: { ...req.body },
            create: { projectId: id, ...req.body }
        });
        res.json(form);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tasarım formu kaydedilemedi' });
    }
});
exports.default = router;
