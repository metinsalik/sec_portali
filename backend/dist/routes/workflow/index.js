"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const workflowAuth_1 = require("../../middleware/workflowAuth");
const workflowService_1 = require("../../services/workflowService");
const workflowRoleService_1 = require("../../services/workflowRoleService");
const categories_1 = __importDefault(require("./categories"));
const chat_1 = __importDefault(require("./chat"));
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const storage = multer_1.default.diskStorage({
    destination: (_req, _file, cb) => {
        const dir = path_1.default.join(process.cwd(), 'uploads', 'workflow');
        fs_1.default.mkdirSync(dir, { recursive: true });
        cb(null, dir);
    },
    filename: (_req, file, cb) => {
        const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${unique}${path_1.default.extname(file.originalname)}`);
    },
});
const upload = (0, multer_1.default)({
    storage,
    limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB for docs/photos
});
const router = express_1.default.Router();
router.use(auth_1.authMiddleware);
router.use('/categories', categories_1.default);
router.use('/tasks/:id/chat', chat_1.default);
// --- USERS ---
router.get('/users', async (req, res) => {
    try {
        const users = await workflowRoleService_1.workflowRoleService.getWorkflowUsers();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- TASKS ---
router.get('/dashboard/stats', async (req, res) => {
    try {
        const stats = await workflowService_1.workflowService.getDashboardStats(req.user);
        res.json(stats);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/tasks/:id', async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.updateTask(req.params.id, req.body, req.user);
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/tasks/:id/unblock', async (req, res) => {
    try {
        const { resolutionNote } = req.body;
        if (!resolutionNote)
            return res.status(400).json({ error: 'Çözüm açıklaması zorunludur' });
        const task = await workflowService_1.workflowService.unblockTask(req.params.id, req.user, resolutionNote);
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/tasks/:id', async (req, res) => {
    try {
        await workflowService_1.workflowService.deleteTask(req.params.id, req.user);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/tasks', async (req, res) => {
    try {
        const filters = req.query;
        const tasks = await workflowService_1.workflowService.getTasks(req.user, filters);
        res.json(tasks);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/tasks', (0, workflowAuth_1.requireWorkflowRole)(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.createTask(req.user, req.body);
        res.status(201).json(task);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/tasks/:id', async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.getTaskById(req.params.id);
        if (!task)
            return res.status(404).json({ error: 'Task not found' });
        res.json(task);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/tasks/:id', async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.updateTask(req.params.id, req.user, req.body);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/tasks/:id/reject', auth_1.authMiddleware, (0, workflowAuth_1.requireWorkflowRole)(['ADMIN', 'MANAGER', 'USER']), async (req, res) => {
    try {
        const { reason, stepId } = req.body;
        const task = await workflowService_1.workflowService.rejectTask(req.params.id, reason, stepId, req.user.username);
        res.json(task);
    }
    catch (err) {
        res.status(400).json({ error: err.message });
    }
});
router.patch('/tasks/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const task = await workflowService_1.workflowService.updateTaskStatus(req.params.id, req.user, status);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/tasks/:id/checklist', async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.addChecklistStep(req.params.id, req.user, req.body);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.put('/tasks/:id/checklist/:stepId', async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.updateChecklistStepDefinition(req.params.id, req.params.stepId, req.user, req.body);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.delete('/tasks/:id/checklist/:stepId', async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.deleteChecklistStep(req.params.id, req.params.stepId, req.user);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/tasks/:id/checklist/:stepId', async (req, res) => {
    try {
        const task = await workflowService_1.workflowService.updateChecklistStep(req.params.id, req.params.stepId, req.user, req.body);
        res.json(task);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/tasks/:id/checklist/:stepId/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: 'Dosya bulunamadı' });
        const evidenceUrl = `/uploads/workflow/${req.file.filename}`;
        // Yüklenen dosyayı kanıt olarak kaydetmek üzere update yapabiliriz
        // Veya sadece url dönüp frontend'in bir sonraki updateChecklistStep isteğinde göndermesini sağlayabiliriz.
        // Biz url dönelim, frontend kaydetsin.
        res.json({ url: evidenceUrl });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/tasks/:id/comments', async (req, res) => {
    try {
        const comment = await workflowService_1.workflowService.addComment(req.params.id, req.user, req.body.body);
        res.status(201).json(comment);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.post('/tasks/:id/due-requests', async (req, res) => {
    try {
        const { requestedDue, reason } = req.body;
        const reqData = await workflowService_1.workflowService.createDueRequest(req.params.id, req.user, { requestedDue: new Date(requestedDue), reason });
        res.status(201).json(reqData);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.patch('/tasks/:id/due-requests/:reqId', (0, workflowAuth_1.requireWorkflowRole)(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const { approve } = req.body;
        const status = await workflowService_1.workflowService.respondDueRequest(req.params.reqId, req.user, approve);
        res.json({ status });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// --- PLANS ---
router.put('/plans/:id', async (req, res) => {
    try {
        const data = { ...req.body };
        if (data.startDate)
            data.startDate = new Date(data.startDate);
        if (data.dueDate)
            data.dueDate = new Date(data.dueDate);
        const plan = await workflowService_1.workflowService.updatePlan(req.params.id, data, req.user);
        res.json(plan);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.delete('/plans/:id', async (req, res) => {
    try {
        await workflowService_1.workflowService.deletePlan(req.params.id, req.user);
        res.json({ success: true });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/plans', async (req, res) => {
    try {
        const plans = await workflowService_1.workflowService.getPlans(req.user, req.query);
        res.json(plans);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.get('/alerts', async (req, res) => {
    try {
        const alerts = await workflowService_1.workflowService.getAlerts(req.user);
        res.json(alerts);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.post('/plans', (0, workflowAuth_1.requireWorkflowRole)(['ADMIN', 'MANAGER']), async (req, res) => {
    try {
        const plan = await workflowService_1.workflowService.createPlan(req.user, {
            ...req.body,
            startDate: new Date(req.body.startDate),
            dueDate: new Date(req.body.dueDate)
        });
        res.status(201).json(plan);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
router.get('/plans/:id', async (req, res) => {
    try {
        const plan = await workflowService_1.workflowService.getPlanById(req.params.id);
        if (!plan)
            return res.status(404).json({ error: 'Plan not found' });
        res.json(plan);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// --- SETTINGS / ROLES ---
router.get('/settings/roles', auth_1.adminMiddleware, async (req, res) => {
    try {
        const users = await workflowRoleService_1.workflowRoleService.getWorkflowUsers();
        res.json(users);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
router.put('/settings/roles/:userId', auth_1.adminMiddleware, async (req, res) => {
    try {
        const { role } = req.body;
        const result = await workflowRoleService_1.workflowRoleService.updateUserRole(req.params.userId, role);
        res.json(result);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Transfer Görev Devri Talebi
router.post('/tasks/:id/transfer', async (req, res) => {
    try {
        const { targetUserId } = req.body;
        const request = await workflowService_1.workflowService.createTransferRequest(req.params.id, req.user, targetUserId);
        res.status(201).json(request);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
// Transfer Talebine Yanıt Verme (Kabul/Red)
router.patch('/tasks/:id/transfer/:reqId', async (req, res) => {
    try {
        const { approve } = req.body;
        const status = await workflowService_1.workflowService.respondTransferRequest(req.params.reqId, req.user, approve);
        res.json({ status });
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
