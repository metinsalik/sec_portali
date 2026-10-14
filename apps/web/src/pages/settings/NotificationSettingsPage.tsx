import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Bell, Loader2, Plus, Settings2, ShieldAlert, AlertTriangle, Info, CheckCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';

interface NotificationConfig {
  code: string;
  module: string;
  description: string;
  emailEnabled: boolean;
  appEnabled: boolean;
  priority: 'low' | 'normal' | 'high' | 'critical';
}

const PriorityIcon = ({ priority }: { priority: string }) => {
  switch (priority) {
    case 'critical': return <ShieldAlert className="w-3.5 h-3.5 text-destructive" />;
    case 'high': return <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />;
    case 'normal': return <Info className="w-3.5 h-3.5 text-primary" />;
    case 'low': return <CheckCircle className="w-3.5 h-3.5 text-muted-foreground" />;
    default: return null;
  }
};

const NotificationSettingsPage = () => {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = React.useState(false);

  const { data: configs, isLoading } = useQuery<NotificationConfig[]>({
    queryKey: ['notification-configs'],
    queryFn: async () => {
      const res = await api.get('/settings/notification-configs');
      if (!res.ok) throw new Error('Bildirim ayarları yüklenemedi');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ code, data }: { code: string, data: Partial<NotificationConfig> }) => {
      const res = await api.put(`/settings/notification-configs/${code}`, data);
      if (!res.ok) throw new Error('Ayarlar kaydedilemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-configs'] });
      toast.success('Bildirim ayarı güncellendi.');
    },
    onError: () => {
      toast.error('Ayarlar kaydedilirken bir hata oluştu.');
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/notification-configs', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Bildirim oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-configs'] });
      toast.success('Yeni bildirim türü başarıyla oluşturuldu.');
      setIsCreateOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      code: formData.get('code'),
      name: formData.get('name'),
      module: formData.get('module'),
      description: formData.get('description'),
      priority: formData.get('priority'),
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Group configs by module
  const groupedConfigs = configs?.reduce((acc, config) => {
    const mod = config.module || 'OTHERS';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(config);
    return acc;
  }, {} as Record<string, NotificationConfig[]>);

  const getModuleLabel = (module: string) => {
    switch (module.toUpperCase()) {
      case 'OPERATIONS': return 'Operasyonlar';
      case 'FACILITIES': return 'Tesis Yönetimi';
      case 'PANEL': return 'Yönetim Paneli';
      case 'SYSTEM': return 'Sistem';
      default: return module;
    }
  };

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Bildirim Ayarları</h1>
              <p className="text-xs text-muted-foreground">
                Sistem genelindeki bildirimlerin kanallarını ve öncelik seviyelerini yönetin.
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-9 text-xs px-3.5 rounded-md">
              <Plus className="w-3.5 h-3.5" />
              Yeni Bildirim Türü
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] rounded-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Yeni Bildirim Tanımla</DialogTitle>
                <DialogDescription className="text-xs">
                  Sisteme yeni bir bildirim tetikleyicisi ekleyin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Kod</Label>
                  <Input name="code" placeholder="MISSING_DOC_REMINDER" className="h-9 text-xs rounded-md" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Başlık / Ad</Label>
                  <Input name="name" placeholder="Eksik Belge Hatırlatıcı" className="h-9 text-xs rounded-md" required />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Modül</Label>
                    <Select name="module" defaultValue="OPERATIONS">
                      <SelectTrigger className="h-9 text-xs rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="OPERATIONS">Operasyonlar</SelectItem>
                        <SelectItem value="FACILITIES">Tesis Yönetimi</SelectItem>
                        <SelectItem value="PANEL">Yönetim Paneli</SelectItem>
                        <SelectItem value="SYSTEM">Sistem</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs font-medium">Öncelik</Label>
                    <Select name="priority" defaultValue="normal">
                      <SelectTrigger className="h-9 text-xs rounded-md">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Düşük</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">Yüksek</SelectItem>
                        <SelectItem value="critical">Kritik</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Açıklama</Label>
                  <Textarea name="description" placeholder="Örn: İSG defteri yüklenmeyen tesisler için periyodik uyarı." className="min-h-[70px] text-xs rounded-md" />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="h-9 text-xs rounded-md">
                  Vazgeç
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="h-9 text-xs rounded-md">
                  {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groupedConfigs && Object.entries(groupedConfigs).map(([module, moduleConfigs]) => (
        <Card key={module} className="shadow-xs border-border/60 rounded-lg overflow-hidden">
          <CardHeader className="bg-muted/30 border-b border-border/40 py-3 px-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-4 h-4 text-primary" />
                <CardTitle className="text-sm font-semibold">{getModuleLabel(module)}</CardTitle>
              </div>
              <Badge variant="outline" className="text-[10px] font-normal px-2 py-0.5 rounded-md">{moduleConfigs.length} Bildirim Türü</Badge>
            </div>
            <CardDescription className="text-xs">
              {getModuleLabel(module)} modülü için bildirim tercihlerini özelleştirin.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border/50">
              {moduleConfigs.map((config) => (
                <div key={config.code} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/20 transition-colors">
                  <div className="space-y-1 flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-xs text-foreground">{config.code.replace(/_/g, ' ')}</span>
                      <PriorityIcon priority={config.priority} />
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed max-w-xl">
                      {config.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-5 self-end md:self-center shrink-0">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs text-muted-foreground">E-posta</Label>
                      <Switch 
                        checked={config.emailEnabled} 
                        onCheckedChange={(checked) => updateMutation.mutate({ code: config.code, data: { emailEnabled: checked } })}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                    <div className="flex items-center gap-2 border-l border-border/60 pl-5">
                      <Label className="text-xs text-muted-foreground">Uygulama</Label>
                      <Switch 
                        checked={config.appEnabled} 
                        onCheckedChange={(checked) => updateMutation.mutate({ code: config.code, data: { appEnabled: checked } })}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                    <div className="border-l border-border/60 pl-5 min-w-[120px]">
                      <Select 
                        value={config.priority} 
                        onValueChange={(val) => updateMutation.mutate({ code: config.code, data: { priority: val as any } })}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="h-8 text-xs rounded-md">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Düşük</SelectItem>
                          <SelectItem value="normal">Normal</SelectItem>
                          <SelectItem value="high">Yüksek</SelectItem>
                          <SelectItem value="critical">Kritik</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {Object.keys(groupedConfigs || {}).length === 0 && (
        <div className="p-10 text-center border border-dashed border-border/60 rounded-lg space-y-2">
          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center mx-auto text-muted-foreground">
            <Info className="w-5 h-5" />
          </div>
          <p className="text-xs text-muted-foreground">Henüz yapılandırılmış bildirim bulunmuyor.</p>
        </div>
      )}
    </div>
  );
};

export default NotificationSettingsPage;
