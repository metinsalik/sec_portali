import React, { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { AlertOctagon, ShieldAlert } from 'lucide-react';
import { type ImprovementRecord, type FacilityOption } from './types';
import { ImprovementTable } from './ImprovementTable';

const API = import.meta.env.VITE_API_URL || '';

export const CriticalItemsPage: React.FC = () => {
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
      const url = `${API}/api/operations/improvements/critical?facilityId=${selectedFacilityId}`;
      const res = await fetch(url, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const data = await res.json();
      if (data.success) {
        setRecords(data.data);
      }
    } catch (err) {
      console.error('Error fetching critical records:', err);
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
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center font-bold">
            <AlertOctagon className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
              Merkezi Kritik Maddeler Konsolu
              <span className="text-xs px-2 py-0.5 rounded-full bg-red-500 text-white font-mono font-bold">
                {records.length}
              </span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              8 takip sekmesindeki tüm kritik riskli bulguların merkezi yönetim ve eskalasyon havuzu.
            </p>
          </div>
        </div>
      </div>

      {/* Tablo Bileşeni */}
      <ImprovementTable
        records={records}
        loading={loading}
        sheetTitle="Kritik Maddeler"
        sheetType="KRITIK"
        onRefresh={fetchRecords}
      />

    </div>
  );
};
