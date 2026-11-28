import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Mail, Save, Send, ShieldCheck, Loader2, AlertCircle, 
  CheckCircle2, Info, Lock, Server, AtSign, User
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface SmtpSettings {
  host: string;
  port: number;
  user: string;
  pass: string;
  secure: boolean;
  fromEmail: string;
  fromName: string;
}

const SmtpSettingsPage = () => {
  const queryClient = useQueryClient();
  const [testEmail, setTestEmail] = useState('');
  const [isTesting, setIsTesting] = useState(false);

  // Fetch current settings
  const { data: settings, isLoading } = useQuery<SmtpSettings>({
    queryKey: ['smtp-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/smtp');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const { data: systemUsers = [] } = useQuery<any[]>({
    queryKey: ['smtp-system-users'],
    queryFn: async () => {
      const res = await api.get('/settings/users');
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data.filter((u) => u.isActive && u.email) : [];
    },
  });

  const [formData, setFormData] = useState<SmtpSettings>({
    host: '',
    port: 587,
    user: '',
    pass: '',
    secure: false,
    fromEmail: '',
    fromName: 'SEC Portalı'
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  // Update mutation
  const updateMutation = useMutation({
    mutationFn: async (newData: SmtpSettings) => {
      const res = await api.post('/settings/smtp', newData);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ayarlar kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['smtp-settings'] });
      toast.success('SMTP ayarları başarıyla güncellendi.');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Ayarlar kaydedilirken bir hata oluştu.');
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const [testSubject, setTestSubject] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [isDownloadingEml, setIsDownloadingEml] = useState(false);

  const buildCustomTestHtml = () => {
    if (!testMessage.trim()) return undefined;
    const escaped = testMessage
      .trim()
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/\n/g, '<br/>');
    return `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;"><h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;">${testSubject.trim() || 'İSG Portalı E-posta Bildirimi'}</h2><p style="color:#334155;font-size:14px;line-height:1.6;">${escaped}</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/><p style="color:#94a3b8;font-size:12px;">Bu e-posta İSG Portalı üzerinden hazırlanmıştır.</p></div>`;
  };

  const handleDownloadEml = async () => {
    setIsDownloadingEml(true);
    try {
      const res = await api.post('/settings/eml-draft', {
        to: testEmail || undefined,
        subject: testSubject.trim() || 'İSG Portalı — Outlook Taslağı',
        html: buildCustomTestHtml(),
        filename: 'isg-hizli-mail',
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'EML taslağı oluşturulamadı');
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'isg-hizli-mail.eml';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      toast.success('Outlook taslağı (.eml) indirildi. Çift tıklayıp Outlook 365 üzerinden gönderebilirsiniz.');
    } catch (error: any) {
      toast.error(error.message || 'EML taslağı indirilemedi.');
    } finally {
      setIsDownloadingEml(false);
    }
  };

  const handleOutlookPreset = () => {
    setFormData(prev => ({
      ...prev,
      host: 'smtp.office365.com',
      port: 587,
      secure: false,
    }));
    toast.info('Outlook / Office 365 SMTP ayarları (smtp.office365.com:587) dolduruldu. E-posta ve şifrenizi girip kaydedin.');
  };

  const handleTestMail = async () => {
    if (!testEmail) {
      toast.error('Lütfen bir alıcı e-posta adresi girin veya sistemden kullanıcı seçin.');
      return;
    }

    setIsTesting(true);
    try {
      const payload: { to: string; subject?: string; html?: string } = { to: testEmail };
      if (testSubject.trim()) payload.subject = testSubject.trim();
      if (testMessage.trim()) {
        const escaped = testMessage
          .trim()
          .replace(/&/g, '&amp;')
          .replace(/</g, '&lt;')
          .replace(/>/g, '&gt;')
          .replace(/\n/g, '<br/>');
        payload.html = `<div style="font-family:Segoe UI,Arial,sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #e2e8f0;border-radius:10px;background:#ffffff;"><h2 style="margin:0 0 12px;color:#0f172a;font-size:18px;">${payload.subject || 'İSG Portalı E-posta Bildirimi'}</h2><p style="color:#334155;font-size:14px;line-height:1.6;">${escaped}</p><hr style="border:none;border-top:1px solid #e2e8f0;margin:20px 0;"/><p style="color:#94a3b8;font-size:12px;">Bu e-posta İSG Portalı SMTP ayarları üzerinden gönderilmiştir.</p></div>`;
      }

      const res = await api.post('/settings/smtp/test', payload);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Test maili gönderilemedi');
      }
      toast.success('E-posta başarıyla gönderildi. Lütfen gelen kutusunu kontrol edin.');
    } catch (error: any) {
      toast.error(error.message || 'E-posta gönderilemedi.');
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Mail className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">E-posta Ayarları</h1>
            <p className="text-xs text-muted-foreground">
              Sistem bildirimleri ve rapor gönderimleri için kullanılacak kurumsal SMTP ayarlarını yapılandırın.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="lg:col-span-2">
          <Card className="shadow-xs border-border/60 rounded-lg">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2 text-foreground font-semibold">
                    <Server className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-semibold">Sunucu Yapılandırması</CardTitle>
                  </div>
                  <CardDescription className="text-xs mt-1">
                    Kurumsal e-posta sunucusu (SMTP / Outlook) bağlantı parametrelerini girin.
                  </CardDescription>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleOutlookPreset}
                  className="h-8 text-xs gap-1.5 rounded-md"
                >
                  <Mail className="w-3.5 h-3.5 text-primary" />
                  Outlook / Office 365 Doldur
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pt-4">
              <form id="smtp-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="host" className="text-xs font-medium">SMTP Sunucu (Host)</Label>
                    <div className="relative">
                      <Input 
                        id="host"
                        placeholder="smtp.office365.com"
                        value={formData.host}
                        onChange={e => setFormData({ ...formData, host: e.target.value })}
                        required
                        className="pl-9 h-9 text-xs rounded-md"
                      />
                      <Server className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="port" className="text-xs font-medium">Port</Label>
                    <Input 
                      id="port"
                      type="number"
                      placeholder="587"
                      value={formData.port}
                      onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) || 587 })}
                      required
                      className="h-9 text-xs rounded-md"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="user" className="text-xs font-medium">Kullanıcı Adı / E-posta</Label>
                    <div className="relative">
                      <Input 
                        id="user"
                        placeholder="info@kurum.com"
                        value={formData.user}
                        onChange={e => setFormData({ ...formData, user: e.target.value })}
                        required
                        className="pl-9 h-9 text-xs rounded-md"
                      />
                      <AtSign className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="pass" className="text-xs font-medium">Şifre</Label>
                    <div className="relative">
                      <Input 
                        id="pass"
                        type="password"
                        placeholder="••••••••"
                        value={formData.pass}
                        onChange={e => setFormData({ ...formData, pass: e.target.value })}
                        required
                        className="pl-9 h-9 text-xs rounded-md"
                      />
                      <Lock className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-md border border-border/60 bg-muted/30">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">SSL/TLS Güvenli Bağlantı</Label>
                    <p className="text-[11px] text-muted-foreground">Port 465 için SSL, 587 için genellikle STARTTLS kullanılır.</p>
                  </div>
                  <Switch 
                    checked={formData.secure}
                    onCheckedChange={checked => setFormData({ ...formData, secure: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-border/40">
                  <div className="space-y-1.5">
                    <Label htmlFor="fromEmail" className="text-xs font-medium">Gönderen E-posta (From)</Label>
                    <Input 
                      id="fromEmail"
                      placeholder="no-reply@kurum.com"
                      value={formData.fromEmail}
                      onChange={e => setFormData({ ...formData, fromEmail: e.target.value })}
                      required
                      className="h-9 text-xs rounded-md"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="fromName" className="text-xs font-medium">Gönderen Adı</Label>
                    <Input 
                      id="fromName"
                      placeholder="SEC Portalı Bildirim"
                      value={formData.fromName}
                      onChange={e => setFormData({ ...formData, fromName: e.target.value })}
                      className="h-9 text-xs rounded-md"
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t border-border/40 flex justify-end py-3 px-6">
              <Button 
                type="submit" 
                form="smtp-form"
                disabled={updateMutation.isPending}
                className="gap-2 h-9 text-xs px-4 rounded-md"
              >
                {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Değişiklikleri Kaydet
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-4">
          {/* Test Card */}
          <Card className="shadow-xs border-border/60 rounded-lg">
            <CardHeader className="pb-3 border-b border-border/40">
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Send className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Bağlantı Testi & Hızlı Mail</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Sistemdeki bir kişiyi seçin veya e-posta adresi yazarak test/bildirim maili gönderin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {systemUsers.length > 0 && (
                <div className="space-y-1.5">
                  <Label htmlFor="system-user-select" className="text-xs font-medium">Sistemdeki Kişiden Seç</Label>
                  <select
                    id="system-user-select"
                    value={systemUsers.some(u => u.email === testEmail) ? testEmail : ''}
                    onChange={e => {
                      if (e.target.value) setTestEmail(e.target.value);
                    }}
                    className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-xs shadow-xs transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                  >
                    <option value="">-- Kişi seçiniz ({systemUsers.length}) --</option>
                    {systemUsers.map(u => (
                      <option key={u.username} value={u.email || ''}>
                        {u.fullName} {u.department ? `(${u.department})` : ''} — {u.email}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="test-email" className="text-xs font-medium">Alıcı E-posta</Label>
                <Input 
                  id="test-email"
                  type="email"
                  placeholder="test@ornek.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                  className="h-9 text-xs rounded-md"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="test-subject" className="text-xs font-medium">Konu (İsteğe bağlı)</Label>
                <Input
                  id="test-subject"
                  placeholder="Örn: İSG Portalı SMTP Testi"
                  value={testSubject}
                  onChange={e => setTestSubject(e.target.value)}
                  className="h-9 text-xs rounded-md"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="test-message" className="text-xs font-medium">Mesaj (İsteğe bağlı)</Label>
                <textarea
                  id="test-message"
                  rows={3}
                  placeholder="Boş bırakılırsa standart test e-postası gönderilir..."
                  value={testMessage}
                  onChange={e => setTestMessage(e.target.value)}
                  className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-xs placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                />
              </div>
              <div className="grid grid-cols-1 gap-2">
                <Button 
                  variant="outline" 
                  className="w-full gap-2 h-9 text-xs rounded-md"
                  onClick={handleTestMail}
                  disabled={isTesting || !formData.host}
                >
                  {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  SMTP ile Gönder
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="w-full gap-2 h-9 text-xs rounded-md"
                  onClick={handleDownloadEml}
                  disabled={isDownloadingEml}
                >
                  {isDownloadingEml ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  Outlook 365 Taslağı İndir (.eml)
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Info Card */}
          <Alert variant="default" className="bg-muted/40 border-border/60 rounded-lg">
            <Info className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-semibold">Yapılandırma İpucu</AlertTitle>
            <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              Office 365 veya Google Workspace için 2FA devredeyse "Uygulama Şifresi" kullanmanız gereklidir. TLS bağlantıları için genellikle port 587 tercih edilir.
            </AlertDescription>
          </Alert>

          {/* Status Badge */}
          <div className="p-4 rounded-lg border border-border/60 bg-card flex flex-col items-center justify-center text-center space-y-2">
            <div className={cn(
              "w-9 h-9 rounded-md flex items-center justify-center",
              settings?.host ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"
            )}>
              {settings?.host ? <ShieldCheck className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
            </div>
            <div>
              <p className="text-xs font-semibold text-foreground">Sistem Durumu</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {settings?.host ? "SMTP Yapılandırıldı" : "Yapılandırma Bekleniyor"}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmtpSettingsPage;
