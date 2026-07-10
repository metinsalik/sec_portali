import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Bot, Save, AlertCircle, Users, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
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
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h3 className="text-2xl font-bold tracking-tight">Telegram Bot Ayarları</h3>
        <p className="text-muted-foreground">
          Sisteme bağlı olan Telegram botunu yönetin. Kullanıcılar bu bot üzerinden bildirim alabilir.
        </p>
      </div>

      <form onSubmit={handleSave}>
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="w-5 h-5 text-blue-500" />
              Bot Konfigürasyonu
            </CardTitle>
            <CardDescription>
              BotFather üzerinden aldığınız token ve bot adını buraya girin.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg border">
              <div className="space-y-0.5">
                <Label>Telegram Botu Aktif</Label>
                <p className="text-sm text-muted-foreground">
                  Botu geçici olarak devre dışı bırakmak için kapatın.
                </p>
              </div>
              <Switch
                checked={formData.isActive}
                onCheckedChange={(c) => setFormData({ ...formData, isActive: c })}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="botToken">Bot Token</Label>
                <Input
                  id="botToken"
                  type="password"
                  placeholder="123456789:ABCdefGHIjklMNOpqrSTUvwxYZ"
                  value={formData.botToken}
                  onChange={(e) => setFormData({ ...formData, botToken: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="botUsername">Bot Kullanıcı Adı</Label>
                <Input
                  id="botUsername"
                  placeholder="SecPortaliBot"
                  value={formData.botUsername}
                  onChange={(e) => setFormData({ ...formData, botUsername: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="p-4 bg-blue-50/50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 flex gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>
                <strong>Not:</strong> Kaydet butonuna bastıktan sonra arka planda bot servisi yeniden başlatılacaktır. Eğer bilgiler doğruysa saniyeler içerisinde sisteminiz Telegram bildirimlerine hazır hale gelecektir.
              </p>
            </div>
          </CardContent>

          <CardFooter className="bg-muted/50 py-4 border-t px-6">
            <div className="flex justify-end w-full">
              <Button type="submit" disabled={updateMutation.isPending}>
                {updateMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                {!updateMutation.isPending && <Save className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-indigo-500" />
            Bağlı Kullanıcılar
          </CardTitle>
          <CardDescription>
            Telegram hesabını sisteme bağlamış olan kullanıcıların listesi.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {usersLoading ? (
            <div className="text-center p-4 text-muted-foreground">Kullanıcılar yükleniyor...</div>
          ) : !connectedUsers || connectedUsers.length === 0 ? (
            <div className="text-center p-8 bg-muted/20 border rounded-lg border-dashed">
              <p className="text-muted-foreground">Henüz Telegram'ı bağlamış bir kullanıcı yok.</p>
            </div>
          ) : (
            <div className="border rounded-md">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b">
                  <tr>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Kullanıcı Adı</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Ad Soyad</th>
                    <th className="h-10 px-4 text-left font-medium text-muted-foreground">Chat ID</th>
                  </tr>
                </thead>
                <tbody>
                  {connectedUsers.map((user: any) => (
                    <tr key={user.username} className="border-b last:border-0 hover:bg-muted/30">
                      <td className="p-4">{user.username}</td>
                      <td className="p-4">{user.fullName}</td>
                      <td className="p-4 font-mono text-xs">{user.telegramChatId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TelegramSettingsPage;
