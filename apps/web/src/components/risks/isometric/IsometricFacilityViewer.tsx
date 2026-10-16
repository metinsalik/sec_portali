import React, { useState, useEffect, useMemo } from 'react';
import type { IsometricBuildingData, IsometricFloor, IsometricRoom } from './types';
import { MOCK_ISOMETRIC_BUILDING, buildBuildingDataFromTree, formatFloorLabel } from './mockData';
import { IsometricBuilding } from './IsometricBuilding';
import { FloorGrid } from './FloorGrid';
import { RoomDetailSheet } from './RoomDetailSheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, Layers, Sparkles, AlertTriangle, 
  RefreshCw, CheckCircle2, ChevronRight, Eye,
  Columns, Maximize2, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IsometricFacilityViewerProps {
  tree?: Record<string, any>;
  selectedBuilding: string | null;
  selectedFloor: string | null;
  selectedDept: string | null;
  scopedRisks?: any[];
  isEmbedded?: boolean;
  onSelectScope: (scope: { 
    building?: string | null; 
    floor?: string | null; 
    dept?: string | null; 
    unit?: { id: string; name: string } | null 
  }) => void;
}

export const IsometricFacilityViewer: React.FC<IsometricFacilityViewerProps> = ({
  tree,
  selectedBuilding,
  selectedFloor,
  selectedDept,
  scopedRisks,
  isEmbedded = false,
  onSelectScope,
}) => {
  // Build data from tree or fallback to rich mock data
  const initialBuildingData = useMemo(() => {
    if (tree && Object.keys(tree).length > 0) {
      return buildBuildingDataFromTree(tree, selectedBuilding);
    }
    return MOCK_ISOMETRIC_BUILDING;
  }, [tree, selectedBuilding]);

  const [buildingData, setBuildingData] = useState<IsometricBuildingData>(initialBuildingData);
  // Default to 13. Kat (or first critical floor) so the floor plan is immediately visible
  const defaultFloor = useMemo(() => {
    return buildingData.floors.find(f => f.floorNumber === 13 || f.hasCriticalFault) || buildingData.floors[0] || null;
  }, [buildingData]);

  const [activeFloor, setActiveFloor] = useState<IsometricFloor | null>(defaultFloor);
  const [selectedRoom, setSelectedRoom] = useState<IsometricRoom | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'studio' | 'building' | 'floor'>('studio');

  // Sync external building selection
  useEffect(() => {
    if (tree && Object.keys(tree).length > 0) {
      const bData = buildBuildingDataFromTree(tree, selectedBuilding);
      setBuildingData(bData);
      const floorMatch = bData.floors.find(f => f.floorNumber === 13 || f.hasCriticalFault) || bData.floors[0];
      setActiveFloor(floorMatch || null);
    }
  }, [tree, selectedBuilding]);

  // Sync external floor selection from Hiyerarşik Kapsam Seçici
  useEffect(() => {
    if (selectedFloor) {
      const cleanTarget = formatFloorLabel(selectedFloor).toLowerCase();
      const match = buildingData.floors.find(f => {
        const cleanF = formatFloorLabel(f.name).toLowerCase();
        return cleanF.includes(cleanTarget) || 
               cleanTarget.includes(cleanF) ||
               f.floorNumber.toString() === selectedFloor.replace(/[^0-9-]/g, '');
      });
      if (match) {
        setActiveFloor(match);
      }
    }
  }, [selectedFloor, buildingData]);

  // Handle floor selection from tower or pills
  const handleSelectFloor = (floor: IsometricFloor) => {
    setActiveFloor(floor);
    if (viewMode === 'building') {
      setViewMode('studio');
    }
    onSelectScope({
      building: selectedBuilding || buildingData.name,
      floor: floor.name,
      dept: null,
      unit: null,
    });
  };

  // Handle room selection in floor grid
  const handleSelectRoom = (room: IsometricRoom) => {
    setSelectedRoom(room);
    setIsSheetOpen(true);
  };

  // Handle fault resolution simulation
  const handleSimulateResolveFault = (roomId: string) => {
    setBuildingData(prev => ({
      ...prev,
      floors: prev.floors.map(floor => {
        const updatedRooms = floor.rooms.map(r => {
          if (r.id === roomId) {
            return {
              ...r,
              status: 'normal' as const,
              safetyScore: 95,
              riskDistribution: {
                tolereGosterilmez: 0,
                yuksek: 0,
                onemli: 0,
                olasi: 1,
                onemsiz: 3,
              },
              telemetry: r.telemetry ? {
                ...r.telemetry,
                voltageL1: 230,
                voltageL2: 231,
                voltageL3: 229,
                temperature: 38.5,
                loadPercentage: 58,
                currentAmps: 180,
                activeAlarm: undefined,
                isSimulatedResolved: true,
              } : undefined
            };
          }
          return r;
        });

        const hasRemainingCritical = updatedRooms.some(r => r.status === 'critical');
        return {
          ...floor,
          rooms: updatedRooms,
          status: hasRemainingCritical ? 'critical' : 'normal',
          hasCriticalFault: hasRemainingCritical,
          safetyScore: hasRemainingCritical ? 48 : 94,
          criticalFaultText: hasRemainingCritical ? floor.criticalFaultText : undefined,
        };
      })
    }));

    if (activeFloor) {
      setActiveFloor(prev => {
        if (!prev) return null;
        const updatedRooms = prev.rooms.map(r => r.id === roomId ? { 
          ...r, 
          status: 'normal' as const,
          safetyScore: 95,
          riskDistribution: {
            tolereGosterilmez: 0,
            yuksek: 0,
            onemli: 0,
            olasi: 1,
            onemsiz: 3,
          }
        } : r);
        const hasRemainingCritical = updatedRooms.some(r => r.status === 'critical');
        return {
          ...prev,
          rooms: updatedRooms,
          status: hasRemainingCritical ? 'critical' : 'normal',
          hasCriticalFault: hasRemainingCritical,
          safetyScore: hasRemainingCritical ? 48 : 94,
        };
      });
    }
  };

  // Handle filtering risk table from sheet
  const handleViewLocationRisks = (room: IsometricRoom) => {
    onSelectScope({
      building: selectedBuilding || buildingData.name,
      floor: activeFloor?.name || selectedFloor,
      dept: room.name,
      unit: room.departmentId ? { id: room.departmentId, name: room.name } : null,
    });
  };

  return (
    <div className={cn("w-full overflow-hidden", !isEmbedded && "bg-card rounded-2xl border border-border shadow-xs")}>
      {/* ─── 1. BİRLEŞİK KOMUTA BAR / HEADER ─────────────────────────── */}
      <div className="p-3 border-b bg-muted/15 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="p-1.5 rounded-xl bg-primary/10 text-primary">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                {buildingData.name}
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/20">
                2.5D Dijital İkiz Stüdyosu
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              Kat kulesi ve oda bazlı izometrik model kontrol merkezi
            </p>
          </div>
        </div>

        {/* Hızlı Kat Butonları / Pills */}
        <div className="flex flex-wrap items-center gap-1.5">
          {buildingData.floors.slice(0, 6).map(f => {
            const isFSelected = activeFloor?.id === f.id;
            const isFCritical = f.hasCriticalFault || f.status === 'critical';
            const isFWarning = f.status === 'warning';
            const label = formatFloorLabel(f.name);

            return (
              <button
                key={f.id}
                type="button"
                onClick={() => handleSelectFloor(f)}
                className={cn(
                  "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition-all border",
                  isFSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs"
                    : isFCritical
                      ? "bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-900/50 hover:bg-rose-50"
                      : isFWarning
                        ? "bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-900/50"
                        : "bg-background hover:bg-muted text-foreground border-border/60"
                )}
              >
                {isFCritical && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />}
                <span>{label.slice(0, 9)}</span>
              </button>
            );
          })}

          {/* Stüdyo Görünüm Seçici */}
          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border/60 ml-2">
            <button
              type="button"
              onClick={() => setViewMode('studio')}
              className={cn(
                "px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1",
                viewMode === 'studio' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Kule ve Kat Planı Birlikte (Stüdyo)"
            >
              <Columns className="w-3 h-3 text-primary" />
              Stüdyo
            </button>
            <button
              type="button"
              onClick={() => setViewMode('building')}
              className={cn(
                "px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1",
                viewMode === 'building' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Yalnızca Bina Kulesi"
            >
              <Building2 className="w-3 h-3 text-blue-500" />
              Kule
            </button>
            <button
              type="button"
              onClick={() => setViewMode('floor')}
              className={cn(
                "px-2 py-0.5 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1",
                viewMode === 'floor' ? "bg-background text-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Yalnızca Kat Planı"
            >
              <Layers className="w-3 h-3 text-emerald-500" />
              Kat
            </button>
          </div>
        </div>
      </div>

      {/* ─── 2. STÜDYO ALANI: BİNA KULESİ + KAT ODALARI ──────────────── */}
      <div className="p-0">
        {viewMode === 'studio' ? (
          <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-border">
            {/* Sol Kolon: Bina Kulesi (4 / 12 Kolon) */}
            <div className="lg:col-span-4 xl:col-span-4 bg-muted/5 flex flex-col justify-between">
              <IsometricBuilding
                building={buildingData}
                selectedFloorId={activeFloor?.id || null}
                onSelectFloor={handleSelectFloor}
                compact={true}
              />
            </div>

            {/* Sağ Kolon: Aktif Katın İzometrik Odaları & İstatistikleri (8 / 12 Kolon) */}
            <div className="lg:col-span-8 xl:col-span-8 bg-card flex flex-col justify-between">
              {activeFloor ? (
                <div key={activeFloor.id} className="h-full animate-in fade-in-50 duration-200">
                  <FloorGrid
                    floor={activeFloor}
                    selectedRoomId={selectedRoom?.id || null}
                    onSelectRoom={handleSelectRoom}
                  />
                </div>
              ) : (
                <div className="p-12 text-center text-muted-foreground flex flex-col items-center justify-center h-full space-y-2">
                  <Building2 className="w-8 h-8 opacity-40 text-primary" />
                  <p className="text-sm font-semibold">İncelemek istediğiniz katı soldaki kuleden seçin.</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'building' ? (
          <div className="p-6 max-w-lg mx-auto animate-in fade-in-50 duration-200">
            <IsometricBuilding
              building={buildingData}
              selectedFloorId={activeFloor?.id || null}
              onSelectFloor={handleSelectFloor}
            />
          </div>
        ) : (
          <div className="p-0 animate-in fade-in-50 duration-200">
            {activeFloor && (
              <FloorGrid
                floor={activeFloor}
                selectedRoomId={selectedRoom?.id || null}
                onSelectRoom={handleSelectRoom}
              />
            )}
          </div>
        )}
      </div>

      {/* ─── 3. DETAY ÇEKMECESİ ───────────────────────────────────────── */}
      <RoomDetailSheet
        room={selectedRoom}
        isOpen={isSheetOpen}
        onClose={() => setIsSheetOpen(false)}
        onSimulateResolveFault={handleSimulateResolveFault}
        onViewLocationRisks={handleViewLocationRisks}
      />
    </div>
  );
};
