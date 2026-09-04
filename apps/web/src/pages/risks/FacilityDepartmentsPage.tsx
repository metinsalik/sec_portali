import { useState, useMemo, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { 
  Building2, ArrowLeft, Search, ChevronRight, MapPin, 
  Layers, ShieldAlert, Eye, ArrowUpDown, RefreshCw, FileSpreadsheet,
  CheckCircle2, AlertTriangle, Clock, X, Sparkles, Compass, Plus, Printer
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableBody, TableHead, TableRow, TableCell } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import RiskExcelImport from './RiskExcelImport';
import { FacilityRiskPrintModal } from '@/components/risks/FacilityRiskPrintModal';

const API = import.meta.env.VITE_API_URL || '';

const STATUS_CONFIG: Record<string, { label: string; icon: any; class: string }> = {
  ACIK_TEHLIKE:        { label: 'Açık Tehlike',    icon: AlertTriangle, class: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-200 dark:border-rose-900/50' },
  ILK_MUDAHALE_EDILDI: { label: 'İlk Müdahale',    icon: Clock,         class: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-900/50' },
  TAKIP_SURECINDE:     { label: 'Takipte',         icon: RefreshCw,     class: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-900/50' },
  KAPATILDI_GUVENLI:   { label: 'Kapatıldı',       icon: CheckCircle2,  class: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-900/50' },
};

const LEVEL_STYLE: Record<string, string> = {
  'Tolere Gösterilmez Risk': 'bg-red-950 text-red-100 border-red-900 dark:bg-red-950 dark:text-red-200',
  'Yüksek Risk':             'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900',
  'Önemli Risk':             'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900',
  'Olası Risk':              'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/40 dark:text-yellow-300 dark:border-yellow-900',
  'Önemsiz Risk':            'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900',
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG['ACIK_TEHLIKE'];
  const Icon = cfg.icon;
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border leading-tight ${cfg.class}`}>
      <Icon className="w-2.5 h-2.5 shrink-0" />
      <span className="truncate">{cfg.label}</span>
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  return (
    <span className={`inline-flex items-center px-1.5 py-0.5 rounded-md text-[10px] font-semibold border leading-tight text-center ${LEVEL_STYLE[level] || 'bg-muted text-muted-foreground border-border'}`}>
      {level || 'Bilinmiyor'}
    </span>
  );
}

// Tree Structure Builder
function buildHierarchyTree(locations: any[]) {
  const tree: Record<string, any> = {};

  locations.forEach(loc => {
    const b = loc.building || 'Belirtilmemiş Bina';
    const f = loc.floor || 'Belirtilmemiş Kat';
    const d = loc.department || 'Belirtilmemiş Birim';

    if (!tree[b]) {
      tree[b] = { 
        name: b, 
        type: 'building', 
        path: b, 
        children: {}, 
        risks: 0, 
        stats: { acik: 0, mudahale: 0, takip: 0, kapali: 0 } 
      };
    }

    if (!tree[b].children[f]) {
      tree[b].children[f] = { 
        name: f, 
        type: 'floor', 
        path: `${b}|${f}`, 
        children: {}, 
        risks: 0, 
        stats: { acik: 0, mudahale: 0, takip: 0, kapali: 0 } 
      };
    }

    if (!tree[b].children[f].children[d]) {
      tree[b].children[f].children[d] = { 
        name: d, 
        type: 'department', 
        path: `${b}|${f}|${d}`, 
        units: [], 
        risks: 0, 
        stats: { acik: 0, mudahale: 0, takip: 0, kapali: 0 } 
      };
    }

    // Add unit
    tree[b].children[f].children[d].units.push(loc);

    // Aggregate statistics
    [tree[b], tree[b].children[f], tree[b].children[f].children[d]].forEach(node => {
      node.risks += (loc.riskCount || 0);
      node.stats.acik += (loc.stats?.acik || 0);
      node.stats.mudahale += (loc.stats?.mudahale || 0);
      node.stats.takip += (loc.stats?.takip || 0);
      node.stats.kapali += (loc.stats?.kapali || 0);
    });
  });

  return tree;
}

export default function FacilityDepartmentsPage() {
  const { facilityId } = useParams<{ facilityId: string }>();
  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  const [showImport, setShowImport] = useState(false);
  const [showBulkPrint, setShowBulkPrint] = useState(false);

  // Selected Breadcrumb hierarchy path
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [selectedFloor, setSelectedFloor] = useState<string | null>(null);
  const [selectedDept, setSelectedDept] = useState<string | null>(null);
  const [selectedUnit, setSelectedUnit] = useState<{ id: string; name: string } | null>(null);

  // Table filters & sorting
  const [riskSearch, setRiskSearch] = useState('');
  const [riskStatusFilter, setRiskStatusFilter] = useState('');
  const [filterInitialLevel, setFilterInitialLevel] = useState('');
  const [filterFinalLevel, setFilterFinalLevel] = useState('');
  const [sortField, setSortField] = useState<string>('riskNo');
  const [sortAsc, setSortAsc] = useState<boolean>(true);

  // 1. Facilities
  const { data: facilities = [] } = useQuery({
    queryKey: ['risk-facilities'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/facilities`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.json();
    },
  });
  const facility = facilities.find((f: any) => f.id === facilityId);

  // 2. Locations Flat
  const { data: locations = [], isLoading: isLoadingLocs, refetch: refetchLocations } = useQuery({
    queryKey: ['risk-departments-flat', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/locations?facilityId=${facilityId}&flat=true`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Lokasyonlar alınamadı');
      return res.json();
    },
    enabled: !!facilityId,
  });

  // Build tree
  const tree = useMemo(() => buildHierarchyTree(locations), [locations]);

  // If there's only 1 building in the facility, auto-advance to building selection or set as default
  useEffect(() => {
    const buildings = Object.keys(tree);
    if (buildings.length === 1 && !selectedBuilding) {
      setSelectedBuilding(buildings[0]);
    }
  }, [tree, selectedBuilding]);

  // Derived active nodes
  const activeBuildingNode = selectedBuilding ? tree[selectedBuilding] : null;
  const activeFloorNode = activeBuildingNode && selectedFloor ? activeBuildingNode.children?.[selectedFloor] : null;
  const activeDeptNode = activeFloorNode && selectedDept ? activeFloorNode.children?.[selectedDept] : null;

  // Active Scope Path for Backend lifecycle query
  const scopeParams = useMemo(() => {
    if (selectedUnit) {
      return { level: 'unit', unitId: selectedUnit.id, label: selectedUnit.name };
    }
    if (selectedDept && selectedFloor && selectedBuilding) {
      return { 
        level: 'department', 
        path: `${selectedBuilding}|${selectedFloor}|${selectedDept}`,
        label: `${selectedDept} (${selectedBuilding} › ${selectedFloor})`
      };
    }
    if (selectedFloor && selectedBuilding) {
      return { 
        level: 'floor', 
        path: `${selectedBuilding}|${selectedFloor}`,
        label: `${selectedFloor} (${selectedBuilding})`
      };
    }
    if (selectedBuilding) {
      return { 
        level: 'building', 
        path: selectedBuilding,
        label: `${selectedBuilding} (Tüm Katlar)`
      };
    }
    return { level: 'all', path: '', label: 'Tüm Tesis' };
  }, [selectedBuilding, selectedFloor, selectedDept, selectedUnit]);

  // 3. Fetch Risks for Active Scope
  const { data: scopedRisks = [], isLoading: isLoadingRisks, refetch: refetchRisks } = useQuery({
    queryKey: ['scoped-risks', facilityId, scopeParams.level, (scopeParams as any).path, (scopeParams as any).unitId],
    queryFn: async () => {
      let url = `${API}/api/risks/lifecycle?facilityId=${facilityId}`;
      if (scopeParams.level === 'unit' && (scopeParams as any).unitId) {
        url = `${API}/api/risks/lifecycle?locationId=${(scopeParams as any).unitId}`;
      } else if (scopeParams.level !== 'all' && (scopeParams as any).path) {
        url += `&level=${scopeParams.level}&path=${encodeURIComponent((scopeParams as any).path)}`;
      }

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!facilityId,
  });

  // Level counts & Dashboard metrics for the selected scope
  const levelCounts = useMemo(() => {
    const initCounts: Record<string, number> = {};
    const finalCounts: Record<string, number> = {};

    scopedRisks.forEach((r: any) => {
      const initLvl = r.initialLevel || 'Bilinmiyor';
      const finLvl = r.finalLevel || r.initialLevel || 'Bilinmiyor';
      initCounts[initLvl] = (initCounts[initLvl] || 0) + 1;
      finalCounts[finLvl] = (finalCounts[finLvl] || 0) + 1;
    });

    return { initCounts, finalCounts };
  }, [scopedRisks]);

  // Filtered & Sorted Risks
  const filteredRisks = useMemo(() => {
    return scopedRisks.filter((r: any) => {
      if (riskStatusFilter && r.status !== riskStatusFilter) return false;
      if (filterInitialLevel && (r.initialLevel || 'Bilinmiyor') !== filterInitialLevel) return false;
      if (filterFinalLevel && (r.finalLevel || r.initialLevel || 'Bilinmiyor') !== filterFinalLevel) return false;

      if (riskSearch.trim()) {
        const q = riskSearch.toLowerCase();
        const matchNo = String(r.riskNo).includes(q);
        const matchHaz = (r.hazard || '').toLowerCase().includes(q);
        const matchDesc = (r.riskDescription || '').toLowerCase().includes(q);
        const matchArea = (r.area || '').toLowerCase().includes(q);
        const matchCat = (r.riskCategory || '').toLowerCase().includes(q);
        const matchResp = (r.improvementResponsible || '').toLowerCase().includes(q);
        return matchNo || matchHaz || matchDesc || matchArea || matchCat || matchResp;
      }
      return true;
    }).sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];
      if (typeof valA === 'string') valA = valA.toLowerCase();
      if (typeof valB === 'string') valB = valB.toLowerCase();
      if (valA < valB) return sortAsc ? -1 : 1;
      if (valA > valB) return sortAsc ? 1 : -1;
      return 0;
    });
  }, [scopedRisks, riskStatusFilter, filterInitialLevel, filterFinalLevel, riskSearch, sortField, sortAsc]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const totalFacilityRisks = useMemo(() => {
    return locations.reduce((acc, l) => acc + (l.riskCount || 0), 0);
  }, [locations]);

  return (
    <div className="space-y-6 pb-20 w-full">
      {/* ─── Hero Header & Breadcrumb Tracker ────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div>
          <nav className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
            <button 
              onClick={() => navigate(`/risks/facility/${facilityId}`)} 
              className="hover:text-foreground flex items-center gap-1 font-medium transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              {facility?.name || 'Tesis'}
            </button>
            <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/40" />
            <span className="font-semibold text-foreground">Lokasyon & Risk Gezgini</span>
          </nav>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Risk Yaşam Döngüsü & Birimler
            </h1>
            <span className="font-mono text-xs px-2.5 py-1 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
              {totalFacilityRisks} Toplam Risk
            </span>
          </div>
          <p className="text-sm text-muted-foreground mt-0.5">
            Bina, kat, birim veya mahal bazında anlık seviye dashboard'ları ve risk yaşam döngüsü listesi.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <Button 
            onClick={() => {
              const targetLocId = selectedUnit?.id || activeDeptNode?.units?.[0]?.id || locations[0]?.id || '';
              if (targetLocId) {
                navigate(`/risks/location/${targetLocId}/create`);
              } else {
                toast.error('Önce bir lokasyon seçmelisiniz.');
              }
            }}
            size="sm"
            className="shadow-xs font-medium bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            Risk Ekle
          </Button>

          <Button 
            onClick={() => setShowBulkPrint(true)}
            size="sm"
            variant="outline"
            className="shadow-xs font-medium border-blue-200 text-blue-700 hover:bg-blue-50 dark:border-blue-800 dark:text-blue-400 dark:hover:bg-blue-900/20"
          >
            <Printer className="w-4 h-4 mr-1.5" />
            Toplu Risk Çıktısı
          </Button>

          <Button 
            onClick={() => setShowImport(true)}
            size="sm"
            variant="outline"
            className="shadow-xs font-medium"
          >
            <FileSpreadsheet className="w-4 h-4 mr-1.5" />
            Excel'den Risk Aktar
          </Button>
        </div>
      </div>

      {/* ─── ULTRA PREMİUM ADIM GEZGİNİ (COMMAND-CENTER STEP SELECTOR) ────── */}
      <div className="bg-card border rounded-2xl shadow-xs overflow-hidden">
        {/* Adım İlerleme Başlığı */}
        <div className="p-4 border-b bg-muted/20 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Hiyerarşik Kapsam Seçici
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant={!selectedBuilding && !selectedFloor && !selectedDept ? 'default' : 'ghost'}
              size="sm"
              className="h-7 text-xs rounded-lg"
              onClick={() => {
                setSelectedBuilding(null);
                setSelectedFloor(null);
                setSelectedDept(null);
                setSelectedUnit(null);
              }}
            >
              Tüm Tesisi İncele ({totalFacilityRisks})
            </Button>
          </div>
        </div>

        {/* Çok Kademeli Segmentli Kontrol Paneli */}
        <div className="p-4 space-y-4">
          {/* 1. SEVİYE: BİNALAR */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                <Building2 className="w-3.5 h-3.5 text-primary" /> 1. Bina
              </span>
              <span className="text-[11px] text-muted-foreground/80">
                {Object.keys(tree).length} Bina Tanımlı
              </span>
            </div>

            <div className="flex flex-wrap gap-2">
              {Object.entries(tree).map(([bName, bNode]: any) => {
                const isSelected = selectedBuilding === bName;
                return (
                  <button
                    key={bName}
                    onClick={() => {
                      if (isSelected && selectedFloor) {
                        setSelectedFloor(null);
                        setSelectedDept(null);
                        setSelectedUnit(null);
                      } else {
                        setSelectedBuilding(bName);
                        setSelectedFloor(null);
                        setSelectedDept(null);
                        setSelectedUnit(null);
                      }
                    }}
                    className={`group flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all ${
                      isSelected
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                        : 'bg-background hover:bg-muted text-foreground border-border'
                    }`}
                  >
                    <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                    <span>{bName}</span>
                    <span className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] ${
                      isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:bg-background'
                    }`}>
                      {bNode.risks}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. SEVİYE: KATLAR (Sadece Bina seçiliyse animasyonlu şekilde açılır) */}
          {activeBuildingNode && (
            <div className="pt-3 border-t space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-blue-500" /> 2. Kat ({selectedBuilding})
                </span>
                <span className="text-[11px] text-muted-foreground/80">
                  {Object.keys(activeBuildingNode.children).length} Kat Tanımlı
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(activeBuildingNode.children).map(([fName, fNode]: any) => {
                  const isSelected = selectedFloor === fName;
                  return (
                    <button
                      key={fName}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedFloor(null);
                          setSelectedDept(null);
                          setSelectedUnit(null);
                        } else {
                          setSelectedFloor(fName);
                          setSelectedDept(null);
                          setSelectedUnit(null);
                        }
                      }}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs font-semibold'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      <Layers className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-blue-500'}`} />
                      <span>{fName}</span>
                      <span className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground group-hover:bg-background'
                      }`}>
                        {fNode.risks}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. SEVİYE: BİRİMLER (Sadece Kat seçiliyse animasyonlu şekilde açılır) */}
          {activeFloorNode && (
            <div className="pt-3 border-t space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <Building2 className="w-3.5 h-3.5 text-emerald-500" /> 3. Birim / Departman ({selectedFloor})
                </span>
                <span className="text-[11px] text-muted-foreground/80">
                  {Object.keys(activeFloorNode.children).length} Birim Tanımlı
                </span>
              </div>

              <div className="flex flex-wrap gap-2">
                {Object.entries(activeFloorNode.children).map(([dName, dNode]: any) => {
                  const isSelected = selectedDept === dName;
                  return (
                    <button
                      key={dName}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedDept(null);
                          setSelectedUnit(null);
                        } else {
                          setSelectedDept(dName);
                          setSelectedUnit(null);
                        }
                      }}
                      className={`group flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-semibold'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-emerald-500'}`} />
                      <span>{dName}</span>
                      <span className={`px-1.5 py-0.5 rounded-md font-mono text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground group-hover:bg-background'
                      }`}>
                        {dNode.risks}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 4. SEVİYE: MAHALLER / ALANLAR (Sadece Birim seçiliyse ve mahaller tanımlıysa) */}
          {activeDeptNode && activeDeptNode.units && activeDeptNode.units.length > 0 && (
            <div className="pt-3 border-t space-y-2 animate-in fade-in slide-in-from-top-1 duration-200">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-muted-foreground flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" /> 4. Mahal / Alan ({selectedDept})
                </span>
                {selectedUnit && (
                  <button 
                    onClick={() => setSelectedUnit(null)}
                    className="text-[11px] text-muted-foreground hover:text-foreground underline"
                  >
                    Tüm Mahaller ({activeDeptNode.risks})
                  </button>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {activeDeptNode.units.map((unit: any) => {
                  const unitLabel = unit.description || unit.name || 'Ana Mahal';
                  const isSelected = selectedUnit?.id === unit.id;
                  return (
                    <button
                      key={unit.id}
                      onClick={() => {
                        if (isSelected) {
                          setSelectedUnit(null);
                        } else {
                          setSelectedUnit({ id: unit.id, name: unitLabel });
                        }
                      }}
                      className={`group flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-medium border transition-all ${
                        isSelected
                          ? 'bg-amber-600 text-white border-amber-600 shadow-xs font-semibold'
                          : 'bg-background hover:bg-muted text-foreground border-border'
                      }`}
                    >
                      <MapPin className={`w-3 h-3 ${isSelected ? 'text-white' : 'text-amber-500'}`} />
                      <span>{unitLabel}</span>
                      <span className={`px-1.5 py-0.2 rounded-md font-mono text-[10px] ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-muted text-muted-foreground group-hover:bg-background'
                      }`}>
                        {unit.riskCount || 0}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ─── KAPSAM DASHBOARD'U: DURUM DAĞILIMI & RİSK SEVİYESİ DAĞILIMI ────── */}
      {scopedRisks.length > 0 && (() => {
        const total = scopedRisks.length;
        const acikCount = scopedRisks.filter((r: any) => r.status === 'ACIK_TEHLIKE').length;
        const mudahaleCount = scopedRisks.filter((r: any) => r.status === 'ILK_MUDAHALE_EDILDI').length;
        const takipCount = scopedRisks.filter((r: any) => r.status === 'TAKIP_SURECINDE').length;
        const kapaliCount = scopedRisks.filter((r: any) => r.status === 'KAPATILDI_GUVENLI').length;

        const acikPercent = total > 0 ? (acikCount / total) * 100 : 0;
        const mudahalePercent = total > 0 ? (mudahaleCount / total) * 100 : 0;
        const takipPercent = total > 0 ? (takipCount / total) * 100 : 0;

        const stop1 = acikPercent;
        const stop2 = stop1 + mudahalePercent;
        const stop3 = stop2 + takipPercent;

        const donutGradient = total > 0 
          ? `conic-gradient(#dc2626 0% ${stop1}%, #f97316 ${stop1}% ${stop2}%, #2563eb ${stop2}% ${stop3}%, #16a34a ${stop3}% 100%)`
          : `conic-gradient(var(--color-muted, #f1f5f9) 0% 100%)`;

        const getInitCount = (lvl: string) => levelCounts.initCounts[lvl] || 0;
        const getFinalCount = (lvl: string) => levelCounts.finalCounts[lvl] || 0;

        const iTolere = getInitCount('Tolere Gösterilmez Risk');
        const iYuksek = getInitCount('Yüksek Risk');
        const iOnemli = getInitCount('Önemli Risk');
        const iOlasi  = getInitCount('Olası Risk');
        const iOnemsiz= getInitCount('Önemsiz Risk');

        const fTolere = getFinalCount('Tolere Gösterilmez Risk');
        const fYuksek = getFinalCount('Yüksek Risk');
        const fOnemli = getFinalCount('Önemli Risk');
        const fOlasi  = getFinalCount('Olası Risk');
        const fOnemsiz= getFinalCount('Önemsiz Risk');

        const pct = (val: number) => total > 0 ? (val / total) * 100 : 0;

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 animate-in fade-in duration-300">
            {/* 1. Kutu: Durum Dağılımı Donut Chart */}
            <Card className="shadow-xs border-border flex flex-col">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{scopeParams.label} — Durum Dağılımı</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  Risklerin yaşam döngüsü ve aksiyon durumları
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-3 flex-1 flex flex-col items-center justify-center">
                <div 
                  className="w-40 h-40 rounded-full flex items-center justify-center relative shadow-inner"
                  style={{ 
                    background: donutGradient 
                  }}
                >
                  <div className="w-28 h-28 rounded-full bg-card flex flex-col items-center justify-center shadow-xs">
                    <span className="text-2xl font-black text-foreground block leading-none">
                      {total}
                    </span>
                    <span className="text-[11px] font-semibold text-muted-foreground mt-1">
                      Toplam Risk
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5 w-full mt-5 px-1 text-xs">
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-rose-500/10 border border-rose-200/50 dark:border-rose-900/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-rose-600 shrink-0"></div>
                    <div className="flex-1 font-medium text-rose-700 dark:text-rose-300 truncate">Açık</div>
                    <span className="font-bold text-rose-700 dark:text-rose-300 font-mono">{acikCount}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-orange-500/10 border border-orange-200/50 dark:border-orange-900/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-orange-500 shrink-0"></div>
                    <div className="flex-1 font-medium text-orange-700 dark:text-orange-300 truncate">Müdahale Edildi</div>
                    <span className="font-bold text-orange-700 dark:text-orange-300 font-mono">{mudahaleCount}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-blue-500/10 border border-blue-200/50 dark:border-blue-900/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0"></div>
                    <div className="flex-1 font-medium text-blue-700 dark:text-blue-300 truncate">Takipte</div>
                    <span className="font-bold text-blue-700 dark:text-blue-300 font-mono">{takipCount}</span>
                  </div>
                  <div className="flex items-center gap-2 p-2 rounded-lg bg-emerald-500/10 border border-emerald-200/50 dark:border-emerald-900/40">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></div>
                    <div className="flex-1 font-medium text-emerald-700 dark:text-emerald-300 truncate">Kapalı / Güvenli</div>
                    <span className="font-bold text-emerald-700 dark:text-emerald-300 font-mono">{kapaliCount}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* 2. Kutu: Risk Seviyesi Dağılımı Barları (İlk Tespit vs İyileştirme Sonrası) */}
            <Card className="lg:col-span-2 shadow-xs border-border flex flex-col">
              <CardHeader className="p-5 pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{scopeParams.label} — Risk Seviyesi Dağılımı</span>
                  <span className="text-xs font-normal text-muted-foreground">Seviyeye tıklayarak filtreleyin</span>
                </CardTitle>
                <CardDescription className="text-xs">
                  İlk tespit ile iyileştirme sonrası skorların karşılaştırmalı analizi
                </CardDescription>
              </CardHeader>
              <CardContent className="p-5 pt-3 flex-1 flex flex-col justify-between">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* İlk Tespit */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center pb-2 border-b">
                      İlk Tespit Risk Skoru
                    </div>
                    {[
                      { label: 'Tolere Gösterilmez Risk', count: iTolere, color: 'bg-red-900', width: pct(iTolere) },
                      { label: 'Yüksek Risk', count: iYuksek, color: 'bg-rose-600', width: pct(iYuksek) },
                      { label: 'Önemli Risk', count: iOnemli, color: 'bg-amber-600', width: pct(iOnemli) },
                      { label: 'Olası Risk', count: iOlasi, color: 'bg-yellow-500', width: pct(iOlasi) },
                      { label: 'Önemsiz Risk', count: iOnemsiz, color: 'bg-emerald-500', width: pct(iOnemsiz) }
                    ].map((item, idx) => (
                      <div 
                        key={`init-${idx}`}
                        onClick={() => {
                          setFilterInitialLevel(filterInitialLevel === item.label ? '' : item.label);
                          setFilterFinalLevel('');
                        }}
                        className={`group p-1 -mx-1 rounded-lg cursor-pointer transition-colors ${
                          filterInitialLevel === item.label ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-24 text-right text-[10px] font-medium text-muted-foreground truncate">
                            {item.label}
                          </span>
                          <div className="flex-1 h-5 bg-muted/60 rounded-md overflow-hidden flex items-center p-0.5">
                            <div 
                              className={`h-full rounded-sm transition-all duration-700 ${item.color}`}
                              style={{ width: `${item.width}%` }}
                            />
                          </div>
                          <span className="w-6 text-right font-mono font-bold text-xs text-foreground">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* İyileştirme Sonrası */}
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center pb-2 border-b">
                      İyileştirme Sonrası Risk Skoru
                    </div>
                    {[
                      { label: 'Tolere Gösterilmez Risk', count: fTolere, color: 'bg-red-900', width: pct(fTolere) },
                      { label: 'Yüksek Risk', count: fYuksek, color: 'bg-rose-600', width: pct(fYuksek) },
                      { label: 'Önemli Risk', count: fOnemli, color: 'bg-amber-600', width: pct(fOnemli) },
                      { label: 'Olası Risk', count: fOlasi, color: 'bg-yellow-500', width: pct(fOlasi) },
                      { label: 'Önemsiz Risk', count: fOnemsiz, color: 'bg-emerald-500', width: pct(fOnemsiz) }
                    ].map((item, idx) => (
                      <div 
                        key={`fin-${idx}`}
                        onClick={() => {
                          setFilterFinalLevel(filterFinalLevel === item.label ? '' : item.label);
                          setFilterInitialLevel('');
                        }}
                        className={`group p-1 -mx-1 rounded-lg cursor-pointer transition-colors ${
                          filterFinalLevel === item.label ? 'ring-2 ring-primary bg-primary/5' : 'hover:bg-muted/50'
                        }`}
                      >
                        <div className="flex items-center gap-2 text-xs">
                          <span className="w-24 text-right text-[10px] font-medium text-muted-foreground truncate">
                            {item.label}
                          </span>
                          <div className="flex-1 h-5 bg-muted/60 rounded-md overflow-hidden flex items-center p-0.5">
                            <div 
                              className={`h-full rounded-sm transition-all duration-700 ${item.color}`}
                              style={{ width: `${item.width}%` }}
                            />
                          </div>
                          <span className="w-6 text-right font-mono font-bold text-xs text-foreground">
                            {item.count}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Legend */}
                <div className="flex flex-wrap justify-center gap-3 pt-4 mt-4 border-t text-[10px] text-muted-foreground">
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-red-900"></div> Tolere G.</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-600"></div> Yüksek</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-600"></div> Önemli</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-yellow-500"></div> Olası</div>
                  <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Önemsiz</div>
                </div>
              </CardContent>
            </Card>
          </div>
        );
      })()}

      {/* ─── HIZLI DURUM FİLTRE BUTONLARI (PILLS BAR) ────────────────────── */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-card p-3 rounded-2xl border shadow-xs">
        <div className="flex flex-wrap items-center gap-2">
          <Button 
            size="sm" 
            variant={riskStatusFilter === '' ? 'default' : 'outline'}
            onClick={() => setRiskStatusFilter('')} 
            className="h-8 text-xs rounded-xl"
          >
            Tümü ({scopedRisks.length})
          </Button>

          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => {
            const count = scopedRisks.filter((r: any) => r.status === key).length;
            const isSelected = riskStatusFilter === key;
            return (
              <Button
                key={key}
                size="sm"
                variant={isSelected ? 'default' : 'outline'}
                onClick={() => setRiskStatusFilter(isSelected ? '' : key)}
                className={`h-8 text-xs rounded-xl border-dashed ${
                  isSelected ? '' : 'hover:bg-muted'
                }`}
              >
                <span className={`w-2 h-2 rounded-full mr-1.5 ${cfg.class.split(' ')[1].replace('text-', 'bg-')}`} />
                {cfg.label} ({count})
              </Button>
            );
          })}

          {filterInitialLevel && (
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => setFilterInitialLevel('')} 
              className="h-8 text-xs rounded-xl text-primary font-semibold"
            >
              İlk Tespit: {filterInitialLevel} ✕
            </Button>
          )}

          {filterFinalLevel && (
            <Button 
              size="sm" 
              variant="secondary" 
              onClick={() => setFilterFinalLevel('')} 
              className="h-8 text-xs rounded-xl text-primary font-semibold"
            >
              Sonrası: {filterFinalLevel} ✕
            </Button>
          )}
        </div>

        {/* Canlı Arama Inputu */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tehlike, risk veya sorumlu ara..."
            value={riskSearch}
            onChange={(e) => setRiskSearch(e.target.value)}
            className="w-full text-xs pl-8 pr-3 py-1.5 bg-background border rounded-xl focus:outline-none focus:ring-1 focus:ring-primary"
          />
        </div>
      </div>

      {/* ─── ODAKLANILAN KAPSAMIN RİSK TABLOSU (PREMIUM SHADCN DATA TABLE) ─── */}
      <Card className="shadow-xs border-border overflow-hidden">
        <CardHeader className="p-5 border-b bg-card">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="font-mono text-[11px] uppercase tracking-wider bg-primary/5 border-primary/20 text-primary">
                  {scopeParams.level}
                </Badge>
                <CardTitle className="text-base font-bold text-foreground">
                  {scopeParams.label}
                </CardTitle>
              </div>
              <CardDescription className="text-xs">
                Filtrelenen sonuç: {filteredRisks.length} / {scopedRisks.length} adet risk kaydı listeleniyor.
              </CardDescription>
            </div>

            <Button 
              size="sm" 
              variant="outline" 
              className="h-8 px-2.5 rounded-lg shrink-0" 
              onClick={() => refetchRisks()}
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1" />
              Yenile
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {isLoadingRisks ? (
            <div className="p-6 space-y-3">
              {[1,2,3,4].map(i => <Skeleton key={i} className="h-10 w-full rounded-md" />)}
            </div>
          ) : filteredRisks.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground">
              <ShieldAlert className="w-10 h-10 mx-auto mb-2 opacity-30 text-primary" />
              <p className="font-semibold text-sm">Bu seçili kapsamda veya filtrede risk kaydı bulunamadı</p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                Farklı bir kat veya birim seçebilir ya da filtreleri temizleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="w-full">
              <table className="w-full table-fixed text-xs divide-y divide-border">
                <thead className="bg-muted/40">
                  <tr className="border-b border-border/80">
                    <th className="w-[4%] p-3 font-bold text-center cursor-pointer" onClick={() => handleSort('riskNo')}>
                      <div className="flex items-center justify-center gap-0.5">No <ArrowUpDown className="w-3 h-3" /></div>
                    </th>
                    <th className="w-[16%] p-3 font-bold text-left">Lokasyon & Mahal</th>
                    <th className="w-[34%] p-3 font-bold text-left">Tehlike & Risk Tanımı</th>
                    <th className="w-[20%] p-3 font-bold text-left">Sorumlu</th>
                    <th className="w-[7%] p-2 font-bold text-center cursor-pointer" onClick={() => handleSort('initialScore')}>
                      <div className="flex items-center justify-center gap-0.5">İlk Skor <ArrowUpDown className="w-2.5 h-2.5" /></div>
                    </th>
                    <th className="w-[7%] p-2 font-bold text-center cursor-pointer" onClick={() => handleSort('finalScore')}>
                      <div className="flex items-center justify-center gap-0.5">Son Skor <ArrowUpDown className="w-2.5 h-2.5" /></div>
                    </th>
                    <th className="w-[8%] p-2 font-bold text-center cursor-pointer" onClick={() => handleSort('status')}>
                      <div className="flex items-center justify-center gap-0.5">Durum <ArrowUpDown className="w-2.5 h-2.5" /></div>
                    </th>
                    <th className="w-[4%] p-2 font-bold text-center">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60 bg-card">
                  {filteredRisks.map((risk: any) => {
                    const loc = risk.location;
                    const deptName = loc?.department || risk.department?.name || 'Birim';
                    const buildingFloor = [loc?.building, loc?.floor].filter(Boolean).join(' • ');
                    const areaName = risk.area || loc?.description;

                    return (
                      <tr 
                        key={risk.id}
                        className="cursor-pointer hover:bg-muted/40 transition-colors group"
                        onClick={() => navigate(`/risks/location/${risk.locationId || risk.departmentId}/view/${risk.id}`)}
                      >
                        {/* No */}
                        <td className="p-3 text-center font-mono font-bold text-foreground text-xs align-top whitespace-normal">
                          #{risk.riskNo}
                        </td>

                        {/* Lokasyon & Mahal */}
                        <td className="p-3 align-top whitespace-normal break-words">
                          <div className="font-semibold text-foreground text-xs leading-snug">
                            {deptName}
                          </div>
                          {buildingFloor && (
                            <div className="text-[11px] text-muted-foreground mt-0.5">
                              {buildingFloor}
                            </div>
                          )}
                          {areaName && areaName !== deptName && (
                            <div className="text-[10px] text-primary/90 font-medium mt-1">
                              📍 {areaName}
                            </div>
                          )}
                        </td>

                        {/* Tehlike & Risk */}
                        <td className="p-3 align-top whitespace-normal break-words">
                          <div className="font-semibold text-foreground text-xs leading-relaxed">
                            {risk.hazard || '-'}
                          </div>
                          {risk.riskDescription && (
                            <div className="text-[11px] text-muted-foreground mt-1.5 leading-relaxed">
                              {risk.riskDescription}
                            </div>
                          )}
                        </td>

                        {/* Sorumlu */}
                        <td className="p-3 align-top whitespace-normal break-words">
                          <div className="text-xs text-muted-foreground leading-relaxed">
                            {risk.improvementResponsible || '-'}
                          </div>
                        </td>

                        {/* İlk Skor */}
                        <td className="p-2 text-center align-top whitespace-normal">
                          <div className="font-bold text-xs">{risk.initialScore || '-'}</div>
                          <div className="mt-1 flex justify-center">
                            <LevelBadge level={risk.initialLevel} />
                          </div>
                        </td>

                        {/* Son Skor */}
                        <td className="p-2 text-center align-top whitespace-normal">
                          {risk.finalScore ? (
                            <>
                              <div className="font-bold text-emerald-600 dark:text-emerald-400 text-xs">{risk.finalScore}</div>
                              <div className="mt-1 flex justify-center">
                                <LevelBadge level={risk.finalLevel} />
                              </div>
                            </>
                          ) : (
                            <span className="text-muted-foreground/60 text-xs">-</span>
                          )}
                        </td>

                        {/* Durum */}
                        <td className="p-2 text-center align-top whitespace-normal">
                          <div className="flex justify-center">
                            <StatusBadge status={risk.status} />
                          </div>
                        </td>

                        {/* İşlem */}
                        <td 
                          className="p-2 text-center align-middle" 
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 rounded-lg hover:bg-primary/10 hover:text-primary transition-colors mx-auto"
                            title="Detayı Görüntüle"
                            onClick={() => navigate(`/risks/location/${risk.locationId || risk.departmentId}/view/${risk.id}`)}
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Modal: Excel İçe Aktarım ──────────────────────────────────── */}
      {showImport && (
        <RiskExcelImport
          facilityId={facilityId!}
          onClose={() => setShowImport(false)}
          onSuccess={() => {
            setShowImport(false);
            refetchLocations();
            refetchRisks();
          }}
        />
      )}

      {/* ─── Modal: Hiyerarşik Toplu Risk Çıktısı ───────────────────────── */}
      {showBulkPrint && (
        <FacilityRiskPrintModal
          isOpen={showBulkPrint}
          onClose={() => setShowBulkPrint(false)}
          departments={locations}
          facilityRisks={scopedRisks}
          facility={facility}
          defaultScope={{
            level: scopeParams.level as any,
            building: selectedBuilding || undefined,
            floor: selectedFloor || undefined,
            department: selectedDept || undefined,
            unitId: selectedUnit?.id || undefined,
          }}
        />
      )}
    </div>
  );
}
