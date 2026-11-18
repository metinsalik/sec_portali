import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { PrismaClient, FileTransfer } from '@prisma/client';

const prisma = new PrismaClient();

export const TRANSFER_STORAGE_DIR =
  process.env.TRANSFER_STORAGE_DIR || path.join(process.cwd(), 'storage', 'transfers');

export const TRANSFER_MAX_FILE_SIZE_MB = Number(process.env.TRANSFER_MAX_FILE_SIZE_MB || 2048);
export const TRANSFER_MAX_FILE_SIZE_BYTES = TRANSFER_MAX_FILE_SIZE_MB * 1024 * 1024;
export const TRANSFER_MAX_TOTAL_GB = Number(process.env.TRANSFER_MAX_TOTAL_GB || 50);
export const TRANSFER_MAX_TOTAL_BYTES = TRANSFER_MAX_TOTAL_GB * 1024 * 1024 * 1024;
export const TRANSFER_DEFAULT_EXPIRY_DAYS = Number(process.env.TRANSFER_DEFAULT_EXPIRY_DAYS || 3);

export function ensureTransferStorageDir(): void {
  if (!fs.existsSync(TRANSFER_STORAGE_DIR)) {
    fs.mkdirSync(TRANSFER_STORAGE_DIR, { recursive: true });
  }
}

export function generateTransferToken(): string {
  return crypto.randomBytes(12).toString('base64url');
}

export function hashTransferPassword(plainPassword: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(plainPassword, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyTransferPassword(plainPassword: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  const derived = crypto.scryptSync(plainPassword, salt, 64);
  const keyBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== keyBuf.length) return false;
  return crypto.timingSafeEqual(derived, keyBuf);
}

// ─── Tek Kullanımlık İndirme Bileti (2 GB şifreli dosyalar için) ─────────────
interface DownloadTicketEntry {
  token: string;
  expiresAt: number;
}

const downloadTickets = new Map<string, DownloadTicketEntry>();
const TICKET_TTL_MS = 60_000; // 60 saniye

export function issueDownloadTicket(transferToken: string): string {
  const now = Date.now();
  // Süresi dolmuş eski biletleri temizle
  for (const [k, v] of downloadTickets.entries()) {
    if (v.expiresAt <= now) {
      downloadTickets.delete(k);
    }
  }
  const ticket = crypto.randomBytes(24).toString('base64url');
  downloadTickets.set(ticket, {
    token: transferToken,
    expiresAt: now + TICKET_TTL_MS,
  });
  return ticket;
}

export function consumeDownloadTicket(ticket: string, transferToken: string): boolean {
  const entry = downloadTickets.get(ticket);
  if (!entry) return false;
  downloadTickets.delete(ticket);
  if (entry.expiresAt <= Date.now()) return false;
  return entry.token === transferToken;
}

// ─── Brute-Force Koruması (IP + Token bazlı) ─────────────────────────────────
interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const passwordAttempts = new Map<string, RateLimitEntry>();
const MAX_PASSWORD_ATTEMPTS = 10;
const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000; // 10 dakika

export function checkPasswordRateLimit(key: string): { allowed: boolean; retryAfterSec: number } {
  const now = Date.now();
  const entry = passwordAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    return { allowed: true, retryAfterSec: 0 };
  }
  if (entry.count >= MAX_PASSWORD_ATTEMPTS) {
    return {
      allowed: false,
      retryAfterSec: Math.ceil((entry.resetAt - now) / 1000),
    };
  }
  return { allowed: true, retryAfterSec: 0 };
}

export function recordFailedPasswordAttempt(key: string): void {
  const now = Date.now();
  const entry = passwordAttempts.get(key);
  if (!entry || entry.resetAt <= now) {
    passwordAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
  } else {
    entry.count += 1;
  }
}

export function clearPasswordAttempts(key: string): void {
  passwordAttempts.delete(key);
}

