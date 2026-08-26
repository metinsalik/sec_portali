import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Filter, X, TrendingUp, Building2, AlertTriangle, CheckCircle2, ChevronRight, Activity, Search } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';

export default function ChecklistDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const { user } = useAuth();
  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || 'all');

  React.useEffect(() => {
    const handleFacilityChange = () => setSelectedFacilityId(localStorage.getItem('activeFacilityId') || 'all');
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);
  
  // URL params mapping
  const urlFacilityId = searchParams.get('facilityId') || selectedFacilityId;
  const urlYear = searchParams.get('year') || new Date().getFullYear().toString();
  const urlGroupId = searchParams.get('groupId') || 'all';
  const urlTemplateId = searchParams.get('templateId') || 'all';
  const urlCategoryId = searchParams.get('categoryId') || 'all';

  const updateFilters = (updates: Record<string, string>) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      Object.entries(updates).forEach(([key, value]) => {
        if (value === 'all' || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      return next;
    }, { replace: true });
  };

  // Fetch Dashboard Data
  const { data: dashboardData, isLoading } = useQuery({
    queryKey: ['checklist-dashboard-analytical', urlFacilityId, urlYear, urlGroupId, urlTemplateId, urlCategoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (urlFacilityId !== 'all') params.append('facilityId', urlFacilityId);
      if (urlYear !== 'all') params.append('year', urlYear);
      if (urlGroupId !== 'all') params.append('groupId', urlGroupId);
      if (urlTemplateId !== 'all') params.append('templateId', urlTemplateId);
      if (urlCategoryId !== 'all') params.append('categoryId', urlCategoryId);

      const res = await api.get(`/checklists/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard data');
      return res.json();
    },
    enabled: hasAdminAccess || (!!urlFacilityId && urlFacilityId !== 'all')
  });

  const { data: recentSubmissions = [], isLoading: submissionsLoading } = useQuery({
    queryKey: ['checklist-recent-submissions', urlFacilityId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (urlFacilityId !== 'all') params.append('facilityId', urlFacilityId);
      const res = await api.get(`/checklists/submissions?${params.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch recent submissions');
      return res.json();
    },
    enabled: hasAdminAccess || (!!urlFacilityId && urlFacilityId !== 'all')
  });

  const groups = dashboardData?.groups || [];
  const templates = dashboardData?.templates || [];
  const categories = dashboardData?.categories || [];
  
  const stats = dashboardData?.stats || { 
    avgGroupScore: 0, auditedFacilitiesCount: 0, totalPriorityFindings: 0, closedImprovementRate: 0 
  };
  const facilityScores = dashboardData?.facilityScores || [];
  const statusDistribution = dashboardData?.statusDistribution || [];
  const lifecycleFindings = dashboardData?.lifecycleFindings || [];

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => (current - 3 + i).toString()).sort((a,b) => b.localeCompare(a));
  }, []);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = urlYear !== 'all' || urlGroupId !== 'all' || urlTemplateId !== 'all' || urlCategoryId !== 'all';

  const renderStatusBadge = (status: string) => {
    if (status === 'KARŞILIYOR' || status === 'UYGUN') return <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-200 border-0">✔ UYGUN</Badge>;
    if (status === 'KISMEN' || status === 'KISMEN KARŞILIYOR') return <Badge className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-0">⚠ KISMEN</Badge>;
    if (status === 'KARŞILAMIYOR' || status === 'UYGUN DEĞİL') return <Badge className="bg-red-100 text-red-800 hover:bg-red-200 border-0">! UYGUN DEĞİL</Badge>;
    if (status === 'KAPATILDI') return <Badge className="bg-slate-100 text-slate-800 hover:bg-slate-200 border-0">KAPATILDI</Badge>;
    if (status === 'DEVAM EDİYOR') return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-200 border-0">DEVAM EDİYOR</Badge>;
    return <Badge variant="outline">{status}</Badge>;
  };

  if (!hasAdminAccess && (!selectedFacilityId || selectedFacilityId === 'all')) {
    return (
      <div className="p-6 h-[80vh] flex flex-col items-center justify-center">
        <div className="bg-indigo-50 text-indigo-800 p-8 rounded-2xl max-w-md text-center shadow-sm border border-indigo-100">
          <Activity className="w-16 h-16 mx-auto mb-4 text-indigo-400" />
          <h2 className="text-xl font-bold mb-2">Tesis Seçiniz</h2>
          <p className="text-indigo-700">Kontrol Listeleri ve analizleri görüntülemek için lütfen sol üst menüden bir tesis seçin.</p>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[500px] text-slate-400">
        <Activity className="w-10 h-10 animate-spin mb-4 text-indigo-500" />
        <p>Analitik Veriler Hesaplanıyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* HEADER & FILTERS */}
      <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
               Tesis / Hastane Bazlı Analitik Gösterge Paneli
            </h1>
            <p className="text-sm text-slate-500 mt-1">
              Sistem genelindeki güncel denetim, uyum ve tespit durumları.
            </p>
          </div>
          
          <div className="flex items-center gap-3">
            <Button 
              variant="outline" 
              onClick={() => setShowFilters(!showFilters)}
              className={hasActiveFilters ? "border-indigo-300 bg-indigo-50 text-indigo-700" : ""}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtreler {hasActiveFilters && <span className="ml-2 w-2 h-2 bg-indigo-600 rounded-full inline-block" />}
            </Button>
          </div>
        </div>

        {/* EXPANDABLE FILTER BAR */}
        {showFilters && (
          <div className="pt-4 border-t grid grid-cols-1 md:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-4 duration-200">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Yıl</label>
              <Select value={urlYear} onValueChange={v => updateFilters({ year: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Yıllar">
                    {urlYear === 'all' ? 'Tüm Yıllar' : urlYear}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Yıllar</SelectItem>
                  {years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Denetim Grubu</label>
              <Select value={urlGroupId} onValueChange={v => updateFilters({ groupId: v, templateId: 'all' })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Gruplar">
                    {urlGroupId === 'all' ? 'Tüm Gruplar' : groups.find((g:any) => g.id === urlGroupId)?.name || 'Tüm Gruplar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Gruplar</SelectItem>
                  {groups.map((g:any) => <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Şablon (Kontrol Listesi)</label>
              <Select value={urlTemplateId} onValueChange={v => updateFilters({ templateId: v })} disabled={templates.length === 0}>
                <SelectTrigger>
                  <SelectValue placeholder={templates.length === 0 ? "Önce Grup Seçin" : "Tüm Şablonlar"}>
                    {urlTemplateId === 'all' ? 'Tüm Şablonlar' : templates.find((t:any) => t.id === urlTemplateId)?.title || 'Tüm Şablonlar'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Şablonlar</SelectItem>
                  {templates.map((t:any) => <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-slate-500">Kategori (Soru Bazlı)</label>
              <Select value={urlCategoryId} onValueChange={v => updateFilters({ categoryId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Tüm Kategoriler">
                    {urlCategoryId === 'all' ? 'Tüm Kategoriler' : categories.find((c:any) => c.id === urlCategoryId)?.name || 'Tüm Kategoriler'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map((c:any) => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="md:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-slate-500 hover:text-slate-800">
                  <X className="w-4 h-4 mr-1" /> Filtreleri Temizle
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* KPI ROW */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Grup Başarı Ortalaması</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">
                  %{stats.avgGroupScore.toFixed(1)}
                </h3>
                <p className="text-xs text-emerald-600 mt-2 font-medium flex items-center">
                  Genel Uyum Skoru
                </p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <TrendingUp className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Denetlenen Tesis</p>
                <h3 className="text-3xl font-black text-slate-800 mt-2">
                  {stats.auditedFacilitiesCount}
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Aktif Tesisler
                </p>
              </div>
              <div className="p-3 bg-slate-100 rounded-full">
                <Building2 className="w-5 h-5 text-slate-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Öncelikli Tespitler</p>
                <h3 className="text-3xl font-black text-red-600 mt-2">
                  {stats.totalPriorityFindings}
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Aksiyon bekleyen
                </p>
              </div>
              <div className="p-3 bg-red-50 rounded-full">
                <AlertTriangle className="w-5 h-5 text-red-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide">Kapatılan İyileştirmeler</p>
                <h3 className="text-3xl font-black text-emerald-600 mt-2">
                  %{stats.closedImprovementRate.toFixed(0)}
                </h3>
                <p className="text-xs text-slate-500 mt-2 font-medium">
                  Tarihsel Yaşam Döngüsü Oranı
                </p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-full">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
              </div>
            </div>
          </CardContent>
        </Card>

      </div>

      {/* ANALYSIS CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* BAR CHART: Hastane Bazlı Başarı Oranları */}
        <Card className="lg:col-span-2 shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">Hastane Bazlı Başarı Oranları</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px] pt-4">
            {facilityScores.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilityScores} margin={{ top: 20, right: 30, left: 0, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis 
                    dataKey="name" 
                    tick={{fontSize: 11, fill: '#64748b'}} 
                    angle={-45} 
                    textAnchor="end"
                    interval={0}
                  />
                  <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#64748b'}} />
                  <RechartsTooltip 
                    cursor={{fill: '#f1f5f9'}} 
                    contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} 
                    formatter={(value: number) => [`%${value}`, 'Başarı Oranı']}
                  />
                  <Bar dataKey="score" name="Skor" fill="#1e293b" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-slate-400">Veri bulunamadı.</div>
            )}
          </CardContent>
        </Card>

        {/* PIE CHART: Kriter Durum Dağılımı */}
        <Card className="shadow-sm border-slate-200">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold text-slate-800">Kriter Durum Dağılımı</CardTitle>
          </CardHeader>
          <CardContent className="h-[350px]">
            {statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="45%"
                    innerRadius={80}
                    outerRadius={120}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}} />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{fontSize: '12px'}} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex h-full items-center justify-center text-slate-400">Veri bulunamadı.</div>
            )}
          </CardContent>
        </Card>

      </div>

      {/* FINDINGS LIFECYCLE TABLE */}
      <Card className="shadow-sm border-slate-200">
        <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
          <CardTitle className="text-lg font-bold text-slate-800">Öncelikli Tespitler ve İyileştirme Yaşam Döngüsü</CardTitle>
          <CardDescription>Aynı tesiste, aynı sorulara verilen geçmiş ve güncel yanıtların (iyileştirmelerin) takibi.</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-white border-b shadow-sm">
                <tr>
                  <th className="px-6 py-4 font-semibold w-1/6">Hastane</th>
                  <th className="px-6 py-4 font-semibold w-2/6">Kriter / Tespit</th>
                  <th className="px-6 py-4 font-semibold text-center w-32">İlk Durum</th>
                  <th className="px-6 py-4 font-semibold text-center w-32">İyileştirme Sonrası</th>
                  <th className="px-6 py-4 font-semibold text-center w-32">Güncel Durum</th>
                  <th className="px-6 py-4 font-semibold text-center w-24">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {lifecycleFindings.length > 0 ? lifecycleFindings.map((item: any, idx: number) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-semibold text-slate-800">{item.facilityName}</div>
                      <div className="text-[10px] text-slate-400 mt-1">{item.templateName}</div>
                    </td>
                    <td className="px-6 py-5">
                      <div className="text-slate-700 font-medium leading-relaxed">{item.questionText}</div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {renderStatusBadge(item.initialStatus)}
                        <span className="text-[10px] text-slate-400">{format(new Date(item.initialDate), 'dd MMM yy', { locale: tr })}</span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      <div className="flex flex-col items-center gap-1">
                        {item.latestDate !== item.initialDate ? (
                          <>
                            {renderStatusBadge(item.latestStatus)}
                            <span className="text-[10px] text-slate-400">{format(new Date(item.latestDate), 'dd MMM yy', { locale: tr })}</span>
                          </>
                        ) : (
                          <span className="text-xs text-slate-300 italic">- Henüz tekrar denetlenmedi -</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-5 text-center">
                      {renderStatusBadge(item.currentStatus)}
                    </td>
                    <td className="px-6 py-5 text-center">
                      <Button variant="ghost" size="sm" className="text-slate-500 hover:text-indigo-600">
                        İncele <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-500">
                      Seçili filtrelerde yaşam döngüsü takip edilebilir tespit bulunamadı.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* SON DENETIMLER TABLOSU */}
      <Card className="shadow-sm border-slate-200 mt-8">
        <CardHeader className="pb-2 border-b border-slate-100 flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-base font-bold text-slate-800">Tesisin Tüm Kontrol Listeleri</CardTitle>
            <p className="text-xs text-muted-foreground">Son yapılan denetimden geriye doğru sıralama</p>
          </div>
          <Button variant="ghost" size="sm" className="text-indigo-600 text-xs font-semibold gap-1 hover:bg-indigo-50" onClick={() => navigate('/checklists/submissions')}>
            Tüm Denetimler <ChevronRight className="w-3 h-3" />
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
            {submissionsLoading ? (
              <div className="p-4 space-y-3"><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /><Skeleton className="h-10 w-full" /></div>
            ) : recentSubmissions.length > 0 ? (
              <table className="w-full text-sm text-left">
                <thead className="text-[11px] text-slate-500 bg-slate-50 uppercase font-semibold sticky top-0 z-10 shadow-sm">
                  <tr>
                    <th className="px-5 py-3">Tarih</th>
                    <th className="px-5 py-3">Şablon & Tesis</th>
                    <th className="px-5 py-3">Denetçi</th>
                    <th className="px-5 py-3 text-center">Skor</th>
                    <th className="px-5 py-3 text-right">Durum</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {recentSubmissions.map((s: any) => (
                    <tr key={s.id} className="hover:bg-slate-50/70 transition-colors cursor-pointer group" onClick={() => navigate(`/checklists/submissions/${s.id}`)}>
                      <td className="px-5 py-4 whitespace-nowrap align-middle">
                        <div className="flex items-center gap-1.5 text-slate-600">
                           <Calendar className="w-3.5 h-3.5" />
                           <span className="font-medium text-[13px]">{format(new Date(s.auditDate), 'dd MMM yyyy', { locale: tr })}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 align-middle">
                        <div className="font-bold text-slate-800 group-hover:text-indigo-700 transition-colors">{s.template?.title}</div>
                        <div className="text-xs text-slate-500">{s.facility?.name}</div>
                      </td>
                      <td className="px-5 py-4 align-middle whitespace-nowrap">
                        <div className="flex items-center gap-2">
                           <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                              {s.conductedBy?.fullName?.charAt(0) || 'U'}
                           </div>
                           <span className="text-slate-700 text-[13px]">{s.conductedBy?.fullName || 'Bilinmiyor'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center align-middle whitespace-nowrap">
                         <div className="flex flex-col items-center">
                            <span className="font-bold text-slate-800">
                               {s.totalScore !== null && s.totalScore !== undefined ? s.totalScore : '-'}<span className="text-[10px] text-slate-400 font-normal"> / {s.maxScore || '-'}</span>
                            </span>
                            <span className={`text-[10px] font-bold ${
                               (s.percentScore || 0) >= 80 ? 'text-emerald-600' :
                               (s.percentScore || 0) >= 60 ? 'text-amber-600' : 'text-red-600'
                            }`}>
                               %{Math.round(s.percentScore || 0)}
                            </span>
                         </div>
                      </td>
                      <td className="px-5 py-4 text-right align-middle whitespace-nowrap">
                         <Badge variant="outline" className={`rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            s.status === 'TAMAMLANDI' || s.status === 'ONAYLANDI' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                            s.status === 'ONAY_BEKLIYOR' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                            'bg-slate-50 text-slate-700 border-slate-200'
                         }`}>
                           {s.status === 'TAMAMLANDI' || s.status === 'ONAYLANDI' ? 'Onaylandı' :
                            s.status === 'ONAY_BEKLIYOR' ? 'Onay Bekliyor' : 'Taslak'}
                         </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="p-10 text-center text-muted-foreground flex flex-col items-center justify-center">
                <CheckCircle2 className="w-12 h-12 mb-4 text-slate-300" />
                <p>Bu tesise ait hiçbir kontrol listesi (denetim) bulunmuyor.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

    </div>
  );
}
