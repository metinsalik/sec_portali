import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
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
  ZoomIn,
  TrendingUp,
  Thermometer,
  Calendar,
  Flame,
  Clock,
  Save
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
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
  panelHistory?: ThermalInspectionItem[];
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
  panelHistory = [],
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

  // Düzenleme (Edit) Durumu
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState({
    measuredTemp: '',
    ambientTemp: '',
    status: '',
    priority: '',
    buildingLocation: '',
    floorSection: '',
    measurementPoint: '',
    equipmentConnection: '',
    detectedRisk: '',
    actionPlan: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  // Sync localItem when item prop changes
  useEffect(() => { 
    setLocalItem(item); 
    if (item) {
      setEditForm({
        measuredTemp: item.measuredTemp != null ? String(item.measuredTemp) : '',
        ambientTemp: item.ambientTemp != null ? String(item.ambientTemp) : '',
        status: item.status || 'Normal',
        priority: item.priority || 'Düşük',
        buildingLocation: item.buildingLocation || '',
        floorSection: item.floorSection || '',
        measurementPoint: item.measurementPoint || '',
        equipmentConnection: item.equipmentConnection || '',
        detectedRisk: item.detectedRisk || '',
        actionPlan: item.actionPlan || item.actionTaken || ''
      });
      setIsEditing(false);
    }
  }, [item]);

  const photos = localItem?.photoUrls || [];
  const remainingSlots = MAX_PHOTOS - photos.length;
  const canUpload = remainingSlots > 0 && !!facilityId;

  // Tüm ölçümler listesi (Verilen panelHistory veya tek localItem)
  const fullPanelHistory = useMemo(() => {
    if (panelHistory && panelHistory.length > 0) {
      return [...panelHistory].sort((a, b) => {
        const da = a.measurementDate ? new Date(a.measurementDate).getTime() : 0;
        const db = b.measurementDate ? new Date(b.measurementDate).getTime() : 0;
        return da - db;
      });
    }
    return localItem ? [localItem] : [];
  }, [panelHistory, localItem]);

  // Grafik verisi: Aynı tarihteki tekrarlayan ölçümleri tekilleştir / tepe değerini al
  // Böylece aynı gün içindeki 85 adet kopya kayıt testere dişi şeklinde görünmez, temiz ve anlamlı bir trend oluşur
  const aggregatedChartData = useMemo(() => {
    if (fullPanelHistory.length <= 1) return [];

    const dateMap = new Map<string, {
      dateKey: string;
      label: string;
      measuredTemp: number;
      ambientTemp: number;
      deltaTemp: number;
      status: string;
      count: number;
    }>();

    fullPanelHistory.forEach((h, idx) => {
      const d = h.session?.reportDate || h.measurementDate || h.createdAt;
      const dKey = d ? new Date(d).toISOString().slice(0, 10) : `idx_${idx}`;
      const dFmt = d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : `#${idx+1}`;
      const mVal = h.measuredTemp ?? 0;
      const aVal = h.ambientTemp ?? 0;
      const dTVal = h.deltaTemp ?? (mVal - aVal);

      if (!dateMap.has(dKey)) {
        dateMap.set(dKey, {
          dateKey: dKey,
          label: dFmt,
          measuredTemp: mVal,
          ambientTemp: aVal,
          deltaTemp: dTVal,
          status: h.status || 'Normal',
          count: 1
        });
      } else {
        const exist = dateMap.get(dKey)!;
        // Aynı gün birden çok ölçüm varsa maksimum ölçülen sıcaklığı esas al (pikteki durum)
        if (mVal > exist.measuredTemp) {
          exist.measuredTemp = mVal;
          exist.ambientTemp = aVal;
          exist.deltaTemp = dTVal;
          exist.status = h.status || exist.status;
        }
        exist.count += 1;
      }
    });

    const list = Array.from(dateMap.values());
    // Eğer tüm kayıtlar sadece tek bir güne aitse ve birden fazla kayıt varsa, saat bazlı veya ilk 10 noktayı göster
    if (list.length === 1 && fullPanelHistory.length > 1) {
      // Saat veya ölçüm sırasına göre son 10 ölçümü temiz şekilde ver
      return fullPanelHistory.slice(-10).map((h, i) => {
        const d = h.session?.reportDate || h.measurementDate || h.createdAt;
        const dFmt = d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit' }) : `#${i+1}`;
        const timeFmt = h.controlTime ? ` ${h.controlTime}` : ` #${i+1}`;
        return {
          label: `${dFmt}${timeFmt}`,
          measuredTemp: h.measuredTemp ?? 0,
          ambientTemp: h.ambientTemp ?? 0,
          deltaTemp: h.deltaTemp ?? 0,
          status: h.status || 'Normal'
        };
      });
    }

    return list;
  }, [fullPanelHistory]);

  // Düzenleme Formunu Kaydet
  const handleSaveEdit = async () => {
    if (!localItem) return;
    setIsSaving(true);
    try {
      const mTemp = editForm.measuredTemp !== '' ? parseFloat(editForm.measuredTemp) : null;
      const aTemp = editForm.ambientTemp !== '' ? parseFloat(editForm.ambientTemp) : null;
      const updated = await thermalInspectionService.updateItem(localItem.id, {
        measuredTemp: mTemp,
        ambientTemp: aTemp,
        status: editForm.status,
        priority: editForm.priority,
        buildingLocation: editForm.buildingLocation,
        floorSection: editForm.floorSection,
        measurementPoint: editForm.measurementPoint,
        equipmentConnection: editForm.equipmentConnection,
        detectedRisk: editForm.detectedRisk,
        actionPlan: editForm.actionPlan
      });
      setLocalItem(updated);
      onItemUpdated?.(updated);
      setIsEditing(false);
      toast.success('Pano ölçüm bilgileri başarıyla güncellendi.');
    } catch (err: any) {
      toast.error(err.message || 'Güncelleme başarısız oldu.');
    } finally {
      setIsSaving(false);
    }
  };

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
              <Button size="sm" variant="outline" onClick={() => setIsEditing(v => !v)}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-8 gap-1.5">
                <Edit2 className="w-3.5 h-3.5" />
                {isEditing ? 'Vazgeç' : 'Düzenle'}
              </Button>
            </div>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="p-6 space-y-6">

          {/* ══════════════════════════════════════════════════════ */}
          {/* ── BİRDEN FAZLA ÖLÇÜM VARSA: ISI DAĞILIM VE TREND GRAFİĞİ ── */}
          {/* ══════════════════════════════════════════════════════ */}
          {fullPanelHistory.length > 1 && (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-slate-900 to-indigo-950 text-white shadow-md border border-indigo-900/40">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-orange-400" />
                  <h4 className="text-xs font-bold text-slate-100 uppercase tracking-wider">
                    Pano Isı Dağılımı ve Geçmiş Ölçüm Eğilimi ({fullPanelHistory.length} Ölçüm)
                  </h4>
                </div>
                <div className="flex items-center gap-3 text-[11px] text-slate-300">
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                    Ölçülen Sıcaklık
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                    Ortam Sıcaklığı
                  </span>
                </div>
              </div>

              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={aggregatedChartData.length > 0 ? aggregatedChartData : fullPanelHistory.map((h, i) => {
                      const d = h.session?.reportDate || h.measurementDate || h.createdAt;
                      const dFmt = d ? new Date(d).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: '2-digit' }) : `#${i+1}`;
                      return {
                        label: dFmt,
                        measuredTemp: h.measuredTemp ?? 0,
                        ambientTemp: h.ambientTemp ?? 0,
                        deltaTemp: h.deltaTemp ?? 0,
                        status: h.status || 'Normal'
                      };
                    })}
                    margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorTempModal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f97316" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#f97316" stopOpacity={0.05}/>
                      </linearGradient>
                      <linearGradient id="colorAmbientModal" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.6} />
                    <XAxis dataKey="label" stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} />
                    <YAxis stroke="#94a3b8" tick={{ fontSize: 10, fill: '#cbd5e1' }} unit="°" />
                    <RechartsTooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const d = payload[0].payload;
                          return (
                            <div className="bg-slate-900 border border-slate-700 text-white p-2.5 rounded-lg shadow-xl text-xs space-y-1">
                              <p className="font-bold border-b border-slate-800 pb-1 text-slate-300">{d.label}</p>
                              <p className="text-orange-400 font-mono font-bold">Ölçülen: {d.measuredTemp} °C</p>
                              <p className="text-slate-400 font-mono">Ortam: {d.ambientTemp} °C</p>
                              <p className="text-amber-300 font-mono">ΔT Fark: {d.deltaTemp} °C</p>
                              <p className="text-indigo-300 text-[10px]">Durum: {d.status}</p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="3 3" label={{ value: '50°C Eşik', fill: '#ef4444', fontSize: 9 }} />
                    <Area
                      type="monotone"
                      dataKey="measuredTemp"
                      stroke="#ea580c"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#colorTempModal)"
                    />
                    <Area
                      type="monotone"
                      dataKey="ambientTemp"
                      stroke="#94a3b8"
                      strokeWidth={1.5}
                      strokeDasharray="2 2"
                      fillOpacity={1}
                      fill="url(#colorAmbientModal)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* ══════════════════════════════════════════════════════ */}
          {/* ── DÜZENLEME FORMU VEYA GÖSTERİM KARTLARI ── */}
          {/* ══════════════════════════════════════════════════════ */}
          {isEditing ? (
            <div className="p-4 rounded-xl border border-indigo-200 dark:border-indigo-900/50 bg-indigo-50/20 dark:bg-indigo-950/20 space-y-4">
              <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
                <h4 className="text-xs font-bold text-indigo-900 dark:text-indigo-200 uppercase flex items-center gap-1.5">
                  <Edit2 className="w-3.5 h-3.5 text-indigo-600" />
                  Ölçüm Verilerini Düzenle
                </h4>
                <span className="text-[11px] text-slate-500">Değişiklikleri kaydedip anında uygulayın</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">Ölçülen Sıcaklık (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editForm.measuredTemp}
                    onChange={(e) => setEditForm({ ...editForm, measuredTemp: e.target.value })}
                    className="h-8 text-xs font-mono font-bold mt-1 bg-white dark:bg-slate-800"
                    placeholder="Örn: 48.5"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">Ortam Sıcaklığı (°C)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={editForm.ambientTemp}
                    onChange={(e) => setEditForm({ ...editForm, ambientTemp: e.target.value })}
                    className="h-8 text-xs font-mono mt-1 bg-white dark:bg-slate-800"
                    placeholder="Örn: 22.0"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">Durum</Label>
                  <select
                    value={editForm.status}
                    onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                    className="w-full h-8 text-xs rounded-md border border-input bg-white dark:bg-slate-800 px-2 mt-1"
                  >
                    <option value="Normal">Normal</option>
                    <option value="Takip">Takip / Dikkat</option>
                    <option value="Uygunsuz">Uygunsuz</option>
                    <option value="Acil">Acil / Kritik</option>
                  </select>
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">Öncelik</Label>
                  <select
                    value={editForm.priority}
                    onChange={(e) => setEditForm({ ...editForm, priority: e.target.value })}
                    className="w-full h-8 text-xs rounded-md border border-input bg-white dark:bg-slate-800 px-2 mt-1"
                  >
                    <option value="Düşük">Düşük</option>
                    <option value="Orta">Orta</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Acil">Acil</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">Lokasyon / Kat</Label>
                  <Input
                    value={editForm.floorSection}
                    onChange={(e) => setEditForm({ ...editForm, floorSection: e.target.value })}
                    className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                    placeholder="Örn: -1. Bodrum Kat"
                  />
                </div>
                <div>
                  <Label className="text-[11px] font-semibold text-slate-600">Ekipman / Bağlantı Noktası</Label>
                  <Input
                    value={editForm.equipmentConnection}
                    onChange={(e) => setEditForm({ ...editForm, equipmentConnection: e.target.value })}
                    className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                    placeholder="Örn: Ana Giriş Şalteri Çıkışı"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Tespit Edilen Risk / Açıklama</Label>
                <Textarea
                  value={editForm.detectedRisk}
                  onChange={(e) => setEditForm({ ...editForm, detectedRisk: e.target.value })}
                  className="text-xs mt-1 bg-white dark:bg-slate-800 h-16"
                  placeholder="Isınma kaynağı veya gözlenen durum..."
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
                <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-xs h-8">
                  İptal
                </Button>
                <Button
                  size="sm"
                  onClick={handleSaveEdit}
                  disabled={isSaving}
                  className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 font-semibold"
                >
                  <Save className="w-3.5 h-3.5" />
                  {isSaving ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
                </Button>
              </div>
            </div>
          ) : (
            <>
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
            </>
          )}

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

