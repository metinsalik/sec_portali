import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, Loader2, Building } from 'lucide-react';
import { toast } from 'sonner';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/context/AuthContext';

export default function FacilityLocationsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [facilityId, setFacilityId] = useState(localStorage.getItem('activeFacilityId') || '');
  
  const [newLocation, setNewLocation] = useState({ building: '', floor: '', department: '', description: '', type: 'DEPARTMAN' });
  const [editingNode, setEditingNode] = useState<any>(null); // { level, oldValue, parentBuilding, parentFloor, newValue }
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['facility-locations', facilityId],
    queryFn: async () => {
      if (!facilityId || facilityId === 'all') return [];
      const res = await api.get(`/locations?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Lokasyonlar getirilemedi');
      return res.json();
    },
    enabled: !!facilityId && facilityId !== 'all'
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations', { ...data, facilityId });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ekleme basarisiz');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
      toast.success('Lokasyon eklendi');
      setNewLocation({ building: '', floor: '', department: '', description: '', type: 'DEPARTMAN' });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lokasyon eklenirken hata oluştu');
    }
  });

  const renameMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations/rename-node', { ...data, facilityId });
      if (!res.ok) throw new Error('Guncelleme basarisiz');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
      toast.success('İsim güncellendi');
      setEditingNode(null);
    }
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations/delete-node', { ...data, facilityId });
      if (!res.ok) throw new Error('Silme basarisiz');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
      toast.success('Düğüm silindi');
    }
  });

  const addLoc = () => {
    if (!newLocation.building) return;
    const nameParts = [newLocation.building, newLocation.floor, newLocation.department, newLocation.description].filter(Boolean);
    const name = nameParts.length > 0 ? nameParts.join(' - ') : 'İsimsiz';
    addMutation.mutate({ ...newLocation, name });
  };

  const removeNode = (level: string, value: string, parentBuilding?: string, parentFloor?: string) => {
    if (!window.confirm(`${value} ve altındaki her şey silinecek (veya boşaltılacak). Onaylıyor musunuz?`)) return;
    deleteMutation.mutate({ level, value, parentBuilding, parentFloor });
  };

  const saveEdit = () => {
    if (!editingNode || !editingNode.newValue) return;
    renameMutation.mutate({ ...editingNode });
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    locations.forEach((loc: any) => {
      const b = loc.building || 'Belirtilmemiş Blok';
      const f = loc.floor || 'Belirtilmemiş Kat';
      const d = loc.department || 'Belirtilmemiş Birim';

      if (!root[b]) root[b] = { type: 'building', name: b, children: {}, id: `b-${b}` };
      if (!root[b].children[f]) root[b].children[f] = { type: 'floor', name: f, children: {}, id: `f-${b}-${f}` };
      if (!root[b].children[f].children[d]) root[b].children[f].children[d] = { type: 'department', name: d, locations: [], id: `d-${b}-${f}-${d}` };
      
      root[b].children[f].children[d].locations.push(loc);
    });
    return root;
  }, [locations]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto animate-in fade-in duration-300 pb-16">
      {/* Top Header Card */}
      <div className="bg-card border rounded-2xl p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-foreground">Tesis Lokasyon Ağacı & Yönetimi</h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                Bina blokları, katlar, departman ve alt mahallerin hiyerarşik yönetimi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-72">
            <Select value={facilityId} onValueChange={v => {
              setFacilityId(v);
              localStorage.setItem('activeFacilityId', v);
            }}>
              <SelectTrigger className="h-10 bg-background text-xs font-medium rounded-xl">
                <div className="flex items-center gap-2 truncate">
                  <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="Yönetilecek Tesisi Seçiniz..." />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {facilities.map((f: any) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs font-medium">
                    {f.name} <span className="text-muted-foreground text-[10px]">({f.id})</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>
      
      {(!facilityId || facilityId === 'all') ? (
        <div className="flex flex-col items-center justify-center p-16 text-center border-2 border-dashed rounded-3xl bg-muted/20">
          <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Building className="w-7 h-7 text-muted-foreground/60" />
          </div>
          <h3 className="text-base font-bold text-foreground">Tesis Seçimi Bekleniyor</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Lokasyon ağacını görüntülemek, yeni kat/mahal eklemek veya düzenlemek için lütfen üst menüden bir tesis seçiniz.
          </p>
        </div>
      ) : (
        <>
          {/* Hızlı Ekleme Formu */}
          <div className="bg-card border rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between pb-2 border-b">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground flex items-center gap-2">
                <Plus className="w-4 h-4 text-primary" /> Hızlı Yeni Lokasyon Ekle
              </h3>
              <span className="text-[11px] text-muted-foreground">Blok &gt; Kat &gt; Birim &gt; Mahal Hiyerarşisi</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-semibold">Blok / Yapı <span className="text-rose-500">*</span></Label>
                <Input 
                  value={newLocation.building} 
                  onChange={e => setNewLocation({...newLocation, building: e.target.value})} 
                  placeholder="Örn: A Blok" 
                  className="h-9 text-xs" 
                  list="building-list"
                />
                <datalist id="building-list">
                  {Array.from(new Set(locations.map((l:any) => l.building).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Kat</Label>
                <Input 
                  value={newLocation.floor} 
                  onChange={e => setNewLocation({...newLocation, floor: e.target.value})} 
                  placeholder="Örn: 1. Kat" 
                  className="h-9 text-xs" 
                  list="floor-list"
                />
                <datalist id="floor-list">
                  {Array.from(new Set(locations.filter((l:any) => !newLocation.building || l.building === newLocation.building).map((l:any) => l.floor).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Birim / Departman</Label>
                <Input 
                  value={newLocation.department} 
                  onChange={e => setNewLocation({...newLocation, department: e.target.value})} 
                  placeholder="Örn: Acil Servis" 
                  className="h-9 text-xs" 
                  list="dept-list"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Mahal / Oda / Alan</Label>
                <Input 
                  value={newLocation.description} 
                  onChange={e => setNewLocation({...newLocation, description: e.target.value})} 
                  placeholder="Örn: 101 Nolu Oda" 
                  className="h-9 text-xs" 
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-semibold">Lokasyon Türü</Label>
                <select 
                  value={newLocation.type} 
                  onChange={e => setNewLocation({...newLocation, type: e.target.value})}
                  className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-1.5 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                >
                  <option value="DEPARTMAN">Genel Mahal</option>
                  <option value="TEMIZLIK_ARABASI">Temizlik Arabası</option>
                  <option value="ARAC">Araç / Mobil</option>
                </select>
              </div>

              <Button 
                className="h-9 w-full sm:col-span-1 text-xs font-semibold rounded-xl" 
                onClick={addLoc}
                disabled={!newLocation.building || addMutation.isPending}
              >
                {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : (
                  <>
                    <Plus className="w-3.5 h-3.5 mr-1" /> Ekle
                  </>
                )}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center p-12 bg-card border rounded-2xl">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground">Lokasyon ağacı yükleniyor...</p>
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center p-12 text-muted-foreground border-2 border-dashed rounded-2xl bg-muted/10">
              <Building className="w-8 h-8 mx-auto mb-2 text-muted-foreground/50" />
              <p className="text-sm font-medium text-foreground">Bu tesise ait lokasyon kaydı bulunamadı.</p>
              <p className="text-xs text-muted-foreground mt-1">Yukarıdaki formdan ilk blok ve katınızı ekleyebilirsiniz.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {Object.values(tree).map((buildingNode: any) => (
                <div key={buildingNode.id} className="bg-card rounded-2xl border shadow-2xs overflow-hidden transition-all">
                  <div className="flex items-center justify-between p-3.5 bg-muted/40 hover:bg-muted/70 transition-colors group">
                    <div className="flex items-center gap-2 cursor-pointer font-bold flex-1 text-sm text-foreground" onClick={() => toggleNode(buildingNode.id)}>
                      {expandedNodes[buildingNode.id] ? <ChevronDown className="w-4 h-4 text-primary" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                      <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-xs">🏢</span>
                      {editingNode?.level === 'building' && editingNode?.oldValue === buildingNode.name ? (
                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                          <Input className="h-8 w-52 text-xs font-semibold" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} />
                          <Button size="sm" className="h-8 px-2.5 text-xs" onClick={saveEdit}><Check className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="ghost" className="h-8 px-2.5 text-xs" onClick={() => setEditingNode(null)}>X</Button>
                        </div>
                      ) : (
                        <span>{buildingNode.name}</span>
                      )}
                    </div>
                    {!editingNode && (
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => setEditingNode({ level: 'building', oldValue: buildingNode.name, newValue: buildingNode.name })}>
                          <Pencil className="w-3.5 h-3.5" />
                        </Button>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg" onClick={() => removeNode('building', buildingNode.name)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {expandedNodes[buildingNode.id] && (
                    <div className="border-t divide-y">
                      {Object.values(buildingNode.children).map((floorNode: any) => (
                        <div key={floorNode.id} className="">
                          <div className="flex items-center justify-between p-2.5 pl-8 bg-muted/20 hover:bg-muted/40 text-xs font-semibold group">
                            <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleNode(floorNode.id)}>
                              {expandedNodes[floorNode.id] ? <ChevronDown className="w-3.5 h-3.5 text-primary" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                              {editingNode?.level === 'floor' && editingNode?.oldValue === floorNode.name && editingNode?.parentBuilding === buildingNode.name ? (
                                <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                  <Input className="h-7 w-48 text-xs font-semibold" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} />
                                  <Button size="sm" className="h-7 px-2 text-xs" onClick={saveEdit}><Check className="w-3 h-3" /></Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingNode(null)}>X</Button>
                                </div>
                              ) : (
                                <span>{floorNode.name}</span>
                              )}
                            </div>
                            {!editingNode && (
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 rounded hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => setEditingNode({ level: 'floor', oldValue: floorNode.name, newValue: floorNode.name, parentBuilding: buildingNode.name })}>
                                  <Pencil className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded" onClick={() => removeNode('floor', floorNode.name, buildingNode.name)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                          
                          {expandedNodes[floorNode.id] && (
                            <div className="divide-y border-t border-border/50">
                              {Object.values(floorNode.children).map((deptNode: any) => (
                                <div key={deptNode.id}>
                                  <div className="flex items-center justify-between p-2 pl-14 text-xs font-medium text-foreground bg-card hover:bg-muted/20 group">
                                    <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleNode(deptNode.id)}>
                                      {expandedNodes[deptNode.id] ? <ChevronDown className="w-3 h-3 text-primary" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                      {editingNode?.level === 'department' && editingNode?.oldValue === deptNode.name && editingNode?.parentFloor === floorNode.name && editingNode?.parentBuilding === buildingNode.name ? (
                                        <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                          <Input className="h-7 w-48 text-xs font-medium" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} />
                                          <Button size="sm" className="h-7 px-2 text-xs" onClick={saveEdit}><Check className="w-3 h-3" /></Button>
                                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingNode(null)}>X</Button>
                                        </div>
                                      ) : (
                                        <span>{deptNode.name}</span>
                                      )}
                                    </div>
                                    {!editingNode && (
                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 rounded hover:bg-muted text-muted-foreground hover:text-foreground" onClick={() => setEditingNode({ level: 'department', oldValue: deptNode.name, newValue: deptNode.name, parentBuilding: buildingNode.name, parentFloor: floorNode.name })}>
                                          <Pencil className="w-3 h-3" />
                                        </Button>
                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded" onClick={() => removeNode('department', deptNode.name, buildingNode.name, floorNode.name)}>
                                          <Trash2 className="w-3 h-3" />
                                        </Button>
                                      </div>
                                    )}
                                  </div>
                                  
                                  {expandedNodes[deptNode.id] && (
                                    <div className="bg-card">
                                      {deptNode.locations.map((loc: any) => (
                                        <div key={loc.id} className="flex items-center justify-between p-2 pl-20 hover:bg-muted/10 border-t border-border/30 group text-xs">
                                          
                                          {editingNode?.level === 'name' && editingNode?.oldValue === loc.name && editingNode?.parentBuilding === buildingNode.name && editingNode?.parentFloor === floorNode.name ? (
                                            <div className="flex items-center gap-2 flex-1 mr-4">
                                              <Input className="h-7 text-xs font-normal" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} placeholder="İsim/Mahal" />
                                              <Button size="sm" className="h-7 px-2 text-xs" onClick={saveEdit}><Check className="w-3 h-3" /></Button>
                                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setEditingNode(null)}>X</Button>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="text-xs text-muted-foreground flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary/40"></div>
                                                {loc.type === 'TEMIZLIK_ARABASI' && <span className="bg-blue-500/10 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded font-semibold text-[9px]">T.Arabası</span>}
                                                {loc.type === 'ARAC' && <span className="bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 rounded font-semibold text-[9px]">Araç</span>}
                                                <span className="text-foreground/90 font-medium">{loc.description || loc.name || 'Giriş / Genel Alan'}</span>
                                              </div>
                                              {!editingNode && (
                                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground" onClick={() => setEditingNode({ level: 'name', oldValue: loc.name, newValue: loc.name, parentBuilding: buildingNode.name, parentFloor: floorNode.name })}>
                                                    <Pencil className="w-3 h-3" />
                                                  </Button>
                                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-rose-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30" onClick={() => removeNode('name', loc.name, buildingNode.name, floorNode.name)}>
                                                    <Trash2 className="w-3 h-3" />
                                                  </Button>
                                                </div>
                                              )}
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
            </div>
          )}
        </>
      )}
    </div>
  );
}
