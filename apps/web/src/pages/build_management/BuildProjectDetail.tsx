import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { StatusBadge } from '@/components/build_management/StatusBadge';
import { GateCheck } from '@/components/build_management/GateCheck';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BuildDocumentsModal } from '@/components/build_management/BuildDocumentsModal';
import { BuildApprovalsModal } from '@/components/build_management/BuildApprovalsModal';

export default function BuildProjectDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [approvalsModalOpen, setApprovalsModalOpen] = useState(false);

  const { data: project, isLoading } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!id
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (newStatus: string) => {
      const res = await api.patch(`/build-management/projects/${id}/status`, { status: newStatus });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Hata');
      }
      return res.json();
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

  const deleteProjectMutation = useMutation({
    mutationFn: async () => {
      const res = await api.delete(`/build-management/projects/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast.success('Proje başarıyla silindi/iptal edildi');
      navigate('/build-management/list');
    },
    onError: () => {
      toast.error('Proje silinirken bir hata oluştu');
    }
  });

  if (isLoading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Yükleniyor...</div>;
  }

  if (!project) {
    return <div className="p-8 text-center text-red-500">Proje bulunamadı.</div>;
  }

  const handleStatusChange = (newStatus: string) => {
    if (newStatus === 'Tamamlandı') {
      const hasOHS = project?.handoverOHSInspections?.length > 0;
      const hasInfection = project?.handoverInfectionInspections?.length > 0;
      
      if (!hasOHS || !hasInfection) {
        toast.error('Projeyi tamamlamak için İSG ve Enfeksiyon Teslim Alma formlarının doldurulması zorunludur.');
        return;
      }
    }

    updateStatusMutation.mutate(newStatus);
  };

  const handleDeleteProject = () => {
    if (window.confirm('Bu projeyi silmek veya iptal etmek istediğinize emin misiniz? Bu işlem geri alınamaz ve projeye ait tüm kayıtlar silinir.')) {
      deleteProjectMutation.mutate();
    }
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
            {project.location ? `${project.location.block} - ${project.location.floor}` : 'Lokasyon Belirsiz'} | Yüklenici: {project.contractor?.name || 'Belirtilmedi'}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/build-management/list')}>Geri Dön</Button>
          <Button variant="destructive" onClick={handleDeleteProject} disabled={deleteProjectMutation.isPending}>
            {deleteProjectMutation.isPending ? 'Siliniyor...' : 'Projeyi Sil / İptal'}
          </Button>
          
          {/* Status Change Actions */}
          {project.status === 'Başlatılmaz' && project.gateCheck?.canStart && (
             <Button onClick={() => handleStatusChange('İş Başlayabilir')} className="bg-[#1565c0] text-white">İş Başlayabilir (Onayla)</Button>
          )}
          {project.status === 'İş Başlayabilir' && (
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

      {/* Stepper */}
      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div className="flex items-center justify-between relative">
          <div className="absolute top-1/2 left-0 right-0 h-1 bg-slate-200 dark:bg-slate-700 -z-10 -translate-y-1/2 rounded"></div>
          
          {[
            { id: 'Başlatılmaz', label: '1. Planlama' },
            { id: 'İş Başlayabilir', label: '2. İş Başlayabilir' },
            { id: 'Devam Ediyor', label: '3. Uygulama' },
            { id: 'Tamamlandı', label: '4. Teslim & Rapor' }
          ].map((step, idx, arr) => {
             const currentIndex = arr.findIndex(s => s.id === project.status) || 0;
             const isPast = idx < currentIndex;
             const isCurrent = idx === currentIndex;
             return (
               <div key={step.id} className="flex flex-col items-center bg-white dark:bg-[#2c3135] px-4">
                 <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 ${isPast ? 'bg-emerald-500 border-emerald-500 text-white' : isCurrent ? 'border-[#1565c0] text-[#1565c0]' : 'border-slate-300 text-slate-400 bg-white'}`}>
                   {isPast ? '✓' : idx + 1}
                 </div>
                 <span className={`text-xs mt-2 font-medium ${isPast || isCurrent ? 'text-slate-800 dark:text-slate-200' : 'text-slate-400'}`}>{step.label}</span>
               </div>
             )
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sol Kolon: Proje Detayları */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
            <h3 className="text-lg font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-4 border-b border-slate-100 dark:border-slate-800 pb-2">Proje Bilgileri</h3>
            <div className="grid grid-cols-2 gap-y-4 gap-x-6">
              <div>
                 <p className="text-xs text-slate-500 mb-1">Çalışma Tipi</p>
                 <p className="font-medium text-slate-800 dark:text-slate-200">{project.workType?.name || '-'}</p>
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
          
          <div className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-blue-300 transition-colors group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">design_services</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600">Hizmet Tasarım Formu</h4>
                   <p className="text-xs text-slate-500">{project.designForm ? 'Dolduruldu' : 'Eksik'}</p>
                </div>
             </div>
             
             <div className="flex items-center gap-2">
                {project.designForm ? (
                  <>
                    <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/build-management/project/${id}/design-form?mode=view`); }}>
                      Görüntüle
                    </Button>
                    <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/build-management/project/${id}/design-form?mode=edit`); }}>
                      Düzenle
                    </Button>
                  </>
                ) : (
                  <Button variant="default" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/build-management/project/${id}/design-form`); }}>
                    Doldur
                  </Button>
                )}
             </div>
          </div>

          <div onClick={() => navigate(`/build-management/project/${id}/risk-assessment`)} className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-orange-300 transition-colors cursor-pointer group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">warning</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-orange-600">Risk Değerlendirmesi</h4>
                   <p className="text-xs text-slate-500">
                     {project.gateCheck?.startRequirements?.find((r: any) => r.name.includes('Risk Değerlendirmesi'))?.isMet 
                       ? 'Tamamlandı' 
                       : 'Eksik'}
                   </p>
                </div>
             </div>
             <span className="material-symbols-outlined text-slate-300 group-hover:text-orange-500">chevron_right</span>
          </div>

          <div onClick={() => setDocsModalOpen(true)} className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-blue-300 transition-colors cursor-pointer group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">description</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-blue-600">Yüklenici Evrakları</h4>
                   <p className="text-xs text-slate-500">{(project.documents?.filter((d: any) => d.status === 'Onaylandı')?.length || 0)} Onaylı Evrak</p>
                </div>
             </div>
             <span className="material-symbols-outlined text-slate-300 group-hover:text-blue-500">chevron_right</span>
          </div>

          <div onClick={() => setApprovalsModalOpen(true)} className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-emerald-300 transition-colors cursor-pointer group">
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
                    <div onClick={() => navigate(`/build-management/project/${id}/inspections`)} className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-red-300 transition-colors cursor-pointer group">
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

          <div onClick={() => navigate(`/build-management/project/${id}/handover`)} className="bg-white dark:bg-[#2c3135] border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex items-center justify-between hover:border-purple-300 transition-colors cursor-pointer group">
             <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                   <span className="material-symbols-outlined">assignment_turned_in</span>
                </div>
                <div>
                   <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200 group-hover:text-purple-600">Teslim Alma Formları</h4>
                   <p className="text-xs text-slate-500">
                     {project.handoverOHSInspections?.length > 0 || project.handoverInfectionInspections?.length > 0 ? 'Dolduruldu' : 'Bekliyor'}
                   </p>
                </div>
             </div>
             <span className="material-symbols-outlined text-slate-300 group-hover:text-purple-500">chevron_right</span>
          </div>

        </div>

      </div>

      <BuildDocumentsModal 
        open={docsModalOpen} 
        onOpenChange={setDocsModalOpen} 
        project={project} 
      />

      <BuildApprovalsModal
        open={approvalsModalOpen}
        onOpenChange={setApprovalsModalOpen}
        project={project}
      />
    </div>
  );
}
