import React from 'react';
import { useIRSC } from '../context/IRSCContext';

export default function AuditLibrary() {
  const { setCurrentView } = useIRSC();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => setCurrentView('TRACKING')}
            className="p-2 text-slate-500 hover:bg-slate-100 rounded-full dark:text-slate-400 dark:hover:bg-slate-800"
          >
            ←
          </button>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Denetim Kütüphanesi</h2>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 dark:bg-slate-800 dark:border-slate-700 flex flex-col items-center justify-center text-center py-20">
        <div className="text-slate-400 mb-4 text-4xl">📚</div>
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Henüz Denetim Bulunmuyor</h3>
        <p className="text-slate-500 mt-2 max-w-md dark:text-slate-400">Yeni bir denetim başlattığınızda veya tamamlandığında arşiv kayıtları burada listelenecektir.</p>
        <button 
          onClick={() => setCurrentView('WORKSPACE')}
          className="mt-6 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Yeni Denetim Başlat
        </button>
      </div>
    </div>
  );
}
