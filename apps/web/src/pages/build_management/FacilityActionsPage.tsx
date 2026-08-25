import React from 'react';

export default function FacilityActionsPage() {
  return (
    <div className="w-full flex-1 p-6 space-y-6 bg-slate-50 min-h-screen dark:bg-slate-900">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Tesis Aksiyonları</h1>
        <p className="text-sm text-slate-500 mt-1 dark:text-slate-400">Tesisinize ait denetim bulgularını ve düzeltici aksiyonları yönetin</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden dark:bg-slate-800 dark:border-slate-700">
        <div className="px-6 py-4 border-b border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-white">
          Bekleyen Aksiyonlar
        </div>
        <div className="p-6 text-center text-slate-500 dark:text-slate-400">
          <div className="text-3xl mb-2">📋</div>
          <p>Şu an için atanan herhangi bir aksiyon bulunmuyor.</p>
        </div>
      </div>
    </div>
  );
}
