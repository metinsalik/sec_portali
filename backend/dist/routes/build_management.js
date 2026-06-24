"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const multer_1 = __importDefault(require("multer"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const buildManagementService_1 = require("../services/buildManagementService");
const auth_1 = require("../middleware/auth");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
const uploadDir = path_1.default.join(__dirname, '../../uploads/build');
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const ext = path_1.default.extname(file.originalname);
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + ext);
    }
});
const upload = (0, multer_1.default)({ storage });
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
                creator: { select: { fullName: true } },
                location: true,
                workType: true,
                contractor: true
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
        const { facilityId, name, locationId, workTypeId, contractorId, buildType, riskGroup, plannedStartDate, plannedEndDate, projectManager, description } = req.body;
        if (!facilityId || !name || !workTypeId || !buildType || !riskGroup) {
            return res.status(400).json({ error: 'Eksik bilgi' });
        }
        const createdById = req.user?.username || '';
        const project = await (0, buildManagementService_1.createProject)(req.body, createdById);
        // Başlangıç durumunda boş bir ICRA kaydı da oluşturalım
        await prisma.buildICRA.create({
            data: {
                projectId: project.id,
                calculatedClass: project.icraClass || 'Belirsiz',
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
                creator: { select: { fullName: true } },
                location: true,
                workType: true,
                contractor: true,
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
// --- HİZMET TASARIM FORMU ---
// Tasarım formu getir
router.get('/projects/:id/design-form', async (req, res) => {
    try {
        const { id } = req.params;
        const form = await prisma.buildDesignForm.findUnique({
            where: { projectId: id }
        });
        // Eğer form yoksa 404 dönebilir veya boş dönebilir, UI boş olduğunu anlayıp dolduracak
        res.json(form);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tasarım formu getirilirken hata oluştu' });
    }
});
// Tasarım formu kaydet / güncelle
router.post('/projects/:id/design-form', async (req, res) => {
    try {
        const { id } = req.params;
        const data = req.body;
        const form = await prisma.buildDesignForm.upsert({
            where: { projectId: id },
            update: {
                formType: data.formType || 'Tasarım',
                formDate: new Date(data.formDate),
                description: data.description,
                requester: data.requester,
                projectSponsor: data.projectSponsor,
                notes: data.notes,
                relatedDepartments: data.relatedDepartments, // JSON.stringify edilmiş array veya comma-separated string olabilir
                projectManager: data.projectManager,
                otherTeamMembers: data.otherTeamMembers,
                projectGoal: data.projectGoal,
                projectPlan: data.projectPlan,
                inputs: data.inputs,
                outputs: data.outputs,
                verification: data.verification,
                review: data.review,
                validityCheck: data.validityCheck,
                validityStudies: data.validityStudies,
                postServiceValidity: data.postServiceValidity,
                changeControl: data.changeControl
            },
            create: {
                projectId: id,
                formType: data.formType || 'Tasarım',
                formDate: new Date(data.formDate),
                description: data.description,
                requester: data.requester,
                projectSponsor: data.projectSponsor,
                notes: data.notes,
                relatedDepartments: data.relatedDepartments,
                projectManager: data.projectManager,
                otherTeamMembers: data.otherTeamMembers,
                projectGoal: data.projectGoal,
                projectPlan: data.projectPlan,
                inputs: data.inputs,
                outputs: data.outputs,
                verification: data.verification,
                review: data.review,
                validityCheck: data.validityCheck,
                validityStudies: data.validityStudies,
                postServiceValidity: data.postServiceValidity,
                changeControl: data.changeControl
            }
        });
        res.json(form);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Tasarım formu kaydedilirken hata oluştu' });
    }
});
// --- DOKÜMANLAR ---
// Doküman yükle
router.post('/projects/:id/documents', upload.single('file'), async (req, res) => {
    try {
        const { id } = req.params;
        const { documentType, status } = req.body;
        if (!req.file) {
            return res.status(400).json({ error: 'Dosya yüklenmedi' });
        }
        const fileUrl = `/uploads/build/${req.file.filename}`;
        const document = await prisma.buildDocument.create({
            data: {
                projectId: id,
                documentType: documentType || 'Diğer',
                name: req.file.originalname,
                fileUrl,
                uploadedBy: req.user?.username,
                status: status || 'Yüklendi'
            }
        });
        res.status(201).json(document);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Doküman yüklenirken hata oluştu' });
    }
});
// Dokümanları getir
router.get('/projects/:id/documents', async (req, res) => {
    try {
        const { id } = req.params;
        const docs = await prisma.buildDocument.findMany({
            where: { projectId: id },
            orderBy: { createdAt: 'desc' },
            include: { uploader: { select: { fullName: true } } }
        });
        res.json(docs);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Dokümanlar getirilemedi' });
    }
});
exports.default = router;
