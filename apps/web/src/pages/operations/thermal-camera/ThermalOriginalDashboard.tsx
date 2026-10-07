import React from 'react';
import type { ThermalInspectionSession } from '@/services/thermal-inspection.service';
import { ThermalDashboardView } from './ThermalDashboardView';

interface Props {
  session: ThermalInspectionSession;
  onBack?: () => void;
  onAddPhoto?: (item: any) => void;
  onEditItem?: (item: any) => void;
  onDeleteItem?: (itemId: string) => void;
  onItemUpdated?: (updatedItem: any) => void;
  onOpenPanelDetail?: (panelName: string) => void;
  onCleanupEmptyClick?: () => void;
  onDeleteSession?: () => void;
}

export const ThermalOriginalDashboard: React.FC<Props> = ({ session, onBack, onAddPhoto, onEditItem, onDeleteItem, onItemUpdated, onOpenPanelDetail, onCleanupEmptyClick, onDeleteSession }) => {
  const items = session.items || [];
  
  const hospitalName = session.facility?.name || 'Bilinmeyen Tesis';
  const facilityId = session.facilityId || session.facility?.id;
  const dates = [...new Set(items.map(it => {
    if(it.measurementDate) return new Date(it.measurementDate).toLocaleDateString('tr-TR');
    if(it.createdAt) return new Date(it.createdAt).toLocaleDateString('tr-TR');
    return '';
  }).filter(Boolean))];
  const dateRange = dates.length === 1 ? dates[0] : dates.length > 1 ? `${dates[0]} – ${dates[dates.length-1]}` : '—';

  return (
    <div className="relative">
      <ThermalDashboardView 
        items={items} 
        facilityName={hospitalName}
        facilityId={facilityId}
        dateRange={dateRange} 
        onBack={onBack}
        onAddPhoto={onAddPhoto}
        onEditItem={onEditItem}
        onDeleteItem={onDeleteItem}
        onItemUpdated={onItemUpdated}
        onOpenPanelDetail={onOpenPanelDetail}
        onCleanupEmptyClick={onCleanupEmptyClick}
        onDeleteSession={onDeleteSession}
      />
    </div>
  );
};
