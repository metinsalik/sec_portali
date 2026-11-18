import React, { useState } from 'react';
import type { IsometricFloor, IsometricRoom, StatusType } from './types';
import { formatFloorLabel } from './mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Activity, Briefcase, 
  Archive, ShieldAlert, AlertTriangle,
  Layers, Sparkles, LayoutGrid, Box
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface FloorGridProps {
  floor: IsometricFloor;
  selectedRoomId: string | null;
  onSelectRoom: (room: IsometricRoom) => void;
  onBackToBuilding?: () => void;
}

const TILE_WIDTH_HALF = 46;
const TILE_HEIGHT_HALF = 23;

const STATUS_COLORS: Record<StatusType, { top: string; left: string; right: string; border: string; wallFill: string; wallBorder: string }> = {
  normal: {
    top: '#A7F3D0',
    left: '#34D399',
    right: '#059669',
    border: '#047857',
    wallFill: '#6EE7B7',
    wallBorder: '#059669',
  },
  warning: {
    top: '#FDE68A',
    left: '#FBBF24',
    right: '#D97706',
    border: '#B45309',
    wallFill: '#FCD34D',
    wallBorder: '#D97706',
  },
  critical: {
    top: '#FECDD3',
    left: '#FB7185',
    right: '#E11D48',
    border: '#BE123C',
    wallFill: '#FDA4AF',
    wallBorder: '#E11D48',
  }
};

