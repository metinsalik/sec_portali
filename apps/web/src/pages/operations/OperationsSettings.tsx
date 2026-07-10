import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Save, Clock, ShieldAlert, Loader2, CheckCircle2, Calculator, CalendarDays, Plus, Edit, Trash2, Tag, ShieldCheck, Siren, HelpCircle } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';

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
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/parameters?year=2026');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
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
      // Default to 2026
      setFormData({
        year: 2026,
        includeSaturday: true,
        dailyWorkHours: 7.5,
        seriousAccidentDays: 4,
        monthlyWorkDays: {},
      });
    }
  }, [settings]);

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

  const calculate2026 = () => {
    const year = 2026;
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
      year: 2026,
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

  if (isLoading) return <div className="p-8 text-center text-muted-foreground font-medium">Ayarlar yükleniyor...</div>;

  return (
    <div className="space-y-6 pb-12">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight">Operasyonel Parametreler</h1>
        <p className="text-sm text-muted-foreground">Bu modüldeki hesaplamalar için kullanılan varsayılan değerler.</p>
      </div>

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="grid w-full grid-cols-2 md:w-[400px] mb-6">
          <TabsTrigger value="general" className="gap-2">
            <Clock className="w-4 h-4" /> Genel Ayarlar
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
              Şu an <strong>2026</strong> yılı için yapılandırma yapmaktasınız.
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
                  <CalendarDays className="w-5 h-5 text-primary" /> 2026 Çalışma Takvimi
                </CardTitle>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={calculate2026}
                  className="h-8 gap-1.5 text-xs"
                >
                  <Calculator className="w-3.5 h-3.5" /> 2026 Hesapla
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
              <CheckCircle2 className="w-4 h-4" /> 2026 Ayarları başarıyla kaydedildi.
            </div>
            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="min-w-[140px] shadow-sm shadow-primary/20"
            >
              {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              2026 Ayarlarını Kaydet
            </Button>
          </div>
        </TabsContent>

        <TabsContent value="incidents" className="pt-4">
          <IncidentDefinitions />
        </TabsContent>
      </Tabs>
    </div>
  );
};

// --- Incident Definitions Component ---
const IncidentDefinitions = () => {
  const queryClient = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; type?: string; title?: string; edit?: any }>({ open: false });
  const [name, setName] = useState('');

  const types = [
    { key: 'incident-categories', label: 'Olay Kategorileri', icon: Tag },
    { key: 'incident-root-causes', label: 'Kök Nedenler', icon: HelpCircle },
    { key: 'incident-support-units', label: 'Destek Birimleri', icon: ShieldCheck },
    { key: 'emergency-codes', label: 'Acil Durum Kodları', icon: Siren },
  ];

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
        <Card key={t.key} className="shadow-sm border-border/50 overflow-hidden">
          <CardHeader className="pb-3 border-b bg-muted/20 flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-md font-semibold flex items-center gap-2">
              <t.icon className="w-4 h-4 text-primary" /> {t.label}
            </CardTitle>
            <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => { setName(''); setModal({ open: true, type: t.key, title: t.label }); }}>
              <Plus className="w-4 h-4" />
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="max-h-[300px] overflow-auto divide-y divide-border">
              {queries[t.key].data?.map((item: any) => (
                <div key={item.id} className="flex items-center justify-between px-4 py-2 hover:bg-muted/30 transition-colors">
                  <span className="text-sm font-medium">{item.name}</span>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => { setName(item.name); setModal({ open: true, type: t.key, title: t.label, edit: item }); }}>
                      <Edit className="w-3.5 h-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive" onClick={() => { if(confirm('Emin misiniz?')) deleteMutation.mutate({ type: t.key, id: item.id }); }}>
                      <Trash2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              ))}
              {queries[t.key].isLoading && <div className="p-4 text-center text-xs text-muted-foreground animate-pulse">Yükleniyor...</div>}
              {queries[t.key].data?.length === 0 && <div className="p-4 text-center text-xs text-muted-foreground italic">Henüz veri yok.</div>}
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

