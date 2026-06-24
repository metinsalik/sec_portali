import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

const CATEGORIES = [
  'Hava kalitesi',
  'Enfeksiyonların önlenmesi ve kontrolü',
  'Altyapı sistemleri',
  'Gürültü',
  'Titreşim',
  'Tehlikeli maddeler ve atıklar',
  'Yangın güvenliği',
  'Emniyet',
  'Acil durum prosedürleri (alternatif yollar vb.)',
  'Diğer tehlikeler (bakımı, tedavileri etkileyen)'
];

const generateId = () => {
  return typeof crypto !== 'undefined' && crypto.randomUUID 
    ? crypto.randomUUID() 
    : Date.now().toString(36) + Math.random().toString(36).substr(2);
};

type PCRAModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: any) => void;
  defaultValues?: any;
  mode: 'add' | 'edit' | 'view';
};

export function PCRAModal({ open, onOpenChange, onSave, defaultValues, mode }: PCRAModalProps) {
  const { register, handleSubmit, watch, reset, setValue } = useForm({
    defaultValues: defaultValues || {
      id: generateId(),
      category: '',
      hazard: '',
      risk: '',
      activity: '',
      initialLikelihood: 0,
      initialSeverity: 0,
      department: '',
      responsible: '',
      dueDate: '',
      precautions: '',
      finalLikelihood: 0,
      finalSeverity: 0,
      controlSteps: ''
    }
  });

  const facilityId = localStorage.getItem('activeFacilityId') || '';

  const { data: departments = [] } = useQuery<any[]>({ 
    queryKey: ['build-departments', facilityId], 
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/build-management/settings/departments?facilityId=${facilityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: persons = [] } = useQuery<any[]>({ 
    queryKey: ['build-persons', facilityId], 
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/build-management/settings/persons?facilityId=${facilityId}`, { headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!facilityId
  });

  useEffect(() => {
    if (open) {
      if (defaultValues) {
        reset(defaultValues);
      } else {
        reset({
          id: generateId(),
          category: '',
          hazard: '',
          risk: '',
          activity: '',
          initialLikelihood: 0,
          initialSeverity: 0,
          department: '',
          responsible: '',
          dueDate: '',
          precautions: '',
          finalLikelihood: 0,
          finalSeverity: 0,
          controlSteps: ''
        });
      }
    }
  }, [open, defaultValues, reset]);

  const initialLikelihood = watch('initialLikelihood') || 0;
  const initialSeverity = watch('initialSeverity') || 0;
  const initialScore = Number(initialLikelihood) * Number(initialSeverity);

  const finalLikelihood = watch('finalLikelihood') || 0;
  const finalSeverity = watch('finalSeverity') || 0;
  const finalScore = Number(finalLikelihood) * Number(finalSeverity);

  const getRiskLevel = (score: number) => {
    if (score >= 17) return { label: 'Kritik Risk', color: 'bg-red-100 text-red-800' };
    if (score >= 10) return { label: 'Yüksek Risk', color: 'bg-orange-100 text-orange-800' };
    if (score >= 5) return { label: 'Orta Risk', color: 'bg-yellow-100 text-yellow-800' };
    if (score > 0) return { label: 'Düşük Risk', color: 'bg-green-100 text-green-800' };
    return { label: '-', color: 'bg-slate-100 text-slate-800' };
  };

  const initLevel = getRiskLevel(initialScore);
  const finLevel = getRiskLevel(finalScore);
  const isView = mode === 'view';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {mode === 'add' ? 'Yeni Risk Ekle' : mode === 'edit' ? 'Riski Düzenle' : 'Risk Detayı'}
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit(onSave)} className="space-y-6 mt-4">
          <fieldset disabled={isView} className="space-y-6">
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Kategori</label>
                <select {...register('category', { required: true })} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                  <option value="">Seçiniz...</option>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Faaliyet</label>
                <Input {...register('activity')} placeholder="İlgili faaliyet..." />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">Tehlike</label>
                <Textarea {...register('hazard')} rows={3} placeholder="Tehlike tanımı..." />
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Risk</label>
                <Textarea {...register('risk')} rows={3} placeholder="Risk tanımı..." />
              </div>
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm mb-4">İlk Değerlendirme</h4>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Olasılık (1-5)</label>
                  <select {...register('initialLikelihood')} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                    <option value={0}>Seçiniz</option>
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Şiddet (1-5)</label>
                  <select {...register('initialSeverity')} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                    <option value={0}>Seçiniz</option>
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">İlk Risk Skoru</label>
                  <div className={`h-10 flex items-center justify-center font-bold rounded-md border ${initLevel.color}`}>
                    {initialScore > 0 ? `${initialScore} - ${initLevel.label}` : '-'}
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-semibold mb-1 block">İlgili Departman</label>
                <select {...register('department')} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                  <option value="">Seçiniz...</option>
                  {departments.map((d: any) => <option key={d.id} value={d.name}>{d.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Sorumlu Kişi</label>
                <select {...register('responsible')} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                  <option value="">Seçiniz...</option>
                  {persons.map((p: any) => <option key={p.id} value={p.name}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="text-sm font-semibold mb-1 block">Termin Tarihi / Periyot</label>
                <Input {...register('dueDate')} placeholder="Örn: 1 Hafta veya 20.08.2024" />
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">Alınacak Önlemler</label>
              <Textarea {...register('precautions')} rows={3} placeholder="Önlemler ve aksiyonlar..." />
            </div>

            <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200 dark:border-slate-800">
              <h4 className="font-bold text-sm mb-4">İyileştirme Sonrası Değerlendirme</h4>
              <div className="grid grid-cols-3 gap-4 items-center">
                <div>
                  <label className="text-xs font-semibold mb-1 block">Olasılık (1-5)</label>
                  <select {...register('finalLikelihood')} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                    <option value={0}>Seçiniz</option>
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Şiddet (1-5)</label>
                  <select {...register('finalSeverity')} className="w-full rounded-md border border-input bg-background px-3 h-10 text-sm">
                    <option value={0}>Seçiniz</option>
                    {[1,2,3,4,5].map(v => <option key={v} value={v}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold mb-1 block">Son Risk Skoru</label>
                  <div className={`h-10 flex items-center justify-center font-bold rounded-md border ${finLevel.color}`}>
                    {finalScore > 0 ? `${finalScore} - ${finLevel.label}` : '-'}
                  </div>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-semibold mb-1 block">İyileştirme Kontrol Adımları</label>
              <Textarea {...register('controlSteps')} rows={2} placeholder="Uygulama kontrolü..." />
            </div>

          </fieldset>
          
          {!isView && (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" variant="outline" className="mr-3" onClick={() => onOpenChange(false)}>
                İptal
              </Button>
              <Button type="submit">
                {mode === 'add' ? 'Riski Ekle' : 'Değişiklikleri Kaydet'}
              </Button>
            </div>
          )}
          {isView && (
            <div className="flex justify-end pt-4 border-t">
              <Button type="button" onClick={() => onOpenChange(false)}>Kapat</Button>
            </div>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
}
