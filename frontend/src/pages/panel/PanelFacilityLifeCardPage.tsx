import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, MapPin, ChevronLeft, Users, Shield, 
  Activity, Briefcase, Phone, Mail, Globe, 
  Clock, CheckCircle2, AlertCircle, FileText,
  Calendar, TrendingUp, History, ClipboardCheck,
  Stethoscope, HardHat, HeartPulse, Info, UserCheck, UserX
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';

interface Facility {
  id: string;
  name: string;
  type: string;
  city: string;
  district: string;
  fullAddress: string;
  phone: string;
  email: string;
  website: string;
  dangerClass: string;
  employeeCount: number;
  isActive: boolean;
  assignments: any[];
  employeeCountHistory: any[];
  activityLogs: any[];
}

const PanelFacilityLifeCardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data: facility, isLoading } = useQuery<Facility>({
    queryKey: ['facility-detail', id],
    queryFn: async () => {
      const res = await api.get(`/settings/facilities/${id}`);
      if (!res.ok) throw new Error('Tesis yüklenemedi');
      const data = await res.json();
      // Fetch activity logs separately if needed, but we added them to include
      return data;
    }
  });

  if (isLoading) {
    return (
      <div className="p-8 space-y-6 animate-pulse">
        <div className="h-24 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        <div className="grid grid-cols-3 gap-6">
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
          <div className="h-64 bg-slate-100 dark:bg-slate-800 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!facility) return <div>Tesis bulunamadı.</div>;

  // Legal Requirement Calculation
  const getRequirements = (count: number, dangerClass: string) => {
    let iguMinPerPerson = 0;
    let hekimMinPerPerson = 0;
    let dspMinPerPerson = 0;
    let iguFullTimeThreshold = 0;
    let hekimFullTimeThreshold = 0;
    let iguFirstTierClass = 'A, B veya C';

    if (dangerClass === 'Az Tehlikeli') {
      iguMinPerPerson = 10;
      hekimMinPerPerson = 5;
      iguFullTimeThreshold = 1000;
      hekimFullTimeThreshold = 2000;
      iguFirstTierClass = 'A, B veya C';
    } else if (dangerClass === 'Tehlikeli') {
      iguMinPerPerson = 20;
      hekimMinPerPerson = 10;
      iguFullTimeThreshold = 500;
      hekimFullTimeThreshold = 1000;
      iguFirstTierClass = 'A veya B';
    } else if (dangerClass === 'Çok Tehlikeli') {
      iguMinPerPerson = 40;
      hekimMinPerPerson = 15;
      iguFullTimeThreshold = 250;
      hekimFullTimeThreshold = 750;
      iguFirstTierClass = 'A';
      if (count >= 10 && count < 50) dspMinPerPerson = 10;
      else if (count >= 50 && count < 250) dspMinPerPerson = 15;
      else if (count >= 250) dspMinPerPerson = 20;
    }

    const totalIguMin = count * iguMinPerPerson;
    const totalHekimMin = count * hekimMinPerPerson;
    const totalDspMin = dspMinPerPerson > 0 ? count * dspMinPerPerson : 0;

    // Kademeli IGU Hesaplama
    let iguFirstTierFT = 0;
    let iguOtherTierFT = 0;
    let iguFirstTierPartialMin = 0;
    let iguOtherTierPartialMin = 0;

    if (count <= iguFullTimeThreshold) {
      iguFirstTierPartialMin = count * iguMinPerPerson;
    } else {
      iguFirstTierFT = 1; // İlk eşik için 1 tam zamanlı
      const remainingEmployees = count - iguFullTimeThreshold;
      iguOtherTierFT = Math.floor(remainingEmployees / iguFullTimeThreshold);
      iguOtherTierPartialMin = (remainingEmployees % iguFullTimeThreshold) * iguMinPerPerson;
    }

    const fullTimeHekimCount = Math.floor(count / hekimFullTimeThreshold);
    const remainingHekimEmployees = count % hekimFullTimeThreshold;
    const remainingHekimMin = remainingHekimEmployees * hekimMinPerPerson;

    return {
      igu: {
        totalMin: totalIguMin,
        firstTierFT: iguFirstTierFT,
        otherTierFT: iguOtherTierFT,
        firstTierPartialMin: iguFirstTierPartialMin,
        otherTierPartialMin: iguOtherTierPartialMin,
        firstTierClass: iguFirstTierClass,
        otherTierClass: 'A, B veya C'
      },
      hekim: {
        totalMin: totalHekimMin,
        fullTimeRequired: fullTimeHekimCount,
        remainingMin: remainingHekimMin
      },
      dsp: {
        totalMin: totalDspMin,
        required: dspMinPerPerson > 0
      }
    };
  };

  const reqs = getRequirements(facility.employeeCount, facility.dangerClass);

  // Assignment matching
  const activeAssignments = facility.assignments?.filter(a => a.status === 'Aktif') || [];
  const assignedIguMin = activeAssignments.filter(a => a.type === 'IGU').reduce((sum, a) => sum + a.durationMinutes, 0);
  const assignedHekimMin = activeAssignments.filter(a => a.type === 'Hekim').reduce((sum, a) => sum + a.durationMinutes, 0);
  const assignedDspMin = activeAssignments.filter(a => a.type === 'DSP').reduce((sum, a) => sum + a.durationMinutes, 0);

  const isIguMet = assignedIguMin >= reqs.igu.totalMin;
  const isHekimMet = assignedHekimMin >= reqs.hekim.totalMin;
  const isDspMet = !reqs.dsp.required || assignedDspMin >= reqs.dsp.totalMin;

  return (
    <div className="p-8 max-w-[1600px] mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Compact Header */}
      <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-6 rounded-3xl shadow-sm border border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-6">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => navigate('/panel/facilities')}
            className="w-12 h-12 rounded-2xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-all"
          >
            <ChevronLeft className="w-6 h-6" />
          </Button>
          <div className="w-px h-10 bg-slate-100 dark:bg-slate-800" />
          <div>
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">{facility.name}</h1>
              <Badge variant="outline" className={cn(
                "text-[10px] font-bold uppercase px-2",
                facility.dangerClass === 'Çok Tehlikeli' ? "text-red-500 border-red-100 bg-red-50/30" : 
                facility.dangerClass === 'Tehlikeli' ? "text-orange-500 border-orange-100 bg-orange-50/30" : "text-emerald-500 border-emerald-100 bg-emerald-50/30"
              )}>
                {facility.dangerClass}
              </Badge>
            </div>
            <div className="flex items-center gap-4 text-xs font-medium text-slate-500">
              <div className="flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" />
                {facility.district} / {facility.city}
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5" />
                {facility.type}
              </div>
              <div className="w-1 h-1 rounded-full bg-slate-300" />
              <div className="flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5" />
                {facility.employeeCount} Çalışan
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right mr-4">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-0.5">Tesis Kodu</span>
            <span className="text-xs font-mono font-bold text-slate-600">{facility.id}</span>
          </div>
          <Button variant="outline" className="rounded-xl h-10 px-4 font-semibold text-xs border-slate-200 dark:border-slate-800">
            <FileText className="w-4 h-4 mr-2 text-primary" /> Rapor
          </Button>
          <Button className="rounded-xl h-10 px-6 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-lg">
            Atama Yap
          </Button>
        </div>
      </div>

      {/* 3-Column Requirements Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IGU Requirement */}
        <Card className={cn(
          "border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-300",
          isIguMet ? "bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-100 dark:ring-emerald-900/30" : "bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-100 dark:ring-rose-900/30"
        )}>
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                isIguMet ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                <HardHat className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gereksinim</span>
                <span className={cn("text-lg font-black", isIguMet ? "text-emerald-600" : "text-rose-600")}>
                  {reqs.igu.totalMin} <span className="text-[10px] font-bold">DK</span>
                </span>
              </div>
            </div>
            <CardTitle className="text-base font-bold mt-4">İş Güvenliği Uzmanı</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Zorunlu Sınıf:</span>
                <Badge className="bg-slate-900 text-white font-bold">{reqs.igu.firstTierClass}</Badge>
              </div>
              <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                {reqs.igu.firstTierFT > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>1 Tam Zamanlı ({reqs.igu.firstTierClass}) Uzman</span>
                  </div>
                )}
                {reqs.igu.otherTierFT > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>{reqs.igu.otherTierFT} Tam Zamanlı ({reqs.igu.otherTierClass}) Uzman</span>
                  </div>
                )}
                {reqs.igu.firstTierPartialMin > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{reqs.igu.firstTierPartialMin} Dakika Kısmi Süreli ({reqs.igu.firstTierClass}) Uzman</span>
                  </div>
                )}
                {reqs.igu.otherTierPartialMin > 0 && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-slate-400" />
                    <span>{reqs.igu.otherTierPartialMin} Dakika Kısmi Süreli ({reqs.igu.otherTierClass}) Uzman</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Atanmış Profesyoneller</span>
              {activeAssignments.filter(a => a.type === 'IGU').map(as => (
                <div key={as.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">{as.professional?.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase">{as.professional?.titleClass} SINIFI • {as.durationMinutes} DK</p>
                    </div>
                  </div>
                </div>
              ))}
              {activeAssignments.filter(a => a.type === 'IGU').length === 0 && (
                <div className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-dashed border-rose-200">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-medium text-rose-500">Henüz atama yapılmadı</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 px-1">
                <span className="text-slate-400 uppercase">Karşılama Oranı</span>
                <span className={isIguMet ? "text-emerald-500" : "text-rose-500"}>{Math.min(100, Math.round((assignedIguMin / reqs.igu.totalMin) * 100))}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", isIguMet ? "bg-emerald-500" : "bg-rose-500")}
                  style={{ width: `${Math.min(100, (assignedIguMin / reqs.igu.totalMin) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workplace Doctor Requirement */}
        <Card className={cn(
          "border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-300",
          isHekimMet ? "bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-100 dark:ring-emerald-900/30" : "bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-100 dark:ring-rose-900/30"
        )}>
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                isHekimMet ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gereksinim</span>
                <span className={cn("text-lg font-black", isHekimMet ? "text-emerald-600" : "text-rose-600")}>
                  {reqs.hekim.totalMin} <span className="text-[10px] font-bold">DK</span>
                </span>
              </div>
            </div>
            <CardTitle className="text-base font-bold mt-4">İşyeri Hekimi</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">Birim Hesap:</span>
                <span className="font-bold">{facility.employeeCount} x {facility.dangerClass === 'Az Tehlikeli' ? 5 : facility.dangerClass === 'Tehlikeli' ? 10 : 15} Dk</span>
              </div>
              <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                {reqs.hekim.fullTimeRequired > 0 && (
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                    <span>{reqs.hekim.fullTimeRequired} Tam Zamanlı Hekim</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 text-slate-400" />
                  <span>{reqs.hekim.remainingMin} Dakika Kısmi Süreli Hekim</span>
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Atanmış Profesyoneller</span>
              {activeAssignments.filter(a => a.type === 'Hekim').map(as => (
                <div key={as.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">{as.professional?.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase">{as.durationMinutes} DK ATAMA</p>
                    </div>
                  </div>
                </div>
              ))}
              {activeAssignments.filter(a => a.type === 'Hekim').length === 0 && (
                <div className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-dashed border-rose-200">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-medium text-rose-500">Henüz atama yapılmadı</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 px-1">
                <span className="text-slate-400 uppercase">Karşılama Oranı</span>
                <span className={isHekimMet ? "text-emerald-500" : "text-rose-500"}>{Math.min(100, Math.round((assignedHekimMin / reqs.hekim.totalMin) * 100))}%</span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", isHekimMet ? "bg-emerald-500" : "bg-rose-500")}
                  style={{ width: `${Math.min(100, (assignedHekimMin / reqs.hekim.totalMin) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* DSP Requirement */}
        <Card className={cn(
          "border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-300",
          isDspMet ? "bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-100 dark:ring-emerald-900/30" : "bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-100 dark:ring-rose-900/30"
        )}>
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                isDspMet ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
              )}>
                <HeartPulse className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gereksinim</span>
                <span className={cn("text-lg font-black", isDspMet ? "text-emerald-600" : "text-rose-600")}>
                  {reqs.dsp.totalMin} <span className="text-[10px] font-bold">DK</span>
                </span>
              </div>
            </div>
            <CardTitle className="text-base font-bold mt-4">Diğer Sağlık Personeli</CardTitle>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            <div className="bg-white/60 dark:bg-slate-900/60 p-4 rounded-2xl border border-slate-100 dark:border-slate-800 space-y-3">
              <div className="flex justify-between text-xs">
                <span className="text-slate-500 font-medium">DSP Zorunluluğu:</span>
                <span className="font-bold">{reqs.dsp.required ? 'VAR' : 'YOK'}</span>
              </div>
              <div className="text-[11px] leading-relaxed text-slate-600 dark:text-slate-400">
                {reqs.dsp.required ? (
                  <div className="flex items-center gap-2">
                    <Info className="w-3.5 h-3.5 text-primary" />
                    <span>Hekim tam zamanlı değilse atanması zorunludur.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-emerald-500">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>Bu tesis sınıfı/sayısı için DSP zorunlu değildir.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Atanmış Profesyoneller</span>
              {activeAssignments.filter(a => a.type === 'DSP').map(as => (
                <div key={as.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">{as.professional?.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase">{as.durationMinutes} DK ATAMA</p>
                    </div>
                  </div>
                </div>
              ))}
              {reqs.dsp.required && activeAssignments.filter(a => a.type === 'DSP').length === 0 && (
                <div className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-dashed border-rose-200">
                  <UserX className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-medium text-rose-500">Zorunlu atama eksik</span>
                </div>
              )}
            </div>

            {reqs.dsp.required && (
              <div className="pt-2">
                <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 px-1">
                  <span className="text-slate-400 uppercase">Karşılama Oranı</span>
                  <span className={isDspMet ? "text-emerald-500" : "text-rose-500"}>{Math.min(100, Math.round((assignedDspMin / reqs.dsp.totalMin) * 100))}%</span>
                </div>
                <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div 
                    className={cn("h-full transition-all duration-1000", isDspMet ? "bg-emerald-500" : "bg-rose-500")}
                    style={{ width: `${Math.min(100, (assignedDspMin / reqs.dsp.totalMin) * 100)}%` }}
                  />
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Activity Logs & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Activity Logs */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 px-2">
            <Activity className="w-5 h-5 text-primary" />
            Aktivite Geçmişi & Loglar
          </h2>
          <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="max-h-[500px] overflow-y-auto scrollbar-thin">
              <div className="p-2">
                {facility.activityLogs?.length > 0 ? facility.activityLogs.map((log: any, idx: number) => (
                  <div key={idx} className="flex gap-4 p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors rounded-2xl group">
                    <div className="relative">
                      <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center z-10 relative">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                      </div>
                      {idx < facility.activityLogs.length - 1 && (
                        <div className="absolute top-8 left-4 w-px h-full bg-slate-100 dark:bg-slate-800 -z-0" />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-slate-700 dark:text-slate-200">{log.action}</span>
                        <span className="text-[10px] font-medium text-slate-400">{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-relaxed mb-2">{log.details}</p>
                      <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-tight">
                        <UserCheck className="w-3 h-3" />
                        {log.username}
                      </div>
                    </div>
                  </div>
                )) : (
                  <div className="py-20 text-center">
                    <History className="w-10 h-10 text-slate-200 mx-auto mb-3" />
                    <p className="text-sm text-slate-400 font-medium">Henüz bir aktivite kaydı bulunmuyor.</p>
                  </div>
                )}
              </div>
            </div>
          </Card>
        </div>

        {/* Employee History Chart/List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold tracking-tight flex items-center gap-2 px-2">
            <TrendingUp className="w-5 h-5 text-primary" />
            Çalışan Sayısı Trendi
          </h2>
          <Card className="border-none shadow-sm rounded-3xl bg-white dark:bg-slate-900 overflow-hidden">
            <div className="p-6">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800">
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Dönem</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center">Sayı</th>
                    <th className="pb-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Etki</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                  {facility.employeeCountHistory?.map((h: any, idx: number) => (
                    <tr key={idx} className="group">
                      <td className="py-4 text-xs font-semibold text-slate-600 dark:text-slate-400">
                        {new Date(h.effectiveDate).toLocaleDateString('tr-TR', { month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-4 text-center">
                        <span className="text-sm font-black text-slate-900 dark:text-slate-100">{h.count}</span>
                      </td>
                      <td className="py-4 text-right">
                        <Badge variant="ghost" className="text-[10px] font-bold text-emerald-500">+12%</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PanelFacilityLifeCardPage;
