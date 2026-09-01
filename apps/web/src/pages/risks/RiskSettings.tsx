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
interface Area { id: number; name: string; departmentId: number }
interface HospitalDepartment { id: number; name: string; riskCount: number; areas: Area[] }

export default function RiskSettings() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  // ── Facility Selection ───────────────────────────────────────
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    localStorage.getItem('activeFacilityId') || ''
  );

  useEffect(() => {
    const handleFacilityChange = () => {
      setSelectedFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  // ── Modals & Form State ──────────────────────────────────────
  // 1. Hastane Bölümleri (Hospital Departments)
  const [hospModal, setHospModal] = useState<{ open: boolean; edit?: HospitalDepartment }>({ open: false });
  const [hospName, setHospName] = useState('');

  // 1.5 Alanlar (Areas)
  const [areaModal, setAreaModal] = useState<{ open: boolean; departmentId?: number; edit?: Area }>({ open: false });
  const [areaName, setAreaName] = useState('');

  // 2. Departmanlar (RiskDepartmentSetting)
  const [deptModal, setDeptModal] = useState<{ open: boolean; edit?: Department }>({ open: false });
  const [deptName, setDeptName] = useState('');

  // 3. Kategoriler (RiskCategorySetting)

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

  // Alanlar (Areas) Mutations
  const saveAreaMutation = useMutation({
    mutationFn: async ({ name, departmentId, id }: { name: string; departmentId?: number; id?: number }) => {
      const res = id
        ? await fetch(`${API}/api/risks/departments/areas/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ name })
          })
        : await fetch(`${API}/api/risks/departments/areas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ departmentId, name })
          });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-hospital-departments', selectedFacilityId] });
      queryClient.invalidateQueries({ queryKey: ['risk-department-details'] });
      setAreaModal({ open: false });
      setAreaName('');
      toast.success('Alan başarıyla kaydedildi.');
    },
    onError: (err: any) => toast.error(err.message || 'Alan kaydedilemedi.'),
  });

  const deleteAreaMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API}/api/risks/departments/areas/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['risk-hospital-departments', selectedFacilityId] });
      queryClient.invalidateQueries({ queryKey: ['risk-department-details'] });
      toast.success('Alan silindi.');
    },
    onError: (err: any) => toast.error(err.message || 'Alan silinemedi.'),
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

  const openDeptEdit = (d: Department) => { setDeptName(d.name); setDeptModal({ open: true, edit: d }); };

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
      </div>

      {!selectedFacilityId ? (
        <Card className="border-dashed py-16 text-center">
          <CardContent>
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">Tesis verileri yükleniyor...</p>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="departments" className="w-full">
          <TabsList className="grid w-full grid-cols-1 md:w-[200px] bg-muted/50 p-1 rounded-xl">
            {/* <TabsTrigger value="hosp-depts" className="gap-2 rounded-lg">
              <Building2 className="w-4 h-4" /> Hastane Bölümleri
            </TabsTrigger> */}
            <TabsTrigger value="departments" className="gap-2 rounded-lg">
              <Building2 className="w-4 h-4" /> Departmanlar / Sorumlular
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
              <div className="space-y-4">
                {hospitalDepartments.map((hdept) => (
                  <div key={hdept.id} className="bg-card border rounded-xl overflow-hidden shadow-sm">
                    {/* Departman Başlığı */}
                    <div className="flex items-center justify-between px-5 py-4 bg-muted/40 border-b">
                      <div className="flex items-center gap-3">
                        <Building2 className="w-4.5 h-4.5 text-primary/70" />
                        <span className="font-bold text-sm text-foreground">{hdept.name}</span>
                        <Badge variant="outline" className="text-xs font-normal bg-background">
                          {hdept.riskCount} aktif risk
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
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
                        <div className="h-4 w-px bg-border mx-1" />
                        <Button
                          variant="secondary"
                          size="sm"
                          className="h-8 px-3 text-xs bg-primary/5 text-primary hover:bg-primary/10 border border-primary/20"
                          onClick={() => { setAreaName(''); setAreaModal({ open: true, departmentId: hdept.id }); }}
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" /> Alan Ekle
                        </Button>
                      </div>
                    </div>

                    {/* Alt Alanlar Listesi */}
                    {hdept.areas && hdept.areas.length > 0 ? (
                      <div className="divide-y divide-border">
                        {hdept.areas.map((area) => (
                          <div key={area.id} className="flex items-center justify-between px-5 py-3 hover:bg-muted/20 transition-colors">
                            <div className="flex items-center gap-3 text-sm text-muted-foreground">
                              <ChevronRight className="w-4 h-4 text-muted-foreground/50" />
                              <span className="text-foreground font-medium">{area.name}</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                              <Button variant="ghost" size="sm" onClick={() => openAreaEdit(area)} className="h-7 px-2 text-xs text-muted-foreground">
                                <Edit className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => {
                                  if (confirm('Bu alanı silmek istediğinize emin misiniz?')) {
                                    deleteAreaMutation.mutate(area.id);
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
                        Alan tanımlanmamış. Risks formunda "Alan" doğrudan bölüm adı ({hdept.name}) olarak gelecektir.
                      </div>
                    )}
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

      {/* 1.5. Alan Ekle/Düzenle */}
      <Dialog open={areaModal.open} onOpenChange={(v) => setAreaModal({ open: v })}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{areaModal.edit ? 'Alan Düzenle' : 'Yeni Alan Ekle'}</DialogTitle>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              saveAreaMutation.mutate({ 
                name: areaName, 
                departmentId: areaModal.departmentId, 
                id: areaModal.edit?.id 
              });
            }}
            className="space-y-4 pt-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-semibold">Alan Adı *</label>
              <Input 
                value={areaName} 
                onChange={(e) => setAreaName(e.target.value)} 
                placeholder="Örn: MR, Röntgen" 
                required 
                autoFocus 
              />
            </div>
            <DialogFooter className="mt-6">
              <Button type="button" variant="outline" onClick={() => setAreaModal({ open: false })}>Vazgeç</Button>
              <Button type="submit" disabled={saveAreaMutation.isPending}>
                {saveAreaMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
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


    </div>
  );
}
