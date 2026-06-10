import React, { useState } from 'react';
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
  { id: 'kimyasal', label: 'Kimyasal dökülme-saçılma' },
  { id: 'biyolojik', label: 'Biyolojik materyal dökülmesi' },
  { id: 'sitotoksik', label: 'Sitotoksik / kemoterapi dökülmesi' },
  { id: 'formalin', label: 'Formaldehit / formalin dökülmesi' },
  { id: 'asitbaz', label: 'Asit-baz / korozif dökülme' },
  { id: 'civa', label: 'Cıva dökülmesi' },
  { id: 'genel', label: 'Genel amaçlı absorban kit' }
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
  const [activeTab, setActiveTab] = useState('templates');
  const [isKitModalOpen, setIsKitModalOpen] = useState(false);
  const [isPlacementModalOpen, setIsPlacementModalOpen] = useState(false);
  const [selectedKitId, setSelectedKitId] = useState<string | null>(null);

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

  const saveKitMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/hazmat/spill-kits', { ...data, facilityId });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['spill-kits'] });
      setIsKitModalOpen(false);
      if (!selectedKitId) setSelectedKitId(data.id);
    }
  });

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
  const [itemsList, setItemsList] = useState<any[]>([]);
  const [placementForm, setPlacementForm] = useState<any>({});
  const [isMaterialSearchOpen, setIsMaterialSearchOpen] = useState(false);

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

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Dökülme-Saçılma Kiti Yönetim Sistemi</h1>
          <p className="text-muted-foreground">Şablon oluşturun ve departmanlara atayarak yönetin.</p>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="bg-muted p-1 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 h-auto">
          <TabsTrigger value="templates" className="py-2">1. Şablonlar</TabsTrigger>
          
          <TabsTrigger value="placements" className="py-2">3. Departman Ataması</TabsTrigger>
          <TabsTrigger value="checks" className="py-2">4. Kontroller</TabsTrigger>
          <TabsTrigger value="incidents" className="py-2">5. Olay Kayıtları</TabsTrigger>
        </TabsList>

        {/* 1. Şablonlar */}
        <TabsContent value="templates" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Kit Şablonları</CardTitle>
                <CardDescription>Oluşturduğunuz kit şablonları tüm departmanlarda kullanılabilir.</CardDescription>
              </div>
              <Button onClick={handleCreateNewKit}><Plus className="w-4 h-4 mr-2" /> Yeni Şablon Oluştur</Button>
            </CardHeader>
            <CardContent>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-muted/50 text-muted-foreground font-medium">
                    <tr>
                      <th className="p-3 border-b">Kit Adı</th>
                      <th className="p-3 border-b">Amaç</th>
                      <th className="p-3 border-b">Risk Seviyesi</th>
                      <th className="p-3 border-b">Sahadaki Sayısı</th>
                      <th className="p-3 border-b text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {kits.map((kit: any) => (
                      <tr key={kit.id} className="border-b last:border-0 hover:bg-muted/30">
                        <td className="p-3 font-medium">{kit.kitName}</td>
                        <td className="p-3">{PURPOSES.find(p=>p.id===kit.purpose)?.label || kit.purpose}</td>
                        <td className="p-3"><Badge variant="outline">{kit.risk}</Badge></td>
                        <td className="p-3 font-semibold">{kit.placements?.length || 0} Lokasyon</td>
                        <td className="p-3 text-right">
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
                      <th className="p-3 border-b">Kit Şablonu</th>
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
                        <td className="p-3 font-medium">{p.kit?.kitName}</td>
                        <td className="p-3 font-semibold text-blue-700">{p.unit}</td>
                        <td className="p-3">{p.location || '-'}</td>
                        <td className="p-3">{p.owner || '-'}</td>
                        <td className="p-3"><Badge variant={p.status==='Aktif'?'default':'destructive'}>{p.status}</Badge></td>
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
              <CardTitle>Periyodik Kontroller</CardTitle>
              <CardDescription>Fiziksel sahadaki çantaların periyodik denetimleri.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
                Burada <strong>Sahadaki Kitler (Placements)</strong> için kontrol gireceksiniz. (Yakında)
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* 5. Olay Kayıtları */}
        <TabsContent value="incidents" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Olay Kayıtları</CardTitle>
              <CardDescription>Sahada gerçekleşen kullanım ve eksilmeler.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="p-8 text-center text-muted-foreground border rounded-lg bg-card">
                Burada olay kaydı modülü listelenecektir. (Yakında)
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Kit Template Modal */}
      <Dialog open={isKitModalOpen} onOpenChange={setIsKitModalOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{kitForm.id ? 'Şablonu Düzenle' : 'Yeni Kit Şablonu'}</DialogTitle>
            <DialogDescription>Kitin tipini ve amacını belirleyin. (Hangi departmanda olduğu değil, kitin "Ne" olduğu)</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amaç / Risk Türü</Label>
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
              <Label>Kit Adı (Şablon Adı)</Label>
              <Input value={kitForm.kitName || ''} onChange={e => setKitForm({...kitForm, kitName: e.target.value})} placeholder="Örn. Formalin Kiti" />
            </div>
            <div className="space-y-2">
              <Label>İhtiyaç Gerekçesi & En Kötü Senaryo</Label>
              <Textarea value={kitForm.worstCase || ''} onChange={e => setKitForm({...kitForm, worstCase: e.target.value})} rows={2} placeholder="Hangi kötü senaryo için tasarlanıyor?" />
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Kiti Sahaya Ata</DialogTitle>
            <DialogDescription>Oluşturduğunuz bir şablonu bir departmana atayarak sahadaki fiziksel çantayı oluşturun.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Hangi Kit Şablonu?</Label>
                <Select value={placementForm.kitId || ''} onValueChange={(val) => setPlacementForm({...placementForm, kitId: val})}>
                  <SelectTrigger><SelectValue placeholder="Kit Şablonu Seçin" /></SelectTrigger>
                  <SelectContent>
                    {kits.map((k:any) => <SelectItem key={k.id} value={k.id}>{k.kitName}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Hangi Departman?</Label>
                <Select value={placementForm.unit || ''} onValueChange={(val) => setPlacementForm({...placementForm, unit: val})}>
                  <SelectTrigger><SelectValue placeholder="Departman Seçiniz" /></SelectTrigger>
                  <SelectContent>
                    {departments.map((d: any) => (
                      <SelectItem key={d.id} value={d.name}>{d.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
    </div>
  );
}
