import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);

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
    mutationFn: async (id: number) => {
      const res = await api.post(`/panel/assignments/${id}/terminate`, {});
      if (!res.ok) throw new Error('Sonlandırılamadı');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['assignments-status'] });
      refetchActiveAssignments();
      toast.success('Atama sonlandırıldı');
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
      isFullTime: type === 'Vekil' || (type === 'IGU' ? facility.igu.isFullTimeRequired : type === 'Hekim' ? facility.hekim.isFullTimeRequired : false)
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
              {type === 'DSP' || type === 'Vekil' ? (compliance.assigned ? 'Atanmış' : 'Eksik') : `${compliance.assignedMinutes} / ${compliance.requiredMinutes} dk`}
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
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="px-8 py-6 bg-slate-900 text-white">
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

          <form onSubmit={handleSubmit} className="p-8 space-y-6 bg-white dark:bg-slate-900">
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">
                  {assignType === 'Vekil' ? 'İŞVEREN VEKİLİ SEÇİN *' : 'PROFESYONEL SEÇİN *'}
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
                            if (assignType === 'IGU') return p.titleClass.includes('IGU');
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
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">SÜRE (DK/AY) *</label>
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
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">BAŞLANGIÇ TARİHİ *</label>
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
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">MALİYET TİPİ</label>
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
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">BİRİM FİYAT (₺)</label>
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

              <div className="col-span-2 flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
                <div 
                  className={cn(
                    "w-10 h-5 rounded-full relative cursor-pointer transition-colors",
                    formData.isFullTime ? "bg-primary" : "bg-slate-300"
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
                    "absolute top-1 w-3 h-3 bg-white rounded-full transition-all",
                    formData.isFullTime ? "left-6" : "left-1"
                  )} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">TAM ZAMANLI ATAMA</span>
                  <span className="text-[10px] text-slate-500 font-medium tracking-tight">Bu personeli tesisin tam zamanlı uzmanı olarak ata.</span>
                </div>
              </div>
            </div>

            <div className="p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl flex gap-3">
              <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-700 dark:text-amber-400 font-medium leading-relaxed">
                Atama yapılmadan önce personelin kalan kapasitesi sistem tarafından kontrol edilecektir. Kapasite yetersizse işlem reddedilir.
              </p>
            </div>

            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setAssignModalOpen(false)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400">Vazgeç</Button>
              <Button 
                type="submit" 
                disabled={assignMutation.isPending || (assignType === 'Vekil' ? !formData.employerRepId : !formData.professionalId)} 
                className="rounded-xl h-11 px-8 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-lg text-white"
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
        <DialogContent className="sm:max-w-[700px] p-0 overflow-hidden border-none shadow-2xl rounded-3xl">
          <DialogHeader className="px-8 py-6 bg-slate-900 text-white flex flex-row items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                <History className="w-5 h-5 text-white/70" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold tracking-tight">Atama Yönetimi</DialogTitle>
                <DialogDescription className="text-white/40 text-xs mt-1">
                  {selectedFacility?.facilityName} - {assignType} Aktif Atamaları
                </DialogDescription>
              </div>
            </div>
            <Button 
              onClick={() => {
                setManageModalOpen(false);
                if (selectedFacility) openAssignModal(selectedFacility, assignType);
              }}
              className="bg-primary hover:bg-primary/90 text-white rounded-xl h-9 px-4 text-xs font-bold"
            >
              <UserPlus className="w-3.5 h-3.5 mr-2" /> Yeni Atama
            </Button>
          </DialogHeader>

          <div className="p-8 bg-white dark:bg-slate-900 min-h-[400px]">
            {activeAssignments.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 opacity-40">
                <Shield className="w-12 h-12 mb-4" />
                <p className="text-sm font-bold">Aktif atama bulunamadı.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {activeAssignments.map(a => (
                  <div key={a.id} className="p-5 rounded-2xl border border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 flex items-center justify-center font-bold text-primary">
                        {(a.professional?.fullName || a.employerRep?.fullName || '?')[0]}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900 dark:text-white">
                          {a.professional?.fullName || a.employerRep?.fullName}
                        </p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
                            <Clock className="w-3 h-3" /> {a.durationMinutes} DK
                          </span>
                          {a.isFullTime && <Badge className="bg-primary/10 text-primary border-none text-[8px] font-black h-4 px-1.5 uppercase">TAM ZAMANLI</Badge>}
                          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {new Date(a.startDate).toLocaleDateString('tr-TR')} Başlangıç
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-9 h-9 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600"
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
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="w-9 h-9 rounded-xl hover:bg-rose-50 text-rose-500"
                        onClick={() => {
                          if (confirm('Bu atamayı sonlandırmak istediğinize emin misiniz?')) {
                            terminateMutation.mutate(a.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {editingAssignment && (
              <div className="mt-8 p-6 rounded-2xl border border-primary/20 bg-primary/5 space-y-4 animate-in slide-in-from-bottom-2">
                <h4 className="text-xs font-bold text-primary flex items-center gap-2">
                  <Edit2 className="w-3 h-3" /> ATAMAYI DÜZENLE: {editingAssignment.professional?.fullName || editingAssignment.employerRep?.fullName}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">SÜRE (DK/AY)</label>
                    <Input 
                      type="number"
                      value={formData.durationMinutes}
                      onChange={(e) => setFormData({...formData, durationMinutes: e.target.value})}
                      className="h-10 rounded-xl bg-white border-slate-100"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 ml-1">MALİYET TİPİ / BİRİM FİYAT</label>
                    <div className="flex gap-2">
                      <Select value={formData.costType} onValueChange={(v) => setFormData({...formData, costType: v})}>
                        <SelectTrigger className="h-10 rounded-xl bg-white border-slate-100 flex-1">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Aylık Sabit">Sabit</SelectItem>
                          <SelectItem value="Saatlik">Saatlik</SelectItem>
                        </SelectContent>
                      </Select>
                      <Input 
                        type="number"
                        value={formData.unitPrice}
                        onChange={(e) => setFormData({...formData, unitPrice: e.target.value})}
                        className="h-10 rounded-xl bg-white border-slate-100 w-24"
                        placeholder="₺"
                      />
                    </div>
                  </div>
                  <div className="col-span-2 flex items-center justify-between p-3 bg-white rounded-xl border border-slate-100">
                    <div className="flex items-center gap-2">
                      <div 
                        className={cn("w-8 h-4 rounded-full relative cursor-pointer", formData.isFullTime ? "bg-primary" : "bg-slate-200")}
                        onClick={() => {
                          const newFT = !formData.isFullTime;
                          setFormData({...formData, isFullTime: newFT, durationMinutes: newFT ? '11700' : formData.durationMinutes});
                        }}
                      >
                        <div className={cn("absolute top-0.5 w-3 h-3 bg-white rounded-full transition-all", formData.isFullTime ? "left-4 h-3 w-3" : "left-0.5 h-3 w-3")} />
                      </div>
                      <span className="text-[10px] font-bold">TAM ZAMANLI</span>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="ghost" className="h-8 rounded-lg text-[10px] font-bold" onClick={() => setEditingAssignment(null)}>Vazgeç</Button>
                      <Button 
                        className="h-8 rounded-lg text-[10px] font-bold bg-primary text-white"
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
                        Güncelle
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
