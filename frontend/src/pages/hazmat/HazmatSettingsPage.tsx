import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toast } from 'sonner';
import { Upload, Trash2, Plus, ChevronDown, ChevronRight, MapPin, Pencil, Check, FolderTree, List } from 'lucide-react';

export default function HazmatSettingsPage() {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Determine active tab based on URL path
  const getTabFromPath = () => {
    const path = location.pathname;
    if (path.includes('/departments')) return 'departments';
    if (path.includes('/units')) return 'units';
    if (path.includes('/labels')) return 'ghs';
    if (path.includes('/ppe')) return 'ppe';
    if (path.includes('/categories')) return 'categories';
    return 'categories';
  };

  const [activeTab, setActiveTab] = useState(getTabFromPath());

  useEffect(() => {
    setActiveTab(getTabFromPath());
  }, [location.pathname]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    if (value === 'units') navigate('/hazmat/settings/units');
    else if (value === 'departments') navigate('/hazmat/settings/departments');
    else if (value === 'ghs' || value === 'adr') navigate('/hazmat/settings/labels');
    else if (value === 'ppe') navigate('/hazmat/settings/ppe');
    else if (value === 'categories') navigate('/hazmat/settings/categories');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Tehlikeli Madde Ayarları</h1>
        <p className="text-muted-foreground">Birimler, Bölümler ve Görsel Etiket tanımlamaları.</p>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
        <TabsList className="grid w-full grid-cols-6 h-auto py-2">
          <TabsTrigger value="categories" className="py-2">Kategoriler</TabsTrigger>
          <TabsTrigger value="units" className="py-2">Miktar Cinsleri</TabsTrigger>
          <TabsTrigger value="departments" className="py-2">Bölüm - Departman</TabsTrigger>
          <TabsTrigger value="ghs" className="py-2">GHS Etiketleri</TabsTrigger>
          <TabsTrigger value="adr" className="py-2">ADR Etiketleri</TabsTrigger>
          <TabsTrigger value="ppe" className="py-2">KKD'ler</TabsTrigger>
        </TabsList>
        
        <TabsContent value="categories">
          <CategoriesTab />
        </TabsContent>
        <TabsContent value="units">
          <UnitsTab />
        </TabsContent>
        <TabsContent value="departments">
          <DeptsTab />
        </TabsContent>
        <TabsContent value="ghs">
          <ImageItemsTab type="hazard-labels" title="GHS Tehlike Etiketleri" queryKey="hazmat-hazard-labels" hasCode={true} />
        </TabsContent>
        <TabsContent value="adr">
          <ImageItemsTab type="adr-labels" title="ADR Tehlike Etiketleri" queryKey="hazmat-adr-labels" hasCode={true} />
        </TabsContent>
        <TabsContent value="ppe">
          <ImageItemsTab type="ppes" title="Kişisel Koruyucu Donanımlar (KKD)" queryKey="hazmat-ppes" hasCode={false} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function UnitsTab() {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [symbol, setSymbol] = useState('');

  const { data: units = [] } = useQuery({
    queryKey: ['hazmat-units'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/units');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const createUnit = useMutation({
    mutationFn: async () => await api.post('/hazmat/settings/units', { name, symbol }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-units'] });
      setName(''); setSymbol('');
      toast.success('Birim eklendi.');
    }
  });

  const deleteUnit = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/units/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['hazmat-units'] })
  });

  return (
    <div className="bg-card border rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">Miktar Cinsleri (Birimler)</h3>
      <div className="flex gap-4 mb-6">
        <Input placeholder="Adı (Örn: Kilogram)" value={name} onChange={e => setName(e.target.value)} />
        <Input placeholder="Sembol (Örn: kg)" value={symbol} onChange={e => setSymbol(e.target.value)} />
        <Button onClick={() => createUnit.mutate()} disabled={!name || !symbol}>Ekle</Button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {units.map((u: any) => (
          <div key={u.id} className="border p-3 rounded flex justify-between items-center bg-muted/20">
            <div>
              <div className="font-semibold text-sm">{u.name}</div>
              <div className="text-xs text-muted-foreground">{u.symbol}</div>
            </div>
            <Button variant="ghost" size="icon" onClick={() => deleteUnit.mutate(u.id)} className="text-red-500 h-6 w-6"><Trash2 className="w-4 h-4" /></Button>
          </div>
        ))}
      </div>
    </div>
  );
}

