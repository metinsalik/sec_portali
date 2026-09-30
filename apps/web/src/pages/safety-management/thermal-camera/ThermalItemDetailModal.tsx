import React, { useRef, useEffect, useCallback } from 'react';
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
  AlertTriangle,
  CheckCircle2,
  Camera,
  Layers,
  Edit2,
  X,
  Upload,
  Trash2,
  ImagePlus,
  Loader2,
  ZoomIn
} from 'lucide-react';
import { toast } from 'sonner';
import type { ThermalInspectionItem } from '@/services/thermal-inspection.service';
import { thermalInspectionService } from '@/services/thermal-inspection.service';

const MAX_PHOTOS = 3;
const COMPRESS_QUALITY = 0.75;
const COMPRESS_MAX_WIDTH = 1600;

// ─── Client-Side Image Compression (Canvas API) ───────────────────────────────
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const ratio = Math.min(1, COMPRESS_MAX_WIDTH / img.width);
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(img.width * ratio);
      canvas.height = Math.round(img.height * ratio);
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const compressed = new File(
            [blob],
            file.name.replace(/\.[^.]+$/, '') + '.jpg',
            { type: 'image/jpeg', lastModified: Date.now() }
          );
          resolve(compressed.size < file.size ? compressed : file);
        },
        'image/jpeg',
        COMPRESS_QUALITY
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  item: ThermalInspectionItem | null;
  facilityId?: string;
  onOpenPhotos?: (item: ThermalInspectionItem) => void;
  onEdit?: (item: ThermalInspectionItem) => void;
  onTakeAction?: (item: ThermalInspectionItem) => void;
  onOpenPanelPage?: (panelName: string) => void;
  onItemUpdated?: (updated: ThermalInspectionItem) => void;
}

