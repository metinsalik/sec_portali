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
import { Activity, Flame, ShieldAlert, CheckCircle2, Clock, Calendar, AlertTriangle, ArrowRight } from 'lucide-react';
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

  const donutData = [
    { name: 'Kapanan', value: stats.closedItems, fill: '#22c55e' },
    { name: 'Devam Eden', value: stats.incompleteItems, fill: '#e2e8f0' }
  ];

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-12">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">Gösterge Paneli</h2>
          <p className="text-muted-foreground mt-1">
            İSG Kurul kararlarını, aksiyon süreçlerini ve iş yeri güvenliği performans metriklerini anlık takip edin.
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

      {/* GENEL GÖRÜNÜM & AYLIK AKIŞ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* OVERVIEW */}
        <Card className="lg:col-span-4 shadow-sm flex flex-col">
          <CardHeader className="pb-0">
            <CardTitle>Genel Görünüm</CardTitle>
            <CardDescription>
              {selectedYear === 'all' ? 'Tüm Yıllar' : `${selectedYear} Yılı`} • Seçili Tesis
            </CardDescription>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col justify-between pt-6">
            <div className="text-center mb-6">
              <div className="text-5xl font-black text-slate-900 dark:text-white tracking-tighter">
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
                <span className="text-3xl font-bold text-slate-900 dark:text-white">
                  %{Math.round(stats.openPercentage)}
                </span>
                <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Kapanış Oranı</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.incompleteItems}</div>
                <div className="text-[11px] uppercase font-semibold text-blue-600 mt-1 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-blue-600"></div> Tamamlanmamış
                </div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-slate-900 dark:text-white">{stats.closedItems}</div>
                <div className="text-[11px] uppercase font-semibold text-green-600 mt-1 flex items-center justify-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-600"></div> Kapalı
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* MONTHLY FLOW */}
        <Card className="lg:col-span-8 shadow-sm">
          <CardHeader>
            <CardTitle>Aylık Karar Akışı</CardTitle>
            <CardDescription>Son 12 ay - Açılan ve Kapanan Kararlar</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[320px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyFlow} margin={{ top: 20, right: 30, left: -20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#64748b' }} />
                  <RechartsTooltip cursor={{ fill: '#f8fafc' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="closed" name="Kapanan Karar" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="open" name="Tamamlanmamış" fill="#3b82f6" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* DISTRIBUTIONS ROW 1 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* STATUS DIST */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Durum Dağılımı</CardTitle>
            <CardDescription>Grafiğe tıklayarak filtreleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center h-[200px]">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.statusDistribution}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70}
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
              <div className="w-1/2 space-y-3">
                {stats.statusDistribution.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded-md" onClick={() => updateParam('status', item.name)}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: STATUS_COLORS[item.name] || COLORS[idx % COLORS.length] }}></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* RISK DIST */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Öncelik Dağılımı</CardTitle>
            <CardDescription>Grafiğe tıklayarak filtreleyin</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center h-[200px]">
              <div className="w-1/2 h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={stats.riskDistribution}
                      cx="50%" cy="50%"
                      innerRadius={50} outerRadius={70}
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
              <div className="w-1/2 space-y-3">
                {stats.riskDistribution.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between cursor-pointer hover:bg-slate-50 p-1 rounded-md" onClick={() => updateParam('risk', item.name)}>
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                      <span className="text-sm font-medium">{item.name}</span>
                    </div>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* OPEN JOB AGE */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Bekleme Süresi</CardTitle>
            <CardDescription>Tespit tarihinden bugüne geçen süre (Açık olanlar)</CardDescription>
          </CardHeader>
          <CardContent className="h-[200px] flex flex-col justify-center">
            <div className="flex gap-2 justify-between">
              {stats.incompleteJobAge.map((bucket: any, idx: number) => (
                <div key={idx} className="flex-1 flex flex-col items-center">
                  <div className={`w-full aspect-square rounded-xl border flex items-center justify-center shadow-sm ${bucket.color} text-xl md:text-2xl font-bold`}>
                    {bucket.value}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-2 font-medium text-center">{bucket.name}</span>
                </div>
              ))}
            </div>
            
            {stats.incompleteJobAge[4].value > 0 && (
              <div className="mt-6 bg-red-50 text-red-700 px-3 py-2 rounded-lg text-xs font-medium flex items-center gap-2 border border-red-100">
                <AlertTriangle className="w-4 h-4" />
                <span className="font-bold">{stats.incompleteJobAge[4].value} tespit</span> 180 günü aştı — öncelikli takip önerilir.
              </div>
            )}
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
          <div className="overflow-x-auto">
            <div 
              className="max-h-[500px] overflow-y-auto" 
              ref={tableScrollRef}
              onScroll={(e) => {
                sessionStorage.setItem('isg_dashboard_table_scroll', e.currentTarget.scrollTop.toString());
              }}
            >
              <Table>
                <TableHeader className="bg-muted/50 sticky top-0 z-10 shadow-sm">
                  <TableRow>
                    <TableHead className="w-[140px]">Tesis</TableHead>
                    <TableHead className="w-[120px]">Tespit Tarihi</TableHead>
                    <TableHead className="w-[120px]">Durum</TableHead>
                    <TableHead className="w-[140px]">Öncelik / Risk</TableHead>
                    <TableHead>Tespit İçeriği</TableHead>
                    <TableHead className="w-[100px] text-right">Aksiyonlar</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {stats.recentItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">Kayıt bulunamadı</TableCell>
                    </TableRow>
                  ) : (
                    stats.recentItems.map((item: any) => {
                      return (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">
                            <Badge variant="secondary" className="bg-blue-50 text-blue-800 hover:bg-blue-100 font-normal">
                              {item.page?.facility?.name || stats.facilityName}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-medium whitespace-nowrap">
                            {format(new Date(item.page.date), 'dd.MM.yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-normal ${
                              item.status === 'Tamamlandı' ? 'border-green-200 bg-green-50 text-green-700' :
                              item.status === 'Devam Ediyor' ? 'border-blue-200 bg-blue-50 text-blue-700' :
                              item.status === 'İptal Edildi' ? 'border-slate-200 bg-slate-50 text-slate-700' :
                              'border-red-200 bg-red-50 text-red-700'
                            }`}>
                              {item.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={`font-normal ${
                              item.riskLevel.includes('Tolere') ? 'border-red-300 bg-red-50 text-red-700' :
                              item.riskLevel.includes('Yüksek') ? 'border-orange-300 bg-orange-50 text-orange-700' :
                              item.riskLevel.includes('Önemli') ? 'border-amber-300 bg-amber-50 text-amber-700' :
                              'border-green-300 bg-green-50 text-green-700'
                            }`}>
                              {item.riskLevel}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="line-clamp-2 text-sm max-w-[500px]" title={item.content}>
                              {item.content}
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">
                              {item.mainCategory?.name} {item.category ? `> ${item.category.name}` : ''}
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="text-xs font-medium"
                              onClick={() => navigate(`/safety-management/isg-defter/items/${item.id}`)}
                            >
                              Detaylar
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
