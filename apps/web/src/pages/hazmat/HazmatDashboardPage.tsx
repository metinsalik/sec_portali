import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { 
  Package, AlertTriangle, ShieldAlert, FileText, CheckCircle2, 
  Droplets, Scale, RefreshCw, ChevronRight, Building2, Flame,
  Eye, ExternalLink
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, 
  ResponsiveContainer, PieChart, Pie, Cell 
} from 'recharts';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const PIE_COLORS = [
  '#ef4444', // Red
  '#f97316', // Orange
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#06b6d4', // Cyan
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Purple
  '#ec4899', // Pink
  '#84cc16', // Lime
];

export default function HazmatDashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const activeFacilityId = useActiveFacility();

  const isAdmin = Boolean(user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management'));

  const [selectedFacility, setSelectedFacility] = useState<string>(() => {
    if (isAdmin) return 'all';
    return activeFacilityId || (Array.isArray(user?.facilities) && user.facilities[0]) || 'all';
  });

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    }
  });

  const { data: metrics, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ['hazmat-dashboard', selectedFacility],
    queryFn: async () => {
      const res = await api.get(`/hazmat/dashboard?facilityId=${encodeURIComponent(selectedFacility)}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      return res.json();
    },
    refetchOnMount: 'always'
  });

  const safeFormatDate = (date: any) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return format(d, 'dd MMM yyyy, HH:mm', { locale: tr });
    } catch {
      return '-';
    }
  };

  const currentFacilityName = selectedFacility === 'all' 
    ? 'Tüm Tesisler' 
    : (facilities.find(f => f.id === selectedFacility)?.name || selectedFacility);

  return (
    <div className="max-w-7xl mx-auto space-y-5 pb-16 p-4 sm:p-6 font-sans antialiased">
      {/* Üst Başlık & Tesis Seçici (Açıklama kaldırıldı, sade) */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-4">
        <div className="flex items-center gap-3">
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
            Tehlikeli Madde Yönetim Paneli
          </h1>
          <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
            {currentFacilityName}
          </Badge>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {(isAdmin || (user?.facilities && user.facilities.length > 1)) && (
            <Select value={selectedFacility} onValueChange={setSelectedFacility}>
              <SelectTrigger className="w-full sm:w-[210px] h-8 text-xs bg-card border-border/80 shadow-2xs">
                <Building2 className="w-3.5 h-3.5 mr-1.5 text-muted-foreground shrink-0" />
                <SelectValue placeholder="Tesis Seçiniz">
                  {selectedFacility === 'all' 
                    ? 'Tüm Tesisler' 
                    : (facilities.find((f) => f.id === selectedFacility)?.name || 'Tesis Seçiniz')}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all" className="text-xs font-semibold">Tüm Tesisler</SelectItem>
                {facilities
                  .filter((f) => isAdmin || user?.facilities?.includes(f.id))
                  .map((f) => (
                    <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                  ))
                }
              </SelectContent>
            </Select>
          )}

          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => refetch()} 
            disabled={isFetching}
            className="h-8 px-2.5 text-xs gap-1.5 shadow-2xs"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : 'text-muted-foreground'}`} />
            <span className="hidden sm:inline">Yenile</span>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-5">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <Skeleton className="h-72 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>
        </div>
      ) : isError || !metrics ? (
        <div className="p-8 text-center bg-card rounded-xl border border-destructive/30 space-y-2">
          <AlertTriangle className="w-8 h-8 text-destructive mx-auto" />
          <h3 className="text-sm font-semibold text-foreground">Veriler Yüklenemedi</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="text-xs h-8">Tekrar Dene</Button>
        </div>
      ) : (
        <>
          {/* KPI Kartları (Sade, yazı kalabalığı yok) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* 1. Tehlikeli Kimyasal Çeşidi */}
            <Card className="shadow-2xs border-border/70 bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
                  <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">TEHLİKELİ KİMYASAL</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-foreground">
                      {metrics.summary?.totalRegisteredMaterials || metrics.inventory?.materialsCount || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">çeşit</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Toplam Sıvı Miktar (Litre) */}
            <Card className="shadow-2xs border-border/70 bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
                  <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">TOPLAM SIVI</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-cyan-600 dark:text-cyan-400">
                      {(metrics.quantities?.totalLiters || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-foreground">L</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 3. Toplam Katı Ağırlık (Kilogram) */}
            <Card className="shadow-2xs border-border/70 bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
                  <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">TOPLAM KATI</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-indigo-600 dark:text-indigo-400">
                      {(metrics.quantities?.totalKilograms || 0).toLocaleString('tr-TR', { maximumFractionDigits: 2 })}
                    </span>
                    <span className="text-xs font-bold text-foreground">kg</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 4. Olağan Dışı Olaylar */}
            <Card className="shadow-2xs border-border/70 bg-card">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
                  <ShieldAlert className="w-5 h-5 text-rose-600 dark:text-rose-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">OLAĞAN DIŞI OLAY</p>
                  <div className="flex items-baseline gap-1 mt-0.5">
                    <span className="text-2xl font-black text-rose-600 dark:text-rose-400">
                      {metrics.incidents?.total || 0}
                    </span>
                    <span className="text-xs text-muted-foreground">olay</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Ana Grafikler Satırı 1: Tehlike Etiketleri Dağılımı & Olağan Dışı Olay Türleri Dağılımı */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Tehlike Etiketleri (GHS) Dağılımı - Kompakt Matris Izgara */}
            <Card className="shadow-2xs border-border/70 overflow-hidden bg-card">
              <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shrink-0">
                    <Flame className="w-3.5 h-3.5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                    Tehlike Etiketleri Dağılımı
                  </CardTitle>
                </div>
                <Badge variant="outline" className="text-[10px] font-semibold bg-background h-5 px-1.5">
                  {metrics.hazardLabels?.totalLabelsTagged || 0} Etiket
                </Badge>
              </CardHeader>
              <CardContent className="p-3.5">
                {metrics.hazardLabels?.distribution && metrics.hazardLabels.distribution.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Donut Chart */}
                    <div className="w-[140px] h-[140px] relative flex items-center justify-center shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.hazardLabels.distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={62}
                            paddingAngle={2}
                            dataKey="count"
                          >
                            {metrics.hazardLabels.distribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-md px-2.5 py-1.5 text-xs">
                                    <div className="font-semibold flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: payload[0].color }} />
                                      {data.name}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                                      {data.count} kimyasal madde
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-foreground">
                          {metrics.hazardLabels.distribution.length}
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">TÜR</span>
                      </div>
                    </div>

                    {/* Sağ Taraf: Kompakt 2 Sütunlu Izgara (Parantez yok, tek tip font, yer kaplamaz) */}
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {metrics.hazardLabels.distribution.map((label: any, index: number) => {
                        const color = PIE_COLORS[index % PIE_COLORS.length];
                        return (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-1.5 px-2 rounded-md border border-border/50 bg-muted/20 text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-1">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="font-medium text-foreground text-[11px] truncate">
                                {label.name}
                              </span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-bold h-4 px-1 shrink-0">
                              {label.count}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-xs">
                    Tanımlı tehlike etiketi bulunmuyor.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Olağan Dışı Olay Dağılımı - Kompakt */}
            <Card className="shadow-2xs border-border/70 overflow-hidden bg-card">
              <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-rose-500/10 flex items-center justify-center border border-rose-500/20 shrink-0">
                    <ShieldAlert className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
                  </div>
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                    Olağan Dışı Olay Dağılımı
                  </CardTitle>
                </div>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => navigate('/hazmat/incidents')}
                  className="h-6 text-[11px] px-1.5 gap-1 text-primary hover:text-primary"
                >
                  Olaylar <ChevronRight className="w-3 h-3" />
                </Button>
              </CardHeader>
              <CardContent className="p-3.5">
                {metrics.incidents?.distribution && metrics.incidents.distribution.length > 0 ? (
                  <div className="flex flex-col sm:flex-row items-center gap-4">
                    {/* Donut Chart */}
                    <div className="w-[140px] h-[140px] relative flex items-center justify-center shrink-0">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={metrics.incidents.distribution}
                            cx="50%"
                            cy="50%"
                            innerRadius={38}
                            outerRadius={62}
                            paddingAngle={2}
                            dataKey="value"
                          >
                            {metrics.incidents.distribution.map((entry: any, index: number) => (
                              <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                            ))}
                          </Pie>
                          <RechartsTooltip
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-md px-2.5 py-1.5 text-xs">
                                    <div className="font-semibold flex items-center gap-1.5">
                                      <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: payload[0].color }} />
                                      {data.name}
                                    </div>
                                    <div className="text-muted-foreground mt-0.5 text-[11px]">
                                      {data.value} adet olay
                                    </div>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                        <span className="text-lg font-black text-rose-600 dark:text-rose-400">
                          {metrics.incidents.total || 0}
                        </span>
                        <span className="text-[8px] font-bold text-muted-foreground uppercase">OLAY</span>
                      </div>
                    </div>

                    {/* Sağ Taraf: Olay Türleri Kompakt Izgara */}
                    <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-[160px] overflow-y-auto pr-1">
                      {metrics.incidents.distribution.map((item: any, index: number) => {
                        const color = PIE_COLORS[index % PIE_COLORS.length];
                        return (
                          <div 
                            key={index} 
                            className="flex items-center justify-between p-1.5 px-2 rounded-md border border-border/50 bg-muted/20 text-xs"
                          >
                            <div className="flex items-center gap-1.5 min-w-0 pr-1">
                              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
                              <span className="font-medium text-foreground text-[11px] truncate">{item.name}</span>
                            </div>
                            <Badge variant="secondary" className="text-[10px] font-bold h-4 px-1 shrink-0">
                              {item.value}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="py-8 text-center text-muted-foreground text-xs space-y-1">
                    <CheckCircle2 className="w-6 h-6 text-emerald-500/60 mx-auto mb-1" />
                    <p className="font-medium text-foreground">Kayıtlı olay bulunmuyor.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Grafikler Satırı 2: Yatay Sütun Grafik (Kategoriler Asla Kesilmez) */}
          <Card className="shadow-2xs border-border/70 overflow-hidden bg-card">
            <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                Kategorilere Göre Miktar Dağılımı
              </CardTitle>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-cyan-500" />
                  <span className="text-muted-foreground text-[11px] font-medium">Sıvı (Litre)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-xs bg-indigo-500" />
                  <span className="text-muted-foreground text-[11px] font-medium">Katı (kg)</span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3.5">
              {metrics.quantities?.byCategory && metrics.quantities.byCategory.length > 0 ? (
                <div className="flex flex-col lg:flex-row items-stretch gap-5">
                  {/* Sol: Yatay Çubuk Grafik */}
                  <div className="flex-1 w-full" style={{ height: Math.max(160, metrics.quantities.byCategory.length * 44) }}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart 
                        layout="vertical"
                        data={metrics.quantities.byCategory}
                        margin={{ top: 5, right: 15, left: 10, bottom: 5 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="currentColor" className="text-border/40" />
                        <XAxis 
                          type="number" 
                          tick={{ fontSize: 11 }} 
                          tickLine={false} 
                          axisLine={false} 
                        />
                        <YAxis 
                          type="category" 
                          dataKey="category" 
                          tick={{ fontSize: 11 }} 
                          tickLine={false} 
                          axisLine={false}
                          width={200}
                        />
                        <RechartsTooltip 
                          content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                              const d = payload[0].payload;
                              return (
                                <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-md p-2.5 text-xs space-y-1">
                                  <p className="font-bold border-b border-border/60 pb-1">{d.category}</p>
                                  <div className="flex items-center justify-between gap-4 text-cyan-600 dark:text-cyan-400">
                                    <span>Sıvı:</span>
                                    <span className="font-bold">{d.liters.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} Litre</span>
                                  </div>
                                  <div className="flex items-center justify-between gap-4 text-indigo-600 dark:text-indigo-400">
                                    <span>Katı:</span>
                                    <span className="font-bold">{d.kilograms.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg</span>
                                  </div>
                                </div>
                              );
                            }
                            return null;
                          }}
                        />
                        <Bar dataKey="liters" name="Sıvı (Litre)" fill="#06b6d4" radius={[0, 4, 4, 0]} barSize={11} />
                        <Bar dataKey="kilograms" name="Katı (kg)" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={11} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  {/* Sağ: İlgili Kategorinin Litre ve Kg Değerleri */}
                  <div className="w-full lg:w-72 flex flex-col justify-center gap-1.5 border-t lg:border-t-0 lg:border-l border-border/60 pt-3 lg:pt-0 lg:pl-4 shrink-0">
                    {metrics.quantities.byCategory.map((cat: any, i: number) => (
                      <div 
                        key={i} 
                        className="flex items-center justify-between p-1.5 px-2.5 rounded-md border border-border/50 bg-muted/20 text-xs hover:bg-muted/40 transition-colors"
                      >
                        <span className="font-medium text-foreground truncate pr-2 max-w-[130px]" title={cat.category}>
                          {cat.category}
                        </span>
                        <div className="flex items-center gap-2 shrink-0 font-mono text-[11px] font-semibold">
                          <span className="text-cyan-600 dark:text-cyan-400" title="Sıvı Hacim">
                            {cat.liters.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L
                          </span>
                          <span className="text-muted-foreground/30 font-sans">&bull;</span>
                          <span className="text-indigo-600 dark:text-indigo-400" title="Katı Ağırlık">
                            {cat.kilograms.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-muted-foreground text-xs">
                  Kategori miktar verisi bulunmuyor.
                </div>
              )}
            </CardContent>
          </Card>

          {/* Son Bildirilen Olaylar Tablosu (Sade başlık) */}
          {metrics.incidents?.recent && metrics.incidents.recent.length > 0 && (
            <Card className="shadow-2xs border-border/70 overflow-hidden bg-card">
              <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-purple-500/10 flex items-center justify-center border border-purple-500/20 shrink-0">
                    <FileText className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  </div>
                  <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
                    Son Bildirilen Olağan Dışı Olaylar
                  </CardTitle>
                </div>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => navigate('/hazmat/incidents')}
                  className="h-7 text-xs px-2.5 gap-1 shadow-2xs"
                >
                  Tümünü Gör <ExternalLink className="w-3 h-3 text-muted-foreground" />
                </Button>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/30">
                      <TableHead className="text-xs w-[130px]">Tarih</TableHead>
                      <TableHead className="text-xs">Tesis</TableHead>
                      <TableHead className="text-xs">Olay Türü</TableHead>
                      <TableHead className="text-xs max-w-[260px]">Özet</TableHead>
                      <TableHead className="text-center text-xs">Kit</TableHead>
                      <TableHead className="text-center text-xs">Yaralı / Vefat</TableHead>
                      <TableHead className="text-right text-xs">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {metrics.incidents.recent.map((inc: any) => (
                      <TableRow 
                        key={inc.id}
                        className="cursor-pointer hover:bg-muted/30 transition-colors"
                        onClick={() => navigate(`/hazmat/incidents/view/${inc.id}`)}
                      >
                        <TableCell className="font-medium text-xs whitespace-nowrap text-muted-foreground">
                          {safeFormatDate(inc.incidentDate)}
                        </TableCell>
                        <TableCell className="text-xs font-semibold text-foreground">
                          {inc.facilityName}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none text-[10px]">
                            {inc.type}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs max-w-[260px] truncate text-muted-foreground">
                          {inc.mode || '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          {inc.kitUsed ? (
                            <Badge className="bg-blue-500/15 text-blue-600 dark:text-blue-400 border-none text-[10px]">
                              Kullanıldı
                            </Badge>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {inc.injuredCount > 0 || inc.deceasedCount > 0 ? (
                            <div className="flex items-center justify-center gap-1.5 text-xs">
                              {inc.injuredCount > 0 && <span className="text-orange-500 font-bold">{inc.injuredCount} Yaralı</span>}
                              {inc.deceasedCount > 0 && <span className="text-rose-600 font-bold">{inc.deceasedCount} Vefat</span>}
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">Yok</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-6 px-2 text-xs text-primary hover:text-primary gap-1"
                            onClick={() => navigate(`/hazmat/incidents/view/${inc.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5" /> İncele
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}
