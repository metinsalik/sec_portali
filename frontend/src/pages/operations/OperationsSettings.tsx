import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertCircle, Save, Clock, ShieldAlert, Loader2, CheckCircle2, Calculator, CalendarDays } from 'lucide-react';

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
    </div>
  );
};

export default OperationsSettings;

