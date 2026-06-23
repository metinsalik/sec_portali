import React from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { StatusBadge } from './StatusBadge';
import { cn } from '@/lib/utils';

interface ProjectCardProps {
  project: any;
  className?: string;
}

export function ProjectCard({ project, className }: ProjectCardProps) {
  const navigate = useNavigate();

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd MMM yyyy', { locale: tr });
    } catch {
      return '-';
    }
  };

  const getIcraColor = (icraClass: string) => {
    switch (icraClass) {
      case 'Sınıf I': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
      case 'Sınıf II': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'Sınıf III': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Sınıf IV': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default: return 'bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-400';
    }
  };

  return (
    <div 
      onClick={() => navigate(`/build-management/project/${project.id}`)}
      className={cn(
        "group bg-white dark:bg-[#2c3135] border border-slate-200/80 dark:border-[#73787c]/30 rounded-xl p-5 hover:translate-y-[-4px] transition-all duration-300 cursor-pointer shadow-sm hover:shadow-md flex flex-col",
        className
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-bold text-[#011d2b] dark:text-[#cbe6fa] mb-1 line-clamp-2">
            {project.name}
          </h3>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {project.contractorCompany || 'Yüklenici Belirtilmedi'}
          </p>
        </div>
        <StatusBadge status={project.status} />
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Planlanan Başlangıç</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {formatDate(project.plannedStartDate)}
          </p>
        </div>
        <div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">Planlanan Bitiş</p>
          <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {formatDate(project.plannedEndDate)}
          </p>
        </div>
      </div>

      <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-700/50 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-[18px] text-slate-400">location_on</span>
          <span className="text-sm text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
            {project.location} {project.floor && `- ${project.floor}. Kat`}
          </span>
        </div>
        <div className={cn("px-2.5 py-1 rounded text-xs font-bold", getIcraColor(project.icraClass))}>
          ICRA: {project.icraClass || 'Belirsiz'}
        </div>
      </div>
    </div>
  );
}
