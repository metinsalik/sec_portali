import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription 
} from "@/components/ui/dialog";
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UserPlus, Clock, Calendar, CreditCard, Loader2, Info } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface QuickAssignModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facility: any;
  type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil';
  onSuccess?: () => void;
}

export function QuickAssignModal({ open, onOpenChange, facility, type, onSuccess }: QuickAssignModalProps) {
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    professionalId: '',
    employerRepId: '',
    durationMinutes: '',
    isFullTime: false,
    startDate: new Date().toISOString().split('T')[0],
    costType: 'Aylık Sabit',
    unitPrice: '',
  });

  // Re-calculate duration when facility or type changes
  React.useEffect(() => {
    if (facility && open) {
      let duration = 0;
      if (type === 'IGU') {
        const req = facility.compliance?.igu?.requiredMinutes || 0;
        const ass = facility.compliance?.igu?.assignedMinutes || 0;
        duration = req - ass;
      } else if (type === 'Hekim') {
        const req = facility.compliance?.hekim?.requiredMinutes || 0;
        const ass = facility.compliance?.hekim?.assignedMinutes || 0;
        duration = req - ass;
      } else if (type === 'DSP') {
        duration = 0;
      } else if (type === 'Vekil') {
        duration = 11700;
      }

      setFormData(prev => ({
        ...prev,
        durationMinutes: Math.max(0, duration).toString(),
        isFullTime: type === 'Vekil' || (type === 'IGU' ? facility.compliance?.igu?.isFullTimeRequired : type === 'Hekim' ? facility.compliance?.hekim?.isFullTimeRequired : false)
      }));
    }
  }, [facility, type, open]);

  const { data: professionals = [] } = useQuery<any[]>({
    queryKey: ['professionals', 'active'],
    queryFn: async () => {
      const res = await api.get('/panel/professionals');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    enabled: open && type !== 'Vekil'
  });

  const { data: employerReps = [] } = useQuery<any[]>({
    queryKey: ['employers', 'active'],
    queryFn: async () => {
      const res = await api.get('/panel/employers');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
    enabled: open && type === 'Vekil'
  });

  const assignMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/panel/assignments', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Atama yapılamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-with-compliance'] });
      queryClient.invalidateQueries({ queryKey: ['facility-detail', facility?.id] });
      queryClient.invalidateQueries({ queryKey: ['panel-dashboard'] });
      toast.success('Atama başarıyla yapıldı');
      onOpenChange(false);
      onSuccess?.();
    },
    onError: (error) => toast.error(error.message)
  });

  const handleAssignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!facility) return;

    assignMutation.mutate({
      facilityId: facility.id,
      type: type,
      professionalId: type !== 'Vekil' ? formData.professionalId : undefined,
      employerRepId: type === 'Vekil' ? formData.employerRepId : undefined,
      durationMinutes: formData.durationMinutes,
      isFullTime: formData.isFullTime,
      startDate: formData.startDate,
      costType: formData.costType,
      unitPrice: formData.unitPrice,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl flex flex-col">
        <DialogHeader className="px-8 py-6 bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <UserPlus className="w-5 h-5 text-white/70" />
            </div>
            <div>
              <DialogTitle className="text-lg font-bold tracking-tight">Hızlı Atama Yap</DialogTitle>
              <DialogDescription className="text-white/40 text-xs mt-1 font-medium">
                {facility?.name || facility?.facilityName} için {type} ataması
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleAssignSubmit} className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
          <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="md:col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">
                  {type === 'Vekil' ? 'İşveren Vekili Seçin *' : 'Profesyonel Seçin *'}
                </label>
                <Select 
                  value={type === 'Vekil' ? formData.employerRepId : formData.professionalId} 
                  onValueChange={(v) => setFormData({ ...formData, [type === 'Vekil' ? 'employerRepId' : 'professionalId']: v })}
                >
                  <SelectTrigger className="rounded-xl border-slate-100 dark:border-slate-800 h-11 text-sm font-medium focus:ring-primary/10">
                    <SelectValue placeholder={type === 'Vekil' ? 'Vekil Listesi' : 'Uzman / Hekim Listesi'} />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {type === 'Vekil' 
                      ? employerReps.map((r: any) => (
                          <SelectItem key={r.id} value={r.id.toString()} className="text-xs font-medium">
                            {r.fullName} ({r.title || 'İşveren Vekili'})
                          </SelectItem>
                        ))
                      : professionals
                          .filter((p: any) => {
                            if (type === 'IGU') {
                              const isVeryDangerous = facility?.dangerClass === 'Çok Tehlikeli';
                              const isFirstAssignment = (facility?.compliance?.igu?.assignedMinutes || 0) === 0;
                              
                              if (isVeryDangerous && isFirstAssignment) {
                                return p.titleClass === 'A Sınıfı IGU';
                              }
                              return p.titleClass.includes('IGU');
                            }
                            if (type === 'Hekim') return p.titleClass === 'İşyeri Hekimi';
                            if (type === 'DSP') return p.titleClass === 'DSP';
                            return false;
                          })
                          .map((p: any) => (
                            <SelectItem key={p.id} value={p.id.toString()} className="text-xs font-medium">
                              {p.fullName} ({p.titleClass})
                            </SelectItem>
                          ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Süre (Dk/Ay) *</label>
                <div className="relative">
                  <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={formData.durationMinutes} 
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    required
                    className="pl-10 rounded-xl border-slate-100 dark:border-slate-800 h-11 text-sm font-medium focus-visible:ring-primary/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Başlangıç Tarihi *</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="date" 
                    value={formData.startDate} 
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="pl-10 rounded-xl border-slate-100 dark:border-slate-800 h-11 text-sm font-medium focus-visible:ring-primary/10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Maliyet Tipi</label>
                <Select 
                  value={formData.costType} 
                  onValueChange={(v) => setFormData({ ...formData, costType: v })}
                >
                  <SelectTrigger className="rounded-xl border-slate-100 dark:border-slate-800 h-11 text-sm font-medium focus:ring-primary/10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="Aylık Sabit" className="text-xs font-medium">Aylık Sabit</SelectItem>
                    <SelectItem value="Saatlik" className="text-xs font-medium">Saatlik</SelectItem>
                    <SelectItem value="Çalışan Başı" className="text-xs font-medium">Çalışan Başı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Birim Fiyat (₺)</label>
                <div className="relative">
                  <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={formData.unitPrice} 
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="pl-10 rounded-xl border-slate-100 dark:border-slate-800 h-11 text-sm font-medium focus-visible:ring-primary/10"
                    placeholder="0"
                  />
                </div>
              </div>

              <div className="md:col-span-2 flex items-center gap-4 p-5 bg-primary/[0.02] dark:bg-primary/[0.01] rounded-2xl border border-primary/10">
                <div 
                  className={cn(
                    "w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner",
                    formData.isFullTime ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                  )}
                  onClick={() => {
                    const newFT = !formData.isFullTime;
                    setFormData({ 
                      ...formData, 
                      isFullTime: newFT,
                      durationMinutes: newFT ? '11700' : formData.durationMinutes
                    });
                  }}
                >
                  <div className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                    formData.isFullTime ? "left-7" : "left-1"
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">TAM ZAMANLI ATAMA</span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-tight">Aylık yasal sınır (11700 dk) otomatik uygulanır.</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex flex-col gap-2">
              <div className="flex gap-3">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                  Atama yapılmadan önce personelin kalan kapasitesi sistem tarafından kontrol edilecektir. Kapasite yetersizse işlem reddedilir.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0 gap-3">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400 hover:text-slate-600 transition-colors">Vazgeç</Button>
            <Button 
              type="submit" 
              disabled={assignMutation.isPending || (type === 'Vekil' ? !formData.employerRepId : !formData.professionalId)} 
              className="rounded-xl h-11 px-10 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-xl text-white transition-all active:scale-95"
            >
              {assignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Atamayı Tamamla
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
