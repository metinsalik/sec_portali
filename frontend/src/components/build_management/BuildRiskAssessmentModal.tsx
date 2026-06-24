import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { toast } from 'sonner';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  project: any;
}

export function BuildRiskAssessmentModal({ open, onOpenChange, project }: Props) {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, watch, setValue } = useForm();

  const likelihood = watch('likelihood') || 0;
  const severity = watch('severity') || 0;
  const score = likelihood * severity;
  
  let riskLevel = 'Düşük';
  let levelColor = 'bg-green-100 text-green-800';
  if (score >= 16) { riskLevel = 'Kritik'; levelColor = 'bg-red-100 text-red-800'; }
  else if (score >= 10) { riskLevel = 'Yüksek'; levelColor = 'bg-orange-100 text-orange-800'; }
  else if (score >= 5) { riskLevel = 'Orta'; levelColor = 'bg-yellow-100 text-yellow-800'; }

  useEffect(() => {
    if (project?.riskAssessment) {
      reset(project.riskAssessment);
    } else {
      reset({
        likelihood: 0, severity: 0, patientCareProximity: false, dustNoiseVibration: false,
        criticalAreaAffected: false, hvacAffected: false, medicalGasAffected: false,
        fireSafetyAffected: false, powerOutageRisk: false, waterLeakRisk: false,
        ohsNotes: '', infectionNotes: ''
      });
    }
  }, [project, open, reset]);

  const mutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = {
        ...data,
        likelihood: Number(data.likelihood),
        severity: Number(data.severity),
      };
      const res = await api.post(`/build-management/projects/${project.id}/risk-assessment`, payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Kaydetme hatası');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Risk değerlendirmesi kaydedildi');
      queryClient.invalidateQueries({ queryKey: ['buildProject', project.id] });
      onOpenChange(false);
    },
    onError: () => toast.error('Risk değerlendirmesi kaydedilemedi')
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Risk Değerlendirmesi (5x5 Matris)</DialogTitle>
          <DialogDescription>İnşaat/Renovasyon projesi için risk olasılık ve şiddet değerlerini girin.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit((d) => mutation.mutate(d))} className="space-y-6">
          <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border">
            <div>
              <label className="block text-sm font-semibold mb-2">Olasılık (1-5)</label>
              <select {...register('likelihood')} className="w-full h-10 border rounded-md px-3 bg-white">
                <option value={0}>Seçiniz</option>
                <option value={1}>1 - Çok Küçük</option>
                <option value={2}>2 - Küçük</option>
                <option value={3}>3 - Orta</option>
                <option value={4}>4 - Yüksek</option>
                <option value={5}>5 - Çok Yüksek</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-semibold mb-2">Şiddet (1-5)</label>
              <select {...register('severity')} className="w-full h-10 border rounded-md px-3 bg-white">
                <option value={0}>Seçiniz</option>
                <option value={1}>1 - Çok Hafif</option>
                <option value={2}>2 - Hafif</option>
                <option value={3}>3 - Orta</option>
                <option value={4}>4 - Ciddi</option>
                <option value={5}>5 - Çok Ciddi / Ölümcül</option>
              </select>
            </div>
            
            <div className="col-span-2 flex items-center justify-between p-3 mt-2 bg-white rounded border">
               <div>
                  <div className="text-sm text-slate-500">Hesaplanan Skor</div>
                  <div className="text-2xl font-bold">{score}</div>
               </div>
               <div className={`px-4 py-2 rounded-lg font-bold ${levelColor}`}>
                  {riskLevel} Risk
               </div>
            </div>
          </div>

          <div className="space-y-3">
             <h4 className="font-semibold text-sm border-b pb-1">Ek Risk Parametreleri</h4>
             <div className="grid grid-cols-2 gap-3 text-sm">
                <label className="flex items-center gap-2"><input type="checkbox" {...register('patientCareProximity')} /> Hasta Bakım Alanına Yakın</label>
                <label className="flex items-center gap-2"><input type="checkbox" {...register('dustNoiseVibration')} /> Toz, Gürültü, Titreşim</label>
                <label className="flex items-center gap-2"><input type="checkbox" {...register('criticalAreaAffected')} /> Kritik Alan Etkilenimi</label>
                <label className="flex items-center gap-2"><input type="checkbox" {...register('hvacAffected')} /> Havalandırma Etkilenimi</label>
                <label className="flex items-center gap-2"><input type="checkbox" {...register('medicalGasAffected')} /> Tıbbi Gaz Etkilenimi</label>
                <label className="flex items-center gap-2"><input type="checkbox" {...register('fireSafetyAffected')} /> Yangın Güvenliği Etkilenimi</label>
             </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">İSG Notları ve Önlemler</label>
              <textarea {...register('ohsNotes')} className="w-full border rounded-md p-2 h-20" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Enfeksiyon Kontrol Notları</label>
              <textarea {...register('infectionNotes')} className="w-full border rounded-md p-2 h-20" />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
            <Button type="submit" disabled={mutation.isPending || score === 0}>Kaydet</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
