import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
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
import {
  Search, Shield, AlertTriangle, Loader2, CheckCircle2, 
  XCircle, UserPlus, Building2, Users, ArrowRight, Info,
  Calendar, Clock, CreditCard, MoreVertical, Trash2, Edit2, History
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
  status: string;
  costType: string;
  unitPrice: number | null;
  professional?: Professional;
  employerRep?: EmployerRepresentative;
  professionalId?: number;
  employerRepId?: number;
}
export default function AssignmentsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'missing' | 'compliant' | 'none'>('missing');
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [manageModalOpen, setManageModalOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<FacilityCompliance | null>(null);
  const [assignType, setAssignType] = useState<'IGU' | 'Hekim' | 'DSP' | 'Vekil'>('IGU');
  const location = useLocation();
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [terminatingAssignmentId, setTerminatingAssignmentId] = useState<number | null>(null);
  const [terminationDate, setTerminationDate] = useState(new Date().toISOString().split('T')[0]);

  useEffect(() => {
    if (location.state?.facilityId) {
      setSearch(location.state.facilityId);
      // Determine tab based on facility's likely state or just show it
      // For simplicity, we can clear the tab filter if searching by ID, 
      // but the current structure depends on tabs.
      // Let's find which tab this facility belongs to after data loads.
    }
  }, [location.state]);

  // Form State
  const [formData, setFormData] = useState({
    professionalId: '',
    employerRepId: '',
    durationMinutes: '',
    isFullTime: false,
    startDate: new Date().toISOString().split('T')[0],
    costType: 'Aylık Sabit',
    unitPrice: '',
  });

  const { data: facilities = [], isLoading } = useQuery<FacilityCompliance[]>({
    queryKey: ['assignments-status'],
    queryFn: async () => {
      const res = await api.get('/panel/assignments/compliance-status');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });
  
  const { data: activeAssignments = [], refetch: refetchActiveAssignments } = useQuery<Assignment[]>({
    queryKey: ['assignments', selectedFacility?.facilityId, assignType],
    queryFn: async () => {
      if (!selectedFacility) return [];
      const res = await api.get(`/panel/assignments?facilityId=${selectedFacility.facilityId}&status=Aktif`);
      if (!res.ok) throw new Error('Yüklenemedi');
      const all = await res.json();
      return all.filter((a: any) => a.type === assignType);
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
    mutationFn: async (data: any) => {
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
    onError: (error) => {
      toast.error(error.message);
    }
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const res = await api.put(`/panel/assignments/${id}`, data);
      if (!res.ok) throw new Error('Güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments-status'] });
      refetchActiveAssignments();
      toast.success('Atama güncellendi');
      setEditingAssignment(null);
    }
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

  const openAssignModal = (facility: FacilityCompliance, type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setSelectedFacility(facility);
    setAssignType(type);
    
    // Default duration calculation based on type and facility info
    let duration = 0;
    if (type === 'IGU') duration = facility.igu.requiredMinutes - facility.igu.assignedMinutes;
    else if (type === 'Hekim') duration = facility.hekim.requiredMinutes - facility.hekim.assignedMinutes;
    else if (type === 'DSP') duration = 0; // DSP calculation is more specific
    else if (type === 'Vekil') duration = 11700; // Vekiller usually full-time

    setFormData(prev => ({
      ...prev,
      durationMinutes: Math.max(0, duration).toString(),
      isFullTime: type === 'Vekil' || (type === 'IGU' ? (facility.igu.isFullTimeRequired && facility.igu.assignedMinutes === 0) : type === 'Hekim' ? (facility.hekim.isFullTimeRequired && facility.hekim.assignedMinutes === 0) : false)
    }));
    
    setAssignModalOpen(true);
  };

  const openManageModal = (facility: FacilityCompliance, type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setSelectedFacility(facility);
    setAssignType(type);
    setManageModalOpen(true);
  };

  const filtered = facilities.filter(f => {
    const matchesSearch = f.facilityName.toLowerCase().includes(search.toLowerCase()) || 
                          f.facilityId.toLowerCase().includes(search.toLowerCase());
    
    // If we have a specific search (like from navigation), ignore tab filter to ensure we see the result
    if (location.state?.facilityId && search === location.state.facilityId) {
      return matchesSearch;
    }
    
    const matchesTab = f.category === activeTab;
    return matchesSearch && matchesTab;
  });

  const StatusBadge = ({ type, compliance, facility }: { 
    type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil', 
    compliance: any,
    facility: FacilityCompliance
  }) => {
    const isCompliant = type === 'DSP' || type === 'Vekil' ? compliance.assigned : compliance.isCompliant;
    const isRequired = type === 'DSP' ? compliance.required : type === 'Vekil' ? true : true;

    if (!isRequired) return (
      <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 opacity-50">
        <Shield className="w-3.5 h-3.5 text-slate-400" />
        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{type}: Gerekli Değil</span>
      </div>
    );

    return (
      <div 
        className={cn(
          "flex items-center justify-between gap-3 px-3 py-2 rounded-xl border transition-all cursor-pointer group",
          isCompliant 
            ? "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-100 dark:border-emerald-900/20 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100/50" 
            : "bg-rose-50 dark:bg-rose-900/10 border-rose-100 dark:border-rose-900/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100/50"
        )}
        onClick={() => {
          if (isCompliant || compliance.assigned) {
            openManageModal(facility, type);
          } else {
            openAssignModal(facility, type);
          }
        }}
      >
        <div className="flex items-center gap-2">
          {isCompliant ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
          <div className="flex flex-col">
            <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
            <span className="text-[9px] font-medium opacity-70">
              {type === 'DSP' || type === 'Vekil' ? (compliance.assigned ? 'Atanmış' : 'Eksik') : 
               compliance.assignedMinutes > compliance.requiredMinutes ? 
               `${compliance.assignedMinutes} / ${compliance.requiredMinutes} dk (+${compliance.assignedMinutes - compliance.requiredMinutes} dk fazla)` :
               `${compliance.assignedMinutes} / ${compliance.requiredMinutes} dk`
              }
            </span>
          </div>
        </div>
        {!isCompliant && (
          <div className="w-6 h-6 rounded-lg bg-rose-500 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <UserPlus className="w-3.5 h-3.5" />
          </div>
        )}
      </div>
    );
  };

  const FacilityCard = ({ f }: { f: FacilityCompliance }) => (
    <Card className="border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all duration-300 group">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-primary rounded-xl flex items-center justify-center border border-slate-100 dark:border-slate-800 group-hover:scale-110 transition-transform">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 
                className="font-bold text-slate-900 dark:text-white text-base mb-1 cursor-pointer hover:text-primary transition-colors"
                onClick={() => navigate(`/panel/facilities/${f.facilityId}`)}
              >
                {f.facilityName}
              </h3>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className={cn(
                  "text-[9px] font-bold tracking-wide py-0",
                  f.dangerClass === 'Çok Tehlikeli' ? "border-rose-200 text-rose-600 bg-rose-50" : 
                  f.dangerClass === 'Tehlikeli' ? "border-amber-200 text-amber-600 bg-amber-50" : 
                  "border-emerald-200 text-emerald-600 bg-emerald-50"
                )}>
                  {f.dangerClass}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] font-bold text-slate-400 ml-2">
                  <Users className="w-3 h-3" />
                  {f.employeeCount} Çalışan
                </div>
              </div>
            </div>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-xl hover:bg-primary/5 hover:text-primary"
            onClick={() => navigate(`/panel/facilities/${f.facilityId}`)}
          >
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <StatusBadge type="IGU" compliance={f.igu} facility={f} />
          <StatusBadge type="Hekim" compliance={f.hekim} facility={f} />
          <StatusBadge type="DSP" compliance={f.dsp} facility={f} />
          <StatusBadge type="Vekil" compliance={f.vekil} facility={f} />
        </div>

        <div className="mt-6 pt-6 border-t border-slate-50 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {f.overallCompliant ? (
              <Badge className="bg-emerald-500/10 text-emerald-600 border-none text-[9px] font-bold px-2">TAM UYGUN</Badge>
            ) : (
              <Badge className="bg-rose-500/10 text-rose-600 border-none text-[9px] font-bold px-2">EKSİK ATAMA</Badge>
            )}
          </div>
          <span className="text-[10px] font-bold text-slate-400 tracking-wider">
            {f.assignmentsCount} AKTİF ATAMA
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
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Atama Yönetimi</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Tesislerin İSG uzmanı, hekim ve sağlık personeli uyumluluğunu takip edin.</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-1 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4">
            <TabsList className="bg-slate-50/50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-800 shrink-0">
              <TabsTrigger value="missing" className="rounded-lg px-6 font-bold text-[10px] tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
                EKSİK OLANLAR
              </TabsTrigger>
              <TabsTrigger value="compliant" className="rounded-lg px-6 font-bold text-[10px] tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
                TAM UYGUNLAR
              </TabsTrigger>
              <TabsTrigger value="none" className="rounded-lg px-6 font-bold text-[10px] tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
                HİÇ ATANMAMIŞLAR
              </TabsTrigger>
            </TabsList>

            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Tesis adı veya ID ile ara..."
                className="pl-9 h-10 bg-slate-50/50 border-slate-100 rounded-xl text-xs font-medium focus-visible:ring-primary/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>

          <TabsContent value={activeTab} className="p-4 pt-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <div key={i} className="h-64 bg-slate-50 dark:bg-slate-800/50 rounded-2xl animate-pulse" />
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="text-center py-20 bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
                <Shield className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                <p className="text-slate-400 font-semibold text-xs tracking-wide">Bu kategoride tesis bulunamadı</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filtered.map(f => <FacilityCard key={f.facilityId} f={f} />)}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Assignment Modal */}
      <Dialog open={assignModalOpen} onOpenChange={setAssignModalOpen}>
        <DialogContent className="sm:max-w-[600px] w-[95vw] max-h-[90vh] p-0 overflow-hidden border-none shadow-2xl rounded-3xl flex flex-col">
          <DialogHeader className="px-8 py-6 bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">Hızlı Atama Yap</DialogTitle>
                <DialogDescription className="text-white/40 text-xs mt-1">
                  {selectedFacility?.facilityName} için {assignType} ataması
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col overflow-hidden bg-white dark:bg-slate-900">
            <div className="flex-1 overflow-y-auto p-8 space-y-6 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">
                    {assignType === 'Vekil' ? 'İşveren Vekili Seçin *' : 'Profesyonel Seçin *'}
                  </label>
                  <Select 
                    value={assignType === 'Vekil' ? formData.employerRepId : formData.professionalId} 
                    onValueChange={(v) => setFormData({ ...formData, [assignType === 'Vekil' ? 'employerRepId' : 'professionalId']: v })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-100 h-11 text-sm font-medium focus:ring-primary/10">
                      <SelectValue placeholder={assignType === 'Vekil' ? 'Vekil Listesi' : 'Uzman / Hekim Listesi'} />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      {assignType === 'Vekil' 
                        ? employerReps.map(r => (
                            <SelectItem key={r.id} value={r.id.toString()} className="text-xs font-medium">
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
                              <SelectItem key={p.id} value={p.id.toString()} className="text-xs font-medium">
                                {p.fullName} ({p.titleClass})
                              </SelectItem>
                            ))
                      }
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Süre (Dk/Ay) *</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="number" 
                      value={formData.durationMinutes} 
                      onChange={(e) => setFormData({ ...formData, durationMinutes: e.target.value })}
                      required
                      className="pl-10 rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Başlangıç Tarihi *</label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="date" 
                      value={formData.startDate} 
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      required
                      className="pl-10 rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Maliyet Tipi</label>
                  <Select 
                    value={formData.costType} 
                    onValueChange={(v) => setFormData({ ...formData, costType: v })}
                  >
                    <SelectTrigger className="rounded-xl border-slate-100 h-11 text-sm font-medium focus:ring-primary/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="Aylık Sabit" className="text-xs font-medium">Aylık Sabit</SelectItem>
                      <SelectItem value="Saatlik" className="text-xs font-medium">Saatlik</SelectItem>
                      <SelectItem value="Çalışan Başı" className="text-xs font-medium">Çalışan Başı</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1 uppercase">Birim Fiyat (₺)</label>
                  <div className="relative">
                    <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input 
                      type="number" 
                      value={formData.unitPrice} 
                      onChange={(e) => setFormData({ ...formData, unitPrice: e.target.value })}
                      className="pl-10 rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10"
                    />
                  </div>
                </div>

                <div className="md:col-span-2 flex items-center gap-4 p-5 bg-primary/[0.02] dark:bg-primary/[0.01] rounded-2xl border border-primary/10">
                  <div 
                    className={cn(
                      "w-12 h-6 rounded-full relative cursor-pointer transition-colors shadow-inner",
                      formData.isFullTime ? "bg-primary" : "bg-slate-200 dark:bg-slate-800"
                    )}
                    onClick={() => {
                      const newFT = !formData.isFullTime;
                      setFormData({ 
                        ...formData, 
                        isFullTime: newFT,
                        durationMinutes: newFT ? '11700' : formData.durationMinutes
                      });
                    }}
                  >
                    <div className={cn(
                      "absolute top-1 w-4 h-4 bg-white rounded-full transition-all shadow-sm",
                      formData.isFullTime ? "left-7" : "left-1"
                    )} />
                  </div>
                  <div className="flex flex-col">
                    <span className="text-[11px] font-bold text-slate-700 dark:text-slate-200 tracking-wide uppercase">TAM ZAMANLI ATAMA</span>
                    <span className="text-[10px] text-slate-500 font-medium tracking-tight">Aylık yasal sınır (11700 dk) otomatik uygulanır.</span>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex flex-col gap-2">
                <div className="flex gap-3">
                  <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                    Atama yapılmadan önce personelin kalan kapasitesi sistem tarafından kontrol edilecektir. Kapasite yetersizse işlem reddedilir.
                  </p>
                </div>
                {parseInt(formData.durationMinutes) > 11700 && (
                  <div className="flex gap-3 mt-1">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <p className="text-[11px] text-rose-700 dark:text-rose-400 font-bold leading-relaxed">
                      UYARI: Girilen süre aylık yasal sınır olan 11700 dakikayı aşmaktadır!
                    </p>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="px-8 py-6 bg-slate-50 dark:bg-slate-900/50 border-t border-slate-100 dark:border-slate-800 shrink-0 gap-3">
              <Button type="button" variant="ghost" onClick={() => setAssignModalOpen(false)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400 hover:text-slate-600 transition-colors">Vazgeç</Button>
              <Button 
                type="submit" 
                disabled={assignMutation.isPending || (assignType === 'Vekil' ? !formData.employerRepId : !formData.professionalId)} 
                className="rounded-xl h-11 px-10 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-xl text-white transition-all active:scale-95"
              >
                {assignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Atamayı Tamamla
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

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
                  {selectedFacility?.facilityName} • {assignType} Aktif Atamaları
                </DialogDescription>
              </div>
            </div>
            <Button 
              onClick={() => {
                setManageModalOpen(false);
                if (selectedFacility) openAssignModal(selectedFacility, assignType);
              }}
              className="bg-white hover:bg-slate-100 text-slate-900 rounded-xl h-10 px-6 text-[11px] font-bold shadow-lg transition-all active:scale-95"
            >
              <UserPlus className="w-4 h-4 mr-2" /> Yeni Atama Ekle
            </Button>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto p-8 bg-white dark:bg-slate-950 custom-scrollbar">
            {activeAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 opacity-20">
                <Shield className="w-16 h-16 mb-4" />
                <p className="text-sm font-bold tracking-widest">AKTİF ATAMA BULUNAMADI</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {activeAssignments.map(a => (
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
                          <SelectItem value="Aylık Sabit" className="text-xs font-medium">Aylık Sabit</SelectItem>
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
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="px-8 py-6 bg-rose-600 text-white">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <XCircle className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">Atamayı Sonlandır</DialogTitle>
                <DialogDescription className="text-white/60 text-xs mt-1">
                  Atamanın bitiş tarihini seçin.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <div className="p-8 space-y-6 bg-white dark:bg-slate-900">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">BİTİŞ TARİHİ *</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  type="date" 
                  value={terminationDate} 
                  onChange={(e) => setTerminationDate(e.target.value)}
                  required
                  className="pl-10 rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10"
                />
              </div>
            </div>
            <DialogFooter className="gap-3 pt-2">
              <Button variant="ghost" onClick={() => setTerminatingAssignmentId(null)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400">Vazgeç</Button>
              <Button 
                variant="destructive"
                className="rounded-xl h-11 px-8 font-bold text-xs shadow-lg"
                onClick={() => terminatingAssignmentId && terminateMutation.mutate({ id: terminatingAssignmentId, endDate: terminationDate })}
                disabled={terminateMutation.isPending}
              >
                {terminateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <XCircle className="w-4 h-4 mr-2" />}
                Sonlandır
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
