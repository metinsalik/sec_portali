import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, MapPin, ChevronRight, Loader2, Save, Trash2, Building, Info, Phone, Mail, Globe, Briefcase, Shield, Ruler, Users, ClipboardList, Edit2, Eye, FileText, Activity, ChevronLeft, LayoutGrid, List, Archive, CheckCircle2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';
import { IL_ILCE_DATA } from '@/data/turkiye';
import type { City } from '@/data/turkiye';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

import type { Facility as BaseFacility } from '@sec-portali/shared';

interface BuildingBlock {
  name: string;
  constructionYear: string;
  buildingHeight: string;
  structureHeight: string;
  buildingFloors: string;
  structureFloors: string;
  closedArea: string;
  parkingArea: string;
  gardenArea: string;
  bedCapacity: string;
}

interface Assignment {
  id: number;
  type: string;
  professional?: { fullName: string };
  employerRep?: { fullName: string };
}

// Extend base facility with frontend specific properties
export interface Facility extends BaseFacility {
  shortName: string;
  type: string;
  fullAddress: string;
  phone: string;
  email: string;
  website: string;
  commercialTitle: string;
  taxOffice: string;
  taxNumber: string;
  sgkNumber: string;
  naceCode: string;
  logoUrl?: string;
  buildings: BuildingBlock[];
  assignments: Assignment[];
}

export interface ComplianceData {
  facilityId: string;
  overallCompliant: boolean;
  category: string;
}

const FACILITY_TYPES = [
  "Hastane", "Ofis", "Depo", "Tıp Merkezi", "Diyaliz Merkezi", "Çağrı Merkezi", "Konuk Evi", "Şantiye"
];

const DANGER_CLASSES = [
  "Az Tehlikeli", "Tehlikeli", "Çok Tehlikeli"
];

