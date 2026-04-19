import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Bell, Save, Loader2, Mail, Layout, Plus,
  Settings2, ShieldAlert, AlertTriangle, Info, CheckCircle, X
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
    case 'critical': return <ShieldAlert className="w-4 h-4 text-red-600" />;
    case 'high': return <AlertTriangle className="w-4 h-4 text-orange-500" />;
    case 'normal': return <Info className="w-4 h-4 text-blue-500" />;
    case 'low': return <CheckCircle className="w-4 h-4 text-slate-400" />;
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
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
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <Bell className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Bildirim Ayarları</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Sistem genelindeki bildirimlerin kanallarını ve öncelik seviyelerini yönetin.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Bildirim Türü
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Yeni Bildirim Tanımla</DialogTitle>
                <DialogDescription>
                  Sisteme yeni bir bildirim tetikleyicisi ekleyin. Bu işlem otomatik olarak bir e-posta şablonu da oluşturur.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Kod</Label>
                  <Input name="code" placeholder="MISSING_DOC_REMINDER" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Başlık/Ad</Label>
                  <Input name="name" placeholder="Eksik Belge Hatırlatıcı" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Modül</Label>
                  <Select name="module" defaultValue="OPERATIONS">
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Öncelik</Label>
                  <Select name="priority" defaultValue="normal">
                    <SelectTrigger className="col-span-3">
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
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right text-xs pt-2">Açıklama</Label>
                  <Textarea name="description" placeholder="Örn: İSG defteri yüklenmeyen tesisler için periyodik uyarı." className="col-span-3 min-h-[80px]" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Oluştur
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {groupedConfigs && Object.entries(groupedConfigs).map(([module, moduleConfigs]) => (
        <Card key={module} className="shadow-sm border-border/60 overflow-hidden">
          <CardHeader className="bg-muted/30 border-b py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">{getModuleLabel(module)}</CardTitle>
              </div>
              <Badge variant="outline" className="bg-background">{moduleConfigs.length} Bildirim Türü</Badge>
            </div>
            <CardDescription>
              {getModuleLabel(module)} modülü için bildirim tercihlerini özelleştirin.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y">
              {moduleConfigs.map((config) => (
                <div key={config.code} className="p-4 md:p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-muted/5 transition-colors">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm md:text-base">{config.code.replace(/_/g, ' ')}</span>
                      <PriorityIcon priority={config.priority} />
                    </div>
                    <p className="text-xs md:text-sm text-muted-foreground leading-relaxed max-w-xl">
                      {config.description}
                    </p>
                  </div>

                  <div className="flex items-center gap-6 md:gap-8 self-end md:self-center bg-background/50 p-2 md:p-0 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">E-posta</Label>
                      <Switch 
                        checked={config.emailEnabled} 
                        onCheckedChange={(checked) => updateMutation.mutate({ code: config.code, data: { emailEnabled: checked } })}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                    <div className="flex items-center gap-2 border-l pl-6">
                      <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Uygulama</Label>
                      <Switch 
                        checked={config.appEnabled} 
                        onCheckedChange={(checked) => updateMutation.mutate({ code: config.code, data: { appEnabled: checked } })}
                        disabled={updateMutation.isPending}
                      />
                    </div>
                    <div className="flex items-center gap-2 border-l pl-6 min-w-[140px]">
                      <Select 
                        value={config.priority} 
                        onValueChange={(val) => updateMutation.mutate({ code: config.code, data: { priority: val as any } })}
                        disabled={updateMutation.isPending}
                      >
                        <SelectTrigger className="h-8 text-xs">
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
        <div className="p-12 text-center border-2 border-dashed rounded-xl space-y-3">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
            <Info className="w-6 h-6 text-muted-foreground" />
          </div>
          <p className="text-muted-foreground">Henüz yapılandırılmış bildirim bulunmuyor.</p>
        </div>
      )}
    </div>
  );
};

// Helper for Label if not imported correctly
const Label = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <span className={className}>{children}</span>
);

export default NotificationSettingsPage;
