import express from 'express';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../middleware/auth';
import { requireWorkflowRole } from '../../middleware/workflowAuth';
import { workflowService } from '../../services/workflowService';
import { workflowRoleService } from '../../services/workflowRoleService';
import categoriesRouter from './categories';
import chatRouter from './chat';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'workflow');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${unique}${path.extname(file.originalname)}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 }, // 20 MB for docs/photos
});

const router = express.Router();

router.use(authMiddleware);

router.use('/categories', categoriesRouter);
router.use('/tasks/:id/chat', chatRouter);

// --- USERS ---
router.get('/users', async (req: any, res: any) => {
  try {
    const users = await workflowRoleService.getWorkflowUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// --- TASKS ---
router.get('/dashboard/stats', async (req: any, res: any) => {
  try {
    const stats = await workflowService.getDashboardStats(req.user);
    res.json(stats);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/tasks', async (req: any, res: any) => {
  try {
    const filters = req.query;
    const tasks = await workflowService.getTasks(req.user, filters);
    res.json(tasks);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/tasks', requireWorkflowRole(['ADMIN', 'MANAGER']), async (req: any, res: any) => {
  try {
    const task = await workflowService.createTask(req.user, req.body);
    res.status(201).json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/tasks/:id', async (req: any, res: any) => {
  try {
    const task = await workflowService.getTaskById(req.params.id);
    if (!task) return res.status(404).json({ error: 'Task not found' });
    res.json(task);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/tasks/:id', async (req: any, res: any) => {
  try {
    const task = await workflowService.updateTask(req.params.id, req.user, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/tasks/:id/reject', authMiddleware, requireWorkflowRole(['ADMIN', 'MANAGER', 'USER']), async (req: AuthRequest, res: any) => {
  try {
    const { reason, stepId } = req.body;
    const task = await workflowService.rejectTask(req.params.id, reason, stepId, req.user!.username);
    res.json(task);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

router.patch('/tasks/:id/status', async (req: any, res: any) => {
  try {
    const { status } = req.body;
    const task = await workflowService.updateTaskStatus(req.params.id, req.user, status);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});


router.post('/tasks/:id/checklist', async (req: any, res: any) => {
  try {
    const task = await workflowService.addChecklistStep(req.params.id, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.put('/tasks/:id/checklist/:stepId', async (req: any, res: any) => {
  try {
    const task = await workflowService.updateChecklistStepDefinition(req.params.id, req.params.stepId, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/tasks/:id/checklist/:stepId', async (req: any, res: any) => {
  try {
    const task = await workflowService.deleteChecklistStep(req.params.id, req.params.stepId);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/tasks/:id/checklist/:stepId', async (req: any, res: any) => {

  try {
    const task = await workflowService.updateChecklistStep(req.params.id, req.params.stepId, req.user, req.body);
    res.json(task);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/tasks/:id/checklist/:stepId/upload', upload.single('file'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'Dosya bulunamadı' });
    const evidenceUrl = `/uploads/workflow/${req.file.filename}`;
    
    // Yüklenen dosyayı kanıt olarak kaydetmek üzere update yapabiliriz
    // Veya sadece url dönüp frontend'in bir sonraki updateChecklistStep isteğinde göndermesini sağlayabiliriz.
    // Biz url dönelim, frontend kaydetsin.
    res.json({ url: evidenceUrl });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/tasks/:id/comments', async (req: any, res: any) => {
  try {
    const comment = await workflowService.addComment(req.params.id, req.user, req.body.body);
    res.status(201).json(comment);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.post('/tasks/:id/due-requests', async (req: any, res: any) => {
  try {
    const { requestedDue, reason } = req.body;
    const reqData = await workflowService.createDueRequest(req.params.id, req.user, { requestedDue: new Date(requestedDue), reason });
    res.status(201).json(reqData);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.patch('/tasks/:id/due-requests/:reqId', requireWorkflowRole(['ADMIN', 'MANAGER']), async (req: any, res: any) => {
  try {
    const { approve } = req.body;
    const status = await workflowService.respondDueRequest(req.params.reqId, req.user, approve);
    res.json({ status });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- PLANS ---
router.get('/plans', async (req: any, res: any) => {
  try {
    const plans = await workflowService.getPlans(req.user, req.query);
    res.json(plans);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/alerts', async (req: any, res: any) => {
  try {
    const alerts = await workflowService.getAlerts(req.user);
    res.json(alerts);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/plans', requireWorkflowRole(['ADMIN', 'MANAGER']), async (req: any, res: any) => {
  try {
    const plan = await workflowService.createPlan(req.user, {
      ...req.body,
      startDate: new Date(req.body.startDate),
      dueDate: new Date(req.body.dueDate)
    });
    res.status(201).json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.get('/plans/:id', async (req: any, res: any) => {
  try {
    const plan = await workflowService.getPlanById(req.params.id);
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json(plan);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/plans/:id', async (req: any, res: any) => {
  try {
    const data = { ...req.body };
    if(data.startDate) data.startDate = new Date(data.startDate);
    if(data.dueDate) data.dueDate = new Date(data.dueDate);
    const plan = await workflowService.updatePlan(req.params.id, data);
    res.json(plan);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

router.delete('/plans/:id', requireWorkflowRole(['ADMIN']), async (req: any, res: any) => {
  try {
    await workflowService.deletePlan(req.params.id);
    res.status(204).send();
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// --- SETTINGS / ROLES ---
router.get('/settings/roles', adminMiddleware, async (req: any, res: any) => {
  try {
    const users = await workflowRoleService.getWorkflowUsers();
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/settings/roles/:userId', adminMiddleware, async (req: any, res: any) => {
  try {
    const { role } = req.body;
    const result = await workflowRoleService.updateUserRole(req.params.userId, role);
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Transfer Görev Devri Talebi
router.post('/tasks/:id/transfer', async (req: any, res: any) => {
  try {
    const { targetUserId } = req.body;
    const request = await workflowService.createTransferRequest(req.params.id, req.user, targetUserId);
    res.status(201).json(request);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

// Transfer Talebine Yanıt Verme (Kabul/Red)
router.patch('/tasks/:id/transfer/:reqId', async (req: any, res: any) => {
  try {
    const { approve } = req.body;
    const status = await workflowService.respondTransferRequest(req.params.reqId, req.user, approve);
    res.json({ status });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});
export default router;
