import React, { useMemo, useState } from 'react';
import type { ThermalInspectionItem } from '@/services/thermal-inspection.service';
import { 
  Thermometer, Flame, AlertTriangle, Clock, 
  CheckCircle2, ShieldAlert, ArrowUpRight, BarChart3, 
  Building2, Layers, AlertOctagon, TrendingUp, TrendingDown, Minus, Info, 
  Lightbulb, ChevronRight, ChevronDown, Zap, ShieldCheck
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Props {
  items: ThermalInspectionItem[];
  facilityName: string;
  onNavigateToTab: (tab: 'table' | 'panels') => void;
  onOpenPanelDetail: (panelName: string) => void;
  onTakeAction?: (item: ThermalInspectionItem) => void;
  onViewItem?: (item: ThermalInspectionItem) => void;
}

export const ThermalCleanDashboard: React.FC<Props> = ({
  items,
  facilityName,
  onNavigateToTab,
  onOpenPanelDetail,
  onTakeAction,
  onViewItem
}) => {
  // Akordiyon durumları:
  // 1. Sırada Acil Aksiyon (Açık)
  // 2. Sırada Pik Yükte Isınabilecekler (Default Kapalı)
  // 3. Sırada Normal Olabilecek Ekipmanlar (Default Kapalı)
  const [isUrgentOpen, setIsUrgentOpen] = useState(true);
  const [isPeakOpen, setIsPeakOpen] = useState(false);
  const [isNormalEquipOpen, setIsNormalEquipOpen] = useState(false);

  // Sayfalama durumları (Her tablo 25 kayıt)
  const [urgentPage, setUrgentPage] = useState(1);
  const [peakPage, setPeakPage] = useState(1);
  const [normalEquipPage, setNormalEquipPage] = useState(1);
  const PAGE_SIZE = 25;

  // Pano geçmişine göre Trend & Durum Geçiş Analizi
  const {
    categorizedData,
    panelHistoryMap
  } = useMemo(() => {
    // 1. Her panonun ölçümlerini kronolojik topla
    const histMap = new Map<string, ThermalInspectionItem[]>();
    items.forEach(it => {
      if (!it.panelName) return;
      const key = it.panelName.trim();
      if (!histMap.has(key)) histMap.set(key, []);
      histMap.get(key)!.push(it);
    });

    // Kronolojik sırala
    histMap.forEach(arr => {
      arr.sort((a, b) => {
        const da = a.measurementDate ? new Date(a.measurementDate).getTime() : 0;
        const db = b.measurementDate ? new Date(b.measurementDate).getTime() : 0;
        return da - db;
      });
    });

    // 2. 3 Kategori Listesi
    const urgentActionPanels: ThermalInspectionItem[] = [];
    const peakLoadFollowUpPanels: ThermalInspectionItem[] = [];
    const normalSpecialEquipments: ThermalInspectionItem[] = [];

    let total = items.length;
    let normalCount = 0;
    let followUpCount = 0;
    let verifyColdCount = 0;
    let maxTemp = -999;
    let maxTempItem: ThermalInspectionItem | null = null;
    const panelSet = new Set<string>();

    items.forEach(item => {
      if (item.panelName) panelSet.add(item.panelName.trim());
      const m = item.measuredTemp ?? 0;
      const dT = item.deltaTemp ?? 0;
      const equip = (item.equipmentConnection || '').toLowerCase();
      const pName = (item.panelName || '').toLowerCase();
      const floor = (item.floorSection || '').toLowerCase();
      const combined = `${equip} ${pName} ${floor}`;

      if (m > maxTemp) {
        maxTemp = m;
        maxTempItem = item;
      }

      if (dT < 0) {
        verifyColdCount++;
      }

      // Kategori 3 (Ekipman Normal): Trafo & Şönt Reaktör & Kompanzasyon bobini
      const isTransformerOrReactor = 
        combined.includes('trafo') || 
        combined.includes('reaktör') || 
        combined.includes('reaktor') || 
        combined.includes('şönt') || 
        combined.includes('sont') ||
        combined.includes('bobin');

      // Kullanıcı aksiyonu tamamlayıp Normale çektiyse (veya yeni kontrol ölçümü 40°C altındaysa ya da açıkça Normal olarak işaretlenmişse)
      const isResolvedNormal = item.status === 'Normal' && m < 45;

      if (isResolvedNormal) {
        normalCount++;
      } else if (isTransformerOrReactor && m >= 40) {
        normalSpecialEquipments.push(item);
      } else if (m >= 60 || dT >= 30 || combined.includes('yoğun bakım') || combined.includes('yogun bakim') || combined.includes('it panosu')) {
        // 1. Sırada ACİL AKSİYON (Aksiyon tamamlandı ve çözüldüyse buraya düşmez)
        urgentActionPanels.push(item);
      } else if (m >= 40 || dT >= 15) {
        // 2. Sırada PİK YÜKTE ISINABİLECEK
        peakLoadFollowUpPanels.push(item);
      } else if (m >= 35) {
        followUpCount++;
      } else {
        normalCount++;
      }
    });

    urgentActionPanels.sort((a, b) => (b.measuredTemp ?? 0) - (a.measuredTemp ?? 0));
    peakLoadFollowUpPanels.sort((a, b) => (b.measuredTemp ?? 0) - (a.measuredTemp ?? 0));
    normalSpecialEquipments.sort((a, b) => (b.measuredTemp ?? 0) - (a.measuredTemp ?? 0));

    return {
      panelHistoryMap: histMap,
      categorizedData: {
        total,
        totalPanels: panelSet.size,
        normalCount,
        followUpCount,
        verifyColdCount,
        maxTemp: maxTemp !== -999 ? maxTemp : null,
        maxTempItem,
        urgentActionPanels,
        peakLoadFollowUpPanels,
        normalSpecialEquipments
      }
    };
  }, [items]);

  // Yardımcı Fonksiyon: Panonun Ölçüm Trendi ve Kategori Değişim Badge'i
  const getPanelTrendBadge = (item: ThermalInspectionItem) => {
    if (!item.panelName) return null;
    const history = panelHistoryMap.get(item.panelName.trim()) || [];
    if (history.length <= 1) {
      return (
        <span className="inline-flex items-center gap-1 text-[11px] text-slate-400 font-medium bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
          <Minus className="w-3 h-3 text-slate-400" /> İlk Ölçüm
        </span>
      );
    }

    // Son iki ölçümü karşılaştır
    const prev = history[history.length - 2];
    const curr = history[history.length - 1];
    const diff = (curr.measuredTemp ?? 0) - (prev.measuredTemp ?? 0);

    // Kategori değişim analizi
    const prevTemp = prev.measuredTemp ?? 0;
    const currTemp = curr.measuredTemp ?? 0;
    let transitionBadge = null;

    if (prevTemp < 40 && currTemp >= 60) {
      transitionBadge = (
        <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 border-rose-300 text-[10px] px-1.5 py-0 font-bold">
          ⚠️ Acil Aksiyona Düştü
        </Badge>
      );
    } else if (prevTemp < 35 && currTemp >= 40) {
      transitionBadge = (
        <Badge className="bg-orange-100 text-orange-800 dark:bg-orange-950/80 dark:text-orange-300 border-orange-300 text-[10px] px-1.5 py-0 font-bold">
          ⚡ Pik Yük Riski Başladı
        </Badge>
      );
    } else if (prevTemp >= 40 && currTemp < 35) {
      transitionBadge = (
        <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300 border-emerald-300 text-[10px] px-1.5 py-0 font-bold">
          ✅ Normale Döndü
        </Badge>
      );
    }

    if (Math.abs(diff) < 1.0) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-full">
            <Minus className="w-3 h-3 text-slate-400" /> Stabil (±{diff.toFixed(1)}°C)
          </span>
          {transitionBadge}
        </div>
      );
    }

    if (diff > 0) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-300 px-2 py-0.5 rounded-full border border-rose-200 dark:border-rose-900/50">
            <TrendingUp className="w-3.5 h-3.5 text-rose-600" /> +{diff.toFixed(1)}°C Isınma (Kötüye Gidiş)
          </span>
          {transitionBadge}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1.5">
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-900/50">
          <TrendingDown className="w-3.5 h-3.5 text-emerald-600" /> {diff.toFixed(1)}°C İyileşme (Soğuma)
        </span>
        {transitionBadge}
      </div>
    );
  };

  // Sayfalama Dilimleri
  const urgentSlice = categorizedData.urgentActionPanels.slice((urgentPage - 1) * PAGE_SIZE, urgentPage * PAGE_SIZE);
  const urgentTotalPages = Math.ceil(categorizedData.urgentActionPanels.length / PAGE_SIZE) || 1;

  const peakSlice = categorizedData.peakLoadFollowUpPanels.slice((peakPage - 1) * PAGE_SIZE, peakPage * PAGE_SIZE);
  const peakTotalPages = Math.ceil(categorizedData.peakLoadFollowUpPanels.length / PAGE_SIZE) || 1;

  const normalEquipSlice = categorizedData.normalSpecialEquipments.slice((normalEquipPage - 1) * PAGE_SIZE, normalEquipPage * PAGE_SIZE);
  const normalEquipTotalPages = Math.ceil(categorizedData.normalSpecialEquipments.length / PAGE_SIZE) || 1;

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. ÜST BİLGİLENDİRME VE MÜHENDİSLİK NOTLARI                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Ana Not */}
        <div className="bg-amber-50/90 dark:bg-amber-950/20 border border-amber-200/80 dark:border-amber-900/40 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-amber-500 text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
            <Info className="w-5 h-5" />
          </div>
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-amber-900 dark:text-amber-300 block mb-0.5">
              Ana Not (Trafo & Reaktörler):
            </span>
            <p className="text-amber-800 dark:text-amber-400 text-[11.5px]">
              Trafo, izolasyon trafosu ve şönt reaktör sıcaklığı, kat panosu ile aynı yorumlanmamalıdır. Yüksek sıcaklık normal çalışma karakteristiği olabilir; üretici limitleri ile teyit edilmelidir.
            </p>
          </div>
        </div>

        {/* Dikkat */}
        <div className="bg-rose-50/90 dark:bg-rose-950/20 border border-rose-200/80 dark:border-rose-900/40 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-rose-600 text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
            <AlertTriangle className="w-5 h-5" />
          </div>
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-rose-900 dark:text-rose-300 block mb-0.5">
              Dikkat (40°C Üzeri Panolar):
            </span>
            <p className="text-rose-800 dark:text-rose-400 text-[11.5px]">
              Kat panosu, IT panosu, MCC ve besleme panolarında 40°C üzeri değerler, ölçüm tam yük dışında yapılmış olsa bile teknik kontrol gerektirir. Pik yükte sıcaklığın artma riski vardır.
            </p>
          </div>
        </div>

        {/* Literatür Notu */}
        <div className="bg-blue-50/90 dark:bg-blue-950/20 border border-blue-200/80 dark:border-blue-900/40 rounded-xl p-3.5 flex items-start gap-3 shadow-xs">
          <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 font-bold mt-0.5">
            <Lightbulb className="w-5 h-5" />
          </div>
          <div className="text-xs leading-relaxed">
            <span className="font-bold text-blue-900 dark:text-blue-300 block mb-0.5">
              Literatür Notu (Emissivity / Yansıma):
            </span>
            <p className="text-blue-800 dark:text-blue-400 text-[11.5px]">
              Parlak bakır/alüminyum baralarda düşük emissivity nedeniyle hatalı düşük/yüksek sıcaklık oluşabilir. Maksimum nokta bağlantı elemanı üzerindeyse farklı açıdan doğrulanmalıdır.
            </p>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. TESİS ÖZET KPI GÖSTERGELERİ                              */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <Card 
          onClick={() => onNavigateToTab('table')}
          className="p-3.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-orange-400 transition-all cursor-pointer shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Toplam Ölçüm</span>
          <div className="text-2xl font-bold text-slate-900 dark:text-white mt-1">
            {categorizedData.total}
          </div>
          <p className="text-[10px] text-slate-500 mt-0.5">
            {categorizedData.totalPanels} farklı pano
          </p>
        </Card>

        <Card 
          onClick={() => setIsUrgentOpen(true)}
          className="p-3.5 border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 hover:border-rose-400 transition-all cursor-pointer shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-rose-700 dark:text-rose-400 block">Acil Aksiyon</span>
          <div className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1">
            {categorizedData.urgentActionPanels.length}
          </div>
          <p className="text-[10px] text-rose-600/80 dark:text-rose-400/80 mt-0.5">
            Öncelikli müdahale
          </p>
        </Card>

        <Card 
          onClick={() => setIsPeakOpen(true)}
          className="p-3.5 border-orange-200 dark:border-orange-900/60 bg-orange-50/30 dark:bg-orange-950/20 hover:border-orange-400 transition-all cursor-pointer shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-orange-700 dark:text-orange-400 block">Pik Yük Takip</span>
          <div className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-1">
            {categorizedData.peakLoadFollowUpPanels.length}
          </div>
          <p className="text-[10px] text-orange-600/80 dark:text-orange-400/80 mt-0.5">
            &gt;40°C ısınan panolar
          </p>
        </Card>

        <Card 
          onClick={() => setIsNormalEquipOpen(true)}
          className="p-3.5 border-teal-200 dark:border-teal-900/60 bg-teal-50/30 dark:bg-teal-950/20 hover:border-teal-400 transition-all cursor-pointer shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-teal-700 dark:text-teal-400 block">Trafo & Reaktör</span>
          <div className="text-2xl font-bold text-teal-700 dark:text-teal-400 mt-1">
            {categorizedData.normalSpecialEquipments.length}
          </div>
          <p className="text-[10px] text-teal-600/80 dark:text-teal-400/80 mt-0.5">
            Üretici limit teyidi
          </p>
        </Card>

        <Card 
          onClick={() => onNavigateToTab('table')}
          className="p-3.5 border-indigo-200 dark:border-indigo-900/60 bg-indigo-50/30 dark:bg-indigo-950/20 hover:border-indigo-400 transition-all cursor-pointer shadow-xs"
        >
          <span className="text-[10px] uppercase font-bold text-indigo-700 dark:text-indigo-400 block">Doğrulanacak</span>
          <div className="text-2xl font-bold text-indigo-700 dark:text-indigo-400 mt-1">
            {categorizedData.verifyColdCount}
          </div>
          <p className="text-[10px] text-indigo-600/80 dark:text-indigo-400/80 mt-0.5">
            ΔT &lt; 0 (Soğuk ölçüm)
          </p>
        </Card>

        <Card className="p-3.5 border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs">
          <span className="text-[10px] uppercase font-bold text-slate-400 block">Zirve Sıcaklık</span>
          <div className="text-2xl font-bold text-rose-600 dark:text-rose-400 font-mono mt-1">
            {categorizedData.maxTemp !== null ? `${categorizedData.maxTemp} °C` : '—'}
          </div>
          <p className="text-[10px] text-slate-500 truncate mt-0.5" title={categorizedData.maxTempItem?.panelName || ''}>
            {categorizedData.maxTempItem?.panelName || 'Kayıt yok'}
          </p>
        </Card>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. SIRALI & AKORDİYONLU AKSİYON TABLOLARI                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="space-y-5">
        
        {/* ───────────────────────────────────────────────────────── */}
        {/* 1. SIRADA: ACİL AKSİYON ALINMASI GEREKEN PANOLAR (AÇIK)   */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-rose-200 dark:border-rose-900/60 overflow-hidden shadow-xs bg-white dark:bg-slate-900 transition-all">
          <div 
            onClick={() => setIsUrgentOpen(!isUrgentOpen)}
            className="bg-rose-700 hover:bg-rose-800 cursor-pointer text-white p-3 px-4 flex items-center justify-between transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-white text-rose-800 font-bold text-xs flex items-center justify-center shrink-0">
                1
              </span>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  ACİL AKSİYON ALINMASI GEREKEN PANOLAR
                  <Badge className="bg-rose-900/80 text-white text-[10px] border-rose-400">
                    Öncelikli Teknik Kontrol
                  </Badge>
                </h3>
                <span className="text-[11px] text-rose-100 font-normal">
                  (Trafo/reaktör ile açıklanamayan, &gt;60°C veya kritik mahallerde acil müdahale gereken kayıtlar)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-rose-800 text-white text-xs px-2.5 py-0.5 border-rose-500">
                {categorizedData.urgentActionPanels.length} Pano
              </Badge>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isUrgentOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {isUrgentOpen && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-rose-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-rose-100 dark:border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-2.5 px-4 font-semibold">Pano No / Adı</th>
                      <th className="py-2.5 px-4 font-semibold">Kat / Bölüm</th>
                      <th className="py-2.5 px-4 font-semibold">Ekipman</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Ölçüm (°C)</th>
                      <th className="py-2.5 px-4 font-semibold text-center">ΔT (°C)</th>
                      <th className="py-2.5 px-4 font-semibold">Ölçüm Trendi & Durum Değişimi</th>
                      <th className="py-2.5 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {urgentSlice.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Tebrikler! Bu tesiste acil aksiyon gerektiren aşırı ısınmış pano kaydı bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      urgentSlice.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-rose-50/30 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                            {(urgentPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                            <button
                              onClick={() => onViewItem ? onViewItem(item) : onOpenPanelDetail(item.panelName)}
                              className="hover:text-rose-600 hover:underline text-left cursor-pointer font-bold"
                              title="Pano Ölçüm Detayı & Geçmişi"
                            >
                              {item.panelName}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.floorSection || item.buildingLocation || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.equipmentConnection || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="font-bold font-mono text-sm text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded">
                              {item.measuredTemp} °C
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-rose-700 font-bold">
                            {item.deltaTemp !== null ? `+${item.deltaTemp}°C` : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            {getPanelTrendBadge(item)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onTakeAction && (
                                <Button
                                  size="sm"
                                  onClick={() => onTakeAction(item)}
                                  className="h-7 text-xs px-2.5 bg-rose-600 hover:bg-rose-700 text-white font-semibold shadow-xs"
                                >
                                  Aksiyon Planı Ekle
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenPanelDetail(item.panelName)}
                                className="h-7 text-xs px-2 text-rose-700 dark:text-rose-300 border-rose-200 dark:border-rose-900/50 hover:bg-rose-50"
                                title="Pano Grafiği & Yaşam Döngüsü"
                              >
                                Grafik <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sayfalama Kontrolleri */}
              {categorizedData.urgentActionPanels.length > PAGE_SIZE && (
                <div className="p-3 px-4 border-t border-rose-100 dark:border-slate-800 bg-rose-50/30 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
                  <span>Toplam {categorizedData.urgentActionPanels.length} acil panodan {(urgentPage - 1) * PAGE_SIZE + 1} - {Math.min(urgentPage * PAGE_SIZE, categorizedData.urgentActionPanels.length)} arası</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setUrgentPage(p => Math.max(1, p - 1))}
                      disabled={urgentPage === 1}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Önceki
                    </button>
                    <span className="font-bold px-2">{urgentPage} / {urgentTotalPages}</span>
                    <button
                      onClick={() => setUrgentPage(p => Math.min(urgentTotalPages, p + 1))}
                      disabled={urgentPage >= urgentTotalPages}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* 2. SIRADA: PİK YÜKTE DAHA DA ISINABİLECEK PANOLAR (KAPALI)*/}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-orange-200 dark:border-orange-900/60 overflow-hidden shadow-xs bg-white dark:bg-slate-900 transition-all">
          <div 
            onClick={() => setIsPeakOpen(!isPeakOpen)}
            className="bg-orange-600 hover:bg-orange-700 cursor-pointer text-white p-3 px-4 flex items-center justify-between transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-white text-orange-700 font-bold text-xs flex items-center justify-center shrink-0">
                2
              </span>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  PİK YÜKTE DAHA DA ISINABİLECEK PANOLAR
                  <span className="text-[11px] font-normal text-orange-100">
                    (Akordiyon - Tıklayarak Aç/Kapat)
                  </span>
                </h3>
                <span className="text-[11px] text-orange-100 font-normal">
                  (40°C üstü ve pik/maksimum yük saatlerinde tekrar ölçülmesi gereken kat, MCC ve besleme panoları)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-orange-700 text-white text-xs px-2.5 py-0.5 border-orange-500">
                {categorizedData.peakLoadFollowUpPanels.length} Pano
              </Badge>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isPeakOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {isPeakOpen && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-orange-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-orange-100 dark:border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-2.5 px-4 font-semibold">Pano No / Adı</th>
                      <th className="py-2.5 px-4 font-semibold">Kat / Bölüm</th>
                      <th className="py-2.5 px-4 font-semibold">Ekipman / Görev</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Ölçüm (°C)</th>
                      <th className="py-2.5 px-4 font-semibold text-center">ΔT (°C)</th>
                      <th className="py-2.5 px-4 font-semibold">Ölçüm Trendi & Durum Değişimi</th>
                      <th className="py-2.5 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {peakSlice.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          40°C üzerinde pik yük takibi gerektiren pano kaydı bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      peakSlice.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-orange-50/30 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                            {(peakPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                            <button
                              onClick={() => onViewItem ? onViewItem(item) : onOpenPanelDetail(item.panelName)}
                              className="hover:text-orange-600 hover:underline text-left cursor-pointer font-bold"
                              title="Pano Ölçüm Detayı & Geçmişi"
                            >
                              {item.panelName}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.floorSection || item.buildingLocation || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.equipmentConnection || 'Kat / Besleme Panosu'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="font-bold font-mono text-sm text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950/60 px-2 py-0.5 rounded">
                              {item.measuredTemp} °C
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-orange-700 font-semibold">
                            {item.deltaTemp !== null ? `+${item.deltaTemp}°C` : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            {getPanelTrendBadge(item)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onTakeAction && (
                                <Button
                                  size="sm"
                                  onClick={() => onTakeAction(item)}
                                  className="h-7 text-xs px-2.5 bg-orange-600 hover:bg-orange-700 text-white font-semibold shadow-xs"
                                >
                                  Aksiyon Planı Ekle
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenPanelDetail(item.panelName)}
                                className="h-7 text-xs px-2 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-900/50 hover:bg-orange-50"
                                title="Pano Grafiği & Yaşam Döngüsü"
                              >
                                Grafik <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sayfalama Kontrolleri */}
              {categorizedData.peakLoadFollowUpPanels.length > PAGE_SIZE && (
                <div className="p-3 px-4 border-t border-orange-100 dark:border-slate-800 bg-orange-50/30 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
                  <span>Toplam {categorizedData.peakLoadFollowUpPanels.length} panodan {(peakPage - 1) * PAGE_SIZE + 1} - {Math.min(peakPage * PAGE_SIZE, categorizedData.peakLoadFollowUpPanels.length)} arası</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setPeakPage(p => Math.max(1, p - 1))}
                      disabled={peakPage === 1}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Önceki
                    </button>
                    <span className="font-bold px-2">{peakPage} / {peakTotalPages}</span>
                    <button
                      onClick={() => setPeakPage(p => Math.min(peakTotalPages, p + 1))}
                      disabled={peakPage >= peakTotalPages}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* ───────────────────────────────────────────────────────── */}
        {/* 3. SIRADA: SICAKLIĞI NORMAL OLABİLECEK EKİPMANLAR (KAPALI) */}
        {/* ───────────────────────────────────────────────────────── */}
        <div className="rounded-xl border border-teal-200 dark:border-teal-900/60 overflow-hidden shadow-xs bg-white dark:bg-slate-900 transition-all">
          <div 
            onClick={() => setIsNormalEquipOpen(!isNormalEquipOpen)}
            className="bg-teal-700 hover:bg-teal-800 cursor-pointer text-white p-3 px-4 flex items-center justify-between transition-colors select-none"
          >
            <div className="flex items-center gap-3">
              <span className="w-6 h-6 rounded-full bg-white text-teal-800 font-bold text-xs flex items-center justify-center shrink-0">
                3
              </span>
              <div>
                <h3 className="font-bold text-sm tracking-wide flex items-center gap-2">
                  SICAKLIĞI NORMAL OLABİLECEK EKİPMANLAR
                  <span className="text-[11px] font-normal text-teal-100">
                    (Akordiyon - Tıklayarak Aç/Kapat)
                  </span>
                </h3>
                <span className="text-[11px] text-teal-100 font-normal">
                  (Trafo, şönt reaktör ve kompanzasyon bobini - Üretici kriteri ve çalışma eğrisi ile teyit edilmelidir)
                </span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge className="bg-teal-800 text-white text-xs px-2.5 py-0.5 border-teal-500">
                {categorizedData.normalSpecialEquipments.length} Ekipman
              </Badge>
              <ChevronDown className={`w-5 h-5 transition-transform duration-200 ${isNormalEquipOpen ? 'rotate-180' : ''}`} />
            </div>
          </div>

          {isNormalEquipOpen && (
            <div>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-teal-50/50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-300 border-b border-teal-100 dark:border-slate-800 text-[11px]">
                    <tr>
                      <th className="py-2.5 px-4 font-semibold w-12 text-center">#</th>
                      <th className="py-2.5 px-4 font-semibold">Pano / Ekipman</th>
                      <th className="py-2.5 px-4 font-semibold">Konum / Kat</th>
                      <th className="py-2.5 px-4 font-semibold">Bağlantı Türü</th>
                      <th className="py-2.5 px-4 font-semibold text-center">Ölçüm (°C)</th>
                      <th className="py-2.5 px-4 font-semibold text-center">ΔT (°C)</th>
                      <th className="py-2.5 px-4 font-semibold">Ölçüm Trendi & Durum Değişimi</th>
                      <th className="py-2.5 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {normalEquipSlice.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-8 text-center text-slate-400">
                          Bu tesiste trafo/reaktör grubuna ait yüksek sıcaklık kaydı bulunmuyor.
                        </td>
                      </tr>
                    ) : (
                      normalEquipSlice.map((item, idx) => (
                        <tr key={item.id} className="hover:bg-teal-50/30 dark:hover:bg-slate-800/30 transition-colors">
                          <td className="py-2.5 px-4 text-center text-slate-400 font-mono">
                            {(normalEquipPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-2.5 px-4 font-bold text-slate-900 dark:text-white">
                            <button
                              onClick={() => onViewItem ? onViewItem(item) : onOpenPanelDetail(item.panelName)}
                              className="hover:text-teal-700 hover:underline text-left cursor-pointer font-bold"
                              title="Pano Ölçüm Detayı & Geçmişi"
                            >
                              {item.panelName}
                            </button>
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.floorSection || item.buildingLocation || '—'}
                          </td>
                          <td className="py-2.5 px-4 text-slate-600 dark:text-slate-300">
                            {item.equipmentConnection || 'Trafo / Bobin / Reaktör'}
                          </td>
                          <td className="py-2.5 px-4 text-center">
                            <span className="font-bold font-mono text-sm text-teal-700 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/60 px-2 py-0.5 rounded">
                              {item.measuredTemp} °C
                            </span>
                          </td>
                          <td className="py-2.5 px-4 text-center font-mono text-slate-500 font-semibold">
                            {item.deltaTemp !== null ? `+${item.deltaTemp}°C` : '—'}
                          </td>
                          <td className="py-2.5 px-4">
                            {getPanelTrendBadge(item)}
                          </td>
                          <td className="py-2.5 px-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              {onTakeAction && (
                                <Button
                                  size="sm"
                                  onClick={() => onTakeAction(item)}
                                  className="h-7 text-xs px-2.5 bg-teal-700 hover:bg-teal-800 text-white font-semibold shadow-xs"
                                >
                                  Aksiyon Planı Ekle
                                </Button>
                              )}
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onOpenPanelDetail(item.panelName)}
                                className="h-7 text-xs px-2 text-teal-800 dark:text-teal-300 border-teal-200 dark:border-teal-900/50 hover:bg-teal-50"
                                title="Pano Grafiği & Yaşam Döngüsü"
                              >
                                Grafik <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Sayfalama Kontrolleri */}
              {categorizedData.normalSpecialEquipments.length > PAGE_SIZE && (
                <div className="p-3 px-4 border-t border-teal-100 dark:border-slate-800 bg-teal-50/30 dark:bg-slate-900 flex items-center justify-between text-xs text-slate-500">
                  <span>Toplam {categorizedData.normalSpecialEquipments.length} ekipmandan {(normalEquipPage - 1) * PAGE_SIZE + 1} - {Math.min(normalEquipPage * PAGE_SIZE, categorizedData.normalSpecialEquipments.length)} arası</span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => setNormalEquipPage(p => Math.max(1, p - 1))}
                      disabled={normalEquipPage === 1}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Önceki
                    </button>
                    <span className="font-bold px-2">{normalEquipPage} / {normalEquipTotalPages}</span>
                    <button
                      onClick={() => setNormalEquipPage(p => Math.min(normalEquipTotalPages, p + 1))}
                      disabled={normalEquipPage >= normalEquipTotalPages}
                      className="px-2 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 disabled:opacity-40"
                    >
                      Sonraki
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};
