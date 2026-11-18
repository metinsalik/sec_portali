import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { sendMail } from '../services/mail';
import {
  TRANSFER_STORAGE_DIR,
  TRANSFER_MAX_FILE_SIZE_BYTES,
  TRANSFER_MAX_FILE_SIZE_MB,
  TRANSFER_MAX_TOTAL_BYTES,
  TRANSFER_MAX_TOTAL_GB,
  TRANSFER_DEFAULT_EXPIRY_DAYS,
  ensureTransferStorageDir,
  generateTransferToken,
  hashTransferPassword,
  verifyTransferPassword,
  issueDownloadTicket,
  consumeDownloadTicket,
  checkPasswordRateLimit,
  recordFailedPasswordAttempt,
  clearPasswordAttempts,
  safeUnlinkFile,
  getTransferStorageUsageBytes,
  decodeOriginalFilename,
  serializeTransfer,
} from '../services/transferService';

const router = Router();
const prisma = new PrismaClient();

ensureTransferStorageDir();

// ─── Yetki Middleware: FILE_TRANSFER modül izni veya Admin / Management ───────
const transferModuleMiddleware = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Oturum açmanız gerekiyor.' });
  }
  const hasAccess =
    user.isAdmin ||
    user.isManagement ||
    user.roles?.includes('admin') ||
    user.roles?.includes('management') ||
    user.modules?.includes('FILE_TRANSFER');

  if (!hasAccess) {
    return res.status(403).json({ error: 'Dosya Transfer modülüne yükleme yetkiniz bulunmamaktadır.' });
  }
  next();
};

// ─── Multer (DiskStorage — RAM şişirmeden doğrudan diske yazar) ──────────────
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    ensureTransferStorageDir();
    cb(null, TRANSFER_STORAGE_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname || '').replace(/[^a-zA-Z0-9._-]/g, '').slice(0, 20);
    cb(null, `${crypto.randomUUID()}${ext}`);
  },
});

const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: TRANSFER_MAX_FILE_SIZE_BYTES,
    files: 1,
  },
}).single('file');

// ─── Zod Şemaları ────────────────────────────────────────────────────────────
const uploadBodySchema = z.object({
  expiryDays: z.coerce.number().int().min(1).max(30).default(TRANSFER_DEFAULT_EXPIRY_DAYS),
  password: z.string().max(128).optional(),
  maxDownloads: z
    .union([z.literal(''), z.null(), z.undefined(), z.coerce.number().int().min(1).max(1000)])
    .transform((val) => (typeof val === 'number' ? val : null)),
  note: z.string().max(500).optional(),
});

const verifyPasswordSchema = z.object({
  password: z.string().min(1, 'Şifre gereklidir.').max(128),
});

const sendEmailSchema = z.object({
  recipientEmail: z.string().email('Geçerli bir e-posta adresi giriniz.'),
  includePassword: z.boolean().optional().default(false),
  plainPassword: z.string().max(128).optional(),
  customMessage: z.string().max(1000).optional(),
});

function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  if (typeof forwarded === 'string' && forwarded.length > 0) {
    return forwarded.split(',')[0].trim();
  }
  return req.socket.remoteAddress || 'unknown';
}

