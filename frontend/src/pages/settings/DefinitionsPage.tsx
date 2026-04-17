import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Edit, ChevronRight, Loader2, Tag, Building2 } from 'lucide-react';

interface SubCategory { id: number; name: string; categoryId: number }
interface Category { id: number; name: string; subCategories: SubCategory[] }
interface Department { id: number; name: string }

export default function DefinitionsPage() {
  const queryClient = useQueryClient();

  // ── Kategori state ───────────────────────────────────────────
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: Category }>({ open: false });
  const [catName, setCatName] = useState('');
  const [subModal, setSubModal] = useState<{ open: boolean; categoryId?: number; edit?: SubCategory }>({ open: false });
  const [subName, setSubName] = useState('');

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
    mutationFn: async ({ name, id }: { name: string; id?: number }) => {
      const res = id
        ? await api.put(`/settings/definitions/categories/${id}`, { name })
        : await api.post('/settings/definitions/categories', { name });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setCatModal({ open: false }); setCatName(''); },
  });

  const saveSubMutation = useMutation({
    mutationFn: async ({ name, categoryId, id }: { name: string; categoryId?: number; id?: number }) => {
      const res = id
        ? await api.put(`/settings/definitions/subcategories/${id}`, { name })
        : await api.post('/settings/definitions/subcategories', { name, categoryId });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['categories'] }); setSubModal({ open: false }); setSubName(''); },
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

  const openCatEdit = (cat: Category) => { setCatName(cat.name); setCatModal({ open: true, edit: cat }); };
  const openSubEdit = (sub: SubCategory) => { setSubName(sub.name); setSubModal({ open: true, edit: sub }); };
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
          <div className="flex justify-end">
            <Button onClick={() => { setCatName(''); setCatModal({ open: true }); }}>
              <Plus className="w-4 h-4 mr-2" /> Kategori Ekle
            </Button>
          </div>

          {catsLoading ? (
            <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 bg-muted rounded-xl animate-pulse" />)}</div>
          ) : (
            <div className="space-y-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-card border rounded-lg overflow-hidden">
                  {/* Kategori başlığı */}
                  <div className="flex items-center justify-between px-5 py-4 bg-muted/30 border-b">
                    <div className="flex items-center gap-3">
                      <Tag className="w-4 h-4 text-muted-foreground" />
                      <span className="font-semibold text-foreground text-sm">{cat.name}</span>
                      <Badge variant="outline" className="text-xs font-normal text-muted-foreground bg-background">{cat.subCategories.length} alt kategori</Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openCatEdit(cat)} className="h-8 px-3 text-xs text-muted-foreground">
                        <Edit className="w-3.5 h-3.5 mr-2" /> Düzenle
                      </Button>
                      <Button
                        variant="secondary"
                        size="sm"
                        className="h-8 px-3 text-xs"
                        onClick={() => { setSubName(''); setSubModal({ open: true, categoryId: cat.id }); }}
                      >
                        <Plus className="w-3.5 h-3.5 mr-2" /> Alt Kategori
                      </Button>
                    </div>
                  </div>

                  {/* Alt kategoriler */}
                  {cat.subCategories.length > 0 && (
                    <div className="divide-y divide-border">
                      {cat.subCategories.map((sub) => (
                        <div key={sub.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/30 transition-colors">
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                            <span className="text-foreground">{sub.name}</span>
                          </div>
                          <Button variant="ghost" size="sm" onClick={() => openSubEdit(sub)} className="h-7 px-2 text-xs text-muted-foreground">
                            <Edit className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}

                  {cat.subCategories.length === 0 && (
                    <div className="px-5 py-4 text-sm text-muted-foreground/70 italic bg-card">Alt kategori yok.</div>
                  )}
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
                  <Button variant="ghost" size="sm" onClick={() => openDeptEdit(dept)} className="h-8 px-3 text-xs text-muted-foreground">
                    <Edit className="w-3.5 h-3.5 mr-2" /> Düzenle
                  </Button>
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
              saveCatMutation.mutate({ name: catName, id: catModal.edit?.id });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Kategori Adı *</label>
              <Input value={catName} onChange={(e) => setCatName(e.target.value)} required autoFocus />
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

      {/* ── Alt Kategori Modal ───────────────────────────────────── */}
      <Dialog open={subModal.open} onOpenChange={(v) => setSubModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{subModal.edit ? 'Alt Kategori Düzenle' : 'Yeni Alt Kategori'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSubMutation.mutate({ name: subName, categoryId: subModal.categoryId, id: subModal.edit?.id });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Alt Kategori Adı *</label>
              <Input value={subName} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSubName(e.target.value)} required autoFocus />
            </div>
            {saveSubMutation.isError && <p className="text-sm text-destructive font-medium">{(saveSubMutation.error as Error).message}</p>}
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setSubModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveSubMutation.isPending}>
                {saveSubMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
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
