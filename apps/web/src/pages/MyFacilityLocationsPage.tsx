import React, { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  MapPin,
  Building2,
  Building,
  Layers,
  DoorOpen,
  Search,
  ChevronDown,
  ChevronRight,
  AlertCircle,
  Briefcase,
} from 'lucide-react';
import { extractLocationParts } from '@/utils/locationHierarchy';

interface LocationItem {
  id: string;
  facilityId: string;
  buildingName?: string | null;
  building?: string | null;
  floor?: string | null;
  department?: string | null;
  description?: string | null;
  name?: string | null;
  type?: string | null;
}

interface FacilitySummary {
  id: string;
  name: string;
  isActive: boolean;
  buildings?: {
    id?: number;
    name: string;
    buildingFloors?: number | null;
    structureFloors?: number | null;
    closedArea?: number | null;
    buildingHeight?: number | null;
  }[];
}

export default function MyFacilityLocationsPage() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const assignedFacilityIds = useMemo(() => {
    const ids = new Set<string>(user?.facilities || []);
    user?.professionalProfile?.assignments?.forEach((a) => {
      if (a.facilityId) ids.add(a.facilityId);
    });
    return Array.from(ids);
  }, [user]);

  const { data: allFacilities = [], isLoading: facilitiesLoading } = useQuery<FacilitySummary[]>({
    queryKey: ['my-facilities-summary'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler yüklenemedi');
      return res.json();
    },
  });

  const myFacilities = useMemo(() => {
    if (assignedFacilityIds.length > 0) {
      const matched = allFacilities.filter((f) => assignedFacilityIds.includes(f.id));
      if (matched.length > 0) return matched;
    }
    if (user?.isAdmin || user?.isManagement) {
      return allFacilities.filter((f) => f.isActive);
    }
    return [];
  }, [allFacilities, assignedFacilityIds, user]);

  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    if (myFacilities.length === 0) return;
    if (selectedId && myFacilities.some((f) => f.id === selectedId)) return;
    const stored = localStorage.getItem('activeFacilityId');
    const initial =
      (stored && myFacilities.find((f) => f.id === stored)?.id) || myFacilities[0].id;
    setSelectedId(initial);
  }, [myFacilities, selectedId]);

  const facility = myFacilities.find((f) => f.id === selectedId) || myFacilities[0] || null;

  const { data: locations = [], isLoading: locationsLoading } = useQuery<LocationItem[]>({
    queryKey: ['my-facility-locations', facility?.id],
    queryFn: async () => {
      if (!facility?.id) return [];
      const res = await api.get(`/locations?facilityId=${facility.id}`);
      if (!res.ok) throw new Error('Lokasyonlar yüklenemedi');
      return res.json();
    },
    enabled: !!facility?.id,
  });

  const filteredLocations = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return locations;
    return locations.filter((loc) => {
      const p = extractLocationParts(loc);
      return (
        p.buildingName.toLowerCase().includes(q) ||
        p.block.toLowerCase().includes(q) ||
        p.floor.toLowerCase().includes(q) ||
        p.department.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q)
      );
    });
  }, [locations, searchQuery]);

  // Bina -> Blok -> Kat -> Birim -> Mahaller ağacı
  const hierarchy = useMemo(() => {
    const tree: Record<string, Record<string, Record<string, Record<string, LocationItem[]>>>> = {};
    filteredLocations.forEach((loc) => {
      const parts = extractLocationParts(loc);
      const bName = parts.buildingName || 'Ana Bina';
      const blk = parts.block || 'Blok Belirtilmemiş';
      const flr = parts.floor || 'Kat Belirtilmemiş';
      const dept = parts.department || 'Birim Belirtilmemiş';

      if (!tree[bName]) tree[bName] = {};
      if (!tree[bName][blk]) tree[bName][blk] = {};
      if (!tree[bName][blk][flr]) tree[bName][blk][flr] = {};
      if (!tree[bName][blk][flr][dept]) tree[bName][blk][flr][dept] = [];
      tree[bName][blk][flr][dept].push(loc);
    });
    return tree;
  }, [filteredLocations]);

  const stats = useMemo(() => {
    const buildingNames = new Set<string>();
    const blocks = new Set<string>();
    const floors = new Set<string>();
    const departments = new Set<string>();
    locations.forEach((loc) => {
      const p = extractLocationParts(loc);
      if (p.buildingName) buildingNames.add(p.buildingName);
      if (p.block) blocks.add(`${p.buildingName}|${p.block}`);
      if (p.floor) floors.add(`${p.buildingName}|${p.block}|${p.floor}`);
      if (p.department) departments.add(p.department);
    });
    return {
      buildings: buildingNames.size,
      blocks: blocks.size,
      floors: floors.size,
      departments: departments.size,
      total: locations.length,
    };
  }, [locations]);

  const toggleNode = (key: string) => {
    setExpandedNodes((prev) => ({ ...prev, [key]: !(prev[key] ?? true) }));
  };

  const isExpanded = (key: string) => expandedNodes[key] ?? true;

  return (
    <div className="max-w-6xl mx-auto space-y-5 pb-10">
      {/* Üst Başlık */}
      <Card className="rounded-lg border-border/80">
        <CardContent className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-11 h-11 rounded-lg bg-primary/10 text-primary border border-primary/20 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5" />
            </div>
            <div className="min-w-0 space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-lg font-bold tracking-tight text-foreground truncate">
                  Lokasyon ve Kat / Blok Bilgileri
                </h1>
                {facility && (
                  <Badge variant="outline" className="text-[11px] font-medium">
                    {facility.name}
                  </Badge>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Atanmış olduğunuz tesisin bina, blok, kat, birim ve mahal hiyerarşisi.
              </p>
            </div>
          </div>

          {myFacilities.length > 1 && (
            <Select value={selectedId} onValueChange={setSelectedId}>
              <SelectTrigger className="h-8 w-[240px] text-xs shrink-0">
                <SelectValue placeholder="Tesis seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {myFacilities.map((f) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs">
                    {f.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </CardContent>
      </Card>

      {facilitiesLoading ? (
        <div className="h-40 rounded-lg bg-muted animate-pulse" />
      ) : !facility ? (
        <Card className="rounded-lg border-border/80">
          <CardContent className="py-10 text-center space-y-2">
            <AlertCircle className="w-7 h-7 text-muted-foreground mx-auto" />
            <p className="text-sm font-medium text-foreground">Atanmış tesis bulunamadı</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Özet Metrik Kartları */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            <Card className="rounded-lg border-border/80">
              <CardContent className="p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Bina
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums">{stats.buildings}</span>
              </CardContent>
            </Card>
            <Card className="rounded-lg border-border/80">
              <CardContent className="p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Blok
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums">{stats.blocks}</span>
              </CardContent>
            </Card>
            <Card className="rounded-lg border-border/80">
              <CardContent className="p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Kat
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums">{stats.floors}</span>
              </CardContent>
            </Card>
            <Card className="rounded-lg border-border/80">
              <CardContent className="p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block">
                  Birim / Bölüm
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums">{stats.departments}</span>
              </CardContent>
            </Card>
            <Card className="rounded-lg border-primary/25 bg-primary/5 col-span-2 sm:col-span-1">
              <CardContent className="p-3.5">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block">
                  Toplam Mahal
                </span>
                <span className="text-lg font-bold text-foreground tabular-nums">{stats.total}</span>
              </CardContent>
            </Card>
          </div>

          {/* Bina / Blok Kayıt Özeti (Tesis kartından) */}
          {facility.buildings && facility.buildings.length > 0 && (
            <Card className="rounded-lg border-border/80">
              <CardHeader className="pb-2.5 border-b border-border bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Building className="w-4 h-4 text-primary" />
                  Kayıtlı Bina ve Blok Yapısı
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 flex flex-wrap gap-2.5">
                {facility.buildings.map((b, i) => (
                  <div key={b.id || i} className="px-3 py-2 rounded-lg border border-border/70 bg-muted/20 text-xs flex items-center gap-2.5">
                    <Building2 className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="font-semibold text-foreground">{b.name}</span>
                    {b.buildingFloors != null && (
                      <Badge variant="secondary" className="text-[10px] tabular-nums">
                        {b.buildingFloors} Kat
                      </Badge>
                    )}
                    {b.closedArea != null && (
                      <span className="text-[11px] text-muted-foreground tabular-nums">
                        {b.closedArea} m²
                      </span>
                    )}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Kat / Blok / Birim / Mahal Ağacı */}
          <Card className="rounded-lg border-border/80">
            <CardHeader className="pb-3 border-b border-border bg-muted/20">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Bina, Blok, Kat ve Mahal Listesi
                  </CardTitle>
                  <CardDescription className="text-xs mt-0.5">
                    Bina, blok, kat veya mahal adına göre arama yapabilirsiniz.
                  </CardDescription>
                </div>
                <div className="relative w-full sm:w-64">
                  <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Kat, blok, birim veya mahal ara..."
                    className="h-8 pl-8 text-xs"
                  />
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-4">
              {locationsLoading ? (
                <div className="space-y-2">
                  <div className="h-10 rounded-lg bg-muted animate-pulse" />
                  <div className="h-10 rounded-lg bg-muted animate-pulse" />
                  <div className="h-10 rounded-lg bg-muted animate-pulse" />
                </div>
              ) : Object.keys(hierarchy).length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8 border border-dashed border-border rounded-lg">
                  {searchQuery ? 'Aramanızla eşleşen lokasyon bulunamadı.' : 'Bu tesise kayıtlı lokasyon bulunmuyor.'}
                </p>
              ) : (
                <div className="space-y-3">
                  {Object.entries(hierarchy).map(([bName, blocksObj]) => {
                    const bKey = `b:${bName}`;
                    const bOpen = isExpanded(bKey);
                    return (
                      <div key={bKey} className="rounded-lg border border-border/80 overflow-hidden">
                        <Button
                          type="button"
                          variant="ghost"
                          onClick={() => toggleNode(bKey)}
                          className="w-full justify-between h-10 px-3 bg-muted/30 hover:bg-muted/50 rounded-none text-xs font-bold"
                        >
                          <span className="flex items-center gap-2">
                            {bOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                            <Building className="w-3.5 h-3.5 text-primary" />
                            {bName}
                          </span>
                          <Badge variant="secondary" className="text-[10px] tabular-nums">
                            {Object.keys(blocksObj).length} Blok
                          </Badge>
                        </Button>

                        {bOpen && (
                          <div className="p-3 space-y-2.5 bg-card">
                            {Object.entries(blocksObj).map(([blk, floorsObj]) => {
                              const blkKey = `${bKey}|blk:${blk}`;
                              const blkOpen = isExpanded(blkKey);
                              return (
                                <div key={blkKey} className="rounded-md border border-border/60">
                                  <button
                                    type="button"
                                    onClick={() => toggleNode(blkKey)}
                                    className="w-full flex items-center justify-between px-3 py-2 text-xs font-semibold bg-muted/15 hover:bg-muted/30 transition-colors"
                                  >
                                    <span className="flex items-center gap-1.5">
                                      {blkOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                      <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                                      {blk}
                                    </span>
                                    <span className="text-[11px] text-muted-foreground tabular-nums">
                                      {Object.keys(floorsObj).length} Kat
                                    </span>
                                  </button>

                                  {blkOpen && (
                                    <div className="p-2.5 space-y-2">
                                      {Object.entries(floorsObj).map(([flr, deptsObj]) => {
                                        const flrKey = `${blkKey}|flr:${flr}`;
                                        const flrOpen = isExpanded(flrKey);
                                        return (
                                          <div key={flrKey} className="pl-2 border-l-2 border-primary/20 space-y-1.5">
                                            <button
                                              type="button"
                                              onClick={() => toggleNode(flrKey)}
                                              className="flex items-center gap-1.5 text-xs font-semibold text-foreground hover:text-primary transition-colors"
                                            >
                                              {flrOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                                              <Layers className="w-3 h-3 text-primary" />
                                              <span>{flr}</span>
                                              <Badge variant="outline" className="text-[10px] ml-1 tabular-nums">
                                                {Object.keys(deptsObj).length} Birim
                                              </Badge>
                                            </button>

                                            {flrOpen && (
                                              <div className="pl-4 space-y-1.5">
                                                {Object.entries(deptsObj).map(([dept, items]) => (
                                                  <div key={dept} className="rounded-md border border-border/50 bg-muted/10 p-2 space-y-1.5">
                                                    <div className="flex items-center justify-between gap-2">
                                                      <span className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                                                        <Briefcase className="w-3 h-3 text-muted-foreground" />
                                                        {dept}
                                                      </span>
                                                      <span className="text-[10px] text-muted-foreground tabular-nums">
                                                        {items.length} mahal
                                                      </span>
                                                    </div>
                                                    <div className="flex flex-wrap gap-1.5">
                                                      {items.map((item) => {
                                                        const p = extractLocationParts(item);
                                                        const label = p.description || item.name || 'Mahal';
                                                        return (
                                                          <span
                                                            key={item.id}
                                                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-background border border-border/70 text-[11px] text-foreground"
                                                          >
                                                            <DoorOpen className="w-2.5 h-2.5 text-muted-foreground" />
                                                            {label}
                                                          </span>
                                                        );
                                                      })}
                                                    </div>
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
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
