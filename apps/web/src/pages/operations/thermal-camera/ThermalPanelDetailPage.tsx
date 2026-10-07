import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  TrendingUp,
  Thermometer,
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Flame,
  ArrowLeft,
  Camera,
  Layers,
  MapPin,
  Clock,
  Edit2,
  PlusCircle,
  History,
  FileText,
  Save,
  X,
  ChevronLeft,
  ChevronRight,
  ZoomIn,
  RefreshCw,
  SlidersHorizontal,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { toast } from 'sonner';
import {
  thermalInspectionService,
  type ThermalInspectionItem
} from '@/services/thermal-inspection.service';
import { ThermalActionModal } from './ThermalActionModal';
import { ThermalItemDetailModal } from './ThermalItemDetailModal';

interface Props {
  panelName: string;
  facilityId?: string;
  facilityName?: string;
  onBack: () => void;
  onTakeAction?: (item: ThermalInspectionItem) => void;
}

export const ThermalPanelDetailPage: React.FC<Props> = ({
  panelName,
  facilityId,
  facilityName = 'Tesis',
  onBack
}) => {
  const [history, setHistory] = useState<ThermalInspectionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedActionItem, setSelectedActionItem] = useState<ThermalInspectionItem | null>(null);
  const [selectedDetailItem, setSelectedDetailItem] = useState<ThermalInspectionItem | null>(null);

  // Sekmeler / Görünüm modları: 'TIMELINE' | 'TABLE'
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'TABLE'>('TIMELINE');

  // Sayfalama (Pagination) - Sonsuz scroll yerine
  const [currentPage, setCurrentPage] = useState<number>(1);
  const PAGE_SIZE = 5;

  // Hızlı Tekil Yeni Ölçüm Ekleme Paneli Aç/Kapa
  const [showAddMeasurement, setShowAddMeasurement] = useState<boolean>(false);
  const [isAdding, setIsAdding] = useState<boolean>(false);
  const [newMeasurementForm, setNewMeasurementForm] = useState({
    measuredTemp: '',
    ambientTemp: '22.0',
    measurementDate: new Date().toISOString().split('T')[0],
    controlTime: `${String(new Date().getHours()).padStart(2, '0')}:${String(new Date().getMinutes()).padStart(2, '0')}`,
    buildingLocation: '',
    floorSection: '',
    equipmentConnection: '',
    measurementPoint: '1 Metre',
    status: 'Normal',
    priority: 'Düşük',
    detectedRisk: '',
    actionPlan: ''
  });

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await thermalInspectionService.getPanelHistory(panelName, facilityId);
      const list = Array.isArray(data) ? data : [];
      setHistory(list);
      // En son ölçümün konum ve ekipman bilgilerini varsayılan olarak form doldurmaya al
      if (list.length > 0) {
        const last = list[list.length - 1];
        setNewMeasurementForm(prev => ({
          ...prev,
          buildingLocation: last.buildingLocation || prev.buildingLocation,
          floorSection: last.floorSection || prev.floorSection,
          equipmentConnection: last.equipmentConnection || prev.equipmentConnection,
          measurementPoint: last.measurementPoint || prev.measurementPoint
        }));
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [panelName, facilityId]);

  // Kronolojik sıralı liste
  const sortedHistory = useMemo(() => {
    return [...history].sort((a, b) => {
      const da = a.measurementDate ? new Date(a.measurementDate).getTime() : 0;
      const db = b.measurementDate ? new Date(b.measurementDate).getTime() : 0;
      return da - db;
    });
  }, [history]);

  // Sayfalanmış liste (en yeniden en eskiye gösterim)
  const reverseHistory = useMemo(() => [...sortedHistory].reverse(), [sortedHistory]);
  const totalPages = Math.ceil(reverseHistory.length / PAGE_SIZE) || 1;
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return reverseHistory.slice(start, start + PAGE_SIZE);
  }, [reverseHistory, currentPage]);

  const latest = sortedHistory[sortedHistory.length - 1];
  const temps = sortedHistory.map(h => Number(h.measuredTemp) || 0).filter(n => n > 0);
  const maxTemp = temps.length ? Math.max(...temps) : 0;
  const minTemp = temps.length ? Math.min(...temps) : 0;
  const latestTemp = latest ? Number(latest.measuredTemp) || 0 : 0;
  const latestDelta = latest?.deltaTemp != null ? latest.deltaTemp : (latest ? Math.round((latestTemp - (latest.ambientTemp || 22)) * 10) / 10 : 0);
  const isUrgent = latest?.priority === 'Acil' || (latest?.status || '').toLowerCase().includes('acil') || latestTemp >= 60;

  // Grafik verisi (Zaman içinde periyodik oturum / tarihe göre gruplanmış temiz trend)
  const chartData = useMemo(() => {
    const dateMap = new Map<string, {
      name: string;
      measuredTemp: number;
      ambientTemp: number;
      deltaTemp: number;
      status: string;
      item: ThermalInspectionItem;
    }>();

    sortedHistory.forEach((item, idx) => {
      const dStr = item.session?.reportDate || item.measurementDate || item.createdAt;
      const key = dStr ? new Date(dStr).toISOString().slice(0, 10) : `idx_${idx}`;
      const formattedDate = dStr ? format(new Date(dStr), 'dd.MM.yyyy') : `Ölçüm #${idx + 1}`;
      const mTemp = item.measuredTemp ?? 0;
      const aTemp = item.ambientTemp ?? 0;
      const dTemp = item.deltaTemp ?? (mTemp - aTemp);

      if (!dateMap.has(key)) {
        dateMap.set(key, {
          name: formattedDate,
          measuredTemp: mTemp,
          ambientTemp: aTemp,
          deltaTemp: dTemp,
          status: item.status || 'Normal',
          item
        });
      } else {
        const exist = dateMap.get(key)!;
        if (mTemp > exist.measuredTemp) {
          exist.measuredTemp = mTemp;
          exist.ambientTemp = aTemp;
          exist.deltaTemp = dTemp;
          exist.status = item.status || exist.status;
          exist.item = item;
        }
      }
    });

    const list = Array.from(dateMap.values());
    if (list.length === 1 && sortedHistory.length > 1) {
      // Eğer tümü aynı tarihte ise, son 10 ölçümü sırayla listele
      return sortedHistory.slice(-10).map((item, idx) => {
        const dStr = item.session?.reportDate || item.measurementDate || item.createdAt;
        const formattedDate = dStr ? format(new Date(dStr), 'dd.MM.yyyy') : `Ölçüm #${idx + 1}`;
        const timeFmt = item.controlTime ? ` ${item.controlTime}` : ` #${idx + 1}`;
        return {
          name: `${formattedDate}${timeFmt}`,
          measuredTemp: item.measuredTemp ?? 0,
          ambientTemp: item.ambientTemp ?? 0,
          deltaTemp: item.deltaTemp ?? 0,
          status: item.status || 'Normal',
          item
        };
      });
    }

    return list;
  }, [sortedHistory]);

  // Tekil olarak yeni ölçüm kaydet
  const handleCreateMeasurement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeasurementForm.measuredTemp) {
      toast.error('Lütfen ölçülen sıcaklık değerini giriniz.');
      return;
    }

    setIsAdding(true);
    try {
      // 1. Tesis oturumunu bul veya bu tarih için oluştur
      let targetSessionId = latest?.sessionId;
      const mTemp = parseFloat(newMeasurementForm.measuredTemp);
      const aTemp = newMeasurementForm.ambientTemp ? parseFloat(newMeasurementForm.ambientTemp) : null;
      const dT = (aTemp !== null && !isNaN(aTemp)) ? Number((mTemp - aTemp).toFixed(1)) : null;

      // Otomatik durum önerisi
      let autoStatus = newMeasurementForm.status;
      let autoPriority = newMeasurementForm.priority;
      if (mTemp >= 60 || (dT !== null && dT >= 30)) {
        autoStatus = 'Acil';
        autoPriority = 'Yüksek';
      } else if (mTemp >= 40 || (dT !== null && dT >= 15)) {
        autoStatus = 'Uygunsuz';
        autoPriority = 'Orta';
      } else if (mTemp >= 35 || (dT !== null && dT >= 10)) {
        autoStatus = 'Takip';
        autoPriority = 'Orta';
      }

      // Eğer sessionId yoksa, yeni bir kontrol oturumu oluştur
      if (!targetSessionId && facilityId) {
        const newSess = await thermalInspectionService.createSession({
          facilityId,
          reportDate: newMeasurementForm.measurementDate,
          notes: `${panelName} tekil kontrol ölçümü`
        });
        targetSessionId = newSess.id;
      }

      if (!targetSessionId) {
        toast.error('Ölçüm kaydı oluşturulamadı: Geçerli oturum/tesis bilgisi bulunamadı.');
        return;
      }

      const created = await thermalInspectionService.createItem({
        sessionId: targetSessionId,
        panelName: panelName.trim(),
        buildingLocation: newMeasurementForm.buildingLocation.trim() || null,
        floorSection: newMeasurementForm.floorSection.trim() || null,
        measurementPoint: newMeasurementForm.measurementPoint.trim() || null,
        equipmentConnection: newMeasurementForm.equipmentConnection.trim() || null,
        measuredTemp: mTemp,
        ambientTemp: aTemp,
        deltaTemp: dT,
        status: autoStatus,
        priority: autoPriority,
        detectedRisk: newMeasurementForm.detectedRisk.trim() || null,
        actionTaken: newMeasurementForm.actionPlan.trim() || null,
        actionPlan: newMeasurementForm.actionPlan.trim() || null,
        measurementDate: new Date(newMeasurementForm.measurementDate),
        controlTime: newMeasurementForm.controlTime || null
      });

      toast.success('Pano için yeni tekil ölçüm başarıyla kaydedildi.');
      setHistory(prev => [...prev, created]);
      setShowAddMeasurement(false);
      setNewMeasurementForm(prev => ({
        ...prev,
        measuredTemp: '',
        detectedRisk: '',
        actionPlan: ''
      }));
    } catch (err: any) {
      toast.error(err.message || 'Ölçüm eklenirken bir hata oluştu.');
    } finally {
      setIsAdding(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* ── Breadcrumb / Üst Navigasyon ── */}
      <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={onBack}
            type="button"
            className="inline-flex items-center gap-1 font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Önceki Ekrana Dön
          </button>
          <span>/</span>
          <span>{facilityName}</span>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">Pano Analiz & Trend</span>
        </div>

        <div className="flex items-center gap-2">
          <Button
            onClick={() => setShowAddMeasurement(v => !v)}
            size="sm"
            className="text-xs h-8 gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold shadow-sm"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            {showAddMeasurement ? 'Girişi Kapat' : 'Yeni Ölçüm / Tekrar Kontrol Ekle'}
          </Button>

          <Button
            onClick={onBack}
            variant="outline"
            size="sm"
            className="text-xs h-8 gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Geri
          </Button>
        </div>
      </div>

      {/* ── Header Banner: Pano Bilgisi & Özet Rozetler ── */}
      <div className={`rounded-2xl p-6 text-white shadow-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isUrgent
          ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-rose-900/40'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/40'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/20">
              {facilityName}
            </span>
            <Badge className={`${isUrgent ? 'bg-rose-600' : 'bg-emerald-600'} text-white text-xs`}>
              {latest?.status || 'Normal'}
            </Badge>
            <Badge variant="outline" className="text-white border-white/30 text-xs font-mono">
              {sortedHistory.length} Kayıtlı Ölçüm
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            {panelName} — Sıcaklık Trendi & Yaşam Döngüsü
          </h1>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {latest?.floorSection ? `${latest.floorSection} • ` : ''}
            {latest?.buildingLocation ? `${latest.buildingLocation} • ` : ''}
            {latest?.equipmentConnection ? `Ekipman: ${latest.equipmentConnection}` : 'Periyodik elektrik altyapı ölçüm geçmişi'}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {latest && (
            <Button
              onClick={() => setSelectedActionItem(latest)}
              className="bg-indigo-600 hover:bg-indigo-500 text-white gap-1.5 text-xs h-9 px-3.5 font-semibold shadow-md"
            >
              <Edit2 className="w-3.5 h-3.5" />
              Aksiyon Planı Ekle
            </Button>
          )}
          {latest && (
            <Button
              onClick={() => setSelectedDetailItem(latest)}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 text-xs h-9 px-3.5 gap-1.5"
            >
              <FileText className="w-3.5 h-3.5" />
              Son Ölçüm Özeti & Düzenle
            </Button>
          )}
        </div>
      </div>

      {/* ── HIZLI YENİ ÖLÇÜM / TEKRAR KONTROL GİRİŞ FORMU ── */}
      {showAddMeasurement && (
        <Card className="border-2 border-indigo-500/40 bg-gradient-to-br from-indigo-50/40 via-white to-slate-50 dark:from-slate-900 dark:to-indigo-950/20 shadow-md">
          <form onSubmit={handleCreateMeasurement} className="p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-indigo-100 dark:border-indigo-900/40 pb-2">
              <div className="flex items-center gap-2 text-indigo-900 dark:text-indigo-200">
                <PlusCircle className="w-4 h-4 text-indigo-600" />
                <h3 className="text-sm font-bold">Bu Panoya Tekrar Kontrol / Yeni Ölçüm Ekle</h3>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMeasurement(false)}
                className="h-7 w-7 p-0"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Ölçülen Sıcaklık (°C) *</Label>
                <Input
                  type="number"
                  step="0.1"
                  required
                  placeholder="Örn: 52.4"
                  value={newMeasurementForm.measuredTemp}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, measuredTemp: e.target.value })}
                  className="h-8 text-xs font-mono font-bold mt-1 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Ortam Sıcaklığı (°C)</Label>
                <Input
                  type="number"
                  step="0.1"
                  placeholder="Örn: 22.0"
                  value={newMeasurementForm.ambientTemp}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, ambientTemp: e.target.value })}
                  className="h-8 text-xs font-mono mt-1 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Ölçüm Tarihi</Label>
                <Input
                  type="date"
                  value={newMeasurementForm.measurementDate}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, measurementDate: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Ölçüm Saati</Label>
                <Input
                  type="time"
                  value={newMeasurementForm.controlTime}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, controlTime: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Lokasyon / Bina</Label>
                <Input
                  placeholder="Örn: Ana Bina / A Blok"
                  value={newMeasurementForm.buildingLocation}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, buildingLocation: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Kat / Bölüm</Label>
                <Input
                  placeholder="Örn: -1. Bodrum Kat"
                  value={newMeasurementForm.floorSection}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, floorSection: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Ekipman / Bağlantı Noktası</Label>
                <Input
                  placeholder="Örn: Ana Şalter Çıkış Barası"
                  value={newMeasurementForm.equipmentConnection}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, equipmentConnection: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Tespit / Risk Notu</Label>
                <Input
                  placeholder="Gözlemlenen ısınma sebebi veya açıklama"
                  value={newMeasurementForm.detectedRisk}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, detectedRisk: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                />
              </div>
              <div>
                <Label className="text-[11px] font-semibold text-slate-600">Aksiyon / Müdahale Planı</Label>
                <Input
                  placeholder="Planlanan müdahale veya düzeltici faaliyet"
                  value={newMeasurementForm.actionPlan}
                  onChange={(e) => setNewMeasurementForm({ ...newMeasurementForm, actionPlan: e.target.value })}
                  className="h-8 text-xs mt-1 bg-white dark:bg-slate-800"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-indigo-100 dark:border-indigo-900/40">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowAddMeasurement(false)}
                className="text-xs h-8"
              >
                Vazgeç
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAdding}
                className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 font-semibold"
              >
                <Save className="w-3.5 h-3.5" />
                {isAdding ? 'Kaydediliyor...' : 'Yeni Ölçümü Kaydet'}
              </Button>
            </div>
          </form>
        </Card>
      )}

      {/* ── KPI Metrik Kartları ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Son Ölçülen Değer</span>
              <span className={`text-2xl font-black font-mono mt-0.5 block ${latestTemp >= 50 ? 'text-rose-600' : 'text-indigo-600'}`}>
                {latestTemp} °C
              </span>
              <span className="text-[10px] text-slate-400">
                ΔT: +{latestDelta} °C
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-600 block uppercase">Tarihsel Zirve (Maks)</span>
              <span className="text-2xl font-black font-mono text-rose-600 mt-0.5 block">{maxTemp} °C</span>
              <span className="text-[10px] text-rose-400">en yüksek kaydedilen</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Toplam Denetim</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">{sortedHistory.length} Kez</span>
              <span className="text-[10px] text-slate-400">farklı tarihte ölçüldü</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Son Aksiyon Durumu</span>
              <span className="text-sm font-bold text-slate-800 dark:text-slate-200 mt-1 block truncate max-w-[120px]">
                {latest?.actionStatus || 'BEKLIYOR'}
              </span>
              <span className="text-[10px] text-slate-400">
                {latest?.actionDueDate ? `Termin: ${format(new Date(latest.actionDueDate), 'dd.MM.yyyy')}` : 'Termin belirtilmedi'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── Üst Bölüm: Sıcaklık Eğilimi Grafiği & Hızlı Pano Bilgisi (Dengeli Grid) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol 2 Kolon: Sıcaklık Eğilimi Grafiği (Tüm sayfaya gereksiz yayılmadan odaklı) */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 overflow-hidden shadow-xs">
          <div className="p-3.5 px-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-500" />
              <h3 className="font-bold text-slate-900 dark:text-white text-xs uppercase tracking-wider">
                Sıcaklık Trendi ({chartData.length} Denetim Noktası)
              </h3>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-300">
                <span className="w-2.5 h-2.5 rounded-full bg-orange-500 inline-block"></span>
                Ölçülen
              </span>
              <span className="flex items-center gap-1.5 text-slate-400">
                <span className="w-2.5 h-2.5 rounded-full bg-slate-400 inline-block"></span>
                Ortam
              </span>
              <span className="text-rose-600 font-semibold bg-rose-50 dark:bg-rose-950/40 px-1.5 py-0.5 rounded border border-rose-200 dark:border-rose-900/50 text-[10px]">
                50°C Eşik
              </span>
            </div>
          </div>

          <CardContent className="p-3.5 pt-4">
            <div className="h-52 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 8, right: 15, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="panelTrendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f97316" stopOpacity={0.7}/>
                      <stop offset="95%" stopColor="#f97316" stopOpacity={0.02}/>
                    </linearGradient>
                    <linearGradient id="panelAmbientGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#94a3b8" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#94a3b8" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" opacity={0.25} />
                  <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                  <YAxis unit="°" domain={['auto', 'auto']} tick={{ fontSize: 10 }} />
                  <RechartsTooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-slate-900 text-white p-2.5 rounded-xl shadow-xl text-xs space-y-1 border border-slate-700">
                            <p className="font-bold border-b border-slate-700 pb-1 text-slate-200">{data.name}</p>
                            <p className="text-orange-400 font-mono font-bold">Ölçülen: {data.measuredTemp} °C</p>
                            <p className="text-slate-400 font-mono">Ortam: {data.ambientTemp} °C</p>
                            <p className="text-amber-300 font-mono">Fark ΔT: +{data.deltaTemp} °C</p>
                            <p className="text-indigo-300 text-[11px]">Durum: {data.status}</p>
                            {data.item?.actionPlan && (
                              <p className="text-slate-300 text-[10px] pt-1 border-t border-slate-800">
                                Aksiyon: {data.item.actionPlan}
                              </p>
                            )}
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" label={{ value: '50°C', fill: '#ef4444', fontSize: 10 }} />
                  <Area
                    type="monotone"
                    dataKey="measuredTemp"
                    stroke="#ea580c"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#panelTrendGradient)"
                  />
                  <Area
                    type="monotone"
                    dataKey="ambientTemp"
                    stroke="#94a3b8"
                    strokeWidth={1.5}
                    strokeDasharray="3 3"
                    fillOpacity={1}
                    fill="url(#panelAmbientGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Sağ 1 Kolon: Son Durum & Aksiyon Kartı */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40">
            <h4 className="font-bold text-xs uppercase tracking-wider text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-indigo-600" />
              Aktif Denetim Durumu
            </h4>
          </div>
          <div className="p-4 space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Mevcut Sıcaklık:</span>
              <span className={`font-mono font-bold text-base ${latestTemp >= 50 ? 'text-rose-600' : 'text-slate-900 dark:text-white'}`}>
                {latestTemp} °C
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">ΔT Sıcaklık Farkı:</span>
              <span className="font-mono font-bold text-amber-600">+{latestDelta} °C</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Durum Derecesi:</span>
              <Badge variant={isUrgent ? 'destructive' : 'outline'} className="text-[10px]">
                {latest?.status || 'Normal'}
              </Badge>
            </div>
            <div className="p-2.5 rounded-lg bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 space-y-1">
              <span className="font-bold text-indigo-950 dark:text-indigo-300 block text-[11px]">
                Son Aksiyon Notu:
              </span>
              <p className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                {latest?.actionPlan || latest?.actionTaken || 'Henüz kayıtlı aksiyon planı bulunmuyor.'}
              </p>
            </div>
          </div>
          <div className="p-3 pt-0">
            {latest && (
              <Button
                size="sm"
                onClick={() => setSelectedActionItem(latest)}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-xs h-8 gap-1.5 font-semibold"
              >
                <Edit2 className="w-3.5 h-3.5" />
                Aksiyon Planı Ekle / Güncelle
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* ── Ölçüm Kayıtları & Fotoğraflar (Sayfalama İle Kompakt Yapı) ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Sol 2 Kolon: Sayfalanmış Ölçüm Listesi */}
        <div className="lg:col-span-2 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-4 h-4 text-indigo-600" />
              <h3 className="font-bold text-slate-900 dark:text-white text-sm">
                Ölçüm Geçmişi ({reverseHistory.length} Kayıt)
              </h3>
            </div>
            
            {/* Sayfalama Butonları */}
            {totalPages > 1 && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">
                  Sayfa <strong>{currentPage}</strong> / {totalPages}
                </span>
                <div className="flex items-center gap-1">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage <= 1}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage >= totalPages}
                    className="h-7 w-7 p-0"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2.5">
            {paginatedItems.map((it, idx) => {
              const dStr = it.session?.reportDate || it.measurementDate || it.createdAt;
              const formattedDate = dStr ? format(new Date(dStr), 'dd.MM.yyyy') : 'Tarih Belirtilmemiş';
              const mTemp = it.measuredTemp || 0;
              const aTemp = it.ambientTemp ?? 22;
              const dTemp = it.deltaTemp != null ? it.deltaTemp : Math.round((mTemp - aTemp) * 10) / 10;
              const isHigh = mTemp >= 50;

              return (
                <div
                  key={it.id}
                  className={`p-4 rounded-xl border transition-all ${
                    isHigh
                      ? 'bg-rose-50/30 border-rose-200 dark:border-rose-900/40 dark:bg-rose-950/20'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {formattedDate}
                        </span>
                        {it.controlTime && (
                          <span className="text-[11px] text-slate-400">Saat: {it.controlTime}</span>
                        )}
                        <Badge
                          variant={isHigh ? 'destructive' : 'outline'}
                          className="text-[10px] px-2 py-0"
                        >
                          {it.status || 'Normal'}
                        </Badge>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {it.detectedRisk ? (
                          <span><strong>Tespit / Risk:</strong> {it.detectedRisk}</span>
                        ) : (
                          <span className="text-slate-400 italic">Anormal risk tespit edilmedi.</span>
                        )}
                      </p>

                      {/* Aksiyon kutucuğu */}
                      {(it.actionPlan || it.actionTaken) && (
                        <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1 text-[11px]">
                              <CheckCircle2 className="w-3 h-3 text-indigo-600" />
                              Aksiyon: {it.actionPlan || it.actionTaken}
                            </span>
                            <Badge className="text-[9px] px-1.5 py-0 bg-indigo-600 text-white">
                              {it.actionStatus || 'BEKLIYOR'}
                            </Badge>
                          </div>
                          {it.actionDueDate && (
                            <span className="text-[10px] text-slate-500 block">
                              Termin: {format(new Date(it.actionDueDate), 'dd.MM.yyyy')}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xl font-black font-mono block ${isHigh ? 'text-rose-600' : 'text-indigo-600'}`}>
                        {mTemp} °C
                      </span>
                      <span className="text-[10px] text-slate-400 block font-mono">
                        ΔT: +{dTemp} °C
                      </span>

                      <div className="flex items-center justify-end gap-1 mt-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDetailItem(it)}
                          className="h-6 text-[10px] px-2 gap-1 text-slate-700 dark:text-slate-300"
                        >
                          <Edit2 className="w-3 h-3 text-indigo-600" />
                          Düzenle / İncele
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => setSelectedActionItem(it)}
                          className="h-6 text-[10px] px-2 bg-indigo-600 text-white"
                        >
                          Aksiyon
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Sayfalama Alt Barı */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2 text-xs text-slate-500">
              <span>Toplam {reverseHistory.length} ölçüm arasından {(currentPage - 1) * PAGE_SIZE + 1} - {Math.min(currentPage * PAGE_SIZE, reverseHistory.length)} arası gösteriliyor.</span>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage <= 1}
                  className="h-7 px-2 text-xs"
                >
                  Önceki
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage >= totalPages}
                  className="h-7 px-2 text-xs"
                >
                  Sonraki
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Sağ Kolon: Pano Termal Fotoğraf Koleksiyonu */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm self-start">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Camera className="w-4 h-4 text-indigo-600" />
              Panoya Ait Termal Fotoğraflar
            </h3>
          </div>

          <div className="p-4 space-y-3">
            {history.flatMap(h => [
              ...(Array.isArray(h.photoUrls) ? h.photoUrls : []),
              ...(Array.isArray(h.actionPhotos) ? h.actionPhotos : [])
            ]).length > 0 ? (
              <div className="grid grid-cols-2 gap-2">
                {history.flatMap(h => [
                  ...(Array.isArray(h.photoUrls) ? h.photoUrls : []),
                  ...(Array.isArray(h.actionPhotos) ? h.actionPhotos : [])
                ]).map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="block group relative aspect-video rounded-lg overflow-hidden border border-slate-200 shadow-sm hover:ring-2 hover:ring-indigo-500 transition-all"
                  >
                    <img
                      src={url}
                      alt="Termal Pano"
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
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-[10px] font-semibold transition-opacity">
                      Büyüt
                    </div>
                  </a>
                ))}
              </div>
            ) : (
              <div className="py-12 text-center text-slate-400 text-xs">
                Bu pano için henüz yüklenmiş termal fotoğraf bulunmuyor.
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Aksiyon Modalı */}
      {selectedActionItem && (
        <ThermalActionModal
          isOpen={Boolean(selectedActionItem)}
          onClose={() => setSelectedActionItem(null)}
          item={selectedActionItem}
          onActionSaved={(updated) => {
            setHistory(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h));
          }}
        />
      )}

      {/* Detay & Düzenleme Modalı */}
      {selectedDetailItem && (
        <ThermalItemDetailModal
          isOpen={Boolean(selectedDetailItem)}
          onClose={() => setSelectedDetailItem(null)}
          item={selectedDetailItem}
          facilityId={facilityId || selectedDetailItem.session?.facilityId || selectedDetailItem.session?.facility?.id}
          panelHistory={sortedHistory}
          onTakeAction={(it) => setSelectedActionItem(it)}
          onItemUpdated={(updated) => {
            setHistory(prev => prev.map(h => h.id === updated.id ? { ...h, ...updated } : h));
          }}
        />
      )}
    </div>
  );
};
