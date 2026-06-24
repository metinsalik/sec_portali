import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';

export default function BuildHandoverListPage() {
  const navigate = useNavigate();
  const [facilityId, setFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || '');

  useEffect(() => {
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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] flex items-center gap-2">
            <span className="material-symbols-outlined text-[#1565c0]">assignment_turned_in</span>
            Teslim Alma Kapısı (Projeler)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            İSG ve Enfeksiyon teslim alma süreçlerini yönetmek için bir proje seçin.
          </p>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      ) : projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {projects.map((project: any) => (
            <div 
              key={project.id} 
              onClick={() => navigate(`/build-management/project/${project.id}/handover`)}
              className="bg-white dark:bg-[#2c3135] p-5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm hover:border-[#1565c0] cursor-pointer transition-all group"
            >
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-bold text-slate-800 dark:text-slate-200 group-hover:text-[#1565c0]">
                  {project.name}
                </h3>
              </div>
              
              <div className="flex gap-4 mt-4 text-sm text-slate-500">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">factory</span>
                  İSG Formu
                </div>
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-sm">health_and_safety</span>
                  Enfeksiyon Formu
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700">
          <span className="material-symbols-outlined text-5xl text-slate-300 mb-3">folder_open</span>
          <p className="text-slate-500">Bu tesiste teslim alınacak proje bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
}
