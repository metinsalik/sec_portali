import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import { 
  ShieldAlert, Save, Loader2, CheckCircle2, Info, 
  TrendingUp, Scale, Gavel, Calendar, Sparkles, AlertTriangle,
  RotateCcw
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FineSettings {
  year: number;
  specialistAndPhysicianVery: number;
  specialistAndPhysicianDanger: number;
  specialistAndPhysicianLess: number;
  dspVeryDangerous: number;
}

const PanelSettings = () => {
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentYear = new Date().getFullYear();

  // URL state synchronization for year
  const paramYear = searchParams.get('year');
  const year = paramYear ? parseInt(paramYear, 10) : currentYear;

  const setYear = (newYear: number) => {
    const next = new URLSearchParams(searchParams);
    if (newYear === currentYear) {
      next.delete('year');
    } else {
      next.set('year', newYear.toString());
    }
    setSearchParams(next, { replace: true });
  };

  // Scroll restoration
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_settings_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [formData, setFormData] = useState<Partial<FineSettings>>({});

  const { data: fines, isLoading } = useQuery<FineSettings>({
    queryKey: ['admin-fines', year],
    queryFn: async () => {
      const res = await api.get(`/settings/fines?year=${year}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      const data = await res.json();
      return data || {
        year,
        specialistAndPhysicianVery: 0,
        specialistAndPhysicianDanger: 0,
        specialistAndPhysicianLess: 0,
        dspVeryDangerous: 0
      };
    }
  });

  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_settings_scrollY');
      if (savedY) {
        const y = parseInt(savedY, 10);
        if (!isNaN(y) && y > 0) {
          requestAnimationFrame(() => window.scrollTo({ top: y, behavior: 'instant' }));
        }
      }
    }
  }, [isLoading]);

  useEffect(() => {
    if (fines) {
      setFormData(fines);
    }
  }, [fines]);

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/settings/fines', data);
      if (!res.ok) throw new Error('Kaydedilemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fines'] });
      toast.success(`${year} yılı ceza parametreleri başarıyla kaydedildi.`);
    },
    onError: () => {
      toast.error('Ceza parametreleri kaydedilirken hata oluştu.');
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ ...formData, year });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  const yearOptions = [
    currentYear - 2,
    currentYear - 1,
    currentYear,
    currentYear + 1,
    currentYear + 2
  ];

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Panel Ayarları</h1>
            <Badge variant="outline" className="text-xs font-semibold px-2">
              İSG Cezaları
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            İSG profesyoneli eksik atama ve yasal idari para cezası parametrelerini yapılandırın.
          </p>
        </div>

        {/* Yıl Seçimi */}
        <div className="flex items-center gap-2.5 bg-card p-1.5 rounded-xl border border-border/70 shadow-2xs">
          <Calendar className="w-4 h-4 text-muted-foreground ml-2" />
          <span className="text-xs font-semibold text-muted-foreground">Tarife Yılı:</span>
          <Select 
            value={year.toString()} 
            onValueChange={(val) => setYear(parseInt(val, 10))}
          >
            <SelectTrigger className="h-8 w-28 text-xs font-bold bg-background">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {yearOptions.map((y) => (
                <SelectItem key={y} value={y.toString()} className="text-xs font-medium">
                  {y} {y === currentYear && '(Cari)'}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bilgi Kutusu */}
      <div className="bg-amber-500/10 border border-amber-500/20 p-4 rounded-xl flex gap-3.5 items-start">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
            6331 Sayılı Kanun Kapsamında Ceza Hesaplama Mantığı
          </p>
          <p className="text-xs leading-relaxed text-amber-800/90 dark:text-amber-300/80">
            İdari para cezaları, aykırılığın (eksik veya geçersiz atama) devam ettiği <strong>her ay için</strong> tesis bazında hesaplanır.
            Toplam ceza, atanmayan her bir İSG profesyoneli unvanı (İş Güvenliği Uzmanı, İşyeri Hekimi, DSP) için ilgili tehlike sınıfının aylık katsayısı toplanarak belirlenir.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 border-border/60 shadow-xs p-6 space-y-6">
              <Skeleton className="h-6 w-1/3" />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
                <Skeleton className="h-20 w-full rounded-xl" />
              </div>
            </Card>
            <Card className="border-border/60 shadow-xs p-6 space-y-6">
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-20 w-full rounded-xl" />
            </Card>
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-36 rounded-lg" />
          </div>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Uzman ve Hekim Cezaları */}
            <Card className="lg:col-span-2 shadow-xs border-border/70 bg-card">
              <CardHeader className="pb-4 border-b border-border/60 bg-muted/20">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Gavel className="w-5 h-5" />
                  </div>
                  <div>
                    <CardTitle className="text-base font-bold text-foreground">İş Güvenliği Uzmanı ve İşyeri Hekimi</CardTitle>
                    <CardDescription className="text-xs">
                      Her eksik atama başına uygulanacak aylık idari para cezaları
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Çok Tehlikeli */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        Çok Tehlikeli
                      </label>
                      <Badge variant="outline" className="text-[10px] text-red-600 border-red-200 dark:border-red-900/50">
                        Sınıf A
                      </Badge>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        className="pl-8 font-mono font-bold text-sm bg-background"
                        value={formData.specialistAndPhysicianVery || ''} 
                        onChange={e => setFormData({...formData, specialistAndPhysicianVery: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">₺</span>
                    </div>
                    <p className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {formatCurrency(formData.specialistAndPhysicianVery || 0)} / ay
                    </p>
                  </div>

                  {/* Tehlikeli */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Tehlikeli
                      </label>
                      <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-200 dark:border-amber-900/50">
                        Sınıf B
                      </Badge>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        className="pl-8 font-mono font-bold text-sm bg-background"
                        value={formData.specialistAndPhysicianDanger || ''} 
                        onChange={e => setFormData({...formData, specialistAndPhysicianDanger: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">₺</span>
                    </div>
                    <p className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {formatCurrency(formData.specialistAndPhysicianDanger || 0)} / ay
                    </p>
                  </div>

                  {/* Az Tehlikeli */}
                  <div className="space-y-2 p-3.5 rounded-xl bg-muted/20 border border-border/50">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                        Az Tehlikeli
                      </label>
                      <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-200 dark:border-emerald-900/50">
                        Sınıf C
                      </Badge>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        className="pl-8 font-mono font-bold text-sm bg-background"
                        value={formData.specialistAndPhysicianLess || ''} 
                        onChange={e => setFormData({...formData, specialistAndPhysicianLess: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">₺</span>
                    </div>
                    <p className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {formatCurrency(formData.specialistAndPhysicianLess || 0)} / ay
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* DSP Cezaları */}
            <Card className="shadow-xs border-border/70 bg-card flex flex-col justify-between">
              <div>
                <CardHeader className="pb-4 border-b border-border/60 bg-muted/20">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-blue-500/10 rounded-lg text-blue-600 dark:text-blue-400">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <CardTitle className="text-base font-bold text-foreground">DSP (Diğer Sağlık)</CardTitle>
                      <CardDescription className="text-xs">Sadece Çok Tehlikeli Sınıf İçin</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-6 space-y-4">
                  <div className="space-y-2 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/20">
                    <div className="flex items-center justify-between">
                      <label className="text-[11px] font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
                        Çok Tehlikeli Sınıf
                      </label>
                      <Badge variant="outline" className="text-[10px] text-blue-600 border-blue-200 dark:border-blue-900/50">
                        10+ Çalışan
                      </Badge>
                    </div>
                    <div className="relative">
                      <Input 
                        type="number" 
                        className="pl-8 font-mono font-bold text-sm bg-background"
                        value={formData.dspVeryDangerous || ''} 
                        onChange={e => setFormData({...formData, dspVeryDangerous: parseFloat(e.target.value) || 0})}
                        placeholder="0"
                      />
                      <span className="absolute left-3 top-2.5 text-muted-foreground text-sm font-semibold">₺</span>
                    </div>
                    <p className="text-[11px] font-mono font-semibold text-muted-foreground">
                      {formatCurrency(formData.dspVeryDangerous || 0)} / ay
                    </p>
                  </div>

                  <div className="p-3 bg-muted/30 rounded-xl border border-dashed border-border/70">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      💡 Az Tehlikeli ve Tehlikeli sınıftaki tesisler mevzuat uyarınca DSP atamasından muaf tutulabildiğinden ceza yalnızca <strong>Çok Tehlikeli (10+ çalışan)</strong> tesislerde hesaplanır.
                    </p>
                  </div>
                </CardContent>
              </div>
            </Card>
          </div>

          {/* Aksiyon Çubuğu */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-border/70 bg-card p-4 rounded-xl shadow-2xs">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Sparkles className="w-4 h-4 text-primary" />
              <span>
                Yapılan değişiklikler <strong>{year}</strong> yılına ait tüm tesis ve ceza hesaplama raporlarına otomatik yansıtılır.
              </span>
            </div>

            <Button 
              onClick={handleSave}
              disabled={saveMutation.isPending}
              className="min-w-[170px] h-9 shadow-sm shadow-primary/20 bg-primary hover:bg-primary/90 text-sm font-semibold gap-2 self-end sm:self-auto"
            >
              {saveMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              Cezaları Kaydet
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default PanelSettings;

