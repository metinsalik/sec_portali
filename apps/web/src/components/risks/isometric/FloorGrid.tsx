import React, { useState } from 'react';
import type { IsometricFloor, IsometricRoom, StatusType } from './types';
import { formatFloorLabel } from './mockData';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Zap, Server, Activity, Briefcase, 
  Archive, ShieldAlert, CheckCircle2, AlertTriangle,
  Layers, Info, Sparkles, Gauge
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

const STATUS_COLORS: Record<StatusType, { top: string; left: string; right: string; border: string }> = {
  normal: {
    top: '#A7F3D0',    // Emerald-200
    left: '#34D399',   // Emerald-400
    right: '#059669',  // Emerald-600
    border: '#047857',
  },
  warning: {
    top: '#FDE68A',    // Amber-200
    left: '#FBBF24',   // Amber-400
    right: '#D97706',  // Amber-600
    border: '#B45309',
  },
  critical: {
    top: '#FECDD3',    // Rose-200
    left: '#FB7185',   // Rose-400
    right: '#E11D48',  // Rose-600
    border: '#BE123C',
  }
};

export const FloorGrid: React.FC<FloorGridProps> = ({
  floor,
  selectedRoomId,
  onSelectRoom,
}) => {
  const [hoveredRoomId, setHoveredRoomId] = useState<string | null>(null);

  const gridSize = floor.gridSize || 3;
  // Center of canvas
  const originX = 260;
  const originY = 85;

  // Base tiles
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

      {/* ─── 2. İZOMETRİK ODA IZGARASI CANVAS ─────────────────────────── */}
      <div className="relative flex-1 min-h-[340px] flex items-center justify-center p-2 overflow-hidden">
        <svg 
          viewBox="0 0 520 340" 
          className="w-full max-w-[500px] h-auto drop-shadow-md overflow-visible"
        >
          {/* Zemin Izgarası */}
          <g id="base-grid">
            {baseTiles}
          </g>

          {/* Odalar */}
          <g id="isometric-rooms">
            {sortedRooms.map((room) => {
              const h = room.height || 30;
              const cx = originX + (room.gridX - room.gridY) * TILE_WIDTH_HALF;
              const cy = originY + (room.gridX + room.gridY) * TILE_HEIGHT_HALF;

              const isHovered = hoveredRoomId === room.id;
              const isSelected = selectedRoomId === room.id;
              const colors = STATUS_COLORS[room.status];
              const isCritical = room.status === 'critical';

              // Polygons
              const topPoints = `${cx},${cy - h} ${cx + TILE_WIDTH_HALF},${cy - h + TILE_HEIGHT_HALF} ${cx},${cy - h + 2 * TILE_HEIGHT_HALF} ${cx - TILE_WIDTH_HALF},${cy - h + TILE_HEIGHT_HALF}`;
              const leftPoints = `${cx - TILE_WIDTH_HALF},${cy - h + TILE_HEIGHT_HALF} ${cx},${cy - h + 2 * TILE_HEIGHT_HALF} ${cx},${cy + 2 * TILE_HEIGHT_HALF} ${cx - TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF}`;
              const rightPoints = `${cx},${cy - h + 2 * TILE_HEIGHT_HALF} ${cx + TILE_WIDTH_HALF},${cy - h + TILE_HEIGHT_HALF} ${cx + TILE_WIDTH_HALF},${cy + TILE_HEIGHT_HALF} ${cx},${cy + 2 * TILE_HEIGHT_HALF}`;

              return (
                <g 
                  key={room.id}
                  className="cursor-pointer transition-all duration-200 group"
                  onMouseEnter={() => setHoveredRoomId(room.id)}
                  onMouseLeave={() => setHoveredRoomId(null)}
                  onClick={() => onSelectRoom(room)}
                  style={{
                    transform: isHovered || isSelected ? 'translateY(-5px)' : 'none',
                    transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Kritik Arıza Pulse Halkası */}
                  {isCritical && (
                    <ellipse
                      cx={cx}
                      cy={cy + TILE_HEIGHT_HALF}
                      rx={TILE_WIDTH_HALF + 10}
                      ry={TILE_HEIGHT_HALF + 5}
                      fill="none"
                      stroke="#F43F5E"
                      strokeWidth="2"
                      opacity="0.8"
                      className="animate-ping origin-center"
                    />
                  )}

                  {/* Sol Yüzey */}
                  <polygon
                    points={leftPoints}
                    fill={colors.left}
                    stroke={colors.border}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />

                  {/* Sağ Yüzey */}
                  <polygon
                    points={rightPoints}
                    fill={colors.right}
                    stroke={colors.border}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />

                  {/* Üst Yüzey */}
                  <polygon
                    points={topPoints}
                    fill={colors.top}
                    stroke={colors.border}
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />

                  {/* Seçili İnce Çerçeve */}
                  {(isSelected || isHovered) && (
                    <polygon
                      points={topPoints}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeDasharray="3 2"
                    />
                  )}

                  {/* 3D Durum Pini */}
                  <g transform={`translate(${cx}, ${cy - h + TILE_HEIGHT_HALF - 8})`}>
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
                    ) : room.type === 'ups' ? (
                      <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="bold">🔋</text>
                    ) : isCritical ? (
                      <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="bold">!</text>
                    ) : (
                      <text x="0" y="3.5" textAnchor="middle" fontSize="8" fill="#FFF" fontWeight="bold">✓</text>
                    )}
                  </g>

                  {/* Oda Etiket Plaketi */}
                  <g transform={`translate(${cx}, ${cy + 2 * TILE_HEIGHT_HALF + 14})`}>
                    <rect
                      x="-55"
                      y="-10"
                      width="110"
                      height="20"
                      rx="6"
                      className={cn(
                        "transition-all duration-150",
                        isSelected 
                          ? "fill-primary text-primary-foreground stroke-primary" 
                          : isCritical
                            ? "fill-rose-500/10 stroke-rose-400 text-rose-700 dark:text-rose-300 font-bold"
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

        {/* Alt İpucu */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-muted-foreground bg-card/90 backdrop-blur-xs px-3 py-1.5 rounded-xl border border-border/60">
          <span className="flex items-center gap-1 truncate font-medium">
            <Sparkles className="w-3.5 h-3.5 text-primary shrink-0" />
            Mahale tıklayarak aktif tehlikeleri, telemetriyi ve simülasyonu açın.
          </span>
          <span className="font-mono text-[10px] shrink-0">Grid: {gridSize}x{gridSize}</span>
        </div>
      </div>
    </div>
  );
};
