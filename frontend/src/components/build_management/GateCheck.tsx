import React from 'react';
import { cn } from '@/lib/utils';

interface GateCheckProps {
  gateData: {
    canStart: boolean;
    startRequirements: Array<{ name: string; isMet: boolean }>;
    canHandover: boolean;
    handoverRequirements: Array<{ name: string; isMet: boolean }>;
  };
  type: 'start' | 'handover';
}

export function GateCheck({ gateData, type }: GateCheckProps) {
  if (!gateData) return null;

  const requirements = type === 'start' ? gateData.startRequirements : gateData.handoverRequirements;
  const canPass = type === 'start' ? gateData.canStart : gateData.canHandover;
  const title = type === 'start' ? 'Proje Öncesi Yapılacaklar' : 'Teslim Alma ve Rapor';

  return (
    <div className={cn(
      "border rounded-xl p-5 mt-6",
      canPass 
        ? "bg-emerald-50/50 border-emerald-200 dark:bg-emerald-900/10 dark:border-emerald-800" 
        : "bg-red-50/50 border-red-200 dark:bg-red-900/10 dark:border-red-800"
    )}>
      <div className="flex items-center gap-3 mb-4">
        <div className={cn(
          "w-10 h-10 rounded-full flex items-center justify-center text-white font-bold",
          canPass ? "bg-emerald-500" : "bg-red-500"
        )}>
          <span className="material-symbols-outlined">{canPass ? 'check' : 'lock'}</span>
        </div>
        <div>
          <h4 className={cn(
            "text-lg font-bold",
            canPass ? "text-emerald-800 dark:text-emerald-400" : "text-red-800 dark:text-red-400"
          )}>
            {title}
          </h4>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            {canPass 
              ? 'Tüm ön koşullar sağlandı. Sonraki aşamaya geçilebilir.' 
              : 'Eksik koşullar var. Bu aşamaya geçilemez!'}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
        {requirements?.map((req, i) => (
          <div key={i} className="flex items-center gap-3 bg-white dark:bg-[#1f2428] p-3 rounded-lg border border-slate-100 dark:border-slate-800 shadow-sm">
            <span className={cn(
              "material-symbols-outlined text-[20px]",
              req.isMet ? "text-emerald-500" : "text-red-400"
            )}>
              {req.isMet ? 'check_circle' : 'cancel'}
            </span>
            <span className={cn(
              "text-sm font-medium",
              req.isMet ? "text-slate-700 dark:text-slate-300" : "text-red-600 dark:text-red-400"
            )}>
              {req.name}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
