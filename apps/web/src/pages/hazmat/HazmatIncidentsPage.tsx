import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, ShieldAlert, 
  Calendar, MapPin, Clock, Loader2,
  MoreVertical, Edit, Trash2, Eye,
  Skull, HeartPulse, LayoutGrid, List,
  FileText, CheckCircle2, ChevronRight, XCircle, Info,
  PieChart as PieChartIcon
} from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import { toast } from 'sonner';
import HazmatIncidentReportPage from './HazmatIncidentReportPage';

const PIE_COLORS = [
  '#6366f1', // Indigo
  '#ef4444', // Red
  '#f59e0b', // Amber
  '#10b981', // Emerald
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#ec4899', // Pink
  '#3b82f6', // Blue
  '#84cc16', // Lime
  '#f97316', // Orange
  '#14b8a6', // Teal
  '#a855f7', // Violet
];

export default function HazmatIncidentsPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [viewingIncident, setViewingIncident] = useState<any>(null);

  // Filter State
  const [selectedFacility, setSelectedFacility] = useState<string>('all');
  const [incidentTypeFilter, setIncidentTypeFilter] = useState<string>('all');
  const [rootCauseFilter, setRootCauseFilter] = useState<string>('all');

  const isAdmin = Boolean(user?.isAdmin || user?.isManagement || user?.roles?.includes('admin') || user?.roles?.includes('management'));

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    }
  });

  const { data: incidentTypes = [] } = useQuery<any[]>({ 
    queryKey: ['hazmat-incident-types'], 
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/incident-types');
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    }
  });

  const { data: rootCauses = [] } = useQuery<any[]>({ 
    queryKey: ['hazmat-root-causes'], 
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/root-causes');
      if (!res.ok) return [];
      const d = await res.json();
      return Array.isArray(d) ? d : [];
    }
  });

  const { data: incidents = [], isLoading } = useQuery<any[]>({
    queryKey: ['hazmat-incidents', selectedFacility],
    queryFn: async () => {
      const url = selectedFacility && selectedFacility !== 'all' ? `/hazmat/incidents?facilityId=${selectedFacility}` : '/hazmat/incidents';
      const res = await api.get(url);
      if (!res.ok) return [];
      const data = await res.json();
      return Array.isArray(data) ? data : [];
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/incidents/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-incidents'] });
      toast.success('Olay kaydı silindi.');
    },
    onError: () => {
      toast.error('Olay silinemedi.');
    }
  });

  const handleDelete = (id: string) => {
    if (window.confirm('Bu olay kaydını silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const handlePrint = (incident: any) => {
    setViewingIncident(incident);
    setIsReportOpen(true);
  };

  const safeFormatDate = (date: any, formatStr: string) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return format(d, formatStr, { locale: tr });
    } catch {
      return '-';
    }
  };

  // Filtered Data
  const filteredIncidents = useMemo(() => {
    return incidents.filter((incident) => {
      // Search
      const matchSearch =
        !searchTerm ||
        incident.facility?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.category?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.incidentType?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.rootCause?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.rootCauseDef?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        incident.incidentMode?.toLowerCase().includes(searchTerm.toLowerCase());

      // Incident Type Filter
      const matchType =
        incidentTypeFilter === 'all' ||
        String(incident.incidentTypeId) === incidentTypeFilter ||
        String(incident.categoryId) === incidentTypeFilter ||
        incident.incidentType?.name === incidentTypeFilter ||
        incident.category?.name === incidentTypeFilter;

      // Root Cause Filter
      const matchRootCause =
        rootCauseFilter === 'all' ||
        String(incident.rootCauseId) === rootCauseFilter ||
        incident.rootCause === rootCauseFilter ||
        incident.rootCauseDef?.name === rootCauseFilter;

      return matchSearch && matchType && matchRootCause;
    });
  }, [incidents, searchTerm, incidentTypeFilter, rootCauseFilter]);

  // Stats calculation
  const stats = useMemo(() => {
    return {
      total: incidents.length,
      kitsUsed: incidents.filter((i) => i.kitUsed).length,
      injured: incidents.reduce((sum, i) => sum + (i.injuredCount || 0), 0),
      deceased: incidents.reduce((sum, i) => sum + (i.deceasedCount || 0), 0),
    };
  }, [incidents]);

  // Pie chart distribution for Incident Types (Olay Türleri Dağılımı)
  const pieData = useMemo(() => {
    const counts: Record<string, number> = {};
    incidents.forEach((inc) => {
      const typeName = inc.incidentType?.name || inc.category?.name || 'Belirtilmemiş';
      counts[typeName] = (counts[typeName] || 0) + 1;
    });
    const total = incidents.length;
    return Object.entries(counts)
      .map(([name, value], index) => ({
        name,
        value,
        percentage: total > 0 ? ((value / total) * 100).toFixed(1) : '0',
        color: PIE_COLORS[index % PIE_COLORS.length]
      }))
      .sort((a, b) => b.value - a.value);
  }, [incidents]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12 font-sans antialiased">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Olağan Dışı Olaylar
            </h1>
            <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
              {incidents.length} Kayıt
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tehlikeli madde sızıntısı, dökülmesi veya diğer olağan dışı olayların takibi ve raporlanması.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="flex items-center bg-muted rounded-lg p-1 border">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setViewMode('list')}
              title="Liste Görünümü"
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'card' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setViewMode('card')}
              title="Kart Görünümü"
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Button 
            onClick={() => navigate('/hazmat/incidents/new')} 
            className="shadow-sm gap-2 h-9 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" /> Yeni Olay Bildirimi
          </Button>
        </div>
      </div>

      {/* KPI Kartları */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Card className="shadow-2xs border-border/70">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center shrink-0 border border-purple-500/20">
              <ShieldAlert className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">TOPLAM OLAY</p>
              <p className="text-2xl font-black text-foreground">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-2xs border-border/70">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
              <CheckCircle2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">KULLANILAN KİT</p>
              <p className="text-2xl font-black text-foreground">{stats.kitsUsed}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-2xs border-border/70">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center shrink-0 border border-orange-500/20">
              <HeartPulse className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">YARALI SAYISI</p>
              <p className="text-2xl font-black text-foreground">{stats.injured}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-2xs border-border/70">
          <CardContent className="p-4 flex items-center gap-3.5">
            <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center shrink-0 border border-rose-500/20">
              <Skull className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">ÖLÜ SAYISI</p>
              <p className="text-2xl font-black text-foreground">{stats.deceased}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Olay Türleri Dağılımı - Pasta / Halka Grafik */}
      <Card className="shadow-2xs border-border/70 overflow-hidden bg-card">
        <CardHeader className="p-4 pb-3 border-b border-border/60 bg-muted/20">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center border border-indigo-500/20 shrink-0">
                <PieChartIcon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <CardTitle className="text-sm font-bold text-foreground">
                  Olay Türleri Dağılımı
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  {isAdmin 
                    ? (selectedFacility && selectedFacility !== 'all' 
                        ? `${facilities.find((f) => f.id === selectedFacility)?.name || 'Seçili Tesis'} Olay Dağılımı` 
                        : 'Tüm Tesisler Genel Olay Dağılımı')
                    : 'Tesis Olay Türleri Dağılımı'}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs font-semibold px-2.5 py-1 bg-background border-border">
                Toplam {incidents.length} Olay &bull; {pieData.length} Farklı Olay Türü
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {pieData.length > 0 ? (
            <div className="flex flex-col md:flex-row items-center gap-6">
              {/* Sol Taraf: Donut Chart */}
              <div className="w-full md:w-[240px] h-[210px] relative flex items-center justify-center shrink-0">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const data = payload[0].payload;
                          return (
                            <div className="bg-popover text-popover-foreground border border-border shadow-md rounded-lg px-3 py-2 text-xs">
                              <div className="font-bold flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: data.color }} />
                                {data.name}
                              </div>
                              <div className="text-muted-foreground mt-1 flex items-center justify-between gap-4">
                                <span>Olay Sayısı:</span>
                                <span className="font-semibold text-foreground">{data.value} adet</span>
                              </div>
                              <div className="text-muted-foreground flex items-center justify-between gap-4">
                                <span>Oran:</span>
                                <span className="font-semibold text-indigo-500">%{data.percentage}</span>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-foreground">{incidents.length}</span>
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">OLAY</span>
                </div>
              </div>

              {/* Sağ Taraf: Olay Türleri Kırılım Listesi */}
              <div className="flex-1 w-full grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[220px] overflow-y-auto pr-1">
                {pieData.map((d, i) => (
                  <div
                    key={i}
                    onClick={() => setIncidentTypeFilter(incidentTypeFilter === d.name ? 'all' : d.name)}
                    className={`flex items-center justify-between p-2.5 rounded-lg border text-xs transition-all cursor-pointer ${
                      incidentTypeFilter === d.name
                        ? 'bg-primary/10 border-primary text-primary font-semibold shadow-2xs'
                        : 'bg-muted/30 border-border/60 hover:bg-muted/60 text-foreground'
                    }`}
                    title="Bu olay türüne göre filtrelemek için tıklayın"
                  >
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                      <span className="w-3 h-3 rounded-full shrink-0 shadow-2xs" style={{ backgroundColor: d.color }} />
                      <span className="truncate font-medium">{d.name}</span>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-bold">
                        {d.value}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground font-mono font-semibold w-11 text-right">
                        %{d.percentage}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground text-xs">
              Grafik oluşturmak için henüz kayıtlı olay bulunmuyor.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Filtreleme Araç Çubuğu */}
      <Card className="shadow-2xs border-border/70">
        <CardContent className="p-3.5 space-y-3">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input 
                placeholder="Olay, tesis veya kök neden ara..." 
                className="pl-9 h-9 text-xs bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Yalnızca Yöneticiler için Tesis Filtresi */}
              {isAdmin && (
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                    <SelectValue>
                      {selectedFacility === 'all' || !selectedFacility 
                        ? "Tüm Tesisler" 
                        : (facilities.find((f) => f.id === selectedFacility)?.name || "Tesis Seçiniz")}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all" className="text-xs">Tüm Tesisler</SelectItem>
                    {facilities.map((f) => (
                      <SelectItem key={f.id} value={f.id} className="text-xs">{f.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              
              {/* Olay Türleri Filtresi */}
              <Select value={incidentTypeFilter} onValueChange={setIncidentTypeFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                  <SelectValue>
                    {incidentTypeFilter === 'all' 
                      ? "Tüm Olay Türleri" 
                      : (incidentTypes.find((c) => String(c.id) === incidentTypeFilter || c.name === incidentTypeFilter)?.name || incidentTypeFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Olay Türleri</SelectItem>
                  {incidentTypes.map((c) => (
                    <SelectItem key={c.id} value={c.name} className="text-xs">{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Kök Nedenler Filtresi */}
              <Select value={rootCauseFilter} onValueChange={setRootCauseFilter}>
                <SelectTrigger className="w-full sm:w-[180px] h-9 text-xs">
                  <SelectValue>
                    {rootCauseFilter === 'all' 
                      ? "Tüm Kök Nedenler" 
                      : (rootCauses.find((r) => String(r.id) === rootCauseFilter || r.name === rootCauseFilter)?.name || rootCauseFilter)}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-xs">Tüm Kök Nedenler</SelectItem>
                  {rootCauses.map((r) => (
                    <SelectItem key={r.id} value={r.name} className="text-xs">{r.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Temizle Butonu */}
              {(searchTerm || (isAdmin && selectedFacility !== 'all' && selectedFacility !== '') || incidentTypeFilter !== 'all' || rootCauseFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm(''); 
                    if (isAdmin) setSelectedFacility('all'); 
                    setIncidentTypeFilter('all'); 
                    setRootCauseFilter('all');
                  }}
                  className="text-xs h-9 px-2.5 text-muted-foreground hover:text-primary"
                >
                  <XCircle className="w-3.5 h-3.5 mr-1" /> Temizle
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Olay Listesi / Kart Görünümü */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-44 rounded-xl bg-muted/60 animate-pulse border border-border/50" />
          ))}
        </div>
      ) : filteredIncidents.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredIncidents.map((incident) => (
              <Card 
                key={incident.id} 
                className="shadow-2xs hover:shadow-md transition-all border-border/70 overflow-hidden group bg-card cursor-pointer"
                onClick={() => navigate(`/hazmat/incidents/view/${incident.id}`)}
              >
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1 min-w-0 flex-1">
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/30 text-[10px] font-semibold">
                      {incident.incidentType?.name || incident.category?.name || 'Olay'}
                    </Badge>
                    <CardTitle className="text-sm font-bold line-clamp-1 group-hover:text-primary transition-colors mt-1">
                      {incident.incidentMode || incident.rootCause || 'Özet Belirtilmemiş'}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-7 w-7 p-0 shrink-0">
                        <MoreVertical className="w-3.5 h-3.5" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="text-xs">
                      <DropdownMenuItem onClick={() => navigate(`/hazmat/incidents/view/${incident.id}`)}>
                        <Eye className="w-3.5 h-3.5 mr-2" /> Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handlePrint(incident)}>
                        <FileText className="w-3.5 h-3.5 mr-2" /> Rapor Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => navigate(`/hazmat/incidents/edit/${incident.id}`)}>
                        <Edit className="w-3.5 h-3.5 mr-2" /> Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(incident.id)}>
                        <Trash2 className="w-3.5 h-3.5 mr-2" /> Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 pt-1 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5 shrink-0" />
                    <span>{safeFormatDate(incident.incidentDate, 'dd MMMM yyyy, HH:mm')}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="truncate">
                      {incident.location?.name || incident.department?.name || 'Konum Belirtilmemiş'} {incident.facility?.name && `(${incident.facility.name})`}
                    </span>
                  </div>

                  <div className="pt-1 flex flex-wrap gap-1.5">
                    {incident.kitUsed && (
                      <Badge variant="outline" className="text-[10px] text-blue-600 bg-blue-500/10 border-blue-200">
                        Kit Kullanıldı
                      </Badge>
                    )}
                    {incident.injuredCount > 0 && (
                      <Badge variant="outline" className="text-[10px] text-orange-600 bg-orange-500/10 border-orange-200">
                        {incident.injuredCount} Yaralı
                      </Badge>
                    )}
                    {incident.deceasedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] text-rose-600 bg-rose-500/10 border-rose-200 font-bold">
                        {incident.deceasedCount} Vefat
                      </Badge>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t border-border/50 flex items-center justify-between">
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 text-[11px] font-medium p-0 hover:bg-transparent text-primary hover:translate-x-0.5 transition-transform"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/hazmat/incidents/view/${incident.id}`);
                      }}
                    >
                      Detaylar <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      #{incident.id.slice(0, 6)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-2xs border-border/70 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40">
                  <TableHead className="w-[110px] text-xs">Tarih</TableHead>
                  <TableHead className="text-xs">Tesis</TableHead>
                  <TableHead className="text-xs">Olay Türü</TableHead>
                  <TableHead className="max-w-[280px] text-xs">Özet / Kök Neden</TableHead>
                  <TableHead className="text-xs">Lokasyon</TableHead>
                  <TableHead className="text-center text-xs">Etki / Kit</TableHead>
                  <TableHead className="text-right text-xs">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map((incident) => (
                  <TableRow 
                    key={incident.id} 
                    className="group hover:bg-muted/30 cursor-pointer" 
                    onClick={() => navigate(`/hazmat/incidents/view/${incident.id}`)}
                  >
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      {safeFormatDate(incident.incidentDate, 'dd.MM.yyyy')}
                      <br />
                      <span className="text-muted-foreground">{safeFormatDate(incident.incidentDate, 'HH:mm')}</span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{incident.facility?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-purple-500/10 text-purple-600 dark:text-purple-400 border-none text-[10px]">
                        {incident.incidentType?.name || incident.category?.name || 'Olay'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[280px] truncate">
                      {incident.incidentMode || incident.rootCause || '-'}
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {incident.location?.name || incident.department?.name || '-'}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        {incident.kitUsed && <Badge className="bg-blue-500 h-2 w-2 rounded-full p-0" title="Kit Kullanıldı" />}
                        {incident.injuredCount > 0 && <Badge className="bg-orange-500 h-2 w-2 rounded-full p-0" title="Yaralı" />}
                        {incident.deceasedCount > 0 && <Badge className="bg-red-500 h-2 w-2 rounded-full p-0" title="Ölü" />}
                        {incident.serviceInterrupted && <Badge className="bg-amber-500 h-2 w-2 rounded-full p-0" title="Kesinti" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center justify-end gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => handlePrint(incident)}
                          title="Rapor Yazdır"
                        >
                          <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0" 
                          onClick={() => navigate(`/hazmat/incidents/edit/${incident.id}`)}
                          title="Düzenle"
                        >
                          <Edit className="w-3.5 h-3.5 text-muted-foreground" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10" 
                          onClick={() => handleDelete(incident.id)}
                          title="Sil"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )
      ) : (
        <div className="col-span-full py-16 text-center bg-card rounded-xl border border-dashed border-border/70">
          <ShieldAlert className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-foreground">Olay Kaydı Bulunamadı</h3>
          <p className="text-xs text-muted-foreground mt-1">Arama kriterlerinizi değiştirmeyi veya yeni bir kayıt eklemeyi deneyin.</p>
        </div>
      )}

      {/* Rapor Önizleme / Yazdırma Modalı */}
      {isReportOpen && viewingIncident && (
        <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
          <DialogContent className="max-w-4xl max-h-[95vh] h-[90vh] overflow-hidden flex flex-col p-0">
            <HazmatIncidentReportPage incident={viewingIncident} onCancel={() => setIsReportOpen(false)} />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
