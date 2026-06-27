import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Flame, ArrowLeft, Save, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useAuth } from '@/context/AuthContext';
import { ExcelBulkImportModal } from './components/ExcelBulkImportModal';

export default function FireEquipmentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const facilityId = localStorage.getItem('activeFacilityId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [formData, setFormData] = useState<any>({
    equipmentNo: '',
    qrCode: '',
    serialNo: '',
    brand: '',
    productionDate: '',
    lastMaintenanceDate: '',
    categoryId: '',
    subcategoryId: 'none',
    locationId: '',
    capacity: '',
    standard: '',
    criticality: 'Orta',
    companyId: 'none',
    responsibleUnit: '',
    status: 'AKTIF'
  });

  const locationHook = useLocation();
  const searchParams = new URLSearchParams(locationHook.search);
  const cloneId = searchParams.get('cloneId');

  const [inventoryData, setInventoryData] = useState<any>({});
  const [newCompanyName, setNewCompanyName] = useState('');
  const [isCompanyDialogOpen, setIsCompanyDialogOpen] = useState(false);

  // Cascaded Location Filters
  const [locBlock, setLocBlock] = useState('all');
  const [locFloor, setLocFloor] = useState('all');
  const [locDepartment, setLocDepartment] = useState('all');

  const { data: categories } = useQuery({
    queryKey: ['fire-categories'],
    queryFn: async () => {
      const res = await api.get('/fire-equipment/categories');
      return res.json();
    }
  });

  const { data: locations } = useQuery({
    queryKey: ['fire-locations', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/locations/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: responsibles } = useQuery({
    queryKey: ['fire-responsibles', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/responsibles/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: companies } = useQuery({
    queryKey: ['fire-companies', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/companies/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: equipmentData, isSuccess } = useQuery({
    queryKey: ['fire-equipment', id || cloneId],
    queryFn: async () => {
      const fetchId = id || cloneId;
      if (!fetchId) return null;
      const res = await api.get(`/fire-equipment/equipment/detail/${fetchId}`);
      return res.json();
    },
    enabled: isEdit || !!cloneId
  });

  useEffect(() => {
    if (isSuccess && equipmentData) {
      const data = equipmentData;
      let catId = data.categoryId;
      let subCatId = 'none';
      if (data.category?.parentId) {
        catId = data.category.parentId;
        subCatId = data.category.id;
      }

      const prodDate = data.productionDate ? new Date(data.productionDate).toISOString().slice(0, 7) : '';

      if (cloneId) {
        setFormData({
          ...data,
          equipmentNo: '',
          qrCode: '',
          locationId: '',
          categoryId: catId,
          subcategoryId: subCatId,
          companyId: data.companyId || 'none',
          responsibleUnit: data.responsibleUnit || '',
          productionDate: prodDate,
          id: undefined // Don't copy id
        });
      } else {
        setFormData({
          ...data,
          categoryId: catId,
          subcategoryId: subCatId,
          companyId: data.companyId || 'none',
          responsibleUnit: data.responsibleUnit || '',
          productionDate: prodDate,
          lastMaintenanceDate: data.inventoryData?.lastMaintenanceDate ? new Date(data.inventoryData.lastMaintenanceDate).toISOString().slice(0, 7) : ''
        });
      }

      if (data.inventoryData) {
        setInventoryData(data.inventoryData);
      }
    }
  }, [equipmentData, isSuccess, cloneId]);

  useEffect(() => {
    if (equipmentData && equipmentData.locationId && locations?.length) {
      const loc = locations.find((l: any) => l.id === equipmentData.locationId);
      if (loc) {
        setLocBlock(loc.building || 'all');
        setLocFloor(loc.floor || 'all');
        setLocDepartment(loc.department || 'all');
      }
    }
  }, [equipmentData, locations]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, inventoryData };
      if (payload.subcategoryId !== 'none') {
        payload.categoryId = payload.subcategoryId;
      }
      if (payload.companyId === 'none') {
        payload.companyId = null;
      }
      if (!payload.qrCode || payload.qrCode.trim() === '') {
        payload.qrCode = null;
      }

      let res;
      if (isEdit) {
        res = await api.put(`/fire-equipment/equipment/${id}`, payload);
      } else {
        res = await api.post(`/fire-equipment/equipment/${facilityId}`, payload);
      }
      
      if (!res.ok) {
        let errStr = 'İşlem başarısız.';
        try { const errData = await res.json(); errStr = errData.error || errStr; } catch(e){}
        throw new Error(errStr);
      }
      return res.json();
    },
    onSuccess: async () => {
      toast.success(isEdit ? 'Ekipman güncellendi.' : 'Ekipman başarıyla eklendi.');
      await queryClient.invalidateQueries({ queryKey: ['fire-equipment'] });
      await queryClient.invalidateQueries({ queryKey: ['fire-equipment', facilityId] });
      navigate('/fire-equipment/list');
    },
    onError: (error: any) => {
      toast.error('İşlem sırasında bir hata oluştu: ' + error.message);
    }
  });

  const createCompanyMutation = useMutation({
    mutationFn: async () => {
      return api.post(`/fire-equipment/companies/${facilityId}`, { name: newCompanyName });
    },
    onSuccess: (res: any) => {
      toast.success('Firma başarıyla eklendi.');
      queryClient.invalidateQueries({ queryKey: ['fire-companies', facilityId] });
      setIsCompanyDialogOpen(false);
      setNewCompanyName('');
      res.json().then(data => {
        setFormData(prev => ({ ...prev, companyId: data.id }));
      });
    }
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSelectChange = (name: string, value: string) => {
    if (name === 'categoryId') {
      setFormData({ ...formData, categoryId: value, subcategoryId: 'none' });
    } else {
      setFormData({ ...formData, [name]: value });
    }
  };

  const handleInventoryDataChange = (name: string, value: string) => {
    setInventoryData(prev => ({ ...prev, [name]: value }));
  };

  const parentCategories = categories?.filter((c: any) => !c.parentId) || [];
  const activeSubcategories = formData.categoryId 
    ? categories?.find((c: any) => c.id === formData.categoryId)?.subcategories || []
    : [];

  const uniqueDepartments = Array.from(new Set(responsibles?.map((r: any) => r.department).filter(Boolean))) as string[];

  const activeCategoryData = formData.subcategoryId !== 'none'
    ? activeSubcategories.find((s: any) => s.id === formData.subcategoryId)
    : categories?.find((c: any) => c.id === formData.categoryId);

  const inventoryParams = activeCategoryData?.inventoryParameters || [];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentNo || !formData.categoryId) {
      toast.error('Ekipman No ve Kategori zorunludur.');
      return;
    }
    mutation.mutate(formData);
  };

  const updateLocationIdFromFilters = (block: string, floor: string, dept: string) => {
    const exactMatch = locations?.find((l: any) => 
      (block === 'all' ? !l.building : l.building === block) &&
      (floor === 'all' ? !l.floor : l.floor === floor) &&
      (dept === 'all' ? !l.department : l.department === dept) &&
      !l.description
    );
    if (exactMatch) {
      handleSelectChange('locationId', exactMatch.id);
    } else {
      handleSelectChange('locationId', '');
    }
  };

  const handleBlockChange = (val: string) => {
    setLocBlock(val); setLocFloor('all'); setLocDepartment('all');
    updateLocationIdFromFilters(val, 'all', 'all');
  };

  const handleFloorChange = (val: string) => {
    setLocFloor(val); setLocDepartment('all');
    updateLocationIdFromFilters(locBlock, val, 'all');
  };

  const handleDepartmentChange = (val: string) => {
    setLocDepartment(val);
    updateLocationIdFromFilters(locBlock, locFloor, val);
  };

  const getFilteredLocations = () => {
    return locations?.filter((l: any) => {
      let match = true;
      if (locBlock !== 'all') match = match && l.building === locBlock;
      if (locFloor !== 'all') match = match && l.floor === locFloor;
      if (locDepartment !== 'all') match = match && l.department === locDepartment;
      return match;
    }) || [];
  };

  const blocks = Array.from(new Set(locations?.map((l: any) => l.building).filter(Boolean))).sort();
  const floors = Array.from(new Set(locations?.filter((l:any) => locBlock === 'all' || l.building === locBlock).map((l: any) => l.floor).filter(Boolean))).sort();
  const departments = Array.from(new Set(locations?.filter((l:any) => (locBlock === 'all' || l.building === locBlock) && (locFloor === 'all' || l.floor === locFloor)).map((l: any) => l.department).filter(Boolean))).sort();

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Flame className="w-6 h-6 text-red-500" /> 
            {isEdit ? 'Ekipman Düzenle' : 'Yeni Yangın Ekipmanı Ekle'}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">Ekipmanın kimlik, teknik ve lokasyon bilgilerini girin.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm border-border">
          <CardHeader>
            <CardTitle className="text-lg">Ekipman Bilgileri</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="equipmentNo">Ekipman No *</Label>
                <Input id="equipmentNo" name="equipmentNo" value={formData.equipmentNo} onChange={handleChange} placeholder="Örn: YT-001" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="qrCode">Barkod / QR Kod</Label>
                <Input id="qrCode" name="qrCode" value={formData.qrCode || ''} onChange={handleChange} placeholder="Boş bırakılırsa otomatik üretilir" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Kategori *</Label>
                  {categories?.find((c: any) => c.id === formData.categoryId)?.name === 'Yangın Tüpü' && user?.isManagement && facilityId && (
                    <ExcelBulkImportModal facilityId={facilityId} />
                  )}
                </div>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.categoryId || ''} 
                  onChange={(e) => handleSelectChange('categoryId', e.target.value)} 
                  required
                >
                  <option value="" disabled>Seçiniz...</option>
                  {parentCategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Alt Kategori</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.subcategoryId} 
                  onChange={(e) => handleSelectChange('subcategoryId', e.target.value)} 
                  disabled={!formData.categoryId || activeSubcategories.length === 0}
                >
                  <option value="none">Seçilmedi</option>
                  {activeSubcategories.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-2">
                <Label>Sorumlu Departman</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.responsibleUnit || ''} 
                  onChange={(e) => handleSelectChange('responsibleUnit', e.target.value)}
                >
                  <option value="">Seçilmedi</option>
                  {uniqueDepartments.map((dep, idx) => (
                    <option key={idx} value={dep}>{dep}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dinamik Envanter Parametreleri */}
            {inventoryParams.length > 0 && (
              <div className="p-4 bg-muted/30 rounded-lg space-y-4 border">
                <h3 className="font-semibold text-sm">Kategori Özellikleri</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {inventoryParams.map((param: any, idx: number) => (
                    <div key={idx} className="space-y-2">
                      <Label>{param.name}</Label>
                      {param.type === 'text' || param.type === 'textarea' || !param.options || param.options.length === 0 ? (
                        <Textarea
                          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background min-h-[40px]"
                          value={inventoryData[param.name] || ''}
                          onChange={(e) => handleInventoryDataChange(param.name, e.target.value)}
                        />
                      ) : (
                        <select
                          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                          value={inventoryData[param.name] || ''}
                          onChange={(e) => handleInventoryDataChange(param.name, e.target.value)}
                        >
                          <option value="">Seçiniz...</option>
                          {param.options.map((opt: string, oidx: number) => (
                            <option key={oidx} value={opt}>{opt}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Firma</Label>
                <div className="flex gap-2">
                  <select 
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                    value={formData.companyId} 
                    onChange={(e) => handleSelectChange('companyId', e.target.value)}
                  >
                    <option value="none">Seçilmedi</option>
                    {companies?.map((comp: any) => (
                      <option key={comp.id} value={comp.id}>{comp.name}</option>
                    ))}
                  </select>
                  <Dialog open={isCompanyDialogOpen} onOpenChange={setIsCompanyDialogOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="icon" type="button"><Plus className="w-4 h-4" /></Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                      <DialogHeader>
                        <DialogTitle>Yeni Firma Ekle</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4 pt-4">
                        <div className="space-y-2">
                          <Label>Firma Adı</Label>
                          <Input value={newCompanyName} onChange={(e) => setNewCompanyName(e.target.value)} placeholder="Örn: X Yangın Söndürme" />
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => createCompanyMutation.mutate()} 
                          disabled={!newCompanyName || createCompanyMutation.isPending}
                        >
                          Kaydet
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Durum *</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.status} 
                  onChange={(e) => handleSelectChange('status', e.target.value)} 
                  required
                >
                  <option value="AKTIF">Aktif</option>
                  <option value="DEGISIME_GIDEN">Değişime Giden</option>
                  <option value="ARIZALI">Arızalı</option>
                  <option value="HURDA">Hurdaya Çıkan</option>
                  <option value="KULLANIM_DISI">Kullanım Dışı</option>
                  <option value="DEPODA">Depoda</option>
                </select>
              </div>
              <div className="md:col-span-3 border rounded-lg p-4 bg-slate-50 dark:bg-slate-900/50 space-y-4">
                <Label className="text-muted-foreground font-medium">Lokasyon Seçimi</Label>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="space-y-1">
                    <Label className="text-xs">Blok Filtresi</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm" value={locBlock} onChange={e => handleBlockChange(e.target.value)}>
                      <option value="all">Seçiniz...</option>
                      {blocks.map((b: any) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kat Filtresi</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50" disabled={floors.length === 0} value={locFloor} onChange={e => handleFloorChange(e.target.value)}>
                      <option value="all">Seçiniz...</option>
                      {floors.map((f: any) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Birim Filtresi</Label>
                    <select className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50" disabled={departments.length === 0} value={locDepartment} onChange={e => handleDepartmentChange(e.target.value)}>
                      <option value="all">Seçiniz...</option>
                      {departments.map((d: any) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Detaylı Mahal Seçimi</Label>
                    <select 
                      className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50 ring-2 ring-red-500/20"
                      value={formData.locationId || ''} 
                      onChange={(e) => handleSelectChange('locationId', e.target.value)} 
                    >
                      <option value="" disabled>Seçiniz...</option>
                      {getFilteredLocations().map((loc: any) => (
                        <option key={loc.id} value={loc.id}>{`${loc.building}${loc.floor ? ` / ${loc.floor}` : ''}${loc.department ? ` - ${loc.department}` : ''}${loc.description ? ` > ${loc.description}` : ''}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="brand">Marka</Label>
                <Input id="brand" name="brand" value={formData.brand || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model">Model</Label>
                <Input id="model" name="model" value={formData.model || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="productionDate">İmal Tarihi</Label>
                <Input type="month" id="productionDate" name="productionDate" value={formData.productionDate} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastMaintenanceDate">Son Bakım Tarihi <span className="text-muted-foreground text-xs font-normal">(İlk kayıt için)</span></Label>
                <Input type="month" id="lastMaintenanceDate" name="lastMaintenanceDate" value={formData.lastMaintenanceDate || ''} onChange={handleChange} />
                <p className="text-[10px] text-muted-foreground">Girilirse sonraki bakım otomatik hesaplanır.</p>
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>İptal</Button>
              <Button type="submit" disabled={mutation.isPending} className="bg-red-600 hover:bg-red-700 text-white border-0">
                <Save className="w-4 h-4 mr-2" /> Kaydet
              </Button>
            </div>

          </CardContent>
        </Card>
      </form>
    </div>
  );
}
