import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { BuildInspectionPrintModal } from '@/components/build_management/BuildInspectionPrintModal';

export default function BuildProjectInspectionsDashboard() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [printModalOpen, setPrintModalOpen] = useState(false);
  const [selectedInspection, setSelectedInspection] = useState<any>(null);

  // Fetch project details
  const { data: project, isLoading: isLoadingProject } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    }
  });

  // Fetch OHS inspections
  const { data: ohsInspections = [], isLoading: isLoadingOHS } = useQuery({
    queryKey: ['buildInspections', id, 'ohs'],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}/inspections/ohs`);
      return res.json();
    }
  });

  // Fetch Infection inspections
  const { data: infectionInspections = [], isLoading: isLoadingInfection } = useQuery({
    queryKey: ['buildInspections', id, 'infection'],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}/inspections/infection`);
      return res.json();
    }
  });

  if (isLoadingProject) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-10 bg-slate-200 dark:bg-slate-800 rounded w-1/3"></div>
        <div className="h-32 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">
            Proje Denetim Panosu: <span className="text-blue-600">{project?.name}</span>
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">Bu projeye ait İSG ve Enfeksiyon denetimlerini yönetin.</p>
        </div>
        <Button variant="outline" onClick={() => navigate(`/build-management/project/${id}`)}>
          <span className="material-symbols-outlined mr-2">arrow_back</span>
          Geri Dön
        </Button>
      </div>

      {/* Aksiyon Butonları */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center gap-4">
          <div className="w-16 h-16 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">health_and_safety</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">İSG Saha Denetimi</h3>
            <p className="text-sm text-slate-500">18 maddelik İSG güvenlik standartları kontrolü</p>
          </div>
          <Button 
            onClick={() => navigate(`/build-management/project/${id}/inspections/ohs/new`)}
            className="bg-blue-600 hover:bg-blue-700 text-white w-full max-w-xs"
          >
            Yeni İSG Kontrolü Başlat
          </Button>
        </div>

        <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col items-center justify-center text-center gap-4 opacity-75">
          <div className="w-16 h-16 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">coronavirus</span>
          </div>
          <div>
            <h3 className="font-bold text-lg">Enfeksiyon Kontrolü</h3>
            <p className="text-sm text-slate-500">Enfeksiyon ve hijyen standartları kontrolü</p>
          </div>
          <Button 
            onClick={() => navigate(`/build-management/project/${id}/inspections/infection/new`)}
            className="bg-emerald-600 hover:bg-emerald-700 text-white w-full max-w-xs"
          >
            Yeni Kontrol Başlat
          </Button>
        </div>
      </div>

      {/* Arşiv Tablosu */}
      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <span className="material-symbols-outlined mr-2 text-slate-500">inventory_2</span>
          İSG Denetim Arşivi
        </h3>

        {isLoadingOHS ? (
          <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        ) : ohsInspections.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Denetçi</th>
                  <th className="px-4 py-3">Sonuç</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {[...ohsInspections]
                  .sort((a: any, b: any) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime())
                  .map((inspection: any) => (
                  <tr key={inspection.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">{new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3">{inspection.inspector}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${inspection.result === 'UYGUNDUR' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {inspection.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                        onClick={() => navigate(`/build-management/project/${id}/inspections/ohs/edit/${inspection.id}`)}
                      >
                        <span className="material-symbols-outlined mr-1 text-[18px]">edit</span>
                        Düzenle
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedInspection({...inspection, type: 'ohs'});
                          setPrintModalOpen(true);
                        }}
                      >
                        <span className="material-symbols-outlined mr-1 text-[18px]">print</span>
                        Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Henüz bu proje için bir denetim kaydı bulunmuyor.
          </div>
        )}
      </div>

      {/* Enfeksiyon Arşiv Tablosu */}
      <div className="bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm mt-8">
        <h3 className="text-lg font-bold mb-4 flex items-center">
          <span className="material-symbols-outlined mr-2 text-slate-500">inventory_2</span>
          Enfeksiyon Kontrol Arşivi
        </h3>

        {isLoadingInfection ? (
          <div className="animate-pulse h-32 bg-slate-100 dark:bg-slate-800 rounded-lg"></div>
        ) : infectionInspections.length > 0 ? (
          <div className="overflow-x-auto border border-slate-200 dark:border-slate-700 rounded-lg">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-slate-500 bg-slate-50 dark:bg-slate-800 uppercase border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Tarih</th>
                  <th className="px-4 py-3">Denetçi</th>
                  <th className="px-4 py-3">Sonuç</th>
                  <th className="px-4 py-3 text-right">İşlem</th>
                </tr>
              </thead>
              <tbody>
                {[...infectionInspections]
                  .sort((a: any, b: any) => new Date(b.inspectionDate).getTime() - new Date(a.inspectionDate).getTime())
                  .map((inspection: any) => (
                  <tr key={inspection.id} className="border-b border-slate-200 dark:border-slate-700 last:border-0 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="px-4 py-3 font-medium">{new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}</td>
                    <td className="px-4 py-3">{inspection.inspector}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${inspection.result === 'UYGUNDUR' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
                        {inspection.result}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-orange-600 hover:text-orange-800 hover:bg-orange-50"
                        onClick={() => navigate(`/build-management/project/${id}/inspections/infection/edit/${inspection.id}`)}
                      >
                        <span className="material-symbols-outlined mr-1 text-[18px]">edit</span>
                        Düzenle
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        className="text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                        onClick={() => {
                          setSelectedInspection({...inspection, type: 'infection'});
                          setPrintModalOpen(true);
                        }}
                      >
                        <span className="material-symbols-outlined mr-1 text-[18px]">print</span>
                        Görüntüle
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-8 text-slate-500">
            Henüz bu proje için bir enfeksiyon denetim kaydı bulunmuyor.
          </div>
        )}
      </div>


      <BuildInspectionPrintModal
        open={printModalOpen}
        onOpenChange={setPrintModalOpen}
        inspection={selectedInspection}
        project={project}
      />
    </div>
  );
}
