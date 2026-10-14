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
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Plus, Search, Users, AlertTriangle, Archive, Edit, Loader2,
  LayoutGrid, List as ListIcon, Filter, ExternalLink, Briefcase,
  Building2, Phone, Mail, Award, Clock, UserCheck, X, RefreshCw
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface CertStatus { isExpired: boolean; isCritical: boolean; isWarning: boolean; daysLeft: number | null }
interface Professional {
  id: number; fullName: string; employmentType: string; osgbName?: string;
  titleClass: string; certificateNo?: string; certificateDate?: string;
  phone?: string; email?: string; unitPrice?: number; username?: string; isActive: boolean;
  certificateStatus: CertStatus;
  assignments: { facility: { name: string } }[];
}

interface OSGBCompany { id: number; name: string; }

const TITLE_CLASSES = ['A Sınıfı IGU', 'B Sınıfı IGU', 'C Sınıfı IGU', 'İşyeri Hekimi', 'DSP'];
const EMPLOYMENT_TYPES = ['Tesis Kadrosu', 'OSGB Kadrosu'];

const emptyForm = {
  fullName: '', employmentType: 'Tesis Kadrosu', osgbName: '',
  titleClass: 'A Sınıfı IGU', certificateNo: '', certificateDate: '',
  phone: '', email: '', unitPrice: '', username: '',
};

function CertBadge({ status }: { status: CertStatus }) {
  if (status.isExpired) {
    return <Badge variant="outline" className="font-semibold text-[10px] bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 border-transparent">Süresi Dolmuş</Badge>;
  }
  if (status.isCritical) {
    return <Badge variant="outline" className="font-semibold text-[10px] bg-destructive/10 text-destructive border-destructive/20">{status.daysLeft} Gün Kaldı</Badge>;
  }
  if (status.isWarning) {
    return <Badge variant="outline" className="font-semibold text-[10px] bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20">{status.daysLeft} Gün</Badge>;
  }
  if (status.daysLeft !== null) {
    return <Badge variant="outline" className="font-semibold text-[10px] bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20">Geçerli</Badge>;
  }
  return <Badge variant="secondary" className="font-semibold text-[10px]">Belge Yok</Badge>;
}

