import nodemailer from 'nodemailer';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function getTransporter() {
  const settings = await prisma.smtpSettings.findFirst({
    where: { id: 1 },
  });

  if (!settings) {
    throw new Error('SMTP ayarları bulunamadı. Lütfen ayarlardan yapılandırın.');
  }

  return nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.secure,
    requireTLS: settings.port === 587 && !settings.secure,
    auth: {
      user: settings.user,
      pass: settings.pass,
    },
    tls: {
      minVersion: 'TLSv1.2',
      rejectUnauthorized: false,
    },
  });
}

export async function sendMail(to: string, subject: string, html: string) {
  const settings = await prisma.smtpSettings.findFirst({
    where: { id: 1 },
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

export function renderEmailTemplate(template: string, variables: Record<string, string>) {
  return String(template || '').replace(/\{\{(\w+)\}\}/g, (_, key) => {
    return variables[key] !== undefined ? variables[key] : '';
  });
}

export interface EmlAttachmentInput {
  filename: string;
  content: Buffer | string;
  contentType?: string;
  cid?: string;
}

export interface BuildEmlDraftInput {
  from?: string;
  to?: string | string[];
  cc?: string | string[];
  subject: string;
  html: string;
  attachments?: EmlAttachmentInput[];
}

export async function buildEmlDraft(input: BuildEmlDraftInput): Promise<Buffer> {
  const settings = await prisma.smtpSettings.findFirst({ where: { id: 1 } }).catch(() => null);
  const defaultFrom = settings?.fromEmail
    ? `"${settings.fromName || 'İSG Portalı'}" <${settings.fromEmail}>`
    : '"İSG Portalı" <noreply@isg-portali.local>';

  const transport = nodemailer.createTransport({
    streamTransport: true,
    buffer: true,
    newline: 'windows',
  });

  const info = await transport.sendMail({
    from: input.from || defaultFrom,
    to: Array.isArray(input.to) ? input.to.join(', ') : input.to || undefined,
    cc: Array.isArray(input.cc) ? input.cc.join(', ') : input.cc || undefined,
    subject: input.subject || 'İSG Portalı Bildirimi',
    html: input.html,
    attachments: input.attachments,
    headers: {
      'X-Unsent': '1',
    },
  });

  return info.message as Buffer;
}
