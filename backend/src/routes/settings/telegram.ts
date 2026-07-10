import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware, AuthRequest } from '../../middleware/auth';
import { initTelegramBot } from '../../services/telegramService';
import crypto from 'crypto';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Telegram Ayarlarını Getir (Sadece Admin)
router.get('/', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.telegramSettings.findFirst({ where: { id: 1 } });
    if (settings) {
      // Güvenlik için token'ın bir kısmını gizle (opsiyonel)
      res.json(settings);
    } else {
      res.json(null);
    }
  } catch (error) {
    res.status(500).json({ error: 'Telegram ayarları getirilemedi.' });
  }
});

// Telegram Ayarlarını Kaydet (Sadece Admin)
router.post('/', adminMiddleware, async (req: AuthRequest, res: Response) => {
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
    await initTelegramBot();

    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Telegram ayarları kaydedilemedi.' });
  }
});

// Kullanıcı için Telegram Bağlama Linki / Kodu Üret (Herkes)
router.get('/connect', async (req: AuthRequest, res: Response) => {
  const username = req.user!.username;
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
    const connectToken = `SEC-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;

    await prisma.user.update({
      where: { username },
      data: { telegramConnectToken: connectToken },
    });

    const cleanBotUsername = settings.botUsername.replace('@', '');
    const link = `https://t.me/${cleanBotUsername}?start=${connectToken}`;

    res.json({ token: connectToken, link });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Bağlantı kodu üretilemedi.' });
  }
});

// Telegram'a bağlı kullanıcıları getir (Sadece Admin)
router.get('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Bağlı kullanıcı listesi getirilemedi.' });
  }
});

export default router;
