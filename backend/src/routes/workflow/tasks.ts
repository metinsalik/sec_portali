import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireWorkflowRole } from '../../middleware/workflowAuth';

const router = express.Router();
const prisma = new PrismaClient();

// Get all tasks (filtered by role/department in the future)
router.get('/', async (req, res) => {
  try {
    const tasks = await prisma.workflowTask.findMany({
      include: {
        category: true,
        department: true,
        assignments: true,
      },
      orderBy: { createdAt: 'desc' }
    });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: 'İşler getirilirken hata oluştu' });
  }
});

// Create task
router.post('/', async (req, res) => {
  try {
    const { title, description, priority, categoryId, departmentId, isPool } = req.body;
    // @ts-ignore
    const username = req.user?.username || 'admin'; // fallback for testing

    const task = await prisma.workflowTask.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIUM',
        status: 'BEKLIYOR',
        categoryId: categoryId ? parseInt(categoryId) : null,
        departmentId: departmentId ? parseInt(departmentId) : null,
        isPool: isPool || false,
        createdBy: username,
      }
    });
    res.json(task);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: 'İş oluşturulurken hata oluştu' });
  }
});

// Update task status
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    // @ts-ignore
    const username = req.user?.username || 'admin';

    const task = await prisma.workflowTask.update({
      where: { id: parseInt(id) },
      data: { status }
    });

    // Record history
    await prisma.workflowTaskHistory.create({
      data: {
        taskId: task.id,
        changedBy: username,
        newStatus: status,
        note: 'Durum güncellendi'
      }
    });

    res.json(task);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Durum güncellenirken hata oluştu' });
  }
});

export default router;
