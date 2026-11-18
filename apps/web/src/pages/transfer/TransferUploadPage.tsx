import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  UploadCloud,
  File as FileIcon,
  Lock,
  KeyRound,
  Copy,
  Check,
  Trash2,
  Clock,
  Download,
  Mail,
  RefreshCw,
  X,
  Eye,
  EyeOff,
  HardDrive,
  ShieldCheck,
  ExternalLink,
  Loader2,
  ArrowLeft,
} from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { FileTransferRecord, UploadProgress } from '@/services/transferApi';
import {
  buildPublicShareUrl,
  copyToClipboard,
  deleteTransferById,
  fetchMyTransfers,
  formatBytes,
  formatEta,
  formatRemainingTime,
  generateStrongPassword,
  sendTransferEmail,
  uploadTransferFile,
} from '@/services/transferApi';

interface CreatedTransferResult {
  record: FileTransferRecord;
  plainPassword: string | null;
}

const EXPIRY_LABELS: Record<string, string> = {
  '1': '1 Gün',
  '3': '3 Gün (Varsayılan)',
  '7': '7 Gün',
};

const MAX_DOWNLOADS_LABELS: Record<string, string> = {
  unlimited: 'Sınırsız (Süre Dolana Kadar)',
  '1': '1 İndirme (Tek Kullanımlık)',
  '5': '5 İndirme',
  '10': '10 İndirme',
  '25': '25 İndirme',
};

const MAX_CLIENT_BYTES = 2 * 1024 * 1024 * 1024; // 2 GB

