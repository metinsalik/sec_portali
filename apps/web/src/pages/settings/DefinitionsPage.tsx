import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, ChevronRight, Loader2, Tag, Building2, Trash2 } from 'lucide-react';

interface Category { id: number; name: string; parentId: number | null; }
interface Department { id: number; name: string }

export default function DefinitionsPage() {
  const queryClient = useQueryClient();

  // ── Kategori state ───────────────────────────────────────────
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: Category }>({ open: false });
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState<string>('none');

  // ── Departman state ──────────────────────────────────────────
  const [deptModal, setDeptModal] = useState<{ open: boolean; edit?: Department }>({ open: false });
  const [deptName, setDeptName] = useState('');

  // ── Queries ──────────────────────────────────────────────────
  const { data: categories = [], isLoading: catsLoading } = useQuery<Category[]>({
    queryKey: ['categories'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/categories');
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const { data: departments = [], isLoading: deptsLoading } = useQuery<Department[]>({
    queryKey: ['departments'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/departments');
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  // ── Mutations ─────────────────────────────────────────────────
  const saveCatMutation = useMutation({
    mutationFn: async ({ name, parentId, id }: { name: string; parentId?: number | null; id?: number }) => {
      const payload = { name, parentId: parentId || null };
      const res = id
        ? await api.put(`/settings/definitions/categories/${id}`, payload)
        : await api.post('/settings/definitions/categories', payload);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setCatModal({ open: false }); setCatName(''); setCatParentId('none'); },
  });

  const saveDeptMutation = useMutation({
    mutationFn: async ({ name, id }: { name: string; id?: number }) => {
      const res = id
        ? await api.put(`/settings/definitions/departments/${id}`, { name })
        : await api.post('/settings/definitions/departments', { name });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['departments'] }); setDeptModal({ open: false }); setDeptName(''); },
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/settings/definitions/categories/${id}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });



  const deleteDeptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/settings/definitions/departments/${id}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['departments'] }),
  });

  const openCatEdit = (cat: Category) => { setCatModal({ open: true, edit: cat }); setCatName(cat.name); setCatParentId(cat.parentId ? cat.parentId.toString() : 'none'); };

  const getCategoryPath = (cat: Category) => {
    const path = [];
    if (cat.parentId) {
      const parent = categories.find((c: any) => c.id === cat.parentId);
      if (parent) {
        if (parent.parentId) {
          const grandParent = categories.find((c: any) => c.id === parent.parentId);
          if (grandParent) path.push(grandParent.name);
        }
        path.push(parent.name);
      }
    }
    path.push(cat.name);
    return path.join(' > ');
  };

  const openDeptEdit = (d: Department) => { setDeptName(d.name); setDeptModal({ open: true, edit: d }); };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tanım Yönetimi</h1>
        <p className="text-sm text-muted-foreground mt-1">Kategori, alt kategori ve departman tanımları</p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px]">
          <TabsTrigger value="categories" className="gap-2">
            <Tag className="w-4 h-4" /> Kategoriler
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <Building2 className="w-4 h-4" /> Departmanlar
          </TabsTrigger>
        </TabsList>

        {/* ── KATEGORİLER ────────────────────────────────────────── */}
        <TabsContent value="categories" className="pt-4 space-y-4">
          <div className="flex justify-between items-end">
            <div>
              <h3 className="text-lg font-semibold">Global Kategori Yönetimi</h3>
              <p className="text-sm text-muted-foreground">Tüm sistemlerde (ISG Defter, Kurul vb.) kullanılacak 3 seviyeli kategori yapısını yönetin.</p>
            </div>
            <Button onClick={() => { setCatName(''); setCatParentId('none'); setCatModal({ open: true }); }}>
              <Plus className="w-4 h-4 mr-2" /> Kategori Ekle
            </Button>
          </div>

          {catsLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-4">
              {categories.filter(c => !c.parentId).map(main => (
                <div key={main.id} className="bg-card border rounded-lg overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b">
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground text-base">{main.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setCatName(''); setCatParentId(main.id.toString()); setCatModal({ open: true }); }} className="h-8 px-2 text-muted-foreground">
                        <Plus className="w-4 h-4 mr-1" /> Kategori Ekle
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => openCatEdit(main)} className="h-8 px-2 text-muted-foreground">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => { if(confirm('Bu kategoriyi (ve varsa alt kategorilerini) silmek istediğinize emin misiniz?')) deleteCatMutation.mutate(main.id); }} 
                        className="h-8 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="divide-y divide-border">
                    {categories.filter(c => c.parentId === main.id).map(child => (
                      <React.Fragment key={child.id}>
                        <div className="flex items-center justify-between px-5 py-3 hover:bg-muted/10 transition-colors pl-8">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-4 h-4 text-muted-foreground/70" />
                            <span className="font-medium text-sm text-foreground">{child.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setCatName(''); setCatParentId(child.id.toString()); setCatModal({ open: true }); }} className="h-7 px-2 text-muted-foreground text-xs">
                              <Plus className="w-3.5 h-3.5 mr-1" /> Alt Kategori Ekle
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => openCatEdit(child)} className="h-7 px-2 text-muted-foreground">
                              <Edit className="w-3.5 h-3.5" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => { if(confirm('Bu kategoriyi (ve varsa alt kategorilerini) silmek istediğinize emin misiniz?')) deleteCatMutation.mutate(child.id); }} 
                              className="h-7 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>

                        {categories.filter(c => c.parentId === child.id).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between px-5 py-2 hover:bg-muted/20 transition-colors pl-14 bg-muted/5">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-muted-foreground/50" />
                              <span className="text-sm text-muted-foreground">{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="sm" onClick={() => openCatEdit(sub)} className="h-6 px-2 text-muted-foreground">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => { if(confirm('Bu alt kategoriyi silmek istediğinize emin misiniz?')) deleteCatMutation.mutate(sub.id); }} 
                                className="h-6 px-2 text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              ))}
              {categories.length === 0 && (
                <div className="text-center py-16 bg-background rounded-xl border border-dashed">
                  <Tag className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Henüz kategori eklenmemiş.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── DEPARTMANLAR ───────────────────────────────────────── */}
        <TabsContent value="departments" className="pt-4 space-y-4">
          <div className="flex justify-end">
            <Button onClick={() => { setDeptName(''); setDeptModal({ open: true }); }}>
              <Plus className="w-4 h-4 mr-2" /> Departman Ekle
            </Button>
          </div>

          {deptsLoading ? (
            <div className="space-y-3">{[1, 2, 3, 4].map((i) => <div key={i} className="h-14 bg-muted rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="bg-card border rounded-lg overflow-hidden divide-y">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                  <div className="flex items-center gap-3">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openDeptEdit(dept)} className="h-8 px-3 text-xs text-muted-foreground">
                      <Edit className="w-3.5 h-3.5 mr-2" /> Düzenle
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      onClick={() => { if(confirm('Bu departmanı silmek istediğinize emin misiniz?')) deleteDeptMutation.mutate(dept.id); }} 
                      className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {departments.length === 0 && (
                <div className="text-center py-16 bg-background rounded-xl border border-dashed">
                  <Building2 className="w-10 h-10 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground text-sm">Henüz departman eklenmemiş.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Kategori Modal ───────────────────────────────────────── */}
      <Dialog open={catModal.open} onOpenChange={(v) => setCatModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{catModal.edit ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCatMutation.mutate({ name: catName, parentId: catParentId !== 'none' ? parseInt(catParentId) : null, id: catModal.edit?.id });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori Adı *</label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} required autoFocus />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Üst Kategori</label>
              <select 
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                value={catParentId} 
                onChange={(e) => setCatParentId(e.target.value)}
              >
                <option value="none">Ana Kategori (En Üst Seviye)</option>
                {categories.filter(c => c.id !== catModal.edit?.id && (!c.parentId || !categories.find((cc:any)=>cc.id===c.parentId)?.parentId)).map((c) => (
                  <option key={c.id} value={c.id}>{getCategoryPath(c)}</option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Kategori seviyesini seçin. Maksimum 3 seviye oluşturulabilir.</p>
            </div>
            {saveCatMutation.isError && <p className="text-sm text-destructive font-medium">{(saveCatMutation.error as Error).message}</p>}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCatModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveCatMutation.isPending}>
                {saveCatMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Departman Modal ──────────────────────────────────────── */}
      <Dialog open={deptModal.open} onOpenChange={(v) => setDeptModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{deptModal.edit ? 'Departman Düzenle' : 'Yeni Departman'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDeptMutation.mutate({ name: deptName, id: deptModal.edit?.id });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Departman Adı *</label>
              <Input value={deptName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeptName(e.target.value)} required autoFocus />
            </div>
            {saveDeptMutation.isError && <p className="text-sm text-destructive font-medium">{(saveDeptMutation.error as Error).message}</p>}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDeptModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveDeptMutation.isPending}>
                {saveDeptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
