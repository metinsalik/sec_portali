import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Building2, MapPin, ChevronRight, Loader2, Save, Trash2, Building, Info, Phone, Mail, Globe, Briefcase, Shield, Ruler, Users, ClipboardList, Edit2, Eye, FileText, Activity, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IL_ILCE_DATA } from '@/data/turkiye';
import type { City } from '@/data/turkiye';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

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

interface Facility {
  id: string;
  name: string;
  shortName: string;
  type: string;
  city: string;
  district: string;
  fullAddress: string;
  phone: string;
  email: string;
  website: string;
  commercialTitle: string;
  taxOffice: string;
  taxNumber: string;
  sgkNumber: string;
  naceCode: string;
  dangerClass: string;
  employeeCount: number;
  isActive: boolean;
  buildings: BuildingBlock[];
  assignments: Assignment[];
}

const FACILITY_TYPES = [
  "Hastane", "Ofis", "Depo", "Tıp Merkezi", "Diyaliz Merkezi", "Çağrı Merkezi", "Konuk Evi", "Şantiye"
];

const DANGER_CLASSES = [
  "Az Tehlikeli", "Tehlikeli", "Çok Tehlikeli"
];

const FacilitiesPage = () => {
  const queryClient = useQueryClient();
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
    buildings: [initialBuilding]
  });

  const [isEditing, setIsEditing] = useState(false);
  const [view, setView] = useState<'list' | 'detail'>('list');
  const [selectedFacility, setSelectedFacility] = useState<Facility | null>(null);

  const { data: facilities, isLoading } = useQuery<Facility[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    }
  });

  // Otomatik kod üretimi
  useEffect(() => {
    if (isModalOpen && !isEditing && !formData.id && facilities) {
      const count = facilities.length + 1;
      const code = `TES-${count.toString().padStart(3, '0')}`;
      setFormData(prev => ({ ...prev, id: code }));
    }
  }, [isModalOpen, isEditing, facilities, formData.id]);

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
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
    mutationFn: async (data: any) => {
      const res = await api.put(`/settings/facilities/${data.id}`, data);
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
      buildings: [initialBuilding]
    });
    setIsEditing(false);
    setIsModalOpen(false);
  };

  const populateForm = (facility: Facility) => {
    setFormData({
      ...facility,
      city: facility.city as City,
      employeeCount: facility.employeeCount.toString(),
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEditing) {
      updateMutation.mutate(formData);
    } else {
      createMutation.mutate(formData);
    }
  };

  const filteredFacilities = facilities?.filter(f => 
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    f.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (isLoading) {
    return (
      <div className="animate-pulse space-y-4">
        {[1, 2, 3].map(i => <div key={i} className="h-24 bg-muted rounded-xl" />)}
      </div>
    );
  }

  if (view === 'detail' && selectedFacility) {
    return (
      <LifeCardView 
        facility={selectedFacility} 
        onBack={() => setView('list')} 
        onEdit={() => {
          handleEdit(selectedFacility);
          setView('list'); // Switch back to list so that when dialog closes, we are on list
        }} 
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tesis adı veya koduna göre ara..." 
            className="pl-10 bg-background border-none shadow-sm"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => { resetForm(); setIsModalOpen(true); }} className="bg-primary hover:bg-primary/90 h-12 rounded-xl px-6 font-medium shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-[0.98]">
          <Plus className="w-5 h-5 mr-2" /> Yeni Tesis Ekle
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredFacilities?.map((facility) => (
          <Card key={facility.id} className="hover:shadow-lg transition-all border-none shadow-sm group">
            <CardContent className="p-0">
              <div className="flex items-stretch">
                <div className="w-2 bg-primary/20 group-hover:bg-primary transition-colors" />
                <div className="flex-1 p-5 flex items-center justify-between">
                  <div className="flex items-center gap-5">
                    <div className="w-14 h-14 bg-secondary/50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                      <Building2 className="w-7 h-7" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-medium text-slate-800 dark:text-slate-100">{facility.name}</h3>
                        <Badge variant="secondary" className="font-mono text-[10px] bg-slate-100 dark:bg-slate-800 text-slate-500 uppercase tracking-widest px-2 py-0 border-none">
                          {facility.id}
                        </Badge>
                        <Badge variant={facility.isActive ? "outline" : "secondary"} className={cn(
                          "font-medium",
                          facility.isActive ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400" : "bg-slate-100 text-slate-600"
                        )}>
                          {facility.isActive ? "Aktif" : "Pasif"}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap items-center gap-y-2 gap-x-6 mt-3 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1.5 font-medium">
                          <MapPin className="w-4 h-4 text-primary/70" /> {facility.city} / {facility.district}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Building className="w-4 h-4 text-primary/70" /> {facility.buildings?.length || 0} Blok
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Shield className="w-4 h-4 text-primary/70" /> {facility.dangerClass}
                        </span>
                        
                        {/* Atamalar Özeti */}
                        {facility.assignments?.length > 0 && (
                          <div className="flex items-center gap-3 border-l pl-6 ml-2">
                            {facility.assignments.map((a, idx) => (
                              <Badge key={idx} variant="secondary" className="bg-primary/5 text-[10px] font-semibold py-0.5 px-2">
                                {a.type}: {a.professional?.fullName || a.employerRep?.fullName || '—'}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                    <div className="flex items-center gap-2 pr-5">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleView(facility); }}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl w-10 h-10"
                      >
                        <Eye className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); handleEdit(facility); }}
                        className="text-muted-foreground hover:text-primary hover:bg-primary/10 rounded-xl w-10 h-10"
                      >
                        <Edit2 className="w-5 h-5" />
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={(e) => { e.stopPropagation(); deactivateMutation.mutate({ id: facility.id, isActive: facility.isActive }); }}
                        disabled={deactivateMutation.isPending}
                        className={cn(
                          "rounded-xl w-10 h-10",
                          facility.isActive ? "text-muted-foreground hover:text-destructive hover:bg-destructive/10" : "text-emerald-600 hover:bg-emerald-50"
                        )}
                      >
                        {deactivateMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Shield className="w-5 h-5" />}
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleView(facility)}
                        className="rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
                      >
                        <ChevronRight className="w-6 h-6" />
                      </Button>
                    </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredFacilities?.length === 0 && (
          <div className="text-center py-24 bg-background/50 rounded-3xl border-2 border-dashed border-muted">
            <div className="w-20 h-20 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-6">
              <Building2 className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">Tesis Bulunamadı</h3>
            <p className="text-muted-foreground max-w-xs mx-auto">Aramanızla eşleşen bir tesis bulunamadı veya henüz hiç tesis eklenmemiş.</p>
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[1200px] w-[95vw] h-[90vh] flex flex-col p-0 gap-0 border-none shadow-2xl rounded-3xl overflow-hidden">
          <DialogHeader className="p-8 bg-slate-900 text-white shrink-0">
            <div className="flex items-center gap-6">
              <div className="w-16 h-16 bg-primary/20 rounded-2xl flex items-center justify-center backdrop-blur-md border border-white/10">
                <Plus className="w-8 h-8 text-primary-foreground" />
              </div>
              <div>
                <DialogTitle className="text-xl font-semibold tracking-tight text-slate-900 dark:text-white">
                  {isEditing ? 'Tesisi Düzenle' : 'Yeni Tesis Tanımla'}
                </DialogTitle>
                <p className="text-slate-400 mt-1 text-sm font-medium">
                  {isEditing ? 'Mevcut tesis bilgilerini güncelleyin.' : 'Sistemdeki tesis ağınıza tüm detaylarıyla yeni bir nokta ekleyin.'}
                </p>
              </div>
            </div>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 bg-background h-full">
            <Tabs defaultValue="genel" className="flex-1 flex flex-col min-h-0">
              <div className="px-8 py-4 border-b bg-secondary/30 dark:bg-slate-900/50 shrink-0">
                <TabsList className="flex w-full bg-background/50 h-14 p-1 rounded-2xl gap-2 overflow-x-auto no-scrollbar">
                  <TabsTrigger value="genel" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all">Genel Bilgiler</TabsTrigger>
                  <TabsTrigger value="lokasyon" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all">Lokasyon & İletişim</TabsTrigger>
                  <TabsTrigger value="kurumsal" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all">Kurumsal Bilgiler</TabsTrigger>
                  <TabsTrigger value="fiziksel" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all">Fiziksel Özellikler</TabsTrigger>
                  <TabsTrigger value="ozet" className="flex-1 rounded-xl data-[state=active]:bg-primary data-[state=active]:text-white font-medium transition-all">Atama & Gereksinimler</TabsTrigger>
                </TabsList>
              </div>

               {/* Kaydırma Alanı */}
              <div className="flex-1 overflow-y-auto min-h-0 bg-slate-50/30 dark:bg-slate-900/40 custom-scrollbar">
                <div className="p-10 max-w-7xl mx-auto w-full">
                  <TabsContent value="genel" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Info className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Temel Bilgiler</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tesis Tipi</label>
                        <Select value={formData.type} onValueChange={(v) => setFormData({...formData, type: v})}>
                          <SelectTrigger className="bg-secondary/40 border-slate-200 h-12 rounded-xl text-base">
                            <SelectValue placeholder="Seçiniz" />
                          </SelectTrigger>
                          <SelectContent>
                            {FACILITY_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tesis Kodu</label>
                        <Input 
                          placeholder="Otomatik oluşturulur" 
                          value={formData.id} 
                          onChange={e => setFormData({...formData, id: e.target.value})}
                          required
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base font-mono font-medium text-primary"
                          disabled={isEditing}
                        />
                      </div>
                      <div className="space-y-3 col-span-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tesis Adı</label>
                        <Input 
                          placeholder="Örn: Kuzey Marmara Ana Depo" 
                          value={formData.name} 
                          onChange={e => setFormData({...formData, name: e.target.value})}
                          required
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                          
                        />
                      </div>
                      <div className="space-y-3 col-span-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Kısa Ad</label>
                        <Input 
                          placeholder="Örn: KM-DEPO" 
                          value={formData.shortName} 
                          onChange={e => setFormData({...formData, shortName: e.target.value})}
                          required
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                          
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="lokasyon" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <MapPin className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Lokasyon ve İletişim</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Şehir</label>
                        <Select value={formData.city} onValueChange={(v) => setFormData({...formData, city: v as City, district: ''})}>
                          <SelectTrigger className="bg-secondary/40 border-slate-200 h-12 rounded-xl text-base">
                            <SelectValue placeholder="Şehir seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {Object.keys(IL_ILCE_DATA).map(city => <SelectItem key={city} value={city}>{city}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">İlçe</label>
                        <Select value={formData.district} onValueChange={(v) => setFormData({...formData, district: v})} disabled={!formData.city}>
                          <SelectTrigger className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base">
                            <SelectValue placeholder="İlçe seçin" />
                          </SelectTrigger>
                          <SelectContent>
                            {formData.city && (IL_ILCE_DATA[formData.city as City] as readonly string[]).map(dist => (
                              <SelectItem key={dist} value={dist}>{dist}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3 col-span-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tam Adres</label>
                        <Input 
                          placeholder="Bulvar, cadde, sokak, no..." 
                          value={formData.fullAddress} 
                          onChange={e => setFormData({...formData, fullAddress: e.target.value})}
                          required
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" /> Telefon
                        </label>
                        <Input 
                          placeholder="0212 123 45 67" 
                          value={formData.phone} 
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Mail className="w-4 h-4 text-primary" /> E-posta
                        </label>
                        <Input 
                          type="email"
                          placeholder="info@tesis.com" 
                          value={formData.email} 
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                        />
                      </div>
                      <div className="space-y-3 col-span-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                          <Globe className="w-4 h-4 text-primary" /> Web Sitesi
                        </label>
                        <Input 
                          placeholder="www.tesis.com" 
                          value={formData.website} 
                          onChange={e => setFormData({...formData, website: e.target.value})}
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="kurumsal" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Kurumsal Bilgiler</h4>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-3 col-span-2">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Ticari Unvan</label>
                        <Input 
                          placeholder="Ticari unvan" 
                          value={formData.commercialTitle} 
                          onChange={e => setFormData({...formData, commercialTitle: e.target.value})}
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Vergi Dairesi / No</label>
                        <div className="flex gap-3">
                          <Input 
                            placeholder="Daire" 
                            value={formData.taxOffice} 
                            onChange={e => setFormData({...formData, taxOffice: e.target.value})}
                            className="bg-secondary/40 border-slate-200 h-12 rounded-xl text-base flex-1"
                          />
                          <Input 
                            placeholder="No" 
                            value={formData.taxNumber} 
                            onChange={e => setFormData({...formData, taxNumber: e.target.value})}
                            className="bg-secondary/40 border-slate-200 h-12 rounded-xl text-base w-40"
                          />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">SGK Sicil No</label>
                        <Input 
                          placeholder="Sicil no" 
                          value={formData.sgkNumber} 
                          onChange={e => setFormData({...formData, sgkNumber: e.target.value})}
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">NACE Kodu</label>
                        <Input 
                          placeholder="Örn: 86.10.01" 
                          value={formData.naceCode} 
                          onChange={e => setFormData({...formData, naceCode: e.target.value})}
                          className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base"
                        />
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider">Tehlike Sınıfı</label>
                        <Select value={formData.dangerClass} onValueChange={(v) => setFormData({...formData, dangerClass: v})}>
                          <SelectTrigger className="bg-secondary/40 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700/50 h-12 rounded-xl text-base font-medium">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {DANGER_CLASSES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-3">
                        <label className="text-[11px] font-medium text-muted-foreground uppercase tracking-wider text-primary">Çalışan Sayısı</label>
                        <Input 
                          type="number"
                          placeholder="Örn: 45" 
                          value={formData.employeeCount} 
                          onChange={e => setFormData({...formData, employeeCount: e.target.value})}
                          required
                          className="bg-primary/5 dark:bg-primary/10 border-primary/20 h-12 rounded-xl text-sm font-medium"
                        />
                      </div>
                    </div>
                  </TabsContent>

                  <TabsContent value="fiziksel" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center justify-between pb-2 border-b">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Ruler className="w-5 h-5 text-primary" />
                        </div>
                        <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Bloklar</h4>
                      </div>
                      {!isEditing && !formData.id && (
                        <Button type="button" variant="outline" size="lg" onClick={addBuilding} className="border-primary text-primary hover:bg-primary/5 rounded-xl">
                          <Plus className="w-5 h-5 mr-2" /> Blok Ekle
                        </Button>
                      )}
                    </div>

                    <div className="space-y-10">
                      {formData.buildings.map((building, index) => (
                        <div key={index} className="bg-slate-50 dark:bg-slate-800/40 rounded-3xl p-8 relative border border-slate-200 dark:border-slate-700/50">
                          <div className="absolute -top-4 -left-4 w-10 h-10 bg-primary text-white rounded-xl flex items-center justify-center font-semibold">
                            {index + 1}
                          </div>
                          {formData.buildings.length > 1 && (
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon" 
                              onClick={() => removeBuilding(index)}
                              className="absolute -top-3 -right-3 bg-white dark:bg-slate-800 shadow-md text-destructive hover:bg-destructive/10 rounded-full border border-destructive/20"
                            >
                              <Trash2 className="w-5 h-5" />
                            </Button>
                          )}
                          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div className="md:col-span-4 space-y-2 mb-2">
                              <label className="text-[11px] font-medium uppercase text-muted-foreground tracking-tight">Blok Adı</label>
                              <Input 
                                value={building.name} 
                                onChange={e => updateBuilding(index, 'name', e.target.value)}
                                className="bg-white border-slate-200 h-12 font-medium text-base rounded-xl"
                              />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Yapım Yılı</label>
                              <Input type="number" value={building.constructionYear} onChange={e => updateBuilding(index, 'constructionYear', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Kapalı Alan (m²)</label>
                              <Input type="number" value={building.closedArea} onChange={e => updateBuilding(index, 'closedArea', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Bina Yük. (m)</label>
                              <Input type="number" value={building.buildingHeight} onChange={e => updateBuilding(index, 'buildingHeight', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Yapı Yük. (m)</label>
                              <Input type="number" value={building.structureHeight} onChange={e => updateBuilding(index, 'structureHeight', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Kat (Bina)</label>
                              <Input type="number" value={building.buildingFloors} onChange={e => updateBuilding(index, 'buildingFloors', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Kat (Yapı)</label>
                              <Input type="number" value={building.structureFloors} onChange={e => updateBuilding(index, 'structureFloors', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Otopark (m²)</label>
                              <Input type="number" value={building.parkingArea} onChange={e => updateBuilding(index, 'parkingArea', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-[10px] font-medium text-muted-foreground uppercase tracking-tight">Yatak Kap.</label>
                              <Input type="number" value={building.bedCapacity} onChange={e => updateBuilding(index, 'bedCapacity', e.target.value)} className="bg-white border-slate-200 h-10" />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  <TabsContent value="ozet" className="mt-0 space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                    <div className="flex items-center gap-3 pb-2 border-b">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Shield className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="text-base font-semibold text-slate-800 dark:text-slate-100">Özet & Gereksinimler</h4>
                    </div>

                    {formData.employeeCount ? (
                      <div className="bg-primary/5 rounded-[32px] p-10 border border-primary/10">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-sm">
                          <div className="bg-white dark:bg-slate-900 p-8 rounded-[24px] shadow-sm flex flex-col items-center text-center">
                            <p className="text-slate-500 text-xs font-medium uppercase mb-2">İSG Uzmanı</p>
                            <p className="font-semibold text-2xl text-primary">
                              {formData.dangerClass === 'Çok Tehlikeli' ? (parseInt(formData.employeeCount) * 40) : 
                               formData.dangerClass === 'Tehlikeli' ? (parseInt(formData.employeeCount) * 20) : 
                               (parseInt(formData.employeeCount) * 10)} 
                              <span className="text-lg ml-2 opacity-60">dk/ay</span>
                            </p>
                          </div>
                          <div className="flex-1 bg-white dark:bg-slate-900 p-8 rounded-[24px] shadow-sm flex flex-col items-center text-center">
                            <p className="text-slate-500 text-xs font-medium uppercase mb-2">İşyeri Hekimi</p>
                            <p className="font-semibold text-2xl text-primary">
                              {formData.dangerClass === 'Çok Tehlikeli' ? (parseInt(formData.employeeCount) * 15) : 
                               formData.dangerClass === 'Tehlikeli' ? (parseInt(formData.employeeCount) * 10) : 
                               (parseInt(formData.employeeCount) * 5)}
                              <span className="text-base ml-2 opacity-60">dk/ay</span>
                            </p>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-secondary/10 p-10 rounded-3xl text-center text-slate-500">
                        Lütfen kurumsal sekmesinden çalışan sayısını giriniz.
                      </div>
                    )}

                    <div className="bg-slate-50 dark:bg-slate-900/50 rounded-3xl p-10 text-center border-2 border-dashed border-slate-200 dark:border-slate-800">
                      <ClipboardList className="w-12 h-12 mx-auto mb-4 text-slate-400" />
                      <p className="text-lg text-slate-500 dark:text-slate-400 max-w-lg mx-auto">
                        Atamalar <span className="font-semibold text-primary">İSG Atama Paneli</span> üzerinden yapılacaktır.
                      </p>
                    </div>
                  </TabsContent>
                </div>
              </div>
            </Tabs>

            <DialogFooter className="p-8 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 shrink-0">
              <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:bg-slate-100 dark:hover:bg-white/5 px-8 h-12 rounded-xl font-medium">Vazgeç</Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending} className="bg-primary hover:bg-primary/90 px-10 h-12 rounded-xl text-base font-medium shadow-lg shadow-primary/20">
                {(createMutation.isPending || updateMutation.isPending) && <Loader2 className="w-5 h-5 mr-3 animate-spin" />}
                <Save className="w-5 h-5 mr-3" /> {isEditing ? 'Güncelle' : 'Kaydet'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// --- LifeCardView Component ---
const LifeCardView = ({ facility, onBack, onEdit }: { facility: Facility, onBack: () => void, onEdit: () => void }) => {
  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 space-y-6 pb-20">
       {/* Top Header */}
       <div className="flex items-center justify-between">
         <Button variant="ghost" onClick={onBack} className="gap-2 text-slate-500 hover:text-primary transition-colors group px-0">
           <div className="w-10 h-10 rounded-full bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 flex items-center justify-center group-hover:bg-primary/5 transition-colors">
             <ChevronLeft className="w-5 h-5" />
           </div>
           <span className="font-medium text-sm tracking-tight">Tesis Listesine Dön</span>
         </Button>
         <Button onClick={onEdit} className="bg-emerald-600 hover:bg-emerald-700 gap-3 px-8 h-12 rounded-2xl shadow-lg shadow-emerald-500/20 font-medium transition-all hover:scale-105 active:scale-95">
           <Edit2 className="w-4 h-4" /> Düzenle
         </Button>
       </div>
       
       {/* Main Card */}
       <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-12 border-b border-slate-50 dark:border-slate-800/50">
             <div className="flex items-start justify-between">
               <div className="flex items-center gap-10">
                 <div className="w-28 h-28 bg-primary/5 rounded-[40px] flex items-center justify-center border border-primary/10 shadow-inner">
                   <Building2 className="w-14 h-14 text-primary" />
                 </div>
                 <div>
                   <div className="flex items-center gap-4 mb-3">
                     <Badge variant="secondary" className="bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-medium px-4 py-1 rounded-lg uppercase text-[10px] tracking-widest">{facility.type}</Badge>
                     <span className="text-xs font-mono font-semibold text-primary bg-primary/5 px-3 py-1 rounded-md">{facility.id}</span>
                   </div>
                   <h1 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white leading-tight">{facility.name}</h1>
                   <p className="text-slate-500 dark:text-slate-400 mt-2 text-base font-medium max-w-2xl">{facility.commercialTitle}</p>
                 </div>
               </div>
               <div className="text-right">
                  <Badge variant={facility.isActive ? "outline" : "secondary"} className={cn(
                    "text-[11px] px-6 py-2 rounded-full font-medium uppercase tracking-widest shadow-sm",
                    facility.isActive ? "border-emerald-100 bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 dark:border-emerald-800/50" : "bg-slate-100 text-slate-500 border-none"
                  )}>
                    {facility.isActive ? "Aktif Tesis" : "Pasif Kayıt"}
                  </Badge>
               </div>
             </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-4 gap-0 divide-x divide-slate-50 dark:divide-slate-800/50">
             <div className="p-10 text-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <Users className="w-6 h-6 mx-auto mb-4 text-primary opacity-60" />
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Çalışan Sayısı</p>
                <p className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{facility.employeeCount || '0'}</p>
             </div>
             <div className="p-10 text-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <Shield className="w-6 h-6 mx-auto mb-4 text-orange-400 opacity-60" />
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Tehlike Sınıfı</p>
                <p className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{facility.dangerClass}</p>
             </div>
             <div className="p-10 text-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <Ruler className="w-6 h-6 mx-auto mb-4 text-emerald-400 opacity-60" />
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Kapalı Alan</p>
                <p className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">{facility.buildings.reduce((acc, b) => acc + (parseFloat(b.closedArea) || 0), 0).toLocaleString()} <span className="text-base font-medium text-slate-400">m²</span></p>
             </div>
             <div className="p-10 text-center hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                <Activity className="w-6 h-6 mx-auto mb-4 text-blue-400 opacity-60" />
                <p className="text-[10px] font-medium text-slate-400 uppercase tracking-widest mb-2">Zorunlu İSG Süresi</p>
                <p className="text-xl font-semibold tracking-tight text-slate-800 dark:text-slate-100">
                  {Math.ceil((parseInt(facility.employeeCount || '0') * (facility.dangerClass === 'Çok Tehlikeli' ? 40 : facility.dangerClass === 'Tehlikeli' ? 20 : 10)) / 60)} 
                  <span className="text-base font-medium text-slate-400 ml-1">sa/ay</span>
                </p>
             </div>
          </div>
       </div>

       <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div className="md:col-span-2 space-y-10">
             <div className="bg-white dark:bg-slate-900 rounded-[40px] p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-semibold text-lg mb-10 flex items-center gap-4 text-slate-900 dark:text-white">
                  <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center"><MapPin className="w-5 h-5 text-primary" /></div>
                  İletişim & Lokasyon
                </h3>
                <div className="grid grid-cols-2 gap-12">
                   <div className="space-y-8">
                      <div>
                         <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3">Bölge Bilgisi</p>
                         <p className="text-lg font-medium text-slate-800 dark:text-slate-100">{facility.city} / {facility.district}</p>
                      </div>
                      <div>
                         <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-3">Tam Adres</p>
                         <p className="text-base text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{facility.fullAddress}</p>
                      </div>
                   </div>
                   <div className="space-y-8">
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm"><Phone className="w-5 h-5 text-slate-400" /></div>
                         <div>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">Sabit Telefon</p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-100">{facility.phone}</p>
                         </div>
                      </div>
                      <div className="flex items-center gap-5">
                         <div className="w-12 h-12 bg-slate-50 dark:bg-slate-800 rounded-2xl flex items-center justify-center shadow-sm"><Mail className="w-5 h-5 text-slate-400" /></div>
                         <div>
                            <p className="text-[11px] font-medium text-slate-400 uppercase tracking-widest mb-1">Resmi E-Posta</p>
                            <p className="font-semibold text-base text-slate-800 dark:text-slate-100">{facility.email}</p>
                         </div>
                      </div>
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[40px] p-12 border border-slate-100 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between mb-10">
                   <h3 className="font-semibold text-xl flex items-center gap-4 text-slate-900 dark:text-white">
                     <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center"><Building className="w-5 h-5 text-emerald-600" /></div>
                     Yapısal Bloklar & Teknik Detay
                   </h3>
                   <Badge variant="outline" className="px-4 py-1 rounded-full font-medium">{facility.buildings.length} Toplam Blok</Badge>
                </div>
                <div className="space-y-5">
                   {facility.buildings.map((b, i) => (
                      <div key={i} className="flex items-center justify-between p-8 bg-slate-50/50 dark:bg-slate-800/40 rounded-[32px] border border-slate-100 dark:border-slate-800/50 group hover:border-emerald-500/30 transition-all hover:bg-white dark:hover:bg-slate-800">
                         <div className="flex items-center gap-6">
                            <div className="w-14 h-14 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center font-medium text-lg text-emerald-600 shadow-sm border border-emerald-500/10 group-hover:scale-110 transition-transform">{i+1}</div>
                            <div>
                               <p className="font-medium text-lg text-slate-800 dark:text-slate-100">{b.name}</p>
                               <div className="flex items-center gap-4 mt-1 text-sm text-slate-500 font-medium">
                                 <span>{b.buildingFloors} Katlı Yapı</span>
                                 <Separator orientation="vertical" className="h-3 bg-slate-300" />
                                 <span>{b.closedArea} m² Kapalı</span>
                                 <Separator orientation="vertical" className="h-3 bg-slate-300" />
                                 <span>Yıl: {b.constructionYear}</span>
                               </div>
                            </div>
                         </div>
                         <div className="text-right">
                            <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest mb-1">Yatak Kapasite</p>
                            <p className="font-medium text-lg text-slate-800 dark:text-slate-100">{b.bedCapacity || '0'}</p>
                         </div>
                      </div>
                   ))}
                </div>
             </div>
          </div>

          <div className="space-y-10">
             <div className="bg-slate-900 text-white rounded-[40px] p-10 shadow-2xl border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl group-hover:bg-primary/20 transition-colors" />
                <h3 className="font-medium text-lg mb-10 flex items-center gap-4 relative z-10">
                  <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center"><Briefcase className="w-5 h-5 text-primary" /></div>
                  Kurumsal Künye
                </h3>
                <div className="space-y-10 relative z-10">
                   <div className="grid grid-cols-1 gap-8">
                      <div>
                         <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-3">Vergi Dairesi & Numarası</p>
                         <p className="font-medium text-base tracking-tight">{facility.taxOffice || '—'} / {facility.taxNumber || '—'}</p>
                      </div>
                      <div>
                         <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-3">SGK İşyeri Sicil No</p>
                         <p className="font-medium text-base font-mono tracking-widest bg-white/5 p-4 rounded-2xl border border-white/5">{facility.sgkNumber || '—'}</p>
                      </div>
                   </div>
                   <div className="pt-8 border-t border-slate-800">
                      <p className="text-[11px] font-medium text-slate-500 uppercase tracking-widest mb-4">Faaliyet Alanı (NACE Kodu)</p>
                      <p className="text-sm text-slate-400 leading-relaxed font-semibold italic">"{facility.naceCode || 'Nace kodu tanımlanmamış.'}"</p>
                   </div>
                </div>
             </div>

             <div className="bg-white dark:bg-slate-900 rounded-[32px] p-10 border border-slate-100 dark:border-slate-800 shadow-sm">
                <h3 className="font-semibold text-lg mb-8 flex items-center gap-4 text-slate-900 dark:text-white">
                  <Activity className="w-5 h-5 text-primary" /> Atama Durumu
                </h3>
                <div className="space-y-4">
                   <div className="p-6 bg-slate-50 dark:bg-slate-800/40 rounded-2xl border border-dashed border-slate-300 dark:border-slate-700 text-center">
                      <ClipboardList className="w-8 h-8 mx-auto mb-3 text-slate-400" />
                      <p className="text-sm text-slate-500 font-medium">Bu tesis için henüz aktif bir İSG ataması bulunmamaktadır.</p>
                      <Button variant="link" className="text-primary font-medium mt-2">Atama Yap &rarr;</Button>
                    </div>
                 </div>
              </div>
           </div>
        </div>
     </div>
  );
};

export default FacilitiesPage;
