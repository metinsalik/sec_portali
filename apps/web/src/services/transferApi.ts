import { API_URL, api } from '@/lib/api';

export interface FileTransferRecord {
  id: string;
  token: string;
  originalName: string;
  mimeType: string;
  sizeBytes: number;
  note: string | null;
  hasPassword: boolean;
  maxDownloads: number | null;
  downloadCount: number;
  expiresAt: string;
  isDeleted: boolean;
  deletedAt: string | null;
  uploadedByUsername: string;
  uploadedByName: string;
  createdAt: string;
}

export interface TransferStorageStats {
  usedBytes: number;
  maxTotalBytes: number;
  maxFileSizeBytes: number;
  defaultExpiryDays: number;
}

export interface MyTransfersResponse {
  transfers: FileTransferRecord[];
  storage: TransferStorageStats;
  canViewAll: boolean;
}

export interface PublicTransferInfo {
  status: 'active' | 'expired' | 'deleted' | 'limit_reached' | 'not_found';
  originalName?: string;
  mimeType?: string;
  sizeBytes?: number;
  note?: string | null;
  hasPassword?: boolean;
  downloadCount?: number;
  maxDownloads?: number | null;
  expiresAt?: string;
  uploadedByName?: string;
  createdAt?: string;
  error?: string;
}

export interface UploadProgress {
  loaded: number;
  total: number;
  percent: number;
  speedBps: number;
  etaSeconds: number | null;
}

export interface UploadTransferParams {
  file: File;
  expiryDays: number;
  password?: string;
  maxDownloads?: number | null;
  note?: string;
  onProgress?: (progress: UploadProgress) => void;
  signal?: AbortSignal;
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return '0 B';
  if (bytes < 1024) return `${bytes} B`;
  const units = ['KB', 'MB', 'GB', 'TB'];
  let val = bytes / 1024;
  let idx = 0;
  while (val >= 1024 && idx < units.length - 1) {
    val /= 1024;
    idx += 1;
  }
  return `${val.toFixed(val >= 100 ? 0 : val >= 10 ? 1 : 2)} ${units[idx]}`;
}

export function formatEta(seconds: number | null): string {
  if (seconds === null || !Number.isFinite(seconds) || seconds < 0) return 'Hesaplanıyor...';
  if (seconds < 60) return `${Math.max(1, Math.ceil(seconds))} sn`;
  const mins = Math.floor(seconds / 60);
  const secs = Math.ceil(seconds % 60);
  if (mins < 60) return `${mins} dk ${secs} sn`;
  const hrs = Math.floor(mins / 60);
  return `${hrs} sa ${mins % 60} dk`;
}

