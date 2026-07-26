import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Save, Loader2, TrendingUp, UserPlus, AlertCircle } from 'lucide-react';
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

interface AccidentCategoryData {
  totalAccidents: number;
  severeAccidents: number;
  affectedWorkers: number;
  lostDayAccidents: number;
  nonLostDayAccidents: number;
  lostDays: number;
  nearMisses: number;
  occupationalDiseases: number;
}

const initialData: AccidentCategoryData = {
  totalAccidents: 0,
  severeAccidents: 0,
  affectedWorkers: 0,
  lostDayAccidents: 0,
  nonLostDayAccidents: 0,
  lostDays: 0,
  nearMisses: 0,
  occupationalDiseases: 0,
};

interface AccidentData {
  id: number;
  facilityId: string;
  month: string;
  mainEmployerData: AccidentCategoryData;
  subContractorData: AccidentCategoryData;
  internData: AccidentCategoryData;
}

const categoryLabels = {
  mainEmployerData: 'Ana İşveren (MLPCARE)',
  subContractorData: 'Alt Yüklenici',
  internData: 'Stajyer'
};

export default function AccidentsPage() {
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState(localStorage.getItem('activeFacilityId') || '');
  
  // Dashboard year filter
  const currentYearStr = new Date().getFullYear().toString();
  const [dashboardYear, setDashboardYear] = useState(currentYearStr);
  
  // Dialog State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [dialogMonth, setDialogMonth] = useState(new Date().toISOString().slice(0, 7));
  const [dialogCategory, setDialogCategory] = useState<'mainEmployerData' | 'subContractorData' | 'internData'>('mainEmployerData');
  const [dialogFormData, setDialogFormData] = useState<AccidentCategoryData>(initialData);

  useEffect(() => {
    const handleFacilityChange = () => {
      setSelectedFacility(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const { data: facilities } = useQuery({
    queryKey: ['operations-facilities'],
    queryFn: async () => {
      const res = await api.get('/operations/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  useEffect(() => {
    if (facilities?.length > 0 && !selectedFacility) {
      setSelectedFacility(facilities[0].id);
    }
  }, [facilities, selectedFacility]);

  const { data: accidentList, isLoading: isAccidentLoading } = useQuery<AccidentData[]>({
    queryKey: ['operations-accidents', selectedFacility],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/operations/accidents/${selectedFacility}/monthly`);
      if (!res.ok) throw new Error('Kaza verileri yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  const { data: hrList } = useQuery<any[]>({
    queryKey: ['operations-hr-history', selectedFacility],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/operations/hr/${selectedFacility}/monthly`);
      if (!res.ok) throw new Error('HR verileri yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  const settingsYear = dashboardYear === 'all' ? currentYearStr : dashboardYear;
  const { data: settings } = useQuery<any>({
    queryKey: ['system-settings', parseInt(settingsYear)],
    queryFn: async () => {
      const res = await api.get(`/settings/parameters?year=${settingsYear}`);
      if (!res.ok) return null;
      return res.json();
    }
  });

  // When dialog is open and month/category changes, load existing data if available
  useEffect(() => {
    if (isDialogOpen) {
      const existingData = accidentList?.find(a => a.month === dialogMonth);
      if (existingData && existingData[dialogCategory]) {
        setDialogFormData(existingData[dialogCategory]);
      } else {
        setDialogFormData(initialData);
      }
    }
  }, [isDialogOpen, dialogMonth, dialogCategory, accidentList]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const existingData = accidentList?.find(a => a.month === dialogMonth);
      const payload = {
        month: dialogMonth,
        mainEmployerData: existingData?.mainEmployerData || initialData,
        subContractorData: existingData?.subContractorData || initialData,
        internData: existingData?.internData || initialData,
      };
      payload[dialogCategory] = dialogFormData;

      const res = await api.post(`/operations/accidents/${selectedFacility}/monthly`, payload);
      if (!res.ok) throw new Error('Kayıt hatası');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Kaza verileri kaydedildi');
      queryClient.invalidateQueries({ queryKey: ['operations-accidents'] });
      setIsDialogOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kayıt başarısız');
    },
  });

  const handleEdit = (month: string) => {
    setDialogMonth(month);
    setDialogCategory('mainEmployerData');
    setIsDialogOpen(true);
  };

  const handleAddNew = () => {
    setDialogMonth(new Date().toISOString().slice(0, 7));
    setDialogCategory('mainEmployerData');
    setIsDialogOpen(true);
  };

  const fieldLabels: Record<keyof AccidentCategoryData, string> = {
    totalAccidents: 'Toplam Kaza Sayısı',
    severeAccidents: 'Ciddi Kaza Sayısı (4+ Gün)',
    affectedWorkers: 'Etkilenen Çalışan Sayısı',
    lostDayAccidents: 'Kayıp Günlü Kaza Sayısı',
    nonLostDayAccidents: 'Kayıp Günsüz Kaza Sayısı',
    lostDays: 'Kayıp Gün Sayısı',
    nearMisses: 'Ramak Kala Sayısı',
    occupationalDiseases: 'Meslek Hastalığı Sayısı'
  };

  const calculateKPIsForMonth = (month: string, accData: AccidentData | undefined, hrData: any) => {
    if (!accData || !hrData) return null;

    const monthNum = parseInt(month.split('-')[1]);
    const workDays = settings?.monthlyWorkDays?.[monthNum] || 22;
    const dailyHours = settings?.dailyWorkHours || 7.5;

    const mlpcHr = hrData.mainEmployerData?.totalWorkers || 0;
    const subHr = hrData.subContractorData?.totalWorkers || 0;
    const totalWorkers = mlpcHr + subHr;

    const getSum = (field: keyof AccidentCategoryData) => 
      (accData.mainEmployerData?.[field] || 0) + 
      (accData.subContractorData?.[field] || 0) + 
      (accData.internData?.[field] || 0);

    const totalAccidents = getSum('totalAccidents');
    const severeAccidents = getSum('severeAccidents');
    const lostDays = getSum('lostDays');
    const occDiseases = getSum('occupationalDiseases');
    
    const totalWorkingHours = totalWorkers * workDays * dailyHours;
    const totalWorkingDays = totalWorkers * workDays;

    if (totalWorkers === 0 || totalWorkingHours === 0) return null;

    return {
      ciddiKazaOrani: (severeAccidents * 100000) / totalWorkers,
      kayipGunOrani: (lostDays * 200000) / totalWorkingHours,
      kazaAgirlikOrani: (lostDays / totalWorkingHours) * 100000,
      devamsizlikOrani: totalWorkingDays > 0 ? (lostDays / totalWorkingDays) * 100 : 0,
      kazaSiklikOrani: (totalAccidents / totalWorkingHours) * 1000000,
      meslekiHastalikOrani: (occDiseases / totalWorkingHours) * 200000,
      kazaSiklikHizi: totalAccidents / totalWorkers
    };
  };

  const chartData = useMemo(() => {
    if (!accidentList || !hrList) return [];
    
    const months = Array.from(new Set([...accidentList.map(a => a.month), ...hrList.map(h => h.month)]));
    months.sort();

    return months.map(m => {
      const acc = accidentList.find(a => a.month === m);
      const hr = hrList.find(h => h.month === m);
      const kpis = calculateKPIsForMonth(m, acc, hr);
      return {
        month: m,
        ...kpis
      };
    }).filter(d => d.ciddiKazaOrani !== undefined);
  }, [accidentList, hrList, settings]);

  const availableYears = useMemo(() => {
    if (!accidentList) return [currentYearStr];
    const years = new Set(accidentList.map(a => a.month.split('-')[0]));
    years.add(currentYearStr);
    return Array.from(years).sort().reverse();
  }, [accidentList, currentYearStr]);

  const yearlyTotals = useMemo(() => {
    if (!accidentList) return { totalAccidents: 0, nearMisses: 0 };
    let totalAccidents = 0;
    let nearMisses = 0;
    
    const filteredList = dashboardYear === 'all' 
      ? accidentList 
      : accidentList.filter(a => a.month.startsWith(dashboardYear));

    filteredList.forEach(a => {
      const getSum = (field: keyof AccidentCategoryData) => 
        (a.mainEmployerData?.[field] || 0) + 
        (a.subContractorData?.[field] || 0) + 
        (a.internData?.[field] || 0);

      totalAccidents += getSum('totalAccidents');
      nearMisses += getSum('nearMisses');
    });

    return { totalAccidents, nearMisses };
  }, [accidentList, dashboardYear]);

  const filteredChartData = useMemo(() => {
    if (dashboardYear === 'all') return chartData;
    return chartData.filter(d => d.month.startsWith(dashboardYear));
  }, [chartData, dashboardYear]);

  const accidentsByYear = useMemo(() => {
    if (!accidentList) return [];
    const filtered = dashboardYear === 'all' 
      ? accidentList 
      : accidentList.filter(a => a.month.startsWith(dashboardYear));
      
    const grouped: Record<string, AccidentData[]> = {};
    filtered.forEach(a => {
      const year = a.month.split('-')[0];
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(a);
    });
    
    // Sort years descending
    return Object.keys(grouped).sort().reverse().map(year => ({
      year,
      months: grouped[year].sort((a, b) => b.month.localeCompare(a.month)) // newest month first
    }));
  }, [accidentList, dashboardYear]);

  // We calculate average KPI for the selected year (or all years) to show in summary cards
  const aggregatedKPI = useMemo(() => {
    if (!filteredChartData || filteredChartData.length === 0) return null;
    const count = filteredChartData.length;
    const sum = (key: string) => filteredChartData.reduce((acc, curr) => acc + (curr[key] || 0), 0);
    
    return {
      ciddiKazaOrani: sum('ciddiKazaOrani') / count,
      kayipGunOrani: sum('kayipGunOrani') / count,
      kazaAgirlikOrani: sum('kazaAgirlikOrani') / count,
      devamsizlikOrani: sum('devamsizlikOrani') / count,
      kazaSiklikOrani: sum('kazaSiklikOrani') / count,
      meslekiHastalikOrani: sum('meslekiHastalikOrani') / count,
      kazaSiklikHizi: sum('kazaSiklikHizi') / count,
    };
  }, [filteredChartData]);

  if (isAccidentLoading && !facilities) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-4 rounded-2xl border shadow-sm sticky top-0 z-20 backdrop-blur-md bg-card/80">
        <div>
          <h1 className="text-2xl font-bold">Kaza İstatistikleri & KPI</h1>
          <p className="text-sm text-muted-foreground">İş kazaları girişleri ve İSG performans oranları</p>
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2 bg-background p-2 rounded-xl border shadow-sm">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Gösterim Yılı:</Label>
            <Select value={dashboardYear} onValueChange={setDashboardYear}>
              <SelectTrigger className="w-32 h-8 border-none shadow-none font-bold text-primary focus-visible:ring-0">
                <SelectValue>{dashboardYear === 'all' ? 'Tüm Yıllar' : dashboardYear}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {availableYears.map(year => (
                  <SelectItem key={year} value={year}>{year}</SelectItem>
                ))}
                <SelectItem value="all">Tüm Yıllar</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleAddNew} className="gap-2 shadow-lg shadow-primary/20 h-10 px-6">
            <UserPlus className="w-4 h-4" /> Aylık Veri Girişi
          </Button>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in duration-500">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Sol Taraf: KPI Kartları */}
          <div className="lg:col-span-4 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
              KPI Özet ({dashboardYear === 'all' ? 'Tüm Zamanlar Ortalaması' : dashboardYear + ' Yılı Ortalaması'})
            </h2>
            {aggregatedKPI ? (
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: dashboardYear === 'all' ? 'Toplam Kaza' : `Yıllık Kaza (${dashboardYear})`, value: yearlyTotals.totalAccidents, suffix: '' },
                  { label: dashboardYear === 'all' ? 'Toplam Ramak Kala' : `Yıllık R. Kala (${dashboardYear})`, value: yearlyTotals.nearMisses, suffix: '' },
                  { label: 'Ort. Ciddi Kaza Oranı', value: aggregatedKPI.ciddiKazaOrani.toFixed(2), suffix: '' },
                  { label: 'Ort. Kayıp Gün Oranı', value: aggregatedKPI.kayipGunOrani.toFixed(2), suffix: '' },
                  { label: 'Ort. Kaza Ağırlık Oranı', value: aggregatedKPI.kazaAgirlikOrani.toFixed(2), suffix: '' },
                  { label: 'Ort. Devamsızlık Oranı', value: aggregatedKPI.devamsizlikOrani.toFixed(2), suffix: '%' },
                  { label: 'Ort. Kaza Sıklık Oranı', value: aggregatedKPI.kazaSiklikOrani.toFixed(2), suffix: '' },
                  { label: 'Ort. Mesleki Has. Oranı', value: aggregatedKPI.meslekiHastalikOrani.toFixed(2), suffix: '' },
                  { label: 'Ort. Kaza Sıklık Hızı', value: aggregatedKPI.kazaSiklikHizi.toFixed(3), suffix: '' },
                ].map((kpi, i) => (
                  <Card key={i} className="bg-primary/5 border-primary/20 shadow-sm col-span-1 flex items-center justify-center min-h-[90px]">
                    <CardContent className="p-3 flex flex-col items-center justify-center text-center space-y-1 w-full">
                      <p className="text-[10px] font-bold uppercase text-muted-foreground leading-tight">{kpi.label}</p>
                      <p className="text-xl font-black text-primary leading-none mt-1">{kpi.value} <span className="text-xs font-normal">{kpi.suffix}</span></p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="h-full border border-dashed rounded-xl flex items-center justify-center text-muted-foreground text-sm p-8 bg-muted/10">
                Seçili döneme ait KPI verisi bulunamadı
              </div>
            )}
          </div>

          {/* Sağ Taraf: Trend Grafiği */}
          <div className="lg:col-span-8 flex flex-col gap-4">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
              KPI Trendi
            </h2>
            <Card className="shadow-sm border-border/50 h-full min-h-[350px]">
              <CardHeader className="border-b bg-muted/10 py-3">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" /> Seçili Dönem Oran Değişimleri
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-6 h-[400px]">
                 <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={filteredChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
          </div>
        </div>

        {/* Alt Kısım: Detaylı Tablo */}
        <div className="pt-4">
          <Card className="shadow-sm border-border/50">
            <CardHeader className="border-b bg-muted/10 py-4">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-amber-500" /> Detaylı Kayıt Listesi {dashboardYear !== 'all' && `(${dashboardYear})`}
              </CardTitle>
              <CardDescription>Meydana gelen olayların detaylı dökümü</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="max-h-[600px] overflow-auto px-2">
                <Accordion type="multiple" defaultValue={[currentYearStr]} className="w-full space-y-4">
                  {accidentsByYear.map(({ year, months }) => (
                    <AccordionItem key={year} value={year} className="border rounded-xl bg-card overflow-hidden shadow-sm">
                      <AccordionTrigger className="hover:bg-muted/50 px-6 py-4 bg-muted/20 border-b">
                        <div className="flex items-center justify-between w-full pr-4">
                          <span className="font-black text-lg">{year} Yılı Kayıtları</span>
                          <span className="text-sm font-normal text-muted-foreground bg-background px-3 py-1 rounded-full border shadow-sm">
                            {months.length} Ay Kaydı
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="p-0">
                        <Accordion type="multiple" defaultValue={[new Date().toISOString().slice(0, 7)]} className="w-full">
                          {months.map((a) => (
                            <AccordionItem key={a.month} value={a.month} className="border-b last:border-none">
                              <AccordionTrigger className="hover:bg-muted/30 px-6 py-4">
                                <div className="flex items-center justify-between w-full pr-4">
                                  <span className="font-bold text-base">{new Date(a.month + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                                  <div className="flex items-center gap-6 text-sm font-normal">
                                    <span className="text-muted-foreground">
                                      Toplam Kaza: <strong className="text-primary text-base">{(a.mainEmployerData?.totalAccidents || 0) + (a.subContractorData?.totalAccidents || 0) + (a.internData?.totalAccidents || 0)}</strong>
                                    </span>
                                    <Button 
                                      variant="secondary" 
                                      size="sm" 
                                      onClick={(e) => { e.stopPropagation(); handleEdit(a.month); }}
                                      className="text-xs font-bold px-4 shadow-sm h-8"
                                    >
                                      Düzenle
                                    </Button>
                                  </div>
                                </div>
                              </AccordionTrigger>
                              <AccordionContent className="px-6 pb-6 pt-2">
                                <div className="rounded-xl border bg-muted/10 overflow-hidden shadow-inner">
                                  <Table>
                                    <TableHeader className="bg-muted/30">
                                      <TableRow>
                                        <TableHead className="w-[30%] text-xs font-bold uppercase tracking-wider text-muted-foreground">Kaza / Olay Metrikleri</TableHead>
                                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Ana İşveren</TableHead>
                                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Alt Yüklenici</TableHead>
                                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider">Stajyer</TableHead>
                                        <TableHead className="text-center text-xs font-bold uppercase tracking-wider text-primary">Toplam</TableHead>
                                      </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                      {(Object.keys(fieldLabels) as Array<keyof AccidentCategoryData>).map((field) => {
                                        const main = a.mainEmployerData?.[field] || 0;
                                        const sub = a.subContractorData?.[field] || 0;
                                        const intern = a.internData?.[field] || 0;
                                        const total = main + sub + intern;
                                        
                                        return (
                                          <TableRow key={field} className="hover:bg-muted/20 transition-colors">
                                            <TableCell className="font-medium text-[11px] text-muted-foreground uppercase">{fieldLabels[field]}</TableCell>
                                            <TableCell className="text-center font-bold text-sm">{main}</TableCell>
                                            <TableCell className="text-center font-bold text-sm">{sub}</TableCell>
                                            <TableCell className="text-center font-bold text-sm">{intern}</TableCell>
                                            <TableCell className="text-center font-black text-sm text-primary bg-primary/5">{total}</TableCell>
                                          </TableRow>
                                        );
                                      })}
                                    </TableBody>
                                  </Table>
                                </div>
                              </AccordionContent>
                            </AccordionItem>
                          ))}
                        </Accordion>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                  {accidentsByYear.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground italic text-sm">
                      Kayıtlı veri bulunmuyor
                    </div>
                  )}
                </Accordion>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Data Entry Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Kaza İstatistiği Veri Girişi</DialogTitle>
            <DialogDescription>
              İlgili dönem ve çalışan grubunu seçerek verileri girebilirsiniz. 
              Diğer çalışan grupları için kayıt işlemini tekrarlayın.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border mb-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kayıt Dönemi</Label>
              <Input
                type="month"
                value={dialogMonth}
                onChange={(e) => setDialogMonth(e.target.value)}
                className="font-bold text-primary bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Çalışan Grubu (Hedef)</Label>
              <Select value={dialogCategory} onValueChange={(val: any) => setDialogCategory(val)}>
                <SelectTrigger className="font-bold bg-background">
                  <SelectValue placeholder="Çalışan Grubu Seçin">
                    {categoryLabels[dialogCategory]}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mainEmployerData">Ana İşveren (MLPCARE)</SelectItem>
                  <SelectItem value="subContractorData">Alt Yüklenici</SelectItem>
                  <SelectItem value="internData">Stajyer</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 py-4">
            {(Object.keys(fieldLabels) as Array<keyof AccidentCategoryData>).map((field) => (
              <div key={field} className="space-y-2">
                <Label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{fieldLabels[field]}</Label>
                <Input
                  type="number"
                  value={dialogFormData[field]}
                  onChange={(e) => setDialogFormData({ ...dialogFormData, [field]: parseInt(e.target.value) || 0 })}
                  className="bg-background h-11 font-bold text-lg"
                />
              </div>
            ))}
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="ghost" onClick={() => setIsDialogOpen(false)} disabled={saveMutation.isPending}>
              İptal
            </Button>
            <Button 
              onClick={() => saveMutation.mutate()} 
              disabled={saveMutation.isPending}
              className="gap-2 px-8 shadow-md"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {categoryLabels[dialogCategory]} Verilerini Kaydet
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

    </div>
  );
}