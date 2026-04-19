import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
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
import {
  Plus, Search, Users, AlertTriangle, Archive, Edit, Loader2,
  LayoutGrid, List as ListIcon, Filter, ExternalLink, Briefcase,
  Building2, Phone, Mail, Award, Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CertStatus { isExpired: boolean; isCritical: boolean; isWarning: boolean; daysLeft: number | null }
interface Professional {
  id: number; fullName: string; employmentType: string; osgbName?: string;
  titleClass: string; certificateNo?: string; certificateDate?: string;
  phone?: string; email?: string; unitPrice?: number; isActive: boolean;
  certificateStatus: CertStatus;
  assignments: { facility: { name: string } }[];
}

interface OSGBCompany { id: number; name: string; }

const TITLE_CLASSES = ['A Sınıfı IGU', 'B Sınıfı IGU', 'C Sınıfı IGU', 'İşyeri Hekimi', 'DSP'];
const EMPLOYMENT_TYPES = ['Tesis Kadrosu', 'OSGB Kadrosu'];

const emptyForm = {
  fullName: '', employmentType: 'Tesis Kadrosu', osgbName: '',
  titleClass: 'A Sınıfı IGU', certificateNo: '', certificateDate: '',
  phone: '', email: '', unitPrice: '',
};

function CertBadge({ status }: { status: CertStatus }) {
  if (status.isExpired) return <Badge variant="destructive" className="font-semibold text-[10px] tracking-wide">Süresi Dolmuş</Badge>;
  if (status.isCritical) return <Badge variant="destructive" className="font-semibold text-[10px] tracking-wide">{status.daysLeft} Gün Kaldı</Badge>;
  if (status.isWarning) return <Badge variant="secondary" className="text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50 font-semibold text-[10px] tracking-wide">{status.daysLeft} Gün</Badge>;
  if (status.daysLeft !== null) return <Badge variant="outline" className="text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-amber-900/50 font-semibold text-[10px] tracking-wide">Geçerli</Badge>;
  return <Badge variant="secondary" className="font-semibold text-[10px] tracking-wide">Belge Yok</Badge>;
}

export default function ProfessionalsPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [viewType, setViewType] = useState<'list' | 'card'>('list');
  const [filterClass, setFilterClass] = useState('all');
  const [selectedOSGB, setSelectedOSGB] = useState('all');
  const [activeTab, setActiveTab] = useState('Tesis Kadrosu');
  const [showArchived, setShowArchived] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editItem, setEditItem] = useState<Professional | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [archiveId, setArchiveId] = useState<number | null>(null);

  const { data: professionals = [], isLoading } = useQuery<Professional[]>({
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
      setModalOpen(false); setEditItem(null); setForm(emptyForm);
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.post(`/panel/professionals/${id}/archive`, {});
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['professionals'] });
      setArchiveId(null);
    },
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
    });
    setModalOpen(true);
  };

  const filtered = professionals.filter((p) => {
    const matchSearch = p.fullName.toLowerCase().includes(search.toLowerCase())
      || p.email?.toLowerCase().includes(search.toLowerCase())
      || p.osgbName?.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === 'all' || p.titleClass === filterClass;
    const matchTab = p.employmentType === activeTab;
    const matchOSGB = activeTab !== 'OSGB Kadrosu' || selectedOSGB === 'all' || p.osgbName === selectedOSGB;
    return matchSearch && matchClass && matchTab && matchOSGB;
  });

  const grouped = TITLE_CLASSES.reduce((acc, title) => {
    const proms = filtered.filter(p => p.titleClass === title);
    if (proms.length > 0) acc[title] = proms;
    return acc;
  }, {} as Record<string, Professional[]>);

  const ProfessionalCard = ({ p }: { p: Professional }) => (
    <Card className={cn(
      "border-none shadow-sm rounded-2xl bg-white dark:bg-slate-900 overflow-hidden hover:ring-1 hover:ring-primary/20 transition-all duration-300 group",
      !p.isActive && 'opacity-60 grayscale'
    )}>
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-4">
          <div 
            className="w-12 h-12 bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl flex items-center justify-center text-lg font-bold cursor-pointer hover:bg-primary hover:text-white transition-all"
            onClick={() => navigate(`/panel/professionals/${p.id}`)}
          >
            {p.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => openEdit(p)}>
              <Edit className="w-4 h-4 text-slate-400" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg hover:text-rose-500" onClick={() => setArchiveId(p.id)}>
              <Archive className="w-4 h-4 text-slate-400" />
            </Button>
          </div>
        </div>
        <div className="mb-4">
          <h3 
            className="font-semibold text-slate-900 dark:text-white text-base mb-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/panel/professionals/${p.id}`)}
          >
            {p.fullName}
          </h3>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-[10px] font-semibold tracking-wide py-0 border-slate-100">{p.titleClass}</Badge>
            <CertBadge status={p.certificateStatus} />
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
            <Building2 className="w-3.5 h-3.5 text-slate-400" />
            <span>{p.assignments.length} Aktif Atama</span>
          </div>
          {p.email && (
            <div className="flex items-center gap-3 text-xs text-slate-500 font-medium truncate">
              <Mail className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{p.email}</span>
            </div>
          )}
        </div>
        <Button 
          variant="ghost" 
          className="w-full mt-5 rounded-xl text-[10px] font-bold tracking-wide text-slate-400 hover:text-primary hover:bg-primary/5 group/btn"
          onClick={() => navigate(`/panel/professionals/${p.id}`)}
        >
          İncele <ExternalLink className="w-3 h-3 ml-2 group-hover/btn:translate-x-0.5 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );

  const ProfessionalListItem = ({ p }: { p: Professional }) => (
    <div className={cn(
      "flex flex-col md:flex-row items-start md:items-center justify-between p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-primary/20 transition-all gap-4 group",
      !p.isActive && 'opacity-60'
    )}>
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <div 
          className="w-10 h-10 bg-slate-50 dark:bg-slate-800 text-slate-500 dark:text-slate-400 rounded-lg flex items-center justify-center text-sm font-bold shrink-0 cursor-pointer hover:bg-primary hover:text-white transition-all"
          onClick={() => navigate(`/panel/professionals/${p.id}`)}
        >
          {p.fullName.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0">
          <h3 
            className="font-semibold text-slate-900 dark:text-white text-sm mb-1 cursor-pointer hover:text-primary transition-colors"
            onClick={() => navigate(`/panel/professionals/${p.id}`)}
          >
            {p.fullName}
          </h3>
          <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-400 tracking-wide">
            <span>{p.email || '—'}</span>
            <div className="w-1 h-1 rounded-full bg-slate-200" />
            <span>{p.phone || '—'}</span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-6 self-end md:self-center">
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-semibold text-slate-400 tracking-wide mb-1">Atamalar</p>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-300">{p.assignments.length} Tesis</p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-[10px] font-semibold text-slate-400 tracking-wide mb-1">Sertifika</p>
          <CertBadge status={p.certificateStatus} />
        </div>
        <div className="flex items-center gap-1 border-l border-slate-100 pl-4">
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl" onClick={() => openEdit(p)}>
            <Edit className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-rose-500" onClick={() => setArchiveId(p.id)}>
            <Archive className="w-4 h-4 text-slate-400" />
          </Button>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl hover:text-primary" onClick={() => navigate(`/panel/professionals/${p.id}`)}>
            <ExternalLink className="w-4 h-4 text-slate-400" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">İSG Profesyonelleri</h1>
          <p className="text-sm text-slate-500 font-medium mt-1">Sistemdeki uzman ve hekim kadrosunu yönetin.</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            variant={showArchived ? "secondary" : "outline"}
            className="rounded-xl h-10 px-4 font-semibold text-xs border-slate-200"
            onClick={() => setShowArchived(!showArchived)}
          >
            <Archive className="w-4 h-4 mr-2" /> {showArchived ? 'Aktifler' : 'Arşiv'}
          </Button>
          <Button onClick={openAdd} className="rounded-xl h-10 px-5 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-sm text-white">
            <Plus className="w-4 h-4 mr-2" /> Yeni Profesyonel
          </Button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-slate-50 dark:border-slate-800">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="bg-slate-50/50 dark:bg-slate-800 p-1 rounded-xl border border-slate-100 dark:border-slate-800">
            <TabsList className="bg-transparent h-8">
              <TabsTrigger value="Tesis Kadrosu" className="rounded-lg px-5 font-bold text-[10px] tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
                Tesis Kadrosu
              </TabsTrigger>
              <TabsTrigger value="OSGB Kadrosu" className="rounded-lg px-5 font-bold text-[10px] tracking-wide data-[state=active]:bg-white data-[state=active]:shadow-sm">
                OSGB Kadrosu
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-3 flex-wrap">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <Input
                placeholder="Hızlı ara..."
                className="pl-9 h-10 bg-slate-50/50 border-slate-100 rounded-xl text-xs font-medium focus-visible:ring-primary/10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {activeTab === 'OSGB Kadrosu' && (
              <Select value={selectedOSGB} onValueChange={setSelectedOSGB}>
                <SelectTrigger className="w-[180px] h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[11px] font-bold">
                  <SelectValue placeholder="OSGB Seçin" />
                </SelectTrigger>
                <SelectContent className="rounded-xl">
                  <SelectItem value="all" className="text-xs font-medium">Tüm OSGB'ler</SelectItem>
                  {osgbCompanies.map(c => <SelectItem key={c.id} value={c.name} className="text-xs font-medium">{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            )}

            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-[160px] h-10 bg-slate-50/50 border-slate-100 rounded-xl text-[11px] font-bold">
                <Filter className="w-3.5 h-3.5 mr-2 text-slate-400" />
                <SelectValue placeholder="Tüm Sınıflar" />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="all" className="text-xs font-medium">Tüm Sınıflar</SelectItem>
                {TITLE_CLASSES.map(c => <SelectItem key={c} value={c} className="text-xs font-medium">{c}</SelectItem>)}
              </SelectContent>
            </Select>

            <div className="flex items-center bg-slate-50/50 dark:bg-slate-800 p-0.5 rounded-xl border border-slate-100 dark:border-slate-800">
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg transition-all", viewType === 'list' && "bg-white dark:bg-slate-700 shadow-sm text-primary")}
                onClick={() => setViewType('list')}
              >
                <ListIcon className="w-3.5 h-3.5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className={cn("h-8 w-8 rounded-lg transition-all", viewType === 'card' && "bg-white dark:bg-slate-700 shadow-sm text-primary")}
                onClick={() => setViewType('card')}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[1, 2, 3].map((i) => <div key={i} className="h-48 bg-slate-50/50 rounded-2xl animate-pulse" />)}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 bg-slate-50/30 rounded-2xl border border-dashed border-slate-100">
            <Users className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="text-slate-400 font-semibold text-xs tracking-wide">Kayıt Bulunamadı</p>
          </div>
        ) : (
          <Accordion type="multiple" defaultValue={TITLE_CLASSES} className="space-y-4 border-none">
            {TITLE_CLASSES.map((title) => grouped[title] && (
              <AccordionItem key={title} value={title} className="border-none">
                <AccordionTrigger className="hover:no-underline py-0 group">
                  <div className="flex items-center gap-3 text-[10px] font-bold text-slate-500 tracking-wide">
                    <div className="w-1 h-4 bg-slate-200 dark:bg-slate-800 rounded-full group-data-[state=open]:bg-primary transition-colors" />
                    {title}
                    <span className="ml-2 text-slate-300 font-medium">({grouped[title].length})</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="pt-5">
                  {viewType === 'card' ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                      {grouped[title].map((p) => <ProfessionalCard key={p.id} p={p} />)}
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {grouped[title].map((p) => <ProfessionalListItem key={p.id} p={p} />)}
                    </div>
                  )}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </div>

      <Dialog open={modalOpen} onOpenChange={(v) => { setModalOpen(v); if (!v) setEditItem(null); }}>
        <DialogContent className="sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl rounded-2xl">
          <DialogHeader className="px-8 py-6 bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Users className="w-5 h-5 text-white/70" />
              </div>
              <DialogTitle className="text-lg font-semibold text-white tracking-tight">
                {editItem ? 'Profesyonel Bilgilerini Düzenle' : 'Yeni Profesyonel Tanımla'}
              </DialogTitle>
            </div>
          </DialogHeader>
          <form
            onSubmit={(e) => { e.preventDefault(); saveMutation.mutate(form); }}
            className="p-8 space-y-6 bg-white dark:bg-slate-900"
          >
            <div className="grid grid-cols-2 gap-5">
              <div className="col-span-2 space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Ad Soyad *</label>
                <Input 
                  value={form.fullName} 
                  onChange={(e) => setForm({ ...form, fullName: e.target.value })} 
                  required 
                  className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10"
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">İstihdam Tipi *</label>
                <Select value={form.employmentType} onValueChange={(v) => setForm({ ...form, employmentType: v || '' })}>
                  <SelectTrigger className="rounded-xl border-slate-100 h-11 text-sm font-medium focus:ring-primary/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{EMPLOYMENT_TYPES.map((t) => <SelectItem key={t} value={t} className="text-xs font-medium">{t}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Sınıf / Unvan *</label>
                <Select value={form.titleClass} onValueChange={(v) => setForm({ ...form, titleClass: v || '' })}>
                  <SelectTrigger className="rounded-xl border-slate-100 h-11 text-sm font-medium focus:ring-primary/10"><SelectValue /></SelectTrigger>
                  <SelectContent className="rounded-xl">{TITLE_CLASSES.map((c) => <SelectItem key={c} value={c} className="text-xs font-medium">{c}</SelectItem>)}</SelectContent>
                </Select>
              </div>

              {form.employmentType === 'OSGB Kadrosu' && (
                <>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">OSGB Firma Adı</label>
                  <Select value={form.osgbName} onValueChange={(v) => setForm({ ...form, osgbName: v })}>
                    <SelectTrigger className="rounded-xl border-slate-100 h-11 text-sm font-medium focus:ring-primary/10"><SelectValue placeholder="OSGB Seçin" /></SelectTrigger>
                    <SelectContent className="rounded-xl">{osgbCompanies.map((c) => <SelectItem key={c.id} value={c.name} className="text-xs font-medium">{c.name}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-2">
                  <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Birim Ücret (₺/ay)</label>
                  <Input type="number" value={form.unitPrice} onChange={(e) => setForm({ ...form, unitPrice: e.target.value })} className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10" />
                </div>
                </>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Sertifika No</label>
                <Input value={form.certificateNo} onChange={(e) => setForm({ ...form, certificateNo: e.target.value })} className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Sertifika Tarihi</label>
                <Input type="date" value={form.certificateDate} onChange={(e) => setForm({ ...form, certificateDate: e.target.value })} className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">Telefon</label>
                <Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10" />
              </div>
              
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 tracking-wide ml-1">E-posta</label>
                <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="rounded-xl border-slate-100 h-11 text-sm font-medium focus-visible:ring-primary/10" />
              </div>
            </div>

            {saveMutation.isError && (
              <div className="p-4 bg-rose-50 text-rose-600 rounded-xl text-xs font-semibold border border-rose-100 flex items-center gap-3">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                {(saveMutation.error as Error).message}
              </div>
            )}
            
            <DialogFooter className="gap-3 pt-2">
              <Button type="button" variant="ghost" onClick={() => setModalOpen(false)} className="rounded-xl h-11 px-6 font-bold text-xs text-slate-400">Vazgeç</Button>
              <Button type="submit" disabled={saveMutation.isPending} className="rounded-xl h-11 px-8 font-bold text-xs bg-slate-900 hover:bg-slate-800 shadow-lg text-white">
                {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Kaydet
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={archiveId !== null} onOpenChange={() => setArchiveId(null)}>
        <DialogContent className="sm:max-w-[425px] p-0 border-none shadow-2xl rounded-2xl overflow-hidden">
          <DialogHeader className="px-8 py-6 bg-slate-900">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center">
                <Archive className="w-5 h-5 text-white/70" />
              </div>
              <DialogTitle className="text-lg font-semibold text-white tracking-tight">Arşivle</DialogTitle>
            </div>
          </DialogHeader>
          <div className="p-8 bg-white dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
              </div>
              <p className="text-sm text-slate-500 font-medium leading-relaxed">
                Bu profesyonelin tüm aktif atamaları sonlandırılacak. Devam etmek istiyor musunuz?
              </p>
            </div>
            <DialogFooter className="gap-3 mt-8">
              <Button variant="ghost" onClick={() => setArchiveId(null)} className="rounded-xl font-bold text-xs text-slate-400">İptal</Button>
              <Button
                variant="destructive"
                disabled={archiveMutation.isPending}
                onClick={() => archiveId && archiveMutation.mutate(archiveId)}
                className="rounded-xl px-6 font-bold text-xs bg-rose-500 hover:bg-rose-600 text-white"
              >
                {archiveMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Archive className="w-4 h-4 mr-2" />}
                Arşivle
              </Button>
            </DialogFooter>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
