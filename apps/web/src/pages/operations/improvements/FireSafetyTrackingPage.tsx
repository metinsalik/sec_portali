import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext } from 'react-router-dom';
import { Flame } from 'lucide-react';
import { type ImprovementRecord, type FacilityOption, FIRE_SYSTEMS_SHEETS } from './types';
import { ImprovementTable } from './ImprovementTable';

const API = import.meta.env.VITE_API_URL || '';

export const FireSafetyTrackingPage: React.FC = () => {
  const { subCategory } = useParams<{ subCategory: string }>();

  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Aktif sekmeyi bul
  const activeSheet = FIRE_SYSTEMS_SHEETS.find(s => s.path === subCategory) || FIRE_SYSTEMS_SHEETS[0];

  const [records, setRecords] = useState<ImprovementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/records?sheetType=${activeSheet.key}&facilityId=${selectedFacilityId}&limit=all`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching fire systems records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [activeSheet.key, selectedFacilityId]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">

      {/* Üst Sekme Başlığı */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold shrink-0">
          <Flame className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
            {activeSheet.name}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Sulu/gazlı söndürme, basınçlandırma ve yangın algılama/uyarı sistemleri periyodik kontrol & bakım takibi.
          </p>
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
export default FireSafetyTrackingPage;