const FacilitiesPage = () => {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const hasAdminAccess = user?.isAdmin || user?.roles.includes('admin') || user?.roles.includes('management');

  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const initialBuilding: BuildingBlock = {
    name: 'Ana Blok',
    constructionYear: '',
    buildingHeight: '',
    structureHeight: '',
    buildingFloors: '',
    structureFloors: '',
    closedArea: '',
    parkingArea: '',
    gardenArea: '',
    bedCapacity: ''
  };

  const [formData, setFormData] = useState({
    id: '',
    name: '',
    shortName: '',
    type: '',
    city: '' as City | '',
    district: '',
    fullAddress: '',
    phone: '',
    email: '',
    website: '',
    commercialTitle: '',
    taxOffice: '',
    taxNumber: '',
    sgkNumber: '',
    naceCode: '',
    dangerClass: 'Az Tehlikeli',
    employeeCount: '',
    logoUrl: '',
    buildings: [initialBuilding]
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dangerClassFilter, setDangerClassFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  const { data: complianceData } = useQuery<ComplianceData[]>({
    queryKey: ['assignments-status'],
    queryFn: async () => {
      const res = await api.get('/panel/assignments/compliance-status');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const getComplianceForFacility = (id: string) => {
    return complianceData?.find(c => c.facilityId === id);
  };

  // Otomatik kod üretimi
  useEffect(() => {
    if (isModalOpen && !isEditing && !formData.id && facilities) {
      const count = facilities.length + 1;
      const code = `TES-${count.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, id: code }));
    }
  }, [isModalOpen, isEditing, facilities, formData.id]);

  const createMutation = useMutation({
    mutationFn: async (data: Facility | Record<string, unknown>) => {
      const res = await api.post('/settings/facilities', data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Facility | Record<string, unknown>) => {
      const res = await api.put(`/settings/facilities/${(data as Facility).id}`, data);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
      setIsModalOpen(false);
      resetForm();
    }
  });

  const deactivateMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string, isActive: boolean }) => {
      const res = await api.put(`/settings/facilities/${id}`, { isActive: !isActive });
      if (!res.ok) throw new Error('İşlem başarısız');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facilities'] });
    }
  });

  const resetForm = () => {
    setFormData({
      id: '',
      name: '',
      shortName: '',
      type: '',
      city: '',
      district: '',
      fullAddress: '',
      phone: '',
      email: '',
      website: '',
      commercialTitle: '',
      taxOffice: '',
      taxNumber: '',
      sgkNumber: '',
      naceCode: '',
      dangerClass: 'Az Tehlikeli',
      employeeCount: '',
      logoUrl: '',
      buildings: [initialBuilding]
    });
    setLogoFile(null);
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const populateForm = (facility: Facility) => {
    setLogoFile(null);
    setFormData({
      ...facility,
      city: facility.city as City,
      employeeCount: facility.employeeCount.toString(),
      logoUrl: facility.logoUrl || '',
      buildings: facility.buildings.length > 0 ? facility.buildings.map(b => ({
        ...b,
        constructionYear: b.constructionYear?.toString() || '',
        buildingHeight: b.buildingHeight?.toString() || '',
        structureHeight: b.structureHeight?.toString() || '',
        buildingFloors: b.buildingFloors?.toString() || '',
        structureFloors: b.structureFloors?.toString() || '',
        closedArea: b.closedArea?.toString() || '',
        parkingArea: b.parkingArea?.toString() || '',
        gardenArea: b.gardenArea?.toString() || '',
        bedCapacity: b.bedCapacity?.toString() || ''
      })) : [initialBuilding]
    });
  };

  const handleEdit = (facility: Facility) => {
    populateForm(facility);
    setIsEditing(true);
    setIsModalOpen(true);
  };

  const handleView = (facility: Facility) => {
    setSelectedFacility(facility);
    setView('detail');
  };

  const addBuilding = () => {
    setFormData(prev => ({
      ...prev,
      buildings: [...prev.buildings, { ...initialBuilding, name: `Blok ${prev.buildings.length + 1}` }]
    }));
  };

  const removeBuilding = (index: number) => {
    if (formData.buildings.length <= 1) return;
    setFormData(prev => ({
      ...prev,
      buildings: prev.buildings.filter((_, i) => i !== index)
    }));
  };

  const updateBuilding = (index: number, field: keyof BuildingBlock, value: string) => {
    const newBuildings = [...formData.buildings];
    newBuildings[index] = { ...newBuildings[index], [field]: value };
    setFormData(prev => ({ ...prev, buildings: newBuildings }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    let currentLogoUrl = formData.logoUrl;

    if (logoFile) {
      try {
        const fileData = new FormData();
        fileData.append('file', logoFile);
        const res = await api.customFetch('/settings/facilities/upload-logo', {
          method: 'POST',
          body: fileData
        });
        if (res.ok) {
          const data = await res.json();
          currentLogoUrl = data.url;
        }
      } catch (err) {
        console.error('Logo yukleme hatasi:', err);
      }
    }

    const submitData = { ...formData, logoUrl: currentLogoUrl };

    if (isEditing) {
      updateMutation.mutate(submitData);
    } else {
      createMutation.mutate(submitData);
    }
  };

  const filteredFacilities = facilities?.filter(f => {
    const matchesSearch = f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         f.id.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'all' || f.type === typeFilter;
    const matchesDanger = dangerClassFilter === 'all' || f.dangerClass === dangerClassFilter;
    const matchesStatus = activeTab === 'active' ? f.isActive : !f.isActive;
    return matchesSearch && matchesType && matchesDanger && matchesStatus;
  }).sort((a, b) => {
    // Hastane önceliği (ilk onlar listelenir)
    const aIsHospital = a.type === 'Hastane';
    const bIsHospital = b.type === 'Hastane';
    
    if (aIsHospital && !bIsHospital) return -1;
    if (!aIsHospital && bIsHospital) return 1;
    
    // Alfabetik sıralama
    return a.name.localeCompare(b.name, 'tr');
  });

  // Tesis tipine göre gruplama
  const groupedFacilities = filteredFacilities?.reduce((acc, facility) => {
    if (!acc[facility.type]) acc[facility.type] = [];
    acc[facility.type].push(facility);
    return acc;
  }, {} as Record<string, Facility[]>);

  const sortedTypes = Object.keys(groupedFacilities || {}).sort((a, b) => {
    if (a === 'Hastane') return -1;
    if (b === 'Hastane') return 1;
    return a.localeCompare(b, 'tr');
  });

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-3">
        {[1, 2, 3].map(i => <div key={i} className="h-20 bg-muted/60 rounded-lg" />)}
      </div>
    );
  }

  if (view === 'detail' && selectedFacility) {
    return (
      <LifeCardView 
        facility={selectedFacility} 
        onBack={() => setView('list')} 
        onEdit={() => {
          navigate(`/settings/facilities/${selectedFacility?.id}/edit`);
          setView('list'); // Switch back to list so that when dialog closes, we are on list
        }} 
        complianceData={complianceData}
      />
    );
  }

  return (
    <div className="space-y-5 w-full animate-in fade-in duration-200 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building2 className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">Tesis Yönetimi</h1>
            <p className="text-xs text-muted-foreground">Organizasyon yapınızdaki tüm tesisleri yönetin ve izleyin.</p>
          </div>
        </div>
        {hasAdminAccess && (
          <Button onClick={() => navigate('/settings/facilities/new')} className="h-9 text-xs font-medium rounded-md px-3.5 gap-1.5 shrink-0">
            <Plus className="w-3.5 h-3.5" /> Yeni Tesis Ekle
          </Button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <Tabs value={activeTab} onValueChange={(val) => setActiveTab(val as 'active' | 'archive')} className="w-auto">
          <TabsList className="h-9 p-1 rounded-lg">
            <TabsTrigger value="active" className="text-xs rounded-md">Aktif Tesisler</TabsTrigger>
            <TabsTrigger value="archive" className="text-xs rounded-md">Arşiv</TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="flex items-center bg-muted/60 p-1 rounded-md border border-border/40 shrink-0 self-end sm:self-auto">
          <Button 
            variant={viewMode === 'list' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('list')}
            className={cn("h-7 w-8 p-0 rounded-sm transition-all", viewMode === 'list' ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground")}
          >
            <List className="w-3.5 h-3.5" />
          </Button>
          <Button 
            variant={viewMode === 'grid' ? 'secondary' : 'ghost'} 
            size="sm" 
            onClick={() => setViewMode('grid')}
            className={cn("h-7 w-8 p-0 rounded-sm transition-all", viewMode === 'grid' ? "bg-background shadow-xs text-foreground font-semibold" : "text-muted-foreground")}
          >
            <LayoutGrid className="w-3.5 h-3.5" />
          </Button>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-3 bg-card p-3 rounded-lg border border-border/60 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-muted-foreground" />
          <Input 
            placeholder="Tesis adı veya koduna göre ara..." 
            className="pl-8.5 h-9 text-xs rounded-md"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex flex-wrap items-center gap-2.5">
          <Select value={typeFilter} onValueChange={setTypeFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs rounded-md">
              <SelectValue placeholder="Tesis Tipi">
                {typeFilter === 'all' ? 'Tüm Tipler' : typeFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Tipler</SelectItem>
              {FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>

          <Select value={dangerClassFilter} onValueChange={setDangerClassFilter}>
            <SelectTrigger className="w-[160px] h-9 text-xs rounded-md">
              <SelectValue placeholder="Tehlike Sınıfı">
                {dangerClassFilter === 'all' ? 'Tüm Sınıflar' : dangerClassFilter}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tüm Sınıflar</SelectItem>
              {DANGER_CLASSES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="min-h-[400px]">
        {filteredFacilities && filteredFacilities.length > 0 ? (
          viewMode === 'list' ? (
            <Accordion type="multiple" defaultValue={sortedTypes} className="space-y-3">
              {sortedTypes.map(type => (
                <AccordionItem key={type} value={type} className="border border-border/60 rounded-lg bg-card overflow-hidden shadow-xs border-b">
                  <AccordionTrigger className="hover:no-underline px-4 py-3 bg-muted/30 group">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 bg-background rounded-md flex items-center justify-center text-primary shadow-2xs border border-border/60">
                        {type === 'Hastane' ? <Building2 className="w-4 h-4" /> : <Building className="w-4 h-4" />}
                      </div>
                      <div className="flex flex-col items-start gap-0.5">
                        <span className="font-semibold text-foreground text-xs">{type}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-wider">{groupedFacilities![type].length} Tesis</span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="p-0 pb-0">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse min-w-[700px] text-xs">
                        <thead>
                          <tr className="bg-muted/40 border-t border-b border-border/40">
                            <th className="px-4 py-2.5 font-medium text-muted-foreground">Tesis Bilgisi</th>
                            <th className="px-4 py-2.5 font-medium text-muted-foreground">Lokasyon</th>
                            <th className="px-4 py-2.5 font-medium text-muted-foreground">Tehlike Sınıfı</th>
                            <th className="px-4 py-2.5 font-medium text-muted-foreground">Atama Durumu</th>
                            <th className="px-4 py-2.5 font-medium text-muted-foreground">Durum</th>
                            <th className="px-4 py-2.5 text-right font-medium text-muted-foreground">İşlemler</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/40">
                          {groupedFacilities![type].map((facility) => (
                            <tr key={facility.id} className="hover:bg-muted/20 transition-colors">
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-2.5">
                                  <div className="w-7 h-7 bg-muted/50 rounded-md flex items-center justify-center text-muted-foreground border border-border/40 shrink-0">
                                    <Building2 className="w-3.5 h-3.5" />
                                  </div>
                                  <div>
                                    <div className="font-medium text-foreground text-xs line-clamp-1">{facility.name}</div>
                                    <div className="text-[10px] font-mono text-muted-foreground uppercase">{facility.id}</div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                <div className="text-xs text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                                  <MapPin className="w-3 h-3 opacity-60" /> {facility.city} / {facility.district}
                                </div>
                              </td>
                              <td className="px-4 py-3">
                                 <Badge variant="outline" className={cn(
                                   "text-[10px] py-0 font-normal rounded-md",
                                   facility.dangerClass === 'Çok Tehlikeli' ? "border-destructive/30 text-destructive bg-destructive/10" : 
                                   facility.dangerClass === 'Tehlikeli' ? "border-amber-500/30 text-amber-600 bg-amber-500/10" : 
                                   "border-emerald-500/30 text-emerald-600 bg-emerald-500/10"
                                 )}>
                                   {facility.dangerClass}
                                 </Badge>
                              </td>
                              <td className="px-4 py-3">
                                 {(() => {
                                   const comp = getComplianceForFacility(facility.id);
                                   if (!comp) return <span className="text-[10px] text-muted-foreground italic">Yükleniyor...</span>;
                                   
                                   if (comp.overallCompliant) return <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 text-[9px] py-0 font-medium rounded-md">TAM UYGUN</Badge>;
                                   if (comp.category === 'none') return <Badge variant="outline" className="text-muted-foreground text-[9px] py-0 font-normal rounded-md">ATAMA YOK</Badge>;
                                   return <Badge className="bg-destructive/10 text-destructive border border-destructive/20 text-[9px] py-0 font-medium rounded-md">EKSİK ATAMA</Badge>;
                                 })()}
                               </td>
                               <td className="px-4 py-3">
                                 <div className="flex items-center gap-2">
                                   <div className={cn("w-1.5 h-1.5 rounded-full", facility.isActive ? "bg-emerald-500" : "bg-muted-foreground/40")} />
                                   <span className="text-xs text-muted-foreground">{facility.isActive ? "Aktif" : "Pasif"}</span>
                                 </div>
                               </td>
                              <td className="px-4 py-3 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  {hasAdminAccess && (
                                    <Button 
                                      variant="ghost" 
                                      size="icon" 
                                      onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate({ id: facility.id, isActive: facility.isActive }); }}
                                      className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground"
                                      title={facility.isActive ? "Pasife Al (Arşivle)" : "Aktife Al"}
                                    >
                                      {facility.isActive ? <Archive className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                                    </Button>
                                  )}
                                  <Button variant="ghost" size="icon" onClick={() => handleView(facility)} className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground" title="Detay">
                                    <Eye className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="icon" onClick={() => navigate(`/settings/facilities/${facility.id}/edit`)} className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground" title="Düzenle">
                                    <Edit2 className="w-3.5 h-3.5" />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredFacilities.map((facility) => (
                <Card key={facility.id} className="border border-border/60 shadow-xs hover:border-border transition-all duration-200 rounded-lg bg-card flex flex-col">
                   <CardHeader className="p-4 pb-2">
                     <div className="flex justify-between items-start">
                       <div className="w-10 h-10 bg-muted/40 rounded-md flex items-center justify-center text-primary/70 border border-border/40 overflow-hidden">
                         {facility.logoUrl ? <img src={facility.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Building2 className="w-5 h-5" />}
                       </div>
                       <div className="flex items-center gap-1">
                        {hasAdminAccess && (
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate({ id: facility.id, isActive: facility.isActive }); }}
                            className="w-7 h-7 rounded-md text-muted-foreground hover:text-foreground"
                            title={facility.isActive ? "Pasife Al (Arşivle)" : "Aktife Al"}
                          >
                            {facility.isActive ? <Archive className="w-3.5 h-3.5" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                          </Button>
                        )}
                        <Badge variant={facility.isActive ? "outline" : "secondary"} className="font-normal text-[10px] px-2 py-0.5 rounded-md">
                          {facility.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                       </div>
                     </div>
                   </CardHeader>
                   <CardContent className="p-4 pt-1 flex-1 flex flex-col">
                      <div className="mb-3">
                         <h3 className="font-semibold text-foreground text-xs line-clamp-1">{facility.name}</h3>
                         <p className="text-[10px] font-mono text-muted-foreground uppercase mt-0.5">{facility.id}</p>
                      </div>
                      
                      <div className="space-y-2 mb-4 flex-1">
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <Building className="w-3.5 h-3.5 shrink-0 opacity-70" />
                           <span className="truncate">{facility.type}</span>
                         </div>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <MapPin className="w-3.5 h-3.5 shrink-0 opacity-70" />
                           <span className="truncate">{facility.city} / {facility.district}</span>
                         </div>
                         <div className="flex items-center gap-2 text-xs text-muted-foreground">
                           <Shield className="w-3.5 h-3.5 shrink-0 opacity-70" />
                           <span className="truncate">{facility.dangerClass}</span>
                         </div>
                      </div>

                      <div className="flex items-center gap-2 pt-3 border-t border-border/40 mt-auto">
                         <Button onClick={() => handleView(facility)} variant="outline" className="flex-1 h-8 rounded-md text-xs font-medium">
                           Detayı Gör
                         </Button>
                         <Button variant="ghost" size="icon" onClick={() => navigate(`/settings/facilities/${facility.id}/edit`)} className="w-8 h-8 rounded-md text-muted-foreground hover:text-foreground" title="Düzenle">
                           <Edit2 className="w-3.5 h-3.5" />
                         </Button>
                      </div>
                   </CardContent>
                </Card>
              ))}
            </div>
          )
        ) : (
          <div className="text-center py-16 bg-muted/10 rounded-lg border border-dashed border-border/60">
            <Archive className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <h3 className="text-sm font-semibold text-foreground">Tesis Bulunamadı</h3>
            <p className="text-xs text-muted-foreground mt-0.5 max-w-xs mx-auto">Bu bölümde gösterilecek tesis bulunmuyor.</p>
          </div>
        )}
      </div>
    </div>
  );
};

const RoleMiniBadge = ({ type, compliance }: { type: string, compliance: any }) => {
  if (!compliance) return null;
  const isCompliant = compliance.isCompliant;
  const isRequired = type === 'DSP' ? compliance.required : true;

  if (!isRequired) return null;

  return (
    <div className={cn(
      "flex items-center gap-2 px-3 py-2 rounded-xl border",
      isCompliant ? "bg-emerald-50/50 border-emerald-100 text-emerald-700" : "bg-rose-50/50 border-rose-100 text-rose-700"
    )}>
      {isCompliant ? <CheckCircle2 className="w-3 h-3" /> : <AlertTriangle className="w-3 h-3" />}
      <span className="text-[10px] font-bold uppercase tracking-wider">{type}</span>
    </div>
  );
};

const LifeCardView = ({ facility, onBack, onEdit, complianceData }: { 
  facility: Facility, 
  onBack: () => void, 
  onEdit: () => void,
  complianceData?: any[]
}) => {
  const navigate = useNavigate();
  const comp = complianceData?.find(c => (c.facilityId as string) === (facility.id as string));
  const { user } = useAuth();
  const hasAdminAccess = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';

  return (
    <div className="animate-in fade-in duration-200 space-y-5 pb-16 max-w-6xl mx-auto">
       {/* Top Header */}
       <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={onBack} className="gap-2 text-muted-foreground hover:text-foreground transition-colors group px-0 h-9">
           <div className="w-8 h-8 rounded-md bg-card border border-border/60 flex items-center justify-center group-hover:bg-muted transition-colors">
             <ChevronLeft className="w-4 h-4" />
           </div>
           <span className="font-medium text-xs">Tesis Listesine Dön</span>
         </Button>
         <div className="flex items-center gap-2">
           <Button 
             variant="outline" 
             onClick={() => {
               localStorage.setItem('activeFacilityId', facility.id);
               navigate('/settings/locations');
             }} 
             className="gap-1.5 px-3.5 h-9 rounded-md text-xs font-medium"
           >
             <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> Lokasyon Yönetimine Git
           </Button>
           <Button onClick={onEdit} className="gap-1.5 px-3.5 h-9 rounded-md text-xs font-medium">
             <Edit2 className="w-3.5 h-3.5" /> Bilgileri Güncelle
           </Button>
         </div>
       </div>
       
       {/* Main Content Card */}
       <div className="bg-card rounded-lg border border-border/60 shadow-xs overflow-hidden">
          {/* Header Section */}
          <div className="p-6 border-b border-border/40">
             <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 bg-muted/40 rounded-lg flex items-center justify-center border border-border/40 text-primary overflow-hidden shrink-0">
                    {facility.logoUrl ? <img src={facility.logoUrl} alt="Logo" className="w-full h-full object-contain" /> : <Building2 className="w-8 h-8" />}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <Badge variant="outline" className="font-normal text-[10px] rounded-md">{facility.type}</Badge>
                      <span className="text-[10px] font-mono font-medium text-primary bg-primary/10 px-1.5 py-0.5 rounded">{facility.id}</span>
                    </div>
                    <h1 className="text-lg font-semibold tracking-tight text-foreground">{facility.name}</h1>
                    <p className="text-muted-foreground mt-0.5 text-xs">{facility.commercialTitle}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   <div className="text-right hidden md:block">
                     <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-1">Kayıt Durumu</p>
                     <Badge variant={facility.isActive ? "outline" : "secondary"} className="text-[10px] px-2.5 py-0.5 rounded-md font-medium">
                       {facility.isActive ? "Sistemde Aktif" : "Pasif Kayıt"}
                     </Badge>
                   </div>
                </div>
             </div>
          </div>
          
          {/* Stats Bar */}
          <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 dark:border-slate-800/50">
             <div className="p-6 text-center border-r border-slate-100 dark:border-slate-800/50">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                   <Users className="w-3.5 h-3.5" /> Çalışan Sayısı
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{facility.employeeCount || '0'}</p>
             </div>
             <div className="p-6 text-center border-r border-slate-100 dark:border-slate-800/50">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                   <Shield className="w-3.5 h-3.5" /> Tehlike Sınıfı
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">{facility.dangerClass}</p>
             </div>
             <div className="p-6 text-center border-r border-slate-100 dark:border-slate-800/50">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                   <Ruler className="w-3.5 h-3.5" /> Kapalı Alan
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {facility.buildings.reduce((acc, b) => acc + (parseFloat(b.closedArea) || 0), 0).toLocaleString()} <span className="text-xs font-medium text-slate-400">m²</span>
                </p>
             </div>
             <div className="p-6 text-center">
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5 flex items-center justify-center gap-1.5">
                   <Activity className="w-3.5 h-3.5" /> İSG Süresi
                </p>
                <p className="text-lg font-bold text-slate-800 dark:text-slate-100">
                  {Math.ceil((parseInt(facility.employeeCount || '0') * (facility.dangerClass === 'Çok Tehlikeli' ? 40 : facility.dangerClass === 'Tehlikeli' ? 20 : 10)) / 60)} 
                  <span className="text-xs font-medium text-slate-400 ml-1">sa/ay</span>
                </p>
             </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3">
            {/* Left Column: Details */}
            <div className="md:col-span-2 p-8 space-y-8 border-r border-slate-100 dark:border-slate-800/50">
              {/* Location & Contact */}
              <div>
                <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-tight">
                  <MapPin className="w-4 h-4 text-primary" /> İletişim ve Lokasyon
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Şehir / İlçe</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{facility.city} / {facility.district}</p>
                    </div>
                    <div>
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1">Adres Detayı</p>
                      <p className="text-sm text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{facility.fullAddress}</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700"><Phone className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">Telefon</p>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{facility.phone || '—'}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-slate-50 dark:bg-slate-800 rounded-lg flex items-center justify-center border border-slate-100 dark:border-slate-700"><Mail className="w-4 h-4 text-slate-400" /></div>
                      <div>
                        <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest">E-Posta</p>
                        <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{facility.email || '—'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <Separator className="bg-slate-100 dark:bg-slate-800" />

              {/* Buildings */}
              <div>
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-sm font-semibold flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-tight">
                    <Building className="w-4 h-4 text-primary" /> Yapısal Birimler
                  </h3>
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-0.5 rounded border border-slate-100 uppercase tracking-widest">{facility.buildings.length} BLOK</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                   {facility.buildings.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800/50">
                         <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white dark:bg-slate-900 rounded-lg flex items-center justify-center font-bold text-sm text-primary shadow-sm border border-slate-100">{i+1}</div>
                            <div>
                               <p className="font-semibold text-sm text-slate-800 dark:text-slate-100">{b.name}</p>
                               <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-500 font-medium">
                                 <span>{b.buildingFloors} Kat</span>
                                 <span>•</span>
                                 <span>{b.closedArea} m²</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tight">Kapasite</p>
                            <p className="font-semibold text-sm text-slate-700 dark:text-slate-200">{b.bedCapacity || '0'}</p>
                         </div>
                      </div>
                   ))}
                </div>
              </div>
            </div>

            {/* Right Column: Corporate & Meta */}
            <div className="p-8 bg-slate-50/30 dark:bg-slate-900/20 space-y-8">
              {/* Corporate Info */}
              <div>
                <h3 className="text-sm font-semibold mb-6 flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-tight">
                  <Briefcase className="w-4 h-4 text-primary" /> Kurumsal Detaylar
                </h3>
                <div className="space-y-6">
                   <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">Vergi Dairesi & No</p>
                      <p className="text-sm font-semibold text-slate-800 dark:text-slate-100">{facility.taxOffice || '—'} / {facility.taxNumber || '—'}</p>
                   </div>
                   <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-1.5">SGK Sicil Numarası</p>
                      <p className="text-sm font-mono font-bold text-primary tracking-wider">{facility.sgkNumber || '—'}</p>
                   </div>
                   <div className="p-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200/60 dark:border-slate-700/50 shadow-sm">
                      <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Faaliyet (NACE)</p>
                      <p className="text-xs text-slate-600 dark:text-slate-400 leading-normal font-medium italic">"{facility.naceCode || 'Nace kodu tanımlanmamış.'}"</p>
                   </div>
                </div>
              </div>

              {/* Assignment Status */}
              <div>
                <h3 className="text-sm font-semibold mb-4 flex items-center gap-2 text-slate-900 dark:text-white uppercase tracking-tight">
                  <Activity className="w-4 h-4 text-primary" /> Atama Durumu
                </h3>
                <div className="p-5 bg-white dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm space-y-4">
                   {comp ? (
                     <>
                       <div className="flex flex-wrap gap-2">
                         <RoleMiniBadge type="IGU" compliance={comp.igu} />
                         <RoleMiniBadge type="Hekim" compliance={comp.hekim} />
                         <RoleMiniBadge type="DSP" compliance={comp.dsp} />
                       </div>
                       <div className="pt-2 border-t border-slate-50 dark:border-slate-700">
                         {comp.overallCompliant ? (
                           <div className="flex items-center gap-2 text-emerald-600">
                             <CheckCircle2 className="w-4 h-4" />
                             <span className="text-xs font-bold uppercase tracking-wide">Tüm Atamalar Uygun</span>
                           </div>
                         ) : (
                           <div className="flex flex-col gap-2">
                             <div className="flex items-center gap-2 text-rose-600">
                               <AlertTriangle className="w-4 h-4" />
                               <span className="text-xs font-bold uppercase tracking-wide">Atama Eksikliği Mevcut</span>
                             </div>
                             <Button 
                               onClick={() => navigate('/panel/assignments')} 
                               variant="link" 
                               className="text-primary text-[11px] font-bold h-auto p-0 justify-start"
                             >
                               Atama Panelini Aç &rarr;
                             </Button>
                           </div>
                         )}
                       </div>
                     </>
                   ) : (
                     <div className="text-center py-2">
                        <Loader2 className="w-4 h-4 mx-auto animate-spin text-slate-300" />
                        <p className="text-[10px] text-slate-400 mt-2">Veriler yükleniyor...</p>
                     </div>
                   )}
                </div>
              </div>
            </div>
          </div>
       </div>
    </div>
  );
};

export default FacilitiesPage;
