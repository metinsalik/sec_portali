import React, { useState, useEffect } from 'react';
import { useParams, useOutletContext, useNavigate } from 'react-router-dom';
import { ClipboardList } from 'lucide-react';
import { type ImprovementRecord, type FacilityOption, AUDIT_SHEETS } from './types';
import { ImprovementTable } from './ImprovementTable';

const API = import.meta.env.VITE_API_URL || '';

export const DenetimlerPage: React.FC = () => {
  const { subCategory } = useParams<{ subCategory?: string }>();
  const navigate = useNavigate();

  const { selectedFacilityId, facilities } = useOutletContext<{
    selectedFacilityId: string;
    facilities: FacilityOption[];
  }>();

  // Alt kategori yoksa varsayılan olarak Merkezi Denetimler'e yönlendir
  useEffect(() => {
    if (!subCategory) {
      navigate('/operations-management/improvements/denetimler/merkezi', { replace: true });
    }
  }, [subCategory, navigate]);

  // Aktif sekmeyi bul (Varsayılan: Merkezi Denetimler)
  const activeSheet = AUDIT_SHEETS.find(s => s.path === subCategory) || 
    AUDIT_SHEETS.find(s => s.key === 'MERKEZI_DENETIMLER') || 
    AUDIT_SHEETS[0];
  const currentSheetKey = activeSheet.key;
  const currentSheetTitle = activeSheet.name;

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
      console.error('Error fetching denetimler records:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [subCategory, selectedFacilityId]);

  return (
    <div className="space-y-4 max-w-7xl mx-auto">
      
      {/* Sayfa Başlığı ve Hızlı Alt Sekme Seçici */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
            <ClipboardList className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">
              {currentSheetTitle}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Hastane içi, merkezi, sağlık ve itfaiye komisyonu denetim bulguları ve aksiyon takibi.
            </p>
          </div>
        </div>

        {/* Hızlı Alt Sekme Değiştirici */}
        <div className="flex flex-wrap gap-1 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-lg">
          {AUDIT_SHEETS.map(tab => (
            <button
              key={tab.key}
              onClick={() => navigate(`/operations-management/improvements/denetimler/${tab.path}`)}
              className={`px-2.5 py-1 text-xs rounded-md font-medium transition-all ${
                tab.path === subCategory || (!subCategory && tab.key === 'MERKEZI_DENETIMLER')
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-xs font-bold'
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
        sheetTitle={currentSheetTitle}
        sheetType={currentSheetKey}
        onRefresh={fetchRecords}
        facilities={facilities}
        selectedFacilityId={selectedFacilityId}
      />

    </div>
  );
};
export default DenetimlerPage;
