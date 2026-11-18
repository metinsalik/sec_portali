import React, { useState } from 'react';
import type { IsometricBuildingData, IsometricFloor } from './types';
import { formatFloorLabel } from './mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Building2, Layers, Sparkles, Shield,
  Expand, Shrink, Eye
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
const BASE_FLOOR_SPACING = 36;

export const IsometricBuilding: React.FC<IsometricBuildingProps> = ({
  building,
  selectedFloorId,
  onSelectFloor,
  compact = false,
}) => {
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(true);
  const [isExploded, setIsExploded] = useState<boolean>(false);

  const originX = 210;
  const sortedFloorsAscending = [...building.floors].sort((a, b) => a.floorNumber - b.floorNumber);
  const floorCount = sortedFloorsAscending.length;

  const floorSpacing = isExploded ? BASE_FLOOR_SPACING * 1.55 : BASE_FLOOR_SPACING;

  // Total elevation from ground floor to top floor
  const totalElevation = Math.max(1, (floorCount - 1)) * floorSpacing;
  const baseOriginY = Math.round(185 + totalElevation / 2 - 38);

  // Glass envelope dimensions (with padding Delta ~ 12px)
  const envWidthHalf = SLAB_WIDTH_HALF + 14;
  const envHeightHalf = SLAB_HEIGHT_HALF + 7;
  const topElevation = (floorCount - 1) * floorSpacing;
  const topEnvelopeY = baseOriginY - topElevation - 10;
  const bottomEnvelopeY = baseOriginY + SLAB_THICKNESS + 4;

  const hasSelection = Boolean(selectedFloorId);

  return (
    <div className="flex flex-col h-full bg-card/40 select-none">
      {/* 1. ÜST PANEL BAŞLIĞI VE MOD SEÇİCİLER */}
      <div className="px-3.5 py-2.5 border-b flex items-center justify-between text-xs bg-muted/20">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span>{building.name || 'Bina Kulesi'}</span>
          <Badge variant="outline" className="text-[10px] font-semibold text-muted-foreground border-border/60">
            {floorCount} Kat
          </Badge>
        </div>

        {/* 3D Kontrolleri (Cam Kabuk & Patlatılmış Görünüm) */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={showEnvelope ? 'default' : 'outline'}
            className={cn(
              "h-6 px-2 text-[10px] gap-1 rounded-md transition-all",
              showEnvelope ? "bg-sky-500 hover:bg-sky-600 text-white" : "text-muted-foreground"
            )}
            onClick={() => setShowEnvelope((v) => !v)}
            title="Parametrik Cam Dış Kabuğu Aç/Kapat"
          >
            <Shield className="w-3 h-3" />
            <span>Cam Kabuk</span>
          </Button>

          <Button
            size="sm"
            variant={isExploded ? 'default' : 'outline'}
            className={cn(
              "h-6 px-2 text-[10px] gap-1 rounded-md transition-all",
              isExploded ? "bg-indigo-600 hover:bg-indigo-700 text-white" : "text-muted-foreground"
            )}
            onClick={() => setIsExploded((v) => !v)}
            title="Katları Patlatılmış Ayrışık Görünümde İncele"
          >
            {isExploded ? <Shrink className="w-3 h-3" /> : <Expand className="w-3 h-3" />}
            <span>{isExploded ? 'Normal' : 'Patlat'}</span>
          </Button>
        </div>
      </div>

      {/* 2. İZOMETRİK KULE SVG SAHNESİ */}
      <div className="relative flex-1 min-h-[320px] flex items-center justify-center p-3 overflow-hidden">
        <svg 
          viewBox={`0 0 420 ${Math.max(380, totalElevation + 160)}`} 
          className="w-full max-w-[380px] h-auto drop-shadow-md overflow-visible"
        >
          <defs>
            <filter id="shadow-tower" x="-20%" y="-20%" width="150%" height="150%">
              <feDropShadow dx="0" dy="4" stdDeviation="4" floodOpacity="0.08" />
            </filter>

            {/* Giydirme Cam Kabuk Gradyanları (X-Ray Glass Facade) */}
            <linearGradient id="glass-curtain-left" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.22" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0.08" />
            </linearGradient>

            <linearGradient id="glass-curtain-right" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.10" />
            </linearGradient>

            <linearGradient id="glass-curtain-roof" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#bae6fd" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.15" />
            </linearGradient>
          </defs>

          {/* Zemin Taban Plaketi / Podyum Temeli */}
          <g id="tower-podium">
            <polygon
              points={`${originX},${baseOriginY + SLAB_HEIGHT_HALF + 14} ${originX + SLAB_WIDTH_HALF + 26},${baseOriginY + SLAB_HEIGHT_HALF + 28} ${originX},${baseOriginY + SLAB_HEIGHT_HALF + 42} ${originX - SLAB_WIDTH_HALF - 26},${baseOriginY + SLAB_HEIGHT_HALF + 28}`}
              className="fill-slate-100 dark:fill-slate-900/60 stroke-border/50"
              strokeWidth="1.2"
            />
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
            {/* Peyzaj ve zemin aksları */}
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
              const elevation = index * floorSpacing;
              const cx = originX;
              const cy = baseOriginY - elevation;

              // Floor focus / cutaway: if a floor is selected, dim others to 30% opacity
              const opacity = hasSelection ? (isSelected ? 1 : 0.28) : 1;

              // Color palette
              let topFill = '#E2E8F0';
              let leftFill = '#CBD5E1';
              let rightFill = '#94A3B8';
              let strokeColor = '#64748B';

              if (isCritical) {
                topFill = '#FECDD3';
                leftFill = '#FB7185';
                rightFill = '#E11D48';
                strokeColor = '#BE123C';
              } else if (isWarning) {
                topFill = '#FDE68A';
                leftFill = '#FBBF24';
                rightFill = '#D97706';
                strokeColor = '#B45309';
              } else if (isSelected) {
                topFill = '#BAE6FD';
                leftFill = '#38BDF8';
                rightFill = '#0284C7';
                strokeColor = '#0369A1';
              }

              // Slab vertices
              const topPoints = `${cx},${cy} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF}`;
              const leftPoints = `${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF + SLAB_THICKNESS} ${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF + SLAB_THICKNESS}`;
              const rightPoints = `${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF + SLAB_THICKNESS} ${cx},${cy + 2 * SLAB_HEIGHT_HALF + SLAB_THICKNESS}`;

              // Selected floor pops out forward and to the left (Exploded focus)
              const translateX = isSelected ? -18 : isHovered ? -8 : 0;
              const translateY = isSelected ? -8 : isHovered ? -4 : 0;

              return (
                <g
                  key={floor.id}
                  className="cursor-pointer group"
                  onMouseEnter={() => setHoveredFloorId(floor.id)}
                  onMouseLeave={() => setHoveredFloorId(null)}
                  onClick={() => onSelectFloor(floor)}
                  style={{
                    opacity,
                    transform: `translate(${translateX}px, ${translateY}px)`,
                    transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
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
                  {/* Cephe Çizgileri */}
                  <line 
                    x1={cx - SLAB_WIDTH_HALF * 0.7} 
                    y1={cy + SLAB_HEIGHT_HALF * 1.15} 
                    x2={cx - SLAB_WIDTH_HALF * 0.3} 
                    y2={cy + SLAB_HEIGHT_HALF * 1.55} 
                    stroke="rgba(255,255,255,0.45)" 
                    strokeWidth="1.8" 
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
                    stroke="rgba(0,0,0,0.18)" 
                    strokeWidth="1.8" 
                    strokeDasharray="4 3" 
                  />

                  {/* Üst Yüzey (Mahal Tabanı / Kat Döşemesi) */}
                  <polygon
                    points={topPoints}
                    fill={topFill}
                    stroke={isSelected ? "#0284c7" : strokeColor}
                    strokeWidth={isSelected ? "2" : "1.4"}
                    strokeLinejoin="round"
                  />

                  {/* Seçili Kat Neon Vurgusu */}
                  {isSelected && (
                    <polygon
                      points={topPoints}
                      fill="none"
                      stroke="#0284c7"
                      strokeWidth="2.5"
                      strokeDasharray="4 3"
                    />
                  )}

                  {/* Çatı Helipad */}
                  {isTopFloor && (
                    <g transform={`translate(${cx}, ${cy + SLAB_HEIGHT_HALF})`}>
                      <ellipse cx="0" cy="0" rx="24" ry="12" fill="none" stroke="#FFFFFF" strokeWidth="1.6" strokeDasharray="3 2" />
                      <ellipse cx="0" cy="0" rx="14" ry="7" fill="none" stroke="#FFFFFF" strokeWidth="1.6" />
                      <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFFFFF" fontWeight="black">H</text>
                    </g>
                  )}

                  {/* Kritik Arıza İkaz Rozeti */}
                  {isCritical && (
                    <g transform={`translate(${cx + SLAB_WIDTH_HALF + 14}, ${cy + SLAB_HEIGHT_HALF})`}>
                      <circle cx="0" cy="0" r="12" fill="#F43F5E" opacity="0.35" className="animate-ping" />
                      <circle cx="0" cy="0" r="8" fill="#E11D48" stroke="#FFF" strokeWidth="1.5" className="shadow-xs animate-pulse" />
                      <text x="0" y="3.5" textAnchor="middle" fontSize="9" fill="#FFF" fontWeight="bold">!</text>
                    </g>
                  )}

                  {/* Kat Etiket Plaketi (Sol Kenar) */}
                  <g transform={`translate(${cx - SLAB_WIDTH_HALF - 78}, ${cy + SLAB_HEIGHT_HALF - 11})`}>
                    <rect
                      x="0"
                      y="0"
                      width="72"
                      height="22"
                      rx="6"
                      className={cn(
                        "transition-all duration-150",
                        isSelected 
                          ? "fill-primary text-primary-foreground stroke-primary" 
                          : isCritical
                            ? "fill-rose-500/15 stroke-rose-400 text-rose-700 dark:text-rose-300 font-bold"
                            : "fill-card/90 stroke-border/70 text-foreground"
                      )}
                      strokeWidth="1"
                    />
                    <text
                      x="36"
                      y="15"
                      textAnchor="middle"
                      className={cn(
                        "text-[10px] font-bold select-none",
                        isSelected ? "fill-primary-foreground" : "fill-foreground"
                      )}
                    >
                      {cleanName}
                    </text>
                  </g>
                </g>
              );
            })}
          </g>

          {/* 3. PARAMETRİK DIŞ GİYDİRME CAM KABUK (X-Ray Glass Curtain Envelope) */}
          {showEnvelope && (
            <g id="glass-curtain-envelope" className="pointer-events-none select-none transition-opacity duration-300">
              {/* Sol Cam Cephe */}
              <polygon
                points={`${originX - envWidthHalf},${topEnvelopeY + envHeightHalf} ${originX},${topEnvelopeY + 2 * envHeightHalf} ${originX},${bottomEnvelopeY + 2 * envHeightHalf} ${originX - envWidthHalf},${bottomEnvelopeY + envHeightHalf}`}
                fill="url(#glass-curtain-left)"
                stroke="#38bdf8"
                strokeWidth="1.2"
                strokeOpacity="0.75"
                strokeDasharray="4 2"
              />

              {/* Sağ Cam Cephe */}
              <polygon
                points={`${originX},${topEnvelopeY + 2 * envHeightHalf} ${originX + envWidthHalf},${topEnvelopeY + envHeightHalf} ${originX + envWidthHalf},${bottomEnvelopeY + envHeightHalf} ${originX},${bottomEnvelopeY + 2 * envHeightHalf}`}
                fill="url(#glass-curtain-right)"
                stroke="#818cf8"
                strokeWidth="1.2"
                strokeOpacity="0.75"
                strokeDasharray="4 2"
              />

              {/* Tavan Cam Çatısı */}
              <polygon
                points={`${originX},${topEnvelopeY} ${originX + envWidthHalf},${topEnvelopeY + envHeightHalf} ${originX},${topEnvelopeY + 2 * envHeightHalf} ${originX - envWidthHalf},${topEnvelopeY + envHeightHalf}`}
                fill="url(#glass-curtain-roof)"
                stroke="#38bdf8"
                strokeWidth="1.5"
                strokeOpacity="0.85"
              />

              {/* Dikey Profil Mullion Hatları (Alüminyum Kırılmalar) */}
              <line
                x1={originX}
                y1={topEnvelopeY + 2 * envHeightHalf}
                x2={originX}
                y2={bottomEnvelopeY + 2 * envHeightHalf}
                stroke="#38bdf8"
                strokeWidth="1.8"
                strokeOpacity="0.85"
              />
              <line
                x1={originX - envWidthHalf * 0.5}
                y1={topEnvelopeY + envHeightHalf * 1.5}
                x2={originX - envWidthHalf * 0.5}
                y2={bottomEnvelopeY + envHeightHalf * 1.5}
                stroke="#38bdf8"
                strokeWidth="1"
                strokeOpacity="0.5"
              />
              <line
                x1={originX + envWidthHalf * 0.5}
                y1={topEnvelopeY + envHeightHalf * 1.5}
                x2={originX + envWidthHalf * 0.5}
                y2={bottomEnvelopeY + envHeightHalf * 1.5}
                stroke="#818cf8"
                strokeWidth="1"
                strokeOpacity="0.5"
              />

              {/* Yatay Kat Cam Fitilleri */}
              {sortedFloorsAscending.map((_, i) => {
                const cy = baseOriginY - i * floorSpacing + envHeightHalf * 1.4;
                return (
                  <g key={`mullion-floor-${i}`}>
                    <line
                      x1={originX - envWidthHalf}
                      y1={cy - envHeightHalf * 0.4}
                      x2={originX}
                      y2={cy + envHeightHalf * 0.4}
                      stroke="rgba(56, 189, 248, 0.4)"
                      strokeWidth="1"
                    />
                    <line
                      x1={originX}
                      y1={cy + envHeightHalf * 0.4}
                      x2={originX + envWidthHalf}
                      y2={cy - envHeightHalf * 0.4}
                      stroke="rgba(129, 140, 248, 0.4)"
                      strokeWidth="1"
                    />
                  </g>
                );
              })}
            </g>
          )}
        </svg>

        {/* Alt Bilgi */}
        <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-muted-foreground bg-card/90 backdrop-blur-xs px-3 py-1 rounded-lg border border-border/60">
          <span className="flex items-center gap-1 truncate font-medium">
            <Sparkles className="w-3 h-3 text-primary shrink-0" />
            Kata tıklayarak kat planını ve alçak duvarlı mahallerini inceleyin.
          </span>
          <span className="font-mono text-[10px] shrink-0 font-bold text-primary">
            {showEnvelope ? 'Cam Kabuk: Aktif' : 'Cam Kabuk: Kapalı'}
          </span>
        </div>
      </div>
    </div>
  );
};
