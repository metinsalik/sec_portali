import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  Plus,
  Trash2,
  ChevronDown,
  ChevronRight,
  Pencil,
  Check,
  X,
  Loader2,
  Building,
  Building2,
  FileSpreadsheet,
  Download,
  Upload,
  Layers,
  Search,
  CheckCircle2,
  BookOpen,
  MapPin,
  Briefcase,
  DoorOpen,
  RefreshCw,
  GitMerge,
  ArrowUpDown,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { STANDARD_BLOCKS, STANDARD_FLOORS, getBlockCode, getFloorCode, generateLocationCode } from '@/data/locationStandards';
import StandardCodesModal from '@/components/shared/StandardCodesModal';
import { extractLocationParts } from '@/utils/locationHierarchy';

type InlineTarget = {
  level: 'block' | 'floor' | 'department' | 'description';
  buildingName: string;
  block: string;
  floor: string;
  department: string;
  nodeKey: string;
};

type RenameTarget = {
  level: 'buildingName' | 'building' | 'floor' | 'department' | 'description';
  oldValue: string;
  parentBuildingName?: string;
  parentBuilding?: string;
  parentFloor?: string;
  parentDepartment?: string;
  nodeKey: string;
};

type MergeTarget = {
  level: 'buildingName' | 'building' | 'floor' | 'department' | 'description';
  sourceValue: string;
  sourceId?: string;
  parentBuildingName?: string;
  parentBuilding?: string;
  parentFloor?: string;
  parentDepartment?: string;
};

const LEVEL_LABELS: Record<string, string> = {
  buildingName: 'Bina Adı',
  building: 'Blok',
  floor: 'Kat',
  department: 'Birim / Bölüm',
  description: 'Mahal / Oda',
};

// Helper to extract floor numeric rank (e.g. 13. Kat -> 13, -1. Kat -> -1, Zemin Kat -> 0)
export function parseFloorRank(name?: string | null): number {
  if (!name) return -10000;
  const s = name.trim().toLowerCase();
  if (s.includes('belirtilmemiş')) return -10000;
  if (s.includes('çatı') || s.includes('teras')) return 1000;
  if (s.includes('asma')) return 0.5;
  if (s.startsWith('z') || s.includes('zemin') || s.includes('giriş')) return 0;

  // Negative / bodrum floors: -1, -2, b1, b2, bodrum 1
  const bodrumMatch = s.match(/(?:bodrum|b)\s*([0-9]+)/);
  if (bodrumMatch) {
    return -parseInt(bodrumMatch[1], 10);
  }
  const negMatch = s.match(/-\s*([0-9]+)/);
  if (negMatch) {
    return -parseInt(negMatch[1], 10);
  }
  // Positive number: 13. Kat, 13., 13, 1. Kat
  const numMatch = s.match(/([0-9]+)/);
  if (numMatch) {
    return parseInt(numMatch[1], 10);
  }
  return -9000;
}

export function compareFloors(a: any, b: any, sortDesc = true): number {
  const rankA = parseFloorRank(a.name);
  const rankB = parseFloorRank(b.name);
  if (rankA !== rankB) {
    return sortDesc ? rankB - rankA : rankA - rankB;
  }
  return (a.name || '').localeCompare(b.name || '', 'tr', { numeric: true });
}

export function compareBlocks(a: any, b: any): number {
  if (a.isPlaceholder && !b.isPlaceholder) return 1;
  if (!a.isPlaceholder && b.isPlaceholder) return -1;
  return (a.name || '').localeCompare(b.name || '', 'tr', { numeric: true });
}

export function compareDepartments(a: any, b: any): number {
  if (a.isPlaceholder && !b.isPlaceholder) return 1;
  if (!a.isPlaceholder && b.isPlaceholder) return -1;
  return (a.name || '').localeCompare(b.name || '', 'tr', { numeric: true });
}

export function compareRooms(a: any, b: any): number {
  return (a.name || '').localeCompare(b.name || '', 'tr', { numeric: true });
}

