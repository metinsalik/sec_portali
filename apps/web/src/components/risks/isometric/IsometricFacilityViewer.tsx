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
  Columns, Maximize2, ShieldAlert, X, Filter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IsometricFacilityViewerProps {
  tree?: Record<string, any>;
  selectedBuilding: string | null;
  selectedFloor: string | null;
  selectedDept: string | null;
  selectedUnit?: { id: string; name: string } | null;
  scopedRisks?: any[];
  isEmbedded?: boolean;
  onClose?: () => void;
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
  selectedUnit,
  scopedRisks,
  isEmbedded = false,
  onClose,
  onSelectScope,
}) => {
  // Çoklu Blok Listesi (A Blok, B Blok, C Blok, D Blok)
  const availableBuildings = useMemo(() => {
    if (tree && Object.keys(tree).length > 0) {
      return Object.keys(tree);
    }
    return ['LIV-VADI', 'A Blok', 'B Blok', 'C Blok'];
  }, [tree]);

  const [activeBuildingName, setActiveBuildingName] = useState<string>(
    selectedBuilding || availableBuildings[0] || 'LIV-VADI'
  );

  // Sync external building changes
  useEffect(() => {
    if (selectedBuilding && selectedBuilding !== activeBuildingName) {
      setActiveBuildingName(selectedBuilding);
    }
  }, [selectedBuilding]);

  // Bina verisini ağaçtan veya mock'tan oluştur
  const buildingData = useMemo<IsometricBuildingData>(() => {
    if (tree && Object.keys(tree).length > 0) {
      return buildBuildingDataFromTree(tree, activeBuildingName);
    }
    return {
      ...MOCK_ISOMETRIC_BUILDING,
      name: activeBuildingName,
    };
  }, [tree, activeBuildingName]);

  // Varsayılan kat (13. Kat veya kritik arızalı kat)
  const defaultFloor = useMemo(() => {
    return buildingData.floors.find(f => f.floorNumber === 13 || f.hasCriticalFault) || buildingData.floors[0] || null;
  }, [buildingData]);

  const [activeFloor, setActiveFloor] = useState<IsometricFloor | null>(defaultFloor);
  const [selectedRoom, setSelectedRoom] = useState<IsometricRoom | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'studio' | 'building' | 'floor'>('studio');

  // Bina değiştiğinde ilk katı veya kritik katı seç
  useEffect(() => {
    const floorMatch = buildingData.floors.find(f => f.floorNumber === 13 || f.hasCriticalFault) || buildingData.floors[0] || null;
    setActiveFloor(floorMatch);
  }, [buildingData]);

  // Harici Kat Seçimi Senkronizasyonu
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

  // Blok Değiştirme
  const handleSelectBuilding = (bName: string) => {
    setActiveBuildingName(bName);
    const newBData = tree && Object.keys(tree).length > 0
      ? buildBuildingDataFromTree(tree, bName)
      : { ...MOCK_ISOMETRIC_BUILDING, name: bName };
    const firstFloor = newBData.floors[0] || null;
    setActiveFloor(firstFloor);
    onSelectScope({
      building: bName,
      floor: firstFloor ? firstFloor.name : null,
      dept: null,
      unit: null,
    });
  };

  // Kat Seçimi (Kule veya Raydan)
  const handleSelectFloor = (floor: IsometricFloor) => {
    setActiveFloor(floor);
    onSelectScope({
      building: activeBuildingName,
      floor: floor.name,
      dept: null,
      unit: null,
    });
  };

  // Mahal Seçimi
  const handleSelectRoom = (room: IsometricRoom) => {
    setSelectedRoom(room);
    setIsSheetOpen(true);
  };

  // Arıza giderme simülasyonu
  const handleSimulateResolveFault = (roomId: string) => {
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

  // Detay sayfasından filtreleme
  const handleViewLocationRisks = (room: IsometricRoom) => {
    onSelectScope({
      building: activeBuildingName,
      floor: activeFloor?.name || selectedFloor,
      dept: room.name,
      unit: room.departmentId ? { id: room.departmentId, name: room.name } : null,
    });
  };

  return (
    <div className={cn("w-full h-full flex flex-col overflow-hidden bg-background", !isEmbedded && "select-none")}>
      {/* ─── 1. ÜST PANEL BAŞLIĞI VE KAPATMA BUTONU ─────────────────── */}
      <div className="p-3.5 border-b bg-muted/25 flex items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-br from-sky-500/20 to-indigo-500/20 text-primary border border-primary/20 shadow-2xs">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-sm font-bold text-foreground">
                3D Dijital İkiz Stüdyosu
              </span>
              <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30 bg-primary/5">
                4 Blok & 15 Kat
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground">
              {activeBuildingName} • {buildingData.floors.length} Kat • İnteraktif 3D Model
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Görünüm Modu Seçici (Kule / Kat / Stüdyo) */}
          <div className="flex items-center bg-muted/70 p-0.5 rounded-lg border border-border/60">
            <button
              type="button"
              onClick={() => setViewMode('studio')}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1",
                viewMode === 'studio' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Kule ve Kat Planı Birlikte"
            >
              <Columns className="w-3 h-3 text-primary" />
              <span>Stüdyo</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('building')}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1",
                viewMode === 'building' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Yalnızca 3D Bina Kulesi"
            >
              <Building2 className="w-3 h-3 text-sky-500" />
              <span>Kule</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode('floor')}
              className={cn(
                "px-2 py-1 text-[11px] font-semibold rounded-md transition-all flex items-center gap-1",
                viewMode === 'floor' ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="Yalnızca Kat Planı"
            >
              <Layers className="w-3 h-3 text-emerald-500" />
              <span>Kat</span>
            </button>
          </div>

          {/* Kapat Butonu */}
          {onClose && (
            <Button
              size="icon"
              variant="ghost"
              className="w-8 h-8 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted ml-1"
              onClick={onClose}
              title="3D Paneli Kapat"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* ─── 2. ÇOKLU BLOK SEÇİCİ SEKMELERİ (A, B, C, D Blokları) ───── */}
      {availableBuildings.length > 1 && (
        <div className="px-3.5 py-2 border-b bg-muted/10 flex items-center gap-2 overflow-x-auto custom-scrollbar shrink-0">
          <span className="text-[11px] font-bold text-muted-foreground shrink-0 uppercase tracking-wider">
            Blok Seç:
          </span>
          <div className="flex items-center gap-1.5">
            {availableBuildings.map((bName) => {
              const isSelected = activeBuildingName === bName;
              const bNode = tree?.[bName];
              const riskCount = bNode?.risks || 0;

              return (
                <button
                  key={bName}
                  type="button"
                  onClick={() => handleSelectBuilding(bName)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-bold transition-all border shrink-0",
                    isSelected
                      ? "bg-primary text-primary-foreground border-primary shadow-xs"
                      : "bg-background hover:bg-muted text-foreground border-border/70"
                  )}
                >
                  <Building2 className={cn("w-3.5 h-3.5", isSelected ? "text-primary-foreground" : "text-primary")} />
                  <span>{bName}</span>
                  {riskCount > 0 && (
                    <span className={cn(
                      "px-1.5 py-0.2 rounded-md font-mono text-[10px]",
                      isSelected ? "bg-primary-foreground/20 text-primary-foreground" : "bg-muted text-muted-foreground"
                    )}>
                      {riskCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── 3. 3D STÜDYO ALANI: KULE + KAT ODALARI ──────────────────── */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {viewMode === 'studio' ? (
          <div className="flex flex-col divide-y divide-border">
            {/* Üst Bölüm: 3D Bina Kulesi (15 Kat Destekli) */}
            <div className="min-h-[360px] bg-muted/5 flex flex-col">
              <IsometricBuilding
                building={buildingData}
                selectedFloorId={activeFloor?.id || null}
                onSelectFloor={handleSelectFloor}
                compact={true}
              />
            </div>

            {/* Alt Bölüm: Seçili Katın 3D Alçak Duvarlı & 2D Planı */}
            <div className="min-h-[380px] bg-card flex flex-col">
              {activeFloor ? (
                <FloorGrid
                  floor={activeFloor}
                  selectedRoomId={selectedRoom?.id || null}
                  onSelectRoom={handleSelectRoom}
                />
              ) : (
                <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
                  <Building2 className="w-8 h-8 opacity-40 text-primary" />
                  <p className="text-xs font-semibold">İncelemek istediğiniz katı yukarıdaki kuleden seçin.</p>
                </div>
              )}
            </div>
          </div>
        ) : viewMode === 'building' ? (
          <div className="h-full flex flex-col">
            <IsometricBuilding
              building={buildingData}
              selectedFloorId={activeFloor?.id || null}
              onSelectFloor={handleSelectFloor}
            />
          </div>
        ) : (
          <div className="h-full flex flex-col">
            {activeFloor ? (
              <FloorGrid
                floor={activeFloor}
                selectedRoomId={selectedRoom?.id || null}
                onSelectRoom={handleSelectRoom}
              />
            ) : (
              <div className="p-8 text-center text-muted-foreground flex flex-col items-center justify-center space-y-2">
                <Layers className="w-8 h-8 opacity-40 text-primary" />
                <p className="text-xs font-semibold">Önce bir kat seçin.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── 4. ALT EYLEM VE SENKRONİZASYON BARI ─────────────────────── */}
      <div className="p-3 border-t bg-muted/20 flex flex-wrap items-center justify-between gap-2 shrink-0">
        <div className="flex items-center gap-1.5 text-xs">
          <span className="font-bold text-foreground">Kapsam:</span>
          <Badge variant="outline" className="font-mono text-[11px] font-semibold text-primary border-primary/30">
            {activeBuildingName} › {activeFloor ? formatFloorLabel(activeFloor.name) : 'Tüm Katlar'}
            {selectedRoom ? ` › ${selectedRoom.name}` : ''}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-muted-foreground hover:text-foreground"
            onClick={() => {
              onSelectScope({
                building: null,
                floor: null,
                dept: null,
                unit: null,
              });
            }}
          >
            Sıfırla
          </Button>

          {onClose && (
            <Button
              size="sm"
              className="h-7 text-xs gap-1.5 bg-primary text-primary-foreground shadow-xs font-semibold"
              onClick={onClose}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>Ana Sayfada Göster & Kapat</span>
            </Button>
          )}
        </div>
      </div>

      {/* ─── 5. ODA DETAY ÇEKMECESİ ─────────────────────────────────── */}
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
