import { useEffect, useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Users, AlertTriangle, FileText, CheckCircle2, XCircle, TrendingUp } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from 'recharts';

export default function OperationsDashboard() {
  const { user } = useAuth();
  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('management');
  const [selectedFacility, setSelectedFacility] = useState(localStorage.getItem('activeFacilityId') || '');
  const [year, setYear] = useState(new Date().getFullYear().toString());

  useEffect(() => {
    const handleFacilityChange = () => {
      setSelectedFacility(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const { data, isLoading } = useQuery<any>({
    queryKey: ['operations-dashboard', selectedFacility],
    queryFn: async () => {
      const url = selectedFacility && selectedFacility !== 'all' && !isAdmin
        ? `/operations/dashboard?facilityId=${selectedFacility}`
        : `/operations/dashboard`;
      const res = await api.get(url);
      if (!res.ok) throw new Error('Dashboard yüklenemedi');
      return res.json();
    },
  });

  const { data: analyticsData } = useQuery<any>({
    queryKey: ['operations-analytics', year],
    queryFn: async () => {
      const res = await api.get(`/operations/analytics/kpi?year=${year}`);
      if (!res.ok) throw new Error('Analytics failed');
      return res.json();
    },
    enabled: isAdmin
  });

  const { data: settings } = useQuery<any>({
    queryKey: ['system-settings', year],
    queryFn: async () => {
      const res = await api.get(`/settings/parameters?year=${year}`);
      if (!res.ok) return null;
      return res.json();
    }
  });

  const kpiChartData = useMemo(() => {
    if (!analyticsData || !settings) return [];
    
    const { hrData, accidentData } = analyticsData;
    const months = Array.from(new Set([...hrData.map((h:any) => h.month), ...accidentData.map((a:any) => a.month)])) as string[];
    months.sort();

    return months.map(month => {
      const monthNum = parseInt(month.split('-')[1]);
      const workDays = settings.monthlyWorkDays?.[monthNum] || 22;
      const dailyHours = settings.dailyWorkHours || 7.5;

      const hrsForMonth = hrData.filter((h:any) => h.month === month);
      const accsForMonth = accidentData.filter((a:any) => a.month === month);

      let totalWorkers = 0;
      let totalAccidents = 0;
      let severeAccidents = 0;
      let lostDays = 0;
      let occDiseases = 0;

      hrsForMonth.forEach((h:any) => {
        totalWorkers += (h.mainEmployerData?.totalWorkers || 0) + (h.subContractorData?.totalWorkers || 0);
      });

      accsForMonth.forEach((a:any) => {
        const getSum = (field: string) => 
          (a.mainEmployerData?.[field] || 0) + 
          (a.subContractorData?.[field] || 0) + 
          (a.internData?.[field] || 0);

        totalAccidents += getSum('totalAccidents');
        severeAccidents += getSum('severeAccidents');
        lostDays += getSum('lostDays');
        occDiseases += getSum('occupationalDiseases');
      });

      const totalWorkingHours = totalWorkers * workDays * dailyHours;
      const totalWorkingDays = totalWorkers * workDays;

      if (totalWorkers === 0 || totalWorkingHours === 0) return null;

      return {
        month,
        ciddiKazaOrani: (severeAccidents * 100000) / totalWorkers,
        kayipGunOrani: (lostDays * 200000) / totalWorkingHours,
        kazaAgirlikOrani: (lostDays / totalWorkingHours) * 100000,
        devamsizlikOrani: totalWorkingDays > 0 ? (lostDays / totalWorkingDays) * 100 : 0,
        kazaSiklikOrani: (totalAccidents / totalWorkingHours) * 1000000,
        meslekiHastalikOrani: (occDiseases / totalWorkingHours) * 200000,
        kazaSiklikHizi: totalAccidents / totalWorkers
      };
    }).filter(x => x !== null);
  }, [analyticsData, settings]);

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  const currentMonthStr = data?.currentMonth
    ? new Date(data.currentMonth + '-01').toLocaleDateString('tr-TR', { year: 'numeric', month: 'long' })
    : '...';

  const latestKPI = kpiChartData.length > 0 ? kpiChartData[kpiChartData.length - 1] : null;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-2xl font-bold">Operasyon Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            {year === 'all' ? 'Tüm zamanların özeti' : `${year} yılı özeti`}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-background p-2 rounded-xl border shadow-sm w-fit">
          <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Gösterim Yılı:</Label>
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32 h-8 border-none shadow-none font-bold text-primary focus-visible:ring-0">
              <SelectValue>{year === 'all' ? 'Tüm Yıllar' : year}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}</SelectItem>
              <SelectItem value="all">Tüm Yıllar</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {data?.isAdminView ? (
        // ADMIN DASHBOARD
        <div className="space-y-6">
          {latestKPI && (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4 animate-in fade-in">
              {[
                { label: 'Ciddi Kaza Oranı', value: latestKPI.ciddiKazaOrani.toFixed(2), suffix: '' },
                { label: 'Kayıp Gün Oranı', value: latestKPI.kayipGunOrani.toFixed(2), suffix: '' },
                { label: 'Kaza Ağırlık Oranı', value: latestKPI.kazaAgirlikOrani.toFixed(2), suffix: '' },
                { label: 'Devamsızlık Oranı', value: latestKPI.devamsizlikOrani.toFixed(2), suffix: '%' },
                { label: 'Kaza Sıklık Oranı', value: latestKPI.kazaSiklikOrani.toFixed(2), suffix: '' },
                { label: 'Mesleki Has. Oranı', value: latestKPI.meslekiHastalikOrani.toFixed(2), suffix: '' },
                { label: 'Kaza Sıklık Hızı', value: latestKPI.kazaSiklikHizi.toFixed(3), suffix: '' },
              ].map((kpi, i) => (
                <Card key={i} className="bg-primary/5 border-primary/20 shadow-sm">
                  <CardContent className="p-4 flex flex-col items-center justify-center text-center space-y-1">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground">{kpi.label}</p>
                    <p className="text-xl font-black text-primary">{kpi.value} <span className="text-sm font-normal">{kpi.suffix}</span></p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {kpiChartData.length > 0 && (
            <Card className="shadow-sm border-border/50">
              <CardHeader className="border-b bg-muted/10">
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-primary" /> Yıllık Global KPI Trend Grafiği (Tüm Tesisler)
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 h-[350px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={kpiChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                      <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                      <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                      <Line type="monotone" dataKey="kazaSiklikOrani" name="Kaza Sıklık Oranı" stroke="#f43f5e" strokeWidth={3} dot={{r:4}} />
                      <Line type="monotone" dataKey="ciddiKazaOrani" name="Ciddi Kaza Oranı" stroke="#10b981" strokeWidth={2} dot={{r:3}} />
                      <Line type="monotone" dataKey="kazaAgirlikOrani" name="Kaza Ağırlık Oranı" stroke="#3b82f6" strokeWidth={2} dot={{r:3}} />
                    </LineChart>
                  </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Toplam Tesis</p>
                  <Building2 className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-3xl font-bold mt-2">{data.totalFacilities}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Bu Ay HR Giren Tesisler</p>
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold mt-2">{data.hrDataSubmittedThisMonth}</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Bu Ay Kaza Giren Tesisler</p>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-3xl font-bold mt-2">{data.accidentDataSubmittedThisMonth}</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Tesislerin Veri Giriş Durumu ({currentMonthStr})</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Tesis Adı</TableHead>
                    <TableHead className="text-center">Aylık Personel Verisi</TableHead>
                    <TableHead className="text-center">Kaza İstatistikleri</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.facilitiesStatus?.map((f: any) => (
                    <TableRow key={f.id}>
                      <TableCell className="font-medium">{f.name}</TableCell>
                      <TableCell className="text-center">
                        {f.hasHrData ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
                      </TableCell>
                      <TableCell className="text-center">
                        {f.hasAccidentData ? <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" /> : <XCircle className="w-5 h-5 text-red-500 mx-auto" />}
                      </TableCell>
                    </TableRow>
                  ))}
                  {data.facilitiesStatus?.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground py-8">Tesis bulunamadı.</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      ) : (
        // EXPERT DASHBOARD
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Bu Ay Toplam Çalışan</p>
                  <Users className="w-4 h-4 text-emerald-500" />
                </div>
                <p className="text-3xl font-bold mt-2">{data?.totalWorkersThisMonth || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {data?.hasHrDataThisMonth ? 'Veri girildi' : 'Henüz veri girilmedi'}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-muted-foreground">Bu Ay Toplam Kaza</p>
                  <AlertTriangle className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-3xl font-bold mt-2">{data?.totalAccidentsThisMonth || 0}</p>
                <p className="text-xs text-muted-foreground mt-2">
                  {data?.hasAccidentDataThisMonth ? 'Veri girildi' : 'Henüz veri girilmedi'}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Yardım</CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-muted-foreground space-y-2">
              <p>
                <FileText className="w-4 h-4 inline mr-2" />
                <strong>Aylık Personel Verisi:</strong> Sol menüden her ay için çalışan sayılarınızı güncelleyebilirsiniz.
              </p>
              <p>
                <FileText className="w-4 h-4 inline mr-2" />
                <strong>Kaza İstatistikleri:</strong> Meydana gelen iş kazaları ve yaralanma kayıtlarını işleyebilirsiniz.
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}