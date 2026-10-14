import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  Tabs, TabsList, TabsTrigger, TabsContent
} from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Search, Shield, AlertTriangle, Loader2, CheckCircle2, 
  XCircle, UserPlus, Building2, Users, ArrowRight, Info,
  Calendar, Clock, CreditCard, Trash2, Edit2, History, X, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ComplianceInfo {
  requiredMinutes: number;
  assignedMinutes: number;
  isCompliant: boolean;
  isFullTimeRequired: boolean;
  summary: string;
}

interface FacilityCompliance {
  facilityId: string;
  facilityName: string;
  dangerClass: string;
  employeeCount: number;
  igu: ComplianceInfo & { hasValidClass: boolean };
  hekim: ComplianceInfo;
  dsp: { required: boolean; assigned: boolean; isCompliant: boolean; summary: string };
  vekil: { assigned: boolean; names: string[]; summary: string };
  overallCompliant: boolean;
  category: 'missing' | 'none' | 'compliant';
  assignmentsCount: number;
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
  endDate?: string | null;
  status: string;
  costType: string;
  unitPrice: number | null;
  professional?: Professional;
  employerRep?: EmployerRepresentative;
  professionalId?: number;
  employerRepId?: number;
}

interface AssignRequest {
  facilityId: string;
  type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil';
  professionalId?: string;
  employerRepId?: string;
  durationMinutes: string;
  isFullTime: boolean;
  startDate: string;
  costType: string;
  unitPrice: string;
}

interface UpdateAssignmentRequest {
  id: number;
  data: {
    durationMinutes: number;
    isFullTime: boolean;
    startDate: string;
    endDate: string | null;
    costType: string;
    unitPrice: number | null;
  };
}

