import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  FileText, Save, Loader2, Edit3, Plus,
  ChevronRight, Info, Mail, Laptop, Variable, X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

interface NotificationTemplate {
  code: string;
  name: string;
  module: string;
  subject: string;
  body: string;
}

const EmailTemplatesPage = () => {
  const queryClient = useQueryClient();
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: templates, isLoading } = useQuery<NotificationTemplate[]>({
    queryKey: ['notification-templates'],
    queryFn: async () => {
      const res = await api.get('/settings/notification-templates');
      if (!res.ok) throw new Error('Şablonlar yüklenemedi');
      return res.json();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ code, data }: { code: string, data: Partial<NotificationTemplate> }) => {
      const res = await api.put(`/settings/notification-templates/${code}`, data);
      if (!res.ok) throw new Error('Şablon kaydedilemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Şablon başarıyla güncellendi.');
    },
    onError: () => {
      toast.error('Şablon kaydedilirken bir hata oluştu.');
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/notification-configs', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Şablon oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['notification-templates'] });
      toast.success('Yeni şablon başarıyla oluşturuldu.');
      setIsCreateOpen(false);
      setSelectedCode(data.code);
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
      priority: 'normal',
    });
  };

  const selectedTemplate = templates?.find(t => t.code === selectedCode);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCode || !selectedTemplate) return;
    
    const formData = new FormData(e.target as HTMLFormElement);
    updateMutation.mutate({
      code: selectedCode,
      data: {
        subject: formData.get('subject') as string,
        body: formData.get('body') as string,
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Bildirim Şablonları</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Sistemden gönderilen bildirim ve e-postaların içeriklerini buradan düzenleyebilirsiniz.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Yeni Şablon Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Yeni Bildirim Şablonu</DialogTitle>
                <DialogDescription>
                  Sisteme yeni bir bildirim türü ve e-posta şablonu ekleyin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Kod</Label>
                  <Input name="code" placeholder="ISG_DEFT_REMINDER" className="col-span-3" required />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label className="text-right text-xs">Başlık</Label>
                  <Input name="name" placeholder="İSG Defter Hatırlatıcı" className="col-span-3" required />
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
                <div className="grid grid-cols-4 items-start gap-4">
                  <Label className="text-right text-xs pt-2">Kısa Açıklama</Label>
                  <Textarea name="description" placeholder="Bu bildirim ne zaman gidecek?" className="col-span-3 min-h-[80px]" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Template List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-sm border-border/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Şablon Listesi</CardTitle>
              <CardDescription>Düzenlemek istediğiniz şablonu seçin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y max-h-[600px] overflow-y-auto">
                {templates?.map((template) => (
                  <button
                    key={template.code}
                    onClick={() => setSelectedCode(template.code)}
                    className={cn(
                      "w-full text-left p-4 hover:bg-muted/50 transition-colors flex items-center justify-between group",
                      selectedCode === template.code && "bg-primary/5 border-l-4 border-l-primary"
                    )}
                  >
                    <div className="space-y-1">
                      <p className={cn(
                        "text-sm font-medium",
                        selectedCode === template.code ? "text-primary" : "text-foreground"
                      )}>
                        {template.name}
                      </p>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-[10px] py-0 px-1 uppercase">{template.module}</Badge>
                        <span className="text-[10px] text-muted-foreground">{template.code}</span>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-4 h-4 text-muted-foreground transition-transform",
                      selectedCode === template.code && "translate-x-1 text-primary"
                    )} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert variant="default" className="bg-blue-50/50 border-blue-200 dark:bg-blue-900/10 dark:border-blue-900/30">
            <Variable className="h-4 w-4 text-blue-600" />
            <div className="ml-2">
              <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">Dinamik Alanlar</p>
              <p className="text-[10px] text-blue-600/80 dark:text-blue-400/70 mt-1">
                İçeriklerde {"{{userName}}"}, {"{{facilityName}}"} gibi parantez içindeki alanlar sistem tarafından otomatik doldurulur.
              </p>
            </div>
          </Alert>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card key={selectedCode} className="shadow-sm border-border/60 sticky top-6">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                      <Edit3 className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{selectedTemplate.name}</CardTitle>
                      <CardDescription>Bu şablonu ihtiyacınıza göre özelleştirin.</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <form id="template-form" onSubmit={handleSave} className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="subject" className="text-sm font-semibold flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      E-posta Konusu
                    </Label>
                    <Input 
                      id="subject" 
                      name="subject"
                      defaultValue={selectedTemplate.subject} 
                      className="font-medium"
                      placeholder="E-posta konusunu girin..."
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="body" className="text-sm font-semibold flex items-center gap-2">
                      <FileText className="w-4 h-4 text-muted-foreground" />
                      Mesaj İçeriği
                    </Label>
                    <Textarea 
                      id="body" 
                      name="body"
                      defaultValue={selectedTemplate.body} 
                      className="min-h-[300px] font-mono text-sm resize-none focus-visible:ring-1"
                      placeholder="Bildirim içeriğini buraya yazın..."
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t bg-muted/10 flex justify-between py-4">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Info className="w-4 h-4" />
                  Değişiklikler anında tüm gönderimlerde geçerli olur.
                </div>
                <Button 
                  type="submit" 
                  form="template-form" 
                  disabled={updateMutation.isPending}
                  className="gap-2"
                >
                  {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Şablonu Kaydet
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full min-h-[400px] border-2 border-dashed rounded-xl flex flex-col items-center justify-center text-center p-12 bg-muted/5">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <Edit3 className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h3 className="text-lg font-medium text-foreground">Şablon Seçilmedi</h3>
              <p className="text-muted-foreground max-w-xs mt-2">
                Düzenlemek için sol taraftaki listeden bir bildirim şablonu seçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Simplified Alert components if not available
const Alert = ({ children, className, variant }: any) => (
  <div className={cn("p-4 rounded-lg border flex items-start gap-3", className)}>
    {children}
  </div>
);

export default EmailTemplatesPage;
