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
  Activity, 
  Clock, CheckCircle2, AlertCircle, FileText,
  Calendar, TrendingUp, History,
  Stethoscope, HardHat, HeartPulse, Info, UserCheck,
  Plus, Edit2, Trash2, Loader2, UserPlus, XCircle, Upload, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickAssignModal } from '@/components/panel/assignments/QuickAssignModal';
import { AssignmentDocumentModal } from '@/components/panel/assignments/AssignmentDocumentModal';
import { toast } from 'sonner';

interface EmployeeCountHistory {
  effectiveDate: string;
  count: number;
}

interface ActivityLog {
  action: string;
  details: string;
  createdAt: string;
  username: string;
}

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
  assignments: Assignment[];
  employeeCountHistory: EmployeeCountHistory[];
  activityLogs: ActivityLog[];
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
  documents?: any[];
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
  const [isUploadingKatip, setIsUploadingKatip] = useState(false);
  const [documentModalOpen, setDocumentModalOpen] = useState(false);
  const [selectedAssignmentId, setSelectedAssignmentId] = useState<number | null>(null);
  const [selectedAssignmentName, setSelectedAssignmentName] = useState<string>('');

  const [formData, setFormData] = useState({
    professionalId: '',
    employerRepId: '',
    durationMinutes: '',
    isFullTime: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: null as string | null,
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


  // Mutations

interface UpdateAssignmentData {
  durationMinutes: number;
  isFullTime: boolean;
  startDate: string;
  endDate: string | null;
  costType: string;
  unitPrice: number | null;
}

  const updateMutation = useMutation({
    mutationFn: async ({ id: assignmentId, data }: { id: number; data: UpdateAssignmentData }) => {
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

  const handleKatipUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploadingKatip(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await api.customFetch(`/panel/facilities/${id}/import-katip`, {
        method: 'POST',
        body: formData,
      });
      if (!res.ok) {
        throw new Error('İSG-KATİP aktarımı başarısız');
      }
      toast.success('İSG-KATİP aktarımı başarıyla tamamlandı!');
      queryClient.invalidateQueries({ queryKey: ['facility-detail', id] });
    } catch (error) {
      console.error(error);
      toast.error('Aktarım sırasında bir hata oluştu');
    } finally {
      setIsUploadingKatip(false);
      event.target.value = ''; // Reset input
    }
  };

  const openAssignModal = (type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setAssignType(type);
    setAssignModalOpen(true);
  };

  if (isLoading) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-20 bg-muted rounded-lg" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
          <div className="h-64 bg-muted rounded-lg" />
        </div>
      </div>
    );
  }

  if (!facility) return <div className="py-12 text-center text-sm text-muted-foreground">Tesis bulunamadı.</div>;

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

  // DSP Muafiyet Mantığı (Tam zamanlı hekim ataması varsa DSP muaf)
  const isDspWaived = assignedHekimMin >= 11700 || activeAssignments.some(a => a.type === 'Hekim' && a.isFullTime);

  const isIguMet = assignedIguMin >= reqs.igu.totalMin;
  const isIguExcess = assignedIguMin > reqs.igu.totalMin;
  
  const isHekimMet = assignedHekimMin >= reqs.hekim.totalMin;
  const isHekimExcess = assignedHekimMin > reqs.hekim.totalMin;
  
  const isDspMet = isDspWaived || assignedDspMin >= reqs.dsp.totalMin;
  const isDspExcess = !isDspWaived && assignedDspMin > reqs.dsp.totalMin;

  const computeCountdown = (type: string, isMet: boolean, isRequired: boolean = true) => {
    if (isMet || !isRequired || !facility) return null;
    const pastAssignments = facility.assignments?.filter(a => a.type === type && a.status === 'Sona Erdi' && a.endDate) || [];
    pastAssignments.sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime());
    const startDate = pastAssignments.length > 0 ? new Date(pastAssignments[0].endDate) : new Date(facility.createdAt);
    const diffTime = new Date().getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, 30 - diffDays);
  };

  const iguCountdown = computeCountdown('IGU', isIguMet);
  const hekimCountdown = computeCountdown('Hekim', isHekimMet);
  const dspCountdown = computeCountdown('DSP', isDspMet, reqs.dsp.required && !isDspWaived);


  const openManageModal = (type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setAssignType(type);
    setManageModalOpen(true);
  };

  return (
    <div className="space-y-4 pb-10 animate-in fade-in duration-300">
      {/* Compact Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-card text-card-foreground p-4 rounded-lg shadow-xs border border-border">
        <div className="flex items-center gap-3.5 min-w-0">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => navigate(-1)}
            className="w-8 h-8 rounded-lg hover:bg-muted shrink-0"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <div className="w-px h-8 bg-border shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-lg font-semibold tracking-tight text-foreground truncate">{facility.name}</h1>
              <Badge variant="outline" className={cn(
                "text-[10px] font-semibold uppercase px-2 h-5",
                facility.dangerClass === 'Çok Tehlikeli'
                  ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20"
                  : facility.dangerClass === 'Tehlikeli'
                    ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              )}>
                {facility.dangerClass}
              </Badge>
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground mt-0.5">
              <div className="flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" />
                {facility.district} / {facility.city}
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1">
                <Building2 className="w-3.5 h-3.5" />
                {facility.type}
              </div>
              <span className="text-border">•</span>
              <div className="flex items-center gap-1 tabular-nums">
                <Users className="w-3.5 h-3.5" />
                {facility.employeeCount} Çalışan
              </div>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls"
              id="katip-upload"
              className="hidden"
              onChange={handleKatipUpload}
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 rounded-lg border-border text-xs gap-1.5"
              onClick={() => document.getElementById('katip-upload')?.click()}
              disabled={isUploadingKatip}
              title="İSG-KATİP Aktar"
            >
              {isUploadingKatip ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
              <span className="hidden md:inline">KATİP Aktar</span>
            </Button>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="h-8 px-2.5 rounded-lg border-border text-xs gap-1.5"
            title="Yazdır / Rapor"
            onClick={() => window.print()}
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden md:inline">Yazdır</span>
          </Button>

          <Button
            size="sm"
            className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5"
            onClick={() => openAssignModal('IGU')}
          >
            <Plus className="w-3.5 h-3.5" />
            Atama Yap
          </Button>
        </div>
      </div>

      {/* 3-Column Requirements Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* IGU Requirement */}
        <Card className={cn(
          "bg-card shadow-xs hover:shadow-sm rounded-lg overflow-hidden transition-all duration-200 border",
          !isIguMet ? "border-destructive/30" :
          isIguExcess ? "border-amber-500/30" :
          "border-border"
        )}>
          <CardHeader className="p-4 pb-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                  !isIguMet
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : isIguExcess
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                )}>
                  <HardHat className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold text-foreground truncate">İş Güvenliği Uzmanı</CardTitle>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    Gereksinim:{" "}
                    <span className={cn("font-semibold", !isIguMet ? "text-destructive" : isIguExcess ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                      {reqs.igu.totalMin} dk
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg"
                  onClick={() => openAssignModal('IGU')}
                  title="Hızlı Atama Ekle"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg"
                  onClick={() => openManageModal('IGU')}
                  title="Yönet"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Zorunlu Sınıf:</span>
                <Badge variant="secondary" className="text-[10px] font-semibold h-5 px-2">{reqs.igu.firstTierClass}</Badge>
              </div>
              <div className="text-[11px] leading-relaxed text-muted-foreground space-y-1">
                {reqs.igu.firstTierFT > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>1 Tam Zamanlı ({reqs.igu.firstTierClass}) Uzman</span>
                  </div>
                )}
                {reqs.igu.otherTierFT > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{reqs.igu.otherTierFT} Tam Zamanlı ({reqs.igu.otherTierClass}) Uzman</span>
                  </div>
                )}
                {reqs.igu.firstTierPartialMin > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{reqs.igu.firstTierPartialMin} Dakika Kısmi Süreli ({reqs.igu.firstTierClass}) Uzman</span>
                  </div>
                )}
                {reqs.igu.otherTierPartialMin > 0 && (
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <span>{reqs.igu.otherTierPartialMin} Dakika Kısmi Süreli ({reqs.igu.otherTierClass}) Uzman</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atanmış Profesyoneller</span>
              {activeAssignments.filter(a => a.type === 'IGU').map(as => (
                <div
                  key={as.id}
                  className="flex items-center justify-between p-2.5 bg-card text-card-foreground rounded-lg border border-border group cursor-pointer hover:border-primary/40 transition-colors"
                  onClick={() => as.professional ? navigate(`/panel/professionals/${as.professional.id}`) : openManageModal('IGU')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{as.professional?.fullName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={cn(
                          "text-[9px] px-1.5 py-0 h-4",
                          (as.professional as any)?.employmentType === 'OSGB Kadrosu'
                            ? "border-purple-500/20 text-purple-700 dark:text-purple-400 bg-purple-500/10"
                            : "border-blue-500/20 text-blue-700 dark:text-blue-400 bg-blue-500/10"
                        )}>
                          {(as.professional as any)?.employmentType === 'OSGB Kadrosu' ? 'OSGB' : 'Tesis'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {as.durationMinutes === 11700 ? 'Tam Zamanlı' : `${as.durationMinutes} dk`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Edit2
                    className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary shrink-0"
                    onClick={(e) => { e.stopPropagation(); openManageModal('IGU'); }}
                  />
                </div>
              ))}
              {activeAssignments.filter(a => a.type === 'IGU').length === 0 && (
                <div
                  className="flex items-center gap-2.5 p-2.5 bg-destructive/10 rounded-lg border border-dashed border-destructive/30 cursor-pointer hover:bg-destructive/15 transition-colors"
                  onClick={() => openAssignModal('IGU')}
                >
                  <UserPlus className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs font-medium text-destructive">Atama Yap</span>
                </div>
              )}
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                <span className="text-muted-foreground">Karşılama Oranı</span>
                <span className={cn("font-semibold tabular-nums", !isIguMet ? "text-destructive" : isIguExcess ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                  %{Math.round((assignedIguMin / (reqs.igu.totalMin || 1)) * 100)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-500", !isIguMet ? "bg-destructive" : isIguExcess ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(100, (assignedIguMin / (reqs.igu.totalMin || 1)) * 100)}%` }}
                />
              </div>
              {!isIguMet && iguCountdown !== null && (
                <div className={cn(
                  "mt-2.5 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-semibold border tabular-nums",
                  iguCountdown <= 7
                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                )}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>YASAL ATAMA SÜRESİ</span>
                  </div>
                  <span>{iguCountdown} GÜN KALDI</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Workplace Doctor Requirement */}
        <Card className={cn(
          "bg-card shadow-xs hover:shadow-sm rounded-lg overflow-hidden transition-all duration-200 border",
          !isHekimMet ? "border-destructive/30" :
          isHekimExcess ? "border-amber-500/30" :
          "border-border"
        )}>
          <CardHeader className="p-4 pb-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                  !isHekimMet
                    ? "bg-destructive/10 text-destructive border-destructive/20"
                    : isHekimExcess
                      ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                      : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                )}>
                  <Stethoscope className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold text-foreground truncate">İşyeri Hekimi</CardTitle>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    Gereksinim:{" "}
                    <span className={cn("font-semibold", !isHekimMet ? "text-destructive" : isHekimExcess ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                      {reqs.hekim.totalMin} dk
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg"
                  onClick={() => openAssignModal('Hekim')}
                  title="Hızlı Atama Ekle"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg"
                  onClick={() => openManageModal('Hekim')}
                  title="Yönet"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Birim Hesap:</span>
                <span className="font-semibold tabular-nums">{facility.employeeCount} x {facility.dangerClass === 'Az Tehlikeli' ? 5 : facility.dangerClass === 'Tehlikeli' ? 10 : 15} dk</span>
              </div>
              <div className="text-[11px] leading-relaxed text-muted-foreground space-y-1">
                {reqs.hekim.fullTimeRequired > 0 && (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>{reqs.hekim.fullTimeRequired} Tam Zamanlı Hekim</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                  <span>{reqs.hekim.remainingMin} Dakika Kısmi Süreli Hekim</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atanmış Profesyoneller</span>
              {activeAssignments.filter(a => a.type === 'Hekim').map(as => (
                <div
                  key={as.id}
                  className="flex items-center justify-between p-2.5 bg-card text-card-foreground rounded-lg border border-border cursor-pointer hover:border-primary/40 group transition-colors"
                  onClick={() => as.professional ? navigate(`/panel/professionals/${as.professional.id}`) : openManageModal('Hekim')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{as.professional?.fullName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={cn(
                          "text-[9px] px-1.5 py-0 h-4",
                          (as.professional as any)?.employmentType === 'OSGB Kadrosu'
                            ? "border-purple-500/20 text-purple-700 dark:text-purple-400 bg-purple-500/10"
                            : "border-blue-500/20 text-blue-700 dark:text-blue-400 bg-blue-500/10"
                        )}>
                          {(as.professional as any)?.employmentType === 'OSGB Kadrosu' ? 'OSGB' : 'Tesis'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {as.durationMinutes === 11700 ? 'Tam Zamanlı' : `${as.durationMinutes} dk`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Edit2
                    className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary shrink-0"
                    onClick={(e) => { e.stopPropagation(); openManageModal('Hekim'); }}
                  />
                </div>
              ))}
              {activeAssignments.filter(a => a.type === 'Hekim').length === 0 && (
                <div
                  className="flex items-center gap-2.5 p-2.5 bg-destructive/10 rounded-lg border border-dashed border-destructive/30 cursor-pointer hover:bg-destructive/15 transition-colors"
                  onClick={() => openAssignModal('Hekim')}
                >
                  <UserPlus className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs font-medium text-destructive">Atama Yap</span>
                </div>
              )}
            </div>

            <div className="pt-1">
              <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                <span className="text-muted-foreground">Karşılama Oranı</span>
                <span className={cn("font-semibold tabular-nums", !isHekimMet ? "text-destructive" : isHekimExcess ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                  %{Math.round((assignedHekimMin / (reqs.hekim.totalMin || 1)) * 100)}
                </span>
              </div>
              <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-500", !isHekimMet ? "bg-destructive" : isHekimExcess ? "bg-amber-500" : "bg-emerald-500")}
                  style={{ width: `${Math.min(100, (assignedHekimMin / (reqs.hekim.totalMin || 1)) * 100)}%` }}
                />
              </div>
              {!isHekimMet && hekimCountdown !== null && (
                <div className={cn(
                  "mt-2.5 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-semibold border tabular-nums",
                  hekimCountdown <= 7
                    ? "bg-destructive/10 border-destructive/20 text-destructive"
                    : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                )}>
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3 h-3" />
                    <span>YASAL ATAMA SÜRESİ</span>
                  </div>
                  <span>{hekimCountdown} GÜN KALDI</span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* DSP Requirement */}
        <Card className={cn(
          "bg-card shadow-xs hover:shadow-sm rounded-lg overflow-hidden transition-all duration-200 border",
          !reqs.dsp.required ? "border-border opacity-85" :
          !isDspMet ? "border-destructive/30" :
          isDspExcess ? "border-amber-500/30" :
          "border-border"
        )}>
          <CardHeader className="p-4 pb-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className={cn(
                  "w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border",
                  isDspWaived
                    ? "bg-muted text-muted-foreground border-border"
                    : !isDspMet && reqs.dsp.required
                      ? "bg-destructive/10 text-destructive border-destructive/20"
                      : isDspExcess
                        ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20"
                        : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                )}>
                  <HeartPulse className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <CardTitle className="text-sm font-semibold text-foreground truncate">Diğer Sağlık Personeli</CardTitle>
                  <p className="text-[11px] text-muted-foreground tabular-nums">
                    Gereksinim:{" "}
                    <span className={cn(
                      "font-semibold",
                      isDspWaived ? "text-muted-foreground" :
                      !isDspMet && reqs.dsp.required ? "text-destructive" :
                      isDspExcess ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400"
                    )}>
                      {isDspWaived ? "MUAF" : `${reqs.dsp.totalMin} dk`}
                    </span>
                  </p>
                </div>
              </div>
              <div className="flex gap-1 shrink-0">
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg"
                  onClick={() => openAssignModal('DSP')}
                  title="Hızlı Atama Ekle"
                >
                  <Plus className="w-3.5 h-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-7 h-7 rounded-lg"
                  onClick={() => openManageModal('DSP')}
                  title="Yönet"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-4 pt-2 space-y-3">
            <div className="bg-muted/30 p-3 rounded-lg border border-border space-y-2">
              <div className="flex justify-between items-center text-xs">
                <span className="text-muted-foreground">DSP Zorunluluğu:</span>
                <Badge variant="secondary" className="text-[10px] font-semibold h-5 px-2">
                  {isDspWaived ? 'MUAF' : reqs.dsp.required ? 'VAR' : 'YOK'}
                </Badge>
              </div>
              <div className="text-[11px] leading-relaxed text-muted-foreground">
                {isDspWaived ? (
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Tam zamanlı İşyeri Hekimi atandığı için DSP atama zorunluluğu muaf tutulmuştur.</span>
                  </div>
                ) : reqs.dsp.required ? (
                  <div className="flex items-center gap-1.5">
                    <Info className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span>Hekim tam zamanlı değilse atanması zorunludur.</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                    <span>Bu tesis sınıfı/sayısı için DSP zorunlu değildir.</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-1.5">
              <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Atanmış Profesyoneller</span>
              {activeAssignments.filter(a => a.type === 'DSP').map(as => (
                <div
                  key={as.id}
                  className="flex items-center justify-between p-2.5 bg-card text-card-foreground rounded-lg border border-border cursor-pointer hover:border-primary/40 group transition-colors"
                  onClick={() => as.professional ? navigate(`/panel/professionals/${as.professional.id}`) : openManageModal('DSP')}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <p className="text-xs font-semibold truncate">{as.professional?.fullName}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <Badge variant="outline" className={cn(
                          "text-[9px] px-1.5 py-0 h-4",
                          (as.professional as any)?.employmentType === 'OSGB Kadrosu'
                            ? "border-purple-500/20 text-purple-700 dark:text-purple-400 bg-purple-500/10"
                            : "border-blue-500/20 text-blue-700 dark:text-blue-400 bg-blue-500/10"
                        )}>
                          {(as.professional as any)?.employmentType === 'OSGB Kadrosu' ? 'OSGB' : 'Tesis'}
                        </Badge>
                        <span className="text-[10px] text-muted-foreground tabular-nums">
                          {as.durationMinutes === 11700 ? 'Tam Zamanlı' : `${as.durationMinutes} dk`}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Edit2
                    className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary shrink-0"
                    onClick={(e) => { e.stopPropagation(); openManageModal('DSP'); }}
                  />
                </div>
              ))}
              {reqs.dsp.required && activeAssignments.filter(a => a.type === 'DSP').length === 0 && (
                <div
                  className="flex items-center gap-2.5 p-2.5 bg-destructive/10 rounded-lg border border-dashed border-destructive/30 cursor-pointer hover:bg-destructive/15 transition-colors"
                  onClick={() => openAssignModal('DSP')}
                >
                  <UserPlus className="w-3.5 h-3.5 text-destructive" />
                  <span className="text-xs font-medium text-destructive">Atama Yap</span>
                </div>
              )}
            </div>

            {reqs.dsp.required && (
              <div className="pt-1">
                <div className="flex items-center justify-between text-[11px] font-medium mb-1">
                  <span className="text-muted-foreground">Karşılama Oranı</span>
                  <span className={cn("font-semibold tabular-nums", !isDspMet ? "text-destructive" : isDspExcess ? "text-amber-600 dark:text-amber-400" : "text-emerald-600 dark:text-emerald-400")}>
                    %{Math.round((assignedDspMin / (reqs.dsp.totalMin || 1)) * 100)}
                  </span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={cn("h-full transition-all duration-500", !isDspMet ? "bg-destructive" : isDspExcess ? "bg-amber-500" : "bg-emerald-500")}
                    style={{ width: `${Math.min(100, (assignedDspMin / (reqs.dsp.totalMin || 1)) * 100)}%` }}
                  />
                </div>
                {!isDspMet && dspCountdown !== null && (
                  <div className={cn(
                    "mt-2.5 px-2.5 py-1.5 rounded-lg flex items-center justify-between text-[10px] font-semibold border tabular-nums",
                    dspCountdown <= 7
                      ? "bg-destructive/10 border-destructive/20 text-destructive"
                      : "bg-amber-500/10 border-amber-500/20 text-amber-700 dark:text-amber-400"
                  )}>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3" />
                      <span>YASAL ATAMA SÜRESİ</span>
                    </div>
                    <span>{dspCountdown} GÜN KALDI</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* İşveren Vekili Requirement */}
      <Card className="bg-card shadow-xs rounded-lg overflow-hidden border border-border flex flex-col md:flex-row items-center justify-between p-4 gap-4">
        <div className="flex items-center gap-3 w-full md:w-auto shrink-0 md:pr-5 md:border-r border-border">
          <div className="w-9 h-9 rounded-lg flex items-center justify-center bg-muted text-muted-foreground border border-border shrink-0">
            <Shield className="w-4 h-4" />
          </div>
          <div>
            <CardTitle className="text-sm font-semibold text-foreground">İşveren Vekili</CardTitle>
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider block">Durum: İhtiyari</span>
          </div>
        </div>

        <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2.5">
          {activeAssignments.filter(a => a.type === 'Vekil').map(as => (
            <div
              key={as.id}
              className="flex items-center justify-between p-2.5 bg-background text-foreground rounded-lg border border-border cursor-pointer hover:border-primary/40 group transition-colors"
            >
              <div className="flex items-center gap-2.5 overflow-hidden">
                <UserCheck className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
                <div className="overflow-hidden">
                  <p className="text-xs font-semibold truncate">{as.employerRep?.fullName}</p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-border text-muted-foreground bg-muted/50">
                      VEKİL
                    </Badge>
                    {as.documents && as.documents.length > 0 && (
                      <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 tabular-nums">
                        {as.documents.length} DOKÜMAN
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0 ml-2">
                <FileText
                  className={cn("w-3.5 h-3.5 transition-opacity hover:text-primary", as.documents && as.documents.length > 0 ? "text-primary opacity-100" : "text-muted-foreground opacity-0 group-hover:opacity-100")}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedAssignmentId(as.id);
                    setSelectedAssignmentName(as.employerRep?.fullName || '');
                    setDocumentModalOpen(true);
                  }}
                />
                <Edit2
                  className="w-3.5 h-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity hover:text-primary"
                  onClick={(e) => { e.stopPropagation(); openManageModal('Vekil'); }}
                />
              </div>
            </div>
          ))}
          {activeAssignments.filter(a => a.type === 'Vekil').length === 0 && (
            <div
              className="flex items-center gap-2.5 p-2.5 bg-muted/30 rounded-lg border border-dashed border-border cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => openAssignModal('Vekil')}
            >
              <UserPlus className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="text-xs font-medium text-muted-foreground">Vekil Ata</span>
            </div>
          )}
        </div>

        <div className="flex gap-2 w-full md:w-auto shrink-0 justify-end md:pl-5 md:border-l border-border">
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5"
            onClick={() => openAssignModal('Vekil')}
          >
            <Plus className="w-3.5 h-3.5" /> Ekle
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="h-8 px-3 rounded-lg text-xs font-medium gap-1.5"
            onClick={() => openManageModal('Vekil')}
          >
            <Edit2 className="w-3.5 h-3.5" /> Yönet
          </Button>
        </div>
      </Card>

      {/* Activity Logs & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Logs */}
        <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <Activity className="w-3.5 h-3.5 text-primary" />
              Aktivite Geçmişi & Loglar
            </CardTitle>
          </CardHeader>
          <div className="max-h-[420px] overflow-y-auto">
            <div className="p-2">
              {facility.activityLogs?.length > 0 ? facility.activityLogs.map((log: ActivityLog, idx: number) => (
                <div key={idx} className="flex gap-3 p-3 hover:bg-muted/40 transition-colors rounded-lg">
                  <div className="relative shrink-0">
                    <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center z-10 relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                    {idx < facility.activityLogs.length - 1 && (
                      <div className="absolute top-6 left-3 w-px h-full bg-border -z-0" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <span className="text-xs font-semibold text-foreground truncate">{log.action}</span>
                      <span className="text-[10px] text-muted-foreground shrink-0 tabular-nums">{new Date(log.createdAt).toLocaleString('tr-TR')}</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed mb-1">{log.details}</p>
                    <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground">
                      <UserCheck className="w-3 h-3" />
                      {log.username}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-14 text-center">
                  <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                  <p className="text-xs text-muted-foreground">Henüz bir aktivite kaydı bulunmuyor.</p>
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Employee History List */}
        <Card className="border border-border shadow-xs rounded-lg bg-card text-card-foreground overflow-hidden">
          <CardHeader className="py-3 px-4 border-b border-border bg-muted/30">
            <CardTitle className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              Çalışan Sayısı Geçmişi
            </CardTitle>
          </CardHeader>
          <div className="p-4">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border">
                  <th className="pb-2.5 text-[11px] font-semibold text-muted-foreground">Dönem</th>
                  <th className="pb-2.5 text-[11px] font-semibold text-muted-foreground text-center">Çalışan</th>
                  <th className="pb-2.5 text-[11px] font-semibold text-muted-foreground text-right">Değişim</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {facility.employeeCountHistory?.length > 0 ? facility.employeeCountHistory.map((h: EmployeeCountHistory, idx: number) => {
                  const prev = facility.employeeCountHistory[idx + 1];
                  const delta = prev && prev.count > 0 ? Math.round(((h.count - prev.count) / prev.count) * 100) : null;
                  return (
                    <tr key={idx} className="hover:bg-muted/30 transition-colors">
                      <td className="py-2.5 text-xs font-medium text-muted-foreground tabular-nums">
                        {new Date(h.effectiveDate).toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' })}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className="text-xs font-semibold text-foreground tabular-nums">{h.count}</span>
                      </td>
                      <td className="py-2.5 text-right">
                        {delta === null ? (
                          <span className="text-[11px] text-muted-foreground">—</span>
                        ) : (
                          <Badge
                            variant="outline"
                            className={cn(
                              "text-[10px] font-semibold h-5 px-1.5 tabular-nums",
                              delta > 0
                                ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                : delta < 0
                                  ? "bg-destructive/10 text-destructive border-destructive/20"
                                  : "bg-muted text-muted-foreground border-border"
                            )}
                          >
                            {delta > 0 ? `+${delta}%` : `${delta}%`}
                          </Badge>
                        )}
                      </td>
                    </tr>
                  );
                }) : (
                  <tr>
                    <td colSpan={3} className="py-10 text-center text-xs text-muted-foreground">
                      Kayıtlı geçmiş verisi bulunmuyor.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <QuickAssignModal
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        facility={facility}
        type={assignType}
      />

      <AssignmentDocumentModal
        open={documentModalOpen}
        onOpenChange={setDocumentModalOpen}
        assignmentId={selectedAssignmentId}
        assignmentName={selectedAssignmentName}
      />

      {/* Manage Assignments Modal */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[86vh] p-0 overflow-hidden rounded-lg border border-border bg-card shadow-lg flex flex-col gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                    Atama Yönetimi
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                    {facility.name} — {assignType} Aktif Atamaları
                  </DialogDescription>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setManageModalOpen(false);
                  openAssignModal(assignType);
                }}
                className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 w-fit shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" /> Yeni Atama Ekle
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 bg-background space-y-4">
            {facility.assignments?.filter(a => a.status === 'Aktif' && a.type === assignType).length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center border border-dashed border-border rounded-lg bg-muted/20">
                <Shield className="w-8 h-8 text-muted-foreground/40 mb-2" />
                <p className="text-sm font-semibold text-foreground">Aktif Atama Bulunamadı</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Bu rol için yeni bir atama eklemek üzere sağ üstteki butonu kullanabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {facility.assignments?.filter(a => a.status === 'Aktif' && a.type === assignType).map(a => (
                  <div key={a.id} className="p-3.5 rounded-lg border border-border bg-card text-card-foreground shadow-xs flex items-center justify-between gap-3 hover:border-primary/40 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-lg bg-muted border border-border flex items-center justify-center text-xs font-bold text-primary shrink-0">
                        {(a.professional?.fullName || a.employerRep?.fullName || '?')[0]}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {a.professional?.fullName || a.employerRep?.fullName}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 mt-1 text-[11px] text-muted-foreground tabular-nums">
                          <span className="inline-flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {a.durationMinutes} dk
                          </span>
                          {a.isFullTime && (
                            <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 text-[9px] font-semibold h-4 px-1.5">
                              Tam Zamanlı
                            </Badge>
                          )}
                          <span className="inline-flex items-center gap-1 border-l border-border pl-2">
                            <Calendar className="w-3 h-3" /> {new Date(a.startDate).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-primary"
                        title="Düzenle"
                        onClick={() => {
                          setEditingAssignment(a);
                          setFormData({
                            professionalId: a.professionalId?.toString() ?? '',
                            employerRepId: a.employerRepId?.toString() ?? '',
                            durationMinutes: a.durationMinutes.toString(),
                            isFullTime: a.isFullTime,
                            startDate: a.startDate ? new Date(a.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
                            endDate: null as string | null,
                            costType: a.costType || 'Aylık Sabit',
                            unitPrice: a.unitPrice?.toString() ?? '',
                          });
                        }}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        title="Sonlandır"
                        onClick={() => setTerminatingAssignmentId(a.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingAssignment && (
              <div className="p-4 rounded-lg border border-primary/20 bg-muted/20 space-y-4">
                <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-border">
                  <h4 className="text-xs font-semibold text-primary flex items-center gap-1.5 uppercase tracking-wider">
                    <Edit2 className="w-3.5 h-3.5" /> Atama Güncelleme
                  </h4>
                  <Badge variant="outline" className="bg-card text-foreground border-border text-xs font-medium">
                    {editingAssignment.professional?.fullName || editingAssignment.employerRep?.fullName}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Süre (Dk/Ay)</label>
                    <Input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                      className="h-9 rounded-lg bg-background border-border text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Başlangıç Tarihi</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="h-9 rounded-lg bg-background border-border text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Bitiş Tarihi</label>
                    <Input
                      type="date"
                      value={formData.endDate ? formData.endDate : ''}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value || null })}
                      className="h-9 rounded-lg bg-background border-border text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Maliyet ve Birim Fiyat</label>
                    <div className="flex gap-2">
                      <Select value={formData.costType} onValueChange={(v) => setFormData({ ...formData, costType: v })}>
                        <SelectTrigger className="w-full h-9 rounded-lg bg-background border-border text-xs flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="rounded-lg">
                          <SelectItem value="Aylık Sabit" className="text-xs">Aylık Sabit</SelectItem>
                          <SelectItem value="Saatlik" className="text-xs">Saatlik</SelectItem>
                        </SelectContent>
                      </Select>
                      <div className="relative w-28 shrink-0">
                        <Input
                          type="number"
                          value={formData.unitPrice}
                          onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                          className="h-9 rounded-lg bg-background border-border pl-6 text-xs tabular-nums"
                          placeholder="0"
                        />
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-medium text-muted-foreground">₺</span>
                      </div>
                    </div>
                  </div>
                  <div className="sm:col-span-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card rounded-lg border border-border">
                    <div className="flex items-center gap-2.5">
                      <button
                        type="button"
                        className={cn(
                          "w-9 h-5 rounded-full relative cursor-pointer transition-colors",
                          formData.isFullTime ? "bg-primary" : "bg-muted-foreground/30"
                        )}
                        onClick={() => {
                          const newFT = !formData.isFullTime;
                          setFormData({ ...formData, isFullTime: newFT, durationMinutes: newFT ? '11700' : formData.durationMinutes });
                        }}
                      >
                        <span className={cn("absolute top-0.5 w-4 h-4 bg-background rounded-full transition-all shadow-xs", formData.isFullTime ? "left-4.5" : "left-0.5")} />
                      </button>
                      <span className="text-xs font-medium text-foreground">Tam Zamanlı Atama</span>
                    </div>
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="outline" size="sm" className="h-8 rounded-lg text-xs" onClick={() => setEditingAssignment(null)}>
                        İptal
                      </Button>
                      <Button
                        size="sm"
                        className="h-8 px-4 rounded-lg text-xs font-semibold"
                        disabled={updateMutation.isPending}
                        onClick={() => {
                          updateMutation.mutate({
                            id: editingAssignment.id,
                            data: {
                              durationMinutes: parseInt(formData.durationMinutes),
                              isFullTime: formData.isFullTime,
                              costType: formData.costType,
                              unitPrice: formData.unitPrice === '' ? null : parseFloat(formData.unitPrice),
                              startDate: formData.startDate,
                              endDate: formData.endDate || null,
                            }
                          });
                        }}
                      >
                        {updateMutation.isPending && <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />}
                        Değişiklikleri Kaydet
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3 bg-muted/30 border-t border-border shrink-0 sm:justify-between items-center">
            <p className="text-[11px] text-muted-foreground">
              Atama detaylarını düzenlemek için ilgili kaydın yanındaki düzenle butonunu kullanın.
            </p>
            <Button variant="outline" size="sm" onClick={() => setManageModalOpen(false)} className="h-8 rounded-lg text-xs">
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Termination Dialog */}
      <Dialog open={terminatingAssignmentId !== null} onOpenChange={(v) => !v && setTerminatingAssignmentId(null)}>
        <DialogContent className="sm:max-w-md w-[95vw] p-0 overflow-hidden rounded-lg border border-border bg-card shadow-lg flex flex-col gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">
                  Atamayı Sonlandır
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Bu işlem geri alınamaz. Lütfen bitiş tarihini seçin.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-5 space-y-4 bg-card text-card-foreground">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Bitiş Tarihi *</label>
              <Input
                type="date"
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
                required
                className="h-9 rounded-lg border-border text-xs tabular-nums"
              />
            </div>

            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
              <p className="text-[11px] text-destructive leading-relaxed">
                Atama sonlandırıldığında ilgili profesyonelin bu tesisteki kapasitesi serbest kalacaktır.
              </p>
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-muted/30 border-t border-border shrink-0 gap-2 sm:gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setTerminatingAssignmentId(null)}
              className="h-8 rounded-lg text-xs"
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              size="sm"
              className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5"
              onClick={() => terminatingAssignmentId && terminateMutation.mutate({ id: terminatingAssignmentId, endDate: terminationDate })}
              disabled={terminateMutation.isPending}
            >
              {terminateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <XCircle className="w-3.5 h-3.5" />}
              Atamayı Sonlandır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PanelFacilityLifeCardPage;