export function formatRemainingTime(expiresAtIso: string): string {
  const diffMs = new Date(expiresAtIso).getTime() - Date.now();
  if (diffMs <= 0) return 'Süresi doldu';
  const totalMinutes = Math.floor(diffMs / 60_000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;

  if (days > 0) return `${days} gün ${hours} saat`;
  if (hours > 0) return `${hours} saat ${minutes} dk`;
  return `${Math.max(1, minutes)} dakika`;
}

/**
 * Okunması kolay (karışık 0/O, 1/l/I karakterleri hariç) güçlü şifre üretir.
 * Örnek: K7mP-9xR2-Qp4L
 */
export function generateStrongPassword(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';
  const groups = [4, 4, 4];
  const randomValues = new Uint32Array(12);
  window.crypto.getRandomValues(randomValues);
  let idx = 0;
  return groups
    .map((len) => {
      let part = '';
      for (let i = 0; i < len; i += 1) {
        part += chars[randomValues[idx] % chars.length];
        idx += 1;
      }
      return part;
    })
    .join('-');
}

/**
 * HTTP (lokal IP, SSL'siz) ortamlarda navigator.clipboard kısıtına takılmadan kopyalar.
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    // Fallback'e geç
  }

  try {
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.left = '-9999px';
    textarea.style.top = '0';
    textarea.setAttribute('readonly', '');
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    const ok = document.execCommand('copy');
    document.body.removeChild(textarea);
    return ok;
  } catch {
    return false;
  }
}

export function buildPublicShareUrl(token: string): string {
  return `${window.location.origin}/transfer/${token}`;
}

export function getPublicDownloadUrl(token: string, ticket?: string): string {
  const base = `${API_URL}/transfer/${encodeURIComponent(token)}/download`;
  return ticket ? `${base}?ticket=${encodeURIComponent(ticket)}` : base;
}

/**
 * XMLHttpRequest ile gerçek zamanlı ilerleme (progress), hız ve iptal destekli dosya yükleme.
 */
export function uploadTransferFile(params: UploadTransferParams): Promise<FileTransferRecord> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', params.file);
    formData.append('expiryDays', String(params.expiryDays));
    if (params.password && params.password.trim()) {
      formData.append('password', params.password.trim());
    }
    if (params.maxDownloads) {
      formData.append('maxDownloads', String(params.maxDownloads));
    }
    if (params.note && params.note.trim()) {
      formData.append('note', params.note.trim());
    }

    const startTime = Date.now();

    xhr.upload.addEventListener('progress', (event) => {
      if (!event.lengthComputable || !params.onProgress) return;
      const elapsedSec = Math.max(0.1, (Date.now() - startTime) / 1000);
      const speedBps = event.loaded / elapsedSec;
      const remainingBytes = Math.max(0, event.total - event.loaded);
      const etaSeconds = speedBps > 0 ? remainingBytes / speedBps : null;
      const percent = Math.min(100, Math.round((event.loaded / event.total) * 100));

      params.onProgress({
        loaded: event.loaded,
        total: event.total,
        percent,
        speedBps,
        etaSeconds,
      });
    });

    xhr.addEventListener('load', () => {
      try {
        const data = JSON.parse(xhr.responseText || '{}') as {
          transfer?: FileTransferRecord;
          error?: string;
        };
        if (xhr.status >= 200 && xhr.status < 300 && data.transfer) {
          resolve(data.transfer);
        } else {
          reject(new Error(data.error || `Yükleme başarısız (HTTP ${xhr.status}).`));
        }
      } catch {
        reject(new Error(`Sunucudan beklenmeyen yanıt alındı (HTTP ${xhr.status}).`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Ağ bağlantısı kesildi. Lütfen bağlantınızı kontrol edip tekrar deneyin.'));
    });

    xhr.addEventListener('abort', () => {
      reject(new Error('ABORTED'));
    });

    if (params.signal) {
      if (params.signal.aborted) {
        xhr.abort();
        return;
      }
      params.signal.addEventListener('abort', () => xhr.abort(), { once: true });
    }

    const jwtToken = localStorage.getItem('token');
    xhr.open('POST', `${API_URL}/transfer/upload`);
    if (jwtToken) {
      xhr.setRequestHeader('Authorization', `Bearer ${jwtToken}`);
    }
    xhr.send(formData);
  });
}

export async function fetchMyTransfers(scope: 'mine' | 'all' = 'mine'): Promise<MyTransfersResponse> {
  const res = await api.get(`/transfer/my?scope=${scope}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Transfer listesi alınamadı.');
  }
  return res.json() as Promise<MyTransfersResponse>;
}

export async function deleteTransferById(id: string): Promise<void> {
  const res = await api.delete(`/transfer/${encodeURIComponent(id)}`);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'Dosya silinemedi.');
  }
}

export async function sendTransferEmail(
  id: string,
  payload: {
    recipientEmail: string;
    includePassword?: boolean;
    plainPassword?: string;
    customMessage?: string;
  }
): Promise<void> {
  const res = await api.post(`/transfer/${encodeURIComponent(id)}/send-email`, payload);
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(err.error || 'E-posta gönderilemedi.');
  }
}

export async function fetchPublicTransferInfo(token: string): Promise<PublicTransferInfo> {
  const res = await fetch(`${API_URL}/transfer/${encodeURIComponent(token)}/info`);
  const data = (await res.json().catch(() => ({}))) as PublicTransferInfo;
  if (res.status === 404 && !data.status) {
    return { status: 'not_found', error: 'Bu indirme bağlantısı geçersiz.' };
  }
  return data;
}

export async function verifyPublicTransferPassword(token: string, password: string): Promise<string> {
  const res = await fetch(`${API_URL}/transfer/${encodeURIComponent(token)}/verify-password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ password }),
  });
  const data = (await res.json().catch(() => ({}))) as { ticket?: string; error?: string };
  if (!res.ok || !data.ticket) {
    throw new Error(data.error || 'Şifre doğrulanamadı.');
  }
  return data.ticket;
}
