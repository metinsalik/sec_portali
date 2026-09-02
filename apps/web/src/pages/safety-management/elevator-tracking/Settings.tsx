import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2, Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { elevatorSettingsService } from '../../../services/elevator-settings.service';
import { elevatorService } from '../../../services/elevator.service';

export default function ElevatorSettings() {
  const facilityId = localStorage.getItem('activeFacilityId') || '';

  const [brands, setBrands] = useState<any[]>([]);
  const [companies, setCompanies] = useState<any[]>([]);
  const [types, setTypes] = useState<any[]>([]);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [labels, setLabels] = useState<any[]>([]);

  const [newBrand, setNewBrand] = useState('');
  const [newCompany, setNewCompany] = useState('');
  const [newType, setNewType] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newLabelColor, setNewLabelColor] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const handleDownloadTemplate = async () => {
    try {
      await elevatorService.downloadTemplate();
      toast.success('Şablon indiriliyor...');
    } catch (e) {
      toast.error('Şablon indirilemedi');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    try {
      const res = await elevatorService.importExcel(facilityId, file);
      toast.success(`${res.importedCount || 0} adet asansör başarıyla içe aktarıldı`);
    } catch (error: any) {
      toast.error(error.message || 'İçe aktarma hatası');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  const loadAll = async () => {
    try {
      const [b, c, t, s, l] = await Promise.all([
        elevatorSettingsService.getBrands(facilityId),
        elevatorSettingsService.getMaintenanceCompanies(facilityId),
        elevatorSettingsService.getTypes(facilityId),
        elevatorSettingsService.getStatuses(facilityId),
        elevatorSettingsService.getLabels(facilityId)
      ]);
      setBrands(b);
      setCompanies(c);
      setTypes(t);
      setStatuses(s);
      setLabels(l);
    } catch (e) {
      toast.error('Ayarlar yüklenemedi');
    }
  };

  useEffect(() => {
    if (facilityId) loadAll();
  }, [facilityId]);

  const handleAddBrand = async () => {
    if (!newBrand) return;
    try {
      await elevatorSettingsService.addBrand({ facilityId, name: newBrand });
      setNewBrand('');
      loadAll();
      toast.success('Firma eklendi');
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const handleAddCompany = async () => {
    if (!newCompany) return;
    try {
      await elevatorSettingsService.addMaintenanceCompany({ facilityId, name: newCompany });
      setNewCompany('');
      loadAll();
      toast.success('Bakım firması eklendi');
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const handleAddType = async () => {
    if (!newType) return;
    try {
      await elevatorSettingsService.addType({ facilityId, name: newType });
      setNewType('');
      loadAll();
      toast.success('Tür eklendi');
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const handleAddStatus = async () => {
    if (!newStatus) return;
    try {
      await elevatorSettingsService.addStatus({ facilityId, name: newStatus });
      setNewStatus('');
      loadAll();
      toast.success('Durum eklendi');
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const handleAddLabel = async () => {
    if (!newLabel) return;
    try {
      await elevatorSettingsService.addLabel({ facilityId, name: newLabel, color: newLabelColor });
      setNewLabel('');
      setNewLabelColor('');
      loadAll();
      toast.success('Etiket eklendi');
    } catch (e) {
      toast.error('Hata oluştu');
    }
  };

  const handleDelete = async (type: string, id: string) => {
    if (!confirm('Emin misiniz?')) return;
    try {
      if (type === 'brand') await elevatorSettingsService.deleteBrand(id);
      if (type === 'company') await elevatorSettingsService.deleteMaintenanceCompany(id);
      if (type === 'type') await elevatorSettingsService.deleteType(id);
      if (type === 'status') await elevatorSettingsService.deleteStatus(id);
      if (type === 'label') await elevatorSettingsService.deleteLabel(id);
      loadAll();
      toast.success('Silindi');
    } catch (e) {
      toast.error('Silinemedi');
    }
  };

  const handleToggle = async (type: string, id: string, isActive: boolean) => {
    try {
      if (type === 'brand') await elevatorSettingsService.toggleBrand(id, isActive);
      if (type === 'company') await elevatorSettingsService.toggleMaintenanceCompany(id, isActive);
      if (type === 'type') await elevatorSettingsService.toggleType(id, isActive);
      if (type === 'status') await elevatorSettingsService.toggleStatus(id, isActive);
      if (type === 'label') await elevatorSettingsService.toggleLabel(id, isActive);
      loadAll();
    } catch (e) {
      toast.error('Güncellenemedi');
    }
  };

  const renderTable = (data: any[], type: string, value: string, setter: any, handler: any, colorValue?: string, colorSetter?: any) => (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Input placeholder="Yeni Değer..." value={value} onChange={e => setter(e.target.value)} className="max-w-xs" />
        {colorSetter && (
          <Input placeholder="Renk Kodu (örn: #ff0000)" value={colorValue} onChange={e => colorSetter(e.target.value)} className="max-w-xs" />
        )}
        <Button onClick={handler}><PlusCircle className="w-4 h-4 mr-2"/> Ekle</Button>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Adı</TableHead>
            {colorSetter && <TableHead>Renk</TableHead>}
            <TableHead>Aktif</TableHead>
            <TableHead className="w-24">İşlem</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {(data || []).map(item => (
            <TableRow key={item.id}>
              <TableCell>{item.name}</TableCell>
              {colorSetter && (
                <TableCell>
                  {item.color ? <div className="flex items-center gap-2"><div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}/>{item.color}</div> : '-'}
                </TableCell>
              )}
              <TableCell>
                <Switch checked={item.isActive} onCheckedChange={(v) => handleToggle(type, item.id, v)} />
              </TableCell>
              <TableCell>
                <Button variant="ghost" size="icon" onClick={() => handleDelete(type, item.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!data || data.length === 0) && <TableRow><TableCell colSpan={4} className="text-center py-4">Kayıt bulunamadı.</TableCell></TableRow>}
        </TableBody>
      </Table>
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Asansör Modülü Ayarları</h2>
        <p className="text-muted-foreground">Asansör markaları, bakım firmaları, türler ve etiketler gibi temel verileri buradan yönetebilirsiniz.</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="brands">
            <TabsList className="mb-4">
              <TabsTrigger value="brands">Markalar</TabsTrigger>
              <TabsTrigger value="companies">Bakım Firmaları</TabsTrigger>
              <TabsTrigger value="types">Türler</TabsTrigger>
              <TabsTrigger value="labels">Etiketler</TabsTrigger>
              <TabsTrigger value="statuses">Durumlar</TabsTrigger>
              <TabsTrigger value="import">Toplu Yükleme</TabsTrigger>
            </TabsList>
            <TabsContent value="brands">
              <CardDescription className="mb-4">Sistemde kullanılabilecek asansör markalarını/üretici firmalarını yönetin.</CardDescription>
              {renderTable(brands, 'brand', newBrand, setNewBrand, handleAddBrand)}
            </TabsContent>
            <TabsContent value="companies">
              <CardDescription className="mb-4">Asansör bakımlarını yapan yetkili firmaları yönetin.</CardDescription>
              {renderTable(companies, 'company', newCompany, setNewCompany, handleAddCompany)}
            </TabsContent>
            <TabsContent value="types">
              <CardDescription className="mb-4">İnsan Asansörü, Yük Asansörü, Sedye Asansörü gibi türleri yönetin.</CardDescription>
              {renderTable(types, 'type', newType, setNewType, handleAddType)}
            </TabsContent>
            <TabsContent value="labels">
              <CardDescription className="mb-4">Kırmızı, Sarı, Mavi, Yeşil gibi muayene etiketlerini yönetin.</CardDescription>
              {renderTable(labels, 'label', newLabel, setNewLabel, handleAddLabel, newLabelColor, setNewLabelColor)}
            </TabsContent>
            <TabsContent value="statuses">
              <CardDescription className="mb-4">Aktif, Pasif, Devre Dışı gibi asansör durumlarını yönetin.</CardDescription>
              {renderTable(statuses, 'status', newStatus, setNewStatus, handleAddStatus)}
            </TabsContent>
            <TabsContent value="import">
              <CardDescription className="mb-4">Hastanelerdeki asansörleri tek tek girmek yerine Excel şablonunu doldurarak topluca sisteme yükleyebilirsiniz.</CardDescription>
              <div className="flex flex-col sm:flex-row gap-6 mt-6">
                <div className="flex-1 p-6 border rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                  <Download className="w-10 h-10 text-blue-500" />
                  <div>
                    <h3 className="font-semibold text-lg">Adım 1: Şablonu İndirin</h3>
                    <p className="text-sm text-gray-500">Örnek formattaki Excel dosyasını indirin ve asansör verilerinizle doldurun.</p>
                  </div>
                  <Button variant="outline" onClick={handleDownloadTemplate}>Şablonu İndir</Button>
                </div>
                <div className="flex-1 p-6 border rounded-lg bg-slate-50 flex flex-col items-center justify-center text-center space-y-4">
                  <Upload className="w-10 h-10 text-green-500" />
                  <div>
                    <h3 className="font-semibold text-lg">Adım 2: Dosyayı Yükleyin</h3>
                    <p className="text-sm text-gray-500">Doldurduğunuz Excel dosyasını sisteme yükleyerek asansörleri topluca kaydedin.</p>
                  </div>
                  <div className="relative">
                    <Button disabled={isUploading}>{isUploading ? 'Yükleniyor...' : 'Excel Dosyası Seçin'}</Button>
                    <Input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} disabled={isUploading} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer" />
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
