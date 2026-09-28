import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { thermalInspectionService, type ThermalInspectionItem } from '@/services/thermal-inspection.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  item: ThermalInspectionItem | null;
  onSaved: (item: ThermalInspectionItem) => void;
}

export const ThermalItemFormModal: React.FC<Props> = ({
  isOpen,
  onClose,
  sessionId,
  item,
  onSaved
}) => {
  const isEdit = !!item;
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    orderIndex: item?.orderIndex || 1,
    buildingLocation: item?.buildingLocation || '',
    floorSection: item?.floorSection || '',
    measurementDate: item?.measurementDate ? item.measurementDate.split('T')[0] : new Date().toISOString().split('T')[0],
    controlTime: item?.controlTime || '',
    panelName: item?.panelName || '',
    measurementPoint: item?.measurementPoint || '',
    equipmentConnection: item?.equipmentConnection || '',
    measuredTemp: item?.measuredTemp != null ? String(item.measuredTemp) : '',
    ambientTemp: item?.ambientTemp != null ? String(item.ambientTemp) : '',
    status: item?.status || 'Normal',
    priority: item?.priority || 'Düşük',
    detectedRisk: item?.detectedRisk || '',
    actionTaken: item?.actionTaken || ''
  });

  React.useEffect(() => {
    if (item) {
      setFormData({
        orderIndex: item.orderIndex || 1,
        buildingLocation: item.buildingLocation || '',
        floorSection: item.floorSection || '',
        measurementDate: item.measurementDate ? item.measurementDate.split('T')[0] : '',
        controlTime: item.controlTime || '',
        panelName: item.panelName || '',
        measurementPoint: item.measurementPoint || '',
        equipmentConnection: item.equipmentConnection || '',
        measuredTemp: item.measuredTemp != null ? String(item.measuredTemp) : '',
        ambientTemp: item.ambientTemp != null ? String(item.ambientTemp) : '',
        status: item.status || 'Normal',
        priority: item.priority || 'Düşük',
        detectedRisk: item.detectedRisk || '',
        actionTaken: item.actionTaken || ''
      });
    } else {
      setFormData({
        orderIndex: 1,
        buildingLocation: '',
        floorSection: '',
        measurementDate: new Date().toISOString().split('T')[0],
        controlTime: '',
        panelName: '',
        measurementPoint: '',
        equipmentConnection: '',
        measuredTemp: '',
        ambientTemp: '',
        status: 'Normal',
        priority: 'Düşük',
        detectedRisk: '',
        actionTaken: ''
      });
    }
  }, [item, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.panelName.trim()) {
      toast.error('Lütfen pano adı giriniz.');
      return;
    }

    setSaving(true);
    try {
      if (isEdit && item) {
        const updated = await thermalInspectionService.updateItem(item.id, {
          ...formData,
          measuredTemp: formData.measuredTemp !== '' ? parseFloat(formData.measuredTemp) : null,
          ambientTemp: formData.ambientTemp !== '' ? parseFloat(formData.ambientTemp) : null
        });
        toast.success('Pano ölçümü güncellendi.');
        onSaved(updated);
      } else {
        const created = await thermalInspectionService.createItem({
          sessionId,
          ...formData,
          measuredTemp: formData.measuredTemp !== '' ? parseFloat(formData.measuredTemp) : null,
          ambientTemp: formData.ambientTemp !== '' ? parseFloat(formData.ambientTemp) : null
        });
        toast.success('Yeni pano ölçümü eklendi.');
        onSaved(created);
      }
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Kayıt sırasında hata oluştu.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl bg-white dark:bg-slate-900 border dark:border-slate-800">
        <DialogHeader>
          <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
            {isEdit ? 'Pano Ölçümünü Düzenle' : 'Yeni Pano Ölçümü Ekle'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs">Sıra No</Label>
              <Input
                type="number"
                value={formData.orderIndex}
                onChange={(e) => setFormData({ ...formData, orderIndex: parseInt(e.target.value) || 1 })}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Lokasyon / Bina</Label>
              <Input
                placeholder="Örn: Ana Bina / A Blok"
                value={formData.buildingLocation}
                onChange={(e) => setFormData({ ...formData, buildingLocation: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Kat / Bölüm</Label>
              <Input
                placeholder="Örn: -1. Kat / Teknik Alan"
                value={formData.floorSection}
                onChange={(e) => setFormData({ ...formData, floorSection: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div>
              <Label className="text-xs font-semibold text-indigo-700 dark:text-indigo-400">Pano No / Adı *</Label>
              <Input
                placeholder="Örn: ADP-01"
                required
                value={formData.panelName}
                onChange={(e) => setFormData({ ...formData, panelName: e.target.value })}
                className="h-8 text-xs mt-1 border-indigo-300 dark:border-indigo-800"
              />
            </div>
            <div>
              <Label className="text-xs">Ölçüm Noktası</Label>
              <Input
                placeholder="Örn: Ana Giriş Şalteri"
                value={formData.measurementPoint}
                onChange={(e) => setFormData({ ...formData, measurementPoint: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Ekipman / Bağlantı</Label>
              <Input
                placeholder="Örn: Bakır Bara / TMŞ"
                value={formData.equipmentConnection}
                onChange={(e) => setFormData({ ...formData, equipmentConnection: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-lg border dark:border-slate-800">
            <div>
              <Label className="text-xs">Ölçüm Tarihi</Label>
              <Input
                type="date"
                value={formData.measurementDate}
                onChange={(e) => setFormData({ ...formData, measurementDate: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs">Kontrol Saati</Label>
              <Input
                placeholder="Örn: 14:30"
                value={formData.controlTime}
                onChange={(e) => setFormData({ ...formData, controlTime: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
            <div>
              <Label className="text-xs font-semibold text-rose-600">Ölçülen Sıcaklık (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="45.5"
                value={formData.measuredTemp}
                onChange={(e) => setFormData({ ...formData, measuredTemp: e.target.value })}
                className="h-8 text-xs mt-1 border-rose-200"
              />
            </div>
            <div>
              <Label className="text-xs">Ortam Sıcaklığı (°C)</Label>
              <Input
                type="number"
                step="0.1"
                placeholder="24.0"
                value={formData.ambientTemp}
                onChange={(e) => setFormData({ ...formData, ambientTemp: e.target.value })}
                className="h-8 text-xs mt-1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Durum</Label>
              <Select
                value={formData.status}
                onValueChange={(val) => setFormData({ ...formData, status: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Dikkat">Dikkat</SelectItem>
                  <SelectItem value="Kritik">Kritik</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Öncelik</Label>
              <Select
                value={formData.priority}
                onValueChange={(val) => setFormData({ ...formData, priority: val })}
              >
                <SelectTrigger className="h-8 text-xs mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Düşük">Düşük</SelectItem>
                  <SelectItem value="Orta">Orta</SelectItem>
                  <SelectItem value="Yüksek">Yüksek</SelectItem>
                  <SelectItem value="Acil">Acil</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div>
            <Label className="text-xs">Tespit / Açıklama</Label>
            <Textarea
              placeholder="Gözlenen anomali, fazlar arası dengesizlik, gevşek klemens vb."
              value={formData.detectedRisk}
              onChange={(e) => setFormData({ ...formData, detectedRisk: e.target.value })}
              className="text-xs mt-1 min-h-[50px]"
            />
          </div>

          <div>
            <Label className="text-xs">Alınan / Önerilen Aksiyon</Label>
            <Textarea
              placeholder="Tork anahtarı ile sıkıldı, yük dağıtımı yapıldı, parça değişimi planlandı vb."
              value={formData.actionTaken}
              onChange={(e) => setFormData({ ...formData, actionTaken: e.target.value })}
              className="text-xs mt-1 min-h-[50px]"
            />
          </div>

          <DialogFooter className="border-t pt-3 dark:border-slate-800">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
              İptal
            </Button>
            <Button type="submit" size="sm" className="bg-indigo-600 hover:bg-indigo-700 text-white" disabled={saving}>
              {saving ? 'Kaydediliyor...' : isEdit ? 'Güncelle' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
