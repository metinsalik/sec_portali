import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Trash2, Download, Upload, Edit } from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { elevatorSettingsService } from '../../../services/elevator-settings.service';
import { elevatorService } from '../../../services/elevator.service';

export default function ElevatorSettings() {
  const [facilityId, setFacilityId] = useState<string>(
    localStorage.getItem('activeFacilityId') || 'all'
  );

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

  // Düzenleme (Edit) State'i
  const [editingItem, setEditingItem] = useState<{
    type: string;
    id: string;
    name: string;
    color?: string;
  } | null>(null);
  const [editName, setEditName] = useState('');
  const [editColor, setEditColor] = useState('');
  const [isSavingEdit, setIsSavingEdit] = useState(false);

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
        elevatorSettingsService.getBrands('all'),
        elevatorSettingsService.getMaintenanceCompanies('all'),
        elevatorSettingsService.getTypes('all'),
        elevatorSettingsService.getStatuses('all'),
        elevatorSettingsService.getLabels('all')
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
    const handleFacilityChanged = () => {
      const current = localStorage.getItem('activeFacilityId') || 'all';
      setFacilityId(current);
      loadAll();
    };

    window.addEventListener('facilityChanged', handleFacilityChanged);
    loadAll();

    return () => {
      window.removeEventListener('facilityChanged', handleFacilityChanged);
    };
  }, []);

  const handleAddBrand = async () => {
    if (!newBrand) return;
    try {
      await elevatorSettingsService.addBrand({ facilityId: 'all', name: newBrand });
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
      await elevatorSettingsService.addMaintenanceCompany({ facilityId: 'all', name: newCompany });
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
      await elevatorSettingsService.addType({ facilityId: 'all', name: newType });
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
      await elevatorSettingsService.addStatus({ facilityId: 'all', name: newStatus });
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
      await elevatorSettingsService.addLabel({ facilityId: 'all', name: newLabel, color: newLabelColor });
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

  const handleStartEdit = (type: string, item: any) => {
    setEditingItem({
      type,
      id: item.id,
      name: item.name,
      color: item.color,
    });
    setEditName(item.name || '');
    setEditColor(item.color || '');
  };

  const handleSaveEdit = async () => {
    if (!editingItem || !editName.trim()) {
      toast.error('İsim alanı boş bırakılamaz');
      return;
    }

    setIsSavingEdit(true);
    try {
      const { type, id } = editingItem;
      if (type === 'brand') {
        await elevatorSettingsService.updateBrand(id, { name: editName });
      } else if (type === 'company') {
        await elevatorSettingsService.updateMaintenanceCompany(id, { name: editName });
      } else if (type === 'type') {
        await elevatorSettingsService.updateType(id, { name: editName });
      } else if (type === 'status') {
        await elevatorSettingsService.updateStatus(id, { name: editName });
      } else if (type === 'label') {
        await elevatorSettingsService.updateLabel(id, { name: editName, color: editColor });
      }

      toast.success('Güncelleme başarılı');
      setEditingItem(null);
      loadAll();
    } catch (e: any) {
      toast.error(e.message || 'Güncellenemedi');
    } finally {
      setIsSavingEdit(false);
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
            <TableHead className="w-28 text-right">İşlemler</TableHead>
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
              <TableCell className="text-right space-x-1">
                <Button variant="ghost" size="icon" title="Düzenle" onClick={() => handleStartEdit(type, item)}>
                  <Edit className="w-4 h-4 text-blue-500" />
                </Button>
                <Button variant="ghost" size="icon" title="Sil" onClick={() => handleDelete(type, item.id)}>
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
          {(!data || data.length === 0) && <TableRow><TableCell colSpan={colorSetter ? 4 : 3} className="text-center py-4">Kayıt bulunamadı.</TableCell></TableRow>}
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

      {/* Düzenleme (Edit) Modalı */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem?.type === 'brand' && 'Marka Düzenle'}
              {editingItem?.type === 'company' && 'Bakım Firması Düzenle'}
              {editingItem?.type === 'type' && 'Tür Düzenle'}
              {editingItem?.type === 'status' && 'Durum Düzenle'}
              {editingItem?.type === 'label' && 'Etiket Düzenle'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <label className="text-sm font-medium">Adı / Tanımı</label>
              <Input
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                placeholder="İsim giriniz..."
              />
            </div>
            {editingItem?.type === 'label' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Renk Kodu</label>
                <div className="flex items-center gap-2">
                  <Input
                    value={editColor}
                    onChange={(e) => setEditColor(e.target.value)}
                    placeholder="örn: #ef4444"
                  />
                  {editColor && (
                    <div
                      className="w-8 h-8 rounded border shadow-sm shrink-0"
                      style={{ backgroundColor: editColor }}
                    />
                  )}
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)} disabled={isSavingEdit}>
              İptal
            </Button>
            <Button onClick={handleSaveEdit} disabled={isSavingEdit}>
              {isSavingEdit ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

