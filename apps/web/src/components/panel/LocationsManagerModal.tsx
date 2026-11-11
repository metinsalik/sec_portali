import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, Loader2, MapPin, ChevronDown, ChevronRight, Check, Pencil, Building, Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { extractLocationParts } from '@/utils/locationHierarchy';
import { STANDARD_BLOCKS, STANDARD_FLOORS } from '@/data/locationStandards';

interface LocationsManagerModalProps {
  facilityId: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function LocationsManagerModal({ facilityId, isOpen, onClose }: LocationsManagerModalProps) {
  const queryClient = useQueryClient();
  const [newLocation, setNewLocation] = useState({
    buildingName: 'Ana Bina',
    building: '',
    floor: '',
    department: '',
    description: '',
  });
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [renamingNode, setRenamingNode] = useState<{
    level: string;
    oldValue: string;
    parentBuildingName?: string;
    parentBuilding?: string;
    parentFloor?: string;
    nodeKey: string;
  } | null>(null);
  const [renameValue, setRenameValue] = useState('');

  const [inlineAddNode, setInlineAddNode] = useState<{
    level: 'block' | 'floor' | 'department' | 'description';
    bName: string;
    b: string;
    f: string;
    d: string;
    nodeKey: string;
  } | null>(null);
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

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
  };

