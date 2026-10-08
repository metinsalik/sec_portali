import React, { useMemo, useState, useRef, useEffect } from 'react';
import type { ThermalInspectionItem, ThermalInspectionSession } from '@/services/thermal-inspection.service';
import { 
  Building2, 
  Flame, 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  ShieldAlert, 
  Layers, 
  TrendingUp, 
  TrendingDown, 
  Minus, 
  Info, 
  Lightbulb, 
  ChevronRight, 
  ChevronDown, 
  Filter, 
  Search, 
  ArrowLeft,
  ArrowUpRight,
  Sliders,
  ShieldCheck,
  AlertOctagon,
  Eye,
  CheckCircle,
  BarChart3,
  Calendar,
  Zap,
  Activity,
  FileSpreadsheet,
  X,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThermalItemDetailModal } from './ThermalItemDetailModal';

interface Props {
  items: ThermalInspectionItem[];
  sessions: ThermalInspectionSession[];
  facilities: Array<{ id: string; name: string; type?: string | null; shortName?: string | null; isActive?: boolean }>;
  onOpenPanelDetail: (panelName: string) => void;
  onNavigateToFacilityTable?: (facilityId: string) => void;
}

type DrilldownCategory = 'ALL' | 'NORMAL_SPECIAL' | 'PEAK_LOAD' | 'URGENT_ACTION';

