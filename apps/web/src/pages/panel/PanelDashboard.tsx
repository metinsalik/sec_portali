import { useState, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import {
  Building2,
  Users,
  ShieldAlert,
  Wallet,
  Gavel,
  UserPlus,
  UserMinus,
  Activity,
  MapPin,
  LayoutGrid,
  Calendar,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { DashboardSkeleton } from '@/components/panel/dashboard/DashboardSkeleton';
import { DashboardFilterBar } from '@/components/panel/dashboard/DashboardFilterBar';
import { EmployeeTrendChart } from '@/components/panel/dashboard/TrendChart';
import { TurkeyMapSection } from '@/components/panel/dashboard/TurkeyMap';
import { CityDistribution } from '@/components/panel/dashboard/CityDistribution';
import {
  CertificateRenewalDialog,
  ResourceGapDialog,
  CityDetailDialog,
} from '@/components/panel/dashboard/DashboardDialogs';
import { QuickAssignModal } from '@/components/panel/assignments/QuickAssignModal';
import { cn } from '@/lib/utils';

interface FacilitySummaryItem {
  id: string;
  name: string;
  city: string;
  district: string;
  type: string;
  dangerClass: string;
  employeeCount: number;
  complianceScore: number;
  monthlyOsgbCost: number;
  monthlyPenaltyRisk: number;
  iguCompliant: boolean;
  hekimCompliant: boolean;
  dspCompliant: boolean;
  overallCompliant: boolean;
}

interface DashboardData {
  kpis: {
    totalFacilities: number;
    totalEmployees: number;
    averageComplianceScore: number;
    monthlyOsgbCost: number;
    monthlyPenaltyRisk: number;
    cumulativePenaltyRisk2026: number;
  };
  facilitiesSummary?: FacilitySummaryItem[];
  upcomingCertificates: any[];
  resourceGaps: {
    specialists: any[];
    doctors: any[];
    dsp: any[];
  };
  cityDistribution: Record<string, number>;
  cityDetails: Record<string, any>;
  employeeTrend: any[];
}

const normTr = (s?: string | null) => (s || '').toLocaleLowerCase('tr-TR').trim();

export default function PanelDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-SYNCHRONIZED SMART FILTERS ────────────────────────────────────────
  const activeTab = searchParams.get('tab') || 'overview';
  const searchTerm = searchParams.get('q') || '';
  const selectedCityFilter = searchParams.get('city') || 'all';
  const selectedDanger = searchParams.get('danger') || 'all';
  const selectedType = searchParams.get('type') || 'all';
  const gapRoleFilter = searchParams.get('gapRole') || 'all';
  const activeDialog = searchParams.get('dialog');
  const selectedCityForDialog = searchParams.get('selectedCity') || null;

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'IGU' | 'Hekim' | 'DSP' | 'Vekil'>('IGU');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          Object.entries(updates).forEach(([key, value]) => {
            if (
              value === null ||
              value === '' ||
              value === 'all' ||
              (key === 'tab' && value === 'overview')
            ) {
              next.delete(key);
            } else {
              next.set(key, value);
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const { data, isLoading, isFetching, refetch } = useQuery<DashboardData>({
    queryKey: ['panel-dashboard'],
    queryFn: async () => {
      const res = await api.get('/panel/dashboard');
      if (!res.ok) throw new Error('Dashboard verileri yüklenemedi.');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  const availableCities = useMemo(() => {
    if (!data?.cityDistribution) return [];
    return Object.keys(data.cityDistribution).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [data?.cityDistribution]);

  const availableTypes = useMemo(() => {
    const list = data?.facilitiesSummary || [];
    return Array.from(new Set(list.map((f) => f.type).filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'tr')
    );
  }, [data?.facilitiesSummary]);

  const activeFiltersCount = useMemo(() => {
    let c = 0;
    if (searchTerm) c++;
    if (selectedCityFilter !== 'all') c++;
    if (selectedDanger !== 'all') c++;
    if (selectedType !== 'all') c++;
    return c;
  }, [searchTerm, selectedCityFilter, selectedDanger, selectedType]);

  // ── REAL FILTERED FACILITIES & LIVE RECOMPUTED KPIS ───────────────────────
  const filteredFacilities = useMemo(() => {
    const list = data?.facilitiesSummary || [];
    const q = normTr(searchTerm);
    return list.filter((f) => {
      if (selectedCityFilter !== 'all' && f.city !== selectedCityFilter) return false;
      if (selectedDanger !== 'all' && f.dangerClass !== selectedDanger) return false;
      if (selectedType !== 'all' && f.type !== selectedType) return false;
      if (q) {
        const hit =
          normTr(f.name).includes(q) ||
          normTr(f.city).includes(q) ||
          normTr(f.district).includes(q) ||
          normTr(f.type).includes(q);
        if (!hit) return false;
      }
      return true;
    });
  }, [data?.facilitiesSummary, searchTerm, selectedCityFilter, selectedDanger, selectedType]);

  const filteredFacilityIds = useMemo(
    () => new Set(filteredFacilities.map((f) => f.id)),
    [filteredFacilities]
  );

  const computedKpis = useMemo(() => {
    const hasSummary = (data?.facilitiesSummary?.length || 0) > 0;
    if (!hasSummary || activeFiltersCount === 0) {
      return (
        data?.kpis || {
          totalFacilities: 0,
          totalEmployees: 0,
          averageComplianceScore: 0,
          monthlyOsgbCost: 0,
          monthlyPenaltyRisk: 0,
          cumulativePenaltyRisk2026: 0,
        }
      );
    }

    const totalFacilities = filteredFacilities.length;
    const totalEmployees = filteredFacilities.reduce((s, f) => s + f.employeeCount, 0);
    const averageComplianceScore =
      totalFacilities > 0
        ? filteredFacilities.reduce((s, f) => s + f.complianceScore, 0) / totalFacilities
        : 0;
    const monthlyOsgbCost = filteredFacilities.reduce((s, f) => s + f.monthlyOsgbCost, 0);
    const monthlyPenaltyRisk = filteredFacilities.reduce((s, f) => s + f.monthlyPenaltyRisk, 0);

    return {
      totalFacilities,
      totalEmployees,
      averageComplianceScore,
      monthlyOsgbCost,
      monthlyPenaltyRisk,
      cumulativePenaltyRisk2026: monthlyPenaltyRisk * 12,
    };
  }, [data?.kpis, data?.facilitiesSummary, filteredFacilities, activeFiltersCount]);

  // Filtered City Distribution (reactive to danger/type/search filters!)
  const filteredCityDistribution = useMemo(() => {
    if (!data?.facilitiesSummary?.length || activeFiltersCount === 0) {
      return data?.cityDistribution || {};
    }
    const dist: Record<string, number> = {};
    filteredFacilities.forEach((f) => {
      const c = f.city || 'Belirtilmemiş';
      dist[c] = (dist[c] || 0) + 1;
    });
    return dist;
  }, [data?.facilitiesSummary, data?.cityDistribution, filteredFacilities, activeFiltersCount]);

  // Filtered Upcoming Certificates
  const filteredCertificates = useMemo(() => {
    const list = data?.upcomingCertificates || [];
    if (activeFiltersCount === 0) return list;
    const q = normTr(searchTerm);
    return list.filter((c) => {
      if (q && normTr(c.fullName).includes(q)) return true;
      if (selectedCityFilter !== 'all') {
        if (Array.isArray(c.cities) && !c.cities.includes(selectedCityFilter)) return false;
      }
      if (Array.isArray(c.facilityIds) && c.facilityIds.length > 0 && filteredFacilityIds.size > 0) {
        return c.facilityIds.some((id: string) => filteredFacilityIds.has(id));
      }
      return !q;
    });
  }, [data?.upcomingCertificates, activeFiltersCount, searchTerm, selectedCityFilter, filteredFacilityIds]);

  // Filtered Resource Gaps
  const filteredResourceGaps = useMemo(() => {
    if (!data?.resourceGaps) return { specialists: [], doctors: [], dsp: [] };
    const hasSummary = (data?.facilitiesSummary?.length || 0) > 0;
    const q = normTr(searchTerm);

    const filterList = (list: any[]) =>
      list.filter((r) => {
        if (hasSummary && activeFiltersCount > 0) {
          return filteredFacilityIds.has(r.facilityId);
        }
        if (q && !normTr(r.facilityName).includes(q)) return false;
        if (selectedDanger !== 'all' && r.dangerClass !== selectedDanger) return false;
        return true;
      });

    return {
      specialists: filterList(data.resourceGaps.specialists),
      doctors: filterList(data.resourceGaps.doctors),
      dsp: filterList(data.resourceGaps.dsp),
    };
  }, [data, activeFiltersCount, filteredFacilityIds, searchTerm, selectedDanger]);

  // Unified flat list for inline "Kaynak Açıkları" tracking table
  const combinedGapsList = useMemo(() => {
    const rows: Array<{
      key: string;
      role: 'IGU' | 'Hekim' | 'DSP';
      roleLabel: string;
      facilityId: string;
      facilityName: string;
      city: string;
      dangerClass: string;
      employeeCount: number;
      missingLabel: string;
      raw: any;
    }> = [];

    if (gapRoleFilter === 'all' || gapRoleFilter === 'IGU') {
      filteredResourceGaps.specialists.forEach((r) => {
        const diff = Math.max(0, (r.igu?.requiredMinutes || 0) - (r.igu?.assignedMinutes || 0));
        rows.push({
          key: `igu-${r.facilityId}`,
          role: 'IGU',
          roleLabel: 'İSG Uzmanı',
          facilityId: r.facilityId,
          facilityName: r.facilityName,
          city: r.city || '—',
          dangerClass: r.dangerClass,
          employeeCount: r.employeeCount || 0,
          missingLabel: diff > 0 ? `${diff} dk eksik` : 'Sınıf uyumsuz',
          raw: r,
        });
      });
    }
    if (gapRoleFilter === 'all' || gapRoleFilter === 'Hekim') {
      filteredResourceGaps.doctors.forEach((r) => {
        const diff = Math.max(0, (r.hekim?.requiredMinutes || 0) - (r.hekim?.assignedMinutes || 0));
        rows.push({
          key: `hekim-${r.facilityId}`,
          role: 'Hekim',
          roleLabel: 'İşyeri Hekimi',
          facilityId: r.facilityId,
          facilityName: r.facilityName,
          city: r.city || '—',
          dangerClass: r.dangerClass,
          employeeCount: r.employeeCount || 0,
          missingLabel: `${diff} dk eksik`,
          raw: r,
        });
      });
    }
    if (gapRoleFilter === 'all' || gapRoleFilter === 'DSP') {
      filteredResourceGaps.dsp.forEach((r) => {
        const diff = Math.max(0, (r.dsp?.requiredMinutes || 0) - (r.dsp?.assignedMinutes || 0));
        rows.push({
          key: `dsp-${r.facilityId}`,
          role: 'DSP',
          roleLabel: 'DSP',
          facilityId: r.facilityId,
          facilityName: r.facilityName,
          city: r.city || '—',
          dangerClass: r.dangerClass,
          employeeCount: r.employeeCount || 0,
          missingLabel: diff > 0 ? `${diff} dk eksik` : 'Atama yok',
          raw: r,
        });
      });
    }

    return rows;
  }, [filteredResourceGaps, gapRoleFilter]);

  const handleResetFilters = useCallback(() => {
    updateParams({ q: null, city: null, danger: null, type: null, gapRole: null });
  }, [updateParams]);

  const handleOpenDialog = (dialogName: string, city?: string) => {
    updateParams({
      dialog: dialogName,
      selectedCity: city || selectedCityForDialog || null,
    });
  };

  const handleCloseDialog = () => {
    updateParams({ dialog: null, selectedCity: null });
  };

  const handleCityClick = (cityName: string) => {
    updateParams({ dialog: 'city-detail', selectedCity: cityName });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const totalFacilitiesAll = data?.kpis?.totalFacilities || 0;
  const totalUpcomingCerts = filteredCertificates.length;
  const totalSpecialistGaps = filteredResourceGaps.specialists.length;
  const totalDoctorGaps = filteredResourceGaps.doctors.length;
  const totalDspGaps = filteredResourceGaps.dsp.length;
  const totalGapsCount = totalSpecialistGaps + totalDoctorGaps + totalDspGaps;
  const currentYear = new Date().getFullYear();

  return (
    <div className="space-y-4 pb-10">
      {/* ── COMPACT HEADER (30-design-system) ─────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              İSG Yönetim Paneli
            </h1>
            <Badge variant="outline" className="h-5 px-2 text-[10px] font-semibold bg-primary/5 text-primary border-primary/20">
              Canlı
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Portföy geneli yasal uyumluluk, eksik atamalar ve finansal risk göstergeleri
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Button asChild variant="outline" size="sm" className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5">
            <Link to="/panel/assignments">
              <UserPlus className="w-3.5 h-3.5" />
              Atamalar
            </Link>
          </Button>
          <Button asChild size="sm" className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5">
            <Link to="/panel/facilities">
              <Building2 className="w-3.5 h-3.5" />
              Tesisler ({computedKpis.totalFacilities})
            </Link>
          </Button>
        </div>
      </div>

      {/* ── SMART FILTER BAR (URL Parametreli & Gerçek Hesaplamalı) ───────── */}
      <DashboardFilterBar
        searchTerm={searchTerm}
        onSearchChange={(q) => updateParams({ q })}
        selectedCity={selectedCityFilter}
        onCityChange={(city) => updateParams({ city })}
        availableCities={availableCities}
        selectedDanger={selectedDanger}
        onDangerChange={(danger) => updateParams({ danger })}
        selectedType={selectedType}
        onTypeChange={(type) => updateParams({ type })}
        availableTypes={availableTypes}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={handleResetFilters}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        totalFilteredCount={activeFiltersCount > 0 ? filteredFacilities.length : undefined}
        totalCount={totalFacilitiesAll}
      />

      {/* ── COMPACT PRIMARY KPI STRIP ─────────────────────────────────────── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <CompactKPICard
          title="Toplam Tesis"
          value={computedKpis.totalFacilities}
          icon={Building2}
          hint="Aktif İSG tesisi"
          to="/panel/facilities"
        />
        <CompactKPICard
          title="Toplam Çalışan"
          value={computedKpis.totalEmployees.toLocaleString('tr-TR')}
          icon={Users}
          hint="Kayıtlı çalışan"
        />
        <CompactKPICard
          title="Ortalama Uyum"
          value={`%${computedKpis.averageComplianceScore ? computedKpis.averageComplianceScore.toFixed(1) : 0}`}
          icon={ShieldAlert}
          hint="Yasal karşılama oranı"
          status={
            computedKpis.averageComplianceScore >= 90
              ? 'success'
              : computedKpis.averageComplianceScore >= 70
                ? 'warning'
                : 'destructive'
          }
        />
        <CompactKPICard
          title="Sertifika Yenileme"
          value={totalUpcomingCerts}
          icon={Calendar}
          hint="Süresi yaklaşan / dolmuş"
          status={totalUpcomingCerts === 0 ? 'success' : 'warning'}
          onClick={() => handleOpenDialog('certs')}
          interactive
        />
      </div>

      {/* ── VIEW TABS ─────────────────────────────────────────────────────── */}
      <Tabs
        value={activeTab}
        onValueChange={(tab) => updateParams({ tab })}
        className="space-y-4"
      >
        <TabsList className="h-9 p-1 bg-muted/60 border border-border rounded-lg flex-wrap h-auto">
          <TabsTrigger value="overview" className="rounded-md text-xs font-medium px-3 py-1 gap-1.5">
            <LayoutGrid className="w-3.5 h-3.5" />
            Genel Bakış
          </TabsTrigger>
          <TabsTrigger value="gaps" className="rounded-md text-xs font-medium px-3 py-1 gap-1.5">
            <UserMinus className="w-3.5 h-3.5" />
            Kaynak Açıkları
            {totalGapsCount > 0 && (
              <Badge variant="destructive" className="h-4 px-1.5 text-[10px] rounded-full tabular-nums">
                {totalGapsCount}
              </Badge>
            )}
          </TabsTrigger>
          <TabsTrigger value="map" className="rounded-md text-xs font-medium px-3 py-1 gap-1.5">
            <MapPin className="w-3.5 h-3.5" />
            Bölgesel Harita
            <Badge variant="secondary" className="h-4 px-1.5 text-[10px] rounded-full tabular-nums">
              {Object.keys(filteredCityDistribution).length}
            </Badge>
          </TabsTrigger>
          <TabsTrigger value="financials" className="rounded-md text-xs font-medium px-3 py-1 gap-1.5">
            <Wallet className="w-3.5 h-3.5" />
            Finansal Risk
          </TabsTrigger>
        </TabsList>

        {/* ── TAB 1: OVERVIEW ─────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-4 outline-none">
          {/* Compact 3-col Resource Gap Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CompactKPICard
              title="Eksik İSG Uzmanı"
              value={totalSpecialistGaps}
              icon={UserMinus}
              hint="Süre veya sınıf eksiği"
              status={totalSpecialistGaps === 0 ? 'success' : 'destructive'}
              onClick={() => handleOpenDialog('gap-igu')}
              interactive
            />
            <CompactKPICard
              title="Eksik İşyeri Hekimi"
              value={totalDoctorGaps}
              icon={UserMinus}
              hint="Hekim süre eksiği"
              status={totalDoctorGaps === 0 ? 'success' : 'destructive'}
              onClick={() => handleOpenDialog('gap-hekim')}
              interactive
            />
            <CompactKPICard
              title="Eksik DSP"
              value={totalDspGaps}
              icon={UserMinus}
              hint="Çok tehlikeli sınıf DSP"
              status={totalDspGaps === 0 ? 'success' : 'destructive'}
              onClick={() => handleOpenDialog('gap-dsp')}
              interactive
            />
          </div>

          {/* Financial Compact Row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CompactFinancialCard
              title="Aylık OSGB Maliyeti"
              value={computedKpis.monthlyOsgbCost}
              icon={Wallet}
              hint="Aktif OSGB sözleşmeleri toplamı"
            />
            <CompactFinancialCard
              title="Aylık Ceza Riski"
              value={computedKpis.monthlyPenaltyRisk}
              icon={Gavel}
              status="danger"
              hint="Eksik atama aylık idari yaptırım"
            />
            <CompactFinancialCard
              title={`${currentYear} Yıllık Ceza Projeksiyonu`}
              value={computedKpis.cumulativePenaltyRisk2026}
              icon={Activity}
              status="danger"
              hint="12 aylık tahmini toplam risk"
            />
          </div>

          {/* Employee Trend Chart */}
          <EmployeeTrendChart data={data?.employeeTrend || []} />
        </TabsContent>

        {/* ── TAB 2: INLINE ACTIONABLE RESOURCE GAPS TRACKER ──────────────── */}
        <TabsContent value="gaps" className="space-y-3 outline-none">
          {/* Role Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {[
                { key: 'all', label: `Tümü (${totalGapsCount})` },
                { key: 'IGU', label: `İSG Uzmanı (${totalSpecialistGaps})` },
                { key: 'Hekim', label: `İşyeri Hekimi (${totalDoctorGaps})` },
                { key: 'DSP', label: `DSP (${totalDspGaps})` },
              ].map((pill) => (
                <Button
                  key={pill.key}
                  variant={gapRoleFilter === pill.key ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateParams({ gapRole: pill.key })}
                  className="h-7 px-2.5 text-xs rounded-lg tabular-nums"
                >
                  {pill.label}
                </Button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground tabular-nums">
              {combinedGapsList.length} açık takip kaydı
            </span>
          </div>

          {/* Live Inline Gaps Table */}
          <Card className="rounded-lg border border-border bg-card shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="px-4 py-2.5 font-semibold text-muted-foreground">Tesis</th>
                    <th className="px-3 py-2.5 font-semibold text-muted-foreground">İl</th>
                    <th className="px-3 py-2.5 font-semibold text-muted-foreground">Tehlike Sınıfı</th>
                    <th className="px-3 py-2.5 font-semibold text-muted-foreground text-center">Çalışan</th>
                    <th className="px-3 py-2.5 font-semibold text-muted-foreground">Eksik Rol</th>
                    <th className="px-3 py-2.5 font-semibold text-muted-foreground">Eksiklik Detayı</th>
                    <th className="px-4 py-2.5 font-semibold text-muted-foreground text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {combinedGapsList.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-1.5">
                          <CheckCircle2 className="w-7 h-7 text-emerald-500 opacity-70" />
                          <span className="font-semibold text-foreground">Açık kaynak eksiği bulunmuyor</span>
                          <span className="text-[11px]">
                            Seçili filtre kriterlerine göre tüm yasal atamalar uyumlu görünüyor.
                          </span>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    combinedGapsList.map((row) => (
                      <tr key={row.key} className="hover:bg-muted/30 transition-colors">
                        <td className="px-4 py-2.5 font-semibold text-foreground">
                          <Link
                            to={`/panel/facilities/${row.facilityId}`}
                            className="hover:text-primary transition-colors inline-flex items-center gap-1"
                          >
                            {row.facilityName}
                            <ExternalLink className="w-3 h-3 opacity-50" />
                          </Link>
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">{row.city}</td>
                        <td className="px-3 py-2.5">
                          <Badge
                            variant="outline"
                            className={cn(
                              'text-[10px] h-5 px-2 font-semibold',
                              row.dangerClass === 'Çok Tehlikeli'
                                ? 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                                : row.dangerClass === 'Tehlikeli'
                                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20'
                            )}
                          >
                            {row.dangerClass}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 text-center font-medium tabular-nums">
                          {row.employeeCount}
                        </td>
                        <td className="px-3 py-2.5">
                          <Badge variant="secondary" className="text-[10px] h-5 px-2 font-semibold">
                            {row.roleLabel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 font-semibold text-destructive tabular-nums">
                          {row.missingLabel}
                        </td>
                        <td className="px-4 py-2.5 text-right">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2.5 text-[11px] rounded-md gap-1"
                            onClick={() => {
                              setSelectedFacility({
                                id: row.facilityId,
                                name: row.facilityName,
                                dangerClass: row.dangerClass,
                                compliance: row.raw,
                              });
                              setAssignType(row.role);
                              setAssignModalOpen(true);
                            }}
                          >
                            <UserPlus className="w-3 h-3" />
                            Hızlı Ata
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </TabsContent>

        {/* ── TAB 3: REGIONAL MAP & DISTRIBUTION ──────────────────────────── */}
        <TabsContent value="map" className="outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2">
              <TurkeyMapSection
                cityData={filteredCityDistribution}
                onCityClick={handleCityClick}
                selectedCity={selectedCityForDialog || selectedCityFilter}
              />
            </div>
            <div className="lg:col-span-1">
              <CityDistribution
                data={filteredCityDistribution}
                onCityClick={handleCityClick}
                selectedCity={selectedCityForDialog || selectedCityFilter}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 4: FINANCIALS & FINES ───────────────────────────────────── */}
        <TabsContent value="financials" className="space-y-4 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <CompactFinancialCard
              title="Aylık OSGB Maliyeti"
              value={computedKpis.monthlyOsgbCost}
              icon={Wallet}
              hint="Sözleşme birim fiyatları üzerinden aylık gider"
            />
            <CompactFinancialCard
              title="Aylık Ceza Riski"
              value={computedKpis.monthlyPenaltyRisk}
              icon={Gavel}
              status="danger"
              hint="6331 Sayılı Kanun Md. 26 aylık risk"
            />
            <CompactFinancialCard
              title={`${currentYear} Kümülatif Ceza Riski`}
              value={computedKpis.cumulativePenaltyRisk2026}
              icon={Activity}
              status="danger"
              hint="12 aylık tahmini toplam yaptırım"
            />
          </div>

          <Card className="rounded-lg border border-border bg-card shadow-xs">
            <CardHeader className="py-3 px-4 border-b border-border/50">
              <CardTitle className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Mevzuat ve İdari Para Cezası Dayanağı (6331 Sayılı Kanun)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 text-xs text-muted-foreground space-y-2 leading-relaxed">
              <p>
                6331 sayılı İş Sağlığı ve Güvenliği Kanunu'nun 26. maddesi gereğince, görevlendirilmesi
                zorunlu olan <strong>İş Güvenliği Uzmanı</strong> veya <strong>İşyeri Hekimi</strong>{' '}
                görevlendirmeyen işverene, görevlendirilmeyen her bir kişi ve aykırılığın devam ettiği
                her ay için tehlike sınıfına göre idari para cezası tatbik edilir.
              </p>
              <p>
                <strong>Çok Tehlikeli</strong> sınıfta yer alan işyerlerinde Diğer Sağlık Personeli (DSP)
                görevlendirmemek de her ay için bağımsız idari para cezasına tabidir.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── DIALOGS ───────────────────────────────────────────────────────── */}
      <CertificateRenewalDialog
        open={activeDialog === 'certs'}
        onOpenChange={(open) => !open && handleCloseDialog()}
        data={filteredCertificates}
      />

      <ResourceGapDialog
        open={activeDialog === 'gap-igu'}
        onOpenChange={(open) => !open && handleCloseDialog()}
        title="Eksik İSG Uzmanı Listesi"
        data={filteredResourceGaps.specialists}
        type="IGU"
        onAssign={(f, t) => {
          setSelectedFacility({ id: f.facilityId, name: f.facilityName, dangerClass: f.dangerClass, compliance: f });
          setAssignType(t);
          setAssignModalOpen(true);
        }}
      />

      <ResourceGapDialog
        open={activeDialog === 'gap-hekim'}
        onOpenChange={(open) => !open && handleCloseDialog()}
        title="Eksik İşyeri Hekimi Listesi"
        data={filteredResourceGaps.doctors}
        type="Hekim"
        onAssign={(f, t) => {
          setSelectedFacility({ id: f.facilityId, name: f.facilityName, dangerClass: f.dangerClass, compliance: f });
          setAssignType(t);
          setAssignModalOpen(true);
        }}
      />

      <ResourceGapDialog
        open={activeDialog === 'gap-dsp'}
        onOpenChange={(open) => !open && handleCloseDialog()}
        title="Eksik DSP Listesi"
        data={filteredResourceGaps.dsp}
        type="DSP"
        onAssign={(f, t) => {
          setSelectedFacility({ id: f.facilityId, name: f.facilityName, dangerClass: f.dangerClass, compliance: f });
          setAssignType(t);
          setAssignModalOpen(true);
        }}
      />

      <CityDetailDialog
        open={activeDialog === 'city-detail' && Boolean(selectedCityForDialog)}
        onOpenChange={(open) => !open && handleCloseDialog()}
        cityName={selectedCityForDialog || ''}
        data={data?.cityDetails?.[selectedCityForDialog || '']}
      />

      <QuickAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        facility={selectedFacility}
        type={assignType}
        onSuccess={() => refetch()}
      />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT KPI CARD (30-design-system: 0.5rem radius, p-3.5, tabular-nums)
// ─────────────────────────────────────────────────────────────────────────────
interface CompactKPICardProps {
  title: string;
  value: string | number;
  icon: any;
  hint?: string;
  status?: 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  interactive?: boolean;
  to?: string;
}

function CompactKPICard({
  title,
  value,
  icon: Icon,
  hint,
  status,
  onClick,
  interactive,
  to,
}: CompactKPICardProps) {
  const isClickable = Boolean(interactive || onClick || to);

  const inner = (
    <CardContent className="p-3.5">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-muted-foreground truncate">{title}</p>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="text-xl font-bold tracking-tight tabular-nums text-foreground">
              {value}
            </span>
            {status && (
              <Badge
                variant="outline"
                className={cn(
                  'text-[9px] h-4 px-1.5 font-semibold uppercase',
                  status === 'success' && 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20',
                  status === 'warning' && 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20',
                  status === 'destructive' && 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
                )}
              >
                {status === 'success' ? 'Uyumlu' : status === 'warning' ? 'Dikkat' : 'Eksik'}
              </Badge>
            )}
          </div>
        </div>
        <div className="w-8 h-8 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors shrink-0">
          <Icon className="w-4 h-4" />
        </div>
      </div>
      {hint && (
        <div className="flex items-center justify-between gap-1 mt-2 pt-1.5 border-t border-border/40 text-[11px] text-muted-foreground">
          <span className="truncate">{hint}</span>
          {isClickable && (
            <ArrowRight className="w-3 h-3 shrink-0 opacity-60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
          )}
        </div>
      )}
    </CardContent>
  );

  const classes = cn(
    'rounded-lg border border-border bg-card shadow-xs group transition-all duration-200',
    isClickable && 'cursor-pointer hover:border-primary/50 hover:shadow-sm'
  );

  if (to) {
    return (
      <Link to={to} className="block">
        <Card className={classes}>{inner}</Card>
      </Link>
    );
  }

  return (
    <Card className={classes} onClick={onClick}>
      {inner}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPACT FINANCIAL CARD
// ─────────────────────────────────────────────────────────────────────────────
function CompactFinancialCard({
  title,
  value,
  icon: Icon,
  hint,
  status = 'default',
}: {
  title: string;
  value: number;
  icon: any;
  hint?: string;
  status?: 'default' | 'danger';
}) {
  const isDanger = status === 'danger';
  return (
    <Card
      className={cn(
        'rounded-lg border shadow-xs bg-card transition-all duration-200',
        isDanger ? 'border-destructive/30' : 'border-border'
      )}
    >
      <CardContent className="p-3.5">
        <div className="flex items-center gap-3">
          <div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center shrink-0',
              isDanger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
            )}
          >
            <Icon className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-medium text-muted-foreground truncate">{title}</p>
            <p className="text-lg font-bold tracking-tight tabular-nums text-foreground truncate">
              {value.toLocaleString('tr-TR', {
                style: 'currency',
                currency: 'TRY',
                maximumFractionDigits: 0,
              })}
            </p>
            {hint && <p className="text-[10px] text-muted-foreground truncate mt-0.5">{hint}</p>}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
