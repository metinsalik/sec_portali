import React, { useState } from 'react';
import type { IsometricRoom, TelemetryData, RiskDistribution } from './types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { toast } from 'sonner';
import { 
  X, Zap, Activity, Thermometer, Gauge, Clock, 
  AlertTriangle, CheckCircle2, RotateCcw, Wrench, 
  ExternalLink, ShieldAlert, Sparkles, Plus, Layers,
  ChevronRight, ArrowRight, ShieldCheck, FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface RoomDetailSheetProps {
  room: IsometricRoom | null;
  isOpen: boolean;
  onClose: () => void;
  onSimulateResolveFault?: (roomId: string) => void;
  onViewLocationRisks?: (room: IsometricRoom) => void;
}

export const RoomDetailSheet: React.FC<RoomDetailSheetProps> = ({
  room,
  isOpen,
  onClose,
  onSimulateResolveFault,
  onViewLocationRisks,
}) => {
  if (!isOpen || !room) return null;

  const [simulatedTelemetry, setSimulatedTelemetry] = useState<TelemetryData | null>(
    room.telemetry || null
  );
  const [isResolved, setIsResolved] = useState(room.status === 'normal');

  const telemetry = simulatedTelemetry || room.telemetry;

  // Compute live risk distribution for this room
  const initialDist: RiskDistribution = room.riskDistribution || {
    tolereGosterilmez: room.status === 'critical' ? 1 : 0,
    yuksek: room.status === 'critical' ? 2 : (room.status === 'warning' ? 1 : 0),
    onemli: room.status === 'warning' ? 1 : 0,
    olasi: 0,
    onemsiz: room.status === 'normal' ? 2 : 0,
  };

  const currentDist: RiskDistribution = isResolved ? {
    tolereGosterilmez: 0,
    yuksek: 0,
    onemli: 0,
    olasi: 1,
    onemsiz: 3,
  } : initialDist;

  const safetyScore = isResolved ? 95 : (room.safetyScore || (room.status === 'critical' ? 38 : 78));

  const handleResolve = () => {
    if (!telemetry) return;
    
    setSimulatedTelemetry({
      ...telemetry,
      voltageL1: 230,
      voltageL2: 231,
      voltageL3: 229,
      temperature: 38.5,
      loadPercentage: 58,
      currentAmps: 180,
      activeAlarm: undefined,
      isSimulatedResolved: true,
    });
    setIsResolved(true);
    toast.success('Pano arızası giderildi, fazlar dengelendi ve sıcaklık nominale döndü!');
    if (onSimulateResolveFault) {
      onSimulateResolveFault(room.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-black/40 backdrop-blur-xs flex justify-end animate-in fade-in-0 duration-200">
      <div 
        className="w-full max-w-lg bg-card border-l border-border h-full shadow-2xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ─── 1. ÜST BAŞLIK BÖLÜMÜ ─────────────────────────────────────── */}
        <div>
          <div className="p-5 border-b bg-muted/20 flex items-start justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-primary/10 text-primary">
                  <Zap className="w-4 h-4" />
                </span>
                <span className="font-mono text-xs font-bold text-muted-foreground">
                  {room.code || 'MAHAL'}
                </span>
                <Badge 
                  variant={isResolved ? "outline" : room.status === 'critical' ? "destructive" : "secondary"}
                  className="text-[10px] font-bold"
                >
                  {isResolved ? "Normal" : room.status === 'critical' ? "Kritik Arıza" : "Uyarı"}
                </Badge>
              </div>
              <h2 className="text-lg font-bold text-foreground tracking-tight">
                {room.name}
              </h2>
              {room.description && (
                <p className="text-xs text-muted-foreground leading-relaxed">
                  {room.description}
                </p>
              )}
            </div>

            <Button 
              variant="ghost" 
              size="icon" 
              onClick={onClose} 
              className="h-8 w-8 text-muted-foreground hover:text-foreground shrink-0 rounded-lg"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* ─── 2. GÖVDE VE İSTATİSTİKLER ───────────────────────────────── */}
          <div className="p-5 space-y-6">
            {/* GENEL SAĞLIK & İSG UYUMLULUK SKORU */}
            <div className="p-4 rounded-2xl bg-card border border-border/80 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Gauge className="w-3.5 h-3.5 text-primary" /> Genel Mahal Sağlık Durumu
                </span>
                <span className={cn(
                  "font-mono text-sm font-black",
                  safetyScore < 60 ? "text-rose-600" : safetyScore < 80 ? "text-amber-600" : "text-emerald-600"
                )}>
                  %{safetyScore} / 100
                </span>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-muted/60 h-2.5 rounded-full overflow-hidden p-0.5">
                <div 
                  className={cn(
                    "h-full rounded-full transition-all duration-500",
                    safetyScore < 60 ? "bg-rose-600" : safetyScore < 80 ? "bg-amber-500" : "bg-emerald-500"
                  )}
                  style={{ width: `${safetyScore}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                <span>{safetyScore < 60 ? '🚨 Acil Müdahale Gerekli' : safetyScore < 80 ? '⚠️ Takip Gerektiren Durum' : '✓ Nominal ve Güvenli'}</span>
                <span>Son Denetim: Bugün</span>
              </div>
            </div>

            {/* 5 KADEMELİ İSG RİSK SEVİYESİ DAĞILIMI */}
            <div className="space-y-2.5">
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-primary" /> Risk Seviyeleri Dağılımı
              </span>

              <div className="grid grid-cols-5 gap-2 text-center">
                {/* Tolere Gösterilmez */}
                <div className={cn(
                  "p-2 rounded-xl border flex flex-col items-center justify-center transition-all",
                  currentDist.tolereGosterilmez > 0 
                    ? "bg-red-950/20 text-red-700 dark:text-red-300 border-red-500/40 animate-pulse" 
                    : "bg-muted/20 text-muted-foreground border-border/40"
                )}>
                  <span className="text-[9px] font-bold uppercase line-clamp-1">Tolere Ed.</span>
                  <span className="text-lg font-black font-mono mt-0.5">{currentDist.tolereGosterilmez}</span>
                  <span className="text-[8px] opacity-75">Kritik</span>
                </div>

                {/* Yüksek */}
                <div className={cn(
                  "p-2 rounded-xl border flex flex-col items-center justify-center transition-all",
                  currentDist.yuksek > 0 
                    ? "bg-rose-500/10 text-rose-700 dark:text-rose-300 border-rose-500/40" 
                    : "bg-muted/20 text-muted-foreground border-border/40"
                )}>
                  <span className="text-[9px] font-bold uppercase">Yüksek</span>
                  <span className="text-lg font-black font-mono mt-0.5">{currentDist.yuksek}</span>
                  <span className="text-[8px] opacity-75">1. Öncelik</span>
                </div>

                {/* Önemli */}
                <div className={cn(
                  "p-2 rounded-xl border flex flex-col items-center justify-center transition-all",
                  currentDist.onemli > 0 
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/40" 
                    : "bg-muted/20 text-muted-foreground border-border/40"
                )}>
                  <span className="text-[9px] font-bold uppercase">Önemli</span>
                  <span className="text-lg font-black font-mono mt-0.5">{currentDist.onemli}</span>
                  <span className="text-[8px] opacity-75">Takip</span>
                </div>

                {/* Olası */}
                <div className="p-2 rounded-xl border border-border/40 bg-muted/20 text-muted-foreground flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold uppercase">Olası</span>
                  <span className="text-lg font-black font-mono mt-0.5">{currentDist.olasi}</span>
                  <span className="text-[8px] opacity-75">İzleme</span>
                </div>

                {/* Önemsiz */}
                <div className="p-2 rounded-xl border border-border/40 bg-muted/20 text-muted-foreground flex flex-col items-center justify-center">
                  <span className="text-[9px] font-bold uppercase">Önemsiz</span>
                  <span className="text-lg font-black font-mono mt-0.5">{currentDist.onemsiz}</span>
                  <span className="text-[8px] opacity-75">Güvenli</span>
                </div>
              </div>
            </div>

            {/* AKTİF TEHLİKE LİSTESİ */}
            {room.activeHazards && room.activeHazards.length > 0 && !isResolved && (
              <div className="space-y-2">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-primary" /> Kayıtlı Risk ve Tehlikeler ({room.activeHazards.length})
                </span>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {room.activeHazards.map((hz) => (
                    <div 
                      key={hz.id} 
                      className="p-3 bg-muted/20 rounded-xl border border-border/60 text-xs space-y-1.5"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground">{hz.riskNo}</span>
                        <Badge variant="destructive" className="text-[9px] px-1.5 py-0 h-4">
                          {hz.level}
                        </Badge>
                      </div>
                      <p className="font-semibold text-foreground leading-snug">
                        {hz.hazard}
                      </p>
                      {hz.action && (
                        <p className="text-[11px] text-muted-foreground italic">
                          ↳ Eylem: {hz.action}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AKTİF ARIZA UYARISI & SİMÜLASYON BUTONU */}
            {telemetry?.activeAlarm && !isResolved && (
              <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/25 text-rose-700 dark:text-rose-400 space-y-3 animate-in slide-in-from-top-1">
                <div className="flex items-center gap-2 font-bold text-xs">
                  <AlertTriangle className="w-4 h-4 text-rose-600 animate-pulse" />
                  <span>Aktif Sensör & Telemetri Alarmı</span>
                </div>
                <p className="text-xs leading-relaxed font-medium">
                  {telemetry.activeAlarm}
                </p>
                <div className="pt-2 border-t border-rose-500/20 flex justify-end">
                  <Button
                    size="sm"
                    onClick={handleResolve}
                    className="h-8 text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white gap-1.5 shadow-sm"
                  >
                    <Wrench className="w-3.5 h-3.5" />
                    Arızayı Gider / Yükü Dengele (Simülasyon)
                  </Button>
                </div>
              </div>
            )}

            {isResolved && (
              <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-700 dark:text-emerald-400 flex items-center gap-2.5 text-xs font-semibold animate-in fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Simülasyon tamamlandı: Fazlar dengelendi, sıcaklık 38.5°C'ye düşürüldü ve risk seviyeleri normale çekildi.</span>
              </div>
            )}

            {/* IOT TELEMETRİ VE SENSÖRLER */}
            {telemetry && (
              <div className="space-y-3">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Activity className="w-3.5 h-3.5 text-primary" /> Canlı IoT Sensörleri
                </span>

                <div className="grid grid-cols-2 gap-3">
                  {/* Bara Sıcaklığı */}
                  <Card className={cn(
                    "border-border/60 shadow-2xs transition-colors",
                    telemetry.temperature > 65 && !isResolved && "border-rose-500/40 bg-rose-500/5"
                  )}>
                    <CardContent className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                        <span>Bara Sıcaklığı</span>
                        <Thermometer className={cn("w-3.5 h-3.5", telemetry.temperature > 65 && !isResolved ? "text-rose-600 animate-pulse" : "text-emerald-600")} />
                      </div>
                      <p className={cn(
                        "text-xl font-black font-mono tracking-tight",
                        telemetry.temperature > 65 && !isResolved ? "text-rose-600" : "text-foreground"
                      )}>
                        {telemetry.temperature.toFixed(1)} °C
                      </p>
                      <p className="text-[10px] text-muted-foreground">Normal Eşik: &lt;60°C</p>
                    </CardContent>
                  </Card>

                  {/* Yük Oranı */}
                  <Card className={cn(
                    "border-border/60 shadow-2xs transition-colors",
                    telemetry.loadPercentage > 100 && !isResolved && "border-amber-500/40 bg-amber-500/5"
                  )}>
                    <CardContent className="p-3.5 space-y-1">
                      <div className="flex items-center justify-between text-muted-foreground text-[11px] font-medium">
                        <span>Yük Oranı</span>
                        <Gauge className={cn("w-3.5 h-3.5", telemetry.loadPercentage > 100 && !isResolved ? "text-amber-600" : "text-primary")} />
                      </div>
                      <p className={cn(
                        "text-xl font-black font-mono tracking-tight",
                        telemetry.loadPercentage > 100 && !isResolved ? "text-amber-600" : "text-foreground"
                      )}>
                        %{telemetry.loadPercentage}
                      </p>
                      <p className="text-[10px] text-muted-foreground">Akım: {telemetry.currentAmps} A</p>
                    </CardContent>
                  </Card>
                </div>

                {/* 3 Faz Voltaj Dağılımı */}
                <div className="p-3.5 bg-muted/20 rounded-xl border border-border/50 space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span>3 Faz Voltaj Dağılımı (RMS)</span>
                    <span className="font-mono text-[10px]">Nominal: 230V</span>
                  </div>
                  <div className="grid grid-cols-3 gap-2 text-center">
                    <div className="bg-card p-2 rounded-lg border border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Faz L1</span>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">{telemetry.voltageL1}V</p>
                    </div>
                    <div className="bg-card p-2 rounded-lg border border-border/60">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">Faz L2</span>
                      <p className="text-sm font-bold font-mono text-foreground mt-0.5">{telemetry.voltageL2}V</p>
                    </div>
                    <div className={cn(
                      "p-2 rounded-lg border",
                      telemetry.voltageL3 < 200 && !isResolved 
                        ? "bg-rose-500/10 border-rose-500/40 text-rose-600" 
                        : "bg-card border-border/60 text-foreground"
                    )}>
                      <span className="text-[10px] font-bold uppercase">Faz L3</span>
                      <p className="text-sm font-bold font-mono mt-0.5">{telemetry.voltageL3}V</p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* ─── 3. ALT AKSİYON ÇUBUĞU ──────────────────────────────────── */}
        <div className="p-4 border-t bg-card/80 backdrop-blur-xs flex items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            className="text-xs"
          >
            Kapat
          </Button>

          <Button
            size="sm"
            onClick={() => {
              if (onViewLocationRisks) {
                onViewLocationRisks(room);
              }
              onClose();
            }}
            className="text-xs font-bold gap-1.5 bg-primary text-primary-foreground shadow-xs"
          >
            <Layers className="w-3.5 h-3.5" />
            Bu Mahal Risklerini İncele
          </Button>
        </div>
      </div>
    </div>
  );
};
