import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check } from 'lucide-react';

export default function LocationsStep({ data, update }: any) {
  const locations = data.locations || [];
  
  const [newLocation, setNewLocation] = useState({ building: '', floor: '', department: '', description: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const addLoc = () => {
    if (!newLocation.building) return;
    const name = newLocation.department || newLocation.description || newLocation.floor || newLocation.building || 'İsimsiz';
    update({ locations: [...locations, { ...newLocation, name }] });
    setNewLocation({ building: '', floor: '', department: '', description: '' });
  };

  const removeLoc = (idx: number) => {
    if (!window.confirm('Lokasyon silinecek. Onaylıyor musunuz?')) return;
    update({ locations: locations.filter((_: any, i: number) => i !== idx) });
  };

  const saveEdit = () => {
    if (editingIndex === null || !editingLocation) return;
    const newL = [...locations];
    const name = editingLocation.department || editingLocation.description || editingLocation.floor || editingLocation.building || 'İsimsiz';
    newL[editingIndex] = { ...editingLocation, name };
    update({ locations: newL });
    setEditingIndex(null);
    setEditingLocation(null);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes(prev => ({ ...prev, [nodeId]: !prev[nodeId] }));
  };

  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    locations.forEach((loc: any, idx: number) => {
      const b = loc.building || 'Belirtilmemiş Blok';
      const f = loc.floor || 'Belirtilmemiş Kat';
      const d = loc.department || 'Belirtilmemiş Birim';

      if (!root[b]) root[b] = { type: 'building', name: b, children: {}, id: `b-${b}` };
      if (!root[b].children[f]) root[b].children[f] = { type: 'floor', name: f, children: {}, id: `f-${b}-${f}` };
      if (!root[b].children[f].children[d]) root[b].children[f].children[d] = { type: 'department', name: d, locations: [], id: `d-${b}-${f}-${d}` };
      
      root[b].children[f].children[d].locations.push({ ...loc, originalIndex: idx });
    });
    return root;
  }, [locations]);

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h2 className="text-base font-semibold text-foreground">3. Merkezi Lokasyonlar</h2>
      </div>
      <p className="text-xs text-muted-foreground">Bu lokasyonlar tüm modüller (Risk, Kimyasal, Ekipman vs.) tarafından ortak kullanılacaktır. Lokasyonları Blok &gt; Kat &gt; Birim &gt; Mahal yapısında hiyerarşik olarak ekleyebilirsiniz.</p>
      
      {/* Hızlı Ekleme Formu */}
      <div className="bg-card border border-border/60 rounded-lg p-4 shadow-xs mb-5">
        <h3 className="text-xs font-semibold mb-3 flex items-center gap-2 text-foreground"><Plus className="w-3.5 h-3.5 text-primary"/> Yeni Lokasyon Ekle</h3>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 items-end">
          <div>
            <Label className="text-xs mb-1 block">Blok</Label>
            <Input 
              value={newLocation.building} 
              onChange={e => setNewLocation({...newLocation, building: e.target.value})} 
              placeholder="Örn: A Blok" className="h-9 text-xs rounded-md" 
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
              placeholder="Örn: 1. Kat" className="h-9 text-xs rounded-md" 
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
              placeholder="Örn: Acil Servis" className="h-9 text-xs rounded-md" 
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
              placeholder="Örn: 101 Nolu Oda" className="h-9 text-xs rounded-md" 
            />
          </div>
          <Button 
            className="h-9 w-full sm:col-span-1 text-xs rounded-md" 
            onClick={addLoc}
            disabled={!newLocation.building}
          >
            Ekle
          </Button>
        </div>
      </div>

      {/* Ağaç Görünümü */}
      {locations.length === 0 ? (
        <div className="text-center p-8 text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg bg-muted/10">Henüz lokasyon eklenmemiş.</div>
      ) : (
        <div className="space-y-3">
          {Object.values(tree).map((buildingNode: any) => (
            <div key={buildingNode.id} className="bg-card rounded-lg border border-border/60 shadow-xs overflow-hidden">
              <div 
                className="flex items-center gap-2 p-3 bg-muted/40 hover:bg-muted/70 cursor-pointer font-semibold text-xs text-foreground transition-colors"
                onClick={() => toggleNode(buildingNode.id)}
              >
                {expandedNodes[buildingNode.id] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                🏢 {buildingNode.name}
              </div>
              
              {expandedNodes[buildingNode.id] && (
                <div className="border-t border-border/40 divide-y divide-border/40">
                  {Object.values(buildingNode.children).map((floorNode: any) => (
                    <div key={floorNode.id} className="">
                      <div 
                        className="flex items-center gap-2 p-2.5 pl-8 bg-muted/20 hover:bg-muted/50 cursor-pointer text-xs font-semibold text-foreground transition-colors"
                        onClick={() => toggleNode(floorNode.id)}
                      >
                        {expandedNodes[floorNode.id] ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                        {floorNode.name}
                      </div>
                      
                      {expandedNodes[floorNode.id] && (
                        <div className="divide-y divide-border/30 border-t border-border/30">
                          {Object.values(floorNode.children).map((deptNode: any) => (
                            <div key={deptNode.id}>
                              <div 
                                className="flex items-center gap-2 p-2 pl-14 text-xs font-medium text-foreground bg-card hover:bg-muted/30 cursor-pointer transition-colors"
                                onClick={() => toggleNode(deptNode.id)}
                              >
                                {expandedNodes[deptNode.id] ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
                                {deptNode.name}
                              </div>
                              
                              {expandedNodes[deptNode.id] && (
                                <div className="bg-card">
                                  {deptNode.locations.map((loc: any) => (
                                    <div key={loc.id || loc.originalIndex} className="flex items-center justify-between p-2 pl-20 hover:bg-muted/30 border-t border-border/30 group">
                                      
                                      {editingIndex === loc.originalIndex ? (
                                        <div className="flex items-center gap-2 flex-1 mr-4">
                                          <Input className="h-8 text-xs rounded-md" value={editingLocation.building || ''} onChange={e => setEditingLocation({...editingLocation, building: e.target.value})} placeholder="Blok" />
                                          <Input className="h-8 text-xs rounded-md" value={editingLocation.floor || ''} onChange={e => setEditingLocation({...editingLocation, floor: e.target.value})} placeholder="Kat" />
                                          <Input className="h-8 text-xs rounded-md" value={editingLocation.department || ''} onChange={e => setEditingLocation({...editingLocation, department: e.target.value})} placeholder="Birim" />
                                          <Input className="h-8 text-xs rounded-md" value={editingLocation.description || ''} onChange={e => setEditingLocation({...editingLocation, description: e.target.value})} placeholder="Mahal" />
                                          <Button size="sm" className="h-8 shrink-0 text-xs rounded-md" onClick={saveEdit}><Check className="w-3.5 h-3.5 mr-1" /> Kaydet</Button>
                                          <Button size="sm" variant="ghost" className="h-8 shrink-0 text-xs rounded-md" onClick={() => { setEditingIndex(null); setEditingLocation(null); }}>İptal</Button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="text-xs text-foreground/80 flex items-center gap-2">
                                            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/40"></div>
                                            {loc.description || 'Giriş / Genel Alan'}
                                          </div>
                                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground rounded-md" onClick={() => { setEditingIndex(loc.originalIndex); setEditingLocation({ ...loc }); }}>
                                              <Pencil className="w-3.5 h-3.5" />
                                            </Button>
                                            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-destructive hover:bg-destructive/10 rounded-md" onClick={() => removeLoc(loc.originalIndex)}>
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
  );
}
