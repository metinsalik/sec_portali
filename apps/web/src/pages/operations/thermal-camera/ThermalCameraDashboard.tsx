import React, { useEffect, useState } from 'react';
import { 
  thermalInspectionService, 
  type ThermalInspectionItem, 
  type ThermalInspectionSession 
} from '@/services/thermal-inspection.service';
import { ThermalExecutiveDashboard } from './ThermalExecutiveDashboard';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

export default function ThermalCameraDashboard() {
  const [items, setItems] = useState<ThermalInspectionItem[]>([]);
  const [sessions, setSessions] = useState<ThermalInspectionSession[]>([]);
  const [facilities, setFacilities] = useState<Array<{ id: string; name: string; type?: string | null; shortName?: string | null; isActive?: boolean }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Tesisleri çek
      const token = localStorage.getItem('token');
      const facRes = await fetch(`${API}/api/settings/facilities`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const facData = await facRes.json();
      const facList = Array.isArray(facData) ? facData : (facData.facilities || facData.data || []);
      setFacilities(facList);

      // 2. Tüm oturumları çek
      const rawSessions = await thermalInspectionService.getSessions();
      const sessList = Array.isArray(rawSessions) ? rawSessions : [];
      setSessions(sessList);
      
      // 3. Her oturumun detay maddelerini getir ve birleştir
      let allItems: ThermalInspectionItem[] = [];
      const detailPromises = sessList.map(s => 
        thermalInspectionService.getSessionDetail(s.id).catch(() => null)
      );
      const details = await Promise.all(detailPromises);
      
      details.forEach(d => {
        if (d && d.items) {
          // Her item'a bağlı session ve facility bilgisini de ilişkilendir
          const enrichedItems = d.items.map(it => ({
            ...it,
            session: {
              id: d.id,
              facilityId: d.facilityId,
              reportDate: d.reportDate,
              facility: d.facility
            }
          }));
          allItems = [...allItems, ...enrichedItems];
        }
      });
      
      setItems(allItems);
    } catch (error) {
      console.error(error);
      toast.error('Yönetici özeti verileri yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500 gap-3">
        <RefreshCw className="w-8 h-8 animate-spin text-orange-600" />
        <p className="text-xs font-semibold">Tüm hastanelerin termal ölçümleri ve yönetici özeti derleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ThermalExecutiveDashboard 
        items={items}
        sessions={sessions}
        facilities={facilities}
        onOpenPanelDetail={(panelName) => {
          // İlgili panonun detayına yönlendirebilir
          window.location.href = `/operations-management/thermal-camera?tab=panels&panel=${encodeURIComponent(panelName)}`;
        }}
      />
    </div>
  );
}
