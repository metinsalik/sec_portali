import { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { toast } from 'sonner';
import { 
  Users, 
  Clock, 
  UserPlus, 
  GitBranch, 
  Venus, 
  Mars, 
  Accessibility, 
  Baby, 
  Stethoscope, 
  GraduationCap, 
  Save, 
  History, 
  TrendingUp, 
  Building2,
  CalendarDays,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area,
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Legend
} from 'recharts';

interface HRDataDetails {
  totalWorkers: number;
  workHours: number;
  newJoiners: number;
  deptChangers: number;
  gender: {
    female: number;
    male: number;
  };
  specialPolicy: {
    disabled: number;
    pregnant: number;
    chronic: number;
    interns: number;
  };
}

interface HRData {
  id: number;
  facilityId: string;
  month: string;
  mainEmployerData: HRDataDetails;
  subContractorData: HRDataDetails;
  facility: { name: string };
  updatedAt: string;
}

const initialDetails: HRDataDetails = {
  totalWorkers: 0,
  workHours: 0,
  newJoiners: 0,
  deptChangers: 0,
  gender: { female: 0, male: 0 },
  specialPolicy: { disabled: 0, pregnant: 0, chronic: 0, interns: 0 }
};

export default function HRDataPage() {
  const queryClient = useQueryClient();
  const [selectedFacility, setSelectedFacility] = useState(localStorage.getItem('activeFacilityId') || '');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const currentYearStr = new Date().getFullYear().toString();
  const [dashboardYear, setDashboardYear] = useState(currentYearStr);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [targetGroup, setTargetGroup] = useState<'main' | 'sub'>('main');
  const [mainEmployerData, setMainEmployerData] = useState<HRDataDetails>(initialDetails);
  const [subContractorData, setSubContractorData] = useState<HRDataDetails>(initialDetails);

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

  const { data: settings } = useQuery<any>({
    queryKey: ['system-settings', dashboardYear === 'all' ? 2026 : parseInt(dashboardYear)],
    queryFn: async () => {
      const year = dashboardYear === 'all' ? '2026' : dashboardYear;
      const res = await api.get(`/settings/parameters?year=${year}`);
      if (!res.ok) throw new Error('Ayarlar yüklenemedi');
      return res.json();
    }
  });

  // Automatically select first facility
  useEffect(() => {
    if (facilities?.length > 0 && !selectedFacility) {
      setSelectedFacility(facilities[0].id);
    }
  }, [facilities, selectedFacility]);

  const { data: hrHistory, isLoading: isHistoryLoading } = useQuery<HRData[]>({
    queryKey: ['operations-hr-history', selectedFacility],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/operations/hr/${selectedFacility}/monthly`);
      if (!res.ok) throw new Error('Geçmiş veriler yüklenemedi');
      return res.json();
    },
    enabled: !!selectedFacility,
  });

  const currentMonthData = useMemo(() => {
    if (!isFormOpen) return null;
    return hrHistory?.find(d => d.month === selectedMonth);
  }, [hrHistory, selectedMonth, isFormOpen]);

  useEffect(() => {
    if (currentMonthData) {
      setMainEmployerData(currentMonthData.mainEmployerData || initialDetails);
      setSubContractorData(currentMonthData.subContractorData || initialDetails);
    } else {
      // If we are opening a new month, reset
      setMainEmployerData(initialDetails);
      setSubContractorData(initialDetails);
    }
  }, [currentMonthData, isFormOpen]);

  // Automatic calculation for work hours
  useEffect(() => {
    if (!settings || !isFormOpen) return;
    const monthNum = parseInt(selectedMonth.split('-')[1]);
    const workDays = settings.monthlyWorkDays?.[monthNum] || 0;
    const dailyHours = settings.dailyWorkHours || 7.5;

    if (workDays > 0) {
      setMainEmployerData(prev => ({
        ...prev,
        workHours: prev.totalWorkers * workDays * dailyHours
      }));
      setSubContractorData(prev => ({
        ...prev,
        workHours: prev.totalWorkers * workDays * dailyHours
      }));
    }
  }, [selectedMonth, settings, mainEmployerData.totalWorkers, subContractorData.totalWorkers, isFormOpen]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/operations/hr/${selectedFacility}/monthly`, {
        month: selectedMonth,
        mainEmployerData,
        subContractorData,
      });
      if (!res.ok) throw new Error('Kayıt hatası');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Personel verileri başarıyla kaydedildi');
      queryClient.invalidateQueries({ queryKey: ['operations-hr-history'] });
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      toast.error(error.message || 'Kayıt başarısız');
    },
  });

  const handleEdit = (month: string) => {
    setSelectedMonth(month);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setSelectedMonth(new Date().toISOString().slice(0, 7));
    setMainEmployerData(initialDetails);
    setSubContractorData(initialDetails);
    setIsFormOpen(true);
  };

  const availableYears = useMemo(() => {
    if (!hrHistory) return [currentYearStr];
    const years = new Set(hrHistory.map(h => h.month.split('-')[0]));
    years.add(currentYearStr);
    return Array.from(years).sort().reverse();
  }, [hrHistory, currentYearStr]);

  const kpiData = useMemo(() => {
    if (!hrHistory || hrHistory.length === 0) return null;
    
    let filtered = [...hrHistory];
    if (dashboardYear !== 'all') {
      filtered = filtered.filter(d => d.month.startsWith(dashboardYear));
    }
    
    if (filtered.length === 0) return null;
    
    filtered.sort((a, b) => a.month.localeCompare(b.month)); // Oldest to newest
    const latest = filtered[filtered.length - 1]; 
    
    let sumWorkHours = 0;
    let sumNewJoiners = 0;
    let sumDeptChangers = 0;
    
    filtered.forEach(d => {
      sumWorkHours += (d.mainEmployerData?.workHours || 0) + (d.subContractorData?.workHours || 0);
      sumNewJoiners += (d.mainEmployerData?.newJoiners || 0) + (d.subContractorData?.newJoiners || 0);
      sumDeptChangers += (d.mainEmployerData?.deptChangers || 0) + (d.subContractorData?.deptChangers || 0);
    });

    const getLatestSum = (field1: keyof HRDataDetails, field2?: any) => {
      if (field2) {
        return (latest.mainEmployerData?.[field1] as any)?.[field2] + (latest.subContractorData?.[field1] as any)?.[field2];
      }
      return (latest.mainEmployerData?.[field1] as number) + (latest.subContractorData?.[field1] as number);
    };

    return {
      totalWorkers: getLatestSum('totalWorkers') || 0,
      female: getLatestSum('gender', 'female') || 0,
      male: getLatestSum('gender', 'male') || 0,
      disabled: getLatestSum('specialPolicy', 'disabled') || 0,
      pregnant: getLatestSum('specialPolicy', 'pregnant') || 0,
      interns: getLatestSum('specialPolicy', 'interns') || 0,
      totalWorkHours: sumWorkHours,
      totalNewJoiners: sumNewJoiners,
      totalDeptChangers: sumDeptChangers,
      latestMonthStr: new Date(latest.month + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })
    };
  }, [hrHistory, dashboardYear]);

  const chartData = useMemo(() => {
    if (!hrHistory) return [];
    
    let filtered = [...hrHistory];
    if (dashboardYear !== 'all') {
      filtered = filtered.filter(d => d.month.startsWith(dashboardYear));
    }
    
    return filtered
      .sort((a, b) => a.month.localeCompare(b.month))
      .map(d => ({
        month: d.month,
        total: (d.mainEmployerData?.totalWorkers || 0) + (d.subContractorData?.totalWorkers || 0),
        mlpc: d.mainEmployerData?.totalWorkers || 0,
        sub: d.subContractorData?.totalWorkers || 0,
      }));
  }, [hrHistory, dashboardYear]);

  const hrByYear = useMemo(() => {
    if (!hrHistory) return [];
    let filtered = [...hrHistory];
    if (dashboardYear !== 'all') {
      filtered = filtered.filter(d => d.month.startsWith(dashboardYear));
    }
    
    const grouped: Record<string, HRData[]> = {};
    filtered.forEach(h => {
      const year = h.month.split('-')[0];
      if (!grouped[year]) grouped[year] = [];
      grouped[year].push(h);
    });
    
    return Object.keys(grouped).sort().reverse().map(year => ({
      year,
      months: grouped[year].sort((a, b) => b.month.localeCompare(a.month)) // newest first
    }));
  }, [hrHistory, dashboardYear]);

  const renderDataSection = (title: string, data: HRDataDetails, setData: (d: HRDataDetails) => void) => {
    const genderSum = (data.gender?.female || 0) + (data.gender?.male || 0);
    const isGenderMismatch = genderSum > 0 && genderSum !== data.totalWorkers;

    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              <Users className="w-4 h-4 text-primary" /> Toplam Çalışan
            </Label>
            <Input
              type="number"
              value={data.totalWorkers}
              onChange={(e) => {
                const total = parseInt(e.target.value) || 0;
                setData({ ...data, totalWorkers: total, gender: { ...data.gender, male: Math.max(0, total - (data.gender?.female || 0)) } });
              }}
              className={`bg-background font-bold text-lg h-12 ${isGenderMismatch ? 'border-amber-500 ring-amber-500' : ''}`}
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              <Clock className="w-4 h-4 text-primary" /> Toplam Saat
            </Label>
            <Input
              type="number"
              readOnly
              value={Math.round(data.workHours)}
              className="bg-muted font-mono text-primary/80 h-12"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              <UserPlus className="w-4 h-4 text-primary" /> Yeni Başlayan
            </Label>
            <Input
              type="number"
              value={data.newJoiners}
              onChange={(e) => setData({ ...data, newJoiners: parseInt(e.target.value) || 0 })}
              className="bg-background h-12"
            />
          </div>
          <div className="space-y-2">
            <Label className="flex items-center gap-2 font-semibold text-xs text-muted-foreground uppercase tracking-wider">
              <GitBranch className="w-4 h-4 text-primary" /> Bölüm Değişen
            </Label>
            <Input
              type="number"
              value={data.deptChangers}
              onChange={(e) => setData({ ...data, deptChangers: parseInt(e.target.value) || 0 })}
              className="bg-background h-12"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className={`bg-muted/20 border-dashed ${isGenderMismatch ? 'border-amber-500 shadow-sm shadow-amber-500/20' : 'border-border'}`}>
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center justify-between tracking-widest">
                <span>Cinsiyet Dağılımı</span>
                {isGenderMismatch && <AlertCircle className="w-4 h-4 text-amber-500 animate-pulse" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium flex items-center gap-1"><Venus className="w-3 h-3 text-muted-foreground" /> Kadın</Label>
                <Input
                  type="number"
                  value={data.gender?.female}
                  onChange={(e) => {
                    const female = parseInt(e.target.value) || 0;
                    const male = Math.max(0, data.totalWorkers - female);
                    setData({ ...data, gender: { female, male } });
                  }}
                  className="h-8 bg-background px-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium flex items-center gap-1"><Mars className="w-3 h-3 text-muted-foreground" /> Erkek</Label>
                <Input
                  type="number"
                  value={data.gender?.male}
                  onChange={(e) => {
                    const male = parseInt(e.target.value) || 0;
                    const female = Math.max(0, data.totalWorkers - male);
                    setData({ ...data, gender: { male, female } });
                  }}
                  className="h-8 bg-background px-2"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-muted/20 border-dashed border-border">
            <CardHeader className="py-3 px-4">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                Özel Politika Gerektiren
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium flex items-center gap-1"><Accessibility className="w-3 h-3 text-muted-foreground" /> Engelli</Label>
                <Input
                  type="number"
                  value={data.specialPolicy?.disabled}
                  onChange={(e) => setData({ ...data, specialPolicy: { ...data.specialPolicy, disabled: parseInt(e.target.value) || 0 } })}
                  className="h-8 bg-background px-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium flex items-center gap-1"><Baby className="w-3 h-3 text-muted-foreground" /> Hamile</Label>
                <Input
                  type="number"
                  value={data.specialPolicy?.pregnant}
                  onChange={(e) => setData({ ...data, specialPolicy: { ...data.specialPolicy, pregnant: parseInt(e.target.value) || 0 } })}
                  className="h-8 bg-background px-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium flex items-center gap-1"><Stethoscope className="w-3 h-3 text-muted-foreground" /> Kronik</Label>
                <Input
                  type="number"
                  value={data.specialPolicy?.chronic}
                  onChange={(e) => setData({ ...data, specialPolicy: { ...data.specialPolicy, chronic: parseInt(e.target.value) || 0 } })}
                  className="h-8 bg-background px-2"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] font-medium flex items-center gap-1"><GraduationCap className="w-3 h-3 text-muted-foreground" /> Stajyer</Label>
                <Input
                  type="number"
                  value={data.specialPolicy?.interns}
                  onChange={(e) => setData({ ...data, specialPolicy: { ...data.specialPolicy, interns: parseInt(e.target.value) || 0 } })}
                  className="h-8 bg-background px-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  if (isHistoryLoading && !facilities) return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-8 pb-12">
      {/* Top Header - Always Facility Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-card p-4 rounded-2xl border shadow-sm sticky top-0 z-20 backdrop-blur-md bg-card/80">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-primary/10 rounded-xl">
            <Building2 className="w-6 h-6 text-primary" />
          </div>
          <div className="space-y-0.5">
            <h1 className="text-xl font-bold tracking-tight">Personel Veri Portalı</h1>
            <p className="text-xs text-muted-foreground">Tesis bazlı aylık çalışan takibi ve analizi</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-background p-2 rounded-xl border shadow-sm">
            <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Yıl:</Label>
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
            <UserPlus className="w-4 h-4" /> Yeni Kayıt Ekle
          </Button>
        </div>
      </div>

      <div className="space-y-6 animate-in fade-in duration-500">
        
        {kpiData && (
          <div className="flex flex-col gap-2">
            <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider px-1">
              {dashboardYear === 'all' ? 'Tüm Zamanların Özeti' : `${dashboardYear} Yılı Özeti`} 
              <span className="text-[10px] font-normal lowercase ml-2">(Son Ay: {kpiData.latestMonthStr})</span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-9 gap-3">
              {[
                { label: 'Son Toplam Çalışan', value: kpiData.totalWorkers },
                { label: 'Toplam Çalışma Saati', value: Math.round(kpiData.totalWorkHours).toLocaleString('tr-TR') },
                { label: 'Kadın Çalışan', value: kpiData.female },
                { label: 'Erkek Çalışan', value: kpiData.male },
                { label: 'Yeni Başlayan (Dönem)', value: kpiData.totalNewJoiners },
                { label: 'Bölüm Değişen (Dönem)', value: kpiData.totalDeptChangers },
                { label: 'Engelli Çalışan', value: kpiData.disabled },
                { label: 'Hamile Çalışan', value: kpiData.pregnant },
                { label: 'Stajyer', value: kpiData.interns },
              ].map((kpi, i) => (
                <Card key={i} className="bg-primary/5 border-primary/20 shadow-sm col-span-1 flex items-center justify-center min-h-[90px]">
                  <CardContent className="p-3 flex flex-col items-center justify-center text-center space-y-1 w-full">
                    <p className="text-[10px] font-bold uppercase text-muted-foreground leading-tight">{kpi.label}</p>
                    <p className="text-xl font-black text-primary leading-none mt-1">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <Card className="shadow-sm border-border/50">
          <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
            <div>
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-emerald-500" /> Çalışan Değişim Trendi
              </CardTitle>
              <CardDescription>
                {dashboardYear === 'all' ? 'Tüm zamanların karşılaştırmalı verileri' : `${dashboardYear} yılı karşılaştırmalı verileri`}
              </CardDescription>
            </div>
          </CardHeader>
          <CardContent className="h-[400px] pt-8">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorMlpc" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSub" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                <Legend wrapperStyle={{ fontSize: '12px', paddingTop: '10px' }} />
                <Area type="monotone" dataKey="total" name="Toplam Çalışan" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                <Area type="monotone" dataKey="mlpc" name="Ana İşveren" stroke="#10b981" fillOpacity={1} fill="url(#colorMlpc)" strokeWidth={2} />
                <Area type="monotone" dataKey="sub" name="Alt Yüklenici" stroke="#f59e0b" fillOpacity={1} fill="url(#colorSub)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="shadow-sm border-border/50 flex flex-col">
          <CardHeader className="border-b bg-muted/10">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <History className="w-5 h-5 text-amber-500" /> Detaylı Veri Listesi
            </CardTitle>
            <CardDescription>Geçmiş kayıtları inceleyin veya düzenleyin</CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1">
            <div className="max-h-[500px] overflow-auto px-2 pt-2">
              <Accordion type="multiple" defaultValue={[currentYearStr]} className="w-full space-y-3">
                {hrByYear.map(({ year, months }) => (
                  <AccordionItem key={year} value={year} className="border rounded-xl bg-card overflow-hidden shadow-sm">
                    <AccordionTrigger className="hover:bg-muted/50 px-4 py-3 bg-muted/20 border-b">
                      <div className="flex items-center justify-between w-full pr-4">
                        <span className="font-bold text-sm">{year} Yılı Kayıtları</span>
                        <span className="text-xs font-normal text-muted-foreground bg-background px-2 py-1 rounded-full border shadow-sm">
                          {months.length} Ay Kaydı
                        </span>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-0">
                      <Accordion type="multiple" defaultValue={[new Date().toISOString().slice(0, 7)]} className="w-full">
                        {months.map((h) => (
                          <AccordionItem key={h.month} value={h.month} className="border-b last:border-none">
                            <AccordionTrigger className="hover:bg-muted/30 px-4 py-3 text-sm">
                              <div className="flex items-center justify-between w-full pr-2">
                                <span className="font-medium text-sm">{new Date(h.month + '-01').toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}</span>
                                <div className="flex items-center gap-4 text-xs font-normal">
                                  <span className="text-muted-foreground">
                                    Toplam: <strong className="text-primary">{(h.mainEmployerData?.totalWorkers || 0) + (h.subContractorData?.totalWorkers || 0)}</strong>
                                  </span>
                                  <Button 
                                    variant="secondary" 
                                    size="sm" 
                                    onClick={(e) => { e.stopPropagation(); handleEdit(h.month); }}
                                    className="text-[10px] h-6 px-3 shadow-sm font-bold"
                                  >
                                    Düzenle
                                  </Button>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent className="px-4 pb-4">
                              <div className="rounded-lg border bg-muted/10 overflow-hidden text-xs">
                                <Table>
                                  <TableHeader className="bg-muted/30">
                                    <TableRow>
                                      <TableHead className="font-semibold text-muted-foreground">Metrik</TableHead>
                                      <TableHead className="text-right font-semibold">Ana İşveren</TableHead>
                                      <TableHead className="text-right font-semibold">Alt Yüklenici</TableHead>
                                      <TableHead className="text-right font-bold text-primary">Toplam</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    <TableRow>
                                      <TableCell className="font-medium">Toplam Çalışan</TableCell>
                                      <TableCell className="text-right">{h.mainEmployerData?.totalWorkers || 0}</TableCell>
                                      <TableCell className="text-right">{h.subContractorData?.totalWorkers || 0}</TableCell>
                                      <TableCell className="text-right font-bold bg-primary/5">{(h.mainEmployerData?.totalWorkers || 0) + (h.subContractorData?.totalWorkers || 0)}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Toplam Saat</TableCell>
                                      <TableCell className="text-right">{Math.round(h.mainEmployerData?.workHours || 0)}</TableCell>
                                      <TableCell className="text-right">{Math.round(h.subContractorData?.workHours || 0)}</TableCell>
                                      <TableCell className="text-right font-bold bg-primary/5">{Math.round((h.mainEmployerData?.workHours || 0) + (h.subContractorData?.workHours || 0))}</TableCell>
                                    </TableRow>
                                    <TableRow>
                                      <TableCell className="font-medium">Kadın / Erkek</TableCell>
                                      <TableCell className="text-right">{h.mainEmployerData?.gender?.female || 0} / {h.mainEmployerData?.gender?.male || 0}</TableCell>
                                      <TableCell className="text-right">{h.subContractorData?.gender?.female || 0} / {h.subContractorData?.gender?.male || 0}</TableCell>
                                      <TableCell className="text-right font-bold bg-primary/5">
                                        {(h.mainEmployerData?.gender?.female || 0) + (h.subContractorData?.gender?.female || 0)} / {(h.mainEmployerData?.gender?.male || 0) + (h.subContractorData?.gender?.male || 0)}
                                      </TableCell>
                                    </TableRow>
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
                {hrByYear.length === 0 && (
                  <div className="text-center py-20 text-muted-foreground italic text-sm">
                    Kayıtlı veri bulunmuyor
                  </div>
                )}
              </Accordion>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Form Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              {currentMonthData ? 'Mevcut Veriyi Güncelle' : 'Yeni Ay Verisi Girişi'}
            </DialogTitle>
            <DialogDescription>
              Tüm alanları eksiksiz doldurduğunuzdan emin olun.
            </DialogDescription>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-muted/30 p-4 rounded-xl border mb-2">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kayıt Dönemi:</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="h-10 font-bold text-primary focus-visible:ring-0 bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Çalışan Grubu (Hedef):</Label>
              <Select value={targetGroup} onValueChange={(val: 'main' | 'sub') => setTargetGroup(val)}>
                <SelectTrigger className="h-10 bg-background font-bold text-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="main">Ana İşveren (MLPCARE)</SelectItem>
                  <SelectItem value="sub">Alt Yüklenici</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="p-4 sm:p-6 mt-2 border rounded-xl bg-card shadow-sm">
            {targetGroup === 'main' ? (
              <>
                <div className="mb-6 flex items-center gap-3 text-primary">
                  <Building2 className="w-6 h-6" />
                  <span className="text-lg font-extrabold tracking-tight">MLPCARE Kurumsal Veri Seti</span>
                </div>
                {renderDataSection('MLPCARE', mainEmployerData, setMainEmployerData)}
              </>
            ) : (
              <>
                <div className="mb-6 flex items-center gap-3 text-indigo-600">
                  <Users className="w-6 h-6" />
                  <span className="text-lg font-extrabold tracking-tight">Alt İşveren (Taşeron) Veri Seti</span>
                </div>
                {renderDataSection('SubContractor', subContractorData, setSubContractorData)}
              </>
            )}
          </div>

          <DialogFooter className="mt-6 border-t pt-6 gap-3">
            <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="hover:bg-destructive/10 hover:text-destructive font-bold">
              İptal
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={!selectedFacility || saveMutation.isPending}
              size="lg"
              className="shadow-xl shadow-primary/25 gap-2 font-bold"
            >
              {saveMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              {currentMonthData ? 'Güncellemeyi Kaydet' : 'Verileri Sisteme Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}