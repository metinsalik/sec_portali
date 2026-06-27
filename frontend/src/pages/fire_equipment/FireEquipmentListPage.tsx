import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Flame, Plus, QrCode, ArrowRight, Filter, AlertTriangle, CheckCircle, PenTool, Printer, Search, Trash2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';

export default function FireEquipmentListPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();

  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterSubcategory, setFilterSubcategory] = useState<string>('all');
  const [filterBlock, setFilterBlock] = useState<string>('all');
  const [filterFloor, setFilterFloor] = useState<string>('all');
  const [filterDepartment, setFilterDepartment] = useState<string>('all');
  const [filterDescription, setFilterDescription] = useState<string>('all');
  const [filterResult, setFilterResult] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const { data: equipment, isLoading } = useQuery({
    queryKey: ['fire-equipment', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/equipment/${facilityId}`);
      if (!res.ok) throw new Error('Failed to fetch fire equipment');
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: categories } = useQuery({
    queryKey: ['fire-categories'],
    queryFn: async () => {
      const res = await api.get('/fire-equipment/categories');
      return res.json();
    }
  });

  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    }
  });
  const currentFacilityName = facilities?.find((f: any) => f.id === facilityId)?.name || 'Tesis';

  const { data: locations } = useQuery({
    queryKey: ['fire-locations', facilityId],
    queryFn: async () => {
      const res = await api.get(`/fire-equipment/locations/${facilityId}`);
      return res.json();
    },
    enabled: !!facilityId
  });

  const parentCategories = categories?.filter((c: any) => !c.parentId) || [];
  const selectedCategoryObj = parentCategories.find((c: any) => c.id === filterCategory);
  const availableSubcategories = selectedCategoryObj?.subcategories || [];

  // Hierarchical Locations Data Extraction
  const blocks = Array.from(new Set(locations?.map((l: any) => l.building).filter(Boolean))).sort();
  
  const availableFloors = Array.from(new Set(
    locations?.filter((l: any) => filterBlock === 'all' || l.building === filterBlock)
    .map((l: any) => l.floor)
    .filter(Boolean)
  )).sort();

  const availableDepartments = Array.from(new Set(
    locations?.filter((l: any) => 
      (filterBlock === 'all' || l.building === filterBlock) &&
      (filterFloor === 'all' || l.floor === filterFloor)
    )
    .map((l: any) => l.department)
    .filter(Boolean)
  )).sort();

  const availableDescriptions = Array.from(new Set(
    locations?.filter((l: any) => 
      (filterBlock === 'all' || l.building === filterBlock) &&
      (filterFloor === 'all' || l.floor === filterFloor) &&
      (filterDepartment === 'all' || l.department === filterDepartment)
    )
    .map((l: any) => l.description)
    .filter(Boolean)
  )).sort();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'AKTIF': return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">Aktif</Badge>;
      case 'DEPODA': return <Badge variant="secondary">Depoda</Badge>;
      case 'ARIZALI': return <Badge variant="destructive">Arızalı</Badge>;
      case 'HURDA': return <Badge variant="outline" className="bg-slate-200">Hurda</Badge>;
      case 'KULLANIM_DISI': return <Badge variant="outline">Kullanım Dışı</Badge>;
      case 'DEGISIME_GIDEN': return <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100">Değişime Giden</Badge>;
      default: return <Badge>{status}</Badge>;
    }
  };

  const handleBulkDelete = async () => {
    if (filterCategory === 'all') return;
    if (!window.confirm('Bu kategori altındaki tüm ekipmanları silmek istediğinize emin misiniz? Bu işlem geri alınamaz!')) return;

    try {
      const res = await api.delete(`/fire-equipment/equipment/bulk/${facilityId}?categoryId=${filterCategory}`);
      if (!res.ok) throw new Error('Toplu silme işlemi başarısız oldu.');
      toast.success('Seçilen kategori altındaki tüm ekipmanlar silindi.');
      queryClient.invalidateQueries({ queryKey: ['fire-equipment', facilityId] });
    } catch (error: any) {
      toast.error(error.message || 'Bir hata oluştu.');
    }
  };

  const getMaintenanceWarning = (dateString: string | null) => {
    if (!dateString) return null;
    const nextDate = new Date(dateString);
    const today = new Date();
    const diffTime = nextDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return <span className="text-red-600 font-medium text-xs block">Süresi Geçti ({Math.abs(diffDays)} gün)</span>;
    } else if (diffDays <= 30) {
      return <span className="text-orange-600 font-medium text-xs block">Yaklaşıyor ({diffDays} gün)</span>;
    }
    return <span className="text-muted-foreground text-xs block">{nextDate.getFullYear()}-{String(nextDate.getMonth() + 1).padStart(2, '0')}</span>;
  };

  const filteredEquipment = equipment?.filter((item: any) => {
    let match = true;
    if (filterCategory !== 'all') {
      if (filterSubcategory !== 'all') {
        match = match && item.categoryId === filterSubcategory;
      } else {
        match = match && (item.categoryId === filterCategory || item.category?.parentId === filterCategory);
      }
    }
    if (filterBlock !== 'all') {
      match = match && item.location?.building === filterBlock;
    }
    if (filterFloor !== 'all') {
      match = match && item.location?.floor === filterFloor;
    }
    if (filterDepartment !== 'all') {
      match = match && item.location?.department === filterDepartment;
    }
    if (filterDescription !== 'all') {
      match = match && item.location?.description === filterDescription;
    }
    if (filterResult !== 'all') {
      const result = item.maintenances?.[0]?.result;
      if (filterResult === 'YOK') {
        match = match && !result;
      } else {
        match = match && result === filterResult;
      }
    }
    if (filterStatus !== 'all') {
      if (filterStatus === 'AKTIF_DEGISIM') {
        match = match && (item.status === 'AKTIF' || item.status === 'DEGISIME_GIDEN');
      } else if (filterStatus === 'DEGISIM_BEKLEYEN') {
        match = match && ['ARIZALI', 'HURDA', 'DEGISIME_GIDEN'].includes(item.status);
      } else {
        match = match && item.status === filterStatus;
      }
    }
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase();
      const searchableFields = [
        item.equipmentNo,
        item.serialNo,
        item.brand,
        item.qrCode,
        item.model,
      ].map(f => f?.toLowerCase() || '');
      match = match && searchableFields.some(f => f.includes(query));
    }
    return match;
  }) || [];

  // Dynamic KPIs based on filtered list
  const totalEquipment = filteredEquipment.length;
  const activeEquipment = filteredEquipment.filter((e: any) => e.status === 'AKTIF').length;
  
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  const needingMaintenance = filteredEquipment.filter((e: any) => {
    if (!e.nextMaintenanceDate) return true;
    return new Date(e.nextMaintenanceDate) < nextMonth;
  }).length;
  const swapPendingEquipment = filteredEquipment.filter((e: any) => ['ARIZALI', 'HURDA', 'DEGISIME_GIDEN'].includes(e.status)).length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 print:hidden">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white flex items-center gap-2">
            <Flame className="w-8 h-8 text-red-500" /> Yangın Ekipmanı Envanteri
          </h1>
          <p className="text-muted-foreground mt-1">Tüm ekipmanlarınızı listeleyin ve detaylarını görüntüleyin.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => window.print()} className="hidden sm:flex" disabled={!equipment || equipment.length === 0}>
            <Printer className="w-4 h-4 mr-2" /> Toplu QR Yazdır
          </Button>
          <Button onClick={() => navigate('/fire-equipment/new')} className="bg-red-600 hover:bg-red-700">
            <Plus className="w-4 h-4 mr-2" /> Yeni Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 print:hidden">
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-900 border-red-100 dark:border-red-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Listelenen Ekipman</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-red-600 dark:text-red-400">{totalEquipment}</h3>
                </div>
              </div>
              <div className="p-2 bg-red-100 dark:bg-red-900/50 rounded-full">
                <Flame className="w-5 h-5 text-red-600 dark:text-red-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-white dark:from-green-950 dark:to-slate-900 border-green-100 dark:border-green-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Aktif Kullanımda</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-green-600 dark:text-green-400">{activeEquipment}</h3>
                </div>
              </div>
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-full">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-slate-900 border-orange-100 dark:border-orange-900 shadow-sm">
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground">Yaklaşan Bakımlar</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-orange-600 dark:text-orange-400">{needingMaintenance}</h3>
                </div>
              </div>
              <div className="p-2 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                <PenTool className="w-5 h-5 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950 dark:to-slate-900 border-rose-100 dark:border-rose-900 shadow-sm cursor-pointer hover:shadow-md transition-all"
          onClick={() => setFilterStatus(filterStatus === 'DEGISIM_BEKLEYEN' ? 'all' : 'DEGISIM_BEKLEYEN')}
        >
          <CardContent className="p-4">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  Değişim Bekleyenler {filterStatus === 'DEGISIM_BEKLEYEN' && <span className="text-xs bg-rose-200 text-rose-800 px-2 py-0.5 rounded-full">Filtreli</span>}
                </p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-3xl font-black text-rose-600 dark:text-rose-400">{swapPendingEquipment}</h3>
                </div>
              </div>
              <div className="p-2 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                <AlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-300" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="shadow-sm border-border print:hidden">
        <CardContent className="p-4 bg-muted/20 border-b space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Ekipman No, Seri No, Marka, QR Kod ile ara..."
                className="pl-9 h-9 w-full shadow-sm bg-white dark:bg-slate-900"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
          <div className="flex flex-col md:flex-row gap-4 items-end flex-wrap">
            <div className="space-y-1 w-full md:w-1/4">
              <label className="text-xs font-medium text-muted-foreground">Kategori</label>
              <div className="flex gap-2">
                <select 
                  className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                  value={filterCategory}
                  onChange={(e) => {
                    setFilterCategory(e.target.value);
                    setFilterSubcategory('all'); // reset sub
                  }}
                >
                  <option value="all">Tüm Kategoriler</option>
                  {parentCategories?.map((cat: any) => (
                    <option key={cat.id} value={cat.id}>{cat.name}</option>
                  ))}
                </select>
                {filterCategory !== 'all' && (user?.isManagement || user?.isAdmin || user?.roles?.some((r: string) => r.includes('MERKEZ'))) && (
                  <Button variant="destructive" size="sm" onClick={handleBulkDelete} title="Bu kategorideki tüm kayıtları sil">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            <div className="space-y-1 w-full md:w-1/4">
              <label className="text-xs font-medium text-muted-foreground">Alt Kategori</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                value={filterSubcategory}
                onChange={(e) => setFilterSubcategory(e.target.value)}
                disabled={filterCategory === 'all' || availableSubcategories.length === 0}
              >
                <option value="all">Tüm Alt Kategoriler</option>
                {availableSubcategories.map((sub: any) => (
                  <option key={sub.id} value={sub.id}>{sub.name}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 w-full md:w-1/4">
              <label className="text-xs font-medium text-muted-foreground">Blok</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={filterBlock}
                onChange={(e) => {
                  setFilterBlock(e.target.value);
                  setFilterFloor('all');
                  setFilterDepartment('all');
                  setFilterDescription('all');
                }}
              >
                <option value="all">Tüm Bloklar</option>
                {blocks.map((b: any) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 w-full md:w-1/4">
              <label className="text-xs font-medium text-muted-foreground">Kat</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                value={filterFloor}
                onChange={(e) => {
                  setFilterFloor(e.target.value);
                  setFilterDepartment('all');
                  setFilterDescription('all');
                }}
                disabled={availableFloors.length === 0}
              >
                <option value="all">Tüm Katlar</option>
                {availableFloors.map((f: any) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 w-full md:w-1/4">
              <label className="text-xs font-medium text-muted-foreground">Birim</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                value={filterDepartment}
                onChange={(e) => {
                  setFilterDepartment(e.target.value);
                  setFilterDescription('all');
                }}
                disabled={availableDepartments.length === 0}
              >
                <option value="all">Tüm Birimler</option>
                {availableDepartments.map((d: any) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>

            <div className="space-y-1 w-full md:w-1/4">
              <label className="text-xs font-medium text-muted-foreground">Mahal</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm disabled:opacity-50"
                value={filterDescription}
                onChange={(e) => setFilterDescription(e.target.value)}
                disabled={availableDescriptions.length === 0}
              >
                <option value="all">Tüm Mahaller</option>
                {availableDescriptions.map((d: any) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            
            <div className="space-y-1 w-full md:w-1/4">
              <label className="text-xs font-medium text-muted-foreground">Bakım Durumu</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={filterResult}
                onChange={(e) => setFilterResult(e.target.value)}
              >
                <option value="all">Tüm Durumlar</option>
                <option value="UYGUN">Uygun</option>
                <option value="SARTLI_UYGUN">Şartlı Uygun</option>
                <option value="UYGUN_DEGIL">Uygun Değil</option>
                <option value="YOK">Bakım Yok</option>
              </select>
            </div>

            <div className="space-y-1 w-full md:w-1/5">
              <label className="text-xs font-medium text-muted-foreground">Ekipman Durumu</label>
              <select 
                className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="all">Tümü</option>
                <option value="AKTIF">Aktif</option>
                <option value="DEPODA">Depoda</option>
                <option value="DEGISIM_BEKLEYEN">Değişim Bekleyenler</option>
              </select>
            </div>
          </div>
        </CardContent>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 space-y-4">
              {[1, 2, 3, 4, 5].map(i => <Skeleton key={i} className="w-full h-16" />)}
            </div>
          ) : !equipment || equipment.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground flex flex-col items-center gap-4">
              <Flame className="w-12 h-12 text-gray-300" />
              <p>Henüz bu tesise ait yangın ekipmanı bulunmamaktadır.</p>
              <Button onClick={() => navigate('/fire-equipment/new')} variant="outline">
                İlk Ekipmanı Ekle
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground bg-muted/50 border-b">
                  <tr>
                    <th className="px-6 py-4 font-medium">Ekipman No</th>
                    <th className="px-6 py-4 font-medium">Kategori</th>
                    <th className="px-6 py-4 font-medium">Marka / Model</th>
                    <th className="px-6 py-4 font-medium">Lokasyon</th>
                    <th className="px-6 py-4 font-medium">Sorumlu</th>
                    <th className="px-6 py-4 font-medium">Durum</th>
                    <th className="px-6 py-4 font-medium">Son Bakım</th>
                    <th className="px-6 py-4 font-medium">Sonraki Bakım</th>
                    <th className="px-6 py-4 font-medium text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filteredEquipment.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-muted-foreground">
                        Seçilen filtrelere uygun ekipman bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    filteredEquipment.map((item: any) => (
                      <tr key={item.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-6 py-4 font-medium flex items-center gap-2">
                        {item.qrCode && <QrCode className="w-4 h-4 text-blue-500" />}
                        {item.equipmentNo}
                      </td>
                      <td className="px-6 py-4">{item.category?.name || '-'}</td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.brand || '-'} {item.model ? `/ ${item.model}` : ''}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.status === 'DEPODA' ? 'Teknik Depo (Yedek)' : (item.location ? `${item.location.building}${item.location.floor ? ` / ${item.location.floor}` : ''}${item.location.department ? ` - ${item.location.department}` : ''}` : 'Lokasyon Yok')}
                      </td>
                      <td className="px-6 py-4 text-muted-foreground">
                        {item.responsible ? item.responsible.name : (item.responsibleUnit || '-')}
                      </td>
                      <td className="px-6 py-4">
                        {getStatusBadge(item.status)}
                      </td>
                      <td className="px-6 py-4">
                        {item.maintenances && item.maintenances.length > 0 ? (
                          <Badge variant={item.maintenances[0].result === 'UYGUN' ? 'default' : item.maintenances[0].result === 'SARTLI_UYGUN' ? 'outline' : 'destructive'} 
                                 className={item.maintenances[0].result === 'UYGUN' ? 'bg-green-500 hover:bg-green-600' : item.maintenances[0].result === 'SARTLI_UYGUN' ? 'bg-orange-500 text-white hover:bg-orange-600 border-none' : ''}>
                            {item.maintenances[0].result === 'UYGUN' ? '✅ Uygun' : item.maintenances[0].result === 'SARTLI_UYGUN' ? '⚠️ Şartlı Uygun' : '❌ Uygun Değil'}
                          </Badge>
                        ) : <span className="text-muted-foreground text-xs">Yok</span>}
                      </td>
                      <td className="px-6 py-4">
                        {item.nextMaintenanceDate ? getMaintenanceWarning(item.nextMaintenanceDate) : <span className="text-muted-foreground text-xs">-</span>}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/fire-equipment/view/${item.id}`)}
                          className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20"
                        >
                          Detay <ArrowRight className="w-4 h-4 ml-1" />
                        </Button>
                      </td>
                    </tr>
                  ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yazdırma Alanı (Sadece @media print ile görünür) */}
      <div className="hidden print:block print:w-full">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 print:grid-cols-4 print:gap-4">
          {filteredEquipment?.map((item: any) => (
            <div key={item.id} className="border-2 border-black p-4 flex flex-col items-center justify-center text-center space-y-3 break-inside-avoid print:break-inside-avoid bg-white">
              <h2 className="font-bold text-sm uppercase leading-tight line-clamp-2">{currentFacilityName}</h2>
              <p className="font-bold text-base bg-slate-100 px-3 py-1 rounded w-full">{item.equipmentNo}</p>
              <div className="p-2 bg-white border border-slate-200 rounded-lg">
                <QRCodeSVG value={`${window.location.origin}/fire-equipment/view/${item.id}`} size={120} level="M" includeMargin={false} />
              </div>
              <p className="text-[10px] text-muted-foreground">{item.category?.name || ''}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Mobile Floating QR Scanner Button */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 print:hidden">
        <Button 
          size="lg" 
          className="rounded-full shadow-xl bg-red-600 hover:bg-red-700 text-white px-6 h-14 flex items-center gap-2"
          onClick={() => navigate('/fire-equipment/scanner')}
        >
          <QrCode className="w-6 h-6" />
          <span className="font-bold text-base">QR Okut</span>
        </Button>
      </div>
    </div>
  );
}
