import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { ProjectCard } from '@/components/build_management/ProjectCard';
import { Button } from '@/components/ui/button';

export default function BuildProjectList() {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1565c0]">list_alt</span>
            Tüm İnşaat ve Renovasyon Projeleri
          </h2>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={() => navigate('/build-management/dashboard')}>
            <span className="material-symbols-outlined mr-2 text-[20px]">dashboard</span>
            Dashboard
          </Button>
          <Button onClick={() => navigate('/build-management/new')} className="bg-[#1565c0] hover:bg-[#0d47a1] text-white">
            <span className="material-symbols-outlined mr-2 text-[20px]">add</span>
            Yeni Proje
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="h-48 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <ProjectCard key={project.id} project={project} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">folder_open</span>
          <p className="text-slate-500">Henüz hiçbir proje eklenmemiş.</p>
          <Button onClick={() => navigate('/build-management/new')} className="mt-4 bg-[#1565c0] text-white">
            İlk Projeyi Oluştur
          </Button>
        </div>
      )}
    </div>
  );
}
