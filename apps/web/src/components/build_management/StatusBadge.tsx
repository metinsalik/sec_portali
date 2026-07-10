import React from 'react';
import { cn } from '@/lib/utils';

export type BuildProjectStatus = 
  | 'Taslak'
  | 'Ön İnceleme'
  | 'Risk Değerlendirme'
  | 'Onay Bekliyor'
  | 'Başlatılamaz'
  | 'Başlamaya Uygun'
  | 'Devam Ediyor'
  | 'Durduruldu'
  | 'Teslim Bekliyor'
  | 'Tamamlandı'
  | 'Arşivlendi';

interface StatusBadgeProps {
  status: BuildProjectStatus | string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Taslak': { bg: 'bg-slate-100 dark:bg-slate-800', text: 'text-slate-700 dark:text-slate-300', dot: 'bg-slate-500' },
  'Ön İnceleme': { bg: 'bg-blue-50 dark:bg-blue-950/50', text: 'text-blue-700 dark:text-blue-300', dot: 'bg-blue-500' },
  'Risk Değerlendirme': { bg: 'bg-yellow-50 dark:bg-yellow-950/50', text: 'text-yellow-700 dark:text-yellow-300', dot: 'bg-yellow-500' },
  'Onay Bekliyor': { bg: 'bg-orange-50 dark:bg-orange-950/50', text: 'text-orange-700 dark:text-orange-300', dot: 'bg-orange-500' },
  'Başlatılamaz': { bg: 'bg-red-50 dark:bg-red-950/50', text: 'text-red-700 dark:text-red-300', dot: 'bg-red-500' },
  'Başlamaya Uygun': { bg: 'bg-emerald-50 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-300', dot: 'bg-emerald-500' },
  'Devam Ediyor': { bg: 'bg-indigo-50 dark:bg-indigo-950/50', text: 'text-indigo-700 dark:text-indigo-300', dot: 'bg-indigo-500' },
  'Durduruldu': { bg: 'bg-rose-50 dark:bg-rose-950/50', text: 'text-rose-700 dark:text-rose-300', dot: 'bg-rose-500' },
  'Teslim Bekliyor': { bg: 'bg-cyan-50 dark:bg-cyan-950/50', text: 'text-cyan-700 dark:text-cyan-300', dot: 'bg-cyan-500' },
  'Tamamlandı': { bg: 'bg-green-50 dark:bg-green-950/50', text: 'text-green-700 dark:text-green-300', dot: 'bg-green-500' },
  'Arşivlendi': { bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-500' },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as string] || statusConfig['Taslak'];

  return (
    <div className={cn("inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-transparent", config.bg, config.text, className)}>
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {status}
    </div>
  );
}
