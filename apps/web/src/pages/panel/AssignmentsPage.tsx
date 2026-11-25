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
  const dangerFilter = searchParams.get('danger') || 'all';

  const updateSearchParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== '' && value !== 'all' && (key !== 'tab' || value !== 'missing')) {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = (val: string) => updateSearchParam('q', val);
  const setActiveTab = (val: 'missing' | 'compliant' | 'none') => updateSearchParam('tab', val);
  const setDangerFilter = (val: string) => updateSearchParam('danger', val);

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
    const q = search.toLocaleLowerCase('tr-TR').trim();
    return facilities.filter((f) => {
      const matchesSearch =
        !q ||
        f.facilityName.toLocaleLowerCase('tr-TR').includes(q) ||
        f.facilityId.toLocaleLowerCase('tr-TR').includes(q);
      const matchesDanger = dangerFilter === 'all' || f.dangerClass === dangerFilter;

      let matchesTab = true;
      if (activeTab === 'missing') matchesTab = f.category === 'missing';
      else if (activeTab === 'compliant') matchesTab = f.category === 'compliant';
      else if (activeTab === 'none') matchesTab = f.category === 'none';

      return matchesSearch && matchesDanger && matchesTab;
    });
  }, [facilities, search, dangerFilter, activeTab]);

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
    <Card className="rounded-lg border border-border bg-card shadow-xs hover:border-primary/50 transition-all duration-200 group flex flex-col justify-between">
      <CardContent className="p-3.5 space-y-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg flex items-center justify-center border border-primary/20 shrink-0">
              <Building2 className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <h3
                className="font-semibold text-foreground text-xs line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate(`/panel/facilities/${f.facilityId}`)}
              >
                {f.facilityName}
              </h3>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className={cn(
                  "text-[9px] font-semibold py-0 h-4 px-1.5",
                  f.dangerClass === 'Çok Tehlikeli' ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" :
                    f.dangerClass === 'Tehlikeli' ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" :
                      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                )}>
                  {f.dangerClass}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground tabular-nums">
                  <Users className="w-3 h-3" />
                  {f.employeeCount}
                </div>
              </div>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 shrink-0"
            onClick={() => navigate(`/panel/facilities/${f.facilityId}`)}
            title="Tesis Yaşam Kartı"
          >
            <ArrowRight className="w-3.5 h-3.5" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
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

  const missingCount = useMemo(() => facilities.filter((f) => f.category === 'missing').length, [facilities]);
  const compliantCount = useMemo(() => facilities.filter((f) => f.category === 'compliant').length, [facilities]);
  const noneCount = useMemo(() => facilities.filter((f) => f.category === 'none').length, [facilities]);

  return (
    <div className="space-y-4 pb-10">
      {/* ── COMPACT HEADER ────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-border pb-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              Atama Yönetimi
            </h1>
            <Badge variant="outline" className="h-5 px-2 text-[11px] font-semibold bg-primary/5 text-primary border-primary/20 tabular-nums">
              {facilities.length} Tesis
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tesislerin İSG uzmanı, hekim, DSP ve işveren vekili yasal atama karşılama durumları
          </p>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={() => refetch()}
          disabled={isFetching}
          className="h-8 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1.5 self-start md:self-auto"
          title="Yenile"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
          <span>Yenile</span>
        </Button>
      </div>

      {/* ── COMPACT TAB & SMART FILTER BAR ────────────────────────────────── */}
      <div className="rounded-lg border border-border bg-card p-3 shadow-xs space-y-2">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-2">
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-fit">
            <TabsList className="h-8 p-0.5 bg-muted/60 border border-border rounded-lg">
              <TabsTrigger value="missing" className="rounded-md text-xs font-medium px-2.5 gap-1.5 tabular-nums">
                <AlertTriangle className="w-3 h-3 text-destructive" />
                Eksik ({missingCount})
              </TabsTrigger>
              <TabsTrigger value="compliant" className="rounded-md text-xs font-medium px-2.5 gap-1.5 tabular-nums">
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Uygun ({compliantCount})
              </TabsTrigger>
              <TabsTrigger value="none" className="rounded-md text-xs font-medium px-2.5 gap-1.5 tabular-nums">
                <Shield className="w-3 h-3 text-muted-foreground" />
                Atamasız ({noneCount})
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
            <div className="min-w-[140px]">
              <Select value={dangerFilter} onValueChange={setDangerFilter}>
                <SelectTrigger size="sm" className="h-8 w-full rounded-lg bg-background border-border text-xs font-medium">
                  <span className="truncate">{dangerFilter === 'all' ? 'Tüm Sınıflar' : dangerFilter}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sınıflar</SelectItem>
                  <SelectItem value="Çok Tehlikeli">Çok Tehlikeli</SelectItem>
                  <SelectItem value="Tehlikeli">Tehlikeli</SelectItem>
                  <SelectItem value="Az Tehlikeli">Az Tehlikeli</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="relative flex-1 min-w-[200px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Tesis adı veya ID ile ara..."
                className="pl-8 pr-7 h-8 text-xs rounded-lg bg-background border-border"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                  title="Temizle"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-[11px] text-muted-foreground pt-1 border-t border-border/40 tabular-nums">
          <span>Toplam <strong>{filtered.length}</strong> tesis listeleniyor</span>
          {(search || dangerFilter !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearch('');
                setDangerFilter('all');
              }}
              className="text-primary hover:underline font-medium"
            >
              Filtreleri temizle
            </button>
          )}
        </div>
      </div>

      {/* ── CONTENT AREA ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="rounded-lg border-border p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Skeleton className="w-9 h-9 rounded-lg" />
                <div className="space-y-1.5 flex-1">
                  <Skeleton className="h-4 w-32 rounded-md" />
                  <Skeleton className="h-3 w-20 rounded-md" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {[1, 2, 3, 4].map(j => <Skeleton key={j} className="h-9 rounded-lg" />)}
              </div>
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 rounded-lg border border-dashed border-border bg-card/40 space-y-2">
          <Shield className="w-9 h-9 text-muted-foreground/40 mx-auto" />
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
        <DialogContent className="sm:max-w-lg w-[95vw] max-h-[90vh] rounded-lg border border-border bg-card p-0 overflow-hidden shadow-lg flex flex-col gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                <UserPlus className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">Hızlı Atama Yap</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                  {selectedFacility?.facilityName} — {assignType} ataması
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-foreground">
                  {assignType === 'Vekil' ? 'İşveren Vekili Seçin *' : 'İSG Profesyoneli Seçin *'}
                </label>
                <Select
                  value={assignType === 'Vekil' ? formData.employerRepId : formData.professionalId}
                  onValueChange={(v) => setFormData({ ...formData, [assignType === 'Vekil' ? 'employerRepId' : 'professionalId']: v })}
                >
                  <SelectTrigger className="w-full h-9 rounded-lg border-border text-xs">
                    <SelectValue placeholder={assignType === 'Vekil' ? 'Vekil Listesi' : 'Uzman / Hekim Listesi'} />
                  </SelectTrigger>
                  <SelectContent className="max-h-[220px] rounded-lg">
                    {assignType === 'Vekil'
                      ? employerReps.map(r => (
                        <SelectItem key={r.id} value={r.id.toString()} className="text-xs">
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
                          <SelectItem key={p.id} value={p.id.toString()} className="text-xs">
                            {p.fullName} ({p.titleClass})
                          </SelectItem>
                        ))
                    }
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Süre (Dk/Ay) *</label>
                  <Input
                    type="number"
                    value={formData.durationMinutes}
                    onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                    required
                    className="h-9 rounded-lg text-xs tabular-nums"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Başlangıç Tarihi *</label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                    className="h-9 rounded-lg text-xs tabular-nums"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Maliyet Tipi</label>
                  <Select
                    value={formData.costType as string}
                    onValueChange={(v) => setFormData({ ...formData, costType: v })}
                  >
                    <SelectTrigger className="w-full h-9 rounded-lg border-border text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent className="rounded-lg">
                      <SelectItem value="Aylık Sabit" className="text-xs">Aylık Sabit</SelectItem>
                      <SelectItem value="Saatlik" className="text-xs">Saatlik</SelectItem>
                      <SelectItem value="Çalışan Başı" className="text-xs">Çalışan Başı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Birim Fiyat (₺)</label>
                  <Input
                    type="number"
                    value={formData.unitPrice}
                    onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                    className="h-9 rounded-lg text-xs tabular-nums"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2.5 p-3 bg-muted/30 rounded-lg border border-border">
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
            </div>

            <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-muted/30 border-t border-border shrink-0 gap-2 sm:gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setAssignModalOpen(false)} className="h-8 rounded-lg text-xs">
                Vazgeç
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={assignMutation.isPending || (assignType === 'Vekil' ? !formData.employerRepId : !formData.professionalId)}
                className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5"
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
        <DialogContent className="sm:max-w-3xl w-[95vw] max-h-[86vh] p-0 overflow-hidden rounded-lg border border-border bg-card flex flex-col shadow-lg gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pr-8">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
                  <History className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <DialogTitle className="text-base font-semibold tracking-tight text-foreground">Atama Yönetimi</DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground truncate mt-0.5">
                    {selectedFacility?.facilityName} — {assignType} Aktif Atamaları
                  </DialogDescription>
                </div>
              </div>
              <Button
                size="sm"
                onClick={() => {
                  setManageModalOpen(false);
                  if (selectedFacility) openAssignModal(selectedFacility, assignType);
                }}
                className="h-8 px-3 rounded-lg text-xs font-semibold gap-1.5 w-fit shrink-0"
              >
                <UserPlus className="w-3.5 h-3.5" /> Yeni Atama
              </Button>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {activeAssignments.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground space-y-1.5 border border-dashed border-border rounded-lg bg-muted/20">
                <Shield className="w-8 h-8 opacity-40 mx-auto" />
                <p className="text-sm font-semibold text-foreground">Aktif Atama Bulunamadı</p>
                <p className="text-xs">Bu tesis ve rol için kayıtlı aktif atama bulunmuyor.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {activeAssignments.map(a => (
                  <div key={a.id} className="p-3.5 rounded-lg border border-border bg-card shadow-xs flex items-center justify-between gap-3 group hover:border-primary/40 transition-colors">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-foreground truncate">
                        {a.professional?.fullName || a.employerRep?.fullName}
                      </p>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-muted-foreground tabular-nums">
                        <span className="flex items-center gap-1 font-medium text-foreground"><Clock className="w-3 h-3 text-muted-foreground" /> {a.durationMinutes} dk</span>
                        <span>•</span>
                        <span>{new Date(a.startDate).toLocaleDateString('tr-TR')}</span>
                        {a.isFullTime && <Badge variant="secondary" className="h-4 px-1.5 text-[9px]">Tam Zamanlı</Badge>}
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
              <div className="p-4 rounded-lg border border-primary/20 bg-muted/20 space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-border">
                  <span className="text-xs font-semibold text-primary uppercase tracking-wider flex items-center gap-1.5">
                    <Edit2 className="w-3.5 h-3.5" /> Atamayı Düzenle
                  </span>
                  <Badge variant="outline" className="text-xs font-medium bg-card">
                    {editingAssignment.professional?.fullName || editingAssignment.employerRep?.fullName}
                  </Badge>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">Süre (Dk/Ay)</label>
                    <Input
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                      className="h-9 rounded-lg bg-background text-xs tabular-nums"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="font-medium text-foreground">Başlangıç Tarihi</label>
                    <Input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="h-9 rounded-lg bg-background text-xs tabular-nums"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <Button variant="outline" size="sm" onClick={() => setEditingAssignment(null)} className="h-8 rounded-lg text-xs">
                    İptal
                  </Button>
                  <Button
                    size="sm"
                    className="h-8 px-4 rounded-lg text-xs font-semibold"
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

          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3 bg-muted/30 border-t border-border shrink-0">
            <Button variant="outline" size="sm" onClick={() => setManageModalOpen(false)} className="h-8 rounded-lg text-xs">
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── TERMINATION DIALOG ────────────────────────────────────────────── */}
      <Dialog open={terminatingAssignmentId !== null} onOpenChange={(v) => !v && setTerminatingAssignmentId(null)}>
        <DialogContent className="sm:max-w-md w-[95vw] rounded-lg border border-border bg-card p-0 overflow-hidden shadow-lg flex flex-col gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive border border-destructive/20 flex items-center justify-center shrink-0">
                <XCircle className="w-4 h-4" />
              </div>
              <div>
                <DialogTitle className="text-base font-semibold tracking-tight text-foreground">Atamayı Sonlandır</DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                  Atamanın resmi bitiş tarihini seçin.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-5 space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-foreground">Bitiş Tarihi *</label>
              <Input
                type="date"
                value={terminationDate}
                onChange={(e) => setTerminationDate(e.target.value)}
                required
                className="h-9 rounded-lg text-xs tabular-nums"
              />
            </div>
          </div>
          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3.5 bg-muted/30 border-t border-border shrink-0 gap-2 sm:gap-2">
            <Button variant="outline" size="sm" onClick={() => setTerminatingAssignmentId(null)} className="h-8 rounded-lg text-xs">
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => terminatingAssignmentId && terminateMutation.mutate({ id: terminatingAssignmentId, endDate: terminationDate })}
              disabled={terminateMutation.isPending}
              className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5"
            >
              {terminateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Sonlandır
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}