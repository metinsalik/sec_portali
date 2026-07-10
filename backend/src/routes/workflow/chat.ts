import express from 'express';
import { PrismaClient } from '@prisma/client';
import { io } from '../../index';
import { sendTelegramMessage } from '../../services/telegramService';

const prisma = new PrismaClient();
const router = express.Router({ mergeParams: true });

// GET /api/workflow/tasks/:id/chat
router.get('/', async (req: any, res: any) => {
  try {
    const taskId = req.params.id;
    const messages = await prisma.wfChatMessage.findMany({
      where: { taskId },
      include: { sender: { select: { username: true, fullName: true } } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(messages);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/workflow/tasks/:id/chat
router.post('/', async (req: any, res: any) => {
  try {
    const taskId = req.params.id;
    const { body } = req.body;
    
    if (!body || body.trim() === '') {
      return res.status(400).json({ error: 'Mesaj boş olamaz' });
    }

    const message = await prisma.wfChatMessage.create({
      data: {
        taskId,
        senderId: req.user.username,
        body
      },
      include: { sender: { select: { username: true, fullName: true } } }
    });

    // Emit socket event to the task's room
    io.to(`task_${taskId}`).emit('new_chat_message', message);
    
    // Ayrıca genel pano için de (kanban kartında okunmamış mesaj sayısı güncellensin diye) event yollanabilir
    io.emit('task_updated', taskId);

    // Etiketleme (mention) kontrolü
    const mentions = body.match(/@([a-zA-Z0-9_\.]+)/g);
    if (mentions) {
      const uniqueMentions = [...new Set(mentions.map((m: string) => m.substring(1)))];
      const task = await prisma.wfTask.findUnique({ where: { id: taskId } });
      
      uniqueMentions.forEach(async (username) => {
        // Kendisini etiketlediyse mesaj atma
        if (username !== req.user.username) {
          try {
            const telegramMessage = `🔔 *Görev Sohbeti Bildirimi*\n\n*${req.user.fullName || req.user.username}* bir görevde sizden bahsetti:\n\n💬 "${body}"\n\n📌 Görev: ${task?.title || 'Bilinmeyen Görev'}`;
            await sendTelegramMessage(username as string, telegramMessage);
          } catch (err) {
            console.error(`Telegram mesajı gönderilemedi (${username}):`, err);
          }
        }
      });
    }

    res.status(201).json(message);
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
