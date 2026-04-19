import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTransporter() {
  const settings = await prisma.smtpSettings.findFirst({
    where: { id: 1 }
  });

  if (!settings) {
    throw new Error('SMTP ayarları bulunamadı. Lütfen ayarlardan yapılandırın.');
  }

  return nodemailer.createTransport({
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

export async function sendMail(to: string, subject: string, html: string) {
  const settings = await prisma.smtpSettings.findFirst({
    where: { id: 1 }
  });

  if (!settings) throw new Error('SMTP ayarları yapılandırılmamış.');

  const transporter = await getTransporter();

  return transporter.sendMail({
    from: `"${settings.fromName || 'SEC Portalı'}" <${settings.fromEmail}>`,
    to,
    subject,
    html,
  });
}
