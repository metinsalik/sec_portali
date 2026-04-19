import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get user notifications
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: {
        OR: [
          { username: req.user?.username },
          { 
            targetRole: {
              in: req.user?.roles || []
            }
          },
          { 
            AND: [
              { username: null },
              { targetRole: null }
            ]
          }
        ]
      },
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Bildirimler alınamadı' });
  }
});

// Mark notification as read
router.put('/:id/read', authMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    await prisma.notification.update({
      where: { id },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bildirim güncellenemedi' });
  }
});

// Mark all as read
router.put('/read-all', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await prisma.notification.updateMany({
      where: {
        OR: [
          { username: req.user?.username },
          { 
            targetRole: {
              in: req.user?.roles.map(r => r.role.name) || []
            }
          }
        ],
        isRead: false
      },
      data: { isRead: true }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Bildirimler güncellenemedi' });
  }
});

export default router;
