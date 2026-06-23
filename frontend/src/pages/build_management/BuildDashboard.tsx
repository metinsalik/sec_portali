import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectCard } from '@/components/build_management/ProjectCard';
import { Button } from '@/components/ui/button';

export default function BuildDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const facilityId = user?.facilityId;

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['buildProjects', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get('/build-management/projects');
      return res.data;
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
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Aktif Projeler</h3>
            <span className="material-symbols-outlined text-blue-500">construction</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{activeProjects.length}</p>
        </div>
        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Onay Bekleyen</h3>
            <span className="material-symbols-outlined text-orange-500">pending_actions</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">
            {activeProjects.filter((p: any) => p.status === 'Onay Bekliyor').length}
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
        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-medium text-slate-500 dark:text-slate-400">Tamamlanan</h3>
            <span className="material-symbols-outlined text-emerald-500">check_circle</span>
          </div>
          <p className="text-3xl font-bold text-slate-800 dark:text-slate-100">{completedProjects.length}</p>
        </div>
      </div>

      <div className="mt-8">
        <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mb-4 flex items-center">
          <span className="material-symbols-outlined mr-2 text-blue-500">play_circle</span>
          Devam Eden Projeler
        </h3>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-pulse">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
            ))}
          </div>
        ) : activeProjects.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {activeProjects.slice(0, 6).map((project: any) => (
              <ProjectCard key={project.id} project={project} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700">
            <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">inbox</span>
            <p className="text-slate-500">Şu an devam eden aktif bir proje bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
}
