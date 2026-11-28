import { useState, useMemo, useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Activity, Flame, ShieldAlert, CheckCircle2, Clock, Calendar, AlertTriangle, ArrowRight, Eye, ExternalLink, Building2 } from 'lucide-react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend 
} from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

export default function IsgDefterDashboard() {
  const navigate = useNavigate();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const tableScrollRef = useRef<HTMLDivElement>(null);
  const [breakdownView, setBreakdownView] = useState<'group' | 'risk'>('group');
  const [previewItem, setPreviewItem] = useState<any | null>(null);

  // Sync with LocalStorage on Mount
  useEffect(() => {
    let changed = false;
    const newParams = new URLSearchParams(searchParams);
    const keys = ['year', 'month', 'status', 'risk', 'mainCategory', 'category'];
    keys.forEach(k => {
      if (!searchParams.has(k)) {
        const local = localStorage.getItem(`isg_dashboard_${k}`);
        if (local && local !== 'all') {
          newParams.set(k, local);
          changed = true;
        }
      }
    });
    if (changed) {
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Window Scroll Restoration
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('isg_dashboard_window_scroll', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Filters State
  const selectedYear = searchParams.get('year') || 'all';
  const selectedMonth = searchParams.get('month') || 'all';
  const selectedStatus = searchParams.get('status') || 'all';
  const selectedRisk = searchParams.get('risk') || 'all';
  const selectedMainCategory = searchParams.get('mainCategory') || 'all';
  const selectedCategory = searchParams.get('category') || 'all';

  const updateParam = (key: string, value: string | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (value && value !== 'all') {
      newParams.set(key, value);
      localStorage.setItem(`isg_dashboard_${key}`, value);
    } else {
      newParams.delete(key);
      localStorage.removeItem(`isg_dashboard_${key}`);
    }
    setSearchParams(newParams);
  };

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
    ['year', 'month', 'status', 'risk', 'mainCategory', 'category'].forEach(k => {
      localStorage.removeItem(`isg_dashboard_${k}`);
    });
  };

  // Queries
  const { data: stats, isLoading } = useQuery({
    queryKey: ['isg-defter-stats', activeFacilityId, selectedYear, selectedMonth, selectedStatus, selectedRisk, selectedMainCategory, selectedCategory],
    queryFn: async () => {
      if (!activeFacilityId) return null;
      
      const query = new URLSearchParams();
      if (selectedYear !== 'all') query.set('year', selectedYear);
      if (selectedMonth !== 'all') query.set('month', selectedMonth);
      if (selectedStatus !== 'all') query.set('status', selectedStatus);
      if (selectedRisk !== 'all') query.set('risk', selectedRisk);
      if (selectedMainCategory !== 'all') query.set('mainCategory', selectedMainCategory);
      if (selectedCategory !== 'all') query.set('category', selectedCategory);

      const res = await api.get(`/safety-management/isg-defter/facilities/${activeFacilityId}/dashboard?${query.toString()}`);
      return res.json();
    },
    enabled: !!activeFacilityId,
  });

  // Restore Scroll Positions when Stats Load
  useEffect(() => {
    if (stats) {
      // Small timeout to ensure DOM is updated
      setTimeout(() => {
        const savedWindowScroll = sessionStorage.getItem('isg_dashboard_window_scroll');
        if (savedWindowScroll) {
          window.scrollTo({ top: parseInt(savedWindowScroll, 10), behavior: 'instant' });
        }
        
        const savedTableScroll = sessionStorage.getItem('isg_dashboard_table_scroll');
        if (savedTableScroll && tableScrollRef.current) {
          tableScrollRef.current.scrollTop = parseInt(savedTableScroll, 10);
        }
      }, 50);
    }
  }, [stats]);

  const { data: settings } = useQuery({
    queryKey: ['isg-defter-settings', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId || activeFacilityId === 'all') return null;
      const res = await api.get(`/safety-management/isg-defter/facilities/${activeFacilityId}/settings`);
      return res.json();
    },
    enabled: !!activeFacilityId && activeFacilityId !== 'all',
  });

  if (!activeFacilityId) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center">
        <Activity className="h-16 w-16 text-muted-foreground mb-4 opacity-50" />
        <h2 className="text-2xl font-semibold mb-2">Tesis Seçimi Gerekli</h2>
        <p className="text-muted-foreground">Lütfen gösterge panelini görüntülemek için sol menüden bir tesis seçin.</p>
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground animate-pulse">Veriler yükleniyor...</div>;
  }

  if (stats?.error) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] text-center text-red-500">
        <AlertTriangle className="h-16 w-16 mb-4 opacity-50" />
        <h2 className="text-2xl font-semibold mb-2">Hata</h2>
        <p>{stats.error}</p>
      </div>
    );
  }

  if (!stats || !stats.mainCategoryDistribution) return null;

  // Chart Colors
  const COLORS = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#3b82f6', '#8b5cf6'];
  const STATUS_COLORS: Record<string, string> = {
    'Başlamadı': '#ef4444',
    'Devam Ediyor': '#3b82f6',
    'Tamamlandı': '#22c55e',
    'İptal Edildi': '#64748b'
  };

  const getRiskBadgeClass = (riskLevel?: string) => {
    switch (riskLevel) {
      case 'Kritik':
        return 'bg-red-500/15 text-red-700 dark:text-red-300 border-red-400/50 font-semibold';
      case 'Yüksek':
        return 'bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-400/50 font-semibold';
      case 'Önemli':
        return 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-400/50';
      case 'Olası':
        return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-300 border-yellow-400/50';
      case 'Önemsiz':
        return 'bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-400/50';
      default:
        return 'bg-muted text-muted-foreground border-border';
    }
  };

  const donutData = [
    { name: 'Kapanan', value: stats.closedItems, fill: '#22c55e' },
    { name: 'Açık', value: stats.incompleteItems, fill: '#ef4444' }
  ];

  const breakdownChartData =
    breakdownView === 'risk'
      ? (stats.openClosedByRisk || [])
      : (stats.openClosedBreakdown || []);

  return (
    <div className="space-y-4 max-w-[1600px] mx-auto pb-10">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground">Gösterge Paneli</h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            İSG Tespit ve Öneri Defteri kapsamındaki açık ve kapalı tespitleri, risk düzeylerini ve aksiyonları takip edin.
          </p>
        </div>
      </div>

      {/* TOP BANNER: FIRE & EMERGENCY */}
      {stats.fireAndEmergency && stats.fireAndEmergency.total > 0 && (
        <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 rounded-xl p-4 md:p-6 flex flex-col md:flex-row items-center justify-between gap-4 shadow-sm relative overflow-hidden">
          <div className="absolute top-0 left-0 w-2 h-full bg-red-500"></div>
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500 text-white flex items-center justify-center flex-shrink-0 shadow-sm">
              <Flame className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-red-50">Yangın Güvenliği ve Acil Durum Kararları</h3>
              <p className="text-sm text-red-800/80 dark:text-red-200/80 mt-1 font-medium">
                Yangın önleme, söndürme ve acil durum planlarına ait kararların özel takibi (filtrelerden bağımsız genel özet).
              </p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border shadow-sm text-center">
              <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Toplam</div>
              <div className="text-xl font-bold text-slate-900 dark:text-white">{stats.fireAndEmergency.total}</div>
            </div>
            <div className="bg-white dark:bg-slate-900 px-4 py-2 rounded-lg border shadow-sm text-center">
              <div className="text-xs font-semibold text-red-500 uppercase tracking-wider mb-1">Tamamlanmamış</div>
              <div className="text-xl font-bold text-red-600">{stats.fireAndEmergency.open}</div>
            </div>
          </div>
        </div>
      )}

      {/* FILTERS */}
      <Card className="shadow-sm">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 items-end">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Yıl</label>
              <Select value={selectedYear} onValueChange={(v) => updateParam('year', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue>{selectedYear === 'all' ? 'Tüm Yıllar' : selectedYear}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Yıllar</SelectItem>
                  {Array.from({ length: new Date().getFullYear() - 2020 + 1 }, (_, i) => new Date().getFullYear() - i).map(y => (
                    <SelectItem key={y} value={y.toString()}>{y}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Ay</label>
              <Select value={selectedMonth} onValueChange={(v) => updateParam('month', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue>{selectedMonth === 'all' ? 'Tüm Aylar' : format(new Date(2024, parseInt(selectedMonth), 1), 'MMMM', { locale: tr })}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Aylar</SelectItem>
                  {Array.from({ length: 12 }).map((_, i) => (
                    <SelectItem key={i} value={i.toString()}>{format(new Date(2024, i, 1), 'MMMM', { locale: tr })}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Durum</label>
              <Select value={selectedStatus} onValueChange={(v) => updateParam('status', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue>{selectedStatus === 'all' ? 'Tüm Durumlar' : selectedStatus}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="Tamamlanmamış">Tamamlanmamış (Devam Edenler)</SelectItem>
                  <SelectItem value="Başlamadı">Başlamadı</SelectItem>
                  <SelectItem value="Devam Ediyor">Devam Ediyor</SelectItem>
                  <SelectItem value="Tamamlandı">Tamamlandı</SelectItem>
                  <SelectItem value="İptal Edildi">İptal Edildi</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Risk Düzeyi</label>
              <Select value={selectedRisk} onValueChange={(v) => updateParam('risk', v)}>
                <SelectTrigger className="bg-muted/30">
                  <SelectValue>{selectedRisk === 'all' ? 'Tüm Riskler' : selectedRisk}</SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Riskler</SelectItem>
                  {(settings?.riskLevels || []).map((r: any) => (
                    <SelectItem key={r.name} value={r.name}>{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {(selectedYear !== 'all' || selectedMonth !== 'all' || selectedStatus !== 'all' || selectedRisk !== 'all' || selectedMainCategory !== 'all' || selectedCategory !== 'all') && (
              <Button variant="outline" onClick={clearFilters} className="w-full text-muted-foreground">
                Filtreleri Temizle
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* GENEL GÖRÜNÜM & AÇIK / KAPALI ANALİZİ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OVERVIEW */}
        <Card className="lg:col-span-4 shadow-sm flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle>Genel Görünüm</CardTitle>
            <CardDescription>
              {selectedYear === 'all' ? 'Tüm Yıllar' : `${selectedYear} Yılı`} • {stats.facilityName || 'Seçili Tesis'}
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-black text-foreground tracking-tighter">
                {stats.totalItems}
              </div>
              <div className="text-sm font-medium text-muted-foreground mt-1 uppercase tracking-widest">
                Toplam Tespit
              </div>
            </div>

            <div className="h-[180px] relative flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={donutData}
                    cx="50%"
                    cy="50%"
                    startAngle={180}
                    endAngle={0}
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={0}
                    dataKey="value"
                    stroke="none"
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center justify-center mt-2">
                <span className="text-3xl font-bold text-foreground">
                  %{Math.round(stats.openPercentage)}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kapanış Oranı</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border">
              <div className="text-center cursor-pointer rounded-md p-1 hover:bg-muted/50 transition-colors" onClick={() => updateParam('status', 'Tamamlanmamış')}>
                <div className="text-2xl font-bold text-foreground">{stats.incompleteItems}</div>
                <div className="text-[11px] uppercase font-semibold text-red-600 dark:text-red-400 mt-1 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-red-500"></div> Açık
                </div>
              </div>
              <div className="text-center cursor-pointer rounded-md p-1 hover:bg-muted/50 transition-colors" onClick={() => updateParam('status', 'Tamamlandı')}>
                <div className="text-2xl font-bold text-foreground">{stats.closedItems}</div>
                <div className="text-[11px] uppercase font-semibold text-emerald-600 dark:text-emerald-400 mt-1 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div> Kapalı
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OPEN / CLOSED BREAKDOWN */}
        <Card className="lg:col-span-8 shadow-sm">
          <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <CardTitle>Açık / Kapalı Dağılım Analizi</CardTitle>
              <CardDescription>
                {breakdownView === 'risk'
                  ? 'Risk düzeyine göre açık ve kapalı tespit sayıları'
                  : activeFacilityId === 'all'
                  ? 'Tesislere göre açık ve kapalı tespit sayıları'
                  : 'Departmanlara göre açık ve kapalı tespit sayıları'}
              </CardDescription>
            </div>
            <div className="flex items-center gap-1 bg-muted/60 p-1 rounded-lg border border-border/60">
              <Button
                type="button"
                size="sm"
                variant={breakdownView === 'group' ? 'default' : 'ghost'}
                className="h-7 text-xs px-2.5"
                onClick={() => setBreakdownView('group')}
              >
                {activeFacilityId === 'all' ? 'Tesis Bazlı' : 'Departman Bazlı'}
              </Button>
              <Button
                type="button"
                size="sm"
                variant={breakdownView === 'risk' ? 'default' : 'ghost'}
                className="h-7 text-xs px-2.5"
                onClick={() => setBreakdownView('risk')}
              >
                Risk Düzeyine Göre
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              {breakdownChartData.length === 0 ? (
                <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                  Gösterilecek veri bulunamadı.
                </div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={breakdownChartData} margin={{ top: 20, right: 20, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#cbd5e1" opacity={0.4} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#64748b' }} dy={8} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(148,163,184,0.1)' }} contentStyle={{ borderRadius: '8px', border: '1px solid #e2e8f0' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '16px' }} />
                    <Bar dataKey="open" name="Açık Tespit" stackId="a" fill="#ef4444" radius={[0, 0, 0, 0]} maxBarSize={44} />
                    <Bar dataKey="closed" name="Kapalı (Tamamlandı)" stackId="a" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={44} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DISTRIBUTIONS ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* STATUS DIST */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base">Durum Dağılımı</CardTitle>
            <CardDescription className="text-xs">Grafiğe tıklayarak filtreleyin</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-2 h-[176px]">
              <div className="w-[46%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={62}
                      paddingAngle={2}
                      dataKey="value"
                      onClick={(data) => updateParam('status', data.name)}
                      className="cursor-pointer outline-none hover:opacity-80 transition-opacity"
                    >
                      {stats.statusDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[54%] space-y-1 max-h-[172px] overflow-y-auto pr-1">
                {stats.statusDistribution.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between cursor-pointer hover:bg-muted/60 px-1.5 py-1 rounded text-xs" onClick={() => updateParam('status', item.name)}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: STATUS_COLORS[item.name] || COLORS[idx % COLORS.length] }}></div>
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                    <span className="font-bold ml-2 shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RISK DIST */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base">Öncelik Dağılımı</CardTitle>
            <CardDescription className="text-xs">Grafiğe tıklayarak filtreleyin</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4">
            <div className="flex items-center gap-2 h-[176px]">
              <div className="w-[46%] h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.riskDistribution}
                      cx="50%" cy="50%"
                      innerRadius={42} outerRadius={62}
                      paddingAngle={2}
                      dataKey="value"
                      onClick={(data) => updateParam('risk', data.name)}
                      className="cursor-pointer outline-none hover:opacity-80 transition-opacity"
                    >
                      {stats.riskDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <RechartsTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-[54%] space-y-0.5 max-h-[172px] overflow-y-auto pr-1">
                {stats.riskDistribution.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between cursor-pointer hover:bg-muted/60 px-1.5 py-0.5 rounded text-xs" onClick={() => updateParam('risk', item.name)}>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="font-medium truncate">{item.name}</span>
                    </div>
                    <span className="font-bold ml-2 shrink-0">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OPEN / CLOSED SUMMARY */}
        <Card className="shadow-xs">
          <CardHeader className="pb-2 pt-4 px-4">
            <CardTitle className="text-base">Açık / Kapalı Tespit Özeti</CardTitle>
            <CardDescription className="text-xs">Tespitlerin güncel kapanma durumu ve kritik açıklar</CardDescription>
          </CardHeader>
          <CardContent className="px-4 pb-4 space-y-3">
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => updateParam('status', 'Tamamlanmamış')}
                className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-left hover:bg-red-500/15 transition-colors"
              >
                <div className="text-[11px] font-semibold text-red-600 dark:text-red-400 uppercase">Açık Tespit</div>
                <div className="text-xl font-bold text-foreground mt-0.5">{stats.incompleteItems}</div>
                <div className="text-[11px] text-muted-foreground">
                  Toplamın %{stats.totalItems > 0 ? Math.round((stats.incompleteItems / stats.totalItems) * 100) : 0}&apos;i
                </div>
              </button>
              <button
                type="button"
                onClick={() => updateParam('status', 'Tamamlandı')}
                className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-left hover:bg-emerald-500/15 transition-colors"
              >
                <div className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 uppercase">Kapalı (Tamamlandı)</div>
                <div className="text-xl font-bold text-foreground mt-0.5">{stats.closedItems}</div>
                <div className="text-[11px] text-muted-foreground">
                  Toplamın %{Math.round(stats.openPercentage)}&apos;i
                </div>
              </button>
            </div>

            <div className="space-y-1.5 pt-1 border-t border-border/50">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Kritik Seviye (Açık)</span>
                <button
                  type="button"
                  onClick={() => updateParam('risk', 'Kritik')}
                  className="font-bold text-red-600 dark:text-red-400 hover:underline"
                >
                  {stats.criticalOpenCount ?? 0} kayıt
                </button>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Yüksek Seviye (Açık)</span>
                <button
                  type="button"
                  onClick={() => updateParam('risk', 'Yüksek')}
                  className="font-bold text-orange-600 dark:text-orange-400 hover:underline"
                >
                  {stats.highOpenCount ?? 0} kayıt
                </button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DISTRIBUTIONS ROW 2 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* MAIN CATEGORY BAR LIST */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ana Kategoriler</CardTitle>
            <CardDescription>Filtrelemek için tıklayabilirsiniz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {stats.mainCategoryDistribution.map((cat: any, idx: number) => {
                const maxVal = stats.mainCategoryDistribution[0]?.value || 1;
                const percentage = (cat.value / maxVal) * 100;
                return (
                  <div key={idx} className={`cursor-pointer p-2 rounded-md hover:bg-slate-50 ${selectedMainCategory === cat.name ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`} onClick={() => updateParam('mainCategory', cat.name)}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="font-bold">{cat.value}</span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-blue-50" indicatorClassName="bg-blue-400" />
                  </div>
                );
              })}
              {stats.mainCategoryDistribution.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Veri bulunamadı</div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* SUB CATEGORY BAR LIST */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Alt Kategoriler</CardTitle>
            <CardDescription>Filtrelemek için tıklayabilirsiniz</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
              {stats.subCategoryDistribution.map((cat: any, idx: number) => {
                const maxVal = stats.subCategoryDistribution[0]?.value || 1;
                const percentage = (cat.value / maxVal) * 100;
                return (
                  <div key={idx} className={`cursor-pointer p-2 rounded-md hover:bg-slate-50 ${selectedCategory === cat.name ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`} onClick={() => updateParam('category', cat.name)}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span className="font-medium text-slate-700">{cat.name}</span>
                      <span className="font-bold">{cat.value}</span>
                    </div>
                    <Progress value={percentage} className="h-2 bg-blue-50" indicatorClassName="bg-indigo-400" />
                  </div>
                );
              })}
              {stats.subCategoryDistribution.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">Veri bulunamadı</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* RECENT FINDINGS TABLE */}
      <Card className="shadow-sm">
        <CardHeader className="flex flex-col md:flex-row items-start md:items-center justify-between pb-4 border-b gap-4">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              Tespit Listesi
            </CardTitle>
            <CardDescription>Uygulanan filtrelere göre tespitlerin tarihsel sıralaması (Maks. 50 kayıt)</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant={selectedStatus === 'all' ? 'secondary' : 'outline'} size="sm" className="h-8" onClick={() => updateParam('status', 'all')}>
              Tümü ({stats.totalItems})
            </Button>
            <Button variant={selectedStatus === 'Tamamlanmamış' ? 'secondary' : 'outline'} size="sm" className="h-8" onClick={() => updateParam('status', 'Tamamlanmamış')}>
              Tamamlanmamış ({stats.incompleteItems})
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div
            className="max-h-[520px] overflow-auto relative"
            ref={tableScrollRef}
            onScroll={(e) => {
              sessionStorage.setItem('isg_dashboard_table_scroll', e.currentTarget.scrollTop.toString());
            }}
          >
            <table className="w-full caption-bottom text-sm border-collapse">
              <thead className="bg-muted/95 sticky top-0 z-20 border-b border-border shadow-xs">
                <tr>
                  <th className="h-10 px-3 text-left align-middle font-semibold text-xs text-muted-foreground w-[140px] whitespace-nowrap">Tesis</th>
                  <th className="h-10 px-3 text-left align-middle font-semibold text-xs text-muted-foreground w-[105px] whitespace-nowrap">Tespit Tarihi</th>
                  <th className="h-10 px-3 text-left align-middle font-semibold text-xs text-muted-foreground w-[115px] whitespace-nowrap">Durum</th>
                  <th className="h-10 px-3 text-left align-middle font-semibold text-xs text-muted-foreground w-[110px] whitespace-nowrap">Risk Düzeyi</th>
                  <th className="h-10 px-3 text-left align-middle font-semibold text-xs text-muted-foreground min-w-[320px]">Tespit İçeriği</th>
                  <th className="h-10 px-3 text-center align-middle font-semibold text-xs text-muted-foreground w-[108px] sticky right-0 z-30 bg-muted/95 backdrop-blur-xs border-l border-border/60 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {stats.recentItems.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="text-center py-12 text-muted-foreground">Kayıt bulunamadı</td>
                  </tr>
                ) : (
                  stats.recentItems.map((item: any) => {
                    return (
                      <tr key={item.id} className="group hover:bg-muted/40 transition-colors">
                        <td className="px-3 py-2.5 align-middle font-medium whitespace-nowrap">
                          <Badge variant="secondary" className="font-normal">
                            {item.page?.facility?.name || stats.facilityName}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 align-middle font-medium whitespace-nowrap text-xs">
                          {format(new Date(item.page.date), 'dd.MM.yyyy')}
                        </td>
                        <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                          <Badge variant="outline" className={`font-normal ${
                            item.status === 'Tamamlandı' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                            item.status === 'Devam Ediyor' ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300' :
                            item.status === 'İptal Edildi' ? 'border-border bg-muted text-muted-foreground' :
                            'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
                          }`}>
                            {item.status}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 align-middle whitespace-nowrap">
                          <Badge variant="outline" className={getRiskBadgeClass(item.riskLevel)}>
                            {item.riskLevel}
                          </Badge>
                        </td>
                        <td className="px-3 py-2.5 align-middle">
                          <div className="line-clamp-2 text-sm max-w-[540px]" title={item.content}>
                            {item.content}
                          </div>
                          <div className="text-xs text-muted-foreground mt-1">
                            {item.mainCategory?.name} {item.category ? `> ${item.category.name}` : ''}
                          </div>
                        </td>
                        <td className="px-2 py-2 align-middle sticky right-0 z-10 bg-card group-hover:bg-muted/95 border-l border-border/60 shadow-[-4px_0_8px_-4px_rgba(0,0,0,0.08)]">
                          <div className="flex flex-col gap-1 items-stretch w-[92px] mx-auto">
                            <Button
                              variant="secondary"
                              size="sm"
                              className="h-7 px-2 text-[11px] font-medium justify-center"
                              onClick={() => setPreviewItem(item)}
                            >
                              <Eye className="w-3 h-3 mr-1" />
                              İncele
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-7 px-2 text-[11px] font-medium justify-center"
                              onClick={() => navigate(`/safety-management/isg-defter/items/${item.id}`)}
                            >
                              Detay
                              <ArrowRight className="w-3 h-3 ml-1" />
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
        </CardContent>
      </Card>

      {/* QUICK PREVIEW DIALOG */}
      <Dialog open={!!previewItem} onOpenChange={(open) => { if (!open) setPreviewItem(null); }}>
        <DialogContent className="sm:max-w-[640px] max-h-[85vh] overflow-y-auto">
          {previewItem && (
            <>
              <DialogHeader>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <Badge variant="secondary" className="font-normal">
                    <Building2 className="w-3 h-3 mr-1" />
                    {previewItem.page?.facility?.name || stats.facilityName}
                  </Badge>
                  <Badge variant="outline" className={`font-normal ${
                    previewItem.status === 'Tamamlandı' ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300' :
                    previewItem.status === 'Devam Ediyor' ? 'border-blue-500/40 bg-blue-500/10 text-blue-700 dark:text-blue-300' :
                    previewItem.status === 'İptal Edildi' ? 'border-border bg-muted text-muted-foreground' :
                    'border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-300'
                  }`}>
                    {previewItem.status}
                  </Badge>
                  <Badge variant="outline" className={getRiskBadgeClass(previewItem.riskLevel)}>
                    {previewItem.riskLevel}
                  </Badge>
                </div>
                <DialogTitle className="text-lg">
                  Tespit Özeti (#{previewItem.id})
                </DialogTitle>
                <DialogDescription className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" />
                    {format(new Date(previewItem.page.date), 'dd MMMM yyyy', { locale: tr })}
                  </span>
                  {(previewItem.mainCategory?.name || previewItem.category?.name) && (
                    <span>
                      • {previewItem.mainCategory?.name || ''}
                      {previewItem.category?.name ? ` > ${previewItem.category.name}` : ''}
                    </span>
                  )}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                    Tespit / Öneri İçeriği
                  </div>
                  <p className="text-sm leading-relaxed text-foreground whitespace-pre-wrap">
                    {previewItem.content}
                  </p>
                  {previewItem.authorType && (
                    <div className="mt-3 pt-2 border-t border-border/50 text-xs text-muted-foreground">
                      Kaydı Oluşturan: <span className="font-medium text-foreground">{previewItem.authorType}{previewItem.authorName && previewItem.authorName !== 'Sistem' ? ` - ${previewItem.authorName}` : ''}</span>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Alınan Aksiyonlar ({previewItem.actions?.length || 0})
                  </div>
                  {!previewItem.actions || previewItem.actions.length === 0 ? (
                    <div className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
                      Henüz bir aksiyon kaydı girilmemiş.
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {previewItem.actions.map((act: any) => (
                        <div key={act.id} className="rounded-lg border border-border bg-card p-3 text-xs space-y-1">
                          <p className="text-foreground font-medium whitespace-pre-wrap">{act.content}</p>
                          <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                            <span>{act.createdBy || 'Sistem'}</span>
                            <span>{format(new Date(act.createdAt), 'dd.MM.yyyy HH:mm', { locale: tr })}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setPreviewItem(null)}>
                  Kapat
                </Button>
                <Button
                  type="button"
                  onClick={() => {
                    const targetId = previewItem.id;
                    setPreviewItem(null);
                    navigate(`/safety-management/isg-defter/items/${targetId}`);
                  }}
                >
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  Tam Detay &amp; Aksiyon Sayfası
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
