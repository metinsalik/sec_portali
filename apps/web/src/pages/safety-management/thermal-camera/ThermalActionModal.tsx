import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  AlertTriangle,
  Calendar,
  UserCheck,
  CheckCircle2,
  Clock,
  Flame,
  ShieldAlert,
  Save,
  X
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  thermalInspectionService,
  type ThermalInspectionItem
} from '@/services/thermal-inspection.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: ThermalInspectionItem | null;
  onActionSaved: (updatedItem: ThermalInspectionItem) => void;
}

export const ThermalActionModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  onActionSaved
}) => {
  if (!item) return null;

  // Initial State derived from item
  const [actionPlan, setActionPlan] = useState(item.actionPlan || item.actionTaken || '');
  const [actionDueDate, setActionDueDate] = useState<string>(() => {
    if (item.actionDueDate) {
      try {
        return format(new Date(item.actionDueDate), 'yyyy-MM-dd');
      } catch (e) {
        return '';
      }
    }
    return '';
  });
  const [actionAssignee, setActionAssignee] = useState(item.actionAssignee || '');
  const [actionStatus, setActionStatus] = useState<string>(item.actionStatus || 'BEKLIYOR');
  const [actionNotes, setActionNotes] = useState(item.actionNotes || '');
  const [panelStatus, setPanelStatus] = useState<string>(item.status || 'Normal');
  const [panelPriority, setPanelPriority] = useState<string>(item.priority || 'Düşük');
  const [photos, setPhotos] = useState<string[]>(Array.isArray(item.actionPhotos) ? (item.actionPhotos as string[]) : []);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Status mapping
  const isUrgent = item.priority === 'Acil' || (item.measuredTemp && item.measuredTemp >= 60);

  // When user clicks 'TAMAMLANDI', auto-suggest changing panel status to 'Normal'
  const handleStatusChange = (newActionStatus: string) => {
    setActionStatus(newActionStatus);
    if (newActionStatus === 'TAMAMLANDI') {
      setPanelStatus('Normal');
      setPanelPriority('Düşük');
    }
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsUploadingPhoto(true);
    try {
      const facId = item.session?.facilityId || 'all';
      const res = await thermalInspectionService.uploadPhotos(item.id, facId, files);
      if (res) {
        const added = res.newUrls && res.newUrls.length > 0 
          ? res.newUrls 
          : (res.photoUrls ? res.photoUrls.filter(u => !photos.includes(u)) : []);
        if (added.length > 0) {
          setPhotos(prev => [...prev, ...added]);
          toast.success(`${added.length} adet fotoğraf eklendi.`);
        }
      }
    } catch (err: any) {
      console.error(err);
      toast.error('Fotoğraf yüklenemedi.');
    } finally {
      setIsUploadingPhoto(false);
      // Reset input value so same file can be re-selected if needed
      e.target.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionPlan.trim()) {
      toast.error('Lütfen yapılacak aksiyon planını belirtiniz.');
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await thermalInspectionService.updateItemAction(item.id, {
        actionPlan: actionPlan.trim(),
        actionDueDate: actionDueDate ? new Date(actionDueDate).toISOString() : null,
        actionAssignee: actionAssignee.trim() || undefined,
        actionStatus,
        actionNotes: actionNotes.trim() || undefined,
        actionPhotos: photos,
        status: panelStatus,
        priority: panelPriority,
        actionCompletedDate: actionStatus === 'TAMAMLANDI' ? new Date().toISOString() : null
      });

      toast.success('Pano aksiyon ve durum güncellemesi başarıyla kaydedildi.');
      onActionSaved(updated);
      onClose();
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Aksiyon kaydedilirken hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto p-0">
        {/* Header */}
        <div className={`p-5 text-white ${isUrgent ? 'bg-gradient-to-r from-rose-700 to-red-800' : 'bg-gradient-to-r from-indigo-900 to-slate-900'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {isUrgent ? (
                <Flame className="w-5 h-5 text-white animate-pulse" />
              ) : (
                <ShieldAlert className="w-5 h-5 text-indigo-300" />
              )}
              <DialogTitle className="text-base font-bold text-white">
                Pano İyileştirme ve Aksiyon Planı
              </DialogTitle>
            </div>
            <Badge className={`${isUrgent ? 'bg-rose-950/80 text-rose-200 border-rose-400' : 'bg-white/20 text-white'}`}>
              {item.panelName}
            </Badge>
          </div>
          <p className="text-xs text-slate-200 mt-1">
            Ölçülen Sıcaklık: <strong>{item.measuredTemp} °C</strong> | Durum: <strong>{item.status || item.priority}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {/* Tespit Edilen Risk Özeti */}
          {item.detectedRisk && (
            <div className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs">
              <span className="font-semibold text-amber-800 dark:text-amber-400 block mb-0.5">
                Mevcut Tespit / Risk:
              </span>
              <p className="text-slate-700 dark:text-slate-300">{item.detectedRisk}</p>
            </div>
          )}

          {/* Aksiyon Durumu Seçimi */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Aksiyon Takip Aşaması
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setActionStatus('BEKLIYOR')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  actionStatus === 'BEKLIYOR'
                    ? 'border-amber-500 bg-amber-50 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 ring-2 ring-amber-400'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800'
                }`}
              >
                <Clock className="w-3.5 h-3.5 mx-auto mb-1 text-amber-500" />
                Bekliyor
              </button>
              <button
                type="button"
                onClick={() => setActionStatus('DEVAM_EDIYOR')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  actionStatus === 'DEVAM_EDIYOR'
                    ? 'border-blue-500 bg-blue-50 text-blue-800 dark:bg-blue-950/50 dark:text-blue-300 ring-2 ring-blue-400'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800'
                }`}
              >
                <AlertTriangle className="w-3.5 h-3.5 mx-auto mb-1 text-blue-500" />
                İşlemde
              </button>
              <button
                type="button"
                onClick={() => setActionStatus('TAMAMLANDI')}
                className={`py-2 px-3 text-xs font-medium rounded-lg border text-center transition-all ${
                  actionStatus === 'TAMAMLANDI'
                    ? 'border-emerald-500 bg-emerald-50 text-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300 ring-2 ring-emerald-400'
                    : 'border-slate-200 hover:bg-slate-50 dark:border-slate-800'
                }`}
              >
                <CheckCircle2 className="w-3.5 h-3.5 mx-auto mb-1 text-emerald-500" />
                Tamamlandı
              </button>
            </div>
          </div>

          {/* Planlanan Aksiyon */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Alınacak Aksiyon / Yapılacak Düzeltici İşlem *
            </label>
            <Textarea
              rows={3}
              placeholder="Örn: Gevşek klemens bağlantıları tork anahtarı ile sıkılacak, aşırı ısınan faz dağılımı dengelenecek veya şalter yenilenecek..."
              value={actionPlan}
              onChange={(e) => setActionPlan(e.target.value)}
              className="text-xs"
              required
            />
          </div>

          {/* Termin Tarihi & Sorumlu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Termin / Hedef Tarih
              </label>
              <div className="relative">
                <Calendar className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type="date"
                  value={actionDueDate}
                  onChange={(e) => setActionDueDate(e.target.value)}
                  className="text-xs pl-9"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Aksiyon Sorumlusu (Teknisyen/Birim)
              </label>
              <div className="relative">
                <UserCheck className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <Input
                  type="text"
                  placeholder="Örn: Elektrik Bakım Ekibi / Ahmet K."
                  value={actionAssignee}
                  onChange={(e) => setActionAssignee(e.target.value)}
                  className="text-xs pl-9"
                />
              </div>
            </div>
          </div>

          {/* Pano Durumu Değiştirme (İş bitince Normale geçiş veya Durum Ayarı) */}
          <div className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pano Durumu Güncelle
              </label>
              <span className="text-[10px] text-slate-400">
                (İş tamamlandığında panoyu doğrudan <strong>Normal</strong> durumuna alabilirsiniz)
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Pano Durumu:</span>
                <select
                  value={panelStatus}
                  onChange={(e) => setPanelStatus(e.target.value)}
                  className="w-full text-xs h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                >
                  <option value="Normal">🟢 Normal (Sorun Çözüldü)</option>
                  <option value="Takip">🟡 Takip (İzlemede Tut)</option>
                  <option value="Uygunsuz">🟠 Uygunsuz (Standart Dışı)</option>
                  <option value="Kritik">🔴 Kritik / Acil</option>
                </select>
              </div>

              <div>
                <span className="text-[11px] text-slate-500 block mb-1">Öncelik Derecesi:</span>
                <select
                  value={panelPriority}
                  onChange={(e) => setPanelPriority(e.target.value)}
                  className="w-full text-xs h-8 px-2.5 rounded-md border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 font-medium"
                >
                  <option value="Düşük">Düşük</option>
                  <option value="Orta">Orta</option>
                  <option value="Yüksek">Yüksek</option>
                  <option value="Acil">Acil</option>
                </select>
              </div>
            </div>
          </div>

          {/* Düzeltme / Müdahale Fotoğrafları (Opsiyonel) */}
          <div className="space-y-2 pt-1 border-t border-slate-100 dark:border-slate-800">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                <span>Düzeltme & Termal Fotoğrafları (Opsiyonel)</span>
                <Badge variant="outline" className="text-[10px]">{photos.length} Adet</Badge>
              </label>
              <label className="cursor-pointer inline-flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  disabled={isUploadingPhoto}
                />
                {isUploadingPhoto ? 'Yükleniyor...' : '+ Fotoğraf Ekle'}
              </label>
            </div>

            {photos.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {photos.map((url, i) => (
                  <div key={i} className="relative group w-14 h-14 rounded-lg overflow-hidden border border-slate-200 shadow-sm bg-slate-100 dark:bg-slate-800">
                    <img
                      src={url}
                      alt={`Aksiyon foto ${i+1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.currentTarget;
                        // If path had facility folder that failed, try fallback to Genel
                        if (!target.dataset.triedFallback && url.includes('/electric-infrastructure/')) {
                          target.dataset.triedFallback = 'true';
                          const fileName = url.split('/').pop();
                          target.src = `/uploads/electric-infrastructure/Genel/thermal/${fileName}`;
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setPhotos(photos.filter((_, idx) => idx !== i))}
                      className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[10px]"
                    >
                      Kaldır
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-[11px] text-slate-400 italic">
                Aksiyon sonrası çekilen termal kamera veya pano fotoğrafını buraya ekleyebilirsiniz.
              </p>
            )}
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs"
              disabled={isSubmitting}
            >
              Vazgeç
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={isSubmitting}
              className="text-xs bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              {isSubmitting ? 'Kaydediliyor...' : 'Aksiyonu Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
