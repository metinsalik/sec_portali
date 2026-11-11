import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Building,
  Building2,
  PackageSearch,
  Search,
  MapPin,
  Printer,
  ChevronRight,
  ChevronDown,
  LayoutGrid,
  ListTree,
  ArrowRight,
  Plus,
  Briefcase,
  DoorOpen,
  Layers,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DepartmentPrintModal } from '@/components/hazmat/DepartmentPrintModal';
import { HazmatMaterialSummaryDialog } from '@/components/hazmat/HazmatMaterialSummaryDialog';
import { Badge } from '@/components/ui/badge';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { getBlockCode, getFloorCode } from '@/data/locationStandards';
import {
  encodeGroup5LocationId,
  extractLocationParts,
  getLocationPathSegments,
} from '@/utils/locationHierarchy';

export default function HazmatDepartmentsPage() {
  const navigate = useNavigate();
  const activeFacilityId = useActiveFacility();
  const hasValidFacility = Boolean(activeFacilityId && activeFacilityId !== 'ALL' && activeFacilityId !== 'all');

  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'tree' | 'card'>('tree');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});

  const [searchParams, setSearchParams] = useSearchParams();
  const pathParam = searchParams.get('path');
  const currentPath = pathParam ? pathParam.split('|').filter(Boolean) : [];

  const setCurrentPath = (newPath: string[]) => {
    if (newPath.length === 0) {
      searchParams.delete('path');
    } else {
      searchParams.set('path', newPath.join('|'));
    }
    setSearchParams(searchParams);
  };

  // Print state
  const [printData, setPrintData] = useState<{ department: any; items: any[] } | null>(null);
  const [isPrintOpen, setIsPrintOpen] = useState(false);

  // Dialog state
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);

  const { data: summaryData } = useQuery({
    queryKey: ['inventory-summary', activeFacilityId],
    queryFn: async () => {
      if (!hasValidFacility || !activeFacilityId) return [];
      const res = await api.get(`/hazmat/inventory/summary?facilityId=${activeFacilityId}`);
      if (!res.ok) throw new Error('Hata');
      const data = await res.json();
      return data.facilityItems || [];
    },
    refetchOnMount: 'always',
    enabled: hasValidFacility,
  });

  const { data: departments = [], isLoading } = useQuery({
    queryKey: ['facility-locations', activeFacilityId],
    queryFn: async () => {
      if (!hasValidFacility || !activeFacilityId) return [];
      const res = await api.get(`/risks/facilities/${activeFacilityId}/locations`);
      if (!res.ok) throw new Error('Hata');
      return res.json();
    },
    refetchOnMount: 'always',
    enabled: hasValidFacility,
  });

  // Map locationId -> distinct material count & materials summary from summaryData
  const materialCountByLocationId = useMemo(() => {
    const map = new Map<string, Set<string>>();
    if (!Array.isArray(summaryData)) return map;

    summaryData.forEach((facItem: any) => {
      const mat = facItem.material;
      if (!mat || !Array.isArray(mat.inventory)) return;
      mat.inventory.forEach((invItem: any) => {
        const dept = invItem.location || invItem.department;
        if (!dept || dept.isCleaningCart || dept.type === 'TEMIZLIK_ARABASI') return;
        const locId = dept.id || invItem.locationId;
        if (!locId) return;
        if (!map.has(locId)) map.set(locId, new Set());
        map.get(locId)!.add(mat.id);
      });
    });

    return map;
  }, [summaryData]);

  const countDistinctMaterialsForIds = (ids: string[]) => {
    const distinct = new Set<string>();
    ids.forEach((id) => {
      const set = materialCountByLocationId.get(id);
      if (set) {
        set.forEach((mId) => distinct.add(mId));
      }
    });
    return distinct.size;
  };

  // Find exact FacilityLocation row matching 5-level tuple
  const findExactLocationId = (
    bName: string,
    blk: string,
    flr: string,
    dept: string,
    desc: string
  ): string | undefined => {
    const found = departments.find((loc: any) => {
      const p = extractLocationParts(loc);
      return (
        p.buildingName.toLowerCase() === bName.toLowerCase() &&
        p.block.toLowerCase() === blk.toLowerCase() &&
        p.floor.toLowerCase() === flr.toLowerCase() &&
        p.department.toLowerCase() === dept.toLowerCase() &&
        p.description.toLowerCase() === desc.toLowerCase()
      );
    });
    return found?.id;
  };

  const resolveTargetId = (bName: string, blk: string, flr: string, dept: string, desc: string) => {
    return (
      findExactLocationId(bName, blk, flr, dept, desc) ||
      encodeGroup5LocationId({
        buildingName: bName,
        block: blk,
        floor: flr,
        department: dept,
        description: desc,
      })
    );
  };

  const goToAddChemical = (targetId: string) => {
    navigate(`/hazmat/inventory/new?departmentId=${encodeURIComponent(targetId)}`, {
      state: { returnTo: '/hazmat/departments' },
    });
  };

  const goToDepartmentView = (targetId: string) => {
    navigate(`/hazmat/departments/${encodeURIComponent(targetId)}`);
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [nodeId]: prev[nodeId] === undefined ? false : !prev[nodeId],
    }));
  };

  const isNodeExpanded = (nodeId: string, defaultOpen = true) => {
    return expandedNodes[nodeId] !== undefined ? expandedNodes[nodeId] : defaultOpen;
  };

  const handlePrint = async (levelName: string, ids: string[]) => {
    if (!ids || ids.length === 0) {
      alert('Bu konum altında yazdırılacak kayıt bulunamadı.');
      return;
    }
    try {
      const promises = ids.map((id) =>
        api
          .get(`/hazmat/inventory/department/${encodeURIComponent(id)}?facilityId=${activeFacilityId}`)
          .then((res) => res.json())
      );
      const results = await Promise.all(promises);

      let mergedItems: any[] = [];
      results.forEach((res) => {
        if (res.inventoryItems && res.department) {
          const deptName = res.department.name || 'İsimsiz Birim';
          const itemsWithDept = res.inventoryItems.map((item: any) => ({
            ...item,
            _departmentName: deptName,
          }));
          mergedItems = [...mergedItems, ...itemsWithDept];
        } else if (res.inventoryItems) {
          mergedItems = [...mergedItems, ...res.inventoryItems];
        }
      });

      const finalItems = mergedItems.sort((a, b) => {
        const deptComp = (a._departmentName || '').localeCompare(b._departmentName || '');
        if (deptComp !== 0) return deptComp;
        const nameA = a.material?.productName || '';
        const nameB = b.material?.productName || '';
        return nameA.localeCompare(nameB);
      });

      setPrintData({
        department: { name: levelName },
        items: finalItems,
      });
      setIsPrintOpen(true);
    } catch (err) {
      console.error(err);
      alert('Yazdırma verileri alınırken hata oluştu.');
    }
  };

  // 5-Seviyeli Ağaç Yapısı (/settings/locations ile birebir aynı yapı)
  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    const q = searchTerm.trim().toLowerCase();

    departments.forEach((loc: any) => {
      if (loc.isCleaningCart || loc.type === 'TEMIZLIK_ARABASI') return;
      const p = extractLocationParts(loc);
      const bName = p.buildingName || loc.name || 'Bina Belirtilmemiş';
      const blk = p.block || 'Blok Belirtilmemiş';
      const flr = p.floor;
      const dept = p.department;
      const desc = p.description;

      if (q) {
        const hay = [bName, p.block, flr, dept, desc, loc.name].filter(Boolean).join(' ').toLowerCase();
        if (!hay.includes(q)) return;
      }

      const bId = `bn-${bName}`;
      if (!root[bName]) {
        root[bName] = { id: bId, name: bName, blocks: {}, allIds: [] as string[] };
      }
      root[bName].allIds.push(loc.id);

      const blkId = `blk-${bName}-${blk}`;
      if (!root[bName].blocks[blk]) {
        root[bName].blocks[blk] = {
          id: blkId,
          name: blk,
          isPlaceholder: !p.block,
          floors: {},
          allIds: [] as string[],
        };
      }
      root[bName].blocks[blk].allIds.push(loc.id);

      if (!flr && !dept && !desc) return;

      const flrKey = flr || 'Kat Belirtilmemiş';
      const flrId = `flr-${bName}-${blk}-${flrKey}`;
      if (!root[bName].blocks[blk].floors[flrKey]) {
        root[bName].blocks[blk].floors[flrKey] = {
          id: flrId,
          name: flrKey,
          isPlaceholder: !flr,
          departments: {},
          allIds: [] as string[],
        };
      }
      root[bName].blocks[blk].floors[flrKey].allIds.push(loc.id);

      if (!dept && !desc) return;

      const deptKey = dept || 'Birim Belirtilmemiş';
      const deptId = `dept-${bName}-${blk}-${flrKey}-${deptKey}`;
      if (!root[bName].blocks[blk].floors[flrKey].departments[deptKey]) {
        root[bName].blocks[blk].floors[flrKey].departments[deptKey] = {
          id: deptId,
          name: deptKey,
          isPlaceholder: !dept,
          rooms: [],
          allIds: [] as string[],
        };
      }
      root[bName].blocks[blk].floors[flrKey].departments[deptKey].allIds.push(loc.id);

      if (desc) {
        root[bName].blocks[blk].floors[flrKey].departments[deptKey].rooms.push({
          id: loc.id,
          name: desc,
          loc,
        });
      }
    });

    return root;
  }, [departments, searchTerm]);

  // Klasör / Kart görünümü için türetilmiş veriler
  const { exactInventory, subInventory } = useMemo(() => {
    if (!summaryData || currentPath.length === 0) return { exactInventory: [], subInventory: [] };
    const exact: any[] = [];
    const sub: any[] = [];

    summaryData.forEach((facItem: any) => {
      const mat = facItem.material;
      if (!mat || !mat.inventory) return;

      mat.inventory.forEach((invItem: any) => {
        const dept = invItem.location || invItem.department;
        if (!dept || dept.isCleaningCart || dept.type === 'TEMIZLIK_ARABASI') return;

        const locPath = getLocationPathSegments(dept);
        let matchesPath = true;
        for (let i = 0; i < currentPath.length; i++) {
          if (locPath[i] !== currentPath[i]) {
            matchesPath = false;
            break;
          }
        }
        if (!matchesPath) return;

        const isExact = locPath.length === currentPath.length;
        const itemObj = {
          id: invItem.id,
          material: mat,
          productName: mat.productName,
          brandName: mat.brandName,
          categoryName: mat.category?.name || 'Kategorisiz',
          department: dept,
          amountValue: facItem.amountValue,
          unitName: facItem.unit?.name,
          minQuantity: invItem.minQuantity,
          maxQuantity: invItem.maxQuantity,
          hazardLabels: mat.hazardLabels || [],
        };

        if (isExact) exact.push(itemObj);
        else sub.push(itemObj);
      });
    });

    return {
      exactInventory: exact.sort((a, b) => a.productName.localeCompare(b.productName)),
      subInventory: sub.sort((a, b) => a.productName.localeCompare(b.productName)),
    };
  }, [summaryData, currentPath]);

  const filteredDepartments = departments.filter((d: any) => {
    if (d.isCleaningCart || d.type === 'TEMIZLIK_ARABASI') return false;
    const locPath = getLocationPathSegments(d);
    if (locPath.length <= currentPath.length) return false;
    for (let i = 0; i < currentPath.length; i++) {
      if (locPath[i] !== currentPath[i]) return false;
    }
    return true;
  });

  const nextLevelIndex = currentPath.length;
  const childrenMap = new Map<string, { count: number; ids: string[]; isLeaf: boolean; exactId?: string; sampleParts: any }>();

  filteredDepartments.forEach((d: any) => {
    const locPath = getLocationPathSegments(d);
    const childName = locPath[nextLevelIndex];
    if (!childName) return;

    if (!childrenMap.has(childName)) {
      childrenMap.set(childName, {
        count: 0,
        ids: [],
        isLeaf: nextLevelIndex === locPath.length - 1,
        sampleParts: extractLocationParts(d),
      });
    }

    const child = childrenMap.get(childName)!;
    child.ids.push(d.id);

    if (locPath.length === nextLevelIndex + 1) {
      child.exactId = d.id;
      child.isLeaf = true;
    } else {
      child.isLeaf = false;
    }
  });

  childrenMap.forEach((childData) => {
    childData.count = countDistinctMaterialsForIds(childData.ids);
  });

  const displayChildren = Array.from(childrenMap.entries()).filter(([name]) =>
    name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!hasValidFacility) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Lütfen lokasyonları ve tehlikeli madde dağılımını görüntülemek için üst menüden tek bir tesis seçin.
      </div>
    );
  }

  if (isLoading) {
    return <div className="p-8 text-center text-muted-foreground">Yükleniyor...</div>;
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">Departmanlar (Lokasyonlar)</h1>
          <p className="text-muted-foreground text-sm">
            Tesisin fiziksel yapısına göre <strong>Bina &gt; Blok &gt; Kat &gt; Birim &gt; Mahal</strong> bazında tehlikeli madde tanımlayın veya envanteri inceleyin.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={() => navigate('/settings/locations')}>
          <Layers className="w-4 h-4 mr-2" />
          Lokasyon Yapısını Düzenle
        </Button>
      </div>

      {/* Arama & Görünüm Seçici */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center bg-card p-4 rounded-lg border">
        <div className="relative w-full sm:w-96">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Bina, blok, kat, birim veya mahal ara..."
            className="pl-9 bg-background"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-muted-foreground whitespace-nowrap">
            Toplam {departments.filter((d: any) => !d.isCleaningCart && d.type !== 'TEMIZLIK_ARABASI').length} Konum
          </span>
          <div className="flex bg-muted p-1 rounded-md">
            <Button
              variant={viewMode === 'tree' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode('tree')}
            >
              <ListTree className="w-4 h-4" /> Ağaç
            </Button>
            <Button
              variant={viewMode === 'card' ? 'secondary' : 'ghost'}
              size="sm"
              className="h-8 px-2.5 text-xs gap-1.5"
              onClick={() => setViewMode('card')}
            >
              <LayoutGrid className="w-4 h-4" /> Kart
            </Button>
          </div>
        </div>
      </div>

      {departments.length === 0 ? (
        <div className="text-center p-12 bg-muted/20 border rounded-lg">
          <Building2 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">Lokasyon Bulunamadı</h3>
          <p className="text-muted-foreground mb-4">
            Bu tesise henüz hiçbir fiziksel lokasyon tanımlanmamış.
          </p>
          <Button onClick={() => navigate('/settings/locations')}>Lokasyon Yönetimine Git</Button>
        </div>
      ) : viewMode === 'tree' ? (
        /* ==================== AĞAÇ GÖRÜNÜMÜ (/settings/locations ile birebir hiyerarşi) ==================== */
        Object.keys(tree).length === 0 ? (
          <div className="text-center p-12 bg-muted/20 border rounded-lg">
            <p className="text-muted-foreground">Aradığınız kritere uygun lokasyon bulunamadı.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {Object.values(tree).map((binaNode: any) => {
              const binaOpen = isNodeExpanded(binaNode.id, true);
              const binaMatCount = countDistinctMaterialsForIds(binaNode.allIds);
              const binaExactTarget = resolveTargetId(binaNode.name, '', '', '', '');

              return (
                <div key={binaNode.id} className="border border-border/70 rounded-lg overflow-hidden bg-card shadow-xs">
                  {/* SEVİYE 1: BİNA ADI */}
                  <div
                    onClick={() => toggleNode(binaNode.id)}
                    className="px-4 py-3 bg-muted/40 hover:bg-muted/60 cursor-pointer flex flex-wrap items-center justify-between gap-2 transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      {binaOpen ? (
                        <ChevronDown className="w-4 h-4 text-primary shrink-0" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                      )}
                      <Building className="w-4 h-4 text-primary shrink-0" />
                      <span className="text-sm font-bold text-foreground truncate">{binaNode.name}</span>
                      <Badge variant="secondary" className="text-[11px]">
                        {binaMatCount} Kimyasal
                      </Badge>
                    </div>

                    <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                      <Button
                        size="sm"
                        variant="outline"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => handlePrint(binaNode.name, binaNode.allIds)}
                      >
                        <Printer className="w-3.5 h-3.5 mr-1" /> Yazdır
                      </Button>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => goToAddChemical(binaExactTarget)}
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" /> Kimyasal Ekle
                      </Button>
                      <Button
                        size="sm"
                        className="h-7 px-2.5 text-xs"
                        onClick={() => goToDepartmentView(binaExactTarget)}
                      >
                        Envanter
                      </Button>
                    </div>
                  </div>

                  {/* SEVİYE 2: BLOKLAR */}
                  {binaOpen && (
                    <div className="divide-y divide-border/50">
                      {Object.values(binaNode.blocks).map((blokNode: any) => {
                        const blokOpen = isNodeExpanded(blokNode.id, true);
                        const blokMatCount = countDistinctMaterialsForIds(blokNode.allIds);
                        const bCode = !blokNode.isPlaceholder ? getBlockCode(blokNode.name) : '';
                        const realBlockName = blokNode.isPlaceholder ? '' : blokNode.name;
                        const blokTarget = !blokNode.isPlaceholder
                          ? resolveTargetId(binaNode.name, realBlockName, '', '', '')
                          : '';

                        return (
                          <div key={blokNode.id} className="bg-background">
                            <div
                              onClick={() => toggleNode(blokNode.id)}
                              className="pl-6 pr-4 py-2.5 bg-muted/20 hover:bg-muted/35 cursor-pointer flex flex-wrap items-center justify-between gap-2 transition-colors"
                            >
                              <div className="flex items-center gap-2 min-w-0">
                                {blokOpen ? (
                                  <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                ) : (
                                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                )}
                                <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                <span
                                  className={`text-xs font-semibold truncate ${
                                    blokNode.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'
                                  }`}
                                >
                                  {blokNode.isPlaceholder ? 'Tek Blok / Genel Blok' : blokNode.name}
                                </span>
                                {bCode && (
                                  <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 font-bold">
                                    {bCode}
                                  </Badge>
                                )}
                                <Badge variant="outline" className="text-[10px]">
                                  {blokMatCount} Kimyasal
                                </Badge>
                              </div>

                              {!blokNode.isPlaceholder && (
                                <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => handlePrint(`${binaNode.name} / ${blokNode.name}`, blokNode.allIds)}
                                  >
                                    <Printer className="w-3 h-3 mr-1" /> Yazdır
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="secondary"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => goToAddChemical(blokTarget)}
                                  >
                                    <Plus className="w-3 h-3 mr-1" /> Kimyasal Ekle
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="h-7 px-2 text-xs"
                                    onClick={() => goToDepartmentView(blokTarget)}
                                  >
                                    Envanter
                                  </Button>
                                </div>
                              )}
                            </div>

                            {/* SEVİYE 3: KATLAR */}
                            {blokOpen && (
                              <div className="pl-8 pr-4 py-2 space-y-2 bg-background">
                                {Object.keys(blokNode.floors).length === 0 ? (
                                  <div className="text-[11px] text-muted-foreground italic py-1 pl-2">
                                    Bu blok altında tanımlı kat yok.
                                  </div>
                                ) : (
                                  Object.values(blokNode.floors).map((floorNode: any) => {
                                    const flrOpen = isNodeExpanded(floorNode.id, true);
                                    const fCode = !floorNode.isPlaceholder ? getFloorCode(floorNode.name) : '';
                                    const realFloorName = floorNode.isPlaceholder ? '' : floorNode.name;
                                    const flrMatCount = countDistinctMaterialsForIds(floorNode.allIds);
                                    const flrTarget = resolveTargetId(binaNode.name, realBlockName, realFloorName, '', '');
                                    const deptCount = Object.keys(floorNode.departments).length;

                                    return (
                                      <div key={floorNode.id} className="border border-border/60 rounded-md overflow-hidden bg-muted/5">
                                        <div
                                          onClick={() => toggleNode(floorNode.id)}
                                          className="px-3 py-2 bg-muted/15 hover:bg-muted/30 cursor-pointer flex flex-wrap items-center justify-between gap-2"
                                        >
                                          <div className="flex items-center gap-2 min-w-0">
                                            {flrOpen ? (
                                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            ) : (
                                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                                            )}
                                            <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                            <span className="text-xs font-semibold text-foreground truncate">{floorNode.name}</span>
                                            {fCode && (
                                              <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 text-primary border-primary/30 font-bold">
                                                {fCode}
                                              </Badge>
                                            )}
                                            <Badge variant="secondary" className="text-[10px]">
                                              {flrMatCount} Kimyasal
                                            </Badge>
                                          </div>

                                          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 px-2 text-[11px]"
                                              onClick={() =>
                                                handlePrint(
                                                  [binaNode.name, realBlockName, floorNode.name].filter(Boolean).join(' / '),
                                                  floorNode.allIds
                                                )
                                              }
                                            >
                                              <Printer className="w-3 h-3 mr-1" /> Yazdır
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="secondary"
                                              className="h-6 px-2 text-[11px]"
                                              onClick={() => goToAddChemical(flrTarget)}
                                            >
                                              <Plus className="w-3 h-3 mr-1" /> Kimyasal Ekle
                                            </Button>
                                            <Button
                                              size="sm"
                                              variant="outline"
                                              className="h-6 px-2 text-[11px]"
                                              onClick={() => goToDepartmentView(flrTarget)}
                                            >
                                              Envanter
                                            </Button>
                                          </div>
                                        </div>

                                        {/* SEVİYE 4: BİRİMLER */}
                                        {flrOpen && deptCount > 0 && (
                                          <div className="pl-6 pr-2.5 py-2 space-y-1.5 border-t border-border/40 bg-background/60">
                                            {Object.values(floorNode.departments).map((deptNode: any) => {
                                              const deptOpen = isNodeExpanded(deptNode.id, true);
                                              const realDeptName = deptNode.isPlaceholder ? '' : deptNode.name;
                                              const deptMatCount = countDistinctMaterialsForIds(deptNode.allIds);
                                              const deptTarget = resolveTargetId(
                                                binaNode.name,
                                                realBlockName,
                                                realFloorName,
                                                realDeptName,
                                                ''
                                              );

                                              return (
                                                <div key={deptNode.id} className="border border-border/50 rounded bg-card">
                                                  <div
                                                    onClick={() => toggleNode(deptNode.id)}
                                                    className="px-2.5 py-1.5 hover:bg-muted/20 cursor-pointer flex flex-wrap items-center justify-between gap-2"
                                                  >
                                                    <div className="flex items-center gap-1.5 min-w-0">
                                                      {deptNode.rooms.length > 0 ? (
                                                        deptOpen ? (
                                                          <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        ) : (
                                                          <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                                        )
                                                      ) : (
                                                        <span className="w-3 shrink-0" />
                                                      )}
                                                      <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                      <span
                                                        className={`text-xs font-medium truncate ${
                                                          deptNode.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'
                                                        }`}
                                                      >
                                                        {deptNode.name}
                                                      </span>
                                                      <Badge variant="outline" className="text-[10px] py-0 px-1.5">
                                                        {deptMatCount} Kimyasal
                                                      </Badge>
                                                    </div>

                                                    {!deptNode.isPlaceholder && (
                                                      <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                        <Button
                                                          size="sm"
                                                          variant="ghost"
                                                          className="h-6 px-2 text-[11px]"
                                                          onClick={() =>
                                                            handlePrint(
                                                              [binaNode.name, realBlockName, floorNode.name, deptNode.name]
                                                                .filter(Boolean)
                                                                .join(' / '),
                                                              deptNode.allIds
                                                            )
                                                          }
                                                        >
                                                          <Printer className="w-3 h-3 mr-1" /> Yazdır
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="secondary"
                                                          className="h-6 px-2 text-[11px]"
                                                          onClick={() => goToAddChemical(deptTarget)}
                                                        >
                                                          <Plus className="w-3 h-3 mr-1" /> Kimyasal Ekle
                                                        </Button>
                                                        <Button
                                                          size="sm"
                                                          variant="outline"
                                                          className="h-6 px-2 text-[11px]"
                                                          onClick={() => goToDepartmentView(deptTarget)}
                                                        >
                                                          Envanter
                                                        </Button>
                                                      </div>
                                                    )}
                                                  </div>

                                                  {/* SEVİYE 5: MAHALLER */}
                                                  {deptOpen && deptNode.rooms.length > 0 && (
                                                    <div className="pl-7 pr-2.5 py-2 space-y-1.5 border-t border-border/30 bg-muted/10">
                                                      {deptNode.rooms.map((room: any) => {
                                                        const roomMatCount = countDistinctMaterialsForIds([room.id]);
                                                        return (
                                                          <div
                                                            key={room.id}
                                                            onClick={() => goToDepartmentView(room.id)}
                                                            className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1.5 rounded bg-background border border-border/60 hover:border-primary/40 cursor-pointer transition-colors"
                                                          >
                                                            <div className="flex items-center gap-2 min-w-0">
                                                              <DoorOpen className="w-3.5 h-3.5 text-sky-600 shrink-0" />
                                                              <span className="text-xs font-medium text-foreground truncate">
                                                                {room.name}
                                                              </span>
                                                              <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                                                {roomMatCount} Kimyasal
                                                              </Badge>
                                                            </div>
                                                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                                                              <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                className="h-6 px-2 text-[11px]"
                                                                onClick={() =>
                                                                  handlePrint(
                                                                    [binaNode.name, realBlockName, floorNode.name, realDeptName, room.name]
                                                                      .filter(Boolean)
                                                                      .join(' / '),
                                                                    [room.id]
                                                                  )
                                                                }
                                                              >
                                                                <Printer className="w-3 h-3 mr-1" /> Yazdır
                                                              </Button>
                                                              <Button
                                                                size="sm"
                                                                variant="secondary"
                                                                className="h-6 px-2 text-[11px]"
                                                                onClick={() => goToAddChemical(room.id)}
                                                              >
                                                                <Plus className="w-3 h-3 mr-1" /> Kimyasal Ekle
                                                              </Button>
                                                              <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="h-6 px-2 text-[11px]"
                                                                onClick={() => goToDepartmentView(room.id)}
                                                              >
                                                                Envanter
                                                              </Button>
                                                            </div>
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
                                  })
                                )}
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
        )
      ) : (
        /* ==================== KART / KLASÖR GÖRÜNÜMÜ ==================== */
        <>
          <div className="bg-muted/20 p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
              <span
                className={`cursor-pointer hover:text-foreground hover:underline ${currentPath.length === 0 ? 'font-semibold text-foreground' : ''}`}
                onClick={() => setCurrentPath([])}
              >
                Tesis Ana Görünümü
              </span>
              {currentPath.map((pathItem, index) => (
                <div key={index} className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  <span
                    className={`cursor-pointer hover:text-foreground hover:underline ${index === currentPath.length - 1 ? 'font-semibold text-foreground' : ''}`}
                    onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                  >
                    {pathItem}
                  </span>
                </div>
              ))}
            </div>
            {currentPath.length > 0 && (
              <Button size="sm" variant="outline" onClick={() => handlePrint(currentPath.join(' / '), filteredDepartments.map((d: any) => d.id))}>
                <Printer className="w-4 h-4 mr-2" /> Toplu Yazdır
              </Button>
            )}
          </div>

          {displayChildren.length === 0 ? (
            <div className="text-center p-12 bg-muted/20 border rounded-lg">
              <p className="text-muted-foreground">Aradığınız kritere uygun alt konum bulunamadı.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayChildren.map(([name, data]) => {
                const fullSegments = [...currentPath, name];
                const sample = data.sampleParts || {};
                const groupTarget =
                  data.exactId ||
                  encodeGroup5LocationId({
                    buildingName: fullSegments[0] || sample.buildingName || '',
                    block: sample.block && fullSegments[1] === sample.block ? fullSegments[1] : '',
                    floor: fullSegments.find((_, idx) => idx >= 1 && fullSegments[idx] === sample.floor) || '',
                    department: fullSegments.find((_, idx) => idx >= 1 && fullSegments[idx] === sample.department) || '',
                    description: fullSegments.find((_, idx) => idx >= 1 && fullSegments[idx] === sample.description) || '',
                  });

                return (
                  <Card
                    key={name}
                    className="cursor-pointer hover:shadow-md transition-all hover:border-primary/50 group flex flex-col"
                    onClick={() => {
                      if (data.isLeaf && data.exactId) {
                        goToDepartmentView(data.exactId);
                      } else {
                        setCurrentPath(fullSegments);
                      }
                    }}
                  >
                    <CardHeader className="pb-3 flex-1">
                      <CardTitle className="text-lg flex items-center gap-2 group-hover:text-primary transition-colors">
                        <MapPin className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
                        {name}
                      </CardTitle>
                      <CardDescription>
                        {data.isLeaf ? 'Son Seviye' : 'Alt Seviyelere Gitmek İçin Tıklayın'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm p-3 bg-muted/30 rounded-lg">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <PackageSearch className="w-4 h-4" />
                          <span>Tehlikeli Madde Çeşidi:</span>
                        </div>
                        <span className="font-semibold text-base">{data.count}</span>
                      </div>
                      <div className="flex gap-2 flex-col sm:flex-row">
                        <Button
                          variant="outline"
                          size="sm"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            handlePrint(fullSegments.join(' / '), data.ids);
                          }}
                        >
                          <Printer className="w-4 h-4 mr-2" /> Yazdır
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          className="flex-1"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToAddChemical(groupTarget);
                          }}
                        >
                          <Plus className="w-4 h-4 mr-2" /> Ekle
                        </Button>
                        {data.isLeaf && data.exactId ? (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              goToDepartmentView(data.exactId!);
                            }}
                          >
                            Envanter
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                              e.stopPropagation();
                              setCurrentPath(fullSegments);
                            }}
                          >
                            İçine Gir <ArrowRight className="w-4 h-4 ml-2" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {currentPath.length > 0 && (exactInventory.length > 0 || subInventory.length > 0) && (
            <Card className="border-primary/20 shadow-sm mt-8">
              <CardHeader>
                <CardTitle>Bu Seviyedeki Tehlikeli Maddeler</CardTitle>
                <CardDescription>Seçili konum ve alt konumlarına atanmış tehlikeli maddeler.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-muted/50 text-muted-foreground">
                      <tr>
                        <th className="px-4 py-3 font-medium">Ürün Ticari Adı</th>
                        <th className="px-4 py-3 font-medium">Kategori</th>
                        <th className="px-4 py-3 font-medium">Konum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {[...exactInventory, ...subInventory].map((item: any) => (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/30 cursor-pointer"
                          onClick={() => setSelectedMaterial(item)}
                        >
                          <td className="px-4 py-3 font-medium">{item.productName}</td>
                          <td className="px-4 py-3 text-muted-foreground">{item.categoryName}</td>
                          <td className="px-4 py-3">
                            <Badge variant="secondary" className="font-normal">
                              {getLocationPathSegments(item.department).join(' / ') || 'Bilinmiyor'}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}

      <HazmatMaterialSummaryDialog
        material={selectedMaterial?.material}
        isOpen={!!selectedMaterial}
        onOpenChange={(open) => !open && setSelectedMaterial(null)}
        amountValue={selectedMaterial?.amountValue}
        unitName={selectedMaterial?.unitName}
        onNavigateToPool={() => {
          setSelectedMaterial(null);
          navigate(`/hazmat/materials/view/${selectedMaterial?.material?.id}`, { state: { returnTo: '/hazmat/departments' } });
        }}
        onNavigateToLocations={() => {
          setSelectedMaterial(null);
          navigate(`/hazmat/inventory/material/${selectedMaterial?.material?.id}`, { state: { returnTo: '/hazmat/departments' } });
        }}
      />

      {printData && (
        <DepartmentPrintModal
          isOpen={isPrintOpen}
          onClose={() => setIsPrintOpen(false)}
          department={printData.department}
          inventoryItems={printData.items}
        />
      )}
    </div>
  );
}
