import React, { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { 
  Loader2, 
  Printer, 
  Search, 
  ArrowUpDown, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  BarChart3, 
  Download, 
  Filter, 
  RefreshCw,
  Building2,
  PieChart as PieChartIcon,
  ShieldAlert,
  Activity,
  UserCheck,
  Calendar
} from 'lucide-react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  Tooltip, 
  Legend, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  LabelList,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import * as XLSX from 'xlsx';
import FacilityAdvancedDashboard from '@/components/risks/FacilityAdvancedDashboard';

const API = import.meta.env.VITE_API_URL || '';

// Evrensel İSG Fine-Kinney Risk Düzeyi Renkleri
const LEVEL_PALETTE: Record<string, { bg: string, text: string, border: string, fill: string }> = {
  'Tolere Gösterilmez Risk': { fill: '#b91c1c', bg: 'bg-red-700/15 text-red-700 dark:text-red-400', border: 'border-red-600/40', text: 'text-red-700' },
  'Yüksek Risk':             { fill: '#ef4444', bg: 'bg-rose-500/15 text-rose-700 dark:text-rose-400', border: 'border-rose-500/40', text: 'text-rose-600' },
  'Önemli Risk':             { fill: '#f59e0b', bg: 'bg-amber-500/15 text-amber-700 dark:text-amber-400', border: 'border-amber-500/40', text: 'text-amber-600' },
  'Olası Risk':              { fill: '#eab308', bg: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400', border: 'border-yellow-500/40', text: 'text-yellow-600' },
  'Önemsiz Risk':            { fill: '#10b981', bg: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400', border: 'border-emerald-500/40', text: 'text-emerald-600' },
};

const STATUS_CONFIG: Record<string, { label: string, color: string, badge: string }> = {
  'ACIK_TEHLIKE':        { label: 'Açık Tehlike', color: '#ef4444', badge: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30' },
  'ILK_MUDAHALE_EDILDI': { label: 'İlk Müdahale', color: '#f59e0b', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30' },
  'TAKIP_SURECINDE':     { label: 'Takip Sürecinde', color: '#3b82f6', badge: 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-blue-500/30' },
  'KAPATILDI_GUVENLI':   { label: 'Kapatıldı', color: '#10b981', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30' },
};

export function RiskReportsPage() {
  const { facilities } = useAuth();
  const [selectedFacility, setSelectedFacility] = useState(localStorage.getItem('activeFacilityId') || '');
  
  useEffect(() => {
    const handleStorageChange = () => {
      setSelectedFacility(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('facilityChanged', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('facilityChanged', handleStorageChange);
    };
  }, []);

  const [startDate, setStartDate] = useState(sessionStorage.getItem('reports_startDate') || '');
  const [endDate, setEndDate] = useState(sessionStorage.getItem('reports_endDate') || '');
  const [status, setStatus] = useState(sessionStorage.getItem('reports_status') || 'ALL');
  const [categoryFilter, setCategoryFilter] = useState(sessionStorage.getItem('reports_category') || 'ALL');
  const [searchTerm, setSearchTerm] = useState(sessionStorage.getItem('reports_searchTerm') || '');
  
  // Aktif sekme: 'dashboard' | 'comparison' | 'timeline' | 'responsibles' | 'table'
  const [activeTab, setActiveTab] = useState<'dashboard' | 'comparison' | 'timeline' | 'responsibles' | 'table'>('dashboard');

  // Çapraz Filtreleme (Cross-filter: Grafiğe tıklayınca tabloyu o seviyeye filtrele)
  const [levelDrilldown, setLevelDrilldown] = useState<string | null>(null);

  const savedSort = sessionStorage.getItem('reports_sortConfig');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc'|'desc' } | null>(
    savedSort ? JSON.parse(savedSort) : null
  );

  useEffect(() => {
    sessionStorage.setItem('reports_startDate', startDate);
    sessionStorage.setItem('reports_endDate', endDate);
    sessionStorage.setItem('reports_status', status);
    sessionStorage.setItem('reports_category', categoryFilter);
    sessionStorage.setItem('reports_searchTerm', searchTerm);
    sessionStorage.setItem('reports_sortConfig', JSON.stringify(sortConfig));
  }, [startDate, endDate, status, categoryFilter, searchTerm, sortConfig]);

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const fetchReport = async () => {
    if (!selectedFacility) return;
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams();
      params.append('facilityId', selectedFacility);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);
      if (status !== 'ALL') params.append('statuses', status);
      if (categoryFilter !== 'ALL') params.append('category', categoryFilter);

      const response = await fetch(`${API}/api/risks/reports?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (response.ok) {
        setData(result);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedFacility) {
      fetchReport();
    }
  }, [selectedFacility]);

  const handlePrint = () => {
    window.print();
  };

  const handleQuickDate = (preset: '30days' | 'thisYear' | 'all') => {
    const today = new Date();
    if (preset === '30days') {
      const past = new Date();
      past.setDate(today.getDate() - 30);
      setStartDate(past.toISOString().split('T')[0]);
      setEndDate(today.toISOString().split('T')[0]);
    } else if (preset === 'thisYear') {
      setStartDate(`${today.getFullYear()}-01-01`);
      setEndDate(today.toISOString().split('T')[0]);
    } else {
      setStartDate('');
      setEndDate('');
    }
  };

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filtrelenmiş ve Sıralanmış Risk Listesi
  const filteredAndSortedRisks = useMemo(() => {
    if (!data?.risks) return [];
    
    let result = [...data.risks];

    if (levelDrilldown) {
      result = result.filter(r => (r.initialLevel === levelDrilldown) || (r.finalLevel === levelDrilldown));
    }

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      result = result.filter(r => 
        r.riskNo?.toString().toLowerCase().includes(lower) ||
        r.department?.name?.toLowerCase().includes(lower) ||
        r.area?.toLowerCase().includes(lower) ||
        r.hazard?.toLowerCase().includes(lower) ||
        r.riskDescription?.toLowerCase().includes(lower) ||
        r.improvementResponsible?.toLowerCase().includes(lower)
      );
    }

    if (sortConfig) {
      result.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];
        
        if (sortConfig.key === 'department') {
          aVal = a.department?.name || '';
          bVal = b.department?.name || '';
        } else if (sortConfig.key === 'detectionDate') {
          aVal = a.detectionDate || '';
          bVal = b.detectionDate || '';
        } else if (sortConfig.key === 'statusDate') {
          aVal = a.statusDate || a.actionDate || '';
          bVal = b.statusDate || b.actionDate || '';
        } else if (sortConfig.key === 'riskScore') {
          aVal = a.finalScore || a.initialScore || 0;
          bVal = b.finalScore || b.initialScore || 0;
        }

        if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }

    return result;
  }, [data?.risks, searchTerm, sortConfig, levelDrilldown]);

  // Excel Olarak İndir
  const handleExportExcel = () => {
    if (!filteredAndSortedRisks.length) return;
    const exportRows = filteredAndSortedRisks.map(r => ({
      'Risk No': r.riskNo,
      'Birim': r.department?.name || '-',
      'Alan / Mahal': r.area || '-',
      'Kategori': r.riskCategory || '-',
      'Alt Kategori': r.subCategory || '-',
      'Tehlike': r.hazard || '-',
      'Risk Tanımı': r.riskDescription || '-',
      'İlk Skor': r.initialScore,
      'İlk Seviye': r.initialLevel,
      'Alınan Önlemler / İyileştirme': r.actionsTaken || r.firstActionPlan || '-',
      'İyileştirme Sorumlusu': r.improvementResponsible || '-',
      'Son Skor': r.finalScore ?? '-',
      'Son Seviye': r.finalLevel ?? '-',
      'Statü': STATUS_CONFIG[r.status]?.label || r.status,
      'Tespit Tarihi': r.detectionDate ? new Date(r.detectionDate).toLocaleDateString('tr-TR') : '-'
    }));

    const ws = XLSX.utils.json_to_sheet(exportRows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Risk Raporu');
    XLSX.writeFile(wb, `Risk_Raporu_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  // Statü Verisi
  const statusData = useMemo(() => {
    return (data?.analysis?.byStatus || []).map((item: any) => ({
      ...item,
      displayName: STATUS_CONFIG[item.name]?.label || item.name,
      color: STATUS_CONFIG[item.name]?.color || '#94a3b8'
    }));
  }, [data]);

  const summary = data?.summary || {
    totalRisks: 0,
    closedRisks: 0,
    activeHazards: 0,
    inProgress: 0,
    criticalRisks: 0,
    resolutionRate: 0,
    avgInitialScore: 0,
    avgFinalScore: 0,
    riskReductionRate: 0
  };

  // Mevcut kategoriler listesi
  const availableCategories = useMemo(() => {
    if (!data?.analysis?.categories) return [];
    return data.analysis.categories.map((c: any) => c.name);
  }, [data]);

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Üst Başlık & Eylemler */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary/10 text-primary">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                Risk Analitik ve Yönetici Raporları
              </h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Fine-Kinney risk döngüsü, iyileştirme etkinlikleri ve departman bazlı dinamik göstergeler
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="font-semibold shadow-2xs">
            <Download className="w-4 h-4 mr-1.5 text-emerald-600" /> Excel İndir
          </Button>
          <Button onClick={handlePrint} variant="outline" size="sm" className="font-semibold shadow-2xs">
            <Printer className="w-4 h-4 mr-1.5" /> Yazdır / PDF
          </Button>
        </div>
      </div>

      {/* 4'lü Üst Yönetici KPI Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Toplam Riskler */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Tespit Edilen Risk</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-foreground">{summary.totalRisks}</span>
            <span className="text-xs text-muted-foreground font-medium">Toplam Kayıt</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Açık Tehlike: <strong className="text-rose-600">{summary.activeHazards}</strong></span>
            <span>Takipte: <strong className="text-blue-600">{summary.inProgress}</strong></span>
          </div>
        </div>

        {/* Kritik ve Yüksek Riskler */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kritik Tehlike Düzeyi</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-rose-600">{summary.criticalRisks}</span>
            <span className="text-xs font-medium text-rose-600/80">
              {summary.totalRisks > 0 ? `%${Math.round((summary.criticalRisks / summary.totalRisks) * 100)} Kritik` : '-'}
            </span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Tolere Edilmez & Yüksek Seviyeli</span>
            <span className="font-semibold text-rose-600">Öncelikli Eylem</span>
          </div>
        </div>

        {/* Çözüm ve Kapatma Oranı */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kapatma / Çözüm Oranı</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-600">%{summary.resolutionRate}</span>
            <span className="text-xs font-medium text-muted-foreground">({summary.closedRisks} Çözüldü)</span>
          </div>
          <div className="mt-2 pt-2 border-t">
            <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden">
              <div 
                className="bg-emerald-500 h-full rounded-full transition-all duration-700" 
                style={{ width: `${summary.resolutionRate}%` }} 
              />
            </div>
          </div>
        </div>

        {/* Risk İyileştirme Etkinliği */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">İyileştirme Etkinliği</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-600">-%{summary.riskReductionRate}</span>
            <span className="text-xs text-muted-foreground">Puan İyileşmesi</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
            <span>İlk Ort: <strong className="text-foreground">{summary.avgInitialScore}P</strong></span>
            <span>Son Ort: <strong className="text-emerald-600">{summary.avgFinalScore}P</strong></span>
          </div>
        </div>
      </div>

      {/* Şık Filtre Barı (Glassmorphism & Hızlı Butonlar) */}
      <Card className="print:hidden border-border/80 shadow-xs">
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 pb-3 border-b">
            <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground">
              <Filter className="w-3.5 h-3.5 text-primary" />
              <span>Dinamik Filtreler</span>
            </div>

            {/* Hızlı Zaman Butonları */}
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-muted-foreground mr-1">Zaman Aralığı:</span>
              <button
                type="button"
                onClick={() => handleQuickDate('30days')}
                className="px-2.5 py-1 rounded-lg border bg-muted/30 hover:bg-muted font-medium transition-colors text-[11px]"
              >
                Son 30 Gün
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('thisYear')}
                className="px-2.5 py-1 rounded-lg border bg-muted/30 hover:bg-muted font-medium transition-colors text-[11px]"
              >
                Bu Yıl
              </button>
              <button
                type="button"
                onClick={() => handleQuickDate('all')}
                className="px-2.5 py-1 rounded-lg border bg-muted/30 hover:bg-muted font-medium transition-colors text-[11px]"
              >
                Tümü
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> Başlangıç Tarihi
              </label>
              <Input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                <Calendar className="w-3 h-3 text-primary" /> Bitiş Tarihi
              </label>
              <Input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="h-9 text-xs" />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Yaşam Döngüsü Statüsü</label>
              <Select value={status} onValueChange={setStatus}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Tümü" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Statüler</SelectItem>
                  <SelectItem value="ACIK_TEHLIKE">Açık Tehlike</SelectItem>
                  <SelectItem value="ILK_MUDAHALE_EDILDI">İlk Müdahale Edildi</SelectItem>
                  <SelectItem value="TAKIP_SURECINDE">Takip Sürecinde</SelectItem>
                  <SelectItem value="KAPATILDI_GUVENLI">Kapatıldı (Güvenli)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-muted-foreground">Risk Kategorisi</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="h-9 text-xs"><SelectValue placeholder="Tüm Kategoriler" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                  {availableCategories.map((c: string) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              <Button onClick={fetchReport} disabled={loading} className="h-9 w-full text-xs font-bold shadow-xs">
                {loading ? <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5 mr-1.5" />}
                Raporu Güncelle
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Rapor Sekme Seçimi */}
      <div className="flex items-center justify-between border-b pb-1">
        <div className="inline-flex rounded-xl bg-muted/40 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('dashboard')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'dashboard' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Genel Kokpit & Mukayese
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('timeline')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'timeline' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Aylık Trend & Gelişim
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('responsibles')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'responsibles' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Departman & Sorumlu Başarısı
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('table')}
            className={`px-4 py-1.5 rounded-lg transition-all ${
              activeTab === 'table' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Detaylı Tablo ({filteredAndSortedRisks.length})
          </button>
        </div>

        {levelDrilldown && (
          <div className="flex items-center gap-2">
            <span className="text-xs bg-primary/10 text-primary font-bold px-2.5 py-1 rounded-lg border border-primary/20">
              Süzülen Seviye: {levelDrilldown}
            </span>
            <button
              onClick={() => setLevelDrilldown(null)}
              className="text-xs text-muted-foreground hover:text-foreground underline"
            >
              Filtreyi Kaldır
            </button>
          </div>
        )}
      </div>

      {loading && !data && (
        <div className="h-64 flex flex-col items-center justify-center gap-3 text-muted-foreground">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-sm font-medium">Risk raporları ve grafik verileri hazırlanıyor...</p>
        </div>
      )}

      {data && (
        <div className="space-y-6">
          {/* SEKME 1: GENEL KOKPİT & MUKAYESE */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* 1. FINE-KINNEY BEFORE vs AFTER MUKAYESE (Grouped Bar) */}
                <Card className="lg:col-span-8 shadow-xs border-border/80">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-emerald-600" />
                        Risk Düzeyi Değişimi: İlk Tespit vs İyileştirme Sonrası
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        İyileştirici faaliyetler sonucu tehlike seviyelerindeki net düşüş ve başarı tablosu
                      </p>
                    </div>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={data?.analysis?.levelComparison || []} 
                        margin={{ top: 20, right: 30, left: 10, bottom: 10 }}
                        onClick={(e: any) => {
                          if (e && e.activePayload && e.activePayload[0]) {
                            const selectedLvl = e.activePayload[0].payload.name;
                            setLevelDrilldown(prev => prev === selectedLvl ? null : selectedLvl);
                          }
                        }}
                      >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="displayName" tick={{ fontSize: 11, fontWeight: 600 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip 
                          formatter={(value: any, name: any) => [
                            `${value} adet`, 
                            name === 'initial' ? 'İlk Tespit Durumu' : 'İyileştirme Sonrası'
                          ]}
                          contentStyle={{ borderRadius: '12px', border: '1px solid rgba(0,0,0,0.1)', fontSize: '12px' }}
                        />
                        <Legend 
                          formatter={(val) => val === 'initial' ? 'İlk Tespit (Mevcut Risk)' : 'İyileştirme Sonrası (Kalan Risk)'} 
                          wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }}
                        />
                        <Bar dataKey="initial" fill="#dc2626" radius={[6, 6, 0, 0]} name="initial">
                          <LabelList dataKey="initial" position="top" fontSize={11} fontWeight="bold" />
                        </Bar>
                        <Bar dataKey="final" fill="#10b981" radius={[6, 6, 0, 0]} name="final">
                          <LabelList dataKey="final" position="top" fontSize={11} fontWeight="bold" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* 2. STATÜ DAĞILIMI DONUT CHART */}
                <Card className="lg:col-span-4 shadow-xs border-border/80 flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-primary" />
                      Statü Dağılımı
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">Süreç aşamalarındaki risklerin yüzdeleri</p>
                  </CardHeader>
                  <CardContent className="h-80 flex-1 flex flex-col justify-center">
                    {statusData.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie 
                            data={statusData} 
                            dataKey="value" 
                            nameKey="displayName" 
                            cx="50%" 
                            cy="45%" 
                            innerRadius={55} 
                            outerRadius={85} 
                            paddingAngle={4}
                          >
                            {statusData.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            formatter={(value: any) => [`${value} adet`, 'Risk']}
                            contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                          />
                          <Legend 
                            formatter={(value, entry: any) => `${value} (${entry.payload.value})`}
                            wrapperStyle={{ fontSize: '11px' }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-muted-foreground text-xs">Kayıt Yok</div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Gelişmiş Risk Analizleri & Fine Kinney Detay Matrisi */}
              <div className="print:break-inside-avoid">
                <FacilityAdvancedDashboard facilityRisks={data.risks || []} defaultOpen={false} />
              </div>
            </div>
          )}

          {/* SEKME 2: AYLIK TREND VE GELİŞİM */}
          {activeTab === 'timeline' && (
            <div className="space-y-6">
              <Card className="shadow-xs border-border/80">
                <CardHeader className="pb-2 flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-600" />
                      Aylık Risk Tespit ve Çözüm Eğrisi
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Aylara göre açılan yeni tehlikeler ile başarıyla kapatılan aksiyonların dinamik trendi
                    </p>
                  </div>
                </CardHeader>
                <CardContent className="h-80">
                  {data?.analysis?.monthlyTrend?.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={data.analysis.monthlyTrend} margin={{ top: 20, right: 30, left: 10, bottom: 10 }}>
                        <defs>
                          <linearGradient id="detectedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#ef4444" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#ef4444" stopOpacity={0.0}/>
                          </linearGradient>
                          <linearGradient id="closedGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.4}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                        <Area 
                          type="monotone" 
                          dataKey="detected" 
                          name="Tespit Edilen Tehlikeler" 
                          stroke="#ef4444" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#detectedGrad)" 
                        />
                        <Area 
                          type="monotone" 
                          dataKey="closed" 
                          name="Kapatılan / Çözülen Riskler" 
                          stroke="#10b981" 
                          strokeWidth={2.5}
                          fillOpacity={1} 
                          fill="url(#closedGrad)" 
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-muted-foreground text-xs">
                      Tarihsel eğri oluşturmak için yeterli zaman verisi bulunamadı.
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Kategori Etkinlik Sıralaması */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="shadow-xs border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">Kategori Bazlı Risk Yoğunluğu</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={data?.analysis?.categories || []} 
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" hide />
                        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="total" name="Toplam Risk" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                          <LabelList dataKey="total" position="right" fontSize={11} fontWeight="bold" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                <Card className="shadow-xs border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold">Kategori İyileştirme Başarısı (%)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={data?.analysis?.categories || []} 
                        layout="vertical"
                        margin={{ top: 10, right: 30, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v) => [`%${v}`, 'Başarı Oranı']} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="efficiency" name="İyileştirme %" fill="#10b981" radius={[0, 6, 6, 0]}>
                          <LabelList dataKey="efficiency" position="right" formatter={(v: any) => `%${v}`} fontSize={11} fontWeight="bold" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* SEKME 3: DEPARTMAN & SORUMLU BAŞARISI */}
          {activeTab === 'responsibles' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Departman Risk Yükü */}
                <Card className="shadow-xs border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-primary" />
                      Departman Risk Yükü ve Kritiklik
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">En yüksek risk taşıyan birimler</p>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data?.analysis?.departments?.slice(0, 8) || []} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
                        <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                        <Bar dataKey="total" name="Toplam Risk" fill="#64748b" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="critical" name="Kritik Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="closed" name="Kapatılan" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Sorumlu Performansı */}
                <Card className="shadow-xs border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-600" />
                      İyileştirme Sorumluları Çözüm Oranları
                    </CardTitle>
                    <p className="text-xs text-muted-foreground">Sorumluların aksiyonları tamamlama oranı (%)</p>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        data={data?.analysis?.responsibles || []} 
                        layout="vertical"
                        margin={{ top: 10, right: 40, left: 20, bottom: 5 }}
                      >
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v) => [`%${v}`, 'Kapatma Oranı']} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                        <Bar dataKey="rate" name="Kapatma Oranı %" fill="#0ea5e9" radius={[0, 6, 6, 0]}>
                          <LabelList dataKey="rate" position="right" formatter={(v: any) => `%${v}`} fontSize={11} fontWeight="bold" />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Departman Detay İstatistik Tablosu */}
              <Card className="shadow-xs border-border/80">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base font-bold">Birim / Lokasyon Kapsamlı Başarı Tablosu</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-muted/60 text-muted-foreground font-bold border-b">
                        <tr>
                          <th className="p-3">Birim / Bölüm</th>
                          <th className="p-3 text-center">Toplam Risk</th>
                          <th className="p-3 text-center">Kritik Risk</th>
                          <th className="p-3 text-center">Kapatılan</th>
                          <th className="p-3 text-center">Ort. Risk Puanı</th>
                          <th className="p-3 text-right">Başarı Oranı</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y">
                        {(data?.analysis?.departments || []).map((dept: any) => (
                          <tr key={dept.name} className="hover:bg-muted/30">
                            <td className="p-3 font-semibold text-foreground">{dept.name}</td>
                            <td className="p-3 text-center font-mono font-bold">{dept.total}</td>
                            <td className="p-3 text-center font-mono font-bold text-rose-600">{dept.critical}</td>
                            <td className="p-3 text-center font-mono font-bold text-emerald-600">{dept.closed}</td>
                            <td className="p-3 text-center font-mono">{dept.avgScore}P</td>
                            <td className="p-3 text-right font-bold">
                              <span className={`px-2 py-0.5 rounded-md ${dept.rate >= 75 ? 'bg-emerald-500/10 text-emerald-600' : dept.rate >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                                %{dept.rate}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* SEKME 4: DETAYLI TABLO */}
          {activeTab === 'table' && (
            <Card className="shadow-xs border-border/80 print:shadow-none print:border-none">
              <CardHeader className="print:hidden flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3">
                <div>
                  <CardTitle className="text-base font-bold">
                    Risk Envanteri ({filteredAndSortedRisks.length} Kayıt)
                  </CardTitle>
                  <p className="text-xs text-muted-foreground">İlgili satıra tıklayarak riskin yaşam döngüsü sayfasına gidebilirsiniz</p>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input 
                    placeholder="Tabloda ara (No, Birim, Tehlike, Sorumlu)..." 
                    value={searchTerm} 
                    onChange={e => setSearchTerm(e.target.value)} 
                    className="w-72 h-8 text-xs"
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/70 text-muted-foreground uppercase text-[11px] font-bold border-b">
                      <tr>
                        <th className="px-3.5 py-2.5 cursor-pointer hover:bg-muted" onClick={() => handleSort('riskNo')}>
                          <div className="flex items-center gap-1">No <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                        <th className="px-3.5 py-2.5 cursor-pointer hover:bg-muted" onClick={() => handleSort('department')}>
                          <div className="flex items-center gap-1">Birim / Mahal <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                        <th className="px-3.5 py-2.5 cursor-pointer hover:bg-muted" onClick={() => handleSort('hazard')}>
                          <div className="flex items-center gap-1">Tehlike ve Risk Tanımı <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                        <th className="px-3.5 py-2.5 text-center">İlk Skor</th>
                        <th className="px-3.5 py-2.5 text-center">Son Skor</th>
                        <th className="px-3.5 py-2.5 cursor-pointer hover:bg-muted" onClick={() => handleSort('status')}>
                          <div className="flex items-center gap-1">Statü <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                        <th className="px-3.5 py-2.5">Sorumlu</th>
                        <th className="px-3.5 py-2.5 cursor-pointer hover:bg-muted" onClick={() => handleSort('detectionDate')}>
                          <div className="flex items-center gap-1">Tespit Tarihi <ArrowUpDown className="w-3 h-3"/></div>
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {filteredAndSortedRisks.map((risk: any) => {
                        const statusConf = STATUS_CONFIG[risk.status] || { label: risk.status, badge: 'bg-muted text-muted-foreground' };
                        const initLevelConf = LEVEL_PALETTE[risk.initialLevel] || { bg: 'bg-muted text-muted-foreground' };
                        const finalLevelConf = risk.finalLevel ? (LEVEL_PALETTE[risk.finalLevel] || { bg: 'bg-muted text-muted-foreground' }) : null;

                        return (
                          <tr 
                            key={risk.id} 
                            className="hover:bg-muted/40 cursor-pointer transition-colors"
                            onClick={() => navigate(`/risks/location/${risk.locationId || risk.departmentId}/view/${risk.id}`, { state: { from: '/risks/reports' } })}
                          >
                            <td className="px-3.5 py-2.5 font-mono font-bold text-primary">#{risk.riskNo}</td>
                            <td className="px-3.5 py-2.5">
                              <div className="font-semibold text-foreground">{risk.department?.name || '-'}</div>
                              {risk.area && <div className="text-[10px] text-muted-foreground">{risk.area}</div>}
                            </td>
                            <td className="px-3.5 py-2.5 max-w-xs">
                              <div className="font-semibold text-foreground truncate">{risk.hazard}</div>
                              <div className="text-[11px] text-muted-foreground truncate">{risk.riskDescription}</div>
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${initLevelConf.bg}`}>
                                {risk.initialScore} ({risk.initialLevel ? risk.initialLevel.replace(' Risk', '') : '-'})
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-center">
                              {risk.finalScore !== null && risk.finalScore !== undefined ? (
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${finalLevelConf?.bg || 'bg-emerald-500/15 text-emerald-600'}`}>
                                  {risk.finalScore} ({risk.finalLevel ? risk.finalLevel.replace(' Risk', '') : 'Önemsiz'})
                                </span>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">-</span>
                              )}
                            </td>
                            <td className="px-3.5 py-2.5">
                              <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${statusConf.badge}`}>
                                {statusConf.label}
                              </span>
                            </td>
                            <td className="px-3.5 py-2.5 text-muted-foreground max-w-[140px] truncate" title={risk.improvementResponsible}>
                              {risk.improvementResponsible || '-'}
                            </td>
                            <td className="px-3.5 py-2.5 text-muted-foreground whitespace-nowrap">
                              {risk.detectionDate ? new Date(risk.detectionDate).toLocaleDateString('tr-TR') : '-'}
                            </td>
                          </tr>
                        );
                      })}
                      {filteredAndSortedRisks.length === 0 && (
                        <tr>
                          <td colSpan={8} className="px-4 py-8 text-center text-muted-foreground">
                            Filtrelere uygun risk kaydı bulunamadı.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

export default RiskReportsPage;
