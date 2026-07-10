import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Package, MapPin, AlertTriangle, ShieldAlert, FileText, CheckCircle, Activity } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function HazmatDashboardPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const navigate = useNavigate();

  const { data: metrics, isLoading, isError } = useQuery({
    queryKey: ['hazmat-dashboard', facilityId],
    queryFn: async () => {
      if (!facilityId) return null;
      const res = await api.get(`/hazmat/dashboard?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Failed to fetch dashboard metrics');
      return res.json();
    },
    enabled: !!facilityId
  });

  if (!facilityId) {
    return <div className="p-8 text-center text-muted-foreground">Lütfen bir tesis seçin.</div>;
  }

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Skeleton className="h-80 w-full" />
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (isError || !metrics) {
    return <div className="p-8 text-center text-red-500">Veriler yüklenirken bir hata oluştu.</div>;
  }

  const { inventory, spillKits, eyewash } = metrics;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Tehlikeli Madde Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Tesisinizdeki tehlikeli madde envanterini, kitleri ve risk analizlerini tek ekrandan takip edin.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/hazmat/materials')}>Envanter</Button>
          <Button variant="outline" onClick={() => navigate('/hazmat/spill-kits')}>Dökülme Kitleri</Button>
          <Button variant="outline" onClick={() => navigate('/hazmat/eyewash/risks')}>Göz Duşu Risk</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Inventory KPI */}
        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Kayıtlı Tehlikeli Madde</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-blue-700 dark:text-blue-400">{inventory.materialsCount}</h3>
                  <span className="text-sm text-muted-foreground">çeşit</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <Package className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              <MapPin className="w-3 h-3 mr-1" /> {inventory.departmentsCount} farklı departmanda kullanılıyor
            </div>
          </CardContent>
        </Card>

        {/* Spill Kits KPI */}
        <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-indigo-950 dark:to-slate-900 border-indigo-100 dark:border-indigo-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Sahadaki Aktif Kitler</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-indigo-700 dark:text-indigo-400">{spillKits.activePlacementsCount}</h3>
                  <span className="text-sm text-muted-foreground">adet</span>
                </div>
              </div>
              <div className="p-3 bg-indigo-100 dark:bg-indigo-900/50 rounded-full">
                <Activity className="w-6 h-6 text-indigo-600 dark:text-indigo-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              <FileText className="w-3 h-3 mr-1" /> {spillKits.templatesCount} farklı şablondan üretildi
            </div>
          </CardContent>
        </Card>

        {/* Action Needed KPI */}
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-900 border-red-100 dark:border-red-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Müdahale Bekleyen Kitler</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-red-600 dark:text-red-400">{spillKits.needsInterventionCount}</h3>
                  <span className="text-sm text-muted-foreground">adet</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              {spillKits.needsInterventionCount === 0 ? (
                <span className="text-green-600 flex items-center"><CheckCircle className="w-3 h-3 mr-1" /> Tümü sorunsuz</span>
              ) : (
                <span className="text-red-600 font-medium">Acil kontrol veya ikmal gerekli</span>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Incidents KPI */}
        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-slate-900 border-orange-100 dark:border-orange-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Olay Kayıtları (Son 30 Gün)</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-orange-600 dark:text-orange-400">{spillKits.incidentsLast30Days}</h3>
                  <span className="text-sm text-muted-foreground">olay</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                <ShieldAlert className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              <Activity className="w-3 h-3 mr-1" /> Dökülme / Saçılma bildirimleri
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Eyewash Risk Distribution Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Göz Duşu Risk Analiz Dağılımı</CardTitle>
            <CardDescription>Toplam {eyewash.totalAnalyses} bölgede yapılan kimyasal ve biyolojik risk analizi sonuçları.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {eyewash.totalAnalyses > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={eyewash.riskDistribution} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} />
                  <YAxis axisLine={false} tickLine={false} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <Bar dataKey="Kimyasal" name="Kimyasal Risk" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={40} />
                  <Bar dataKey="Biyolojik" name="Biyolojik Risk" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Henüz risk analizi verisi yok.</div>
            )}
          </CardContent>
        </Card>

        {/* Incidents Pie Chart */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Olay Türleri Dağılımı</CardTitle>
            <CardDescription>Son 30 gün içinde kaydedilen dökülme ve saçılma olaylarının tür bazında dağılımı.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {spillKits.incidentDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={spillKits.incidentDistribution}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {spillKits.incidentDistribution.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center flex-col gap-3 text-muted-foreground">
                <ShieldAlert className="w-12 h-12 text-gray-300" />
                <p>Son 30 günde kaydedilmiş olay bulunmuyor.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
