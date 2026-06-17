import React from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import { Flame, MapPin, AlertTriangle, PenTool, CheckCircle, Plus, QrCode } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

export default function FireEquipmentDashboard() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const navigate = useNavigate();

  const { data: equipment, isLoading, isError } = useQuery({
    queryKey: ['fire-equipment', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fire-equipment/equipment/${facilityId}`);
      if (!res.ok) throw new Error('Failed to fetch fire equipment');
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

  if (isError || !equipment) {
    return <div className="p-8 text-center text-red-500">Veriler yüklenirken bir hata oluştu.</div>;
  }

  // Calculate Metrics
  const totalEquipment = equipment.length;
  const activeEquipment = equipment.filter((e: any) => e.status === 'AKTIF').length;
  
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
  
  const needingMaintenance = equipment.filter((e: any) => {
    if (!e.nextMaintenanceDate) return true;
    return new Date(e.nextMaintenanceDate) < nextMonth;
  }).length;

  const faultyEquipment = equipment.filter((e: any) => e.status === 'ARIZALI').length;

  // Chart Data preparation
  const categoryMap: Record<string, number> = {};
  const statusMap: Record<string, number> = {};

  equipment.forEach((e: any) => {
    const catName = e.category?.name || 'Diğer';
    categoryMap[catName] = (categoryMap[catName] || 0) + 1;
    
    const statusName = e.status;
    statusMap[statusName] = (statusMap[statusName] || 0) + 1;
  });

  const categoryData = Object.keys(categoryMap).map(k => ({ name: k, value: categoryMap[k] }));
  const statusData = Object.keys(statusMap).map(k => ({ name: k, value: statusMap[k] }));

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-12 p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Yangın Ekipmanları Yönetimi</h1>
          <p className="text-muted-foreground mt-1">Yangın tüpleri, dolapları ve sistemlerinin envanter ve bakım takibi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => navigate('/fire-equipment/scanner')} className="hidden md:flex">
            <QrCode className="w-4 h-4 mr-2" /> QR Tara
          </Button>
          <Button variant="outline" onClick={() => navigate('/fire-equipment/list')}>Tüm Envanter</Button>
          <Button onClick={() => navigate('/fire-equipment/new')} className="bg-red-600 hover:bg-red-700 text-white border-0">
            <Plus className="w-4 h-4 mr-2" /> Yeni Ekipman Ekle
          </Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-red-50 to-white dark:from-red-950 dark:to-slate-900 border-red-100 dark:border-red-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Toplam Ekipman</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-red-600 dark:text-red-400">{totalEquipment}</h3>
                  <span className="text-sm text-muted-foreground">adet</span>
                </div>
              </div>
              <div className="p-3 bg-red-100 dark:bg-red-900/50 rounded-full">
                <Flame className="w-6 h-6 text-red-600 dark:text-red-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              <CheckCircle className="w-3 h-3 mr-1 text-green-500" /> {activeEquipment} tanesi aktif kullanımda
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-white dark:from-orange-950 dark:to-slate-900 border-orange-100 dark:border-orange-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Yaklaşan Bakımlar</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-orange-600 dark:text-orange-400">{needingMaintenance}</h3>
                  <span className="text-sm text-muted-foreground">ekipman</span>
                </div>
              </div>
              <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-full">
                <PenTool className="w-6 h-6 text-orange-600 dark:text-orange-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              <AlertTriangle className="w-3 h-3 mr-1 text-orange-500" /> Son 30 gün içinde bakımı gelen/geciken
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-rose-50 to-white dark:from-rose-950 dark:to-slate-900 border-rose-100 dark:border-rose-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Arızalı Ekipmanlar</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-rose-600 dark:text-rose-400">{faultyEquipment}</h3>
                  <span className="text-sm text-muted-foreground">adet</span>
                </div>
              </div>
              <div className="p-3 bg-rose-100 dark:bg-rose-900/50 rounded-full">
                <AlertTriangle className="w-6 h-6 text-rose-600 dark:text-rose-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              Aksiyon alınması gerekenler
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-white dark:from-blue-950 dark:to-slate-900 border-blue-100 dark:border-blue-900 shadow-sm hover:shadow-md transition-shadow">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground">Lokasyon Dağılımı</p>
                <div className="flex items-baseline gap-2">
                  <h3 className="text-4xl font-black text-blue-700 dark:text-blue-400">
                    {new Set(equipment.map((e: any) => e.locationId).filter(Boolean)).size}
                  </h3>
                  <span className="text-sm text-muted-foreground">bölge</span>
                </div>
              </div>
              <div className="p-3 bg-blue-100 dark:bg-blue-900/50 rounded-full">
                <MapPin className="w-6 h-6 text-blue-600 dark:text-blue-300" />
              </div>
            </div>
            <div className="mt-4 text-xs text-muted-foreground flex items-center">
              Farklı lokasyonlarda ekipman bulunuyor
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Kategoriye Göre Ekipman Dağılımı</CardTitle>
            <CardDescription>Tesisinizdeki yangın ekipmanlarının türlerine göre oransal dağılımı.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    innerRadius={70}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                    label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    labelLine={false}
                  >
                    {categoryData.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <RechartsTooltip contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Legend verticalAlign="bottom" height={36} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Kayıtlı veri yok.</div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg">Ekipman Durum Dağılımı</CardTitle>
            <CardDescription>Sistemdeki tüm ekipmanların mevcut durumları.</CardDescription>
          </CardHeader>
          <CardContent className="h-80">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={statusData} margin={{ top: 20, right: 30, left: 0, bottom: 5 }} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#e5e7eb" />
                  <XAxis type="number" axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={120} />
                  <RechartsTooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                  <Bar dataKey="value" name="Miktar" fill="#ef4444" radius={[0, 4, 4, 0]} barSize={30} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-muted-foreground">Kayıtlı veri yok.</div>
            )}
          </CardContent>
        </Card>
      </div>


      {/* Mobile Floating QR Scanner Button */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        <Button 
          size="lg" 
          className="rounded-full shadow-xl bg-red-600 hover:bg-red-700 text-white px-6 h-14 flex items-center gap-2"
          onClick={() => navigate('/fire-equipment/scanner')}
        >
          <QrCode className="w-6 h-6" />
          <span className="font-bold text-base">QR Okut</span>
        </Button>
      </div>
    </div>
  );
}
