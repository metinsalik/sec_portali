import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertCircle, Save, Clock, ShieldAlert, Loader2, CheckCircle2 } from 'lucide-react';

interface SystemSettings {
  year: number;
  seriousAccidentDays: number;
  includeSaturday: boolean;
  dailyWorkHours: number;
}

const ParametersPage = () => {
  const queryClient = useQueryClient();
  const [formData, setFormData] = useState<Partial<SystemSettings>>({});
  const [isSuccess, setIsSuccess] = useState(false);

  const { data: settings, isLoading } = useQuery<SystemSettings>({
    queryKey: ['system-settings'],
    queryFn: async () => {
      const res = await api.get('/settings/parameters');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        seriousAccidentDays: settings.seriousAccidentDays,
        includeSaturday: settings.includeSaturday,
        dailyWorkHours: settings.dailyWorkHours,
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

  if (isLoading) return <div className="p-8 text-center text-slate-500">Yükleniyor...</div>;

  return (
    <div className="max-w-4xl space-y-8">
      <div className="bg-blue-50 border border-blue-100 p-4 rounded-xl flex gap-3 text-blue-800">
        <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
        <p className="text-sm">
          Bu parametreler kaza sıklık hızı ve kaza ağırlık hızı hesaplamalarında varsayılan olarak kullanılmaktadır. 
          Yapılan değişiklikler aktif yıl ({new Date().getFullYear()}) için geçerli olacaktır.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-400" /> Çalışma Saatleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Günlük Çalışma Süresi (Saat)</label>
              <Input 
                type="number" 
                step="0.5" 
                value={formData.dailyWorkHours || ''} 
                onChange={e => setFormData({...formData, dailyWorkHours: parseFloat(e.target.value)})}
              />
              <p className="text-xs text-slate-500 italic">Örn: 7.5 veya 8</p>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <input 
                type="checkbox" 
                id="saturday" 
                checked={formData.includeSaturday || false}
                onChange={e => setFormData({...formData, includeSaturday: e.target.checked})}
                className="w-4 h-4 rounded border-slate-300" 
              />
              <label htmlFor="saturday" className="text-sm font-medium text-slate-700">Cumartesi günü çalışma dahil mi?</label>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200">
          <CardHeader className="pb-4">
            <CardTitle className="text-lg flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-slate-400" /> Kaza Parametreleri
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Ciddi Kaza Eşiği (Gün)</label>
              <Input 
                type="number" 
                value={formData.seriousAccidentDays || ''} 
                onChange={e => setFormData({...formData, seriousAccidentDays: parseInt(e.target.value)})}
              />
              <p className="text-xs text-slate-500 italic">İstirahat süresi bu değerden büyükse "Ciddi Kaza" sayılır.</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-between items-center pt-4 border-t border-slate-100">
        <div className="text-sm text-emerald-600 flex items-center gap-1 transition-opacity" style={{ opacity: isSuccess ? 1 : 0 }}>
          <CheckCircle2 className="w-4 h-4" /> Değişiklikler başarıyla kaydedildi.
        </div>
        <Button 
          onClick={handleSave}
          disabled={saveMutation.isPending}
          className="bg-blue-600 hover:bg-blue-700 min-w-[120px]"
        >
          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          Kaydet
        </Button>
      </div>
    </div>
  );
};

export default ParametersPage;
