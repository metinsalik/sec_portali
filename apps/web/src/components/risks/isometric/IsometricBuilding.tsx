import React, { useState, useRef, useMemo } from 'react';
import type { IsometricBuildingData, IsometricFloor } from './types';
import { formatFloorLabel } from './mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Building2, Shield, Expand, Shrink,
  RotateCcw, ZoomIn, ZoomOut, Compass,
  ArrowUp, ArrowDown, ArrowLeft, ArrowRight
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

export const IsometricBuilding: React.FC<IsometricBuildingProps> = ({
  building,
  selectedFloorId,
  onSelectFloor,
  compact = false,
}) => {
  const [hoveredFloorId, setHoveredFloorId] = useState<string | null>(null);
  const [showEnvelope, setShowEnvelope] = useState<boolean>(true);
  const [isExploded, setIsExploded] = useState<boolean>(false);

  // ─── GERÇEK 3D KAMERA VE YÖRÜNGE (Orbit, Tilt, Pan, Zoom) ───────────
  const [camera, setCamera] = useState({
    zoom: 1,
    rotateX: 12,  // Pitch (Dikey eğim açısı)
    rotateY: -16, // Yaw (Yatay dönme açısı)
    rotateZ: 0,
    panX: 0,
    panY: 0,
  });
  const [isDragging, setIsDragging] = useState(false);
  const dragStartRef = useRef({ x: 0, y: 0, panX: 0, panY: 0, rotateX: 0, rotateY: 0, isPan: false });
  const svgRef = useRef<SVGSVGElement | null>(null);

  const originX = 210;
  const sortedFloorsAscending = useMemo(() => {
    return [...building.floors].sort((a, b) => a.floorNumber - b.floorNumber);
  }, [building.floors]);

  const sortedFloorsDescending = useMemo(() => {
    return [...building.floors].sort((a, b) => b.floorNumber - a.floorNumber);
  }, [building.floors]);

  const floorCount = sortedFloorsAscending.length;

  // 15 kat ve çok katlı binalar için dinamik aralık ölçeklemesi
  const baseSpacing = useMemo(() => {
    if (floorCount >= 14) return 21; // 15 kat için ~294px
    if (floorCount >= 10) return 25;
    return 34;
  }, [floorCount]);

  const floorSpacing = isExploded ? baseSpacing * 1.55 : baseSpacing;

  // Toplam bina yüksekliği
  const totalElevation = Math.max(1, (floorCount - 1)) * floorSpacing;
  const baseOriginY = Math.round(180 + totalElevation / 2 - 25);

  // Giydirme cam kabuk boyutları
  const envWidthHalf = SLAB_WIDTH_HALF + 14;
  const envHeightHalf = SLAB_HEIGHT_HALF + 7;
  const topElevation = (floorCount - 1) * floorSpacing;
  const topEnvelopeY = baseOriginY - topElevation - 10;
  const bottomEnvelopeY = baseOriginY + SLAB_THICKNESS + 4;

  const hasSelection = Boolean(selectedFloorId);

  // ─── FARE VE DOKUNMATİK KAMERA KONTROLLERİ (Pointer Capture) ─────────
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || (e.target as HTMLElement).closest('.interactive-floor')) {
      return;
    }
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch { }

    const isPan = e.button === 2 || e.shiftKey || e.button === 1;
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: camera.panX,
      panY: camera.panY,
      rotateX: camera.rotateX,
      rotateY: camera.rotateY,
      isPan,
    };
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;

    if (dragStartRef.current.isPan) {
      setCamera(c => ({
        ...c,
        panX: dragStartRef.current.panX + dx,
        panY: dragStartRef.current.panY + dy,
      }));
    } else {
      // 3D Orbit: dx yatayda (rotateY), dy dikeyde (rotateX) döndürür
      setCamera(c => ({
        ...c,
        rotateY: Math.max(-75, Math.min(75, dragStartRef.current.rotateY + dx * 0.35)),
        rotateX: Math.max(-40, Math.min(55, dragStartRef.current.rotateX - dy * 0.28)),
      }));
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch { }
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY > 0 ? -0.1 : 0.1;
    setCamera(c => ({
      ...c,
      zoom: Math.max(0.45, Math.min(2.5, Number((c.zoom + zoomDelta).toFixed(2))))
    }));
  };

  // ─── KAMERA D-PAD VE PRESET KONTROLLERİ ─────────────────────────────
  const rotateLeft = () => setCamera(c => ({ ...c, rotateY: Math.max(-75, c.rotateY - 14) }));
  const rotateRight = () => setCamera(c => ({ ...c, rotateY: Math.min(75, c.rotateY + 14) }));
  const tiltUp = () => setCamera(c => ({ ...c, rotateX: Math.min(55, c.rotateX + 10) }));
  const tiltDown = () => setCamera(c => ({ ...c, rotateX: Math.max(-40, c.rotateX - 10) }));
  const zoomIn = () => setCamera(c => ({ ...c, zoom: Math.min(2.5, Number((c.zoom + 0.15).toFixed(2))) }));
  const zoomOut = () => setCamera(c => ({ ...c, zoom: Math.max(0.45, Number((c.zoom - 0.15).toFixed(2))) }));

  const setCameraPreset = (preset: 'isometric' | 'front' | 'top') => {
    if (preset === 'isometric') {
      setCamera({ zoom: 1, rotateX: 12, rotateY: -16, rotateZ: 0, panX: 0, panY: 0 });
    } else if (preset === 'front') {
      setCamera({ zoom: 1.05, rotateX: 2, rotateY: -48, rotateZ: 0, panX: 10, panY: -5 });
    } else if (preset === 'top') {
      setCamera({ zoom: 1.1, rotateX: 52, rotateY: 0, rotateZ: 0, panX: 0, panY: 20 });
    }
  };

  const resetCamera = () => {
    setCamera({ zoom: 1, rotateX: 12, rotateY: -16, rotateZ: 0, panX: 0, panY: 0 });
  };

  return (
    <div className="flex flex-col h-full bg-card/40 select-none">
      {/* 1. ÜST PANEL BAŞLIĞI VE MOD SEÇİCİLER */}
      <div className="px-3.5 py-2.5 border-b flex flex-wrap items-center justify-between gap-2 text-xs bg-muted/20">
        <div className="flex items-center gap-1.5 font-bold text-foreground">
          <Building2 className="w-3.5 h-3.5 text-primary" />
          <span>{building.name || 'Bina Kulesi'}</span>
          <Badge variant="outline" className="text-[10px] font-semibold text-primary border-primary/30">
            {floorCount} Katlı Blok
          </Badge>
        </div>

        {/* 3D Kontrolleri (Cam Kabuk & Patlatılmış Görünüm) */}
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant={showEnvelope ? 'default' : 'outline'}
            className={cn(
              "h-6 px-2 text-[10px] gap-1 rounded-md transition-all shadow-2xs",
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
              "h-6 px-2 text-[10px] gap-1 rounded-md transition-all shadow-2xs",
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

      {/* 2. GÖVDE: 15 KAT ASANSÖR RAYI + 3D İZOMETRİK KULE SAHNESİ */}
      <div className="flex flex-1 min-h-[380px] overflow-hidden relative">
        {/* Sol Ray: 15 Kat Asansör Seçim Çubuğu (Elevator Rail) */}
        <div className="w-16 shrink-0 py-2 border-r border-border/50 bg-muted/15 flex flex-col items-center gap-1 overflow-y-auto max-h-[460px] custom-scrollbar z-10">
          <div className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
            Katlar
          </div>
          {sortedFloorsDescending.map((floor) => {
            const cleanName = formatFloorLabel(floor.name);
            const isSelected = selectedFloorId === floor.id || selectedFloorId === floor.name || selectedFloorId === cleanName;
            const isCritical = floor.hasCriticalFault || floor.status === 'critical';
            const isWarning = floor.status === 'warning';

            return (
              <button
                key={floor.id}
                type="button"
                onClick={() => onSelectFloor(floor)}
                className={cn(
                  "w-12 h-6 rounded-md text-[10px] font-bold flex items-center justify-between px-1.5 transition-all border",
                  isSelected
                    ? "bg-primary text-primary-foreground border-primary shadow-xs ring-1 ring-primary/40"
                    : isCritical
                      ? "bg-rose-500/10 text-rose-600 border-rose-300 dark:border-rose-900/50 hover:bg-rose-500/20"
                      : isWarning
                        ? "bg-amber-500/10 text-amber-600 border-amber-300 dark:border-amber-900/50 hover:bg-amber-500/20"
                        : "bg-background text-foreground hover:bg-muted border-border/60"
                )}
                title={`${cleanName} (${floor.riskCount || 0} Risk)`}
              >
                <span className="truncate">{cleanName.replace(/[^0-9A-Za-z-]/g, '').slice(0, 3) || floor.floorNumber}</span>
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full shrink-0",
                  isCritical ? "bg-rose-500 animate-ping" : isWarning ? "bg-amber-500" : isSelected ? "bg-primary-foreground" : "bg-slate-300 dark:bg-slate-600"
                )} />
              </button>
            );
          })}
        </div>

        {/* 3D İzometrik Kule Sahnesi (Pointer Drag + CSS 3D Perspective) */}
        <div
          className="relative flex-1 h-full min-h-[380px] flex items-center justify-center p-3 overflow-hidden cursor-grab active:cursor-grabbing select-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onWheel={handleWheel}
          onContextMenu={(e) => e.preventDefault()}
          style={{ touchAction: 'none' }}
        >
          {/* CSS 3D Perspektif Taşıyıcı Kutu */}
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              perspective: '1200px',
              perspectiveOrigin: '50% 50%',
            }}
          >
            <div
              style={{
                transformStyle: 'preserve-3d',
                transform: `translate3d(${camera.panX}px, ${camera.panY}px, 0px) scale(${camera.zoom}) rotateX(${camera.rotateX}deg) rotateY(${camera.rotateY}deg) rotateZ(${camera.rotateZ}deg)`,
                transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
                willChange: 'transform',
              }}
            >
              <svg
                ref={svgRef}
                viewBox={`0 0 420 ${Math.max(360, totalElevation + 160)}`}
                className="w-full max-w-[360px] h-auto drop-shadow-xl overflow-visible"
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

                {/* Sahne Öğeleri */}
                <g>
                  {/* Zemin Taban Plaketi / Podyum Temeli */}
                  <g id="tower-podium">
                    <polygon
                      points={`${originX - SLAB_WIDTH_HALF - 26},${baseOriginY + SLAB_HEIGHT_HALF + 28} ${originX},${baseOriginY + 2 * SLAB_HEIGHT_HALF + 28} ${originX + SLAB_WIDTH_HALF + 26},${baseOriginY + SLAB_HEIGHT_HALF + 28} ${originX},${baseOriginY}`}
                      className="fill-slate-100/90 dark:fill-slate-800/60 stroke-border/60"
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
                    {/* Peyzaj aksları */}
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

                      // Düşey koordinat
                      const elevation = index * floorSpacing;
                      const cx = originX;
                      const cy = baseOriginY - elevation;

                      // Kat odağı / cutaway
                      const opacity = hasSelection ? (isSelected ? 1 : 0.28) : 1;

                      // Renk paleti
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

                      // Slab noktaları
                      const topPoints = `${cx},${cy} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF}`;
                      const leftPoints = `${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx},${cy + 2 * SLAB_HEIGHT_HALF + SLAB_THICKNESS} ${cx - SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF + SLAB_THICKNESS}`;
                      const rightPoints = `${cx},${cy + 2 * SLAB_HEIGHT_HALF} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF} ${cx + SLAB_WIDTH_HALF},${cy + SLAB_HEIGHT_HALF + SLAB_THICKNESS} ${cx},${cy + 2 * SLAB_HEIGHT_HALF + SLAB_THICKNESS}`;

                      // Patlatılmış görünüm ötelemesi
                      const translateX = isSelected ? -18 : isHovered ? -8 : 0;
                      const translateY = isSelected ? -8 : isHovered ? -4 : 0;

                      return (
                        <g
                          key={floor.id}
                          className="cursor-pointer group interactive-floor"
                          onMouseEnter={() => setHoveredFloorId(floor.id)}
                          onMouseLeave={() => setHoveredFloorId(null)}
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectFloor(floor);
                          }}
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
                          <line
                            x1={cx - SLAB_WIDTH_HALF}
                            y1={cy + SLAB_HEIGHT_HALF}
                            x2={cx - SLAB_WIDTH_HALF}
                            y2={cy + SLAB_HEIGHT_HALF + SLAB_THICKNESS}
                            stroke={strokeColor}
                            strokeWidth="1.2"
                          />

                          {/* Sağ Yüzey */}
                          <polygon
                            points={rightPoints}
                            fill={rightFill}
                            stroke={strokeColor}
                            strokeWidth="1.2"
                            strokeLinejoin="round"
                          />

                          {/* Üst Yüzey (Floor Slab) */}
                          <polygon
                            points={topPoints}
                            fill={topFill}
                            stroke={strokeColor}
                            strokeWidth={isSelected ? "2" : "1.2"}
                            className="transition-colors duration-200"
                          />

                          {/* Kat Seçim Rozeti ve İsim Etiketi */}
                          <g transform={`translate(${cx + SLAB_WIDTH_HALF + 14}, ${cy + SLAB_HEIGHT_HALF + 4})`}>
                            <rect
                              x="0"
                              y="-11"
                              width={isSelected ? "86" : "68"}
                              height="20"
                              rx="5"
                              className={cn(
                                "transition-all duration-200",
                                isSelected
                                  ? "fill-primary stroke-primary/30"
                                  : isCritical
                                    ? "fill-rose-500 stroke-rose-600"
                                    : isWarning
                                      ? "fill-amber-500 stroke-amber-600"
                                      : "fill-slate-800/90 dark:fill-slate-900/95 stroke-border"
                              )}
                              strokeWidth="1"
                            />
                            <text
                              x="7"
                              y="3"
                              fill="#FFFFFF"
                              fontSize="10"
                              fontWeight={isSelected ? "bold" : "600"}
                              fontFamily="sans-serif"
                            >
                              {cleanName.length > 9 ? cleanName.slice(0, 8) + '…' : cleanName}
                            </text>
                            {floor.riskCount > 0 && (
                              <circle
                                cx={isSelected ? "76" : "59"}
                                cy="-1"
                                r="4"
                                className={isCritical ? "fill-rose-200 animate-ping" : "fill-amber-200"}
                              />
                            )}
                          </g>

                          {/* Kritik Arıza İkonu */}
                          {isCritical && (
                            <g transform={`translate(${cx - 10}, ${cy + SLAB_HEIGHT_HALF - 14})`}>
                              <circle cx="10" cy="10" r="11" fill="#E11D48" className="animate-ping origin-center" opacity="0.6" />
                              <circle cx="10" cy="10" r="9" fill="#BE123C" stroke="#FFFFFF" strokeWidth="1.5" />
                              <text x="10" y="13.5" fill="#FFFFFF" fontSize="10" fontWeight="bold" textAnchor="middle">!</text>
                            </g>
                          )}

                          {/* Çatı Korkuluğu / Parapet (Yalnızca en üst kat için) */}
                          {isTopFloor && (
                            <polygon
                              points={`${cx},${cy - 6} ${cx + SLAB_WIDTH_HALF - 4},${cy + SLAB_HEIGHT_HALF - 6} ${cx},${cy + 2 * SLAB_HEIGHT_HALF - 6} ${cx - SLAB_WIDTH_HALF + 4},${cy + SLAB_HEIGHT_HALF - 6}`}
                              fill="none"
                              stroke="#64748B"
                              strokeWidth="1"
                              strokeDasharray="3 3"
                            />
                          )}
                        </g>
                      );
                    })}
                  </g>

                  {/* ─── AŞAMA 3: PARAMETRİK CAM GİYDİRME KABUK (X-RAY FACADE) ─── */}
                  {showEnvelope && (
                    <g
                      id="glass-curtain-envelope"
                      className="pointer-events-none select-none transition-opacity duration-300"
                      style={{ opacity: isExploded ? 0.35 : 0.85 }}
                    >
                      {/* Sol Giydirme Cam Cephe */}
                      <polygon
                        points={`${originX - envWidthHalf},${topEnvelopeY + envHeightHalf} ${originX},${topEnvelopeY + 2 * envHeightHalf} ${originX},${bottomEnvelopeY + 2 * envHeightHalf} ${originX - envWidthHalf},${bottomEnvelopeY + envHeightHalf}`}
                        fill="url(#glass-curtain-left)"
                        stroke="#38bdf8"
                        strokeWidth="1.5"
                        strokeOpacity="0.65"
                      />

                      {/* Sağ Giydirme Cam Cephe */}
                      <polygon
                        points={`${originX},${topEnvelopeY + 2 * envHeightHalf} ${originX + envWidthHalf},${topEnvelopeY + envHeightHalf} ${originX + envWidthHalf},${bottomEnvelopeY + envHeightHalf} ${originX},${bottomEnvelopeY + 2 * envHeightHalf}`}
                        fill="url(#glass-curtain-right)"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeOpacity="0.75"
                      />

                      {/* Çatı Cam Fenerliği / Skylight Tavan */}
                      <polygon
                        points={`${originX},${topEnvelopeY} ${originX + envWidthHalf},${topEnvelopeY + envHeightHalf} ${originX},${topEnvelopeY + 2 * envHeightHalf} ${originX - envWidthHalf},${topEnvelopeY + envHeightHalf}`}
                        fill="url(#glass-curtain-roof)"
                        stroke="#bae6fd"
                        strokeWidth="1.5"
                        strokeOpacity="0.8"
                      />

                      {/* Mimari Profil Çizgileri (Facade Mullions) */}
                      {sortedFloorsAscending.map((floor, i) => {
                        const mElevation = i * floorSpacing;
                        const my = baseOriginY - mElevation + envHeightHalf;

                        return (
                          <g key={`mullion-${floor.id}`}>
                            <line
                              x1={originX - envWidthHalf}
                              y1={my}
                              x2={originX}
                              y2={my + envHeightHalf}
                              stroke="rgba(56, 189, 248, 0.45)"
                              strokeWidth="1"
                            />
                            <line
                              x1={originX}
                              y1={my + envHeightHalf}
                              x2={originX + envWidthHalf}
                              y2={my}
                              stroke="rgba(129, 140, 248, 0.4)"
                              strokeWidth="1"
                            />
                          </g>
                        );
                      })}
                    </g>
                  )}
                </g>
              </svg>
            </div>
          </div>

          {/* ─── YÜZEN 3D KAMERA YÖRÜNGE ARAÇ ÇUBUĞU (D-Pad & Zoom) ───────── */}
          <div className="absolute top-3 right-3 flex flex-col gap-1.5 bg-background/90 backdrop-blur-md p-1.5 rounded-xl border border-border/80 shadow-md z-20">
            {/* D-Pad Yörünge Butonları */}
            <div className="flex flex-col items-center gap-0.5">
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 text-xs hover:bg-muted"
                onClick={tiltUp}
                title="Yukarı Eğ (Tilt Up)"
              >
                <ArrowUp className="w-3.5 h-3.5 text-primary" />
              </Button>
              <div className="flex items-center gap-0.5">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 text-xs hover:bg-muted"
                  onClick={rotateLeft}
                  title="Sola Döndür (Orbit Left)"
                >
                  <ArrowLeft className="w-3.5 h-3.5 text-primary" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 text-xs hover:bg-muted"
                  onClick={resetCamera}
                  title="Kamerayı Sıfırla (Reset)"
                >
                  <RotateCcw className="w-3 h-3 text-muted-foreground" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 text-xs hover:bg-muted"
                  onClick={rotateRight}
                  title="Sağa Döndür (Orbit Right)"
                >
                  <ArrowRight className="w-3.5 h-3.5 text-primary" />
                </Button>
              </div>
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 text-xs hover:bg-muted"
                onClick={tiltDown}
                title="Aşağı Eğ (Tilt Down)"
              >
                <ArrowDown className="w-3.5 h-3.5 text-primary" />
              </Button>
            </div>

            <div className="h-px bg-border/60 my-0.5" />

            {/* Zoom Butonları */}
            <div className="flex items-center justify-between gap-1">
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 text-xs hover:bg-muted"
                onClick={zoomIn}
                title="Yakınlaş (Zoom In)"
              >
                <ZoomIn className="w-3.5 h-3.5 text-primary" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="w-6 h-6 text-xs hover:bg-muted"
                onClick={zoomOut}
                title="Uzaklaş (Zoom Out)"
              >
                <ZoomOut className="w-3.5 h-3.5 text-primary" />
              </Button>
            </div>
          </div>

          {/* Kamera Preset Butonları (Üst Sol) */}
          <div className="absolute top-3 left-3 flex items-center gap-1 bg-background/90 backdrop-blur-md p-1 rounded-lg border border-border/70 shadow-xs z-20">
            <button
              type="button"
              onClick={() => setCameraPreset('isometric')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all",
                camera.rotateX === 12 && camera.rotateY === -16 ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              3D İzometrik
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('front')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all",
                camera.rotateY === -48 ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Ön Cephe
            </button>
            <button
              type="button"
              onClick={() => setCameraPreset('top')}
              className={cn(
                "px-2 py-0.5 text-[10px] font-semibold rounded-md transition-all",
                camera.rotateX === 52 ? "bg-primary text-primary-foreground shadow-2xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              Kuşbakışı
            </button>
          </div>

          {/* Alt Bilgi & Kamera İpucu */}
          <div className="absolute bottom-2 left-3 right-3 flex items-center justify-between text-[11px] text-muted-foreground bg-card/90 backdrop-blur-xs px-3 py-1 rounded-lg border border-border/60 pointer-events-none z-20">
            <span className="flex items-center gap-1 truncate font-medium">
              <Compass className="w-3 h-3 text-primary shrink-0" />
              Sürükle: 3D Döndür • Tekerlek: Zoom • Shift+Sürükle: Kaydır
            </span>
            <span className="font-mono text-[10px] shrink-0 font-bold text-primary">
              %{Math.round(camera.zoom * 100)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
