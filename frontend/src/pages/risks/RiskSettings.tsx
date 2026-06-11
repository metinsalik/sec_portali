import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Edit, ChevronRight, Loader2, Tag, Building2, Trash2, Settings, Landmark, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

const API = import.meta.env.VITE_API_URL || '';

interface SubCategory { id: number; name: string; categoryId: number }
interface Category { id: number; name: string; subCategories: SubCategory[] }
interface Department { id: number; name: string }
interface HospitalDepartment { id: number; name: string; riskCount: number }

export default function RiskSettings() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  // ── Facility Selection ───────────────────────────────────────
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');

  const { data: facilities = [], isLoading: facsLoading } = useQuery<any[]>({
    queryKey: ['risks-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/facilities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  useEffect(() => {
    if (facilities.length > 0 && !selectedFacilityId) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  // ── Modals & Form State ──────────────────────────────────────
  // 1. Hastane Bölümleri (Hospital Departments)
  const [hospModal, setHospModal] = useState<{ open: boolean; edit?: HospitalDepartment }>({ open: false });
  const [hospName, setHospName] = useState('');

  // 2. Departmanlar (RiskDepartmentSetting)
  const [deptModal, setDeptModal] = useState<{ open: boolean; edit?: Department }>({ open: false });
  const [deptName, setDeptName] = useState('');

  // 3. Kategoriler (RiskCategorySetting)
  const [catModal, setCatModal] = useState<{ open: boolean; edit?: Category }>({ open: false });
  const [catName, setCatName] = useState('');

  // 4. Alt Kategoriler (RiskSubCategorySetting)
  const [subModal, setSubModal] = useState<{ open: boolean; categoryId?: number; edit?: SubCategory }>({ open: false });
  const [subName, setSubName] = useState('');

  // ── Fetching Data ───────────────────────────────────────────
  // Hospital Departments (from existing /api/risks/departments)
  const { data: hospitalDepartments = [], isLoading: hospLoading } = useQuery<HospitalDepartment[]>({
    queryKey: ['risk-hospital-departments', selectedFacilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/departments?facilityId=${selectedFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!selectedFacilityId,
  });

  // Custom Settings (from /api/risks/settings)
  const { data: settingsData = { departments: [], categories: [] }, isLoading: settingsLoading } = useQuery<{
    departments: Department[];
    categories: Category[];
  }>({
    queryKey: ['risk-settings', selectedFacilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/settings?facilityId=${selectedFacilityId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!selectedFacilityId,
  });

  // ── Mutations ────────────────────────────────────────────────
  // Hastane Bölümleri Mutations
  const saveHospMutation = useMutation({
    mutationFn: async ({ name, id }: { name: string; id?: number }) => {
      const res = id
        ? await fetch(`${API}/api/risks/departments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name })
          })
        : await fetch(`${API}/api/risks/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ facilityId: selectedFacilityId, name })
          });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-hospital-departments', selectedFacilityId] });
      setHospModal({ open: false });
      setHospName('');
      toast.success('Bölüm başarıyla kaydedildi.');
    },
    onError: (err: any) => toast.error(err.message || 'Bölüm kaydedilemedi.'),
  });

  const deleteHospMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/risks/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-hospital-departments', selectedFacilityId] });
      toast.success('Bölüm silindi.');
    },
    onError: (err: any) => toast.error(err.message || 'Bölüm silinemedi.'),
  });

  // Departmanlar Mutations
  const saveDeptMutation = useMutation({
    mutationFn: async ({ name, id }: { name: string; id?: number }) => {
      const res = id
        ? await fetch(`${API}/api/risks/settings/departments/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name })
          })
        : await fetch(`${API}/api/risks/settings/departments`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ facilityId: selectedFacilityId, name })
          });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings', selectedFacilityId] });
      setDeptModal({ open: false });
      setDeptName('');
      toast.success('Departman başarıyla kaydedildi.');
    },
    onError: (err: any) => toast.error(err.message || 'Departman kaydedilemedi.'),
  });

  const deleteDeptMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/risks/settings/departments/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings', selectedFacilityId] });
      toast.success('Departman silindi.');
    },
    onError: (err: any) => toast.error(err.message || 'Departman silinemedi.'),
  });

  // Kategoriler Mutations
  const saveCatMutation = useMutation({
    mutationFn: async ({ name, id }: { name: string; id?: number }) => {
      const res = id
        ? await fetch(`${API}/api/risks/settings/categories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name })
          })
        : await fetch(`${API}/api/risks/settings/categories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ facilityId: selectedFacilityId, name })
          });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings', selectedFacilityId] });
      setCatModal({ open: false });
      setCatName('');
      toast.success('Kategori başarıyla kaydedildi.');
    },
    onError: (err: any) => toast.error(err.message || 'Kategori kaydedilemedi.'),
  });

  const deleteCatMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/risks/settings/categories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings', selectedFacilityId] });
      toast.success('Kategori silindi.');
    },
    onError: (err: any) => toast.error(err.message || 'Kategori silinemedi.'),
  });

  // Alt Kategoriler Mutations
  const saveSubMutation = useMutation({
    mutationFn: async ({ name, categoryId, id }: { name: string; categoryId?: number; id?: number }) => {
      const res = id
        ? await fetch(`${API}/api/risks/settings/subcategories/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name })
          })
        : await fetch(`${API}/api/risks/settings/subcategories`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ categoryId, name })
          });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings', selectedFacilityId] });
      setSubModal({ open: false });
      setSubName('');
      toast.success('Alt kategori başarıyla kaydedildi.');
    },
    onError: (err: any) => toast.error(err.message || 'Alt kategori kaydedilemedi.'),
  });

  const deleteSubMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/risks/settings/subcategories/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-settings', selectedFacilityId] });
      toast.success('Alt kategori silindi.');
    },
    onError: (err: any) => toast.error(err.message || 'Alt kategori silinemedi.'),
  });

  // Open Edit Dialog Helpers
  const openHospEdit = (h: HospitalDepartment) => { setHospName(h.name); setHospModal({ open: true, edit: h }); };
  const openDeptEdit = (d: Department) => { setDeptName(d.name); setDeptModal({ open: true, edit: d }); };
  const openCatEdit = (cat: Category) => { setCatName(cat.name); setCatModal({ open: true, edit: cat }); };
  const openSubEdit = (sub: SubCategory) => { setSubName(sub.name); setSubModal({ open: true, edit: sub }); };

  return (
    <div className="space-y-6">
      {/* Üst Başlık ve Tesis Seçici */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="w-6 h-6 text-primary" /> Risk Yaşam Döngüsü Ayarları
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Seçili tesis için Hastane Bölümleri, Departmanlar ve Kategori tanımlarını özelleştirin.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Landmark className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium text-muted-foreground">Aktif Tesis:</span>
          {facsLoading ? (
            <Skeleton className="h-9 w-[220px]" />
          ) : (
            <Select value={selectedFacilityId} onValueChange={setSelectedFacilityId}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Tesis seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map((fac) => (
                  <SelectItem key={fac.id} value={fac.id}>
                    {fac.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
      </div>

      {!selectedFacilityId ? (
        <Card className="border-dashed py-16 text-center">
          <CardContent>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Tesis verileri yükleniyor...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="hosp-depts" className="w-full">
          <TabsList className="grid w-full grid-cols-3 md:w-[600px] bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="hosp-depts" className="gap-2 rounded-lg">
              <Building2 className="w-4 h-4" /> Hastane Bölümleri
            </TabsTrigger>
            <TabsTrigger value="departments" className="gap-2 rounded-lg">
              <Building2 className="w-4 h-4" /> Departmanlar
            </TabsTrigger>
            <TabsTrigger value="categories" className="gap-2 rounded-lg">
              <Tag className="w-4 h-4" /> Kategoriler
            </TabsTrigger>
          </TabsList>

          {/* ── 1. HASTANE BÖLÜMLERİ ────────────────────────────────────────── */}
          <TabsContent value="hosp-depts" className="pt-4 space-y-4">
            <div className="flex justify-between items-center bg-card border px-4 py-3 rounded-xl">
              <div className="text-xs text-muted-foreground font-medium">
                Örn: Acil Servis, Yetişkin Yoğun Bakım, Yatan Hasta Servisi. Bu bölümler risk listesinde sol menüyü oluşturur.
              </div>
              <Button size="sm" onClick={() => { setHospName(''); setHospModal({ open: true }); }} className="shrink-0 ml-4">
                <Plus className="w-4 h-4 mr-1.5" /> Bölüm Eklle
              </Button>
            </div>

            {hospLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="bg-card border rounded-xl overflow-hidden divide-y">
                {hospitalDepartments.map((hdept) => (
                  <div key={hdept.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4.5 h-4.5 text-primary/70" />
                      <span className="text-sm font-semibold text-foreground">{hdept.name}</span>
                      <Badge variant="outline" className="text-xs font-normal bg-background">
                        {hdept.riskCount} aktif risk
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openHospEdit(hdept)} className="h-8 px-3 text-xs text-muted-foreground">
                        <Edit className="w-3.5 h-3.5 mr-1" /> Düzenle
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          if (confirm('Bu bölümü silmek istediğinize emin misiniz? Bölüm altındaki tüm riskler silinecektir!')) {
                            deleteHospMutation.mutate(hdept.id);
                          }
                        }} 
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {hospitalDepartments.length === 0 && (
                  <div className="text-center py-16 bg-background rounded-xl border border-dashed">
                    <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Henüz hastane bölümü eklenmemiş.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── 2. DEPARTMANLAR ────────────────────────────────────────────── */}
          <TabsContent value="departments" className="pt-4 space-y-4">
            <div className="flex justify-between items-center bg-card border px-4 py-3 rounded-xl">
              <div className="text-xs text-muted-foreground font-medium">
                Örn: Başhekimlik, İSG, Kalite Müdürlüğü, Biyomedikal Müdürlüğü, Teknik Hizmetler.
              </div>
              <Button size="sm" onClick={() => { setDeptName(''); setDeptModal({ open: true }); }} className="shrink-0 ml-4">
                <Plus className="w-4 h-4 mr-1.5" /> Departman Ekle
              </Button>
            </div>

            {settingsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => <div key={i} className="h-14 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="bg-card border rounded-xl overflow-hidden divide-y">
                {settingsData.departments.map((dept) => (
                  <div key={dept.id} className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition-colors">
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4.5 h-4.5 text-blue-500/70" />
                      <span className="text-sm font-semibold text-foreground">{dept.name}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Button variant="ghost" size="sm" onClick={() => openDeptEdit(dept)} className="h-8 px-3 text-xs text-muted-foreground">
                        <Edit className="w-3.5 h-3.5 mr-1" /> Düzenle
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={() => {
                          if (confirm('Bu departmanı silmek istediğinize emin misiniz?')) {
                            deleteDeptMutation.mutate(dept.id);
                          }
                        }} 
                        className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
                {settingsData.departments.length === 0 && (
                  <div className="text-center py-16 bg-background rounded-xl border border-dashed">
                    <Building2 className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Henüz departman eklenmemiş.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* ── 3. KATEGORİLER VE ALT KATEGORİLER ──────────────────────────── */}
          <TabsContent value="categories" className="pt-4 space-y-4">
            <div className="flex justify-between items-center bg-card border px-4 py-3 rounded-xl">
              <div className="text-xs text-muted-foreground font-medium">
                Örn: Tıbbi Hizmetler, Yönetsel Hizmetler, Tesis Güvenliği, Çevre Güvenliği.
              </div>
              <Button size="sm" onClick={() => { setCatName(''); setCatModal({ open: true }); }} className="shrink-0 ml-4">
                <Plus className="w-4 h-4 mr-1.5" /> Kategori Ekle
              </Button>
            </div>

            {settingsLoading ? (
              <div className="space-y-4">
                {[1, 2].map((i) => <div key={i} className="h-20 bg-muted rounded-xl animate-pulse" />)}
              </div>
            ) : (
              <div className="space-y-4">
                {settingsData.categories.map((cat) => (
                  <div key={cat.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                    {/* Kategori Başlığı */}
                    <div className="flex items-center justify-between px-5 py-4 bg-muted/40 border-b">
                      <div className="flex items-center gap-3">
                        <Tag className="w-4 h-4 text-primary" />
                        <span className="font-bold text-sm text-foreground">{cat.name}</span>
                        <Badge variant="outline" className="text-xs font-normal bg-background">
                          {cat.subCategories.length} alt kategori
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openCatEdit(cat)} className="h-8 px-3 text-xs text-muted-foreground">
                          <Edit className="w-3.5 h-3.5 mr-1" /> Düzenle
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => {
                            if (confirm('Bu kategoriyi ve bağlı tüm alt kategorilerini silmek istediğinize emin misiniz?')) {
                              deleteCatMutation.mutate(cat.id);
                            }
                          }} 
                          className="h-8 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                        <div className="h-4 w-px bg-border mx-1" />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 px-3 text-xs bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20"
                          onClick={() => { setSubName(''); setSubModal({ open: true, categoryId: cat.id }); }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Alt Kategori Ekle
                        </Button>
                      </div>
                    </div>

                    {/* Alt Kategoriler Listesi */}
                    {cat.subCategories.length > 0 ? (
                      <div className="divide-y divide-border">
                        {cat.subCategories.map((sub) => (
                          <div key={sub.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                              <span className="text-foreground font-medium">{sub.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button variant="ghost" size="sm" onClick={() => openSubEdit(sub)} className="h-7 px-2 text-xs text-muted-foreground">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  if (confirm('Bu alt kategoriyi silmek istediğinize emin misiniz?')) {
                                    deleteSubMutation.mutate(sub.id);
                                  }
                                }} 
                                className="h-7 px-2 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-5 py-4 text-sm text-muted-foreground/60 italic bg-card text-center">
                        Alt kategori bulunamadı. "Alt Kategori Ekle" butonunu kullanarak ekleyebilirsiniz.
                      </div>
                    )}
                  </div>
                ))}
                {settingsData.categories.length === 0 && (
                  <div className="text-center py-16 bg-background rounded-xl border border-dashed">
                    <Tag className="w-10 h-10 text-muted-foreground/30 mx-auto mb-4" />
                    <p className="text-muted-foreground text-sm">Henüz kategori eklenmemiş.</p>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      )}

      {/* ── Modallar ──────────────────────────────────────────────── */}
      {/* 1. Hastane Bölümü Ekle/Düzenle */}
      <Dialog open={hospModal.open} onOpenChange={(v) => setHospModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{hospModal.edit ? 'Hastane Bölümü Düzenle' : 'Yeni Hastane Bölümü Ekle'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveHospMutation.mutate({ name: hospName, id: hospModal.edit?.id });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold">Bölüm Adı *</label>
              <Input 
                value={hospName} 
                onChange={(e) => setHospName(e.target.value)} 
                placeholder="Örn: Acil Servis" 
                required 
                autoFocus 
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setHospModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveHospMutation.isPending}>
                {saveHospMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 2. Departman Ekle/Düzenle */}
      <Dialog open={deptModal.open} onOpenChange={(v) => setDeptModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{deptModal.edit ? 'Departmanı Düzenle' : 'Yeni Departman Ekle'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveDeptMutation.mutate({ name: deptName, id: deptModal.edit?.id });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold">Departman Adı *</label>
              <Input 
                value={deptName} 
                onChange={(e) => setDeptName(e.target.value)} 
                placeholder="Örn: Başhekimlik" 
                required 
                autoFocus 
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setDeptModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveDeptMutation.isPending}>
                {saveDeptMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 3. Kategori Ekle/Düzenle */}
      <Dialog open={catModal.open} onOpenChange={(v) => setCatModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{catModal.edit ? 'Kategori Düzenle' : 'Yeni Kategori Ekle'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveCatMutation.mutate({ name: catName, id: catModal.edit?.id });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold">Kategori Adı *</label>
              <Input 
                value={catName} 
                onChange={(e) => setCatName(e.target.value)} 
                placeholder="Örn: Tıbbi Hizmetler" 
                required 
                autoFocus 
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setCatModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveCatMutation.isPending}>
                {saveCatMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* 4. Alt Kategori Ekle/Düzenle */}
      <Dialog open={subModal.open} onOpenChange={(v) => setSubModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{subModal.edit ? 'Alt Kategori Düzenle' : 'Yeni Alt Kategori Ekle'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveSubMutation.mutate({ 
                name: subName, 
                categoryId: subModal.categoryId, 
                id: subModal.edit?.id 
              });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold">Alt Kategori Adı *</label>
              <Input 
                value={subName} 
                onChange={(e) => setSubName(e.target.value)} 
                placeholder="Örn: Hizmete erişim ile ilgili riskler" 
                required 
                autoFocus 
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setSubModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveSubMutation.isPending}>
                {saveSubMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
