import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { type ImprovementRecord, type FacilityOption } from './types';
import { ImprovementTable } from './ImprovementTable';

const API = import.meta.env.VITE_API_URL || '';

export const DenetimlerPage: React.FC = () => {
  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  const [records, setRecords] = useState<ImprovementRecord[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRecords = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const url = `${API}/api/operations/improvements/records?sheetType=DENETIMLER&facilityId=${selectedFacilityId}&limit=2000`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching denetimler records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [selectedFacilityId]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      
      {/* Sayfa Başlığı */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              Denetimler
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Genel risk, yangın güvenliği ve operasyonel denetim bulguları ve aksiyon takibi.
            </p>
          </div>
        </div>
      </div>

      {/* Tablo Bileşeni */}
      <ImprovementTable
        records={records}
        loading={loading}
        sheetTitle="Denetimler"
        sheetType="DENETIMLER"
        onRefresh={fetchRecords}
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
      />

    </div>
  );
};
