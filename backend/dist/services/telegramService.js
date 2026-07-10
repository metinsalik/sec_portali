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
        bot.onText(/\/start (.+)/, async (msg, match) => {
            const chatId = msg.chat.id;
            const code = match ? match[1] : null;
            if (!code) {
                bot?.sendMessage(chatId, 'Lütfen size verilen bağlama kodunu girin.');
                return;
            }
            const user = await prisma.user.findUnique({
                where: { telegramConnectToken: code },
            });
            if (!user) {
                bot?.sendMessage(chatId, 'Geçersiz veya süresi dolmuş kod.');
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
        bot.onText(/\/start$/, (msg) => {
            bot?.sendMessage(msg.chat.id, 'SEC Portalı Bildirim Botuna Hoşgeldiniz. Hesabınızı bağlamak için portal üzerinden aldığınız kodu "/start KOD" şeklinde gönderiniz.');
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
