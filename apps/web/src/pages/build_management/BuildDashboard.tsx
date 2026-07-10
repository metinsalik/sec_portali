import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectCard } from '@/components/build_management/ProjectCard';
import { Button } from '@/components/ui/button';

export default function BuildDashboard() {
  const navigate = useNavigate();
  const [facilityId, setFacilityId] = React.useState<string>(localStorage.getItem('activeFacilityId') || '');

  React.useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['buildProjects', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects?facilityId=${facilityId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const activeProjects = projects.filter((p: any) => 
    !['Tamamlandı', 'Teslim Edildi', 'Arşivlendi'].includes(p.status)
  );

  const completedProjects = projects.filter((p: any) => 
    ['Tamamlandı', 'Teslim Edildi'].includes(p.status)
  );

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">İnşaat ve Renovasyon Yönetimi</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Tesisinizdeki tüm inşaat, tadilat ve renovasyon projelerini yönetin.</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/build-management/list')}>
            Tüm Projeler
          </Button>
          <Button onClick={() => navigate('/build-management/new')} className="bg-[#1565c0] hover:bg-[#0d47a1] text-white">
            <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
            Yeni Proje Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Toplam Aktif Proje</h3>
            <span className="material-symbols-outlined text-blue-500">list_alt</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{activeProjects.length}</p>
        </div>
        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Sahada Devam Eden</h3>
            <span className="material-symbols-outlined text-emerald-500">construction</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {activeProjects.filter((p: any) => p.status === 'Devam Ediyor').length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Planlama & Onay Aşamasında</h3>
            <span className="material-symbols-outlined text-orange-500">pending_actions</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {activeProjects.filter((p: any) => p.status === 'Başlatılmaz' || p.status === 'İş Başlayabilir').length}
          </p>
        </div>
        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Kritik Risk (Sınıf IV)</h3>
            <span className="material-symbols-outlined text-red-500">warning</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {activeProjects.filter((p: any) => p.icraClass === 'Sınıf IV').length}
          </p>
        </div>
      </div>

      <div className="mt-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 flex items-center">
            <span className="material-symbols-outlined mr-2 text-blue-500">view_kanban</span>
            İş Panosu
          </h3>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-96 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
            
            {/* Column 1: Planlama / Başlatılmaz */}
            <div className="bg-slate-50 dark:bg-[#202427] p-4 rounded-xl border border-slate-200 dark:border-slate-700 min-h-[500px]">
              <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-slate-700 pb-2">
                <h4 className="font-bold text-slate-700 dark:text-slate-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-slate-400"></span>
                  Başlatılamaz / Planlama
                </h4>
                <span className="bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold px-2 py-1 rounded-full">
                  {projects.filter((p: any) => p.status === 'Başlatılmaz' || p.status === 'İş Başlayabilir').length}
                </span>
              </div>
              <div className="space-y-4">
                {projects.filter((p: any) => p.status === 'Başlatılmaz' || p.status === 'İş Başlayabilir').map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>

            {/* Column 2: Devam Ediyor */}
            <div className="bg-blue-50/50 dark:bg-[#202427] p-4 rounded-xl border border-blue-100 dark:border-slate-700 min-h-[500px]">
              <div className="flex items-center justify-between mb-4 border-b border-blue-100 dark:border-slate-700 pb-2">
                <h4 className="font-bold text-blue-700 dark:text-blue-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-500"></span>
                  Devam Ediyor
                </h4>
                <span className="bg-blue-200 dark:bg-slate-700 text-blue-700 dark:text-blue-300 text-xs font-bold px-2 py-1 rounded-full">
                  {projects.filter((p: any) => p.status === 'Devam Ediyor').length}
                </span>
              </div>
              <div className="space-y-4">
                {projects.filter((p: any) => p.status === 'Devam Ediyor').map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>

            {/* Column 3: Tamamlandı */}
            <div className="bg-emerald-50/50 dark:bg-[#202427] p-4 rounded-xl border border-emerald-100 dark:border-slate-700 min-h-[500px]">
              <div className="flex items-center justify-between mb-4 border-b border-emerald-100 dark:border-slate-700 pb-2">
                <h4 className="font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Tamamlanmış
                </h4>
                <span className="bg-emerald-200 dark:bg-slate-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold px-2 py-1 rounded-full">
                  {completedProjects.length}
                </span>
              </div>
              <div className="space-y-4">
                {completedProjects.map((project: any) => (
                  <ProjectCard key={project.id} project={project} />
                ))}
              </div>
            </div>

          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">inbox</span>
            <p className="text-slate-500">Henüz eklenmiş bir proje bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
