import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2, Save, Building2, MapPin, Phone, Mail, Globe, Briefcase, Info, Trash2, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { IL_ILCE_DATA } from '@/data/turkiye';
import type { City } from '@/data/turkiye';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

interface BuildingBlock {
  name: string;
  constructionYear: string;
  buildingHeight: string;
  structureHeight: string;
  buildingFloors: string;
  structureFloors: string;
  closedArea: string;
  parkingArea: string;
  gardenArea: string;
  bedCapacity: string;
}

interface Facility {
  id: string;
  name: string;
  shortName: string;
  type: string;
  city: string;
  district: string;
  fullAddress: string;
  phone: string;
  email: string;
  website: string;
  commercialTitle: string;
  taxOffice: string;
  taxNumber: string;
  sgkNumber: string;
  naceCode: string;
  dangerClass: string;
  employeeCount: number;
  isActive: boolean;
  buildings: any[];
}

const FACILITY_TYPES = [
  "Hastane", "Ofis", "Depo", "Tıp Merkezi", "Diyaliz Merkezi", "Çağrı Merkezi", "Konuk Evi", "Şantiye"
];

const DANGER_CLASSES = [
  "Az Tehlikeli", "Tehlikeli", "Çok Tehlikeli"
];

export default function OperationsFacilityPage() {
  const queryClient = useQueryClient();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string | null>(null);

  const { data: facilities, isLoading: isLoadingList } = useQuery<Facility[]>({
    queryKey: ['operations-facilities'],
    queryFn: async () => {
      const res = await api.get('/operations/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    }
  });

  useEffect(() => {
    if (facilities && facilities.length === 1) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities]);

  const { data: facility, isLoading: isLoadingDetail } = useQuery<Facility>({
    queryKey: ['operations-facility', selectedFacilityId],
    queryFn: async () => {
      const res = await api.get(`/operations/facilities/${selectedFacilityId}`);
      if (!res.ok) throw new Error('Tesis detayı yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacilityId
  });

  const initialBuilding: BuildingBlock = {
    name: 'Ana Blok',
    constructionYear: '',
    buildingHeight: '',
    structureHeight: '',
    buildingFloors: '',
    structureFloors: '',
    closedArea: '',
    parkingArea: '',
    gardenArea: '',
    bedCapacity: ''
  };

  const [formData, setFormData] = useState<any>(null);

  useEffect(() => {
    if (facility) {
      setFormData({
        ...facility,
        city: facility.city as City,
        employeeCount: facility.employeeCount.toString(),
        buildings: facility.buildings.length > 0 ? facility.buildings.map(b => ({
          ...b,
          constructionYear: b.constructionYear?.toString() || '',
          buildingHeight: b.buildingHeight?.toString() || '',
          structureHeight: b.structureHeight?.toString() || '',
          buildingFloors: b.buildingFloors?.toString() || '',
          structureFloors: b.structureFloors?.toString() || '',
          closedArea: b.closedArea?.toString() || '',
          parkingArea: b.parkingArea?.toString() || '',
          gardenArea: b.gardenArea?.toString() || '',
          bedCapacity: b.bedCapacity?.toString() || ''
        })) : [initialBuilding]
      });
    }
  }, [facility]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/operations/facilities/${data.id}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operations-facility', selectedFacilityId] });
      toast.success('Tesis bilgileri başarıyla güncellendi');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const addBuilding = () => {
    setFormData((prev: any) => ({
      ...prev,
      buildings: [...prev.buildings, { ...initialBuilding, name: `Blok ${prev.buildings.length + 1}` }]
    }));
  };

  const removeBuilding = (index: number) => {
    if (formData.buildings.length <= 1) return;
    setFormData((prev: any) => ({
      ...prev,
      buildings: prev.buildings.filter((_: any, i: number) => i !== index)
    }));
  };

  const updateBuilding = (index: number, field: keyof BuildingBlock, value: string) => {
    const newBuildings = [...formData.buildings];
    newBuildings[index] = { ...newBuildings[index], [field]: value };
    setFormData((prev: any) => ({ ...prev, buildings: newBuildings }));
  };

  if (isLoadingList) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!facilities || facilities.length === 0) {
    return (
      <Card className="bg-muted/50 border-dashed border-2">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Building2 className="w-12 h-12 text-muted-foreground/30 mb-4" />
          <p className="text-xl font-bold text-muted-foreground/50">Atanmış Tesis Bulunamadı</p>
          <p className="text-sm text-muted-foreground">Herhangi bir tesise atamanız bulunmuyor. Lütfen yönetici ile iletişime geçin.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Tesis Bilgileri</h1>
          <p className="text-slate-500 text-sm mt-1">Sorumlu olduğunuz tesisin bilgilerini güncelleyin.</p>
        </div>

        {facilities.length > 1 && (
          <div className="w-full md:w-64">
            <Select value={selectedFacilityId || ''} onValueChange={setSelectedFacilityId}>
              <SelectTrigger className="bg-white dark:bg-slate-900 h-11 rounded-xl shadow-sm border-slate-200">
                <SelectValue placeholder="Tesis Seçin" />
              </SelectTrigger>
              <SelectContent>
                {facilities.map(f => (
                  <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {isLoadingDetail ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : formData ? (
        <form onSubmit={handleSubmit} className="space-y-6 pb-20">
          <Card className="border-none shadow-xl shadow-slate-200/50 dark:shadow-none overflow-hidden rounded-3xl">
            <Tabs defaultValue="genel" className="w-full">
              <div className="px-6 py-4 border-b bg-slate-50 dark:bg-slate-900/50">
                <TabsList className="bg-white dark:bg-slate-800 p-1 rounded-2xl gap-1 w-full flex overflow-x-auto no-scrollbar">
                  <TabsTrigger value="genel" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium">Genel</TabsTrigger>
                  <TabsTrigger value="lokasyon" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium">Lokasyon</TabsTrigger>
                  <TabsTrigger value="kurumsal" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium">Kurumsal</TabsTrigger>
                  <TabsTrigger value="fiziksel" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium">Fiziksel</TabsTrigger>
                </TabsList>
              </div>

              <div className="p-8">
                <TabsContent value="genel" className="mt-0 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Info className="w-5 h-5 text-primary" />
                    <h3 className="font-bold">Temel Bilgiler</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Tesis Tipi</label>
                      <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Tesis Kodu</label>
                      <Input 
                        value={formData.id} 
                        disabled 
                        className="h-12 rounded-xl border-slate-200 bg-slate-100 font-mono font-medium text-primary" 
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Tesis Adı</label>
                      <Input 
                        value={formData.name} 
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        required
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Kısa Ad</label>
                      <Input 
                        value={formData.shortName} 
                        onChange={e => setFormData({...formData, shortName: e.target.value})}
                        required
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Tehlike Sınıfı</label>
                      <Select value={formData.dangerClass} onValueChange={(v) => setFormData({...formData, dangerClass: v})}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="Seçiniz" />
                        </SelectTrigger>
                        <SelectContent>
                          {DANGER_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Çalışan Sayısı</label>
                      <Input 
                        type="number"
                        value={formData.employeeCount} 
                        onChange={e => setFormData({...formData, employeeCount: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="lokasyon" className="mt-0 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <MapPin className="w-5 h-5 text-primary" />
                    <h3 className="font-bold">Lokasyon & İletişim</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Şehir</label>
                      <Select value={formData.city} onValueChange={(v) => setFormData({...formData, city: v as City, district: ''})}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="Şehir seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.keys(IL_ILCE_DATA).map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">İlçe</label>
                      <Select value={formData.district} onValueChange={(v) => setFormData({...formData, district: v})} disabled={!formData.city}>
                        <SelectTrigger className="h-12 rounded-xl border-slate-200 bg-slate-50/50">
                          <SelectValue placeholder="İlçe seçin" />
                        </SelectTrigger>
                        <SelectContent>
                          {formData.city && (IL_ILCE_DATA[formData.city as City] as readonly string[]).map(dist => (
                            <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Tam Adres</label>
                      <Input 
                        value={formData.fullAddress} 
                        onChange={e => setFormData({...formData, fullAddress: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <Phone className="w-4 h-4" /> Telefon
                      </label>
                      <Input 
                        value={formData.phone} 
                        onChange={e => setFormData({...formData, phone: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <Mail className="w-4 h-4" /> E-posta
                      </label>
                      <Input 
                        type="email"
                        value={formData.email} 
                        onChange={e => setFormData({...formData, email: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase flex items-center gap-2">
                        <Globe className="w-4 h-4" /> Web Sitesi
                      </label>
                      <Input 
                        value={formData.website} 
                        onChange={e => setFormData({...formData, website: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="kurumsal" className="mt-0 space-y-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Briefcase className="w-5 h-5 text-primary" />
                    <h3 className="font-bold">Kurumsal Bilgiler</h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2 col-span-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Ticari Unvan</label>
                      <Input 
                        value={formData.commercialTitle} 
                        onChange={e => setFormData({...formData, commercialTitle: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Vergi Dairesi</label>
                      <Input 
                        value={formData.taxOffice} 
                        onChange={e => setFormData({...formData, taxOffice: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">Vergi Numarası</label>
                      <Input 
                        value={formData.taxNumber} 
                        onChange={e => setFormData({...formData, taxNumber: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">SGK Sicil Numarası</label>
                      <Input 
                        value={formData.sgkNumber} 
                        onChange={e => setFormData({...formData, sgkNumber: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-semibold text-muted-foreground uppercase">NACE Kodu</label>
                      <Input 
                        value={formData.naceCode} 
                        onChange={e => setFormData({...formData, naceCode: e.target.value})}
                        className="h-12 rounded-xl border-slate-200"
                      />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="fiziksel" className="mt-0 space-y-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-primary" />
                      <h3 className="font-bold">Fiziksel Özellikler (Binalar)</h3>
                    </div>
                    <Button type="button" size="sm" variant="outline" onClick={addBuilding} className="rounded-xl border-primary text-primary hover:bg-primary/5">
                      <Plus className="w-4 h-4 mr-2" /> Bina/Blok Ekle
                    </Button>
                  </div>
                  
                  <div className="space-y-4">
                    {formData.buildings.map((building: any, index: number) => (
                      <Card key={index} className="bg-slate-50/50 dark:bg-slate-900/50 border-slate-100 dark:border-slate-800 rounded-2xl overflow-hidden relative">
                        <div className="absolute top-4 right-4">
                           <Button type="button" variant="ghost" size="icon" onClick={() => removeBuilding(index)} className="text-rose-500 hover:bg-rose-50 rounded-full h-8 w-8">
                             <Trash2 className="w-4 h-4" />
                           </Button>
                        </div>
                        <CardContent className="p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="space-y-1 col-span-1 md:col-span-2">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Blok/Bina Adı</label>
                              <Input 
                                value={building.name} 
                                onChange={e => updateBuilding(index, 'name', e.target.value)}
                                className="h-10 rounded-xl bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yapım Yılı</label>
                              <Input 
                                type="number"
                                value={building.constructionYear} 
                                onChange={e => updateBuilding(index, 'constructionYear', e.target.value)}
                                className="h-10 rounded-xl bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Yatak Kapasitesi</label>
                              <Input 
                                type="number"
                                value={building.bedCapacity} 
                                onChange={e => updateBuilding(index, 'bedCapacity', e.target.value)}
                                className="h-10 rounded-xl bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kapalı Alan (m²)</label>
                              <Input 
                                type="number"
                                value={building.closedArea} 
                                onChange={e => updateBuilding(index, 'closedArea', e.target.value)}
                                className="h-10 rounded-xl bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Otopark Alanı (m²)</label>
                              <Input 
                                type="number"
                                value={building.parkingArea} 
                                onChange={e => updateBuilding(index, 'parkingArea', e.target.value)}
                                className="h-10 rounded-xl bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Bahçe Alanı (m²)</label>
                              <Input 
                                type="number"
                                value={building.gardenArea} 
                                onChange={e => updateBuilding(index, 'gardenArea', e.target.value)}
                                className="h-10 rounded-xl bg-white dark:bg-slate-800"
                              />
                            </div>
                            <div className="space-y-1">
                              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Kat Sayısı</label>
                              <Input 
                                type="number"
                                value={building.buildingFloors} 
                                onChange={e => updateBuilding(index, 'buildingFloors', e.target.value)}
                                className="h-10 rounded-xl bg-white dark:bg-slate-800"
                              />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </Card>

          <div className="fixed bottom-8 right-8 z-50">
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="h-14 rounded-2xl px-10 bg-primary hover:bg-primary/90 text-white shadow-2xl shadow-primary/40 font-bold transition-all hover:scale-105 active:scale-95 gap-2"
            >
              {updateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Değişiklikleri Kaydet
            </Button>
          </div>
        </form>
      ) : null}
    </div>
  );
}
