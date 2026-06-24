import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function BuildInspectionsPage() {
  const navigate = useNavigate();
  const facilityId = localStorage.getItem('activeFacilityId');

  const { data: projects = [], isLoading } = useQuery({
    queryKey: ['buildProjects', facilityId],
    queryFn: async () => {
      const res = await api.get('/build-management/projects');
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  // Sadece Devam Ediyor olan projeleri göster
  const activeProjects = projects.filter((p: any) => p.status === 'Devam Ediyor');

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">Saha Denetimleri</h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Devam eden inşaat projeleri için İSG ve Enfeksiyon denetimlerini yürütün.</p>
        </div>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-4">
          {[1, 2, 3].map(i => <div key={i} className="h-24 bg-slate-200 dark:bg-slate-800 rounded-xl" />)}
        </div>
      ) : activeProjects.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {activeProjects.map((project: any) => (
            <div key={project.id} className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-slate-200">{project.name}</h3>
                <p className="text-sm text-slate-500 line-clamp-2 mt-1">{project.description}</p>
                <div className="mt-4 flex gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-sm text-slate-400">domain</span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{project.workArea || 'Belirtilmedi'}</span>
                  </div>
                </div>
              </div>
              <div className="mt-6 flex justify-end gap-3">
                <Button 
                  onClick={() => navigate(`/build-management/project/${project.id}/inspections`)}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <span className="material-symbols-outlined mr-2 text-[20px]">manage_search</span>
                  Proje Denetim Panosu
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">inbox</span>
          <p className="text-slate-500">Şu an denetim yapılabilecek "Devam Ediyor" durumunda aktif bir proje bulunmuyor.</p>
        </div>
      )}
    </div>
  );
}
