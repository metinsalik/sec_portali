import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Settings, FolderTree, MapPin, Plus, Trash2 } from 'lucide-react';

export default function FireEquipmentSettingsPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();

  const [newCategory, setNewCategory] = useState({ name: '', description: '' });
  const [newLocation, setNewLocation] = useState({ building: '', floor: '', description: '' });

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
      return api.post('/fire-equipment/categories', data);
    },
    onSuccess: () => {
      toast.success('Kategori eklendi.');
      setNewCategory({ name: '', description: '' });
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
        <TabsList className="mb-4">
          <TabsTrigger value="categories" className="flex items-center gap-2"><FolderTree className="w-4 h-4" /> Kategoriler</TabsTrigger>
          <TabsTrigger value="locations" className="flex items-center gap-2"><MapPin className="w-4 h-4" /> Lokasyonlar</TabsTrigger>
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
                  <div className="space-y-3">
                    {categories?.map((cat: any) => (
                      <div key={cat.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <p className="font-semibold text-sm">{cat.name}</p>
                          <p className="text-xs text-muted-foreground">{cat.description || 'Açıklama yok'}</p>
                        </div>
                        {/* Status/Actions placeholder */}
                      </div>
                    ))}
                    {categories?.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Henüz kategori eklenmemiş.</p>}
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
                  />
                </div>
                <div className="space-y-2">
                  <Label>Kat</Label>
                  <Input 
                    value={newLocation.floor} 
                    onChange={e => setNewLocation({...newLocation, floor: e.target.value})} 
                    placeholder="Örn: 2. Kat" 
                  />
                </div>
                <div className="space-y-2">
                  <Label>Açıklama / Detay</Label>
                  <Input 
                    value={newLocation.description} 
                    onChange={e => setNewLocation({...newLocation, description: e.target.value})} 
                    placeholder="Örn: Acil çıkış kapısı yanı" 
                  />
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
                      <div key={loc.id} className="flex justify-between items-center p-3 border rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <p className="font-semibold text-sm">{loc.building} {loc.floor && `/ ${loc.floor}`}</p>
                          <p className="text-xs text-muted-foreground">{loc.description || 'Açıklama yok'}</p>
                        </div>
                      </div>
                    ))}
                    {locations?.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Henüz lokasyon eklenmemiş.</p>}
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
