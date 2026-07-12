"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initTelegramBot = initTelegramBot;
exports.sendTelegramMessage = sendTelegramMessage;
const node_telegram_bot_api_1 = __importDefault(require("node-telegram-bot-api"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
let bot = null;
async function initTelegramBot() {
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
        bot = new node_telegram_bot_api_1.default(settings.botToken, { polling: true });
        console.log('Telegram bot started with polling.');
        bot.on('message', (msg) => {
            console.log(`[TELEGRAM RAW] Received from ${msg.chat.id}: "${msg.text}"`);
        });
        bot.onText(/\/start(?:\s+(.+))?/, async (msg, match) => {
            const chatId = msg.chat.id;
            try {
                const code = (match && match[1]) ? match[1].trim() : null;
                console.log(`Telegram Bot Received Start Command. Code: "${code || 'NONE'}" for chatId: ${chatId}`);
                if (!code) {
                    bot?.sendMessage(chatId, 'SEC Portalı Bildirim Botuna Hoşgeldiniz.\n\nHesabınızı bağlamak için portal üzerinden aldığınız kodu "/start KOD" şeklinde gönderiniz.\nÖrnek: /start SEC-123456');
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
            }
            catch (error) {
                console.error('[TELEGRAM ERROR] Start handler failed:', error);
                bot?.sendMessage(chatId, 'Sistemsel bir hata oluştu. Lütfen yöneticinize başvurun.');
            }
        });
        bot.on('polling_error', (error) => {
            console.error('Telegram Polling Error:', error);
        });
    }
    catch (error) {
        console.error('Failed to init Telegram Bot', error);
    }
}
async function sendTelegramMessage(username, message) {
    try {
        if (!bot)
            return;
        const user = await prisma.user.findUnique({
            where: { username },
            select: { telegramChatId: true }
        });
        if (user && user.telegramChatId) {
            await bot.sendMessage(user.telegramChatId, message, { parse_mode: 'HTML' });
        }
    }
    catch (error) {
        console.error(`Failed to send Telegram message to ${username}:`, error);
    }
}
