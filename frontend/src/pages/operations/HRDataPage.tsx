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
  ChevronRight
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  AreaChart, 
  Area 
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
  const [selectedFacility, setSelectedFacility] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [mainEmployerData, setMainEmployerData] = useState<HRDataDetails>(initialDetails);
  const [subContractorData, setSubContractorData] = useState<HRDataDetails>(initialDetails);

  const { data: facilities } = useQuery({
    queryKey: ['operations-facilities'],
    queryFn: async () => {
      const res = await api.get('/operations/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  const { data: settings } = useQuery<any>({
    queryKey: ['system-settings', 2026],
    queryFn: async () => {
      const res = await api.get('/settings/parameters?year=2026');
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

  const chartData = useMemo(() => {
    if (!hrHistory) return [];
    return [...hrHistory]
      .sort((a, b) => a.month.localeCompare(b.month))
      .slice(-12)
      .map(d => ({
        month: d.month,
        total: (d.mainEmployerData?.totalWorkers || 0) + (d.subContractorData?.totalWorkers || 0),
        mlpc: d.mainEmployerData?.totalWorkers || 0,
        sub: d.subContractorData?.totalWorkers || 0,
      }));
  }, [hrHistory]);

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
              onChange={(e) => setData({ ...data, totalWorkers: parseInt(e.target.value) || 0 })}
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
              <GitBranch className="w-4 h-4 text-primary" /> Bölüm Değiştiren
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
          <Card className={`bg-muted/20 border-dashed transition-all duration-300 ${isGenderMismatch ? 'border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/10' : 'border-border'}`}>
            <CardHeader className="py-3 px-4 flex flex-row items-center justify-between space-y-0">
              <CardTitle className="text-xs font-bold uppercase text-muted-foreground flex items-center gap-2 tracking-widest">
                Cinsiyet Dağılımı
              </CardTitle>
              {isGenderMismatch && (
                <div className="text-[10px] font-bold bg-amber-500 text-white px-2 py-0.5 rounded-full flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" /> Hata
                </div>
              )}
            </CardHeader>
            <CardContent className="p-4 pt-0 grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium flex items-center gap-1.5"><Venus className="w-3.5 h-3.5 text-pink-500" /> Kadın</Label>
                <Input
                  type="number"
                  value={data.gender?.female}
                  onChange={(e) => setData({ ...data, gender: { ...data.gender, female: parseInt(e.target.value) || 0 } })}
                  className="bg-background"
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[11px] font-medium flex items-center gap-1.5"><Mars className="w-3.5 h-3.5 text-blue-500" /> Erkek</Label>
                <Input
                  type="number"
                  value={data.gender?.male}
                  onChange={(e) => setData({ ...data, gender: { ...data.gender, male: parseInt(e.target.value) || 0 } })}
                  className="bg-background"
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
          <Label className="text-xs font-bold text-muted-foreground uppercase hidden sm:inline">Tesis:</Label>
          <Select value={selectedFacility} onValueChange={setSelectedFacility}>
            <SelectTrigger className="w-64 bg-background shadow-none border-muted-foreground/20 font-semibold h-10">
              <SelectValue placeholder="Tesis seçin" />
            </SelectTrigger>
            <SelectContent>
              {facilities?.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {!isFormOpen && (
            <Button onClick={handleAddNew} className="gap-2 shadow-lg shadow-primary/20 h-10 px-6">
              <UserPlus className="w-4 h-4" /> Yeni Kayıt Ekle
            </Button>
          )}
        </div>
      </div>

      {!isFormOpen ? (
        /* DASHBOARD VIEW */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in fade-in duration-500">
          <Card className="lg:col-span-2 shadow-sm border-border/50">
            <CardHeader className="flex flex-row items-center justify-between border-b bg-muted/10">
              <div>
                <CardTitle className="text-lg font-bold flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-emerald-500" /> Çalışan Değişim Trendi
                </CardTitle>
                <CardDescription>Son 12 ayın karşılaştırmalı verileri</CardDescription>
              </div>
            </CardHeader>
            <CardContent className="h-[400px] pt-8">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: 'hsl(var(--muted-foreground))'}} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: '8px', fontSize: '12px' }} />
                  <Area type="monotone" dataKey="total" name="Toplam" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorTotal)" strokeWidth={3} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card className="shadow-sm border-border/50 flex flex-col">
            <CardHeader className="border-b bg-muted/10">
              <CardTitle className="text-lg font-bold flex items-center gap-2">
                <History className="w-5 h-5 text-amber-500" /> Aylık Veri Listesi
              </CardTitle>
              <CardDescription>Geçmiş kayıtları inceleyin veya düzenleyin</CardDescription>
            </CardHeader>
            <CardContent className="p-0 flex-1">
              <div className="max-h-[500px] overflow-auto">
                <Table>
                  <TableHeader className="bg-muted/30 sticky top-0 z-10">
                    <TableRow>
                      <TableHead className="text-xs">Dönem</TableHead>
                      <TableHead className="text-right text-xs">Çalışan</TableHead>
                      <TableHead className="text-right text-xs">Eylem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {hrHistory?.map((h) => (
                      <TableRow key={h.month} className="group transition-colors hover:bg-muted/50">
                        <TableCell className="py-4 font-bold">{h.month}</TableCell>
                        <TableCell className="py-4 text-right font-mono text-sm">
                          {(h.mainEmployerData?.totalWorkers || 0) + (h.subContractorData?.totalWorkers || 0)}
                        </TableCell>
                        <TableCell className="py-4 text-right">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(h.month)}
                            className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <GitBranch className="w-4 h-4 text-primary" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => handleEdit(h.month)}
                            className="text-xs text-primary font-bold hover:bg-primary/10 px-3 h-8"
                          >
                            Düzenle
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!hrHistory || hrHistory.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center py-20 text-muted-foreground italic text-sm">Kayıtlı veri bulunmuyor</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (
        /* FORM VIEW */
        <div className="max-w-5xl mx-auto animate-in slide-in-from-bottom-4 duration-500">
          <div className="flex items-center justify-between mb-6 bg-muted/30 p-6 rounded-2xl border">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)} className="rounded-full bg-background border shadow-sm">
                <ChevronRight className="w-5 h-5 rotate-180" />
              </Button>
              <div>
                <h2 className="text-xl font-bold flex items-center gap-2">
                  {currentMonthData ? 'Mevcut Veriyi Güncelle' : 'Yeni Ay Verisi Girişi'}
                </h2>
                <p className="text-xs text-muted-foreground">Tüm alanları eksiksiz doldurduğunuzdan emin olun.</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 bg-background p-3 rounded-xl border shadow-sm">
              <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Kayıt Dönemi:</Label>
              <Input
                type="month"
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(e.target.value)}
                className="w-44 h-10 border-none shadow-none font-bold text-primary focus-visible:ring-0"
              />
            </div>
          </div>

          <Card className="shadow-2xl border-primary/20 overflow-hidden ring-1 ring-primary/5">
            <Tabs defaultValue="mlpc" className="w-full">
              <div className="bg-muted/40 p-1.5">
                <TabsList className="grid w-full grid-cols-2 max-w-md mx-auto h-12 bg-background shadow-inner">
                  <TabsTrigger 
                    value="mlpc" 
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-lg rounded-md"
                  >
                    MLPCARE (Ana İşveren)
                  </TabsTrigger>
                  <TabsTrigger 
                    value="sub" 
                    className="data-[state=active]:bg-indigo-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-md"
                  >
                    Alt İşveren Verileri
                  </TabsTrigger>
                </TabsList>
              </div>
              
              <TabsContent value="mlpc" className="p-8 mt-0 border-t">
                <div className="mb-6 flex items-center gap-3 text-primary">
                  <Building2 className="w-6 h-6" />
                  <span className="text-lg font-extrabold tracking-tight">MLPCARE Kurumsal Veri Seti</span>
                </div>
                {renderDataSection('MLPCARE', mainEmployerData, setMainEmployerData)}
              </TabsContent>
              
              <TabsContent value="sub" className="p-8 mt-0 border-t">
                <div className="mb-6 flex items-center gap-3 text-indigo-600">
                  <Users className="w-6 h-6" />
                  <span className="text-lg font-extrabold tracking-tight">Alt İşveren (Taşeron) Veri Seti</span>
                </div>
                {renderDataSection('SubContractor', subContractorData, setSubContractorData)}
              </TabsContent>
            </Tabs>

            <div className="p-8 bg-muted/30 border-t flex items-center justify-between">
              <Button variant="ghost" onClick={() => setIsFormOpen(false)} className="hover:bg-destructive/10 hover:text-destructive font-bold">
                Değişiklikleri İptal Et
              </Button>
              <div className="flex items-center gap-4">
                <p className="text-[11px] text-muted-foreground hidden sm:block italic max-w-[200px] text-right">
                  Kayıt işlemi sonrasında veriler grafiklere anlık yansıyacaktır.
                </p>
                <Button
                  onClick={() => saveMutation.mutate()}
                  disabled={!selectedFacility || saveMutation.isPending}
                  size="lg"
                  className="min-w-[240px] shadow-xl shadow-primary/25 gap-2 h-14 text-lg font-bold"
                >
                  {saveMutation.isPending ? <Loader2 className="w-6 h-6 animate-spin" /> : <Save className="w-6 h-6" />}
                  {currentMonthData ? 'Güncellemeyi Onayla' : 'Verileri Sisteme Kaydet'}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}