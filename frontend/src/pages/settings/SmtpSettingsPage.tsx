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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">E-posta Ayarları</h1>
        <p className="text-muted-foreground text-sm">
          Sistem bildirimleri ve rapor gönderimleri için kullanılacak kurumsal SMTP ayarlarını buradan yapılandırın.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Settings Card */}
        <div className="md:col-span-2">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2 mb-1 text-primary">
                <Server className="w-5 h-5" />
                <CardTitle className="text-lg">Sunucu Yapılandırması</CardTitle>
              </div>
              <CardDescription>
                Kurumsal mail sunucusu (SMTP) detaylarını girin.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form id="smtp-form" onSubmit={handleSave} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="host">SMTP Sunucu (Host)</Label>
                    <div className="relative">
                      <Input 
                        id="host"
                        placeholder="smtp.office365.com"
                        value={formData.host}
                        onChange={e => setFormData({ ...formData, host: e.target.value })}
                        required
                        className="pl-9"
                      />
                      <Server className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="port">Port</Label>
                    <Input 
                      id="port"
                      type="number"
                      placeholder="587"
                      value={formData.port}
                      onChange={e => setFormData({ ...formData, port: parseInt(e.target.value) })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label htmlFor="user">Kullanıcı Adı / E-posta</Label>
                    <div className="relative">
                      <Input 
                        id="user"
                        placeholder="info@kurum.com"
                        value={formData.user}
                        onChange={e => setFormData({ ...formData, user: e.target.value })}
                        required
                        className="pl-9"
                      />
                      <AtSign className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="pass">Şifre</Label>
                    <div className="relative">
                      <Input 
                        id="pass"
                        type="password"
                        placeholder="••••••••"
                        value={formData.pass}
                        onChange={e => setFormData({ ...formData, pass: e.target.value })}
                        required
                        className="pl-9"
                      />
                      <Lock className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border bg-muted/30 mt-4">
                  <div className="space-y-0.5">
                    <Label className="text-base">SSL/TLS Güvenli Bağlantı</Label>
                    <p className="text-xs text-muted-foreground">Port 465 için SSL, diğer portlar için genellikle TLS kullanılır.</p>
                  </div>
                  <Switch 
                    checked={formData.secure}
                    onCheckedChange={checked => setFormData({ ...formData, secure: checked })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label htmlFor="fromEmail">Gönderen E-posta (From)</Label>
                    <Input 
                      id="fromEmail"
                      placeholder="no-reply@kurum.com"
                      value={formData.fromEmail}
                      onChange={e => setFormData({ ...formData, fromEmail: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="fromName">Gönderen Adı</Label>
                    <Input 
                      id="fromName"
                      placeholder="SEC Portalı Bildirim"
                      value={formData.fromName}
                      onChange={e => setFormData({ ...formData, fromName: e.target.value })}
                    />
                  </div>
                </div>
              </form>
            </CardContent>
            <CardFooter className="bg-muted/10 border-t flex justify-end py-4">
              <Button 
                type="submit" 
                form="smtp-form"
                disabled={updateMutation.isPending}
                className="gap-2 px-6"
              >
                {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Değişiklikleri Kaydet
              </Button>
            </CardFooter>
          </Card>
        </div>

        {/* Sidebar Cards */}
        <div className="space-y-6">
          {/* Test Card */}
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2 mb-1 text-orange-500">
                <Send className="w-5 h-5" />
                <CardTitle className="text-lg">Bağlantı Testi</CardTitle>
              </div>
              <CardDescription>
                Yapılandırmanın çalıştığını doğrulamak için bir test maili gönderin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="test-email">Alıcı E-posta</Label>
                <Input 
                  id="test-email"
                  type="email"
                  placeholder="test@örnek.com"
                  value={testEmail}
                  onChange={e => setTestEmail(e.target.value)}
                />
              </div>
              <Button 
                variant="outline" 
                className="w-full gap-2 border-orange-200 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20"
                onClick={handleTestMail}
                disabled={isTesting || !formData.host}
              >
                {isTesting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
                Test Maili Gönder
              </Button>
            </CardContent>
          </Card>

          {/* Info/Warning Card */}
          <Alert variant="default" className="bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertTitle className="text-blue-700 dark:text-blue-400 font-semibold">Önemli Bilgi</AlertTitle>
            <AlertDescription className="text-blue-600/80 dark:text-blue-400/70 text-xs">
              Gmail veya Outlook gibi servisler kullanıyorsanız, "Uygulama Şifreleri" oluşturmanız gerekebilir. TLS bağlantıları için genellikle port 587 tercih edilmelidir.
            </AlertDescription>
          </Alert>

          {/* Status Badge */}
          <div className="p-4 rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-center space-y-2">
            <div className={cn(
              "w-10 h-10 rounded-full flex items-center justify-center",
              settings?.host ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"
            )}>
              {settings?.host ? <ShieldCheck className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-semibold">Sistem Durumu</p>
              <p className="text-xs text-muted-foreground">
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
