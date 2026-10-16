import React, { useState } from 'react';
import type { IsometricBuildingData, IsometricFloor } from './types';
import { formatFloorLabel } from './mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, AlertTriangle, Layers, Eye, 
  ChevronRight, Sparkles, ShieldAlert,
  ArrowUpRight, CheckCircle2
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface IsometricBuildingProps {
  building: IsometricBuildingData;
  selectedFloorId: string | null;
  onSelectFloor: (floor: IsometricFloor) => void;
  compact?: boolean;
}

const SLAB_WIDTH_HALF = 84;
const SLAB_HEIGHT_HALF = 40;
const SLAB_THICKNESS = 16;
const FLOOR_SPACING = 36;

export const IsometricBuilding: React.FC<IsometricBuildingProps> = ({
  building,
  selectedFloorId,
  onSelectFloor,
  compact = false,
}) => {
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);

  const originX = 210;
  const sortedFloorsAscending = [...building.floors].sort((a, b) => a.floorNumber - b.floorNumber);
  const floorCount = sortedFloorsAscending.length;

  // Total elevation from ground floor to top floor
  const totalElevation = (floorCount - 1) * FLOOR_SPACING;
  // Center drawing vertically in viewBox (400 x 360)
  // Top-most vertex is at: baseOriginY - totalElevation
  // Bottom plinth vertex is at: baseOriginY + SLAB_HEIGHT_HALF + 38
  // Total height = totalElevation + SLAB_HEIGHT_HALF + 38 = totalElevation + 78
  // Target center Y = 180 => baseOriginY = 180 + totalElevation / 2 - 39
  const baseOriginY = Math.round(180 + totalElevation / 2 - 39);

  const criticalFloor = building.floors.find(f => f.floorNumber === 13 || f.hasCriticalFault);

  return (
    <div className="flex flex-col h-full bg-card/40 select-none">
      {/* 1. ÜST PANEL BAŞLIĞI */}
      <div className="px-4 py-3 border-b flex items-center justify-between text-xs bg-muted/20">
        <span className="font-bold text-foreground flex items-center gap-1.5">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          Bina Kulesi
        </span>
        <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-border/60">
          {floorCount} Katlı Blok
        </Badge>
      </div>

      {/* 2. İZOMETRİK KULE SVG SAHNESİ */}
      <div className="relative flex-1 min-h-[310px] flex items-center justify-center p-3 overflow-hidden">
        <svg 
          viewBox="0 0 400 360" 
          className="w-full max-w-[360px] h-auto drop-shadow-md overflow-visible"
        >
          <defs>
            <filter id="shadow-tower" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.08" />
            </filter>
          </defs>

          {/* Zemin Taban Plaketi / Podyum */}
          <g id="tower-podium">
            {/* Plinth Base */}
            <polygon
              points={`${originX},${baseOriginY + SLAB_HEIGHT_HALF + 14} ${originX + SLAB_WIDTH_HALF + 26},${baseOriginY + SLAB_HEIGHT_HALF + 28} ${originX},${baseOriginY + SLAB_HEIGHT_HALF + 42} ${originX - SLAB_WIDTH_HALF - 26},${baseOriginY + SLAB_HEIGHT_HALF + 28}`}
              className="fill-slate-100 dark:fill-slate-900/60 stroke-border/50"
              strokeWidth="1.2"
            />
            {/* Plinth Thickness */}
            <polygon
              points={`${originX - SLAB_WIDTH_HALF - 26},${baseOriginY + SLAB_HEIGHT_HALF + 28} ${originX},${baseOriginY + SLAB_HEIGHT_HALF + 42} ${originX},${baseOriginY + SLAB_HEIGHT_HALF + 50} ${originX - SLAB_WIDTH_HALF - 26},${baseOriginY + SLAB_HEIGHT_HALF + 36}`}
              className="fill-slate-200/90 dark:fill-slate-800/80 stroke-border/50"
              strokeWidth="1.2"
            />
            <polygon
              points={`${originX},${baseOriginY + SLAB_HEIGHT_HALF + 42} ${originX + SLAB_WIDTH_HALF + 26},${baseOriginY + SLAB_HEIGHT_HALF + 28} ${originX + SLAB_WIDTH_HALF + 26},${baseOriginY + SLAB_HEIGHT_HALF + 36} ${originX},${baseOriginY + SLAB_HEIGHT_HALF + 50}`}
              className="fill-slate-300/80 dark:fill-slate-800/90 stroke-border/50"
              strokeWidth="1.2"
            />
            {/* Peyzaj Süsleri */}
            <circle cx={originX - SLAB_WIDTH_HALF - 10} cy={baseOriginY + SLAB_HEIGHT_HALF + 22} r="5" className="fill-emerald-400 stroke-emerald-600/40" />
            <circle cx={originX + SLAB_WIDTH_HALF + 10} cy={baseOriginY + SLAB_HEIGHT_HALF + 22} r="5" className="fill-emerald-400 stroke-emerald-600/40" />
          </g>

          {/* Kat Plakaları */}
          <g id="tower-floors">
            {sortedFloorsAscending.map((floor, index) => {
              const cleanName = formatFloorLabel(floor.name);
              const isSelected = selectedFloorId === floor.id || selectedFloorId === floor.name || selectedFloorId === cleanName;
              const isHovered = hoveredFloorId === floor.id;
              const isCritical = floor.hasCriticalFault || floor.status === 'critical';
              const isWarning = floor.status === 'warning';
              const isTopFloor = index === floorCount - 1;

              // Vertical coordinate
              const elevation = index * FLOOR_SPACING;
              const cx = originX;
              const cy = baseOriginY - elevation;

              // Monument Valley Architectural Palette
              let topFill = '#E2E8F0';     // Slate-200
              let leftFill = '#CBD5E1';    // Slate-300
              let rightFill = '#94A3B8';   // Slate-400
              let strokeColor = '#64748B'; // Slate-500

              if (isCritical) {
                topFill = '#FECDD3';     // Rose-200
                leftFill = '#FB7185';    // Rose-400
                rightFill = '#E11D48';   // Rose-600
                strokeColor = '#BE123C';
              } else if (isWarning) {
                topFill = '#FDE68A';     // Amber-200
                leftFill = '#FBBF24';    // Amber-400
                rightFill = '#D97706';   // Amber-600
                strokeColor = '#B45309';
              } else if (isSelected) {
                topFill = '#BAE6FD';     // Sky-200
                leftFill = '#38BDF8';    // Sky-400
                rightFill = '#0284C7';   // Sky-600
                strokeColor = '#0369A1';
              }

              // Slab vertices
              const topPoints = `${cx},${cy} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF}`;
              const leftPoints = `${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF + SLAB_THICKNESS} ${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF + SLAB_THICKNESS}`;
              const rightPoints = `${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF + SLAB_THICKNESS} ${cx},${cy + 2 * SLAB_HEIGHT_HALF + SLAB_THICKNESS}`;

              const translateX = isHovered || isSelected ? -6 : 0;
              const translateY = isHovered || isSelected ? -3 : 0;

              return (
                <g
                  key={floor.id}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredFloorId(floor.id)}
                  onMouseLeave={() => setHoveredFloorId(null)}
                  onClick={() => onSelectFloor(floor)}
                  style={{
                    transform: `translate(${translateX}px, ${translateY}px)`,
                    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
                  }}
                >
                  {/* Sol Yüzey */}
                  <polygon
                    points={leftPoints}
                    fill={leftFill}
                    stroke={strokeColor}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  {/* Cephe Cam Çizgileri */}
                  <line 
                    x1={cx - SLAB_WIDTH_HALF * 0.7} 
                    y1={cy + SLAB_HEIGHT_HALF * 1.15} 
                    x2={cx - SLAB_WIDTH_HALF * 0.3} 
                    y2={cy + SLAB_HEIGHT_HALF * 1.55} 
                    stroke="rgba(255,255,255,0.4)" 
                    strokeWidth="2" 
                    strokeDasharray="4 3" 
                  />

                  {/* Sağ Yüzey */}
                  <polygon
                    points={rightPoints}
                    fill={rightFill}
                    stroke={strokeColor}
                    strokeWidth="1.2"
                    strokeLinejoin="round"
                  />
                  <line 
                    x1={cx + SLAB_WIDTH_HALF * 0.3} 
                    y1={cy + SLAB_HEIGHT_HALF * 1.55} 
                    x2={cx + SLAB_WIDTH_HALF * 0.7} 
                    y2={cy + SLAB_HEIGHT_HALF * 1.15} 
                    stroke="rgba(0,0,0,0.15)" 
                    strokeWidth="2" 
                    strokeDasharray="4 3" 
                  />

                  {/* Üst Yüzey */}
                  <polygon
                    points={topPoints}
                    fill={topFill}
                    stroke={strokeColor}
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />

                  {/* Çatı Helipad */}
                  {isTopFloor && (
                    <g transform={`translate(${cx}, ${cy + SLAB_HEIGHT_HALF})`}>
                      <ellipse cx="0" cy="0" rx="24" ry="12" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeDasharray="3 2" />
                      <ellipse cx="0" cy="0" rx="14" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
                      <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFFFFF" fontWeight="black">H</text>
                    </g>
                  )}

                  {/* Kritik Arıza İkaz Rozeti (Sağ Kenar) */}
                  {isCritical && (
                    <g transform={`translate(${cx + SLAB_WIDTH_HALF + 14}, ${cy + SLAB_HEIGHT_HALF})`}>
                      <circle cx="0" cy="0" r="12" fill="#F43F5E" opacity="0.35" className="animate-ping" />
                      <circle cx="0" cy="0" r="8" fill="#E11D48" stroke="#FFF" strokeWidth="1.5" className="shadow-xs animate-pulse" />
                      <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="bold">!</text>
                    </g>
                  )}

                  {/* Kat Bağlantı Lider Çizgisi */}
                  <line
                    x1={cx - SLAB_WIDTH_HALF - 4}
                    y1={cy + SLAB_HEIGHT_HALF}
                    x2={cx - SLAB_WIDTH_HALF + 6}
                    y2={cy + SLAB_HEIGHT_HALF}
                    stroke={isSelected ? "#0284C7" : isCritical ? "#E11D48" : "#94A3B8"}
                    strokeWidth="1.2"
                    strokeDasharray="2 2"
                  />

                  {/* Kat Etiket Plaketi (Sol Kenar) */}
                  <g transform={`translate(${cx - SLAB_WIDTH_HALF - 72}, ${cy + SLAB_HEIGHT_HALF - 10})`}>
                    <rect
                      x="0"
                      y="0"
                      width="66"
                      height="20"
                      rx="6"
                      className={cn(
                        "transition-all duration-200",
                        isSelected
                          ? "fill-primary text-primary-foreground stroke-primary"
                          : isCritical
                            ? "fill-rose-500/15 stroke-rose-400 text-rose-700 dark:text-rose-300 font-bold"
                            : "fill-card/95 stroke-border/70 text-foreground hover:fill-muted"
                      )}
                      strokeWidth="1.2"
                    />
                    {/* Status Dot */}
                    <circle
                      cx="8"
                      cy="10"
                      r="2.5"
                      className={cn(
                        isCritical ? "fill-rose-500" : isWarning ? "fill-amber-500" : "fill-emerald-500"
                      )}
                    />
                    <text
                      x="38"
                      y="13"
                      textAnchor="middle"
                      className={cn(
                        "text-[9px] font-bold select-none",
                        isSelected ? "fill-primary-foreground" : "fill-foreground"
                      )}
                    >
                      {cleanName.slice(0, 10)}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>
        </svg>
      </div>

      {/* 3. ALT BÖLÜM: KRİTİK ARIZA BİLDİRİMİ & KAT LİSTESİ */}
      <div className="p-3 border-t bg-muted/10 space-y-2">
        {criticalFloor && (
          <div 
            onClick={() => onSelectFloor(criticalFloor)}
            className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-300 dark:border-rose-900/60 text-xs flex items-center justify-between cursor-pointer hover:bg-rose-500/15 transition-all shadow-2xs group"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shrink-0" />
              <div className="min-w-0">
                <span className="font-bold text-[11px] text-rose-700 dark:text-rose-300 block truncate">
                  13. Kat Pano Aşırı Yük Arızası
                </span>
                <span className="text-[10px] text-rose-600/80 dark:text-rose-400/80 block truncate">
                  Bara 78.4°C • Faz Dengesizliği (185V)
                </span>
              </div>
            </div>
            <ArrowUpRight className="w-4 h-4 text-rose-600 shrink-0 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </div>
        )}

        {/* Hızlı Kat Atlama Şeridi */}
        <div className="flex items-center justify-between text-[11px] text-muted-foreground px-1">
          <span>Hızlı Kat Seçimi:</span>
          <div className="flex items-center gap-1">
            {sortedFloorsAscending.map(f => {
              const isSel = selectedFloorId === f.id || selectedFloorId === f.name;
              return (
                <button
                  key={f.id}
                  onClick={() => onSelectFloor(f)}
                  className={cn(
                    "px-1.5 py-0.5 rounded text-[10px] font-mono font-bold transition-all",
                    isSel ? "bg-primary text-primary-foreground" : "hover:bg-muted text-muted-foreground"
                  )}
                >
                  {f.floorNumber}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
