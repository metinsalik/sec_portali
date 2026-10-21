import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  Building2, Layers, AlertTriangle, TrendingUp, LayoutDashboard,
  ClipboardList, Zap, Wrench, Flame
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { 
  type DashboardStats, 
  type FacilityOption,
} from './types';
import { ExecutiveProgressCockpit } from './ExecutiveProgressCockpit';

const API = import.meta.env.VITE_API_URL || '';

interface ReportModuleDashboardProps {
  moduleGroup: 'DENETIMLER' | 'ELEKTRIK' | 'MEKANIK' | 'YANGIN';
}

const MODULE_NAV_TABS = [
  { key: 'ALL', label: 'Tüm Raporlar Konsolide', path: '/operations-management/improvements', icon: LayoutDashboard },
  { key: 'DENETIMLER', label: 'Denetimler', path: '/operations-management/improvements/denetimler/dashboard', icon: ClipboardList },
  { key: 'ELEKTRIK', label: 'Elektrik Emniyet', path: '/operations-management/improvements/electrical/dashboard', icon: Zap },
  { key: 'MEKANIK', label: 'Mekanik Emniyet', path: '/operations-management/improvements/mechanical/dashboard', icon: Wrench },
  { key: 'YANGIN', label: 'Yangın Sistemleri', path: '/operations-management/improvements/fire-safety/dashboard', icon: Flame },
];

