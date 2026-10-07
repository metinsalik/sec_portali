import React, { useMemo, useState } from 'react';
import type { ThermalInspectionItem } from '@/services/thermal-inspection.service';
import { ThermalItemDetailModal } from './ThermalItemDetailModal';
import { ThermalActionModal } from './ThermalActionModal';
import { 
  Thermometer, 
  AlertTriangle, 
  CheckCircle2, 
  Flame, 
  Search, 
  Download, 
  Filter, 
  Layers, 
  ArrowLeft,
  ArrowUpDown,
  Building2,
  Camera,
  Edit2,
  Trash2,
  ChevronRight,
  Eye,
  Clock,
  ShieldAlert,
  Info,
  Calendar,
  ChevronLeft,
  Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip as RechartsTooltip, 
  Cell, 
  PieChart, 
  Pie 
} from 'recharts';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription, 
  DialogFooter 
} from '@/components/ui/dialog';

interface Props {
  items: ThermalInspectionItem[];
  facilityName?: string;
  facilityId?: string;
  dateRange?: string;
  onBack?: () => void;
  onAddPhoto?: (item: ThermalInspectionItem) => void;
  onEditItem?: (item: ThermalInspectionItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onItemUpdated?: (updatedItem: ThermalInspectionItem) => void;
  onOpenPanelDetail?: (panelName: string) => void;
  onCleanupEmptyClick?: () => void;
  onDeleteSession?: () => void;
}

export const ThermalDashboardView: React.FC<Props> = ({
  items: rawItems,
  facilityName = 'Tesis',
  facilityId,
  dateRange = '—',
  onBack,
  onAddPhoto,
  onEditItem,
  onDeleteItem,
  onItemUpdated,
  onOpenPanelDetail,
  onCleanupEmptyClick,
  onDeleteSession
}) => {
  const items = Array.isArray(rawItems) ? rawItems : [];

  // Filter & Search states
  const [q, setQ] = useState('');
  const [statusCategoryFilter, setStatusCategoryFilter] = useState<'ALL' | 'ACIL' | 'UYGUNSUZ' | 'TAKIP' | 'NORMAL'>('ALL');
  const [sortField, setSortField] = useState<'SEVERITY_STATUS' | 'PANEL_NAME' | 'ORDER'>('SEVERITY_STATUS');

  // Modal / Preview states
  const [selectedDetailItem, setSelectedDetailItem] = useState<ThermalInspectionItem | null>(null);
  const [selectedActionItem, setSelectedActionItem] = useState<ThermalInspectionItem | null>(null);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeletingSession, setIsDeletingSession] = useState(false);

  const confirmDeleteSession = async () => {
    if (!onDeleteSession) return;
    setIsDeletingSession(true);
    try {
      await onDeleteSession();
      setIsDeleteDialogOpen(false);
    } finally {
      setIsDeletingSession(false);
    }
  };