function DeptsTab() {
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const [newLocation, setNewLocation] = useState({ building: '', floor: '', name: '', description: '' });
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [expandedLocs, setExpandedLocs] = useState<Record<string, boolean>>({});
  const [isLocDialogOpen, setIsLocDialogOpen] = useState(false);
  const [quickAddLoc, setQuickAddLoc] = useState({ building: '', floor: '', name: '', description: '' });

  const { data: depts = [], isLoading: isLocLoading } = useQuery({
    queryKey: ['hazmat-departments', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return [];
      const res = await api.get(`/hazmat/settings/departments?facilityId=${activeFacilityId}&isCleaningCart=false`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    enabled: !!activeFacilityId
  });

  const createDept = useMutation({
    mutationFn: async (data: any) => await api.post('/hazmat/settings/departments', { facilityId: activeFacilityId, ...data }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-departments', activeFacilityId] });
      setNewLocation({ building: '', floor: '', name: '', description: '' });
      setIsLocDialogOpen(false);
      toast.success('Lokasyon eklendi.');
    }
  });

  const updateDept = useMutation({
    mutationFn: async (data: any) => await api.put(`/hazmat/settings/departments/${data.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-departments', activeFacilityId] });
      setEditingLocation(null);
      toast.success('Lokasyon güncellendi.');
    }
  });

  const deleteDept = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/departments/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-departments', activeFacilityId] });
      toast.success('Lokasyon silindi.');
    }
  });

  if (!activeFacilityId) {
    return <p className="text-sm text-red-500 mt-4">Lütfen üst kısımdan bir tesis seçin.</p>;
  }

  const [viewModeLoc, setViewModeLoc] = useState<'tree' | 'list'>('list');

  // Lokasyonları Ağaç Yapısına Çevirme
  const locationTree: any = {};
  if (depts) {
    depts.forEach((loc: any) => {
      const b = loc.building || 'Belirtilmemiş Blok';
      const f = loc.floor || 'Belirtilmemiş Kat';
      const d = loc.name || 'Belirtilmemiş Birim';

      if (!locationTree[b]) locationTree[b] = {};
      if (!locationTree[b][f]) locationTree[b][f] = {};
      if (!locationTree[b][f][d]) locationTree[b][f][d] = [];
      
      locationTree[b][f][d].push(loc);
    });
  }

  const toggleLoc = (id: string) => setExpandedLocs(prev => ({ ...prev, [id]: !prev[id] }));

  const handleQuickAdd = (b: string, f: string, d: string) => {
    setQuickAddLoc({
      building: b === 'Belirtilmemiş Blok' ? '' : b,
      floor: f === 'Belirtilmemiş Kat' ? '' : f,
      name: d === 'Belirtilmemiş Birim' ? '' : d,
      description: ''
    });
    setIsLocDialogOpen(true);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-4">
      <div className="md:col-span-1 border rounded-lg p-6 bg-card shadow-sm h-fit">
        <h3 className="text-lg font-semibold mb-4">Yeni Lokasyon Ekle</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Bina / Blok</Label>
            <Input 
              value={newLocation.building} 
              onChange={e => setNewLocation({...newLocation, building: e.target.value})} 
              placeholder="Örn: A Blok"
              list="hz-blocks-list"
            />
            <datalist id="hz-blocks-list">
              {Array.from(new Set(depts?.map((l:any) => l.building).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Kat</Label>
            <Input 
              value={newLocation.floor} 
              onChange={e => setNewLocation({...newLocation, floor: e.target.value})} 
              placeholder="Örn: 2. Kat" 
              list="hz-floors-list"
            />
            <datalist id="hz-floors-list">
              {Array.from(new Set(depts?.filter((l:any) => !newLocation.building || l.building === newLocation.building).map((l:any) => l.floor).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Birim</Label>
            <Input 
              value={newLocation.name || ''} 
              onChange={e => setNewLocation({...newLocation, name: e.target.value})} 
              placeholder="Örn: Acil Servis" 
              list="hz-depts-list"
            />
            <datalist id="hz-depts-list">
              {Array.from(new Set(depts?.filter((l:any) => (!newLocation.building || l.building === newLocation.building) && (!newLocation.floor || l.floor === newLocation.floor)).map((l:any) => l.name).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
            </datalist>
          </div>
          <div className="space-y-2">
            <Label>Mahal</Label>
            <Input 
              value={newLocation.description} 
              onChange={e => setNewLocation({...newLocation, description: e.target.value})} 
              placeholder="Örn: Kirli Oda" 
              list="hz-desc-list"
            />
            <datalist id="hz-desc-list">
              {Array.from(new Set(depts?.filter((l:any) => (!newLocation.building || l.building === newLocation.building) && (!newLocation.floor || l.floor === newLocation.floor) && (!newLocation.name || l.name === newLocation.name)).map((l:any) => l.description).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
            </datalist>
          </div>
          <Button 
            className="w-full" 
            onClick={() => createDept.mutate(newLocation)}
            disabled={!newLocation.building || createDept.isPending}
          >
            {createDept.isPending ? 'Ekleniyor...' : 'Ekle'}
          </Button>
        </div>
      </div>

      <div className="md:col-span-2 border rounded-lg p-6 bg-card shadow-sm">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Kayıtlı Lokasyonlar</h3>
          <div className="flex bg-muted p-1 rounded-md">
            <Button variant={viewModeLoc === 'tree' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setViewModeLoc('tree')}><FolderTree className="w-4 h-4 mr-2"/>Ağaç Görünümü</Button>
            <Button variant={viewModeLoc === 'list' ? 'secondary' : 'ghost'} size="sm" className="h-8 px-2" onClick={() => setViewModeLoc('list')}><List className="w-4 h-4 mr-2"/>Liste Görünümü</Button>
          </div>
        </div>
        {isLocLoading ? <p>Yükleniyor...</p> : viewModeLoc === 'list' ? (
          <div className="border rounded-lg bg-card overflow-hidden">
            <div className="grid grid-cols-12 gap-4 p-3 font-medium text-sm text-muted-foreground border-b bg-muted/30">
              <div className="col-span-10">Lokasyon Yolu</div>
              <div className="col-span-2 text-right">İşlemler</div>
            </div>
            <div className="divide-y max-h-[600px] overflow-auto">
              {depts?.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">Henüz lokasyon eklenmemiş.</div>
              ) : (
                depts?.map((loc: any) => (
                  <div key={loc.id} className="p-3 flex items-center justify-between hover:bg-muted/10 transition-colors">
                    {editingLocation?.id === loc.id ? (
                      <div className="flex-1 space-y-2 mr-4">
                        <div className="grid grid-cols-4 gap-2">
                          <Input value={editingLocation.building} onChange={e => setEditingLocation({...editingLocation, building: e.target.value})} placeholder="Blok" />
                          <Input value={editingLocation.floor || ''} onChange={e => setEditingLocation({...editingLocation, floor: e.target.value})} placeholder="Kat" />
                          <Input value={editingLocation.name || ''} onChange={e => setEditingLocation({...editingLocation, name: e.target.value})} placeholder="Birim" />
                          <Input value={editingLocation.description || ''} onChange={e => setEditingLocation({...editingLocation, description: e.target.value})} placeholder="Mahal" />
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => updateDept.mutate(editingLocation)}><Check className="w-4 h-4 mr-1" /> Kaydet</Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditingLocation(null)}>İptal</Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="col-span-10">
                          <div className="font-semibold text-slate-800 dark:text-slate-200">{loc.description || 'İsimsiz Mahal'}</div>
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {loc.building || 'Blok Yok'} {loc.floor ? `> ${loc.floor}` : ''} {loc.name ? `> ${loc.name}` : ''}
                          </div>
                        </div>
                        <div className="col-span-2 text-right flex justify-end gap-1">
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingLocation({ ...loc })}><Pencil className="w-4 h-4 text-muted-foreground hover:text-primary" /></Button>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => { if(window.confirm('Lokasyon silinsin mi?')) deleteDept.mutate(loc.id); }}><Trash2 className="w-4 h-4 text-muted-foreground hover:text-red-500" /></Button>
                        </div>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.keys(locationTree).sort().map(block => (
              <div key={block} className="border rounded-lg overflow-hidden bg-white dark:bg-slate-900">
                <div className="p-3 bg-slate-50 dark:bg-slate-800/50 flex justify-between items-center group">
                  <div className="flex items-center gap-2 cursor-pointer font-semibold text-slate-700 dark:text-slate-300" onClick={() => toggleLoc(block)}>
                    {expandedLocs[block] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <MapPin className="w-4 h-4 text-primary" /> {block}
                  </div>
                  <Button variant="ghost" size="sm" className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleQuickAdd(block, 'Belirtilmemiş Kat', 'Belirtilmemiş Birim')} title="Bu bloğa Kat ekle">
                    <Plus className="w-4 h-4 text-blue-500" />
                  </Button>
                </div>
                {expandedLocs[block] && (
                  <div className="border-t">
                    {Object.keys(locationTree[block]).sort().map(floor => (
                      <div key={`${block}-${floor}`} className="border-b last:border-0">
                        <div className="p-2 pl-8 bg-white dark:bg-slate-900 flex justify-between items-center group">
                          <div className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400" onClick={() => toggleLoc(`${block}-${floor}`)}>
                            {expandedLocs[`${block}-${floor}`] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            <span className="text-muted-foreground">↳</span> {floor}
                          </div>
                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleQuickAdd(block, floor, 'Belirtilmemiş Birim')} title="Bu kata Birim ekle">
                            <Plus className="w-3.5 h-3.5 text-blue-500" />
                          </Button>
                        </div>
                        {expandedLocs[`${block}-${floor}`] && (
                          <div className="bg-slate-50/50 dark:bg-slate-900/50 border-t">
                            {Object.keys(locationTree[block][floor]).sort().map(dept => (
                              <div key={`${block}-${floor}-${dept}`} className="border-b last:border-0">
                                <div className="p-2 pl-14 flex justify-between items-center group">
                                  <div className="flex items-center gap-2 cursor-pointer text-sm font-medium text-slate-600 dark:text-slate-400" onClick={() => toggleLoc(`${block}-${floor}-${dept}`)}>
                                    {expandedLocs[`${block}-${floor}-${dept}`] ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                                    <span className="text-muted-foreground">↳</span> {dept}
                                  </div>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleQuickAdd(block, floor, dept)} title="Bu birime Mahal ekle">
                                    <Plus className="w-3.5 h-3.5 text-blue-500" />
                                  </Button>
                                </div>
                                {expandedLocs[`${block}-${floor}-${dept}`] && (
                                  <div className="p-2 pl-20 space-y-2 border-t border-slate-100 dark:border-slate-800">
                                    {locationTree[block][floor][dept].map((loc: any) => (
                                      <div key={loc.id} className="p-2 border rounded bg-white dark:bg-slate-900 shadow-sm flex justify-between items-center">
                                        {editingLocation?.id === loc.id ? (
                                          <div className="flex-1 space-y-2 mr-4">
                                            <div className="grid grid-cols-2 gap-2">
                                              <Input value={editingLocation.building} onChange={e => setEditingLocation({...editingLocation, building: e.target.value})} placeholder="Blok" />
                                              <Input value={editingLocation.floor || ''} onChange={e => setEditingLocation({...editingLocation, floor: e.target.value})} placeholder="Kat" />
                                              <Input value={editingLocation.name || ''} onChange={e => setEditingLocation({...editingLocation, name: e.target.value})} placeholder="Birim" />
                                              <Input value={editingLocation.description || ''} onChange={e => setEditingLocation({...editingLocation, description: e.target.value})} placeholder="Mahal" />
                                            </div>
                                            <div className="flex gap-2">
                                              <Button size="sm" onClick={() => updateDept.mutate(editingLocation)}><Check className="w-4 h-4 mr-1" /> Kaydet</Button>
                                              <Button size="sm" variant="ghost" onClick={() => setEditingLocation(null)}>İptal</Button>
                                            </div>
                                          </div>
                                        ) : (
                                          <>
                                            <div className="text-sm flex flex-col">
                                              <span className="font-semibold text-slate-800 dark:text-slate-200">{loc.description || 'İsimsiz Mahal'}</span>
                                              <span className="text-xs text-muted-foreground mt-0.5">Yol: {loc.building} / {loc.floor} / {loc.name}</span>
                                            </div>
                                            <div className="flex gap-1 shrink-0">
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingLocation({ ...loc })}><Pencil className="w-3.5 h-3.5" /></Button>
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => { if(window.confirm('Lokasyon silinsin mi?')) deleteDept.mutate(loc.id); }}><Trash2 className="w-3.5 h-3.5" /></Button>
                                            </div>
                                          </>
                                        )}
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
            {depts?.length === 0 && <p className="text-sm text-muted-foreground text-center p-4">Henüz lokasyon eklenmemiş.</p>}
          </div>
        )}
      </div>

      <Dialog open={isLocDialogOpen} onOpenChange={setIsLocDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Yeni Alt Lokasyon Ekle</DialogTitle>
            <DialogDescription>Hiyerarşiye yeni bir alan ekleyin.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs">Blok</Label>
                <Input value={quickAddLoc.building} onChange={e => setQuickAddLoc({...quickAddLoc, building: e.target.value})} list="hz-blocks-list" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Kat</Label>
                <Input value={quickAddLoc.floor} onChange={e => setQuickAddLoc({...quickAddLoc, floor: e.target.value})} list="hz-floors-list" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Birim</Label>
                <Input value={quickAddLoc.name} onChange={e => setQuickAddLoc({...quickAddLoc, name: e.target.value})} list="hz-depts-list" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs">Mahal</Label>
                <Input value={quickAddLoc.description} onChange={e => setQuickAddLoc({...quickAddLoc, description: e.target.value})} list="hz-desc-list" />
              </div>
            </div>
            <Button className="w-full" onClick={() => createDept.mutate(quickAddLoc)} disabled={createDept.isPending}>
              {createDept.isPending ? 'Ekleniyor...' : 'Ekle'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function ImageItemsTab({ type, title, queryKey, hasCode }: { type: string, title: string, queryKey: string, hasCode: boolean }) {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isUploading, setIsUploading] = useState(false);

  const { data: items = [] } = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const res = await api.get(`/hazmat/settings/${type}`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/hazmat/upload', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setImageUrl(data.url);
        toast.success('Görsel yüklendi!');
      } else {
        toast.error(data.error || 'Yükleme hatası');
      }
    } catch (err) {
      toast.error('Görsel yüklenemedi.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const createItem = useMutation({
    mutationFn: async () => await api.post(`/hazmat/settings/${type}`, { code, name, imageUrl }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [queryKey] });
      setCode(''); setName(''); setImageUrl('');
      toast.success('Başarıyla eklendi.');
    }
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => await api.delete(`/hazmat/settings/${type}/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: [queryKey] })
  });

  return (
    <div className="bg-card border rounded-lg p-6 mt-4">
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6 bg-muted/30 p-4 rounded-lg border">
        {hasCode && (
          <div className="space-y-1">
            <Label>Kod</Label>
            <Input placeholder="Örn: GHS01" value={code} onChange={e => setCode(e.target.value)} />
          </div>
        )}
        <div className={`space-y-1 ${hasCode ? 'md:col-span-2' : 'md:col-span-3'}`}>
          <Label>Adı / Açıklama</Label>
          <Input placeholder="Örn: Patlayıcı Madde" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label>Görsel (İsteğe Bağlı)</Label>
          <div className="flex gap-2 items-center">
            <Button variant="outline" type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Yükleniyor...' : 'Seç'}
            </Button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileUpload} />
          </div>
          {imageUrl && <img src={imageUrl} alt="preview" className="h-8 object-contain mt-1" />}
        </div>
        <div className="flex items-end">
          <Button className="w-full" onClick={() => createItem.mutate()} disabled={!name || (hasCode && !code)}>
            <Plus className="w-4 h-4 mr-2" /> Ekle
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {items.map((item: any) => (
          <div key={item.id} className="border rounded-lg p-4 flex flex-col items-center justify-between text-center relative group">
            <Button 
              variant="destructive" 
              size="icon" 
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
              onClick={() => deleteItem.mutate(item.id)}
            >
              <Trash2 className="w-3 h-3" />
            </Button>
            
            {item.imageUrl ? (
              <img src={item.imageUrl} alt={item.name} className="w-16 h-16 object-contain mb-2" />
            ) : (
              <div className="w-16 h-16 bg-muted rounded flex items-center justify-center mb-2 text-xs">Görsel Yok</div>
            )}
            
            {hasCode && <div className="text-[9px] font-bold text-muted-foreground mb-1">{item.code}</div>}
            <div className="text-xs font-semibold leading-tight text-foreground">{item.name}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function CategoriesTab() {
  const [name, setName] = useState('');
  const [scope, setScope] = useState('');
  const [examples, setExamples] = useState('');
  const queryClient = useQueryClient();

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['hazmat-categories'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/categories');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  const createCategory = useMutation({
    mutationFn: async () => {
      const res = await api.post('/hazmat/settings/categories', { name, scope, examples });
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-categories'] });
      setName(''); setScope(''); setExamples('');
      toast.success('Kategori eklendi');
    }
  });

  const deleteCategory = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/hazmat/settings/categories/${id}`);
      if (!res.ok) throw new Error('Hata');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hazmat-categories'] });
      toast.success('Kategori silindi');
    }
  });

  return (
    <div className="space-y-6">
      <div className="bg-muted/30 p-4 rounded-lg border grid grid-cols-1 md:grid-cols-4 gap-4 items-start">
        <div className="space-y-2">
          <Label>Kategori Adı</Label>
          <Input placeholder="Örn: Laboratuvar Kimyasalları" value={name} onChange={e => setName(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Kapsam</Label>
          <Input placeholder="Örn: Laboratuvar testlerinde..." value={scope} onChange={e => setScope(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Örnekler</Label>
          <Input placeholder="Örn: Biyokimya kitleri..." value={examples} onChange={e => setExamples(e.target.value)} />
        </div>
        <div className="flex items-end h-[68px]">
          <Button className="w-full" onClick={() => createCategory.mutate()} disabled={!name}>
            <Plus className="w-4 h-4 mr-2" /> Ekle
          </Button>
        </div>
      </div>

      <div className="rounded-lg border overflow-hidden">
        <table className="w-full text-sm text-left">
          <thead className="bg-muted/50 text-muted-foreground">
            <tr>
              <th className="px-4 py-3 font-medium">Kategori Adı</th>
              <th className="px-4 py-3 font-medium">Kapsam</th>
              <th className="px-4 py-3 font-medium">Örnekler</th>
              <th className="px-4 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {categories.map((c: any) => (
              <tr key={c.id} className="hover:bg-muted/30 transition-colors">
                <td className="px-4 py-3 font-medium">{c.name}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.scope || '-'}</td>
                <td className="px-4 py-3 text-muted-foreground">{c.examples || '-'}</td>
                <td className="px-4 py-3 text-right">
                  <Button variant="ghost" size="icon" className="text-destructive hover:bg-destructive/10" onClick={() => deleteCategory.mutate(c.id)}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
            {categories.length === 0 && !isLoading && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Henüz kategori eklenmemiş.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