export default function TransferUploadPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  const activeTab = (searchParams.get('tab') as 'upload' | 'my' | 'all' | null) || 'upload';
  const listScope: 'mine' | 'all' = activeTab === 'all' ? 'all' : 'mine';

  // Upload Form State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [expiryDays, setExpiryDays] = useState<string>('3');
  const [maxDownloads, setMaxDownloads] = useState<string>('unlimited');
  const [note, setNote] = useState('');
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(true);

  // Upload Progress State
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const [createdResult, setCreatedResult] = useState<CreatedTransferResult | null>(null);
  const [copiedField, setCopiedField] = useState<'link' | 'password' | 'both' | string | null>(null);

  // Email Dialog State
  const [emailDialogTransfer, setEmailDialogTransfer] = useState<{
    id: string;
    originalName: string;
    hasPassword: boolean;
    plainPassword?: string | null;
  } | null>(null);
  const [recipientEmail, setRecipientEmail] = useState('');
  const [includePasswordInEmail, setIncludePasswordInEmail] = useState(true);
  const [customEmailMessage, setCustomEmailMessage] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['file-transfers', listScope],
    queryFn: () => fetchMyTransfers(listScope),
    refetchInterval: 30_000,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => deleteTransferById(id),
    onSuccess: () => {
      toast.success('Dosya ve indirme bağlantısı silindi.');
      queryClient.invalidateQueries({ queryKey: ['file-transfers'] });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const emailMutation = useMutation({
    mutationFn: async () => {
      if (!emailDialogTransfer) return;
      await sendTransferEmail(emailDialogTransfer.id, {
        recipientEmail: recipientEmail.trim(),
        includePassword: includePasswordInEmail && Boolean(emailDialogTransfer.plainPassword),
        plainPassword: emailDialogTransfer.plainPassword || undefined,
        customMessage: customEmailMessage.trim() || undefined,
      });
    },
    onSuccess: () => {
      toast.success('Paylaşım e-postası gönderildi.');
      setEmailDialogTransfer(null);
      setRecipientEmail('');
      setCustomEmailMessage('');
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  const handleFilePick = (file: File | null) => {
    if (!file) return;
    const maxBytes = data?.storage?.maxFileSizeBytes || MAX_CLIENT_BYTES;
    if (file.size > maxBytes) {
      toast.error(`Dosya boyutu en fazla ${formatBytes(maxBytes)} olabilir.`);
      return;
    }
    if (file.size === 0) {
      toast.error('Boş dosya yüklenemez.');
      return;
    }
    setSelectedFile(file);
    setCreatedResult(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0] || null;
    handleFilePick(file);
  };

  const handlePasswordToggle = (checked: boolean) => {
    setUsePassword(checked);
    if (checked && !password) {
      setPassword(generateStrongPassword());
    }
  };

  const handleStartUpload = async () => {
    if (!selectedFile) {
      toast.error('Lütfen bir dosya seçin.');
      return;
    }
    if (usePassword && password.trim().length < 4) {
      toast.error('Şifre en az 4 karakter olmalıdır.');
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsUploading(true);
    setProgress({
      loaded: 0,
      total: selectedFile.size,
      percent: 0,
      speedBps: 0,
      etaSeconds: null,
    });

    const usedPassword = usePassword ? password.trim() : null;

    try {
      const record = await uploadTransferFile({
        file: selectedFile,
        expiryDays: Number(expiryDays),
        password: usedPassword || undefined,
        maxDownloads: maxDownloads === 'unlimited' ? null : Number(maxDownloads),
        note: note.trim() || undefined,
        onProgress: (p) => setProgress(p),
        signal: controller.signal,
      });

      setCreatedResult({ record, plainPassword: usedPassword });
      setSelectedFile(null);
      setNote('');
      if (fileInputRef.current) fileInputRef.current.value = '';
      toast.success('Dosya yüklendi ve paylaşım bağlantısı oluşturuldu.');
      queryClient.invalidateQueries({ queryKey: ['file-transfers'] });
    } catch (err: unknown) {
      if (err instanceof Error && err.message === 'ABORTED') {
        toast.info('Dosya yükleme iptal edildi.');
      } else {
        toast.error(err instanceof Error ? err.message : 'Yükleme başarısız oldu.');
      }
    } finally {
      setIsUploading(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  };

  const handleCancelUpload = () => {
    abortControllerRef.current?.abort();
  };

  const handleCopy = async (text: string, fieldId: string, successLabel: string) => {
    const ok = await copyToClipboard(text);
    if (ok) {
      setCopiedField(fieldId);
      toast.success(successLabel);
      setTimeout(() => {
        setCopiedField((prev) => (prev === fieldId ? null : prev));
      }, 2000);
    } else {
      toast.error('Panoya kopyalanamadı. Lütfen metni manuel seçip kopyalayın.');
    }
  };

  const buildCombinedShareText = (result: CreatedTransferResult): string => {
    const url = buildPublicShareUrl(result.record.token);
    const expiryDate = new Date(result.record.expiresAt).toLocaleString('tr-TR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
    const lines = [
      `Dosya: ${result.record.originalName} (${formatBytes(result.record.sizeBytes)})`,
      `İndirme Linki: ${url}`,
    ];
    if (result.plainPassword) {
      lines.push(`Şifre: ${result.plainPassword}`);
    }
    lines.push(`Son Geçerlilik: ${expiryDate} (süre sonunda otomatik silinir)`);
    return lines.join('\n');
  };

  const storage = data?.storage;
  const storagePercent =
    storage && storage.maxTotalBytes > 0
      ? Math.min(100, Math.round((storage.usedBytes / storage.maxTotalBytes) * 100))
      : 0;

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/portal')}
              className="h-8 px-2 text-muted-foreground hover:text-foreground -ml-2"
            >
              <ArrowLeft className="w-4 h-4 mr-1" />
              Portal
            </Button>
            <Badge variant="outline" className="text-[11px] font-medium">
              Maks. {storage ? formatBytes(storage.maxFileSizeBytes) : '2 GB'}
            </Badge>
            <Badge variant="secondary" className="text-[11px] font-medium">
              Varsayılan 3 Gün Saklama
            </Badge>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Kurumsal Dosya Transferi
          </h1>
          <p className="text-sm text-muted-foreground">
            Büyük dosyaları güvenle yükleyin, süreli ve isteğe bağlı şifreli indirme bağlantısı oluşturup paylaşın.
          </p>
        </div>

        {/* Disk Kullanım Özeti */}
        {storage && (
          <div className="rounded-lg border border-border/60 bg-card px-4 py-2.5 min-w-[220px]">
            <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <HardDrive className="w-3.5 h-3.5 text-primary" />
                Transfer Alanı
              </span>
              <span>
                {formatBytes(storage.usedBytes)} / {formatBytes(storage.maxTotalBytes)}
              </span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full transition-all ${storagePercent > 85 ? 'bg-destructive' : 'bg-primary'}`}
                style={{ width: `${storagePercent}%` }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Yükleme Sonrası Sonuç Kartı */}
      {createdResult && (
        <Card className="border-emerald-500/40 bg-emerald-50/40 dark:bg-emerald-950/20">
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-1">
                <CardTitle className="text-base flex items-center gap-2 text-emerald-700 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                  Paylaşım Bağlantınız Hazır!
                </CardTitle>
                <CardDescription>
                  <strong>{createdResult.record.originalName}</strong> ({formatBytes(createdResult.record.sizeBytes)}) —{' '}
                  {new Date(createdResult.record.expiresAt).toLocaleString('tr-TR')} tarihine kadar geçerli.
                </CardDescription>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setCreatedResult(null)}
                className="h-8 text-xs"
              >
                Yeni Yükleme
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            {/* Link Satırı */}
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">İndirme Bağlantısı (Kurum Ağı - Girişsiz)</label>
              <div className="flex gap-2">
                <Input
                  readOnly
                  value={buildPublicShareUrl(createdResult.record.token)}
                  className="font-mono text-xs bg-background"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() =>
                    handleCopy(
                      buildPublicShareUrl(createdResult.record.token),
                      'link',
                      'İndirme linki kopyalandı.'
                    )
                  }
                  className="shrink-0"
                >
                  {copiedField === 'link' ? (
                    <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                  ) : (
                    <Copy className="w-4 h-4 mr-1.5" />
                  )}
                  Linki Kopyala
                </Button>
              </div>
            </div>

            {/* Şifre Satırı (varsa) */}
            {createdResult.plainPassword && (
              <div className="space-y-1">
                <label className="text-xs font-medium text-muted-foreground">
                  İndirme Şifresi (Bu ekran kapandığında güvenlik nedeniyle tekrar gösterilmez)
                </label>
                <div className="flex gap-2">
                  <Input
                    readOnly
                    value={createdResult.plainPassword}
                    className="font-mono text-sm font-semibold tracking-wider bg-background"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() =>
                      handleCopy(createdResult.plainPassword!, 'password', 'Şifre kopyalandı.')
                    }
                    className="shrink-0"
                  >
                    {copiedField === 'password' ? (
                      <Check className="w-4 h-4 mr-1.5 text-emerald-600" />
                    ) : (
                      <KeyRound className="w-4 h-4 mr-1.5" />
                    )}
                    Şifreyi Kopyala
                  </Button>
                </div>
              </div>
            )}

            {/* Hızlı Aksiyonlar */}
            <div className="flex flex-wrap items-center gap-2 pt-2">
              <Button
                type="button"
                onClick={() =>
                  handleCopy(
                    buildCombinedShareText(createdResult),
                    'both',
                    'Link ve bilgiler panoya kopyalandı.'
                  )
                }
              >
                {copiedField === 'both' ? (
                  <Check className="w-4 h-4 mr-1.5" />
                ) : (
                  <Copy className="w-4 h-4 mr-1.5" />
                )}
                {createdResult.plainPassword ? 'Link + Şifreyi Birlikte Kopyala' : 'Paylaşım Metnini Kopyala'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setEmailDialogTransfer({
                    id: createdResult.record.id,
                    originalName: createdResult.record.originalName,
                    hasPassword: createdResult.record.hasPassword,
                    plainPassword: createdResult.plainPassword,
                  });
                  setIncludePasswordInEmail(Boolean(createdResult.plainPassword));
                }}
              >
                <Mail className="w-4 h-4 mr-1.5" />
                E-posta ile Gönder
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => window.open(buildPublicShareUrl(createdResult.record.token), '_blank')}
              >
                <ExternalLink className="w-4 h-4 mr-1.5" />
                İndirme Sayfasını Gör
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Yükleme Kartı */}
      {activeTab === 'upload' && (
      <Card className="border-border/60">
        <CardContent className="pt-6 space-y-5">
          {/* Sürükle-Bırak Alanı */}
          <div
            onDragOver={(e) => {
              e.preventDefault();
              if (!isUploading) setIsDragging(true);
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={isUploading ? undefined : handleDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`relative border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer ${
              isDragging
                ? 'border-primary bg-primary/5'
                : selectedFile
                  ? 'border-primary/40 bg-muted/30'
                  : 'border-border hover:border-primary/50 hover:bg-muted/20'
            } ${isUploading ? 'pointer-events-none opacity-70' : ''}`}
          >
            <input
              ref={fileInputRef}
              type="file"
              className="hidden"
              onChange={(e) => handleFilePick(e.target.files?.[0] || null)}
              disabled={isUploading}
            />

            {selectedFile ? (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <FileIcon className="w-6 h-6" />
                </div>
                <div className="font-semibold text-sm text-foreground break-all max-w-md">
                  {selectedFile.name}
                </div>
                <div className="text-xs text-muted-foreground">
                  {formatBytes(selectedFile.size)}
                </div>
                {!isUploading && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedFile(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="h-7 text-xs text-muted-foreground hover:text-destructive mt-1"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Dosyayı Kaldır
                  </Button>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                  <UploadCloud className="w-6 h-6" />
                </div>
                <p className="text-sm font-medium text-foreground">
                  Dosyayı buraya sürükleyip bırakın veya seçmek için tıklayın
                </p>
                <p className="text-xs text-muted-foreground">
                  Tüm dosya türleri desteklenir • Tek seferde en fazla 2 GB
                </p>
              </div>
            )}
          </div>

          {/* Yükleme Ayarları */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-muted-foreground" />
                Saklama Süresi (Otomatik Silinme)
              </label>
              <Select value={expiryDays} onValueChange={(v) => v && setExpiryDays(v)} disabled={isUploading}>
                <SelectTrigger className="w-full">
                  <SelectValue>{EXPIRY_LABELS[expiryDays] || `${expiryDays} Gün`}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Gün</SelectItem>
                  <SelectItem value="3">3 Gün (Varsayılan)</SelectItem>
                  <SelectItem value="7">7 Gün</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground flex items-center gap-1.5">
                <Download className="w-3.5 h-3.5 text-muted-foreground" />
                İndirme Limiti
              </label>
              <Select value={maxDownloads} onValueChange={(v) => v && setMaxDownloads(v)} disabled={isUploading}>
                <SelectTrigger className="w-full">
                  <SelectValue>{MAX_DOWNLOADS_LABELS[maxDownloads] || maxDownloads}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unlimited">Sınırsız (Süre Dolana Kadar)</SelectItem>
                  <SelectItem value="1">1 İndirme (Tek Kullanımlık)</SelectItem>
                  <SelectItem value="5">5 İndirme</SelectItem>
                  <SelectItem value="10">10 İndirme</SelectItem>
                  <SelectItem value="25">25 İndirme</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Not Alanı */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-foreground">
              Alıcıya Not <span className="text-muted-foreground font-normal">(Opsiyonel)</span>
            </label>
            <Input
              placeholder="Örn: Hastane B Blok yangın projesi güncel çizimleri..."
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              disabled={isUploading}
            />
          </div>

          {/* Şifre Koruması */}
          <div className="rounded-lg border border-border/60 p-4 space-y-3 bg-muted/20">
            <div className="flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="text-sm font-medium text-foreground flex items-center gap-1.5">
                  <Lock className="w-4 h-4 text-primary" />
                  Şifre Koruması Ekle
                </div>
                <p className="text-xs text-muted-foreground">
                  Hassas dosyalar için indirme şifresi zorunlu kılın.
                </p>
              </div>
              <Switch
                checked={usePassword}
                onCheckedChange={handlePasswordToggle}
                disabled={isUploading}
              />
            </div>

            {usePassword && (
              <div className="flex flex-col sm:flex-row gap-2 pt-1">
                <div className="relative flex-1">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="İndirme şifresi girin veya üretin..."
                    className="font-mono pr-10 bg-background"
                    disabled={isUploading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    title={showPassword ? 'Gizle' : 'Göster'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setPassword(generateStrongPassword())}
                  disabled={isUploading}
                  className="shrink-0"
                >
                  <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                  Güçlü Şifre Üret
                </Button>
              </div>
            )}
          </div>

          {/* Canlı İlerleme Çubuğu */}
          {isUploading && progress && (
            <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 space-y-2.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-foreground flex items-center gap-2">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                  Yükleniyor... %{progress.percent}
                </span>
                <span className="text-muted-foreground">
                  {formatBytes(progress.loaded)} / {formatBytes(progress.total)}
                </span>
              </div>
              <div className="w-full h-2.5 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-150"
                  style={{ width: `${progress.percent}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Hız: {formatBytes(progress.speedBps)}/sn</span>
                <span>Kalan süre: {formatEta(progress.etaSeconds)}</span>
              </div>
            </div>
          )}

          {/* Yükleme / İptal Butonları */}
          <div className="flex items-center justify-end gap-2 pt-1">
            {isUploading ? (
              <Button type="button" variant="destructive" onClick={handleCancelUpload}>
                <X className="w-4 h-4 mr-1.5" />
                Yüklemeyi İptal Et
              </Button>
            ) : (
              <Button
                type="button"
                onClick={handleStartUpload}
                disabled={!selectedFile}
                className="min-w-[180px]"
              >
                <UploadCloud className="w-4 h-4 mr-1.5" />
                Yükle ve Link Oluştur
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      )}

      {/* Aktif Transferlerim Tablosu */}
      <Card className="border-border/60">
        <CardHeader className="pb-3 flex flex-row items-center justify-between gap-2">
          <div>
            <CardTitle className="text-base">
              {listScope === 'all' ? 'Tüm Aktif Transferler' : 'Aktif Transferlerim'}
            </CardTitle>
            <CardDescription className="text-xs">
              Süresi dolan dosyalar sunucudan her saat başı otomatik olarak temizlenir.
            </CardDescription>
          </div>
          {data?.canViewAll && (
            <div className="flex items-center gap-1 rounded-md border border-border/60 p-0.5 bg-muted/40">
              <button
                type="button"
                onClick={() => setSearchParams({ tab: activeTab === 'upload' ? 'upload' : 'my' })}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  listScope === 'mine' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Benimkiler
              </button>
              <button
                type="button"
                onClick={() => setSearchParams({ tab: 'all' })}
                className={`px-2.5 py-1 text-xs rounded font-medium transition-colors ${
                  listScope === 'all' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground'
                }`}
              >
                Tüm Kullanıcılar
              </button>
            </div>
          )}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="py-8 flex items-center justify-center text-sm text-muted-foreground gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Yükleniyor...
            </div>
          ) : !data?.transfers?.length ? (
            <div className="py-8 text-center text-sm text-muted-foreground">
              Henüz aktif bir dosya transferiniz bulunmuyor.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {data.transfers.map((item) => {
                const isExpired = new Date(item.expiresAt).getTime() <= Date.now();
                const isLimitReached =
                  item.maxDownloads !== null && item.downloadCount >= item.maxDownloads;
                const isInactive = isExpired || isLimitReached;
                const url = buildPublicShareUrl(item.token);

                return (
                  <div
                    key={item.id}
                    className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm text-foreground truncate max-w-[320px]">
                          {item.originalName}
                        </span>
                        <Badge variant="outline" className="text-[11px]">
                          {formatBytes(item.sizeBytes)}
                        </Badge>
                        {item.hasPassword && (
                          <Badge variant="secondary" className="text-[11px] gap-1">
                            <Lock className="w-3 h-3" />
                            Şifreli
                          </Badge>
                        )}
                        {isInactive && (
                          <Badge variant="destructive" className="text-[11px]">
                            {isExpired ? 'Süresi Doldu' : 'Limit Doldu'}
                          </Badge>
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-x-3 gap-y-1">
                        {listScope === 'all' && <span>Yükleyen: {item.uploadedByName}</span>}
                        <span>
                          İndirme: {item.downloadCount}
                          {item.maxDownloads ? ` / ${item.maxDownloads}` : ''}
                        </span>
                        <span>Kalan: {formatRemainingTime(item.expiresAt)}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {!isInactive && (
                        <>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            onClick={() => handleCopy(url, item.id, 'İndirme linki kopyalandı.')}
                          >
                            {copiedField === item.id ? (
                              <Check className="w-3.5 h-3.5 mr-1 text-emerald-600" />
                            ) : (
                              <Copy className="w-3.5 h-3.5 mr-1" />
                            )}
                            Linki Kopyala
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="E-posta ile Gönder"
                            onClick={() => {
                              setEmailDialogTransfer({
                                id: item.id,
                                originalName: item.originalName,
                                hasPassword: item.hasPassword,
                                plainPassword: null,
                              });
                              setIncludePasswordInEmail(false);
                            }}
                          >
                            <Mail className="w-4 h-4 text-muted-foreground" />
                          </Button>
                        </>
                      )}
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        title="Dosyayı Hemen Sil"
                        disabled={deleteMutation.isPending}
                        onClick={() => {
                          if (window.confirm(`"${item.originalName}" dosyası kalıcı olarak silinsin mi?`)) {
                            deleteMutation.mutate(item.id);
                          }
                        }}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* E-posta Gönderme Modalı */}
      <Dialog
        open={Boolean(emailDialogTransfer)}
        onOpenChange={(open) => !open && setEmailDialogTransfer(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>İndirme Bağlantısını E-posta ile Gönder</DialogTitle>
            <DialogDescription>
              {emailDialogTransfer?.originalName} dosyası için paylaşım bağlantısını doğrudan alıcıya gönderin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium">Alıcı E-posta Adresi</label>
              <Input
                type="email"
                placeholder="ornek@mlpcare.com"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium">Ek Mesaj (Opsiyonel)</label>
              <Input
                placeholder="Kısa bir açıklama yazabilirsiniz..."
                value={customEmailMessage}
                onChange={(e) => setCustomEmailMessage(e.target.value)}
              />
            </div>
            {emailDialogTransfer?.plainPassword && (
              <div className="flex items-center justify-between rounded-md border border-border/60 p-3">
                <div className="text-xs">
                  <div className="font-medium">İndirme şifresini e-postaya ekle</div>
                  <div className="text-muted-foreground">
                    Kapatırsanız şifreyi ayrı mesajla iletebilirsiniz.
                  </div>
                </div>
                <Switch
                  checked={includePasswordInEmail}
                  onCheckedChange={setIncludePasswordInEmail}
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEmailDialogTransfer(null)}>
              İptal
            </Button>
            <Button
              disabled={!recipientEmail.trim() || emailMutation.isPending}
              onClick={() => emailMutation.mutate()}
            >
              {emailMutation.isPending ? (
                <Loader2 className="w-4 h-4 mr-1.5 animate-spin" />
              ) : (
                <Mail className="w-4 h-4 mr-1.5" />
              )}
              Gönder
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
