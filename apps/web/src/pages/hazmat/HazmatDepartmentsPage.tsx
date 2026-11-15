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
import { HazmatAddDepartmentModal } from '@/components/hazmat/HazmatAddDepartmentModal';
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
  const [viewMode, setViewMode] = useState<'tree' | 'card'>('card');
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

  // Add Department/Location Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [addModalInitialValues, setAddModalInitialValues] = useState<{
    buildingName?: string;
    block?: string;
    floor?: string;
    department?: string;
  } | undefined>(undefined);

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

  // Normalleştirilmiş Lokasyon Listesi (4 Seviyeli: Bina > Kat > Birim > Mahal)
  interface NormalizedLocItem {
    id: string;
    buildingName: string;
    block: string;
    floor: string;
    floorLabel: string;
    department: string;
    mahal: string;
    raw: any;
  }

  const normalizedLocations = useMemo(() => {
    return departments
      .filter((d: any) => !d.isCleaningCart && d.type !== 'TEMIZLIK_ARABASI')
      .map((d: any): NormalizedLocItem => {
        const p = extractLocationParts(d);
        const buildingName = p.buildingName || d.name || 'Ana Bina';
        const block =
          p.block && p.block.toLowerCase() !== 'genel blok' && p.block.toLowerCase() !== 'tek blok'
            ? p.block
            : '';
        const floor = p.floor || 'Kat Belirtilmemiş';
        const floorLabel = block ? `${block} - ${floor}` : floor;
        const department = p.department || '';
        const mahal = p.description || '';
        return {
          id: d.id,
          buildingName,
          block,
          floor,
          floorLabel,
          department,
          mahal,
          raw: d,
        };
      });
  }, [departments]);

  // Klasör / Kart görünümü için türetilmiş envanter verileri (Seçili hiyerarşiye göre)
  const currentLevelChemicals = useMemo(() => {
    if (!summaryData || currentPath.length === 0) return [];
    const list: any[] = [];

    summaryData.forEach((facItem: any) => {
      const mat = facItem.material;
      if (!mat || !mat.inventory) return;

      mat.inventory.forEach((invItem: any) => {
        const dept = invItem.location || invItem.department;
        if (!dept || dept.isCleaningCart || dept.type === 'TEMIZLIK_ARABASI') return;

        const p = extractLocationParts(dept);
        const bName = p.buildingName || dept.name || 'Ana Bina';
        const blk =
          p.block && p.block.toLowerCase() !== 'genel blok' && p.block.toLowerCase() !== 'tek blok'
            ? p.block
            : '';
        const flr = p.floor || 'Kat Belirtilmemiş';
        const flrKey = blk ? `${blk} - ${flr}` : flr;
        const deptKey = p.department || 'Genel Birim';
        const mahalKey = p.description || '';

        // Hiyerarşik eşleşme kontrolü
        if (currentPath[0] && bName.toLowerCase() !== currentPath[0].toLowerCase()) return;
        if (currentPath[1] && flrKey.toLowerCase() !== currentPath[1].toLowerCase()) return;
        if (currentPath[2] && deptKey.toLowerCase() !== currentPath[2].toLowerCase()) return;
        if (currentPath[3] && mahalKey.toLowerCase() !== currentPath[3].toLowerCase()) return;

        list.push({
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
        });
      });
    });

    return list.sort((a, b) => a.productName.localeCompare(b.productName));
  }, [summaryData, currentPath]);

  // 4-Seviyeli Kart Listesi: Ana Bina (0) > Katlar (1) > Birimler (2) > Mahaller (3)
  interface DrillCard {
    key: string;
    name: string;
    level: 'bina' | 'kat' | 'birim' | 'mahal';
    badgeLabel: string;
    badgeStyle: string;
    description: string;
    matCount: number;
    subCount: number;
    subLabel: string;
    ids: string[];
    targetPath: string[];
    isLeaf: boolean;
    leafId?: string;
    sampleParts: Partial<NormalizedLocItem>;
  }

  const currentCards = useMemo(() => {
    const level = currentPath.length;
    const cards: DrillCard[] = [];

    if (level === 0) {
      // SEVİYE 0: BİNALAR
      const groups = new Map<string, NormalizedLocItem[]>();
      normalizedLocations.forEach((loc) => {
        const b = loc.buildingName;
        if (!groups.has(b)) groups.set(b, []);
        groups.get(b)!.push(loc);
      });

      groups.forEach((items, bName) => {
        const ids = items.map((i) => i.id);
        const distinctFloors = new Set(items.map((i) => i.floorLabel)).size;
        cards.push({
          key: `bina-${bName}`,
          name: bName,
          level: 'bina',
          badgeLabel: 'Bina',
          badgeStyle: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
          description: 'Binaya ait katları görmek için tıklayın',
          matCount: countDistinctMaterialsForIds(ids),
          subCount: distinctFloors,
          subLabel: `${distinctFloors} Kat`,
          ids,
          targetPath: [bName],
          isLeaf: false,
          sampleParts: items[0] || {},
        });
      });
    } else if (level === 1) {
      // SEVİYE 1: KATLAR (currentPath[0] binasındaki)
      const bName = currentPath[0];
      const itemsInBuilding = normalizedLocations.filter(
        (loc) => loc.buildingName.toLowerCase() === bName.toLowerCase()
      );

      const groups = new Map<string, NormalizedLocItem[]>();
      itemsInBuilding.forEach((loc) => {
        const flr = loc.floorLabel;
        if (!groups.has(flr)) groups.set(flr, []);
        groups.get(flr)!.push(loc);
      });

      groups.forEach((items, flrLabel) => {
        const ids = items.map((i) => i.id);
        const distinctDepts = new Set(
          items.map((i) => i.department).filter(Boolean)
        ).size;
        cards.push({
          key: `kat-${bName}-${flrLabel}`,
          name: flrLabel,
          level: 'kat',
          badgeLabel: 'Kat',
          badgeStyle: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
          description: 'Kata ait birimleri görmek için tıklayın',
          matCount: countDistinctMaterialsForIds(ids),
          subCount: distinctDepts,
          subLabel: `${distinctDepts} Birim`,
          ids,
          targetPath: [bName, flrLabel],
          isLeaf: false,
          sampleParts: items[0] || {},
        });
      });
    } else if (level === 2) {
      // SEVİYE 2: BİRİMLER (currentPath[0] binası, currentPath[1] katındaki)
      const bName = currentPath[0];
      const flrLabel = currentPath[1];
      const itemsInFloor = normalizedLocations.filter(
        (loc) =>
          loc.buildingName.toLowerCase() === bName.toLowerCase() &&
          loc.floorLabel.toLowerCase() === flrLabel.toLowerCase()
      );

      const groups = new Map<string, NormalizedLocItem[]>();
      itemsInFloor.forEach((loc) => {
        const dept = loc.department || 'Genel Birim';
        if (!groups.has(dept)) groups.set(dept, []);
        groups.get(dept)!.push(loc);
      });

      groups.forEach((items, deptLabel) => {
        const ids = items.map((i) => i.id);
        const distinctMahals = items.filter((i) => Boolean(i.mahal));
        const hasMahals = distinctMahals.length > 0;
        const leafId = items[0]?.id;

        cards.push({
          key: `dept-${bName}-${flrLabel}-${deptLabel}`,
          name: deptLabel,
          level: 'birim',
          badgeLabel: 'Birim',
          badgeStyle: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
          description: hasMahals
            ? 'Birime ait mahalleri görmek için tıklayın'
            : 'Tanımlı mahal yok (Envanteri görüntüleyebilirsiniz)',
          matCount: countDistinctMaterialsForIds(ids),
          subCount: distinctMahals.length,
          subLabel: `${distinctMahals.length} Mahal`,
          ids,
          targetPath: [bName, flrLabel, deptLabel],
          isLeaf: !hasMahals,
          leafId,
          sampleParts: items[0] || {},
        });
      });
    } else if (level >= 3) {
      // SEVİYE 3: MAHALLER (currentPath[0] binası, currentPath[1] katı, currentPath[2] birimindeki)
      const bName = currentPath[0];
      const flrLabel = currentPath[1];
      const deptLabel = currentPath[2];

      const itemsInDept = normalizedLocations.filter(
        (loc) =>
          loc.buildingName.toLowerCase() === bName.toLowerCase() &&
          loc.floorLabel.toLowerCase() === flrLabel.toLowerCase() &&
          (loc.department || 'Genel Birim').toLowerCase() === deptLabel.toLowerCase()
      );

      itemsInDept.forEach((item) => {
        const mahalName = item.mahal || item.raw?.name || 'Genel Mahal';
        cards.push({
          key: `mahal-${item.id}`,
          name: mahalName,
          level: 'mahal',
          badgeLabel: 'Mahal',
          badgeStyle: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
          description: 'Mahal envanterini görüntülemek için tıklayın',
          matCount: countDistinctMaterialsForIds([item.id]),
          subCount: 0,
          subLabel: 'Mahal',
          ids: [item.id],
          targetPath: [bName, flrLabel, deptLabel, mahalName],
          isLeaf: true,
          leafId: item.id,
          sampleParts: item,
        });
      });
    }

    return cards;
  }, [normalizedLocations, currentPath, countDistinctMaterialsForIds]);

  const displayCards = useMemo(() => {
    if (!searchTerm.trim()) return currentCards;
    const q = searchTerm.toLowerCase();
    return currentCards.filter((c) => c.name.toLowerCase().includes(q));
  }, [currentCards, searchTerm]);

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Departmanlar & Mahaller
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tesisin mevcut <strong>Bina &gt; Blok &gt; Kat</strong> yapısına tehlikeli madde kullanım birimleri ve mahaller tanımlayın; kimyasal envanterinizi dağıtın.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <Button
            onClick={() => {
              setAddModalInitialValues(undefined);
              setIsAddModalOpen(true);
            }}
            className="shadow-sm gap-2 h-9 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Yeni Birim / Mahal Tanımla
          </Button>
        </div>
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
          <h3 className="text-lg font-medium mb-2">Tanımlı Birim / Mahal Bulunamadı</h3>
          <p className="text-muted-foreground mb-4 text-xs max-w-md mx-auto">
            Bu tesiste tehlikeli madde kullanımı için henüz birim veya mahal tanımlanmamış. Yukarıdaki butonu kullanarak ilk biriminizi tanımlayabilirsiniz.
          </p>
          <Button
            onClick={() => {
              setAddModalInitialValues(undefined);
              setIsAddModalOpen(true);
            }}
            className="gap-2 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            İlk Birimi / Mahali Tanımla
          </Button>
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
                                  className={`text-xs font-semibold truncate ${blokNode.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'
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
                                              variant="outline"
                                              className="h-6 px-2 text-[11px] gap-1 hover:bg-primary hover:text-primary-foreground transition-colors"
                                              title="Bu kata yeni birim veya mahal ekle"
                                              onClick={() => {
                                                setAddModalInitialValues({
                                                  buildingName: binaNode.name,
                                                  block: realBlockName,
                                                  floor: floorNode.name,
                                                });
                                                setIsAddModalOpen(true);
                                              }}
                                            >
                                              <Plus className="w-3 h-3" /> Birim Ekle
                                            </Button>
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
                                                        className={`text-xs font-medium truncate ${deptNode.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'
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
                                                          className="h-6 px-2 text-[11px] gap-1 hover:bg-muted"
                                                          title="Bu birimin altına yeni mahal tanımla"
                                                          onClick={() => {
                                                            setAddModalInitialValues({
                                                              buildingName: binaNode.name,
                                                              block: realBlockName,
                                                              floor: floorNode.name,
                                                              department: deptNode.name,
                                                            });
                                                            setIsAddModalOpen(true);
                                                          }}
                                                        >
                                                          <DoorOpen className="w-3 h-3 text-muted-foreground" /> Mahal Ekle
                                                        </Button>
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
          {/* Breadcrumb Çubuğu */}
          <div className="bg-card border border-border/70 p-3 rounded-lg flex flex-col sm:flex-row justify-between items-center gap-3 shadow-2xs">
            <div className="flex items-center gap-1.5 text-xs sm:text-sm text-muted-foreground flex-wrap">
              <button
                type="button"
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-muted hover:text-foreground ${currentPath.length === 0 ? 'font-bold text-foreground bg-muted/60' : ''
                  }`}
                onClick={() => setCurrentPath([])}
              >
                <Building className="w-4 h-4 text-primary" />
                <span>Tesis Ana Görünümü</span>
              </button>
              {currentPath.map((pathItem, index) => {
                const isLast = index === currentPath.length - 1;
                const levelIcons = [Building, Layers, Briefcase, DoorOpen];
                const LevelIcon = levelIcons[index + 1] || MapPin;
                return (
                  <div key={index} className="flex items-center gap-1.5">
                    <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0" />
                    <button
                      type="button"
                      className={`flex items-center gap-1.5 px-2 py-1 rounded-md transition-colors hover:bg-muted hover:text-foreground ${isLast ? 'font-bold text-foreground bg-muted/60' : ''
                        }`}
                      onClick={() => setCurrentPath(currentPath.slice(0, index + 1))}
                    >
                      <LevelIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span>{pathItem}</span>
                    </button>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              {currentPath.length === 1 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    setAddModalInitialValues({
                      buildingName: currentPath[0],
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Birim Ekle
                </Button>
              )}
              {currentPath.length === 2 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const sample = displayCards[0]?.sampleParts || {};
                    setAddModalInitialValues({
                      buildingName: currentPath[0],
                      floor: sample.floor || currentPath[1],
                      block: sample.block,
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Birim Ekle
                </Button>
              )}
              {currentPath.length >= 3 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const sample = displayCards[0]?.sampleParts || {};
                    setAddModalInitialValues({
                      buildingName: currentPath[0],
                      floor: sample.floor || currentPath[1],
                      block: sample.block,
                      department: currentPath[2],
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  Mahal Ekle
                </Button>
              )}
              {currentPath.length > 0 && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 text-xs gap-1.5"
                  onClick={() => {
                    const allCurrentIds = Array.from(new Set(displayCards.flatMap((c) => c.ids)));
                    handlePrint(currentPath.join(' / '), allCurrentIds);
                  }}
                >
                  <Printer className="w-3.5 h-3.5" /> Toplu Yazdır
                </Button>
              )}
            </div>
          </div>

          {/* Kart Izgarası */}
          {displayCards.length === 0 ? (
            <div className="text-center p-12 bg-muted/20 border rounded-lg">
              <p className="text-muted-foreground text-sm">
                Bu seviyede gösterilecek alt konum bulunamadı.
              </p>
              {currentPath.length === 1 && (
                <Button
                  size="sm"
                  className="mt-4 gap-2 text-xs"
                  onClick={() => {
                    setAddModalInitialValues({ buildingName: currentPath[0] });
                    setIsAddModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Bu Binaya Birim / Mahal Ekle
                </Button>
              )}
              {currentPath.length === 2 && (
                <Button
                  size="sm"
                  className="mt-4 gap-2 text-xs"
                  onClick={() => {
                    setAddModalInitialValues({
                      buildingName: currentPath[0],
                      floor: currentPath[1],
                    });
                    setIsAddModalOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4" /> Bu Kata Birim Ekle
                </Button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayCards.map((card) => {
                const sample = card.sampleParts || {};
                const bName = sample.buildingName || currentPath[0] || '';
                const blk = sample.block || '';
                const flr = sample.floor || '';
                const dept = sample.department || (card.level === 'birim' ? card.name : '');
                const desc = card.level === 'mahal' ? card.name : '';

                const groupTarget =
                  card.leafId ||
                  encodeGroup5LocationId({
                    buildingName: bName,
                    block: blk,
                    floor: flr,
                    department: dept,
                    description: desc,
                  });

                const LevelIcon =
                  card.level === 'bina'
                    ? Building
                    : card.level === 'kat'
                      ? Layers
                      : card.level === 'birim'
                        ? Briefcase
                        : DoorOpen;

                const handleCardClick = () => {
                  if (card.isLeaf && card.leafId) {
                    goToDepartmentView(card.leafId);
                  } else {
                    setCurrentPath(card.targetPath);
                  }
                };

                return (
                  <Card
                    key={card.key}
                    className="hover:shadow-md transition-all hover:border-primary/50 group flex flex-col justify-between border-border/70 bg-card overflow-hidden"
                    onClick={handleCardClick}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center shrink-0 group-hover:bg-primary/10 transition-colors">
                            <LevelIcon className="w-4 h-4 text-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <span className="font-semibold text-sm text-foreground truncate group-hover:text-primary transition-colors">
                            {card.name}
                          </span>
                        </div>
                        <Badge
                          variant="outline"
                          className={`text-[10px] font-semibold py-0.5 px-2 shrink-0 ${card.badgeStyle}`}
                        >
                          {card.badgeLabel}
                        </Badge>
                      </div>
                      <CardDescription className="text-xs mt-1.5 line-clamp-1">
                        {card.description}
                      </CardDescription>
                    </CardHeader>

                    <CardContent className="p-4 pt-2 space-y-3">
                      {/* Metrikler */}
                      <div className="flex items-center justify-between text-xs p-2 bg-muted/30 rounded-md border border-border/50">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <PackageSearch className="w-3.5 h-3.5 text-primary shrink-0" />
                          <span>Tehlikeli Madde:</span>
                        </div>
                        <span className="font-semibold text-foreground">
                          {card.matCount} Adet
                        </span>
                      </div>

                      {/* Alt Birim / Mahal Sayacı (Eğer varsa) */}
                      {card.subCount > 0 && (
                        <div className="text-[11px] text-muted-foreground flex items-center justify-between px-1">
                          <span>Alt Kapsam:</span>
                          <span className="font-medium text-foreground">{card.subLabel}</span>
                        </div>
                      )}

                      {/* İşlem Butonları */}
                      <div className="flex items-center gap-1.5 pt-1" onClick={(e) => e.stopPropagation()}>
                        {/* Seviyeye Özel Hızlı Ekleme Butonları */}
                        {card.level === 'kat' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] gap-1"
                            title="Bu kata birim veya mahal ekle"
                            onClick={() => {
                              setAddModalInitialValues({
                                buildingName: bName,
                                block: blk,
                                floor: flr,
                              });
                              setIsAddModalOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3" /> Birim Ekle
                          </Button>
                        )}
                        {card.level === 'birim' && (
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-[11px] gap-1"
                            title="Bu birime mahal tanımla"
                            onClick={() => {
                              setAddModalInitialValues({
                                buildingName: bName,
                                block: blk,
                                floor: flr,
                                department: dept,
                              });
                              setIsAddModalOpen(true);
                            }}
                          >
                            <Plus className="w-3 h-3" /> Mahal Ekle
                          </Button>
                        )}

                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => handlePrint(card.targetPath.join(' / '), card.ids)}
                        >
                          <Printer className="w-3 h-3 mr-1" /> Yazdır
                        </Button>

                        <Button
                          size="sm"
                          variant="secondary"
                          className="h-7 px-2 text-[11px]"
                          onClick={() => goToAddChemical(groupTarget)}
                        >
                          <Plus className="w-3 h-3 mr-1" /> Kimyasal
                        </Button>

                        {card.isLeaf && card.leafId ? (
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-[11px] ml-auto"
                            onClick={() => goToDepartmentView(card.leafId!)}
                          >
                            Envanter
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            className="h-7 px-2.5 text-[11px] ml-auto gap-1"
                            onClick={() => setCurrentPath(card.targetPath)}
                          >
                            İçine Gir <ArrowRight className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Bu Seviyedeki Tehlikeli Maddeler Listesi */}
          {currentPath.length > 0 && currentLevelChemicals.length > 0 && (
            <Card className="border-border/70 shadow-xs mt-6">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-base font-semibold">Bu Seviyedeki Tehlikeli Maddeler</CardTitle>
                    <CardDescription className="text-xs">
                      Seçili hiyerarşiye atanmış kimyasallar ({currentLevelChemicals.length} kayıt)
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="rounded-md border border-border/70 overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/50 text-muted-foreground uppercase font-semibold text-[10px]">
                      <tr>
                        <th className="px-3 py-2.5">Ürün Adı</th>
                        <th className="px-3 py-2.5">Marka</th>
                        <th className="px-3 py-2.5">Kategori</th>
                        <th className="px-3 py-2.5">Konum / Birim</th>
                        <th className="px-3 py-2.5 text-right">İşlem</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {currentLevelChemicals.map((item: any) => (
                        <tr
                          key={item.id}
                          className="hover:bg-muted/30 cursor-pointer transition-colors"
                          onClick={() => setSelectedMaterial(item)}
                        >
                          <td className="px-3 py-2.5 font-medium text-foreground">{item.productName}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{item.brandName || '-'}</td>
                          <td className="px-3 py-2.5 text-muted-foreground">{item.categoryName}</td>
                          <td className="px-3 py-2.5">
                            <Badge variant="outline" className="font-normal text-[10px] bg-muted/40">
                              {getLocationPathSegments(item.department).join(' / ') || 'Bilinmiyor'}
                            </Badge>
                          </td>
                          <td className="px-3 py-2.5 text-right" onClick={(e) => e.stopPropagation()}>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-6 px-2 text-[10px]"
                              onClick={() => setSelectedMaterial(item)}
                            >
                              Detay
                            </Button>
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

      <HazmatAddDepartmentModal
        isOpen={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        facilityId={activeFacilityId || ''}
        locations={departments}
        initialValues={addModalInitialValues}
      />
    </div>
  );
}