export const ThermalExecutiveDashboard: React.FC<Props> = ({
  items,
  sessions,
  facilities,
  onOpenPanelDetail,
  onNavigateToFacilityTable
}) => {
  // Navigation: 'SUMMARY' | 'DRILLDOWN'
  const [currentView, setCurrentView] = useState<'SUMMARY' | 'DRILLDOWN'>('SUMMARY');
  const [drilldownCategory, setDrilldownCategory] = useState<DrilldownCategory>('URGENT_ACTION');

  // Matris Sekmesi: 'ENTERED' (Verisi Olanlar - Default) | 'NOT_ENTERED' (Verisi Olmayanlar)
  const [matrixTab, setMatrixTab] = useState<'ENTERED' | 'NOT_ENTERED'>('ENTERED');

  // Filters
  const [selectedFacilityFilter, setSelectedFacilityFilter] = useState<string>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [drilldownPage, setDrilldownPage] = useState<number>(1);
  const PAGE_SIZE = 25;

  // Modal inspection preview item
  const [previewItem, setPreviewItem] = useState<ThermalInspectionItem | null>(null);

  // Termal Risk Matrisi Excel Tarzı Sütun Filtreleme & Sıralama State'leri
  const [matrixSortField, setMatrixSortField] = useState<string>('urgentCount');
  const [matrixSortOrder, setMatrixSortOrder] = useState<'asc' | 'desc'>('desc');
  const [matrixColumnFilters, setMatrixColumnFilters] = useState<Record<string, { textSearch: string; selectedValues: Set<string> }>>({});
  const [matrixActiveFilterCol, setMatrixActiveFilterCol] = useState<string | null>(null);
  const [matrixPopoverSearch, setMatrixPopoverSearch] = useState('');
  const [matrixPopoverTextFilter, setMatrixPopoverTextFilter] = useState('');
  const [matrixPopoverSelectedValues, setMatrixPopoverSelectedValues] = useState<Set<string>>(new Set());
  const [matrixFilterPos, setMatrixFilterPos] = useState<{ top: number; left: number } | null>(null);

  const matrixFilterPopoverRef = useRef<HTMLDivElement>(null);

  // Popover dışına tıklandığında kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (matrixFilterPopoverRef.current && !matrixFilterPopoverRef.current.contains(e.target as Node)) {
        setMatrixActiveFilterCol(null);
      }
    };
    if (matrixActiveFilterCol) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [matrixActiveFilterCol]);

  // 1. Kural: Sadece type === 'Hastane' olan VE aktif olan tesisleri ele al (pasif olanlar gelmez)
  const hospitalFacilities = useMemo(() => {
    return facilities.filter(f => {
      // Pasif olan tesisleri hariç tut
      if (f.isActive === false) return false;
      const t = (f.type || '').toLocaleLowerCase('tr-TR');
      return t === 'hastane' || t.includes('hastane');
    });
  }, [facilities]);

  // Hastane ID Set'i (Sadece hastane türündekilerin ID'leri)
  const hospitalIdSet = useMemo(() => {
    return new Set(hospitalFacilities.map(h => h.id));
  }, [hospitalFacilities]);

  // Sadece hastanelerden gelen ölçüm kayıtları
  const hospitalItems = useMemo(() => {
    return items.filter(it => {
      const fId = it.session?.facilityId || it.session?.facility?.id;
      return fId && hospitalIdSet.has(fId);
    });
  }, [items, hospitalIdSet]);

  // Sadece hastanelerden gelen denetim oturumları
  const hospitalSessions = useMemo(() => {
    return sessions.filter(s => hospitalIdSet.has(s.facilityId));
  }, [sessions, hospitalIdSet]);

  // 2. Pano Geçmişi & Çoklu Ölçüm Haritası (Panel bazlı tüm ölçümler)
  const panelHistoryMap = useMemo(() => {
    const histMap = new Map<string, ThermalInspectionItem[]>();
    hospitalItems.forEach(it => {
      if (!it.panelName) return;
      const key = `${it.session?.facilityId || it.session?.facility?.id || ''}_${it.panelName.trim()}`;
      if (!histMap.has(key)) histMap.set(key, []);
      histMap.get(key)!.push(it);
    });

    histMap.forEach(arr => {
      arr.sort((a, b) => {
        const da = a.measurementDate ? new Date(a.measurementDate).getTime() : 0;
        const db = b.measurementDate ? new Date(b.measurementDate).getTime() : 0;
        return da - db;
      });
    });

    return histMap;
  }, [hospitalItems]);

  // 3. Hastaneler Bazında Matris Hesaplaması (Verisi Olanlar & Olmayanlar)
  const { hospitalsWithData, hospitalsWithoutData } = useMemo(() => {
    const withDataList: Array<{
      facilityId: string;
      facilityName: string;
      shortName?: string | null;
      reportCount: number;
      panelCount: number;
      urgentCount: number;
      peakLoadCount: number;
      normalEquipCount: number;
      normalCount: number;
      maxTemp: number;
      maxTempPanel: string;
      lastReportDate: Date | null;
    }> = [];

    const withoutDataList: Array<{
      facilityId: string;
      facilityName: string;
      shortName?: string | null;
    }> = [];

    hospitalFacilities.forEach(fac => {
      const facItems = hospitalItems.filter(it => 
        (it.session?.facilityId === fac.id) || (it.session?.facility?.id === fac.id)
      );
      const facSessions = hospitalSessions.filter(s => s.facilityId === fac.id);

      if (facItems.length === 0) {
        withoutDataList.push({
          facilityId: fac.id,
          facilityName: fac.name,
          shortName: fac.shortName
        });
        return;
      }

      let urgentCount = 0;
      let peakLoadCount = 0;
      let normalEquipCount = 0;
      let normalCount = 0;
      let maxTemp = 0;
      let maxTempPanel = '—';
      let lastReportDate: Date | null = null;
      const panelNamesSet = new Set<string>();

      facItems.forEach(it => {
        if (it.panelName) panelNamesSet.add(it.panelName.trim());
        const m = it.measuredTemp ?? 0;
        const dT = it.deltaTemp ?? 0;
        const equip = (it.equipmentConnection || '').toLowerCase();
        const pName = (it.panelName || '').toLowerCase();
        const floor = (it.floorSection || '').toLowerCase();
        const combined = `${equip} ${pName} ${floor}`;

        if (m > maxTemp) {
          maxTemp = m;
          maxTempPanel = it.panelName || '—';
        }

        if (it.measurementDate) {
          const itemDate = new Date(it.measurementDate);
          if (!lastReportDate || itemDate > lastReportDate) {
            lastReportDate = itemDate;
          }
        }

        const isTransformerOrReactor = 
          combined.includes('trafo') || 
          combined.includes('reaktör') || 
          combined.includes('reaktor') || 
          combined.includes('şönt') || 
          combined.includes('sont') || 
          combined.includes('bobin');

        if (isTransformerOrReactor && m >= 40) {
          normalEquipCount++;
        } else if (m >= 60 || dT >= 30 || combined.includes('yoğun bakım') || combined.includes('it panosu')) {
          urgentCount++;
        } else if (m >= 40 || dT >= 15) {
          peakLoadCount++;
        } else {
          normalCount++;
        }
      });

      withDataList.push({
        facilityId: fac.id,
        facilityName: fac.name,
        shortName: fac.shortName,
        reportCount: facSessions.length || 1,
        panelCount: panelNamesSet.size,
        urgentCount,
        peakLoadCount,
        normalEquipCount,
        normalCount,
        maxTemp,
        maxTempPanel,
        lastReportDate
      });
    });

    // Sıralama: Acil sayısı en çok olandan en aza doğru
    withDataList.sort((a, b) => {
      if (b.urgentCount !== a.urgentCount) return b.urgentCount - a.urgentCount;
      if (b.peakLoadCount !== a.peakLoadCount) return b.peakLoadCount - a.peakLoadCount;
      return b.maxTemp - a.maxTemp;
    });

    withoutDataList.sort((a, b) => a.facilityName.localeCompare(b.facilityName));

    return {
      hospitalsWithData: withDataList,
      hospitalsWithoutData: withoutDataList
    };
  }, [hospitalFacilities, hospitalItems, hospitalSessions]);

  // Termal Matris Sütun Değeri Getirici
  type MatrixHospitalItem = typeof hospitalsWithData[0];

  const getMatrixColValue = (h: MatrixHospitalItem, colKey: string): string => {
    switch (colKey) {
      case 'facilityName': return h.facilityName;
      case 'reportCount': return `${h.reportCount} Rapor`;
      case 'panelCount': return `${h.panelCount} Pano`;
      case 'urgentCount': return String(h.urgentCount);
      case 'peakLoadCount': return String(h.peakLoadCount);
      case 'normalEquipCount': return String(h.normalEquipCount);
      case 'normalCount': return String(h.normalCount);
      case 'maxTemp': return h.maxTemp > 0 ? `${h.maxTemp} °C` : '—';
      case 'maxTempPanel': return h.maxTempPanel || '—';
      default: return '';
    }
  };

  const getMatrixColHeaderName = (colKey: string): string => {
    switch (colKey) {
      case 'facilityName': return 'Hastane Adı';
      case 'reportCount': return 'Rapor / Dönem';
      case 'panelCount': return 'Pano Sayısı';
      case 'urgentCount': return 'Acil Risk';
      case 'peakLoadCount': return 'Pik Takip';
      case 'normalEquipCount': return 'Trafo / Reaktör';
      case 'normalCount': return 'Normal';
      case 'maxTemp': return 'Zirve Sıcaklık';
      case 'maxTempPanel': return 'En Sıcak Pano';
      default: return colKey;
    }
  };

  // Sütundaki Benzersiz Değerleri Topla (Rapor / Dönem için 1 Rapor, 2 Rapor vb. tek tek listelenir)
  const getMatrixUniqueColumnValues = (colKey: string): string[] => {
    const set = new Set<string>();
    hospitalsWithData.forEach(h => {
      const val = getMatrixColValue(h, colKey);
      if (val !== undefined && val !== null && val.trim() !== '') {
        set.add(val.trim());
      }
    });

    if (['reportCount', 'panelCount', 'urgentCount', 'peakLoadCount', 'normalEquipCount', 'normalCount'].includes(colKey)) {
      return Array.from(set).sort((a, b) => {
        const numA = parseInt(a.replace(/\D/g, ''), 10) || 0;
        const numB = parseInt(b.replace(/\D/g, ''), 10) || 0;
        return numA - numB;
      });
    }

    if (colKey === 'maxTemp') {
      return Array.from(set).sort((a, b) => {
        const numA = parseFloat(a.replace(/[^\d.-]/g, '')) || 0;
        const numB = parseFloat(b.replace(/[^\d.-]/g, '')) || 0;
        return numA - numB;
      });
    }

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  };

  // Filtre Popover Aç
  const handleOpenMatrixFilter = (colKey: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (matrixActiveFilterCol === colKey) {
      setMatrixActiveFilterCol(null);
      setMatrixFilterPos(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 320;
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }
    const top = rect.bottom + 6;

    setMatrixFilterPos({ top, left });

    const currentFilter = matrixColumnFilters[colKey];
    const uniqueVals = getMatrixUniqueColumnValues(colKey);

    setMatrixActiveFilterCol(colKey);
    setMatrixPopoverSearch('');
    setMatrixPopoverTextFilter(currentFilter?.textSearch || '');
    setMatrixPopoverSelectedValues(
      currentFilter?.selectedValues 
        ? new Set(currentFilter.selectedValues) 
        : new Set(uniqueVals)
    );
  };

  // Filtre Uygula
  const handleApplyMatrixFilter = () => {
    if (!matrixActiveFilterCol) return;

    const uniqueVals = getMatrixUniqueColumnValues(matrixActiveFilterCol);
    const isAllSelected = uniqueVals.length === matrixPopoverSelectedValues.size && !matrixPopoverTextFilter.trim();

    if (isAllSelected && !matrixPopoverTextFilter.trim()) {
      const next = { ...matrixColumnFilters };
      delete next[matrixActiveFilterCol];
      setMatrixColumnFilters(next);
    } else {
      setMatrixColumnFilters(prev => ({
        ...prev,
        [matrixActiveFilterCol]: {
          textSearch: matrixPopoverTextFilter.trim(),
          selectedValues: new Set(matrixPopoverSelectedValues),
        }
      }));
    }
    setMatrixActiveFilterCol(null);
  };

  const handleClearMatrixColumnFilter = (colKey: string) => {
    const next = { ...matrixColumnFilters };
    delete next[colKey];
    setMatrixColumnFilters(next);
    if (matrixActiveFilterCol === colKey) {
      setMatrixActiveFilterCol(null);
    }
  };

  const handleClearAllMatrixFilters = () => {
    setMatrixColumnFilters({});
    setMatrixActiveFilterCol(null);
  };

  const toggleMatrixValueSelect = (val: string) => {
    setMatrixPopoverSelectedValues(prev => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
  };

  const toggleMatrixSelectAll = (filteredVals: string[]) => {
    const allIn = filteredVals.every(v => matrixPopoverSelectedValues.has(v));
    setMatrixPopoverSelectedValues(prev => {
      const next = new Set(prev);
      if (allIn) {
        filteredVals.forEach(v => next.delete(v));
      } else {
        filteredVals.forEach(v => next.add(v));
      }
      return next;
    });
  };

  const handleMatrixSort = (field: string) => {
    if (matrixSortField === field) {
      setMatrixSortOrder(matrixSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setMatrixSortField(field);
      setMatrixSortOrder('asc');
    }
  };

  // Filtrelenmiş ve Sıralanmış Termal Matris Hastane Listesi
  const filteredHospitalsWithData = useMemo(() => {
    return hospitalsWithData.filter(h => {
      // Sütun filtreleri
      for (const [colKey, filter] of Object.entries(matrixColumnFilters)) {
        const val = getMatrixColValue(h, colKey);

        if (filter.textSearch) {
          if (!val.toLowerCase().includes(filter.textSearch.toLowerCase())) {
            return false;
          }
        }

        if (filter.selectedValues && filter.selectedValues.size > 0) {
          if (!filter.selectedValues.has(val.trim())) {
            return false;
          }
        }
      }
      return true;
    }).sort((a, b) => {
      const aVal = (a as any)[matrixSortField];
      const bVal = (b as any)[matrixSortField];

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return matrixSortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const cmp = String(aVal || '').localeCompare(String(bVal || ''), 'tr');
      return matrixSortOrder === 'asc' ? cmp : -cmp;
    });
  }, [hospitalsWithData, matrixColumnFilters, matrixSortField, matrixSortOrder]);

  const hasActiveMatrixFilters = Object.keys(matrixColumnFilters).length > 0;

  // Matriste filtrelenmiş hastanelerin ID kümesi (filtre aktifse alt tablolar da kısıtlanır)
  const allowedMatrixFacilityIds = useMemo(() => {
    if (!hasActiveMatrixFilters) return null;
    return new Set(filteredHospitalsWithData.map(h => h.facilityId));
  }, [hasActiveMatrixFilters, filteredHospitalsWithData]);

  // 4. Verileri Filtrele ve 3 Kategoride Grupla (Görseldeki Sıra: 1. Normal, 2. Pik Yük, 3. Acil Aksiyon)
  const categorizedData = useMemo(() => {
    let filteredList = hospitalItems;

    // Üst matris tablosu filtresi aktifse alt tabloları da bu hastanelerle sınırla
    if (allowedMatrixFacilityIds) {
      filteredList = filteredList.filter(it => {
        const facId = it.session?.facilityId || it.session?.facility?.id;
        return facId && allowedMatrixFacilityIds.has(facId);
      });
    }

    if (selectedFacilityFilter !== 'ALL') {
      filteredList = filteredList.filter(it => 
        (it.session?.facilityId === selectedFacilityFilter) ||
        (it.session?.facility?.id === selectedFacilityFilter)
      );
    }

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      filteredList = filteredList.filter(it => 
        (it.panelName && it.panelName.toLowerCase().includes(q)) ||
        (it.floorSection && it.floorSection.toLowerCase().includes(q)) ||
        (it.buildingLocation && it.buildingLocation.toLowerCase().includes(q)) ||
        (it.session?.facility?.name && it.session.facility.name.toLowerCase().includes(q)) ||
        (it.equipmentConnection && it.equipmentConnection.toLowerCase().includes(q))
      );
    }

    const urgentActionPanels: ThermalInspectionItem[] = [];
    const peakLoadFollowUpPanels: ThermalInspectionItem[] = [];
    const normalSpecialEquipments: ThermalInspectionItem[] = [];

    filteredList.forEach(item => {
      const m = item.measuredTemp ?? 0;
      const dT = item.deltaTemp ?? 0;
      const equip = (item.equipmentConnection || '').toLowerCase();
      const pName = (item.panelName || '').toLowerCase();
      const floor = (item.floorSection || '').toLowerCase();
      const combined = `${equip} ${pName} ${floor}`;

      const isTransformerOrReactor = 
        combined.includes('trafo') || 
        combined.includes('reaktör') || 
        combined.includes('reaktor') || 
        combined.includes('şönt') || 
        combined.includes('sont') || 
        combined.includes('bobin');

      if (isTransformerOrReactor && m >= 40) {
        normalSpecialEquipments.push(item);
      } else if (m >= 60 || dT >= 30 || combined.includes('yoğun bakım') || combined.includes('it panosu')) {
        urgentActionPanels.push(item);
      } else if (m >= 40 || dT >= 15) {
        peakLoadFollowUpPanels.push(item);
      }
    });

    normalSpecialEquipments.sort((a, b) => (b.measuredTemp ?? 0) - (a.measuredTemp ?? 0));
    peakLoadFollowUpPanels.sort((a, b) => (b.measuredTemp ?? 0) - (a.measuredTemp ?? 0));
    urgentActionPanels.sort((a, b) => (b.measuredTemp ?? 0) - (a.measuredTemp ?? 0));

    return {
      normalSpecialEquipments,
      peakLoadFollowUpPanels,
      urgentActionPanels
    };
  }, [hospitalItems, allowedMatrixFacilityIds, selectedFacilityFilter, searchTerm]);

  // Trend & Karşılaştırmalı Ölçüm Bilgisi
  const getPanelTrendMetrics = (item: ThermalInspectionItem) => {
    if (!item.panelName) return { count: 1, diff: 0, text: 'İlk Ölçüm', isRepeated: false };
    const key = `${item.session?.facilityId || item.session?.facility?.id || ''}_${item.panelName.trim()}`;
    const history = panelHistoryMap.get(key) || [];
    const count = history.length;

    if (count <= 1) {
      return { count: 1, diff: 0, text: '1 Ölçüm', isRepeated: false };
    }

    const prev = history[count - 2];
    const curr = history[count - 1];
    const diff = Number(((curr.measuredTemp ?? 0) - (prev.measuredTemp ?? 0)).toFixed(1));

    if (Math.abs(diff) < 1.0) {
      return { count, diff, text: `Stabil (±${Math.abs(diff)}°C - Devam Ediyor)`, isRepeated: true, type: 'STABLE' };
    } else if (diff > 0) {
      return { count, diff, text: `+${diff}°C Isınma (Kötüye Gidiş)`, isRepeated: true, type: 'WORSENING' };
    } else {
      return { count, diff, text: `${diff}°C İyileşme (Soğuma)`, isRepeated: true, type: 'IMPROVING' };
    }
  };

  const getActionRecommendationNote = (item: ThermalInspectionItem, category: 'NORMAL' | 'PEAK' | 'URGENT') => {
    if (category === 'NORMAL') {
      return 'Üretici kriteri ile teyit edilmelidir';
    }

    const trend = getPanelTrendMetrics(item);
    const trendSuffix = trend.isRepeated ? ` [${trend.count}. Ölçüm: ${trend.text}]` : '';

    const pName = (item.panelName || '').toLowerCase();
    const equip = (item.equipmentConnection || '').toLowerCase();

    if (category === 'URGENT') {
      if (pName.includes('yoğun bakım') || equip.includes('yoğun bakım')) {
        return `Öncelikli teknik kontrol (Yoğun Bakım)${trendSuffix}`;
      }
      if (pName.includes('it panosu') || equip.includes('it panosu')) {
        return `Pik yükte artabilir / Tekrar ölçüm${trendSuffix}`;
      }
      if ((item.measuredTemp ?? 0) >= 70) {
        return `Öncelikli teknik kontrol (Aşırı Isınma)${trendSuffix}`;
      }
      return `Tekrarlayan sıcak nokta / Müdahale${trendSuffix}`;
    }

    if (pName.includes('yoğun bakım')) {
      return `Takip edilmeli (Kritik Mahal)${trendSuffix}`;
    }
    if (pName.includes('soğutma') || equip.includes('soğutma') || pName.includes('klima') || equip.includes('klima')) {
      return `Yük altında tekrar ölçüm${trendSuffix}`;
    }
    return `Pik yükte tekrar ölçüm${trendSuffix}`;
  };

  // Switch to Drilldown page
  const handleOpenDrilldown = (category: DrilldownCategory) => {
    setDrilldownCategory(category);
    setDrilldownPage(1);
    setCurrentView('DRILLDOWN');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Drilldown list calculation
  const currentDrilldownList = useMemo(() => {
    if (drilldownCategory === 'NORMAL_SPECIAL') return categorizedData.normalSpecialEquipments;
    if (drilldownCategory === 'PEAK_LOAD') return categorizedData.peakLoadFollowUpPanels;
    return categorizedData.urgentActionPanels;
  }, [drilldownCategory, categorizedData]);

  const drilldownTotalPages = Math.ceil(currentDrilldownList.length / PAGE_SIZE) || 1;
  const drilldownSlice = currentDrilldownList.slice((drilldownPage - 1) * PAGE_SIZE, drilldownPage * PAGE_SIZE);

  // Top overall metrics for CEO banner (Matris filtresi varsa filtrelenmiş hastaneler üzerinden hesaplanır)
  const activeMatrixHospitals = hasActiveMatrixFilters ? filteredHospitalsWithData : hospitalsWithData;
  const grandTotalUrgent = activeMatrixHospitals.reduce((acc, f) => acc + f.urgentCount, 0);
  const grandTotalPeak = activeMatrixHospitals.reduce((acc, f) => acc + f.peakLoadCount, 0);
  const grandTotalNormalEquip = activeMatrixHospitals.reduce((acc, f) => acc + f.normalEquipCount, 0);
  const hospitalsAtRisk = activeMatrixHospitals.filter(f => f.urgentCount > 0).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      
      {/* ─────────────────────────────────────────────────────────── */}
      {/* CEO STRATEJİK BAŞLIK & KPI DASHBOARD                        */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="relative overflow-hidden p-6 rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 text-white shadow-2xl border border-slate-800">
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-orange-500/20 text-orange-400 border border-orange-500/30 flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5" />
                Yönetici Özeti • Hastaneler Termal Güvenlik Konsolu
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {hasActiveMatrixFilters ? (
                  <span className="text-orange-300 font-semibold">
                    {filteredHospitalsWithData.length} / {hospitalsWithData.length} Hastane (Filtrelenmiş) • {hospitalsWithoutData.length} Henüz Girilmeyen
                  </span>
                ) : (
                  <span>
                    {hospitalsWithData.length} Verisi Girilen • {hospitalsWithoutData.length} Henüz Girilmeyen Hastane
                  </span>
                )}
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white font-sans">
              Hastaneler Termal Kamera & Pano Güvenlik Raporu
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
              Yalnızca <strong>Hastane</strong> statüsündeki binaların ölçümleri analiz edilmektedir. Kritik ilk 6 ekipman özetlenmiş olup, tek tıkla dinamik tüm listeye geçiş yapılabilir.
            </p>
          </div>

          {/* 3 Tıklanabilir KPI Kartı */}
          <div className="grid grid-cols-3 gap-3 shrink-0">
            {/* Acil */}
            <div 
              onClick={() => handleOpenDrilldown('URGENT_ACTION')}
              className="bg-rose-950/40 hover:bg-rose-950/70 border border-rose-800/60 hover:border-rose-500 rounded-2xl p-3.5 px-4 text-center cursor-pointer transition-all hover:scale-105 shadow-lg group"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase text-rose-400 tracking-wider">
                <Flame className="w-3.5 h-3.5 animate-pulse text-rose-500" />
                Acil Aksiyon
              </div>
              <div className="text-3xl font-black text-rose-400 font-mono mt-0.5">
                {grandTotalUrgent}
              </div>
              <span className="text-[10px] text-rose-200/70 block mt-0.5 font-medium">
                {hospitalsAtRisk} Hastanede &gt;
              </span>
            </div>

            {/* Pik Yük */}
            <div 
              onClick={() => handleOpenDrilldown('PEAK_LOAD')}
              className="bg-amber-950/40 hover:bg-amber-950/70 border border-amber-800/60 hover:border-amber-500 rounded-2xl p-3.5 px-4 text-center cursor-pointer transition-all hover:scale-105 shadow-lg group"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase text-amber-400 tracking-wider">
                <Clock className="w-3.5 h-3.5 text-amber-500" />
                Pik Yük Takip
              </div>
              <div className="text-3xl font-black text-amber-400 font-mono mt-0.5">
                {grandTotalPeak}
              </div>
              <span className="text-[10px] text-amber-200/70 block mt-0.5 font-medium">
                &gt;40°C Panolar &gt;
              </span>
            </div>

            {/* Trafo/Reaktör */}
            <div 
              onClick={() => handleOpenDrilldown('NORMAL_SPECIAL')}
              className="bg-teal-950/40 hover:bg-teal-950/70 border border-teal-800/60 hover:border-teal-500 rounded-2xl p-3.5 px-4 text-center cursor-pointer transition-all hover:scale-105 shadow-lg group"
            >
              <div className="flex items-center justify-center gap-1 text-[11px] font-bold uppercase text-teal-400 tracking-wider">
                <Zap className="w-3.5 h-3.5 text-teal-500" />
                Trafo/Reaktör
              </div>
              <div className="text-3xl font-black text-teal-400 font-mono mt-0.5">
                {grandTotalNormalEquip}
              </div>
              <span className="text-[10px] text-teal-200/70 block mt-0.5 font-medium">
                Üretici Eğrisi &gt;
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* GÖRÜNÜM 1: CEO YÖNETİCİ ÖZETİ (SUMMARY VIEW)                 */}
      {/* ─────────────────────────────────────────────────────────── */}
      {currentView === 'SUMMARY' && (
        <div className="space-y-6">
          
          {/* FLIR MÜHENDİSLİK NOTLARI (3 Kutu) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 font-sans">
            <div className="bg-amber-50/90 dark:bg-amber-950/20 border-2 border-amber-300 dark:border-amber-900/60 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center shrink-0 font-black text-sm mt-0.5">
                i
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-amber-950 dark:text-amber-200 block mb-0.5">
                  Ana not: Trafo / Şönt Reaktör Sıcaklığı
                </span>
                <p className="text-amber-900 dark:text-amber-300 text-[11.5px]">
                  Kat panosu gibi yorumlanmamalıdır. Normal çalışma karakteristiği olabilir; üretici limitleri ile doğrulanmalıdır.
                </p>
              </div>
            </div>

            <div className="bg-rose-50/90 dark:bg-rose-950/20 border-2 border-rose-300 dark:border-rose-900/60 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center shrink-0 font-black text-sm mt-0.5">
                !
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-rose-950 dark:text-rose-200 block mb-0.5">
                  Dikkat: 40°C Üzeri Kat & IT Panoları
                </span>
                <p className="text-rose-900 dark:text-rose-300 text-[11.5px]">
                  Ölçüm tam yük dışında olsa bile teknik kontrol gerektirir. Pik saatlerde sıcaklığın aşırı artma riski vardır.
                </p>
              </div>
            </div>

            <div className="bg-orange-50/90 dark:bg-orange-950/20 border-2 border-orange-300 dark:border-orange-900/60 rounded-2xl p-3.5 flex items-start gap-3 shadow-xs">
              <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 font-black text-sm mt-0.5">
                💡
              </div>
              <div className="text-xs leading-relaxed">
                <span className="font-bold text-orange-950 dark:text-orange-200 block mb-0.5">
                  Literatür: Emissivity / Yansıma Etkisi
                </span>
                <p className="text-orange-900 dark:text-orange-300 text-[11.5px]">
                  FLIR: Parlak bakır/baralarda düşük emissivity yalancı okuma üretebilir; elektriksel bant referansıyla doğrulanmalıdır.
                </p>
              </div>
            </div>
          </div>

          {/* ───────────────────────────────────────────────────────── */}
          {/* HASTANELERİN RİSK & ÖLÇÜM MATRİSİ (2 SEKMELİ KOMPAKT TABLO) */}
          {/* ───────────────────────────────────────────────────────── */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs space-y-4">
            
            {/* Matris Başlığı & Sekmeler */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="space-y-0.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-orange-600" />
                  Hastanelerin Termal Risk & Kontrol Matrisi
                </h3>
                <p className="text-xs text-slate-500">
                  Sadece hastanelerin rapor durumu, ölçülen pano sayıları ve kritiklik dağılımı
                </p>
              </div>

              {/* İki Sekmeli Geçiş */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl">
                <button
                  type="button"
                  onClick={() => setMatrixTab('ENTERED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    matrixTab === 'ENTERED'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Ölçümü Olan Hastaneler ({hospitalsWithData.length})
                </button>
                <button
                  type="button"
                  onClick={() => setMatrixTab('NOT_ENTERED')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    matrixTab === 'NOT_ENTERED'
                      ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Henüz Veri Girilmeyen ({hospitalsWithoutData.length})
                </button>
              </div>
            </div>

            {/* SEKME 1: ÖLÇÜMÜ OLAN HASTANELER MATRİS TABLOSU (DEFAULT) */}
            {matrixTab === 'ENTERED' && (
              <div className="space-y-2">
                {/* Filtre Bilgi ve Temizleme Çubuğu */}
                <div className="flex items-center justify-between text-xs px-1">
                  <div className="text-slate-500 font-medium">
                    Toplam <strong className="text-slate-900 dark:text-white font-bold">{hospitalsWithData.length}</strong> hastaneden <strong className="text-orange-600 font-bold">{filteredHospitalsWithData.length}</strong> tanesi listeleniyor
                  </div>
                  {hasActiveMatrixFilters && (
                    <button
                      type="button"
                      onClick={handleClearAllMatrixFilters}
                      className="text-orange-600 hover:text-orange-700 font-bold text-xs hover:underline flex items-center gap-1"
                    >
                      <X className="w-3.5 h-3.5" />
                      Filtreleri Temizle ({Object.keys(matrixColumnFilters).length})
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800 shadow-2xs">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 font-bold uppercase text-[11px] border-b border-slate-200 dark:border-slate-800 select-none">
                      <tr>
                        {/* Başlık Hücre Render Yardımcısı */}
                        {(() => {
                          const renderHeader = (colKey: string, label: string, className = '', isCenter = false) => {
                            const isSorted = matrixSortField === colKey;
                            const isFiltered = Boolean(matrixColumnFilters[colKey]);

                            return (
                              <th className={`py-2 px-2.5 transition-colors font-bold ${className}`}>
                                <div className={`flex items-center gap-1.5 ${isCenter ? 'justify-center' : 'justify-between'}`}>
                                  <div
                                    onClick={() => handleMatrixSort(colKey)}
                                    className="flex items-center gap-1 cursor-pointer hover:text-orange-600 transition-colors"
                                    title="Sıralamak için tıklayın"
                                  >
                                    <span>{label}</span>
                                    {isSorted ? (
                                      matrixSortOrder === 'asc' ? (
                                        <ArrowUp className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                      ) : (
                                        <ArrowDown className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                                      )
                                    ) : (
                                      <ArrowUpDown className="w-3 h-3 opacity-30 hover:opacity-70 shrink-0" />
                                    )}
                                  </div>

                                  <button
                                    type="button"
                                    onClick={(e) => handleOpenMatrixFilter(colKey, e)}
                                    title={`${label} filtresi`}
                                    className={`p-1 rounded transition-colors shrink-0 ${
                                      isFiltered
                                        ? 'bg-orange-600 text-white shadow-2xs'
                                        : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-200/60 dark:hover:bg-slate-700'
                                    }`}
                                  >
                                    <Filter className={`w-3.5 h-3.5 ${isFiltered ? 'fill-current' : ''}`} />
                                  </button>
                                </div>
                              </th>
                            );
                          };

                          return (
                            <>
                              {renderHeader('facilityName', 'Hastane Adı', 'min-w-[170px]')}
                              {renderHeader('reportCount', 'Rapor / Dönem', 'w-32 text-center', true)}
                              {renderHeader('panelCount', 'Pano Sayısı', 'w-28 text-center', true)}
                              {renderHeader('urgentCount', 'Acil Risk', 'w-24 text-center text-rose-600', true)}
                              {renderHeader('peakLoadCount', 'Pik Takip', 'w-24 text-center text-orange-600', true)}
                              {renderHeader('normalEquipCount', 'Trafo/Reaktör', 'w-28 text-center text-teal-600', true)}
                              {renderHeader('normalCount', 'Normal', 'w-24 text-center text-emerald-600', true)}
                              {renderHeader('maxTemp', 'Zirve Sıcaklık', 'w-28 text-center', true)}
                              {renderHeader('maxTempPanel', 'En Sıcak Pano', 'min-w-[140px]')}
                              <th className="py-2.5 px-3 text-right w-20">Filtre</th>
                            </>
                          );
                        })()}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                      {filteredHospitalsWithData.length === 0 ? (
                        <tr>
                          <td colSpan={10} className="py-10 text-center text-slate-400">
                            Filtrelere uygun hastane bulunamadı.
                          </td>
                        </tr>
                      ) : (
                        filteredHospitalsWithData.map((h) => {
                          const isSelected = selectedFacilityFilter === h.facilityId;
                          return (
                            <tr 
                              key={h.facilityId}
                              className={`hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors ${
                                isSelected ? 'bg-orange-50/50 dark:bg-orange-950/30 font-semibold' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-bold text-slate-900 dark:text-white">
                                {h.facilityName}
                              </td>
                              <td className="py-2.5 px-3 text-center font-semibold text-slate-600 dark:text-slate-300">
                                <span className="inline-flex px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[11px] font-bold">
                                  {h.reportCount} Rapor
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-800 dark:text-slate-200">
                                {h.panelCount} Pano
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {h.urgentCount > 0 ? (
                                  <span className="inline-flex px-2 py-0.5 rounded-full font-bold text-xs bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-mono">
                                    {h.urgentCount}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {h.peakLoadCount > 0 ? (
                                  <span className="inline-flex px-2 py-0.5 rounded-full font-semibold text-xs bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300 font-mono">
                                    {h.peakLoadCount}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center">
                                {h.normalEquipCount > 0 ? (
                                  <span className="inline-flex px-2 py-0.5 rounded-full font-semibold text-xs bg-teal-100 text-teal-800 dark:bg-teal-950 dark:text-teal-300 font-mono">
                                    {h.normalEquipCount}
                                  </span>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-700 dark:text-emerald-400 font-semibold">
                                {h.normalCount}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono font-bold">
                                <span className={h.maxTemp >= 60 ? 'text-rose-600' : h.maxTemp >= 40 ? 'text-orange-600' : 'text-slate-700 dark:text-slate-300'}>
                                  {h.maxTemp > 0 ? `${h.maxTemp} °C` : '—'}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 font-medium text-slate-600 dark:text-slate-300 truncate max-w-[150px]" title={h.maxTempPanel}>
                                {h.maxTempPanel}
                              </td>
                              <td className="py-2.5 px-3 text-right">
                                <button
                                  onClick={() => {
                                    setSelectedFacilityFilter(isSelected ? 'ALL' : h.facilityId);
                                  }}
                                  className={`text-xs px-2.5 py-1 rounded-lg font-bold transition-all ${
                                    isSelected
                                      ? 'bg-orange-600 text-white'
                                      : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-orange-100 hover:text-orange-700'
                                  }`}
                                >
                                  {isSelected ? 'Filtreli' : 'Seç'}
                                </button>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* EXCEL FİLTRE POPOVER MENÜSÜ */}
                {matrixActiveFilterCol && matrixFilterPos && (
                  <div 
                    ref={matrixFilterPopoverRef}
                    style={{
                      position: 'fixed',
                      top: `${matrixFilterPos.top}px`,
                      left: `${matrixFilterPos.left}px`,
                      zIndex: 80,
                    }}
                    className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-2xl w-80 p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150 text-xs"
                  >
                    {/* Popover Header */}
                    <div className="flex items-center justify-between border-b pb-2">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <Filter className="w-3.5 h-3.5 text-orange-600 shrink-0" />
                        <span className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {getMatrixColHeaderName(matrixActiveFilterCol)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        {matrixColumnFilters[matrixActiveFilterCol] && (
                          <button
                            type="button"
                            onClick={() => handleClearMatrixColumnFilter(matrixActiveFilterCol)}
                            title="Filtreyi Temizle"
                            className="text-[11px] text-red-600 hover:underline px-1.5 py-0.5 rounded font-medium"
                          >
                            Temizle
                          </button>
                        )}
                        <button 
                          onClick={() => {
                            setMatrixActiveFilterCol(null);
                            setMatrixFilterPos(null);
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800"
                          title="Kapat"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Sıralama Hızlı Seçenekleri */}
                    <div className="space-y-1 border-b pb-2">
                      <button
                        type="button"
                        onClick={() => {
                          setMatrixSortField(matrixActiveFilterCol);
                          setMatrixSortOrder('asc');
                          setMatrixActiveFilterCol(null);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left transition-colors"
                      >
                        <ArrowUp className="w-3.5 h-3.5 text-orange-600" />
                        <span>Artan sırala (Küçükten Büyüğe / A-Z)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setMatrixSortField(matrixActiveFilterCol);
                          setMatrixSortOrder('desc');
                          setMatrixActiveFilterCol(null);
                        }}
                        className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200 text-left transition-colors"
                      >
                        <ArrowDown className="w-3.5 h-3.5 text-orange-600" />
                        <span>Azalan sırala (Büyükten Küçüğe / Z-A)</span>
                      </button>
                    </div>

                    {/* Metin İçerir Araması */}
                    <div className="space-y-1">
                      <label className="text-[11px] font-semibold text-slate-500 block">
                        Metin içerir
                      </label>
                      <input
                        type="text"
                        value={matrixPopoverTextFilter}
                        onChange={(e) => setMatrixPopoverTextFilter(e.target.value)}
                        placeholder="Arama yapın..."
                        className="w-full h-8 px-2.5 rounded-lg border bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-orange-500"
                      />
                    </div>

                    {/* Değerlerde Arama & Checkbox Listesi */}
                    <div className="space-y-1.5">
                      <input
                        type="text"
                        value={matrixPopoverSearch}
                        onChange={(e) => setMatrixPopoverSearch(e.target.value)}
                        placeholder="Seçenekleri filtrele..."
                        className="w-full h-8 px-2.5 rounded-lg border bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 outline-none focus:ring-1 focus:ring-orange-500"
                      />

                      {/* Değerler Listesi & Checkbox */}
                      {(() => {
                        const allVals = getMatrixUniqueColumnValues(matrixActiveFilterCol);
                        const filteredVals = allVals.filter(v => 
                          v.toLowerCase().includes(matrixPopoverSearch.toLowerCase())
                        );
                        const isAllSelected = filteredVals.length > 0 && filteredVals.every(v => matrixPopoverSelectedValues.has(v));

                        return (
                          <div className="space-y-1">
                            <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs font-semibold text-slate-700 dark:text-slate-200 border-b pb-1.5 select-none">
                              <input
                                type="checkbox"
                                checked={isAllSelected}
                                onChange={() => toggleMatrixSelectAll(filteredVals)}
                                className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5"
                              />
                              <span>Tümünü Seç ({filteredVals.length})</span>
                            </label>

                            <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                              {filteredVals.length === 0 ? (
                                <div className="p-2 text-center text-xs text-slate-400">
                                  Değer bulunamadı
                                </div>
                              ) : (
                                filteredVals.map(val => {
                                  const isChecked = matrixPopoverSelectedValues.has(val);
                                  return (
                                    <label
                                      key={val}
                                      className="flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer text-xs text-slate-700 dark:text-slate-300 truncate select-none"
                                      title={val}
                                    >
                                      <input
                                        type="checkbox"
                                        checked={isChecked}
                                        onChange={() => toggleMatrixValueSelect(val)}
                                        className="rounded border-slate-300 text-orange-600 focus:ring-orange-500 w-3.5 h-3.5 shrink-0"
                                      />
                                      <span className="truncate">{val}</span>
                                    </label>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      })()}
                    </div>

                    {/* Popover Butonları */}
                    <div className="flex items-center justify-between pt-2 border-t">
                      {matrixColumnFilters[matrixActiveFilterCol] ? (
                        <button
                          type="button"
                          onClick={() => handleClearMatrixColumnFilter(matrixActiveFilterCol)}
                          className="h-8 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5 rounded"
                        >
                          Filtreyi Kaldır
                        </button>
                      ) : <div />}

                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setMatrixActiveFilterCol(null);
                            setMatrixFilterPos(null);
                          }}
                          className="h-8 text-xs"
                        >
                          Vazgeç
                        </Button>
                        <Button
                          size="sm"
                          onClick={handleApplyMatrixFilter}
                          className="h-8 text-xs bg-orange-600 text-white hover:bg-orange-700"
                        >
                          Uygula
                        </Button>
                      </div>
                    </div>

                  </div>
                )}

              </div>
            )}

            {/* SEKME 2: HENÜZ VERİSİ GİRİLMEYEN HASTANELER */}
            {matrixTab === 'NOT_ENTERED' && (
              <div className="p-4 bg-slate-50/50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
                <p className="text-xs text-slate-500 mb-3">
                  Aşağıdaki hastaneler sisteme kayıtlıdır ancak henüz herhangi bir termal kamera ölçüm formu veya Excel girişi yapılmamıştır:
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                  {hospitalsWithoutData.map((fac) => (
                    <div 
                      key={fac.facilityId}
                      className="p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {fac.facilityName}
                        </span>
                      </div>
                      <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        Ölçüm Bekliyor
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TABLO 1: ACİL AKSİYON ALINMASI GEREKEN PANOLAR (İLK 6)   */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border-2 border-rose-700 dark:border-rose-800 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <div className="bg-[#c51f26] text-white p-3 px-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white text-[#c51f26] font-black text-sm flex items-center justify-center shrink-0">
                  1
                </span>
                <div>
                  <h2 className="font-black text-base sm:text-lg tracking-wide flex items-center gap-2">
                    ACİL AKSİYON ALINMASI GEREKEN PANOLAR
                  </h2>
                  <span className="text-xs text-rose-100 font-medium">
                    (Öncelikli teknik kontrol gerektiren kritik panolar • En sıcak ilk 6 kayıt)
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDrilldown('URGENT_ACTION')}
                className="text-xs font-bold bg-white text-[#c51f26] hover:bg-rose-50 border-0 shadow-sm gap-1"
              >
                Tümünü Gör ({categorizedData.urgentActionPanels.length})
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fceeed] dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-rose-200 font-bold text-xs uppercase">
                  <tr>
                    <th className="py-2.5 px-5 w-1/4">Hastane</th>
                    <th className="py-2.5 px-5 w-1/3">Pano</th>
                    <th className="py-2.5 px-5 text-center w-36">Ölçüm</th>
                    <th className="py-2.5 px-5">Not & Ölçüm Trendi</th>
                    <th className="py-2.5 px-4 text-right w-20">Özet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-rose-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {categorizedData.urgentActionPanels.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-rose-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-5 font-semibold text-slate-900 dark:text-white">
                        {item.session?.facility?.name || item.session?.facility?.shortName || '—'}
                      </td>
                      <td className="py-2.5 px-5 font-medium">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="hover:text-rose-700 font-bold text-left hover:underline cursor-pointer text-slate-950 dark:text-white"
                          title="Özet & Ölçüm Detayını Gör"
                        >
                          {item.panelName} {item.equipmentConnection ? `(${item.equipmentConnection})` : ''}
                        </button>
                      </td>
                      <td className="py-2.5 px-5 text-center font-bold font-mono text-sm text-[#b91c1c]">
                        {item.measuredTemp} °C
                      </td>
                      <td className="py-2.5 px-5 text-rose-700 dark:text-rose-300 font-semibold">
                        {getActionRecommendationNote(item, 'URGENT')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1 text-slate-400 hover:text-rose-700 hover:bg-rose-50 rounded"
                          title="Özet Bilgi & Çoklu Ölçüm İncele"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TABLO 2: PİK YÜKTE DAHA DA ISINABİLECEK PANOLAR (İLK 6)   */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border-2 border-amber-600 dark:border-amber-700 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <div className="bg-[#d96b14] text-white p-3 px-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white text-[#d96b14] font-black text-sm flex items-center justify-center shrink-0">
                  2
                </span>
                <div>
                  <h2 className="font-black text-base sm:text-lg tracking-wide flex items-center gap-2">
                    PİK YÜKTE DAHA DA ISINABİLECEK PANOLAR
                  </h2>
                  <span className="text-xs text-amber-100 font-medium">
                    (40°C üstü ve pik yükte tekrar ölçülmesi gerekenler • En sıcak ilk 6 pano)
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDrilldown('PEAK_LOAD')}
                className="text-xs font-bold bg-white text-[#d96b14] hover:bg-amber-50 border-0 shadow-sm gap-1"
              >
                Tümünü Gör ({categorizedData.peakLoadFollowUpPanels.length})
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#fef4ea] dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-amber-200 font-bold text-xs uppercase">
                  <tr>
                    <th className="py-2.5 px-5 w-1/4">Hastane</th>
                    <th className="py-2.5 px-5 w-1/3">Pano</th>
                    <th className="py-2.5 px-5 text-center w-36">Ölçüm</th>
                    <th className="py-2.5 px-5">Not & Ölçüm Trendi</th>
                    <th className="py-2.5 px-4 text-right w-20">Özet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-amber-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {categorizedData.peakLoadFollowUpPanels.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-amber-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-5 font-semibold text-slate-900 dark:text-white">
                        {item.session?.facility?.name || item.session?.facility?.shortName || '—'}
                      </td>
                      <td className="py-2.5 px-5 font-medium">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="hover:text-amber-700 font-bold text-left hover:underline cursor-pointer"
                          title="Özet & Ölçüm Detayını Gör"
                        >
                          {item.panelName} {item.equipmentConnection ? `(${item.equipmentConnection})` : ''}
                        </button>
                      </td>
                      <td className="py-2.5 px-5 text-center font-bold font-mono text-sm text-[#b91c1c]">
                        {item.measuredTemp} °C
                      </td>
                      <td className="py-2.5 px-5 text-slate-600 dark:text-slate-300 font-medium">
                        {getActionRecommendationNote(item, 'PEAK')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1 text-slate-400 hover:text-amber-700 hover:bg-amber-50 rounded"
                          title="Özet Bilgi & Çoklu Ölçüm İncele"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* ═════════════════════════════════════════════════════════ */}
          {/* TABLO 3: SICAKLIĞI NORMAL OLABİLECEK EKİPMANLAR (İLK 6)   */}
          {/* ═════════════════════════════════════════════════════════ */}
          <div className="rounded-2xl border-2 border-teal-800 dark:border-teal-700 overflow-hidden shadow-sm bg-white dark:bg-slate-900">
            <div className="bg-[#1b5e52] text-white p-3 px-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="w-7 h-7 rounded-full bg-white text-[#1b5e52] font-black text-sm flex items-center justify-center shrink-0">
                  3
                </span>
                <div>
                  <h2 className="font-black text-base sm:text-lg tracking-wide flex items-center gap-2">
                    SICAKLIĞI NORMAL OLABİLECEK EKİPMANLAR
                  </h2>
                  <span className="text-xs text-teal-100 font-medium">
                    (Üretici kriteri ile teyit edilmelidir • En sıcak ilk 6 ekipman)
                  </span>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => handleOpenDrilldown('NORMAL_SPECIAL')}
                className="text-xs font-bold bg-white text-[#1b5e52] hover:bg-teal-50 border-0 shadow-sm gap-1"
              >
                Tümünü Gör ({categorizedData.normalSpecialEquipments.length})
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-[#e9f2ef] dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-b border-teal-200 font-bold text-xs uppercase">
                  <tr>
                    <th className="py-2.5 px-5 w-1/4">Hastane</th>
                    <th className="py-2.5 px-5 w-1/3">Ekipman</th>
                    <th className="py-2.5 px-5 text-center w-36">Ölçüm</th>
                    <th className="py-2.5 px-5">Not & Ölçüm Trendi</th>
                    <th className="py-2.5 px-4 text-right w-20">Özet</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-teal-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {categorizedData.normalSpecialEquipments.slice(0, 6).map((item) => (
                    <tr key={item.id} className="hover:bg-teal-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 px-5 font-semibold text-slate-900 dark:text-white">
                        {item.session?.facility?.name || item.session?.facility?.shortName || '—'}
                      </td>
                      <td className="py-2.5 px-5 font-medium">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="hover:text-teal-700 font-bold text-left hover:underline cursor-pointer"
                          title="Özet & Ölçüm Detayını Gör"
                        >
                          {item.equipmentConnection ? `${item.panelName} (${item.equipmentConnection})` : item.panelName}
                        </button>
                      </td>
                      <td className="py-2.5 px-5 text-center font-bold font-mono text-sm text-[#b91c1c]">
                        {item.measuredTemp} °C
                      </td>
                      <td className="py-2.5 px-5 text-slate-600 dark:text-slate-300 font-medium">
                        {getActionRecommendationNote(item, 'NORMAL')}
                      </td>
                      <td className="py-2.5 px-4 text-right">
                        <button
                          onClick={() => setPreviewItem(item)}
                          className="p-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded"
                          title="Özet Bilgi & Çoklu Ölçüm İncele"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* GÖRÜNÜM 2: DİNAMİK TÜM LİSTE SAYFASI (DRILLDOWN VIEW)        */}
      {/* ─────────────────────────────────────────────────────────── */}
      {currentView === 'DRILLDOWN' && (
        <div className="space-y-4">
          
          {/* Geri Dönüş ve Kategori Başlığı Barı */}
          <div className="p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentView('SUMMARY')}
                className="gap-1.5 font-bold text-xs border-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ArrowLeft className="w-4 h-4" />
                Yönetici Özetine Dön
              </Button>
              <div className="h-6 w-px bg-slate-200 dark:bg-slate-700" />
              <div>
                <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  {drilldownCategory === 'NORMAL_SPECIAL' && '1. SICAKLIĞI NORMAL OLABİLECEK EKİPMANLAR'}
                  {drilldownCategory === 'PEAK_LOAD' && '2. PİK YÜKTE DAHA DA ISINABİLECEK PANOLAR'}
                  {drilldownCategory === 'URGENT_ACTION' && '3. ACİL AKSİYON ALINMASI GEREKEN PANOLAR'}
                  <Badge className="text-xs">
                    {currentDrilldownList.length} Kayıt
                  </Badge>
                </h2>
                <span className="text-xs text-slate-500">
                  Tüm hastanelerden gelen detaylı liste ve arama ekranı
                </span>
              </div>
            </div>

            {/* Arama & Hastane Filtresi */}
            <div className="flex items-center gap-2">
              <select
                value={selectedFacilityFilter}
                onChange={(e) => {
                  setSelectedFacilityFilter(e.target.value);
                  setDrilldownPage(1);
                }}
                className="text-xs font-semibold h-9 px-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <option value="ALL">
                  {hasActiveMatrixFilters ? `Filtrelenen Hastaneler (${activeMatrixHospitals.length})` : 'Tüm Hastaneler'}
                </option>
                {activeMatrixHospitals.map(h => (
                  <option key={h.facilityId} value={h.facilityId}>{h.facilityName}</option>
                ))}
              </select>

              <div className="relative w-48 sm:w-60">
                <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                <Input
                  placeholder="Pano veya ekipman ara..."
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setDrilldownPage(1);
                  }}
                  className="pl-8 text-xs h-9 bg-slate-50 dark:bg-slate-800/60"
                />
              </div>
            </div>
          </div>

          {/* Dinamik Liste Tablosu */}
          <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-slate-600 dark:text-slate-300 border-b border-slate-200 font-bold uppercase text-[11px]">
                  <tr>
                    <th className="py-3 px-4 w-12 text-center">#</th>
                    <th className="py-3 px-4">Hastane / Tesis</th>
                    <th className="py-3 px-4">Pano No / Adı</th>
                    <th className="py-3 px-4">Kat / Lokasyon</th>
                    <th className="py-3 px-4">Ekipman</th>
                    <th className="py-3 px-4 text-center">Ölçülen (°C)</th>
                    <th className="py-3 px-4 text-center">ΔT (°C)</th>
                    <th className="py-3 px-4">Not & Ölçüm Trendi</th>
                    <th className="py-3 px-4 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {drilldownSlice.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-12 text-center text-slate-400 font-medium">
                        Kriterlere uygun kayıt bulunamadı.
                      </td>
                    </tr>
                  ) : (
                    drilldownSlice.map((item, idx) => {
                      const trend = getPanelTrendMetrics(item);
                      return (
                        <tr key={item.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                          <td className="py-3 px-4 text-center text-slate-400 font-mono">
                            {(drilldownPage - 1) * PAGE_SIZE + idx + 1}
                          </td>
                          <td className="py-3 px-4 font-bold text-slate-900 dark:text-white">
                            {item.session?.facility?.name || item.session?.facility?.shortName || '—'}
                          </td>
                          <td className="py-3 px-4 font-bold">
                            <button
                              onClick={() => setPreviewItem(item)}
                              className="hover:text-orange-600 font-bold text-left flex items-center gap-1 hover:underline cursor-pointer"
                              title="Özet & Ölçüm Detayını Gör"
                            >
                              {item.panelName}
                              <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                            </button>
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {item.floorSection || item.buildingLocation || '—'}
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-slate-300">
                            {item.equipmentConnection || '—'}
                          </td>
                          <td className="py-3 px-4 text-center font-bold font-mono text-sm text-[#b91c1c]">
                            {item.measuredTemp} °C
                          </td>
                          <td className="py-3 px-4 text-center font-mono font-bold text-slate-700 dark:text-slate-300">
                            {item.deltaTemp !== null ? `+${item.deltaTemp}°C` : '—'}
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-medium text-slate-700 dark:text-slate-300 block">
                              {getActionRecommendationNote(item, drilldownCategory === 'NORMAL_SPECIAL' ? 'NORMAL' : drilldownCategory === 'PEAK_LOAD' ? 'PEAK' : 'URGENT')}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => setPreviewItem(item)}
                              className="text-xs h-7 px-2 text-slate-600 hover:text-orange-600 hover:bg-orange-50 gap-1"
                            >
                              <Eye className="w-3.5 h-3.5" />
                              Özet
                            </Button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {currentDrilldownList.length > PAGE_SIZE && (
              <div className="p-3.5 px-5 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between text-xs text-slate-500">
                <div>
                  Toplam <strong>{currentDrilldownList.length}</strong> kayıttan <strong>{(drilldownPage - 1) * PAGE_SIZE + 1}</strong> - <strong>{Math.min(drilldownPage * PAGE_SIZE, currentDrilldownList.length)}</strong> arası gösteriliyor
                </div>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrilldownPage(p => Math.max(1, p - 1))}
                    disabled={drilldownPage === 1}
                    className="h-8 px-2.5 text-xs"
                  >
                    Önceki
                  </Button>
                  <span className="font-bold px-2">{drilldownPage} / {drilldownTotalPages}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setDrilldownPage(p => Math.min(drilldownTotalPages, p + 1))}
                    disabled={drilldownPage >= drilldownTotalPages}
                    className="h-8 px-2.5 text-xs"
                  >
                    Sonraki
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* DETAY & ÖLÇÜM ÖZETİ MODALI (PANO ÖLÇÜMÜ İÇİN VIEW EKRANI)   */}
      {/* ─────────────────────────────────────────────────────────── */}
      {previewItem && (
        <ThermalItemDetailModal
          isOpen={!!previewItem}
          onClose={() => setPreviewItem(null)}
          item={previewItem}
          facilityId={previewItem.session?.facilityId || previewItem.session?.facility?.id}
          panelHistory={
            previewItem.panelName 
              ? (panelHistoryMap.get(`${previewItem.session?.facilityId || previewItem.session?.facility?.id || ''}_${previewItem.panelName.trim()}`) || [])
              : []
          }
          onOpenPanelPage={(pName) => {
            setPreviewItem(null);
            onOpenPanelDetail(pName);
          }}
        />
      )}

    </div>
  );
};
