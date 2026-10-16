import React, { useState, useEffect } from 'react';
import { useOutletContext, useNavigate } from 'react-router-dom';
import { 
  CheckCircle2, Clock, AlertTriangle, ShieldAlert, 
  BarChart3, TrendingUp, Building2, ChevronRight, ChevronDown, Layers,
  RefreshCw, FileSpreadsheet, Activity, AlertOctagon, Zap, ClipboardList, Shield
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type DashboardStats, type FacilityOption, type ImprovementRecord, ELECTRICAL_SHEETS } from './types';
import { ImprovementTable } from './ImprovementTable';

const API = import.meta.env.VITE_API_URL || '';

export const ImprovementsDashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Dashboard Stats
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);

  // Kritik Maddeler Listesi (Dashboard Altında)
  const [criticalRecords, setCriticalRecords] = useState<ImprovementRecord[]>([]);
  const [loadingCritical, setLoadingCritical] = useState(true);

  // Akordiyon (Açık hastaneler kümesi)
  const [expandedHospitals, setExpandedHospitals] = useState<Record<string, boolean>>({});

  // 1. Dashboard İstatistiklerini Çek
  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/dashboard-stats?facilityId=${selectedFacilityId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
        // İlk hastaneyi varsayılan olarak açık getir
        if (data.data.hospitals && data.data.hospitals.length > 0) {
          setExpandedHospitals(prev => ({
            ...prev,
            [data.data.hospitals[0].hospitalId]: true,
          }));
        }
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  // 2. Kritik Maddeleri Çek
  const fetchCriticalRecords = async () => {
    try {
      setLoadingCritical(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/critical?facilityId=${selectedFacilityId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setCriticalRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching critical records:', err);
    } finally {
      setLoadingCritical(false);
    }
  };

  useEffect(() => {
    fetchStats();
    fetchCriticalRecords();
  }, [selectedFacilityId]);

  const toggleHospitalExpand = (hospId: string) => {
    setExpandedHospitals(prev => ({
      ...prev,
      [hospId]: !prev[hospId],
    }));
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
    risks: { critical: 0, high: 0, medium: 0, low: 0, negligible: 0 }
  };

  // Takip Alanları Listesi (Sol menüdeki 8 sekme ile birebir aynı sırada)
  const ALL_TRACKING_SHEETS = [
    { key: 'DENETIMLER', name: 'Denetimler', path: '/operations-management/improvements/denetimler', icon: ClipboardList },
    { key: 'ELEKTRIK_PK', name: 'Elektrik PK', path: '/operations-management/improvements/electrical/elektrik-pk', icon: Zap },
    { key: 'TOPRAKLAMA_PK', name: 'Topraklama PK', path: '/operations-management/improvements/electrical/topraklama-pk', icon: Zap },
    { key: 'PARATONER_PK', name: 'Paratoner PK', path: '/operations-management/improvements/electrical/paratoner-pk', icon: Zap },
    { key: 'JENERATOR_PK', name: 'Jeneratör PK', path: '/operations-management/improvements/electrical/jenerator-pk', icon: Zap },
    { key: 'ELEKTRIK_PANO_KONTROLLERI', name: 'Elektrik Pano Kontrolleri', path: '/operations-management/improvements/electrical/pano-kontrol', icon: Zap },
    { key: 'TRAFO', name: 'Trafo', path: '/operations-management/improvements/electrical/trafo', icon: Zap },
    { key: 'UPS', name: 'UPS', path: '/operations-management/improvements/electrical/ups', icon: Zap },
  ];

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 1. ÜST BAŞLIK VE YENİLE                                             */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">
            İyileştirme ve Aksiyon Takip Dashboard
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {selectedFacilityId === 'ALL' ? (
              <span>Grup Geneli konsolide denetim, elektrik altyapı ve aksiyon takip göstergeleri.</span>
            ) : (
              <span>Seçili hastanenin iyileştirme ve aksiyon takip performansı.</span>
            )}
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            fetchStats();
            fetchCriticalRecords();
          }}
          className="self-start sm:self-auto text-xs"
        >
          <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${loadingStats ? 'animate-spin' : ''}`} />
          Yenile
        </Button>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 2. KPI KARTLARI (Agent Devir Dokümanı Standartları)                */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3.5">
        
        {/* Toplam Tespit */}
        <div className="bg-card text-card-foreground border rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Toplam Tespit
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            {summary.total.toLocaleString('tr-TR')}
          </div>
          <span className="text-[10px] text-muted-foreground mt-1 block">8 Takip Alanı</span>
        </div>

        {/* Tamamlanan */}
        <div className="bg-emerald-50/40 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block mb-1">
            Tamamlanan
          </span>
          <div className="text-2xl font-bold text-emerald-600 dark:text-emerald-400 font-mono">
            {summary.completed.toLocaleString('tr-TR')}
          </div>
          <span className="text-[10px] text-emerald-600/80 mt-1 block">Kapatılan Bulgular</span>
        </div>

        {/* Açık Kayıt */}
        <div className="bg-blue-50/40 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-blue-700 dark:text-blue-400 block mb-1">
            Açık Kayıt
          </span>
          <div className="text-2xl font-bold text-blue-600 dark:text-blue-400 font-mono">
            {summary.open.toLocaleString('tr-TR')}
          </div>
          <span className="text-[10px] text-blue-600/80 mt-1 block">
            {summary.notStarted} Başlamadı + {summary.inProgress} Devam
          </span>
        </div>

        {/* Tamamlanma Oranı */}
        <div className="bg-card text-card-foreground border rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-muted-foreground block mb-1">
            Tamamlanma Oranı
          </span>
          <div className="text-2xl font-bold font-mono text-foreground">
            %{summary.completionPercentage.toFixed(2)}
          </div>
          <div className="w-full bg-muted h-1.5 rounded-full mt-2 overflow-hidden">
            <div 
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${Math.min(summary.completionPercentage, 100)}%` }}
            />
          </div>
        </div>

        {/* Açık Kritik */}
        <div className="bg-red-50/40 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-red-700 dark:text-red-400 block mb-1 flex items-center justify-between">
            Açık Kritik
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" />
          </span>
          <div className="text-2xl font-bold text-red-600 dark:text-red-400 font-mono">
            {summary.openCritical.toLocaleString('tr-TR')}
          </div>
          <span className="text-[10px] text-red-600/80 mt-1 block">
            Toplam: {summary.risks.critical} Kritik
          </span>
        </div>

        {/* Açık Yüksek */}
        <div className="bg-orange-50/40 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-semibold text-orange-700 dark:text-orange-400 block mb-1">
            Açık Yüksek
          </span>
          <div className="text-2xl font-bold text-orange-600 dark:text-orange-400 font-mono">
            {summary.openHigh.toLocaleString('tr-TR')}
          </div>
          <span className="text-[10px] text-orange-600/80 mt-1 block">
            Toplam: {summary.risks.high} Yüksek
          </span>
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 3. HASTANELERE GÖRE BULGU DAĞILIMI (GÖRSEL 1 & 2 AKORDİYON TASARIMI)*/}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border rounded-2xl shadow-xs overflow-hidden">
        
        {/* Akordiyon Konteyner Başlığı */}
        <div className="p-5 border-b flex flex-wrap items-center justify-between gap-3 bg-muted/20">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center font-bold">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold tracking-tight text-foreground">
                Hastanelere Göre Bulgu Dağılımı
              </h3>
              <p className="text-xs text-muted-foreground">
                Hastaneyi açın → kaynak sekmeyi ve durum dağılımını (Başlamadı / Devam Ediyor / Tamamlandı) görün
              </p>
            </div>
          </div>

          <Badge variant="secondary" className="text-xs font-mono px-3 py-1 bg-muted">
            {summary.total} bulgu
          </Badge>
        </div>

        {/* Hastane Listesi (Akordiyonlar) */}
        <div className="divide-y divide-border/60">
          {stats?.hospitals && stats.hospitals.length > 0 ? (
            stats.hospitals.map(hosp => {
              const isOpen = !!expandedHospitals[hosp.hospitalId];
              const sheets = hosp.sheets || {};
              const sheetKeys = Object.keys(sheets);

              return (
                <div key={hosp.hospitalId} className="transition-colors">
                  
                  {/* Hastane Başlık Satırı (Tıklanınca Açılır/Kapanır) */}
                  <div
                    onClick={() => toggleHospitalExpand(hosp.hospitalId)}
                    className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer hover:bg-muted/40 select-none group"
                  >
                    {/* Sol: Hastane Adı */}
                    <div className="flex items-center gap-2.5">
                      <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0" />
                      <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">
                        {hosp.hospitalName}
                      </span>
                    </div>

                    {/* Sağ: İstatistik Rozetleri (Başlamadı, Devam Ediyor, Tamamlandı, Toplam) */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-muted-foreground mr-1 hidden sm:inline">
                        8 sekme
                      </span>

                      {/* Başlamadı Rozeti */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-300 dark:border-amber-800">
                        Başlamadı: <strong>{hosp.notStarted || 0}</strong>
                      </span>

                      {/* Devam Ediyor Rozeti */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                        Devam Ediyor: <strong>{hosp.inProgress || 0}</strong>
                      </span>

                      {/* Tamamlandı Rozeti */}
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800">
                        Tamamlandı: <strong>{hosp.completed || 0}</strong>
                      </span>

                      {/* Toplam Bulgu Sayısı Badge */}
                      <Badge className="font-mono text-xs px-2.5 py-0.5 bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900">
                        {hosp.total}
                      </Badge>

                      <ChevronDown
                        className={`w-4 h-4 text-muted-foreground transition-transform duration-200 ${
                          isOpen ? 'rotate-180' : ''
                        }`}
                      />
                    </div>
                  </div>

                  {/* Hastane Açılır İçeriği: Kaynak Sekmeler Tablosu (Görsel 2) */}
                  {isOpen && (
                    <div className="bg-muted/15 border-t px-6 py-4 animate-in slide-in-from-top-2 duration-150">
                      <div className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center justify-between">
                        <span>Kaynak Sekme</span>
                        <div className="flex items-center gap-8 mr-6">
                          <span>Bulgu</span>
                          <span>Tamamlanma</span>
                        </div>
                      </div>

                      <div className="divide-y divide-border/40 border rounded-xl overflow-hidden bg-card">
                        {ALL_TRACKING_SHEETS.map(item => {
                          const sheetData = sheets[item.key] || {
                            total: 0,
                            completed: 0,
                            inProgress: 0,
                            notStarted: 0,
                            cancelled: 0,
                            open: 0,
                          };
                          const IconComponent = item.icon;
                          const activeTotal = sheetData.total - (sheetData.cancelled || 0);
                          const compRatio = activeTotal > 0 ? ((sheetData.completed / activeTotal) * 100).toFixed(2) : '0,00';

                          return (
                            <div
                              key={item.key}
                              onClick={() => navigate(item.path)}
                              className="p-3.5 flex items-center justify-between hover:bg-muted/40 cursor-pointer transition-colors group"
                            >
                              {/* Sol: Sekme Başlığı & Kategori Grubu */}
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-muted text-muted-foreground group-hover:text-primary flex items-center justify-center shrink-0">
                                  <IconComponent className="w-4 h-4" />
                                </div>
                                <div>
                                  <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors block">
                                    {item.name}
                                  </span>
                                  <span className="text-[10px] text-muted-foreground">
                                    {sheetData.total > 0 ? (
                                      `${sheetData.notStarted} Başlamadı · ${sheetData.inProgress} Devam · ${sheetData.completed} Bitti`
                                    ) : (
                                      '0 Başlamadı · 0 Devam · 0 Bitti'
                                    )}
                                  </span>
                                </div>
                              </div>

                              {/* Sağ: Sayı, Oran ve Git Oku */}
                              <div className="flex items-center gap-8">
                                <span className={`text-xs font-mono font-bold w-12 text-right ${sheetData.total > 0 ? 'text-foreground' : 'text-muted-foreground/60'}`}>
                                  {sheetData.total}
                                </span>
                                
                                <span className={`text-xs font-mono font-bold w-16 text-right ${sheetData.total > 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-muted-foreground/50'}`}>
                                  %{compRatio}
                                </span>

                                <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-foreground transition-transform group-hover:translate-x-0.5" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                </div>
              );
            })
          ) : (
            <div className="p-8 text-center text-xs text-muted-foreground">
              Henüz bulgu kaydı bulunan hastane bulunamadı.
            </div>
          )}
        </div>

        {/* Alt Bilgi Dipnotu (Görsel 1 & 2'deki metin) */}
        <div className="px-5 py-3 border-t bg-muted/20 text-[11px] text-muted-foreground">
          {stats?.hospitals?.length || 0} hastane · 8 kaynak sekme · tamamlanma: tamamlanan / (bulgu - iptal). Eksik veya tanımsız durumlarda oran gösterilmez.
        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* 4. MERKEZİ KRİTİK MADDELER (DASHBOARD ALTINDA TABLO VE ESKALASYON) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
              <AlertOctagon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
                Merkezi Kritik Maddeler Konsolu
                <span className="text-xs px-2.5 py-0.5 rounded-full bg-red-500 text-white font-mono font-bold">
                  {criticalRecords.length}
                </span>
              </h3>
              <p className="text-xs text-muted-foreground">
                Tüm hastanelerin ve sekmelerin anlık kritik riskli bulguları ve hızlı aksiyon takibi.
              </p>
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={fetchCriticalRecords}
            className="text-xs"
          >
            <RefreshCw className={`w-3 h-3 mr-1 ${loadingCritical ? 'animate-spin' : ''}`} />
            Kritikleri Yenile
          </Button>
        </div>

        {/* Kritik Maddeler Tablosu (Excel Filtreleri ve Aksiyon Butonlarıyla) */}
        <ImprovementTable
          records={criticalRecords}
          loading={loadingCritical}
          sheetTitle="Kritik Maddeler"
          sheetType="KRITIK"
          onRefresh={() => {
            fetchStats();
            fetchCriticalRecords();
          }}
          facilities={facilities}
          selectedFacilityId={selectedFacilityId}
        />
      </div>

    </div>
  );
};
