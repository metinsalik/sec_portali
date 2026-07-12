"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../../middleware/auth");
const telegramService_1 = require("../../services/telegramService");
const crypto_1 = __importDefault(require("crypto"));
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authMiddleware);
// Telegram Ayarlarını Getir (Sadece Admin)
router.get('/', auth_1.adminMiddleware, async (req, res) => {
    try {
        const settings = await prisma.telegramSettings.findFirst({ where: { id: 1 } });
        if (settings) {
            // Güvenlik için token'ın bir kısmını gizle (opsiyonel)
            res.json(settings);
        }
        else {
            res.json(null);
        }
    }
    catch (error) {
        res.status(500).json({ error: 'Telegram ayarları getirilemedi.' });
    }
});
// Telegram Ayarlarını Kaydet (Sadece Admin)
router.post('/', auth_1.adminMiddleware, async (req, res) => {
    const { botToken, botUsername, isActive } = req.body;
    if (!botToken || !botUsername) {
        return res.status(400).json({ error: 'Bot Token ve Username zorunludur.' });
    }
    try {
        const settings = await prisma.telegramSettings.upsert({
            where: { id: 1 },
            update: { botToken, botUsername, isActive },
            create: { id: 1, botToken, botUsername, isActive },
        });
        // Ayarlar güncellenince botu yeniden başlat
        await (0, telegramService_1.initTelegramBot)();
        res.json(settings);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Telegram ayarları kaydedilemedi.' });
    }
});
// Kullanıcı için Telegram Bağlama Linki / Kodu Üret (Herkes)
router.get('/connect', async (req, res) => {
    const username = req.user.username;
    try {
        const settings = await prisma.telegramSettings.findFirst({ where: { id: 1 } });
        if (!settings || !settings.isActive) {
            return res.status(400).json({ error: 'Sistemde aktif bir Telegram botu bulunamadı.' });
        }
        const user = await prisma.user.findUnique({ where: { username } });
        if (user?.telegramChatId) {
            return res.status(400).json({ error: 'Hesabınız zaten bir Telegram hesabına bağlı.' });
        }
        // Rastgele benzersiz bir kod üret
        const connectToken = `SEC-${crypto_1.default.randomBytes(4).toString('hex').toUpperCase()}`;
        await prisma.user.update({
            where: { username },
            data: { telegramConnectToken: connectToken },
        });
        const cleanBotUsername = settings.botUsername.replace('@', '');
        const link = `https://t.me/${cleanBotUsername}?start=${connectToken}`;
        res.json({ token: connectToken, link });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bağlantı kodu üretilemedi.' });
    }
});
// Telegram'a bağlı kullanıcıları getir (Sadece Admin)
router.get('/users', auth_1.adminMiddleware, async (req, res) => {
    try {
        const users = await prisma.user.findMany({
            where: { telegramChatId: { not: null } },
            select: {
                username: true,
                fullName: true,
                telegramChatId: true,
            },
            orderBy: { fullName: 'asc' }
        });
        res.json(users);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Bağlı kullanıcı listesi getirilemedi.' });
    }
});
exports.default = router;
