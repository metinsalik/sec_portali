import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Plus,
  Edit,
  ChevronRight,
  Loader2,
  Tag,
  Building2,
  Trash2,
  FolderTree,
  GitMerge,
  RefreshCw,
  Search,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  parentId: number | null;
}

interface Department {
  id: number;
  name: string;
  usageCount?: number;
}

interface DependencyReport {
  department: { id: number; name: string };
  hasDependencies: boolean;
  totalCount: number;
  breakdown: { module: string; label: string; count: number }[];
}

export default function DefinitionsPage() {
  const queryClient = useQueryClient();

  // ── Kategori state ───────────────────────────────────────────
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: Category }>({ open: false });
  const [catName, setCatName] = useState('');
  const [catParentId, setCatParentId] = useState<string>('none');

  // ── Departman state ──────────────────────────────────────────
  const [deptModal, setDeptModal] = useState<{ open: boolean; edit?: Department }>({ open: false });
  const [deptName, setDeptName] = useState('');
  const [deptSearch, setDeptSearch] = useState('');
  const [selectedDeptIds, setSelectedDeptIds] = useState<number[]>([]);

  // ── Merge modal state ────────────────────────────────────────
  const [mergeModal, setMergeModal] = useState<{ open: boolean; sourceIds: number[] }>({
    open: false,
    sourceIds: [],
  });
  const [mergeTargetId, setMergeTargetId] = useState<string>('');

  // ── Safe Delete modal state ──────────────────────────────────
  const [deleteModal, setDeleteModal] = useState<{
    open: boolean;
    dept: Department | null;
    loading: boolean;
    report: DependencyReport | null;
  }>({ open: false, dept: null, loading: false, report: null });
  const [deleteTransferTargetId, setDeleteTransferTargetId] = useState<string>('');

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
    queryKey: ['departments', 'withUsage'],
    queryFn: async () => {
      const res = await api.get('/settings/definitions/departments?withUsage=true');
      if (!res.ok) throw new Error();
      return res.json();
    },
  });

  const invalidateDepartments = () => {
    queryClient.invalidateQueries({ queryKey: ['departments'] });
    queryClient.invalidateQueries({ queryKey: ['departments', 'withUsage'] });
  };

  // ── Mutations ─────────────────────────────────────────────────
  const saveCatMutation = useMutation({
    mutationFn: async ({ name, parentId, id }: { name: string; parentId?: number | null; id?: number }) => {
      const payload = { name, parentId: parentId || null };
      const res = id
        ? await api.put(`/settings/definitions/categories/${id}`, payload)
        : await api.post('/settings/definitions/categories', payload);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['categories'] });
      setCatModal({ open: false });
      setCatName('');
      setCatParentId('none');
    },
  });

  const saveDeptMutation = useMutation({
    mutationFn: async ({ name, id }: { name: string; id?: number }) => {
      const res = id
        ? await api.put(`/settings/definitions/departments/${id}`, { name })
        : await api.post('/settings/definitions/departments', { name });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      return res.json();
    },
    onSuccess: (_data, vars) => {
      invalidateDepartments();
      setDeptModal({ open: false });
      setDeptName('');
      toast.success(
        vars.id
          ? 'Departman güncellendi ve tüm modüllerdeki kayıtlar eşitlendi.'
          : 'Yeni departman eklendi.'
      );
    },
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/settings/definitions/categories/${id}`);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error);
      }
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['categories'] }),
  });

  const syncDeptsMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/settings/definitions/departments/sync-from-modules', {});
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Senkronizasyon başarısız.');
      }
      return res.json() as Promise<{ addedCount: number; addedNames: string[]; totalCount: number }>;
    },
    onSuccess: (data) => {
      invalidateDepartments();
      if (data.addedCount > 0) {
        toast.success(`${data.addedCount} eksik departman diğer modüllerden havuza çekildi.`);
      } else {
        toast.success('Tüm modüllerdeki departmanlar zaten bu listede mevcut.');
      }
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const mergeDeptsMutation = useMutation({
    mutationFn: async ({ sourceIds, targetId }: { sourceIds: number[]; targetId: number }) => {
      const res = await api.post('/settings/definitions/departments/merge', { sourceIds, targetId });
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Birleştirme başarısız.');
      }
      return res.json();
    },
    onSuccess: (data) => {
      invalidateDepartments();
      setMergeModal({ open: false, sourceIds: [] });
      setMergeTargetId('');
      setSelectedDeptIds([]);
      toast.success(data.message || 'Departmanlar başarıyla birleştirildi.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async ({ id, transferTargetId }: { id: number; transferTargetId?: number }) => {
      const url = transferTargetId
        ? `/settings/definitions/departments/${id}?transferTargetId=${transferTargetId}`
        : `/settings/definitions/departments/${id}`;
      const res = await api.delete(url);
      if (!res.ok) {
        const e = await res.json();
        throw new Error(e.error || 'Silme işlemi başarısız.');
      }
      return res.json();
    },
    onSuccess: (data) => {
      invalidateDepartments();
      setDeleteModal({ open: false, dept: null, loading: false, report: null });
      setDeleteTransferTargetId('');
      setSelectedDeptIds((prev) => prev.filter((id) => id !== deleteModal.dept?.id));
      toast.success(data.message || 'Departman silindi.');
    },
    onError: (err: Error) => toast.error(err.message),
  });

  const openCatEdit = (cat: Category) => {
    setCatModal({ open: true, edit: cat });
    setCatName(cat.name);
    setCatParentId(cat.parentId ? cat.parentId.toString() : 'none');
  };

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

  const openDeptEdit = (d: Department) => {
    setDeptName(d.name);
    setDeptModal({ open: true, edit: d });
  };

  const openMergeModal = (sourceIds: number[]) => {
    setMergeTargetId('');
    setMergeModal({ open: true, sourceIds });
  };

  const openSafeDeleteModal = async (dept: Department) => {
    setDeleteTransferTargetId('');
    setDeleteModal({ open: true, dept, loading: true, report: null });
    try {
      const res = await api.get(`/settings/definitions/departments/${dept.id}/dependencies`);
      if (!res.ok) throw new Error('Bağımlılık analizi alınamadı.');
      const report: DependencyReport = await res.json();
      setDeleteModal({ open: true, dept, loading: false, report });
    } catch (err: any) {
      toast.error(err.message || 'Bağımlılık kontrolü başarısız.');
      setDeleteModal({ open: false, dept: null, loading: false, report: null });
    }
  };

  const filteredDepartments = useMemo(() => {
    const q = deptSearch.trim().toLocaleLowerCase('tr-TR');
    if (!q) return departments;
    return departments.filter((d) => d.name.toLocaleLowerCase('tr-TR').includes(q));
  }, [departments, deptSearch]);

  const toggleSelectDept = (id: number) => {
    setSelectedDeptIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const mergeSources = useMemo(
    () => departments.filter((d) => mergeModal.sourceIds.includes(d.id)),
    [departments, mergeModal.sourceIds]
  );

  const mergeTargetCandidates = useMemo(
    () => departments.filter((d) => !mergeModal.sourceIds.includes(d.id)),
    [departments, mergeModal.sourceIds]
  );

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Tanım Yönetimi</h1>
            <p className="text-xs text-muted-foreground">
              Kategori, alt kategori ve tüm modüllerin ortak kullandığı kurumsal departman kataloğu
            </p>
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
              <p className="text-xs text-muted-foreground">
                İSG Defteri, Kurul ve risk modüllerinde kullanılacak 3 seviyeli kategori yapısını yapılandırın.
              </p>
            </div>
            <Button
              onClick={() => {
                setCatName('');
                setCatParentId('none');
                setCatModal({ open: true });
              }}
              className="h-8 text-xs px-3 rounded-md gap-1.5 shrink-0"
            >
              <Plus className="w-3.5 h-3.5" /> Kategori Ekle
            </Button>
          </div>

          {catsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-muted/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {categories
                .filter((c) => !c.parentId)
                .map((main) => (
                  <div
                    key={main.id}
                    className="bg-card border border-border/60 rounded-lg overflow-hidden shadow-xs"
                  >
                    <div className="flex items-center justify-between px-4 py-2.5 bg-muted/30 border-b border-border/40">
                      <div className="flex items-center gap-2.5">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-semibold text-foreground text-xs">{main.name}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCatName('');
                            setCatParentId(main.id.toString());
                            setCatModal({ open: true });
                          }}
                          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Alt Kategori Ekle
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => openCatEdit(main)}
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (
                              confirm(
                                'Bu kategoriyi (ve varsa alt kategorilerini) silmek istediğinize emin misiniz?'
                              )
                            )
                              deleteCatMutation.mutate(main.id);
                          }}
                          className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    <div className="divide-y divide-border/40">
                      {categories
                        .filter((c) => c.parentId === main.id)
                        .map((child) => (
                          <React.Fragment key={child.id}>
                            <div className="flex items-center justify-between px-4 py-2 hover:bg-muted/20 transition-colors pl-8">
                              <div className="flex items-center gap-2">
                                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/70" />
                                <span className="font-medium text-xs text-foreground">{child.name}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => {
                                    setCatName('');
                                    setCatParentId(child.id.toString());
                                    setCatModal({ open: true });
                                  }}
                                  className="h-6 px-2 text-muted-foreground hover:text-foreground text-[11px]"
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Alt Dal
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => openCatEdit(child)}
                                  className="h-6 w-6 text-muted-foreground"
                                >
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    if (
                                      confirm(
                                        'Bu kategoriyi (ve varsa alt kategorilerini) silmek istediğinize emin misiniz?'
                                      )
                                    )
                                      deleteCatMutation.mutate(child.id);
                                  }}
                                  className="h-6 w-6 text-destructive hover:text-destructive hover:bg-destructive/10"
                                >
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>

                            {categories
                              .filter((c) => c.parentId === child.id)
                              .map((sub) => (
                                <div
                                  key={sub.id}
                                  className="flex items-center justify-between px-4 py-1.5 hover:bg-muted/30 transition-colors pl-14 bg-muted/10"
                                >
                                  <div className="flex items-center gap-2">
                                    <ChevronRight className="w-3 h-3 text-muted-foreground/40" />
                                    <span className="text-xs text-muted-foreground">{sub.name}</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => openCatEdit(sub)}
                                      className="h-6 w-6 text-muted-foreground"
                                    >
                                      <Edit className="w-3 h-3" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      onClick={() => {
                                        if (confirm('Bu alt kategoriyi silmek istediğinize emin misiniz?'))
                                          deleteCatMutation.mutate(sub.id);
                                      }}
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
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Merkezi Departman Kataloğu ({departments.length})
              </h3>
              <p className="text-xs text-muted-foreground">
                Tüm modüller yalnızca burada tanımlı departmanları kullanır. Mükerrer kayıtları Birleştir (Merge) ile tek isimde toplayabilirsiniz.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {selectedDeptIds.length > 0 && (
                <Button
                  type="button"
                  variant="secondary"
                  onClick={() => openMergeModal(selectedDeptIds)}
                  className="h-8 text-xs px-3 rounded-md gap-1.5"
                >
                  <GitMerge className="w-3.5 h-3.5 text-primary" />
                  Seçilenleri Birleştir ({selectedDeptIds.length})
                </Button>
              )}
              <Button
                type="button"
                variant="outline"
                disabled={syncDeptsMutation.isPending}
                onClick={() => syncDeptsMutation.mutate()}
                className="h-8 text-xs px-3 rounded-md gap-1.5"
                title="Diğer modüllerde daha önce girilmiş ama bu listede olmayan departmanları otomatik havuza ekler"
              >
                {syncDeptsMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RefreshCw className="w-3.5 h-3.5" />
                )}
                Modüllerden Eksikleri Çek
              </Button>
              <Button
                onClick={() => {
                  setDeptName('');
                  setDeptModal({ open: true });
                }}
                className="h-8 text-xs px-3 rounded-md gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" /> Departman Ekle
              </Button>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={deptSearch}
                onChange={(e) => setDeptSearch(e.target.value)}
                placeholder="Departman ara..."
                className="h-8 pl-8 text-xs"
              />
            </div>
            {selectedDeptIds.length > 0 && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDeptIds([])}
                className="h-8 text-xs text-muted-foreground"
              >
                Seçimi Temizle
              </Button>
            )}
          </div>

          {deptsLoading ? (
            <div className="space-y-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-12 bg-muted/60 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : (
            <div className="bg-card border border-border/60 rounded-lg overflow-hidden divide-y divide-border/40 shadow-xs">
              {filteredDepartments.map((dept) => {
                const isChecked = selectedDeptIds.includes(dept.id);
                const usage = dept.usageCount || 0;
                return (
                  <div
                    key={dept.id}
                    className={`flex items-center justify-between gap-3 px-4 py-2.5 transition-colors ${isChecked ? 'bg-primary/5' : 'hover:bg-muted/20'
                      }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelectDept(dept.id)}
                        className="w-4 h-4 accent-primary rounded border-input cursor-pointer shrink-0"
                        aria-label={`${dept.name} seç`}
                      />
                      <Building2 className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="text-xs font-medium text-foreground truncate">{dept.name}</span>
                      <Badge
                        variant={usage > 0 ? 'secondary' : 'outline'}
                        className="text-[11px] font-normal tabular-nums shrink-0"
                      >
                        {usage} kayıt
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openMergeModal([dept.id])}
                        disabled={departments.length < 2}
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-primary"
                        title="Bu departmanı başka bir departman altında birleştir"
                      >
                        <GitMerge className="w-3.5 h-3.5 mr-1" /> Birleştir
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openDeptEdit(dept)}
                        className="h-7 px-2.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Edit className="w-3 h-3 mr-1" /> Düzenle
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => openSafeDeleteModal(dept)}
                        className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                        title="Departmanı Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                );
              })}
              {filteredDepartments.length === 0 && (
                <div className="text-center py-12 bg-muted/10 rounded-lg border border-dashed border-border/60">
                  <Building2 className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                  <p className="text-muted-foreground text-xs">
                    {deptSearch ? 'Aramanızla eşleşen departman bulunamadı.' : 'Henüz departman eklenmemiş.'}
                  </p>
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
            <DialogTitle className="text-base font-semibold">
              {catModal.edit ? 'Kategori Düzenle' : 'Yeni Kategori'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Kategori adı ve hiyerarşik üst kategorisini belirleyin.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCatMutation.mutate({
                name: catName,
                parentId: catParentId !== 'none' ? parseInt(catParentId) : null,
                id: catModal.edit?.id,
              });
            }}
            className="space-y-3.5 pt-2"
          >
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Kategori Adı *</Label>
              <Input
                value={catName}
                onChange={(e) => setCatName(e.target.value)}
                required
                autoFocus
                className="h-9 text-xs rounded-md"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Üst Kategori</Label>
              <select
                className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground ring-offset-background focus:outline-none focus:ring-1 focus:ring-ring"
                value={catParentId}
                onChange={(e) => setCatParentId(e.target.value)}
              >
                <option value="none">Ana Kategori (En Üst Seviye)</option>
                {categories
                  .filter(
                    (c) =>
                      c.id !== catModal.edit?.id &&
                      (!c.parentId || !categories.find((cc: any) => cc.id === c.parentId)?.parentId)
                  )
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {getCategoryPath(c)}
                    </option>
                  ))}
              </select>
              <p className="text-[11px] text-muted-foreground">Kategori seviyesini seçin (Maks. 3 seviye).</p>
            </div>
            {saveCatMutation.isError && (
              <p className="text-xs text-destructive font-medium">{(saveCatMutation.error as Error).message}</p>
            )}
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setCatModal({ open: false })}
                className="h-8 text-xs rounded-md"
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={saveCatMutation.isPending} className="h-8 text-xs rounded-md">
                {saveCatMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Departman Ekle/Düzenle Modal ─────────────────────────── */}
      <Dialog open={deptModal.open} onOpenChange={(v) => setDeptModal({ open: v })}>
        <DialogContent className="sm:max-w-[420px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold">
              {deptModal.edit ? 'Departman Düzenle' : 'Yeni Departman'}
            </DialogTitle>
            <DialogDescription className="text-xs">
              {deptModal.edit
                ? 'Departman adını değiştirdiğinizde tüm modüllerdeki mevcut kayıtlar otomatik olarak yeni ada güncellenir.'
                : 'Tanımlanacak kurumsal departman adını girin.'}
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
              <Input
                value={deptName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDeptName(e.target.value)}
                required
                autoFocus
                className="h-9 text-xs rounded-md"
              />
            </div>
            {saveDeptMutation.isError && (
              <p className="text-xs text-destructive font-medium">{(saveDeptMutation.error as Error).message}</p>
            )}
            <DialogFooter className="mt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => setDeptModal({ open: false })}
                className="h-8 text-xs rounded-md"
              >
                Vazgeç
              </Button>
              <Button type="submit" disabled={saveDeptMutation.isPending} className="h-8 text-xs rounded-md">
                {saveDeptMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Departman Birleştirme (Merge) Modal ──────────────────── */}
      <Dialog
        open={mergeModal.open}
        onOpenChange={(open) => !open && setMergeModal({ open: false, sourceIds: [] })}
      >
        <DialogContent className="sm:max-w-[500px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-primary" />
              Departman Birleştir (Merge)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Seçili kaynak departman(lar)daki tüm kayıtlar hedef departmana aktarılır ve kaynak departman(lar) listeden kaldırılır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2">
            {/* Kaynak kutusu */}
            <div className="rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50/60 dark:bg-red-950/20 p-3 space-y-2">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-red-700 dark:text-red-400">
                Kaynak (Birleştirilip Kaldırılacak — {mergeSources.length})
              </div>
              <div className="flex flex-wrap gap-1.5">
                {mergeSources.map((s) => (
                  <Badge
                    key={s.id}
                    variant="outline"
                    className="bg-background border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-xs"
                  >
                    {s.name} ({s.usageCount || 0})
                  </Badge>
                ))}
              </div>
            </div>

            <div className="flex justify-center">
              <ArrowRight className="w-4 h-4 text-muted-foreground rotate-90" />
            </div>

            {/* Hedef seçimi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium">Hedef Departman (Kalıcı Olacak) *</Label>
              <select
                value={mergeTargetId}
                onChange={(e) => setMergeTargetId(e.target.value)}
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">-- Hedef Departman Seçin --</option>
                {mergeTargetCandidates.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({d.usageCount || 0} kayıt)
                  </option>
                ))}
              </select>
            </div>

            {/* Güvenli aktarım bilgi kutusu */}
            <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-3 flex items-start gap-2.5 text-xs text-amber-800 dark:text-amber-300">
              <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <strong className="block mb-0.5">Güvenli Aktarım Garantisi</strong>
                Kullanıcılar, İyileştirme &amp; Aksiyonlar, Risk Sorumluları, Merkezi Denetim (IRSC), Yangın, Yapı Yönetimi,
                Olağanüstü Olaylar, Defterler, İSG Kurul ve Bina Turu kayıtlarının tamamı tek
                işlemde hedef departmana taşınır. Fiziksel lokasyon birimleri etkilenmez ve hiçbir veri kaybolmaz.
              </div>
            </div>

            {mergeDeptsMutation.isError && (
              <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-xs text-destructive font-medium">
                {(mergeDeptsMutation.error as Error).message}
              </div>
            )}
          </div>

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setMergeModal({ open: false, sourceIds: [] })}
              className="h-8 text-xs rounded-md"
            >
              Vazgeç
            </Button>
            <Button
              type="button"
              disabled={!mergeTargetId || mergeDeptsMutation.isPending}
              onClick={() =>
                mergeDeptsMutation.mutate({
                  sourceIds: mergeModal.sourceIds,
                  targetId: parseInt(mergeTargetId, 10),
                })
              }
              className="h-8 text-xs rounded-md gap-1.5"
            >
              {mergeDeptsMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <GitMerge className="w-3.5 h-3.5" />
              )}
              Birleştir ve Aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Bağımlılık Korumalı Silme Modal ──────────────────────── */}
      <Dialog
        open={deleteModal.open}
        onOpenChange={(open) =>
          !open && setDeleteModal({ open: false, dept: null, loading: false, report: null })
        }
      >
        <DialogContent className="sm:max-w-[480px] rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              Departmanı Sil: {deleteModal.dept?.name}
            </DialogTitle>
            <DialogDescription className="text-xs">
              Silme işleminden önce tüm modüllerdeki bağlı kayıtlar kontrol edilir.
            </DialogDescription>
          </DialogHeader>

          {deleteModal.loading ? (
            <div className="py-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="w-4 h-4 animate-spin" /> Modüllerdeki bağlı kayıtlar taranıyor...
            </div>
          ) : deleteModal.report?.hasDependencies ? (
            <div className="space-y-4 pt-2">
              <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/70 dark:bg-amber-950/20 p-3 text-xs text-amber-800 dark:text-amber-300 space-y-2">
                <p className="font-semibold">
                  Bu departman toplam {deleteModal.report.totalCount} kayıtta kullanılıyor:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {deleteModal.report.breakdown.map((b) => (
                    <div
                      key={b.module}
                      className="flex items-center justify-between bg-background/80 rounded px-2 py-1 border border-border/50"
                    >
                      <span className="truncate">{b.label}</span>
                      <Badge variant="secondary" className="text-[11px] tabular-nums">
                        {b.count}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-medium">
                  Bağlı Kayıtların Aktarılacağı Hedef Departman *
                </Label>
                <select
                  value={deleteTransferTargetId}
                  onChange={(e) => setDeleteTransferTargetId(e.target.value)}
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1.5 text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">-- Aktarılacak Departmanı Seçin --</option>
                  {departments
                    .filter((d) => d.id !== deleteModal.dept?.id)
                    .map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name}
                      </option>
                    ))}
                </select>
              </div>
            </div>
          ) : (
            <div className="py-3 text-xs text-muted-foreground">
              Bu departmana bağlı hiçbir kayıt bulunamadı. Güvenle silebilirsiniz.
            </div>
          )}

          <DialogFooter className="mt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteModal({ open: false, dept: null, loading: false, report: null })}
              className="h-8 text-xs rounded-md"
            >
              Vazgeç
            </Button>
            {deleteModal.report?.hasDependencies ? (
              <Button
                type="button"
                variant="destructive"
                disabled={!deleteTransferTargetId || deleteDeptMutation.isPending}
                onClick={() =>
                  deleteModal.dept &&
                  deleteDeptMutation.mutate({
                    id: deleteModal.dept.id,
                    transferTargetId: parseInt(deleteTransferTargetId, 10),
                  })
                }
                className="h-8 text-xs rounded-md gap-1.5"
              >
                {deleteDeptMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Kayıtları Aktar ve Sil
              </Button>
            ) : (
              <Button
                type="button"
                variant="destructive"
                disabled={deleteModal.loading || deleteDeptMutation.isPending}
                onClick={() =>
                  deleteModal.dept && deleteDeptMutation.mutate({ id: deleteModal.dept.id })
                }
                className="h-8 text-xs rounded-md gap-1.5"
              >
                {deleteDeptMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sil
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
