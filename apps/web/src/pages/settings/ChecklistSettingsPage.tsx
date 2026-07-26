import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, Trash2, ListChecks, Tags } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

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
    }
  });

  const delCatMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/checklists/categories/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-categories'] })
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
    }
  });

  const delScaleMutation = useMutation({
    mutationFn: async (id: string) => api.delete(`/checklists/scales/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['checklist-scales'] })
  });

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Kontrol Listesi Ayarları</h1>
        <p className="text-muted-foreground">Kategorileri ve değerlendirme ölçeklerini yönetin.</p>
      </div>

      <Tabs defaultValue="scales">
        <TabsList>
          <TabsTrigger value="scales" className="gap-2"><ListChecks className="w-4 h-4" /> Değerlendirme Ölçekleri</TabsTrigger>
          <TabsTrigger value="categories" className="gap-2"><Tags className="w-4 h-4" /> Kategoriler</TabsTrigger>
        </TabsList>

        <TabsContent value="scales" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setScaleSet({ name: '', description: '', options: [] });
              setScaleModal({ open: true });
            }}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Ölçek Seti
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {scaleSets.map((s: any) => (
              <div key={s.id} className="border rounded-xl p-4 bg-card shadow-sm space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{s.name}</h3>
                    <p className="text-sm text-muted-foreground">{s.description}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => {
                      setScaleSet(s);
                      setScaleModal({ open: true, edit: s });
                    }}><Edit className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                      if(confirm('Emin misiniz?')) delScaleMutation.mutate(s.id);
                    }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {s.options.map((opt: any) => (
                    <Badge key={opt.id} variant="secondary" style={opt.color ? { backgroundColor: opt.color, color: '#fff' } : {}}>
                      {opt.label} ({opt.multiplier})
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="categories" className="space-y-4 mt-6">
          <div className="flex justify-end">
            <Button onClick={() => {
              setCatName('');
              setCatModal({ open: true });
            }}>
              <Plus className="w-4 h-4 mr-2" /> Yeni Kategori
            </Button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((c: any) => (
              <div key={c.id} className="flex justify-between items-center border rounded-lg p-3 bg-card shadow-sm">
                <span className="font-medium">{c.name}</span>
                <Button variant="ghost" size="icon" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {
                  if(confirm('Silmek istediğinize emin misiniz?')) delCatMutation.mutate(c.id);
                }}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Category Modal */}
      <Dialog open={catModal.open} onOpenChange={(o) => setCatModal({ open: o })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Kategori {catModal.edit ? 'Düzenle' : 'Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <Input placeholder="Kategori adı..." value={catName} onChange={e => setCatName(e.target.value)} />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCatModal({ open: false })}>İptal</Button>
            <Button onClick={() => catMutation.mutate({ id: catModal.edit?.id, name: catName })}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Scale Set Modal */}
      <Dialog open={scaleModal.open} onOpenChange={(o) => setScaleModal({ open: o })}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Ölçek Seti {scaleModal.edit ? 'Düzenle' : 'Ekle'}</DialogTitle>
          </DialogHeader>
          <div className="py-4 space-y-4">
            <Input placeholder="Set Adı (örn: 3'lü Değerlendirme)" value={scaleSet.name} onChange={e => setScaleSet({...scaleSet, name: e.target.value})} />
            <Input placeholder="Açıklama (opsiyonel)" value={scaleSet.description || ''} onChange={e => setScaleSet({...scaleSet, description: e.target.value})} />
            
            <div className="border rounded-lg p-4 space-y-4">
              <div className="flex justify-between items-center">
                <h4 className="font-semibold">Seçenekler</h4>
                <Button variant="outline" size="sm" onClick={() => {
                  setScaleSet({
                    ...scaleSet, 
                    options: [...scaleSet.options, { label: '', multiplier: 1, color: '', requiresExplanation: false, requiresAttachment: false }]
                  });
                }}>
                  <Plus className="w-4 h-4 mr-1" /> Seçenek Ekle
                </Button>
              </div>
              
              {scaleSet.options.map((opt, idx) => (
                <div key={idx} className="flex flex-col gap-2 p-3 bg-muted/50 rounded-lg border">
                  <div className="flex gap-2 items-center">
                    <Input placeholder="Etiket" value={opt.label} onChange={e => {
                      const n = [...scaleSet.options]; n[idx].label = e.target.value; setScaleSet({...scaleSet, options: n});
                    }} />
                    <Input type="number" step="0.1" placeholder="Çarpan" className="w-24" value={opt.multiplier} onChange={e => {
                      const n = [...scaleSet.options]; n[idx].multiplier = parseFloat(e.target.value); setScaleSet({...scaleSet, options: n});
                    }} />
                    <Input type="color" className="w-12 p-1 h-10" value={opt.color || '#cccccc'} onChange={e => {
                      const n = [...scaleSet.options]; n[idx].color = e.target.value; setScaleSet({...scaleSet, options: n});
                    }} />
                    <Button variant="ghost" size="icon" className="text-red-500 shrink-0" onClick={() => {
                      const n = scaleSet.options.filter((_, i) => i !== idx); setScaleSet({...scaleSet, options: n});
                    }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                  <div className="flex gap-4 items-center pl-2 pt-2 text-sm">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={opt.requiresExplanation} onCheckedChange={c => {
                        const n = [...scaleSet.options]; n[idx].requiresExplanation = !!c; setScaleSet({...scaleSet, options: n});
                      }} /> Açıklama Zorunlu
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <Checkbox checked={opt.requiresAttachment} onCheckedChange={c => {
                        const n = [...scaleSet.options]; n[idx].requiresAttachment = !!c; setScaleSet({...scaleSet, options: n});
                      }} /> Dosya/Görsel Zorunlu
                    </label>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setScaleModal({ open: false })}>İptal</Button>
            <Button onClick={() => scaleMutation.mutate(scaleSet)}>Kaydet</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