  const nval = (x: any) => {
    if (x === null || x === undefined) return null;
    const n = Number(String(x).replace(',', '.'));
    return Number.isFinite(n) ? n : null;
  };
  const fmt = (n: number) => new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 1 }).format(n);

  // Helper to map item into 4 status categories:
  // 1. ÖNCELİKLE Formdaki / Excel'deki uzman değerlendirmesi (Ground Truth) esas alınır:
  //    - Durum "Normal" veya Öncelik "Rutin" ise -> NORMAL (Sıcaklık veya ΔT yüksek olsa dahi uzman kararı bozulmaz!)
  //    - Durum "Acil" / "Kritik" veya Öncelik "Acil" -> ACIL
  //    - Durum "Uygunsuz" / "Dikkat" veya Öncelik "Yüksek" -> UYGUNSUZ
  //    - Durum "Takip" veya Öncelik "Orta" -> TAKIP
  // 2. Yalnızca formda durum ve öncelik hiç girilmemişse (boş bırakılmışsa) sıcaklık/fark eşikleriyle tahmini kategori atanır.
  const getItemCategory = (r: ThermalInspectionItem): 'ACIL' | 'UYGUNSUZ' | 'TAKIP' | 'NORMAL' => {
    const st = (r.status || '').toLocaleLowerCase('tr-TR').trim();
    const pr = (r.priority || '').toLocaleLowerCase('tr-TR').trim();
    const mt = nval(r.measuredTemp);
    const dt = nval(r.deltaTemp);

    // 1. Uzman değerlendirmesi kontrolü (Formda girilen Durum/Öncelik)
    if (st.includes('normal') || pr.includes('rutin') || pr.includes('düşük') || pr.includes('dusuk')) {
      return 'NORMAL';
    }
    if (pr.includes('acil') || st.includes('acil') || st.includes('kritik')) {
      return 'ACIL';
    }
    if (st.includes('uygunsuz') || pr.includes('yüksek') || st.includes('dikkat')) {
      return 'UYGUNSUZ';
    }
    if (st.includes('takip') || pr.includes('orta')) {
      return 'TAKIP';
    }

    // 2. Formda Durum/Öncelik belirtilmemişse (boşsa) tahmini eşik kontrolü
    if (!st && !pr) {
      if ((mt !== null && mt >= 60) || (dt !== null && dt >= 25)) {
        return 'ACIL';
      }
      if ((mt !== null && mt >= 50) || (dt !== null && dt >= 15)) {
        return 'UYGUNSUZ';
      }
      if ((mt !== null && mt >= 42) || (dt !== null && dt >= 10)) {
        return 'TAKIP';
      }
    }

    return 'NORMAL';
  };

  // Severity Weight for Sorting:
  // Acil: 4 (En üstte)
  // Uygunsuz: 3
  // Takip: 2
  // Normal: 1
  const getCategoryWeight = (cat: 'ACIL' | 'UYGUNSUZ' | 'TAKIP' | 'NORMAL'): number => {
    switch (cat) {
      case 'ACIL': return 4;
      case 'UYGUNSUZ': return 3;
      case 'TAKIP': return 2;
      case 'NORMAL': return 1;
    }
  };

  // Statistics calculation
  const stats = useMemo(() => {
    const safeItems = Array.isArray(items) ? items : [];
    const total = safeItems.length;

    let acilCount = 0;
    let uygunsuzCount = 0;
    let takipCount = 0;
    let normalCount = 0;

    safeItems.forEach(r => {
      const cat = getItemCategory(r);
      if (cat === 'ACIL') acilCount++;
      else if (cat === 'UYGUNSUZ') uygunsuzCount++;
      else if (cat === 'TAKIP') takipCount++;
      else normalCount++;
    });

    const nonNormalCount = acilCount + uygunsuzCount + takipCount;

    const temps = safeItems.map(r => nval(r.measuredTemp)).filter((x): x is number => x !== null);
    const avg = temps.length ? temps.reduce((a, b) => a + b, 0) / temps.length : 0;
    const mx = temps.length ? Math.max(...temps) : 0;
    const maxRow = safeItems.find(r => nval(r.measuredTemp) === mx);

    // Status Risk Dağılımı (Bar Chart)
    const statusChartData = [
      { name: 'Acil Müdahale', count: acilCount, color: '#e11d48', desc: 'Isınma ve Kritik Risk' },
      { name: 'Uygunsuz', count: uygunsuzCount, color: '#ea580c', desc: 'Standart Dışı Sıcaklık' },
      { name: 'Takip Gereken', count: takipCount, color: '#eab308', desc: 'İzlemeye Alınan Panolar' },
      { name: 'Normal', count: normalCount, color: '#10b981', desc: 'Sorunsuz Panolar' }
    ];

    // Temperature distribution (Pie Chart)
    const tempBuckets = [
      { name: '< 30°C (Düşük)', count: 0, color: '#0ea5e9' },
      { name: '30 - 40°C (Normal)', count: 0, color: '#10b981' },
      { name: '40 - 50°C (Ilık)', count: 0, color: '#f59e0b' },
      { name: '≥ 50°C (Yüksek/Kritik)', count: 0, color: '#ef4444' }
    ];

    temps.forEach(t => {
      if (t < 30) tempBuckets[0].count++;
      else if (t < 40) tempBuckets[1].count++;
      else if (t < 50) tempBuckets[2].count++;
      else tempBuckets[3].count++;
    });

    return {
      total,
      nonNormalCount,
      acilCount,
      uygunsuzCount,
      takipCount,
      normalCount,
      avg,
      mx,
      maxRow,
      statusChartData,
      tempBuckets: tempBuckets.filter(b => b.count > 0)
    };
  }, [items]);

  // Filtered & Sorted items list
  const filteredAndSortedItems = useMemo(() => {
    let result = [...items];

    // Filter by Status Category
    if (statusCategoryFilter !== 'ALL') {
      result = result.filter(r => getItemCategory(r) === statusCategoryFilter);
    }

    // Filter by query
    if (q.trim()) {
      const query = q.trim().toLocaleLowerCase('tr-TR');
      result = result.filter(r =>
        (r.panelName && r.panelName.toLocaleLowerCase('tr-TR').includes(query)) ||
        (r.equipmentConnection && r.equipmentConnection.toLocaleLowerCase('tr-TR').includes(query)) ||
        (r.buildingLocation && r.buildingLocation.toLocaleLowerCase('tr-TR').includes(query)) ||
        (r.detectedRisk && r.detectedRisk.toLocaleLowerCase('tr-TR').includes(query))
      );
    }

    // Sort: By default SEVERITY_STATUS sorts Acil -> Uygunsuz -> Takip -> Normal, with measuredTemp descending inside ties
    if (sortField === 'SEVERITY_STATUS') {
      result.sort((a, b) => {
        const catA = getItemCategory(a);
        const catB = getItemCategory(b);
        const weightDiff = getCategoryWeight(catB) - getCategoryWeight(catA);
        if (weightDiff !== 0) return weightDiff;
        // If same category, sort by measured temp descending
        const aMt = nval(a.measuredTemp) || 0;
        const bMt = nval(b.measuredTemp) || 0;
        return bMt - aMt;
      });
    } else if (sortField === 'PANEL_NAME') {
      result.sort((a, b) => (a.panelName || '').localeCompare(b.panelName || ''));
    } else if (sortField === 'ORDER') {
      result.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    }

    return result;
  }, [items, statusCategoryFilter, q, sortField]);

  // Export CSV
  const handleDownloadCSV = () => {
    const headers = ["No", "Lokasyon / Bina", "Pano No / Adı", "Ekipman / Bağlantı", "Ölçülen Sıcaklık (°C)", "Ortam Sıcaklığı (°C)", "Kategori", "Durum", "Öncelik", "Tespit Edilen Risk", "Aksiyon"];
    const quote = (x: any) => '"' + String(x ?? '').replaceAll('"', '""') + '"';
    
    const csvLines = [headers.map(quote).join(';')];
    filteredAndSortedItems.forEach(r => {
      const cat = getItemCategory(r);
      const row = [
        r.orderIndex || '',
        r.buildingLocation || '',
        r.panelName || '',
        r.equipmentConnection || '',
        r.measuredTemp !== null && r.measuredTemp !== undefined ? r.measuredTemp : '',
        r.ambientTemp !== null && r.ambientTemp !== undefined ? r.ambientTemp : '',
        cat,
        r.status || '',
        r.priority || '',
        r.detectedRisk || '',
        r.actionTaken || ''
      ];
      csvLines.push(row.map(quote).join(';'));
    });
    
    const csv = '\uFEFF' + csvLines.join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${facilityName}_termal_pano_olcumleri.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-5">
      {/* 0. Top Navigation / Breadcrumb Bar (Hızlı ve Net Geri Dönüş) */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
          {onBack && (
            <button
              onClick={onBack}
              type="button"
              className="inline-flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-800 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              Kontrol Tarihleri Listesi
            </button>
          )}
          <span>/</span>
          <span className="font-medium text-slate-700 dark:text-slate-300">{facilityName}</span>
          <span>/</span>
          <span className="font-semibold text-slate-900 dark:text-white">{dateRange} Kontrolü</span>
        </div>

        {onBack && (
          <Button
            onClick={onBack}
            variant="ghost"
            size="sm"
            className="h-7 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Geri Dön
          </Button>
        )}
      </div>

      {/* 1. Header Banner */}
      <div className="rounded-2xl p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white shadow-lg border border-indigo-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {facilityName}
            </span>
            <span className="text-xs text-slate-400">Kontrol Tarihi: {dateRange}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">
            Pano Termal Ölçüm ve Sıcaklık Takip Tablosu
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-xl">
            Panolar öncelik sırasına göre <strong>Acil</strong>, <strong>Uygunsuz</strong> ve <strong>Takip</strong> gerektirenler en üstte olacak şekilde listelenmiştir. Detay ve fotoğraflar için satıra tıklayınız.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {onBack && (
            <Button
              onClick={onBack}
              variant="outline"
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm gap-2 text-xs h-10 px-4 font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              Kontrol Tarihlerine Dön
            </Button>
          )}
          <Button
            onClick={handleDownloadCSV}
            variant="outline"
            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm gap-2 text-xs h-10 px-4 font-semibold"
          >
            <Download className="w-4 h-4" />
            CSV İndir
          </Button>
          {onCleanupEmptyClick && (
            <Button
              onClick={onCleanupEmptyClick}
              variant="outline"
              className="bg-rose-500/10 hover:bg-rose-500/20 text-rose-200 border-rose-400/30 backdrop-blur-sm gap-2 text-xs h-10 px-3.5 font-semibold transition-colors"
              title="Bu oturumdaki ve genel kayıtlar arasındaki boş / anlamsız satırları temizler"
            >
              <Sparkles className="w-4 h-4 text-rose-400" />
              Boş Satırları Temizle
            </Button>
          )}
          {onDeleteSession && (
            <Button
              onClick={() => setIsDeleteDialogOpen(true)}
              variant="outline"
              className="bg-rose-600/20 hover:bg-rose-600/30 text-rose-200 border-rose-500/40 backdrop-blur-sm gap-2 text-xs h-10 px-3.5 font-semibold transition-colors"
              title="Bu oturumu tamamen sil"
            >
              <Trash2 className="w-4 h-4 text-rose-400" />
              Oturumu Sil
            </Button>
          )}
        </div>
      </div>

      {/* 2. Top Summary KPI Cards: Acil, Uygunsuz, Takip, Normal */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        <Card 
          onClick={() => setStatusCategoryFilter('ALL')}
          className={`cursor-pointer transition-all border-slate-200 dark:border-slate-800 ${
            statusCategoryFilter === 'ALL' ? 'ring-2 ring-indigo-500 shadow-md' : 'hover:border-slate-300'
          }`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-slate-500 block uppercase">Toplam Pano</span>
              <span className="text-2xl font-extrabold text-slate-900 dark:text-white mt-0.5 block">{stats.total}</span>
              <span className="text-[10px] text-slate-400">ölçülen pano</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* 1. ACİL (Red) */}
        <Card 
          onClick={() => setStatusCategoryFilter(statusCategoryFilter === 'ACIL' ? 'ALL' : 'ACIL')}
          className={`cursor-pointer transition-all ${
            stats.acilCount > 0 ? 'border-rose-300 bg-rose-50/40 dark:bg-rose-950/20' : 'border-slate-200 dark:border-slate-800'
          } ${statusCategoryFilter === 'ACIL' ? 'ring-2 ring-rose-600 shadow-md' : 'hover:border-rose-400'}`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-rose-600 block uppercase">Acil Müdahale</span>
              <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-400 mt-0.5 block">{stats.acilCount}</span>
              <span className="text-[10px] text-rose-500">en yüksek risk</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-900/50 text-rose-600 flex items-center justify-center">
              <Flame className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* 2. UYGUNSUZ (Orange) */}
        <Card 
          onClick={() => setStatusCategoryFilter(statusCategoryFilter === 'UYGUNSUZ' ? 'ALL' : 'UYGUNSUZ')}
          className={`cursor-pointer transition-all ${
            stats.uygunsuzCount > 0 ? 'border-orange-300 bg-orange-50/40 dark:bg-orange-950/20' : 'border-slate-200 dark:border-slate-800'
          } ${statusCategoryFilter === 'UYGUNSUZ' ? 'ring-2 ring-orange-500 shadow-md' : 'hover:border-orange-400'}`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-orange-600 block uppercase">Uygunsuz</span>
              <span className="text-2xl font-extrabold text-orange-600 dark:text-orange-400 mt-0.5 block">{stats.uygunsuzCount}</span>
              <span className="text-[10px] text-orange-500">standart dışı</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-900/50 text-orange-600 flex items-center justify-center">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* 3. TAKİP (Yellow) */}
        <Card 
          onClick={() => setStatusCategoryFilter(statusCategoryFilter === 'TAKIP' ? 'ALL' : 'TAKIP')}
          className={`cursor-pointer transition-all ${
            stats.takipCount > 0 ? 'border-amber-300 bg-amber-50/40 dark:bg-amber-950/20' : 'border-slate-200 dark:border-slate-800'
          } ${statusCategoryFilter === 'TAKIP' ? 'ring-2 ring-amber-500 shadow-md' : 'hover:border-amber-400'}`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-amber-700 block uppercase">Takip Edilecek</span>
              <span className="text-2xl font-extrabold text-amber-600 dark:text-amber-400 mt-0.5 block">{stats.takipCount}</span>
              <span className="text-[10px] text-amber-600">izlemede</span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-900/50 text-amber-700 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>

        {/* 4. NORMAL (Green) */}
        <Card 
          onClick={() => setStatusCategoryFilter(statusCategoryFilter === 'NORMAL' ? 'ALL' : 'NORMAL')}
          className={`cursor-pointer transition-all border-emerald-200 bg-emerald-50/20 dark:bg-emerald-950/10 ${
            statusCategoryFilter === 'NORMAL' ? 'ring-2 ring-emerald-500 shadow-md' : 'hover:border-emerald-300'
          }`}
        >
          <CardContent className="p-3.5 flex items-center justify-between">
            <div>
              <span className="text-[11px] font-semibold text-emerald-600 block uppercase">Normal Sıcaklık</span>
              <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 block">{stats.normalCount}</span>
              <span className="text-[10px] text-emerald-500">
                {stats.total ? `%${fmt((stats.normalCount / stats.total) * 100)}` : '—'}
              </span>
            </div>
            <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Meaningful Operational Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Anlamlı Grafik 1: Pano Durum ve Risk Sınıflandırması */}
        <Card className="lg:col-span-2 border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-indigo-600" />
                Pano Durum ve Risk Sınıflandırması
              </h3>
              <p className="text-[11px] text-slate-500">Acil, Uygunsuz, Takip ve Normal durumdaki panoların adet dağılımı</p>
            </div>
            <Badge variant="outline" className="text-[10px]">
              Risk Göstergesi
            </Badge>
          </div>
          <CardContent className="p-4">
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.statusChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} stroke="#94a3b8" />
                  <YAxis tick={{ fontSize: 11 }} stroke="#94a3b8" allowDecimals={false} />
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                  <Bar dataKey="count" name="Pano Sayısı" radius={[6, 6, 0, 0]}>
                    {stats.statusChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Anlamlı Grafik 2: Sıcaklık Aralığı Dağılımı */}
        <Card className="border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-slate-900 dark:text-white text-xs flex items-center gap-1.5">
              <Thermometer className="w-4 h-4 text-indigo-600" />
              Sıcaklık Derecesi Aralığı
            </h3>
            <p className="text-[11px] text-slate-500">Panoların ölçülen sıcaklık bantları</p>
          </div>
          <CardContent className="p-4">
            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={stats.tempBuckets}
                    dataKey="count"
                    nameKey="name"
                    cx="50%"
                    cy="50%"
                    innerRadius={42}
                    outerRadius={65}
                    paddingAngle={4}
                  >
                    {stats.tempBuckets.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-2 gap-1.5 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-[10px]">
              {stats.tempBuckets.map((b) => (
                <div key={b.name} className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: b.color }} />
                  <span className="text-slate-600 dark:text-slate-400 truncate">{b.name}:</span>
                  <span className="font-bold text-slate-900 dark:text-white">{b.count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 4. Elegant and Clean Panels Measurement Table (Kat ve Fark sütunları kaldırıldı, Duruma göre sıralandı) */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
        {/* Table Toolbar */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Thermometer className="w-4 h-4 text-indigo-600" />
            <h3 className="font-bold text-slate-900 dark:text-white text-sm">
              Pano Ölçüm Listesi
            </h3>
            <Badge variant="outline" className="text-[11px] px-2 py-0 border-slate-300">
              {filteredAndSortedItems.length} Kayıt
            </Badge>
            <span className="text-[11px] text-slate-500 italic hidden sm:inline">
              (Acil, Uygunsuz ve Takip panoları en üsttedir)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Filter Mode Selector: Tümü, Acil, Uygunsuz, Takip, Normal */}
            <div className="inline-flex rounded-lg bg-slate-200/70 dark:bg-slate-800 p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setStatusCategoryFilter('ALL')}
                className={`px-2.5 py-1 rounded-md transition-colors ${statusCategoryFilter === 'ALL' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Tümü ({stats.total})
              </button>
              <button
                type="button"
                onClick={() => setStatusCategoryFilter('ACIL')}
                className={`px-2 py-1 rounded-md transition-colors ${statusCategoryFilter === 'ACIL' ? 'bg-rose-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Acil ({stats.acilCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusCategoryFilter('UYGUNSUZ')}
                className={`px-2 py-1 rounded-md transition-colors ${statusCategoryFilter === 'UYGUNSUZ' ? 'bg-orange-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Uygunsuz ({stats.uygunsuzCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusCategoryFilter('TAKIP')}
                className={`px-2 py-1 rounded-md transition-colors ${statusCategoryFilter === 'TAKIP' ? 'bg-amber-500 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Takip ({stats.takipCount})
              </button>
              <button
                type="button"
                onClick={() => setStatusCategoryFilter('NORMAL')}
                className={`px-2 py-1 rounded-md transition-colors ${statusCategoryFilter === 'NORMAL' ? 'bg-emerald-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
              >
                Normal ({stats.normalCount})
              </button>
            </div>

            {/* Sort Dropdown */}
            <select
              value={sortField}
              onChange={(e) => setSortField(e.target.value as any)}
              className="h-8 text-xs px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="SEVERITY_STATUS">Sıralama: Acil &gt; Uygunsuz &gt; Takip &gt; Normal</option>
              <option value="PANEL_NAME">Sıralama: Pano Adı</option>
              <option value="ORDER">Sıralama: Sıra No</option>
            </select>

            {/* Search Input */}
            <div className="relative w-44">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
              <Input
                placeholder="Pano adı veya risk ara..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-8 text-xs h-8 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-700"
              />
            </div>
          </div>
        </div>

        {/* Table Content (Kat/Bölüm, Fark ΔT ve Fotoğraf kaldırıldı; tıklayınca detayda görünüyor) */}
        <div className="overflow-x-auto max-h-[640px] dark-scrollbar">
          <table className="w-full text-left text-xs text-slate-700 dark:text-slate-300">
            <thead className="sticky top-0 z-10 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 uppercase font-semibold text-[11px] border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th className="px-3.5 py-3 w-12 text-center">#</th>
                <th className="px-3.5 py-3">Pano Adı / No</th>
                <th className="px-3.5 py-3">Ekipman / Bağlantı Noktası</th>
                <th className="px-3.5 py-3 text-right">Ölçülen Sıcaklık</th>
                <th className="px-3.5 py-3 text-right">Ortam Sıcaklığı</th>
                <th className="px-3.5 py-3 text-center">Durum</th>
                <th className="px-3.5 py-3">Tespit / Risk</th>
                <th className="px-3.5 py-3">Planlanan Aksiyon / Takip</th>
                <th className="px-3.5 py-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredAndSortedItems.map((r, idx) => {
                const mt = nval(r.measuredTemp);
                const at = nval(r.ambientTemp);
                const dt = nval(r.deltaTemp);
                const cat = getItemCategory(r);

                // Row style based on category
                let rowBgClass = 'hover:bg-slate-50 dark:hover:bg-slate-800/50';
                if (cat === 'ACIL') {
                  rowBgClass = 'bg-rose-50/50 hover:bg-rose-100/60 dark:bg-rose-950/30 dark:hover:bg-rose-900/40';
                } else if (cat === 'UYGUNSUZ') {
                  rowBgClass = 'bg-orange-50/40 hover:bg-orange-100/50 dark:bg-orange-950/20 dark:hover:bg-orange-900/30';
                } else if (cat === 'TAKIP') {
                  rowBgClass = 'bg-amber-50/30 hover:bg-amber-100/40 dark:bg-amber-950/20 dark:hover:bg-amber-900/30';
                }

                return (
                  <tr
                    key={r.id}
                    onClick={() => {
                      if (onOpenPanelDetail) {
                        onOpenPanelDetail(r.panelName);
                      } else {
                        setSelectedDetailItem(r);
                      }
                    }}
                    className={`cursor-pointer transition-colors ${rowBgClass}`}
                    title="Panonun analiz ve yaşam döngüsü sayfasına gitmek için tıklayınız"
                  >
                    <td className="px-3.5 py-3.5 text-center font-mono text-slate-400 text-[11px]">
                      {r.orderIndex || (idx + 1)}
                    </td>

                    <td className="px-3.5 py-3.5">
                      <div className="flex items-center gap-2">
                        {cat === 'ACIL' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0 animate-pulse" title="Acil Müdahale" />
                        )}
                        {cat === 'UYGUNSUZ' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0" title="Uygunsuz" />
                        )}
                        {cat === 'TAKIP' && (
                          <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" title="Takip Edilmeli" />
                        )}
                        {onOpenPanelDetail ? (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenPanelDetail(r.panelName);
                            }}
                            className="font-bold text-slate-900 dark:text-white text-xs hover:text-indigo-600 hover:underline transition-colors text-left"
                            title="Bu panonun geçmiş ölçüm ve sıcaklık trend sayfasını aç"
                          >
                            {r.panelName}
                          </button>
                        ) : (
                          <span className="font-bold text-slate-900 dark:text-white text-xs hover:text-indigo-600 transition-colors">
                            {r.panelName}
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-3.5 py-3.5 text-slate-600 dark:text-slate-300 max-w-[200px] truncate" title={r.equipmentConnection || ''}>
                      {r.equipmentConnection || '—'}
                    </td>

                    <td className="px-3.5 py-3.5 text-right font-mono font-bold">
                      <span className={`px-2 py-0.5 rounded ${
                        cat === 'ACIL' 
                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-extrabold' 
                          : cat === 'UYGUNSUZ'
                          ? 'bg-orange-100 text-orange-700 dark:bg-orange-950/60 dark:text-orange-300 font-bold'
                          : cat === 'TAKIP'
                          ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 font-medium'
                          : 'text-slate-800 dark:text-slate-200 font-medium'
                      }`}>
                        {mt !== null ? `${fmt(mt)} °C` : '—'}
                      </span>
                      {dt !== null && (
                        <span className="block text-[10px] text-slate-400 font-normal">
                          ΔT: {fmt(dt)} °C
                        </span>
                      )}
                    </td>

                    <td className="px-3.5 py-3.5 text-right font-mono text-slate-500">
                      {at !== null ? `${fmt(at)} °C` : '—'}
                    </td>

                    <td className="px-3.5 py-3.5 text-center">
                      {cat === 'ACIL' && (
                        <Badge className="bg-rose-600 hover:bg-rose-600 text-white font-bold text-[10px] px-2 py-0.5">
                          Acil
                        </Badge>
                      )}
                      {cat === 'UYGUNSUZ' && (
                        <Badge className="bg-orange-500 hover:bg-orange-500 text-white font-semibold text-[10px] px-2 py-0.5">
                          Uygunsuz
                        </Badge>
                      )}
                      {cat === 'TAKIP' && (
                        <Badge className="bg-amber-500 hover:bg-amber-500 text-white font-medium text-[10px] px-2 py-0.5">
                          Takip
                        </Badge>
                      )}
                      {cat === 'NORMAL' && (
                        <Badge variant="outline" className="border-emerald-300 text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 text-[10px] px-2 py-0.5">
                          Normal
                        </Badge>
                      )}
                    </td>

                    <td className="px-3.5 py-3.5 text-slate-500 max-w-[200px] truncate" title={r.detectedRisk || ''}>
                      {r.detectedRisk || '—'}
                    </td>

                    {/* Planlanan Aksiyon & Durum Hücresi */}
                    <td className="px-3.5 py-3.5 max-w-[220px]">
                      {r.actionPlan || r.actionTaken ? (
                        <div className="space-y-0.5">
                          <p className="font-semibold text-slate-900 dark:text-white truncate" title={r.actionPlan || r.actionTaken || ''}>
                            {r.actionPlan || r.actionTaken}
                          </p>
                          <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                            {r.actionStatus === 'TAMAMLANDI' ? (
                              <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                                <CheckCircle2 className="w-3 h-3" /> Çözüldü
                              </span>
                            ) : r.actionStatus === 'DEVAM_EDIYOR' ? (
                              <span className="text-blue-600 font-bold flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> İşlemde
                              </span>
                            ) : (
                              <span className="text-amber-600 font-medium flex items-center gap-0.5">
                                <Clock className="w-3 h-3" /> Bekliyor
                              </span>
                            )}
                            {r.actionDueDate && (
                              <span>Termin: {new Date(r.actionDueDate).toLocaleDateString('tr-TR')}</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic text-[11px]">— Aksiyon Yok —</span>
                      )}
                    </td>

                    <td className="px-3.5 py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Acil, Uygunsuz veya Takip durumunda 'Aksiyon Al' butonu */}
                        {(cat === 'ACIL' || cat === 'UYGUNSUZ' || cat === 'TAKIP' || r.actionPlan) && (
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setSelectedActionItem(r)}
                            className="h-7 px-2.5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white font-semibold gap-1 shadow-sm"
                            title="Aksiyon planı oluştur veya güncelle"
                          >
                            <Edit2 className="w-3 h-3" />
                            Aksiyon Al
                          </Button>
                        )}

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (onOpenPanelDetail) {
                              onOpenPanelDetail(r.panelName);
                            } else {
                              setSelectedDetailItem(r);
                            }
                          }}
                          className="h-7 text-xs text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800 gap-1 font-semibold"
                          title="Pano analiz sayfasına git"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          Pano Sayfası
                        </Button>

                        {onEditItem && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800"
                            onClick={() => onEditItem(r)}
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                        )}

                        {/* 📷 Fotoğraf Ekle / Yönet */}
                        <button
                          type="button"
                          onClick={() => setSelectedDetailItem(r)}
                          title={`Termal fotoğraf ekle / görüntüle (${r.photoUrls?.length || 0} fotoğraf)`}
                          className={`relative w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                            (r.photoUrls?.length || 0) > 0
                              ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 dark:hover:bg-emerald-900/40'
                              : 'text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-slate-800'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          {(r.photoUrls?.length || 0) > 0 && (
                            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white text-[8px] font-bold flex items-center justify-center leading-none">
                              {r.photoUrls!.length}
                            </span>
                          )}
                        </button>

                        {onDeleteItem && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800"
                            onClick={() => onDeleteItem(r.id)}
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    </td>

                  </tr>
                );
              })}

              {filteredAndSortedItems.length === 0 && (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    Arama kriterlerinize uygun ölçüm kaydı bulunamadı.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 flex items-center justify-between text-xs text-slate-500">
          <span>Toplam <b>{filteredAndSortedItems.length}</b> pano listeleniyor (Satıra basıldığında tüm detaylar ve fotoğraflar açılır)</span>
          <span>Sıralama Ölçütü: Acil &gt; Uygunsuz &gt; Takip &gt; Normal</span>
        </div>
      </Card>

      {/* 5. Row Click Detail Dialog (Fotoğraflarla birlikte dialog) */}
      <ThermalItemDetailModal
        isOpen={Boolean(selectedDetailItem)}
        onClose={() => setSelectedDetailItem(null)}
        item={selectedDetailItem}
        facilityId={facilityId}
        onOpenPhotos={(it) => onAddPhoto && onAddPhoto(it)}
        onEdit={(it) => onEditItem && onEditItem(it)}
        onTakeAction={(it) => setSelectedActionItem(it)}
        onOpenPanelPage={(panel) => onOpenPanelDetail && onOpenPanelDetail(panel)}
        onItemUpdated={(updated) => {
          // Update local state so re-opening same item shows new photos
          setSelectedDetailItem(updated);
          onItemUpdated?.(updated);
        }}
      />

      {/* 6. Action Modal (Aksiyon Al & Termin Takibi) */}
      {selectedActionItem && (
        <ThermalActionModal
          isOpen={Boolean(selectedActionItem)}
          onClose={() => setSelectedActionItem(null)}
          item={selectedActionItem}
          onActionSaved={(updated) => {
            if (onItemUpdated) {
              onItemUpdated(updated);
            }
            if (selectedDetailItem && selectedDetailItem.id === updated.id) {
              setSelectedDetailItem(updated);
            }
          }}
        />
      )}

      {/* 7. Delete Session Confirmation Modal */}
      {onDeleteSession && (
        <Dialog open={isDeleteDialogOpen} onOpenChange={(open) => !open && !isDeletingSession && setIsDeleteDialogOpen(false)}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 border dark:border-slate-800 p-6">
            <DialogHeader>
              <div className="w-12 h-12 rounded-full bg-rose-100 dark:bg-rose-950/50 text-rose-600 flex items-center justify-center mb-2 mx-auto sm:mx-0">
                <Trash2 className="w-6 h-6" />
              </div>
              <DialogTitle className="text-lg font-bold text-slate-900 dark:text-white">
                Kontrol Oturumunu Sil
              </DialogTitle>
              <DialogDescription className="text-sm text-slate-500 dark:text-slate-400 mt-2">
                <strong className="text-slate-900 dark:text-white">{facilityName} ({dateRange})</strong> kontrol oturumunu silmek istediğinize emin misiniz?
                <span className="block mt-2 font-medium text-rose-600 dark:text-rose-400">
                  Bu oturuma ait {items.length} adet pano ölçüm kaydı ve fotoğrafları kalıcı olarak silinecektir. Bu işlem geri alınamaz.
                </span>
              </DialogDescription>
            </DialogHeader>

            <DialogFooter className="mt-4 flex flex-row justify-end gap-2 border-t pt-4 dark:border-slate-800">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeletingSession}
              >
                Vazgeç
              </Button>
              <Button
                type="button"
                variant="destructive"
                className="bg-rose-600 hover:bg-rose-700 text-white font-medium"
                onClick={confirmDeleteSession}
                disabled={isDeletingSession}
              >
                {isDeletingSession ? 'Siliniyor...' : 'Evet, Oturumu Sil'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};