export default function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── URL SEARCH PARAMS (Akıllı Filtreleme) ──────────────────────────────────
  const search = searchParams.get('q') || '';
  const viewType = (searchParams.get('view') as 'list' | 'card') || 'list';
  const filterClass = searchParams.get('class') || 'all';
  const selectedOSGB = searchParams.get('osgb') || 'all';
  const activeTab = searchParams.get('tab') || 'Tesis Kadrosu';
  const showArchived = searchParams.get('archived') === 'true';

  const updateSearchParam = useCallback((key: string, value: string | null) => {
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (value && value !== 'all' && (key !== 'view' || value !== 'list') && (key !== 'tab' || value !== 'Tesis Kadrosu') && value !== '' && value !== 'false') {
        next.set(key, value);
      } else {
        next.delete(key);
      }
      return next;
    }, { replace: true });
  }, [setSearchParams]);

  const setSearch = (val: string) => updateSearchParam('q', val);
  const setViewType = (val: string) => updateSearchParam('view', val);
  const setFilterClass = (val: string) => updateSearchParam('class', val);
  const setSelectedOSGB = (val: string) => updateSearchParam('osgb', val);
  const setActiveTab = (val: string) => updateSearchParam('tab', val);
  const setShowArchived = (val: boolean) => updateSearchParam('archived', val ? 'true' : null);

  const resetFilters = () => {
    setSearchParams(prev => {
      const next = new URLSearchParams();
      if (viewType !== 'list') next.set('view', viewType);
      return next;
    }, { replace: true });
  };

  const activeFiltersCount = (search ? 1 : 0) + 
    (filterClass !== 'all' ? 1 : 0) + 
    (selectedOSGB !== 'all' ? 1 : 0) + 
    (showArchived ? 1 : 0);

  // ── SCROLL RESTORATION ────────────────────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      sessionStorage.setItem('panel_professionals_scrollY', window.scrollY.toString());
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Professional | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveId, setArchiveId] = useState<number | null>(null);
  const [bulkArchiveModalOpen, setBulkArchiveModalOpen] = useState(false);

  const { data: professionals = [], isLoading, refetch, isFetching } = useQuery<Professional[]>({
    queryKey: ['professionals', showArchived],
    queryFn: async () => {
      const res = await api.get(`/panel/professionals${showArchived ? '?archived=true' : ''}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const { data: osgbCompanies = [] } = useQuery<OSGBCompany[]>({
    queryKey: ['osgb'],
    queryFn: async () => {
      const res = await api.get('/panel/osgb');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  // Restore scroll
  useEffect(() => {
    if (!isLoading) {
      const savedY = sessionStorage.getItem('panel_professionals_scrollY');
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

  const saveMutation = useMutation({
    mutationFn: async (data: typeof emptyForm) => {
      const payload = { ...data, unitPrice: data.unitPrice ? parseFloat(data.unitPrice) : null };
      const res = editItem
        ? await api.put(`/panel/professionals/${editItem.id}`, payload)
        : await api.post('/panel/professionals', payload);
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success(editItem ? 'Profesyonel bilgileri güncellendi.' : 'Yeni profesyonel başarıyla eklendi.');
      setModalOpen(false); setEditItem(null); setForm(emptyForm);
    },
    onError: (err: any) => toast.error(err.message || 'İşlem başarısız.')
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/panel/professionals/${id}/archive`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Profesyonel arşive alındı.');
      setArchiveId(null);
    },
    onError: (err: any) => toast.error(err.message || 'Arşive alınamadı.')
  });

  const bulkArchiveMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/panel/professionals/bulk-archive-unassigned', {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      toast.success('Atamasız profesyoneller pasife alındı.');
      setBulkArchiveModalOpen(false);
    },
    onError: (err: any) => toast.error(err.message || 'Toplu işlem başarısız.')
  });

  const openAdd = () => { setEditItem(null); setForm(emptyForm); setModalOpen(true); };
  const openEdit = (p: Professional) => {
    setEditItem(p);
    setForm({
      fullName: p.fullName, employmentType: p.employmentType, osgbName: p.osgbName ?? '',
      titleClass: p.titleClass, certificateNo: p.certificateNo ?? '',
      certificateDate: p.certificateDate ? p.certificateDate.substring(0, 10) : '',
      phone: p.phone ?? '', email: p.email ?? '',
      unitPrice: p.unitPrice?.toString() ?? '',
      username: p.username ?? '',
    });
    setModalOpen(true);
  };

  const filtered = useMemo(() => {
    return professionals.filter((p) => {
      const matchSearch = p.fullName.toLowerCase().includes(search.toLowerCase())
        || p.email?.toLowerCase().includes(search.toLowerCase())
        || p.osgbName?.toLowerCase().includes(search.toLowerCase());
      const matchClass = filterClass === 'all' || p.titleClass === filterClass;
      const matchTab = p.employmentType === activeTab;
      const matchOSGB = activeTab !== 'OSGB Kadrosu' || selectedOSGB === 'all' || p.osgbName === selectedOSGB;
      return matchSearch && matchClass && matchTab && matchOSGB;
    });
  }, [professionals, search, filterClass, activeTab, selectedOSGB]);

  const grouped = useMemo(() => {
    return TITLE_CLASSES.reduce((acc, title) => {
      const proms = filtered.filter(p => p.titleClass === title);
      if (proms.length > 0) acc[title] = proms;
      return acc;
    }, {} as Record<string, Professional[]>);
  }, [filtered]);

  const ProfessionalCard = ({ p }: { p: Professional }) => (
    <Card className={cn(
      "rounded-xl border border-border bg-card shadow-xs hover:border-primary/50 transition-all duration-200 group flex flex-col justify-between",
      !p.isActive && 'opacity-60 grayscale'
    )}>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-start justify-between">
          <div 
            className="w-11 h-11 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-sm font-bold cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
            onClick={() => navigate(`/panel/professionals/${p.id}`)}
          >
            {p.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={() => openEdit(p)} title="Düzenle">
              <Edit className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
            <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg hover:text-destructive" onClick={() => setArchiveId(p.id)} title="Arşive Al">
              <Archive className="w-3.5 h-3.5 text-muted-foreground" />
            </Button>
          </div>
        </div>

        <div>
          <h3 
            className="font-bold text-sm text-foreground line-clamp-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/panel/professionals/${p.id}`)}
          >
            {p.fullName}
          </h3>
          <div className="flex items-center gap-1.5 mt-1.5 flex-wrap">
            <Badge variant="outline" className="text-[10px] font-semibold py-0">{p.titleClass}</Badge>
            <CertBadge status={p.certificateStatus} />
          </div>
        </div>

        <div className="space-y-1.5 text-xs text-muted-foreground pt-1 border-t border-border/40">
          <div className="flex items-center gap-2">
            <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
            <span>{p.assignments.length} Aktif Atama</span>
          </div>
          {p.email && (
            <div className="flex items-center gap-2 truncate">
              <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <span className="truncate">{p.email}</span>
            </div>
          )}
        </div>

        <Button 
          variant="outline" 
          size="sm"
          className="w-full h-8 rounded-lg text-xs font-semibold gap-1 hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={() => navigate(`/panel/professionals/${p.id}`)}
        >
          Life Card <ExternalLink className="w-3 h-3 ml-1" />
        </Button>
      </CardContent>
    </Card>
  );

  const ProfessionalListItem = ({ p }: { p: Professional }) => (
    <div className={cn(
      "flex flex-col sm:flex-row items-start sm:items-center justify-between p-3.5 bg-card text-card-foreground rounded-xl border border-border shadow-xs hover:border-primary/30 transition-all duration-200 gap-3 group",
      !p.isActive && 'opacity-60'
    )}>
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div 
          className="w-9 h-9 bg-primary/10 text-primary rounded-lg flex items-center justify-center text-xs font-bold shrink-0 cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all"
          onClick={() => navigate(`/panel/professionals/${p.id}`)}
        >
          {p.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 
            className="font-bold text-sm text-foreground hover:text-primary transition-colors cursor-pointer truncate"
            onClick={() => navigate(`/panel/professionals/${p.id}`)}
          >
            {p.fullName}
          </h3>
          <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
            <span className="truncate">{p.email || '—'}</span>
            <span className="text-border">•</span>
            <span>{p.phone || '—'}</span>
            {p.username && (
              <>
                <span className="text-border">•</span>
                <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 flex items-center gap-1 py-0 px-1.5 h-4 text-[10px]">
                  <UserCheck className="w-2.5 h-2.5" />
                  {p.username}
                </Badge>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Atamalar</p>
          <p className="text-xs font-bold text-foreground">{p.assignments.length} Tesis</p>
        </div>
        <div className="text-right hidden md:block">
          <p className="text-[10px] font-semibold text-muted-foreground mb-0.5">Sertifika</p>
          <CertBadge status={p.certificateStatus} />
        </div>
        <div className="flex items-center gap-1 border-l border-border pl-3">
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)} title="Düzenle">
            <Edit className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-destructive" onClick={() => setArchiveId(p.id)} title="Arşive Al">
            <Archive className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-primary" onClick={() => navigate(`/panel/professionals/${p.id}`)} title="Life Card">
            <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 pb-12 animate-fade-in">
      {/* ── HEADER ────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/40 pb-5">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              İSG Profesyonelleri
            </h1>
            <Badge variant="outline" className="h-6 px-2.5 text-xs font-semibold bg-primary/5 text-primary border-primary/20">
              {professionals.length} Kayıtlı Profesyonel
            </Badge>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            İş güvenliği uzmanı, işyeri hekimi ve diğer sağlık personeli kadrosunu yönetin.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 self-start md:self-auto">
          <Button 
            variant="outline"
            size="sm"
            className="h-9 px-3 rounded-lg text-xs font-semibold gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            onClick={() => setBulkArchiveModalOpen(true)}
          >
            <Archive className="w-3.5 h-3.5" /> Atamasızları Pasife Al
          </Button>
          <Button 
            variant={showArchived ? "secondary" : "outline"}
            size="sm"
            className="h-9 px-3 rounded-lg text-xs font-semibold gap-1.5"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="w-3.5 h-3.5" /> {showArchived ? 'Aktifleri Göster' : 'Arşiv'}
          </Button>
          <Button 
            size="sm"
            onClick={openAdd} 
            className="h-9 px-3.5 rounded-lg text-xs font-semibold gap-1.5 shadow-xs"
          >
            <Plus className="w-3.5 h-3.5" /> Yeni Profesyonel
          </Button>
        </div>
      </div>

      {/* ── FILTER & TAB BAR (URL Parametreli) ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card/80 backdrop-blur-md p-4 shadow-xs space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Tabs for Employment Type */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-fit">
            <TabsList className="h-9 p-1 bg-muted/60 border border-border rounded-lg">
              <TabsTrigger value="Tesis Kadrosu" className="rounded-md text-xs font-semibold px-3.5">
                Tesis Kadrosu
              </TabsTrigger>
              <TabsTrigger value="OSGB Kadrosu" className="rounded-md text-xs font-semibold px-3.5">
                OSGB Kadrosu
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Search & Select Controls */}
          <div className="flex flex-wrap items-center gap-2 flex-1 lg:justify-end">
            <div className="relative flex-1 sm:max-w-xs min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="İsim, e-posta veya OSGB ara..."
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

            {activeTab === 'OSGB Kadrosu' && (
              <div className="min-w-[160px]">
                <Select value={selectedOSGB} onValueChange={setSelectedOSGB}>
                  <SelectTrigger size="sm" className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium">
                    <SelectValue placeholder="OSGB Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm OSGB'ler</SelectItem>
                    {osgbCompanies.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="min-w-[140px]">
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger size="sm" className="h-9 w-full rounded-lg bg-background/80 border-border text-xs font-medium">
                  <SelectValue placeholder="Tüm Sınıflar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Sınıflar</SelectItem>
                  {TITLE_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            {activeFiltersCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetFilters}
                className="h-9 px-2.5 rounded-lg border-dashed text-xs text-muted-foreground hover:text-foreground gap-1.5"
              >
                <X className="w-3.5 h-3.5" />
                Sıfırla
              </Button>
            )}

            <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
              <Button 
                variant={viewType === 'list' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={cn("h-7 px-2.5 text-xs rounded-md", viewType === 'list' && "bg-background shadow-xs font-semibold")}
                onClick={() => setViewType('list')}
              >
                <ListIcon className="w-3.5 h-3.5 mr-1" /> Liste
              </Button>
              <Button 
                variant={viewType === 'card' ? 'secondary' : 'ghost'} 
                size="sm" 
                className={cn("h-7 px-2.5 text-xs rounded-md", viewType === 'card' && "bg-background shadow-xs font-semibold")}
                onClick={() => setViewType('card')}
              >
                <LayoutGrid className="w-3.5 h-3.5 mr-1" /> Kart
              </Button>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
              className="h-9 px-2 rounded-lg text-muted-foreground hover:text-foreground"
              title="Yenile"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isFetching ? 'animate-spin text-primary' : ''}`} />
            </Button>
          </div>
        </div>

        {/* Counter Summary */}
        <div className="flex items-center justify-between text-xs text-muted-foreground pt-1 border-t border-border/40">
          <span>Toplam <strong>{filtered.length}</strong> / {professionals.length} profesyonel listeleniyor</span>
        </div>
      </div>

      {/* ── CONTENT AREA ──────────────────────────────────────────────────── */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Card key={i} className="rounded-xl border-border/60 p-5 space-y-4">
              <div className="flex justify-between items-start">
                <Skeleton className="w-10 h-10 rounded-lg" />
                <Skeleton className="h-5 w-20 rounded-full" />
              </div>
              <Skeleton className="h-5 w-36 rounded-md" />
              <Skeleton className="h-3 w-48 rounded-md" />
              <Skeleton className="h-8 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20 rounded-xl border border-dashed border-border bg-card/40 space-y-2">
          <Users className="w-10 h-10 text-muted-foreground/40 mx-auto" />
          <p className="font-semibold text-sm text-foreground">Kayıt Bulunamadı</p>
          <p className="text-xs text-muted-foreground">Filtre kriterlerine uygun İSG profesyoneli bulunamadı.</p>
        </div>
      ) : (
        <Accordion type="multiple" defaultValue={TITLE_CLASSES} className="space-y-4 border-none">
          {TITLE_CLASSES.map((title) => grouped[title] && (
            <AccordionItem key={title} value={title} className="rounded-xl border border-border bg-card shadow-xs overflow-hidden">
              <AccordionTrigger className="hover:no-underline px-5 py-3.5 bg-muted/30 group text-left">
                <div className="flex items-center gap-2.5 text-xs font-bold text-foreground">
                  <div className="w-1.5 h-4 bg-primary rounded-full" />
                  {title}
                  <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-[10px]">
                    {grouped[title].length}
                  </Badge>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-4 sm:p-5 border-t border-border/40">
                {viewType === 'card' ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {grouped[title].map((p) => <ProfessionalCard key={p.id} p={p} />)}
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {grouped[title].map((p) => <ProfessionalListItem key={p.id} p={p} />)}
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      )}

      {/* ── ADD/EDIT MODAL ────────────────────────────────────────────────── */}
      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] p-0 overflow-hidden rounded-xl border border-border bg-card flex flex-col shadow-lg">
          <DialogHeader className="p-6 bg-muted/40 border-b border-border shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                <Users className="w-4 h-4" />
              </div>
              <DialogTitle className="text-lg font-bold text-foreground">
                {editItem ? 'Profesyonel Bilgilerini Düzenle' : 'Yeni Profesyonel Tanımla'}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              İSG profesyoneli iletişim, sertifika ve istihdam bilgilerini doldurun.
            </DialogDescription>
          </DialogHeader>
          
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
            className="flex-1 flex flex-col overflow-hidden bg-card text-card-foreground"
          >
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5 sm:col-span-2">
                  <label className="text-xs font-semibold text-foreground">Ad Soyad *</label>
                  <Input 
                    value={form.fullName} 
                    onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                    required 
                    placeholder="Örn: Dr. Ahmet Yılmaz"
                    className="h-9 rounded-lg"
                  />
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">İstihdam Tipi *</label>
                  <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v || '' })}>
                    <SelectTrigger className="h-9 rounded-lg text-xs font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sınıf / Unvan *</label>
                  <Select value={form.titleClass} onValueChange={(v) => setForm({ ...form, titleClass: v || '' })}>
                    <SelectTrigger className="h-9 rounded-lg text-xs font-medium"><SelectValue /></SelectTrigger>
                    <SelectContent>{TITLE_CLASSES.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
                  </Select>
                </div>

                {form.employmentType === 'OSGB Kadrosu' && (
                  <div className="space-y-1.5 sm:col-span-2">
                    <label className="text-xs font-semibold text-foreground">Bağlı Olduğu OSGB</label>
                    <Select value={form.osgbName} onValueChange={(v) => setForm({ ...form, osgbName: v || '' })}>
                      <SelectTrigger className="h-9 rounded-lg text-xs font-medium"><SelectValue placeholder="OSGB Seçin" /></SelectTrigger>
                      <SelectContent>{osgbCompanies.map((c) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                )}

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sertifika / Belge No</label>
                  <Input 
                    value={form.certificateNo} 
                    onChange={(e) => setForm({ ...form, certificateNo: e.target.value })} 
                    placeholder="Örn: 123456"
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Sertifika Bitiş Tarihi</label>
                  <Input 
                    type="date"
                    value={form.certificateDate} 
                    onChange={(e) => setForm({ ...form, certificateDate: e.target.value })} 
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Telefon</label>
                  <Input 
                    value={form.phone} 
                    onChange={(e) => setForm({ ...form, phone: e.target.value })} 
                    placeholder="05XX XXX XX XX"
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">E-posta</label>
                  <Input 
                    type="email"
                    value={form.email} 
                    onChange={(e) => setForm({ ...form, email: e.target.value })} 
                    placeholder="ornek@firma.com"
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Kullanıcı Adı (İSG-KATİP)</label>
                  <Input 
                    value={form.username} 
                    onChange={(e) => setForm({ ...form, username: e.target.value })} 
                    placeholder="TC Kimlik No veya kullanıcı adı"
                    className="h-9 rounded-lg"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-foreground">Saatlik / Aylık Birim Maliyet (TL)</label>
                  <Input 
                    type="number"
                    step="0.01"
                    value={form.unitPrice} 
                    onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} 
                    placeholder="0.00"
                    className="h-9 rounded-lg"
                  />
                </div>
              </div>
            </div>

            <DialogFooter className="p-4 border-t border-border/50 bg-muted/20">
              <Button type="button" variant="outline" size="sm" onClick={() => setModalOpen(false)} className="rounded-lg">
                Vazgeç
              </Button>
              <Button type="submit" size="sm" disabled={saveMutation.isPending} className="rounded-lg gap-1.5">
                {saveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                {editItem ? 'Güncelle' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── SINGLE ARCHIVE CONFIRMATION DIALOG ────────────────────────────── */}
      <Dialog open={archiveId !== null} onOpenChange={(v) => !v && setArchiveId(null)}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-500" /> Profesyoneli Arşive Al
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Bu profesyonel arşive alınacak ve aktif atamalardan düşürülecektir. Devam etmek istiyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setArchiveId(null)} className="rounded-lg">
              İptal
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => archiveId && archiveMutation.mutate(archiveId)}
              disabled={archiveMutation.isPending}
              className="rounded-lg gap-1.5"
            >
              {archiveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Arşive Al
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── BULK ARCHIVE CONFIRMATION DIALOG ──────────────────────────────── */}
      <Dialog open={bulkArchiveModalOpen} onOpenChange={setBulkArchiveModalOpen}>
        <DialogContent className="sm:max-w-md rounded-xl border border-border bg-card">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Archive className="w-5 h-5 text-amber-500" /> Atamasızları Pasife Al
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-1">
              Hiçbir tesiste aktif ataması bulunmayan tüm profesyoneller topluca pasife alınacaktır. Onaylıyor musunuz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-2">
            <Button variant="outline" size="sm" onClick={() => setBulkArchiveModalOpen(false)} className="rounded-lg">
              Vazgeç
            </Button>
            <Button 
              variant="destructive" 
              size="sm" 
              onClick={() => bulkArchiveMutation.mutate()}
              disabled={bulkArchiveMutation.isPending}
              className="rounded-lg gap-1.5"
            >
              {bulkArchiveMutation.isPending && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              Topluca Pasife Al
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
