import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatusBadge } from '@/components/build_management/StatusBadge';
import { GateCheck } from '@/components/build_management/GateCheck';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

export default function BuildProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: project, isLoading } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      return res.data;
    },
    enabled: !!id
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await api.patch(`/build-management/projects/${id}/status`, { status: newStatus });
      return res.data;
    },
    onSuccess: () => {
      toast.success('Proje durumu başarıyla güncellendi');
      queryClient.invalidateQueries({ queryKey: ['buildProject', id] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.error || 'Durum güncellenirken hata oluştu');
      // If server forcibly changes it to "Başlatılamaz", we still want to refresh to see the new state
      queryClient.invalidateQueries({ queryKey: ['buildProject', id] });
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Yükleniyor...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Proje bulunamadı.</div>;
  }

  const handleStatusChange = (newStatus: string) => {
    updateStatusMutation.mutate(newStatus);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">{project.name}</h2>
            <StatusBadge status={project.status} />
            <div className="px-2 py-1 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded">
              ICRA: {project.icraClass}
            </div>
          </div>
          <p className="text-slate-500 dark:text-slate-400">
            {project.location} {project.floor && `- ${project.floor}. Kat`} | Yüklenici: {project.contractorCompany || 'Belirtilmedi'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/build-management/list')}>Geri Dön</Button>
          
          {/* Status Change Actions */}
          {project.status === 'Taslak' && (
             <Button onClick={() => handleStatusChange('Ön İnceleme')} className="bg-[#1565c0] text-white">Ön İncelemeye Gönder</Button>
          )}
          {project.status === 'Onay Bekliyor' && (
             <Button onClick={() => handleStatusChange('Başlamaya Uygun')} className="bg-emerald-600 hover:bg-emerald-700 text-white">
               Projeyi Başlat
             </Button>
          )}
          {project.status === 'Başlamaya Uygun' && (
             <Button onClick={() => handleStatusChange('Devam Ediyor')} className="bg-indigo-600 hover:bg-indigo-700 text-white">
               Sahaya Giriş Yapıldı
             </Button>
          )}
          {project.status === 'Devam Ediyor' && (
             <Button onClick={() => handleStatusChange('Tamamlandı')} className="bg-green-600 hover:bg-green-700 text-white">
               Tamamlandı İşaretle
             </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Kolon: Proje Detayları */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Proje Bilgileri</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                 <p className="text-xs text-slate-500 mb-1">Departman / Bölüm</p>
                 <p className="font-medium text-slate-800 dark:text-slate-200">{project.department || '-'}</p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 mb-1">Çalışma Tipi</p>
                 <p className="font-medium text-slate-800 dark:text-slate-200">{project.workType}</p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 mb-1">İnşaat Tipi (A,B,C,D)</p>
                 <p className="font-medium text-slate-800 dark:text-slate-200">{project.buildType}</p>
              </div>
              <div>
                 <p className="text-xs text-slate-500 mb-1">Risk Grubu (1,2,3,4)</p>
                 <p className="font-medium text-slate-800 dark:text-slate-200">{project.riskGroup}</p>
              </div>
              <div className="col-span-2">
                 <p className="text-xs text-slate-500 mb-1">Açıklama</p>
                 <p className="text-sm text-slate-700 dark:text-slate-300">{project.description || 'Açıklama girilmemiş.'}</p>
              </div>
            </div>
          </div>

          {/* Gate Checks */}
          <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <h3 className="text-lg font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-2 border-b border-slate-100 dark:border-slate-800 pb-2">Onay Kapıları</h3>
             <GateCheck gateData={project.gateCheck} type="start" />
             <GateCheck gateData={project.gateCheck} type="handover" />
          </div>
        </div>

        {/* Sağ Kolon: Alt Modüller */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">İlişkili Modüller</h3>
          
          <div className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">design_services</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600">Tasarım Formu</h4>
                   <p className="text-xs text-slate-500">{project.designForm ? 'Dolduruldu' : 'Eksik'}</p>
                </div>
             </div>
             <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500">chevron_right</span>
          </div>

          <div className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-orange-300 transition-colors cursor-pointer group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-orange-600">Risk Değerlendirmesi</h4>
                   <p className="text-xs text-slate-500">{project.riskAssessment ? 'Hazır' : 'Eksik'}</p>
                </div>
             </div>
             <span className="material-symbols-outlined text-slate-300 group-hover:text-orange-500">chevron_right</span>
          </div>

          <div className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-emerald-300 transition-colors cursor-pointer group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">fact_check</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-emerald-600">Onaylar & İzinler</h4>
                   <p className="text-xs text-slate-500">{project.approvals?.length || 0} Onay, {project.permits?.length || 0} İzin</p>
                </div>
             </div>
             <span className="material-symbols-outlined text-slate-300 group-hover:text-emerald-500">chevron_right</span>
          </div>
          
          <div className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-red-300 transition-colors cursor-pointer group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">plumbing</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-red-600">Saha Denetimleri</h4>
                   <p className="text-xs text-slate-500">
                     {project.inspectionsOHS?.length || 0} İSG, {project.inspectionsInfection?.length || 0} Enfeksiyon
                   </p>
                </div>
             </div>
             <span className="material-symbols-outlined text-slate-300 group-hover:text-red-500">chevron_right</span>
          </div>

        </div>

      </div>
    </div>
  );
}
