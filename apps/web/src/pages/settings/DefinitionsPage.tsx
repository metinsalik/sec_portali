import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, ChevronRight, Loader2, Tag, Building2, Trash2, FolderTree } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

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
    <div className="space-y-6 w-full animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Tanım Yönetimi</h1>
            <p className="text-xs text-muted-foreground">Kategori, alt kategori ve kurumsal departman tanımları</p>
          </div>
        </div>
      </div>

      <Tabs defaultValue="categories" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[320px] h-9 p-1 rounded-lg">
          <TabsTrigger value="categories" className="gap-2 text-xs rounded-md">
            <Tag className="w-3.5 h-3.5" /> Kategoriler
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2 text-xs rounded-md">
            <Building2 className="w-3.5 h-3.5" /> Departmanlar
          </TabsTrigger>
        </TabsList>

        {/* ── KATEGORİLER ────────────────────────────────────────── */}
        <TabsContent value="categories" className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Global Kategori Yönetimi</h3>
              <p className="text-xs text-muted-foreground">İSG Defteri, Kurul ve risk modüllerinde kullanılacak 3 seviyeli kategori yapısını yapılandırın.</p>
            </div>
            <Button onClick={() => { setCatName(''); setCatParentId('none'); setCatModal({ open: true }); }} className="h-8 text-xs px-3 rounded-md gap-1.5 shrink-0">
              <Plus className="w-3.5 h-3.5" /> Kategori Ekle
            </Button>
          </div>

          {catsLoading ? (
            <div className="space-y-3">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted/60 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="space-y-3">
              {categories.filter(c => !c.parentId).map(main => (
                <div key={main.id} className="bg-card border border-border/60 rounded-lg overflow-hidden shadow-xs">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
                    <div className="flex items-center gap-2.5">
                      <Tag className="w-4 h-4 text-primary" />
                      <span className="font-semibold text-foreground text-xs">{main.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button variant="ghost" size="sm" onClick={() => { setCatName(''); setCatParentId(main.id.toString()); setCatModal({ open: true }); }} className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground">
                        <Plus className="w-3.5 h-3.5 mr-1" /> Alt Kategori Ekle
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openCatEdit(main)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
                        <Edit className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => { if(confirm('Bu kategoriyi (ve varsa alt kategorilerini) silmek istediğinize emin misiniz?')) deleteCatMutation.mutate(main.id); }} 
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>

                  <div className="divide-y divide-border/40">
                    {categories.filter(c => c.parentId === main.id).map(child => (
                      <React.Fragment key={child.id}>
                        <div className="flex items-center justify-between px-4 py-2 hover:bg-muted/20 transition-colors pl-8">
                          <div className="flex items-center gap-2">
                            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70" />
                            <span className="font-medium text-xs text-foreground">{child.name}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button variant="ghost" size="sm" onClick={() => { setCatName(''); setCatParentId(child.id.toString()); setCatModal({ open: true }); }} className="h-6 px-2 text-muted-foreground hover:text-foreground text-[11px]">
                              <Plus className="w-3 h-3 mr-1" /> Alt Dal
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => openCatEdit(child)} className="h-6 w-6 text-muted-foreground">
                              <Edit className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => { if(confirm('Bu kategoriyi (ve varsa alt kategorilerini) silmek istediğinize emin misiniz?')) deleteCatMutation.mutate(child.id); }} 
                              className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>

                        {categories.filter(c => c.parentId === child.id).map(sub => (
                          <div key={sub.id} className="flex items-center justify-between px-4 py-1.5 hover:bg-muted/30 transition-colors pl-14 bg-muted/10">
                            <div className="flex items-center gap-2">
                              <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                              <span className="text-xs text-muted-foreground">{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openCatEdit(sub)} className="h-6 w-6 text-muted-foreground">
                                <Edit className="w-3 h-3" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                onClick={() => { if(confirm('Bu alt kategoriyi silmek istediğinize emin misiniz?')) deleteCatMutation.mutate(sub.id); }} 
                                className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
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
                <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed border-border/60">
                  <Tag className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">Henüz kategori eklenmemiş.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>

        {/* ── DEPARTMANLAR ───────────────────────────────────────── */}
        <TabsContent value="departments" className="pt-4 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-sm font-semibold text-foreground">Departman Listesi</h3>
              <p className="text-xs text-muted-foreground">Tesislerde tanımlı kurumsal departmanlar.</p>
            </div>
            <Button onClick={() => { setDeptName(''); setDeptModal({ open: true }); }} className="h-8 text-xs px-3 rounded-md gap-1.5">
              <Plus className="w-3.5 h-3.5" /> Departman Ekle
            </Button>
          </div>

          {deptsLoading ? (
            <div className="space-y-2">{[1, 2, 3, 4].map((i) => <div key={i} className="h-12 bg-muted/60 rounded-lg animate-pulse" />)}</div>
          ) : (
            <div className="bg-card border border-border/60 rounded-lg overflow-hidden divide-y divide-border/40 shadow-xs">
              {departments.map((dept) => (
                <div key={dept.id} className="flex items-center justify-between px-4 py-2.5 hover:bg-muted/20 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-muted-foreground" />
                    <span className="text-xs font-medium text-foreground">{dept.name}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" onClick={() => openDeptEdit(dept)} className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground">
                      <Edit className="w-3 h-3 mr-1.5" /> Düzenle
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { if(confirm('Bu departmanı silmek istediğinize emin misiniz?')) deleteDeptMutation.mutate(dept.id); }} 
                      className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
              {departments.length === 0 && (
                <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed border-border/60">
                  <Building2 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">Henüz departman eklenmemiş.</p>
                </div>
              )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Kategori Modal ───────────────────────────────────────── */}
      <Dialog open={catModal.open} onOpenChange={(v) => setCatModal({ open: v })}>
        <DialogContent className="sm:max-w-[420px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{catModal.edit ? 'Kategori Düzenle' : 'Yeni Kategori'}</DialogTitle>
            <DialogDescription className="text-xs">
              Kategori adı ve hiyerarşik üst kategorisini belirleyin.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCatMutation.mutate({ name: catName, parentId: catParentId !== 'none' ? parseInt(catParentId) : null, id: catModal.edit?.id });
            }}
            className="space-y-3.5 pt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kategori Adı *</Label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} required autoFocus className="h-9 text-xs rounded-md" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Üst Kategori</Label>
              <select 
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring disabled:cursor-not-allowed disabled:opacity-50"
                value={catParentId} 
                onChange={(e) => setCatParentId(e.target.value)}
              >
                <option value="none">Ana Kategori (En Üst Seviye)</option>
                {categories.filter(c => c.id !== catModal.edit?.id && (!c.parentId || !categories.find((cc:any)=>cc.id===c.parentId)?.parentId)).map((c) => (
                  <option key={c.id} value={c.id}>{getCategoryPath(c)}</option>
                ))}
              </select>
              <p className="text-[11px] text-muted-foreground">Kategori seviyesini seçin (Maks. 3 seviye).</p>
            </div>
            {saveCatMutation.isError && <p className="text-xs text-destructive font-medium">{(saveCatMutation.error as Error).message}</p>}
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setCatModal({ open: false })} className="h-8 text-xs rounded-md">Vazgeç</Button>
              <Button type="submit" disabled={saveCatMutation.isPending} className="h-8 text-xs rounded-md">
                {saveCatMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Departman Modal ──────────────────────────────────────── */}
      <Dialog open={deptModal.open} onOpenChange={(v) => setDeptModal({ open: v })}>
        <DialogContent className="sm:max-w-[400px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">{deptModal.edit ? 'Departman Düzenle' : 'Yeni Departman'}</DialogTitle>
            <DialogDescription className="text-xs">
              Tanımlanacak departman adını girin.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDeptMutation.mutate({ name: deptName, id: deptModal.edit?.id });
            }}
            className="space-y-3.5 pt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Departman Adı *</Label>
              <Input value={deptName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeptName(e.target.value)} required autoFocus className="h-9 text-xs rounded-md" />
            </div>
            {saveDeptMutation.isError && <p className="text-xs text-destructive font-medium">{(saveDeptMutation.error as Error).message}</p>}
            <DialogFooter className="mt-4">
              <Button type="button" variant="outline" onClick={() => setDeptModal({ open: false })} className="h-8 text-xs rounded-md">Vazgeç</Button>
              <Button type="submit" disabled={saveDeptMutation.isPending} className="h-8 text-xs rounded-md">
                {saveDeptMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
