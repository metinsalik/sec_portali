import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '@/lib/api';
import { 
  Building2, Users, AlertTriangle, 
  ShieldAlert, TrendingUp, Wallet, Gavel, 
  UserPlus, UserMinus, Activity, MapPin, 
  LayoutGrid, Calendar, ArrowRight, ShieldCheck,
  FileText, Sparkles
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
  CityDetailDialog 
} from '@/components/panel/dashboard/DashboardDialogs';
import { QuickAssignModal } from '@/components/panel/assignments/QuickAssignModal';

interface DashboardData {
  kpis: {
    totalFacilities: number;
    totalEmployees: number;
    averageComplianceScore: number;
    monthlyOsgbCost: number;
    monthlyPenaltyRisk: number;
    cumulativePenaltyRisk2026: number;
  };
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

export default function PanelDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL-SYNCHRONIZED STATE (Akıllı URL Filtreleme & Durum Yönetimi) ─────────
  const activeTab = searchParams.get('tab') || 'overview';
  const searchTerm = searchParams.get('q') || '';
  const selectedCityFilter = searchParams.get('city') || 'all';
  const selectedDanger = searchParams.get('danger') || 'all';
  const activeDialog = searchParams.get('dialog');
  const selectedCityForDialog = searchParams.get('selectedCity') || null;

  // Local state for modal assignment
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'IGU' | 'Hekim' | 'DSP' | 'Vekil'>('IGU');
  const [selectedFacility, setSelectedFacility] = useState<any>(null);

