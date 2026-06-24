import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, CheckCircle2, Factory } from 'lucide-react';
import { Button } from '@/components/ui/button';
import api from '@/lib/api';
import { BuildHandoverOHSForm } from '@/components/build_management/BuildHandoverOHSForm';
import { BuildHandoverInfectionForm } from '@/components/build_management/BuildHandoverInfectionForm';

export default function BuildProjectHandoverPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ohs' | 'infection'>('ohs');

  const { data: project, isLoading } = useQuery({
    queryKey: ['buildProject', id],
    queryFn: async () => {
      const res = await api.get(`/build-management/projects/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!id
  });

  if (isLoading) return <div className="p-8">Yükleniyor...</div>;
  if (!project) return <div className="p-8">Proje bulunamadı.</div>;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-24">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="outline" size="icon" onClick={() => navigate(`/build-management/project/${id}`)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h2 className="text-2xl font-bold text-[#011d2b] dark:text-[#cbe6fa]">
            Teslim Alma Kapısı
          </h2>
          <p className="text-slate-500 dark:text-slate-400 mt-1">
            {project.name}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl w-fit">
        <button
          onClick={() => setActiveTab('ohs')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'ohs'
              ? 'bg-white dark:bg-[#1f2428] text-blue-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <Factory className="w-4 h-4" />
          İSG Teslim Alma
        </button>
        <button
          onClick={() => setActiveTab('infection')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'infection'
              ? 'bg-white dark:bg-[#1f2428] text-purple-600 shadow-sm'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-200 hover:bg-slate-200/50 dark:hover:bg-slate-700/50'
          }`}
        >
          <CheckCircle2 className="w-4 h-4" />
          Enfeksiyon Teslim Alma
        </button>
      </div>

      {/* Content */}
      <div className="mt-6">
        {activeTab === 'ohs' ? (
          <BuildHandoverOHSForm projectId={id as string} project={project} />
        ) : (
          <BuildHandoverInfectionForm projectId={id as string} project={project} />
        )}
      </div>
    </div>
  );
}
