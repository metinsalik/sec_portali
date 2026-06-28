import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Trash2, Plus, ArrowRight, Settings, ShieldAlert, PackageOpen, CheckCircle2, Check, ChevronsUpDown } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const PURPOSES = [
  { id: 'kimyasal', label: 'Kimyasal Dökülme-Saçılma Kiti' },
  { id: 'biyolojik', label: 'Biyolojik materyal Dökülmesi Kiti' },
  { id: 'formalin', label: 'Formaldehit / formalin Dökülme Saçılma Kiti' }
];

const SUGGESTED_ITEMS: Record<string, any[]> = {
  kimyasal: [
    { name: "Kimyasal absorban ped/granül", type: "Absorban", qty: 5, min: 2 },
    { name: "Kimyasala dayanıklı eldiven", type: "KKD", qty: 2, min: 1 },
    { name: "Koruyucu gözlük/yüz siperi", type: "KKD", qty: 1, min: 1 },
    { name: "Kimyasal atık poşeti/kap", type: "Atık", qty: 2, min: 1 }
  ],
  biyolojik: [
    { name: "Biyolojik absorban", type: "Absorban", qty: 5, min: 2 },
    { name: "Dezenfektan tablet/solüsyon", type: "Dezenfektan", qty: 1, min: 1 },
    { name: "Tek kullanımlık eldiven", type: "KKD", qty: 4, min: 2 },
    { name: "Tıbbi atık poşeti", type: "Atık", qty: 2, min: 1 }
  ]
};

