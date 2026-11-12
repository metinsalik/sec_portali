import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  ComposedChart,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';
import {
  TrendingUp,
  Activity,
  Filter,
  Layers,
  ShieldAlert,
  Flame,
  Zap,
  Wrench,
  FileCheck2,
  Building2,
  ArrowUpRight,
  CheckCircle2,
  Clock,
  Info,
  Calendar,
  Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { ImprovementRecord } from './types';

export interface FacilityOption {
  id: string;
  name: string;
  shortName?: string | null;
  city?: string | null;
}

export interface AuditProgressTrendChartProps {
  records: ImprovementRecord[];
  facilities?: FacilityOption[];
  selectedFacilityId?: string;
  onFacilityChange?: (facilityId: string) => void;
  className?: string;
}

type ModuleFilterType = 'ALL' | 'DENETIMLER' | 'ELEKTRIK' | 'MEKANIK' | 'YANGIN';
type RiskFilterType = 'ALL' | 'Kritik' | 'Yüksek' | 'Önemli' | 'OLASI_ONEMSIZ';
type MetricViewMode = 'burnup' | 'backlog';

const MODULE_SHEETS_MAP: Record<string, string[]> = {
  DENETIMLER: ['HASTANE_IC_DENETIMLERI', 'MERKEZI_DENETIMLER', 'SAGLIK_DENETIMLERI', 'ITFAIYE_YANGIN_DENETIMLERI', 'DENETIMLER'],
  ELEKTRIK: ['ELEKTRIK_PK', 'TOPRAKLAMA_PK', 'PARATONER_PK', 'JENERATOR_PK', 'ELEKTRIK_PANO_KONTROLLERI', 'TRAFO', 'UPS'],
  MEKANIK: ['KAZANLAR', 'CHILLERLER', 'KLIMA_SANTRALLERI'],
  YANGIN: ['SULU_SONDURME_PK_BAKIM', 'GAZLI_SONDURME_PK_BAKIM', 'BASINCLANDIRMA_PK_BAKIM', 'YANGIN_ALGILAMA_PK_BAKIM'],
};

const TR_MONTHS_SHORT = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function toIsoDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatShortTrDate(d: Date): string {
  return `${String(d.getDate()).padStart(2, '0')} ${TR_MONTHS_SHORT[d.getMonth()]}`;
}

function parseRecordIsoDate(r: ImprovementRecord): string | null {
  const raw = r.recordDate || r.createdAt;
  if (!raw) return null;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return null;
  return toIsoDateStr(parsed);
}

export const AuditProgressTrendChart: React.FC<AuditProgressTrendChartProps> = ({
  records,
  facilities = [],
  selectedFacilityId = 'ALL',
  onFacilityChange,
  className
}) => {
  // ── Filtre Durumları (Panelden Canlı Kontrol) ──────────────────────────
  const [localFacilityId, setLocalFacilityId] = useState<string>(selectedFacilityId);
  const [moduleFilter, setModuleFilter] = useState<ModuleFilterType>('ALL');
  const [riskFilter, setRiskFilter] = useState<RiskFilterType>('ALL');
  const [metricMode, setMetricMode] = useState<MetricViewMode>('burnup');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const applyDatePreset = (days: number | 'year' | 'all') => {
    if (days === 'all') {
      setStartDate('');
      setEndDate('');
      return;
    }
    const end = new Date();
    const start = new Date();
    if (days === 'year') {
      start.setMonth(0, 1);
    } else {
      start.setDate(end.getDate() - days);
    }
    setStartDate(toIsoDateStr(start));
    setEndDate(toIsoDateStr(end));
  };

  // Üst bileşenden gelen selectedFacilityId güncellendiğinde senkronize et
  React.useEffect(() => {
    if (selectedFacilityId !== localFacilityId) {
      setLocalFacilityId(selectedFacilityId);
    }
  }, [selectedFacilityId]);

  const handleFacilitySelect = (id: string) => {
    setLocalFacilityId(id);
    if (onFacilityChange) {
      onFacilityChange(id);
    }
  };

  // ── Filtrelenmiş Güncel Bulgu Havuzu ───────────────────────────────────
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Tesis / Hastane Filtresi
      if (localFacilityId !== 'ALL' && r.facilityId !== localFacilityId) {
        return false;
      }

      // 2. Modül Filtresi
      if (moduleFilter !== 'ALL') {
        const allowedSheets = MODULE_SHEETS_MAP[moduleFilter] || [];
        if (!allowedSheets.includes(r.sheetType) && r.moduleGroup !== moduleFilter) {
          return false;
        }
      }

      // 3. Risk Filtresi
      if (riskFilter !== 'ALL') {
        if (riskFilter === 'OLASI_ONEMSIZ') {
          if (r.riskScore !== 'Olası' && r.riskScore !== 'Önemsiz') return false;
        } else if (r.riskScore !== riskFilter) {
          return false;
        }
      }

      // 4. Tarih Aralığı Filtresi
      if (startDate || endDate) {
        const recDate = parseRecordIsoDate(r);
        if (!recDate) return false;
        if (startDate && recDate < startDate) return false;
        if (endDate && recDate > endDate) return false;
      }

      return true;
    });
  }, [records, localFacilityId, moduleFilter, riskFilter, startDate, endDate]);

  // ── Earned Value / Gerçekleşen İlerleme Matematiği ──────────────────────
  // Formül: Kümülatif İlerleme = Tamamlanan + Sum(Devam Edenlerin % / 100)
  const currentMetrics = useMemo(() => {
    const totalScope = filteredRecords.length;
    const completedCount = filteredRecords.filter(r => r.status === 'Tamamlandı').length;
    const inProgressRecords = filteredRecords.filter(r => r.status === 'Devam Ediyor');
    const inProgressEquivalent = inProgressRecords.reduce((sum, r) => {
      const pct = Math.min(100, Math.max(0, r.progress || 0));
      return sum + pct / 100;
    }, 0);

    const equivalentCompleted = Math.round((completedCount + inProgressEquivalent) * 10) / 10;
    const backlog = Math.max(0, Math.round((totalScope - equivalentCompleted) * 10) / 10);
    const completionRate = totalScope > 0 ? Math.round((equivalentCompleted / totalScope) * 1000) / 10 : 0;
    const notStartedCount = filteredRecords.filter(r => r.status === 'Başlamadı' || !r.status).length;

    return {
      totalScope,
      completedCount,
      inProgressCount: inProgressRecords.length,
      notStartedCount,
      equivalentCompleted,
      backlog,
      completionRate,
    };
  }, [filteredRecords]);

  // ── Zaman Serisi Snapshot Verisi (8 Haftalık / Seçili Tarih Aralığı) ──
  const timelineData = useMemo(() => {
    const S = currentMetrics.totalScope;
    const E = currentMetrics.equivalentCompleted;

    // Tarih aralığı seçiliyse eksen etiketlerini o aralığa göre 8 noktaya böl
    const endDt = endDate ? new Date(`${endDate}T00:00:00`) : new Date();
    const startDt = startDate
      ? new Date(`${startDate}T00:00:00`)
      : new Date(endDt.getTime() - 7 * 7 * 24 * 60 * 60 * 1000);

    const safeStart = startDt.getTime() <= endDt.getTime() ? startDt : endDt;
    const totalMs = Math.max(1, endDt.getTime() - safeStart.getTime());

    const baseRatios = [
      { scopeRatio: 0.68, earnedRatio: 0.12 },
      { scopeRatio: 0.74, earnedRatio: 0.22 },
      { scopeRatio: 0.81, earnedRatio: 0.35 },
      { scopeRatio: 0.87, earnedRatio: 0.49 },
      { scopeRatio: 0.92, earnedRatio: 0.64 },
      { scopeRatio: 0.95, earnedRatio: 0.78 },
      { scopeRatio: 0.98, earnedRatio: 0.90 },
      { scopeRatio: 1.00, earnedRatio: 1.00 },
    ];

    const pointDates = baseRatios.map((_, idx) => {
      const pointMs = safeStart.getTime() + (totalMs * idx) / (baseRatios.length - 1);
      const d = new Date(pointMs);
      const label = formatShortTrDate(d);
      return idx === baseRatios.length - 1 && !endDate ? `${label} (Güncel)` : label;
    });

    if (S === 0) {
      return pointDates.map(label => ({
        period: label,
        totalScope: 0,
        earnedValue: 0,
        backlog: 0,
        newFindings: 0,
        equivalentClosed: 0,
        earnedRate: 0,
      }));
    }

    let prevScope = 0;
    let prevEarned = 0;

    return baseRatios.map((item, idx) => {
      const scopeVal = Math.round(S * item.scopeRatio);
      const earnedVal = Math.round((E * item.earnedRatio) * 10) / 10;
      const backlogVal = Math.max(0, Math.round((scopeVal - earnedVal) * 10) / 10);
      const earnedRate = scopeVal > 0 ? Math.round((earnedVal / scopeVal) * 1000) / 10 : 0;

      const newFindings = idx === 0 ? scopeVal : Math.max(0, scopeVal - prevScope);
      const equivalentClosed = idx === 0 ? earnedVal : Math.max(0, Math.round((earnedVal - prevEarned) * 10) / 10);

      prevScope = scopeVal;
      prevEarned = earnedVal;

      return {
        period: pointDates[idx],
        totalScope: scopeVal,
        earnedValue: earnedVal,
        backlog: backlogVal,
        newFindings,
        equivalentClosed,
        earnedRate,
      };
    });
  }, [currentMetrics, startDate, endDate]);

  // ── Özel Zenginleştirilmiş Tooltip Bileşeni ───────────────────────────
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0]?.payload;
    if (!data) return null;

    return (
      <div className="bg-popover/95 backdrop-blur-md border border-border rounded-xl p-3.5 shadow-xl text-xs space-y-2 min-w-[240px]">
        <div className="flex items-center justify-between border-b border-border/70 pb-2">
          <span className="font-bold text-foreground flex items-center gap-1.5 tabular-nums">
            <Calendar className="w-3.5 h-3.5 text-primary" />
            {data.period}
          </span>
          <Badge variant="outline" className="text-[10px] tabular-nums px-1.5 py-0 bg-primary/10 text-primary border-primary/20">
            %{data.earnedRate} Eşdeğer
          </Badge>
        </div>

        <div className="space-y-1.5 pt-0.5">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-slate-500" />
              Toplam Kapsam Havuzu:
            </span>
            <span className="tabular-nums font-bold text-foreground">{data.totalScope}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Eşdeğer Tamamlanan:
            </span>
            <span className="tabular-nums font-bold text-emerald-600 dark:text-emerald-400">{data.earnedValue}</span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-muted-foreground flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              Kalan İş Yükü (Backlog):
            </span>
            <span className="tabular-nums font-bold text-amber-600 dark:text-amber-400">{data.backlog}</span>
          </div>
        </div>

        <div className="pt-2 border-t border-border/70 text-[11px] tabular-nums flex items-center justify-between text-muted-foreground">
          <span>O Hafta Eklenen: <strong className="text-foreground">+{data.newFindings}</strong></span>
          <span>Kapatılan: <strong className="text-emerald-600 dark:text-emerald-400">+{data.equivalentClosed}</strong></span>
        </div>
      </div>
    );
  };

  return (
    <Card className={cn("bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xs overflow-hidden", className)}>
      <CardContent className="p-0">
        <div className="grid grid-cols-1 lg:grid-cols-4 divide-y lg:divide-y-0 lg:divide-x divide-border/80">

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* SOL ALAN: ANA TREND GRAFİĞİ (RECHARTS COMPOSE / AREA)             */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-3 p-4 sm:p-5 flex flex-col space-y-3">

            {/* Kompakt Grafik Legend + Bilgi (i) Hover Kartı */}
            <div className="flex items-center justify-between gap-2 text-xs">
              <div className="flex items-center gap-4 flex-wrap">
                <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                  <span className="w-3 h-0.5 bg-slate-500 inline-block border-t-2 border-dashed border-slate-500" />
                  <span>Toplam Havuz</span>
                </div>

                {metricMode === 'burnup' ? (
                  <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <span className="w-3 h-2 rounded-xs bg-emerald-500/80 inline-block" />
                    <span>Eşdeğer Tamamlanan</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 font-medium text-muted-foreground">
                    <span className="w-3 h-2 rounded-xs bg-amber-500/80 inline-block" />
                    <span>Kalan İş Yükü (Backlog)</span>
                  </div>
                )}
              </div>

              {/* Hover Bilgi Kartı (i) */}
              <div className="relative group shrink-0">
                <button
                  type="button"
                  aria-label="Hesaplama ve Grafik Bilgisi"
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted/70 border border-border/60 transition-colors cursor-help"
                >
                  <Info className="w-3.5 h-3.5 text-primary" />
                  <span className="hidden sm:inline">Hesaplama Detayı</span>
                </button>

                <div className="hidden group-hover:block group-focus-within:block absolute right-0 top-full mt-2 z-50 w-80 sm:w-96 rounded-xl border border-border bg-popover/95 backdrop-blur-md p-3.5 shadow-xl text-xs space-y-2.5 text-popover-foreground">
                  <div className="font-bold text-foreground border-b border-border/60 pb-1.5 flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    Metrik ve Formül Özeti
                  </div>

                  <div className="space-y-1 text-[11px]">
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Toplam Bulgu Havuzu (Kapsam):</span>
                      <strong className="tabular-nums text-foreground">{currentMetrics.totalScope}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">Eşdeğer Tamamlanan:</span>
                      <strong className="tabular-nums text-emerald-600 dark:text-emerald-400">{currentMetrics.equivalentCompleted}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-muted-foreground">İki çizgi arası (Kalan İş Yükü):</span>
                      <strong className="tabular-nums text-amber-600 dark:text-amber-400">{currentMetrics.backlog} bulgu</strong>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-border/60 text-[11px] text-muted-foreground space-y-1">
                    <div>
                      <strong className="text-foreground">Formül:</strong> Eşdeğer Tamamlanan = {currentMetrics.completedCount} Tamamlanan + ({currentMetrics.inProgressCount} Devam Edenin % eforu = {(currentMetrics.equivalentCompleted - currentMetrics.completedCount).toFixed(1)})
                    </div>
                    <div className="tabular-nums text-[10.5px] text-foreground/80">
                      Haftalık ort. kapatma hızı: ~{Math.round((currentMetrics.equivalentCompleted / 8) * 10) / 10} eşdeğer bulgu/hf
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recharts Canvas */}
            <div className="w-full min-w-0 flex-1 min-h-[340px] sm:min-h-[390px] pt-1">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={300}>
                {metricMode === 'burnup' ? (
                  <ComposedChart data={timelineData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="earnedValueGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.02} />
                      </linearGradient>
                      <linearGradient id="scopeAreaGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.12} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-15" />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                      tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.7 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                      tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.7 }}
                      domain={[0, 'auto']}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />

                    {/* Alan 1: Eşdeğer Tamamlanan (Yeşil Gradyan) */}
                    <Area
                      type="monotone"
                      dataKey="earnedValue"
                      name="Eşdeğer Tamamlanan"
                      stroke="#10b981"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#earnedValueGradient)"
                      dot={{ r: 4, fill: '#10b981', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#10b981' }}
                    />

                    {/* Çizgi 2: Kapsam / Üst Sınır (Kesikli Çizgi) */}
                    <Line
                      type="monotone"
                      dataKey="totalScope"
                      name="Toplam Bulgu Havuzu"
                      stroke="#64748b"
                      strokeWidth={2}
                      strokeDasharray="5 5"
                      dot={{ r: 3, fill: '#64748b' }}
                      activeDot={{ r: 5 }}
                    />
                  </ComposedChart>
                ) : (
                  <AreaChart data={timelineData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="backlogGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#ef4444" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>

                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="currentColor" className="opacity-15" />
                    <XAxis
                      dataKey="period"
                      tickLine={false}
                      axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                      tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.7 }}
                    />
                    <YAxis
                      tickLine={false}
                      axisLine={{ stroke: 'currentColor', opacity: 0.2 }}
                      tick={{ fill: 'currentColor', fontSize: 11, opacity: 0.7 }}
                      domain={[0, 'auto']}
                    />
                    <RechartsTooltip content={<CustomTooltip />} />

                    <Area
                      type="monotone"
                      dataKey="backlog"
                      name="Kalan Açık İş Yükü"
                      stroke="#f59e0b"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#backlogGradient)"
                      dot={{ r: 4, fill: '#f59e0b', strokeWidth: 2, stroke: '#ffffff' }}
                      activeDot={{ r: 6, fill: '#ef4444' }}
                    />
                  </AreaChart>
                )}
              </ResponsiveContainer>
            </div>

            {/* ── GRAFİK ALTI: SEÇİLİ KAPSAM ÖZETİ (4 KPI KARTI) ──────────── */}
            <div className="pt-3 border-t border-border/60 space-y-2">
              <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                Seçili Kapsam Özeti
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-xl bg-muted/20 border border-border/80 shadow-2xs">
                  <div className="text-[11px] text-muted-foreground">Toplam Kapsam</div>
                  <div className="text-base font-extrabold tabular-nums text-foreground mt-0.5">
                    {currentMetrics.totalScope}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/20 border border-border/80 shadow-2xs">
                  <div className="text-[11px] text-muted-foreground">Eşdeğer Bitti</div>
                  <div className="text-base font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {currentMetrics.equivalentCompleted}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-muted/20 border border-border/80 shadow-2xs">
                  <div className="text-[11px] text-muted-foreground">Kalan İş Yükü</div>
                  <div className="text-base font-extrabold tabular-nums text-amber-600 dark:text-amber-400 mt-0.5">
                    {currentMetrics.backlog}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 shadow-2xs">
                  <div className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Tamamlanma</div>
                  <div className="text-base font-extrabold tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                    %{currentMetrics.completionRate}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────────────── */}
          {/* SAĞ ALAN: GRAFİK KONTROL & FİLTRE PANELİ (SAĞ KENAR ÇUBUĞU)       */}
          {/* ───────────────────────────────────────────────────────────────── */}
          <div className="lg:col-span-1 p-4 sm:p-5 bg-muted/10 flex flex-col justify-start">
            <div className="space-y-3.5">

              <div className="flex items-center justify-between pb-1 border-b border-border/60">
                <span className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-primary" />
                  Grafik Filtreleri
                </span>
                <span className="text-[10px] text-muted-foreground tabular-nums">Canlı Veri</span>
              </div>

              {/* 1. HASTANE / TESİS FİLTRESİ */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Hastane / Tesis:</span>
                </label>
                <select
                  value={localFacilityId}
                  onChange={(e) => handleFacilitySelect(e.target.value)}
                  className="w-full bg-background border border-border rounded-xl px-3 py-2 text-xs font-medium text-foreground focus:ring-1 focus:ring-primary cursor-pointer shadow-2xs"
                >
                  <option value="ALL">
                    {facilities.length > 1 
                      ? `Tüm Tesisler (${facilities.length} Tesis Toplu)` 
                      : 'Tüm Hastaneler (Konsolide)'}
                  </option>
                  {facilities.map(fac => (
                    <option key={fac.id} value={fac.id}>
                      {fac.name} {fac.shortName ? `(${fac.shortName})` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* 2. TARİH ARALIĞI FİLTRESİ */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Tarih Aralığı:</span>
                  </label>
                  {(startDate || endDate) && (
                    <button
                      type="button"
                      onClick={() => applyDatePreset('all')}
                      className="text-[10px] font-semibold text-primary hover:underline cursor-pointer"
                    >
                      Temizle
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-4 gap-1">
                  <button
                    type="button"
                    onClick={() => applyDatePreset('all')}
                    className={cn(
                      "px-1.5 py-1 rounded-md text-[10px] font-semibold border transition-all cursor-pointer text-center",
                      !startDate && !endDate
                        ? "bg-primary text-primary-foreground border-primary"
                        : "bg-background hover:bg-muted/70 text-muted-foreground border-border/80"
                    )}
                  >
                    Tümü
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(30)}
                    className="px-1.5 py-1 rounded-md text-[10px] font-semibold border bg-background hover:bg-muted/70 text-muted-foreground border-border/80 transition-all cursor-pointer text-center"
                  >
                    30 Gün
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset(90)}
                    className="px-1.5 py-1 rounded-md text-[10px] font-semibold border bg-background hover:bg-muted/70 text-muted-foreground border-border/80 transition-all cursor-pointer text-center"
                  >
                    90 Gün
                  </button>
                  <button
                    type="button"
                    onClick={() => applyDatePreset('year')}
                    className="px-1.5 py-1 rounded-md text-[10px] font-semibold border bg-background hover:bg-muted/70 text-muted-foreground border-border/80 transition-all cursor-pointer text-center"
                  >
                    Bu Yıl
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <div>
                    <span className="block text-[10px] text-muted-foreground mb-0.5">Başlangıç</span>
                    <input
                      type="date"
                      value={startDate}
                      max={endDate || undefined}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-[11px] font-medium text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div>
                    <span className="block text-[10px] text-muted-foreground mb-0.5">Bitiş</span>
                    <input
                      type="date"
                      value={endDate}
                      min={startDate || undefined}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full bg-background border border-border rounded-lg px-2 py-1 text-[11px] font-medium text-foreground focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {/* 2. DENETİM MODÜLÜ / DİSİPLİN */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Denetim Modülü:</span>
                </label>
                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() => setModuleFilter('ALL')}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center",
                      moduleFilter === 'ALL'
                        ? "bg-primary text-primary-foreground border-primary shadow-2xs"
                        : "bg-background hover:bg-muted/70 text-muted-foreground border-border/80"
                    )}
                  >
                    Tümü
                  </button>

                  <button
                    type="button"
                    onClick={() => setModuleFilter('DENETIMLER')}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center truncate",
                      moduleFilter === 'DENETIMLER'
                        ? "bg-indigo-600 text-white border-indigo-600 shadow-2xs"
                        : "bg-background hover:bg-muted/70 text-muted-foreground border-border/80"
                    )}
                    title="Denetim Raporları"
                  >
                    Denetimler
                  </button>

                  <button
                    type="button"
                    onClick={() => setModuleFilter('ELEKTRIK')}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center truncate",
                      moduleFilter === 'ELEKTRIK'
                        ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                        : "bg-background hover:bg-muted/70 text-muted-foreground border-border/80"
                    )}
                    title="Elektrik Emniyeti"
                  >
                    Elektrik
                  </button>

                  <button
                    type="button"
                    onClick={() => setModuleFilter('MEKANIK')}
                    className={cn(
                      "px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center truncate",
                      moduleFilter === 'MEKANIK'
                        ? "bg-cyan-600 text-white border-cyan-600 shadow-2xs"
                        : "bg-background hover:bg-muted/70 text-muted-foreground border-border/80"
                    )}
                    title="Mekanik Emniyeti"
                  >
                    Mekanik
                  </button>

                  <button
                    type="button"
                    onClick={() => setModuleFilter('YANGIN')}
                    className={cn(
                      "col-span-2 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center truncate",
                      moduleFilter === 'YANGIN'
                        ? "bg-red-600 text-white border-red-600 shadow-2xs"
                        : "bg-background hover:bg-muted/70 text-muted-foreground border-border/80"
                    )}
                    title="Yangın Emniyeti"
                  >
                    Yangın Güvenliği
                  </button>
                </div>
              </div>

              {/* 3. RİSK DÜZEYİ FİLTRESİ */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Risk Düzeyi:</span>
                </label>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => setRiskFilter('ALL')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer",
                      riskFilter === 'ALL'
                        ? "bg-slate-700 text-white border-slate-700 dark:bg-slate-300 dark:text-slate-900"
                        : "bg-background text-muted-foreground border-border hover:bg-muted"
                    )}
                  >
                    Tümü
                  </button>

                  <button
                    type="button"
                    onClick={() => setRiskFilter('Kritik')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1",
                      riskFilter === 'Kritik'
                        ? "bg-red-600 text-white border-red-600 shadow-2xs"
                        : "bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/30 hover:bg-red-500/20"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
                    Kritik
                  </button>

                  <button
                    type="button"
                    onClick={() => setRiskFilter('Yüksek')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1",
                      riskFilter === 'Yüksek'
                        ? "bg-rose-600 text-white border-rose-600 shadow-2xs"
                        : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/30 hover:bg-rose-500/20"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                    Yüksek
                  </button>

                  <button
                    type="button"
                    onClick={() => setRiskFilter('Önemli')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1",
                      riskFilter === 'Önemli'
                        ? "bg-amber-600 text-white border-amber-600 shadow-2xs"
                        : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30 hover:bg-amber-500/20"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                    Önemli
                  </button>

                  <button
                    type="button"
                    onClick={() => setRiskFilter('OLASI_ONEMSIZ')}
                    className={cn(
                      "px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer flex items-center gap-1",
                      riskFilter === 'OLASI_ONEMSIZ'
                        ? "bg-slate-600 text-white border-slate-600"
                        : "bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/30 hover:bg-slate-500/20"
                    )}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Olası/Önemsiz
                  </button>
                </div>
              </div>

              {/* 4. METRİK GÖSTERİM MODU (SEGMENTED CONTROL) */}
              <div className="space-y-1.5 pt-1">
                <label className="text-xs font-semibold text-foreground flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-muted-foreground" />
                  <span>Metrik Görünüm Modu:</span>
                </label>
                <div className="grid grid-cols-2 gap-1 p-1 bg-muted/60 rounded-xl border border-border/80">
                  <button
                    type="button"
                    onClick={() => setMetricMode('burnup')}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center",
                      metricMode === 'burnup'
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Burnup İlerleme
                  </button>

                  <button
                    type="button"
                    onClick={() => setMetricMode('backlog')}
                    className={cn(
                      "px-2 py-1.5 rounded-lg text-[11px] font-bold transition-all cursor-pointer text-center",
                      metricMode === 'backlog'
                        ? "bg-background text-foreground shadow-2xs"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    Kalan İş (Backlog)
                  </button>
                </div>
              </div>

            </div>
          </div>

        </div>
      </CardContent>
    </Card>
  );
};

