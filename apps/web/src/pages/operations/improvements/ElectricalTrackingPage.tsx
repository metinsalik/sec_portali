import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { Zap } from 'lucide-react';
import { type ImprovementRecord, type FacilityOption, ELECTRICAL_SHEETS } from './types';
import { ImprovementTable } from './ImprovementTable';

const API = import.meta.env.VITE_API_URL || '';

export const ElectricalTrackingPage: React.FC = () => {
  const { subCategory } = useParams<{ subCategory: string }>();
  const navigate = useNavigate();
  
  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Aktif sekmeyi bul
  const activeSheet = ELECTRICAL_SHEETS.find(s => s.path === subCategory) || ELECTRICAL_SHEETS[0];

  const [records, setRecords] = useState<ImprovementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/records?sheetType=${activeSheet.key}&facilityId=${selectedFacilityId}&limit=2000`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching electrical records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeSheet.key, selectedFacilityId]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      
      {/* Üst Sekme Başlığı & Alt Sekme Seçici Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-bold">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {activeSheet.name}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Elektrik altyapı ve periyodik kontrol tespitleri ve aksiyon takibi.
            </p>
          </div>
        </div>

        {/* Hızlı Alt Sekme Değiştirici */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          {ELECTRICAL_SHEETS.map(tab => (
            <button
              key={tab.key}
              onClick={() => navigate(`/operations-management/improvements/electrical/${tab.path}`)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                tab.path === subCategory
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-300 shadow-sm font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </div>
      </div>

      {/* Tablo Bileşeni */}
      <ImprovementTable
        records={records}
        loading={loading}
        sheetTitle={activeSheet.name}
        sheetType={activeSheet.key}
        onRefresh={fetchRecords}
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
      />

    </div>
  );
};
