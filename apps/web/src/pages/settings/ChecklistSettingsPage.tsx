import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, ListChecks, Tags, Loader2 } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';

export default function ChecklistSettingsPage() {
  const queryClient = useQueryClient();

  // CATEGORIES
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [catName, setCatName] = useState('');

  const { data: categories = [], isLoading: catLoading } = useQuery({
    queryKey: ['checklist-categories'],
    queryFn: async () => (await api.get('/checklists/categories')).json(),
  });

  const catMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return api.put(`/checklists/categories/${data.id}`, data);
      return api.post('/checklists/categories', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-categories'] });
      setCatModal({ open: false });
      setCatName('');
      toast.success('Kategori başarıyla kaydedildi.');
    },
    onError: () => toast.error('Kategori kaydedilirken bir hata oluştu.')
  });

  const delCatMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/checklists/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-categories'] });
      toast.success('Kategori silindi.');
    },
    onError: () => toast.error('Kategori silinemedi.')
  });

  // SCALES
  const [scaleModal, setScaleModal] = useState<{ open: boolean; edit?: any }>({ open: false });
  const [scaleSet, setScaleSet] = useState<{ id?: string, name: string; description: string; options: any[] }>({
    name: '', description: '', options: []
  });

  const { data: scaleSets = [], isLoading: scaleLoading } = useQuery({
    queryKey: ['checklist-scales'],
    queryFn: async () => (await api.get('/checklists/scales')).json(),
  });

  const scaleMutation = useMutation({
    mutationFn: async (data: any) => {
      if (data.id) return api.put(`/checklists/scales/${data.id}`, data);
      return api.post('/checklists/scales', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-scales'] });
      setScaleModal({ open: false });
      toast.success('Ölçek seti kaydedildi.');
    },
    onError: () => toast.error('Ölçek seti kaydedilirken bir hata oluştu.')
  });

  const delScaleMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/checklists/scales/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['checklist-scales'] });
      toast.success('Ölçek seti silindi.');
    },
    onError: () => toast.error('Ölçek seti silinemedi.')
  });

  return (
    <div className="w-full space-y-5 animate-in fade-in duration-200 pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <ListChecks className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-xl font-semibold tracking-tight text-foreground">Kontrol Listesi Ayarları</h1>
              <p className="text-xs text-muted-foreground">
                Denetim formlarında kullanılacak kategorileri ve değerlendirme ölçeklerini yönetin.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Tabs defaultValue="scales" className="space-y-4">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <TabsList className="bg-muted/60 p-1 rounded-md h-9">
            <TabsTrigger value="scales" className="h-7 text-xs rounded-sm gap-1.5 px-3">
              <ListChecks className="w-3.5 h-3.5" /> Değerlendirme Ölçekleri
            </TabsTrigger>
            <TabsTrigger value="categories" className="h-7 text-xs rounded-sm gap-1.5 px-3">
              <Tags className="w-3.5 h-3.5" /> Kategoriler
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Scales Tab */}
        <TabsContent value="scales" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Denetim maddelerinin puanlama ve durum seçeneklerini tanımlayın.</p>
            <Button 
              onClick={() => {
                setScaleSet({ name: '', description: '', options: [] });
                setScaleModal({ open: true });
              }}
              className="gap-2 h-9 text-xs px-3.5 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> Yeni Ölçek Seti
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {scaleSets.map((s: any) => (
              <div 
                key={s.id} 
                className="border border-border/60 rounded-lg p-4 bg-card shadow-xs space-y-3 hover:border-border transition-all duration-200"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="space-y-0.5">
                    <h3 className="font-semibold text-sm text-foreground">{s.name}</h3>
                    {s.description && (
                      <p className="text-xs text-muted-foreground">{s.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md text-muted-foreground hover:text-foreground"
                      onClick={() => {
                        setScaleSet(s);
                        setScaleModal({ open: true, edit: s });
                      }}
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="h-8 w-8 rounded-md text-destructive hover:bg-destructive/10" 
                      onClick={() => {
                        if (confirm('Bu ölçek setini silmek istediğinize emin misiniz?')) {
                          delScaleMutation.mutate(s.id);
                        }
                      }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 pt-1 border-t border-border/40">
                  {s.options?.map((opt: any) => (
                    <Badge 
                      key={opt.id || opt.label} 
                      variant="outline" 
                      className="text-[11px] py-0.5 px-2 rounded-md font-medium"
                      style={opt.color ? { backgroundColor: `${opt.color}15`, borderColor: `${opt.color}40`, color: opt.color } : {}}
                    >
                      {opt.label} ({opt.multiplier})
                    </Badge>
                  ))}
                  {(!s.options || s.options.length === 0) && (
                    <span className="text-[11px] text-muted-foreground italic">Henüz seçenek eklenmemiş</span>
                  )}
                </div>
              </div>
            ))}

            {scaleSets.length === 0 && !scaleLoading && (
              <div className="col-span-full py-10 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-lg bg-muted/10">
                <ListChecks className="w-9 h-9 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-foreground">Tanımlı ölçek seti bulunamadı.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Yeni bir ölçek seti ekleyerek başlayabilirsiniz.</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Categories Tab */}
        <TabsContent value="categories" className="space-y-4 mt-0">
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">Maddelerin sınıflandırılacağı kontrol kategorileri.</p>
            <Button 
              onClick={() => {
                setCatName('');
                setCatModal({ open: true });
              }}
              className="gap-2 h-9 text-xs px-3.5 rounded-md"
            >
              <Plus className="w-3.5 h-3.5" /> Yeni Kategori
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categories.map((c: any) => (
              <div 
                key={c.id} 
                className="flex justify-between items-center border border-border/60 rounded-lg p-3 bg-card shadow-xs hover:border-border transition-all duration-200"
              >
                <div className="flex items-center gap-2">
                  <Tags className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="font-medium text-xs text-foreground">{c.name}</span>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-7 w-7 rounded-md text-destructive hover:bg-destructive/10" 
                  onClick={() => {
                    if (confirm('Silmek istediğinize emin misiniz?')) delCatMutation.mutate(c.id);
                  }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            ))}

            {categories.length === 0 && !catLoading && (
              <div className="col-span-full py-10 flex flex-col items-center justify-center border border-dashed border-border/60 rounded-lg bg-muted/10">
                <Tags className="w-9 h-9 text-muted-foreground/40 mb-2" />
                <p className="text-xs font-medium text-foreground">Henüz kategori bulunmuyor.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">Yukarıdaki butona tıklayarak yeni kategori oluşturabilirsiniz.</p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <Dialog open={catModal.open} onOpenChange={(o) => setCatModal({ open: o })}>
        <DialogContent className="sm:max-w-[420px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Kategori {catModal.edit ? 'Düzenle' : 'Ekle'}</DialogTitle>
            <DialogDescription className="text-xs">
              Kontrol listesi maddelerini gruplamak için kategori tanımlayın.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-1.5 py-3">
            <Label className="text-xs font-medium">Kategori Adı</Label>
            <Input 
              placeholder="Örn: Yangın Güvenliği, Ergonomi..." 
              value={catName} 
              onChange={e => setCatName(e.target.value)} 
              className="h-9 text-xs rounded-md"
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatModal({ open: false })} className="h-9 text-xs rounded-md">
              İptal
            </Button>
            <Button 
              onClick={() => catMutation.mutate({ id: catModal.edit?.id, name: catName })} 
              disabled={!catName.trim() || catMutation.isPending}
              className="h-9 text-xs rounded-md"
            >
              {catMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scale Set Modal */}
      <Dialog open={scaleModal.open} onOpenChange={(o) => setScaleModal({ open: o })}>
        <DialogContent className="sm:max-w-xl rounded-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">Ölçek Seti {scaleModal.edit ? 'Düzenle' : 'Ekle'}</DialogTitle>
            <DialogDescription className="text-xs">
              Denetim puanlamasında geçerli olacak ölçek seçeneklerini belirleyin.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3.5 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Set Adı</Label>
              <Input 
                placeholder="Örn: 3'lü Değerlendirme (Uygun / Şartlı / Uygun Değil)" 
                value={scaleSet.name} 
                onChange={e => setScaleSet({...scaleSet, name: e.target.value})} 
                className="h-9 text-xs rounded-md"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Açıklama (Opsiyonel)</Label>
              <Input 
                placeholder="Kısa açıklama..." 
                value={scaleSet.description || ''} 
                onChange={e => setScaleSet({...scaleSet, description: e.target.value})} 
                className="h-9 text-xs rounded-md"
              />
            </div>
            
            <div className="border border-border/60 rounded-lg p-3.5 space-y-3 bg-muted/20">
              <div className="flex justify-between items-center">
                <span className="text-xs font-semibold text-foreground">Ölçek Seçenekleri</span>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-7 text-xs rounded-md gap-1"
                  onClick={() => {
                    setScaleSet({
                      ...scaleSet, 
                      options: [...scaleSet.options, { label: '', multiplier: 1, color: '#3b82f6', requiresExplanation: false, requiresAttachment: false }]
                    });
                  }}
                >
                  <Plus className="w-3.5 h-3.5" /> Seçenek Ekle
                </Button>
              </div>
              
              <div className="space-y-2">
                {scaleSet.options.map((opt, idx) => (
                  <div key={idx} className="flex flex-col gap-2 p-2.5 bg-card rounded-md border border-border/60 shadow-2xs">
                    <div className="flex gap-2 items-center">
                      <div className="flex-1">
                        <Input 
                          placeholder="Etiket (örn: Uygun)" 
                          value={opt.label} 
                          className="h-8 text-xs rounded-md"
                          onChange={e => {
                            const n = [...scaleSet.options]; n[idx].label = e.target.value; setScaleSet({...scaleSet, options: n});
                          }} 
                        />
                      </div>
                      <div className="w-20">
                        <Input 
                          type="number" 
                          step="0.1" 
                          placeholder="Çarpan" 
                          className="h-8 text-xs rounded-md" 
                          value={opt.multiplier} 
                          onChange={e => {
                            const n = [...scaleSet.options]; n[idx].multiplier = parseFloat(e.target.value) || 0; setScaleSet({...scaleSet, options: n});
                          }} 
                        />
                      </div>
                      <div className="w-10 shrink-0">
                        <input 
                          type="color" 
                          className="w-full h-8 p-0.5 rounded-md border border-border/60 cursor-pointer bg-transparent" 
                          value={opt.color || '#3b82f6'} 
                          onChange={e => {
                            const n = [...scaleSet.options]; n[idx].color = e.target.value; setScaleSet({...scaleSet, options: n});
                          }} 
                        />
                      </div>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-8 w-8 text-destructive hover:bg-destructive/10 shrink-0 rounded-md" 
                        onClick={() => {
                          const n = scaleSet.options.filter((_, i) => i !== idx); setScaleSet({...scaleSet, options: n});
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-muted-foreground pt-0.5">
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <Checkbox 
                          checked={opt.requiresExplanation} 
                          onCheckedChange={c => {
                            const n = [...scaleSet.options]; n[idx].requiresExplanation = !!c; setScaleSet({...scaleSet, options: n});
                          }} 
                        /> 
                        Açıklama Zorunlu
                      </label>
                      <label className="flex items-center gap-1.5 cursor-pointer text-[11px]">
                        <Checkbox 
                          checked={opt.requiresAttachment} 
                          onCheckedChange={c => {
                            const n = [...scaleSet.options]; n[idx].requiresAttachment = !!c; setScaleSet({...scaleSet, options: n});
                          }} 
                        /> 
                        Dosya/Görsel Zorunlu
                      </label>
                    </div>
                  </div>
                ))}

                {scaleSet.options.length === 0 && (
                  <p className="text-[11px] text-muted-foreground text-center py-3 italic">
                    Henüz seçenek eklenmedi. "Seçenek Ekle" butonuna tıklayın.
                  </p>
                )}
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button variant="outline" onClick={() => setScaleModal({ open: false })} className="h-9 text-xs rounded-md">
              İptal
            </Button>
            <Button 
              onClick={() => scaleMutation.mutate(scaleSet)} 
              disabled={!scaleSet.name.trim() || scaleMutation.isPending}
              className="h-9 text-xs rounded-md"
            >
              {scaleMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />}
              Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
