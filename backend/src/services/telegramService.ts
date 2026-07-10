import TelegramBot from 'node-telegram-bot-api';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
let bot: TelegramBot | null = null;

export async function initTelegramBot() {
  try {
    const settings = await prisma.telegramSettings.findFirst({ where: { id: 1 } });
    if (!settings || !settings.botToken || !settings.isActive) {
      console.log('Telegram bot is not active or token is missing.');
      if (bot) {
        bot.stopPolling();
        bot = null;
      }
      return;
    }

    if (bot) {
      bot.stopPolling();
    }

    bot = new TelegramBot(settings.botToken, { polling: true });
    console.log('Telegram bot started with polling.');

    bot.on('message', (msg: any) => {
      console.log(`[TELEGRAM RAW] Received from ${msg.chat.id}: "${msg.text}"`);
    });

    bot.onText(/\/start\s+([a-zA-Z0-9\-]+)/, async (msg: any, match: any) => {
      const chatId = msg.chat.id;
      const code = match ? match[1].trim() : null;

      console.log(`Telegram Bot Received Start Code: "${code}" for chatId: ${chatId}`);

      if (!code) {
        bot?.sendMessage(chatId, 'Lütfen size verilen bağlama kodunu girin.');
        return;
      }

      // Check if they are already connected
      const existingUser = await prisma.user.findFirst({
        where: { telegramChatId: chatId.toString() },
      });

      if (existingUser) {
        bot?.sendMessage(chatId, `Hesabınız zaten bağlı (${existingUser.fullName}). Bildirimleri buradan alacaksınız.`);
        return;
      }

      // Do a case-insensitive search for the token
      const user = await prisma.user.findFirst({
        where: { 
          telegramConnectToken: { equals: code, mode: 'insensitive' } 
        },
      });

      if (!user) {
        console.log(`Failed to find user with connect token: "${code}"`);
        bot?.sendMessage(chatId, 'Geçersiz veya süresi dolmuş kod. Lütfen SEC Portalı üzerinden yeni bir kod alarak tekrar deneyin.');
        return;
      }

      await prisma.user.update({
        where: { username: user.username },
        data: {
          telegramChatId: chatId.toString(),
          telegramConnectToken: null, // Token tek kullanımlıktır
        },
      });

      bot?.sendMessage(chatId, `Tebrikler ${user.fullName}! SEC Portalı hesabınız başarıyla Telegram'a bağlandı. Artık anlık iş takibi bildirimlerinizi buradan alacaksınız.`);
    });

    bot.onText(/\/start$/, (msg: any) => {
      bot?.sendMessage(msg.chat.id, 'SEC Portalı Bildirim Botuna Hoşgeldiniz. Hesabınızı bağlamak için portal üzerinden aldığınız kodu "/start KOD" şeklinde gönderiniz.');
    });

    bot.on('polling_error', (error: any) => {
      console.error('Telegram Polling Error:', error);
    });

  } catch (error) {
    console.error('Failed to init Telegram Bot', error);
  }
}

export async function sendTelegramMessage(username: string, message: string) {
  try {
    if (!bot) return;

    const user = await prisma.user.findUnique({
      where: { username },
      select: { telegramChatId: true }
    });

    if (user && user.telegramChatId) {
      await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'HTML' });
    }
  } catch (error) {
    console.error(`Failed to send Telegram message to ${username}:`, error);
  }
}
