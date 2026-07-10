import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  FileText, Plus, Copy, Eye, Edit, Trash2, CheckCircle2, 
  History, MoreHorizontal, Loader2, Search, Filter, 
  ArrowRight, Archive, CheckCircle, FileSpreadsheet, FileJson
} from 'lucide-react';
import { Button, buttonVariants } from '@/components/ui/button';
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
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in duration-500 pb-10">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <FileText className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">Rapor Şablonları</h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Tüm modüller için versiyon kontrollü ve kurumsal standartlara uygun rapor şablonlarını yönetin.
          </p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger className={cn(buttonVariants({ variant: 'default' }), "gap-2")}>
            <Plus className="w-4 h-4" />
            Yeni Şablon Tasarla
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle>Yeni Rapor Şablonu</DialogTitle>
                <DialogDescription>
                  Tasarım sürecine başlamak için temel bilgileri girin.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="space-y-2">
                  <Label>Rapor Adı</Label>
                  <Input name="name" placeholder="Örn: Aylık Faaliyet Raporu" required />
                </div>
                <div className="space-y-2">
                  <Label>Şablon Kodu</Label>
                  <Input name="code" placeholder="AYLIK_FAALIYET_V1" required />
                </div>
                <div className="space-y-2">
                  <Label>Modül</Label>
                  <Select name="module" defaultValue="OPERATIONS">
                    <SelectTrigger>
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
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Tasarlamaya Başla
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Şablon adı veya koduna göre ara..." 
            className="pl-9" 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <Button variant="outline" size="icon">
          <Filter className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {filteredTemplates?.map((template) => (
          <Card key={template.id} className={cn(
            "group hover:shadow-md transition-all duration-300 border-border/60",
            template.isActive && "border-primary/40 bg-primary/5"
          )}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-base truncate max-w-[180px]">{template.name}</CardTitle>
                    <Badge variant="secondary" className="text-[10px] py-0 px-1">V{template.version}</Badge>
                  </div>
                  <CardDescription className="text-xs flex items-center gap-1">
                    <FileJson className="w-3 h-3" />
                    {template.code}
                  </CardDescription>
                </div>
                {template.isActive ? (
                  <Badge className="bg-green-500 hover:bg-green-600">Aktif</Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">Taslak</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <div className="flex flex-col gap-1">
                  <span className="flex items-center gap-1">
                    <LayoutGrid className="w-3 h-3" /> {template.module}
                  </span>
                  <span className="flex items-center gap-1">
                    <History className="w-3 h-3" /> {new Date(template.updatedAt).toLocaleDateString('tr-TR')}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1 font-mono">
                  <span>{template.documentNo || 'No Belirtilmedi'}</span>
                  <span>Rev: {template.revisionNo || '0'}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center gap-2">
                <Button 
                  variant={template.isActive ? "outline" : "default"} 
                  className="flex-1 h-8 text-xs gap-1.5"
                  onClick={() => navigate(`/settings/reports/edit/${template.id}`)}
                >
                  <Edit className="w-3.5 h-3.5" />
                  Düzenle
                </Button>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    {template.isActive ? (
                      <DropdownMenuItem onClick={() => deactivateMutation.mutate(template.id)} className="text-orange-600 focus:text-orange-600">
                        <Archive className="w-4 h-4 mr-2" /> Pasife Al
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => publishMutation.mutate(template.id)}>
                        <CheckCircle2 className="w-4 h-4 mr-2 text-green-600" /> Yayınla
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
          <div className="col-span-full py-12 flex flex-col items-center justify-center border-2 border-dashed rounded-2xl bg-muted/5">
            <FileText className="w-12 h-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Şablon bulunamadı.</p>
            <Button variant="link" onClick={() => setSearchTerm('')}>Filtreleri Temizle</Button>
          </div>
        )}
      </div>
    </div>
  );
};

// Simplified LayoutGrid icon if not imported
const LayoutGrid = ({ className }: { className?: string }) => (
  <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
);

export default ReportTemplatesPage;
