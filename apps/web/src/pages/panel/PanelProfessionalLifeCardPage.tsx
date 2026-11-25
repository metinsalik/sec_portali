import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  ChevronLeft, Shield, Activity, Phone, Mail,
  Calendar, User, Briefcase, Building2,
  Clock, CheckCircle2, History, Award,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Professional {
  id: number;
  fullName: string;
  employmentType: string;
  osgbName?: string;
  titleClass: string;
  certificateNo?: string;
  certificateDate?: string;
  phone?: string;
  email?: string;
  isActive: boolean;
  certificateStatus: {
    isExpired: boolean;
    isWarning: boolean;
    isCritical: boolean;
    daysLeft: number | null;
  };
  assignments: any[];
  activityLogs: any[];
}

const PanelProfessionalLifeCardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: prof, isLoading } = useQuery<Professional>({
    queryKey: ['professional-detail', id],
    queryFn: async () => {
      const res = await api.get(`/panel/professionals/${id}`);
      if (!res.ok) throw new Error('Profesyonel yüklenemedi');
      return res.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-1 h-64 bg-muted rounded-lg" />
          <div className="md:col-span-2 h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!prof) {
    return (
      <div className="py-12 text-center text-sm text-muted-foreground">
        Profesyonel bulunamadı.
      </div>
    );
  }

  const activeAssignments = prof.assignments.filter(a => a.status === 'Aktif');

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-card text-card-foreground p-4 rounded-lg shadow-xs border border-border gap-4">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate('/panel/professionals')}
            className="w-8 h-8 rounded-lg hover:bg-muted shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="w-px h-8 bg-border hidden md:block shrink-0" />
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 bg-primary/10 text-primary border border-primary/20 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">
              {prof.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">{prof.fullName}</h1>
                {!prof.isActive && (
                  <Badge variant="secondary" className="text-[10px] font-semibold h-5 px-2">Arşivlendi</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
                <div className="flex items-center gap-1">
                  <Shield className="w-3.5 h-3.5 text-primary/80" />
                  {prof.titleClass}
                </div>
                <span className="text-border">•</span>
                <div className="flex items-center gap-1">
                  <Briefcase className="w-3.5 h-3.5" />
                  {prof.employmentType} {prof.osgbName && `(${prof.osgbName})`}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 self-end md:self-center shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/panel/professionals')}
            className="h-8 px-3 rounded-lg text-xs"
          >
            Listeye Dön
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Left Column - Stats & Info */}
        <div className="space-y-4">
          {/* Certificate Card */}
          <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-primary" />
                Sertifika Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3.5">
              <div className="space-y-2.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Sertifika No</span>
                  <span className="font-mono font-semibold text-foreground tabular-nums">{prof.certificateNo || '—'}</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-muted-foreground">Geçerlilik / Veriliş</span>
                  <span className="font-medium text-foreground tabular-nums">
                    {prof.certificateDate ? new Date(prof.certificateDate).toLocaleDateString('tr-TR') : '—'}
                  </span>
                </div>
              </div>

              <div className={cn(
                "p-3 rounded-lg border flex items-center gap-3",
                prof.certificateStatus.isExpired
                  ? "bg-destructive/10 border-destructive/20 text-destructive"
                  : prof.certificateStatus.isCritical
                    ? "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                    : "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400"
              )}>
                <div className={cn(
                  "w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                  prof.certificateStatus.isExpired
                    ? "bg-destructive text-destructive-foreground"
                    : prof.certificateStatus.isCritical
                      ? "bg-amber-500 text-white"
                      : "bg-emerald-500 text-white"
                )}>
                  <CheckCircle2 className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider opacity-85">Geçerlilik Durumu</p>
                  <p className="text-xs font-semibold tabular-nums">
                    {prof.certificateStatus.isExpired ? 'Süresi Doldu' :
                      prof.certificateStatus.isCritical ? `${prof.certificateStatus.daysLeft} gün kaldı` :
                        'Belge Geçerli'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <User className="w-3.5 h-3.5 text-primary" />
                İletişim Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <Phone className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">Telefon</p>
                  <p className="text-xs font-semibold text-foreground tabular-nums">{prof.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-muted border border-border flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors shrink-0">
                  <Mail className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">E-Posta</p>
                  <p className="text-xs font-semibold text-foreground truncate">{prof.email || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Assignments & Logs */}
        <div className="lg:col-span-2 space-y-4">
          {/* Active Assignments */}
          <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30 flex flex-row items-center justify-between">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Building2 className="w-3.5 h-3.5 text-primary" />
                Görevli Olduğu Tesisler
              </CardTitle>
              <Badge variant="outline" className="text-[10px] font-semibold h-5 px-2 bg-background border-border tabular-nums">
                {activeAssignments.length} Tesis
              </Badge>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {activeAssignments.length > 0 ? activeAssignments.map((as: any) => (
                  <div
                    key={as.id}
                    className="p-3.5 bg-muted/20 rounded-lg border border-border hover:border-primary/40 transition-colors cursor-pointer group"
                    onClick={() => navigate(`/panel/facilities/${as.facilityId}`)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="w-8 h-8 bg-card border border-border rounded-lg flex items-center justify-center text-muted-foreground group-hover:text-primary transition-colors">
                        <Building2 className="w-4 h-4" />
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-semibold text-sm text-foreground mb-1.5 truncate">{as.facility.name}</h3>
                    <div className="flex items-center gap-2.5 text-[11px] text-muted-foreground tabular-nums">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {as.durationMinutes} dk
                      </div>
                      <span className="text-border">•</span>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(as.startDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 py-8 text-center bg-muted/20 rounded-lg border border-dashed border-border">
                    <p className="text-xs text-muted-foreground">Aktif atama bulunmuyor.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
            <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
              <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Activity className="w-3.5 h-3.5 text-primary" />
                İşlem Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2">
              {prof.activityLogs && prof.activityLogs.length > 0 ? prof.activityLogs.map((log: any, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 hover:bg-muted/40 transition-colors rounded-lg">
                  <div className="relative shrink-0">
                    <div className="w-6 h-6 rounded-full bg-muted flex items-center justify-center z-10 relative border border-border">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {idx < prof.activityLogs.length - 1 && (
                      <div className="absolute top-6 left-3 w-px h-full bg-border -z-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground truncate">{log.action}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-1">{log.details}</p>
                    {log.facility && (
                      <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                        <Building2 className="w-3 h-3" />
                        {log.facility.name}
                      </div>
                    )}
                  </div>
                </div>
              )) : (
                <div className="py-12 text-center">
                  <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">İşlem kaydı bulunmuyor.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PanelProfessionalLifeCardPage;
