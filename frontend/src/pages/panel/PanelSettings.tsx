import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ShieldAlert, Save, Loader2, CheckCircle2, Info, 
  TrendingUp, Scale, Gavel 
} from 'lucide-react';

interface FineSettings {
  year: number;
  specialistAndPhysicianVery: number;
  specialistAndPhysicianDanger: number;
  specialistAndPhysicianLess: number;
  dspVeryDangerous: number;
}

const PanelSettings = () => {
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();
  const [year, setYear] = useState(currentYear);
  const [formData, setFormData] = useState<Partial<FineSettings>>({});
  const [isSuccess, setIsSuccess] = useState(false);

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
      setIsSuccess(true);
      setTimeout(() => setIsSuccess(false), 3000);
    }
  });

  const handleSave = () => {
    saveMutation.mutate({ ...formData, year });
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('tr-TR', { style: 'currency', currency: 'TRY' }).format(val);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground font-medium animate-pulse">Cezalar yükleniyor...</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-end">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold tracking-tight">Panel Ayarları</h1>
          <p className="text-sm text-muted-foreground">İSG atama ve yasal uyumluluk parametreleri.</p>
        </div>
        <div className="flex items-center gap-2">
          <label className="text-sm font-medium text-muted-foreground">Yıl Seçimi:</label>
          <select 
            value={year} 
            onChange={(e) => setYear(parseInt(e.target.value))}
            className="h-9 w-32 rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            {[currentYear, currentYear + 1].map(y => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 p-4 rounded-xl flex gap-3">
        <Info className="w-5 h-5 shrink-0 mt-0.5 text-amber-600 dark:text-amber-500" />
        <div className="space-y-1">
          <p className="text-sm font-medium text-amber-900 dark:text-amber-200">Ceza Hesaplama Mantığı</p>
          <p className="text-sm leading-relaxed text-amber-800/80 dark:text-amber-400/80">
            İdari para cezaları, aykırılığın (eksik atama) devam ettiği <strong>her ay</strong> için hesaplanır. 
            Toplam ceza, eksik olan tüm İSG profesyonellerinin (Uzman, Hekim, DSP) o aya ait ceza toplamıdır.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Uzman ve Hekim Cezaları */}
        <Card className="lg:col-span-2 shadow-sm border-border/50">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary/10 rounded-lg">
                <Gavel className="w-5 h-5 text-primary" />
              </div>
              <div>
                <CardTitle className="text-lg">İSG Uzmanı ve İşyeri Hekimi</CardTitle>
                <CardDescription>Eksik atama başına aylık ceza tutarları</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Çok Tehlikeli</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="pl-8 font-medium"
                    value={formData.specialistAndPhysicianVery || ''} 
                    onChange={e => setFormData({...formData, specialistAndPhysicianVery: parseFloat(e.target.value)})}
                  />
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₺</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-medium">{formatCurrency(formData.specialistAndPhysicianVery || 0)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tehlikeli</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="pl-8 font-medium"
                    value={formData.specialistAndPhysicianDanger || ''} 
                    onChange={e => setFormData({...formData, specialistAndPhysicianDanger: parseFloat(e.target.value)})}
                  />
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₺</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-medium">{formatCurrency(formData.specialistAndPhysicianDanger || 0)}</p>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Az Tehlikeli</label>
                <div className="relative">
                  <Input 
                    type="number" 
                    className="pl-8 font-medium"
                    value={formData.specialistAndPhysicianLess || ''} 
                    onChange={e => setFormData({...formData, specialistAndPhysicianLess: parseFloat(e.target.value)})}
                  />
                  <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₺</span>
                </div>
                <p className="text-[10px] text-emerald-600 font-medium">{formatCurrency(formData.specialistAndPhysicianLess || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DSP Cezaları */}
        <Card className="shadow-sm border-border/50">
          <CardHeader className="pb-4 border-b bg-muted/10">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <TrendingUp className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <CardTitle className="text-lg">DSP (Diğer Sağlık)</CardTitle>
                <CardDescription>Sadece Çok Tehlikeli Sınıf</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="pt-6 space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Çok Tehlikeli</label>
              <div className="relative">
                <Input 
                  type="number" 
                  className="pl-8 font-medium border-blue-200 dark:border-blue-900/30"
                  value={formData.dspVeryDangerous || ''} 
                  onChange={e => setFormData({...formData, dspVeryDangerous: parseFloat(e.target.value)})}
                />
                <span className="absolute left-3 top-2.5 text-muted-foreground text-sm">₺</span>
              </div>
              <p className="text-[10px] text-blue-600 font-medium">{formatCurrency(formData.dspVeryDangerous || 0)}</p>
            </div>
            
            <div className="p-3 bg-muted/30 rounded-lg border border-dashed border-border/50">
              <p className="text-[11px] text-muted-foreground italic leading-relaxed">
                * Az Tehlikeli ve Tehlikeli sınıftaki tesisler DSP atamasından muaf olduğu için ceza uygulanmaz.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-6 border-t">
        <div className="text-sm text-emerald-600 font-medium flex items-center gap-2 transition-opacity" style={{ opacity: isSuccess ? 1 : 0 }}>
          <CheckCircle2 className="w-4 h-4" /> {year} yılı cezaları başarıyla kaydedildi.
        </div>
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="min-w-[160px] shadow-sm shadow-primary/20 bg-primary hover:bg-primary/90"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Cezaları Kaydet
        </Button>
      </div>
    </div>
  );
};

export default PanelSettings;
