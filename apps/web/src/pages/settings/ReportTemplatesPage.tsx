import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  FileText, Plus, Copy, Eye, Edit, Trash2, CheckCircle2, 
  History, MoreHorizontal, Loader2, Search, Filter, 
  Archive, FileJson, LayoutGrid
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger, DropdownMenuSeparator 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { useNavigate } from 'react-router-dom';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ReportTemplate {
  id: number;
  code: string;
  name: string;
  version: number;
  isActive: boolean;
  isArchived: boolean;
  module: string;
  documentNo: string;
  revisionNo: string;
  updatedAt: string;
}

const ReportTemplatesPage = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const { data: templates, isLoading } = useQuery<ReportTemplate[]>({
    queryKey: ['report-templates'],
    queryFn: async () => {
      const res = await api.get('/settings/report-templates');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const cloneMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/settings/report-templates/${id}/clone`, {});
      if (!res.ok) throw new Error('Kopyalanamadı');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Şablon kopyalandı. Yeni versiyon üzerinden düzenleme yapabilirsiniz.');
      navigate(`/settings/reports/edit/${data.id}`);
    }
  });

  const publishMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/settings/report-templates/${id}/publish`, {});
      if (!res.ok) throw new Error('Yayınlanamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Şablon başarıyla yayınlandı. Artık modüllerde aktif olarak kullanılacak.');
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/settings/report-templates/${id}/deactivate`, {});
      if (!res.ok) throw new Error('Pasife alınamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Şablon pasife alındı.');
    }
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/report-templates', data);
      if (!res.ok) throw new Error('Oluşturulamadı');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      setIsCreateOpen(false);
      navigate(`/settings/reports/edit/${data.id}`);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/settings/report-templates/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Şablon başarıyla silindi.');
    },
    onError: () => toast.error('Bu şablon silinemez (aktif bir sürüm olabilir).')
  });

  const handleCreate = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get('name'),
      code: formData.get('code'),
      module: formData.get('module'),
      orientation: 'PORTRAIT',
    });
  };

  const filteredTemplates = templates?.filter(t => 
    t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <FileText className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Rapor Şablonları</h1>
              <p className="text-xs text-muted-foreground">
                Tüm modüller için versiyon kontrollü ve kurumsal standartlara uygun rapor şablonlarını yönetin.
              </p>
            </div>
          </div>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 h-9 text-xs px-3.5 rounded-md">
              <Plus className="w-3.5 h-3.5" />
              Yeni Şablon Tasarla
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[480px] rounded-lg">
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Yeni Rapor Şablonu</DialogTitle>
                <DialogDescription className="text-xs">
                  Tasarım sürecine başlamak için temel bilgileri girin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-3.5 py-4">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Rapor Adı</Label>
                  <Input name="name" placeholder="Örn: Aylık Faaliyet Raporu" className="h-9 text-xs rounded-md" required />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Şablon Kodu</Label>
                  <Input name="code" placeholder="AYLIK_FAALIYET_V1" className="h-9 text-xs rounded-md" required />
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)} className="h-9 text-xs rounded-md">
                  Vazgeç
                </Button>
                <Button type="submit" disabled={createMutation.isPending} className="h-9 text-xs rounded-md">
                  {createMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" /> : null}
                  Tasarlamaya Başla
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3 bg-card p-3 rounded-lg border border-border/60 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Şablon adı veya koduna göre ara..." 
            className="pl-9 h-9 text-xs rounded-md" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon" className="h-9 w-9 rounded-md shrink-0">
          <Filter className="h-4 w-4 text-muted-foreground" />
        </Button>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredTemplates?.map((template) => (
          <Card key={template.id} className={cn(
            "group hover:border-border transition-all duration-200 border-border/60 shadow-xs rounded-lg flex flex-col justify-between",
            template.isActive && "border-primary/40 bg-primary/[0.02]"
          )}>
            <CardHeader className="p-4 pb-3">
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-sm font-semibold truncate">{template.name}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1.5 font-normal rounded-md shrink-0">V{template.version}</Badge>
                  </div>
                  <CardDescription className="text-[11px] flex items-center gap-1 font-mono text-muted-foreground">
                    <FileJson className="w-3 h-3 text-muted-foreground" />
                    {template.code}
                  </CardDescription>
                </div>
                {template.isActive ? (
                  <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 text-[10px] py-0 px-2 rounded-md font-medium shrink-0">
                    Aktif
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground text-[10px] py-0 px-2 rounded-md font-medium shrink-0">
                    Taslak
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="p-4 pt-0 space-y-3.5">
              <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40">
                <div className="flex flex-col gap-0.5">
                  <span className="flex items-center gap-1 font-medium text-foreground">
                    <LayoutGrid className="w-3 h-3 text-muted-foreground" /> {template.module}
                  </span>
                  <span className="flex items-center gap-1">
                    <History className="w-3 h-3 text-muted-foreground" /> {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-0.5 font-mono text-[10px]">
                  <span>{template.documentNo || 'No Belirtilmedi'}</span>
                  <span className="text-muted-foreground">Rev: {template.revisionNo || '0'}</span>
                </div>
              </div>

              <div className="pt-1 flex items-center gap-2">
                <Button 
                  variant={template.isActive ? "outline" : "default"} 
                  className="flex-1 h-8 text-xs gap-1.5 rounded-md"
                  onClick={() => navigate(`/settings/reports/edit/${template.id}`)}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Düzenle
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48 rounded-lg">
                    {template.isActive ? (
                      <DropdownMenuItem onClick={() => deactivateMutation.mutate(template.id)} className="text-amber-600 focus:text-amber-600">
                        <Archive className="w-4 h-4 mr-2" /> Pasife Al
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => publishMutation.mutate(template.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-emerald-600" /> Yayınla
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem onClick={() => cloneMutation.mutate(template.id)}>
                      <Copy className="w-4 h-4 mr-2" /> Kopyala / Yeni Versiyon
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate(`/settings/reports/edit/${template.id}`)}>
                      <Eye className="w-4 h-4 mr-2" /> Önizleme / Görünüm
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-destructive focus:text-destructive"
                      onClick={() => {
                        if (confirm('Bu şablonu silmek istediğinize emin misiniz?')) {
                          deleteMutation.mutate(template.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 mr-2" /> Sil
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredTemplates?.length === 0 && (
          <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-lg bg-muted/10">
            <FileText className="w-10 h-10 text-muted-foreground/40 mb-3" />
            <p className="text-xs font-medium text-foreground">Şablon bulunamadı.</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">Arama filtrenizi temizleyip tekrar deneyin.</p>
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => setSearchTerm('')}>Filtreleri Temizle</Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReportTemplatesPage;
