"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTransporter = getTransporter;
exports.sendMail = sendMail;
const nodemailer_1 = __importDefault(require("nodemailer"));
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function getTransporter() {
    const settings = await prisma.smtpSettings.findFirst({
        where: { id: 1 }
    });
    if (!settings) {
        throw new Error('SMTP ayarları bulunamadı. Lütfen ayarlardan yapılandırın.');
    }
    return nodemailer_1.default.createTransport({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        auth: {
            user: settings.user,
            pass: settings.pass,
        },
        tls: {
            // Kurumsal maillerde bazen sertifika hataları olabiliyor, 
            // rejectUnauthorized: false opsiyonel olarak eklenebilir ama default kalsın.
            rejectUnauthorized: false
        }
    });
}
async function sendMail(to, subject, html) {
    const settings = await prisma.smtpSettings.findFirst({
        where: { id: 1 }
    });
    if (!settings)
        throw new Error('SMTP ayarları yapılandırılmamış.');
    const transporter = await getTransporter();
    return transporter.sendMail({
        from: `"${settings.fromName || 'SEC Portalı'}" <${settings.fromEmail}>`,
        to,
        subject,
        html,
    });
}