function formatBytesTr(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let val = bytes / 1024;
  let unitIdx = 0;
  while (val >= 1024 && unitIdx < units.length - 1) {
    val /= 1024;
    unitIdx += 1;
  }
  return `${val.toFixed(2)} ${units[unitIdx]}`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// =============================================================================
// 1. YETKİLİ ENDPOINT'LER (Auth + FILE_TRANSFER Modül İzni)
// =============================================================================

/**
 * POST /api/transfer/upload
 * 2 GB'a kadar dosya yükler, kriptografik token üretir ve DB'ye kaydeder.
 */
router.post('/upload', authMiddleware, transferModuleMiddleware, async (req: AuthRequest, res: Response) => {
  // Yükleme öncesi toplam disk kotası kontrolü
  try {
    const usedBytes = await getTransferStorageUsageBytes();
    const contentLength = Number(req.headers['content-length'] || 0);
    if (usedBytes + contentLength > TRANSFER_MAX_TOTAL_BYTES) {
      return res.status(507).json({
        error: `Transfer depolama kotası (${TRANSFER_MAX_TOTAL_GB} GB) dolmak üzere. Lütfen eski dosyaları temizleyip tekrar deneyin.`,
      });
    }
  } catch (err) {
    console.error('[Transfer] Disk kota kontrol hatası:', err);
  }

  let aborted = false;
  req.on('aborted', () => {
    aborted = true;
  });

  uploadMiddleware(req, res, async (multerErr: unknown) => {
    if (aborted) {
      if (req.file?.filename) {
        await safeUnlinkFile(req.file.filename);
      }
      return;
    }

    if (multerErr) {
      if (req.file?.filename) {
        await safeUnlinkFile(req.file.filename);
      }
      if (multerErr instanceof multer.MulterError && multerErr.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({
          error: `Dosya boyutu en fazla ${TRANSFER_MAX_FILE_SIZE_MB} MB (${(TRANSFER_MAX_FILE_SIZE_MB / 1024).toFixed(0)} GB) olabilir.`,
        });
      }
      console.error('[Transfer] Yükleme hatası:', multerErr);
      return res.status(400).json({ error: 'Dosya yüklenirken bir hata oluştu.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Lütfen yüklenecek bir dosya seçin.' });
    }

    try {
      const parsed = uploadBodySchema.safeParse(req.body);
      if (!parsed.success) {
        await safeUnlinkFile(req.file.filename);
        return res.status(400).json({
          error: 'Geçersiz yükleme parametreleri.',
          details: parsed.error.flatten(),
        });
      }

      const { expiryDays, password, maxDownloads, note } = parsed.data;
      const trimmedPassword = password?.trim() || '';
      const passwordHash = trimmedPassword ? hashTransferPassword(trimmedPassword) : null;
      const originalName = decodeOriginalFilename(req.file.originalname);
      const token = generateTransferToken();
      const expiresAt = new Date(Date.now() + expiryDays * 24 * 60 * 60 * 1000);

      const created = await prisma.fileTransfer.create({
        data: {
          token,
          originalName,
          storedName: req.file.filename,
          mimeType: req.file.mimetype || 'application/octet-stream',
          sizeBytes: BigInt(req.file.size),
          note: note?.trim() || null,
          passwordHash,
          maxDownloads,
          expiresAt,
          uploadedByUsername: req.user!.username,
          uploadedByName: req.user!.fullName || req.user!.username,
          uploaderIp: getClientIp(req),
        },
      });

      return res.status(201).json({
        transfer: serializeTransfer(created),
      });
    } catch (err) {
      if (req.file?.filename) {
        await safeUnlinkFile(req.file.filename);
      }
      console.error('[Transfer] DB kayıt hatası:', err);
      return res.status(500).json({ error: 'Dosya kaydedilirken sunucu hatası oluştu.' });
    }
  });
});

/**
 * GET /api/transfer/my
 * Kullanıcının kendi yüklediği dosyaları (ve Admin için ?scope=all tüm dosyaları) + disk özetini döner.
 */
router.get('/my', authMiddleware, transferModuleMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = Boolean(user.isAdmin || user.roles?.includes('admin'));
    const scopeAll = isAdmin && req.query.scope === 'all';
    const includeDeleted = req.query.includeDeleted === 'true';

    const records = await prisma.fileTransfer.findMany({
      where: {
        ...(scopeAll ? {} : { uploadedByUsername: user.username }),
        ...(includeDeleted ? {} : { isDeleted: false }),
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    const usedBytes = await getTransferStorageUsageBytes();

    return res.json({
      transfers: records.map(serializeTransfer),
      storage: {
        usedBytes,
        maxTotalBytes: TRANSFER_MAX_TOTAL_BYTES,
        maxFileSizeBytes: TRANSFER_MAX_FILE_SIZE_BYTES,
        defaultExpiryDays: TRANSFER_DEFAULT_EXPIRY_DAYS,
      },
      canViewAll: isAdmin,
    });
  } catch (err) {
    console.error('[Transfer] Listeleme hatası:', err);
    return res.status(500).json({ error: 'Transfer listesi alınamadı.' });
  }
});

/**
 * DELETE /api/transfer/:id
 * Dosyayı süresinden önce diskten siler ve linki iptal eder (sahibi veya Admin).
 */
router.delete('/:id', authMiddleware, transferModuleMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const user = req.user!;
    const isAdmin = Boolean(user.isAdmin || user.roles?.includes('admin'));

    const record = await prisma.fileTransfer.findUnique({ where: { id } });
    if (!record) {
      return res.status(404).json({ error: 'Transfer kaydı bulunamadı.' });
    }

    if (!isAdmin && record.uploadedByUsername !== user.username) {
      return res.status(403).json({ error: 'Bu dosyayı silme yetkiniz yok.' });
    }

    await safeUnlinkFile(record.storedName);
    await prisma.fileTransfer.update({
      where: { id },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return res.json({ success: true, message: 'Dosya ve indirme linki kalıcı olarak silindi.' });
  } catch (err) {
    console.error('[Transfer] Silme hatası:', err);
    return res.status(500).json({ error: 'Dosya silinirken hata oluştu.' });
  }
});

/**
 * POST /api/transfer/:id/send-email
 * Portal SMTP ayarları üzerinden alıcıya indirme linkini (ve istenirse şifreyi) e-posta atar.
 */
router.post('/:id/send-email', authMiddleware, transferModuleMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const id = String(req.params.id);
    const parsed = sendEmailSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Geçersiz e-posta bilgisi.' });
    }

    const user = req.user!;
    const isAdmin = Boolean(user.isAdmin || user.roles?.includes('admin'));
    const record = await prisma.fileTransfer.findUnique({ where: { id } });

    if (!record || record.isDeleted || record.expiresAt <= new Date()) {
      return res.status(404).json({ error: 'Aktif bir transfer kaydı bulunamadı.' });
    }
    if (!isAdmin && record.uploadedByUsername !== user.username) {
      return res.status(403).json({ error: 'Bu transfer için e-posta gönderme yetkiniz yok.' });
    }

    const { recipientEmail, includePassword, plainPassword, customMessage } = parsed.data;
    const origin =
      (req.headers.origin as string | undefined) ||
      process.env.FRONTEND_URL ||
      `${req.protocol}://${req.get('host')}`;
    const downloadUrl = `${origin.replace(/\/$/, '')}/transfer/${record.token}`;
    const expiryText = record.expiresAt.toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    const passwordBlock =
      includePassword && plainPassword
        ? `<p style="margin:12px 0;padding:10px 14px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:6px;font-family:monospace;font-size:15px;"><strong>İndirme Şifresi:</strong> ${escapeHtml(plainPassword)}</p>`
        : record.passwordHash
          ? `<p style="margin:12px 0;color:#475569;font-size:13px;"><em>Bu dosya şifre korumalıdır. Şifreyi gönderici ile ayrı kanaldan alabilirsiniz.</em></p>`
          : '';

    const messageBlock = customMessage?.trim()
      ? `<p style="margin:12px 0;padding:12px;background:#f1f5f9;border-radius:6px;color:#334155;">${escapeHtml(customMessage.trim())}</p>`
      : '';

    const html = `
      <div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;color:#1e293b;">
        <h2 style="color:#0f172a;margin-bottom:8px;">Kurumsal Dosya Paylaşımı</h2>
        <p style="color:#475569;margin-top:0;"><strong>${escapeHtml(record.uploadedByName)}</strong> sizinle bir dosya paylaştı.</p>
        ${messageBlock}
        <div style="border:1px solid #e2e8f0;border-radius:8px;padding:16px;margin:16px 0;background:#ffffff;">
          <p style="margin:0 0 6px 0;"><strong>Dosya:</strong> ${escapeHtml(record.originalName)}</p>
          <p style="margin:0 0 6px 0;"><strong>Boyut:</strong> ${formatBytesTr(Number(record.sizeBytes))}</p>
          <p style="margin:0 0 14px 0;"><strong>Son Geçerlilik:</strong> ${expiryText}</p>
          ${passwordBlock}
          <a href="${downloadUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:#ffffff;text-decoration:none;border-radius:6px;font-weight:600;">Dosyayı İndir</a>
          <p style="margin:12px 0 0 0;font-size:12px;color:#64748b;word-break:break-all;">Doğrudan link: <a href="${downloadUrl}">${downloadUrl}</a></p>
        </div>
        <p style="font-size:12px;color:#94a3b8;">Bu dosya belirtilen tarihte sistemden otomatik olarak silinecektir.</p>
      </div>
    `;

    await sendMail(recipientEmail, `Dosya Paylaşımı: ${record.originalName}`, html);
    return res.json({ success: true, message: 'E-posta başarıyla gönderildi.' });
  } catch (err: unknown) {
    console.error('[Transfer] E-posta gönderim hatası:', err);
    const msg = err instanceof Error ? err.message : 'E-posta gönderilemedi.';
    return res.status(500).json({ error: msg });
  }
});

