import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BuildProjectForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const facilityId = user?.facilityId;

  const { register, handleSubmit, formState: { errors } } = useForm();

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const payload = { ...data, facilityId, status: 'Taslak' };
      const res = await api.post('/build-management/projects', payload);
      return res.data;
    },
    onSuccess: (data) => {
      toast.success('Proje başarıyla oluşturuldu');
      queryClient.invalidateQueries({ queryKey: ['buildProjects'] });
      navigate(`/build-management/project/${data.id}`);
    },
    onError: () => {
      toast.error('Proje oluşturulurken bir hata oluştu');
    }
  });

  const onSubmit = (data: any) => {
    createMutation.mutate(data);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">Yeni İnşaat / Renovasyon Projesi</h2>
        <Button variant="outline" onClick={() => navigate('/build-management/dashboard')}>İptal</Button>
      </div>

      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proje Adı *</label>
              <input 
                {...register('name', { required: true })} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
                placeholder="Örn: 2. Kat Yenidoğan Yoğun Bakım Tadilatı"
              />
              {errors.name && <span className="text-red-500 text-xs">Bu alan zorunludur</span>}
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Lokasyon *</label>
              <input 
                {...register('location', { required: true })} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
                placeholder="Örn: Ana Bina B Blok"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Kat</label>
              <input 
                {...register('floor')} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
                placeholder="Örn: 2"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Departman</label>
              <input 
                {...register('department')} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Yüklenici Firma</label>
              <input 
                {...register('contractorCompany')} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Planlanan Başlangıç</label>
              <input 
                type="date"
                {...register('plannedStartDate')} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Planlanan Bitiş</label>
              <input 
                type="date"
                {...register('plannedEndDate')} 
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
              />
            </div>

            {/* ICRA Inputs */}
            <div className="col-span-2 border-t border-slate-200 dark:border-slate-700 pt-4 mt-2">
               <h3 className="font-bold text-slate-800 dark:text-slate-200 mb-4">ICRA Sınıflandırma Verileri</h3>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Çalışma Tipi (İnşaat Etkisi) *</label>
              <select {...register('buildType', { required: true })} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100">
                <option value="">Seçiniz...</option>
                <option value="A">Tip A (Küçük çaplı, tozsuz, denetimli faaliyet)</option>
                <option value="B">Tip B (Kısa süreli, az tozlu, küçük alan kesme/delme)</option>
                <option value="C">Tip C (Orta çaplı, tozlu, kısmi yıkım gerektiren)</option>
                <option value="D">Tip D (Büyük çaplı, çok tozlu, geniş kapsamlı yıkım/inşaat)</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Risk Grubu (Etkilenen Alan) *</label>
              <select {...register('riskGroup', { required: true })} className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100">
                <option value="">Seçiniz...</option>
                <option value="1">Düşük Risk (Ofisler, Koridorlar)</option>
                <option value="2">Orta Risk (Poliklinikler, Yemekhaneler)</option>
                <option value="3">Yüksek Risk (Acil Servis, Laboratuvar, Görüntüleme)</option>
                <option value="4">En Yüksek Risk (Ameliyathane, Yoğun Bakım, İzolasyon Odaları)</option>
              </select>
            </div>
            
            <div className="col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Proje Açıklaması</label>
              <textarea 
                {...register('description')} 
                rows={3}
                className="w-full p-2 border border-slate-300 dark:border-slate-600 rounded bg-transparent text-slate-900 dark:text-slate-100"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
            <Button type="submit" className="bg-[#1565c0] hover:bg-[#0d47a1] text-white px-8">
              Projeyi Oluştur
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