// ─── Disk Yardımcıları ───────────────────────────────────────────────────────
export async function safeUnlinkFile(storedName: string): Promise<boolean> {
  const fullPath = path.join(TRANSFER_STORAGE_DIR, path.basename(storedName));
  try {
    await fs.promises.unlink(fullPath);
    return true;
  } catch (err: unknown) {
    const code = (err as NodeJS.ErrnoException)?.code;
    if (code === 'ENOENT') return false;
    console.error(`[Transfer] Dosya silinemedi (${fullPath}):`, err);
    return false;
  }
}

export async function getTransferStorageUsageBytes(): Promise<number> {
  ensureTransferStorageDir();
  const entries = await fs.promises.readdir(TRANSFER_STORAGE_DIR, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    try {
      const stat = await fs.promises.stat(path.join(TRANSFER_STORAGE_DIR, entry.name));
      total += stat.size;
    } catch {
      // ignore race
    }
  }
  return total;
}

export function decodeOriginalFilename(rawName: string): string {
  try {
    // Multer bazen UTF-8 Türkçe karakterleri latin1 olarak okuyabilir
    const decoded = Buffer.from(rawName, 'latin1').toString('utf8');
    // Eğer replacement character () içermiyorsa ve latin1->utf8 fark yarattıysa decoded kullan
    if (!decoded.includes('\uFFFD')) {
      return decoded;
    }
  } catch {
    // ignore
  }
  return rawName;
}

export function serializeTransfer(record: FileTransfer) {
  return {
    id: record.id,
    token: record.token,
    originalName: record.originalName,
    mimeType: record.mimeType,
    sizeBytes: Number(record.sizeBytes),
    note: record.note,
    hasPassword: Boolean(record.passwordHash),
    maxDownloads: record.maxDownloads,
    downloadCount: record.downloadCount,
    expiresAt: record.expiresAt.toISOString(),
    isDeleted: record.isDeleted,
    deletedAt: record.deletedAt ? record.deletedAt.toISOString() : null,
    uploadedByUsername: record.uploadedByUsername,
    uploadedByName: record.uploadedByName,
    createdAt: record.createdAt.toISOString(),
  };
}

// ─── Cron Temizlik İşleri ────────────────────────────────────────────────────
export async function cleanupExpiredTransfers(): Promise<{ deletedCount: number; freedBytes: number }> {
  const now = new Date();
  const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

  const candidates = await prisma.fileTransfer.findMany({
    where: {
      isDeleted: false,
      OR: [
        { expiresAt: { lte: now } },
        // İndirme limiti dolmuş ve son güncellemeden 5 dk geçmiş olanlar
        {
          maxDownloads: { not: null },
          updatedAt: { lte: fiveMinutesAgo },
        },
      ],
    },
  });

  let deletedCount = 0;
  let freedBytes = 0;

  for (const item of candidates) {
    const isExpired = item.expiresAt <= now;
    const isLimitReached = item.maxDownloads !== null && item.downloadCount >= item.maxDownloads;
    if (!isExpired && !isLimitReached) continue;

    await safeUnlinkFile(item.storedName);
    await prisma.fileTransfer.update({
      where: { id: item.id },
      data: {
        isDeleted: true,
        deletedAt: now,
      },
    });
    deletedCount += 1;
    freedBytes += Number(item.sizeBytes);
  }

  return { deletedCount, freedBytes };
}

export async function cleanupOrphanTransferFiles(): Promise<{ removedFiles: number }> {
  ensureTransferStorageDir();
  const activeRecords = await prisma.fileTransfer.findMany({
    where: { isDeleted: false },
    select: { storedName: true },
  });
  const activeSet = new Set(activeRecords.map((r) => path.basename(r.storedName)));
  const entries = await fs.promises.readdir(TRANSFER_STORAGE_DIR, { withFileTypes: true });
  const cutoffMs = Date.now() - 24 * 60 * 60 * 1000; // 24 saatten eski yetim dosyalar

  let removedFiles = 0;
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (activeSet.has(entry.name)) continue;
    const fullPath = path.join(TRANSFER_STORAGE_DIR, entry.name);
    try {
      const stat = await fs.promises.stat(fullPath);
      if (stat.mtimeMs < cutoffMs) {
        await fs.promises.unlink(fullPath);
        removedFiles += 1;
      }
    } catch {
      // ignore
    }
  }
  return { removedFiles };
}
