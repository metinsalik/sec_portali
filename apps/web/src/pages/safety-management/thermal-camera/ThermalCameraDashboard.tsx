import React, { useEffect, useState } from 'react';
import { thermalInspectionService, type ThermalInspectionItem } from '@/services/thermal-inspection.service';
import { ThermalDashboardView } from './ThermalDashboardView';
import { RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export default function ThermalCameraDashboard() {
  const [items, setItems] = useState<ThermalInspectionItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Tüm oturumları çek
      const rawSessions = await thermalInspectionService.getSessions();
      const sessions = Array.isArray(rawSessions) ? rawSessions : [];
      
      let allItems: ThermalInspectionItem[] = [];
      
      // 2. Her bir oturumun detayını çekip items listesini birleştir
      const detailPromises = sessions.map(s => thermalInspectionService.getSessionDetail(s.id).catch(() => null));
      const details = await Promise.all(detailPromises);
      
      details.forEach(d => {
        if (d && d.items) {
          allItems = [...allItems, ...d.items];
        }
      });
      
      setItems(allItems);
    } catch (error) {
      console.error(error);
      toast.error('Veriler yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-slate-500">
        <RefreshCw className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
        <p>Konsolide veriler yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <ThermalDashboardView items={items} facilityName="Tüm Tesisler (Konsolide)" />
    </div>
  );
}
