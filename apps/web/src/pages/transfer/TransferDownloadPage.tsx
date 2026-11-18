import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Download,
  File as FileIcon,
  Lock,
  Clock,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  User as UserIcon,
  FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  fetchPublicTransferInfo,
  formatBytes,
  formatRemainingTime,
  getPublicDownloadUrl,
  verifyPublicTransferPassword,
} from '@/services/transferApi';

export default function TransferDownloadPage() {
  const { token } = useParams<{ token: string }>();
  const [password, setPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [downloadStarted, setDownloadStarted] = useState(false);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['public-transfer-info', token],
    queryFn: () => fetchPublicTransferInfo(token || ''),
    enabled: Boolean(token),
    retry: false,
  });

  const triggerNativeDownload = (url: string) => {
    setDownloadStarted(true);
    window.location.href = url;
    // İndirme sayacını birkaç saniye sonra güncelle
    setTimeout(() => {
      refetch();
    }, 2500);
  };

  const handleDirectDownload = () => {
    if (!token) return;
    triggerNativeDownload(getPublicDownloadUrl(token));
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    if (!password.trim()) {
      setPasswordError('Lütfen indirme şifresini girin.');
      return;
    }

    setIsVerifying(true);
    setPasswordError(null);
    try {
      const ticket = await verifyPublicTransferPassword(token, password.trim());
      triggerNativeDownload(getPublicDownloadUrl(token, ticket));
      setPassword('');
    } catch (err: unknown) {
      setPasswordError(err instanceof Error ? err.message : 'Şifre doğrulanamadı.');
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-background text-foreground">
      {/* Sade Kurumsal Üst Bar */}
      <header className="border-b border-border/60 bg-card/80 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-muted flex items-center justify-center overflow-hidden">
              <img src="/mlpcare.jpg" alt="MLP Care" className="w-full h-full object-contain" />
            </div>
            <div>
              <div className="text-sm font-semibold leading-tight">HSE Portalı</div>
              <div className="text-[11px] text-muted-foreground">Kurumsal Dosya Transferi</div>
            </div>
          </div>
          <Badge variant="outline" className="text-[11px] gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            Güvenli Paylaşım
          </Badge>
        </div>
      </header>

      {/* Ana İçerik */}
      <main className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-lg border-border/60 shadow-sm">
          {isLoading ? (
            <CardContent className="py-14 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Dosya bilgileri kontrol ediliyor...</p>
            </CardContent>
          ) : !data || data.status !== 'active' ? (
            <CardContent className="py-12 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-amber-500/10 text-amber-600 mx-auto flex items-center justify-center">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <h2 className="text-lg font-semibold text-foreground">
                {data?.status === 'expired'
                  ? 'Paylaşım Süresi Dolmuş'
                  : data?.status === 'limit_reached'
                    ? 'İndirme Limitine Ulaşıldı'
                    : data?.status === 'deleted'
                      ? 'Dosya Silinmiş'
                      : 'Bağlantı Geçersiz'}
              </h2>
              <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                {data?.error || 'Aradığınız dosya artık mevcut değil veya süresi dolduğu için otomatik silinmiş.'}
              </p>
            </CardContent>
          ) : (
            <>
              <CardHeader className="text-center pb-4">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-3 flex items-center justify-center">
                  <FileIcon className="w-7 h-7" />
                </div>
                <CardTitle className="text-lg break-all leading-snug">
                  {data.originalName}
                </CardTitle>
                <CardDescription className="flex items-center justify-center gap-2 pt-1 flex-wrap">
                  <Badge variant="secondary">{formatBytes(data.sizeBytes || 0)}</Badge>
                  {data.hasPassword && (
                    <Badge variant="outline" className="gap-1">
                      <Lock className="w-3 h-3" />
                      Şifre Korumalı
                    </Badge>
                  )}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-5">
                {/* Metadata Bilgileri */}
                <div className="rounded-lg border border-border/60 bg-muted/30 p-3.5 space-y-2 text-xs">
                  {data.uploadedByName && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <UserIcon className="w-3.5 h-3.5" />
                        Gönderen
                      </span>
                      <span className="font-medium text-foreground">{data.uploadedByName}</span>
                    </div>
                  )}
                  {data.expiresAt && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5" />
                        Otomatik Silinme
                      </span>
                      <span className="font-medium text-foreground">
                        {formatRemainingTime(data.expiresAt)} sonra
                      </span>
                    </div>
                  )}
                  {data.maxDownloads && (
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-muted-foreground flex items-center gap-1.5">
                        <Download className="w-3.5 h-3.5" />
                        Kalan İndirme Hakkı
                      </span>
                      <span className="font-medium text-foreground">
                        {Math.max(0, data.maxDownloads - (data.downloadCount || 0))} / {data.maxDownloads}
                      </span>
                    </div>
                  )}
                </div>

                {/* Gönderici Notu */}
                {data.note && (
                  <div className="rounded-lg border border-border/60 bg-background p-3.5 space-y-1">
                    <div className="text-[11px] font-medium text-muted-foreground flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5" />
                      Gönderici Notu
                    </div>
                    <p className="text-sm text-foreground whitespace-pre-wrap">{data.note}</p>
                  </div>
                )}

                {/* İndirme Aksiyonu */}
                {data.hasPassword ? (
                  <form onSubmit={handlePasswordSubmit} className="space-y-3">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-foreground">
                        Bu dosyayı indirmek için şifre girin
                      </label>
                      <Input
                        type="password"
                        placeholder="İndirme şifresi..."
                        value={password}
                        onChange={(e) => {
                          setPassword(e.target.value);
                          if (passwordError) setPasswordError(null);
                        }}
                        autoFocus
                        disabled={isVerifying}
                      />
                      {passwordError && (
                        <p className="text-xs text-destructive font-medium">{passwordError}</p>
                      )}
                    </div>
                    <Button type="submit" className="w-full h-11" disabled={isVerifying}>
                      {isVerifying ? (
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      ) : (
                        <Download className="w-4 h-4 mr-2" />
                      )}
                      Şifreyi Doğrula ve İndir
                    </Button>
                  </form>
                ) : (
                  <Button type="button" onClick={handleDirectDownload} className="w-full h-11">
                    <Download className="w-4 h-4 mr-2" />
                    Dosyayı İndir ({formatBytes(data.sizeBytes || 0)})
                  </Button>
                )}

                {downloadStarted && (
                  <p className="text-xs text-center text-emerald-600 dark:text-emerald-400">
                    İndirme başlatıldı. Tarayıcınızın indirilenler bölümünü kontrol edebilirsiniz.
                  </p>
                )}
              </CardContent>
            </>
          )}
        </Card>
      </main>

      <footer className="py-4 text-center text-[11px] text-muted-foreground">
        MLP Care • HSE Portalı Kurumsal Dosya Transferi
      </footer>
    </div>
  );
}