export const ThermalItemDetailModal: React.FC<Props> = ({
  isOpen,
  onClose,
  item,
  facilityId,
  onOpenPhotos,
  onEdit,
  onTakeAction,
  onOpenPanelPage,
  onItemUpdated
}) => {
  const [selectedPhoto, setSelectedPhoto] = React.useState<string | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [localItem, setLocalItem] = React.useState<ThermalInspectionItem | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync localItem when item prop changes
  useEffect(() => { setLocalItem(item); }, [item]);

  const photos = localItem?.photoUrls || [];
  const remainingSlots = MAX_PHOTOS - photos.length;
  const canUpload = remainingSlots > 0 && !!facilityId;

  // ── Upload pipeline ───────────────────────────────────────────────────────────
  const uploadFiles = useCallback(async (files: File[]) => {
    if (!localItem || !facilityId) {
      toast.error('Tesis bilgisi eksik, fotoğraf yüklenemiyor.');
      return;
    }
    const imageFiles = files.filter(f => f.type.startsWith('image/'));
    if (imageFiles.length === 0) { toast.error('Lütfen sadece görsel dosyası seçin.'); return; }

    const current = localItem.photoUrls?.length || 0;
    if (current >= MAX_PHOTOS) {
      toast.error(`Maksimum ${MAX_PHOTOS} fotoğraf limitine ulaşıldı.`);
      return;
    }
    const allowed = Math.min(imageFiles.length, MAX_PHOTOS - current);
    const toUpload = imageFiles.slice(0, allowed);
    if (toUpload.length < imageFiles.length) {
      toast.warning(`${imageFiles.length - toUpload.length} fotoğraf atlandı (limit: ${MAX_PHOTOS}).`);
    }

    setIsUploading(true);
    try {
      const compressed = await Promise.all(toUpload.map(compressImage));
      const res = await thermalInspectionService.uploadPhotos(localItem.id, facilityId, compressed);
      const updated = res.item as ThermalInspectionItem;
      setLocalItem(updated);
      onItemUpdated?.(updated);
      toast.success(`${toUpload.length} fotoğraf yüklendi.`);
    } catch (err: any) {
      toast.error(err.response?.data?.error || err.message || 'Fotoğraf yüklenemedi.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
      if (cameraInputRef.current) cameraInputRef.current.value = '';
    }
  }, [localItem, facilityId, onItemUpdated]);

  // ── Delete photo ───────────────────────────────────────────────────────────────
  const handleDeletePhoto = async (photoUrl: string) => {
    if (!localItem) return;
    if (!confirm('Bu görseli silmek istediğinize emin misiniz?')) return;
    try {
      const res = await thermalInspectionService.removePhoto(localItem.id, photoUrl);
      const updated = { ...localItem, photoUrls: res.photoUrls } as ThermalInspectionItem;
      setLocalItem(updated);
      onItemUpdated?.(updated);
      if (selectedPhoto === photoUrl) setSelectedPhoto(null);
      toast.success('Görsel silindi.');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Görsel silinemedi.');
    }
  };

  // ── Paste (Ctrl+V) support ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isOpen) return;
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;
      const imgs: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const f = items[i].getAsFile();
          if (f) imgs.push(f);
        }
      }
      if (imgs.length > 0) { e.preventDefault(); uploadFiles(imgs); }
    };
    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [isOpen, uploadFiles]);

  if (!localItem) return null;

  const fmt = (n: number | null | undefined) => {
    if (n === null || n === undefined || isNaN(n)) return '—';
    return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);
  };

  const isNormalStatus = (localItem.status && localItem.status.toLowerCase().includes('normal')) ||
    (localItem.priority && (localItem.priority.toLowerCase().includes('rutin') || localItem.priority.toLowerCase().includes('düşük')));

  const isAnomalous = !isNormalStatus && (
    (localItem.status && ['uygunsuz', 'kritik', 'dikkat', 'takip', 'acil'].some(s => localItem.status?.toLowerCase().includes(s))) ||
    (localItem.priority && ['acil', 'yüksek'].some(p => localItem.priority?.toLowerCase().includes(p))) ||
    (!localItem.status && localItem.deltaTemp !== null && localItem.deltaTemp !== undefined && localItem.deltaTemp >= 15) ||
    (!localItem.status && localItem.measuredTemp !== null && localItem.measuredTemp !== undefined && localItem.measuredTemp >= 50)
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[92vh] overflow-y-auto bg-white dark:bg-slate-900 border dark:border-slate-800 p-0">

        {/* ── Header Banner ── */}
        <div className={`p-6 text-white ${isAnomalous ? 'bg-gradient-to-r from-rose-900 via-amber-900 to-slate-900' : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900'}`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 font-mono">
                  Sıra No: #{localItem.orderIndex || 1}
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
              <h2 className="text-xl font-bold text-white tracking-tight">{localItem.panelName}</h2>
              <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                <span>{localItem.floorSection || 'Kat Belirtilmemiş'}</span>
                <span>•</span>
                <span>{localItem.buildingLocation || 'Hastane Geneli'}</span>
              </p>
            </div>

            <div className="flex items-center gap-2 flex-wrap justify-end">
              {onOpenPanelPage && (
                <Button size="sm" onClick={() => { onClose(); onOpenPanelPage(localItem.panelName); }}
                  className="bg-white/20 hover:bg-white/30 text-white border border-white/30 text-xs h-8 gap-1.5 font-bold shadow-sm">
                  <Layers className="w-3.5 h-3.5 text-indigo-300" />
                  Pano Yaşam Döngüsü
                </Button>
              )}
              {onTakeAction && (
                <Button size="sm" onClick={() => { onClose(); onTakeAction(localItem); }}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 shadow-sm font-semibold">
                  <Edit2 className="w-3.5 h-3.5" />
                  Aksiyon Al
                </Button>
              )}
              {onEdit && (
                <Button size="sm" variant="outline" onClick={() => { onClose(); onEdit(localItem); }}
                  className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-8 gap-1.5">
                  <Edit2 className="w-3.5 h-3.5" />
                  Düzenle
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-6">

          {/* Temperature Metrics */}
          <div className="grid grid-cols-3 gap-3">
            <div className={`p-4 rounded-xl border text-center ${
              (localItem.measuredTemp || 0) >= 50
                ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-400'
                : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200'
            }`}>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Ölçülen Sıcaklık</span>
              <span className="text-2xl font-black font-mono mt-1 block">{fmt(localItem.measuredTemp)} °C</span>
            </div>
            <div className="p-4 rounded-xl border bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700 text-center text-slate-800 dark:text-slate-200">
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Ortam Sıcaklığı</span>
              <span className="text-2xl font-black font-mono mt-1 block">{fmt(localItem.ambientTemp)} °C</span>
            </div>
            <div className={`p-4 rounded-xl border text-center ${
              (localItem.deltaTemp || 0) >= 15
                ? 'bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/40 text-amber-700 dark:text-amber-400 font-bold'
                : 'bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-400'
            }`}>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Fark (ΔT = Ölçüm - Ortam)</span>
              <span className="text-2xl font-black font-mono mt-1 block">{fmt(localItem.deltaTemp)} °C</span>
            </div>
          </div>

          {/* Details Table */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            <div className="p-3 grid grid-cols-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Ekipman / Bağlantı Noktası</span>
              <span className="col-span-2 font-semibold text-slate-800 dark:text-slate-200">{localItem.equipmentConnection || '—'}</span>
            </div>
            <div className="p-3 grid grid-cols-3">
              <span className="text-slate-500 font-medium">Ölçüm Noktası</span>
              <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">{localItem.measurementPoint || '—'}</span>
            </div>
            <div className="p-3 grid grid-cols-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Ölçüm Tarihi ve Saati</span>
              <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200">
                {localItem.measurementDate ? new Date(localItem.measurementDate).toLocaleDateString('tr-TR') : '—'} {localItem.controlTime ? `(Saat: ${localItem.controlTime})` : ''}
              </span>
            </div>
            <div className="p-3 grid grid-cols-3">
              <span className="text-slate-500 font-medium">Durum ve Öncelik</span>
              <div className="col-span-2 flex items-center gap-2">
                <Badge variant="outline" className={`${
                  (localItem.status || '').toLowerCase() === 'normal'
                    ? 'border-emerald-300 text-emerald-700 bg-emerald-50'
                    : 'border-amber-300 text-amber-700 bg-amber-50'
                }`}>
                  {localItem.status || 'Normal'}
                </Badge>
                <Badge variant="outline" className="border-slate-300 text-slate-700">
                  {localItem.priority || 'Rutin'}
                </Badge>
              </div>
            </div>
            <div className="p-3 grid grid-cols-3 bg-slate-50/50 dark:bg-slate-800/40">
              <span className="text-slate-500 font-medium">Tespit Edilen Risk / Açıklama</span>
              <span className="col-span-2 font-medium text-slate-800 dark:text-slate-200 leading-relaxed">
                {localItem.detectedRisk || 'Anormal ısınma veya risk tespit edilmedi.'}
              </span>
            </div>
            <div className="p-3 grid grid-cols-3 bg-indigo-50/30 dark:bg-indigo-950/20">
              <span className="text-indigo-950 dark:text-indigo-300 font-bold flex items-center gap-1">Aksiyon &amp; Termin</span>
              <div className="col-span-2 space-y-1">
                <p className="font-semibold text-slate-800 dark:text-slate-200">
                  {localItem.actionPlan || localItem.actionTaken || 'Henüz planlanmış aksiyon bulunmuyor.'}
                </p>
                <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-500 mt-1">
                  {localItem.actionDueDate && (
                    <span>Termin: <strong>{new Date(localItem.actionDueDate).toLocaleDateString('tr-TR')}</strong></span>
                  )}
                  {localItem.actionAssignee && (
                    <span>Sorumlu: <strong>{localItem.actionAssignee}</strong></span>
                  )}
                  {localItem.actionStatus && (
                    <Badge variant="outline" className="text-[10px]">{localItem.actionStatus}</Badge>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════ */}
          {/* ── INLINE PHOTO UPLOAD SECTION ── */}
          {/* ══════════════════════════════════════════════════════ */}
          <div className="space-y-3">

            {/* Section Header */}
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
                <Camera className="w-4 h-4 text-indigo-600" />
                Termal Kamera Görselleri
                <Badge
                  variant="outline"
                  className={`text-[11px] px-2 py-0 font-bold ${
                    photos.length >= MAX_PHOTOS
                      ? 'border-rose-400 text-rose-600 bg-rose-50 dark:bg-rose-950/30'
                      : 'border-emerald-400 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/20'
                  }`}
                >
                  {photos.length} / {MAX_PHOTOS}
                </Badge>
              </h4>
              <span className="text-[11px] text-slate-400 italic">Maks. {MAX_PHOTOS} fotoğraf • Otomatik sıkıştırma</span>
            </div>

            {/* Hidden file inputs */}
            <input ref={fileInputRef} type="file" multiple accept="image/*" className="hidden"
              onChange={(e) => { if (e.target.files?.length) uploadFiles(Array.from(e.target.files)); }} />
            <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden"
              onChange={(e) => { if (e.target.files?.length) uploadFiles(Array.from(e.target.files)); }} />

            {/* Drop Zone */}
            {canUpload && (
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(e) => {
                  e.preventDefault();
                  setDragOver(false);
                  const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
                  if (files.length) uploadFiles(files);
                  else toast.error('Sadece görsel dosyaları kabul edilir.');
                }}
                onClick={() => !isUploading && fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-xl p-5 text-center transition-all cursor-pointer select-none ${
                  dragOver
                    ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 scale-[1.01]'
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 hover:bg-slate-50/60 dark:hover:bg-slate-800/30'
                }`}
              >
                {isUploading ? (
                  <div className="flex flex-col items-center gap-2 py-2">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                    <p className="text-xs text-slate-500 font-medium">Sıkıştırılıyor ve yükleniyor...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/40 flex items-center justify-center">
                      <ImagePlus className="w-6 h-6 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                        Görseli buraya sürükleyin veya tıklayın
                      </p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        JPG, PNG, WEBP &nbsp;·&nbsp; Ctrl+V ile yapıştır &nbsp;·&nbsp; {remainingSlots} slot kaldı
                      </p>
                    </div>
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <Button type="button" size="sm" disabled={isUploading}
                        onClick={() => cameraInputRef.current?.click()}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1.5 h-8 text-xs shadow-sm">
                        <Camera className="w-3.5 h-3.5" />
                        Kamera (Mobil)
                      </Button>
                      <Button type="button" variant="outline" size="sm" disabled={isUploading}
                        onClick={() => fileInputRef.current?.click()}
                        className="gap-1.5 h-8 text-xs border-slate-300 dark:border-slate-600">
                        <Upload className="w-3.5 h-3.5" />
                        Dosya Seç
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Limit reached banner */}
            {!canUpload && facilityId && photos.length >= MAX_PHOTOS && (
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg px-4 py-3 text-xs text-amber-700 dark:text-amber-400 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                Maksimum {MAX_PHOTOS} fotoğraf limitine ulaşıldı. Yeni eklemek için bir tanesini silin.
              </div>
            )}

            {/* No facilityId warning */}
            {!facilityId && (
              <div className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg px-4 py-3 text-xs text-slate-500 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-amber-500" />
                Fotoğraf yüklemek için Termal Kamera sayfasından açınız (tesis bilgisi gereklidir).
              </div>
            )}

            {/* Photo Grid */}
            {photos.length > 0 && (
              <div className={`grid gap-3 ${
                photos.length === 1 ? 'grid-cols-1 max-w-xs' : photos.length === 2 ? 'grid-cols-2' : 'grid-cols-3'
              }`}>
                {photos.map((url, idx) => (
                  <div key={idx}
                    className="relative group rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 aspect-square bg-slate-100 dark:bg-slate-800 shadow-sm">
                    <img
                      src={url}
                      alt={`Termal Fotoğraf #${idx + 1}`}
                      onClick={() => setSelectedPhoto(url)}
                      className="w-full h-full object-cover cursor-zoom-in group-hover:scale-105 transition-transform duration-200"
                      onError={(e) => {
                        const t = e.currentTarget;
                        if (!t.dataset.triedFallback && url.includes('/electric-infrastructure/')) {
                          t.dataset.triedFallback = 'true';
                          t.src = `/uploads/electric-infrastructure/Genel/thermal/${url.split('/').pop()}`;
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                    <button onClick={() => setSelectedPhoto(url)}
                      className="absolute top-2 left-2 w-7 h-7 rounded-lg bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-black/80"
                      title="Büyüt">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => handleDeletePhoto(url)}
                      className="absolute top-2 right-2 w-7 h-7 rounded-lg bg-rose-600/80 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-rose-700"
                      title="Görseli sil">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/70 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">#{idx + 1}</span>
                  </div>
                ))}
              </div>
            )}

            {photos.length === 0 && !isUploading && (
              <div className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
                <Camera className="w-7 h-7 text-slate-200 dark:text-slate-700 mx-auto mb-2" />
                Henüz fotoğraf yüklenmedi.
              </div>
            )}
          </div>
        </div>

        {/* ── Lightbox ── */}
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            className="fixed inset-0 z-[9999] bg-black/88 flex items-center justify-center p-4 backdrop-blur-sm"
          >
            <div className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-2xl p-2 border border-white/20 shadow-2xl">
              <button
                onClick={() => setSelectedPhoto(null)}
                className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/60 hover:bg-black/90 text-white flex items-center justify-center transition-colors z-10"
              >
                <X className="w-5 h-5" />
              </button>
              <img src={selectedPhoto} alt="Termal Kamera Büyütülmüş Görsel"
                className="max-h-[86vh] w-auto mx-auto object-contain rounded-xl" />
            </div>
          </div>
        )}

        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40">
          <Button variant="outline" size="sm" onClick={onClose} className="text-xs">Kapat</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

