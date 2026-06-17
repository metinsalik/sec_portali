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
    locationId: '',
    capacity: '',
    standard: '',
    criticality: 'Orta',
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

  useQuery({
    queryKey: ['fire-equipment', id],
    queryFn: async () => {
      if (!id) return null;
      const res = await api.get(`/fire-equipment/equipment/detail/${id}`);
      const data = await res.json();
      setFormData({
        ...data,
        productionYear: data.productionYear?.toString() || ''
      });
      return data;
    },
    enabled: isEdit
  });

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      if (isEdit) {
        return api.put(`/fire-equipment/equipment/${id}`, data);
      } else {
        return api.post(`/fire-equipment/equipment/${facilityId}`, data);
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
    setFormData({ ...formData, [name]: value });
  };

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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Kategori *</Label>
                <Select value={formData.categoryId || ''} onValueChange={(val) => handleSelectChange('categoryId', val)} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat: any) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Lokasyon (İlk Kayıt)</Label>
                <Select value={formData.locationId || ''} onValueChange={(val) => handleSelectChange('locationId', val)} disabled={isEdit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Seçiniz..." />
                  </SelectTrigger>
                  <SelectContent>
                    {locations?.map((loc: any) => (
                      <SelectItem key={loc.id} value={loc.id}>{loc.building} - {loc.floor} ({loc.description})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                <Input id="responsibleUnit" name="responsibleUnit" value={formData.responsibleUnit || ''} onChange={handleChange} />
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
