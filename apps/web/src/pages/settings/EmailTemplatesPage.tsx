import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  FileText, Save, Loader2, Edit3, Plus,
  ChevronRight, Info, Mail, Variable
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-6 animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Bildirim Şablonları</h1>
              <p className="text-xs text-muted-foreground">
                Sistemden gönderilen bildirim ve e-postaların içeriklerini buradan düzenleyebilirsiniz.
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-9 text-xs px-3.5 rounded-md">
              <Plus className="w-3.5 h-3.5" />
              Yeni Şablon Ekle
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] rounded-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Yeni Bildirim Şablonu</DialogTitle>
                <DialogDescription className="text-xs">
                  Sisteme yeni bir bildirim türü ve e-posta şablonu ekleyin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Kod</Label>
                  <Input name="code" placeholder="ISG_DEFT_REMINDER" className="h-9 text-xs rounded-md" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Başlık</Label>
                  <Input name="name" placeholder="İSG Defter Hatırlatıcı" className="h-9 text-xs rounded-md" required />
                </div>
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
                  <Label className="text-xs font-medium">Kısa Açıklama</Label>
                  <Textarea name="description" placeholder="Bu bildirim ne zaman gidecek?" className="min-h-[70px] text-xs rounded-md" />
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Template List */}
        <div className="lg:col-span-1 space-y-4">
          <Card className="shadow-xs border-border/60 rounded-lg">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold">Şablon Listesi</CardTitle>
              <CardDescription className="text-xs">Düzenlemek istediğiniz şablonu seçin.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/40 max-h-[500px] overflow-y-auto">
                {templates?.map((template) => (
                  <button
                    key={template.code}
                    onClick={() => setSelectedCode(template.code)}
                    className={cn(
                      "w-full text-left p-3.5 hover:bg-muted/40 transition-colors flex items-center justify-between group",
                      selectedCode === template.code && "bg-primary/5 border-l-2 border-l-primary"
                    )}
                  >
                    <div className="space-y-1">
                      <p className={cn(
                        "text-xs font-medium",
                        selectedCode === template.code ? "text-primary font-semibold" : "text-foreground"
                      )}>
                        {template.name}
                      </p>
                      <div className="flex items-center gap-1.5">
                        <Badge variant="secondary" className="text-[9px] py-0 px-1 font-normal uppercase rounded">{template.module}</Badge>
                        <span className="text-[10px] text-muted-foreground font-mono">{template.code}</span>
                      </div>
                    </div>
                    <ChevronRight className={cn(
                      "w-3.5 h-3.5 text-muted-foreground transition-transform",
                      selectedCode === template.code && "translate-x-0.5 text-primary"
                    )} />
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert variant="default" className="bg-muted/40 border-border/60 rounded-lg">
            <Variable className="h-4 w-4 text-primary" />
            <AlertTitle className="text-xs font-semibold">Dinamik Alanlar</AlertTitle>
            <AlertDescription className="text-[11px] text-muted-foreground leading-relaxed mt-1">
              İçeriklerde {"{{userName}}"}, {"{{facilityName}}"} gibi parantez içindeki alanlar sistem tarafından otomatik doldurulur.
            </AlertDescription>
          </Alert>
        </div>

        {/* Editor Area */}
        <div className="lg:col-span-2">
          {selectedTemplate ? (
            <Card key={selectedCode} className="shadow-xs border-border/60 rounded-lg sticky top-6">
              <CardHeader className="border-b border-border/40 bg-muted/20 py-3.5 px-5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center text-primary shrink-0">
                      <Edit3 className="w-4 h-4" />
                    </div>
                    <div>
                      <CardTitle className="text-sm font-semibold">{selectedTemplate.name}</CardTitle>
                      <CardDescription className="text-xs">Şablon konusu ve gövde metnini özelleştirin.</CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-4 px-5 space-y-4">
                <form id="template-form" onSubmit={handleSave} className="space-y-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="subject" className="text-xs font-medium flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                      E-posta Konusu
                    </Label>
                    <Input 
                      id="subject" 
                      name="subject"
                      defaultValue={selectedTemplate.subject} 
                      className="h-9 text-xs rounded-md"
                      placeholder="E-posta konusunu girin..."
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="body" className="text-xs font-medium flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                      Mesaj İçeriği
                    </Label>
                    <Textarea 
                      id="body" 
                      name="body"
                      defaultValue={selectedTemplate.body} 
                      className="min-h-[260px] font-mono text-xs rounded-md resize-none"
                      placeholder="Bildirim içeriğini buraya yazın..."
                    />
                  </div>
                </form>
              </CardContent>
              <CardFooter className="border-t border-border/40 bg-muted/10 flex items-center justify-between py-3 px-5">
                <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                  <Info className="w-3.5 h-3.5" />
                  Değişiklikler anında geçerli olur.
                </div>
                <Button 
                  type="submit" 
                  form="template-form" 
                  disabled={updateMutation.isPending}
                  className="gap-1.5 h-8 text-xs px-3.5 rounded-md"
                >
                  {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                  Şablonu Kaydet
                </Button>
              </CardFooter>
            </Card>
          ) : (
            <div className="h-full min-h-[350px] border border-dashed border-border/60 rounded-lg flex flex-col items-center justify-center text-center p-8 bg-muted/10">
              <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-2.5 text-muted-foreground">
                <Edit3 className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-semibold text-foreground">Şablon Seçilmedi</h3>
              <p className="text-xs text-muted-foreground mt-0.5 max-w-xs">
                Düzenlemek için sol taraftaki listeden bir bildirim şablonu seçin.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EmailTemplatesPage;
