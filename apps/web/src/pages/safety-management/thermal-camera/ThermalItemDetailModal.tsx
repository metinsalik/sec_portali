import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Thermometer, 
  MapPin, 
  Clock, 
  Calendar, 
  AlertTriangle, 
  CheckCircle2, 
  Camera, 
  Layers, 
  Zap,
  Edit2,
  X
} from 'lucide-react';
import type { ThermalInspectionItem } from '@/services/thermal-inspection.service';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: ThermalInspectionItem | null;
  onOpenPhotos?: (item: ThermalInspectionItem) => void;
  onEdit?: (item: ThermalInspectionItem) => void;
  onTakeAction?: (item: ThermalInspectionItem) => void;
  onOpenPanelPage?: (panelName: string) => void;
}

export const ThermalItemDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  onOpenPhotos,
  onEdit,
  onTakeAction,
  onOpenPanelPage
}) => {
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);

  if (!item) return null;

  const fmt = (n: number | null | undefined) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);
  };

  const isAnomalous = 
    (item.deltaTemp !== null && item.deltaTemp !== undefined && item.deltaTemp >= 15) ||
    (item.measuredTemp !== null && item.measuredTemp !== undefined && item.measuredTemp >= 50) ||
    (item.status && item.status.toLowerCase() !== 'normal') ||
    (item.priority && item.priority.toLowerCase() === 'acil');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border dark:border-slate-800 p-0">
        {/* Header Header Banner */}
        <div className={`p-6 text-white ${isAnomalous ? 'bg-gradient-to-r from-rose-900 via-amber-900 to-slate-900' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 font-mono">
                  Sıra No: #{item.orderIndex || 1}
                </span>
                {isAnomalous ? (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="w-3 h-3" />
                    Isı Uygunsuzluğu / Dikkat
                  </Badge>
                ) : (
                  <Badge className="bg-emerald-600 text-white gap-1 text-xs">
                    <CheckCircle2 className="w-3 h-3" />
                    Normal Sıcaklık
                  </Badge>
                )}
              </div>
              <h2 className="text-xl font-bold text-white tracking-tight">
                {item.panelName}
              </h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>{item.floorSection || 'Kat Belirtilmemiş'}</span>
                <span>•</span>
                <span>{item.buildingLocation || 'Hastane Geneli'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2">
              {onOpenPanelPage && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onOpenPanelPage(item.panelName);
                  }}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs h-8 gap-1.5 font-bold shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-indigo-300" />
                  Pano Yaşam Döngüsü &amp; Sayfası
                </Button>
              )}
              {onTakeAction && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onTakeAction(item);
                  }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 shadow-sm font-semibold"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Aksiyon Al / Güncelle
                </Button>
              )}
              {onEdit && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onEdit(item);
                  }}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-8 gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  Düzenle
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {/* Temperature Metrics Bar */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border text-center ${
              (item.measuredTemp || 0) >= 50 
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400' 
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Ölçülen Sıcaklık</span>
              <span className="text-2xl font-black font-mono mt-1 block">
                {fmt(item.measuredTemp)} °C
              </span>
            </div>

            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-center text-slate-800 dark:text-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Ortam Sıcaklığı</span>
              <span className="text-2xl font-black font-mono mt-1 block">
                {fmt(item.ambientTemp)} °C
              </span>
            </div>

            <div className={`p-4 rounded-xl border text-center ${
              (item.deltaTemp || 0) >= 15
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-bold'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
            }`}>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Fark (ΔT = Ölçüm - Ortam)</span>
              <span className="text-2xl font-black font-mono mt-1 block">
                {fmt(item.deltaTemp)} °C
              </span>
            </div>
          </div>

          {/* Details Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="p-3 grid grid-cols-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Ekipman / Bağlantı Noktası</span>
              <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">
                {item.equipmentConnection || '—'}
              </span>
            </div>

            <div className="p-3 grid grid-cols-3">
              <span className="text-slate-500 font-medium">Ölçüm Noktası</span>
              <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">
                {item.measurementPoint || '—'}
              </span>
            </div>

            <div className="p-3 grid grid-cols-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Ölçüm Tarihi ve Saati</span>
              <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">
                {item.measurementDate ? new Date(item.measurementDate).toLocaleDateString('tr-TR') : '—'} {item.controlTime ? `(Saat: ${item.controlTime})` : ''}
              </span>
            </div>

            <div className="p-3 grid grid-cols-3">
              <span className="text-slate-500 font-medium">Durum ve Öncelik</span>
              <div className="col-span-2 flex items-center gap-2">
                <Badge variant="outline" className={`${(item.status || '').toLowerCase() === 'normal' ? 'border-emerald-300 text-emerald-700 bg-emerald-50' : 'border-amber-300 text-amber-700 bg-amber-50'}`}>
                  {item.status || 'Normal'}
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  {item.priority || 'Rutin'}
                </Badge>
              </div>
            </div>

            <div className="p-3 grid grid-cols-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Tespit Edilen Risk / Açıklama</span>
              <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {item.detectedRisk || 'Anormal ısınma veya risk tespit edilmedi.'}
              </span>
            </div>

            {/* Aksiyon & Termin Takibi Bölümü */}
            <div className="p-3 grid grid-cols-3 bg-indigo-50/30 dark:bg-indigo-950/20">
              <span className="text-indigo-950 dark:text-indigo-300 font-bold flex items-center gap-1">
                Aksiyon & Termin
              </span>
              <div className="col-span-2 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {item.actionPlan || item.actionTaken || 'Henüz planlanmış aksiyon bulunmuyor.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                  {item.actionDueDate && (
                    <span>Termin: <strong>{new Date(item.actionDueDate).toLocaleDateString('tr-TR')}</strong></span>
                  )}
                  {item.actionAssignee && (
                    <span>Sorumlu: <strong>{item.actionAssignee}</strong></span>
                  )}
                  {item.actionStatus && (
                    <Badge variant="outline" className="text-[10px]">
                      {item.actionStatus}
                    </Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Thermal Photos Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-indigo-600" />
                Termal Kamera Görselleri ({item.photoUrls?.length || 0} / 5)
              </h4>
              {onOpenPhotos && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => {
                    onClose();
                    onOpenPhotos(item);
                  }}
                  className="h-7 text-xs text-indigo-600 border-indigo-200 hover:bg-indigo-50 dark:border-indigo-900"
                >
                  Fotoğraf Ekle / Yönet
                </Button>
              )}
            </div>

            {item.photoUrls && item.photoUrls.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {item.photoUrls.map((url, idx) => (
                  <div
                    key={idx}
                    onClick={() => setSelectedPhoto(url)}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square cursor-pointer hover:shadow-md transition-all bg-slate-100 dark:bg-slate-800"
                  >
                    <img
                      src={url}
                      alt={`Termal Fotoğraf #${idx + 1}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      onError={(e) => {
                        const target = e.currentTarget;
                        if (!target.dataset.triedFallback && url.includes('/electric-infrastructure/')) {
                          target.dataset.triedFallback = 'true';
                          const fileName = url.split('/').pop();
                          target.src = `/uploads/electric-infrastructure/Genel/thermal/${fileName}`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold">
                      Büyütmek İçin Tıkla
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                      #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                <Camera className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-500">Bu pano için henüz termal fotoğraf yüklenmemiş.</p>
                {onOpenPhotos && (
                  <Button
                    size="sm"
                    onClick={() => {
                      onClose();
                      onOpenPhotos(item);
                    }}
                    className="mt-3 text-xs bg-indigo-600 hover:bg-indigo-700 text-white"
                  >
                    Hemen Fotoğraf Ekle
                  </Button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Large Image Lightbox Overlay */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="relative max-w-4xl max-h-[88vh] bg-slate-950 rounded-xl p-2 border border-white/20">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 text-white bg-black/60 hover:bg-black/90 rounded-full"
              >
                <X className="w-5 h-5" />
              </Button>
              <img
                src={selectedPhoto}
                alt="Termal Kamera Büyütülmüş Görsel"
                className="max-h-[82vh] w-auto mx-auto object-contain rounded-lg"
              />
            </div>
          </div>
        )}

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">
            Kapat
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
