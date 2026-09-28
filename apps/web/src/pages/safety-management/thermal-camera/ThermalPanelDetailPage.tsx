import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  Edit2
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  CartesianGrid,
  ReferenceLine
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
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

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await thermalInspectionService.getPanelHistory(panelName, facilityId);
      setHistory(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [panelName, facilityId]);

  const latest = history[history.length - 1];
  const temps = history.map(h => Number(h.measuredTemp) || 0).filter(n => n > 0);
  const maxTemp = temps.length ? Math.max(...temps) : 0;
  const latestTemp = latest ? Number(latest.measuredTemp) || 0 : 0;
  const isUrgent = latest?.priority === 'Acil' || latestTemp >= 60;

  // Chart data sorted by date
  const chartData = history.map((item, idx) => {
    const dStr = item.session?.reportDate || item.measurementDate || item.createdAt;
    return {
      name: dStr ? format(new Date(dStr), 'dd.MM.yyyy') : `Ölçüm ${idx + 1}`,
      measuredTemp: item.measuredTemp ?? 0,
      ambientTemp: item.ambientTemp ?? 0,
      deltaTemp: item.deltaTemp ?? 0,
      status: item.status || 'Normal',
      item
    };
  });

  return (
    <div className="space-y-5">
      {/* Breadcrumb / Geri Dönüş */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
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
          <span className="font-semibold text-slate-900 dark:text-white">Pano Analiz & Tarihçe</span>
        </div>

        <Button
          onClick={onBack}
          variant="outline"
          size="sm"
          className="text-xs h-8 gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Geri Dön
        </Button>
      </div>

      {/* Header Banner */}
      <div className={`rounded-2xl p-6 text-white shadow-lg border flex flex-col md:flex-row md:items-center justify-between gap-4 ${
        isUrgent
          ? 'bg-gradient-to-r from-slate-900 via-rose-950 to-slate-900 border-rose-900/40'
          : 'bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border-indigo-900/40'
      }`}>
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-white/10 text-slate-200 border border-white/20">
              {facilityName}
            </span>
            <Badge className={`${isUrgent ? 'bg-rose-600' : 'bg-indigo-600'} text-white text-xs`}>
              {latest?.status || 'Normal'}
            </Badge>
          </div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
            <Layers className="w-6 h-6 text-indigo-400" />
            {panelName} — Pano Sıcaklık Trendi & Denetim Tarihçesi
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Bu panoya ait bugüne kadar yapılmış <strong>{history.length} farklı denetim</strong>, ölçülen sıcaklık değişimleri ve tamamlanan iyileştirme aksiyonları tek sayfada incelenmektedir.
          </p>
        </div>

        {latest && (
          <Button
            onClick={() => setSelectedActionItem(latest)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white gap-2 text-xs h-10 px-4 font-semibold shadow-md self-start md:self-auto"
          >
            <Edit2 className="w-4 h-4" />
            Son Duruma Aksiyon Al
          </Button>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Toplam Ölçüm</span>
              <span className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 block">{history.length} Kez</span>
              <span className="text-[10px] text-slate-400">denetlendi</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Son Ölçülen Sıcaklık</span>
              <span className="text-2xl font-black font-mono text-indigo-600 mt-0.5 block">{latestTemp} °C</span>
              <span className="text-[10px] text-slate-400">güncel değer</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Thermometer className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-600 block uppercase">Zirve Sıcaklık (Maks)</span>
              <span className="text-2xl font-black font-mono text-rose-600 mt-0.5 block">{maxTemp} °C</span>
              <span className="text-[10px] text-rose-500">tarihteki en yüksek</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 dark:border-slate-800">
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Aksiyon Aşaması</span>
              <span className="text-base font-bold text-slate-800 dark:text-slate-200 mt-1 block">
                {latest?.actionStatus || 'BEKLIYOR'}
              </span>
              <span className="text-[10px] text-slate-400">
                {latest?.actionDueDate ? `Termin: ${format(new Date(latest.actionDueDate), 'dd.MM.yyyy')}` : 'Termin yok'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Sıcaklık Eğilimi / Isı Haritası Trend Grafiği */}
      <Card className="border-slate-200 dark:border-slate-800">
        <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Zaman İçinde Pano Sıcaklık Değişimi & Müdahale Etkisi
            </h3>
          </div>
          <span className="text-xs text-slate-400">
            Kritik Sınır: <strong>50°C</strong>
          </span>
        </div>

        <CardContent className="p-4">
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis unit="°C" domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
                <RechartsTooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-slate-900 text-white p-3 rounded-xl shadow-xl text-xs space-y-1">
                          <p className="font-bold border-b border-slate-700 pb-1">{data.name}</p>
                          <p className="text-rose-400 font-mono font-bold">Ölçülen: {data.measuredTemp} °C</p>
                          <p className="text-slate-300 font-mono">Ortam: {data.ambientTemp} °C</p>
                          <p className="text-amber-400 font-mono">Fark ΔT: {data.deltaTemp} °C</p>
                          <p className="text-indigo-300">Durum: {data.status}</p>
                          {data.item.actionPlan && (
                            <p className="text-slate-400 text-[10px] pt-1 border-t border-slate-800">
                              Aksiyon: {data.item.actionPlan}
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <ReferenceLine y={50} stroke="#ef4444" strokeDasharray="4 4" label={{ value: 'Kritik Sınır (50°C)', fill: '#ef4444', fontSize: 10 }} />
                <Line
                  type="monotone"
                  dataKey="measuredTemp"
                  stroke="#6366f1"
                  strokeWidth={3}
                  dot={{ r: 5, fill: '#4f46e5' }}
                  activeDot={{ r: 7 }}
                  name="Ölçülen Sıcaklık"
                />
                <Line
                  type="monotone"
                  dataKey="ambientTemp"
                  stroke="#94a3b8"
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                  dot={{ r: 3 }}
                  name="Ortam Sıcaklığı"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Yaşam Döngüsü ve Aksiyon Zaman Tüneli (Timeline) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Sol 2 Kolon: Denetimler ve Aksiyon Geçmişi */}
        <Card className="lg:col-span-2 border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between">
            <h3 className="font-bold text-slate-900 dark:text-white text-sm flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-600" />
              Pano Yaşam Döngüsü & Denetim Tarihçesi
            </h3>
            <span className="text-xs text-slate-500">{history.length} Denetim Kaydı</span>
          </div>

          <div className="p-4 divide-y divide-slate-100 dark:divide-slate-800 space-y-4">
            {history.map((it, i) => {
              const dStr = it.session?.reportDate || it.measurementDate || it.createdAt;
              const hasAction = Boolean(it.actionPlan || it.actionTaken);
              const mTemp = it.measuredTemp || 0;
              const isHigh = mTemp >= 50;

              return (
                <div key={it.id} className="pt-3 first:pt-0">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-900 dark:text-white">
                          {dStr ? format(new Date(dStr), 'dd.MM.yyyy') : 'Tarih Belirtilmemiş'}
                        </span>
                        <Badge
                          variant={isHigh ? 'destructive' : 'outline'}
                          className="text-[10px] px-2 py-0"
                        >
                          {it.status || 'Normal'}
                        </Badge>
                        {it.controlTime && (
                          <span className="text-[11px] text-slate-400">Saat: {it.controlTime}</span>
                        )}
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300">
                        {it.detectedRisk ? (
                          <span><strong>Tespit / Risk:</strong> {it.detectedRisk}</span>
                        ) : (
                          <span className="text-slate-400 italic">Anormal risk tespit edilmedi.</span>
                        )}
                      </p>

                      {/* Aksiyon Kutusu */}
                      {hasAction && (
                        <div className="mt-2 p-2.5 rounded-lg bg-indigo-50/50 dark:bg-indigo-950/30 border border-indigo-100 dark:border-indigo-900/40 text-xs space-y-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-indigo-950 dark:text-indigo-300 flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />
                              Planlanan / Alınan Aksiyon:
                            </span>
                            <Badge className="text-[9px] px-1.5 py-0 bg-indigo-600 text-white">
                              {it.actionStatus || 'BEKLIYOR'}
                            </Badge>
                          </div>
                          <p className="text-slate-700 dark:text-slate-200">
                            {it.actionPlan || it.actionTaken}
                          </p>
                          <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-500 pt-1">
                            {it.actionDueDate && (
                              <span>Termin: <strong>{format(new Date(it.actionDueDate), 'dd.MM.yyyy')}</strong></span>
                            )}
                            {it.actionAssignee && (
                              <span>Sorumlu: <strong>{it.actionAssignee}</strong></span>
                            )}
                            {it.actionNotes && (
                              <span className="text-emerald-700 dark:text-emerald-400">Sonuç: {it.actionNotes}</span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="text-right shrink-0">
                      <span className={`text-xl font-black font-mono block ${isHigh ? 'text-rose-600' : 'text-indigo-600'}`}>
                        {it.measuredTemp} °C
                      </span>
                      <span className="text-[10px] text-slate-400 block">
                        Ortam: {it.ambientTemp ?? '—'} °C
                      </span>
                      <div className="flex items-center justify-end gap-1 mt-2">
                        <Button
                          size="sm"
                          onClick={() => setSelectedActionItem(it)}
                          className="h-6 text-[10px] px-2 bg-indigo-600 text-white"
                        >
                          Aksiyon
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDetailItem(it)}
                          className="h-6 text-[10px] px-2"
                        >
                          Detay
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>

        {/* Sağ Kolon: Termal ve Düzeltme Fotoğrafları Galerisi */}
        <Card className="border border-slate-200 dark:border-slate-800 shadow-sm">
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
                Bu pano için henüz kayıtlı termal fotoğraf bulunmuyor.
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

      {/* Detay Modalı */}
      {selectedDetailItem && (
        <ThermalItemDetailModal
          isOpen={Boolean(selectedDetailItem)}
          onClose={() => setSelectedDetailItem(null)}
          item={selectedDetailItem}
          onTakeAction={(it) => setSelectedActionItem(it)}
        />
      )}
    </div>
  );
};
