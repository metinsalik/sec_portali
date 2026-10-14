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

  const handleTestMail = async () => {
    if (!testEmail) {
      toast.error('Lütfen bir test e-posta adresi girin.');
      return;
    }

    setIsTesting(true);
    try {
      const res = await api.post('/settings/smtp/test', { to: testEmail });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Test maili gönderilemedi');
      }
      toast.success('Test e-postası başarıyla gönderildi. Lütfen gelen kutunuzu kontrol edin.');
    } catch (error: any) {
      toast.error(error.message || 'Test e-postası gönderilemedi.');
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
              <div className="flex items-center gap-2 text-foreground font-semibold">
                <Server className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">Sunucu Yapılandırması</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Kurumsal e-posta sunucusu (SMTP) bağlantı parametrelerini girin.
              </CardDescription>
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
                <CardTitle className="text-sm font-semibold">Bağlantı Testi</CardTitle>
              </div>
              <CardDescription className="text-xs">
                Yapılandırmanın çalıştığını test etmek için bir e-posta gönderin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
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
              <Button 
                variant="outline" 
                className="w-full gap-2 h-9 text-xs rounded-md"
                onClick={handleTestMail}
                disabled={isTesting || !formData.host}
              >
                {isTesting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                Test Maili Gönder
              </Button>
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
