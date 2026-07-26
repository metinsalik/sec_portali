import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Save, Clock, ShieldAlert, Loader2, CheckCircle2, Calculator, CalendarDays, Plus, Edit, Trash2, Tag, ShieldCheck, Siren, HelpCircle, Building2 } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface SystemSettings {
  year: number;
  seriousAccidentDays: number;
  includeSaturday: boolean;
  dailyWorkHours: number;
  monthlyWorkDays: Record<string, number>;
}

const MONTH_NAMES = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık'
];

const OperationsSettings = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const currentYearStr = new Date().getFullYear().toString();
  const [dashboardYear, setDashboardYear] = useState(currentYearStr);
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const hasAdminAccess = user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management');

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['system-settings', dashboardYear],
    queryFn: async () => {
      const res = await api.get(`/settings/parameters?year=${dashboardYear}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    enabled: !!hasAdminAccess
  });

  const { data: allSettings, isLoading: isLoadingAll } = useQuery<SystemSettings[]>({
    queryKey: ['system-settings', 'all'],
    queryFn: async () => {
      const res = await api.get('/settings/parameters?year=all');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    enabled: !!hasAdminAccess
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        year: settings.year,
        seriousAccidentDays: settings.seriousAccidentDays,
        includeSaturday: settings.includeSaturday,
        dailyWorkHours: settings.dailyWorkHours,
        monthlyWorkDays: settings.monthlyWorkDays || {},
      });
    } else {
      setFormData({
        year: parseInt(dashboardYear),
        includeSaturday: true,
        dailyWorkHours: 7.5,
        seriousAccidentDays: 4,
        monthlyWorkDays: {},
      });
    }
  }, [settings, dashboardYear]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/parameters', data);
      if (!res.ok) throw new Error('Kaydedilemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['system-settings'] });
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }
  });

  const handleSave = () => {
    saveMutation.mutate(formData);
  };

  const calculateForYear = () => {
    const year = parseInt(dashboardYear);
    const monthlyDays: Record<string, number> = {};
    const includeSat = formData.includeSaturday ?? true;

    for (let month = 0; month < 12; month++) {
      let workingDays = 0;
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      
      for (let d = 1; d <= daysInMonth; d++) {
        const date = new Date(year, month, d);
        const dayOfWeek = date.getDay(); // 0: Sunday, 6: Saturday
        
        if (dayOfWeek === 0) continue; // Skip Sundays
        if (dayOfWeek === 6 && !includeSat) continue; // Skip Saturdays if not included
        
        workingDays++;
      }
      monthlyDays[month + 1] = workingDays;
    }

    setFormData(prev => ({
      ...prev,
      year: year,
      monthlyWorkDays: monthlyDays
    }));
  };

  const updateMonthlyDay = (monthIndex: number, days: number) => {
    setFormData(prev => ({
      ...prev,
      monthlyWorkDays: {
        ...(prev.monthlyWorkDays || {}),
        [monthIndex + 1]: days
      }
    }));
  };

  if (!hasAdminAccess) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] gap-4 animate-in fade-in zoom-in duration-500">
        <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8 text-destructive" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-foreground">Erişim Reddedildi</h2>
        <p className="text-muted-foreground text-center max-w-md">
          Ayarlar sayfasına erişmek için Sistem Yöneticisi veya Yönetim rolüne sahip olmanız gerekmektedir. Lütfen sistem yöneticinizle iletişime geçin.
        </p>
      </div>
    );
  }

  if (isLoading) return <div className="p-8 text-center text-muted-foreground font-medium">Ayarlar yükleniyor...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Operasyonel Parametreler</h1>
          <p className="text-sm text-muted-foreground">Bu modüldeki hesaplamalar için kullanılan varsayılan değerler.</p>
        </div>
        
        <div className="flex items-center gap-2 bg-background p-2 rounded-xl border shadow-sm w-fit">
          <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground ml-2">Yıl:</span>
          <Select value={dashboardYear} onValueChange={setDashboardYear}>
            <SelectTrigger className="w-32 h-8 border-none shadow-none font-bold text-primary focus-visible:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[0, 1, 2, 3].map(offset => {
                const yearVal = (new Date().getFullYear() - offset).toString();
                return <SelectItem key={yearVal} value={yearVal}>{yearVal}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-1 md:grid-cols-3 md:w-[600px] mb-6 h-auto p-1">
          <TabsTrigger value="general" className="gap-2">
            <Clock className="w-4 h-4" /> Genel Ayarlar
          </TabsTrigger>
          <TabsTrigger value="definitions" className="gap-2">
            <Tag className="w-4 h-4" /> Sistem Tanımları
          </TabsTrigger>
          <TabsTrigger value="incidents" className="gap-2">
            <ShieldAlert className="w-4 h-4" /> Olay Tanımları
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="bg-muted/50 border border-border/50 p-4 rounded-xl flex gap-3 text-foreground">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-muted-foreground" />
            <p className="text-sm leading-relaxed text-muted-foreground">
              Bu parametreler kaza sıklık hızı ve kaza ağırlık hızı hesaplamalarında varsayılan olarak kullanılmaktadır. 
              Şu an <strong>{dashboardYear}</strong> yılı için yapılandırma yapmaktasınız.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4 border-b bg-muted/20">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="w-5 h-5 text-primary" /> Genel Çalışma Ayarları
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Günlük Çalışma Süresi (Saat)</label>
                    <Input 
                      type="number" 
                      step="0.5" 
                      className="bg-background"
                      value={formData.dailyWorkHours || ''} 
                      onChange={e => setFormData({...formData, dailyWorkHours: parseFloat(e.target.value)})}
                    />
                    <p className="text-[11px] text-muted-foreground italic">Örn: 7.5 veya 8</p>
                  </div>
                  <div className="flex items-center gap-3 pt-2">
                    <input 
                      type="checkbox" 
                      id="saturday" 
                      checked={formData.includeSaturday || false}
                      onChange={e => setFormData({...formData, includeSaturday: e.target.checked})}
                      className="w-4 h-4 rounded border-muted-foreground/30 accent-primary cursor-pointer" 
                    />
                    <label htmlFor="saturday" className="text-sm font-medium cursor-pointer select-none">Cumartesi günü çalışma dahil mi?</label>
                  </div>
                </CardContent>
              </Card>

              <Card className="shadow-sm border-border/50">
                <CardHeader className="pb-4 border-b bg-muted/20">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-primary" /> Kaza Parametreleri
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-6">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Ciddi Kaza Eşiği (Gün)</label>
                    <Input 
                      type="number" 
                      className="bg-background"
                      value={formData.seriousAccidentDays || ''} 
                      onChange={e => setFormData({...formData, seriousAccidentDays: parseInt(e.target.value)})}
                    />
                    <p className="text-[11px] text-muted-foreground italic">İstirahat süresi bu değerden büyükse "Ciddi Kaza" sayılır.</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="shadow-sm border-border/50">
              <CardHeader className="pb-4 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-primary" /> {dashboardYear} Çalışma Takvimi
                </CardTitle>
                <Button variant="outline" size="sm" onClick={calculateForYear} className="gap-2 h-8 text-xs shrink-0 w-full md:w-auto">
                  <Calculator className="w-3.5 h-3.5" /> Otomatik Hesapla ({dashboardYear})
                </Button>
              </CardHeader>
              <CardContent className="pt-0 px-0">
                <div className="max-h-[400px] overflow-auto">
                  <Table>
                    <TableHeader className="sticky top-0 bg-background z-10 shadow-sm">
                      <TableRow>
                        <TableHead className="w-24">Ay</TableHead>
                        <TableHead className="text-center">İş Günü</TableHead>
                        <TableHead className="text-right">Toplam Saat</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {MONTH_NAMES.map((name, index) => {
                        const days = formData.monthlyWorkDays?.[index + 1] || 0;
                        const hours = days * (formData.dailyWorkHours || 0);
                        return (
                          <TableRow key={name} className="hover:bg-muted/30 transition-colors">
                            <TableCell className="font-medium py-2">{name}</TableCell>
                            <TableCell className="py-2">
                              <Input 
                                type="number"
                                className="h-8 w-16 mx-auto text-center"
                                value={days || ''}
                                onChange={e => updateMonthlyDay(index, parseInt(e.target.value) || 0)}
                              />
                            </TableCell>
                            <TableCell className="text-right py-2 font-mono text-xs text-muted-foreground">
                              {hours.toFixed(1)} sa
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-between items-center pt-6 border-t mt-8">
            <div className="text-sm text-emerald-600 font-medium flex items-center gap-2 transition-opacity" style={{ opacity: isSuccess ? 1 : 0 }}>
              <CheckCircle2 className="w-4 h-4" /> {dashboardYear} Ayarları başarıyla kaydedildi.
            </div>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="min-w-[140px] shadow-sm shadow-primary/20"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {dashboardYear} Ayarlarını Kaydet
            </Button>
          </div>

          <div className="mt-12 space-y-4">
            <h2 className="text-xl font-bold tracking-tight border-b pb-2">Kayıtlı Yıl Ayarları</h2>
            <Card className="shadow-sm border-border/50">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/30">
                    <TableRow>
                      <TableHead>Yıl</TableHead>
                      <TableHead className="text-center">Günlük Çalışma (Saat)</TableHead>
                      <TableHead className="text-center">C.tesi Dahil mi?</TableHead>
                      <TableHead className="text-center">Ciddi Kaza Eşiği (Gün)</TableHead>
                      <TableHead className="text-right">İşlem</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoadingAll ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground animate-pulse py-4">Yükleniyor...</TableCell></TableRow>
                    ) : allSettings?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground italic py-4">Hiçbir ayar bulunamadı.</TableCell></TableRow>
                    ) : (
                      allSettings?.map((s) => (
                        <TableRow key={s.year}>
                          <TableCell className="font-bold">{s.year}</TableCell>
                          <TableCell className="text-center">{s.dailyWorkHours}</TableCell>
                          <TableCell className="text-center">{s.includeSaturday ? <Badge variant="default" className="bg-emerald-500/10 text-emerald-600 border-none">Evet</Badge> : <Badge variant="outline">Hayır</Badge>}</TableCell>
                          <TableCell className="text-center">{s.seriousAccidentDays} Gün</TableCell>
                          <TableCell className="text-right">
                            <Button variant="outline" size="sm" onClick={() => setDashboardYear(s.year.toString())} className="h-8">
                              Düzenle
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="definitions" className="pt-4">
          <OperationsDefinitions types={[
            { key: 'operations-categories', label: 'Genel Kategoriler', icon: Tag },
            { key: 'operations-departments', label: 'Departmanlar', icon: Building2 },
          ]} />
        </TabsContent>

        <TabsContent value="incidents" className="pt-4">
          <OperationsDefinitions types={[
            { key: 'incident-categories', label: 'Olay Kategorileri', icon: Tag },
            { key: 'incident-root-causes', label: 'Kök Nedenler', icon: HelpCircle },
            { key: 'incident-support-units', label: 'Destek Birimleri', icon: ShieldCheck },
            { key: 'emergency-codes', label: 'Acil Durum Kodları', icon: Siren },
          ]} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Definitions Component ---
const OperationsDefinitions = ({ types }: { types: { key: string; label: string; icon: any }[] }) => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; type?: string; title?: string; edit?: any }>({ open: false });
  const [name, setName] = useState('');

  const queries = types.reduce((acc, type) => {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    acc[type.key] = useQuery({
      queryKey: [type.key],
      queryFn: async () => {
        const res = await api.get(`/settings/definitions/${type.key}`);
        if (!res.ok) throw new Error();
        return res.json();
      }
    });
    return acc;
  }, {} as any);

  const mutation = useMutation({
    mutationFn: async ({ type, name, id }: { type: string; name: string; id?: number }) => {
      const res = id 
        ? await api.put(`/settings/definitions/${type}/${id}`, { name })
        : await api.post(`/settings/definitions/${type}`, { name });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type] });
      setModal({ open: false });
      setName('');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ type, id }: { type: string; id: number }) => {
      const res = await api.delete(`/settings/definitions/${type}/${id}`);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: [variables.type] });
    }
  });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {types.map(t => (
        <Card key={t.key} className="shadow-md border-border/40 overflow-hidden flex flex-col bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3 border-b border-border/40 bg-card/50 flex flex-row items-center justify-between space-y-0 px-5 pt-5">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-lg">
                <t.icon className="w-5 h-5 text-primary" />
              </div>
              <CardTitle className="text-base font-semibold tracking-tight">{t.label}</CardTitle>
            </div>
            <Button size="sm" variant="default" className="h-8 px-3 gap-1.5 shadow-sm rounded-full" onClick={() => { setName(''); setModal({ open: true, type: t.key, title: t.label }); }}>
              <Plus className="w-3.5 h-3.5" /> Yeni Ekle
            </Button>
          </CardHeader>
          <CardContent className="p-4 bg-muted/10 flex-1">
            <div className="max-h-[280px] overflow-y-auto pr-2 space-y-2 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-border [&::-webkit-scrollbar-thumb]:rounded-full">
              {queries[t.key].data?.map((item: any) => (
                <div key={item.id} className="group flex items-center justify-between px-3 py-2.5 bg-background border border-border/50 rounded-lg hover:border-primary/30 hover:shadow-sm transition-all">
                  <span className="text-sm font-medium text-foreground/90">{item.name}</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10" onClick={() => { setName(item.name); setModal({ open: true, type: t.key, title: t.label, edit: item }); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10" onClick={() => { if(confirm('Silmek istediğinize emin misiniz?')) deleteMutation.mutate({ type: t.key, id: item.id }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {queries[t.key].isLoading && (
                <div className="p-6 text-center text-sm text-muted-foreground animate-pulse flex flex-col items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" /> Yükleniyor...
                </div>
              )}
              {queries[t.key].data?.length === 0 && (
                <div className="p-8 text-center flex flex-col items-center justify-center border-2 border-dashed border-border/50 rounded-xl bg-background/50">
                  <p className="text-sm text-muted-foreground font-medium">Kayıt bulunamadı</p>
                  <p className="text-xs text-muted-foreground/70 mt-1">Yeni bir {t.label.toLowerCase()} eklemek için yukarıdaki butonu kullanın.</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}

      <Dialog open={modal.open} onOpenChange={o => setModal(prev => ({ ...prev, open: o }))}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>{modal.edit ? `${modal.title} Düzenle` : `Yeni ${modal.title}`}</DialogTitle>
          </DialogHeader>
          <form onSubmit={e => { e.preventDefault(); mutation.mutate({ type: modal.type!, name, id: modal.edit?.id }); }} className="space-y-4 pt-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">İsim *</label>
              <Input value={name} onChange={e => setName(e.target.value)} required autoFocus />
            </div>
            {mutation.isError && <p className="text-xs text-destructive">{(mutation.error as any).message}</p>}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setModal({ open: false })}>İptal</Button>
              <Button type="submit" disabled={mutation.isPending}>
                {mutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default OperationsSettings;