  const createLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post(`/risks/facilities/${facilityId}/locations`, data);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Eklenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
      toast.success('Lokasyon eklendi');
      setNewLocation((prev) => ({ ...prev, department: '', description: '' }));
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateLocationMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/risks/facilities/${facilityId}/locations/${data.id}`, data);
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAll();
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
      invalidateAll();
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
      invalidateAll();
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
      invalidateAll();
      toast.success('Lokasyon düğümü silindi');
    },
    onError: (err: any) => toast.error(err.message),
  });

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: prev[nodeId] === undefined ? false : !prev[nodeId] }));
  };

  const isNodeExpanded = (nodeId: string) => {
    return expandedNodes[nodeId] !== undefined ? expandedNodes[nodeId] : true;
  };

  const handleInlineSave = () => {
    if (!inlineAddNode || !inlineAddValue.trim()) return;
    const val = inlineAddValue.trim();
    const { level, bName, b, f, d } = inlineAddNode;

    const cleanB = b === 'Blok Belirtilmemiş' ? '' : b;
    const cleanF = f === 'Kat Belirtilmemiş' ? '' : f;
    const cleanD = d === 'Birim Belirtilmemiş' ? '' : d;

    const payload = {
      buildingName: bName,
      building: level === 'block' ? val : cleanB,
      floor: level === 'floor' ? val : (level === 'block' ? '' : cleanF),
      department: level === 'department' ? val : (level === 'description' ? cleanD : ''),
      description: level === 'description' ? val : '',
    };

    createLocationMutation.mutate(payload, {
      onSuccess: () => {
        setInlineAddNode(null);
        setInlineAddValue('');
      },
    });
  };

  // 5-Seviyeli Ağaç: Bina Adı > Blok > Kat > Birim > Mahal
  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    locations.forEach((loc: any) => {
      const p = extractLocationParts(loc);
      const bn = p.buildingName || 'Bina Belirtilmemiş';
      const blk = p.block || 'Blok Belirtilmemiş';
      const flr = p.floor || 'Kat Belirtilmemiş';
      const dept = p.department || 'Birim Belirtilmemiş';

      if (!root[bn]) root[bn] = { id: `bn-${bn}`, name: bn, children: {} };
      if (!root[bn].children[blk]) {
        root[bn].children[blk] = { id: `blk-${bn}-${blk}`, name: blk, isPlaceholder: !p.block, children: {} };
      }
      if (!root[bn].children[blk].children[flr]) {
        root[bn].children[blk].children[flr] = { id: `f-${bn}-${blk}-${flr}`, name: flr, isPlaceholder: !p.floor, children: {} };
      }
      if (!root[bn].children[blk].children[flr].children[dept]) {
        root[bn].children[blk].children[flr].children[dept] = {
          id: `d-${bn}-${blk}-${flr}-${dept}`,
          name: dept,
          isPlaceholder: !p.department,
          locations: [],
        };
      }
      root[bn].children[blk].children[flr].children[dept].locations.push({ ...loc, _parts: p });
    });
    return root;
  }, [locations]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[900px] h-[85vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MapPin className="w-5 h-5 text-primary" /> Merkezi Lokasyon Yönetimi
          </DialogTitle>
          <DialogDescription>
            Tesis lokasyonlarını <strong>Bina Adı &gt; Blok &gt; Kat &gt; Birim &gt; Mahal</strong> yapısında yönetebilirsiniz. Değişiklikler Ayarlar &gt; Tesis Lokasyonları ile birebir senkronizedir.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50 space-y-6">
          {/* 5-Seviyeli Hızlı Ekleme Formu */}
          <div className="bg-white border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <Plus className="w-4 h-4 text-primary" /> Yeni Lokasyon Ekle (Bina &gt; Blok &gt; Kat &gt; Birim &gt; Mahal)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
              <div>
                <Label className="text-xs mb-1 block">Bina Adı *</Label>
                <Input
                  value={newLocation.buildingName}
                  onChange={(e) => setNewLocation({ ...newLocation, buildingName: e.target.value })}
                  placeholder="Ana Bina"
                  className="h-9 text-xs"
                  list="modal-bname-list"
                />
                <datalist id="modal-bname-list">
                  {Array.from(new Set(['Ana Bina', 'Ek Bina', ...locations.map((l: any) => extractLocationParts(l).buildingName).filter(Boolean)])).map((v: any) => (
                    <option key={v} value={v} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Blok (Ops.)</Label>
                <Input
                  value={newLocation.building}
                  onChange={(e) => setNewLocation({ ...newLocation, building: e.target.value })}
                  placeholder="A Blok"
                  className="h-9 text-xs"
                  list="modal-block-list"
                />
                <datalist id="modal-block-list">
                  {STANDARD_BLOCKS.map((sb) => (
                    <option key={sb.code} value={sb.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Kat</Label>
                <Input
                  value={newLocation.floor}
                  onChange={(e) => setNewLocation({ ...newLocation, floor: e.target.value })}
                  placeholder="1.Kat"
                  className="h-9 text-xs"
                  list="modal-floor-list"
                />
                <datalist id="modal-floor-list">
                  {STANDARD_FLOORS.map((sf) => (
                    <option key={sf.code} value={sf.name} />
                  ))}
                </datalist>
              </div>
              <div>
                <Label className="text-xs mb-1 block">Birim (Ops.)</Label>
                <Input
                  value={newLocation.department}
                  onChange={(e) => setNewLocation({ ...newLocation, department: e.target.value })}
                  placeholder="Acil Servis"
                  className="h-9 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs mb-1 block">Mahal (Ops.)</Label>
                <Input
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  placeholder="101 Nolu Oda"
                  className="h-9 text-xs"
                />
              </div>
              <Button
                className="h-9 w-full"
                onClick={() => createLocationMutation.mutate(newLocation)}
                disabled={!newLocation.buildingName.trim() || createLocationMutation.isPending}
              >
                {createLocationMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Kaydet'}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center p-8">
              <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            </div>
          ) : locations.length === 0 ? (
            <div className="text-center p-8 text-slate-500 border border-dashed rounded-xl bg-white">
              Henüz lokasyon eklenmemiş. Yukarıdan yeni bir lokasyon ekleyebilirsiniz.
            </div>
          ) : (
            <div className="space-y-3">
              {Object.values(tree).map((binaNode: any) => (
                <div key={binaNode.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
                  {/* BİNA */}
                  <div className="flex items-center justify-between p-3 bg-slate-100 hover:bg-slate-200 group transition-colors">
                    {renamingNode?.nodeKey === binaNode.id ? (
                      <div className="flex items-center gap-2 flex-1 mr-4">
                        <Input autoFocus className="h-8 text-sm font-bold flex-1" value={renameValue} onChange={(e) => setRenameValue(e.target.value)} />
                        <Button size="sm" className="h-8" onClick={() => renameNodeMutation.mutate({ ...renamingNode, newValue: renameValue })}>
                          <Check className="w-3.5 h-3.5 mr-1" /> Kaydet
                        </Button>
                        <Button size="sm" variant="ghost" className="h-8" onClick={() => setRenamingNode(null)}>İptal</Button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 cursor-pointer font-bold flex-1 text-sm" onClick={() => toggleNode(binaNode.id)}>
                          {isNodeExpanded(binaNode.id) ? <ChevronDown className="w-4 h-4 text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-500" />}
                          <Building className="w-4 h-4 text-primary" /> {binaNode.name}
                        </div>
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button variant="ghost" size="sm" className="h-7 px-2 text-xs text-blue-600" onClick={(e) => { e.stopPropagation(); setInlineAddNode({ level: 'block', bName: binaNode.name, b: '', f: '', d: '', nodeKey: binaNode.id }); setInlineAddValue(''); }}>
                            <Plus className="w-3.5 h-3.5 mr-1" /> Blok
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={(e) => { e.stopPropagation(); setRenamingNode({ level: 'buildingName', oldValue: binaNode.name, nodeKey: binaNode.id }); setRenameValue(binaNode.name); }}>
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-red-500" onClick={(e) => { e.stopPropagation(); if (window.confirm('Binayı ve altındaki kayıtları silmek istediğinize emin misiniz?')) deleteNodeMutation.mutate({ level: 'buildingName', value: binaNode.name }); }}>
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {isNodeExpanded(binaNode.id) && (
                    <div className="border-t divide-y">
                      {inlineAddNode?.nodeKey === binaNode.id && (
                        <div className="flex items-center gap-2 p-2.5 pl-8 bg-blue-50/50">
                          <Input autoFocus className="h-7 text-xs flex-1" placeholder="Yeni Blok Adı..." value={inlineAddValue} onChange={(e) => setInlineAddValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInlineSave()} />
                          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleInlineSave}><Check className="w-3.5 h-3.5 mr-1" /> Ekle</Button>
                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setInlineAddNode(null)}>İptal</Button>
                        </div>
                      )}

                      {Object.values(binaNode.children).map((blokNode: any) => (
                        <div key={blokNode.id}>
                          {/* BLOK */}
                          <div className="flex items-center justify-between p-2.5 pl-7 bg-slate-50/80 hover:bg-slate-100 group">
                            <div className="flex items-center gap-2 cursor-pointer text-xs font-semibold flex-1" onClick={() => toggleNode(blokNode.id)}>
                              {isNodeExpanded(blokNode.id) ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                              <Building2 className="w-3.5 h-3.5 text-indigo-500" />
                              <span className={blokNode.isPlaceholder ? 'italic text-slate-500' : ''}>{blokNode.isPlaceholder ? 'Tek Blok / Genel' : blokNode.name}</span>
                            </div>
                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-emerald-600" onClick={(e) => { e.stopPropagation(); setInlineAddNode({ level: 'floor', bName: binaNode.name, b: blokNode.name, f: '', d: '', nodeKey: blokNode.id }); setInlineAddValue(''); }}>
                                <Plus className="w-3 h-3 mr-1" /> Kat
                              </Button>
                            </div>
                          </div>

                          {isNodeExpanded(blokNode.id) && (
                            <div className="divide-y">
                              {inlineAddNode?.nodeKey === blokNode.id && (
                                <div className="flex items-center gap-2 p-2 pl-12 bg-emerald-50/50">
                                  <Input autoFocus className="h-7 text-xs flex-1" placeholder="Yeni Kat Adı..." value={inlineAddValue} onChange={(e) => setInlineAddValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInlineSave()} />
                                  <Button size="sm" className="h-7 px-2 text-xs" onClick={handleInlineSave}><Check className="w-3 h-3 mr-1" /> Ekle</Button>
                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setInlineAddNode(null)}>İptal</Button>
                                </div>
                              )}

                              {Object.values(blokNode.children).map((floorNode: any) => (
                                <div key={floorNode.id}>
                                  {/* KAT */}
                                  <div className="flex items-center justify-between p-2 pl-12 bg-white hover:bg-slate-50 group">
                                    <div className="flex items-center gap-2 cursor-pointer text-xs font-semibold flex-1" onClick={() => toggleNode(floorNode.id)}>
                                      {isNodeExpanded(floorNode.id) ? <ChevronDown className="w-3.5 h-3.5 text-slate-400" /> : <ChevronRight className="w-3.5 h-3.5 text-slate-400" />}
                                      {floorNode.name}
                                    </div>
                                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                      <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-amber-600" onClick={(e) => { e.stopPropagation(); setInlineAddNode({ level: 'department', bName: binaNode.name, b: blokNode.name, f: floorNode.name, d: '', nodeKey: floorNode.id }); setInlineAddValue(''); }}>
                                        <Plus className="w-3 h-3 mr-1" /> Birim
                                      </Button>
                                    </div>
                                  </div>

                                  {isNodeExpanded(floorNode.id) && (
                                    <div className="divide-y">
                                      {inlineAddNode?.nodeKey === floorNode.id && (
                                        <div className="flex items-center gap-2 p-2 pl-16 bg-amber-50/50">
                                          <Input autoFocus className="h-7 text-xs flex-1" placeholder="Yeni Birim Adı..." value={inlineAddValue} onChange={(e) => setInlineAddValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInlineSave()} />
                                          <Button size="sm" className="h-7 px-2 text-xs" onClick={handleInlineSave}><Check className="w-3 h-3 mr-1" /> Ekle</Button>
                                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setInlineAddNode(null)}>İptal</Button>
                                        </div>
                                      )}

                                      {Object.values(floorNode.children).map((deptNode: any) => (
                                        <div key={deptNode.id}>
                                          {/* BİRİM */}
                                          <div className="flex items-center justify-between p-2 pl-16 bg-slate-50/30 hover:bg-slate-50 group">
                                            <div className="flex items-center gap-2 text-xs font-medium text-slate-700 cursor-pointer flex-1" onClick={() => toggleNode(deptNode.id)}>
                                              {isNodeExpanded(deptNode.id) ? <ChevronDown className="w-3 h-3 text-slate-400" /> : <ChevronRight className="w-3 h-3 text-slate-400" />}
                                              {deptNode.name}
                                            </div>
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                              <Button variant="ghost" size="sm" className="h-6 px-2 text-xs text-sky-600" onClick={(e) => { e.stopPropagation(); setInlineAddNode({ level: 'description', bName: binaNode.name, b: blokNode.name, f: floorNode.name, d: deptNode.name, nodeKey: deptNode.id }); setInlineAddValue(''); }}>
                                                <Plus className="w-3 h-3 mr-1" /> Mahal
                                              </Button>
                                            </div>
                                          </div>

                                          {isNodeExpanded(deptNode.id) && (
                                            <div>
                                              {inlineAddNode?.nodeKey === deptNode.id && (
                                                <div className="flex items-center gap-2 p-2 pl-20 bg-sky-50/50 border-t">
                                                  <Input autoFocus className="h-7 text-xs flex-1" placeholder="Yeni Mahal Adı..." value={inlineAddValue} onChange={(e) => setInlineAddValue(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleInlineSave()} />
                                                  <Button size="sm" className="h-7 px-2 text-xs" onClick={handleInlineSave}><Check className="w-3 h-3 mr-1" /> Ekle</Button>
                                                  <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setInlineAddNode(null)}>İptal</Button>
                                                </div>
                                              )}

                                              {deptNode.locations.map((loc: any) => (
                                                <div key={loc.id} className="flex items-center justify-between p-2 pl-20 hover:bg-slate-50 border-t border-slate-100 group">
                                                  {editingLocation?.id === loc.id ? (
                                                    <div className="flex items-center gap-1.5 flex-1 mr-2">
                                                      <Input className="h-7 text-xs flex-1" value={editingLocation.buildingName || ''} onChange={(e) => setEditingLocation({ ...editingLocation, buildingName: e.target.value })} placeholder="Bina" />
                                                      <Input className="h-7 text-xs flex-1" value={editingLocation.building || ''} onChange={(e) => setEditingLocation({ ...editingLocation, building: e.target.value })} placeholder="Blok" />
                                                      <Input className="h-7 text-xs flex-1" value={editingLocation.floor || ''} onChange={(e) => setEditingLocation({ ...editingLocation, floor: e.target.value })} placeholder="Kat" />
                                                      <Input className="h-7 text-xs flex-1" value={editingLocation.department || ''} onChange={(e) => setEditingLocation({ ...editingLocation, department: e.target.value })} placeholder="Birim" />
                                                      <Input className="h-7 text-xs flex-1" value={editingLocation.description || ''} onChange={(e) => setEditingLocation({ ...editingLocation, description: e.target.value })} placeholder="Mahal" />
                                                      <Button size="sm" className="h-7 px-2" onClick={() => updateLocationMutation.mutate(editingLocation)}><Check className="w-3.5 h-3.5" /></Button>
                                                      <Button size="sm" variant="ghost" className="h-7 px-2" onClick={() => setEditingLocation(null)}>İptal</Button>
                                                    </div>
                                                  ) : (
                                                    <>
                                                      <div className="text-xs text-slate-600 flex items-center gap-2">
                                                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                                                        {loc._parts.description || 'Genel Alan / Mahal Belirtilmemiş'}
                                                      </div>
                                                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setEditingLocation({ ...loc, ...loc._parts, building: loc._parts.block })}>
                                                          <Pencil className="w-3 h-3" />
                                                        </Button>
                                                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-500" onClick={() => { if (window.confirm('Bu lokasyonu silmek istediğinize emin misiniz?')) deleteLocationMutation.mutate(loc.id); }}>
                                                          <Trash2 className="w-3 h-3" />
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