  // Helper to update URL params cleanly
  const updateParams = useCallback((updates: Record<string, string | null>) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '' || value === 'all' || (key === 'tab' && value === 'overview')) {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  // ── GERİ GELDİĞİNDE KALDIĞI YERİ HATIRLAMA (Scroll Restoration) ────────────
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_dashboard_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // ── DATA FETCHING ─────────────────────────────────────────────────────────
  const { data, isLoading, isFetching, refetch } = useQuery<DashboardData>({
    queryKey: ['panel-dashboard'],
    queryFn: async () => {
      const res = await api.get('/panel/dashboard');
      if (!res.ok) throw new Error('Dashboard verileri yüklenemedi.');
      return res.json();
    },
    staleTime: 60 * 1000,
  });

  // Restore scroll position after loading completes
  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_dashboard_scrollY');
      if (savedY) {
        const scrollY = parseInt(savedY, 10);
        if (!isNaN(scrollY) && scrollY > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
          });
        }
      }
    }
  }, [isLoading]);

  // City list for filters
  const availableCities = useMemo(() => {
    if (!data?.cityDistribution) return [];
    return Object.keys(data.cityDistribution).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [data?.cityDistribution]);

  // ── FILTERED DATA CALCULATION ─────────────────────────────────────────────
  const filteredResourceGaps = useMemo(() => {
    if (!data?.resourceGaps) return { specialists: [], doctors: [], dsp: [] };

    const filterList = (list: any[]) => {
      return list.filter((r) => {
        // Search filter
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          const matchName = r.facilityName?.toLowerCase().includes(term);
          if (!matchName) return false;
        }
        // Danger class filter
        if (selectedDanger !== 'all' && r.dangerClass !== selectedDanger) {
          return false;
        }
        // City filter
        if (selectedCityFilter !== 'all') {
          // If city details are available, verify facility's city
          if (data.cityDetails && data.cityDetails[selectedCityFilter]) {
            const cityFacs: any[] = [];
            Object.values(data.cityDetails[selectedCityFilter].districts || {}).forEach((d: any) => {
              cityFacs.push(...(d.facilities || []));
            });
            const existsInCity = cityFacs.some((f) => f.id === r.facilityId);
            if (!existsInCity) return false;
          }
        }
        return true;
      });
    };

    return {
      specialists: filterList(data.resourceGaps.specialists),
      doctors: filterList(data.resourceGaps.doctors),
      dsp: filterList(data.resourceGaps.dsp),
    };
  }, [data, searchTerm, selectedDanger, selectedCityFilter]);

  // Count active filters
  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (searchTerm) count++;
    if (selectedCityFilter !== 'all') count++;
    if (selectedDanger !== 'all') count++;
    return count;
  }, [searchTerm, selectedCityFilter, selectedDanger]);

  const handleResetFilters = useCallback(() => {
    updateParams({
      q: null,
      city: null,
      danger: null,
    });
  }, [updateParams]);

  // Handlers for dialogs with URL preservation
  const handleOpenDialog = (dialogName: string, city?: string) => {
    updateParams({
      dialog: dialogName,
      selectedCity: city || selectedCityForDialog || null,
    });
  };

  const handleCloseDialog = () => {
    updateParams({
      dialog: null,
      selectedCity: null,
    });
  };

  const handleCityClick = (cityName: string) => {
    updateParams({
      dialog: 'city-detail',
      selectedCity: cityName,
    });
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  const kpi = data?.kpis;
  const totalUpcomingCerts = data?.upcomingCertificates?.length || 0;
  const totalSpecialistGaps = filteredResourceGaps.specialists.length;
  const totalDoctorGaps = filteredResourceGaps.doctors.length;
  const totalDspGaps = filteredResourceGaps.dsp.length;
  const totalGapsCount = totalSpecialistGaps + totalDoctorGaps + totalDspGaps;

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/50 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Yönetim Paneli
            </h1>
            <Badge variant="outline" className="h-6 px-2.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20">
              <Sparkles className="w-3 h-3 mr-1" /> Canlı İzleme
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-primary shrink-0" />
            Portföy geneli İSG yasal uyumluluk, atama açıkları ve finansal risk göstergeleri
          </p>
        </div>

        <div className="flex items-center gap-3 self-start md:self-auto">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
              Son Senkronizasyon
            </p>
            <p className="text-xs font-bold text-foreground">
              {new Date().toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <Button
            asChild
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Link to="/panel/facilities">
              <Building2 className="w-3.5 h-3.5" />
              Tesisler ({kpi?.totalFacilities || 0})
            </Link>
          </Button>
        </div>
      </div>

      {/* ── SMART FILTER BAR (URL Parametreli) ────────────────────────────── */}
      <DashboardFilterBar
        searchTerm={searchTerm}
        onSearchChange={(q) => updateParams({ q })}
        selectedCity={selectedCityFilter}
        onCityChange={(city) => updateParams({ city })}
        availableCities={availableCities}
        selectedDanger={selectedDanger}
        onDangerChange={(danger) => updateParams({ danger })}
        activeFiltersCount={activeFiltersCount}
        onResetFilters={handleResetFilters}
        onRefresh={() => refetch()}
        isRefreshing={isFetching}
        totalFilteredCount={
          activeFiltersCount > 0
            ? Math.max(0, (kpi?.totalFacilities || 0) - (selectedDanger !== 'all' || selectedCityFilter !== 'all' ? totalGapsCount : 0))
            : undefined
        }
        totalCount={kpi?.totalFacilities}
      />

      {/* ── PRIMARY KPIS ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard 
          title="Toplam Tesis" 
          value={kpi?.totalFacilities || 0} 
          icon={Building2} 
          description="Aktif hizmet verilen İSG tesisi"
          to="/panel/facilities"
        />
        <KPICard 
          title="Toplam Çalışan" 
          value={kpi?.totalEmployees.toLocaleString('tr-TR') || 0} 
          icon={Users} 
          description="Tüm tesislerdeki kayıtlı çalışanlar"
        />
        <KPICard 
          title="Ortalama Uyum Skoru" 
          value={`%${kpi?.averageComplianceScore ? kpi.averageComplianceScore.toFixed(1) : 0}`} 
          icon={ShieldAlert} 
          description="Yasal atama karşılama oranı"
          status={
            (kpi?.averageComplianceScore || 0) >= 90
              ? 'success'
              : (kpi?.averageComplianceScore || 0) >= 70
              ? 'warning'
              : 'destructive'
          }
        />
        <Card 
          className="rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 hover:shadow-sm transition-all duration-200 cursor-pointer group"
          onClick={() => handleOpenDialog('certs')}
        >
          <CardContent className="p-5">
            <div className="flex justify-between items-start">
              <div className="space-y-1">
                <p className="text-xs font-semibold text-muted-foreground group-hover:text-foreground transition-colors">
                  Sertifika Yenileme
                </p>
                <div className="text-2xl font-bold tracking-tight text-foreground">
                  {totalUpcomingCerts}
                </div>
              </div>
              <div className="w-10 h-10 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-600 dark:text-amber-400 group-hover:bg-amber-500/20 transition-colors">
                <Calendar className="w-5 h-5" />
              </div>
            </div>
            <div className="flex items-center justify-between mt-3 text-xs">
              <span className="text-muted-foreground">Süresi yaklaşan uzman & hekim</span>
              <ArrowRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ── DASHBOARD VIEW TABS ──────────────────────────────────────────── */}
      <Tabs 
        value={activeTab} 
        onValueChange={(tab) => updateParams({ tab })}
        className="space-y-6"
      >
        <div className="flex items-center justify-between overflow-x-auto pb-1">
          <TabsList className="h-10 p-1 bg-muted/60 border border-border rounded-xl">
            <TabsTrigger value="overview" className="rounded-lg text-xs font-medium px-3.5 gap-1.5">
              <LayoutGrid className="w-3.5 h-3.5" />
              Genel Bakış
            </TabsTrigger>
            <TabsTrigger value="map" className="rounded-lg text-xs font-medium px-3.5 gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              Bölgesel Harita
              <Badge variant="secondary" className="h-4 px-1.5 text-[10px] rounded-full">
                {availableCities.length}
              </Badge>
            </TabsTrigger>
            <TabsTrigger value="gaps" className="rounded-lg text-xs font-medium px-3.5 gap-1.5">
              <UserMinus className="w-3.5 h-3.5" />
              Kaynak Açıkları
              {totalGapsCount > 0 && (
                <Badge variant="destructive" className="h-4 px-1.5 text-[10px] rounded-full">
                  {totalGapsCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="financials" className="rounded-lg text-xs font-medium px-3.5 gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              Finansal Risk
            </TabsTrigger>
          </TabsList>
        </div>

        {/* ── TAB 1: OVERVIEW ────────────────────────────────────────────── */}
        <TabsContent value="overview" className="space-y-6 outline-none">
          {/* Resource Gaps Summary */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-primary" />
                Kaynak Planlama & Eksik Atama Uyarıları
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => updateParams({ tab: 'gaps' })}
                className="h-7 text-xs text-primary gap-1"
              >
                Tümünü İncele <ArrowRight className="w-3 h-3" />
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <KPICard 
                title="Eksik İSG Uzmanı" 
                value={totalSpecialistGaps} 
                icon={UserMinus} 
                description="Süre veya sınıf eksiği olan tesisler"
                status={totalSpecialistGaps === 0 ? 'success' : 'destructive'}
                onClick={() => handleOpenDialog('gap-igu')}
                interactive
              />
              <KPICard 
                title="Eksik İşyeri Hekimi" 
                value={totalDoctorGaps} 
                icon={UserMinus} 
                description="Hekim ataması eksik olan tesisler"
                status={totalDoctorGaps === 0 ? 'success' : 'destructive'}
                onClick={() => handleOpenDialog('gap-hekim')}
                interactive
              />
              <KPICard 
                title="Eksik DSP" 
                value={totalDspGaps} 
                icon={UserMinus} 
                description="Çok tehlikeli sınıfta eksik DSP"
                status={totalDspGaps === 0 ? 'success' : 'destructive'}
                onClick={() => handleOpenDialog('gap-dsp')}
                interactive
              />
            </div>
          </div>

          {/* Trend Chart and Financial Quick Summary */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-3">
              <EmployeeTrendChart data={data?.employeeTrend || []} />
            </div>

            <FinancialCard 
              title="Aylık OSGB Maliyeti" 
              value={kpi?.monthlyOsgbCost || 0} 
              icon={Wallet} 
              description="Aktif OSGB sözleşmelerinin aylık toplam bedeli"
            />
            <FinancialCard 
              title="Aylık Ceza Riski" 
              value={kpi?.monthlyPenaltyRisk || 0} 
              icon={Gavel} 
              status="danger"
              description="Eksik atamalardan kaynaklı aylık idari para cezası riski"
            />
            <FinancialCard 
              title="2026 Kümülatif Ceza Riski" 
              value={kpi?.cumulativePenaltyRisk2026 || 0} 
              icon={Activity} 
              status="danger"
              description="Yıllık tahmini toplam yaptırım projeksiyonu"
            />
          </div>
        </TabsContent>

        {/* ── TAB 2: REGIONAL MAP & DISTRIBUTION ─────────────────────────── */}
        <TabsContent value="map" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <TurkeyMapSection 
                cityData={data?.cityDistribution || {}} 
                onCityClick={handleCityClick}
                selectedCity={selectedCityForDialog || selectedCityFilter}
              />
            </div>
            <div className="lg:col-span-1">
              <CityDistribution 
                data={data?.cityDistribution || {}} 
                onCityClick={handleCityClick}
                selectedCity={selectedCityForDialog || selectedCityFilter}
              />
            </div>
          </div>
        </TabsContent>

        {/* ── TAB 3: DETAILED RESOURCE GAPS ──────────────────────────────── */}
        <TabsContent value="gaps" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">İSG Uzmanı Açığı</span>
                <Badge variant={totalSpecialistGaps === 0 ? "outline" : "destructive"}>
                  {totalSpecialistGaps} Tesis
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tesislerin çalışma süreleri veya tehlike sınıfı (A, B, C) uyumsuzluğu olan İSG uzmanları.
              </p>
              <Button 
                onClick={() => handleOpenDialog('gap-igu')}
                className="w-full text-xs font-semibold h-8 rounded-lg"
              >
                Uzman Açıklarını İncele ({totalSpecialistGaps})
              </Button>
            </Card>

            <Card className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">İşyeri Hekimi Açığı</span>
                <Badge variant={totalDoctorGaps === 0 ? "outline" : "destructive"}>
                  {totalDoctorGaps} Tesis
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Tüm tehlike sınıflarında çalışan sayısına göre belirlenen hekim görevlendirme süre eksiklikleri.
              </p>
              <Button 
                onClick={() => handleOpenDialog('gap-hekim')}
                className="w-full text-xs font-semibold h-8 rounded-lg"
              >
                Hekim Açıklarını İncele ({totalDoctorGaps})
              </Button>
            </Card>

            <Card className="rounded-xl border border-border bg-card p-5 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted-foreground uppercase">DSP Açığı</span>
                <Badge variant={totalDspGaps === 0 ? "outline" : "destructive"}>
                  {totalDspGaps} Tesis
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                Çok tehlikeli sınıfta yer alan ve mevzuat gereği diğer sağlık personeli atanması gereken tesisler.
              </p>
              <Button 
                onClick={() => handleOpenDialog('gap-dsp')}
                className="w-full text-xs font-semibold h-8 rounded-lg"
              >
                DSP Açıklarını İncele ({totalDspGaps})
              </Button>
            </Card>
          </div>
        </TabsContent>

        {/* ── TAB 4: FINANCIALS & FINES ───────────────────────────────────── */}
        <TabsContent value="financials" className="space-y-6 outline-none">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FinancialCard 
              title="Aylık OSGB Maliyeti" 
              value={kpi?.monthlyOsgbCost || 0} 
              icon={Wallet} 
              description="Faturalandırılan veya sözleşme birim fiyatları üzerinden hesaplanan aylık gider"
            />
            <FinancialCard 
              title="Aylık Ceza Riski" 
              value={kpi?.monthlyPenaltyRisk || 0} 
              icon={Gavel} 
              status="danger"
              description="6331 sayılı İSG Kanunu Md. 26 uyarınca uygulanabilecek aylık idari yaptırım"
            />
            <FinancialCard 
              title="2026 Kümülatif Ceza Riski" 
              value={kpi?.cumulativePenaltyRisk2026 || 0} 
              icon={Activity} 
              status="danger"
              description="Atamalar tamamlanmadığı takdirde yıl sonuna kadar oluşacak toplam risk"
            />
          </div>

          <Card className="rounded-xl border border-border bg-card shadow-xs">
            <CardHeader className="pb-3 border-b border-border/40">
              <CardTitle className="text-sm font-semibold flex items-center gap-2 text-foreground">
                <ShieldCheck className="w-4 h-4 text-primary" />
                Mevzuat ve İdari Para Cezası Dayanağı (6331 Sayılı Kanun)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-5 text-xs text-muted-foreground space-y-3 leading-relaxed">
              <p>
                6331 sayılı İş Sağlığı ve Güvenliği Kanunu'nun 26. maddesi gereğince, görevlendirilmesi zorunlu olan 
                <strong> İş Güvenliği Uzmanı</strong> veya <strong>İşyeri Hekimi</strong> görevlendirmeyen işverene, 
                görevlendirilmeyen her bir kişi ve aykırılığın devam ettiği her ay için idari para cezası tatbik edilir.
              </p>
              <p>
                Ayrıca <strong>Çok Tehlikeli</strong> sınıfta yer alan işyerlerinde Diğer Sağlık Personeli (DSP) 
                görevlendirmemek de aynı şekilde her ay için bağımsız idari para cezasına tabidir.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* ── DIALOGS (URL Parametreleriyle Senkronize) ──────────────────────── */}
      <CertificateRenewalDialog 
        open={activeDialog === 'certs'} 
        onOpenChange={(open) => !open && handleCloseDialog()}
        data={data?.upcomingCertificates || []}
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
// REUSABLE KPI CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface KPICardProps {
  title: string;
  value: string | number;
  icon: any;
  description?: string;
  status?: 'success' | 'warning' | 'destructive';
  onClick?: () => void;
  interactive?: boolean;
  to?: string;
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  status, 
  onClick, 
  interactive,
  to 
}: KPICardProps) {
  const content = (
    <CardContent className="p-5">
      <div className="flex justify-between items-start">
        <div className="space-y-1">
          <p className="text-xs font-semibold text-muted-foreground">{title}</p>
          <div className="text-2xl font-bold tracking-tight text-foreground">{value}</div>
        </div>
        <div className="w-10 h-10 rounded-lg bg-muted/60 flex items-center justify-center text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
          <Icon className="w-5 h-5" />
        </div>
      </div>
      {description && (
        <div className="flex items-center justify-between gap-2 mt-3 pt-2.5 border-t border-border/40 text-xs">
          <p className="text-muted-foreground truncate">{description}</p>
          {status && (
            <Badge 
              variant="outline" 
              className={`text-[10px] h-5 px-1.5 font-bold uppercase tracking-tight shrink-0 ${
                status === 'success' 
                  ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20' 
                  : status === 'warning'
                  ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20'
                  : 'bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20'
              }`}
            >
              {status === 'success' ? 'Uyumlu' : status === 'warning' ? 'Orta Uyum' : 'Eksik'}
            </Badge>
          )}
        </div>
      )}
    </CardContent>
  );

  const cardClasses = `rounded-xl border border-border bg-card shadow-xs group transition-all duration-200 ${
    interactive || onClick || to ? 'cursor-pointer hover:border-primary/50 hover:shadow-sm' : ''
  }`;

  if (to) {
    return (
      <Link to={to} className="block">
        <Card className={cardClasses}>{content}</Card>
      </Link>
    );
  }

  return (
    <Card className={cardClasses} onClick={onClick}>
      {content}
    </Card>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// REUSABLE FINANCIAL CARD COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
interface FinancialCardProps {
  title: string;
  value: number;
  icon: any;
  description?: string;
  status?: 'default' | 'danger';
}

function FinancialCard({ title, value, icon: Icon, description, status = 'default' }: FinancialCardProps) {
  const isDanger = status === 'danger';

  return (
    <Card className={`rounded-xl border shadow-xs bg-card transition-all duration-200 ${
      isDanger ? 'border-destructive/30' : 'border-border'
    }`}>
      <CardContent className="p-5">
        <div className="flex items-start gap-3.5">
          <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
            isDanger ? 'bg-destructive/10 text-destructive' : 'bg-primary/10 text-primary'
          }`}>
            <Icon className="w-5 h-5" />
          </div>
          <div className="space-y-1 min-w-0">
            <p className="text-xs font-semibold text-muted-foreground">{title}</p>
            <p className="text-xl sm:text-2xl font-bold tracking-tight text-foreground truncate">
              {value.toLocaleString('tr-TR', { style: 'currency', currency: 'TRY', maximumFractionDigits: 0 })}
            </p>
            {description && (
              <p className="text-[11px] text-muted-foreground leading-snug pt-1">
                {description}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
