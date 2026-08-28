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
      if (!res.ok) throw new Error('Ekleme basarisiz');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
      toast.success('Lokasyon eklendi');
      setNewLocation({ building: '', floor: '', department: '', description: '', type: 'DEPARTMAN' });
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
    const name = newLocation.department || newLocation.description || newLocation.floor || newLocation.building || 'İsimsiz';
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

  const handleFacilityChange = (val: string) => {
    setFacilityId(val);
    localStorage.setItem('activeFacilityId', val);
    window.dispatchEvent(new Event('storage'));
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-12 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tesis Lokasyonları (Merkezi)</h1>
          <p className="text-muted-foreground mt-1">
            Tüm modüllerin kullanacağı ağaç yapısındaki ana lokasyon havuzu.
          </p>
        </div>
        <div className="w-[300px]">
          <Label className="text-xs mb-1 block text-muted-foreground">İşlem Yapılacak Tesis</Label>
          <Select value={facilityId} onValueChange={handleFacilityChange}>
            <SelectTrigger className="bg-white">
              <div className="flex items-center gap-2">
                <Building className="w-4 h-4 text-slate-500" />
                <SelectValue placeholder="Tesis Seçin..." />
              </div>
            </SelectTrigger>
            <SelectContent>
              {facilities.map((f: any) => (
                <SelectItem key={f.id} value={f.id}>{f.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {(!facilityId || facilityId === 'all') ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed rounded-xl bg-slate-50">
          <Building className="w-12 h-12 text-slate-300 mb-4" />
          <h3 className="text-lg font-medium text-slate-700">Tesis Seçimi Bekleniyor</h3>
          <p className="text-slate-500 mt-2 max-w-sm">Lokasyon eklemek veya düzenlemek için lütfen sağ üstten bir tesis seçin.</p>
        </div>
      ) : (
        <>
          {/* Hızlı Ekleme Formu */}
      <div className="bg-slate-50 border rounded-xl p-4 shadow-sm mb-6">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/> Yeni Lokasyon Ekle</h3>
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
          <div>
            <Label className="text-xs mb-1 block">Blok</Label>
            <Input 
              value={newLocation.building} 
              onChange={e => setNewLocation({...newLocation, building: e.target.value})} 
              placeholder="Örn: A Blok" className="h-9 text-sm" 
              list="building-list"
            />
            <datalist id="building-list">
              {Array.from(new Set(locations.map((l:any) => l.building).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
            </datalist>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Kat</Label>
            <Input 
              value={newLocation.floor} 
              onChange={e => setNewLocation({...newLocation, floor: e.target.value})} 
              placeholder="Örn: 1. Kat" className="h-9 text-sm" 
              list="floor-list"
            />
            <datalist id="floor-list">
              {Array.from(new Set(locations.filter((l:any) => !newLocation.building || l.building === newLocation.building).map((l:any) => l.floor).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
            </datalist>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Birim (Opsiyonel)</Label>
            <Input 
              value={newLocation.department} 
              onChange={e => setNewLocation({...newLocation, department: e.target.value})} 
              placeholder="Örn: Acil Servis" className="h-9 text-sm" 
              list="dept-list"
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Mahal (Opsiyonel)</Label>
            <Input 
              value={newLocation.description} 
              onChange={e => setNewLocation({...newLocation, description: e.target.value})} 
              placeholder="Örn: 101 Nolu Oda" className="h-9 text-sm" 
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Tür</Label>
            <select 
              value={newLocation.type} 
              onChange={e => setNewLocation({...newLocation, type: e.target.value})}
              className="flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="DEPARTMAN">Genel</option>
              <option value="TEMIZLIK_ARABASI">Temizlik Arabası</option>
              <option value="ARAC">Araç</option>
            </select>
          </div>
          <Button 
            className="h-9 w-full sm:col-span-1" 
            onClick={addLoc}
            disabled={!newLocation.building || addMutation.isPending}
          >
            {addMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ekle'}
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
      ) : locations.length === 0 ? (
        <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl">Henüz lokasyon eklenmemiş.</div>
      ) : (
        <div className="space-y-3">
          {Object.values(tree).map((buildingNode: any) => (
            <div key={buildingNode.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 transition-colors group">
                <div className="flex items-center gap-2 cursor-pointer font-bold flex-1" onClick={() => toggleNode(buildingNode.id)}>
                  {expandedNodes[buildingNode.id] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                  🏢 {editingNode?.level === 'building' && editingNode?.oldValue === buildingNode.name ? (
                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                      <Input className="h-8 w-48 text-sm" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} />
                      <Button size="sm" className="h-8 px-2" onClick={saveEdit}><Check className="w-4 h-4" /></Button>
                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingNode(null)}>X</Button>
                    </div>
                  ) : buildingNode.name}
                </div>
                {!editingNode && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={() => setEditingNode({ level: 'building', oldValue: buildingNode.name, newValue: buildingNode.name })}>
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-500 hover:text-red-600" onClick={() => removeNode('building', buildingNode.name)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
              
              {expandedNodes[buildingNode.id] && (
                <div className="border-t divide-y">
                  {Object.values(buildingNode.children).map((floorNode: any) => (
                    <div key={floorNode.id} className="">
                      <div className="flex items-center justify-between p-2.5 pl-8 bg-slate-50 hover:bg-slate-100 text-sm font-semibold group">
                        <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleNode(floorNode.id)}>
                          {expandedNodes[floorNode.id] ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                          {editingNode?.level === 'floor' && editingNode?.oldValue === floorNode.name && editingNode?.parentBuilding === buildingNode.name ? (
                            <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                              <Input className="h-8 w-48 text-sm" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} />
                              <Button size="sm" className="h-8 px-2" onClick={saveEdit}><Check className="w-4 h-4" /></Button>
                              <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingNode(null)}>X</Button>
                            </div>
                          ) : floorNode.name}
                        </div>
                        {!editingNode && (
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingNode({ level: 'floor', oldValue: floorNode.name, newValue: floorNode.name, parentBuilding: buildingNode.name })}>
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeNode('floor', floorNode.name, buildingNode.name)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        )}
                      </div>
                      
                      {expandedNodes[floorNode.id] && (
                        <div className="divide-y border-t border-slate-100">
                          {Object.values(floorNode.children).map((deptNode: any) => (
                            <div key={deptNode.id}>
                              <div className="flex items-center justify-between p-2 pl-14 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 group">
                                <div className="flex items-center gap-2 cursor-pointer flex-1" onClick={() => toggleNode(deptNode.id)}>
                                  {expandedNodes[deptNode.id] ? <ChevronDown className="w-3 h-3 text-slate-300" /> : <ChevronRight className="w-3 h-3 text-slate-300" />}
                                  {editingNode?.level === 'department' && editingNode?.oldValue === deptNode.name && editingNode?.parentFloor === floorNode.name && editingNode?.parentBuilding === buildingNode.name ? (
                                    <div className="flex items-center gap-2" onClick={e => e.stopPropagation()}>
                                      <Input className="h-8 w-48 text-sm" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} />
                                      <Button size="sm" className="h-8 px-2" onClick={saveEdit}><Check className="w-4 h-4" /></Button>
                                      <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingNode(null)}>X</Button>
                                    </div>
                                  ) : deptNode.name}
                                </div>
                                {!editingNode && (
                                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => setEditingNode({ level: 'department', oldValue: deptNode.name, newValue: deptNode.name, parentBuilding: buildingNode.name, parentFloor: floorNode.name })}>
                                      <Pencil className="w-3 h-3" />
                                    </Button>
                                    <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={() => removeNode('department', deptNode.name, buildingNode.name, floorNode.name)}>
                                      <Trash2 className="w-3 h-3" />
                                    </Button>
                                  </div>
                                )}
                              </div>
                              
                              {expandedNodes[deptNode.id] && (
                                <div className="bg-white">
                                  {deptNode.locations.map((loc: any) => (
                                    <div key={loc.id} className="flex items-center justify-between p-2 pl-20 hover:bg-slate-50 border-t border-slate-50 group">
                                      
                                      {editingNode?.level === 'name' && editingNode?.oldValue === loc.name && editingNode?.parentBuilding === buildingNode.name && editingNode?.parentFloor === floorNode.name ? (
                                        <div className="flex items-center gap-2 flex-1 mr-4">
                                          <Input className="h-8 text-xs" autoFocus value={editingNode.newValue} onChange={e => setEditingNode({...editingNode, newValue: e.target.value})} placeholder="İsim/Mahal" />
                                          <Button size="sm" className="h-8 px-2" onClick={saveEdit}><Check className="w-3.5 h-3.5" /></Button>
                                          <Button size="sm" variant="ghost" className="h-8 px-2" onClick={() => setEditingNode(null)}>X</Button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="text-xs text-slate-600 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                            {loc.type === 'TEMIZLIK_ARABASI' && <span className="bg-blue-100 text-blue-700 px-1 rounded mr-1 font-semibold text-[10px]">T.Arabası</span>}
                                            {loc.description || loc.name || 'Giriş / Genel Alan'}
                                          </div>
                                          {!editingNode && (
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-primary" onClick={() => setEditingNode({ level: 'name', oldValue: loc.name, newValue: loc.name, parentBuilding: buildingNode.name, parentFloor: floorNode.name })}>
                                                <Pencil className="w-3.5 h-3.5" />
                                              </Button>
                                              <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={() => removeNode('name', loc.name, buildingNode.name, floorNode.name)}>
                                                <Trash2 className="w-3.5 h-3.5" />
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
