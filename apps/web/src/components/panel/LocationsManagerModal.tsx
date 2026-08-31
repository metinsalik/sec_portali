import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Edit2, Loader2, MapPin, ChevronDown, ChevronRight, Check, Pencil } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { cn } from '@/lib/utils';

interface LocationsManagerModalProps {
  facilityId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationsManagerModal({ facilityId, isOpen, onClose }: LocationsManagerModalProps) {
  const queryClient = useQueryClient();
  const [newLocation, setNewLocation] = useState({ building: '', floor: '', department: '', description: '' });
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [renamingNode, setRenamingNode] = useState<{level: string, oldValue: string, parentBuilding?: string, parentFloor?: string} | null>(null);
  const [renameValue, setRenameValue] = useState('');
  
  const [inlineAddNode, setInlineAddNode] = useState<{b: string, f: string, d: string} | null>(null);
  const [inlineAddValue, setInlineAddValue] = useState('');

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['facility-locations', facilityId],
    queryFn: async () => {
      const res = await api.get(`/risks/facilities/${facilityId}/locations`);
      if (!res.ok) throw new Error('Lokasyonlar alınamadı');
      return res.json();
    },
    enabled: isOpen && !!facilityId,
  });

  const createLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const nameParts = [data.building, data.floor, data.department, data.description].filter(Boolean);
      const payload = { ...data, name: nameParts.length > 0 ? nameParts.join(' - ') : 'İsimsiz' };
      const res = await api.post(`/risks/facilities/${facilityId}/locations`, payload);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Eklenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations', facilityId] });
      toast.success('Lokasyon eklendi');
      setNewLocation({ building: '', floor: '', department: '', description: '' });
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const nameParts = [data.building, data.floor, data.department, data.description].filter(Boolean);
      const payload = { ...data, name: nameParts.length > 0 ? nameParts.join(' - ') : 'İsimsiz' };
      const res = await api.put(`/risks/facilities/${facilityId}/locations/${data.id}`, payload);
      if (!res.ok) throw new Error('Güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations', facilityId] });
      toast.success('Lokasyon güncellendi');
      setEditingLocation(null);
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteLocationMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/risks/facilities/${facilityId}/locations/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations', facilityId] });
      toast.success('Lokasyon silindi');
    },
    onError: (err: any) => toast.error(err.message),
  });


  const renameNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/risks/facilities/${facilityId}/locations/rename-node`, data);
      if (!res.ok) throw new Error('İsim güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations', facilityId] });
      toast.success('İsim güncellendi');
      setRenamingNode(null);
    },
    onError: (err: any) => toast.error(err.message),
  });


  const deleteNodeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/risks/facilities/${facilityId}/locations/delete-node`, data);
      if (!res.ok) throw new Error('Düğüm silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['facility-locations', facilityId] });
      toast.success('Lokasyon silindi ve içerik üst seviyeye taşındı');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const handleQuickAdd = (b: string, f: string, d: string) => {
    setInlineAddNode({ b, f, d });
    setInlineAddValue('');
    setExpandedNodes(prev => {
      const bId = `b-${b}`;
      const fId = f !== 'Belirtilmemiş Kat' ? `f-${b}-${f}` : '';
      const dId = d !== 'Belirtilmemiş Birim' ? `d-${b}-${f}-${d}` : '';
      return { ...prev, [bId]: true, ...(fId && {[fId]: true}), ...(dId && {[dId]: true}) };
    });
  };

  const handleInlineSave = () => {
    if (!inlineAddNode || !inlineAddValue) return;
    const { b, f, d } = inlineAddNode;
    
    // Clean up 'Belirtilmemiş' values before saving
    const cleanB = b === 'Belirtilmemiş Blok' ? '' : b;
    const cleanF = f === 'Belirtilmemiş Kat' ? '' : f;
    const cleanD = d === 'Belirtilmemiş Birim' ? '' : d;
    
    let payload = { building: cleanB, floor: cleanF, department: cleanD, description: '', name: inlineAddValue };
    
    if (b === 'Belirtilmemiş Blok') {
      payload.building = inlineAddValue;
      payload.floor = '';
      payload.department = '';
    } else if (f === 'Belirtilmemiş Kat') {
      payload.floor = inlineAddValue;
      payload.department = '';
    } else if (d === 'Belirtilmemiş Birim') {
      payload.department = inlineAddValue;
    } else {
      payload.description = inlineAddValue;
    }

    createLocationMutation.mutate(payload, {
      onSuccess: () => {
        setInlineAddNode(null);
        setInlineAddValue('');
      }
    });
  };

  // Ağaç Yapısını Oluştur (Tree Builder)
  const tree = React.useMemo(() => {
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
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[800px] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-5 h-5 text-primary" /> Merkezi Lokasyon Yönetimi (Ağaç Görünümü)
          </DialogTitle>
          <DialogDescription>
            Tesis lokasyonlarını Blok &gt; Kat &gt; Birim &gt; Mahal yapısında hızlıca ekleyip yönetebilirsiniz.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50" id="locations-form-container">
          
          {/* Hızlı Ekleme Formu */}
          <div className="bg-white border rounded-xl p-4 shadow-sm mb-6 sticky top-0 z-10">
            {/* We can hide the top form if we want, but keeping it is fine. I'll remove hidden class */}
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Plus className="w-4 h-4"/> Yeni Lokasyon Ekle (Klasik)</h3>
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
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
                <datalist id="dept-list">
                  {Array.from(new Set(locations.map((l:any) => l.department).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
                </datalist>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Mahal (Opsiyonel)</Label>
                <Input 
                  value={newLocation.description} 
                  onChange={e => setNewLocation({...newLocation, description: e.target.value})} 
                  placeholder="Örn: 101 Nolu Oda" className="h-9 text-sm" 
                />
              </div>
              <Button 
                className="h-9 w-full sm:col-span-1" 
                onClick={() => createLocationMutation.mutate(newLocation)}
                disabled={!newLocation.building || createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Kaydet'}
              </Button>
            </div>
          </div>

          {/* Ağaç Görünümü */}
          {isLoading ? (
            <div className="flex justify-center p-8"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
          ) : locations.length === 0 ? (
            <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl">Henüz lokasyon eklenmemiş. Yukarıdan yeni bir lokasyon ekleyebilirsiniz.</div>
          ) : (
            <div className="space-y-3">
              {Object.values(tree).map((buildingNode: any) => (
                <div key={buildingNode.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  
                  {/* BUILDING NODE */}
                  <div className="flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 group transition-colors">
                    {renamingNode?.level === 'building' && renamingNode.oldValue === buildingNode.name ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <Input autoFocus className="h-8 text-sm font-bold flex-1" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameNodeMutation.mutate({...renamingNode, newValue: renameValue})} />
                        <Button size="sm" className="h-8 shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => renameNodeMutation.mutate({...renamingNode, newValue: renameValue})} disabled={!renameValue || renameValue === renamingNode.oldValue || renameNodeMutation.isPending}><Check className="w-3.5 h-3.5 mr-1" /> Kaydet</Button>
                        <Button size="sm" variant="ghost" className="h-8 shrink-0" onClick={() => setRenamingNode(null)}>İptal</Button>
                      </div>
                    ) : (
                      <>
                        <div 
                          className="flex items-center gap-2 cursor-pointer font-bold flex-1"
                          onClick={() => toggleNode(buildingNode.id)}
                        >
                          {expandedNodes[buildingNode.id] ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          🏢 {buildingNode.name}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-primary" onClick={(e) => { e.stopPropagation(); setRenamingNode({level: 'building', oldValue: buildingNode.name}); setRenameValue(buildingNode.name); }} title="Bloğu Yeniden Adlandır">
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); if(window.confirm('Bu bloğu silmek içindeki her şeyi bir üst seviyeye taşıyacaktır. Onaylıyor musunuz?')) deleteNodeMutation.mutate({level: 'building', value: buildingNode.name}); }} title="Bloğu Sil"><Trash2 className="w-3.5 h-3.5" /></Button>
                          <Button 
                            variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-blue-500" 
                            onClick={(e) => { e.stopPropagation(); handleQuickAdd(buildingNode.name, 'Belirtilmemiş Kat', 'Belirtilmemiş Birim'); }} title="Bu bloğa Kat ekle"
                          >
                            <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>
                  
                  {expandedNodes[buildingNode.id] && (
                    <div className="border-t divide-y">
                      
                      {/* INLINE ADD FLOOR */}
                      {inlineAddNode?.b === buildingNode.name && inlineAddNode?.f === 'Belirtilmemiş Kat' && (
                        <div className="flex items-center gap-2 p-2.5 pl-8 bg-blue-50/50 border-b border-blue-100">
                          <Input autoFocus size={1} className="h-7 text-xs flex-1" placeholder="Yeni Kat Adı..." value={inlineAddValue} onChange={e => setInlineAddValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInlineSave()} />
                          <Button size="sm" className="h-7 px-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleInlineSave}><Check className="w-3.5 h-3.5 mr-1" /> Ekle</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0 text-slate-500" onClick={() => setInlineAddNode(null)}>İptal</Button>
                        </div>
                      )}
                      
                      {Object.values(buildingNode.children).map((floorNode: any) => (
                        <div key={floorNode.id} className="">
                          
                          {/* FLOOR NODE */}
                          <div className="flex items-center justify-between p-2.5 pl-8 bg-slate-50 hover:bg-slate-100 group">
                            {renamingNode?.level === 'floor' && renamingNode.oldValue === floorNode.name && renamingNode.parentBuilding === buildingNode.name ? (
                              <div className="flex items-center gap-2 flex-1 mr-4">
                                <Input autoFocus className="h-7 text-sm font-semibold flex-1" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameNodeMutation.mutate({...renamingNode, newValue: renameValue})} />
                                <Button size="sm" className="h-7 px-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => renameNodeMutation.mutate({...renamingNode, newValue: renameValue})} disabled={!renameValue || renameValue === renamingNode.oldValue || renameNodeMutation.isPending}><Check className="w-3.5 h-3.5 mr-1" /> Kaydet</Button>
                                <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={() => setRenamingNode(null)}>İptal</Button>
                              </div>
                            ) : (
                              <>
                                <div 
                                  className="flex items-center gap-2 cursor-pointer text-sm font-semibold flex-1"
                                  onClick={() => toggleNode(floorNode.id)}
                                >
                                  {expandedNodes[floorNode.id] ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                  {floorNode.name}
                                </div>
                                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-primary" onClick={(e) => { e.stopPropagation(); setRenamingNode({level: 'floor', oldValue: floorNode.name, parentBuilding: buildingNode.name}); setRenameValue(floorNode.name); }} title="Katı Yeniden Adlandır">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); if(window.confirm('Bu katı silmek içindeki her şeyi bir üst seviyeye taşıyacaktır. Onaylıyor musunuz?')) deleteNodeMutation.mutate({level: 'floor', value: floorNode.name, parentBuilding: buildingNode.name}); }} title="Katı Sil"><Trash2 className="w-3.5 h-3.5" /></Button>
                                  <Button 
                                    variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500" 
                                    onClick={(e) => { e.stopPropagation(); handleQuickAdd(buildingNode.name, floorNode.name, 'Belirtilmemiş Birim'); }} title="Bu kata Birim ekle"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </>
                            )}
                          </div>
                          
                          {expandedNodes[floorNode.id] && (
                            <div className="divide-y border-t border-slate-100">
                              
                              {/* INLINE ADD DEPT */}
                              {inlineAddNode?.b === buildingNode.name && inlineAddNode?.f === floorNode.name && inlineAddNode?.d === 'Belirtilmemiş Birim' && (
                                <div className="flex items-center gap-2 p-2 pl-14 bg-blue-50/50 border-b border-blue-100">
                                  <Input autoFocus size={1} className="h-7 text-xs flex-1" placeholder="Yeni Birim Adı..." value={inlineAddValue} onChange={e => setInlineAddValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInlineSave()} />
                                  <Button size="sm" className="h-7 px-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleInlineSave}><Check className="w-3.5 h-3.5 mr-1" /> Ekle</Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0 text-slate-500" onClick={() => setInlineAddNode(null)}>İptal</Button>
                                </div>
                              )}
                                  
                              {Object.values(floorNode.children).map((deptNode: any) => (
                                <div key={deptNode.id}>
                                  
                                  {/* DEPT NODE */}
                                  <div className="flex items-center justify-between p-2 pl-14 bg-white hover:bg-slate-50 group">
                                    {renamingNode?.level === 'department' && renamingNode.oldValue === deptNode.name && renamingNode.parentBuilding === buildingNode.name && renamingNode.parentFloor === floorNode.name ? (
                                      <div className="flex items-center gap-2 flex-1 mr-4">
                                        <Input autoFocus className="h-7 text-sm font-medium flex-1" value={renameValue} onChange={e => setRenameValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && renameNodeMutation.mutate({...renamingNode, newValue: renameValue})} />
                                        <Button size="sm" className="h-7 px-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => renameNodeMutation.mutate({...renamingNode, newValue: renameValue})} disabled={!renameValue || renameValue === renamingNode.oldValue || renameNodeMutation.isPending}><Check className="w-3.5 h-3.5 mr-1" /> Kaydet</Button>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0" onClick={() => setRenamingNode(null)}>İptal</Button>
                                      </div>
                                    ) : (
                                      <>
                                        <div 
                                          className="flex items-center gap-2 text-sm font-medium text-slate-700 cursor-pointer flex-1"
                                          onClick={() => toggleNode(deptNode.id)}
                                        >
                                          {expandedNodes[deptNode.id] ? <ChevronDown className="w-3 h-3 text-slate-300" /> : <ChevronRight className="w-3 h-3 text-slate-300" />}
                                          {deptNode.name}
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-primary" onClick={(e) => { e.stopPropagation(); setRenamingNode({level: 'department', oldValue: deptNode.name, parentBuilding: buildingNode.name, parentFloor: floorNode.name}); setRenameValue(deptNode.name); }} title="Birimi Yeniden Adlandır">
                                            <Pencil className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-red-500" onClick={(e) => { e.stopPropagation(); if(window.confirm('Bu birimi silmek içindeki her şeyi bir üst seviyeye taşıyacaktır. Onaylıyor musunuz?')) deleteNodeMutation.mutate({level: 'department', value: deptNode.name, parentBuilding: buildingNode.name, parentFloor: floorNode.name}); }} title="Birimi Sil"><Trash2 className="w-3.5 h-3.5" /></Button>
                                          <Button 
                                            variant="ghost" size="sm" className="h-6 w-6 p-0 text-slate-400 hover:text-blue-500" 
                                            onClick={(e) => { e.stopPropagation(); handleQuickAdd(buildingNode.name, floorNode.name, deptNode.name); }} title="Bu birime Mahal ekle"
                                          >
                                            <Plus className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      </>
                                    )}
                                  </div>
                                  
                                  {expandedNodes[deptNode.id] && (
                                    <div className="bg-white">
                                      
                                      {/* INLINE ADD MAHAL */}
                                      {inlineAddNode?.b === buildingNode.name && inlineAddNode?.f === floorNode.name && inlineAddNode?.d === deptNode.name && (
                                        <div className="flex items-center gap-2 p-2 pl-20 bg-blue-50/50 border-t border-blue-100">
                                          <Input autoFocus size={1} className="h-7 text-xs flex-1" placeholder="Yeni Mahal Adı..." value={inlineAddValue} onChange={e => setInlineAddValue(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleInlineSave()} />
                                          <Button size="sm" className="h-7 px-2 shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={handleInlineSave}><Check className="w-3.5 h-3.5 mr-1" /> Ekle</Button>
                                          <Button size="sm" variant="ghost" className="h-7 px-2 shrink-0 text-slate-500" onClick={() => setInlineAddNode(null)}>İptal</Button>
                                        </div>
                                      )}
                                          
                                      {deptNode.locations.map((loc: any) => (
                                        <div key={loc.id} className="flex items-center justify-between p-2 pl-20 hover:bg-slate-50 border-t border-slate-50 group">
                                          
                                          {/* FULL LOCATION EDITING */}
                                          {editingLocation?.id === loc.id ? (
                                            <div className="flex items-center gap-2 flex-1 mr-4">
                                              <Input className="h-8 text-xs flex-1" value={editingLocation.building || ''} onChange={e => setEditingLocation({...editingLocation, building: e.target.value})} placeholder="Blok" />
                                              <Input className="h-8 text-xs flex-1" value={editingLocation.floor || ''} onChange={e => setEditingLocation({...editingLocation, floor: e.target.value})} placeholder="Kat" />
                                              <Input className="h-8 text-xs flex-1" value={editingLocation.department || ''} onChange={e => setEditingLocation({...editingLocation, department: e.target.value})} placeholder="Birim" />
                                              <Input className="h-8 text-xs flex-1" value={editingLocation.description || ''} onChange={e => setEditingLocation({...editingLocation, description: e.target.value})} placeholder="Mahal" />
                                              <Button size="sm" className="h-8 shrink-0 bg-blue-600 hover:bg-blue-700 text-white" onClick={() => updateLocationMutation.mutate(editingLocation)}><Check className="w-3.5 h-3.5 mr-1" /> Kaydet</Button>
                                              <Button size="sm" variant="ghost" className="h-8 shrink-0" onClick={() => setEditingLocation(null)}>İptal</Button>
                                            </div>
                                          ) : (
                                            <>
                                              <div className="text-xs text-slate-600 flex items-center gap-2">
                                                <div className="w-1.5 h-1.5 rounded-full bg-slate-300"></div>
                                                {loc.description || 'Giriş / Genel Alan'}
                                              </div>
                                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-primary" onClick={() => setEditingLocation({ ...loc })}>
                                                  <Pencil className="w-3.5 h-3.5" />
                                                </Button>
                                                <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-slate-400 hover:text-red-500" onClick={() => { if(window.confirm('Bu lokasyon kalıcı olarak silinecek. Onaylıyor musunuz?')) deleteLocationMutation.mutate(loc.id); }}>
                                                  <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
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
            </div>
          )}
        </div>
        
        <div className="p-4 border-t bg-white flex justify-end shrink-0">
          <Button variant="outline" onClick={onClose}>Kapat</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