// =============================================================================
// 2. HERKESE AÇIK (PUBLIC) ENDPOINT'LER — Kurum Ağından Girişsiz İndirme
// =============================================================================

/**
 * GET /api/transfer/:token/info
 * Giriş gerektirmez. İndirme sayfasında gösterilecek dosya bilgilerini ve durumunu döner.
 */
router.get('/:token/info', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const record = await prisma.fileTransfer.findUnique({ where: { token } });

    if (!record) {
      return res.status(404).json({ status: 'not_found', error: 'Bu indirme bağlantısı geçersiz.' });
    }

    const now = new Date();
    if (record.isDeleted) {
      return res.json({
        status: 'deleted',
        originalName: record.originalName,
        error: 'Bu dosya gönderici tarafından silinmiş veya süresi dolmuştur.',
      });
    }

    if (record.expiresAt <= now) {
      return res.json({
        status: 'expired',
        originalName: record.originalName,
        expiresAt: record.expiresAt.toISOString(),
        error: 'Bu dosyanın paylaşım süresi dolmuştur.',
      });
    }

    if (record.maxDownloads !== null && record.downloadCount >= record.maxDownloads) {
      return res.json({
        status: 'limit_reached',
        originalName: record.originalName,
        error: 'Bu dosya maksimum indirme sayısına ulaşmıştır.',
      });
    }

    const fullPath = path.join(TRANSFER_STORAGE_DIR, path.basename(record.storedName));
    if (!fs.existsSync(fullPath)) {
      return res.json({
        status: 'deleted',
        originalName: record.originalName,
        error: 'Dosya sunucuda bulunamadı.',
      });
    }

    return res.json({
      status: 'active',
      originalName: record.originalName,
      mimeType: record.mimeType,
      sizeBytes: Number(record.sizeBytes),
      note: record.note,
      hasPassword: Boolean(record.passwordHash),
      downloadCount: record.downloadCount,
      maxDownloads: record.maxDownloads,
      expiresAt: record.expiresAt.toISOString(),
      uploadedByName: record.uploadedByName,
      createdAt: record.createdAt.toISOString(),
    });
  } catch (err) {
    console.error('[Transfer] Bilgi sorgulama hatası:', err);
    return res.status(500).json({ error: 'Dosya bilgisi alınamadı.' });
  }
});

