import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Building2, MapPin, Search, Filter, 
  LayoutGrid, List, ChevronRight, Shield, 
  Users, Activity, Building, ArrowRight, ChevronDown,
  RefreshCw, Calendar as CalendarIcon, Save, Loader2, Eye
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
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
}

export default function PanelFacilitiesPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dangerFilter, setDangerFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Update States
  const [isBulkUpdateOpen, setIsBulkUpdateOpen] = useState(false);
  const [isSingleUpdateOpen, setIsSingleUpdateOpen] = useState(false);
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [updateDate, setUpdateDate] = useState(new Date().toISOString().split('T')[0]);
  const [singleCount, setSingleCount] = useState<string>('');
  const [bulkCounts, setBulkCounts] = useState<Record<string, string>>({});

  const { data: facilities = [], isLoading } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    }
  });

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
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success('Çalışan sayısı güncellendi');
      setIsSingleUpdateOpen(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const bulkUpdateMutation = useMutation({
    mutationFn: async (data: { updates: { id: string, count: number }[], effectiveDate: string }) => {
      const res = await api.post('/settings/facilities/bulk-employee-count', data);
      if (!res.ok) throw new Error('Toplu güncelleme başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      toast.success('Tüm tesisler güncellendi');
      setIsBulkUpdateOpen(false);
    },
    onError: (err) => toast.error(err.message)
  });

  const filteredFacilities = facilities.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         f.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesDanger = dangerFilter === 'all' || f.dangerClass === dangerFilter;
    const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? f.isActive : !f.isActive);
    return matchesSearch && matchesType && matchesStatus && matchesDanger;
  });

  // Tesis tipine göre gruplama ve sıralama
  const groupedFacilities = filteredFacilities.reduce((acc, f) => {
    if (!acc[f.type]) acc[f.type] = [];
    acc[f.type].push(f);
    return acc;
  }, {} as Record<string, Facility[]>);

  // Grupları sırala: Hastane en üstte, sonra alfabetik
  const sortedTypes = Object.keys(groupedFacilities).sort((a, b) => {
    if (a === 'Hastane') return -1;
    if (b === 'Hastane') return 1;
    return a.localeCompare(b, 'tr');
  });

  // Grup içindeki tesisleri alfabetik sırala
  sortedTypes.forEach(type => {
    groupedFacilities[type].sort((a, b) => a.name.localeCompare(b.name, 'tr'));
  });

  const handleView = (facility: Facility) => {
    navigate(`/panel/facilities/${facility.id}`);
  };

  const openSingleUpdate = (facility: Facility) => {
    setSelectedFacility(facility);
    setSingleCount(facility.employeeCount.toString());
    setIsSingleUpdateOpen(true);
  };

  const openBulkUpdate = () => {
    const initialCounts: Record<string, string> = {};
    facilities.forEach(f => {
      initialCounts[f.id] = f.employeeCount.toString();
    });
    setBulkCounts(initialCounts);
    setIsBulkUpdateOpen(true);
  };

  const handleSingleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFacility) return;
    singleUpdateMutation.mutate({
      id: selectedFacility.id,
      count: parseInt(singleCount),
      effectiveDate: updateDate
    });
  };

  const handleBulkSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const updates = Object.entries(bulkCounts).map(([id, count]) => ({
      id,
      count: parseInt(count)
    }));
    bulkUpdateMutation.mutate({
      updates,
      effectiveDate: updateDate
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 bg-muted rounded animate-pulse" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => <div key={i} className="h-32 bg-muted rounded-xl animate-pulse" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Tesis Yönetimi</h1>
          <p className="text-muted-foreground text-sm">Sistemde kayıtlı tesislerin atama durumlarını ve genel bilgilerini takip edin.</p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button onClick={openBulkUpdate} className="bg-primary hover:bg-primary/90 text-white gap-2 px-6 h-10 rounded-xl shadow-md shadow-primary/10 font-semibold text-xs">
            <RefreshCw className="w-4 h-4" /> Toplu Güncelle
          </Button>
          <div className="flex items-center gap-2 bg-muted p-1 rounded-lg border">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('list')}
              className={cn("h-8 px-3", viewMode === 'list' && "bg-background shadow-sm")}
            >
              <List className="w-4 h-4 mr-2" /> Liste
            </Button>
            <Button 
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
              size="sm" 
              onClick={() => setViewMode('grid')}
              className={cn("h-8 px-3", viewMode === 'grid' && "bg-background shadow-sm")}
            >
              <LayoutGrid className="w-4 h-4 mr-2" /> Kart
            </Button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-card p-4 rounded-xl border shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tesis adı veya koduna göre ara..." 
            className="pl-9 bg-muted/30 border-none h-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-muted/30 border-none">
              <SelectValue placeholder="Tesis Tipi" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              {FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={dangerFilter} onValueChange={setDangerFilter}>
            <SelectTrigger className="w-[160px] h-10 bg-muted/30 border-none">
              <SelectValue placeholder="Tehlike Sınıfı" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Sınıflar</SelectItem>
              {DANGER_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px] h-10 bg-muted/30 border-none">
              <SelectValue placeholder="Durum" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Durumlar</SelectItem>
              <SelectItem value="active">Aktif</SelectItem>
              <SelectItem value="passive">Pasif</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {viewMode === 'list' ? (
        <Accordion type="multiple" defaultValue={sortedTypes} className="space-y-4">
          {sortedTypes.map(type => (
            <AccordionItem key={type} value={type} className="border rounded-xl bg-card overflow-hidden shadow-sm border-none">
              <AccordionTrigger className="hover:no-underline px-6 py-4 bg-muted/30 group text-left">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-background rounded-xl flex items-center justify-center text-primary shadow-sm border group-hover:scale-105 transition-transform">
                    {type === 'Hastane' ? <Building2 className="w-5 h-5" /> : <Building className="w-5 h-5" />}
                  </div>
                  <div className="flex flex-col items-start gap-0.5 text-left">
                    <span className="text-base font-bold">{type}</span>
                    <span className="text-[10px] text-muted-foreground font-semibold tracking-wide">{groupedFacilities[type].length} Tesis</span>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-muted/10 border-b">
                        <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground tracking-wider">Tesis Bilgisi</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground tracking-wider">Tehlike Sınıfı</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground tracking-wider text-center">Çalışan</th>
                        <th className="px-6 py-3 text-[10px] font-bold text-muted-foreground tracking-wider">Durum</th>
                        <th className="px-6 py-3 text-right"></th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {groupedFacilities[type].map((f) => (
                        <tr key={f.id} className="hover:bg-muted/20 transition-colors group">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 bg-background rounded-lg flex items-center justify-center text-muted-foreground border group-hover:text-primary transition-colors">
                                <Building2 className="w-4 h-4" />
                              </div>
                              <div>
                                <div className="font-semibold text-sm cursor-pointer hover:text-primary transition-colors" onClick={() => handleView(f)}>{f.name}</div>
                                <div className="text-[10px] font-mono text-muted-foreground">{f.id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <Badge variant="outline" className={cn(
                              "text-[10px] font-bold px-2 py-0",
                              f.dangerClass === 'Çok Tehlikeli' ? "border-rose-200 text-rose-600 bg-rose-50" : 
                              f.dangerClass === 'Tehlikeli' ? "border-amber-200 text-amber-600 bg-amber-50" : 
                              "border-emerald-200 text-emerald-600 bg-emerald-50"
                            )}>
                              {f.dangerClass}
                            </Badge>
                          </td>
                          <td className="px-6 py-4 text-center">
                            <button 
                              onClick={() => openSingleUpdate(f)}
                              className="inline-flex items-center gap-1.5 px-3 py-1 bg-muted hover:bg-primary/10 hover:text-primary transition-colors rounded-full text-[11px] font-bold border border-transparent hover:border-primary/20"
                            >
                              <Users className="w-3 h-3" />
                              {f.employeeCount || 0}
                            </button>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <div className={cn("w-1.5 h-1.5 rounded-full", f.isActive ? "bg-emerald-500" : "bg-slate-300")} />
                              <span className="text-[11px] font-medium">{f.isActive ? "Aktif" : "Pasif"}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => handleView(f)}
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                                title="Detayları Gör"
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => openSingleUpdate(f)}
                                className="h-8 w-8 p-0 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/5"
                                title="Çalışan Güncelle"
                              >
                                <RefreshCw className="w-3.5 h-3.5" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                onClick={() => navigate('/panel/assignments', { state: { facilityId: f.id } })} 
                                className="h-8 px-3 rounded-lg text-primary hover:text-primary hover:bg-primary/5 font-semibold text-[11px] gap-2"
                              >
                                Atamalar <ArrowRight className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredFacilities.map((f) => (
            <Card key={f.id} className="group hover:shadow-lg transition-all duration-300 border-none shadow-sm overflow-hidden flex flex-col">
              <CardHeader className="p-5 pb-0">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-12 h-12 bg-primary/5 rounded-2xl flex items-center justify-center text-primary border border-primary/10 group-hover:scale-110 transition-transform">
                    <Building2 className="w-6 h-6" />
                  </div>
                  <Badge variant={f.isActive ? "outline" : "secondary"} className={cn(
                    "font-bold text-[10px] px-2 py-0.5",
                    f.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                  )}>
                    {f.isActive ? "Aktif" : "Pasif"}
                  </Badge>
                </div>
                <div>
                  <h3 className="font-bold text-base line-clamp-1 group-hover:text-primary transition-colors cursor-pointer" onClick={() => handleView(f)}>{f.name}</h3>
                  <p className="text-[10px] font-mono text-muted-foreground tracking-wide mt-0.5">{f.id}</p>
                </div>
              </CardHeader>
              <CardContent className="p-5 flex-1 flex flex-col pt-6">
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="bg-muted/30 p-2.5 rounded-xl">
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wide mb-1">Tesis Tipi</p>
                    <p className="text-xs font-semibold">{f.type}</p>
                  </div>
                  <button 
                    onClick={() => openSingleUpdate(f)}
                    className="bg-muted/30 p-2.5 rounded-xl text-left hover:bg-primary/5 transition-colors border border-transparent hover:border-primary/20 group/count"
                  >
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wide mb-1 group-hover/count:text-primary">Çalışan</p>
                    <p className="text-xs font-bold text-primary flex items-center gap-2">
                      {f.employeeCount || 0}
                      <RefreshCw className="w-3 h-3 opacity-0 group-hover/count:opacity-100 transition-opacity" />
                    </p>
                  </button>
                  <div className="bg-muted/30 p-2.5 rounded-xl col-span-2">
                    <p className="text-[9px] font-bold text-muted-foreground tracking-wide mb-1">Tehlike Sınıfı</p>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        f.dangerClass === 'Çok Tehlikeli' ? "bg-rose-500" : 
                        f.dangerClass === 'Tehlikeli' ? "bg-amber-500" : "bg-emerald-500"
                      )} />
                      <p className="text-xs font-semibold">{f.dangerClass}</p>
                    </div>
                  </div>
                </div>
                
                <Button 
                  onClick={() => handleView(f)}
                  className="w-full bg-primary/5 hover:bg-primary hover:text-white text-primary border-none shadow-none h-10 rounded-xl transition-all font-bold text-xs gap-2"
                >
                  Detayları Gör <Eye className="w-4 h-4" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Individual Update Dialog */}
      <Dialog open={isSingleUpdateOpen} onOpenChange={setIsSingleUpdateOpen}>
        <DialogContent className="max-w-md p-0 overflow-hidden border-none shadow-2xl rounded-2xl bg-white dark:bg-slate-950">
          <DialogHeader className="p-6 bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-4">
              <div className="w-10 h-10 bg-white/5 rounded-lg flex items-center justify-center border border-white/10">
                <Users className="w-4 h-4 text-primary/80" />
              </div>
              <div>
                <DialogTitle className="text-lg font-semibold tracking-tight">Çalışan Güncelle</DialogTitle>
                <DialogDescription className="text-slate-400 text-xs">
                  {selectedFacility?.name}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <form onSubmit={handleSingleSubmit} className="p-6 space-y-5">
            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 tracking-wide ml-1">Geçerlilik Tarihi</label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="date" 
                    value={updateDate} 
                    onChange={e => setUpdateDate(e.target.value)} 
                    className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-medium"
                    required
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-semibold text-slate-400 tracking-wide ml-1">Yeni Çalışan Sayısı</label>
                <div className="relative">
                  <Users className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input 
                    type="number" 
                    value={singleCount} 
                    onChange={e => setSingleCount(e.target.value)} 
                    placeholder="Sayı giriniz..."
                    className="pl-10 h-11 rounded-xl bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-sm font-semibold text-primary"
                    required
                  />
                </div>
              </div>
            </div>
            <DialogFooter className="pt-2 flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={() => setIsSingleUpdateOpen(false)} className="rounded-xl h-10 px-6 font-semibold text-xs text-slate-500">Vazgeç</Button>
              <Button type="submit" disabled={singleUpdateMutation.isPending} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-8 font-semibold gap-2 shadow-sm text-xs flex-1 sm:flex-none">
                {singleUpdateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Güncelle
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Bulk Update Dialog */}
      <Dialog open={isBulkUpdateOpen} onOpenChange={setIsBulkUpdateOpen}>
        <DialogContent className="sm:max-w-[1200px] w-[95vw] h-[85vh] flex flex-col p-0 gap-0 border-none shadow-2xl rounded-2xl bg-white dark:bg-slate-950 overflow-hidden">
          <DialogHeader className="p-8 bg-slate-900 text-white relative overflow-hidden shrink-0">
            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center border border-white/10">
                  <RefreshCw className="w-5 h-5 text-primary/80" />
                </div>
                <div>
                  <DialogTitle className="text-xl font-semibold tracking-tight">Toplu Çalışan Güncelleme</DialogTitle>
                  <DialogDescription className="text-slate-400 text-sm">Tesislerin çalışan verilerini merkezi olarak düzenleyin.</DialogDescription>
                </div>
              </div>

              <div className="flex items-center gap-4 bg-white/5 p-2 px-4 rounded-xl border border-white/10 min-w-[220px]">
                <div className="flex flex-col">
                  <span className="text-[10px] font-medium text-slate-500 tracking-wide">Geçerlilik Tarihi</span>
                  <Input 
                    type="date" 
                    value={updateDate} 
                    onChange={e => setUpdateDate(e.target.value)} 
                    className="bg-transparent border-none text-white font-medium p-0 h-auto focus-visible:ring-0 text-sm cursor-pointer"
                  />
                </div>
                <CalendarIcon className="w-4 h-4 text-slate-500 ml-auto" />
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-hidden flex flex-col p-8 space-y-6 bg-slate-50/30 dark:bg-slate-950">
            <div className="relative group max-w-md">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input 
                placeholder="Tesis ara..." 
                className="pl-10 h-11 rounded-xl bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 shadow-sm focus:ring-1 focus:ring-primary/20 text-sm transition-all"
                onChange={(e) => {
                  const term = e.target.value.toLowerCase();
                  const rows = document.querySelectorAll('.bulk-row');
                  rows.forEach((row: any) => {
                    const text = row.dataset.name.toLowerCase() + row.dataset.id.toLowerCase();
                    row.style.display = text.includes(term) ? 'table-row' : 'none';
                  });
                }}
              />
            </div>

            <div className="flex-1 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden flex flex-col">
              <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-slate-200 dark:scrollbar-thumb-slate-800">
                <table className="w-full text-left border-collapse">
                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-900 z-10 border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 tracking-wide">Tesis Adı / Kod</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 tracking-wide text-center">Mevcut</th>
                      <th className="px-6 py-4 text-[10px] font-semibold text-slate-400 tracking-wide text-right w-[180px]">Yeni Değer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {facilities.map(f => (
                      <tr key={f.id} data-name={f.name} data-id={f.id} className="bulk-row hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors group">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-slate-100 dark:bg-slate-800 rounded-lg flex items-center justify-center text-slate-400 group-hover:text-primary transition-colors shadow-sm border border-slate-200/50 dark:border-slate-700/50">
                              <Building2 className="w-4 h-4" />
                            </div>
                            <div>
                              <div className="font-medium text-slate-700 dark:text-slate-200 text-sm">{f.name}</div>
                              <div className="text-[10px] font-mono text-slate-400 uppercase mt-0.5">{f.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="text-xs font-semibold text-slate-500 bg-slate-100 dark:bg-slate-800 px-2.5 py-1 rounded-md">
                            {f.employeeCount}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="relative inline-block w-28">
                            <Input 
                              type="number" 
                              value={bulkCounts[f.id] || ''} 
                              onChange={e => setBulkCounts({...bulkCounts, [f.id]: e.target.value})}
                              className="h-9 rounded-lg bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 font-semibold text-center text-primary text-sm focus:ring-2 focus:ring-primary/10"
                              placeholder="-"
                            />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <DialogFooter className="p-6 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-4 shrink-0">
            <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[9px] font-semibold text-slate-400 tracking-wide">Kapsam</span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200">{facilities.length} Tesis</span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden md:block border-l pl-6">
                Girilen değerler tesislerin ana çalışan sayısını güncelleyecektir.
              </p>
            </div>
            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Button type="button" variant="ghost" onClick={() => setIsBulkUpdateOpen(false)} className="rounded-xl h-10 px-6 font-semibold text-slate-500 text-xs">Vazgeç</Button>
              <Button onClick={handleBulkSubmit} disabled={bulkUpdateMutation.isPending} className="bg-slate-900 hover:bg-slate-800 text-white rounded-xl h-10 px-8 font-semibold gap-2 shadow-sm transition-all text-xs">
                {bulkUpdateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Değişiklikleri Kaydet
              </Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {filteredFacilities.length === 0 && (
        <div className="text-center py-24 bg-card rounded-3xl border-2 border-dashed">
          <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-20" />
          <h3 className="text-xl font-semibold mb-2">Tesis Bulunamadı</h3>
          <p className="text-muted-foreground max-w-xs mx-auto">Arama kriterlerinize uygun tesis bulunmamaktadır.</p>
        </div>
      )}
    </div>
  );
}
