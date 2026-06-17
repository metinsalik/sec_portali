import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Flame, ArrowLeft, Save } from 'lucide-react';

export default function FireEquipmentFormPage() {
  const { id } = useParams();
  const isEdit = !!id;
  const facilityId = localStorage.getItem('activeFacilityId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [formData, setFormData] = useState<any>({
    equipmentNo: '',
    qrCode: '',
    serialNo: '',
    brand: '',
    model: '',
    productionYear: '',
    categoryId: '',
    subcategoryId: 'none',
    locationId: '',
    capacity: '',
    standard: '',
    criticality: 'Orta',
    responsibleId: 'none',
    responsibleUnit: '',
    status: 'AKTIF'
  });

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

  useQuery({
    queryKey: ['fire-equipment', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/fire-equipment/equipment/detail/${id}`);
      const data = await res.json();
      
      let catId = data.categoryId;
      let subCatId = 'none';
      if (data.category?.parentId) {
        catId = data.category.parentId;
        subCatId = data.category.id;
      }

      setFormData({
        ...data,
        categoryId: catId,
        subcategoryId: subCatId,
        responsibleId: data.responsibleId || 'none',
        productionYear: data.productionYear?.toString() || ''
      });
      return data;
    },
    enabled: isEdit
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data };
      if (payload.subcategoryId !== 'none') {
        payload.categoryId = payload.subcategoryId;
      }
      if (payload.responsibleId === 'none') {
        payload.responsibleId = null;
      }
      if (!payload.qrCode || payload.qrCode.trim() === '') {
        payload.qrCode = null;
      }

      if (isEdit) {
        return api.put(`/fire-equipment/equipment/${id}`, payload);
      } else {
        return api.post(`/fire-equipment/equipment/${facilityId}`, payload);
      }
    },
    onSuccess: () => {
      toast.success(`Ekipman başarıyla ${isEdit ? 'güncellendi' : 'oluşturuldu'}.`);
      queryClient.invalidateQueries({ queryKey: ['fire-equipment', facilityId] });
      navigate('/fire-equipment/list');
    },
    onError: (error: any) => {
      toast.error('İşlem sırasında bir hata oluştu: ' + error.message);
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

  const parentCategories = categories?.filter((c: any) => !c.parentId) || [];
  const activeSubcategories = formData.categoryId 
    ? categories?.find((c: any) => c.id === formData.categoryId)?.subcategories || []
    : [];

  const uniqueDepartments = Array.from(new Set(responsibles?.map((r: any) => r.department).filter(Boolean))) as string[];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.equipmentNo || !formData.categoryId) {
      toast.error('Ekipman No ve Kategori zorunludur.');
      return;
    }
    mutation.mutate(formData);
  };

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
                <Input id="qrCode" name="qrCode" value={formData.qrCode || ''} onChange={handleChange} placeholder="Sisteme okutun..." />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
                <Label>Sorumlu Kişi</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.responsibleId} 
                  onChange={(e) => handleSelectChange('responsibleId', e.target.value)}
                >
                  <option value="none">Seçilmedi</option>
                  {responsibles?.map((resp: any) => (
                    <option key={resp.id} value={resp.id}>
                      {resp.department ? `${resp.department} - ` : ''}{resp.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Durum *</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
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
              <div className="space-y-2">
                <Label>Lokasyon (İlk Kayıt)</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.locationId || ''} 
                  onChange={(e) => handleSelectChange('locationId', e.target.value)} 
                  disabled={isEdit}
                >
                  <option value="" disabled>Seçiniz...</option>
                  {locations?.map((loc: any) => (
                    <option key={loc.id} value={loc.id}>{loc.building} - {loc.floor} ({loc.description})</option>
                  ))}
                </select>
                {isEdit && <p className="text-xs text-muted-foreground">Lokasyon değiştirmek için hareket geçmişini kullanın.</p>}
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
                <Label htmlFor="productionYear">Üretim Yılı</Label>
                <Input id="productionYear" name="productionYear" type="number" value={formData.productionYear || ''} onChange={handleChange} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="capacity">Kapasite (Örn: 6kg)</Label>
                <Input id="capacity" name="capacity" value={formData.capacity || ''} onChange={handleChange} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="responsibleUnit">Sorumlu Birim</Label>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.responsibleUnit || ''} 
                  onChange={(e) => handleChange(e as any)}
                  name="responsibleUnit"
                  id="responsibleUnit"
                >
                  <option value="">Seçiniz...</option>
                  {uniqueDepartments.map(dept => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
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
