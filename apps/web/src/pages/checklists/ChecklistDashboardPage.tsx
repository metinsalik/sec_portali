import React, { useState, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import * as XLSX from 'xlsx';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Filter,
  X,
  TrendingUp,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  Activity,
  Download,
  ClipboardCheck,
  Clock,
  FileSpreadsheet,
  ExternalLink,
} from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  BarChart,
  Bar,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { useAuth } from '@/context/AuthContext';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

const getFullUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const base = API.replace('/api', '');
  return path.startsWith('/') ? `${base}${path}` : `${base}/${path}`;
};

export default function ChecklistDashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [showFilters, setShowFilters] = useState(false);
  const [selectedFinding, setSelectedFinding] = useState<any>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<any>(null);
  const urlTab = searchParams.get('tab');
  const activeTab: 'consolidated' | 'analytics' =
    urlTab === 'analytics' ? 'analytics' : 'consolidated';
  const setActiveTab = (tab: 'consolidated' | 'analytics') => {
    updateFilters({ tab });
  };
  const { user } = useAuth();
  const hasAdminAccess =
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management');

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(
    localStorage.getItem('activeFacilityId') || 'all'
  );

  React.useEffect(() => {
    const handleFacilityChange = () =>
      setSelectedFacilityId(localStorage.getItem('activeFacilityId') || 'all');
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const cleanParam = (val: string | null, fallback: string) =>
    !val || val === 'null' || val === 'undefined' ? fallback : val;

  const urlFacilityId = cleanParam(searchParams.get('facilityId'), selectedFacilityId);
  const urlYear = cleanParam(searchParams.get('year'), new Date().getFullYear().toString());
  const urlGroupId = cleanParam(searchParams.get('groupId'), 'all');
  const urlTemplateId = cleanParam(searchParams.get('templateId'), 'all');
  const urlCategoryId = cleanParam(searchParams.get('categoryId'), 'all');

  const updateFilters = (updates: Record<string, string | null | undefined>) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(updates).forEach(([key, value]) => {
          if (!value || value === 'all' || value === 'null' || value === 'undefined') {
            next.delete(key);
          } else {
            next.set(key, value);
          }
        });
        return next;
      },
      { replace: true }
    );
  };

  // 1. Konsolide Şablon x Tesis Sonuçları
  const { data: consolidatedData, isLoading: consolidatedLoading } = useQuery({
    queryKey: ['checklist-consolidated', urlTemplateId, urlYear, urlGroupId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (urlTemplateId && urlTemplateId !== 'all') params.append('templateId', urlTemplateId);
      if (urlYear && urlYear !== 'all') params.append('year', urlYear);
      if (urlGroupId && urlGroupId !== 'all') params.append('groupId', urlGroupId);
      const res = await api.get(`/checklists/dashboard/consolidated?${params.toString()}`);
      if (!res.ok) throw new Error('Konsolide veriler alınamadı');
      return res.json();
    },
  });

  // 2. Genel Analitik & Yaşam Döngüsü
  const { data: dashboardData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['checklist-dashboard-analytical', urlFacilityId, urlYear, urlGroupId, urlTemplateId, urlCategoryId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (urlFacilityId !== 'all') params.append('facilityId', urlFacilityId);
      if (urlYear !== 'all') params.append('year', urlYear);
      if (urlGroupId !== 'all') params.append('groupId', urlGroupId);
      if (urlTemplateId !== 'all') params.append('templateId', urlTemplateId);
      if (urlCategoryId !== 'all') params.append('categoryId', urlCategoryId);

      const res = await api.get(`/checklists/dashboard?${params.toString()}`);
      if (!res.ok) throw new Error('Analitik veriler alınamadı');
      return res.json();
    },
    enabled: hasAdminAccess || (!!urlFacilityId && urlFacilityId !== 'all'),
  });

  const groups = dashboardData?.groups || [];
  const templates = dashboardData?.templates || [];
  const categories = dashboardData?.categories || [];

  const stats = dashboardData?.stats || {
    avgGroupScore: 0,
    auditedFacilitiesCount: 0,
    totalPriorityFindings: 0,
    closedImprovementRate: 0,
  };
  const facilityScores = dashboardData?.facilityScores || [];
  const statusDistribution = dashboardData?.statusDistribution || [];
  const lifecycleFindings = dashboardData?.lifecycleFindings || [];

  const years = useMemo(() => {
    const current = new Date().getFullYear();
    return Array.from({ length: 6 }, (_, i) => (current - 3 + i).toString()).sort((a, b) =>
      b.localeCompare(a)
    );
  }, []);

  const clearFilters = () => {
    setSearchParams(new URLSearchParams());
  };

  const hasActiveFilters =
    urlYear !== 'all' || urlGroupId !== 'all' || urlTemplateId !== 'all' || urlCategoryId !== 'all';

  const handleExportConsolidatedExcel = () => {
    if (!consolidatedData?.summary) return;
    const wb = XLSX.utils.book_new();

    const facilityRows = (consolidatedData.facilityMatrix || []).map((f: any) => ({
      Tesis: f.facilityName,
      Durum: f.status,
      'Başarı (%)': f.percentScore != null ? Number(f.percentScore.toFixed(1)) : '-',
      'Denetim Tarihi': f.auditDate ? format(new Date(f.auditDate), 'dd.MM.yyyy') : '-',
      Denetçi: f.conductedBy || '-',
    }));
    const ws1 = XLSX.utils.json_to_sheet(facilityRows);
    XLSX.utils.book_append_sheet(wb, ws1, 'Tesis Durumu');

    const questionRows = (consolidatedData.questionSummary || []).map((q: any) => ({
      No: q.itemNo,
      Bölüm: q.sectionTitle,
      Soru: q.questionText,
      Karşılıyor: q.compliantCount,
      Kısmen: q.partialCount,
      Karşılamıyor: q.nonCompliantCount,
      'Kapsam Dışı': q.naCount,
      'Uyum (%)': q.complianceRate != null ? q.complianceRate : '-',
      'Uygun Olmayan Tesisler': (q.nonCompliantFacilities || []).join(', '),
    }));
    const ws2 = XLSX.utils.json_to_sheet(questionRows);
    XLSX.utils.book_append_sheet(wb, ws2, 'Soru Analizi');

    const safeTitle = (consolidatedData.summary.templateTitle || 'kontrol-listesi')
      .replace(/[^\w\u00C0-\u024F-]+/g, '_')
      .slice(0, 40);
    XLSX.writeFile(wb, `${safeTitle}_konsolide.xlsx`);
    toast.success('Konsolide Excel raporu indirildi.');
  };

  const renderStatusBadge = (status: string) => {
    if (status === 'KARŞILIYOR' || status === 'UYGUN')
      return (
        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
          Uygun
        </Badge>
      );
    if (status === 'KISMEN' || status === 'KISMEN KARŞILIYOR')
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
          Kısmen
        </Badge>
      );
    if (status === 'KARŞILAMIYOR' || status === 'UYGUN DEĞİL')
      return (
        <Badge variant="outline" className="text-[10px] bg-destructive/10 text-destructive border-destructive/30">
          Uygun Değil
        </Badge>
      );
    if (status === 'KAPATILDI')
      return (
        <Badge variant="outline" className="text-[10px] bg-muted text-muted-foreground border-border">
          Kapatıldı
        </Badge>
      );
    if (status === 'DEVAM EDİYOR')
      return (
        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
          Devam Ediyor
        </Badge>
      );
    return <Badge variant="outline" className="text-[10px]">{status}</Badge>;
  };

  const renderSubmissionStatusBadge = (status: string) => {
    if (status === 'TAMAMLANDI')
      return (
        <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30">
          Tamamlandı
        </Badge>
      );
    if (status === 'BEKLEYEN')
      return (
        <Badge variant="outline" className="text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30">
          Bekliyor
        </Badge>
      );
    if (status === 'TASLAK')
      return (
        <Badge variant="outline" className="text-[10px] bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-500/30">
          Taslak
        </Badge>
      );
    return (
      <Badge variant="outline" className="text-[10px] text-muted-foreground">
        {status}
      </Badge>
    );
  };

  return (
    <div className="space-y-5 max-w-[1600px] mx-auto pb-10">
      {/* HEADER */}
      <div className="bg-card p-4 sm:p-5 rounded-lg border border-border flex flex-col gap-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              İSG Kontrol Listeleri — Konsolide Sonuçlar &amp; Analitik
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground mt-0.5">
              Tesislere gönderilen kontrol listelerinin tamamlanma durumu, madde bazlı uyum oranları ve bulgu takibi.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/checklists/submissions')}
              className="h-8 text-xs gap-1.5"
            >
              <ClipboardCheck className="w-3.5 h-3.5" />
              Denetimlerim
            </Button>
            {hasAdminAccess && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/checklists/templates')}
                className="h-8 text-xs gap-1.5"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Şablonlar &amp; Gönderim
              </Button>
            )}
            <Button
              variant={hasActiveFilters ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="h-8 text-xs gap-1.5"
            >
              <Filter className="w-3.5 h-3.5" />
              Filtreler
            </Button>
          </div>
        </div>

        {showFilters && (
          <div className="pt-3 border-t border-border grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Yıl</label>
              <Select value={urlYear} onValueChange={(v) => updateFilters({ year: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tüm Yıllar">
                    {urlYear === 'all' ? 'Tüm Yıllar' : `${urlYear} Yılı`}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Yıllar</SelectItem>
                  {years.map((y) => (
                    <SelectItem key={y} value={y} className="text-xs">
                      {y} Yılı
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Şablon Grubu</label>
              <Select
                value={urlGroupId}
                onValueChange={(v) => updateFilters({ groupId: v, templateId: 'all' })}
              >
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tüm Gruplar">
                    {urlGroupId === 'all'
                      ? 'Tüm Gruplar'
                      : groups.find((g: any) => g.id === urlGroupId)?.name || 'Seçili Grup'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Gruplar</SelectItem>
                  {groups.map((g: any) => (
                    <SelectItem key={g.id} value={g.id} className="text-xs">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Kontrol Listesi</label>
              <Select value={urlTemplateId} onValueChange={(v) => updateFilters({ templateId: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tüm Listeler">
                    {urlTemplateId === 'all'
                      ? 'Tüm Listeler'
                      : templates.find((t: any) => t.id === urlTemplateId)?.title ||
                        consolidatedData?.summary?.templateTitle ||
                        'Seçili Liste'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Listeler</SelectItem>
                  {templates.map((t: any) => (
                    <SelectItem key={t.id} value={t.id} className="text-xs">
                      {t.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground">Kategori</label>
              <Select value={urlCategoryId} onValueChange={(v) => updateFilters({ categoryId: v })}>
                <SelectTrigger className="h-8 text-xs">
                  <SelectValue placeholder="Tüm Kategoriler">
                    {urlCategoryId === 'all'
                      ? 'Tüm Kategoriler'
                      : categories.find((c: any) => c.id === urlCategoryId)?.name || 'Seçili Kategori'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Kategoriler</SelectItem>
                  {categories.map((c: any) => (
                    <SelectItem key={c.id} value={c.id} className="text-xs">
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {hasActiveFilters && (
              <div className="md:col-span-4 flex justify-end">
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs text-destructive">
                  <X className="w-3.5 h-3.5 mr-1" /> Filtreleri Temizle
                </Button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* MAIN TABS */}
      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-5">
        <TabsList>
          <TabsTrigger value="consolidated" className="text-xs gap-1.5">
            <ClipboardCheck className="w-3.5 h-3.5" />
            Konsolide Şablon &amp; Tesis Sonuçları
          </TabsTrigger>
          <TabsTrigger value="analytics" className="text-xs gap-1.5">
            <Activity className="w-3.5 h-3.5" />
            Genel Analitik &amp; Bulgu Yaşam Döngüsü
          </TabsTrigger>
        </TabsList>

        {/* TAB 1: KONSOLİDE ŞABLON x TESİS & SORU MATRİSİ */}
        <TabsContent value="consolidated" className="space-y-5 mt-0">
          <Card className="rounded-lg border-border/80">
            <CardContent className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-xs font-semibold text-foreground">İncelenen Şablon:</span>
                <Select
                  value={consolidatedData?.selectedTemplateId || undefined}
                  onValueChange={(v) => {
                    if (v && v !== 'null' && v !== 'undefined') {
                      updateFilters({ templateId: v });
                    }
                  }}
                >
                  <SelectTrigger className="h-8 w-[300px] sm:w-[380px] text-xs">
                    <SelectValue placeholder="Kontrol listesi şablonu seçin">
                      {(() => {
                        const found = (consolidatedData?.templates || []).find(
                          (t: any) => t.id === consolidatedData?.selectedTemplateId
                        );
                        if (found) {
                          return `${found.groupName ? `[${found.groupName}] ` : ''}${found.title}`;
                        }
                        return consolidatedData?.summary?.templateTitle || 'Kontrol listesi şablonu seçin';
                      })()}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {(consolidatedData?.templates || []).map((t: any) => (
                      <SelectItem key={t.id} value={t.id} className="text-xs">
                        {t.groupName ? `[${t.groupName}] ` : ''}
                        {t.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {consolidatedData?.summary && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleExportConsolidatedExcel}
                  className="h-8 text-xs gap-1.5 shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  Konsolide Excel İndir
                </Button>
              )}
            </CardContent>
          </Card>

          {consolidatedLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
              <div className="h-24 rounded-lg bg-muted animate-pulse" />
            </div>
          ) : !consolidatedData?.summary ? (
            <Card className="rounded-lg border-border/80">
              <CardContent className="py-12 text-center text-xs text-muted-foreground">
                Henüz aktif kontrol listesi şablonu bulunmuyor.
              </CardContent>
            </Card>
          ) : (
            <>
              {/* Konsolide KPI Kartları */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-lg border-border/80">
                  <CardContent className="p-4">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                      Hedef / İlgili Tesis
                    </span>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                      {consolidatedData.summary.totalFacilities}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-emerald-500/30 bg-emerald-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                        Tamamlanan
                      </span>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                      {consolidatedData.summary.completedCount}
                      <span className="text-xs font-medium text-muted-foreground ml-1.5">
                        (%{consolidatedData.summary.completionRate})
                      </span>
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-amber-500/30 bg-amber-500/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 dark:text-amber-400">
                        Bekleyen / Taslak
                      </span>
                      <Clock className="w-4 h-4 text-amber-600" />
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                      {consolidatedData.summary.pendingCount}
                    </p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-primary/25 bg-primary/5">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-primary">
                        Ortalama Uyum Skoru
                      </span>
                      <TrendingUp className="w-4 h-4 text-primary" />
                    </div>
                    <p className="text-2xl font-bold text-foreground tabular-nums mt-1">
                      %{consolidatedData.summary.avgScore}
                    </p>
                  </CardContent>
                </Card>
              </div>

              {/* Görsel Analitik: Burn-Up Grafiği + Cevap Dağılımı Pasta Grafiği */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                <Card className="lg:col-span-7 rounded-lg border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Tamamlanma Burn-Up Grafiği (Kümülatif Tesis)
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Zaman içinde tamamlanan denetim sayısının hedef tesis sayısına ({consolidatedData.summary.totalFacilities}) ulaşım eğrisi.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px]">
                    {consolidatedData.burnUpSeries?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={consolidatedData.burnUpSeries} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                          <RechartsTooltip />
                          <Legend />
                          <Area
                            type="monotone"
                            dataKey="completed"
                            name="Tamamlanan Tesis"
                            stroke="#10b981"
                            fill="#10b981"
                            fillOpacity={0.2}
                            strokeWidth={2}
                          />
                          <Line
                            type="monotone"
                            dataKey="target"
                            name="Hedef Toplam"
                            stroke="#64748b"
                            strokeDasharray="5 5"
                            dot={false}
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Burn-up grafiği için henüz tamamlanmış denetim bulunmuyor.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="lg:col-span-5 rounded-lg border-border/80">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-semibold">
                      Genel Cevap &amp; Uyum Dağılımı
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tamamlanan tüm tesislerdeki sorulara verilen yanıt oranları.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="h-[260px]">
                    {consolidatedData.answerDistribution?.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={consolidatedData.answerDistribution}
                            cx="50%"
                            cy="45%"
                            innerRadius={52}
                            outerRadius={80}
                            paddingAngle={3}
                            dataKey="value"
                          >
                            {consolidatedData.answerDistribution.map((entry: any, idx: number) => (
                              <Cell key={`ans-${idx}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any, name: any) => [`${value} yanıt`, name]} />
                          <Legend verticalAlign="bottom" height={32} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Henüz cevap dağılımı oluşmadı.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Tesis Bazlı Tamamlanma & Skor Matrisi */}
              <Card className="rounded-lg border-border/80">
                <CardHeader className="pb-3 border-b border-border bg-muted/20">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Building2 className="w-4 h-4 text-primary" />
                    Tesis Bazlı Tamamlanma ve Skor Matrisi
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Hangi tesisin kontrol listesini tamamladığı, hangisinin beklediği ve aldığı puan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {consolidatedData.facilityMatrix.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Bu şablon için henüz atanmış veya doldurulmuş tesis bulunmuyor.
                    </p>
                  ) : (
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
                        <tr>
                          <th className="px-4 py-2.5">Tesis</th>
                          <th className="px-4 py-2.5">Durum</th>
                          <th className="px-4 py-2.5 text-right">Başarı Skoru</th>
                          <th className="px-4 py-2.5">Son İşlem Tarihi</th>
                          <th className="px-4 py-2.5">Denetçi</th>
                          <th className="px-4 py-2.5 text-right">İşlem</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {consolidatedData.facilityMatrix.map((row: any) => (
                          <tr key={row.facilityId} className="hover:bg-muted/20 transition-colors">
                            <td className="px-4 py-2.5 font-semibold text-foreground">{row.facilityName}</td>
                            <td className="px-4 py-2.5">{renderSubmissionStatusBadge(row.status)}</td>
                            <td className="px-4 py-2.5 text-right tabular-nums font-bold">
                              {row.percentScore != null ? (
                                <span
                                  className={
                                    row.percentScore < 50
                                      ? 'text-destructive'
                                      : row.percentScore < 80
                                      ? 'text-amber-600 dark:text-amber-400'
                                      : 'text-emerald-600 dark:text-emerald-400'
                                  }
                                >
                                  %{Number(row.percentScore).toFixed(1)}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">—</span>
                              )}
                            </td>
                            <td className="px-4 py-2.5 tabular-nums text-muted-foreground">
                              {row.auditDate ? format(new Date(row.auditDate), 'dd.MM.yyyy') : '—'}
                            </td>
                            <td className="px-4 py-2.5 text-muted-foreground">{row.conductedBy || '—'}</td>
                            <td className="px-4 py-2.5 text-right">
                              {row.submissionId ? (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/checklists/submissions/${row.submissionId}`)}
                                  className="h-7 px-2 text-[11px] gap-1 text-primary"
                                >
                                  Aç <ExternalLink className="w-3 h-3" />
                                </Button>
                              ) : (
                                <span className="text-[11px] text-muted-foreground">—</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </CardContent>
              </Card>

              {/* Kategori Bazlı Konsolide Uyum Analizi */}
              {consolidatedData.categorySummary && consolidatedData.categorySummary.length > 0 && (
                <Card className="rounded-lg border-border/80">
                  <CardHeader className="pb-3 border-b border-border bg-muted/20">
                    <CardTitle className="text-sm font-semibold flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Kategori Bazlı Konsolide Uyum Özeti
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Tamamlanan denetimlerde tüm soruların ana kategorilere göre genel uyum oranları.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {consolidatedData.categorySummary.map((cat: any) => (
                      <div
                        key={cat.categoryName}
                        className="p-3.5 rounded-lg border border-border/70 bg-muted/15 space-y-2"
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-semibold text-foreground truncate">
                            {cat.categoryName}
                          </span>
                          <Badge variant="outline" className="text-[10px] tabular-nums shrink-0">
                            {cat.questionCount} soru
                          </Badge>
                        </div>
                        <div className="flex items-center justify-between text-[11px] tabular-nums">
                          <span className="text-muted-foreground">
                            <strong className="text-emerald-600 dark:text-emerald-400">{cat.compliantCount}</strong> Uygun •{' '}
                            <strong className="text-amber-600 dark:text-amber-400">{cat.partialCount}</strong> Kısmen •{' '}
                            <strong className="text-destructive">{cat.nonCompliantCount}</strong> Uygun Değil
                          </span>
                          <span className="font-bold text-foreground">
                            {cat.complianceRate != null ? `%${cat.complianceRate}` : '—'}
                          </span>
                        </div>
                        <div className="w-full h-1.5 rounded-full bg-muted overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              (cat.complianceRate ?? 0) >= 80
                                ? 'bg-emerald-500'
                                : (cat.complianceRate ?? 0) >= 50
                                ? 'bg-amber-500'
                                : 'bg-destructive'
                            }`}
                            style={{ width: `${cat.complianceRate ?? 0}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Soru / Madde Bazlı Konsolide Analiz */}
              <Card className="rounded-lg border-border/80">
                <CardHeader className="pb-3 border-b border-border bg-muted/20">
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    Soru Bazlı Tüm Tesisler Analizi
                  </CardTitle>
                  <CardDescription className="text-xs">
                    Her bir soruya tüm tesislerden gelen cevap dağılımı. Tüm tesislerin cevabını görmek için satıra tıklayın.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
                      <tr>
                        <th className="px-4 py-2.5 w-12">#</th>
                        <th className="px-4 py-2.5">Soru / Kategori</th>
                        <th className="px-4 py-2.5">Gelen Cevap Dağılımı</th>
                        <th className="px-3 py-2.5 text-right">Uyum %</th>
                        <th className="px-4 py-2.5">Uygunsuz Tesisler</th>
                        <th className="px-4 py-2.5 text-right">Detay</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {consolidatedData.questionSummary.map((q: any) => (
                        <tr
                          key={q.itemId}
                          onClick={() => setSelectedQuestion(q)}
                          className="hover:bg-muted/20 cursor-pointer transition-colors"
                        >
                          <td className="px-4 py-2.5 font-mono text-muted-foreground">{q.itemNo}</td>
                          <td className="px-4 py-2.5 max-w-md space-y-0.5">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className="text-[10px] text-muted-foreground">{q.sectionTitle}</span>
                              {q.categoryLabel && q.categoryLabel !== 'Kategorisiz' && (
                                <Badge variant="outline" className="text-[10px] py-0 font-normal">
                                  {q.categoryLabel}
                                </Badge>
                              )}
                            </div>
                            <p className="font-medium text-foreground">{q.questionText}</p>
                          </td>
                          <td className="px-4 py-2.5">
                            {q.optionBreakdown && q.optionBreakdown.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {q.optionBreakdown.map((opt: any) => (
                                  <Badge
                                    key={opt.label}
                                    variant="secondary"
                                    className="text-[10px] tabular-nums"
                                  >
                                    {opt.label}: {opt.count}
                                  </Badge>
                                ))}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">Henüz yanıt yok</span>
                            )}
                          </td>
                          <td className="px-3 py-2.5 text-right tabular-nums font-bold">
                            {q.complianceRate != null ? (
                              <span
                                className={
                                  q.complianceRate < 50
                                    ? 'text-destructive'
                                    : q.complianceRate < 80
                                    ? 'text-amber-600 dark:text-amber-400'
                                    : 'text-emerald-600 dark:text-emerald-400'
                                }
                              >
                                %{q.complianceRate}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td className="px-4 py-2.5">
                            {q.nonCompliantFacilities?.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {q.nonCompliantFacilities.slice(0, 3).map((f: string, idx: number) => (
                                  <Badge
                                    key={idx}
                                    variant="outline"
                                    className="text-[10px] bg-destructive/10 text-destructive border-destructive/30"
                                  >
                                    {f}
                                  </Badge>
                                ))}
                                {q.nonCompliantFacilities.length > 3 && (
                                  <Badge variant="outline" className="text-[10px]">
                                    +{q.nonCompliantFacilities.length - 3}
                                  </Badge>
                                )}
                              </div>
                            ) : (
                              <span className="text-[11px] text-muted-foreground">—</span>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-right">
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 px-2 text-[11px] text-primary"
                            >
                              Tesisler ({q.facilityAnswers?.length || 0})
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>

        {/* TAB 2: GENEL ANALİTİK & BULGU YAŞAM DÖNGÜSÜ */}
        <TabsContent value="analytics" className="space-y-5 mt-0">
          {!hasAdminAccess && (!selectedFacilityId || selectedFacilityId === 'all') ? (
            <Card className="rounded-lg border-border/80">
              <CardContent className="py-12 text-center space-y-2">
                <Activity className="w-8 h-8 text-primary mx-auto" />
                <h2 className="text-sm font-semibold">Tesis Seçiniz</h2>
                <p className="text-xs text-muted-foreground">
                  Analizleri görüntülemek için lütfen sol menüden bir tesis seçin.
                </p>
              </CardContent>
            </Card>
          ) : analyticsLoading ? (
            <div className="h-64 rounded-lg bg-muted animate-pulse" />
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="rounded-lg border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Ortalama Grup Skoru</CardTitle>
                    <TrendingUp className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums">%{stats.avgGroupScore?.toFixed(1) || '0.0'}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Tamamlanan denetim ortalaması</p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Denetlenen Tesis</CardTitle>
                    <Building2 className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold tabular-nums">{stats.auditedFacilitiesCount}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Seçili kriterlere uyan tesis</p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">Açık / Devam Eden Bulgu</CardTitle>
                    <AlertTriangle className="h-4 w-4 text-destructive" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-destructive tabular-nums">{stats.totalPriorityFindings}</div>
                    <p className="text-[11px] text-muted-foreground mt-1">Henüz kapatılmamış tespit</p>
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-border/80">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-xs font-medium text-muted-foreground">İyileştirme Oranı</CardTitle>
                    <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-emerald-600 tabular-nums">
                      %{stats.closedImprovementRate?.toFixed(0) || '0'}
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">Kapatılan bulgu yüzdesi</p>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                <Card className="lg:col-span-2 rounded-lg border-border/80">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Tesis Bazlı Başarı Sıralaması (%)</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {facilityScores.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={facilityScores} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal vertical={false} />
                          <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={140} tick={{ fontSize: 11 }} />
                          <RechartsTooltip formatter={(value: any) => [`%${value}`, 'Başarı Skoru']} />
                          <Bar dataKey="score" radius={[0, 4, 4, 0]} barSize={20}>
                            {facilityScores.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.score >= 80 ? '#10b981' : entry.score >= 50 ? '#f59e0b' : '#ef4444'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Kriterlere uyan veri bulunamadı.
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="rounded-lg border-border/80">
                  <CardHeader>
                    <CardTitle className="text-sm font-semibold">Genel Uyum Dağılımı</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[300px]">
                    {statusDistribution.length > 0 ? (
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={statusDistribution}
                            cx="50%"
                            cy="45%"
                            innerRadius={55}
                            outerRadius={85}
                            paddingAngle={4}
                            dataKey="value"
                          >
                            {statusDistribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <RechartsTooltip formatter={(value: any, name: any) => [value, name]} />
                          <Legend verticalAlign="bottom" height={36} iconType="circle" />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div className="h-full flex items-center justify-center text-xs text-muted-foreground">
                        Veri bulunmuyor.
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <Card className="rounded-lg border-border/80">
                <CardHeader className="pb-3 border-b border-border bg-muted/20">
                  <CardTitle className="text-sm font-semibold">Tespit ve İyileştirme Yaşam Döngüsü</CardTitle>
                  <CardDescription className="text-xs">
                    Denetimlerde tespit edilen uygunsuzlukların sonraki kontrollerde kapanma durumu.
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0 overflow-x-auto">
                  {lifecycleFindings.length > 0 ? (
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
                        <tr>
                          <th className="px-4 py-2.5">Tesis / Şablon</th>
                          <th className="px-4 py-2.5">Soru / Madde</th>
                          <th className="px-4 py-2.5">İlk Tespit</th>
                          <th className="px-4 py-2.5">Son Durum</th>
                          <th className="px-4 py-2.5">Süreç</th>
                          <th className="px-4 py-2.5 text-right">Detay</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {lifecycleFindings.map((finding: any, idx: number) => (
                          <tr
                            key={idx}
                            onClick={() => setSelectedFinding(finding)}
                            className="hover:bg-muted/20 cursor-pointer transition-colors"
                          >
                            <td className="px-4 py-2.5">
                              <div className="font-semibold text-foreground">{finding.facilityName}</div>
                              <div className="text-[11px] text-muted-foreground">{finding.templateName}</div>
                            </td>
                            <td className="px-4 py-2.5 max-w-xs truncate">{finding.questionText}</td>
                            <td className="px-4 py-2.5">
                              {renderStatusBadge(finding.initialStatus)}
                              <div className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                                {format(new Date(finding.initialDate), 'dd.MM.yyyy', { locale: tr })}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">
                              {renderStatusBadge(finding.latestStatus)}
                              <div className="text-[10px] text-muted-foreground mt-0.5 tabular-nums">
                                {format(new Date(finding.latestDate), 'dd.MM.yyyy', { locale: tr })}
                              </div>
                            </td>
                            <td className="px-4 py-2.5">{renderStatusBadge(finding.currentStatus)}</td>
                            <td className="px-4 py-2.5 text-right">
                              <Button variant="ghost" size="icon" className="h-7 w-7">
                                <ChevronRight className="w-4 h-4" />
                              </Button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-muted-foreground text-center py-8">
                      Bu filtrelere uygun yaşam döngüsü bulgusu bulunmuyor.
                    </p>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </TabsContent>
      </Tabs>

      {/* Bulgu Detay Modal */}
      <Dialog open={!!selectedFinding} onOpenChange={(open) => !open && setSelectedFinding(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-lg">
          {selectedFinding && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold">Bulgu Yaşam Döngüsü</DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedFinding.facilityName} — {selectedFinding.templateName}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <span className="text-[10px] font-semibold uppercase text-muted-foreground block">
                    Denetlenen Kriter
                  </span>
                  <p className="text-xs font-medium text-foreground mt-1">{selectedFinding.questionText}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 rounded-lg border border-destructive/30 bg-destructive/5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">İlk Tespit</span>
                      {renderStatusBadge(selectedFinding.initialStatus)}
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedFinding.initialNote || 'Not girilmemiş.'}</p>
                    {selectedFinding.initialPhoto && (
                      <a href={getFullUrl(selectedFinding.initialPhoto)} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline block">
                        Fotoğrafı Görüntüle
                      </a>
                    )}
                  </div>

                  <div className="p-3 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold">Son Durum</span>
                      {renderStatusBadge(selectedFinding.latestStatus)}
                    </div>
                    <p className="text-xs text-muted-foreground">{selectedFinding.latestNote || 'Not girilmemiş.'}</p>
                    {selectedFinding.latestPhoto && (
                      <a href={getFullUrl(selectedFinding.latestPhoto)} target="_blank" rel="noreferrer" className="text-[11px] text-primary hover:underline block">
                        Fotoğrafı Görüntüle
                      </a>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* Soru Bazlı Tüm Tesisler Detay Modalı */}
      <Dialog open={!!selectedQuestion} onOpenChange={(open) => !open && setSelectedQuestion(null)}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto rounded-lg">
          {selectedQuestion && (
            <>
              <DialogHeader>
                <DialogTitle className="text-base font-semibold flex items-center gap-2">
                  <span>Soru #{selectedQuestion.itemNo} — Tüm Tesisler Analizi</span>
                  {selectedQuestion.complianceRate != null && (
                    <Badge variant="outline" className="text-xs tabular-nums">
                      %{selectedQuestion.complianceRate} Uyum
                    </Badge>
                  )}
                </DialogTitle>
                <DialogDescription className="text-xs">
                  {selectedQuestion.sectionTitle}
                  {selectedQuestion.categoryLabel && selectedQuestion.categoryLabel !== 'Kategorisiz'
                    ? ` • ${selectedQuestion.categoryLabel}`
                    : ''}
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                <div className="p-3 rounded-lg border border-border bg-muted/20">
                  <p className="text-xs sm:text-sm font-medium text-foreground">
                    {selectedQuestion.questionText}
                  </p>
                  {selectedQuestion.optionBreakdown?.length > 0 && (
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                      <div className="flex flex-wrap gap-1.5">
                        {selectedQuestion.optionBreakdown.map((opt: any) => (
                          <Badge key={opt.label} variant="secondary" className="text-[11px] tabular-nums">
                            {opt.label}: {opt.count} tesis
                          </Badge>
                        ))}
                      </div>
                      <div className="h-[140px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={selectedQuestion.optionBreakdown}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={52}
                              paddingAngle={3}
                              dataKey="count"
                              nameKey="label"
                            >
                              {selectedQuestion.optionBreakdown.map((opt: any, idx: number) => (
                                <Cell key={`qopt-${idx}`} fill={opt.color || '#3b82f6'} />
                              ))}
                            </Pie>
                            <RechartsTooltip formatter={(val: any, name: any) => [`${val} tesis`, name]} />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  )}
                </div>

                {selectedQuestion.facilityAnswers?.length > 0 ? (
                  <div className="border border-border rounded-lg overflow-hidden">
                    <table className="w-full text-xs text-left">
                      <thead className="text-[11px] text-muted-foreground uppercase bg-muted/30 border-b border-border">
                        <tr>
                          <th className="px-3 py-2">Tesis</th>
                          <th className="px-3 py-2">Gelen Cevap</th>
                          <th className="px-3 py-2">Durum</th>
                          <th className="px-3 py-2">Not</th>
                          <th className="px-3 py-2 text-right">Tarih</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border">
                        {selectedQuestion.facilityAnswers.map((fa: any) => (
                          <tr
                            key={`${fa.facilityId}-${fa.submissionId}`}
                            onClick={() => navigate(`/checklists/submissions/${fa.submissionId}`)}
                            className="hover:bg-muted/20 cursor-pointer"
                          >
                            <td className="px-3 py-2 font-semibold text-foreground">{fa.facilityName}</td>
                            <td className="px-3 py-2 font-medium">{fa.answerLabel}</td>
                            <td className="px-3 py-2">{renderStatusBadge(fa.status)}</td>
                            <td className="px-3 py-2 text-muted-foreground max-w-[200px] truncate">
                              {fa.note || '—'}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                              {fa.auditDate ? format(new Date(fa.auditDate), 'dd.MM.yyyy') : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground text-center py-6 border border-dashed border-border rounded-lg">
                    Bu soru için henüz tamamlanmış tesis cevabı bulunmuyor.
                  </p>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
