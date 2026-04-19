import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  ChevronLeft, Shield, Activity, Phone, Mail, 
  Calendar, FileText, User, Briefcase, Building2,
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
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-20 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="md:col-span-2 h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!prof) return <div className="p-8 text-center text-slate-400 font-semibold uppercase tracking-widest text-xs">Profesyonel bulunamadı.</div>;

  const activeAssignments = prof.assignments.filter(a => a.status === 'Aktif');

  return (
    <div className="p-8 max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 gap-6">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/panel/professionals')}
            className="w-10 h-10 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-all shrink-0"
          >
            <ChevronLeft className="w-5 h-5" />
          </Button>
          <div className="w-px h-8 bg-slate-100 dark:bg-slate-800 hidden md:block" />
          <div className="flex items-center gap-5">
            <div className="w-14 h-14 bg-slate-50 dark:bg-slate-800 text-slate-500 rounded-xl flex items-center justify-center text-xl font-bold">
              {prof.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{prof.fullName}</h1>
                {!prof.isActive && (
                  <Badge variant="secondary" className="bg-slate-50 text-slate-400 uppercase text-[9px] font-bold tracking-wider">Arşivlendi</Badge>
                )}
              </div>
              <div className="flex flex-wrap items-center gap-4 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary/70" />
                  {prof.titleClass}
                </div>
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <div className="flex items-center gap-1.5">
                  <Briefcase className="w-3.5 h-3.5" />
                  {prof.employmentType} {prof.osgbName && `(${prof.osgbName})`}
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 self-end md:self-center">
          <Button variant="outline" className="rounded-xl h-10 px-4 font-bold text-[10px] uppercase tracking-widest border-slate-200">
            <FileText className="w-4 h-4 mr-2 text-primary/70" /> BELGELER
          </Button>
          <Button className="rounded-xl h-10 px-5 font-bold text-[10px] uppercase tracking-widest bg-slate-900 hover:bg-slate-800 shadow-sm">
            DÜZENLE
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Stats & Info */}
        <div className="space-y-6">
          {/* Certificate Card */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Award className="w-4 h-4" />
                Sertifika Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-5">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Sertifika No</span>
                  <span className="text-xs font-mono font-bold text-slate-700 dark:text-slate-300">{prof.certificateNo || '—'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Veriliş Tarihi</span>
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {prof.certificateDate ? new Date(prof.certificateDate).toLocaleDateString('tr-TR') : '—'}
                  </span>
                </div>
              </div>

              <div className={cn(
                "p-4 rounded-xl border flex items-center gap-4 transition-colors",
                prof.certificateStatus.isExpired ? "bg-rose-50/50 border-rose-100 text-rose-600" :
                prof.certificateStatus.isCritical ? "bg-amber-50/50 border-amber-100 text-amber-600" :
                "bg-emerald-50/50 border-emerald-100 text-emerald-600"
              )}>
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 shadow-sm",
                  prof.certificateStatus.isExpired ? "bg-rose-500 text-white" :
                  prof.certificateStatus.isCritical ? "bg-amber-500 text-white" :
                  "bg-emerald-500 text-white"
                )}>
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider opacity-90">Geçerlilik Durumu</p>
                  <p className="text-[11px] font-semibold">
                    {prof.certificateStatus.isExpired ? 'Süresi Doldu' : 
                     prof.certificateStatus.isCritical ? `${prof.certificateStatus.daysLeft} gün kaldı` : 
                     'Belge Geçerli'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Card */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <User className="w-4 h-4" />
                İletişim Bilgileri
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Phone className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Telefon</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{prof.phone || '—'}</p>
                </div>
              </div>
              <div className="flex items-center gap-4 group">
                <div className="w-9 h-9 rounded-lg bg-slate-50 dark:bg-slate-800 flex items-center justify-center text-slate-400 group-hover:bg-primary/5 group-hover:text-primary transition-colors">
                  <Mail className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">E-Posta</p>
                  <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 truncate">{prof.email || '—'}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Right Column - Assignments & Logs */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Assignments */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800 flex flex-row items-center justify-between">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Building2 className="w-4 h-4" />
                Görevli Olduğu Tesisler
              </CardTitle>
              <Badge variant="secondary" className="bg-slate-50 text-slate-400 text-[10px] font-bold tracking-wider rounded-lg px-2">{activeAssignments.length} TESİS</Badge>
            </CardHeader>
            <CardContent className="p-6 pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {activeAssignments.length > 0 ? activeAssignments.map((as: any) => (
                  <div 
                    key={as.id} 
                    className="p-4 bg-slate-50/50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all cursor-pointer group"
                    onClick={() => navigate(`/panel/facilities/${as.facilityId}`)}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center shadow-sm">
                        <Building2 className="w-4 h-4 text-slate-400" />
                      </div>
                      <ExternalLink className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h3 className="font-bold text-sm text-slate-700 dark:text-slate-200 mb-2 truncate">{as.facility.name}</h3>
                    <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3 h-3" />
                        {as.durationMinutes} DK
                      </div>
                      <div className="w-0.5 h-0.5 rounded-full bg-slate-200" />
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3 h-3" />
                        {new Date(as.startDate).toLocaleDateString('tr-TR')}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="col-span-2 py-10 text-center bg-slate-50/30 rounded-xl border border-dashed border-slate-100">
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">Atama bulunmuyor.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Activity Logs */}
          <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden">
            <CardHeader className="px-6 py-5 border-b border-slate-50 dark:border-slate-800">
              <CardTitle className="text-[11px] font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Activity className="w-4 h-4" />
                İşlem Geçmişi
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <div className="space-y-0.5">
                {prof.activityLogs && prof.activityLogs.length > 0 ? prof.activityLogs.map((log: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-4 hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors rounded-xl group relative">
                    <div className="relative shrink-0">
                      <div className="w-6 h-6 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center z-10 relative border border-slate-100 dark:border-slate-700">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary/40" />
                      </div>
                      {idx < prof.activityLogs.length - 1 && (
                        <div className="absolute top-6 left-3 w-px h-[calc(100%+8px)] bg-slate-50 dark:bg-slate-800 -z-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-600 dark:text-slate-300 truncate pr-4">{log.action}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider shrink-0">{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                      </div>
                      <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-2">{log.details}</p>
                      {log.facility && (
                        <div className="flex items-center gap-1.5 text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                          <Building2 className="w-2.5 h-2.5" />
                          {log.facility.name}
                        </div>
                      )}
                    </div>
                  </div>
                )) : (
                  <div className="py-16 text-center">
                    <History className="w-10 h-10 text-slate-100 mx-auto mb-3" />
                    <p className="text-[10px] font-bold text-slate-300 uppercase tracking-widest">İşlem kaydı bulunmuyor.</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PanelProfessionalLifeCardPage;