export const FloorGrid: React.FC<FloorGridProps> = ({
  floor,
  selectedRoomId,
  onSelectRoom,
}) => {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);
  const [viewMode2D, setViewMode2D] = useState<boolean>(false);

  const gridSize = floor.gridSize || 3;
  const originX = 260;
  const originY = 85;

  // Base tiles for isometric view
  const baseTiles = [];
  for (let gx = 0; gx < gridSize; gx++) {
    for (let gy = 0; gy < gridSize; gy++) {
      const cx = originX + (gx - gy) * TILE_WIDTH_HALF;
      const cy = originY + (gx + gy) * TILE_HEIGHT_HALF;

      const pTop = `${cx},${cy} ${cx + TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF} ${cx},${cy + 2 * TILE_HEIGHT_HALF} ${cx - TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF}`;
      const isAlt = (gx + gy) % 2 === 0;

      baseTiles.push(
        <polygon
          key={`base-${gx}-${gy}`}
          points={pTop}
          className={cn(
            "transition-colors duration-200 stroke-border/40",
            isAlt ? "fill-slate-100/90 dark:fill-slate-800/60" : "fill-slate-200/60 dark:fill-slate-800/30"
          )}
          strokeWidth="1"
        />
      );
    }
  }

  // Sort rooms from back to front for isometric occlusion: (gx + gy) ascending
  const sortedRooms = [...floor.rooms].sort((a, b) => (a.gridX + a.gridY) - (b.gridX + b.gridY));

  const dist = floor.riskDistribution || {
    tolereGosterilmez: floor.hasCriticalFault ? 1 : 0,
    yuksek: floor.hasCriticalFault ? 2 : 0,
    onemli: 1,
    olasi: 0,
    onemsiz: 2
  };

  const isCriticalFloor = floor.hasCriticalFault || floor.status === 'critical';

  return (
    <div className="flex flex-col h-full bg-card/50 backdrop-blur-xs select-none">
      {/* ─── 1. KAT BAŞLIĞI VE CANLI RİSK ŞERİDİ ───────────────────────── */}
      <div className="p-3 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-2.5">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-foreground">
            {formatFloorLabel(floor.name)} Planı
          </span>
          {isCriticalFloor && (
            <Badge variant="destructive" className="animate-pulse text-[9px] px-1.5 py-0 h-4 font-bold">
              Kritik Arıza
            </Badge>
          )}
          <span className="text-[11px] text-muted-foreground">
            ({floor.rooms.length} Mahal)
          </span>

          {/* 2D / 3D Görünüm Modu Butonu */}
          <div className="flex items-center bg-muted/50 p-0.5 rounded-lg border border-border/50 ml-2">
            <button
              onClick={() => setViewMode2D(false)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-md flex items-center gap-1 transition-all",
                !viewMode2D ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="3D Sims / Taktik Tipi Alçak Duvar Görünümü"
            >
              <Box className="w-3 h-3" />
              <span>3D Duvar</span>
            </button>
            <button
              onClick={() => setViewMode2D(true)}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-md flex items-center gap-1 transition-all",
                viewMode2D ? "bg-background text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
              title="2D Teknik Mimari Kuşbakışı Kat Planı"
            >
              <LayoutGrid className="w-3 h-3" />
              <span>2D Plan</span>
            </button>
          </div>
        </div>

        {/* 5 Kademeli Mini Sayaçlar */}
        <div className="flex items-center gap-1.5 text-[11px]">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border",
            dist.tolereGosterilmez > 0 ? "bg-red-500/10 text-red-600 border-red-500/30 animate-pulse" : "bg-muted/40 text-muted-foreground border-border/40"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-red-600" />
            <span>Tolere Ed.: {dist.tolereGosterilmez}</span>
          </div>

          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-md font-bold border",
            dist.yuksek > 0 ? "bg-rose-500/10 text-rose-600 border-rose-500/30" : "bg-muted/40 text-muted-foreground border-border/40"
          )}>
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
            <span>Yüksek: {dist.yuksek}</span>
          </div>

          <div className="flex items-center gap-1 px-2 py-0.5 rounded-md font-semibold bg-muted/40 text-muted-foreground border border-border/40">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
            <span>Önemli: {dist.onemli}</span>
          </div>

          <Badge variant="outline" className={cn(
            "font-mono text-[10px] font-bold px-1.5 py-0.5 h-5",
            isCriticalFloor ? "text-rose-600 border-rose-400/40 bg-rose-500/5" : "text-emerald-600 border-emerald-400/40 bg-emerald-500/5"
          )}>
            %{floor.safetyScore || (isCriticalFloor ? 48 : 94)} Güvenlik
          </Badge>
        </div>
      </div>

      {/* ─── 2. İZOMETRİK / 2D ODA PLANI CANVAS ───────────────────────── */}
      <div className="relative flex-1 min-h-[340px] flex items-center justify-center p-2 overflow-hidden">
        {viewMode2D ? (
          /* ─── 2D TEKNİK MİMARİ KUŞBAKIŞI KAT PLANI ─── */
          <div className="w-full max-w-[480px] p-4 bg-muted/10 rounded-xl border border-border/60">
            <div 
              className="grid gap-3"
              style={{
                gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`
              }}
            >
              {floor.rooms.map((room) => {
                const isSelected = selectedRoomId === room.id;
                const isCritical = room.status === 'critical';
                const isWarning = room.status === 'warning';
                return (
                  <div
                    key={room.id}
                    onClick={() => onSelectRoom(room)}
                    className={cn(
                      "p-3 rounded-lg border-2 cursor-pointer transition-all duration-200 relative flex flex-col justify-between min-h-[90px] shadow-xs",
                      isSelected 
                        ? "border-primary bg-primary/10 ring-2 ring-primary/30"
                        : isCritical
                          ? "border-rose-500/80 bg-rose-500/10 hover:bg-rose-500/15"
                          : isWarning
                            ? "border-amber-500/80 bg-amber-500/10 hover:bg-amber-500/15"
                            : "border-border/80 bg-card hover:bg-muted/40"
                    )}
                  >
                    {/* Kapı Açıklığı Göstergesi (Teknik Çizgi) */}
                    <div className="absolute top-0 right-3 w-4 h-1 bg-background border-b border-border" />

                    <div className="flex items-start justify-between gap-1">
                      <span className="font-mono text-[10px] font-bold text-muted-foreground">
                        {room.code}
                      </span>
                      {room.openRiskCount > 0 ? (
                        <Badge 
                          variant="destructive" 
                          className="h-4 px-1.5 text-[9px] font-bold"
                        >
                          {room.openRiskCount} Risk
                        </Badge>
                      ) : (
                        <span className="text-[10px] text-emerald-600 font-bold">✓ Güvenli</span>
                      )}
                    </div>

                    <div className="mt-2">
                      <h4 className="font-bold text-xs leading-tight line-clamp-2 text-foreground">
                        {room.name}
                      </h4>
                    </div>

                    <div className="mt-2 pt-1 border-t border-border/40 flex items-center justify-between text-[10px] text-muted-foreground">
                      <span className="capitalize">{room.type}</span>
                      <span className="font-bold">{room.safetyScore}%</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          /* ─── 3D ALÇAK DUVARLI (LOW-WALL CUTAWAY) İZOMETRİK PLAN ─── */
          <svg 
            viewBox="0 0 520 340" 
            className="w-full max-w-[500px] h-auto drop-shadow-md overflow-visible"
          >
            {/* Zemin Izgarası */}
            <g id="base-grid">
              {baseTiles}
            </g>

            {/* Odalar (Sims / Taktik Tipi Alçak Duvarlar ile) */}
            <g id="isometric-rooms">
              {sortedRooms.map((room) => {
                // Low-wall cutaway height (22px)
                const wallHeight = 22;
                const cx = originX + (room.gridX - room.gridY) * TILE_WIDTH_HALF;
                const cy = originY + (room.gridX + room.gridY) * TILE_HEIGHT_HALF;

                const isHovered = hoveredRoomId === room.id;
                const isSelected = selectedRoomId === room.id;
                const colors = STATUS_COLORS[room.status];
                const isCritical = room.status === 'critical';

                // Taban döşeme noktaları (Floor slab)
                const floorSlabPoints = `${cx},${cy} ${cx + TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF} ${cx},${cy + 2 * TILE_HEIGHT_HALF} ${cx - TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF}`;

                // Arka Alçak Duvarlar (Back walls)
                const backLeftWall = `${cx - TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF} ${cx},${cy} ${cx},${cy - wallHeight} ${cx - TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF - wallHeight}`;
                const backRightWall = `${cx},${cy} ${cx + TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF} ${cx + TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF - wallHeight} ${cx},${cy - wallHeight}`;

                // Ön Kısmi Alçak Duvar (Ön cephede kapı boşluğu bırakılır)
                const frontLeftWallPart = `${cx - TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF} ${cx - TILE_WIDTH_HALF * 0.4},${cy + TILE_HEIGHT_HALF * 1.6} ${cx - TILE_WIDTH_HALF * 0.4},${cy + TILE_HEIGHT_HALF * 1.6 - wallHeight} ${cx - TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF - wallHeight}`;

                return (
                  <g 
                    key={room.id}
                    className="cursor-pointer transition-all duration-200 group"
                    onMouseEnter={() => setHoveredRoomId(room.id)}
                    onMouseLeave={() => setHoveredRoomId(null)}
                    onClick={() => onSelectRoom(room)}
                    style={{
                      transform: isHovered || isSelected ? 'translateY(-6px)' : 'none',
                      transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                    }}
                  >
                    {/* Kritik Arıza Pulse Halkası */}
                    {isCritical && (
                      <ellipse
                        cx={cx}
                        cy={cy + TILE_HEIGHT_HALF}
                        rx={TILE_WIDTH_HALF + 8}
                        ry={TILE_HEIGHT_HALF + 4}
                        fill="none"
                        stroke="#F43F5E"
                        strokeWidth="2"
                        opacity="0.8"
                        className="animate-ping origin-center"
                      />
                    )}

                    {/* 1. Arka Duvarlar (Back Walls) */}
                    <polygon
                      points={backLeftWall}
                      fill={colors.left}
                      stroke={colors.border}
                      strokeWidth="1.2"
                      opacity="0.95"
                    />
                    <polygon
                      points={backRightWall}
                      fill={colors.right}
                      stroke={colors.border}
                      strokeWidth="1.2"
                      opacity="0.95"
                    />

                    {/* 2. Mahal Tabanı (Floor Slab) */}
                    <polygon
                      points={floorSlabPoints}
                      fill={colors.top}
                      stroke={isSelected ? "#0284c7" : colors.border}
                      strokeWidth={isSelected ? "2" : "1.2"}
                      strokeLinejoin="round"
                    />

                    {/* 3. Ön Alçak Duvar Parçası (Kapı Açıklıklı Cutaway) */}
                    <polygon
                      points={frontLeftWallPart}
                      fill={colors.wallFill}
                      stroke={colors.wallBorder}
                      strokeWidth="1.2"
                      opacity="0.85"
                    />

                    {/* Seçili İnce Çerçeve Vurgusu */}
                    {(isSelected || isHovered) && (
                      <polygon
                        points={floorSlabPoints}
                        fill="none"
                        stroke="#0284c7"
                        strokeWidth="2.5"
                        strokeDasharray="4 2"
                      />
                    )}

                    {/* 4. Mahal İçi 3D Risk Pini */}
                    <g transform={`translate(${cx}, ${cy - wallHeight + 6})`}>
                      <line x1="0" y1="3" x2="0" y2="12" stroke={colors.border} strokeWidth="1.5" strokeDasharray="1 1" />
                      <circle
                        cx="0"
                        cy="0"
                        r="9"
                        fill={isCritical ? "#E11D48" : colors.right}
                        stroke="#FFFFFF"
                        strokeWidth="1.5"
                        className={cn("shadow-xs", isCritical && "animate-bounce")}
                      />
                      {room.type === 'electrical' ? (
                        <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="bold">⚡</text>
                      ) : isCritical ? (
                        <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="bold">!</text>
                      ) : (
                        <text x="0" y="3.5" textAnchor="middle" fontSize="8" fill="#FFF" fontWeight="bold">✓</text>
                      )}
                    </g>

                    {/* 5. Mahal Etiket Plaketi */}
                    <g transform={`translate(${cx}, ${cy + 2 * TILE_HEIGHT_HALF + 14})`}>
                      <rect
                        x="-55"
                        y="-10"
                        width="110"
                        height="20"
                        rx="6"
                        className={cn(
                          "transition-all duration-150 shadow-xs",
                          isSelected 
                            ? "fill-primary text-primary-foreground stroke-primary" 
                            : isCritical
                              ? "fill-rose-500/15 stroke-rose-400 text-rose-700 dark:text-rose-300 font-bold"
                              : "fill-card/95 stroke-border/70 text-foreground"
                        )}
                        strokeWidth="1"
                      />
                      <text
                        x="0"
                        y="4"
                        textAnchor="middle"
                        className={cn(
                          "text-[9px] font-bold select-none",
                          isSelected ? "fill-primary-foreground" : "fill-foreground"
                        )}
                      >
                        {room.name.length > 15 ? `${room.name.slice(0, 14)}...` : room.name}
                      </text>
                    </g>
                  </g>
                );
              })}
            </g>
          </svg>
        )}

        {/* Alt İpucu Şeridi */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-muted-foreground bg-card/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-border/60">
          <span className="flex items-center gap-1 truncate font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            Mahale tıklayarak aktif tehlikeleri, telemetriyi ve simülasyonu açın.
          </span>
          <span className="font-mono text-[10px] shrink-0 font-bold">
            {viewMode2D ? '2D Mimari Plan' : '3D Alçak Duvar (Cutaway)'} • Grid: {gridSize}x{gridSize}
          </span>
        </div>
      </div>
    </div>
  );
};
