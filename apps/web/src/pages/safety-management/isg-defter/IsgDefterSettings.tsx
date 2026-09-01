import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ShieldAlert, Info, Upload, Trash2, Edit } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function IsgDefterSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');

  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  // State for Risk Levels
  const [isRiskModalOpen, setIsRiskModalOpen] = useState(false);
  const [currentRisk, setCurrentRisk] = useState<any>(null);

  // Queries
  const { data: settings, isLoading: isSettingsLoading } = useQuery({
    queryKey: ['isg-defter-settings', activeFacilityId],
    queryFn: async () => {
      const targetId = activeFacilityId || 'all';
      const res = await api.get(`/safety-management/isg-defter/facilities/${targetId}/settings`);
      return res.json();
    },
    enabled: hasAdminAccess,
  });

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    },
    enabled: hasAdminAccess,
  });

  // Mutations
  const updateSettingsMutation = useMutation({
    mutationFn: async (data: any) => {
      const targetId = activeFacilityId || 'all';
      const res = await api.put(`/safety-management/isg-defter/facilities/${targetId}/settings`, data);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Ayarlar güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['isg-defter-settings'] });
      toast.success('Ayarlar başarıyla güncellendi.');
    },
    onError: () => toast.error('Ayarlar güncellenirken hata oluştu.')
  });

  const importExcelMutation = useMutation({
    mutationFn: async ({ formData, facilityId }: { formData: FormData, facilityId: string }) => {
      const res = await api.post(`/safety-management/isg-defter/facilities/${facilityId}/import`, formData);
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(`Excel içe aktarıldı. ${data.importedCount} kayıt eklendi.`);
      queryClient.invalidateQueries({ queryKey: ['isg-defter-pages'] });
    },
    onError: () => toast.error('Excel içe aktarma sırasında hata oluştu.')
  });

  const handleSettingsSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    updateSettingsMutation.mutate({
      maxPagesPerCilt: formData.get('maxPagesPerCilt'),
      currentCilt: formData.get('currentCilt')
    });
  };

  const handleExcelImport = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const selectedFacilityId = formData.get('facilityId') as string;
    
    if (!selectedFacilityId) {
      toast.error('Lütfen bir tesis seçin.');
      return;
    }
    
    importExcelMutation.mutate({ formData, facilityId: selectedFacilityId });
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center space-y-4">
        <ShieldAlert className="h-16 w-16 text-red-500" />
        <h2 className="text-2xl font-bold">Yetkisiz Erişim</h2>
        <p className="text-muted-foreground max-w-md">Modül ayarları sayfasına sadece yöneticiler erişebilir.</p>
      </div>
    );
  }

  // We will no longer block the whole page if activeFacilityId is all,
  // because Risk Levels should be configured globally.
  const isGlobal = !activeFacilityId || activeFacilityId === 'all';

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Modül Ayarları</h2>
          <p className="text-muted-foreground">İSG Tespit ve Öneri Defteri yapılandırmaları.</p>
        </div>
      </div>

      <Tabs defaultValue="defter" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="defter">Defter Tanımları</TabsTrigger>
          <TabsTrigger value="kategori">Kategoriler</TabsTrigger>
          <TabsTrigger value="risk">Risk Düzeyleri</TabsTrigger>
          <TabsTrigger value="excel">Excel İçe Aktar</TabsTrigger>
        </TabsList>

        <TabsContent value="defter">
          <Card>
            <CardHeader>
              <CardTitle>Cilt ve Yaprak Tanımları</CardTitle>
              <CardDescription>Otomatik cilt takibi için sayfa sınırını belirleyin.</CardDescription>
            </CardHeader>
            <CardContent>
              {isGlobal ? (
                <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground border border-dashed rounded-lg">
                  <h3 className="font-semibold text-lg text-foreground mb-1">Tesis Seçimi Gerekli</h3>
                  <p>Cilt ve sayfa yapılandırması her tesis için ayrıdır. Lütfen sağ üstten bir tesis seçin.</p>
                </div>
              ) : isSettingsLoading ? <p>Yükleniyor...</p> : (
                <form onSubmit={handleSettingsSubmit} className="space-y-4 max-w-md">
                  <div className="space-y-2">
                    <Label>Aktif Cilt Numarası</Label>
                    <Input name="currentCilt" type="number" defaultValue={settings?.currentCilt || 1} required />
                  </div>
                  <div className="space-y-2">
                    <Label>Bir Ciltteki Maksimum Yaprak Sayısı</Label>
                    <Input name="maxPagesPerCilt" type="number" defaultValue={settings?.maxPagesPerCilt || 50} required />
                    <p className="text-xs text-muted-foreground">Sayfa sayısı bu sınıra ulaştığında otomatik olarak yeni cilde geçilir.</p>
                  </div>
                  <Button type="submit" className="bg-slate-900 text-white hover:bg-slate-800" disabled={updateSettingsMutation.isPending}>
                    {updateSettingsMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="kategori">
          <Card>
            <CardHeader>
              <CardTitle>Global Kategori Yönetimi</CardTitle>
              <CardDescription>İSG Defteri artık sistemin genel kategori altyapısını kullanmaktadır.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center p-8 text-center bg-muted/20 border border-dashed rounded-xl">
                <Info className="w-12 h-12 text-blue-500 mb-4" />
                <h3 className="text-lg font-semibold mb-2">Kategoriler Artık Ortak Yönetiliyor</h3>
                <p className="text-muted-foreground max-w-md mb-6">
                  Uygulama genelinde standartlaşmayı sağlamak amacıyla tüm kategoriler <strong>"Ayarlar &gt; Tanımlar"</strong> bölümüne taşınmıştır.
                </p>
                <Button onClick={() => navigate('/settings/definitions')}>
                  Global Tanımlara Git
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="risk">
          <Card>
            <CardHeader className="flex flex-row justify-between items-center">
              <div>
                <CardTitle>Risk Düzeyleri (Global)</CardTitle>
                <CardDescription>Uygulama genelindeki (Tüm Tesisler) risk seviyelerini ve renklerini yönetin. 
                {isGlobal ? '' : ' Not: Risk düzeyleri tüm tesisler için ortaktır.'}
                </CardDescription>
              </div>
              <Button className="bg-slate-900 text-white hover:bg-slate-800" onClick={() => { setCurrentRisk({ name: '', color: 'bg-gray-500' }); setIsRiskModalOpen(true); }}>Yeni Risk Düzeyi</Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {settings?.riskLevels?.map((risk: any, i: number) => (
                  <div key={i} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex items-center gap-3">
                      <span className={`w-4 h-4 rounded-full ${risk.color}`}></span>
                      <span className="font-medium">{risk.name}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="ghost" size="icon" onClick={() => { setCurrentRisk(risk); setIsRiskModalOpen(true); }}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                        const newLevels = settings.riskLevels.filter((r: any) => r.name !== risk.name);
                        updateSettingsMutation.mutate({ riskLevels: newLevels });
                      }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="excel">
          <Card>
            <CardHeader>
              <CardTitle>Excel'den Veri Aktar</CardTitle>
              <CardDescription>Geçmiş defter kayıtlarınızı Excel formatında sisteme yükleyin.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleExcelImport} className="space-y-4 max-w-md">
                <Alert variant="default" className="bg-blue-50 text-blue-900 border-blue-200">
                  <Info className="h-4 w-4 text-blue-900" />
                  <AlertTitle>Format Bilgisi</AlertTitle>
                  <AlertDescription className="text-sm">
                    A Sütunu: Tesis, B: Tarih, C: Tespit/Öneri, D: Yapan Kişi, E: Sonuç.<br/>
                    1. satır başlık olarak kabul edilip atlanacaktır.
                  </AlertDescription>
                </Alert>
                <div className="space-y-2">
                  <Label>Tesis Seçimi</Label>
                  <Select name="facilityId" defaultValue={activeFacilityId || ''} required>
                    <SelectTrigger className="bg-background">
                      <SelectValue placeholder="Tesis Seçin" />
                    </SelectTrigger>
                    <SelectContent>
                      {facilities.map((f: any) => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Verilerin Ait Olduğu Yıl</Label>
                  <Input name="year" type="number" defaultValue={new Date().getFullYear()} required />
                </div>
                <div className="space-y-2">
                  <Label>Excel Dosyası (.xlsx, .xls)</Label>
                  <Input name="file" type="file" accept=".xlsx, .xls" required />
                </div>
                <Button type="submit" className="w-full bg-slate-900 text-white hover:bg-slate-800" disabled={importExcelMutation.isPending}>
                  <Upload className="w-4 h-4 mr-2" />
                  {importExcelMutation.isPending ? 'Yükleniyor...' : 'Verileri Yükle'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>



      {/* Risk Level Add/Edit Modal */}
      <Dialog open={isRiskModalOpen} onOpenChange={setIsRiskModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{currentRisk?.name ? 'Risk Düzeyini Düzenle' : 'Yeni Risk Düzeyi Ekle'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const name = formData.get('name') as string;
            const color = formData.get('color') as string;
            
            let newLevels = [...(settings?.riskLevels || [])];
            
            // Edit
            if (currentRisk?.name && newLevels.find(r => r.name === currentRisk.name)) {
              newLevels = newLevels.map(r => r.name === currentRisk.name ? { name, color } : r);
            } else {
              // Add
              newLevels.push({ name, color });
            }
            
            updateSettingsMutation.mutate({ riskLevels: newLevels }, {
              onSuccess: () => {
                setIsRiskModalOpen(false);
                // invalidate to refresh immediately
                queryClient.invalidateQueries({ queryKey: ['isg-defter-settings'] });
              }
            });
          }} className="space-y-4">
            <div className="space-y-2">
              <Label>Risk Düzeyi Adı</Label>
              <Input name="name" defaultValue={currentRisk?.name || ''} required />
            </div>
            <div className="space-y-2">
              <Label>Renk (Sınıf)</Label>
              <Select name="color" defaultValue={currentRisk?.color || 'bg-gray-500'}>
                <SelectTrigger>
                  <SelectValue placeholder="Renk seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="bg-red-600">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-red-600"></span> Kırmızı</div>
                  </SelectItem>
                  <SelectItem value="bg-orange-500">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-orange-500"></span> Turuncu</div>
                  </SelectItem>
                  <SelectItem value="bg-yellow-500">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-yellow-500"></span> Sarı</div>
                  </SelectItem>
                  <SelectItem value="bg-blue-500">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-blue-500"></span> Mavi</div>
                  </SelectItem>
                  <SelectItem value="bg-green-500">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-green-500"></span> Yeşil</div>
                  </SelectItem>
                  <SelectItem value="bg-gray-500">
                    <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full bg-gray-500"></span> Gri</div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRiskModalOpen(false)}>İptal</Button>
              <Button type="submit">Kaydet</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
