import React, { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, ChevronDown, ChevronRight, Pencil, Check, MapPin, BookOpen, Sparkles, Building, Layers } from 'lucide-react';
import { STANDARD_BLOCKS, STANDARD_FLOORS, getBlockCode, getFloorCode, generateLocationCode } from '@/data/locationStandards';
import StandardCodesModal from '@/components/shared/StandardCodesModal';
import { extractLocationParts } from '@/utils/locationHierarchy';

export default function LocationsStep({ data, update }: any) {
  const locations = data.locations || [];
  const facilityShortCode = data.shortName || '';
  
  const [newLocation, setNewLocation] = useState({ buildingName: 'Ana Bina', building: '', floor: '', department: '', description: '' });
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingLocation, setEditingLocation] = useState<any>(null);
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [isCodesModalOpen, setIsCodesModalOpen] = useState(false);

  // Available building options (from Step 2 buildings + standard blocks)
  const availableBlocks = useMemo(() => {
    const fromBuildings = (data.buildings || []).map((b: any) => b.name).filter(Boolean);
    const fromStandards = STANDARD_BLOCKS.map(sb => sb.name);
    const fromLocations = locations.map((l: any) => extractLocationParts(l).block || l.building).filter(Boolean);
    return Array.from(new Set([...fromBuildings, ...fromStandards, ...fromLocations])).sort();
  }, [data.buildings, locations]);

  const addLoc = () => {
    if (!newLocation.buildingName && !newLocation.building) return;
    const name = [newLocation.buildingName, newLocation.building, newLocation.floor, newLocation.department, newLocation.description].filter(Boolean).join(' - ') || 'İsimsiz';
    update({ locations: [...locations, { ...newLocation, name }] });
    setNewLocation({ buildingName: newLocation.buildingName || 'Ana Bina', building: '', floor: '', department: '', description: '' });
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

  const generatedCode = useMemo(() => {
    if (!newLocation.building && !newLocation.floor) return '';
    return generateLocationCode(newLocation.building, newLocation.floor, facilityShortCode);
  }, [newLocation.building, newLocation.floor, facilityShortCode]);

  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    locations.forEach((loc: any, idx: number) => {
      const p = extractLocationParts(loc);
      const b = [p.buildingName, p.block].filter(Boolean).join(' › ') || 'Belirtilmemiş Blok';
      const f = p.floor || 'Belirtilmemiş Kat';
      const d = p.department || 'Belirtilmemiş Birim';

      if (!root[b]) root[b] = { type: 'building', name: b, children: {}, id: `b-${b}` };
      if (!root[b].children[f]) root[b].children[f] = { type: 'floor', name: f, children: {}, id: `f-${b}-${f}` };
      if (!root[b].children[f].children[d]) root[b].children[f].children[d] = { type: 'department', name: d, locations: [], id: `d-${b}-${f}-${d}` };
      
      root[b].children[f].children[d].locations.push({ ...loc, originalIndex: idx });
    });
    return root;
  }, [locations]);

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <MapPin className="w-5 h-5 text-primary" />
            3. Merkezi Lokasyonlar & Hiyerarşi
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            Bu lokasyonlar tüm modüller tarafından ortak kullanılır. Blok &gt; Kat &gt; Birim &gt; Mahal yapısında kurumsal kod standartlarına göre yapılandırılır.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setIsCodesModalOpen(true)}
          className="h-8 text-xs gap-1.5 self-start sm:self-auto rounded-md"
        >
          <BookOpen className="w-3.5 h-3.5 text-primary" />
          Standart Kodlar Rehberi
        </Button>
      </div>
      
      {/* Hızlı Ekleme Formu */}
      <div className="bg-card border border-border/60 rounded-lg p-4 shadow-xs mb-5 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-semibold flex items-center gap-2 text-foreground">
            <Plus className="w-3.5 h-3.5 text-primary"/> Yeni Lokasyon Ekle
          </h3>
          {generatedCode && (
            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-[11px] text-muted-foreground">Oluşacak Kod:</span>
              <Badge variant="outline" className="font-mono font-bold bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-1.5">
                {generatedCode}
              </Badge>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 items-end">
          <div>
            <Label className="text-xs mb-1 block">Bina Adı <span className="text-rose-500">*</span></Label>
            <Input 
              value={newLocation.buildingName} 
              onChange={e => setNewLocation({...newLocation, buildingName: e.target.value})} 
              placeholder="Örn: Ana Bina" 
              className="h-9 text-xs rounded-md" 
            />
          </div>
          <div>
            <Label className="text-xs mb-1 block">Blok (Opsiyonel)</Label>
            <Input 
              value={newLocation.building} 
              onChange={e => setNewLocation({...newLocation, building: e.target.value})} 
              placeholder="Örn: A Blok" 
              className="h-9 text-xs rounded-md" 
              list="wizard-building-list"
            />
            <datalist id="wizard-building-list">
              {availableBlocks.map((val: any) => {
                const bCode = getBlockCode(val);
                return <option key={val} value={val}>{bCode ? `${val} [${bCode}]` : val}</option>;
              })}
            </datalist>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Kat <span className="text-rose-500">*</span></Label>
            <Input 
              value={newLocation.floor} 
              onChange={e => setNewLocation({...newLocation, floor: e.target.value})} 
              placeholder="Örn: 1.Kat, Z.Kat..." 
              className="h-9 text-xs rounded-md" 
              list="wizard-floor-list"
            />
            <datalist id="wizard-floor-list">
              {STANDARD_FLOORS.map(sf => (
                <option key={sf.code} value={sf.name}>{`${sf.name} [${sf.code}]`}</option>
              ))}
            </datalist>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Birim (Opsiyonel)</Label>
            <Input 
              value={newLocation.department} 
              onChange={e => setNewLocation({...newLocation, department: e.target.value})} 
              placeholder="Örn: Acil Servis" 
              className="h-9 text-xs rounded-md" 
              list="wizard-dept-list"
            />
            <datalist id="wizard-dept-list">
              {Array.from(new Set(locations.map((l:any) => l.department).filter(Boolean))).sort().map((val: any) => <option key={val} value={val} />)}
            </datalist>
          </div>
          <div>
            <Label className="text-xs mb-1 block">Mahal / Oda (Opsiyonel)</Label>
            <Input 
              value={newLocation.description} 
              onChange={e => setNewLocation({...newLocation, description: e.target.value})} 
              placeholder="Örn: 101 Nolu Muayene" 
              className="h-9 text-xs rounded-md" 
            />
          </div>
          <Button 
            className="h-9 w-full sm:col-span-1 text-xs rounded-md font-medium" 
            onClick={addLoc}
            disabled={!newLocation.buildingName && !newLocation.building}
          >
            <Plus className="w-3.5 h-3.5 mr-1" /> Ekle
          </Button>
        </div>
      </div>

      {/* Ağaç Görünümü */}
      {locations.length === 0 ? (
        <div className="text-center p-8 text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg bg-muted/10">
          <Building className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
          Henüz lokasyon hiyerarşisi oluşturulmamış. Yukarıdaki formdan ekleyebilirsiniz.
        </div>
      ) : (
        <div className="space-y-3">
          {Object.values(tree).map((buildingNode: any) => {
            const bCode = getBlockCode(buildingNode.name);
            return (
              <div key={buildingNode.id} className="bg-card rounded-lg border border-border/60 shadow-xs overflow-hidden">
                <div 
                  className="flex items-center justify-between p-3 bg-muted/40 hover:bg-muted/70 cursor-pointer font-semibold text-xs text-foreground transition-colors"
                  onClick={() => toggleNode(buildingNode.id)}
                >
                  <div className="flex items-center gap-2">
                    {expandedNodes[buildingNode.id] ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                    <Building className="w-3.5 h-3.5 text-primary/80" />
                    <span>{buildingNode.name}</span>
                    {bCode && (
                      <Badge variant="outline" className="text-[10px] font-mono py-0 px-1 bg-background text-foreground/80 font-bold border-border/80">
                        {bCode}
                      </Badge>
                    )}
                  </div>
                  <span className="text-[10px] text-muted-foreground font-normal">
                    {Object.keys(buildingNode.children).length} Kat
                  </span>
                </div>
                
                {expandedNodes[buildingNode.id] && (
                  <div className="border-t border-border/40 divide-y divide-border/40">
                    {Object.values(buildingNode.children).map((floorNode: any) => {
                      const fCode = getFloorCode(floorNode.name);
                      return (
                        <div key={floorNode.id}>
                          <div 
                            className="flex items-center justify-between p-2.5 pl-8 bg-muted/20 hover:bg-muted/50 cursor-pointer text-xs font-semibold text-foreground transition-colors"
                            onClick={() => toggleNode(floorNode.id)}
                          >
                            <div className="flex items-center gap-2">
                              {expandedNodes[floorNode.id] ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />}
                              <Layers className="w-3 h-3 text-muted-foreground" />
                              <span>{floorNode.name}</span>
                              {fCode && (
                                <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 bg-background text-primary font-bold border-primary/20">
                                  {fCode}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[10px] text-muted-foreground font-normal">
                              {Object.keys(floorNode.children).length} Birim
                            </span>
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
                                    <span>{deptNode.name}</span>
                                    <span className="text-[10px] text-muted-foreground">({deptNode.locations.length} mahal)</span>
                                  </div>
                                  
                                  {expandedNodes[deptNode.id] && (
                                    <div className="bg-card">
                                      {deptNode.locations.map((loc: any) => {
                                        const locCode = generateLocationCode(loc.building, loc.floor, facilityShortCode);
                                        return (
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
                                                  <span>{loc.description || 'Giriş / Genel Alan'}</span>
                                                  {locCode && (
                                                    <span className="font-mono text-[10px] text-muted-foreground bg-muted/60 px-1 rounded">
                                                      {locCode}
                                                    </span>
                                                  )}
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
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Standart Kodlar Rehberi Modalı */}
      <StandardCodesModal
        isOpen={isCodesModalOpen}
        onClose={() => setIsCodesModalOpen(false)}
      />
    </div>
  );
}
