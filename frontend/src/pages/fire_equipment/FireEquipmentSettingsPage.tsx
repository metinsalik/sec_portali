import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings, FolderTree, MapPin, Plus, Trash2, Users, Pencil, X, Check, ChevronDown, ChevronRight, Briefcase } from 'lucide-react';

export default function FireEquipmentSettingsPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] = useState({ name: '', description: '', parentId: 'none', maintenanceFrequency: 'none' });
  const [newLocation, setNewLocation] = useState({ building: '', floor: '', description: '' });
  const [newResponsible, setNewResponsible] = useState({ name: '', department: '' });

  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [editingResponsible, setEditingResponsible] = useState<any>(null);
  const [editingCompany, setEditingCompany] = useState<any>(null);

  const [newCompany, setNewCompany] = useState({ name: '' });

  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({});
  const toggleCat = (id: string) => setExpandedCats(prev => ({ ...prev, [id]: !prev[id] }));

  // Kategoriler
  const { data: categories, isLoading: isCatLoading } = useQuery({
    queryKey: ['fire-categories'],
    queryFn: async () => {
      const res = await api.get('/fire-equipment/categories');
      return res.json();
    }
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = { name: data.name, description: data.description };
      if (data.parentId !== 'none') payload.parentId = data.parentId;
      if (data.maintenanceFrequency !== 'none') payload.maintenanceFrequency = data.maintenanceFrequency;
      return api.post('/fire-equipment/categories', payload);
    },
    onSuccess: () => {
      toast.success('Kategori eklendi.');
      setNewCategory({ name: '', description: '', parentId: 'none', maintenanceFrequency: 'none' });
      queryClient.invalidateQueries({ queryKey: ['fire-categories'] });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload: any = { name: data.name, description: data.description };
      payload.parentId = data.parentId !== 'none' ? data.parentId : null;
      payload.maintenanceFrequency = data.maintenanceFrequency !== 'none' ? data.maintenanceFrequency : null;
      return api.put(`/fire-equipment/categories/${data.id}`, payload);
    },
    onSuccess: () => {
      toast.success('Kategori güncellendi.');
      setEditingCategory(null);
      queryClient.invalidateQueries({ queryKey: ['fire-categories'] });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/fire-equipment/categories/${id}`);
    },
    onSuccess: () => {
      toast.success('Kategori silindi.');
      queryClient.invalidateQueries({ queryKey: ['fire-categories'] });
    }
  });

  // Lokasyonlar
  const { data: locations, isLoading: isLocLoading } = useQuery({
    queryKey: ['fire-locations', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/locations/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/fire-equipment/locations/${facilityId}`, data);
    },
    onSuccess: () => {
      toast.success('Lokasyon eklendi.');
      setNewLocation({ building: '', floor: '', description: '' });
      queryClient.invalidateQueries({ queryKey: ['fire-locations', facilityId] });
    }
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.put(`/fire-equipment/locations/${data.id}`, data);
    },
    onSuccess: () => {
      toast.success('Lokasyon güncellendi.');
      setEditingLocation(null);
      queryClient.invalidateQueries({ queryKey: ['fire-locations', facilityId] });
    }
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/fire-equipment/locations/${id}`);
    },
    onSuccess: () => {
      toast.success('Lokasyon silindi.');
      queryClient.invalidateQueries({ queryKey: ['fire-locations', facilityId] });
    }
  });

  // Sorumlular
  const { data: responsibles, isLoading: isRespLoading } = useQuery({
    queryKey: ['fire-responsibles', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/responsibles/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const createResponsibleMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/fire-equipment/responsibles/${facilityId}`, data);
    },
    onSuccess: () => {
      toast.success('Sorumlu eklendi.');
      setNewResponsible({ name: '', department: '' });
      queryClient.invalidateQueries({ queryKey: ['fire-responsibles', facilityId] });
    }
  });

  const updateResponsibleMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.put(`/fire-equipment/responsibles/${data.id}`, data);
    },
    onSuccess: () => {
      toast.success('Sorumlu güncellendi.');
      setEditingResponsible(null);
      queryClient.invalidateQueries({ queryKey: ['fire-responsibles', facilityId] });
    }
  });

  const deleteResponsibleMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/fire-equipment/responsibles/${id}`);
    },
    onSuccess: () => {
      toast.success('Sorumlu silindi.');
      queryClient.invalidateQueries({ queryKey: ['fire-responsibles', facilityId] });
    }
  });

  // Firmalar
  const { data: companies, isLoading: isCompLoading } = useQuery({
    queryKey: ['fire-companies', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/companies/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const createCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.post(`/fire-equipment/companies/${facilityId}`, data);
    },
    onSuccess: () => {
      toast.success('Firma eklendi.');
      setNewCompany({ name: '' });
      queryClient.invalidateQueries({ queryKey: ['fire-companies', facilityId] });
    }
  });

  const updateCompanyMutation = useMutation({
    mutationFn: async (data: any) => {
      return api.put(`/fire-equipment/companies/${data.id}`, data);
    },
    onSuccess: () => {
      toast.success('Firma güncellendi.');
      setEditingCompany(null);
      queryClient.invalidateQueries({ queryKey: ['fire-companies', facilityId] });
    }
  });

  const deleteCompanyMutation = useMutation({
    mutationFn: async (id: string) => {
      return api.delete(`/fire-equipment/companies/${id}`);
    },
    onSuccess: () => {
      toast.success('Firma silindi.');
      queryClient.invalidateQueries({ queryKey: ['fire-companies', facilityId] });
    }
  });

  if (!facilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen bir tesis seçin.</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-12 p-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
          <Settings className="w-8 h-8 text-slate-500" /> Modül Ayarları
        </h1>
        <p className="text-muted-foreground mt-1">Yangın ekipmanları modülüne ait kategori ve lokasyon tanımlamaları.</p>
      </div>

      <Tabs defaultValue="categories" className="w-full">
          <TabsList className="bg-muted w-full justify-start h-auto p-1 flex-wrap">
            <TabsTrigger value="categories" className="flex-1 min-w-[120px] py-2.5"><FolderTree className="w-4 h-4 mr-2" /> Kategoriler</TabsTrigger>
            <TabsTrigger value="locations" className="flex-1 min-w-[120px] py-2.5"><MapPin className="w-4 h-4 mr-2" /> Lokasyonlar</TabsTrigger>
            <TabsTrigger value="responsibles" className="flex-1 min-w-[120px] py-2.5"><Users className="w-4 h-4 mr-2" /> Sorumlular</TabsTrigger>
            <TabsTrigger value="companies" className="flex-1 min-w-[120px] py-2.5"><Briefcase className="w-4 h-4 mr-2" /> Firmalar</TabsTrigger>
          </TabsList>

        <TabsContent value="categories">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 h-fit shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Yeni Kategori Ekle</CardTitle>
                <CardDescription>Ekipman türlerini belirleyin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Kategori Adı</Label>
                  <Input 
                    value={newCategory.name} 
                    onChange={e => setNewCategory({...newCategory, name: e.target.value})} 
                    placeholder="Örn: Yangın Tüpü" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama</Label>
                  <Input 
                    value={newCategory.description} 
                    onChange={e => setNewCategory({...newCategory, description: e.target.value})} 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Üst Kategori</Label>
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={newCategory.parentId} 
                    onChange={e => setNewCategory({...newCategory, parentId: e.target.value})}
                  >
                    <option value="none">Ana Kategori (Üst Kategori Yok)</option>
                    {categories?.filter((c: any) => !c.parentId).map((cat: any) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Bakım Periyodu</Label>
                  <Select value={newCategory.maintenanceFrequency} onValueChange={val => setNewCategory({...newCategory, maintenanceFrequency: val})}>
                    <SelectTrigger><SelectValue placeholder="Seçiniz..." /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Belirtilmemiş</SelectItem>
                      <SelectItem value="AYLIK">Aylık</SelectItem>
                      <SelectItem value="3_AYLIK">3 Aylık</SelectItem>
                      <SelectItem value="6_AYLIK">6 Aylık</SelectItem>
                      <SelectItem value="YILLIK">Yıllık</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button  
                  className="w-full" 
                  onClick={() => createCategoryMutation.mutate(newCategory)}
                  disabled={!newCategory.name || createCategoryMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Kayıtlı Kategoriler</CardTitle>
              </CardHeader>
              <CardContent>
                {isCatLoading ? <p>Yükleniyor...</p> : (
                  <div className="space-y-4">
                    {categories?.filter((c: any) => !c.parentId).map((cat: any) => (
                      <div key={cat.id} className="space-y-2">
                        <div className="p-3 border rounded-lg bg-white dark:bg-slate-900 shadow-sm">
                          {editingCategory?.id === cat.id ? (
                            <div className="space-y-3">
                              <Input value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="Adı" />
                              <Input value={editingCategory.description || ''} onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} placeholder="Açıklama" />
                              <select 
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                value={editingCategory.parentId || 'none'} 
                                onChange={e => setEditingCategory({...editingCategory, parentId: e.target.value})}
                              >
                                <option value="none">Ana Kategori</option>
                                {categories.filter((c:any) => c.id !== cat.id && !c.parentId).map((c: any) => (
                                  <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                              </select>
                              <div className="flex gap-2">
                                <Button size="sm" onClick={() => updateCategoryMutation.mutate(editingCategory)}><Check className="w-4 h-4 mr-1" /> Kaydet</Button>
                                <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>İptal</Button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-2 cursor-pointer" onClick={() => toggleCat(cat.id)}>
                                {categories?.filter((subCat: any) => subCat.parentId === cat.id).length > 0 ? (
                                  expandedCats[cat.id] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                ) : (
                                  <div className="w-4 h-4" />
                                )}
                                <div>
                                  <p className="font-semibold text-sm flex items-center gap-2 hover:text-blue-600 transition-colors">
                                    {cat.name}
                                  </p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {cat.description || 'Açıklama yok'} 
                                    {cat.maintenanceFrequency && <span className="ml-2 font-medium text-blue-600 bg-blue-50 px-1.5 rounded border border-blue-100">Periyot: {cat.maintenanceFrequency.replace('_', ' ')}</span>}
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingCategory({ ...cat, parentId: cat.parentId || 'none', maintenanceFrequency: cat.maintenanceFrequency || 'none' })}><Pencil className="w-4 h-4" /></Button>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => { if(window.confirm('Kategori silinsin mi?')) deleteCategoryMutation.mutate(cat.id); }}><Trash2 className="w-4 h-4" /></Button>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {/* Alt Kategoriler */}
                        {expandedCats[cat.id] && categories?.filter((subCat: any) => subCat.parentId === cat.id).length > 0 && (
                          <div className="pl-6 space-y-2 border-l-2 border-slate-100 dark:border-slate-800 ml-4">
                            {categories?.filter((subCat: any) => subCat.parentId === cat.id).map((subCat: any) => (
                              <div key={subCat.id} className="p-2 border rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                {editingCategory?.id === subCat.id ? (
                                  <div className="space-y-3">
                                    <Input value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} placeholder="Adı" />
                                    <Input value={editingCategory.description || ''} onChange={e => setEditingCategory({...editingCategory, description: e.target.value})} placeholder="Açıklama" />
                                    <select 
                                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                      value={editingCategory.parentId || 'none'} 
                                      onChange={e => setEditingCategory({...editingCategory, parentId: e.target.value})}
                                    >
                                      <option value="none">Ana Kategori</option>
                                      {categories.filter((c:any) => c.id !== subCat.id && !c.parentId).map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                      ))}
                                    </select>
                                    <div className="flex gap-2">
                                      <Button size="sm" onClick={() => updateCategoryMutation.mutate(editingCategory)}><Check className="w-4 h-4 mr-1" /> Kaydet</Button>
                                      <Button size="sm" variant="ghost" onClick={() => setEditingCategory(null)}>İptal</Button>
                                    </div>
                                  </div>
                                ) : (
                                  <div className="flex justify-between items-start">
                                    <div>
                                      <p className="font-semibold text-sm flex items-center gap-2">
                                        <span className="text-muted-foreground">↳</span> {subCat.name}
                                      </p>
                                      <p className="text-xs text-muted-foreground mt-1 ml-4">
                                        {subCat.description || 'Açıklama yok'} 
                                      </p>
                                    </div>
                                    <div className="flex gap-1">
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingCategory({ ...subCat, parentId: subCat.parentId || 'none', maintenanceFrequency: subCat.maintenanceFrequency || 'none' })}><Pencil className="w-3.5 h-3.5" /></Button>
                                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { if(window.confirm('Alt kategori silinsin mi?')) deleteCategoryMutation.mutate(subCat.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                    {categories?.filter((c: any) => !c.parentId).length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Henüz kategori eklenmemiş.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="locations">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 h-fit shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Yeni Lokasyon Ekle</CardTitle>
                <CardDescription>Ekipmanların yerleştirileceği alanlar.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Bina / Blok</Label>
                  <Input 
                    value={newLocation.building} 
                    onChange={e => setNewLocation({...newLocation, building: e.target.value})} 
                    placeholder="Örn: A Blok"
                    list="blocks-list"
                  />
                  <datalist id="blocks-list">
                    {Array.from(new Set(locations?.map((l:any) => l.building).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Kat</Label>
                  <Input 
                    value={newLocation.floor} 
                    onChange={e => setNewLocation({...newLocation, floor: e.target.value})} 
                    placeholder="Örn: 2. Kat" 
                    list="floors-list"
                  />
                  <datalist id="floors-list">
                    {Array.from(new Set(locations?.filter((l:any) => !newLocation.building || l.building === newLocation.building).map((l:any) => l.floor).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Birim</Label>
                  <Input 
                    value={newLocation.department || ''} 
                    onChange={e => setNewLocation({...newLocation, department: e.target.value})} 
                    placeholder="Örn: Acil Servis" 
                    list="depts-list"
                  />
                  <datalist id="depts-list">
                    {Array.from(new Set(locations?.filter((l:any) => (!newLocation.building || l.building === newLocation.building) && (!newLocation.floor || l.floor === newLocation.floor)).map((l:any) => l.department).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                  </datalist>
                </div>
                <div className="space-y-2">
                  <Label>Mahal</Label>
                  <Input 
                    value={newLocation.description} 
                    onChange={e => setNewLocation({...newLocation, description: e.target.value})} 
                    placeholder="Örn: Kirli Oda" 
                    list="desc-list"
                  />
                  <datalist id="desc-list">
                    {Array.from(new Set(locations?.filter((l:any) => (!newLocation.building || l.building === newLocation.building) && (!newLocation.floor || l.floor === newLocation.floor) && (!newLocation.department || l.department === newLocation.department)).map((l:any) => l.description).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                  </datalist>
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createLocationMutation.mutate(newLocation)}
                  disabled={!newLocation.building || createLocationMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Kayıtlı Lokasyonlar</CardTitle>
              </CardHeader>
              <CardContent>
                {isLocLoading ? <p>Yükleniyor...</p> : (
                  <div className="space-y-3">
                    {locations?.map((loc: any) => (
                      <div key={loc.id} className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {editingLocation?.id === loc.id ? (
                          <div className="space-y-3">
                            <div className="space-y-1">
                                  <Label className="text-xs">Blok</Label>
                                  <Input value={editingLocation.building} onChange={e => setEditingLocation({...editingLocation, building: e.target.value})} list="blocks-list-edit" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Kat</Label>
                                  <Input value={editingLocation.floor || ''} onChange={e => setEditingLocation({...editingLocation, floor: e.target.value})} list="floors-list-edit" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Birim</Label>
                                  <Input value={editingLocation.department || ''} onChange={e => setEditingLocation({...editingLocation, department: e.target.value})} list="depts-list-edit" />
                                </div>
                                <div className="space-y-1">
                                  <Label className="text-xs">Mahal</Label>
                                  <Input value={editingLocation.description || ''} onChange={e => setEditingLocation({...editingLocation, description: e.target.value})} list="desc-list-edit" />
                                </div>
                                
                                <datalist id="blocks-list-edit">
                                  {Array.from(new Set(locations?.map((l:any) => l.building).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                                </datalist>
                                <datalist id="floors-list-edit">
                                  {Array.from(new Set(locations?.map((l:any) => l.floor).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                                </datalist>
                                <datalist id="depts-list-edit">
                                  {Array.from(new Set(locations?.map((l:any) => l.department).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                                </datalist>
                                <datalist id="desc-list-edit">
                                  {Array.from(new Set(locations?.map((l:any) => l.description).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                                </datalist>
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateLocationMutation.mutate(editingLocation)}><Check className="w-4 h-4 mr-1" /> Kaydet</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingLocation(null)}>İptal</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-start">
                            <div>
                                  <p className="font-semibold">{loc.building} {loc.floor && <span className="text-muted-foreground font-normal">/ {loc.floor}</span>}</p>
                                  <p className="text-sm text-muted-foreground">{loc.department || '-'} {loc.description && `> ${loc.description}`}</p>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingLocation({ ...loc })}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => { if(window.confirm('Lokasyon silinsin mi?')) deleteLocationMutation.mutate(loc.id); }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {locations?.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Henüz lokasyon eklenmemiş.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="responsibles">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 h-fit shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Yeni Sorumlu Ekle</CardTitle>
                <CardDescription>Ekipmanlardan sorumlu personeli belirleyin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Sorumlu Adı / Unvanı</Label>
                  <Input 
                    value={newResponsible.name} 
                    onChange={e => setNewResponsible({...newResponsible, name: e.target.value})} 
                    placeholder="Örn: Ahmet Yılmaz" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Departmanı</Label>
                  <Input 
                    value={newResponsible.department} 
                    onChange={e => setNewResponsible({...newResponsible, department: e.target.value})} 
                    placeholder="Örn: İnsan Kaynakları" 
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createResponsibleMutation.mutate(newResponsible)}
                  disabled={!newResponsible.name || createResponsibleMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Kayıtlı Sorumlular</CardTitle>
              </CardHeader>
              <CardContent>
                {isRespLoading ? <p>Yükleniyor...</p> : (
                  <div className="space-y-3">
                    {responsibles?.map((resp: any) => (
                      <div key={resp.id} className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {editingResponsible?.id === resp.id ? (
                          <div className="space-y-3">
                            <Input value={editingResponsible.name} onChange={e => setEditingResponsible({...editingResponsible, name: e.target.value})} placeholder="Adı Soyadı" />
                            <Input value={editingResponsible.department || ''} onChange={e => setEditingResponsible({...editingResponsible, department: e.target.value})} placeholder="Departman" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateResponsibleMutation.mutate(editingResponsible)}><Check className="w-4 h-4 mr-1" /> Kaydet</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingResponsible(null)}>İptal</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <Users className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{resp.name}</p>
                                {resp.department && <p className="text-xs text-muted-foreground">{resp.department}</p>}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingResponsible({ ...resp })}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => { if(window.confirm('Bu sorumlu silinsin mi?')) deleteResponsibleMutation.mutate(resp.id); }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {responsibles?.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Henüz sorumlu eklenmemiş.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="companies">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-1 h-fit shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Yeni Firma Ekle</CardTitle>
                <CardDescription>Bakım ve dolum yapan firmaları ekleyin.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Firma Adı</Label>
                  <Input 
                    value={newCompany.name} 
                    onChange={e => setNewCompany({...newCompany, name: e.target.value})} 
                    placeholder="Örn: XYZ Yangın A.Ş." 
                  />
                </div>
                <Button 
                  className="w-full" 
                  onClick={() => createCompanyMutation.mutate(newCompany)}
                  disabled={!newCompany.name || createCompanyMutation.isPending}
                >
                  <Plus className="w-4 h-4 mr-2" /> Ekle
                </Button>
              </CardContent>
            </Card>

            <Card className="md:col-span-2 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Kayıtlı Firmalar</CardTitle>
              </CardHeader>
              <CardContent>
                {isCompLoading ? <p>Yükleniyor...</p> : (
                  <div className="space-y-3">
                    {companies?.map((comp: any) => (
                      <div key={comp.id} className="p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        {editingCompany?.id === comp.id ? (
                          <div className="space-y-3">
                            <Input value={editingCompany.name} onChange={e => setEditingCompany({...editingCompany, name: e.target.value})} placeholder="Firma Adı" />
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => updateCompanyMutation.mutate(editingCompany)}><Check className="w-4 h-4 mr-1" /> Kaydet</Button>
                              <Button size="sm" variant="ghost" onClick={() => setEditingCompany(null)}>İptal</Button>
                            </div>
                          </div>
                        ) : (
                          <div className="flex justify-between items-center">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                <Briefcase className="w-4 h-4 text-slate-500" />
                              </div>
                              <div>
                                <p className="font-semibold text-sm">{comp.name}</p>
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingCompany({ ...comp })}><Pencil className="w-4 h-4" /></Button>
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500" onClick={() => { if(window.confirm('Bu firma silinsin mi?')) deleteCompanyMutation.mutate(comp.id); }}><Trash2 className="w-4 h-4" /></Button>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                    {companies?.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Henüz firma eklenmemiş.</p>}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
