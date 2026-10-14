import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from '@/components/ui/table';
import { Trash2, Plus, ShieldAlert, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

export default function HazmatKitItemsPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', type: '' });

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['hazmat-master-items', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/settings/hazmat-kit-items?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!facilityId
  });

  const addItemMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/hazmat-kit-items', { ...data, facilityId });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-master-items'] });
      setForm({ name: '', type: '' });
      toast.success('Malzeme başarıyla eklendi.');
    },
    onError: () => toast.error('Malzeme eklenirken hata oluştu.')
  });

  const deleteItemMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/settings/hazmat-kit-items/${id}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-master-items'] });
      toast.success('Malzeme silindi.');
    },
    onError: () => toast.error('Malzeme silinirken hata oluştu.')
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) return;
    addItemMutation.mutate(form);
  };

  if (!facilityId) {
    return (
      <div className="max-w-5xl mx-auto py-12 text-center">
        <p className="text-xs text-muted-foreground">Lütfen işlem yapmak için bir tesis seçin.</p>
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
              <ShieldAlert className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Kit Malzemeleri (Master Veri)</h1>
              <p className="text-xs text-muted-foreground">
                Dökülme-Saçılma kitlerinde kullanılacak standart malzeme tanımlarını yönetin.
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 xl:grid-cols-4 gap-5">
        {/* Form Column */}
        <div className="lg:col-span-1">
          <Card className="rounded-lg border-border/60 shadow-xs bg-card">
            <CardHeader className="p-4 pb-3">
              <CardTitle className="text-sm font-semibold">Yeni Malzeme</CardTitle>
              <CardDescription className="text-xs">Kitler için yeni bir bileşen tanımlayın.</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Malzeme Adı</Label>
                  <Input 
                    value={form.name} 
                    onChange={e => setForm({...form, name: e.target.value})} 
                    placeholder="Örn: Biyolojik Absorban" 
                    className="h-9 text-xs rounded-md"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium">Türü / Kategorisi</Label>
                  <Input 
                    value={form.type} 
                    onChange={e => setForm({...form, type: e.target.value})} 
                    placeholder="Örn: Absorban, KKD, Temizlik" 
                    className="h-9 text-xs rounded-md"
                  />
                </div>
                <Button 
                  type="submit" 
                  className="w-full gap-2 h-9 text-xs rounded-md" 
                  disabled={!form.name.trim() || addItemMutation.isPending}
                >
                  {addItemMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Malzeme Ekle
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* List Column */}
        <div className="lg:col-span-2 xl:col-span-3">
          <Card className="rounded-lg border-border/60 shadow-xs bg-card">
            <CardHeader className="p-4 pb-3 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-semibold">Kayıtlı Malzemeler</CardTitle>
                <CardDescription className="text-xs">Bu tesise tanımlı kit malzemeleri.</CardDescription>
              </div>
              <Badge variant="secondary" className="text-xs rounded-md font-normal px-2 py-0.5">
                {items.length} Malzeme
              </Badge>
            </CardHeader>
            <CardContent className="p-0">
              <div className="border-t border-border/40 overflow-hidden">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow className="border-border/40 hover:bg-transparent">
                      <TableHead className="text-xs font-semibold h-9">Malzeme Adı</TableHead>
                      <TableHead className="text-xs font-semibold h-9">Türü</TableHead>
                      <TableHead className="text-xs font-semibold h-9 text-right pr-4">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {items.map((item: any) => (
                      <TableRow key={item.id} className="border-border/40 hover:bg-muted/40 transition-colors">
                        <TableCell className="text-xs font-medium text-foreground py-2.5">
                          <div className="flex items-center gap-2">
                            <Package className="w-3.5 h-3.5 text-muted-foreground" />
                            <span>{item.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground py-2.5">
                          {item.type ? (
                            <Badge variant="outline" className="text-[10px] font-normal rounded-md py-0 px-1.5">
                              {item.type}
                            </Badge>
                          ) : (
                            <span className="text-muted-foreground/60">—</span>
                          )}
                        </TableCell>
                        <TableCell className="text-xs text-right py-2.5 pr-4">
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="h-7 w-7 text-destructive hover:bg-destructive/10 rounded-md" 
                            onClick={() => {
                              if (confirm('Bu malzemeyi silmek istediğinize emin misiniz?')) {
                                deleteItemMutation.mutate(item.id);
                              }
                            }}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {items.length === 0 && !isLoading && (
                      <TableRow>
                        <TableCell colSpan={3} className="h-32 text-center text-xs text-muted-foreground">
                          Henüz kayıtlı malzeme bulunamadı.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