export default function FacilityLocationsPage() {
  const queryClient = useQueryClient();
  const [facilityId, setFacilityId] = useState(() => localStorage.getItem('activeFacilityId') || '');

  useEffect(() => {
    const onFacilityChanged = () => {
      setFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', onFacilityChanged);
    window.addEventListener('storage', onFacilityChanged);
    return () => {
      window.removeEventListener('facilityChanged', onFacilityChanged);
      window.removeEventListener('storage', onFacilityChanged);
    };
  }, []);

  const [isCodesModalOpen, setIsCodesModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // 5-seviyeli hızlı ekleme formu: Bina Adı > Blok > Kat > Birim > Mahal
  const [newLocation, setNewLocation] = useState({
    buildingName: 'Ana Bina',
    block: '',
    floor: 'Z.Kat',
    department: '',
    description: '',
  });

  const [searchQuery, setSearchQuery] = useState('');
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>({});
  const [inlineAdd, setInlineAdd] = useState<InlineTarget | null>(null);
  const [inlineValue, setInlineValue] = useState('');
  const [renameTarget, setRenameTarget] = useState<RenameTarget | null>(null);
  const [renameValue, setRenameValue] = useState('');

  // Sıralama ve Birleştirme (Merge) durumları
  const [floorSortDesc, setFloorSortDesc] = useState<boolean>(true);
  const [mergeTarget, setMergeTarget] = useState<MergeTarget | null>(null);
  const [mergeDestinationValue, setMergeDestinationValue] = useState('');
  const [mergeDestinationId, setMergeDestinationId] = useState('');
  const [isCustomDestination, setIsCustomDestination] = useState(false);

  // Silme ve Bağlı Veri Aktarma (Dependency Transfer) durumları
  const [deletePromptTarget, setDeletePromptTarget] = useState<{
    label: string;
    level: string;
    value: string;
    parentBuildingName?: string;
    parentBuilding?: string;
    parentFloor?: string;
    parentDepartment?: string;
    id?: string;
  } | null>(null);
  const [dependencyInfo, setDependencyInfo] = useState<{
    hasDependencies: boolean;
    totalCount: number;
    breakdown: {
      risks: number;
      fireEquipments: number;
      hazmatMaterials: number;
      incidents: number;
      extraordinaryIncidents: number;
      buildProjects: number;
      btSoruBankasi: number;
      btUygunsuzluklar: number;
      fireDoors: number;
    };
    targetLocationCount: number;
  } | null>(null);
  const [deleteTransferValue, setDeleteTransferValue] = useState('');
  const [deleteTransferId, setDeleteTransferId] = useState('');
  const [isCustomDeleteTransfer, setIsCustomDeleteTransfer] = useState(false);
  const [isCheckingDelete, setIsCheckingDelete] = useState(false);

  const { data: facilities = [] } = useQuery({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) return [];
      return res.json();
    },
  });

  const { data: locations = [], isLoading } = useQuery({
    queryKey: ['facility-locations', facilityId],
    queryFn: async () => {
      if (!facilityId || facilityId === 'all' || facilityId === 'ALL') return [];
      const res = await api.get(`/locations?facilityId=${facilityId}`);
      if (!res.ok) throw new Error('Lokasyonlar getirilemedi');
      return res.json();
    },
    enabled: !!facilityId && facilityId !== 'all' && facilityId !== 'ALL',
  });

  const invalidateAllLocationQueries = () => {
    queryClient.invalidateQueries({ queryKey: ['facility-locations'] });
    queryClient.invalidateQueries({ queryKey: ['facilities'] });
  };

  const syncFromFm200Mutation = useMutation({
    mutationFn: async (targetFacilityId?: string) => {
      const res = await api.post('/locations/sync-from-fm200', {
        facilityId: targetFacilityId || 'ALL',
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'FM200 eşitlemesi başarısız');
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      invalidateAllLocationQueries();
      toast.success(data?.message || 'FM200 Bina/Blok/Kat verileri eşitlendi');
      setIsSyncModalOpen(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'FM200 eşitlemesi sırasında hata oluştu');
    },
  });

  const addMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations', { ...data, facilityId });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Ekleme başarısız');
      }
      return res.json();
    },
    onSuccess: (_data, variables) => {
      invalidateAllLocationQueries();
      toast.success('Lokasyon eklendi');
      if (variables?.isInline) {
        setInlineAdd(null);
        setInlineValue('');
      } else {
        // Hızlı eklemede üst seviyeleri koru, Birim ve Mahal'ı temizle
        setNewLocation((prev) => ({
          ...prev,
          department: '',
          description: '',
        }));
      }
    },
    onError: (err: any) => {
      toast.error(err.message || 'Lokasyon eklenirken hata oluştu');
    },
  });

  const renameMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations/rename-node', { ...data, facilityId });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Güncelleme başarısız');
      }
      return res.json();
    },
    onSuccess: () => {
      invalidateAllLocationQueries();
      toast.success('İsim güncellendi');
      setRenameTarget(null);
      setRenameValue('');
    },
    onError: (err: any) => {
      toast.error(err.message || 'Güncelleme başarısız');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations/delete-node', { ...data, facilityId });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Silme başarısız');
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      invalidateAllLocationQueries();
      toast.success(data?.message || 'Lokasyon silindi');
      setDeletePromptTarget(null);
      setDependencyInfo(null);
      setDeleteTransferValue('');
      setDeleteTransferId('');
      setIsCustomDeleteTransfer(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Silme başarısız');
    },
  });

  const mergeMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.post('/locations/merge-nodes', { ...data, facilityId });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Birleştirme işlemi başarısız');
      }
      return res.json();
    },
    onSuccess: (data: any) => {
      invalidateAllLocationQueries();
      toast.success(data?.message || 'Lokasyonlar başarıyla birleştirildi');
      setMergeTarget(null);
      setMergeDestinationValue('');
      setMergeDestinationId('');
      setIsCustomDestination(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Birleştirme işlemi sırasında hata oluştu');
    },
  });

  const openMergeModal = (target: MergeTarget) => {
    setMergeTarget(target);
    setMergeDestinationValue('');
    setMergeDestinationId('');
    setIsCustomDestination(false);
  };

  const executeMerge = () => {
    if (!mergeTarget) return;
    const targetVal = mergeDestinationValue.trim();
    if (!targetVal && !mergeDestinationId) {
      toast.error('Lütfen birleştirilecek hedef lokasyonu seçin veya girin.');
      return;
    }
    if (!mergeDestinationId && targetVal.toLowerCase() === mergeTarget.sourceValue.toLowerCase()) {
      toast.error('Kaynak ve hedef lokasyon aynı olamaz.');
      return;
    }

    mergeMutation.mutate({
      level: mergeTarget.level,
      sourceValue: mergeTarget.sourceValue,
      sourceId: mergeTarget.sourceId,
      targetValue: targetVal,
      targetId: mergeDestinationId || undefined,
      parentBuildingName: mergeTarget.parentBuildingName,
      parentBuilding: mergeTarget.parentBuilding,
      parentFloor: mergeTarget.parentFloor,
      parentDepartment: mergeTarget.parentDepartment,
    });
  };

  const addLocFromForm = () => {
    if (!newLocation.buildingName.trim()) {
      toast.error('Lütfen Bina Adı giriniz.');
      return;
    }
    addMutation.mutate({
      buildingName: newLocation.buildingName.trim(),
      building: newLocation.block.trim() || null,
      floor: newLocation.floor.trim() || null,
      department: newLocation.department.trim() || null,
      description: newLocation.description.trim() || null,
    });
  };

  const openInlineAdd = (target: InlineTarget) => {
    setInlineAdd(target);
    setInlineValue('');
    setExpandedNodes((prev) => ({ ...prev, [target.nodeKey]: true }));
  };

  const saveInlineAdd = () => {
    if (!inlineAdd || !inlineValue.trim()) return;
    const val = inlineValue.trim();
    const isNoBlock = inlineAdd.block === 'Blok Belirtilmemiş';
    const isNoFloor = inlineAdd.floor === 'Kat Belirtilmemiş';

    addMutation.mutate({
      isInline: true,
      buildingName: inlineAdd.buildingName,
      building: inlineAdd.level === 'block' ? val : (isNoBlock ? null : inlineAdd.block),
      floor: inlineAdd.level === 'floor' ? val : (inlineAdd.level === 'block' ? null : (isNoFloor ? null : inlineAdd.floor)),
      department: inlineAdd.level === 'department' ? val : (inlineAdd.level === 'description' ? inlineAdd.department : null),
      description: inlineAdd.level === 'description' ? val : null,
    });
  };

  const startRename = (target: RenameTarget) => {
    setRenameTarget(target);
    setRenameValue(target.oldValue);
  };

  const saveRename = () => {
    if (!renameTarget || !renameValue.trim()) return;
    renameMutation.mutate({
      level: renameTarget.level,
      oldValue: renameTarget.oldValue,
      newValue: renameValue.trim(),
      parentBuildingName: renameTarget.parentBuildingName,
      parentBuilding: renameTarget.parentBuilding,
      parentFloor: renameTarget.parentFloor,
      parentDepartment: renameTarget.parentDepartment,
    });
  };

  const removeNode = async (payload: {
    label: string;
    level: string;
    value: string;
    parentBuildingName?: string;
    parentBuilding?: string;
    parentFloor?: string;
    parentDepartment?: string;
    id?: string;
  }) => {
    setIsCheckingDelete(true);
    try {
      const res = await api.post('/locations/check-dependencies', {
        facilityId,
        level: payload.level,
        value: payload.value,
        parentBuildingName: payload.parentBuildingName,
        parentBuilding: payload.parentBuilding,
        parentFloor: payload.parentFloor,
        parentDepartment: payload.parentDepartment,
        id: payload.id,
      });

      const depData = await res.json();
      if (depData?.hasDependencies && depData.totalCount > 0) {
        // BAĞLI VERİLER VAR: Kullanıcıya aktaracağı yeni konumu sor
        setDeletePromptTarget(payload);
        setDependencyInfo(depData);
        setDeleteTransferValue('');
        setDeleteTransferId('');
        setIsCustomDeleteTransfer(false);
        return;
      }
    } catch (err) {
      console.warn('Bağlı kayıt kontrolü yapılamadı, standart silmeye geçiliyor:', err);
    } finally {
      setIsCheckingDelete(false);
    }

    // BAĞLI VERİ YOK: Normal hızlı onay ve silme
    if (!window.confirm(`"${payload.label}" ve altındaki tüm kayıtlar silinecek. Onaylıyor musunuz?`)) return;
    deleteMutation.mutate({
      level: payload.level,
      value: payload.value,
      parentBuildingName: payload.parentBuildingName,
      parentBuilding: payload.parentBuilding,
      parentFloor: payload.parentFloor,
      parentDepartment: payload.parentDepartment,
      id: payload.id,
    });
  };

  const executeDeleteWithTransfer = () => {
    if (!deletePromptTarget) return;
    const targetVal = deleteTransferValue.trim();
    if (!targetVal && !deleteTransferId) {
      toast.error('Lütfen verilerin aktarılacağı hedef lokasyonu seçin veya girin.');
      return;
    }

    deleteMutation.mutate({
      level: deletePromptTarget.level,
      value: deletePromptTarget.value,
      parentBuildingName: deletePromptTarget.parentBuildingName,
      parentBuilding: deletePromptTarget.parentBuilding,
      parentFloor: deletePromptTarget.parentFloor,
      parentDepartment: deletePromptTarget.parentDepartment,
      id: deletePromptTarget.id,
      transferTargetId: deleteTransferId || undefined,
      transferTargetValue: targetVal || undefined,
    });
  };

  const toggleNode = (nodeId: string) => {
    setExpandedNodes((prev) => ({ ...prev, [nodeId]: prev[nodeId] === undefined ? false : !prev[nodeId] }));
  };

  const isNodeExpanded = (nodeId: string, defaultOpen = true) => {
    return expandedNodes[nodeId] !== undefined ? expandedNodes[nodeId] : defaultOpen;
  };

  const handleDownloadTemplate = () => {
    window.open('/api/locations/excel-template', '_blank');
  };

  const handleExcelImport = async () => {
    if (!excelFile) {
      toast.error('Lütfen bir Excel dosyası seçin');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', excelFile);
    if (facilityId && facilityId !== 'all' && facilityId !== 'ALL') {
      formData.append('facilityId', facilityId);
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/locations/import-excel', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İçe aktarma başarısız');

      toast.success(data.message || 'Konumlar aktarıldı');
      setIsExcelModalOpen(false);
      setExcelFile(null);
      invalidateAllLocationQueries();
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu');
    } finally {
      setIsImporting(false);
    }
  };

  const currentFacility = useMemo(() => {
    return facilities.find((f: any) => f.id === facilityId);
  }, [facilities, facilityId]);

  // Mevcut kayıtlardan autocomplete listeleri
  const suggestionLists = useMemo(() => {
    const bNames = new Set<string>(['Ana Bina', 'Ek Bina', 'Poliklinik Binası']);
    (currentFacility?.buildings || []).forEach((b: any) => {
      if (b?.name) bNames.add(b.name);
    });
    const blocks = new Set<string>(STANDARD_BLOCKS.map((sb) => sb.name));
    const floors = new Set<string>(STANDARD_FLOORS.map((sf) => sf.name));
    const departments = new Set<string>();
    const descriptions = new Set<string>();

    locations.forEach((loc: any) => {
      const p = extractLocationParts(loc);
      if (p.buildingName) bNames.add(p.buildingName);
      if (p.block) blocks.add(p.block);
      if (p.floor) floors.add(p.floor);
      if (p.department) departments.add(p.department);
      if (p.description) descriptions.add(p.description);
    });

    return {
      buildingNames: Array.from(bNames),
      blocks: Array.from(blocks),
      floors: Array.from(floors),
      departments: Array.from(departments).sort(),
      descriptions: Array.from(descriptions).sort(),
    };
  }, [locations, currentFacility]);

  // 5-Seviyeli Hiyerarşik Ağaç: Bina Adı > Blok > Kat > Birim > Mahal
  const tree = useMemo(() => {
    const root: Record<string, any> = {};
    const q = searchQuery.trim().toLowerCase();

    locations.forEach((loc: any) => {
      const p = extractLocationParts(loc);
      const bName = p.buildingName || 'Bina Belirtilmemiş';
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
        root[bName] = { id: bId, name: bName, blocks: {}, count: 0 };
      }
      root[bName].count += 1;

      const blkId = `blk-${bName}-${blk}`;
      if (!root[bName].blocks[blk]) {
        root[bName].blocks[blk] = { id: blkId, name: blk, isPlaceholder: !p.block, floors: {}, count: 0 };
      }
      root[bName].blocks[blk].count += 1;

      if (!flr && !dept && !desc) return;

      const flrKey = flr || 'Kat Belirtilmemiş';
      const flrId = `flr-${bName}-${blk}-${flrKey}`;
      if (!root[bName].blocks[blk].floors[flrKey]) {
        root[bName].blocks[blk].floors[flrKey] = {
          id: flrId,
          name: flrKey,
          isPlaceholder: !flr,
          departments: {},
          locations: [],
        };
      }
      root[bName].blocks[blk].floors[flrKey].locations.push(loc);

      if (!dept && !desc) return;

      const deptKey = dept || 'Birim Belirtilmemiş';
      const deptId = `dept-${bName}-${blk}-${flrKey}-${deptKey}`;
      if (!root[bName].blocks[blk].floors[flrKey].departments[deptKey]) {
        root[bName].blocks[blk].floors[flrKey].departments[deptKey] = {
          id: deptId,
          name: deptKey,
          isPlaceholder: !dept,
          rooms: [],
        };
      }

      if (desc) {
        root[bName].blocks[blk].floors[flrKey].departments[deptKey].rooms.push({
          id: loc.id,
          name: desc,
          loc,
        });
      }
    });

    return root;
  }, [locations, searchQuery]);

  const mergeTargetCandidates = useMemo(() => {
    if (!mergeTarget) return [];
    const { level, sourceValue, sourceId, parentBuildingName, parentBuilding, parentFloor, parentDepartment } = mergeTarget;

    if (level === 'buildingName') {
      return Object.values(tree)
        .map((b: any) => ({ label: b.name, value: b.name }))
        .filter((b) => b.value.toLowerCase() !== sourceValue.toLowerCase());
    }

    if (level === 'building') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      if (!binaNode) return [];
      return Object.values(binaNode.blocks)
        .filter((blk: any) => !blk.isPlaceholder && blk.name.toLowerCase() !== sourceValue.toLowerCase())
        .sort(compareBlocks)
        .map((blk: any) => ({ label: blk.name, value: blk.name }));
    }

    if (level === 'floor') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      const blokNode = binaNode
        ? (Object.values(binaNode.blocks).find(
          (blk: any) => blk.name === parentBuilding || (blk.isPlaceholder && !parentBuilding)
        ) as any)
        : null;
      if (!blokNode) return [];
      return Object.values(blokNode.floors)
        .filter((flr: any) => !flr.isPlaceholder && flr.name.toLowerCase() !== sourceValue.toLowerCase())
        .sort((a: any, b: any) => compareFloors(a, b, floorSortDesc))
        .map((flr: any) => ({ label: flr.name, value: flr.name }));
    }

    if (level === 'department') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      const blokNode = binaNode
        ? (Object.values(binaNode.blocks).find(
          (blk: any) => blk.name === parentBuilding || (blk.isPlaceholder && !parentBuilding)
        ) as any)
        : null;
      const floorNode = blokNode
        ? (Object.values(blokNode.floors).find(
          (f: any) => f.name === parentFloor || (f.isPlaceholder && !parentFloor)
        ) as any)
        : null;
      if (!floorNode) return [];
      return Object.values(floorNode.departments)
        .filter((dept: any) => !dept.isPlaceholder && dept.name.toLowerCase() !== sourceValue.toLowerCase())
        .sort(compareDepartments)
        .map((dept: any) => ({ label: dept.name, value: dept.name }));
    }

    if (level === 'description') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      const blokNode = binaNode
        ? (Object.values(binaNode.blocks).find(
          (blk: any) => blk.name === parentBuilding || (blk.isPlaceholder && !parentBuilding)
        ) as any)
        : null;
      const floorNode = blokNode
        ? (Object.values(blokNode.floors).find(
          (f: any) => f.name === parentFloor || (f.isPlaceholder && !parentFloor)
        ) as any)
        : null;
      const deptNode = floorNode
        ? (Object.values(floorNode.departments).find(
          (d: any) => d.name === parentDepartment || (d.isPlaceholder && !parentDepartment)
        ) as any)
        : null;
      if (!deptNode) return [];
      return deptNode.rooms
        .filter((rm: any) => rm.id !== sourceId && rm.name.toLowerCase() !== sourceValue.toLowerCase())
        .sort(compareRooms)
        .map((rm: any) => ({ label: rm.name, value: rm.name, id: rm.id }));
    }

    return [];
  }, [mergeTarget, tree, floorSortDesc]);

  const deleteTransferCandidates = useMemo(() => {
    if (!deletePromptTarget) return [];
    const { level, value, id, parentBuildingName, parentBuilding, parentFloor, parentDepartment } = deletePromptTarget;

    if (level === 'buildingName') {
      return Object.values(tree)
        .map((b: any) => ({ label: b.name, value: b.name }))
        .filter((b) => b.value.toLowerCase() !== value.toLowerCase());
    }

    if (level === 'building') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      if (!binaNode) return [];
      return Object.values(binaNode.blocks)
        .filter((blk: any) => !blk.isPlaceholder && blk.name.toLowerCase() !== value.toLowerCase())
        .sort(compareBlocks)
        .map((blk: any) => ({ label: blk.name, value: blk.name }));
    }

    if (level === 'floor') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      const blokNode = binaNode
        ? (Object.values(binaNode.blocks).find(
          (blk: any) => blk.name === parentBuilding || (blk.isPlaceholder && !parentBuilding)
        ) as any)
        : null;
      if (!blokNode) return [];
      return Object.values(blokNode.floors)
        .filter((flr: any) => !flr.isPlaceholder && flr.name.toLowerCase() !== value.toLowerCase())
        .sort((a: any, b: any) => compareFloors(a, b, floorSortDesc))
        .map((flr: any) => ({ label: flr.name, value: flr.name }));
    }

    if (level === 'department') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      const blokNode = binaNode
        ? (Object.values(binaNode.blocks).find(
          (blk: any) => blk.name === parentBuilding || (blk.isPlaceholder && !parentBuilding)
        ) as any)
        : null;
      const floorNode = blokNode
        ? (Object.values(blokNode.floors).find(
          (f: any) => f.name === parentFloor || (f.isPlaceholder && !parentFloor)
        ) as any)
        : null;
      if (!floorNode) return [];
      return Object.values(floorNode.departments)
        .filter((dept: any) => !dept.isPlaceholder && dept.name.toLowerCase() !== value.toLowerCase())
        .sort(compareDepartments)
        .map((dept: any) => ({ label: dept.name, value: dept.name }));
    }

    if (level === 'description') {
      const binaNode = Object.values(tree).find((b: any) => b.name === parentBuildingName) as any;
      const blokNode = binaNode
        ? (Object.values(binaNode.blocks).find(
          (blk: any) => blk.name === parentBuilding || (blk.isPlaceholder && !parentBuilding)
        ) as any)
        : null;
      const floorNode = blokNode
        ? (Object.values(blokNode.floors).find(
          (f: any) => f.name === parentFloor || (f.isPlaceholder && !parentFloor)
        ) as any)
        : null;
      const deptNode = floorNode
        ? (Object.values(floorNode.departments).find(
          (d: any) => d.name === parentDepartment || (d.isPlaceholder && !parentDepartment)
        ) as any)
        : null;
      if (!deptNode) return [];
      return deptNode.rooms
        .filter((rm: any) => rm.id !== id && rm.name.toLowerCase() !== value.toLowerCase())
        .sort(compareRooms)
        .map((rm: any) => ({ label: rm.name, value: rm.name, id: rm.id }));
    }

    return [];
  }, [deletePromptTarget, tree, floorSortDesc]);

  const generatedCode = useMemo(() => {
    const blockOrBuilding = newLocation.block || newLocation.buildingName;
    if (!blockOrBuilding && !newLocation.floor) return '';
    return generateLocationCode(blockOrBuilding, newLocation.floor, currentFacility?.shortName);
  }, [newLocation.block, newLocation.buildingName, newLocation.floor, currentFacility?.shortName]);

  const hasValidFacility = Boolean(facilityId && facilityId !== 'all' && facilityId !== 'ALL');

  return (
    <div className="space-y-6 w-full animate-in fade-in duration-200 pb-16">
      {/* Üst Başlık & Aksiyonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-md bg-primary/10 text-primary flex items-center justify-center shrink-0">
            <Building className="w-4 h-4" />
          </div>
          <div>
            <h1 className="text-xl font-semibold tracking-tight text-foreground">
              Tesis Lokasyon Yönetimi
            </h1>
            <p className="text-xs text-muted-foreground">
              Fiziksel yapıyı <strong>Bina Adı &gt; Blok &gt; Kat &gt; Birim &gt; Mahal</strong> hiyerarşisiyle yönetin; tüm modüllerle çift yönlü senkronize çalışır.
            </p>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={() => setIsCodesModalOpen(true)}
            className="flex items-center gap-1.5 text-xs h-9 rounded-md"
          >
            <BookOpen className="w-3.5 h-3.5 text-primary" />
            Standart Kodlar Rehberi
          </Button>

          <Button
            variant="outline"
            onClick={handleDownloadTemplate}
            className="flex items-center gap-1.5 text-xs h-9 rounded-md"
          >
            <Download className="w-3.5 h-3.5 text-muted-foreground" />
            Şablon İndir
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsSyncModalOpen(true)}
            className="flex items-center gap-1.5 text-xs h-9 rounded-md border-emerald-500/40 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-500/10"
            title="FM200 Ayarlarındaki Bina, Blok ve Kat kayıtlarını buraya aktar"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            FM200&apos;den Eşitle
          </Button>

          <Button
            variant="outline"
            onClick={() => setIsExcelModalOpen(true)}
            className="flex items-center gap-1.5 text-xs h-9 rounded-md"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-muted-foreground" />
            Excel'den Yükle
          </Button>

          <Button
            variant="outline"
            onClick={() => {
              const firstBina = Object.values(tree)[0] as any;
              const firstBlok = firstBina ? (Object.values(firstBina.blocks)[0] as any) : null;
              const firstFloor = firstBlok ? (Object.values(firstBlok.floors)[0] as any) : null;
              openMergeModal({
                level: 'floor',
                sourceValue: firstFloor?.name || '',
                parentBuildingName: firstBina?.name || '',
                parentBuilding: firstBlok?.isPlaceholder ? '' : (firstBlok?.name || ''),
              });
            }}
            className="flex items-center gap-1.5 text-xs h-9 rounded-md border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10"
            title="Mükerrer veya eski/yeni kat, blok, birim ve mahalleri birleştirin"
          >
            <GitMerge className="w-3.5 h-3.5" />
            Lokasyon Birleştir (Merge)
          </Button>

          <div className="w-56">
            <Select
              value={hasValidFacility ? facilityId : ''}
              onValueChange={(v) => {
                if (!v) return;
                setFacilityId(v);
                localStorage.setItem('activeFacilityId', v);
                window.dispatchEvent(new Event('facilityChanged'));
              }}
            >
              <SelectTrigger className="h-9 bg-background text-xs font-medium rounded-md">
                <div className="flex items-center gap-2 truncate">
                  <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                  <SelectValue placeholder="Tesis Seçiniz..." />
                </div>
              </SelectTrigger>
              <SelectContent className="max-h-72">
                {facilities.map((f: any) => (
                  <SelectItem key={f.id} value={f.id} className="text-xs font-medium">
                    {f.name} {f.shortName ? `[${f.shortName}]` : ''}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {!hasValidFacility ? (
        <div className="flex flex-col items-center justify-center p-12 text-center border border-dashed border-border/60 rounded-lg bg-muted/10">
          <div className="w-10 h-10 rounded-md bg-muted flex items-center justify-center mb-2.5 text-muted-foreground">
            <Building className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Tesis Seçimi Bekleniyor</h3>
          <p className="text-xs text-muted-foreground mt-1 max-w-sm">
            Lokasyon ağacını (Bina, Blok, Kat, Birim, Mahal) görüntülemek veya eklemek için lütfen üstten bir tesis seçiniz.
          </p>
        </div>
      ) : (
        <>
          {/* 5-Seviyeli Hızlı Konum Ekleme Formu */}
          <div className="bg-card border border-border/60 rounded-lg p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-border/40">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-foreground flex items-center gap-1.5">
                <Plus className="w-3.5 h-3.5 text-primary" /> Hızlı Konum Ekle (Bina &gt; Blok &gt; Kat &gt; Birim &gt; Mahal)
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
                {generatedCode ? (
                  <span className="flex items-center gap-1">
                    <span>Kurumsal Kod:</span>
                    <Badge variant="outline" className="font-mono font-bold bg-primary/10 text-primary border-primary/20 text-[10px] py-0 px-1.5">
                      {generatedCode}
                    </Badge>
                  </span>
                ) : (
                  <span>Örn: Ana Bina &gt; A Blok &gt; 1.Kat &gt; Acil Servis &gt; Triaj Odası</span>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
              <div className="space-y-1">
                <Label className="text-xs font-medium">Bina Adı *</Label>
                <Input
                  value={newLocation.buildingName}
                  onChange={(e) => setNewLocation({ ...newLocation, buildingName: e.target.value })}
                  placeholder="Örn: Ana Bina"
                  className="h-9 text-xs rounded-md"
                  list="fac-buildings-list"
                />
                <datalist id="fac-buildings-list">
                  {suggestionLists.buildingNames.map((bn) => (
                    <option key={bn} value={bn} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Blok (Opsiyonel)</Label>
                <Input
                  value={newLocation.block}
                  onChange={(e) => setNewLocation({ ...newLocation, block: e.target.value })}
                  placeholder="Örn: A Blok"
                  className="h-9 text-xs rounded-md"
                  list="fac-blocks-list"
                />
                <datalist id="fac-blocks-list">
                  {suggestionLists.blocks.map((sb) => (
                    <option key={sb} value={sb} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Kat</Label>
                <Input
                  value={newLocation.floor}
                  onChange={(e) => setNewLocation({ ...newLocation, floor: e.target.value })}
                  placeholder="Örn: 1.Kat, Z.Kat..."
                  className="h-9 text-xs rounded-md"
                  list="fac-floors-list"
                />
                <datalist id="fac-floors-list">
                  {suggestionLists.floors.map((sf) => (
                    <option key={sf} value={sf} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Birim (Opsiyonel)</Label>
                <Input
                  value={newLocation.department}
                  onChange={(e) => setNewLocation({ ...newLocation, department: e.target.value })}
                  placeholder="Örn: Acil Servis"
                  className="h-9 text-xs rounded-md"
                  list="fac-depts-list"
                />
                <datalist id="fac-depts-list">
                  {suggestionLists.departments.map((d) => (
                    <option key={d} value={d} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Mahal (Opsiyonel)</Label>
                <Input
                  value={newLocation.description}
                  onChange={(e) => setNewLocation({ ...newLocation, description: e.target.value })}
                  placeholder="Örn: 101 Nolu Oda, Triaj..."
                  className="h-9 text-xs rounded-md"
                  list="fac-rooms-list"
                  onKeyDown={(e) => e.key === 'Enter' && addLocFromForm()}
                />
                <datalist id="fac-rooms-list">
                  {suggestionLists.descriptions.map((r) => (
                    <option key={r} value={r} />
                  ))}
                </datalist>
              </div>

              <div>
                <Button
                  onClick={addLocFromForm}
                  disabled={!newLocation.buildingName.trim() || addMutation.isPending}
                  className="w-full h-9 rounded-md text-xs font-medium gap-1.5"
                >
                  {addMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  Konumu Ekle
                </Button>
              </div>
            </div>
          </div>

          {/* 5-Seviyeli Hiyerarşik Ağaç */}
          <div className="bg-card border border-border/60 rounded-lg p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-primary" />
                <div>
                  <h3 className="text-sm font-semibold text-foreground">
                    Fiziksel Yapı ve Tanımlı Konumlar ({locations.length})
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    Katların sağından <strong>+ Birim</strong>, birimlerin sağından <strong>+ Mahal</strong> ekleyebilirsiniz.
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full sm:w-auto">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setFloorSortDesc((prev) => !prev)}
                  className="h-8 text-xs flex items-center justify-center gap-1.5 px-2.5 shrink-0 border-border/80 hover:bg-muted/60"
                  title={
                    floorSortDesc
                      ? "Katlar: 13. Kat'tan -2. Kat'a (Yukarıdan Aşağıya)"
                      : "Katlar: -2. Kat'tan 13. Kat'a (Aşağıdan Yukarıya)"
                  }
                >
                  <ArrowUpDown className="w-3.5 h-3.5 text-primary" />
                  <span>Kat Sırası: {floorSortDesc ? '13 → -2' : '-2 → 13'}</span>
                </Button>

                <div className="relative w-full sm:w-72">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
                  <Input
                    placeholder="Bina, blok, kat, birim veya mahal ara..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8 h-8 text-xs rounded-md"
                  />
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="p-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" /> Lokasyonlar yükleniyor...
              </div>
            ) : Object.keys(tree).length === 0 ? (
              <div className="p-10 text-center border border-dashed border-border/60 rounded-lg bg-muted/10">
                <Building className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs font-semibold text-foreground">Henüz Konum Eklenmemiş</p>
                <p className="text-[11px] text-muted-foreground mt-0.5">
                  Yukarıdaki formu kullanarak Bina, Blok, Kat, Birim ve Mahal ekleyebilir veya Excel'den aktarabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {Object.values(tree)
                  .sort((a: any, b: any) => (a.name || '').localeCompare(b.name || '', 'tr'))
                  .map((binaNode: any) => {
                    const binaOpen = isNodeExpanded(binaNode.id, true);
                    const isRenamingBina =
                      renameTarget?.nodeKey === binaNode.id && renameTarget?.level === 'buildingName';

                    return (
                      <div key={binaNode.id} className="border border-border/70 rounded-lg overflow-hidden bg-background">
                        {/* SEVİYE 1: BİNA ADI */}
                        <div
                          onClick={() => !isRenamingBina && toggleNode(binaNode.id)}
                          className="px-3.5 py-2.5 bg-muted/40 hover:bg-muted/60 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                        >
                          {isRenamingBina ? (
                            <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                              <Input
                                autoFocus
                                value={renameValue}
                                onChange={(e) => setRenameValue(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                                className="h-7 text-xs flex-1"
                              />
                              <Button size="sm" className="h-7 px-2 text-xs" onClick={saveRename} disabled={renameMutation.isPending}>
                                <Check className="w-3.5 h-3.5" />
                              </Button>
                              <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRenameTarget(null)}>
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                          ) : (
                            <>
                              <div className="flex items-center gap-2 min-w-0">
                                {binaOpen ? <ChevronDown className="w-4 h-4 text-primary shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                                <Building className="w-4 h-4 text-primary shrink-0" />
                                <span className="text-xs font-bold text-foreground truncate">{binaNode.name}</span>
                                <Badge variant="secondary" className="text-[10px] py-0 px-1.5">
                                  {Object.keys(binaNode.blocks).length} Blok
                                </Badge>
                              </div>
                              <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-primary hover:bg-primary/10"
                                  onClick={() =>
                                    openInlineAdd({
                                      level: 'block',
                                      buildingName: binaNode.name,
                                      block: '',
                                      floor: '',
                                      department: '',
                                      nodeKey: binaNode.id,
                                    })
                                  }
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Blok
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 px-2 text-[11px] text-emerald-600 hover:bg-emerald-500/10"
                                  onClick={() =>
                                    openInlineAdd({
                                      level: 'floor',
                                      buildingName: binaNode.name,
                                      block: 'Blok Belirtilmemiş',
                                      floor: '',
                                      department: '',
                                      nodeKey: binaNode.id,
                                    })
                                  }
                                >
                                  <Plus className="w-3 h-3 mr-1" /> Kat
                                </Button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    openMergeModal({
                                      level: 'buildingName',
                                      sourceValue: binaNode.name,
                                    })
                                  }
                                  className="p-1 text-muted-foreground hover:text-amber-600 rounded transition-colors"
                                  title="Binayı Başka Bir Bina ile Birleştir"
                                >
                                  <GitMerge className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    startRename({
                                      level: 'buildingName',
                                      oldValue: binaNode.name,
                                      nodeKey: binaNode.id,
                                    })
                                  }
                                  className="p-1 text-muted-foreground hover:text-primary rounded"
                                  title="Bina Adını Düzenle"
                                >
                                  <Pencil className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeNode({
                                      label: binaNode.name,
                                      level: 'buildingName',
                                      value: binaNode.name,
                                    })
                                  }
                                  className="p-1 text-muted-foreground hover:text-destructive rounded"
                                  title="Binayı ve Altındaki Tüm Kayıtları Sil"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>

                        {/* Bina İçi Hızlı Blok/Kat Ekleme */}
                        {binaOpen && inlineAdd && inlineAdd.nodeKey === binaNode.id && (
                          <div className="flex items-center gap-2 px-4 py-2 bg-primary/5 border-b border-border/50">
                            <Input
                              autoFocus
                              value={inlineValue}
                              onChange={(e) => setInlineValue(e.target.value)}
                              onKeyDown={(e) => e.key === 'Enter' && saveInlineAdd()}
                              placeholder={inlineAdd.level === 'block' ? 'Yeni Blok Adı (ör. A Blok)...' : 'Yeni Kat Adı (ör. 1.Kat)...'}
                              className="h-7 text-xs flex-1 bg-background"
                            />
                            <Button size="sm" className="h-7 px-2.5 text-xs" onClick={saveInlineAdd} disabled={addMutation.isPending}>
                              <Check className="w-3.5 h-3.5 mr-1" /> Ekle
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setInlineAdd(null)}>
                              İptal
                            </Button>
                          </div>
                        )}

                        {/* SEVİYE 2: BLOKLAR */}
                        {binaOpen && (
                          <div className="divide-y divide-border/50">
                            {Object.values(binaNode.blocks)
                              .sort(compareBlocks)
                              .map((blokNode: any) => {
                                const blokOpen = isNodeExpanded(blokNode.id, true);
                                const isRenamingBlok =
                                  renameTarget?.nodeKey === blokNode.id && renameTarget?.level === 'building';
                                const bCode = !blokNode.isPlaceholder ? getBlockCode(blokNode.name) : '';

                                return (
                                  <div key={blokNode.id} className="bg-background">
                                    <div
                                      onClick={() => !isRenamingBlok && toggleNode(blokNode.id)}
                                      className="pl-6 pr-3.5 py-2 bg-muted/20 hover:bg-muted/35 cursor-pointer flex items-center justify-between gap-2 transition-colors"
                                    >
                                      {isRenamingBlok ? (
                                        <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                          <Input
                                            autoFocus
                                            value={renameValue}
                                            onChange={(e) => setRenameValue(e.target.value)}
                                            onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                                            className="h-7 text-xs flex-1"
                                          />
                                          <Button size="sm" className="h-7 px-2 text-xs" onClick={saveRename} disabled={renameMutation.isPending}>
                                            <Check className="w-3.5 h-3.5" />
                                          </Button>
                                          <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRenameTarget(null)}>
                                            <X className="w-3.5 h-3.5" />
                                          </Button>
                                        </div>
                                      ) : (
                                        <>
                                          <div className="flex items-center gap-2 min-w-0">
                                            {blokOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                            <Building2 className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                                            <span className={`text-xs font-semibold truncate ${blokNode.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                              {blokNode.isPlaceholder ? 'Tek Blok / Genel Blok' : blokNode.name}
                                            </span>
                                            {bCode && (
                                              <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 font-bold">
                                                {bCode}
                                              </Badge>
                                            )}
                                            <span className="text-[10px] text-muted-foreground">
                                              ({Object.keys(blokNode.floors).length} Kat)
                                            </span>
                                          </div>

                                          <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                            <Button
                                              type="button"
                                              size="sm"
                                              variant="ghost"
                                              className="h-6 px-2 text-[11px] text-emerald-600 hover:bg-emerald-500/10"
                                              onClick={() =>
                                                openInlineAdd({
                                                  level: 'floor',
                                                  buildingName: binaNode.name,
                                                  block: blokNode.name,
                                                  floor: '',
                                                  department: '',
                                                  nodeKey: blokNode.id,
                                                })
                                              }
                                            >
                                              <Plus className="w-3 h-3 mr-1" /> Kat Ekle
                                            </Button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                openMergeModal({
                                                  level: 'building',
                                                  sourceValue: blokNode.isPlaceholder ? '' : blokNode.name,
                                                  parentBuildingName: binaNode.name,
                                                })
                                              }
                                              className="p-1 text-muted-foreground hover:text-amber-600 rounded transition-colors"
                                              title="Bloğu Başka Bir Blok ile Birleştir"
                                            >
                                              <GitMerge className="w-3 h-3" />
                                            </button>
                                            <button
                                              type="button"
                                              onClick={() =>
                                                startRename({
                                                  level: 'building',
                                                  oldValue: blokNode.isPlaceholder ? '' : blokNode.name,
                                                  parentBuildingName: binaNode.name,
                                                  nodeKey: blokNode.id,
                                                })
                                              }
                                              className="p-1 text-muted-foreground hover:text-primary rounded"
                                              title={blokNode.isPlaceholder ? 'Blok Adı Tanımla' : 'Blok Adını Düzenle'}
                                            >
                                              <Pencil className="w-3 h-3" />
                                            </button>
                                            {!blokNode.isPlaceholder && (
                                              <button
                                                type="button"
                                                onClick={() =>
                                                  removeNode({
                                                    label: `${binaNode.name} > ${blokNode.name}`,
                                                    level: 'building',
                                                    value: blokNode.name,
                                                    parentBuildingName: binaNode.name,
                                                  })
                                                }
                                                className="p-1 text-muted-foreground hover:text-destructive rounded"
                                                title="Bloğu ve Altındaki Kayıtları Sil"
                                              >
                                                <Trash2 className="w-3 h-3" />
                                              </button>
                                            )}
                                          </div>
                                        </>
                                      )}
                                    </div>

                                    {/* Blok İçi Hızlı Kat Ekleme */}
                                    {blokOpen && inlineAdd?.nodeKey === blokNode.id && (
                                      <div className="flex items-center gap-2 pl-10 pr-4 py-2 bg-emerald-500/5 border-b border-border/40">
                                        <Input
                                          autoFocus
                                          value={inlineValue}
                                          onChange={(e) => setInlineValue(e.target.value)}
                                          onKeyDown={(e) => e.key === 'Enter' && saveInlineAdd()}
                                          placeholder="Yeni Kat Adı (ör. 1.Kat, Z.Kat)..."
                                          list="fac-floors-list"
                                          className="h-7 text-xs flex-1 bg-background"
                                        />
                                        <Button size="sm" className="h-7 px-2.5 text-xs" onClick={saveInlineAdd} disabled={addMutation.isPending}>
                                          <Check className="w-3.5 h-3.5 mr-1" /> Ekle
                                        </Button>
                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setInlineAdd(null)}>
                                          İptal
                                        </Button>
                                      </div>
                                    )}

                                    {/* SEVİYE 3: KATLAR */}
                                    {blokOpen && (
                                      <div className="pl-8 pr-3 py-2 space-y-2 bg-background">
                                        {Object.keys(blokNode.floors).length === 0 ? (
                                          <div className="text-[11px] text-muted-foreground italic py-1 pl-2">
                                            Henüz kat eklenmemiş. Sağ üstten "+ Kat Ekle" kullanabilirsiniz.
                                          </div>
                                        ) : (
                                          Object.values(blokNode.floors)
                                            .sort((a: any, b: any) => compareFloors(a, b, floorSortDesc))
                                            .map((floorNode: any) => {
                                              const flrOpen = isNodeExpanded(floorNode.id, true);
                                              const isRenamingFloor =
                                                renameTarget?.nodeKey === floorNode.id && renameTarget?.level === 'floor';
                                              const fCode = !floorNode.isPlaceholder ? getFloorCode(floorNode.name) : '';
                                              const deptCount = Object.keys(floorNode.departments).length;

                                              return (
                                                <div key={floorNode.id} className="border border-border/50 rounded-md overflow-hidden bg-muted/5">
                                                  <div
                                                    onClick={() => !isRenamingFloor && toggleNode(floorNode.id)}
                                                    className="px-3 py-2 bg-muted/15 hover:bg-muted/30 cursor-pointer flex items-center justify-between gap-2"
                                                  >
                                                    {isRenamingFloor ? (
                                                      <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                                        <Input
                                                          autoFocus
                                                          value={renameValue}
                                                          onChange={(e) => setRenameValue(e.target.value)}
                                                          onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                                                          className="h-7 text-xs flex-1"
                                                        />
                                                        <Button size="sm" className="h-7 px-2 text-xs" onClick={saveRename} disabled={renameMutation.isPending}>
                                                          <Check className="w-3.5 h-3.5" />
                                                        </Button>
                                                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setRenameTarget(null)}>
                                                          <X className="w-3.5 h-3.5" />
                                                        </Button>
                                                      </div>
                                                    ) : (
                                                      <>
                                                        <div className="flex items-center gap-2 min-w-0">
                                                          {flrOpen ? <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                                                          <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                                                          <span className="text-xs font-semibold text-foreground truncate">{floorNode.name}</span>
                                                          {fCode && (
                                                            <Badge variant="outline" className="text-[9px] font-mono py-0 px-1 text-primary border-primary/30 font-bold">
                                                              {fCode}
                                                            </Badge>
                                                          )}
                                                          {deptCount > 0 && (
                                                            <span className="text-[10px] text-muted-foreground">({deptCount} Birim)</span>
                                                          )}
                                                        </div>

                                                        <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                          <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="ghost"
                                                            className="h-6 px-2 text-[11px] text-amber-600 hover:bg-amber-500/10"
                                                            onClick={() =>
                                                              openInlineAdd({
                                                                level: 'department',
                                                                buildingName: binaNode.name,
                                                                block: blokNode.name,
                                                                floor: floorNode.name,
                                                                department: '',
                                                                nodeKey: floorNode.id,
                                                              })
                                                            }
                                                          >
                                                            <Plus className="w-3 h-3 mr-1" /> Birim Ekle
                                                          </Button>
                                                          {!floorNode.isPlaceholder && (
                                                            <>
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  openMergeModal({
                                                                    level: 'floor',
                                                                    sourceValue: floorNode.name,
                                                                    parentBuildingName: binaNode.name,
                                                                    parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                  })
                                                                }
                                                                className="p-1 text-muted-foreground hover:text-amber-600 rounded transition-colors"
                                                                title="Bu Katı Başka Bir Kat ile Birleştir (Örn: 13. -> 13. Kat)"
                                                              >
                                                                <GitMerge className="w-3 h-3" />
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  startRename({
                                                                    level: 'floor',
                                                                    oldValue: floorNode.name,
                                                                    parentBuildingName: binaNode.name,
                                                                    parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                    nodeKey: floorNode.id,
                                                                  })
                                                                }
                                                                className="p-1 text-muted-foreground hover:text-primary rounded"
                                                                title="Kat Adını Düzenle"
                                                              >
                                                                <Pencil className="w-3 h-3" />
                                                              </button>
                                                              <button
                                                                type="button"
                                                                onClick={() =>
                                                                  removeNode({
                                                                    label: `${floorNode.name}`,
                                                                    level: 'floor',
                                                                    value: floorNode.name,
                                                                    parentBuildingName: binaNode.name,
                                                                    parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                  })
                                                                }
                                                                className="p-1 text-muted-foreground hover:text-destructive rounded"
                                                                title="Bu Katı Sil"
                                                              >
                                                                <Trash2 className="w-3 h-3" />
                                                              </button>
                                                            </>
                                                          )}
                                                        </div>
                                                      </>
                                                    )}
                                                  </div>

                                                  {/* Kat İçi Hızlı Birim Ekleme */}
                                                  {flrOpen && inlineAdd?.nodeKey === floorNode.id && (
                                                    <div className="flex items-center gap-2 pl-8 pr-3 py-2 bg-amber-500/5 border-t border-border/40">
                                                      <Input
                                                        autoFocus
                                                        value={inlineValue}
                                                        onChange={(e) => setInlineValue(e.target.value)}
                                                        onKeyDown={(e) => e.key === 'Enter' && saveInlineAdd()}
                                                        placeholder="Yeni Birim Adı (ör. Acil Servis, Radyoloji)..."
                                                        list="fac-depts-list"
                                                        className="h-7 text-xs flex-1 bg-background"
                                                      />
                                                      <Button size="sm" className="h-7 px-2.5 text-xs" onClick={saveInlineAdd} disabled={addMutation.isPending}>
                                                        <Check className="w-3.5 h-3.5 mr-1" /> Ekle
                                                      </Button>
                                                      <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={() => setInlineAdd(null)}>
                                                        İptal
                                                      </Button>
                                                    </div>
                                                  )}

                                                  {/* SEVİYE 4: BİRİMLER */}
                                                  {flrOpen && deptCount > 0 && (
                                                    <div className="pl-6 pr-2.5 py-2 space-y-1.5 border-t border-border/40 bg-background/60">
                                                      {Object.values(floorNode.departments).sort(compareDepartments).map((deptNode: any) => {
                                                        const deptOpen = isNodeExpanded(deptNode.id, true);
                                                        const isRenamingDept =
                                                          renameTarget?.nodeKey === deptNode.id && renameTarget?.level === 'department';

                                                        return (
                                                          <div key={deptNode.id} className="border border-border/40 rounded bg-card">
                                                            <div
                                                              onClick={() => !isRenamingDept && toggleNode(deptNode.id)}
                                                              className="px-2.5 py-1.5 hover:bg-muted/20 cursor-pointer flex items-center justify-between gap-2"
                                                            >
                                                              {isRenamingDept ? (
                                                                <div className="flex items-center gap-2 flex-1" onClick={(e) => e.stopPropagation()}>
                                                                  <Input
                                                                    autoFocus
                                                                    value={renameValue}
                                                                    onChange={(e) => setRenameValue(e.target.value)}
                                                                    onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                                                                    className="h-6 text-xs flex-1"
                                                                  />
                                                                  <Button size="sm" className="h-6 px-2 text-xs" onClick={saveRename} disabled={renameMutation.isPending}>
                                                                    <Check className="w-3 h-3" />
                                                                  </Button>
                                                                  <Button size="sm" variant="ghost" className="h-6 px-2 text-xs" onClick={() => setRenameTarget(null)}>
                                                                    <X className="w-3 h-3" />
                                                                  </Button>
                                                                </div>
                                                              ) : (
                                                                <>
                                                                  <div className="flex items-center gap-1.5 min-w-0">
                                                                    {deptNode.rooms.length > 0 ? (
                                                                      deptOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground shrink-0" /> : <ChevronRight className="w-3 h-3 text-muted-foreground shrink-0" />
                                                                    ) : (
                                                                      <span className="w-3 shrink-0" />
                                                                    )}
                                                                    <Briefcase className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                                                                    <span className={`text-xs font-medium truncate ${deptNode.isPlaceholder ? 'text-muted-foreground italic' : 'text-foreground'}`}>
                                                                      {deptNode.name}
                                                                    </span>
                                                                    {deptNode.rooms.length > 0 && (
                                                                      <span className="text-[10px] text-muted-foreground">({deptNode.rooms.length} Mahal)</span>
                                                                    )}
                                                                  </div>

                                                                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                                                                    <Button
                                                                      type="button"
                                                                      size="sm"
                                                                      variant="ghost"
                                                                      className="h-6 px-2 text-[10px] text-sky-600 hover:bg-sky-500/10"
                                                                      onClick={() =>
                                                                        openInlineAdd({
                                                                          level: 'description',
                                                                          buildingName: binaNode.name,
                                                                          block: blokNode.name,
                                                                          floor: floorNode.name,
                                                                          department: deptNode.isPlaceholder ? '' : deptNode.name,
                                                                          nodeKey: deptNode.id,
                                                                        })
                                                                      }
                                                                    >
                                                                      <Plus className="w-3 h-3 mr-0.5" /> Mahal Ekle
                                                                    </Button>
                                                                    {!deptNode.isPlaceholder && (
                                                                      <>
                                                                        <button
                                                                          type="button"
                                                                          onClick={() =>
                                                                            openMergeModal({
                                                                              level: 'department',
                                                                              sourceValue: deptNode.name,
                                                                              parentBuildingName: binaNode.name,
                                                                              parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                              parentFloor: floorNode.isPlaceholder ? '' : floorNode.name,
                                                                            })
                                                                          }
                                                                          className="p-1 text-muted-foreground hover:text-amber-600 rounded transition-colors"
                                                                          title="Birimi Başka Bir Birim ile Birleştir"
                                                                        >
                                                                          <GitMerge className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                          type="button"
                                                                          onClick={() =>
                                                                            startRename({
                                                                              level: 'department',
                                                                              oldValue: deptNode.name,
                                                                              parentBuildingName: binaNode.name,
                                                                              parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                              parentFloor: floorNode.isPlaceholder ? '' : floorNode.name,
                                                                              nodeKey: deptNode.id,
                                                                            })
                                                                          }
                                                                          className="p-1 text-muted-foreground hover:text-primary rounded"
                                                                          title="Birim Adını Düzenle"
                                                                        >
                                                                          <Pencil className="w-3 h-3" />
                                                                        </button>
                                                                        <button
                                                                          type="button"
                                                                          onClick={() =>
                                                                            removeNode({
                                                                              label: deptNode.name,
                                                                              level: 'department',
                                                                              value: deptNode.name,
                                                                              parentBuildingName: binaNode.name,
                                                                              parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                              parentFloor: floorNode.isPlaceholder ? '' : floorNode.name,
                                                                            })
                                                                          }
                                                                          className="p-1 text-muted-foreground hover:text-destructive rounded"
                                                                          title="Birimi ve Altındaki Mahalleri Sil"
                                                                        >
                                                                          <Trash2 className="w-3 h-3" />
                                                                        </button>
                                                                      </>
                                                                    )}
                                                                  </div>
                                                                </>
                                                              )}
                                                            </div>

                                                            {/* Birim İçi Hızlı Mahal Ekleme */}
                                                            {deptOpen && inlineAdd?.nodeKey === deptNode.id && (
                                                              <div className="flex items-center gap-2 pl-7 pr-2.5 py-1.5 bg-sky-500/5 border-t border-border/30">
                                                                <Input
                                                                  autoFocus
                                                                  value={inlineValue}
                                                                  onChange={(e) => setInlineValue(e.target.value)}
                                                                  onKeyDown={(e) => e.key === 'Enter' && saveInlineAdd()}
                                                                  placeholder="Yeni Mahal Adı (ör. 101 Nolu Oda, Triaj)..."
                                                                  list="fac-rooms-list"
                                                                  className="h-6 text-xs flex-1 bg-background"
                                                                />
                                                                <Button size="sm" className="h-6 px-2 text-[11px]" onClick={saveInlineAdd} disabled={addMutation.isPending}>
                                                                  <Check className="w-3 h-3 mr-1" /> Ekle
                                                                </Button>
                                                                <Button size="sm" variant="ghost" className="h-6 px-2 text-[11px]" onClick={() => setInlineAdd(null)}>
                                                                  İptal
                                                                </Button>
                                                              </div>
                                                            )}

                                                            {/* SEVİYE 5: MAHALLER */}
                                                            {deptOpen && deptNode.rooms.length > 0 && (
                                                              <div className="pl-7 pr-2.5 py-1.5 flex flex-wrap gap-1.5 border-t border-border/30 bg-muted/10">
                                                                {[...deptNode.rooms].sort(compareRooms).map((room: any) => {
                                                                  const isRenamingRoom =
                                                                    renameTarget?.nodeKey === room.id && renameTarget?.level === 'description';

                                                                  return isRenamingRoom ? (
                                                                    <div key={room.id} className="flex items-center gap-1 bg-background border rounded px-1.5 py-0.5">
                                                                      <Input
                                                                        autoFocus
                                                                        value={renameValue}
                                                                        onChange={(e) => setRenameValue(e.target.value)}
                                                                        onKeyDown={(e) => e.key === 'Enter' && saveRename()}
                                                                        className="h-6 text-xs w-36"
                                                                      />
                                                                      <button type="button" onClick={saveRename} className="text-emerald-600 p-0.5">
                                                                        <Check className="w-3 h-3" />
                                                                      </button>
                                                                      <button type="button" onClick={() => setRenameTarget(null)} className="text-muted-foreground p-0.5">
                                                                        <X className="w-3 h-3" />
                                                                      </button>
                                                                    </div>
                                                                  ) : (
                                                                    <div
                                                                      key={room.id}
                                                                      className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-background border border-border/60 text-[11px] text-foreground shadow-2xs"
                                                                    >
                                                                      <DoorOpen className="w-3 h-3 text-sky-600 shrink-0" />
                                                                      <span>{room.name}</span>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                          openMergeModal({
                                                                            level: 'description',
                                                                            sourceValue: room.name,
                                                                            sourceId: room.id,
                                                                            parentBuildingName: binaNode.name,
                                                                            parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                            parentFloor: floorNode.isPlaceholder ? '' : floorNode.name,
                                                                            parentDepartment: deptNode.isPlaceholder ? '' : deptNode.name,
                                                                          })
                                                                        }
                                                                        className="text-muted-foreground hover:text-amber-600 p-0.5"
                                                                        title="Mahali Başka Bir Mahal ile Birleştir"
                                                                      >
                                                                        <GitMerge className="w-2.5 h-2.5" />
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                          startRename({
                                                                            level: 'description',
                                                                            oldValue: room.name,
                                                                            parentBuildingName: binaNode.name,
                                                                            parentBuilding: blokNode.isPlaceholder ? '' : blokNode.name,
                                                                            parentFloor: floorNode.isPlaceholder ? '' : floorNode.name,
                                                                            parentDepartment: deptNode.isPlaceholder ? '' : deptNode.name,
                                                                            nodeKey: room.id,
                                                                          })
                                                                        }
                                                                        className="text-muted-foreground hover:text-primary"
                                                                        title="Mahal Adını Düzenle"
                                                                      >
                                                                        <Pencil className="w-2.5 h-2.5" />
                                                                      </button>
                                                                      <button
                                                                        type="button"
                                                                        onClick={() =>
                                                                          removeNode({
                                                                            label: room.name,
                                                                            level: 'description',
                                                                            value: room.name,
                                                                            id: room.id,
                                                                          })
                                                                        }
                                                                        className="text-muted-foreground hover:text-destructive"
                                                                        title="Mahali Sil"
                                                                      >
                                                                        <Trash2 className="w-2.5 h-2.5" />
                                                                      </button>
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
            )}
          </div>
        </>
      )}

      {/* Excel İle Yükleme Modalı */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel ile Lokasyon Yükleme
            </DialogTitle>
            <DialogDescription className="text-xs">
              Excel tablonuzda <b>Tesis Adı</b>, <b>Bina</b>, <b>Blok</b>, <b>Kat</b>, <b>Birim</b> ve <b>Mahal</b> sütunlarını içerecek şekilde toplu yükleme yapabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div className="p-3 bg-muted/40 rounded-md border border-border/60 text-[11px] space-y-1.5 text-muted-foreground">
              <div className="font-semibold text-foreground flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Desteklenen Sütun Formatı:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1">
                <li><b>Tesis Adı:</b> MP Adana, Liv Gaziantep vb.</li>
                <li><b>Bina:</b> Ana Bina, Ek Bina vb.</li>
                <li><b>Blok:</b> A Blok, B Blok vb. (Opsiyonel)</li>
                <li><b>Kat:</b> Z.Kat, 1.Kat, 2.Kat vb.</li>
                <li><b>Birim:</b> Acil Servis, Radyoloji vb. (Opsiyonel)</li>
                <li><b>Mahal:</b> Triaj Odası, 101 Nolu Oda vb. (Opsiyonel)</li>
              </ul>
            </div>

            <div>
              <Label className="text-xs font-medium">Excel Dosyası (.xlsx) *</Label>
              <div className="mt-1 flex items-center justify-center border-2 border-dashed border-border/60 rounded-md p-5 text-center hover:border-primary/80 transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setExcelFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="locations-excel-input"
                />
                <label htmlFor="locations-excel-input" className="cursor-pointer">
                  <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-1.5" />
                  <span className="text-xs font-semibold text-primary">
                    {excelFile ? excelFile.name : 'Dosya Seç veya Sürükle'}
                  </span>
                  <p className="text-[10px] text-muted-foreground mt-0.5">Sadece Excel (.xlsx, .xls) dosyaları</p>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground text-[11px]">Şablon dosyanız yok mu?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-primary font-medium hover:underline flex items-center gap-1 text-xs"
              >
                <Download className="w-3 h-3" /> Şablonu İndir
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsExcelModalOpen(false)} className="h-8 text-xs rounded-md">
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleExcelImport}
              disabled={isImporting || !excelFile}
              className="h-8 text-xs rounded-md gap-1.5"
            >
              {isImporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              Yükle ve Aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* FM200 Bina / Blok / Kat Eşitleme Modalı */}
      <Dialog open={isSyncModalOpen} onOpenChange={setIsSyncModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base">
              <RefreshCw className="w-4 h-4 text-emerald-600" />
              FM200&apos;den Bina / Blok / Kat Eşitle
            </DialogTitle>
            <DialogDescription className="text-xs">
              FM200 Ayarları&apos;nda kayıtlı olan <strong>Bina Adı &gt; Blok &gt; Kat</strong> verilerini Lokasyon Yönetimi&apos;ne aktarır. Mevcut Birim ve Mahal kayıtlarınız korunur; sadece eksik Bina/Blok/Kat iskeleti oluşturulur.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2 py-2 text-xs text-muted-foreground">
            <p>
              Eşitleme sonrası ağaç yapısında her katın yanındaki <strong>+ Birim</strong> ve <strong>+ Mahal</strong> butonlarıyla hızlıca alt birimleri ekleyebilirsiniz.
            </p>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSyncModalOpen(false)}
              className="h-8 text-xs rounded-md"
              disabled={syncFromFm200Mutation.isPending}
            >
              İptal
            </Button>
            {hasValidFacility && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => syncFromFm200Mutation.mutate(facilityId)}
                disabled={syncFromFm200Mutation.isPending}
                className="h-8 text-xs rounded-md gap-1.5"
              >
                {syncFromFm200Mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                Seçili Tesisi Eşitle
              </Button>
            )}
            <Button
              size="sm"
              onClick={() => syncFromFm200Mutation.mutate('ALL')}
              disabled={syncFromFm200Mutation.isPending}
              className="h-8 text-xs rounded-md gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {syncFromFm200Mutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
              Tüm Tesisleri Eşitle
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Standart Kodlar Rehberi Modalı */}
      <StandardCodesModal
        isOpen={isCodesModalOpen}
        onClose={() => setIsCodesModalOpen(false)}
      />

      {/* Lokasyon Birleştirme (Merge) Modalı */}
      <Dialog open={!!mergeTarget} onOpenChange={(open) => !open && setMergeTarget(null)}>
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-foreground">
              <div className="w-7 h-7 rounded-md bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                <GitMerge className="w-4 h-4" />
              </div>
              Lokasyon Birleştirme (Merge)
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mükerrer veya farklı adlandırılmış lokasyonları birleştirin. Tüm riskler, ekipmanlar ve mahaller güvenle hedef lokasyona aktarılır.
            </DialogDescription>
          </DialogHeader>

          {mergeTarget && (
            <div className="space-y-4 py-2 text-xs">
              {/* Seviye ve Üst Düğüm Bilgisi */}
              <div className="flex flex-wrap items-center gap-2 p-2.5 bg-muted/30 rounded-md border border-border/60">
                <Badge variant="secondary" className="text-[11px] font-semibold">
                  Seviye: {LEVEL_LABELS[mergeTarget.level] || mergeTarget.level}
                </Badge>
                {(mergeTarget.parentBuildingName || mergeTarget.parentBuilding || mergeTarget.parentFloor) && (
                  <span className="text-[11px] text-muted-foreground truncate">
                    {[mergeTarget.parentBuildingName, mergeTarget.parentBuilding, mergeTarget.parentFloor, mergeTarget.parentDepartment]
                      .filter(Boolean)
                      .join(' › ')}
                  </span>
                )}
              </div>

              {/* Kaynak Bilgisi */}
              <div className="p-3 bg-destructive/5 border border-destructive/20 rounded-md">
                <div className="text-[10px] uppercase font-bold text-destructive tracking-wider">
                  Kaynak (Birleştirilip Kaldırılacak):
                </div>
                <div className="text-sm font-semibold text-foreground mt-0.5">
                  {mergeTarget.sourceValue || '(İsimsiz/Belirtilmemiş)'}
                </div>
              </div>

              {/* Hedef Seçimi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Hedef Lokasyon (Aktarılacak Ana Konum):
                  </Label>
                  {mergeTargetCandidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDestination((prev) => !prev);
                        setMergeDestinationValue('');
                        setMergeDestinationId('');
                      }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {isCustomDestination ? 'Listeden Seç' : 'Yeni İsim Yaz'}
                    </button>
                  )}
                </div>

                {!isCustomDestination && mergeTargetCandidates.length > 0 ? (
                  <Select
                    value={mergeDestinationValue}
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setIsCustomDestination(true);
                        setMergeDestinationValue('');
                        setMergeDestinationId('');
                      } else {
                        setMergeDestinationValue(val);
                        const cand = mergeTargetCandidates.find((c) => c.value === val);
                        setMergeDestinationId(cand?.id || '');
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Birleştirilecek hedef lokasyonu seçin..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {mergeTargetCandidates.map((cand) => (
                        <SelectItem key={cand.id || cand.value} value={cand.value} className="text-xs">
                          {cand.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-xs text-primary font-medium border-t border-border/50">
                        + Farklı Bir İsim Belirt...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    autoFocus
                    placeholder="Hedef lokasyon adı (ör. 13. Kat, A Blok)..."
                    value={mergeDestinationValue}
                    onChange={(e) => setMergeDestinationValue(e.target.value)}
                    className="h-9 text-xs"
                  />
                )}
              </div>

              {/* Bilgilendirme Uyarısı */}
              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md space-y-1.5">
                <div className="font-semibold flex items-center gap-1.5 text-amber-700 dark:text-amber-400 text-xs">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                  Güvenli Aktarım Garantisi
                </div>
                <ul className="list-disc pl-4 space-y-1 text-[11px] text-muted-foreground">
                  <li>
                    <strong>&quot;{mergeTarget.sourceValue}&quot;</strong> lokasyonundaki tüm Risk Değerlendirmeleri, Yangın Ekipmanları, Tehlikeli Madde Envanterleri ve Olay Bildirimleri seçilen hedefe aktarılır.
                  </li>
                  <li>
                    Ortak olan alt birimler ve mahaller birleştirilerek mükerrer kayıtlar temizlenir.
                  </li>
                  <li>Hiçbir veri veya risk kaydı kaybolmaz.</li>
                </ul>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setMergeTarget(null)}
              className="h-8 text-xs rounded-md"
              disabled={mergeMutation.isPending}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              onClick={executeMerge}
              disabled={mergeMutation.isPending || (!mergeDestinationValue.trim() && !mergeDestinationId)}
              className="h-8 text-xs rounded-md gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            >
              {mergeMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <GitMerge className="w-3.5 h-3.5" />
              )}
              Birleştir ve Aktar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Bağlı Verileri Aktar ve Sil Modalı */}
      <Dialog
        open={!!deletePromptTarget && !!dependencyInfo?.hasDependencies}
        onOpenChange={(open) => {
          if (!open) {
            setDeletePromptTarget(null);
            setDependencyInfo(null);
            setDeleteTransferValue('');
            setDeleteTransferId('');
            setIsCustomDeleteTransfer(false);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-semibold flex items-center gap-2 text-destructive">
              <div className="w-7 h-7 rounded-md bg-destructive/10 text-destructive flex items-center justify-center shrink-0">
                <AlertTriangle className="w-4 h-4" />
              </div>
              Bağlı Verileri Aktar ve Sil
            </DialogTitle>
            <DialogDescription className="text-xs">
              <strong>&quot;{deletePromptTarget?.label}&quot;</strong> lokasyonuna bağlı başka modüllere ait veriler bulundu. Silme işleminden önce bu kayıtların aktarılacağı yeni konumu seçmelisiniz.
            </DialogDescription>
          </DialogHeader>

          {deletePromptTarget && dependencyInfo && (
            <div className="space-y-4 py-2 text-xs">
              {/* Tespit Edilen Bağlı Veriler */}
              <div className="p-3 bg-muted/40 border border-border/70 rounded-md space-y-2">
                <div className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                  <span>Bu Lokasyona Bağlı Kayıtlar:</span>
                  <Badge variant="destructive" className="text-[10px] py-0 px-1.5 font-bold">
                    Toplam {dependencyInfo.totalCount} Kayıt
                  </Badge>
                </div>
                <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
                  {dependencyInfo.breakdown.risks > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.risks}</strong> Risk Değerlendirmesi</span>
                    </div>
                  )}
                  {dependencyInfo.breakdown.fireEquipments > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.fireEquipments}</strong> Yangın Ekipmanı</span>
                    </div>
                  )}
                  {dependencyInfo.breakdown.hazmatMaterials > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-orange-500 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.hazmatMaterials}</strong> Kimyasal / Hazmat</span>
                    </div>
                  )}
                  {dependencyInfo.breakdown.incidents > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.incidents}</strong> Olay Bildirimi</span>
                    </div>
                  )}
                  {dependencyInfo.breakdown.extraordinaryIncidents > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.extraordinaryIncidents}</strong> Olağanüstü Olay</span>
                    </div>
                  )}
                  {dependencyInfo.breakdown.fireDoors > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.fireDoors}</strong> Yangın Kapısı</span>
                    </div>
                  )}
                  {dependencyInfo.breakdown.buildProjects > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.buildProjects}</strong> Proje / İnşaat</span>
                    </div>
                  )}
                  {dependencyInfo.breakdown.btUygunsuzluklar > 0 && (
                    <div className="flex items-center gap-1.5 p-1.5 rounded bg-background border border-border/50 text-foreground">
                      <span className="w-2 h-2 rounded-full bg-cyan-500 shrink-0" />
                      <span><strong>{dependencyInfo.breakdown.btUygunsuzluklar}</strong> BT Uygunsuzluğu</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Hedef Seçimi */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold text-foreground">
                    Verilerin Aktarılacağı Yeni Lokasyon:
                  </Label>
                  {deleteTransferCandidates.length > 0 && (
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomDeleteTransfer((prev) => !prev);
                        setDeleteTransferValue('');
                        setDeleteTransferId('');
                      }}
                      className="text-[11px] text-primary hover:underline"
                    >
                      {isCustomDeleteTransfer ? 'Listeden Seç' : 'Yeni İsim Yaz'}
                    </button>
                  )}
                </div>

                {!isCustomDeleteTransfer && deleteTransferCandidates.length > 0 ? (
                  <Select
                    value={deleteTransferValue}
                    onValueChange={(val) => {
                      if (val === '__custom__') {
                        setIsCustomDeleteTransfer(true);
                        setDeleteTransferValue('');
                        setDeleteTransferId('');
                      } else {
                        setDeleteTransferValue(val);
                        const cand = deleteTransferCandidates.find((c) => c.value === val);
                        setDeleteTransferId(cand?.id || '');
                      }
                    }}
                  >
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Aktarılacak hedef lokasyonu seçin..." />
                    </SelectTrigger>
                    <SelectContent className="max-h-60">
                      {deleteTransferCandidates.map((cand) => (
                        <SelectItem key={cand.id || cand.value} value={cand.value} className="text-xs">
                          {cand.label}
                        </SelectItem>
                      ))}
                      <SelectItem value="__custom__" className="text-xs text-primary font-medium border-t border-border/50">
                        + Farklı Bir İsim Belirt...
                      </SelectItem>
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    autoFocus
                    placeholder="Hedef lokasyon adı (ör. 12. Kat, A Blok, Acil Servis)..."
                    value={deleteTransferValue}
                    onChange={(e) => setDeleteTransferValue(e.target.value)}
                    className="h-9 text-xs"
                  />
                )}
              </div>

              <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-md text-[11px] text-muted-foreground space-y-1">
                <div className="font-semibold text-foreground flex items-center gap-1.5 text-amber-700 dark:text-amber-400">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Otomatik &amp; Kesintisiz Aktarım
                </div>
                <p>
                  &quot;Aktar ve Sil&quot; butonuna bastığınızda bu {dependencyInfo.totalCount} kayıt hedef konuma geçirilecek ve ardından <strong>&quot;{deletePromptTarget.label}&quot;</strong> silinecektir.
                </p>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setDeletePromptTarget(null);
                setDependencyInfo(null);
                setDeleteTransferValue('');
                setDeleteTransferId('');
                setIsCustomDeleteTransfer(false);
              }}
              className="h-8 text-xs rounded-md"
              disabled={deleteMutation.isPending}
            >
              Vazgeç
            </Button>
            <Button
              size="sm"
              onClick={executeDeleteWithTransfer}
              disabled={deleteMutation.isPending || (!deleteTransferValue.trim() && !deleteTransferId)}
              className="h-8 text-xs rounded-md gap-1.5 bg-destructive hover:bg-destructive/90 text-white"
            >
              {deleteMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Trash2 className="w-3.5 h-3.5" />
              )}
              Aktar ve Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