/**
 * POST /api/transfer/:token/verify-password
 * Şifreli dosyalar için şifreyi doğrular, 60 sn geçerli tek kullanımlık indirme bileti döner.
 */
router.post('/:token/verify-password', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const rateKey = `${getClientIp(req)}:${token}`;
    const rateCheck = checkPasswordRateLimit(rateKey);

    if (!rateCheck.allowed) {
      return res.status(429).json({
        error: `Çok fazla hatalı şifre denemesi. Lütfen ${Math.ceil(rateCheck.retryAfterSec / 60)} dakika sonra tekrar deneyin.`,
      });
    }

    const parsed = verifyPasswordSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({ error: 'Lütfen şifreyi girin.' });
    }

    const record = await prisma.fileTransfer.findUnique({ where: { token } });
    if (!record || record.isDeleted || record.expiresAt <= new Date()) {
      return res.status(404).json({ error: 'Dosya bulunamadı veya süresi dolmuş.' });
    }

    if (record.maxDownloads !== null && record.downloadCount >= record.maxDownloads) {
      return res.status(410).json({ error: 'Bu dosya maksimum indirme sayısına ulaşmıştır.' });
    }

    if (!record.passwordHash) {
      const ticket = issueDownloadTicket(token);
      return res.json({ ticket });
    }

    const isValid = verifyTransferPassword(parsed.data.password, record.passwordHash);
    if (!isValid) {
      recordFailedPasswordAttempt(rateKey);
      return res.status(401).json({ error: 'Girilen şifre hatalı.' });
    }

    clearPasswordAttempts(rateKey);
    const ticket = issueDownloadTicket(token);
    return res.json({ ticket });
  } catch (err) {
    console.error('[Transfer] Şifre doğrulama hatası:', err);
    return res.status(500).json({ error: 'Şifre doğrulanırken hata oluştu.' });
  }
});

