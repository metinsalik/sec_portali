import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import {
  Zap, Building2, CheckCircle2, XCircle, AlertTriangle, ShieldAlert,
  Flame, Clock, RefreshCw, Search, Filter, ExternalLink, ArrowUpRight,
  TrendingUp, Activity, BarChart3, PieChart as PieIcon, FileSpreadsheet,
  CheckCheck, ChevronRight, MapPin, Eye, Camera, Download, CheckCircle, Info
} from 'lucide-react';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts';
import { toast } from 'sonner';
import { useAuth } from '@/context/AuthContext';
import {
  electricInfrastructureService,
  type ExecutiveDashboardResponse,
  type ExecutiveDashboardFacilityItem,
  type MatchingEquipmentItem,
  type HospitalStatsResponse,
  type HospitalFacilityItem
} from '@/services/electric-infrastructure.service';

export default function ElectricInfrastructureDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [data, setData] = useState<ExecutiveDashboardResponse | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [facilityType, setFacilityType] = useState<string>('Hastane');
  const [completionFilter, setCompletionFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [criteriaKey, setCriteriaKey] = useState<string>('all');
  const [criteriaValue, setCriteriaValue] = useState<string>('all');
  const [search, setSearch] = useState<string>('');

  // Pagination for detailed equipment table
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Quick View / Detail Modal
  const [previewEquipment, setPreviewEquipment] = useState<MatchingEquipmentItem | null>(null);

  // Hospital Entry Status (Hastane Bazlı Kontrol Formu Giriş Durumu)
  const [hospitalStats, setHospitalStats] = useState<HospitalStatsResponse | null>(null);
  const [loadingHospitalStats, setLoadingHospitalStats] = useState<boolean>(false);
  const [hospitalTab, setHospitalTab] = useState<'all' | 'inProgress' | 'completed' | 'notStarted'>('all');

  const isAdminOrMgmt = useMemo(() => {
    return user?.roles?.includes('admin') || user?.roles?.includes('management');
  }, [user]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setLoadingHospitalStats(true);
    try {
      const [res, hStats] = await Promise.all([
        electricInfrastructureService.getExecutiveDashboard({
          facilityType: facilityType !== 'all' ? facilityType : undefined,
          completionFilter: completionFilter !== 'all' ? completionFilter : undefined,
          riskFilter: riskFilter !== 'all' ? riskFilter : undefined,
          selectedCategory: selectedCategory !== 'all' ? selectedCategory : undefined,
          criteriaKey: criteriaKey !== 'all' ? criteriaKey : undefined,
          criteriaValue: criteriaValue !== 'all' ? criteriaValue : undefined
        }),
        electricInfrastructureService.getHospitalStats()
      ]);
      setData(res);
      setHospitalStats(hStats);
      setCurrentPage(1);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Yönetici gösterge paneli verileri alınamadı.');
    } finally {
      setLoading(false);
      setLoadingHospitalStats(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [facilityType, completionFilter, riskFilter, selectedCategory, criteriaKey, criteriaValue]);

  // Flatten all matching equipments from all facilities
  const allEquipments = useMemo(() => {
    if (!data?.facilities) return [];
    const list: MatchingEquipmentItem[] = [];
    data.facilities.forEach(fac => {
      if (fac.matchingEquipments && fac.matchingEquipments.length > 0) {
        fac.matchingEquipments.forEach(eq => {
          list.push({
            ...eq,
            facilityId: fac.id,
            facilityName: fac.name
          });
        });
      }
    });
    return list;
  }, [data?.facilities]);

  // Client-side search filtering on the flattened equipment records
  const filteredEquipments = useMemo(() => {
    if (!search.trim()) return allEquipments;
    const q = search.toLowerCase().trim();
    return allEquipments.filter(eq =>
      eq.facilityName.toLowerCase().includes(q) ||
      eq.facilityId.toLowerCase().includes(q) ||
      eq.equipmentCategory.toLowerCase().includes(q) ||
      eq.equipmentCodeName.toLowerCase().includes(q) ||
      eq.locationDescription.toLowerCase().includes(q) ||
      (eq.detectedRisk && eq.detectedRisk.toLowerCase().includes(q)) ||
      (eq.inspectorName && eq.inspectorName.toLowerCase().includes(q))
    );
  }, [allEquipments, search]);

  // Paginated equipment records
  const totalPages = Math.max(1, Math.ceil(filteredEquipments.length / pageSize));
  const paginatedEquipments = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredEquipments.slice(start, start + pageSize);
  }, [filteredEquipments, currentPage, pageSize]);

  const handleNavigateToDetail = (equipmentId: string) => {
    navigate(`/safety-management/electric-infrastructure/${equipmentId}`);
  };

  const handleNavigateToFacilityForm = (facilityId: string) => {
    localStorage.setItem('activeFacilityId', facilityId);
    window.dispatchEvent(new Event('facilityChanged'));
    navigate('/safety-management/electric-infrastructure');
  };

  // Group hospitals into Devam Ediyor, Tamamlandı, Başlamadı
  const hospitalGroups = useMemo(() => {
    const entered = hospitalStats?.enteredHospitals || [];
    const notEntered = hospitalStats?.notEnteredHospitals || [];

    // Tamamlandı: Giriş yapmış VE isCompleted (Tüm Girişlerim Bitti) olanlar
    const completed = entered.filter(h => h.isCompleted);
    // Devam Ediyor: Giriş yapmış AMA henüz isCompleted işaretlememiş olanlar
    const inProgress = entered.filter(h => !h.isCompleted);
    // Başlamadı: Henüz hiç ekipman kaydı girmemiş olanlar
    const notStarted = notEntered;

    return {
      all: [...completed, ...inProgress, ...notStarted],
      completed,
      inProgress,
      notStarted
    };
  }, [hospitalStats]);

  const summary = data?.summary;

  // Criteria definitions for the second filter block
  const CRITERIA_OPTIONS = [
    { key: 'hasRisk', label: 'Risk Var mı?', options: ['Var', 'Yok'] },
    { key: 'hasMaintenanceRecord', label: 'Bakım Kaydı Var mı?', options: ['Var', 'Yok'] },
    { key: 'isInspected', label: 'Kontrol Edildi mi?', options: ['Evet', 'Hayır'] },
    { key: 'thermalControl', label: 'Termal Kontrol', options: ['Uygun', 'Uygun Değil', 'Yapılmadı'] },
    { key: 'overloadHeat', label: 'Aşırı Yük / Isınma', options: ['Var', 'Yok', 'Kontrol Edilmedi'] },
    { key: 'cablesBreakers', label: 'Bağlantı-Kablo-Şalter', options: ['Uygun', 'Uygun Değil', 'Kontrol Edilmedi'] },
    { key: 'cleanlinessVentilation', label: 'Temizlik / Havalandırma', options: ['Uygun', 'Uygun Değil', 'Kontrol Edilmedi'] },
    { key: 'extinguishingSystem', label: 'Söndürme Sistemi', options: ['Var ve Uygun', 'Yok', 'Uygun Değil', 'Uygulanamaz'] },
    { key: 'sealingFireStop', label: 'Yangın Durdurucu Sızdırmazlık', options: ['Var ve Uygun', 'Yok', 'Uygun Değil', 'Uygulanamaz'] },
    { key: 'protectionSystem', label: 'Koruma Sistemi', options: ['Uygun', 'Uygun Değil', 'Kontrol Edilmedi'] }
  ];

  const currentCriteriaConfig = CRITERIA_OPTIONS.find(c => c.key === criteriaKey);

  // Palette for category pie chart
  const PIE_COLORS = [
    '#3b82f6', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6',
    '#06b6d4', '#f97316', '#64748b', '#14b8a6', '#e11d48',
    '#6366f1', '#84cc16'
  ];

  return (
    <div className="space-y-6 pb-12 max-w-[1600px] mx-auto">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-[#1a1f24] p-6 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                  Elektrik Altyapı Yönetici Dashboard
                </h1>
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-400 border-amber-200 font-semibold text-[11px]">
                  C-Level & Merkez Yönetim
                </Badge>
              </div>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                Tüm tesislerin elektrik altyapı denetimleri, teknik güvenlik kriterleri ve detaylı ekipman kayıtları.
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/safety-management/electric-infrastructure')}
            className="border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 h-9 px-3 text-slate-700 dark:text-slate-200 font-medium"
          >
            <Zap className="w-4 h-4 mr-1.5 text-amber-500" />
            Kontrol Formu Tablosuna Git
          </Button>

          <Button
            variant="ghost"
            size="icon"
            onClick={fetchDashboardData}
            className="h-9 w-9 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            title="Verileri Yenile"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </div>

      {/* C-Level Executive KPI Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* 1. Tesis Tamamlama Oranı */}
        <div className="bg-white dark:bg-[#1a1f24] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5 text-blue-500" />
            GİRİŞ TAMAMLANMA
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              %{summary?.entryCompletionRate || 0}
            </span>
            <span className="text-[11px] text-slate-400">
              {summary?.enteredFacilitiesCount || 0} / {summary?.totalFacilitiesCount || 0} Tesis
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary?.entryCompletionRate || 0}%` }}
            />
          </div>
        </div>

        {/* 2. Onaylı / Bitti Diyen Tesisler */}
        <div className="bg-white dark:bg-[#1a1f24] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <CheckCheck className="w-3.5 h-3.5 text-emerald-500" />
            BİTTİ BEYANI
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">
              {summary?.verifiedCompletedCount || 0}
            </span>
            <span className="text-[11px] text-emerald-500/70">
              %{summary?.verifiedCompletionRate || 0} Tamamlandı
            </span>
          </div>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${summary?.verifiedCompletionRate || 0}%` }}
            />
          </div>
        </div>

        {/* 3. Toplam Girilen Ekipman */}
        <div className="bg-white dark:bg-[#1a1f24] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-500" />
            TOPLAM EKİPMAN
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-slate-900 dark:text-slate-100">
              {summary?.totalEquipments || 0}
            </span>
            <span className="text-[11px] text-slate-400">kayıtlı pano/cihaz</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-2">tüm tesisler geneli</span>
        </div>

        {/* 4. Tespit Edilen Risk Sayısı */}
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
          (summary?.totalRisks || 0) > 0
            ? 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
            : 'bg-white dark:bg-[#1a1f24] border-slate-200/80 dark:border-slate-800'
        }`}>
          <span className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            RİSK TESPİTİ
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-rose-600 dark:text-rose-400">
              {summary?.totalRisks || 0}
            </span>
            <span className="text-[11px] text-rose-500/70">ekipmanda risk</span>
          </div>
          <span className="text-[10px] text-rose-600/80 mt-2">acil önlem gerekli</span>
        </div>

        {/* 5. Bakımı Eksik / Girilmemiş Ekipman */}
        <div className={`p-4 rounded-xl border shadow-sm flex flex-col justify-between transition-colors ${
          (summary?.totalMissingMaintenance || 0) > 0
            ? 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
            : 'bg-white dark:bg-[#1a1f24] border-slate-200/80 dark:border-slate-800'
        }`}>
          <span className="text-xs font-semibold text-amber-700 dark:text-amber-400 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            BAKIM KAYDI YOK
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-amber-600 dark:text-amber-400">
              {summary?.totalMissingMaintenance || 0}
            </span>
            <span className="text-[11px] text-amber-600/70">ekipman</span>
          </div>
          <span className="text-[10px] text-amber-700/80 mt-2">periyodik bakım eksik</span>
        </div>

        {/* 6. Açık / Devam Eden Aksiyonlar */}
        <div className="bg-white dark:bg-[#1a1f24] p-4 rounded-xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <span className="text-xs font-semibold text-orange-600 dark:text-orange-400 flex items-center gap-1">
            <ShieldAlert className="w-3.5 h-3.5 text-orange-500" />
            AÇIK AKSİYONLAR
          </span>
          <div className="mt-2 flex items-baseline justify-between">
            <span className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary?.totalOpenActions || 0}
            </span>
            <span className="text-[11px] text-orange-500/70">takipte</span>
          </div>
          <span className="text-[10px] text-orange-600/80 mt-2">kapanış bekleniyor</span>
        </div>
      </div>

      {/* HASTANE BAZLI KONTROL FORMU GİRİŞ DURUMU */}
      <div className="bg-white dark:bg-[#1a1f24] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                Hastane Bazlı Kontrol Formu Giriş Durumu
                {loadingHospitalStats && <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Tüm hastanelerin form giriş oranları, girilen ekipman sayıları ve bitti onay durumları.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 dark:border-slate-700 p-0.5 bg-slate-50 dark:bg-slate-900/50 text-xs">
              <button
                type="button"
                onClick={() => setHospitalTab('all')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  hospitalTab === 'all'
                    ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tümü ({hospitalStats?.totalHospitals || 0})
              </button>
              <button
                type="button"
                onClick={() => setHospitalTab('inProgress')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  hospitalTab === 'inProgress'
                    ? 'bg-white dark:bg-slate-800 text-amber-600 dark:text-amber-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Devam Ediyor ({hospitalGroups.inProgress.length})
              </button>
              <button
                type="button"
                onClick={() => setHospitalTab('completed')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  hospitalTab === 'completed'
                    ? 'bg-white dark:bg-slate-800 text-emerald-600 dark:text-emerald-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Tamamlandı ({hospitalGroups.completed.length})
              </button>
              <button
                type="button"
                onClick={() => setHospitalTab('notStarted')}
                className={`px-3 py-1.5 rounded-md font-medium transition-all ${
                  hospitalTab === 'notStarted'
                    ? 'bg-white dark:bg-slate-800 text-rose-600 dark:text-rose-400 shadow-sm'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                }`}
              >
                Başlamadı ({hospitalGroups.notStarted.length})
              </button>
            </div>
          </div>
        </div>

        {/* Grafikler: Sol Pie Chart (Giriş ve Onay Durumu), Sağ Bar Chart (Ekipman Sayıları) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Sol Pie: Devam Ediyor vs Tamamlandı vs Başlamadı */}
          <div className="lg:col-span-4 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80 flex flex-col items-center justify-between">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 w-full text-left flex items-center justify-between">
              <span>Hastanelerde Giriş ve Bitiş Durumu</span>
              <Badge variant="outline" className="text-[10px] font-normal">
                Toplam {hospitalStats?.totalHospitals || 0} Hastane
              </Badge>
            </span>

            <div className="h-44 w-full relative my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { name: 'Devam Ediyor', value: hospitalGroups.inProgress.length, color: '#f59e0b' },
                      { name: 'Tamamlandı', value: hospitalGroups.completed.length, color: '#10b981' },
                      { name: 'Başlamadı', value: hospitalGroups.notStarted.length, color: '#f43f5e' }
                    ]}
                    innerRadius={50}
                    outerRadius={72}
                    paddingAngle={3}
                    dataKey="value"
                    nameKey="name"
                  >
                    <Cell fill="#f59e0b" />
                    <Cell fill="#10b981" />
                    <Cell fill="#f43f5e" />
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} Hastane`, name]}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-100">
                  %{hospitalStats?.completionRate || 0}
                </span>
                <span className="text-[10px] text-slate-400">Giriş Başlama</span>
              </div>
            </div>

            <div className="w-full grid grid-cols-3 gap-1 pt-2 border-t border-slate-200/60 dark:border-slate-800 text-[11px]">
              <div className="flex flex-col items-center text-center">
                <span className="text-amber-600 font-bold">{hospitalGroups.inProgress.length}</span>
                <span className="text-slate-500 text-[10px]">Devam Ediyor</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-emerald-600 font-bold">{hospitalGroups.completed.length}</span>
                <span className="text-slate-500 text-[10px]">Tamamlandı</span>
              </div>
              <div className="flex flex-col items-center text-center">
                <span className="text-rose-600 font-bold">{hospitalGroups.notStarted.length}</span>
                <span className="text-slate-500 text-[10px]">Başlamadı</span>
              </div>
            </div>
          </div>

          {/* Sağ Bar Chart: Hastanelerin Girilen Ekipman Sayıları (En Çok Giriş Yapan Hastaneler) */}
          <div className="lg:col-span-8 bg-slate-50/70 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800/80 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hastaneler Bazında Girilen Ekipman Dağılımı (İlk 10 Hastane)
              </span>
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">
                {hospitalGroups.completed.length} hastane "Tamamlandı" bildirdi
              </span>
            </div>

            {hospitalStats?.enteredHospitals && hospitalStats.enteredHospitals.length > 0 ? (
              <div className="h-44 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hospitalStats.enteredHospitals.slice(0, 10).map(h => ({
                      name: h.shortName || h.name.slice(0, 15),
                      count: h.recordCount,
                      fullName: h.name,
                      isCompleted: h.isCompleted
                    }))}
                    margin={{ top: 10, right: 10, left: -20, bottom: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#88888820" />
                    <XAxis
                      dataKey="name"
                      angle={-20}
                      textAnchor="end"
                      tick={{ fontSize: 10 }}
                      interval={0}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip
                      formatter={(val: any) => [`${val} Ekipman`, 'Girilen Kayıt']}
                      labelFormatter={(_label, payload) => {
                        if (payload && payload[0]) {
                          const item = payload[0].payload;
                          return `${item.fullName} ${item.isCompleted ? '✓ (Tamamlandı)' : '• (Devam Ediyor)'}`;
                        }
                        return '';
                      }}
                      contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                    />
                    <Bar
                      dataKey="count"
                      fill="#3b82f6"
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="h-44 flex items-center justify-center text-slate-400 text-xs">
                Henüz hiçbir hastaneden ekipman kaydı girilmedi.
              </div>
            )}

            <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800 flex items-center justify-between text-[11px] text-slate-500">
              <span>* Ekipman sayısı en yüksek olan hastaneler sıralanmaktadır.</span>
              <span className="text-emerald-600 font-medium">
                Tamamlanma Oranı: %{hospitalStats?.verifiedCompletionRate || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Hastaneler Liste / Çip Grid Görünümü */}
        <div className="space-y-2 pt-1">
          <div className="flex items-center justify-between text-xs text-slate-500 font-medium px-1">
            <span>
              {hospitalTab === 'all'
                ? 'Tüm Hastaneler'
                : hospitalTab === 'inProgress'
                ? 'Giriş Yapan / Devam Eden Hastaneler'
                : hospitalTab === 'completed'
                ? 'Girişleri Tamamlanan Hastaneler (Tüm Girişlerim Bitti)'
                : 'Henüz Başlamayan Hastaneler'}
            </span>
            <span className="text-[11px] text-slate-400">
              Hastaneye tıklayarak o tesisin form tablosuna gidebilirsiniz.
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-56 overflow-y-auto pr-1">
            {/* 1. Tamamlanan Hastaneler */}
            {(hospitalTab === 'all' || hospitalTab === 'completed') &&
              hospitalGroups.completed.map(h => (
                <div
                  key={h.id}
                  onClick={() => handleNavigateToFacilityForm(h.id)}
                  className="p-2.5 rounded-xl border border-emerald-300/80 bg-emerald-50/50 dark:bg-emerald-950/30 dark:border-emerald-800 hover:border-emerald-500 dark:hover:border-emerald-600 cursor-pointer transition-all flex items-center justify-between gap-2 group shadow-sm"
                  title="Tamamlandı - Tıklayarak bu hastanenin form tablosuna git"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600 transition-colors">
                        {h.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 pl-5 flex items-center gap-1">
                      <span>{h.city || 'Hastane'}</span>
                      <span className="text-emerald-600 dark:text-emerald-400 font-semibold">• Tamamlandı ✓</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge className="bg-emerald-600 hover:bg-emerald-700 text-white text-[10px] h-5 px-1.5 font-bold">
                      {h.recordCount} Kayıt
                    </Badge>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-emerald-600" />
                  </div>
                </div>
              ))}

            {/* 2. Devam Eden / Giriş Yapan Hastaneler */}
            {(hospitalTab === 'all' || hospitalTab === 'inProgress') &&
              hospitalGroups.inProgress.map(h => (
                <div
                  key={h.id}
                  onClick={() => handleNavigateToFacilityForm(h.id)}
                  className="p-2.5 rounded-xl border border-amber-200/80 bg-amber-50/40 dark:bg-amber-950/20 dark:border-amber-900/50 hover:border-amber-400 dark:hover:border-amber-700 cursor-pointer transition-all flex items-center justify-between gap-2 group shadow-sm"
                  title="Devam Ediyor - Tıklayarak bu hastanenin form tablosuna git"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0 animate-pulse" />
                      <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate group-hover:text-amber-600 transition-colors">
                        {h.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-500 mt-0.5 pl-3.5 flex items-center gap-1">
                      <span>{h.city || 'Hastane'}</span>
                      <span className="text-amber-600 dark:text-amber-400 font-medium">• Devam Ediyor</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="border-amber-300 text-amber-700 dark:text-amber-300 bg-amber-100/60 dark:bg-amber-900/40 text-[10px] h-5 px-1.5 font-semibold">
                      {h.recordCount} Kayıt
                    </Badge>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-amber-600" />
                  </div>
                </div>
              ))}

            {/* 3. Başlamayan Hastaneler */}
            {(hospitalTab === 'all' || hospitalTab === 'notStarted') &&
              hospitalGroups.notStarted.map(h => (
                <div
                  key={h.id}
                  onClick={() => handleNavigateToFacilityForm(h.id)}
                  className="p-2.5 rounded-xl border border-rose-200/70 bg-rose-50/30 dark:bg-rose-950/20 dark:border-rose-900/40 hover:border-rose-400 dark:hover:border-rose-700 cursor-pointer transition-all flex items-center justify-between gap-2 group shadow-sm"
                  title="Başlamadı - Tıklayarak bu hastanenin form tablosuna git"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span className="font-medium text-xs text-slate-700 dark:text-slate-300 truncate group-hover:text-rose-600 transition-colors">
                        {h.name}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400 mt-0.5 pl-3.5">
                      {h.city || 'Hastane'} • Veri bekleniyor
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Badge variant="outline" className="border-rose-300 text-rose-600 dark:text-rose-400 text-[10px] h-5 px-1.5">
                      Başlamadı
                    </Badge>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-rose-600" />
                  </div>
                </div>
              ))}
          </div>
        </div>
      </div>

      {/* 1. BÖLÜM: Ekipman Türü Pie Dağılımı & Kategori Özeti (Çubuk Grafik Kaldırıldı) */}
      <div className="bg-white dark:bg-[#1a1f24] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <PieIcon className="w-4 h-4 text-blue-500" />
              1. Ekipman Türlerine Göre Envanter ve Risk Dağılımı
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Ekipman kategorisini seçerek aşağıdaki detaylı kontrol listesini tek tıkla filtreleyebilirsiniz.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">Tür Seçimi:</span>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[240px] h-9 text-xs">
                <span className="truncate">
                  {selectedCategory === 'all' ? 'Tüm Ekipman Türleri' : selectedCategory}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Ekipman Türleri</SelectItem>
                {(data?.categoryBreakdown || []).map(cat => (
                  <SelectItem key={cat.name} value={cat.name}>
                    {cat.name} ({cat.count} adet)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedCategory !== 'all' && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedCategory('all')}
                className="h-9 px-2 text-xs text-rose-500 hover:text-rose-600"
              >
                Filtreyi Temizle
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center pt-1">
          {/* Pie Chart */}
          <div className="lg:col-span-4 bg-slate-50 dark:bg-slate-900/40 rounded-xl p-4 border border-slate-100 dark:border-slate-800 flex flex-col items-center">
            <div className="h-56 w-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={(data?.categoryBreakdown || []).slice(0, 8)}
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="count"
                    nameKey="name"
                    onClick={(e) => {
                      if (e?.name) setSelectedCategory(selectedCategory === e.name ? 'all' : e.name);
                    }}
                    cursor="pointer"
                  >
                    {(data?.categoryBreakdown || []).slice(0, 8).map((_, idx) => (
                      <Cell key={`cell-pie-${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any, name: any) => [`${val} adet`, name]}
                    contentStyle={{ fontSize: '11px', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-xl font-bold text-slate-800 dark:text-slate-100">
                  {summary?.totalEquipments || 0}
                </span>
                <span className="text-[10px] text-slate-400">Ekipman</span>
              </div>
            </div>
            <p className="text-[11px] text-slate-400 text-center mt-1">
              Dilimlere tıklayarak doğrudan o kategoriye filtreleyebilirsiniz.
            </p>
          </div>

          {/* Kategori Seçim & Risk Dağılım Kartları */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {(data?.categoryBreakdown || []).map((cat, idx) => {
              const isSelected = selectedCategory === cat.name;
              return (
                <div
                  key={cat.name}
                  onClick={() => setSelectedCategory(isSelected ? 'all' : cat.name)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all flex flex-col justify-between ${
                    isSelected
                      ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-500 shadow-sm'
                      : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                      style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }}
                    />
                    <span className="font-semibold text-xs text-slate-800 dark:text-slate-200 truncate" title={cat.name}>
                      {cat.name}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-900 dark:text-slate-100">
                      {cat.count} Adet
                    </span>
                    {cat.riskCount > 0 ? (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 font-bold">
                        {cat.riskCount} Risk
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                        Risksiz
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. BÖLÜM: Teknik Kontrol ve Güvenlik Kriterleri Filtre & Çıkarım Paneli */}
      <div className="bg-white dark:bg-[#1a1f24] rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
          <div>
            <h3 className="text-base font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-rose-500" />
              2. Teknik Kontrol ve Güvenlik Kriterleri Analizi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Risk, Bakım, Termal kontrol, Aşırı Yük veya Yangın Durdurucu gibi sorulara verilen yanıtlara göre aşağıdaki detaylı ekipman tablosunu filtreleyin.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Kriter Seçimi */}
            <Select
              value={criteriaKey}
              onValueChange={(val) => {
                setCriteriaKey(val);
                setCriteriaValue('all');
              }}
            >
              <SelectTrigger className="w-[200px] h-9 text-xs">
                <span className="truncate">
                  {criteriaKey === 'all'
                    ? 'Tüm Kriterler (Genel)'
                    : currentCriteriaConfig?.label || criteriaKey}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Kriterler (Genel)</SelectItem>
                {CRITERIA_OPTIONS.map(c => (
                  <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Kriter Sonuç Değeri */}
            {criteriaKey !== 'all' && currentCriteriaConfig && (
              <Select value={criteriaValue} onValueChange={setCriteriaValue}>
                <SelectTrigger className="w-[160px] h-9 text-xs border-blue-300 dark:border-blue-700 bg-blue-50/40 dark:bg-blue-950/20">
                  <span className="truncate">
                    {criteriaValue === 'all' ? 'Tüm Yanıtlar' : criteriaValue}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Yanıtlar</SelectItem>
                  {currentCriteriaConfig.options.map(opt => (
                    <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            {(criteriaKey !== 'all' || criteriaValue !== 'all') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setCriteriaKey('all');
                  setCriteriaValue('all');
                }}
                className="h-9 px-2 text-xs text-rose-500 hover:text-rose-600"
              >
                Kriter Filtresini Sıfırla
              </Button>
            )}
          </div>
        </div>

        {/* Hızlı Kriter Özet Çipleri */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-2.5 pt-1">
          {CRITERIA_OPTIONS.map(c => {
            const breakdown = data?.criteriaBreakdowns?.[c.key] || {};
            const isSelected = criteriaKey === c.key;
            return (
              <div
                key={c.key}
                onClick={() => {
                  if (isSelected) {
                    setCriteriaKey('all');
                    setCriteriaValue('all');
                  } else {
                    setCriteriaKey(c.key);
                    setCriteriaValue('all');
                  }
                }}
                className={`p-2.5 rounded-xl border cursor-pointer transition-all ${
                  isSelected
                    ? 'bg-blue-50 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 shadow-sm'
                    : 'bg-slate-50 dark:bg-slate-900/30 border-slate-100 dark:border-slate-800 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700 dark:text-slate-200">
                  <span className="truncate">{c.label}</span>
                  {isSelected && <Badge className="text-[9px] h-4 bg-blue-600 text-white">Aktif</Badge>}
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  {Object.entries(breakdown).slice(0, 3).map(([key, count]) => (
                    <span
                      key={key}
                      className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                        key === 'Uygun Değil' || (key === 'Var' && c.key === 'hasRisk') || (key === 'Yok' && c.key === 'hasMaintenanceRecord')
                          ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300'
                          : 'bg-slate-200/70 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                      }`}
                    >
                      {key}: {count}
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. BÖLÜM: Detaylı Ekipman Kontrol Tablosu (Doğrudan Ekipman Kayıtları Listelenir) */}
      <div className="bg-white dark:bg-[#1a1f24] p-5 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Kontrol Edilen Ekipmanların Detaylı Tablosu
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Yukarıda seçtiğiniz kriter, ekipman türü ve tesis filtrelerine göre eşleşen tüm ekipman kayıtları.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Tesis Türü Filtresi */}
            <Select value={facilityType} onValueChange={setFacilityType}>
              <SelectTrigger className="w-[150px] h-9 text-xs">
                <span className="truncate">
                  {facilityType === 'all'
                    ? 'Tüm Tesis Türleri'
                    : facilityType === 'Hastane'
                    ? 'Sadece Hastaneler'
                    : facilityType}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Tesis Türleri</SelectItem>
                <SelectItem value="Hastane">Sadece Hastaneler</SelectItem>
                <SelectItem value="Tıp Merkezi">Tıp Merkezleri</SelectItem>
                <SelectItem value="Ofis">Ofisler</SelectItem>
                <SelectItem value="Depo">Depolar</SelectItem>
              </SelectContent>
            </Select>

            {/* Risk / Uygunsuzluk Filtresi */}
            <Select value={riskFilter} onValueChange={setRiskFilter}>
              <SelectTrigger className="w-[160px] h-9 text-xs">
                <span className="truncate">
                  {riskFilter === 'all'
                    ? 'Tüm Risk Seviyeleri'
                    : riskFilter === 'with_risk'
                    ? 'Risk Tespiti Olanlar'
                    : riskFilter === 'no_risk'
                    ? 'Risksiz Ekipmanlar'
                    : 'Açık Aksiyonu Olanlar'}
                </span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm Risk Seviyeleri</SelectItem>
                <SelectItem value="with_risk">Risk Tespiti Olanlar</SelectItem>
                <SelectItem value="no_risk">Risksiz Ekipmanlar</SelectItem>
                <SelectItem value="open_actions">Açık Aksiyonu Olanlar</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Hızlı Arama & Filtre Özeti */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="relative w-full max-w-sm">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tesis, ekipman adı, konum veya kontrol eden ara..."
              className="pl-9 h-9 text-xs"
            />
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <span>
              Toplam <strong className="text-slate-800 dark:text-slate-100">{filteredEquipments.length}</strong> ekipman kaydı eşleşti
            </span>
            <Select value={String(pageSize)} onValueChange={(v) => { setPageSize(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-[110px] h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="25">25 Kayıt</SelectItem>
                <SelectItem value="50">50 Kayıt</SelectItem>
                <SelectItem value="100">100 Kayıt</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Detaylı Ekipman Tablosu */}
        <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 font-semibold uppercase tracking-wider text-[10px]">
                <th className="py-3 px-3 w-10 text-center">Sıra</th>
                <th className="py-3 px-3 min-w-[160px]">Tesis</th>
                <th className="py-3 px-3">Bölüm / Ekipman Türü</th>
                <th className="py-3 px-3">Pano / Ekipman Kodu</th>
                <th className="py-3 px-3">Kat / Konum</th>
                <th className="py-3 px-2 text-center">Kontrol</th>
                <th className="py-3 px-2 text-center">Risk</th>
                <th className="py-3 px-2 text-center">Bakım</th>
                <th className="py-3 px-2 text-center">Termal</th>
                <th className="py-3 px-2 text-center">Aşırı Yük</th>
                <th className="py-3 px-3 text-center">Aksiyon Durumu</th>
                <th className="py-3 px-2 text-center">Kanıt / Foto</th>
                <th className="py-3 px-3">Kontrol Eden</th>
                <th className="py-3 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedEquipments.length === 0 ? (
                <tr>
                  <td colSpan={14} className="py-12 text-center text-slate-400">
                    Seçilen kriterlere uygun ekipman kaydı bulunamadı.
                  </td>
                </tr>
              ) : (
                paginatedEquipments.map((eq, idx) => {
                  const globalIdx = (currentPage - 1) * pageSize + idx + 1;
                  const photoCount = Array.isArray(eq.photoUrls) ? eq.photoUrls.length : 0;

                  return (
                    <tr
                      key={eq.id}
                      className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors ${
                        eq.hasRisk === 'Var' ? 'bg-rose-50/25 dark:bg-rose-950/10' : ''
                      }`}
                    >
                      {/* Sıra */}
                      <td className="py-3 px-3 text-center text-slate-400 font-mono text-[11px]">
                        {globalIdx}
                      </td>

                      {/* Tesis */}
                      <td className="py-3 px-3">
                        <button
                          type="button"
                          onClick={() => handleNavigateToFacilityForm(eq.facilityId)}
                          className="font-semibold text-slate-800 dark:text-slate-100 hover:text-amber-600 text-left transition-colors truncate max-w-[170px] block"
                          title={`${eq.facilityName} - Tesis formunu açmak için tıklayın`}
                        >
                          {eq.facilityName}
                        </button>
                        <span className="text-[10px] text-slate-400 font-mono block">{eq.facilityId}</span>
                      </td>

                      {/* Bölüm / Ekipman Türü */}
                      <td className="py-3 px-3 font-medium text-slate-700 dark:text-slate-200">
                        {eq.equipmentCategory}
                      </td>

                      {/* Pano / Ekipman Kodu */}
                      <td className="py-3 px-3 font-semibold text-slate-900 dark:text-slate-100">
                        {eq.equipmentCodeName}
                      </td>

                      {/* Kat / Konum */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 max-w-[130px] truncate" title={eq.locationDescription}>
                        {eq.locationDescription}
                      </td>

                      {/* Kontrol */}
                      <td className="py-3 px-2 text-center">
                        <span className={`text-[11px] font-medium ${
                          eq.isInspected === 'Evet' ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                        }`}>
                          {eq.isInspected || 'Evet'}
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="py-3 px-2 text-center">
                        {eq.hasRisk === 'Var' ? (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/50 dark:text-rose-300 border-rose-200 text-[10px] px-1.5 py-0 font-bold">
                            Var
                          </Badge>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Yok</span>
                        )}
                      </td>

                      {/* Bakım */}
                      <td className="py-3 px-2 text-center">
                        {eq.hasMaintenanceRecord === 'Yok' || !eq.lastMaintenanceDate ? (
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-[11px]">Yok</span>
                        ) : (
                          <span className="text-emerald-600 dark:text-emerald-400 text-[11px]">Var</span>
                        )}
                      </td>

                      {/* Termal */}
                      <td className="py-3 px-2 text-center">
                        <span className={`text-[11px] font-medium ${
                          eq.thermalControl === 'Uygun Değil'
                            ? 'text-rose-600 font-bold'
                            : eq.thermalControl === 'Uygun'
                            ? 'text-emerald-600'
                            : 'text-slate-400'
                        }`}>
                          {eq.thermalControl || '-'}
                        </span>
                      </td>

                      {/* Aşırı Yük */}
                      <td className="py-3 px-2 text-center">
                        <span className={`text-[11px] font-medium ${
                          eq.overloadHeat === 'Var' ? 'text-rose-600 font-bold' : 'text-slate-400'
                        }`}>
                          {eq.overloadHeat || '-'}
                        </span>
                      </td>

                      {/* Aksiyon Durumu */}
                      <td className="py-3 px-3 text-center">
                        {eq.actionStatus === 'Tamamlandı' ? (
                          <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300 border-emerald-200 text-[10px]">
                            Tamamlandı
                          </Badge>
                        ) : eq.actionStatus === 'Devam Ediyor' ? (
                          <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-300 border-amber-200 text-[10px]">
                            Devam Ediyor
                          </Badge>
                        ) : (
                          <Badge className="bg-rose-100 text-rose-800 dark:bg-rose-950/40 dark:text-rose-300 border-rose-200 text-[10px]">
                            Açık
                          </Badge>
                        )}
                      </td>

                      {/* Kanıt / Foto */}
                      <td className="py-3 px-2 text-center">
                        {photoCount > 0 ? (
                          <Badge variant="outline" className="text-[10px] border-blue-300 text-blue-700 dark:text-blue-300 bg-blue-50/50">
                            <Camera className="w-3 h-3 mr-1" />
                            {photoCount}
                          </Badge>
                        ) : (
                          <span className="text-slate-300 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Kontrol Eden */}
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 text-[11px] max-w-[120px] truncate" title={eq.inspectorName || ''}>
                        {eq.inspectorName || '-'}
                      </td>

                      {/* İşlemler: Sadece Ön İzle ve Tam Detay */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setPreviewEquipment(eq)}
                            className="h-7 px-2 text-slate-600 hover:text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-950/30 text-xs"
                            title="Önizle / Hızlı Gör"
                          >
                            <Eye className="w-3.5 h-3.5 mr-1 text-amber-500" />
                            Önizle
                          </Button>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleNavigateToDetail(eq.id)}
                            className="h-7 px-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 dark:border-indigo-800 dark:text-indigo-300 text-xs font-medium"
                            title="Tam Detay Sayfasına Git"
                          >
                            Tam Detay
                            <ArrowUpRight className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Bar */}
        {filteredEquipments.length > 0 && (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-2 text-xs text-slate-500">
            <div>
              Toplam {filteredEquipments.length} kayıttan {(currentPage - 1) * pageSize + 1} - {Math.min(currentPage * pageSize, filteredEquipments.length)} arası gösteriliyor
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="h-8 px-2.5"
              >
                Önceki
              </Button>
              <span className="px-2 font-medium text-slate-700 dark:text-slate-300">
                Sayfa {currentPage} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="h-8 px-2.5"
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Önizleme Modal */}
      <Dialog open={!!previewEquipment} onOpenChange={(open) => !open && setPreviewEquipment(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-amber-500" />
              Ekipman Kontrol Önizleme
            </DialogTitle>
            <DialogDescription>
              {previewEquipment?.equipmentCategory} - {previewEquipment?.equipmentCodeName} ({previewEquipment?.facilityName})
            </DialogDescription>
          </DialogHeader>

          {previewEquipment && (
            <div className="space-y-4 pt-2 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-slate-900/50 p-3.5 rounded-xl border">
                <div><span className="text-slate-400 block">Tesis:</span> <strong className="text-slate-800 dark:text-slate-200">{previewEquipment.facilityName}</strong></div>
                <div><span className="text-slate-400 block">Konum:</span> <strong className="text-slate-800 dark:text-slate-200">{previewEquipment.locationDescription}</strong></div>
                <div><span className="text-slate-400 block">Kontrol Tarihi:</span> <strong className="text-slate-800 dark:text-slate-200">{previewEquipment.inspectionDate ? new Date(previewEquipment.inspectionDate).toLocaleDateString('tr-TR') : '-'}</strong></div>
                <div><span className="text-slate-400 block">Kontrol Eden:</span> <strong className="text-slate-800 dark:text-slate-200">{previewEquipment.inspectorName || '-'}</strong></div>
                <div><span className="text-slate-400 block">Son Bakım:</span> <strong className="text-slate-800 dark:text-slate-200">{previewEquipment.lastMaintenanceDate ? new Date(previewEquipment.lastMaintenanceDate).toLocaleDateString('tr-TR') : '-'}</strong></div>
                <div><span className="text-slate-400 block">Aksiyon Durumu:</span> <strong className="text-slate-800 dark:text-slate-200">{previewEquipment.actionStatus}</strong></div>
              </div>

              <div className="border rounded-xl p-3.5 space-y-2">
                <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px]">Teknik Güvenlik Kriterleri</h5>
                <div className="grid grid-cols-2 gap-2 text-slate-600 dark:text-slate-400">
                  <div>Termal Kontrol: <span className="font-semibold text-slate-800 dark:text-slate-200">{previewEquipment.thermalControl || '-'}</span></div>
                  <div>Aşırı Yük / Isınma: <span className="font-semibold text-slate-800 dark:text-slate-200">{previewEquipment.overloadHeat || '-'}</span></div>
                  <div>Bağlantı-Kablo-Şalter: <span className="font-semibold text-slate-800 dark:text-slate-200">{previewEquipment.cablesBreakers || '-'}</span></div>
                  <div>Temizlik / Havalandırma: <span className="font-semibold text-slate-800 dark:text-slate-200">{previewEquipment.cleanlinessVentilation || '-'}</span></div>
                  <div>Söndürme Sistemi: <span className="font-semibold text-slate-800 dark:text-slate-200">{previewEquipment.extinguishingSystem || '-'}</span></div>
                  <div>Yangın Durdurucu Sızdırmazlık: <span className="font-semibold text-slate-800 dark:text-slate-200">{previewEquipment.sealingFireStop || '-'}</span></div>
                  <div>Koruma Sistemi: <span className="font-semibold text-slate-800 dark:text-slate-200">{previewEquipment.protectionSystem || '-'}</span></div>
                  <div>Risk Durumu: <span className="font-semibold text-rose-600">{previewEquipment.hasRisk || 'Yok'}</span></div>
                </div>
              </div>

              {(previewEquipment.detectedRisk || previewEquipment.suggestedAction || previewEquipment.emergencyActionTaken) && (
                <div className="border rounded-xl p-3.5 space-y-2 bg-rose-50/20 dark:bg-rose-950/10">
                  <h5 className="font-bold text-rose-700 dark:text-rose-400 uppercase tracking-wider text-[11px]">Tespit Edilen Risk & Aksiyon</h5>
                  {previewEquipment.detectedRisk && <p><strong>Tespit Edilen Risk:</strong> {previewEquipment.detectedRisk}</p>}
                  {previewEquipment.suggestedAction && <p><strong>Önerilen Önlem:</strong> {previewEquipment.suggestedAction}</p>}
                  {previewEquipment.emergencyActionTaken && <p><strong>Yapılan Acil Aksiyon:</strong> {previewEquipment.emergencyActionTaken}</p>}
                  {previewEquipment.responsiblePerson && (
                    <p><strong>Sorumlu:</strong> {previewEquipment.responsiblePerson} (Termin: {previewEquipment.deadlineDate ? new Date(previewEquipment.deadlineDate).toLocaleDateString('tr-TR') : '-'})</p>
                  )}
                </div>
              )}

              {/* Yüklü Kanıt / Fotoğraflar */}
              {Array.isArray(previewEquipment.photoUrls) && previewEquipment.photoUrls.length > 0 && (
                <div className="border rounded-xl p-3.5 space-y-2">
                  <h5 className="font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                    <Camera className="w-3.5 h-3.5 text-blue-500" />
                    Kanıt & Fotoğraflar ({previewEquipment.photoUrls.length})
                  </h5>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-1">
                    {previewEquipment.photoUrls.map((url: string, index: number) => {
                      const isPdf = url.toLowerCase().endsWith('.pdf');
                      return (
                        <div
                          key={index}
                          className="rounded-lg border overflow-hidden aspect-video flex items-center justify-center bg-slate-100 dark:bg-slate-800"
                        >
                          {isPdf ? (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="text-center p-2 text-rose-600 font-semibold">
                              PDF Belgesi İncele
                            </a>
                          ) : (
                            <a href={url} target="_blank" rel="noopener noreferrer" className="w-full h-full block">
                              <img src={url} alt="Kanıt" className="w-full h-full object-cover hover:scale-105 transition-transform" />
                            </a>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setPreviewEquipment(null)}>
              Kapat
            </Button>
            {previewEquipment && (
              <Button
                onClick={() => {
                  const id = previewEquipment.id;
                  setPreviewEquipment(null);
                  handleNavigateToDetail(id);
                }}
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                Tam Detay Sayfasına Git
                <ArrowUpRight className="w-4 h-4 ml-1.5" />
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
