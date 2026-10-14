import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bot, Save, AlertCircle, Users, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';

interface TelegramSettings {
  botToken: string;
  botUsername: string;
  isActive: boolean;
}

const TelegramSettingsPage = () => {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery<TelegramSettings>({
    queryKey: ['telegram-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/telegram');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const { data: connectedUsers, isLoading: usersLoading } = useQuery({
    queryKey: ['telegram-users'],
    queryFn: async () => {
      const res = await api.get('/settings/telegram/users');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const [formData, setFormData] = useState<TelegramSettings>({
    botToken: '',
    botUsername: '',
    isActive: true,
  });

  useEffect(() => {
    if (settings) {
      setFormData(settings);
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (newData: TelegramSettings) => {
      const res = await api.post('/settings/telegram', newData);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Ayarlar kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['telegram-settings'] });
      toast.success('Telegram ayarları başarıyla güncellendi.');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Ayarlar kaydedilirken bir hata oluştu.');
    }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Telegram Bot Ayarları</h1>
            <p className="text-xs text-muted-foreground">
              Sisteme bağlı olan Telegram botunu yönetin. Kullanıcılar bu bot üzerinden bildirim alabilir.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSave}>
        <Card className="shadow-xs border-border/60 rounded-lg">
          <CardHeader className="pb-3 border-b border-border/40">
            <div className="flex items-center gap-2 text-foreground font-semibold">
              <Bot className="w-4 h-4 text-primary" />
              <CardTitle className="text-sm font-semibold">Bot Konfigürasyonu</CardTitle>
            </div>
            <CardDescription className="text-xs">
              BotFather üzerinden aldığınız API token ve bot kullanıcı adını girin.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-4 pt-4">
            <div className="flex items-center justify-between p-3 bg-muted/30 rounded-md border border-border/60">
              <div className="space-y-0.5">
                <Label className="text-xs font-medium">Telegram Botu Aktif</Label>
                <p className="text-[11px] text-muted-foreground">
                  Botu geçici olarak devre dışı bırakmak için kapatın.
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="botToken" className="text-xs font-medium">Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  value={formData.botToken}
                  onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                  required
                  className="h-9 text-xs rounded-md"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="botUsername" className="text-xs font-medium">Bot Kullanıcı Adı</Label>
                <Input
                  id="botUsername"
                  placeholder="SecPortaliBot"
                  value={formData.botUsername}
                  onChange={(e) => setFormData({ ...formData, botUsername: e.target.value })}
                  required
                  className="h-9 text-xs rounded-md"
                />
              </div>
            </div>

            <Alert variant="default" className="bg-muted/40 border-border/60 rounded-lg">
              <AlertCircle className="h-4 w-4 text-primary" />
              <AlertTitle className="text-xs font-semibold">Önemli Not</AlertTitle>
              <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed mt-1">
                Kaydet butonuna bastıktan sonra arka planda bot servisi yeniden başlatılacaktır. Bilgiler doğruysa sisteminiz anında Telegram bildirimlerine hazır hale gelecektir.
              </AlertDescription>
            </Alert>
          </CardContent>

          <CardFooter className="bg-muted/10 py-3 border-t border-border/40 px-6 flex justify-end">
            <Button type="submit" disabled={updateMutation.isPending} className="h-9 text-xs px-4 rounded-md gap-2">
              {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              {updateMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </CardFooter>
        </Card>
      </form>

      <Card className="shadow-xs border-border/60 rounded-lg">
        <CardHeader className="pb-3 border-b border-border/40">
          <div className="flex items-center gap-2 text-foreground font-semibold">
            <Users className="w-4 h-4 text-primary" />
            <CardTitle className="text-sm font-semibold">Bağlı Kullanıcılar</CardTitle>
          </div>
          <CardDescription className="text-xs">
            Telegram hesabını sisteme bağlamış olan kullanıcıların listesi.
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-4">
          {usersLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          ) : !connectedUsers || connectedUsers.length === 0 ? (
            <div className="text-center p-8 bg-muted/20 border border-dashed border-border/60 rounded-md">
              <p className="text-xs text-muted-foreground">Henüz Telegram'ı bağlamış bir kullanıcı yok.</p>
            </div>
          ) : (
            <div className="border border-border/60 rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/40 hover:bg-muted/40">
                    <TableHead className="h-9 text-xs font-medium">Kullanıcı Adı</TableHead>
                    <TableHead className="h-9 text-xs font-medium">Ad Soyad</TableHead>
                    <TableHead className="h-9 text-xs font-medium">Chat ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {connectedUsers.map((u: any) => (
                    <TableRow key={u.username} className="hover:bg-muted/30">
                      <TableCell className="py-2.5 text-xs font-medium">{u.username}</TableCell>
                      <TableCell className="py-2.5 text-xs text-muted-foreground">{u.fullName}</TableCell>
                      <TableCell className="py-2.5 font-mono text-xs text-muted-foreground">{u.telegramChatId}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramSettingsPage;