/**
 * GET /api/transfer/:token/download
 * Dosyayı diskten stream ederek indirir (2 GB dosyada sıfır RAM şişmesi).
 * Şifreliyse ?ticket=<downloadTicket> zorunludur.
 */
router.get('/:token/download', async (req: Request, res: Response) => {
  try {
    const token = String(req.params.token);
    const record = await prisma.fileTransfer.findUnique({ where: { token } });

    if (!record || record.isDeleted) {
      return res.status(404).json({ error: 'Dosya bulunamadı veya silinmiş.' });
    }

    if (record.expiresAt <= new Date()) {
      return res.status(410).json({ error: 'Bu dosyanın paylaşım süresi dolmuştur.' });
    }

    if (record.maxDownloads !== null && record.downloadCount >= record.maxDownloads) {
      return res.status(410).json({ error: 'Bu dosya maksimum indirme sayısına ulaşmıştır.' });
    }

    if (record.passwordHash) {
      const ticket = typeof req.query.ticket === 'string' ? req.query.ticket : '';
      if (!ticket || !consumeDownloadTicket(ticket, token)) {
        return res.status(403).json({ error: 'Bu dosyayı indirmek için geçerli şifre doğrulaması gereklidir.' });
      }
    }

    const fullPath = path.join(TRANSFER_STORAGE_DIR, path.basename(record.storedName));
    if (!fs.existsSync(fullPath)) {
      return res.status(404).json({ error: 'Dosya sunucu diskinde bulunamadı.' });
    }

    const stat = await fs.promises.stat(fullPath);

    // İndirme sayacını artır
    await prisma.fileTransfer.update({
      where: { id: record.id },
      data: { downloadCount: { increment: 1 } },
    });

    // RFC 5987 uyumlu UTF-8 dosya adı başlığı (Türkçe karakter desteği)
    const fallbackAscii = record.originalName.replace(/[^\x20-\x7E]/g, '_').replace(/["\\]/g, '_');
    const encodedUtf8 = encodeURIComponent(record.originalName).replace(/['()*]/g, (c) =>
      `%${c.charCodeAt(0).toString(16).toUpperCase()}`
    );

    res.setHeader('Content-Type', record.mimeType || 'application/octet-stream');
    res.setHeader('Content-Length', stat.size.toString());
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${fallbackAscii}"; filename*=UTF-8''${encodedUtf8}`
    );
    res.setHeader('Cache-Control', 'no-store');

    const stream = fs.createReadStream(fullPath);
    stream.on('error', (streamErr) => {
      console.error('[Transfer] Stream okuma hatası:', streamErr);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Dosya okunurken hata oluştu.' });
      } else {
        res.end();
      }
    });

    stream.pipe(res);
  } catch (err) {
    console.error('[Transfer] İndirme hatası:', err);
    if (!res.headersSent) {
      return res.status(500).json({ error: 'Dosya indirilemedi.' });
    }
  }
});

export default router;
