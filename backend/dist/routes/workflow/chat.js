"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const index_1 = require("../../index");
const telegramService_1 = require("../../services/telegramService");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router({ mergeParams: true });
// GET /api/workflow/tasks/:id/chat
router.get('/', async (req, res) => {
    try {
        const taskId = req.params.id;
        const messages = await prisma.wfChatMessage.findMany({
            where: { taskId },
            include: { sender: { select: { username: true, fullName: true } } },
            orderBy: { createdAt: 'asc' }
        });
        res.json(messages);
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// POST /api/workflow/tasks/:id/chat
router.post('/', async (req, res) => {
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
        index_1.io.to(`task_${taskId}`).emit('new_chat_message', message);
        // Ayrıca genel pano için de (kanban kartında okunmamış mesaj sayısı güncellensin diye) event yollanabilir
        index_1.io.emit('task_updated', taskId);
        // Etiketleme (mention) kontrolü
        const mentions = body.match(/@([a-zA-Z0-9_\.]+)/g);
        if (mentions) {
            const uniqueMentions = [...new Set(mentions.map((m) => m.substring(1)))];
            const task = await prisma.wfTask.findUnique({ where: { id: taskId } });
            uniqueMentions.forEach(async (username) => {
                // Kendisini etiketlediyse mesaj atma
                if (username !== req.user.username) {
                    try {
                        const telegramMessage = `🔔 *Görev Sohbeti Bildirimi*\n\n*${req.user.fullName || req.user.username}* bir görevde sizden bahsetti:\n\n💬 "${body}"\n\n📌 Görev: ${task?.title || 'Bilinmeyen Görev'}`;
                        await (0, telegramService_1.sendTelegramMessage)(username, telegramMessage);
                    }
                    catch (err) {
                        console.error(`Telegram mesajı gönderilemedi (${username}):`, err);
                    }
                }
            });
        }
        res.status(201).json(message);
    }
    catch (error) {
        res.status(400).json({ error: error.message });
    }
});
exports.default = router;