export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL SEARCH PARAMS ─────────────────────────────────────────────────────
  const search = searchParams.get('q') || '';
  const activeTab = (searchParams.get('tab') as 'missing' | 'compliant' | 'none') || 'missing';

  const updateSearchParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== '' && (key !== 'tab' || value !== 'missing')) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = (val: string) => updateSearchParam('q', val);
  const setActiveTab = (val: 'missing' | 'compliant' | 'none') => updateSearchParam('tab', val);

  // ── SCROLL RESTORATION ────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_assignments_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityCompliance | null>(null);
  const [assignType, setAssignType] = useState<'IGU' | 'Hekim' | 'DSP' | 'Vekil'>('IGU');
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [terminatingAssignmentId, setTerminatingAssignmentId] = useState<number | null>(null);
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);

  // Form State
  const [formData, setFormData] = useState<{
    professionalId: string;
    employerRepId: string;
    durationMinutes: string;
    isFullTime: boolean;
    startDate: string;
    endDate: string | null;
    costType: string;
    unitPrice: string;
  }>({
    professionalId: '',
    employerRepId: '',
    durationMinutes: '',
    isFullTime: false,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '', 
    costType: 'Aylık Sabit',
    unitPrice: '',
  });

  const { data: facilities = [], isLoading, refetch, isFetching } = useQuery<FacilityCompliance[]>({
    queryKey: ['assignments-status'],
    queryFn: async () => {
      const res = await api.get('/panel/assignments/compliance-status');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  // Restore scroll
  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_assignments_scrollY');
      if (savedY) {
        const scrollY = parseInt(savedY, 10);
        if (!isNaN(scrollY) && scrollY > 0) {
          requestAnimationFrame(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' });
          });
        }
      }
    }
  }, [isLoading]);
  
  const { data: activeAssignments = [], refetch: refetchActiveAssignments } = useQuery<Assignment[]>({
    queryKey: ['assignments', selectedFacility?.facilityId, assignType],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/panel/assignments?facilityId=${selectedFacility.facilityId}&status=Aktif`);
      if (!res.ok) throw new Error('Yüklenemedi');
      const all = await res.json();
      return all.filter((a: Assignment) => a.type === assignType);
    },
    enabled: !!selectedFacility && manageModalOpen
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

  const assignMutation = useMutation({
    mutationFn: async (data: AssignRequest) => {
      const res = await api.post('/panel/assignments', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Atama yapılamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments-status'] });
      toast.success('Atama başarıyla yapıldı');
      setAssignModalOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(error.message || 'Atama yapılamadı');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: UpdateAssignmentRequest) => {
      const res = await api.put(`/panel/assignments/${id}`, data);
      if (!res.ok) throw new Error('Güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments-status'] });
      refetchActiveAssignments();
      toast.success('Atama güncellendi');
      setEditingAssignment(null);
    },
    onError: (err: any) => toast.error(err.message || 'Güncellenemedi')
  });

  const terminateMutation = useMutation({
    mutationFn: async ({ id, endDate }: { id: number; endDate: string }) => {
      const res = await api.post(`/panel/assignments/${id}/terminate`, { endDate });
      if (!res.ok) throw new Error('Sonlandırılamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments-status'] });
      refetchActiveAssignments();
      toast.success('Atama sonlandırıldı');
      setTerminatingAssignmentId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Sonlandırılamadı')
  });

  const resetForm = () => {
    setFormData({
      professionalId: '',
      employerRepId: '',
      durationMinutes: '',
      isFullTime: false,
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      costType: 'Aylık Sabit',
      unitPrice: '',
    });
  };

  const openAssignModal = (facility: FacilityCompliance, type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setSelectedFacility(facility);
    setAssignType(type);
    
    let duration = 0;
    if (type === 'IGU') duration = facility.igu.requiredMinutes - facility.igu.assignedMinutes;
    else if (type === 'Hekim') duration = facility.hekim.requiredMinutes - facility.hekim.assignedMinutes;
    else if (type === 'DSP') duration = 0;
    else if (type === 'Vekil') duration = 11700;

    setFormData(prev => ({
      ...prev,
      durationMinutes: Math.max(0, duration).toString(),
      isFullTime: duration >= 11700,
      professionalId: '',
      employerRepId: '',
      startDate: new Date().toISOString().split('T')[0],
      endDate: null,
      costType: 'Aylık Sabit',
      unitPrice: '',
    }));
    setAssignModalOpen(true);
  };

  const openManageModal = (facility: FacilityCompliance, type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setSelectedFacility(facility);
    setAssignType(type);
    setEditingAssignment(null);
    setManageModalOpen(true);
  };

  const filtered = useMemo(() => {
    return facilities.filter((f) => {
      const matchesSearch = f.facilityName.toLowerCase().includes(search.toLowerCase()) ||
                            f.facilityId.toLowerCase().includes(search.toLowerCase());
      
      let matchesTab = true;
      if (activeTab === 'missing') matchesTab = f.category === 'missing';
      else if (activeTab === 'compliant') matchesTab = f.category === 'compliant';
      else if (activeTab === 'none') matchesTab = f.category === 'none';

      return matchesSearch && matchesTab;
    });
  }, [facilities, search, activeTab]);

  const StatusBadge = ({ type, compliance, facility }: { type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil', compliance: any, facility: FacilityCompliance }) => {
    let isCompliant = false;
    let isRequired = true;
    let assignedMinutes = 0;
    let requiredMinutes = 0;
    let assigned = false;

    if (type === 'IGU') {
      const comp = compliance as ComplianceInfo & { hasValidClass: boolean };
      isCompliant = comp.isCompliant;
      assignedMinutes = comp.assignedMinutes;
      requiredMinutes = comp.requiredMinutes;
      assigned = comp.assignedMinutes > 0;
    } else if (type === 'Hekim') {
      const comp = compliance as ComplianceInfo;
      isCompliant = comp.isCompliant;
      assignedMinutes = comp.assignedMinutes;
      requiredMinutes = comp.requiredMinutes;
      assigned = comp.assignedMinutes > 0;
    } else if (type === 'DSP') {
      const comp = compliance as { required: boolean; assigned: boolean; isCompliant: boolean; summary: string };
      isCompliant = comp.isCompliant;
      isRequired = comp.required;
      assigned = comp.assigned;
    } else {
      const comp = compliance as { assigned: boolean; names: string[]; summary: string };
      isCompliant = comp.assigned;
      isRequired = true;
      assigned = comp.assigned;
    }

    if (!isRequired) {
      return (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/40 border border-border/50 opacity-60">
          <Shield className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="text-[10px] font-semibold text-muted-foreground uppercase">{type}: Muaf</span>
        </div>
      );
    }

    return (
      <div 
        className={cn(
          "flex items-center justify-between gap-2 px-3 py-2 rounded-lg border transition-all duration-200 cursor-pointer group",
          isCompliant 
            ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/15" 
            : "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400 hover:bg-rose-500/15"
        )}
        onClick={() => {
          if (isCompliant || assigned) {
            openManageModal(facility, type);
          } else {
            openAssignModal(facility, type);
          }
        }}
      >
        <div className="flex items-center gap-2 min-w-0">
          {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5 shrink-0" /> : <AlertTriangle className="w-3.5 h-3.5 shrink-0" />}
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
            <span className="text-[9px] font-medium opacity-80 truncate">
              {type === 'DSP' || type === 'Vekil' ? (assigned ? 'Atanmış' : 'Eksik') : 
               assignedMinutes !== undefined && requiredMinutes !== undefined ?
               `${assignedMinutes} / ${requiredMinutes} dk` : ''}
            </span>
          </div>
        </div>
        {!isCompliant && (
          <div className="w-5 h-5 rounded-md bg-destructive text-destructive-foreground flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
            <UserPlus className="w-3 h-3" />
          </div>
        )}
      </div>
    );
  };

  const FacilityCard = ({ f }: { f: FacilityCompliance }) => (
    <Card className="rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all duration-200 group flex flex-col justify-between">
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20 group-hover:scale-105 transition-transform">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h3 
                className="font-bold text-foreground text-sm line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate(`/panel/facilities/${f.facilityId}`)}
              >
                {f.facilityName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="outline" className={cn(
                  "text-[9px] font-bold tracking-wide py-0",
                  f.dangerClass === 'Çok Tehlikeli' ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" : 
                  f.dangerClass === 'Tehlikeli' ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" : 
                  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                )}>
                  {f.dangerClass}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-semibold text-muted-foreground">
                  <Users className="w-3 h-3" />
                  {f.employeeCount} Çalışan
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="h-8 w-8 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
            onClick={() => navigate(`/panel/facilities/${f.facilityId}`)}
            title="Life Card"
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <StatusBadge type="IGU" compliance={f.igu} facility={f} />
          <StatusBadge type="Hekim" compliance={f.hekim} facility={f} />
          <StatusBadge type="DSP" compliance={f.dsp} facility={f} />
          <StatusBadge type="Vekil" compliance={f.vekil} facility={f} />
        </div>

        <div className="pt-3 border-t border-border/40 flex items-center justify-between text-xs">
          <div>
            {f.overallCompliant ? (
              <Badge variant="outline" className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 text-[10px] font-bold">
                TAM UYGUN
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/20 text-[10px] font-bold">
                EKSİK ATAMA
              </Badge>
            )}
          </div>
          <span className="text-[10px] font-semibold text-muted-foreground">
            {f.assignmentsCount} Aktif Atama
          </span>
        </div>
      </CardContent>
    </Card>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;

    assignMutation.mutate({
      facilityId: selectedFacility.facilityId,
      type: assignType,
      professionalId: assignType !== 'Vekil' ? formData.professionalId : undefined,
      employerRepId: assignType === 'Vekil' ? formData.employerRepId : undefined,
      durationMinutes: formData.durationMinutes,
      isFullTime: formData.isFullTime,
      startDate: formData.startDate,
      costType: formData.costType,
      unitPrice: formData.unitPrice,
    });
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Atama Yönetimi
            </h1>
            <Badge variant="outline" className="h-6 px-2.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20">
              {facilities.length} Tesis İnceleniyor
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Tesislerin İSG uzmanı, hekim, DSP ve işveren vekili yasal atama karşılama durumları.
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-9 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1.5 self-start md:self-auto"
          title="Yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* ── TAB & SEARCH BAR ──────────────────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-fit">
            <TabsList className="h-9 p-1 bg-muted/60 border border-border rounded-lg">
              <TabsTrigger value="missing" className="rounded-md text-xs font-semibold px-3.5 gap-1.5">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                Eksik Olanlar
              </TabsTrigger>
              <TabsTrigger value="compliant" className="rounded-md text-xs font-semibold px-3.5 gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Tam Uygunlar
              </TabsTrigger>
              <TabsTrigger value="none" className="rounded-md text-xs font-semibold px-3.5 gap-1.5">
                <Shield className="w-3 h-3 text-muted-foreground" />
                Hiç Atanmamışlar
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Tesis adı veya ID ile ara..."
              className="pl-9 pr-8 h-9 text-sm rounded-lg bg-background/80 border-border focus-visible:ring-1"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>Toplam <strong>{filtered.length}</strong> tesis listeleniyor</span>
        </div>
      </div>

      {/* ── CONTENT AREA ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="rounded-xl border-border/60 p-5 space-y-4">
              <div className="flex items-center gap-3">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-10 rounded-lg" />)}
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card/40 space-y-2">
          <Shield className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-sm text-foreground">Bu Kategoride Tesis Bulunamadı</p>
          <p className="text-xs text-muted-foreground">Filtre kriterlerine uygun tesis kaydı bulunmuyor.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(f => <FacilityCard key={f.facilityId} f={f} />)}
        </div>
      )}

      {/* ── QUICK ASSIGN MODAL ────────────────────────────────────────────── */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-lg rounded-xl border border-border bg-card p-0 overflow-hidden shadow-lg">
          <DialogHeader className="p-6 bg-muted/40 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <UserPlus className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Hızlı Atama Yap</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  <strong>{selectedFacility?.facilityName}</strong> • {assignType} ataması
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">
                {assignType === 'Vekil' ? 'İşveren Vekili Seçin *' : 'İSG Profesyoneli Seçin *'}
              </label>
              <Select 
                value={assignType === 'Vekil' ? formData.employerRepId : formData.professionalId} 
                onValueChange={(v) => setFormData({ ...formData, [assignType === 'Vekil' ? 'employerRepId' : 'professionalId']: v })}
              >
                <SelectTrigger className="h-9 rounded-lg text-xs font-medium">
                  <SelectValue placeholder={assignType === 'Vekil' ? 'Vekil Listesi' : 'Uzman / Hekim Listesi'} />
                </SelectTrigger>
                <SelectContent className="max-h-[220px]">
                  {assignType === 'Vekil' 
                    ? employerReps.map(r => (
                        <SelectItem key={r.id} value={r.id.toString()}>
                          {r.fullName} ({r.title || 'İşveren Vekili'})
                        </SelectItem>
                      ))
                    : professionals
                        .filter(p => {
                          if (assignType === 'IGU') {
                            const isVeryDangerous = selectedFacility?.dangerClass === 'Çok Tehlikeli';
                            const isFirstAssignment = selectedFacility?.igu?.assignedMinutes === 0;
                            if (isVeryDangerous && isFirstAssignment) {
                              return p.titleClass === 'A Sınıfı IGU';
                            }
                            return p.titleClass.includes('IGU');
                          }
                          if (assignType === 'Hekim') return p.titleClass === 'İşyeri Hekimi';
                          if (assignType === 'DSP') return p.titleClass === 'DSP';
                          return false;
                        })
                        .map(p => (
                          <SelectItem key={p.id} value={p.id.toString()}>
                            {p.fullName} ({p.titleClass})
                          </SelectItem>
                        ))
                  }
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Süre (Dk/Ay) *</label>
                <Input 
                  type="number" 
                  value={formData.durationMinutes} 
                  onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                  required
                  className="h-9 rounded-lg"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Başlangıç Tarihi *</label>
                <Input 
                  type="date" 
                  value={formData.startDate} 
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  required
                  className="h-9 rounded-lg"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Maliyet Tipi</label>
                <Select 
                  value={formData.costType as string} 
                  onValueChange={(v) => setFormData({ ...formData, costType: v })}
                >
                  <SelectTrigger className="h-9 rounded-lg text-xs font-medium"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Aylık Sabit">Aylık Sabit</SelectItem>
                    <SelectItem value="Saatlik">Saatlik</SelectItem>
                    <SelectItem value="Çalışan Başı">Çalışan Başı</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground">Birim Fiyat (₺)</label>
                <Input 
                  type="number" 
                  value={formData.unitPrice} 
                  onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                  className="h-9 rounded-lg"
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 p-3 bg-muted/40 rounded-lg border border-border">
              <input 
                type="checkbox"
                id="isFullTime"
                checked={formData.isFullTime}
                onChange={(e) => {
                  const newFT = e.target.checked;
                  setFormData({ 
                    ...formData, 
                    isFullTime: newFT,
                    durationMinutes: newFT ? '11700' : formData.durationMinutes
                  });
                }}
                className="rounded border-input text-primary focus:ring-primary w-4 h-4"
              />
              <label htmlFor="isFullTime" className="text-xs font-medium text-foreground cursor-pointer">
                Tam Zamanlı Görevlendirme (11.700 dk yasal tavan)
              </label>
            </div>

            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAssignModalOpen(false)} className="rounded-lg">
                Vazgeç
              </Button>
              <Button 
                type="submit" 
                size="sm" 
                disabled={assignMutation.isPending || (assignType === 'Vekil' ? !formData.employerRepId : !formData.professionalId)} 
                className="rounded-lg gap-1.5"
              >
                {assignMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Atamayı Tamamla
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── MANAGE ASSIGNMENTS MODAL ──────────────────────────────────────── */}
      <Dialog open={manageModalOpen} onOpenChange={setManageModalOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[85vh] p-0 overflow-hidden rounded-xl border border-border bg-card flex flex-col shadow-lg">
          <DialogHeader className="p-6 bg-muted/40 border-b border-border flex flex-row items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <History className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-foreground">Atama Yönetimi</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  {selectedFacility?.facilityName} • {assignType} Aktif Atamaları
                </DialogDescription>
              </div>
            </div>
            <Button 
              size="sm"
              onClick={() => {
                setManageModalOpen(false);
                if (selectedFacility) openAssignModal(selectedFacility, assignType);
              }}
              className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" /> Yeni Atama
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {activeAssignments.length === 0 ? (
              <div className="text-center py-16 text-muted-foreground space-y-2">
                <Shield className="w-10 h-10 opacity-40 mx-auto" />
                <p className="text-sm font-semibold text-foreground">Aktif Atama Bulunamadı</p>
                <p className="text-xs">Bu tesis ve rol için kayıtlı aktif atama bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeAssignments.map(a => (
                  <div key={a.id} className="p-4 rounded-xl border border-border bg-card shadow-xs flex items-center justify-between gap-3 group hover:border-primary/30 transition-all">
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-foreground truncate">
                        {a.professional?.fullName || a.employerRep?.fullName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground">
                        <span className="flex items-center gap-1 font-semibold text-foreground"><Clock className="w-3 h-3 text-muted-foreground" /> {a.durationMinutes} Dk</span>
                        <span>•</span>
                        <span>{new Date(a.startDate).toLocaleDateString('tr-TR')}</span>
                        {a.isFullTime && <Badge variant="secondary" className="h-4 px-1 text-[9px]">Tam Zamanlı</Badge>}
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                        onClick={() => {
                          setEditingAssignment(a);
                          setFormData({
                            professionalId: a.professionalId?.toString() || '',
                            employerRepId: a.employerRepId?.toString() || '',
                            durationMinutes: a.durationMinutes.toString(),
                            isFullTime: a.isFullTime,
                            startDate: new Date(a.startDate).toISOString().split('T')[0],
                            endDate: a.endDate ? new Date(a.endDate).toISOString().split('T')[0] : null,
                            costType: a.costType || 'Aylık Sabit',
                            unitPrice: a.unitPrice?.toString() || '',
                          });
                        }}
                        title="Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="h-7 w-7 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setTerminatingAssignmentId(a.id)}
                        title="Sonlandır"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Editing Box */}
            {editingAssignment && (
              <div className="p-5 rounded-xl border border-primary/20 bg-primary/5 space-y-4 animate-fade-in">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-primary uppercase flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Atamayı Düzenle
                  </span>
                  <Badge variant="outline" className="text-xs font-semibold">
                    {editingAssignment.professional?.fullName || editingAssignment.employerRep?.fullName}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Süre (Dk/Ay)</label>
                    <Input 
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                      className="h-8 rounded-lg"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="font-semibold text-foreground">Başlangıç Tarihi</label>
                    <Input 
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({...formData, startDate: e.target.value})}
                      className="h-8 rounded-lg"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setEditingAssignment(null)} className="h-8 rounded-lg text-xs">
                    İptal
                  </Button>
                  <Button 
                    size="sm"
                    className="h-8 rounded-lg text-xs"
                    onClick={() => {
                      updateMutation.mutate({
                        id: editingAssignment.id,
                        data: {
                          durationMinutes: parseInt(formData.durationMinutes) || 0,
                          isFullTime: formData.isFullTime,
                          startDate: formData.startDate,
                          endDate: formData.endDate || null,
                          costType: formData.costType,
                          unitPrice: formData.unitPrice ? parseFloat(formData.unitPrice) : null,
                        }
                      });
                    }}
                  >
                    Güncelle
                  </Button>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* ── TERMINATION DIALOG ────────────────────────────────────────────── */}
      <Dialog open={terminatingAssignmentId !== null} onOpenChange={(v) => !v && setTerminatingAssignmentId(null)}>
        <DialogContent className="sm:max-w-sm rounded-xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <XCircle className="w-5 h-5 text-destructive" /> Atamayı Sonlandır
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Atamanın resmi bitiş tarihini seçin.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-foreground">Bitiş Tarihi *</label>
              <Input 
                type="date" 
                value={terminationDate} 
                onChange={(e) => setTerminationDate(e.target.value)}
                required
                className="h-9 rounded-lg"
              />
            </div>
            <DialogFooter className="pt-2">
              <Button variant="outline" size="sm" onClick={() => setTerminatingAssignmentId(null)} className="rounded-lg">
                Vazgeç
              </Button>
              <Button 
                variant="destructive"
                size="sm"
                onClick={() => terminatingAssignmentId && terminateMutation.mutate({ id: terminatingAssignmentId, endDate: terminationDate })}
                disabled={terminateMutation.isPending}
                className="rounded-lg gap-1.5"
              >
                {terminateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Sonlandır
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}