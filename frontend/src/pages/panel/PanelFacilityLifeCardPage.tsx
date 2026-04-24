import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { 
  Building2, MapPin, ChevronLeft, Users, Shield, 
  Activity, Briefcase, Phone, Mail, Globe, 
  Clock, CheckCircle2, AlertCircle, FileText,
  Calendar, TrendingUp, History, ClipboardCheck,
  Stethoscope, HardHat, HeartPulse, Info, UserCheck, UserX,
  Plus, Edit2, Trash2, Loader2, UserPlus, CreditCard, XCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Separator } from '@/components/ui/separator';
import { QuickAssignModal } from '@/components/panel/assignments/QuickAssignModal';
import { toast } from 'sonner';

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

interface Professional {
  id: number;
  fullName: string;
  titleClass: string;
  isActive: boolean;
}

interface EmployerRepresentative {
  id: number;
  fullName: string;
  title: string;
  isActive: boolean;
}

interface Assignment {
  id: number;
  type: string;
  durationMinutes: number;
  isFullTime: boolean;
  startDate: string;
  status: string;
  costType: string;
  unitPrice: number | null;
  professional?: Professional;
  employerRep?: EmployerRepresentative;
  professionalId?: number;
  employerRepId?: number;
}

const PanelFacilityLifeCardPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // Modal States
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'IGU' | 'Hekim' | 'DSP' | 'Vekil'>('IGU');
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [terminatingAssignmentId, setTerminatingAssignmentId] = useState<number | null>(null);
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);

  const [formData, setFormData] = useState({
    professionalId: '',
    employerRepId: '',
    durationMinutes: '',
    isFullTime: false,
    startDate: new Date().toISOString().split('T')[0],
    costType: 'Aylık Sabit',
    unitPrice: '',
  });

  const { data: facility, isLoading } = useQuery<Facility>({
    queryKey: ['facility-detail', id],
    queryFn: async () => {
      const res = await api.get(`/settings/facilities/${id}`);
      if (!res.ok) throw new Error('Tesis yüklenemedi');
      const data = await res.json();
      return data;
    }
  });

  const { data: professionals = [] } = useQuery<Professional[]>({
    queryKey: ['professionals', 'active'],
    queryFn: async () => {
      const res = await api.get('/panel/professionals');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  const { data: employerReps = [] } = useQuery<EmployerRepresentative[]>({
    queryKey: ['employers', 'active'],
    queryFn: async () => {
      const res = await api.get('/panel/employers');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  // Mutations

  const updateMutation = useMutation({
    mutationFn: async ({ id: assignmentId, data }: { id: number; data: any }) => {
      const res = await api.put(`/panel/assignments/${assignmentId}`, data);
      if (!res.ok) throw new Error('Güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-detail', id] });
      toast.success('Atama güncellendi');
      setEditingAssignment(null);
    }
  });

  const terminateMutation = useMutation({
    mutationFn: async ({ id: assignmentId, endDate }: { id: number; endDate: string }) => {
      const res = await api.post(`/panel/assignments/${assignmentId}/terminate`, { endDate });
      if (!res.ok) throw new Error('Sonlandırılamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-detail', id] });
      toast.success('Atama sonlandırıldı');
      setTerminatingAssignmentId(null);
    }
  });

  const resetForm = () => {
    setFormData({
      professionalId: '',
      employerRepId: '',
      durationMinutes: '',
      isFullTime: false,
      startDate: new Date().toISOString().split('T')[0],
      costType: 'Aylık Sabit',
      unitPrice: '',
    });
  };

  const openAssignModal = (type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setAssignType(type);
    setAssignModalOpen(true);
  };

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

  const isIguExcess = assignedIguMin > reqs.igu.totalMin;
  const isHekimExcess = assignedHekimMin > reqs.hekim.totalMin;

  const isIguMet = assignedIguMin >= reqs.igu.totalMin;
  const isHekimMet = assignedHekimMin >= reqs.hekim.totalMin;
  const isDspMet = !reqs.dsp.required || assignedDspMin >= reqs.dsp.totalMin;


  const openManageModal = (type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setAssignType(type);
    setManageModalOpen(true);
  };

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
          <Button 
            className="rounded-xl h-10 px-6 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-lg"
            onClick={() => openAssignModal('IGU')}
          >
            Atama Yap
          </Button>
        </div>
      </div>

      {/* 3-Column Requirements Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* IGU Requirement */}
        <Card className={cn(
          "border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-300",
          !isIguMet ? "bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-100 dark:ring-rose-900/30" : 
          isIguExcess ? "bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-100 dark:ring-amber-900/30" :
          "bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-100 dark:ring-emerald-900/30"
        )}>
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                !isIguMet ? "bg-rose-500 text-white" : 
                isIguExcess ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
              )}>
                <HardHat className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gereksinim</span>
                <span className={cn("text-lg font-black", !isIguMet ? "text-rose-600" : isIguExcess ? "text-amber-600" : "text-emerald-600")}>
                  {reqs.igu.totalMin} <span className="text-[10px] font-bold">DK</span>
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <CardTitle className="text-base font-bold">İş Güvenliği Uzmanı</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => openManageModal('IGU')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
                <div 
                  key={as.id} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm group cursor-pointer hover:border-primary/50 transition-colors"
                  onClick={() => openManageModal('IGU')}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">{as.professional?.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase">{as.professional?.titleClass} SINIFI • {as.durationMinutes} DK</p>
                    </div>
                  </div>
                  <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {activeAssignments.filter(a => a.type === 'IGU').length === 0 && (
                <div 
                  className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-dashed border-rose-200 cursor-pointer hover:bg-rose-500/10 transition-colors"
                  onClick={() => openAssignModal('IGU')}
                >
                  <UserPlus className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-medium text-rose-500">Atama Yap</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 px-1">
                <span className="text-slate-400 uppercase">Karşılama Oranı</span>
                <span className={!isIguMet ? "text-rose-500" : isIguExcess ? "text-amber-500" : "text-emerald-500"}>
                    {Math.min(100, Math.round((assignedIguMin / reqs.igu.totalMin) * 100))}%
                    {isIguExcess && ` (+${assignedIguMin - reqs.igu.totalMin} dk fazla)`}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", !isIguMet ? "bg-rose-500" : isIguExcess ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(100, (assignedIguMin / reqs.igu.totalMin) * 100)}%` }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Workplace Doctor Requirement */}
        <Card className={cn(
          "border-none shadow-sm rounded-3xl overflow-hidden transition-all duration-300",
          !isHekimMet ? "bg-rose-50/50 dark:bg-rose-950/20 ring-1 ring-rose-100 dark:ring-rose-900/30" :
          isHekimExcess ? "bg-amber-50/50 dark:bg-amber-950/20 ring-1 ring-amber-100 dark:ring-amber-900/30" :
          "bg-emerald-50/50 dark:bg-emerald-950/20 ring-1 ring-emerald-100 dark:ring-emerald-900/30"
        )}>
          <CardHeader className="p-6 pb-2">
            <div className="flex items-center justify-between">
              <div className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm",
                !isHekimMet ? "bg-rose-500 text-white" :
                isHekimExcess ? "bg-amber-500 text-white" : "bg-emerald-500 text-white"
              )}>
                <Stethoscope className="w-6 h-6" />
              </div>
              <div className="text-right">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Gereksinim</span>
                <span className={cn("text-lg font-black", !isHekimMet ? "text-rose-600" : isHekimExcess ? "text-amber-600" : "text-emerald-600")}>
                  {reqs.hekim.totalMin} <span className="text-[10px] font-bold">DK</span>
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between mt-4">
              <CardTitle className="text-base font-bold">İşyeri Hekimi</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => openManageModal('Hekim')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
                <div 
                  key={as.id} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-primary/50 group"
                  onClick={() => openManageModal('Hekim')}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">{as.professional?.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase">{as.durationMinutes} DK ATAMA</p>
                    </div>
                  </div>
                  <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {activeAssignments.filter(a => a.type === 'Hekim').length === 0 && (
                <div 
                  className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-dashed border-rose-200 cursor-pointer hover:bg-rose-500/10 transition-colors"
                  onClick={() => openAssignModal('Hekim')}
                >
                  <UserPlus className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-medium text-rose-500">Atama Yap</span>
                </div>
              )}
            </div>

            <div className="pt-2">
              <div className="flex items-center justify-between text-[10px] font-bold mb-1.5 px-1">
                <span className="text-slate-400 uppercase">Karşılama Oranı</span>
                <span className={!isHekimMet ? "text-rose-500" : isHekimExcess ? "text-amber-500" : "text-emerald-500"}>
                    {Math.min(100, Math.round((assignedHekimMin / reqs.hekim.totalMin) * 100))}%
                    {isHekimExcess && ` (+${assignedHekimMin - reqs.hekim.totalMin} dk fazla)`}
                </span>
              </div>
              <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                <div 
                  className={cn("h-full transition-all duration-1000", !isHekimMet ? "bg-rose-500" : isHekimExcess ? "bg-amber-500" : "bg-emerald-500")}
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
            <div className="flex items-center justify-between mt-4">
              <CardTitle className="text-base font-bold">Diğer Sağlık Personeli</CardTitle>
              <Button 
                variant="ghost" 
                size="icon" 
                className="w-8 h-8 rounded-lg hover:bg-black/5 dark:hover:bg-white/5"
                onClick={() => openManageModal('DSP')}
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
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
                <div 
                  key={as.id} 
                  className="flex items-center justify-between p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm cursor-pointer hover:border-primary/50 group"
                  onClick={() => openManageModal('DSP')}
                >
                  <div className="flex items-center gap-3">
                    <UserCheck className="w-4 h-4 text-emerald-500" />
                    <div>
                      <p className="text-xs font-bold">{as.professional?.fullName}</p>
                      <p className="text-[9px] text-slate-400 font-medium uppercase">{as.durationMinutes} DK ATAMA</p>
                    </div>
                  </div>
                  <Edit2 className="w-3 h-3 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))}
              {reqs.dsp.required && activeAssignments.filter(a => a.type === 'DSP').length === 0 && (
                <div 
                  className="flex items-center gap-3 p-3 bg-rose-500/5 rounded-xl border border-dashed border-rose-200 cursor-pointer hover:bg-rose-500/10 transition-colors"
                  onClick={() => openAssignModal('DSP')}
                >
                  <UserPlus className="w-4 h-4 text-rose-400" />
                  <span className="text-[11px] font-medium text-rose-500">Atama Yap</span>
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

      <QuickAssignModal 
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        facility={facility}
        type={assignType}
      />

      {/* Manage Assignments Modal */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="sm:max-w-[1000px] w-[95vw] h-[85vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl flex flex-col">
          <DialogHeader className="px-8 py-6 bg-slate-900 text-white flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <History className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">Atama Yönetimi</DialogTitle>
                <DialogDescription className="text-white/40 text-[10px] uppercase tracking-widest mt-1 font-bold">
                  {facility.name} • {assignType} Aktif Atamaları
                </DialogDescription>
              </div>
            </div>
            <Button 
              onClick={() => {
                setManageModalOpen(false);
                openAssignModal(assignType);
              }}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl h-10 px-6 text-[11px] font-bold shadow-lg transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Yeni Atama Ekle
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950 custom-scrollbar">
            {facility.assignments?.filter(a => a.status === 'Aktif' && a.type === assignType).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <Shield className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold tracking-widest">AKTİF ATAMA BULUNAMADI</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {facility.assignments?.filter(a => a.status === 'Aktif' && a.type === assignType).map(a => (
                  <div key={a.id} className="p-6 rounded-2xl border border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm flex items-center justify-between group hover:border-primary/20 transition-all duration-300">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-bold text-primary shadow-inner">
                        {(a.professional?.fullName || a.employerRep?.fullName || '?')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {a.professional?.fullName || a.employerRep?.fullName}
                        </p>
                        <div className="flex flex-wrap items-center gap-3 mt-2">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" /> {a.durationMinutes} DK
                          </span>
                          {a.isFullTime && <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black h-4 px-2 uppercase tracking-tighter">TAM ZAMANLI</Badge>}
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1.5 border-l pl-3">
                            <Calendar className="w-3.5 h-3.5" /> {new Date(a.startDate).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-10 h-10 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-primary transition-all"
                        onClick={() => {
                          setEditingAssignment(a);
                          setFormData({
                            professionalId: a.professionalId?.toString() || '',
                            employerRepId: a.employerRepId?.toString() || '',
                            durationMinutes: a.durationMinutes.toString(),
                            isFullTime: a.isFullTime,
                            startDate: new Date(a.startDate).toISOString().split('T')[0],
                            costType: a.costType || 'Aylık Sabit',
                            unitPrice: a.unitPrice?.toString() || '',
                          });
                        }}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-10 h-10 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-900/10 text-slate-400 hover:text-rose-500 transition-all"
                        onClick={() => setTerminatingAssignmentId(a.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingAssignment && (
              <div className="mt-8 p-8 rounded-2xl border-2 border-primary/10 bg-primary/[0.02] dark:bg-primary/[0.01] space-y-6 animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-primary flex items-center gap-2 uppercase tracking-widest">
                    <Edit2 className="w-4 h-4" /> Atama Güncelleme
                  </h4>
                  <Badge variant="outline" className="bg-white dark:bg-slate-900 border-primary/20 text-primary font-bold">
                    {editingAssignment.professional?.fullName || editingAssignment.employerRep?.fullName}
                  </Badge>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Süre (Dk/Ay)</label>
                    <Input 
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                      className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 shadow-sm"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Maliyet ve Birim Fiyat</label>
                    <div className="flex gap-3">
                      <Select value={formData.costType} onValueChange={(v) => setFormData({...formData, costType: v})}>
                        <SelectTrigger className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 flex-1 shadow-sm">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="Aylık Sabit" className="text-xs font-medium">Sabit</SelectItem>
                          <SelectItem value="Saatlik" className="text-xs font-medium">Saatlik</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative w-32">
                        <Input 
                          type="number"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                          className="h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 pl-7 shadow-sm"
                          placeholder="0"
                        />
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400">₺</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:col-span-2 flex items-center justify-between p-5 bg-white dark:bg-slate-900 rounded-2xl border border-primary/10 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div 
                        className={cn("w-10 h-5 rounded-full relative cursor-pointer transition-colors shadow-inner", formData.isFullTime ? "bg-primary" : "bg-slate-200 dark:bg-slate-800")}
                        onClick={() => {
                          const newFT = !formData.isFullTime;
                          setFormData({...formData, isFullTime: newFT, durationMinutes: newFT ? '11700' : formData.durationMinutes});
                        }}
                      >
                        <div className={cn("absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow-sm", formData.isFullTime ? "left-5.5" : "left-0.5")} />
                      </div>
                      <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wide">TAM ZAMANLI DURUMU</span>
                    </div>
                    <div className="flex gap-3">
                      <Button variant="ghost" className="h-10 px-6 rounded-xl text-[11px] font-bold text-slate-400 hover:text-slate-600" onClick={() => setEditingAssignment(null)}>İptal</Button>
                      <Button 
                        className="h-10 px-8 rounded-xl text-[11px] font-bold bg-slate-900 hover:bg-slate-800 text-white shadow-xl transition-all active:scale-95"
                        onClick={() => {
                          updateMutation.mutate({
                            id: editingAssignment.id,
                            data: {
                              durationMinutes: parseInt(formData.durationMinutes),
                              isFullTime: formData.isFullTime,
                              costType: formData.costType,
                              unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
                            }
                          });
                        }}
                      >
                        Değişiklikleri Kaydet
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="px-8 py-4 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0">
            <p className="text-[10px] text-slate-400 font-medium italic">Atama detaylarını düzenlemek için ilgili kaydın yanındaki düzenle butonunu kullanın.</p>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Termination Dialog */}
      <Dialog open={terminatingAssignmentId !== null} onOpenChange={(v) => !v && setTerminatingAssignmentId(null)}>
        <DialogContent className="sm:max-w-[450px] w-[95vw] p-0 overflow-hidden border-none shadow-2xl rounded-3xl flex flex-col">
          <DialogHeader className="px-8 py-6 bg-rose-600 text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">Atamayı Sonlandır</DialogTitle>
                <DialogDescription className="text-white/60 text-xs mt-1 font-medium">
                  Bu işlem geri alınamaz. Lütfen bitiş tarihini seçin.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-white dark:bg-slate-900 flex-1 overflow-y-auto">
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Bitiş Tarihi *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="date" 
                  value={terminationDate} 
                  onChange={(e) => setTerminationDate(e.target.value)}
                  required
                  className="pl-10 rounded-xl border-slate-100 dark:border-slate-800 h-11 text-sm font-medium focus-visible:ring-primary/10 shadow-sm"
                />
              </div>
            </div>
            
            <div className="p-4 bg-rose-50 dark:bg-rose-900/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-rose-700 dark:text-rose-400 font-medium leading-relaxed">
                Atama sonlandırıldığında ilgili profesyonelin bu tesisteki kapasitesi serbest kalacaktır.
              </p>
            </div>
          </div>
          <DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0 gap-3">
            <Button variant="ghost" onClick={() => setTerminatingAssignmentId(null)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400 hover:text-slate-600">Vazgeç</Button>
            <Button 
              variant="destructive"
              className="rounded-xl h-11 px-8 font-bold text-xs shadow-lg transition-all active:scale-95"
              onClick={() => terminatingAssignmentId && terminateMutation.mutate({ id: terminatingAssignmentId, endDate: terminationDate })}
              disabled={terminateMutation.isPending}
            >
              {terminateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
              Atamayı Kalıcı Olarak Sonlandır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PanelFacilityLifeCardPage;
