import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Plus, Eye, DoorClosed, AlertTriangle, PieChart as PieChartIcon, Activity, Filter, ShieldAlert } from 'lucide-react';
import { Button } from '../../../components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../../components/ui/table';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../../../components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../components/ui/select';
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from '../../../components/ui/accordion';

const COLORS = {
    'A': '#10b981', // emerald-500
    'B': '#3b82f6', // blue-500
    'C': '#eab308', // yellow-500
    'D': '#f97316', // orange-500
    'E': '#ef4444', // red-500
    'F': '#e11d48', // rose-600
};

export default function FireDoorsList() {
  const currentFacilityId = localStorage.getItem('activeFacilityId') || '';
  const navigate = useNavigate();
  const { user } = useAuth();

  const [searchParams, setSearchParams] = useSearchParams();
  const filters = Object.fromEntries(searchParams.entries());

  const { data: propertiesData } = useQuery({
    queryKey: ['fireDoorProperties'],
    queryFn: async () => {
      const res = await api.get('/safety-management/fire-doors/settings/properties');
      return res.json();
    },
  });

  const { data: facilities } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    },
    enabled: !!user?.isAdmin,
  });

  // Calculate the active facility ID to query
  const activeFacilityId = user?.isAdmin 
      ? (filters['facilityId'] && filters['facilityId'] !== 'Tümü' ? filters['facilityId'] : 'all') 
      : currentFacilityId;

  const isAllFacilities = user?.isAdmin && activeFacilityId === 'all';

  // Convert filters to JSON string for the query params
  const filtersJson = JSON.stringify(filters);

  const { data: doors, isLoading: doorsLoading } = useQuery({
    queryKey: ['fireDoors', activeFacilityId, filtersJson],
    queryFn: async () => {
      if (!user?.isAdmin && (!activeFacilityId || activeFacilityId === 'all')) return [];
      const res = await api.get(`/safety-management/fire-doors/doors?facilityId=${activeFacilityId}&filters=${encodeURIComponent(filtersJson)}`);
      return res.json();
    },
    enabled: user?.isAdmin || (!!activeFacilityId && activeFacilityId !== 'all'),
  });

  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: ['fireDoorsAnalytics', activeFacilityId, filtersJson],
    queryFn: async () => {
      if (!user?.isAdmin && (!activeFacilityId || activeFacilityId === 'all')) return null;
      const res = await api.get(`/safety-management/fire-doors/analytics?facilityId=${activeFacilityId}&filters=${encodeURIComponent(filtersJson)}`);
      return res.json();
    },
    enabled: user?.isAdmin || (!!activeFacilityId && activeFacilityId !== 'all'),
  });

  // Extract unique locations from current doors for cascading location filters
  const binalar = Array.from(new Set(doors?.map((d: any) => d.properties?.Bina).filter(Boolean))) as string[];
  const katlar = Array.from(new Set(doors?.map((d: any) => d.properties?.Kat).filter(Boolean))) as string[];
  const departmanlar = Array.from(new Set(doors?.map((d: any) => d.properties?.Departman).filter(Boolean))) as string[];

  const handleFilterChange = (key: string, value: string) => {
      const newParams = new URLSearchParams(searchParams);
      if (value === 'Tümü' || !value) {
          newParams.delete(key);
      } else {
          newParams.set(key, value);
      }
      setSearchParams(newParams);
  };

  const clearFilters = () => {
      setSearchParams(new URLSearchParams());
  };

  if (!user?.isAdmin && (!currentFacilityId || currentFacilityId === 'all')) {
    return <div className="p-6 text-slate-500">Lütfen sol menüden bir tesis seçiniz.</div>;
  }

  const activeFiltersCount = Array.from(searchParams.keys()).length;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 p-6">
      <div className="container mx-auto space-y-8 max-w-7xl">
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl border border-slate-200/60 dark:border-slate-800/60 p-5 rounded-2xl shadow-sm">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
              Yangın Kapıları Analiz Panosu
            </h1>
            <p className="text-slate-500 dark:text-slate-400 mt-1 text-base">
              Seçili tesis için kapı performansı, risk analizleri ve denetim istatistikleri.
            </p>
          </div>
          <div className="flex gap-3">
              {user?.isAdmin && (
                  <Button 
                    variant="outline" 
                    onClick={() => navigate('/safety-management/fire-doors/settings')}
                    className="h-10 px-5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all border-slate-200 dark:border-slate-700 shadow-sm"
                  >
                      Ayarlar
                  </Button>
              )}
              <Button 
                onClick={() => navigate('/safety-management/fire-doors/new')}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 active:translate-y-0"
              >
                <Plus className="mr-2 h-4 w-4" /> Yeni Kapı Ekle
              </Button>
          </div>
        </div>

        {/* Filters Section (Accordion for cleaner UI) */}
        <Card className="border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm overflow-hidden rounded-2xl">
            <Accordion type="single" collapsible defaultValue="filters" className="w-full">
                <AccordionItem value="filters" className="border-none">
                    <AccordionTrigger className="px-6 py-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 hover:no-underline transition-colors data-[state=open]:border-b border-slate-100 dark:border-slate-800">
                        <div className="flex items-center gap-3 w-full">
                            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">
                                <Filter className="w-5 h-5" />
                            </div>
                            <div className="flex flex-col items-start">
                                <span className="font-bold text-slate-800 dark:text-slate-200">Gelişmiş Filtreler</span>
                                <span className="text-xs text-slate-500 font-normal">
                                    {activeFiltersCount > 0 
                                        ? `${activeFiltersCount} aktif filtre uygulandı` 
                                        : 'Kapıları tesise, nota, lokasyona veya özelliklere göre süzün'}
                                </span>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-6 bg-slate-50/50 dark:bg-slate-950/20">
                        <div className="flex justify-end mb-4">
                            {activeFiltersCount > 0 && (
                                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs h-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950 rounded-lg">
                                    Filtreleri Temizle
                                </Button>
                            )}
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            {/* Admin Facility Filter */}
                            {user?.isAdmin && (
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Tesis</label>
                                    <Select value={filters['facilityId'] || 'Tümü'} onValueChange={(v) => handleFilterChange('facilityId', v)}>
                                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 h-10 text-xs rounded-xl shadow-sm">
                                            <SelectValue placeholder="Tesis Seçin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Tümü">Tüm Tesisler</SelectItem>
                                            {facilities?.map((f: any) => (
                                                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}

                            {/* Grade Filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Not Filtresi</label>
                                <Select value={filters['grade'] || 'Tümü'} onValueChange={(v) => handleFilterChange('grade', v)}>
                                    <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 h-10 text-xs rounded-xl shadow-sm">
                                        <SelectValue placeholder="Not Filtresi" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="Tümü">Tüm Notlar</SelectItem>
                                        <SelectItem value="A">A - Çok İyi</SelectItem>
                                        <SelectItem value="B">B - İyi</SelectItem>
                                        <SelectItem value="C">C - Orta</SelectItem>
                                        <SelectItem value="D">D - Zayıf</SelectItem>
                                        <SelectItem value="F">F - Kritik</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Location Filters (Hidden if All Facilities selected by Admin) */}
                            {!isAllFacilities && (
                                <>
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Bina</label>
                                        <Select value={filters['Bina'] || 'Tümü'} onValueChange={(v) => handleFilterChange('Bina', v)}>
                                            <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 h-10 text-xs rounded-xl shadow-sm">
                                                <SelectValue placeholder="Bina" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Tümü">Tüm Binalar</SelectItem>
                                                {binalar.map(b => <SelectItem key={b} value={b}>{b}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Kat</label>
                                        <Select value={filters['Kat'] || 'Tümü'} onValueChange={(v) => handleFilterChange('Kat', v)}>
                                            <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 h-10 text-xs rounded-xl shadow-sm">
                                                <SelectValue placeholder="Kat" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Tümü">Tüm Katlar</SelectItem>
                                                {katlar.map(k => <SelectItem key={k} value={k}>{k}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1">Departman</label>
                                        <Select value={filters['Departman'] || 'Tümü'} onValueChange={(v) => handleFilterChange('Departman', v)}>
                                            <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 h-10 text-xs rounded-xl shadow-sm">
                                                <SelectValue placeholder="Departman" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Tümü">Tüm Departmanlar</SelectItem>
                                                {departmanlar.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </>
                            )}

                            {/* Dynamic Property Filters */}
                            {propertiesData?.filter((p: any) => p.options && p.options.length > 0).map((prop: any) => (
                                <div key={prop.name} className="flex flex-col gap-1.5">
                                    <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider pl-1 line-clamp-1" title={prop.name}>{prop.name}</label>
                                    <Select value={filters[prop.name] || 'Tümü'} onValueChange={(v) => handleFilterChange(prop.name, v)}>
                                        <SelectTrigger className="bg-white dark:bg-slate-950 border-slate-200 dark:border-slate-700 h-10 text-xs rounded-xl shadow-sm">
                                            <SelectValue placeholder={prop.name} />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Tümü">Tüm {prop.name}</SelectItem>
                                            {prop.options.map((opt: string) => (
                                                <SelectItem key={opt} value={opt}>{opt}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>

        {/* Dashboard Top Widgets */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Total Doors Widget */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <DoorClosed className="w-24 h-24 text-primary" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-primary/10 text-primary">
                  <DoorClosed className="h-5 w-5" />
                </div>
                <h3 className="tracking-tight text-sm font-semibold text-slate-700 dark:text-slate-300">Toplam Kapı</h3>
              </div>
              <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-slate-900 to-slate-500 dark:from-white dark:to-slate-400">
                {analyticsLoading ? '-' : analytics?.totalDoors || 0}
              </div>
            </div>
          </div>
          
          {/* Average Score Widget */}
          <div className="group relative overflow-hidden rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-110 group-hover:-rotate-12 transition-all duration-500">
              <AlertTriangle className="w-24 h-24 text-amber-500" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="tracking-tight text-sm font-semibold text-slate-700 dark:text-slate-300">Ortalama Puan</h3>
              </div>
              <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-amber-600 to-amber-400">
                {analyticsLoading ? '-' : (analytics?.averageScore || 0).toFixed(2)}
              </div>
            </div>
          </div>

          {/* Critical Risk Widget */}
          <div className="group relative overflow-hidden rounded-2xl border border-rose-200/60 dark:border-rose-900/60 bg-rose-50/60 dark:bg-rose-950/30 backdrop-blur-xl p-6 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className="absolute top-0 right-0 p-6 opacity-10 transform group-hover:scale-110 group-hover:rotate-12 transition-all duration-500">
              <ShieldAlert className="w-24 h-24 text-rose-600" />
            </div>
            <div className="relative z-10 flex flex-col justify-between h-full">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 rounded-xl bg-rose-500/10 text-rose-600">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="tracking-tight text-sm font-bold text-rose-700 dark:text-rose-400">Kritik Riskli Kapılar</h3>
                  <p className="text-[10px] text-rose-600/70 dark:text-rose-400/70 leading-tight mt-0.5">Menteşe veya Kapanma arızalı</p>
                </div>
              </div>
              <div className="text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br from-rose-700 to-rose-500 dark:from-rose-400 dark:to-rose-300">
                {analyticsLoading ? '-' : analytics?.criticalRiskCount || 0}
              </div>
            </div>
          </div>
        </div>

        {/* Dashboard Side-by-side Charts */}
        <div className="grid gap-6 md:grid-cols-2">
          {/* Grade Distribution */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-500">
                  <PieChartIcon className="h-5 w-5" />
                </div>
                <h3 className="tracking-tight text-base font-semibold text-slate-700 dark:text-slate-300">Not Dağılımı</h3>
            </div>
            <div className="flex-1 min-h-[260px] flex items-center justify-center">
              {analyticsLoading ? (
                <div className="text-sm text-slate-400">Yükleniyor...</div>
              ) : analytics?.gradeDistribution && analytics.gradeDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={analytics.gradeDistribution}
                      dataKey="count"
                      nameKey="grade"
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={5}
                    >
                      {analytics.gradeDistribution.map((entry: any, index: number) => (
                        <Cell key={`cell-${index}`} fill={(COLORS as any)[entry.grade] || '#94a3b8'} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-400">Yeterli veri yok</div>
              )}
            </div>
          </div>

          {/* Category Health (Radar Chart) */}
          <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl p-6 shadow-sm flex flex-col">
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-500">
                  <Activity className="h-5 w-5" />
                </div>
                <h3 className="tracking-tight text-base font-semibold text-slate-700 dark:text-slate-300">Kategori Sağlık Durumu (%)</h3>
            </div>
            <div className="flex-1 min-h-[260px] flex items-center justify-center">
              {analyticsLoading ? (
                <div className="text-sm text-slate-400">Yükleniyor...</div>
              ) : analytics?.categoryHealth && analytics.categoryHealth.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="70%" data={analytics.categoryHealth}>
                        <PolarGrid stroke="#e2e8f0" />
                        <PolarAngleAxis dataKey="subject" tick={{ fill: '#64748b', fontSize: 11 }} />
                        <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
                        <Radar name="Başarı Oranı" dataKey="A" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                        <Tooltip 
                            contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        />
                    </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-sm text-slate-400">Yeterli veri yok</div>
              )}
            </div>
          </div>
        </div>

        {/* Top Failed Questions - Horizontal Full Width */}
        <Card className="rounded-2xl border-slate-200/60 dark:border-slate-800/60 bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-sm">
            <CardHeader className="border-b border-slate-100 dark:border-slate-800 pb-4">
                <CardTitle className="text-lg flex items-center gap-2 text-slate-800 dark:text-slate-200">
                    <AlertTriangle className="h-5 w-5 text-rose-500" /> En Sık Tekrarlanan Hatalar (Karşılamıyor)
                </CardTitle>
                <CardDescription>Filtrelenen kapılarda en çok kalınan denetim soruları ve hata sayıları</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
                <div className="h-[300px] w-full">
                    {analyticsLoading ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">Yükleniyor...</div>
                    ) : analytics?.topFailedQuestions && analytics.topFailedQuestions.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={analytics.topFailedQuestions} layout="vertical" margin={{ top: 0, right: 30, left: 180, bottom: 0 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                                <XAxis type="number" allowDecimals={false} hide />
                                <YAxis dataKey="question" type="category" width={175} tick={{fontSize: 12, fill: '#64748b'}} />
                                <Tooltip 
                                    cursor={{fill: 'transparent'}}
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                />
                                <Bar dataKey="count" fill="#f43f5e" radius={[0, 4, 4, 0]} barSize={24} name="Hata Sayısı" />
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex items-center justify-center text-slate-400 text-sm">Henüz hatalı soru bulunmuyor veya yeterli veri yok.</div>
                    )}
                </div>
            </CardContent>
        </Card>

        {/* Table Section */}
        <div className="rounded-2xl border border-slate-200/60 dark:border-slate-800/60 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl shadow-sm overflow-hidden mt-8">
          <Table>
            <TableHeader className="bg-slate-50/50 dark:bg-slate-800/50">
              <TableRow className="hover:bg-transparent">
                <TableHead className="py-4 font-semibold text-slate-600 text-sm">Kapı No</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600 text-sm">Lokasyon</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600 text-sm">Son Denetim Notu</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600 text-sm">Durum</TableHead>
                <TableHead className="py-4 font-semibold text-slate-600 text-sm text-right pr-6">İşlemler</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {doorsLoading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                      Veriler yükleniyor...
                    </div>
                  </TableCell>
                </TableRow>
              ) : doors?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-12 text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <DoorClosed className="w-12 h-12 text-slate-300" />
                      <p>Kriterlere uyan kapı bulunamadı.</p>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                doors?.map((door: any) => (
                  <TableRow key={door.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/80 transition-colors group">
                    <TableCell className="font-bold text-slate-700 dark:text-slate-200 py-3 text-sm">
                      {door.doorNo || '-'}
                    </TableCell>
                    <TableCell className="py-3 text-slate-600 dark:text-slate-400 text-sm">
                      <div className="flex items-center gap-2">
                        {isAllFacilities && door.facility && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 uppercase tracking-wider whitespace-nowrap">
                             {door.facility.shortName || door.facility.name}
                          </span>
                        )}
                        <span>
                          {door.properties?.Bina ? `${door.properties.Bina || ''} > ${door.properties.Kat || ''} > ${door.properties.Departman || ''} > ${door.properties.Mahal || ''}` : '-'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-3">
                      {door.lastGrade ? (
                          <div className={`inline-flex items-center justify-center px-2.5 py-0.5 rounded-full text-xs font-bold shadow-sm
                            ${door.lastGrade === 'A' ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 
                              door.lastGrade === 'F' ? 'bg-rose-100 text-rose-700 border border-rose-200' : 
                              'bg-amber-100 text-amber-700 border border-amber-200'}`}>
                              <span className="text-sm mr-1">{door.lastGrade}</span>
                              <span className="opacity-75 text-[10px] font-semibold">({door.lastScore})</span>
                          </div>
                      ) : (
                          <span className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500 text-xs font-medium border border-slate-200">
                            Denetim Yok
                          </span>
                      )}
                    </TableCell>
                    <TableCell className="py-3">
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100 text-xs font-semibold">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                        {door.status}
                      </span>
                    </TableCell>
                    <TableCell className="py-3 text-right pr-6">
                      <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => navigate(`/safety-management/fire-doors/${door.id}`)}
                          className="opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 hover:bg-slate-200 text-slate-700 h-8 text-xs px-3"
                      >
                        <Eye className="h-3.5 w-3.5 mr-1.5" /> Detay
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
}
