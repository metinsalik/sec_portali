import React, { useEffect, useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, AlertTriangle, FileText, CheckCircle, TrendingUp, Filter, BarChart3, Clock, X, Search, ShieldAlert, BadgeInfo } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const COLORS = ['#ef4444', '#f97316', '#eab308', '#3b82f6', '#8b5cf6', '#64748b', '#10b981'];

export default function ChecklistDashboardPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  
  // URL params mapping
  const urlFacilityId = searchParams.get('facilityId') || localStorage.getItem('activeFacilityId') || 'all';
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
    }
  });

  const groups = dashboardData?.groups || [];
  const templates = dashboardData?.templates || [];
  const categories = dashboardData?.categories || [];
  const stats = dashboardData?.stats || { total: 0, completed: 0, draft: 0, avgScore: 0, totalFindings: 0 };
  const trendData = dashboardData?.trendData || [];
  const categoryAnalysis = dashboardData?.categoryAnalysis || [];
  const itemAnalysis = dashboardData?.itemAnalysis || [];
  const recentFindings = dashboardData?.recentFindings || [];

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => (current - 3 + i).toString()).sort((a,b) => b.localeCompare(a));
  }, []);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters = urlYear !== 'all' || urlGroupId !== 'all' || urlTemplateId !== 'all' || urlCategoryId !== 'all';

  if (isLoading) {
    return <div className="flex h-[400px] items-center justify-center">Yükleniyor...</div>;
  }

  return (
    <div className="space-y-6 max-w-[1600px] mx-auto pb-10">
      
      {/* HEADER & FILTERS */}
      <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-800 flex items-center gap-2">
              <BarChart3 className="w-6 h-6 text-indigo-600" /> Analitik Gösterge Paneli
            </h1>
            <p className="text-sm text-slate-500 mt-1">Saha denetimlerinden gelen bulguların ve sistem açıklarının detaylı analizi.</p>
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-white border-red-200">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-red-700">Toplam Uygunsuzluk (Bulgu)</CardTitle>
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-red-600">{stats.totalFindings}</div>
            <p className="text-xs text-red-500 mt-1">Giderilmesi gereken açık ihlaller</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Ortalama Denetim Skoru</CardTitle>
            <TrendingUp className="w-5 h-5 text-indigo-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">%{stats.avgScore.toFixed(1)}</div>
            <p className="text-xs text-slate-500 mt-1">Tamamlanan {stats.completed} denetimde</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Devam Eden / Bekleyen</CardTitle>
            <Clock className="w-5 h-5 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{stats.draft}</div>
            <p className="text-xs text-slate-500 mt-1">Taslak veya işlem bekleyen form</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-slate-50 to-white">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-600">Toplam Form Sayısı</CardTitle>
            <FileText className="w-5 h-5 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-black text-slate-800">{stats.total}</div>
            <p className="text-xs text-slate-500 mt-1">Sistemdeki toplam denetim</p>
          </CardContent>
        </Card>
      </div>

      {/* ANALYSIS CHARTS ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <PieChart className="w-5 h-5 text-slate-600" /> Kategori Bazlı Hata Dağılımı
            </CardTitle>
            <CardDescription>
              Denetimlerde en çok hangi kategorilerde kural ihlali yapılıyor?
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {categoryAnalysis.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={categoryAnalysis} layout="vertical" margin={{ top: 5, right: 30, left: 80, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e2e8f0" />
                  <XAxis type="number" tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis dataKey="name" type="category" tick={{fontSize: 11, fill: '#475569'}} width={100} />
                  <RechartsTooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                  <Bar dataKey="findings" name="Uygunsuzluk Sayısı" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={20}>
                    {categoryAnalysis.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex flex-col h-full items-center justify-center text-slate-400">
                 <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                 <p className="text-sm">Analiz edilecek hata verisi bulunamadı.</p>
               </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm border-slate-200">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-slate-600" /> Genel Başarı Trendi
            </CardTitle>
            <CardDescription>
              Zaman içindeki denetim başarı skorlarının (yüzde) değişimi.
            </CardDescription>
          </CardHeader>
          <CardContent className="h-[320px]">
            {trendData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{fontSize: 12, fill: '#64748b'}} />
                  <YAxis domain={[0, 100]} tick={{fontSize: 12, fill: '#64748b'}} />
                  <RechartsTooltip contentStyle={{borderRadius: '8px', border: '1px solid #e2e8f0'}} />
                  <Line type="monotone" dataKey="score" stroke="#3b82f6" strokeWidth={3} name="Skor (%)" dot={{r: 4, fill: '#3b82f6', strokeWidth: 0}} activeDot={{r: 6}} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
               <div className="flex flex-col h-full items-center justify-center text-slate-400">
                 <AlertCircle className="w-10 h-10 mb-2 opacity-50" />
                 <p className="text-sm">Yeterli trend verisi bulunamadı.</p>
               </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* FINDINGS TABLES ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* En Çok İhlal Edilen Kurallar */}
        <Card className="shadow-sm border-red-200">
          <CardHeader className="bg-red-50/50 border-b border-red-100">
            <CardTitle className="text-base flex items-center gap-2 text-red-700">
              <AlertTriangle className="w-5 h-5 text-red-500" /> Kural Bazlı Hata Analizi (Top İhlaller)
            </CardTitle>
            <CardDescription>
              Sistemde en çok "Uygun Değil / Riskli" cevabı alan spesifik denetim soruları.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 bg-slate-50 sticky top-0 border-b shadow-sm">
                  <tr>
                    <th className="px-4 py-3 font-semibold">Soru / Kural</th>
                    <th className="px-4 py-3 font-semibold text-center w-24">Kategori</th>
                    <th className="px-4 py-3 font-semibold text-center w-24">İhlal Sayısı</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {itemAnalysis.length > 0 ? itemAnalysis.map((item: any, idx: number) => (
                    <tr key={item.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-700">
                        <div className="font-medium">{item.text}</div>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <Badge variant="outline" className="text-[10px] whitespace-nowrap bg-white text-slate-600">
                          {item.categoryName}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center">
                        <div className="flex flex-col items-center">
                          <span className="font-bold text-red-600 text-lg">{item.negative}</span>
                          <span className="text-[10px] text-slate-400">{item.total} denetimde</span>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan={3} className="px-4 py-8 text-center text-slate-500">
                        Seçili filtrelerde ihlal edilen kural bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        {/* Son Tespit Edilen Uygunsuzluklar */}
        <Card className="shadow-sm border-amber-200">
          <CardHeader className="bg-amber-50/50 border-b border-amber-100">
            <CardTitle className="text-base flex items-center gap-2 text-amber-800">
              <BadgeInfo className="w-5 h-5 text-amber-500" /> Sahadan Son Uygunsuzluklar
            </CardTitle>
            <CardDescription>
              Tamamlanan son denetimlerde tespit edilen uygunsuz durumların canlı listesi.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[400px] overflow-y-auto">
              <div className="divide-y">
                {recentFindings.length > 0 ? recentFindings.map((finding: any, idx: number) => (
                  <div key={idx} className="p-4 hover:bg-slate-50 transition-colors">
                    <div className="flex justify-between items-start mb-2">
                      <Badge variant="secondary" className="bg-red-100 text-red-700 hover:bg-red-200 text-[10px]">
                        {finding.answerLabel}
                      </Badge>
                      <span className="text-xs font-medium text-slate-500">
                        {format(new Date(finding.date), 'dd MMM yyyy', { locale: tr })}
                      </span>
                    </div>
                    <p className="text-sm font-semibold text-slate-800 mb-2 leading-tight">
                      {finding.questionText}
                    </p>
                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1 font-medium bg-slate-100 px-2 py-1 rounded">
                        {finding.facilityName}
                      </span>
                      <span className="flex items-center gap-1 truncate max-w-[150px]">
                        • {finding.templateName}
                      </span>
                    </div>
                  </div>
                )) : (
                  <div className="p-8 text-center text-slate-500">
                    Seçili filtrelerde tespit edilen yeni uygunsuzluk bulunamadı.
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
