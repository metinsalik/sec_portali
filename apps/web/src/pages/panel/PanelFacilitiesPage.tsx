import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Building2, MapPin, Search, Filter, 
  LayoutGrid, List, ChevronRight, Shield, 
  Users, Activity, Building, ArrowRight, ChevronDown,
  RefreshCw, Calendar as CalendarIcon, Save, Loader2, Eye,
  CheckCircle2, XCircle, AlertTriangle, Info, Clock, X,
  FileSpreadsheet
} from 'lucide-react';
import { QuickAssignModal } from '@/components/panel/assignments/QuickAssignModal';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from 'sonner';

const FACILITY_TYPES = [
  "Hastane", "Ofis", "Depo", "Tıp Merkezi", "Diyaliz Merkezi", "Çağrı Merkezi", "Konuk Evi", "Şantiye"
];

const DANGER_CLASSES = [
  "Az Tehlikeli", "Tehlikeli", "Çok Tehlikeli"
];

interface Facility {
  id: string;
  name: string;
  type: string;
  dangerClass: string;
  isActive: boolean;
  employeeCount: number;
  city: string;
  district: string;
  compliance?: any;
}

export default function PanelFacilitiesPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // ── URL SEARCH PARAMS (Akıllı Filtreleme) ──────────────────────────────────
  const searchTerm = searchParams.get('q') || '';
  const viewMode = (searchParams.get('view') as 'list' | 'grid') || 'list';
  const typeFilter = searchParams.get('type') || 'all';
  const dangerFilter = searchParams.get('danger') || 'all';
  const statusFilter = searchParams.get('status') || 'all';
  const complianceFilter = searchParams.get('comp') || 'all';

  const updateSearchParam = useCallback((key: string, value: string) => {
    setSearchParams(prev => {
      const newParams = new URLSearchParams(prev);
      if (value && value !== 'all' && (key !== 'view' || value !== 'list') && value !== '') {
        newParams.set(key, value);
      } else {
        newParams.delete(key);
      }
      return newParams;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearchTerm = (val: string) => updateSearchParam('q', val);
  const setViewMode = (val: string) => updateSearchParam('view', val);
  const setTypeFilter = (val: string) => updateSearchParam('type', val);
  const setDangerFilter = (val: string) => updateSearchParam('danger', val);
  const setStatusFilter = (val: string) => updateSearchParam('status', val);
  const setComplianceFilter = (val: string) => updateSearchParam('comp', val);

  const resetAllFilters = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams();
      if (viewMode !== 'list') next.set('view', viewMode);
      return next;
    }, { replace: true });
  };

  const activeFiltersCount = (searchTerm ? 1 : 0) + 
    (typeFilter !== 'all' ? 1 : 0) + 
    (dangerFilter !== 'all' ? 1 : 0) + 
    (statusFilter !== 'all' ? 1 : 0) + 
    (complianceFilter !== 'all' ? 1 : 0);

  // ── SCROLL RESTORATION ────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_facilities_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Update States
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [isSingleUpdateOpen, setIsSingleUpdateOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [singleCount, setSingleCount] = useState<string>('');
  const [bulkCounts, setBulkCounts] = useState<Record<string, string>>({});

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignType, setAssignType] = useState<'IGU' | 'Hekim' | 'DSP' | 'Vekil'>('IGU');

  const { data: facilities = [], isLoading, refetch, isFetching } = useQuery<Facility[]>({
    queryKey: ['facilities-with-compliance'],
    queryFn: async () => {
      const [facRes, compRes] = await Promise.all([
        api.get('/settings/facilities'),
        api.get('/panel/assignments/compliance-status')
      ]);
      
      if (!facRes.ok || !compRes.ok) throw new Error('Veriler yüklenemedi');
      
      const facilitiesData = await facRes.json();
      const complianceData = await compRes.json();
      
      return facilitiesData.map((f: any) => ({
        ...f,
        compliance: complianceData.find((c: any) => c.facilityId === f.id)
      }));
    }
  });

  // Restore scroll
  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_facilities_scrollY');
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

  const [expandedFacilityId, setExpandedFacilityId] = useState<string | null>(null);

  const singleUpdateMutation = useMutation({
    mutationFn: async (data: { id: string, count: number, effectiveDate: string }) => {
      const res = await api.patch(`/settings/facilities/${data.id}/employee-count`, {
        count: data.count,
        effectiveDate: data.effectiveDate
      });
      if (!res.ok) throw new Error('Güncelleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-with-compliance'] });
      toast.success('Çalışan sayısı güncellendi');
      setIsSingleUpdateOpen(false);
    },
    onError: () => toast.error('Güncelleme yapılamadı')
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { updates: { id: string, count: number }[], effectiveDate: string }) => {
      const res = await api.post('/settings/facilities/bulk-employee-count', data);
      if (!res.ok) throw new Error('Toplu güncelleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities-with-compliance'] });
      toast.success('Toplu güncelleme tamamlandı');
      setIsBulkUpdateOpen(false);
    },
    onError: () => toast.error('Toplu güncelleme yapılamadı')
  });

  // Filter facilities
  const filteredFacilities = useMemo(() => {
    return facilities.filter(f => {
      const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            f.id.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || f.type === typeFilter;
      const matchesDanger = dangerFilter === 'all' || f.dangerClass === dangerFilter;
      const matchesStatus = statusFilter === 'all' || 
                            (statusFilter === 'active' && f.isActive) || 
                            (statusFilter === 'passive' && !f.isActive);
      
      let matchesCompliance = true;
      if (complianceFilter === 'compliant') {
        matchesCompliance = f.compliance?.overallCompliant === true;
      } else if (complianceFilter === 'missing') {
        matchesCompliance = f.compliance?.overallCompliant === false;
      }

      return matchesSearch && matchesType && matchesDanger && matchesStatus && matchesCompliance;
    });
  }, [facilities, searchTerm, typeFilter, dangerFilter, statusFilter, complianceFilter]);

  // Group facilities by type
  const groupedFacilities = useMemo(() => {
    return filteredFacilities.reduce((acc, f) => {
      const type = f.type || 'Diğer';
      if (!acc[type]) acc[type] = [];
      acc[type].push(f);
      return acc;
    }, {} as Record<string, Facility[]>);
  }, [filteredFacilities]);

  const sortedTypes = Object.keys(groupedFacilities).sort();

  const handleView = (facility: Facility) => {
    navigate(`/panel/facilities/${facility.id}`);
  };

  const openSingleUpdate = (facility: Facility) => {
    setSelectedFacility(facility);
    setSingleCount(facility.employeeCount?.toString() || '');
    setIsSingleUpdateOpen(true);
  };

  const openBulkUpdate = () => {
    const initialCounts: Record<string, string> = {};
    facilities.forEach(f => {
      initialCounts[f.id] = f.employeeCount?.toString() || '';
    });
    setBulkCounts(initialCounts);
    setIsBulkUpdateOpen(true);
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;
    singleUpdateMutation.mutate({
      id: selectedFacility.id,
      count: parseInt(singleCount) || 0,
      effectiveDate: updateDate
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = Object.entries(bulkCounts).map(([id, count]) => ({
      id,
      count: parseInt(count) || 0
    }));
    bulkUpdateMutation.mutate({
      updates,
      effectiveDate: updateDate
    });
  };

  const openAssignModal = (facility: Facility, type: 'IGU' | 'Hekim' | 'DSP' | 'Vekil') => {
    setSelectedFacility(facility);
    setAssignType(type);
    setAssignModalOpen(true);
  };

  const handleDownloadMissingReport = async () => {
    try {
      const response = await api.get('/panel/reports/missing-assignments/excel');
      if (!response.ok) throw new Error('Rapor indirilemedi');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eksik_atamalar_raporu_${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Rapor başarıyla indirildi.');
    } catch (err: any) {
      toast.error(err.message || 'Rapor indirilemedi.');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-fade-in pb-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-lg" />
            <Skeleton className="h-4 w-80 rounded-md" />
          </div>
          <div className="flex items-center gap-3">
            <Skeleton className="h-9 w-36 rounded-lg" />
            <Skeleton className="h-9 w-32 rounded-lg" />
          </div>
        </div>

        <div className="p-4 rounded-xl border border-border/60 bg-card/60 flex flex-wrap gap-3">
          <Skeleton className="h-9 w-60 rounded-lg flex-1 min-w-[200px]" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-36 rounded-lg" />
          <Skeleton className="h-9 w-32 rounded-lg" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="rounded-xl border-border/60">
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="w-10 h-10 rounded-lg" />
                    <Skeleton className="h-5 w-36 rounded-md" />
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
                <Skeleton className="h-16 w-full rounded-lg" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tesis Yönetimi
            </h1>
            <Badge variant="outline" className="h-6 px-2.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20">
              {facilities.length} Kayıtlı Tesis
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Sistemde kayıtlı tesislerin atama durumlarını, mevzuat eksikliklerini ve çalışan sayılarını takip edin.
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <Button 
            variant="outline"
            size="sm"
            onClick={handleDownloadMissingReport} 
            className="h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-xs border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            Eksikler Raporu (Excel)
          </Button>

          <Button 
            size="sm"
            onClick={openBulkUpdate} 
            className="h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Toplu Sayı Güncelle
          </Button>

          <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className={cn("h-7 px-2.5 text-xs rounded-md", viewMode === 'list' && "bg-background shadow-xs font-semibold")}
            >
              <List className="w-3.5 h-3.5 mr-1" /> Liste
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('grid')}
              className={cn("h-7 px-2.5 text-xs rounded-md", viewMode === 'grid' && "bg-background shadow-xs font-semibold")}
            >
              <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Kart
            </Button>
          </div>
        </div>
      </div>

      {/* ── FILTER BAR (URL Parametreli) ──────────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 min-w-[240px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input 
              placeholder="Tesis adı veya koduna göre ara..." 
              className="pl-9 pr-8 h-9 text-sm rounded-lg bg-background/80 border-border focus-visible:ring-1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-0.5"
                title="Aramayı Temizle"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Select Filters */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Type Filter */}
            <div className="min-w-[140px]">
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger size="sm" className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium">
                  <span className="truncate">{typeFilter === 'all' ? 'Tüm Tipler' : typeFilter}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Tipler</SelectItem>
                  {FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Danger Class Filter */}
            <div className="min-w-[140px]">
              <Select value={dangerFilter} onValueChange={setDangerFilter}>
                <SelectTrigger size="sm" className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium">
                  <span className="truncate">{dangerFilter === 'all' ? 'Tüm Sınıflar' : dangerFilter}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sınıflar</SelectItem>
                  {DANGER_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="min-w-[120px]">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger size="sm" className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium">
                  <span className="truncate">{statusFilter === 'all' ? 'Tüm Durumlar' : statusFilter === 'active' ? 'Aktif' : 'Pasif'}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Durumlar</SelectItem>
                  <SelectItem value="active">Aktif</SelectItem>
                  <SelectItem value="passive">Pasif</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Compliance Filter */}
            <div className="min-w-[150px]">
              <Select value={complianceFilter} onValueChange={setComplianceFilter}>
                <SelectTrigger size="sm" className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium">
                  <span className="truncate">
                    {complianceFilter === 'all' ? 'Tüm Atamalar' : complianceFilter === 'compliant' ? 'Ataması Tam (Uygun)' : 'Ataması Eksik'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Atamalar</SelectItem>
                  <SelectItem value="compliant">Ataması Tam (Uygun)</SelectItem>
                  <SelectItem value="missing">Ataması Eksik</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Reset Button */}
            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllFilters}
                className="h-9 px-2.5 rounded-lg border-dashed text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Sıfırla
                <Badge variant="secondary" className="h-4 px-1.5 text-[10px] rounded-full">
                  {activeFiltersCount}
                </Badge>
              </Button>
            )}

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-2.5 rounded-lg text-xs text-muted-foreground hover:text-foreground gap-1.5"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>Toplam <strong>{filteredFacilities.length}</strong> / {facilities.length} tesis listeleniyor</span>
        </div>
      </div>

      {/* ── LIST / GRID VIEW ──────────────────────────────────────────────── */}
      {viewMode === 'list' ? (
        <Accordion type="multiple" defaultValue={sortedTypes} className="space-y-4">
          {sortedTypes.map(type => (
            <AccordionItem 
              key={type} 
              value={type} 
              className="rounded-xl border border-border bg-card overflow-hidden shadow-xs transition-all duration-200"
            >
              <AccordionTrigger className="hover:no-underline px-5 py-3.5 bg-muted/30 group text-left">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-background rounded-lg flex items-center justify-center text-primary shadow-xs border border-border group-hover:scale-105 transition-transform">
                    {type === 'Hastane' ? <Building2 className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                  </div>
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <span className="text-sm font-bold text-foreground">{type}</span>
                    <span className="text-[11px] text-muted-foreground font-medium">{groupedFacilities[type].length} Tesis</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0 border-t border-border/40">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-muted/40 border-b border-border/50">
                        <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Tesis Bilgisi</th>
                        <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Tehlike Sınıfı</th>
                        <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-center">Çalışan</th>
                        <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-center">Uzman (İGÜ)</th>
                        <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-center">İşyeri Hekimi</th>
                        <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider text-center">DSP</th>
                        <th className="px-5 py-3 font-semibold text-muted-foreground uppercase text-[10px] tracking-wider">Durum</th>
                        <th className="px-5 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {groupedFacilities[type].map((f) => (
                        <React.Fragment key={f.id}>
                          <tr 
                            className={cn(
                              "hover:bg-muted/30 transition-colors group cursor-pointer",
                              expandedFacilityId === f.id && "bg-muted/40"
                            )} 
                            onClick={() => setExpandedFacilityId(expandedFacilityId === f.id ? null : f.id)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-muted/60 rounded-lg flex items-center justify-center text-muted-foreground border border-border group-hover:text-primary transition-colors shrink-0">
                                  <Building2 className="w-4 h-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="font-semibold text-foreground group-hover:text-primary transition-colors truncate">{f.name}</div>
                                  <div className="text-[10px] font-mono text-muted-foreground">{f.id}</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-5 py-3.5">
                              <Badge 
                                variant="outline" 
                                className={cn(
                                  "text-[10px] font-bold px-2 py-0.5",
                                  f.dangerClass === 'Çok Tehlikeli' ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" : 
                                  f.dangerClass === 'Tehlikeli' ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" : 
                                  "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                                )}
                              >
                                {f.dangerClass}
                              </Badge>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              <button 
                                onClick={(e) => { e.stopPropagation(); openSingleUpdate(f); }}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-muted hover:bg-primary/10 hover:text-primary transition-colors rounded-lg text-xs font-semibold border border-border"
                                title="Çalışan Sayısını Güncelle"
                              >
                                <Users className="w-3 h-3 text-muted-foreground" />
                                {f.employeeCount || 0}
                              </button>
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {f.compliance?.igu ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openAssignModal(f, 'IGU'); }}
                                  className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center justify-center gap-1 mx-auto transition-all",
                                    f.compliance.igu.isCompliant 
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                  )}
                                >
                                  {f.compliance.igu.isCompliant ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {f.compliance.igu.isCompliant ? "UYGUN" : "EKSİK"}
                                </button>
                              ) : "-"}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {f.compliance?.hekim ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openAssignModal(f, 'Hekim'); }}
                                  className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center justify-center gap-1 mx-auto transition-all",
                                    f.compliance.hekim.isCompliant 
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                  )}
                                >
                                  {f.compliance.hekim.isCompliant ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {f.compliance.hekim.isCompliant ? "UYGUN" : "EKSİK"}
                                </button>
                              ) : "-"}
                            </td>
                            <td className="px-5 py-3.5 text-center">
                              {f.compliance?.dsp ? (
                                <button 
                                  onClick={(e) => { e.stopPropagation(); openAssignModal(f, 'DSP'); }}
                                  className={cn(
                                    "text-[10px] font-bold px-2 py-1 rounded-lg border flex items-center justify-center gap-1 mx-auto transition-all",
                                    f.compliance.dsp.summary === 'Muaf' ? "bg-muted text-muted-foreground border-border" :
                                    f.compliance.dsp.summary === 'Zorunlu Değil' ? "bg-primary/5 text-primary border-primary/20" :
                                    f.compliance.dsp.isCompliant 
                                      ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20" 
                                      : "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20 hover:bg-rose-500/20"
                                  )}
                                >
                                  {f.compliance.dsp.summary === 'Muaf' ? <Shield className="w-3 h-3" /> :
                                   f.compliance.dsp.summary === 'Zorunlu Değil' ? <Info className="w-3 h-3" /> :
                                   f.compliance.dsp.isCompliant ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                                  {f.compliance.dsp.summary}
                                </button>
                              ) : "-"}
                            </td>
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-1.5">
                                <div className={cn("w-2 h-2 rounded-full", f.isActive ? "bg-emerald-500" : "bg-muted-foreground")} />
                                <span className="text-xs font-medium text-foreground">{f.isActive ? "Aktif" : "Pasif"}</span>
                              </div>
                            </td>
                            <td className="px-5 py-3.5 text-right">
                              <div className="flex items-center justify-end gap-1">
                                <Button 
                                  variant="ghost" 
                                  size="sm" 
                                  onClick={(e) => { e.stopPropagation(); handleView(f); }}
                                  className="h-7 w-7 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10"
                                  title="Detayları Gör"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </Button>
                                <ChevronDown className={cn(
                                  "w-3.5 h-3.5 text-muted-foreground transition-transform duration-200",
                                  expandedFacilityId === f.id && "rotate-180"
                                )} />
                              </div>
                            </td>
                          </tr>
                          
                          {/* Expanded Compliance Summary */}
                          {expandedFacilityId === f.id && (
                            <tr className="bg-muted/20">
                              <td colSpan={8} className="px-6 py-5 border-b border-border/50">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
                                  <div>
                                    <h4 className="text-xs font-bold text-destructive flex items-center gap-2 mb-3 tracking-wider uppercase">
                                      <AlertTriangle className="w-3.5 h-3.5" /> Mevcut Eksiklikler
                                    </h4>
                                    <div className="space-y-2">
                                      {!f.compliance?.igu?.isCompliant && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3">
                                          <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                          <div className="flex-1 text-xs">
                                            <p className="font-semibold text-rose-700 dark:text-rose-400">
                                              {f.compliance?.igu?.requiredMinutes - f.compliance?.igu?.assignedMinutes} dk İG Uzmanı eksik
                                            </p>
                                            {f.compliance?.igu?.countdownDays !== null && (
                                              <p className={cn(
                                                "text-[10px] font-bold mt-0.5 flex items-center gap-1",
                                                f.compliance.igu.countdownDays <= 7 ? "text-destructive animate-pulse" : "text-amber-600 dark:text-amber-400"
                                              )}>
                                                <Clock className="w-3 h-3" /> Kalan Yasal Süre: {f.compliance.igu.countdownDays} Gün
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {!f.compliance?.hekim?.isCompliant && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3">
                                          <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                          <div className="flex-1 text-xs">
                                            <p className="font-semibold text-rose-700 dark:text-rose-400">
                                              {f.compliance?.hekim?.requiredMinutes - f.compliance?.hekim?.assignedMinutes} dk İşyeri Hekimi eksik
                                            </p>
                                            {f.compliance?.hekim?.countdownDays !== null && (
                                              <p className={cn(
                                                "text-[10px] font-bold mt-0.5 flex items-center gap-1",
                                                f.compliance.hekim.countdownDays <= 7 ? "text-destructive animate-pulse" : "text-amber-600 dark:text-amber-400"
                                              )}>
                                                <Clock className="w-3 h-3" /> Kalan Yasal Süre: {f.compliance.hekim.countdownDays} Gün
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {!f.compliance?.dsp?.isCompliant && f.compliance?.dsp?.required && (
                                        <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg flex items-center gap-3">
                                          <XCircle className="w-4 h-4 text-destructive shrink-0" />
                                          <div className="flex-1 text-xs">
                                            <p className="font-semibold text-rose-700 dark:text-rose-400">DSP ataması eksik</p>
                                            {f.compliance?.dsp?.countdownDays !== null && (
                                              <p className={cn(
                                                "text-[10px] font-bold mt-0.5 flex items-center gap-1",
                                                f.compliance.dsp.countdownDays <= 7 ? "text-destructive animate-pulse" : "text-amber-600 dark:text-amber-400"
                                              )}>
                                                <Clock className="w-3 h-3" /> Kalan Yasal Süre: {f.compliance.dsp.countdownDays} Gün
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )}
                                      {f.compliance?.overallCompliant && (
                                        <p className="text-xs text-muted-foreground font-medium italic">Herhangi bir eksiklik bulunmamaktadır.</p>
                                      )}
                                    </div>
                                  </div>

                                  <div>
                                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2 mb-3 tracking-wider uppercase">
                                      <CheckCircle2 className="w-3.5 h-3.5" /> Karşılanan Şartlar
                                    </h4>
                                    <div className="space-y-2 text-xs">
                                      {f.compliance?.igu?.isCompliant && (
                                        <div className="p-2.5 border border-emerald-500/20 bg-emerald-500/5 rounded-lg flex items-center gap-2.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                            İG Uzmanı şartı karşılandı {f.compliance.igu.assignedMinutes > f.compliance.igu.requiredMinutes && `(+${f.compliance.igu.assignedMinutes - f.compliance.igu.requiredMinutes} dk fazla)`}
                                          </p>
                                        </div>
                                      )}
                                      {f.compliance?.hekim?.isCompliant && (
                                        <div className="p-2.5 border border-emerald-500/20 bg-emerald-500/5 rounded-lg flex items-center gap-2.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                          <p className="font-semibold text-emerald-700 dark:text-emerald-400">
                                            İşyeri Hekimi asgari süre sağlandı {f.compliance.hekim.assignedMinutes > f.compliance.hekim.requiredMinutes && `(+${f.compliance.hekim.assignedMinutes - f.compliance.hekim.requiredMinutes} dk fazla)`}
                                          </p>
                                        </div>
                                      )}
                                      {f.compliance?.dsp?.isCompliant && (
                                        <div className="p-2.5 border border-emerald-500/20 bg-emerald-500/5 rounded-lg flex items-center gap-2.5">
                                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                                          <p className="font-semibold text-emerald-700 dark:text-emerald-400">DSP şartı karşılandı ({f.compliance.dsp.summary})</p>
                                        </div>
                                      )}
                                    </div>

                                    <div className="mt-6 flex justify-end">
                                      <Button 
                                        variant="outline" 
                                        size="sm" 
                                        onClick={() => handleView(f)}
                                        className="h-8 px-4 rounded-lg text-xs font-semibold gap-1.5"
                                      >
                                        Detaylı Life Card <ArrowRight className="w-3 h-3" />
                                      </Button>
                                    </div>
                                  </div>
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredFacilities.map((f) => (
            <Card key={f.id} className="rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all duration-200 flex flex-col group">
              <CardHeader className="p-5 pb-3">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary border border-primary/20 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <Badge 
                    variant="outline" 
                    className={cn(
                      "font-semibold text-[10px] px-2 py-0.5",
                      f.isActive ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20" : "bg-muted text-muted-foreground border-border"
                    )}
                  >
                    {f.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div>
                  <h3 
                    className="font-bold text-sm text-foreground line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" 
                    onClick={() => handleView(f)}
                  >
                    {f.name}
                  </h3>
                  <p className="text-[10px] font-mono text-muted-foreground tracking-wide mt-0.5">{f.id}</p>
                </div>
              </CardHeader>
              <CardContent className="p-5 pt-2 flex-1 flex flex-col justify-between space-y-4">
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-muted/40 p-2 rounded-lg border border-border/50">
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Tesis Tipi</p>
                    <p className="font-semibold text-foreground truncate">{f.type}</p>
                  </div>
                  <button 
                    onClick={() => openSingleUpdate(f)}
                    className="bg-muted/40 p-2 rounded-lg border border-border/50 text-left hover:border-primary/30 transition-colors group/count"
                  >
                    <p className="text-[10px] font-medium text-muted-foreground mb-0.5 group-hover/count:text-primary">Çalışan</p>
                    <p className="font-bold text-primary flex items-center gap-1.5">
                      {f.employeeCount || 0}
                      <RefreshCw className="w-3 h-3 opacity-0 group-hover/count:opacity-100 transition-opacity" />
                    </p>
                  </button>
                  <div className="bg-muted/40 p-2 rounded-lg border border-border/50 col-span-2 flex items-center justify-between">
                    <span className="text-[10px] font-medium text-muted-foreground">Tehlike Sınıfı</span>
                    <Badge
                      variant="outline"
                      className={cn(
                        "text-[10px] h-5 px-1.5 font-bold uppercase",
                        f.dangerClass === 'Çok Tehlikeli' ? "bg-rose-500/10 text-rose-700 dark:text-rose-400 border-rose-500/20" : 
                        f.dangerClass === 'Tehlikeli' ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20" : 
                        "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                      )}
                    >
                      {f.dangerClass}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-1.5 text-xs">
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] font-medium">
                    <span className="text-muted-foreground">İG UZMANI</span>
                    <span className={f.compliance?.igu?.isCompliant ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-destructive font-bold"}>
                      {f.compliance?.igu?.isCompliant ? "UYGUN" : "EKSİK"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] font-medium">
                    <span className="text-muted-foreground">İŞYERİ HEKİMİ</span>
                    <span className={f.compliance?.hekim?.isCompliant ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-destructive font-bold"}>
                      {f.compliance?.hekim?.isCompliant ? "UYGUN" : "EKSİK"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-1.5 rounded-lg bg-muted/30 border border-border/40 text-[11px] font-medium">
                    <span className="text-muted-foreground">DSP</span>
                    <span className={f.compliance?.dsp?.isCompliant ? "text-emerald-600 dark:text-emerald-400 font-bold" : "text-destructive font-bold"}>
                      {f.compliance?.dsp?.summary}
                    </span>
                  </div>
                </div>

                <Button 
                  onClick={() => handleView(f)}
                  variant="outline"
                  className="w-full h-8 rounded-lg text-xs font-semibold gap-1.5 hover:bg-primary hover:text-primary-foreground transition-all"
                >
                  Detayları Gör <Eye className="w-3.5 h-3.5" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* ── SINGLE EMPLOYEE COUNT UPDATE DIALOG ───────────────────────────── */}
      <Dialog open={isSingleUpdateOpen} onOpenChange={setIsSingleUpdateOpen}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold">Çalışan Sayısı Güncelle</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              <strong>{selectedFacility?.name}</strong> tesisi için güncel çalışan sayısını girin.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSingleSubmit} className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Yeni Çalışan Sayısı</label>
              <Input 
                type="number"
                min="0"
                value={singleCount}
                onChange={(e) => setSingleCount(e.target.value)}
                placeholder="Örn: 150"
                className="h-9 rounded-lg"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Geçerlilik Tarihi</label>
              <Input 
                type="date"
                value={updateDate}
                onChange={(e) => setUpdateDate(e.target.value)}
                className="h-9 rounded-lg"
                required
              />
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsSingleUpdateOpen(false)} className="rounded-lg">
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={singleUpdateMutation.isPending} className="rounded-lg gap-1.5">
                {singleUpdateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── BULK UPDATE DIALOG ────────────────────────────────────────────── */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col rounded-xl border border-border bg-card p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-4 border-b border-border/50">
            <DialogTitle className="text-lg font-bold">Toplu Çalışan Sayısı Güncelleme</DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tesislerin güncel çalışan sayılarını girip tek seferde sisteme kaydedebilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleBulkSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold text-foreground">Tüm Kayıtlar İçin Geçerlilik Tarihi</label>
              <Input 
                type="date"
                value={updateDate}
                onChange={(e) => setUpdateDate(e.target.value)}
                className="h-9 max-w-xs rounded-lg"
                required
              />
            </div>
            <div className="border border-border rounded-lg overflow-hidden divide-y divide-border/50 max-h-[360px] overflow-y-auto">
              {facilities.map(f => (
                <div key={f.id} className="p-3 flex items-center justify-between gap-4 hover:bg-muted/20">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{f.name}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{f.type} • {f.dangerClass}</p>
                  </div>
                  <Input 
                    type="number"
                    min="0"
                    value={bulkCounts[f.id] || ''}
                    onChange={(e) => setBulkCounts(prev => ({ ...prev, [f.id]: e.target.value }))}
                    className="h-8 w-24 text-right rounded-lg text-xs"
                    placeholder="Sayı"
                  />
                </div>
              ))}
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" size="sm" onClick={() => setIsBulkUpdateOpen(false)} className="rounded-lg">
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={bulkUpdateMutation.isPending} className="rounded-lg gap-1.5">
                {bulkUpdateMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                Toplu Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── QUICK ASSIGN MODAL ────────────────────────────────────────────── */}
      <QuickAssignModal 
        open={assignModalOpen}
        onOpenChange={setAssignModalOpen}
        facility={selectedFacility}
        type={assignType}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
