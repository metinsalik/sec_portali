import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { 
  Plus, Search, Filter, ShieldAlert, AlertTriangle, 
  Calendar, MapPin, Clock, Users, Siren, Loader2,
  MoreVertical, Edit, Trash2, ChevronRight, Eye,
  Skull, HeartPulse, HardHat, Construction, List, LayoutGrid,
  Download, FileText, CheckCircle2, XCircle, Info
} from 'lucide-react';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';
import { 
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from '@/components/ui/select';
import ExtraordinaryIncidentForm from './ExtraordinaryIncidentForm';

const ExtraordinaryIncidentsPage = () => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'card'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [editingIncident, setEditingIncident] = useState<any>(null);
  const [viewingIncident, setViewingIncident] = useState<any>(null);

  // Filter State
  const [selectedFacility, setSelectedFacility] = useState<string>('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [rootCauseFilter, setRootCauseFilter] = useState<string>('all');
  const [departmentFilter, setDepartmentFilter] = useState<string>('all');

  const isAdmin = user?.roles?.includes('admin') || user?.roles?.includes('management');

  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      return res.json();
    }
  });

  // Definition Queries
  const { data: categories = [] } = useQuery<any[]>({ queryKey: ['incident-categories'], queryFn: async () => (await api.get('/settings/definitions/incident-categories')).json() });
  const { data: rootCauses = [] } = useQuery<any[]>({ queryKey: ['incident-root-causes'], queryFn: async () => (await api.get('/settings/definitions/incident-root-causes')).json() });
  const { data: departments = [] } = useQuery<any[]>({ queryKey: ['departments'], queryFn: async () => (await api.get('/settings/definitions/departments')).json() });

  const { data: incidents = [], isLoading } = useQuery<any[]>({
    queryKey: ['incidents', selectedFacility],
    queryFn: async () => {
      const url = selectedFacility ? `/incidents?facilityId=${selectedFacility}` : '/incidents';
      const res = await api.get(url);
      return res.json();
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await api.delete(`/incidents/${id}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
    }
  });

  const filteredIncidents = incidents.filter(i => {
    const searchMatch = !searchTerm || 
      i.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.facility?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      i.category?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const categoryMatch = categoryFilter === 'all' || i.categoryId?.toString() === categoryFilter;
    const rootCauseMatch = rootCauseFilter === 'all' || i.rootCauseId?.toString() === rootCauseFilter;
    const departmentMatch = departmentFilter === 'all' || i.departmentId?.toString() === departmentFilter;

    return searchMatch && categoryMatch && rootCauseMatch && departmentMatch;
  });

  // Stats
  const stats = {
    total: filteredIncidents.length,
    injured: filteredIncidents.reduce((sum, i) => sum + (i.injuredCount || 0), 0),
    deceased: filteredIncidents.reduce((sum, i) => sum + (i.deceasedCount || 0), 0),
    interruption: filteredIncidents.reduce((sum, i) => sum + (i.interruptionDuration || 0), 0)
  };

  const handleEdit = (incident: any) => {
    setEditingIncident(incident);
    setIsFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Bu olay kaydını silmek istediğinize emin misiniz?')) {
      deleteMutation.mutate(id);
    }
  };

  const safeFormatDate = (date: any, formatStr: string) => {
    if (!date) return '-';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return '-';
      return format(d, formatStr, { locale: tr });
    } catch (e) {
      return '-';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Olağan Dışı Olaylar</h1>
          <p className="text-sm text-muted-foreground mt-1">Tesislerde gerçekleşen olağan dışı olayların takibi ve raporlanması.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1 border mr-2">
            <Button 
              variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setViewMode('list')}
            >
              <List className="w-4 h-4" />
            </Button>
            <Button 
              variant={viewMode === 'card' ? 'secondary' : 'ghost'} 
              size="sm" 
              className="h-8 w-8 p-0" 
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="w-4 h-4" />
            </Button>
          </div>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => { setEditingIncident(null); setIsFormOpen(true); }} className="shadow-sm shadow-primary/20">
                <Plus className="w-4 h-4 mr-2" /> Yeni Olay Bildirimi
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingIncident ? 'Olay Kaydını Düzenle' : 'Yeni Olağan Dışı Olay Bildirimi'}</DialogTitle>
              </DialogHeader>
              <ExtraordinaryIncidentForm 
                initialData={editingIncident} 
                onSuccess={() => {
                  setIsFormOpen(false);
                  queryClient.invalidateQueries({ queryKey: ['incidents'] });
                }}
                onCancel={() => setIsFormOpen(false)}
              />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="shadow-sm border-border/50 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center border border-blue-500/20 shadow-inner">
              <ShieldAlert className="w-6 h-6 text-blue-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">TOPLAM OLAY</p>
              <p className="text-3xl font-black">{stats.total}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 bg-gradient-to-br from-orange-50 to-white dark:from-orange-950/20 dark:to-background">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-orange-500/10 flex items-center justify-center border border-orange-500/20 shadow-inner">
              <HeartPulse className="w-6 h-6 text-orange-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">YARALI SAYISI</p>
              <p className="text-3xl font-black text-orange-600">{stats.injured}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center border border-red-500/20 shadow-inner">
              <Skull className="w-6 h-6 text-red-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">ÖLÜ SAYISI</p>
              <p className="text-3xl font-black text-red-600">{stats.deceased}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-border/50 bg-gradient-to-br from-amber-50 to-white dark:from-amber-950/20 dark:to-background">
          <CardContent className="p-4 flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 shadow-inner">
              <Clock className="w-6 h-6 text-amber-500" />
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest">KESİNTİ SÜRESİ</p>
              <div className="flex items-baseline gap-1">
                <p className="text-3xl font-black">{stats.interruption}</p>
                <span className="text-xs font-medium text-muted-foreground">saat</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="shadow-sm border-border/50">
        <CardContent className="p-4 space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input 
                placeholder="Olay, tesis veya kategori ara..." 
                className="pl-9 h-10 shadow-inner bg-muted/20"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(isAdmin || (user?.facilities && user.facilities.length > 1)) && (
                <Select value={selectedFacility} onValueChange={setSelectedFacility}>
                  <SelectTrigger className="w-[200px] h-10">
                    <SelectValue placeholder="Tüm Tesisler" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tüm Tesisler</SelectItem>
                    {facilities
                      .filter(f => isAdmin || user?.facilities?.includes(f.id))
                      .map(f => (
                        <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              )}
              
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Kategoriler</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id.toString()}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={rootCauseFilter} onValueChange={setRootCauseFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Kök Neden" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Nedenler</SelectItem>
                  {rootCauses.map(rc => (
                    <SelectItem key={rc.id} value={rc.id.toString()}>{rc.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={departmentFilter} onValueChange={setDepartmentFilter}>
                <SelectTrigger className="w-[160px] h-10">
                  <SelectValue placeholder="Departman" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tüm Departmanlar</SelectItem>
                  {departments.map(d => (
                    <SelectItem key={d.id} value={d.id.toString()}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {(searchTerm || selectedFacility || categoryFilter !== 'all' || rootCauseFilter !== 'all' || departmentFilter !== 'all') && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedFacility('');
                    setCategoryFilter('all');
                    setRootCauseFilter('all');
                    setDepartmentFilter('all');
                  }}
                  className="text-xs h-10 px-3 text-muted-foreground hover:text-primary"
                >
                  <XCircle className="w-4 h-4 mr-2" /> Temizle
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Incident List/Card View */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-64 rounded-xl bg-muted animate-pulse border border-border/50" />
          ))}
        </div>
      ) : filteredIncidents.length > 0 ? (
        viewMode === 'card' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredIncidents.map(incident => (
              <Card key={incident.id} className="shadow-sm hover:shadow-md transition-shadow border-border/50 overflow-hidden group bg-card">
                <CardHeader className="p-4 pb-2 flex flex-row items-start justify-between space-y-0">
                  <div className="space-y-1">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 border-none px-2 py-0">
                      {incident.category?.name}
                    </Badge>
                    <CardTitle className="text-md font-bold line-clamp-1 group-hover:text-primary transition-colors mt-1">
                      {incident.summary || 'Özet Belirtilmemiş'}
                    </CardTitle>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => { setViewingIncident(incident); setIsViewOpen(true); }}>
                        <Eye className="w-4 h-4 mr-2" /> Görüntüle
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleEdit(incident)}>
                        <Edit className="w-4 h-4 mr-2" /> Düzenle
                      </DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(incident.id)}>
                        <Trash2 className="w-4 h-4 mr-2" /> Sil
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </CardHeader>
                <CardContent className="p-4 pt-2 space-y-3">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    {safeFormatDate(incident.incidentDate, 'dd MMMM yyyy, HH:mm')}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Construction className="w-3.5 h-3.5" />
                    {incident.facility?.name}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5" />
                    {incident.department?.name} {incident.locationDetail && `- ${incident.locationDetail}`}
                  </div>

                  <div className="pt-2 flex flex-wrap gap-2">
                    {incident.injuredCount > 0 && (
                      <Badge variant="outline" className="text-[10px] text-orange-600 bg-orange-50 border-orange-200">
                        {incident.injuredCount} Yaralı
                      </Badge>
                    )}
                    {incident.deceasedCount > 0 && (
                      <Badge variant="outline" className="text-[10px] text-red-600 bg-red-50 border-red-200 font-bold">
                        {incident.deceasedCount} Ölü
                      </Badge>
                    )}
                    {incident.serviceInterrupted && (
                      <Badge variant="outline" className="text-[10px] text-amber-600 bg-amber-50 border-amber-200">
                        Kesinti: {incident.interruptionDuration} sa
                      </Badge>
                    )}
                  </div>
                  
                  <div className="pt-2 border-t flex items-center justify-between">
                    <span className="text-[10px] text-muted-foreground italic font-mono">
                      ID: #{incident.id.toString().padStart(5, '0')}
                    </span>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-7 text-[11px] font-medium p-0 hover:bg-transparent text-primary hover:translate-x-1 transition-transform"
                      onClick={() => { setViewingIncident(incident); setIsViewOpen(true); }}
                    >
                      Detaylar <ChevronRight className="w-3 h-3 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="shadow-sm border-border/50 overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/50">
                  <TableHead className="w-[100px]">Tarih</TableHead>
                  <TableHead>Tesis</TableHead>
                  <TableHead>Kategori</TableHead>
                  <TableHead className="max-w-[300px]">Özet</TableHead>
                  <TableHead>Departman</TableHead>
                  <TableHead className="text-center">Etki</TableHead>
                  <TableHead className="text-right">İşlemler</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIncidents.map(incident => (
                  <TableRow key={incident.id} className="group cursor-pointer hover:bg-muted/30" onClick={() => { setViewingIncident(incident); setIsViewOpen(true); }}>
                    <TableCell className="font-medium text-xs whitespace-nowrap">
                      {safeFormatDate(incident.incidentDate, 'dd.MM.yyyy')}
                      <br />
                      <span className="text-muted-foreground">{safeFormatDate(incident.incidentDate, 'HH:mm')}</span>
                    </TableCell>
                    <TableCell className="text-xs font-semibold">{incident.facility?.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px]">
                        {incident.category?.name}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs max-w-[300px] truncate">{incident.summary}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{incident.department?.name}</TableCell>
                    <TableCell>
                      <div className="flex justify-center gap-1">
                        {incident.injuredCount > 0 && <Badge className="bg-orange-500 h-2 w-2 rounded-full p-0" title="Yaralı" />}
                        {incident.deceasedCount > 0 && <Badge className="bg-red-500 h-2 w-2 rounded-full p-0" title="Ölü" />}
                        {incident.serviceInterrupted && <Badge className="bg-amber-500 h-2 w-2 rounded-full p-0" title="Kesinti" />}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); setViewingIncident(incident); setIsViewOpen(true); }}>
                          <Eye className="w-4 h-4 text-primary" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEdit(incident); }}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleDelete(incident.id); }}>
                          <Trash2 className="w-4 h-4 text-destructive" />
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
        <div className="col-span-full py-20 text-center bg-card rounded-2xl border-2 border-dashed border-border/50">
          <AlertTriangle className="w-12 h-12 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-muted-foreground">Olay Kaydı Bulunamadı</h3>
          <p className="text-sm text-muted-foreground mt-1">Arama kriterlerinizi değiştirmeyi veya yeni bir kayıt eklemeyi deneyin.</p>
        </div>
      )}

      {/* Detail View Modal */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader className="border-b pb-4">
            <div className="flex items-center gap-3">
              <Badge className="bg-primary/10 text-primary border-none">{viewingIncident?.category?.name}</Badge>
              <DialogTitle className="text-xl font-bold">Olay Detay Raporu</DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {viewingIncident?.facility?.name} - {safeFormatDate(viewingIncident?.incidentDate, 'dd MMMM yyyy, HH:mm')}
            </p>
          </DialogHeader>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 py-6">
            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold flex items-center gap-2 mb-3 text-primary uppercase tracking-wider">
                  <Info className="w-4 h-4" /> Olay Özeti
                </h4>
                <div className="bg-muted/30 p-4 rounded-xl border border-border/50 text-sm leading-relaxed italic">
                  "{viewingIncident?.summary}"
                </div>
              </section>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Bölüm / Alan</p>
                  <p className="text-sm font-medium">{viewingIncident?.department?.name} {viewingIncident?.locationDetail && `- ${viewingIncident?.locationDetail}`}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-[10px] text-muted-foreground font-bold uppercase">Kök Neden</p>
                  <p className="text-sm font-medium">{viewingIncident?.rootCause?.name || '-'}</p>
                </div>
              </div>

              <section className="space-y-3">
                <h4 className="text-sm font-bold mb-3 text-primary uppercase tracking-wider">Müdahale Bilgileri</h4>
                <div className="grid grid-cols-1 gap-2">
                  <div className="flex items-center justify-between text-sm py-1 border-b border-dashed">
                    <span className="text-muted-foreground">Müdahale Gereksinimi:</span>
                    <span className={viewingIncident?.interventionRequired ? 'text-primary font-bold' : 'text-muted-foreground'}>
                      {viewingIncident?.interventionRequired ? 'Evet' : 'Hayır'}
                    </span>
                  </div>
                  {viewingIncident?.interventionRequired && viewingIncident?.interventionTime && (
                    <div className="flex items-center justify-between text-sm py-1 border-b border-dashed">
                      <span className="text-muted-foreground">Müdahale Saati:</span>
                      <span className="font-medium">
                        {safeFormatDate(viewingIncident.interventionTime, 'HH:mm')}
                      </span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-sm py-1 border-b border-dashed">
                    <span className="text-muted-foreground">Kontrol Altına Alma:</span>
                    <span className="font-medium">
                      {safeFormatDate(viewingIncident?.controlTime, 'HH:mm')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1 border-b border-dashed">
                    <span className="text-muted-foreground">Destek Birimi:</span>
                    <span className="font-medium">{viewingIncident?.supportUnit?.name || 'Alınmadı'}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm py-1 border-b border-dashed">
                    <span className="text-muted-foreground">Acil Durum Kodu:</span>
                    <span className="font-medium">{viewingIncident?.emergencyCode?.name || 'Anons Yapılmadı'}</span>
                  </div>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section>
                <h4 className="text-sm font-bold mb-3 text-primary uppercase tracking-wider">Etki Bilgileri</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-orange-50 dark:bg-orange-950/20 p-3 rounded-lg border border-orange-200 shadow-sm">
                    <p className="text-[10px] text-orange-600 font-bold uppercase">Yaralı</p>
                    <p className="text-xl font-black text-orange-700">{viewingIncident?.injuredCount || 0}</p>
                  </div>
                  <div className="bg-red-50 dark:bg-red-950/20 p-3 rounded-lg border border-red-200 shadow-sm">
                    <p className="text-[10px] text-red-600 font-bold uppercase">Ölü</p>
                    <p className="text-xl font-black text-red-700">{viewingIncident?.deceasedCount || 0}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 shadow-sm">
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Tahliye Personel</p>
                    <p className="text-xl font-black text-blue-700">{viewingIncident?.evacuatedStaffCount || 0}</p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-950/20 p-3 rounded-lg border border-blue-200 shadow-sm">
                    <p className="text-[10px] text-blue-600 font-bold uppercase">Tahliye Hasta</p>
                    <p className="text-xl font-black text-blue-700">{viewingIncident?.evacuatedPatientCount || 0}</p>
                  </div>
                </div>
                {viewingIncident?.serviceInterrupted && (
                  <div className="mt-3 bg-amber-50 dark:bg-amber-950/20 p-3 rounded-lg border border-amber-200">
                    <p className="text-xs font-semibold text-amber-700 flex items-center gap-2">
                      <Clock className="w-4 h-4" /> Hizmet {viewingIncident?.interruptionDuration} saat kesintiye uğradı.
                    </p>
                  </div>
                )}
              </section>

              <section className="space-y-4">
                <h4 className="text-sm font-bold mb-3 text-primary uppercase tracking-wider">Detaylar</h4>
                <div className="space-y-3">
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Neden Detay</p>
                    <p className="text-xs leading-relaxed">{viewingIncident?.causeDetail || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Alınan Aksiyonlar</p>
                    <p className="text-xs leading-relaxed">{viewingIncident?.actionsTaken || '-'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-muted-foreground font-bold uppercase mb-1">Sonuç / Değerlendirme</p>
                    <p className="text-xs leading-relaxed">{viewingIncident?.resultEvaluation || '-'}</p>
                  </div>
                </div>
              </section>

              {/* Attachments Section */}
              {viewingIncident?.attachments && viewingIncident.attachments.length > 0 && (
                <section>
                  <h4 className="text-sm font-bold mb-3 text-primary uppercase tracking-wider">Ekler</h4>
                  <div className="grid grid-cols-2 gap-2">
                    {viewingIncident.attachments.map((file: any, i: number) => (
                      <a 
                        key={i} 
                        href={`${api.baseUrl}${file.url}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="flex items-center gap-2 p-2 bg-muted rounded-md border border-border hover:bg-muted/50 transition-colors"
                      >
                        <FileText className="w-4 h-4 text-primary" />
                        <span className="text-[10px] truncate max-w-[120px]">{file.name}</span>
                        <Download className="w-3 h-3 ml-auto text-muted-foreground" />
                      </a>
                    ))}
                  </div>
                </section>
              )}
            </div>
          </div>

          <DialogFooter className="border-t pt-4">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>Kapat</Button>
            <Button onClick={() => { setIsViewOpen(false); handleEdit(viewingIncident); }}>
              <Edit className="w-4 h-4 mr-2" /> Düzenle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ExtraordinaryIncidentsPage;
