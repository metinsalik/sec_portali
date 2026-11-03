import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { QuickAssignModal } from '@/components/panel/assignments/QuickAssignModal';
import { 
  Users, 
  ShieldCheck, 
  Stethoscope, 
  HeartPulse, 
  UserCheck, 
  Plus, 
  ExternalLink, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  Calendar, 
  Phone, 
  Mail, 
  Building, 
  RefreshCw, 
  Loader2, 
  Info,
  Sparkles,
  Award
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';

interface TeamStepProps {
  data: any;
  update: (data: any) => void;
}

export default function TeamStep({ data, update }: TeamStepProps) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<"IGU" | "Hekim" | "DSP" | "Vekil">("IGU");

  const facilityId = data.id;
  const isExistingFacility = !!facilityId && !facilityId.startsWith('TEMP-');

  // Fetch active assignments from ISG Atamaları module
  const { 
    data: activeAssignments = [], 
    isLoading: isLoadingAssignments,
    refetch: refetchAssignments 
  } = useQuery<any[]>({
    queryKey: ['facility-assignments-step', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/panel/assignments?facilityId=${encodeURIComponent(facilityId)}&status=Aktif`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isExistingFacility
  });

  // Fetch compliance status from ISG Atamaları module
  const { data: complianceList = [] } = useQuery<any[]>({
    queryKey: ['assignments-status'],
    queryFn: async () => {
      const res = await api.get('/panel/assignments/compliance-status');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isExistingFacility
  });

  const facilityCompliance = complianceList.find((c: any) => c.facilityId === facilityId);

  // Requirements calculation based on danger class and employee count
  const count = Number(data.employeeCount) || 0;
  const dangerClass = data.dangerClass || 'Az Tehlikeli';

  let iguMinPerPerson = 10;
  let hekimMinPerPerson = 5;
  let dspMinPerPerson = 0;

  if (dangerClass === 'Çok Tehlikeli') {
    iguMinPerPerson = 40;
    hekimMinPerPerson = 15;
    if (count >= 10) {
      if (count <= 49) dspMinPerPerson = 10;
      else if (count <= 249) dspMinPerPerson = 15;
      else dspMinPerPerson = 20;
    }
  } else if (dangerClass === 'Tehlikeli') {
    iguMinPerPerson = 20;
    hekimMinPerPerson = 10;
    dspMinPerPerson = 0;
  } else {
    // Az Tehlikeli
    iguMinPerPerson = 10;
    hekimMinPerPerson = 5;
    dspMinPerPerson = 0;
  }

  const reqIguMin = facilityCompliance?.igu?.requiredMin ?? (count * iguMinPerPerson);
  const reqHekimMin = facilityCompliance?.hekim?.requiredMin ?? (count * hekimMinPerPerson);
  const reqDspMin = facilityCompliance?.dsp?.requiredMin ?? (count * dspMinPerPerson);
  const isDspRequired = facilityCompliance?.dsp?.required ?? (dspMinPerPerson > 0);

  // Filter active assignments by role
  const iguList = activeAssignments.filter((a: any) => a.type === 'IGU');
  const hekimList = activeAssignments.filter((a: any) => a.type === 'Hekim');
  const dspList = activeAssignments.filter((a: any) => a.type === 'DSP');
  const vekilList = activeAssignments.filter((a: any) => a.type === 'Vekil');

  // Assigned minutes sum
  const assignedIguMin = iguList.reduce((sum: number, a: any) => sum + (Number(a.durationMinutes) || 0), 0);
  const assignedHekimMin = hekimList.reduce((sum: number, a: any) => sum + (Number(a.durationMinutes) || 0), 0);
  const assignedDspMin = dspList.reduce((sum: number, a: any) => sum + (Number(a.durationMinutes) || 0), 0);

  // DSP Waiver: Full-time doctor (>= 11700 min) waives DSP
  const isDspWaived = assignedHekimMin >= 11700 || hekimList.some((a: any) => a.isFullTime);

  // Compliance checks
  const isIguMet = assignedIguMin >= reqIguMin;
  const isHekimMet = assignedHekimMin >= reqHekimMin;
  const isDspMet = isDspWaived || !isDspRequired || assignedDspMin >= reqDspMin;
  const isOverallMet = facilityCompliance?.overallCompliant ?? (isIguMet && isHekimMet && isDspMet);

  const formatHours = (min: number) => (min / 60).toFixed(1);

  const handleOpenAssign = (type: "IGU" | "Hekim" | "DSP" | "Vekil") => {
    setAssignType(type);
    setAssignModalOpen(true);
  };

  const handleAssignSuccess = () => {
    refetchAssignments();
    queryClient.invalidateQueries({ queryKey: ['assignments-status'] });
    queryClient.invalidateQueries({ queryKey: ['facility-assignments-step', facilityId] });
    queryClient.invalidateQueries({ queryKey: ['facility', facilityId] });
    queryClient.invalidateQueries({ queryKey: ['facilities'] });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Step Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            4. Uzman Ekip Atamaları
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            İSG Atamaları modülü ile tam entegre; mevzuat gereksinimleri, aktif atanan uzmanlar ve çalışma süreleri.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isExistingFacility && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => refetchAssignments()}
              className="h-8 text-xs font-medium rounded-md gap-1.5 border-border/60"
              title="Atamaları Yenile"
            >
              <RefreshCw className={cn("w-3.5 h-3.5", isLoadingAssignments && "animate-spin")} />
              Yenile
            </Button>
          )}

          <Button
            type="button"
            variant="default"
            size="sm"
            onClick={() => navigate('/panel/assignments')}
            className="h-8 text-xs font-medium rounded-md gap-1.5 shadow-2xs"
          >
            İSG Atama Paneli <ExternalLink className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      {/* Sync Info Banner */}
      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-primary/20 bg-primary/5 text-xs text-foreground">
        <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-primary">
            İSG Atamaları Modülü Entegrasyonu
          </p>
          <p className="text-muted-foreground leading-relaxed">
            Bu ekrandaki uzman, hekim ve vekil atamaları doğrudan ana <strong className="text-foreground">Operasyon & İSG Atamaları Paneli</strong>'nden çekilmektedir.
            Buradan doğrudan hızlı atama yapabilir veya yapılan atamaların mevzuat uyum durumunu kontrol edebilirsiniz.
          </p>
        </div>
      </div>

      {/* Non-existing facility warning */}
      {!isExistingFacility && (
        <div className="p-4 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2.5">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <div>
            <span className="font-bold">Henüz kaydedilmemiş yeni tesis:</span> Tesis kurulumunu tamamlayıp kaydettikten sonra bu ekrandan veya İSG Atama Paneli'nden uzman personellerinizi atayabilirsiniz.
            Aşağıda belirlediğiniz çalışan sayısı ({count} kişi) ve tehlike sınıfına ({dangerClass}) göre mevzuatın zorunlu kıldığı süreler listelenmiştir.
          </div>
        </div>
      )}

      {/* Overview Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Card 1: Mevzuat Uyumu */}
        <div className="p-3.5 rounded-lg border border-border/60 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Mevzuat Uyumu</span>
            {isOverallMet ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-500" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <Badge 
              variant="outline" 
              className={cn(
                "text-xs font-bold px-2 py-0.5 rounded-md",
                isOverallMet 
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                  : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
              )}
            >
              {isOverallMet ? 'Tüm Atamalar Uygun' : 'Eksik Süre / Atama Var'}
            </Badge>
          </div>
          <p className="text-[10px] text-muted-foreground">
            {dangerClass} • {count} Çalışan
          </p>
        </div>

        {/* Card 2: İGU Süresi */}
        <div className="p-3.5 rounded-lg border border-border/60 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">İGU Süresi</span>
            <ShieldCheck className="w-4 h-4 text-blue-500" />
          </div>
          <div className="text-base font-bold text-foreground">
            {formatHours(assignedIguMin)} <span className="text-xs font-normal text-muted-foreground">/ {formatHours(reqIguMin)} Saat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all", isIguMet ? "bg-emerald-500" : "bg-amber-500")}
                style={{ width: `${Math.min(100, reqIguMin > 0 ? (assignedIguMin / reqIguMin) * 100 : 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
              {iguList.length} Uzman
            </span>
          </div>
        </div>

        {/* Card 3: Hekim Süresi */}
        <div className="p-3.5 rounded-lg border border-border/60 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">Hekim Süresi</span>
            <Stethoscope className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-base font-bold text-foreground">
            {formatHours(assignedHekimMin)} <span className="text-xs font-normal text-muted-foreground">/ {formatHours(reqHekimMin)} Saat</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className={cn("h-full transition-all", isHekimMet ? "bg-emerald-500" : "bg-amber-500")}
                style={{ width: `${Math.min(100, reqHekimMin > 0 ? (assignedHekimMin / reqHekimMin) * 100 : 100)}%` }}
              />
            </div>
            <span className="text-[10px] font-semibold text-muted-foreground whitespace-nowrap">
              {hekimList.length} Hekim
            </span>
          </div>
        </div>

        {/* Card 4: DSP Durumu */}
        <div className="p-3.5 rounded-lg border border-border/60 bg-card shadow-2xs space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">DSP Durumu</span>
            <HeartPulse className="w-4 h-4 text-pink-500" />
          </div>
          <div className="text-sm font-bold text-foreground">
            {isDspWaived ? (
              <span className="text-blue-600 dark:text-blue-400">Muaf (Tam Zamanlı Hekim)</span>
            ) : !isDspRequired ? (
              <span className="text-muted-foreground">Zorunlu Değil</span>
            ) : (
              <span>{formatHours(assignedDspMin)} / {formatHours(reqDspMin)} Saat</span>
            )}
          </div>
          <p className="text-[10px] text-muted-foreground">
            {dspList.length > 0 ? `${dspList.length} Sağlık Personeli` : 'Atama yok'}
          </p>
        </div>
      </div>

      {/* Role Details Sections */}
      <div className="space-y-4">
        {/* 1. İş Güvenliği Uzmanı (İGU) */}
        <div className="border border-border/60 rounded-lg bg-card overflow-hidden shadow-2xs">
          <div className="p-4 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">İş Güvenliği Uzmanı (İGU)</h3>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-semibold",
                    isIguMet 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  )}>
                    {isIguMet ? 'Mevzuata Uygun' : `Eksik: ${formatHours(Math.max(0, reqIguMin - assignedIguMin))} Saat`}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Yasal Kriter: Çalışan başı {iguMinPerPerson} dk/ay • Toplam Zorunlu: {formatHours(reqIguMin)} saat ({reqIguMin} dk)
                </p>
              </div>
            </div>

            {isExistingFacility && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenAssign("IGU")}
                className="h-8 text-xs font-medium rounded-md gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Hızlı İGU Ata
              </Button>
            )}
          </div>

          <div className="p-4">
            {iguList.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border/60 rounded-md bg-muted/5">
                <ShieldCheck className="w-7 h-7 text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">Bu tesise atanmış aktif İş Güvenliği Uzmanı bulunmuyor.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Mevzuat gereği en az {formatHours(reqIguMin)} saatlik İGU ataması yapılması gerekmektedir.
                </p>
                {isExistingFacility && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAssign("IGU")}
                    className="mt-3 text-xs font-medium h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Uzman Ata
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {iguList.map((as: any) => {
                  const prof = as.professional || {};
                  return (
                    <div 
                      key={as.id} 
                      className="border border-border/60 rounded-lg p-3 bg-muted/10 hover:bg-muted/20 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {prof.fullName || 'İsimsiz Uzman'}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20 font-bold">
                            {prof.titleClass || 'İGU'}
                          </Badge>
                          {as.isFullTime && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 border-emerald-500/20 font-semibold">
                              Tam Zamanlı
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-primary" />
                            <strong>{as.durationMinutes} dk/ay</strong> ({formatHours(as.durationMinutes)} Saat)
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {prof.employmentType === 'OSGB' ? (prof.osgbName || 'OSGB') : 'Bordrolu / Bireysel'}
                          </span>
                          {as.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(as.startDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>

                        {(prof.phone || prof.email) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-0.5">
                            {prof.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {prof.phone}
                              </span>
                            )}
                            {prof.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5" /> {prof.email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                        Aktif
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 2. İşyeri Hekimi */}
        <div className="border border-border/60 rounded-lg bg-card overflow-hidden shadow-2xs">
          <div className="p-4 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <Stethoscope className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">İşyeri Hekimi</h3>
                  <Badge variant="outline" className={cn(
                    "text-[10px] font-semibold",
                    isHekimMet 
                      ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30" 
                      : "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/30"
                  )}>
                    {isHekimMet ? 'Mevzuata Uygun' : `Eksik: ${formatHours(Math.max(0, reqHekimMin - assignedHekimMin))} Saat`}
                  </Badge>
                </div>
                <p className="text-[11px] text-muted-foreground">
                  Yasal Kriter: Çalışan başı {hekimMinPerPerson} dk/ay • Toplam Zorunlu: {formatHours(reqHekimMin)} saat ({reqHekimMin} dk)
                </p>
              </div>
            </div>

            {isExistingFacility && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenAssign("Hekim")}
                className="h-8 text-xs font-medium rounded-md gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Hızlı Hekim Ata
              </Button>
            )}
          </div>

          <div className="p-4">
            {hekimList.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-border/60 rounded-md bg-muted/5">
                <Stethoscope className="w-7 h-7 text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">Bu tesise atanmış aktif İşyeri Hekimi bulunmuyor.</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Mevzuat gereği en az {formatHours(reqHekimMin)} saatlik hekim ataması yapılması gerekmektedir.
                </p>
                {isExistingFacility && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAssign("Hekim")}
                    className="mt-3 text-xs font-medium h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Hekim Ata
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {hekimList.map((as: any) => {
                  const prof = as.professional || {};
                  return (
                    <div 
                      key={as.id} 
                      className="border border-border/60 rounded-lg p-3 bg-muted/10 hover:bg-muted/20 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {prof.fullName || 'İsimsiz Hekim'}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 font-bold">
                            İşyeri Hekimi
                          </Badge>
                          {as.isFullTime && (
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-blue-500/10 text-blue-600 border-blue-500/20 font-semibold">
                              Tam Zamanlı
                            </Badge>
                          )}
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-emerald-600" />
                            <strong>{as.durationMinutes} dk/ay</strong> ({formatHours(as.durationMinutes)} Saat)
                          </span>
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" />
                            {prof.employmentType === 'OSGB' ? (prof.osgbName || 'OSGB') : 'Bordrolu / Bireysel'}
                          </span>
                          {as.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(as.startDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>

                        {(prof.phone || prof.email) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-0.5">
                            {prof.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="w-2.5 h-2.5" /> {prof.phone}
                              </span>
                            )}
                            {prof.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="w-2.5 h-2.5" /> {prof.email}
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                        Aktif
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 3. Diğer Sağlık Personeli (DSP) */}
        <div className="border border-border/60 rounded-lg bg-card overflow-hidden shadow-2xs">
          <div className="p-4 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-pink-500/10 text-pink-600 dark:text-pink-400 flex items-center justify-center shrink-0">
                <HeartPulse className="w-4 h-4" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-sm font-bold text-foreground">Diğer Sağlık Personeli (DSP)</h3>
                  {isDspWaived ? (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-blue-500/10 text-blue-600 border-blue-500/30">
                      Muaf (Tam Zamanlı Hekim)
                    </Badge>
                  ) : !isDspRequired ? (
                    <Badge variant="outline" className="text-[10px] font-semibold bg-muted text-muted-foreground border-border/60">
                      Zorunlu Değil
                    </Badge>
                  ) : (
                    <Badge variant="outline" className={cn(
                      "text-[10px] font-semibold",
                      isDspMet 
                        ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/30" 
                        : "bg-rose-500/10 text-rose-600 border-rose-500/30"
                    )}>
                      {isDspMet ? 'Mevzuata Uygun' : `Eksik: ${formatHours(Math.max(0, reqDspMin - assignedDspMin))} Saat`}
                    </Badge>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground">
                  {isDspWaived 
                    ? 'Tam zamanlı işyeri hekimi istihdam edildiğinden DSP bulundurma şartı aranmamaktadır.' 
                    : !isDspRequired 
                    ? 'Az Tehlikeli ve Tehlikeli sınıflarda DSP zorunluluğu bulunmamaktadır.' 
                    : `Çok Tehlikeli sınıfta ${count} çalışan için zorunlu süre: ${formatHours(reqDspMin)} saat (${reqDspMin} dk)`}
                </p>
              </div>
            </div>

            {isExistingFacility && isDspRequired && !isDspWaived && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenAssign("DSP")}
                className="h-8 text-xs font-medium rounded-md gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Hızlı DSP Ata
              </Button>
            )}
          </div>

          <div className="p-4">
            {dspList.length === 0 ? (
              <div className="text-center py-4 border border-dashed border-border/60 rounded-md bg-muted/5 text-xs text-muted-foreground">
                {isDspWaived 
                  ? 'Tam zamanlı hekim mevcut olduğundan DSP ataması gerekmemektedir.' 
                  : !isDspRequired 
                  ? 'Bu tehlike sınıfında DSP zorunluluğu yoktur.' 
                  : 'Aktif DSP ataması bulunmuyor.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {dspList.map((as: any) => {
                  const prof = as.professional || {};
                  return (
                    <div 
                      key={as.id} 
                      className="border border-border/60 rounded-lg p-3 bg-muted/10 hover:bg-muted/20 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {prof.fullName || 'İsimsiz DSP'}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-pink-500/10 text-pink-600 border-pink-500/20 font-bold">
                            DSP
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-pink-600" />
                            <strong>{as.durationMinutes} dk/ay</strong> ({formatHours(as.durationMinutes)} Saat)
                          </span>
                          {as.startDate && (
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(as.startDate).toLocaleDateString('tr-TR')}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                        Aktif
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* 4. İşveren / İşveren Vekili */}
        <div className="border border-border/60 rounded-lg bg-card overflow-hidden shadow-2xs">
          <div className="p-4 bg-muted/30 border-b border-border/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0">
                <UserCheck className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">İşveren / İşveren Vekili</h3>
                <p className="text-[11px] text-muted-foreground">
                  İSG süreçlerinde yasal işveren adına yetkili atanmış temsilciler.
                </p>
              </div>
            </div>

            {isExistingFacility && (
              <Button
                type="button"
                size="sm"
                onClick={() => handleOpenAssign("Vekil")}
                className="h-8 text-xs font-medium rounded-md gap-1.5 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" /> Hızlı Vekil Ata
              </Button>
            )}
          </div>

          <div className="p-4">
            {vekilList.length === 0 ? (
              <div className="text-center py-5 border border-dashed border-border/60 rounded-md bg-muted/5">
                <UserCheck className="w-7 h-7 text-muted-foreground/30 mx-auto mb-1.5" />
                <p className="text-xs font-medium text-foreground">Kayıtlı İşveren Vekili bulunmuyor.</p>
                {isExistingFacility && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleOpenAssign("Vekil")}
                    className="mt-2 text-xs font-medium h-7"
                  >
                    <Plus className="w-3 h-3 mr-1" /> Vekil Ata
                  </Button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {vekilList.map((as: any) => {
                  const rep = as.employerRep || {};
                  return (
                    <div 
                      key={as.id} 
                      className="border border-border/60 rounded-lg p-3 bg-muted/10 hover:bg-muted/20 transition-colors flex items-start justify-between gap-3"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-foreground">
                            {rep.fullName || 'İsimsiz Temsilci'}
                          </span>
                          <Badge variant="outline" className="text-[9px] px-1.5 py-0 bg-purple-500/10 text-purple-600 border-purple-500/20 font-bold">
                            {rep.title || 'İşveren Vekili'}
                          </Badge>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-muted-foreground pt-0.5">
                          {rep.phone && (
                            <span className="flex items-center gap-1">
                              <Phone className="w-2.5 h-2.5" /> {rep.phone}
                            </span>
                          )}
                          {rep.email && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-2.5 h-2.5" /> {rep.email}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 border-emerald-500/30 shrink-0">
                        Aktif
                      </Badge>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Assign Modal */}
      {isExistingFacility && (
        <QuickAssignModal
          open={assignModalOpen}
          onOpenChange={setAssignModalOpen}
          facility={data}
          type={assignType}
          onSuccess={handleAssignSuccess}
        />
      )}
    </div>
  );
}