const MODULE_META: Record<string, {
  title: string;
  items: Array<{ key: string; name: string; path: string }>;
}> = {
  DENETIMLER: {
    title: 'Denetimler',
    items: [
      { key: 'HASTANE_IC_DENETIMLERI', name: 'Hastane İç Denetimleri', path: '/operations-management/improvements/denetimler/hastane-ic' },
      { key: 'MERKEZI_DENETIMLER', name: 'Merkezi Denetimler', path: '/operations-management/improvements/denetimler/merkezi' },
      { key: 'SAGLIK_DENETIMLERI', name: 'Sağlık Denetimleri', path: '/operations-management/improvements/denetimler/saglik' },
      { key: 'ITFAIYE_YANGIN_DENETIMLERI', name: 'İtfaiye/Yangın Komisyonu Denetimleri', path: '/operations-management/improvements/denetimler/itfaiye-yangin' },
    ]
  },
  ELEKTRIK: {
    title: 'Elektrik Emniyet Raporu',
    items: [
      { key: 'ELEKTRIK_PK', name: 'Elektrik PK', path: '/operations-management/improvements/electrical/elektrik-pk' },
      { key: 'TOPRAKLAMA_PK', name: 'Topraklama PK', path: '/operations-management/improvements/electrical/topraklama-pk' },
      { key: 'PARATONER_PK', name: 'Paratoner PK', path: '/operations-management/improvements/electrical/paratoner-pk' },
      { key: 'ELEKTRIK_PANO_KONTROLLERI', name: 'Elektrik Pano Kontrolleri', path: '/operations-management/improvements/electrical/pano-kontrol' },
      { key: 'JENERATOR_PK', name: 'Jeneratör PK & Bakım', path: '/operations-management/improvements/electrical/jenerator-pk' },
      { key: 'TRAFO', name: 'Trafo PK & Bakım', path: '/operations-management/improvements/electrical/trafo' },
      { key: 'UPS', name: 'UPS PK & Bakım', path: '/operations-management/improvements/electrical/ups' },
    ]
  },
  MEKANIK: {
    title: 'Mekanik Emniyet Raporu',
    items: [
      { key: 'KAZANLAR', name: 'Kazanlar', path: '/operations-management/improvements/mechanical/kazanlar' },
      { key: 'CHILLERLER', name: 'Chillerler', path: '/operations-management/improvements/mechanical/chillerler' },
      { key: 'KLIMA_SANTRALLERI', name: 'Klima Santralleri', path: '/operations-management/improvements/mechanical/klima-santralleri' },
    ]
  },
  YANGIN: {
    title: 'Yangın Sistemleri Emniyet Raporu',
    items: [
      { key: 'SULU_SONDURME_PK_BAKIM', name: 'Sulu Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/sulu-sondurme-pk-bakim' },
      { key: 'GAZLI_SONDURME_PK_BAKIM', name: 'Gazlı Söndürme PK & Bakım', path: '/operations-management/improvements/fire-safety/gazli-sondurme-pk-bakim' },
      { key: 'BASINCLANDIRMA_PK_BAKIM', name: 'Basınçlandırma Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/basinclandirma-pk-bakim' },
      { key: 'YANGIN_ALGILAMA_PK_BAKIM', name: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım', path: '/operations-management/improvements/fire-safety/yangin-algilama-pk-bakim' },
    ]
  }
};

export const ReportModuleDashboard: React.FC<ReportModuleDashboardProps> = ({ moduleGroup }) => {
  const navigate = useNavigate();
  const { selectedFacilityId, setSelectedFacilityId, facilities = [] } = useOutletContext<{
    selectedFacilityId: string;
    setSelectedFacilityId?: (id: string) => void;
    facilities?: FacilityOption[];
  }>() || {};

  const meta = MODULE_META[moduleGroup] || MODULE_META.ELEKTRIK;
  const items = meta.items;

  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/dashboard-stats?facilityId=${selectedFacilityId}&moduleGroup=${moduleGroup}`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      console.error('Error fetching module dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [selectedFacilityId, moduleGroup]);

  const handleFacilityChange = (newId: string) => {
    if (newId === 'ALL') {
      localStorage.removeItem('activeFacilityId');
    } else {
      localStorage.setItem('activeFacilityId', newId);
    }
    if (setSelectedFacilityId) {
      setSelectedFacilityId(newId);
    }
    window.dispatchEvent(new Event('facilityChanged'));
  };

  const summary = stats?.summary || {
    total: 0,
    completed: 0,
    inProgress: 0,
    notStarted: 0,
    cancelled: 0,
    open: 0,
    completionPercentage: 0,
    openCritical: 0,
    openHigh: 0,
    critical: 0,
    unspecifiedStatus: 0,
    missingAssignee: 0,
    risks: { critical: 0, high: 0, medium: 0, low: 0, negligible: 0 }
  };

  const statusDist = stats?.statusDistribution || {};
  const riskDist = stats?.riskDistribution || {};

  const openCount = (summary.inProgress || 0) + (summary.notStarted || 0) + (statusDist['Açık'] || 0);
  const criticalCount = summary.risks?.critical || summary.critical || 0;
  const unspecifiedStatusCount = summary.unspecifiedStatus || (statusDist['Girilmemiş'] || 0) + (statusDist['Tanımsız durum'] || 0);
  const missingAssigneeCount = summary.missingAssignee || 0;
  const hasDurumEksik = unspecifiedStatusCount > 0;
  const hasWarning = unspecifiedStatusCount > 0 || missingAssigneeCount > 0;

  // Durum Dağılımı Çubukları (Tamamlandı Yeşil, Devam Ediyor Mavi, Başlamadı Kırmızı, İptal Edildi Gri)
  const durumRows = [
    { name: 'Tamamlandı', value: statusDist['Tamamlandı'] || 0, color: '#16a34a' },
    { name: 'Devam Ediyor', value: statusDist['Devam Ediyor'] || 0, color: '#2563eb' },
    { name: 'Başlamadı', value: statusDist['Başlamadı'] || 0, color: '#dc2626' },
    { name: 'İptal Edildi', value: statusDist['İptal Edildi'] || 0, color: '#64748b' },
    { name: 'Açık', value: statusDist['Açık'] || 0, color: '#0284c7' },
    { name: 'Girilmemiş', value: statusDist['Girilmemiş'] || 0, color: '#94a3b8' },
    { name: 'Tanımsız durum', value: statusDist['Tanımsız durum'] || 0, color: '#cbd5e1' },
  ];
  const totalDurum = durumRows.reduce((acc, r) => acc + r.value, 0);
  const maxDurumVal = totalDurum > 0 ? totalDurum : (summary.total > 0 ? summary.total : 1);

  // Risk Dağılımı Çubukları (Kritik Koyu Kırmızı, Yüksek Kırmızı, Önemli Turuncu, Olası Sarı, Önemsiz Gri)
  const riskRows = [
    { name: 'Kritik', value: riskDist['Kritik'] || 0, color: '#991b1b' },
    { name: 'Yüksek', value: riskDist['Yüksek'] || 0, color: '#dc2626' },
    { name: 'Önemli', value: riskDist['Önemli'] || 0, color: '#ea580c' },
    { name: 'Olası', value: riskDist['Olası'] || 0, color: '#eab308' },
    { name: 'Önemsiz', value: riskDist['Önemsiz'] || 0, color: '#64748b' },
    { name: 'Girilmemiş', value: riskDist['Girilmemiş'] || 0, color: '#94a3b8' },
    { name: 'Tanımsız risk', value: riskDist['Tanımsız risk'] || 0, color: '#cbd5e1' },
  ];
  const totalRisk = riskRows.reduce((acc, r) => acc + r.value, 0);
  const maxRiskVal = totalRisk > 0 ? totalRisk : (summary.total > 0 ? summary.total : 1);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ÜST MODÜL SEKME GEÇİŞLERİ                                           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
        {MODULE_NAV_TABS.map((tab) => {
          const isActive = tab.key === moduleGroup;
          const TabIcon = tab.icon;
          return (
            <button
              key={tab.key}
              onClick={() => navigate(tab.path)}
              className={cn(
                "px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-2 border cursor-pointer",
                isActive
                  ? "bg-slate-900 text-white border-slate-900 shadow-xs dark:bg-slate-100 dark:text-slate-900 dark:border-slate-100"
                  : "bg-card text-muted-foreground border-border/80 hover:bg-muted/80 hover:text-foreground"
              )}
            >
              <TabIcon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ÜST BAŞLIK VE HASTANE SEÇİMİ                                        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800 dark:text-slate-100">
            {meta.title}
          </h1>
        </div>

        {/* Sağ: Hastane Seçim Kutusu */}
        <div className="bg-card border border-border/80 rounded-xl p-2 px-3 shadow-xs flex items-center gap-2.5 self-start sm:self-auto min-w-[210px]">
          <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
          </div>
          <div className="flex flex-col min-w-0 flex-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider leading-none">
              HASTANE SEÇİMİ
            </span>
            <select
              value={selectedFacilityId}
              onChange={(e) => handleFacilityChange(e.target.value)}
              className="text-xs font-bold text-foreground bg-transparent border-0 outline-none cursor-pointer mt-0.5 truncate pr-1"
            >
              <option value="ALL">Tümü</option>
              {facilities.map((fac) => (
                <option key={fac.id} value={fac.id}>
                  {fac.shortName || fac.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* YÖNETİCİ İLERLEME VE SAHA OLGUNLUK KOKPİTİ (KPI KARTLARI ÜSTÜNDE)   */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <ExecutiveProgressCockpit
        stats={stats}
        mode="MODULE"
        moduleGroup={moduleGroup}
        moduleTitle={meta.title}
      />

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 7'Lİ KPI KARTLARI GRİDİ (MODÜL KONSOLİDE RAPOR & AĞIRLIKLI İLERLEME) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3.5">
        {/* 1. Toplam Bulgu */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground">Toplam bulgu</div>
          <div className="text-3xl font-bold font-mono text-foreground mt-1.5">{summary.total}</div>
          <div className="text-[11px] text-muted-foreground mt-2 truncate">Bu raporun alt başlıkları</div>
        </div>

        {/* 2. Açık Bulgu */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground">Açık bulgu</div>
          <div className="text-3xl font-bold font-mono text-foreground mt-1.5">{openCount}</div>
          <div className="text-[11px] text-muted-foreground mt-2 truncate">Başlamadı, Devam, Açık</div>
        </div>

        {/* 3. Tamamlanan */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground">Tamamlanan</div>
          <div className="text-3xl font-bold font-mono text-foreground mt-1.5">{summary.completed}</div>
          <div className="text-[11px] text-muted-foreground mt-2 truncate">Tamamlandı durumundakiler</div>
        </div>

        {/* 4. Tamamlanma Oranı */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground">Tamamlanma</div>
          <div className="text-3xl font-bold font-mono text-foreground mt-1.5">
            {hasDurumEksik ? '—' : (summary.total - summary.cancelled > 0 ? `%${(((summary.completed) / (summary.total - summary.cancelled)) * 100).toFixed(1).replace('.', ',')}` : '—')}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 truncate">Kesin kapananlar (%100)</div>
        </div>

        {/* 5. Ağırlıklı İlerleme / Gerçekleşme (Devam Edenler Dahil) */}
        <div className="bg-card border-2 border-primary/30 bg-primary/5 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-bold text-primary flex items-center justify-between">
            <span>Ağırlıklı İlerleme</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-primary/20 text-primary font-mono font-semibold">Süreç Dahil</span>
          </div>
          <div className="text-3xl font-bold font-mono text-primary mt-1.5">
            {summary.total - summary.cancelled > 0 
              ? `%${(summary.weightedCompletionPercentage ?? 0).toFixed(1).replace('.', ',')}` 
              : '—'}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 truncate" title="Talep, ihale, sipariş, malzeme, saha adımları dahil">
            Talep, sipariş, saha adımları dahil
          </div>
        </div>

        {/* 6. Kritik Bulgu */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground">Kritik bulgu</div>
          <div className="text-3xl font-bold font-mono text-[#b83a38] dark:text-red-400 mt-1.5">
            {criticalCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 truncate">Tamamlananlar dahil</div>
        </div>

        {/* 7. Durumu Belirsiz */}
        <div className="bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
          <div className="text-xs font-medium text-muted-foreground">Durumu belirsiz</div>
          <div className="text-3xl font-bold font-mono text-[#b58f47] dark:text-amber-400 mt-1.5">
            {unspecifiedStatusCount}
          </div>
          <div className="text-[11px] text-muted-foreground mt-2 truncate">Boş veya tanımsız durum</div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* UYARI / BİLGİLENDİRME BANTI (DURUM BOŞ VEYA TANIMSIZ İSE)           */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {hasDurumEksik && (
        <div className="bg-[#fff9eb] border border-[#fde68a] dark:bg-amber-950/30 dark:border-amber-800/50 rounded-xl p-3.5 px-4 text-xs text-[#92400e] dark:text-amber-300">
          <span>
            {unspecifiedStatusCount > 0 ? `${unspecifiedStatusCount} bulgunun durumu boş veya tanımsız; tamamlanma oranı hesaplanmadı.` : ''}
            {unspecifiedStatusCount > 0 && missingAssigneeCount > 0 ? ' ' : ''}
            {missingAssigneeCount > 0 ? `${missingAssigneeCount} bulgunun sorumlusu belirtilmemiş.` : ''}
          </span>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ALT BAŞLIKLARIN DURUMU (TABLO)                                      */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border border-border/80 rounded-2xl shadow-xs overflow-hidden">
        <div className="p-5 flex items-center justify-between border-b border-border/70">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0">
              <Layers className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">
                Alt Başlıkların Durumu
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {items.length} takip alanı · seçilen hastane kapsamında
              </p>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border/70 bg-muted/20 text-muted-foreground text-xs select-none">
                <th className="py-3.5 px-4 text-left font-semibold min-w-[200px]">Alt Başlık</th>
                <th className="py-3.5 px-3 text-center font-semibold min-w-[70px]">Bulgu</th>
                <th className="py-3.5 px-3 text-center font-semibold min-w-[70px]">Açık</th>
                <th className="py-3.5 px-3 text-center font-semibold min-w-[70px]">Kritik</th>
                <th className="py-3.5 px-3 text-center font-semibold min-w-[90px]">Tamamlanan</th>
                <th className="py-3.5 px-3 text-center font-semibold min-w-[90px]">Durum Eksik</th>
                <th className="py-3.5 px-3 text-center font-semibold min-w-[95px]">Tamamlanma</th>
                <th className="py-3.5 px-4 text-right font-semibold min-w-[120px]">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/50 text-xs">
              {items.map(item => {
                const s = stats?.sheets?.[item.key] || {
                  total: 0,
                  completed: 0,
                  open: 0,
                  inProgress: 0,
                  notStarted: 0,
                  openStatus: 0,
                  cancelled: 0,
                  critical: 0,
                  durumEksik: 0
                };
                const rowOpen = (s.inProgress || 0) + (s.notStarted || 0) + (s.openStatus || 0);
                const active = s.total - (s.cancelled || 0);
                const ratioStr = (s.durumEksik || 0) > 0 
                  ? '—' 
                  : (active > 0 ? `%${(((s.completed || 0) / active) * 100).toFixed(2).replace('.', ',')}` : '—');

                return (
                  <tr key={item.key} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="py-3.5 px-4 font-semibold text-foreground">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-bold text-foreground">
                      {s.total}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                      {rowOpen}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                      {s.critical || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                      {s.completed}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono text-slate-600 dark:text-slate-300">
                      {s.durumEksik || 0}
                    </td>
                    <td className="py-3.5 px-3 text-center font-mono font-semibold text-emerald-600 dark:text-emerald-400">
                      {ratioStr}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(item.path)}
                        className="h-7 text-xs rounded-lg px-2.5 hover:bg-primary/5 hover:text-primary hover:border-primary/40 cursor-pointer"
                      >
                        Kayıtları Gör
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ALT 2 KART: RİSK DAĞILIMI & DURUM DAĞILIMI (YATAY BAR ÇUBUKLARI)    */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* SOL KART: Risk Dağılımı */}
        <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Risk Dağılımı</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Seçilen hastane · rapora bağlı alt başlıklar</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {riskRows.map(row => (
              <div key={row.name} className="flex items-center gap-3">
                <span className="w-24 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                  {row.name}
                </span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${maxRiskVal > 0 ? (row.value / maxRiskVal) * 100 : 0}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
                <span className="w-8 text-right font-mono font-bold text-xs text-foreground shrink-0">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* SAĞ KART: Durum Dağılımı */}
        <div className="bg-card text-card-foreground border border-border/80 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700/80 flex items-center justify-center shrink-0">
              <TrendingUp className="w-5 h-5 text-slate-600 dark:text-slate-300" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Durum Dağılımı</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Seçilen hastane · rapora bağlı alt başlıklar</p>
            </div>
          </div>

          <div className="space-y-3.5">
            {durumRows.map(row => (
              <div key={row.name} className="flex items-center gap-3">
                <span className="w-28 text-xs font-medium text-slate-600 dark:text-slate-300 shrink-0">
                  {row.name}
                </span>
                <div className="flex-1 h-3 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${maxDurumVal > 0 ? (row.value / maxDurumVal) * 100 : 0}%`,
                      backgroundColor: row.color,
                    }}
                  />
                </div>
                <span className="w-8 text-right font-mono font-bold text-xs text-foreground shrink-0">
                  {row.value}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
};