export default function SpillKitsPage() {
  const facilityId = localStorage.getItem('activeFacilityId');
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [isIncidentModalOpen, setIsIncidentModalOpen] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

  const [locBlock, setLocBlock] = useState('all');
  const [locFloor, setLocFloor] = useState('all');
  const [locDepartment, setLocDepartment] = useState('all');

  const { data: kits = [], isLoading } = useQuery({
    queryKey: ['spill-kits', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/hazmat/spill-kits?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!facilityId
  });

  
  const { data: masterItems = [] } = useQuery({
    queryKey: ['hazmat-kit-items', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/settings/hazmat-kit-items?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!facilityId
  });

  const { data: departments = [] } = useQuery({
    queryKey: ['hazmat-departments', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/hazmat/inventory/departments?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!facilityId
  });

  useEffect(() => {
    if (departments.length > 0) {
      const uniqueBlocks = Array.from(new Set(departments.map((d: any) => d.building).filter(Boolean)));
      if (uniqueBlocks.length === 1 && locBlock === 'all') {
        setLocBlock(uniqueBlocks[0] as string);
      }
    }
  }, [departments, locBlock]);

  const blocks = Array.from(new Set(departments.map((d: any) => d.building).filter(Boolean))).sort();
  const floors = Array.from(new Set(departments.filter((d: any) => locBlock === 'all' || d.building === locBlock).map((d: any) => d.floor).filter(Boolean))).sort();
  const filteredDepts = Array.from(new Set(departments.filter((d: any) => (locBlock === 'all' || d.building === locBlock) && (locFloor === 'all' || d.floor === locFloor)).map((d: any) => d.name).filter(Boolean))).sort();
  
  const getFilteredLocations = () => {
    return departments.filter((d: any) => {
      if (locBlock !== 'all' && d.building !== locBlock) return false;
      if (locFloor !== 'all' && d.floor !== locFloor) return false;
      if (locDepartment !== 'all' && d.name !== locDepartment) return false;
      return true;
    });
  };

  const handleLocationSelect = (locId: string) => {
    const loc = departments.find((d: any) => d.id === locId);
    if (loc) {
      const str = `Blok: ${loc.building || '-'} / Kat: ${loc.floor || '-'} / Birim: ${loc.name || '-'}${loc.description ? ` / Mahal: ${loc.description}` : ''}`;
      setPlacementForm({...placementForm, unit: str});
    }
  };

  const saveItemsMutation = useMutation({
    mutationFn: async ({ kitId, items }: { kitId: string, items: any[] }) => {
      const res = await api.post(`/hazmat/spill-kits/${kitId}/items`, { items });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
    }
  });

  const saveKitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/hazmat/spill-kits', { ...data, facilityId });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
      if (itemsList.length > 0) {
        saveItemsMutation.mutate({ kitId: data.id, items: itemsList });
      }
      setIsKitModalOpen(false);
      if (!selectedKitId) setSelectedKitId(data.id);
    }
  });

  const updateKitSimpleMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/hazmat/spill-kits', { ...data, facilityId });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
    }
  });

  const deleteKitMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/spill-kits/${id}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
    }
  });

  const addPlacementMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/hazmat/spill-kits/${data.kitId}/placements`, data);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
      setIsPlacementModalOpen(false);
    }
  });

  const removePlacementMutation = useMutation({
    mutationFn: async ({ kitId, placementId }: { kitId: string, placementId: string }) => {
      const res = await api.delete(`/hazmat/spill-kits/${kitId}/placements/${placementId}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
    }
  });

  // Modals States
  const [kitForm, setKitForm] = useState<any>({});
  const addCheckMutation = useMutation({
    mutationFn: async ({ placementId, data }: { placementId: string, data: any }) => {
      const res = await api.post(`/hazmat/spill-kits/placements/${placementId}/checks`, data);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
      setIsCheckModalOpen(false);
    }
  });

  const addIncidentMutation = useMutation({
    mutationFn: async ({ placementId, data }: { placementId: string, data: any }) => {
      const res = await api.post(`/hazmat/spill-kits/placements/${placementId}/incidents`, data);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
      setIsIncidentModalOpen(false);
    }
  });

  const updateItemMutation = useMutation({
    mutationFn: async ({ itemId, exp }: { itemId: string, exp: string }) => {
      const res = await api.put(`/hazmat/spill-kits/items/${itemId}`, { exp });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const getSktStatus = (expStr?: string | null) => {
    if (!expStr) return null;
    const [year, month] = expStr.split('-');
    if (!year || !month) return null;
    
    // Determine end of the given month
    const expDate = new Date(parseInt(year), parseInt(month), 0); // Last day of that month
    const today = new Date();
    const diffTime = expDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return { label: 'Uygunsuz', variant: 'destructive', daysRemaining: diffDays };
    if (diffDays <= 90) return { label: 'SKT Bitiyor', variant: 'warning', daysRemaining: diffDays };
    return { label: 'Uygun', variant: 'outline', daysRemaining: diffDays };
  };

  const [itemsList, setItemsList] = useState<any[]>([]);
  const [placementForm, setPlacementForm] = useState<any>({});
  const [isMaterialSearchOpen, setIsMaterialSearchOpen] = useState(false);
  const [isCheckModalOpen, setIsCheckModalOpen] = useState(false);
  const [selectedPlacement, setSelectedPlacement] = useState<any>(null);
  const [checkForm, setCheckForm] = useState<any>({});
  const [incidentForm, setIncidentForm] = useState<any>({ usedItemsMap: {} });
  
  const [isKitViewModalOpen, setIsKitViewModalOpen] = useState(false);
  const [selectedKitToView, setSelectedKitToView] = useState<any>(null);

  const handleCreateNewKit = () => {
    setKitForm({ risk: 'Orta', purpose: 'kimyasal', kitName: 'Kimyasal Dökülme-Saçılma Kiti' });
    setItemsList([]);
    setIsKitModalOpen(true);
  };

  const handleEditKit = (kit: any) => {
    setKitForm(kit);
    setItemsList(kit.items || []);
    setIsKitModalOpen(true);
  };

  const handlePurposeChange = (val: string) => {
    const p = PURPOSES.find(p => p.id === val);
    setKitForm({ ...kitForm, purpose: val, kitName: p ? p.label : '' });
  };

  const handleAddSuggestedItems = () => {
    const kit = kits.find((k:any) => k.id === selectedKitId);
    if (!kit || !kit.purpose) return;
    const suggested = SUGGESTED_ITEMS[kit.purpose] || [];
    const newItems = [...itemsList];
    suggested.forEach(sug => {
      if (!newItems.find(i => i.name === sug.name)) {
        newItems.push({ ...sug, id: `temp_${Date.now()}_${Math.random()}` });
      }
    });
    setItemsList(newItems);
  };

  if (!facilityId) {
    return <div className="p-8 text-center">Lütfen önce bir tesis seçin.</div>;
  }

  // Get all physical placements (instances) across all kits
  const allPlacements = kits.flatMap((k: any) => 
    (k.placements || []).map((p: any) => ({ ...p, kit: k }))
  );

  const placementsWithChecks = allPlacements.map((p: any) => {
    const period = p.kit?.period || 30;
    const checks = p.checks || [];
    let lastCheckDate = p.createdAt ? new Date(p.createdAt) : new Date();
    if (checks.length > 0) {
      const sortedChecks = [...checks].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      lastCheckDate = new Date(sortedChecks[0].createdAt);
    }
    const nextCheckDate = new Date(lastCheckDate);
    nextCheckDate.setDate(nextCheckDate.getDate() + period);
    
    const daysRemaining = Math.ceil((nextCheckDate.getTime() - new Date().getTime()) / (1000 * 3600 * 24));
    
    return { ...p, lastCheckDate, nextCheckDate, daysRemaining, period };
  }).sort((a, b) => a.daysRemaining - b.daysRemaining);

  const upcomingChecksCount = placementsWithChecks.filter((p) => p.daysRemaining <= 7).length;

  const needsIntervention = placementsWithChecks.filter((p: any) => {
    const latestCheck = p.checks && p.checks.length > 0 ? [...p.checks].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;
    
    let hasSktWarning = false;
    if (p.kit?.items) {
      hasSktWarning = p.kit.items.some((item: any) => {
        const status = getSktStatus(item.exp);
        return status && (status.label === 'Uygunsuz' || status.label === 'SKT Bitiyor');
      });
    }

    return latestCheck?.result === 'Eksik (Müdahale Gerekli)' || p.status === 'Eksik (Müdahale Gerekli)' || (latestCheck?.note && latestCheck.note.length > 0) || (latestCheck?.itemChecks && Object.values(latestCheck.itemChecks).some((ic: any) => !ic.ok)) || hasSktWarning;
  });

  const allIncidents = allPlacements.flatMap((p: any) => 
    (p.incidents || []).map((inc: any) => ({ ...inc, placement: p }))
  ).sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const selectedIncidentPlacement = allPlacements.find((p: any) => p.id === incidentForm.placementId);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dökülme-Saçılma Kiti Yönetim Sistemi</h1>
          <p className="text-muted-foreground">Şablon oluşturun ve departmanlara atayarak yönetin.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 h-auto">
          <TabsTrigger value="dashboard" className="py-2">Dashboard</TabsTrigger>
          <TabsTrigger value="templates" className="py-2">Kit Oluştur</TabsTrigger>
          <TabsTrigger value="placements" className="py-2">Departman Ataması</TabsTrigger>
          <TabsTrigger value="checks" className="py-2">Kontroller</TabsTrigger>
          
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Hazırlanan Kitler (Şablon)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{kits.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Sahada Aktif Olanlar</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{allPlacements.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Yaklaşan Kontroller (7 Gün)</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-orange-600">{upcomingChecksCount}</div>
              </CardContent>
            </Card>
          </div>
          
          {needsIntervention.length > 0 && (
            <Card className="border-red-200">
              <CardHeader className="bg-red-50/50">
                <CardTitle className="flex items-center text-red-700">
                  <ShieldAlert className="w-5 h-5 mr-2" /> Müdahale Gereken / Not Düşülmüş Kitler
                </CardTitle>
                <CardDescription>Son kontrolde eksik tespit edilen veya özel not yazılan kitler</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="overflow-hidden">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/30 text-muted-foreground">
                      <tr>
                        <th className="p-4 border-b">Kit & Departman</th>
                        <th className="p-4 border-b">Son Durum</th>
                        <th className="p-4 border-b">Kontrol Notu</th>
                        <th className="p-4 border-b">Tarih</th>
                      </tr>
                    </thead>
                    <tbody>
                      {needsIntervention.map((p: any) => {
                        const latestCheck = p.checks && p.checks.length > 0 ? [...p.checks].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0] : null;
                        
                        let sktAlerts: string[] = [];
                        if (p.kit?.items) {
                          p.kit.items.forEach((item: any) => {
                            const status = getSktStatus(item.exp);
                            if (status && status.label === 'Uygunsuz') sktAlerts.push(`${item.name} (Süresi Geçti)`);
                            else if (status && status.label === 'SKT Bitiyor') sktAlerts.push(`${item.name} (SKT Yaklaştı)`);
                          });
                        }

                        return (
                          <tr key={p.id} className="border-b last:border-0 hover:bg-muted/10">
                            <td className="p-4 font-medium">{p.kit?.kitName} <br/><span className="text-muted-foreground text-xs">{p.unit} {p.location ? `(${p.location})` : ''}</span></td>
                            <td className="p-4">
                              <div className="flex flex-col gap-1 items-start">
                                {(latestCheck?.result === 'Eksik (Müdahale Gerekli)' || p.status === 'Eksik (Müdahale Gerekli)') && <Badge variant="destructive">{latestCheck?.result || p.status}</Badge>}
                                {sktAlerts.length > 0 && <Badge variant="warning" className="bg-orange-500 text-white mt-1">SKT Sorunlu Malzeme Var</Badge>}
                              </div>
                            </td>
                            <td className="p-4 text-xs max-w-xs">
                              <div className="flex flex-col gap-1">
                                {latestCheck?.note && <span>{latestCheck.note}</span>}
                                {sktAlerts.map((a, i) => <span key={i} className="text-red-600 font-semibold">{a}</span>)}
                              </div>
                            </td>
                            <td className="p-4">{latestCheck ? new Date(latestCheck.createdAt).toLocaleDateString('tr-TR') : '-'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* 1. Şablonlar */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kit Oluştur</CardTitle>
                <CardDescription>Oluşturduğunuz kitler sahadaki tüm departmanlarda kullanılabilir.</CardDescription>
              </div>
              <Button onClick={handleCreateNewKit}><Plus className="w-4 h-4 mr-2" /> Yeni Kit Oluştur</Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-3 border-b">Kit Kodu & Adı</th>
                      <th className="p-3 border-b">Risk Seviyesi</th>
                      <th className="p-3 border-b">Sahadaki Sayısı</th>
                      <th className="p-3 border-b text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kits.map((kit: any) => (
                      <tr key={kit.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">
                          {kit.code && <Badge variant="secondary" className="mr-2">{kit.code}</Badge>}
                          {kit.kitName}
                        </td>
                        <td className="p-3"><Badge variant="outline">{kit.risk}</Badge></td>
                        <td className="p-3 font-semibold">{kit.placements?.length || 0} Lokasyon</td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="sm" onClick={() => { setSelectedKitToView(kit); setIsKitViewModalOpen(true); }}>Görüntüle</Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditKit(kit)}>Düzenle</Button>
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                            if (window.confirm('Bu şablonu silmek istediğinize emin misiniz? (Şablona ait sahada kit varsa onlar etkilenmez)')) {
                              deleteKitMutation.mutate(kit.id);
                            }
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {kits.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">Kayıtlı şablon bulunamadı.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 3. Departman Ataması */}
        <TabsContent value="placements" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Sahadaki Kitler (Fiziksel Yerleşimler)</CardTitle>
                <CardDescription>Şablonlarınızı sahadaki fiziksel birimlere atayın.</CardDescription>
              </div>
              <Button onClick={() => { setPlacementForm({}); setIsPlacementModalOpen(true); }}><Plus className="w-4 h-4 mr-2"/> Yeni Departmana Ata</Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-3 border-b">Kit Kodu & Adı</th>
                      <th className="p-3 border-b">Departman</th>
                      <th className="p-3 border-b">Lokasyon</th>
                      <th className="p-3 border-b">Sorumlu</th>
                      <th className="p-3 border-b">Durum</th>
                      <th className="p-3 border-b text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {allPlacements.map((p: any) => (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">
                          {p.kit?.code && <Badge variant="secondary" className="mr-2">{p.kit.code}</Badge>}
                          {p.kit?.kitName}
                        </td>
                        <td className="p-3 font-semibold text-blue-700">{p.unit}</td>
                        <td className="p-3">{p.location || '-'}</td>
                        <td className="p-3">{p.owner || '-'}</td>
                        <td className="p-3"><Badge className={(p.status==='Aktif' || p.status==='Kurulumda') ? 'bg-green-500 hover:bg-green-600 text-white border-0' : ''} variant={(p.status==='Aktif' || p.status==='Kurulumda')?'default':'destructive'}>{p.status === 'Kurulumda' ? 'Aktif' : p.status}</Badge></td>
                        <td className="p-3 text-right">
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => removePlacementMutation.mutate({ kitId: p.kitId, placementId: p.id })}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                    {allPlacements.length === 0 && <tr><td colSpan={6} className="p-6 text-center text-muted-foreground">Henüz hiçbir departmana kit atanmamış.</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 4. Kontroller */}
        <TabsContent value="checks" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Şablon Kontrol Periyotları</CardTitle>
              <CardDescription>Hazırlanmış kit şablonları için periyot belirleyin.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-3 border-b">Kit Adı</th>
                      <th className="p-3 border-b">Amaç</th>
                      <th className="p-3 border-b">Periyot (Gün)</th>
                      <th className="p-3 border-b text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kits.map((kit: any) => (
                      <tr key={kit.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{kit.kitName}</td>
                        <td className="p-3">{PURPOSES.find(p=>p.id===kit.purpose)?.label || kit.purpose}</td>
                        <td className="p-3">
                          <Select 
                            value={kit.period?.toString() || '30'} 
                            onValueChange={(val) => {
                              updateKitSimpleMutation.mutate({ ...kit, period: parseInt(val) });
                            }}
                          >
                            <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">1 Ay (30 Gün)</SelectItem>
                              <SelectItem value="90">3 Ay (90 Gün)</SelectItem>
                              <SelectItem value="180">6 Ay (180 Gün)</SelectItem>
                              <SelectItem value="365">1 Yıl (365 Gün)</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3 text-right">
                          <Button variant="outline" size="sm" onClick={() => handleEditKit(kit)}>Düzenle</Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Yaklaşan Kontroller</CardTitle>
              <CardDescription>Sahada bulunan kitlerin kontrol durumları (En yakın tarih üstte).</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-3 border-b">Kit Kodu & Adı</th>
                      <th className="p-3 border-b">Departman</th>
                      <th className="p-3 border-b">Periyot</th>
                      <th className="p-3 border-b">Son Kontrol</th>
                      <th className="p-3 border-b">Kontrole Kalan Süre</th>
                      <th className="p-3 border-b">SKT Durumu</th>
                      <th className="p-3 border-b text-right">İşlem</th>
                    </tr>
                  </thead>
                  <tbody>
                    {placementsWithChecks.map((p: any) => {
                      let hasSktWarning = false;
                      let hasSktExpired = false;
                      if (p.kit?.items) {
                        p.kit.items.forEach((item: any) => {
                          const status = getSktStatus(item.exp);
                          if (status?.label === 'Uygunsuz') hasSktExpired = true;
                          else if (status?.label === 'SKT Bitiyor') hasSktWarning = true;
                        });
                      }

                      return (
                      <tr key={p.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">
                          {p.kit?.code && <Badge variant="secondary" className="mr-2">{p.kit.code}</Badge>}
                          {p.kit?.kitName}
                        </td>
                        <td className="p-3 font-semibold">{p.unit} {p.location ? `(${p.location})` : ''}</td>
                        <td className="p-3">
                          <Select 
                            value={p.kit?.period?.toString() || '30'} 
                            onValueChange={(val) => {
                              updateKitSimpleMutation.mutate({ ...p.kit, period: parseInt(val) });
                            }}
                          >
                            <SelectTrigger className="w-24 h-8 text-xs"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="30">1 Ay</SelectItem>
                              <SelectItem value="90">3 Ay</SelectItem>
                              <SelectItem value="180">6 Ay</SelectItem>
                              <SelectItem value="365">1 Yıl</SelectItem>
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-3">
                          {p.checks && p.checks.length > 0 
                            ? new Date(p.lastCheckDate).toLocaleDateString('tr-TR') 
                            : 'Hiç kontrol edilmedi'}
                        </td>
                        <td className="p-3">
                          <Badge variant={p.daysRemaining < 0 ? 'destructive' : (p.daysRemaining <= 7 ? 'warning' : 'outline')} className={p.daysRemaining <= 7 && p.daysRemaining >= 0 ? "bg-orange-500 text-white" : ""}>
                            {p.daysRemaining < 0 ? `${Math.abs(p.daysRemaining)} gün gecikti` : `${p.daysRemaining} gün kaldı`}
                          </Badge>
                        </td>
                        <td className="p-3">
                          {hasSktExpired ? <Badge variant="destructive">Uygunsuz (SKT Geçti)</Badge> : 
                           hasSktWarning ? <Badge variant="warning" className="bg-orange-500 text-white">SKT Bitiyor</Badge> : 
                           <Badge variant="outline" className="border-green-500 text-green-600">Uygun</Badge>}
                        </td>
                        <td className="p-3 text-right">
                          <Button size="sm" onClick={() => {
                            setSelectedPlacement(p);
                            
                            // Initialize itemChecks state for all items
                            const initialItemChecks: any = {};
                            if (p.kit && p.kit.items) {
                              p.kit.items.forEach((item: any) => {
                                initialItemChecks[item.id] = { ok: true, note: '', newExp: item.exp || '' };
                              });
                            }
                            
                            setCheckForm({ result: 'Sorunsuz', contentOk: true, packageOk: true, itemChecks: initialItemChecks });
                            setIsCheckModalOpen(true);
                          }}>
                            Kontrol Et
                          </Button>
                        </td>
                      </tr>
                    )})}
                    {placementsWithChecks.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-6 text-center text-muted-foreground">Sahada kit bulunmuyor.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        </Tabs>

      {/* Kit Template Modal */}
      <Dialog open={isKitModalOpen} onOpenChange={setIsKitModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{kitForm.id ? 'Kiti Düzenle' : 'Yeni Kit Oluştur'}</DialogTitle>
            <DialogDescription>Kitin tipini, risk seviyesini ve ihtiyaç gerekçesini belirleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Kit Tipi</Label>
                <Select value={kitForm.purpose || ''} onValueChange={handlePurposeChange}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {PURPOSES.map(p => <SelectItem key={p.id} value={p.id}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Risk Seviyesi</Label>
                <Select value={kitForm.risk || ''} onValueChange={(val) => setKitForm({...kitForm, risk: val})}>
                  <SelectTrigger><SelectValue placeholder="Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Düşük">Düşük</SelectItem>
                    <SelectItem value="Orta">Orta</SelectItem>
                    <SelectItem value="Yüksek">Yüksek</SelectItem>
                    <SelectItem value="Kritik">Kritik</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>İhtiyaç Gerekçesi</Label>
              <Textarea value={kitForm.needReason || kitForm.worstCase || ''} onChange={e => setKitForm({...kitForm, needReason: e.target.value, worstCase: e.target.value})} rows={2} placeholder="Neden bu kite ihtiyaç duyuldu?" />
            </div>
            <div className="pt-4 border-t space-y-4">
              <div className="flex flex-col space-y-3">
                 <Label className="text-base font-bold">Şablon İçeriği (Malzemeler)</Label>
                 <div className="flex gap-2">
                    <Popover open={isMaterialSearchOpen} onOpenChange={setIsMaterialSearchOpen}>
                      <PopoverTrigger className="flex h-10 w-full md:w-96 items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background hover:bg-accent hover:text-accent-foreground">
                          <span className="truncate">Listeden Malzeme Ara ve Ekle...</span>
                          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </PopoverTrigger>
                      <PopoverContent className="w-[400px] p-0">
                        <Command>
                          <CommandInput placeholder="Malzeme ara..." />
                          <CommandList>
                            <CommandEmpty>Bulunamadı.</CommandEmpty>
                            <CommandGroup>
                              {masterItems.map((m:any) => (
                                <CommandItem key={m.id} onSelect={() => {
                                  if (!itemsList.find((i:any) => i.name === m.name)) {
                                    setItemsList([...itemsList, { id: `temp_${Date.now()}`, name: m.name, type: m.type, qty: 1, min: 1, exp: '' }]);
                                  }
                                }}>
                                  <Plus className="mr-2 h-4 w-4" />
                                  {m.name} ({m.type})
                                </CommandItem>
                              ))}
                            </CommandGroup>
                          </CommandList>
                        </Command>
                      </PopoverContent>
                    </Popover>
                 </div>
              </div>
              <div className="space-y-3">
                 {itemsList.map((item: any, idx: number) => (
                    <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end p-3 border rounded-lg bg-muted/10">
                       <div className="md:col-span-4 space-y-1">
                          <Label className="text-xs font-semibold text-muted-foreground">Malzeme</Label>
                          <div className="font-medium text-sm pt-1">{item.name}</div>
                          <div className="text-xs text-muted-foreground">{item.type}</div>
                       </div>
                       <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs font-semibold">Miktar</Label>
                          <Input type="number" value={item.qty || ''} onChange={e => {
                             const newI = [...itemsList]; newI[idx].qty = e.target.value; setItemsList(newI);
                          }} />
                       </div>
                       <div className="md:col-span-2 space-y-1">
                          <Label className="text-xs font-semibold">Min</Label>
                          <Input type="number" value={item.min || ''} onChange={e => {
                             const newI = [...itemsList]; newI[idx].min = e.target.value; setItemsList(newI);
                          }} />
                       </div>
                       <div className="md:col-span-3 space-y-1">
                          <Label className="text-xs font-semibold">SKT</Label>
                          <Input type="month" value={item.exp || ''} onChange={e => {
                             const newI = [...itemsList]; newI[idx].exp = e.target.value; setItemsList(newI);
                          }} />
                       </div>
                       <div className="md:col-span-1 text-right">
                          <Button variant="ghost" size="icon" className="text-red-500" onClick={() => {
                            const newI = [...itemsList]; newI.splice(idx, 1); setItemsList(newI);
                          }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                       </div>
                    </div>
                 ))}
                 {itemsList.length === 0 && <div className="text-center p-4 text-muted-foreground">Henüz içerik eklenmedi.</div>}
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsKitModalOpen(false)}>İptal</Button>
            <Button onClick={() => saveKitMutation.mutate(kitForm)} disabled={saveKitMutation.isPending}>Kaydet</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Placement Modal */}
      <Dialog open={isPlacementModalOpen} onOpenChange={setIsPlacementModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kiti Sahaya Ata</DialogTitle>
            <DialogDescription>Oluşturduğunuz bir kiti bir departmana atayarak sahadaki fiziksel çantayı oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hangi Kit?</Label>
                <Select value={placementForm.kitId || ''} onValueChange={(val) => setPlacementForm({...placementForm, kitId: val})}>
                  <SelectTrigger><SelectValue placeholder="Kit Seçin" /></SelectTrigger>
                  <SelectContent>
                    {kits.map((k:any) => <SelectItem key={k.id} value={k.id}>{k.code ? `${k.code} - ` : ''}{k.kitName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2 col-span-2 p-4 bg-muted/20 rounded-md border">
                <Label className="text-base font-semibold block mb-2">Hangi Departman (Lokasyon)?</Label>
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2">
                  <div className="space-y-1">
                    <Label className="text-xs">Blok Seçimi *</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50" disabled={blocks.length === 0} value={locBlock} onChange={e => {setLocBlock(e.target.value); setLocFloor('all'); setLocDepartment('all');}}>
                      <option value="all">Seçiniz...</option>
                      {blocks.map((b: any) => <option key={b} value={b}>{b}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Kat Seçimi *</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50" disabled={floors.length === 0} value={locFloor} onChange={e => {setLocFloor(e.target.value); setLocDepartment('all');}}>
                      <option value="all">Seçiniz...</option>
                      {floors.map((f: any) => <option key={f} value={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Birim Seçimi *</Label>
                    <select className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50" disabled={filteredDepts.length === 0} value={locDepartment} onChange={e => setLocDepartment(e.target.value)}>
                      <option value="all">Seçiniz...</option>
                      {filteredDepts.map((d: any) => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">Mahal Seçimi (Opsiyonel)</Label>
                    <select 
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-1 text-sm disabled:opacity-50"
                      onChange={(e) => handleLocationSelect(e.target.value)}
                      value=""
                    >
                      <option value="" disabled>Seçiniz...</option>
                      {getFilteredLocations().map((loc: any) => (
                        <option key={loc.id} value={loc.id}>{`${loc.building ? `${loc.building} / ` : ''}${loc.floor ? `${loc.floor} / ` : ''}${loc.name}${loc.description ? ` / ${loc.description}` : ''}`}</option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="mt-4">
                  <Label className="text-xs text-muted-foreground">Seçilen Departman (Kaydedilecek)</Label>
                  <Input value={placementForm.unit || ''} onChange={e => setPlacementForm({...placementForm, unit: e.target.value})} className="h-10 bg-slate-50 font-medium" />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Net Lokasyon (Örn: Giriş Kapısı)</Label>
                <Input value={placementForm.location || ''} onChange={e => setPlacementForm({...placementForm, location: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Kit Sorumlusu (Personel)</Label>
                <Input value={placementForm.owner || ''} onChange={e => setPlacementForm({...placementForm, owner: e.target.value})} />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
              <div className="flex items-center space-x-2">
                <Checkbox id="pVisible" checked={placementForm.visible} onCheckedChange={c => setPlacementForm({...placementForm, visible: !!c})} />
                <Label htmlFor="pVisible">Görünür / Erişilebilir</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pSign" checked={placementForm.sign} onCheckedChange={c => setPlacementForm({...placementForm, sign: !!c})} />
                <Label htmlFor="pSign">Etiketli / İşaretli</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pInstruction" checked={placementForm.instruction} onCheckedChange={c => setPlacementForm({...placementForm, instruction: !!c})} />
                <Label htmlFor="pInstruction">Talimat Asılı</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox id="pTraining" checked={placementForm.training} onCheckedChange={c => setPlacementForm({...placementForm, training: !!c})} />
                <Label htmlFor="pTraining">Personel Eğitimli</Label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsPlacementModalOpen(false)}>İptal</Button>
            <Button onClick={() => addPlacementMutation.mutate(placementForm)} disabled={addPlacementMutation.isPending}>Departmana Ekle</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Check Modal */}
      <Dialog open={isCheckModalOpen} onOpenChange={setIsCheckModalOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Kit Kontrolü: {selectedPlacement?.kit?.kitName}</DialogTitle>
            <DialogDescription>{selectedPlacement?.unit} departmanındaki kitin durumunu kaydedin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            
            <div className="space-y-3">
               <Label className="text-base font-bold">Malzeme Kontrolü</Label>
               <div className="border rounded-md divide-y">
                  {selectedPlacement?.kit?.items && selectedPlacement.kit.items.map((item: any) => (
                    <div key={item.id} className="flex flex-col md:flex-row md:items-center justify-between p-3 gap-3 hover:bg-muted/20">
                      <div className="flex items-center space-x-3 w-1/3">
                        <Checkbox 
                          checked={checkForm.itemChecks?.[item.id]?.ok} 
                          onCheckedChange={c => {
                            setCheckForm((prev: any) => ({
                              ...prev,
                              itemChecks: {
                                ...prev.itemChecks,
                                [item.id]: { ...prev.itemChecks?.[item.id], ok: !!c }
                              }
                            }));
                          }} 
                        />
                        <div>
                          <p className="text-sm font-medium leading-none">{item.name}</p>
                          <div className="flex gap-2 items-center mt-1">
                            <span className="text-xs text-muted-foreground">Miktar: {item.qty}</span>
                            {getSktStatus(item.exp) && (
                              <Badge variant={getSktStatus(item.exp)?.variant as any} className={getSktStatus(item.exp)?.label === 'SKT Bitiyor' ? 'bg-orange-500 text-white text-[10px] px-1 py-0 h-4' : 'text-[10px] px-1 py-0 h-4'}>
                                {getSktStatus(item.exp)?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="w-full md:w-2/3 flex flex-col md:flex-row gap-2">
                        <div className="w-full md:w-32 flex flex-col gap-1">
                          <Label className="text-[10px]">SKT Güncelle</Label>
                          <Input 
                            type="month"
                            value={checkForm.itemChecks?.[item.id]?.newExp || ''}
                            onChange={e => {
                              setCheckForm((prev: any) => ({
                                ...prev,
                                itemChecks: {
                                  ...prev.itemChecks,
                                  [item.id]: { ...prev.itemChecks?.[item.id], newExp: e.target.value }
                                }
                              }));
                            }}
                            className="h-8 text-xs px-2"
                          />
                        </div>
                        <div className="w-full flex flex-col gap-1">
                          <Label className="text-[10px] opacity-0 hidden md:block">Not</Label>
                          <Input 
                            placeholder="Eksik / Hasar durumu (Örn: 2 adet eksik)" 
                            value={checkForm.itemChecks?.[item.id]?.note || ''}
                            onChange={e => {
                              setCheckForm((prev: any) => ({
                                ...prev,
                                itemChecks: {
                                  ...prev.itemChecks,
                                  [item.id]: { ...prev.itemChecks?.[item.id], note: e.target.value }
                                }
                              }));
                            }}
                            className="h-8 border-red-200 focus-visible:ring-red-500"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {(!selectedPlacement?.kit?.items || selectedPlacement.kit.items.length === 0) && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Bu şablona eklenmiş malzeme bulunmuyor.</div>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-2">
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <Checkbox id="cContent" checked={checkForm.contentOk} onCheckedChange={c => setCheckForm({...checkForm, contentOk: !!c})} />
                <Label htmlFor="cContent">İçerik Tam (Eksik yok)</Label>
              </div>
              <div className="flex items-center space-x-2 border p-3 rounded-md">
                <Checkbox id="cPackage" checked={checkForm.packageOk} onCheckedChange={c => setCheckForm({...checkForm, packageOk: !!c})} />
                <Label htmlFor="cPackage">Ambalaj / Çanta Sağlam</Label>
              </div>
            </div>

            <div className="space-y-2 pt-2">
              <Label>Genel Durum</Label>
              <Select value={checkForm.result || ''} onValueChange={(val) => setCheckForm({...checkForm, result: val})}>
                <SelectTrigger><SelectValue placeholder="Durum Seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sorunsuz">Sorunsuz</SelectItem>
                  <SelectItem value="Eksikler Giderildi">Eksikler Giderildi</SelectItem>
                  <SelectItem value="Eksik (Müdahale Gerekli)">Eksik (Müdahale Gerekli)</SelectItem>
                  <SelectItem value="Kullanılamaz">Kullanılamaz</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Notlar</Label>
              <Textarea value={checkForm.note || ''} onChange={e => setCheckForm({...checkForm, note: e.target.value})} placeholder="İsteğe bağlı not ekleyebilirsiniz..." />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsCheckModalOpen(false)}>İptal</Button>
            <Button 
              onClick={() => {
                // If there are SKT updates, trigger updateItemMutations
                if (checkForm.itemChecks && selectedPlacement?.kit?.items) {
                  selectedPlacement.kit.items.forEach((item: any) => {
                    const ic = checkForm.itemChecks[item.id];
                    if (ic && ic.newExp && ic.newExp !== item.exp) {
                      updateItemMutation.mutate({ itemId: item.id, exp: ic.newExp });
                    }
                  });
                }
                addCheckMutation.mutate({ placementId: selectedPlacement.id, data: { ...checkForm, lastCheck: new Date().toISOString() } });
              }}
              disabled={addCheckMutation.isPending}
            >
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Kit View Modal */}
      <Dialog open={isKitViewModalOpen} onOpenChange={setIsKitViewModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Şablon Görüntüleme: {selectedKitToView?.kitName}</DialogTitle>
            <DialogDescription>Amaç: {PURPOSES.find(p=>p.id===selectedKitToView?.purpose)?.label || selectedKitToView?.purpose} | Risk: {selectedKitToView?.risk}</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label className="text-muted-foreground text-xs">Gerekçe / Kötü Senaryo</Label>
              <div className="text-sm bg-muted p-3 rounded-md">{selectedKitToView?.worstCase || '-'}</div>
            </div>
            <div className="space-y-3 pt-2">
              <Label className="text-base font-bold">Malzeme Listesi ({selectedKitToView?.items?.length || 0})</Label>
              <div className="border rounded-md overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground">
                    <tr>
                      <th className="p-3 border-b">Malzeme</th>
                      <th className="p-3 border-b">Tür</th>
                      <th className="p-3 border-b text-center">Miktar</th>
                      <th className="p-3 border-b text-center">SKT Durumu</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedKitToView?.items && selectedKitToView.items.map((item: any) => (
                      <tr key={item.id} className="border-b last:border-0 hover:bg-muted/10">
                        <td className="p-3 font-medium">{item.name}</td>
                        <td className="p-3">{item.type || '-'}</td>
                        <td className="p-3 text-center">{item.qty}</td>
                        <td className="p-3 text-center">
                          {item.exp ? (
                            <div className="flex flex-col gap-1 items-center">
                              <span className="text-xs font-medium">{item.exp}</span>
                              <Badge variant={getSktStatus(item.exp)?.variant as any} className={getSktStatus(item.exp)?.label === 'SKT Bitiyor' ? 'bg-orange-500 text-white text-[10px] py-0' : 'text-[10px] py-0'}>
                                {getSktStatus(item.exp)?.label}
                              </Badge>
                            </div>
                          ) : '-'}
                        </td>
                      </tr>
                    ))}
                    {(!selectedKitToView?.items || selectedKitToView.items.length === 0) && (
                      <tr>
                        <td colSpan={4} className="p-6 text-center text-muted-foreground">Malzeme eklenmemiş.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={() => setIsKitViewModalOpen(false)}>Kapat</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Incident Modal */}
      <Dialog open={isIncidentModalOpen} onOpenChange={setIsIncidentModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Yeni Olay Kaydı</DialogTitle>
            <DialogDescription>Dökülme/saçılma olayını ve kit kullanım durumunu kaydedin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Kit Seç (Departman / Lokasyon)</Label>
              <Select value={incidentForm.placementId || ''} onValueChange={(val) => {
                setIncidentForm({...incidentForm, placementId: val, usedItemsMap: {}});
              }}>
                <SelectTrigger><SelectValue placeholder="Kit Seçin" /></SelectTrigger>
                <SelectContent>
                  {allPlacements.map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.kit?.kitName} - {p.unit} {p.location ? `(${p.location})` : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Olay Tarihi</Label>
                <Input type="datetime-local" value={incidentForm.incidentDate || ''} onChange={e => setIncidentForm({...incidentForm, incidentDate: e.target.value})} />
              </div>
              <div className="space-y-2">
                <Label>Dökülme Türü</Label>
                <Input placeholder="Örn: Kimyasal, Biyolojik..." value={incidentForm.incidentType || ''} onChange={e => setIncidentForm({...incidentForm, incidentType: e.target.value})} />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Kit Kullanım Durumu</Label>
              <Select value={incidentForm.kitUsed || ''} onValueChange={(val) => setIncidentForm({...incidentForm, kitUsed: val})}>
                <SelectTrigger><SelectValue placeholder="Durum Seçin" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kullanılmadı">Kullanılmadı</SelectItem>
                  <SelectItem value="Kısmen Kullanıldı">Kısmen Kullanıldı</SelectItem>
                  <SelectItem value="Kullanıldı">Tamamen Kullanıldı</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Olay Açıklaması</Label>
              <Textarea placeholder="Olay nasıl gerçekleşti?" value={incidentForm.incidentDesc || ''} onChange={e => setIncidentForm({...incidentForm, incidentDesc: e.target.value})} rows={3} />
            </div>
            
            {selectedIncidentPlacement && (
              <div className="space-y-3 pt-2">
                <Label className="text-base font-bold">Kullanılan / Eksilen Malzemeler</Label>
                <div className="border rounded-md divide-y">
                  {selectedIncidentPlacement.kit?.items?.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-3 gap-3 hover:bg-muted/20">
                      <div className="flex items-center space-x-3 w-1/2">
                        <Checkbox 
                          checked={!!incidentForm.usedItemsMap?.[item.id]?.used} 
                          onCheckedChange={c => {
                            setIncidentForm((prev: any) => ({
                              ...prev,
                              usedItemsMap: {
                                ...prev.usedItemsMap,
                                [item.id]: { ...prev.usedItemsMap?.[item.id], used: !!c }
                              }
                            }));
                          }} 
                        />
                        <div>
                          <p className="text-sm font-medium leading-none">{item.name}</p>
                          <span className="text-xs text-muted-foreground">Mevcut Miktar: {item.qty}</span>
                        </div>
                      </div>
                      {incidentForm.usedItemsMap?.[item.id]?.used && (
                        <div className="w-1/2 flex items-center gap-2">
                          <Label className="text-xs shrink-0">Kullanılan Adet:</Label>
                          <Input 
                            type="number"
                            placeholder="Miktar"
                            className="h-8 w-24"
                            value={incidentForm.usedItemsMap?.[item.id]?.qty || ''}
                            onChange={e => {
                              setIncidentForm((prev: any) => ({
                                ...prev,
                                usedItemsMap: {
                                  ...prev.usedItemsMap,
                                  [item.id]: { ...prev.usedItemsMap?.[item.id], qty: e.target.value }
                                }
                              }));
                            }}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                  {(!selectedIncidentPlacement.kit?.items || selectedIncidentPlacement.kit.items.length === 0) && (
                    <div className="p-4 text-center text-sm text-muted-foreground">Bu kite ait malzeme bulunamadı.</div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-2 pt-2">
              <Label>Sonuç / Değerlendirme</Label>
              <Textarea placeholder="Olayın sonucu, alınan önlemler vb." value={incidentForm.incidentOutcome || ''} onChange={e => setIncidentForm({...incidentForm, incidentOutcome: e.target.value})} rows={3} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsIncidentModalOpen(false)}>İptal</Button>
            <Button 
              onClick={() => {
                const usedItemsSummary = Object.keys(incidentForm.usedItemsMap || {})
                  .filter(k => incidentForm.usedItemsMap[k].used)
                  .map(k => {
                    const itemName = selectedIncidentPlacement?.kit?.items?.find((i: any) => i.id === k)?.name;
                    const qty = incidentForm.usedItemsMap[k].qty;
                    return `${itemName}: ${qty} adet`;
                  }).join(', ');
                  
                const payload = {
                  incidentDate: incidentForm.incidentDate,
                  incidentType: incidentForm.incidentType,
                  kitUsed: incidentForm.kitUsed,
                  incidentDesc: incidentForm.incidentDesc,
                  usedItems: usedItemsSummary,
                  incidentOutcome: incidentForm.incidentOutcome
                };
                addIncidentMutation.mutate({ placementId: incidentForm.placementId, data: payload });
              }}
              disabled={!incidentForm.placementId || addIncidentMutation.isPending}
            >
              Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
