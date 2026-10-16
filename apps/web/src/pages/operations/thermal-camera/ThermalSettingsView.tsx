import React, { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { thermalInspectionService } from '@/services/thermal-inspection.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import {
  Building2,
  DoorOpen,
  Sliders,
  Plus,
  Trash2,
  Edit2,
  Download,
  Upload,
  Search,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  Layers,
  Info,
  X,
  FileSpreadsheet,
  Building,
  ShieldAlert,
  Thermometer,
  UploadCloud,
  Check,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// Standart 15 Elektrik Pano & Mahal Türü (Diğer kaldırıldı)
const DEFAULT_ROOM_TYPES = [
  'Sunucu Odası',
  'Sistem Odası',
  'UPS Odası',
  'Trafo Odası',
  'Arşiv Odası',
  'MCC Panosu',
  'ADP Pano Odası',
  'Elektrik Panosu',
  'Kat Panosu',
  'Radyoloji Odası',
  'Hücre Odası',
  'CCTV Odası',
  'Bedaş Odası',
  'Anjiyo Odası',
  'Jeneratör Odası'
];

// Türkçe karakter ve Unicode NFC uyumlu metin normalizasyonu
const normalizeTr = (str: string) => {
  return (str || '').trim().normalize('NFC').toLocaleLowerCase('tr-TR');
};

interface Props {
  activeFacilityId?: string;
  facilities?: Array<{ id: string; name: string }>;
  onFacilityChange?: (facilityId: string) => void;
  initialTab?: 'floors' | 'rooms' | 'thresholds' | 'bulk-import';
}

export const ThermalSettingsView: React.FC<Props> = ({
  activeFacilityId,
  facilities: initialFacilities,
  onFacilityChange,
  initialTab = 'floors'
}) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  const urlSubtab = useMemo(() => {
    const s = searchParams.get('subtab');
    if (s === 'bulk-import' || s === 'konsolide' || s === 'import') return 'bulk-import';
    if (s === 'rooms' || s === 'panolar') return 'rooms';
    if (s === 'thresholds' || s === 'esikler') return 'thresholds';
    if (s === 'floors') return 'floors';
    return initialTab;
  }, [searchParams, initialTab]);

  const [activeTab, setActiveTabState] = useState<'floors' | 'rooms' | 'thresholds' | 'bulk-import'>(urlSubtab);

  useEffect(() => {
    if (urlSubtab && urlSubtab !== activeTab) {
      setActiveTabState(urlSubtab);
    }
  }, [urlSubtab]);

  const setActiveTab = (tab: 'floors' | 'rooms' | 'thresholds' | 'bulk-import') => {
    setActiveTabState(tab);
    setSearchParams(prev => {
      const next = new URLSearchParams(prev);
      if (tab === 'floors') {
        next.delete('subtab');
      } else {
        next.set('subtab', tab);
      }
      return next;
    }, { replace: true });
  };

  // ────────────────────────────────────────────────────────────────────────────
  // KONSOLİDE RAPOR AKTARIMI STATE (Tüm Hastaneler & Ölçüm 1, 2, 3)
  // ────────────────────────────────────────────────────────────────────────────
  const [consolidatedFile, setConsolidatedFile] = useState<File | null>(null);
  const [isPreviewingConsolidated, setIsPreviewingConsolidated] = useState(false);
  const [consolidatedPreview, setConsolidatedPreview] = useState<{
    fileName: string;
    totalValidRows: number;
    totalFacilities: number;
    facilities: Array<{
      excelName: string;
      matchType: 'EXACT' | 'FUZZY' | 'NONE';
      matchedFacilityId: string | null;
      matchedFacilityName: string | null;
      matchedFacilityCity: string | null;
      rowCount: number;
      measurements: Array<{ name: string; count: number; sampleDate: string | null }>;
    }>;
    allDbFacilities: Array<{ id: string; name: string; shortName?: string | null; city?: string | null }>;
  } | null>(null);
  const [facilityOverrides, setFacilityOverrides] = useState<Record<string, string>>({});
  const [isImportingConsolidated, setIsImportingConsolidated] = useState(false);
  const [importResult, setImportResult] = useState<{
    message: string;
    stats: {
      totalFacilities: number;
      totalSessions: number;
      totalItems: number;
      totalPanelsRegistered: number;
    };
    details: any[];
  } | null>(null);

  const handleSelectConsolidatedFile = async (selectedFile: File) => {
    setConsolidatedFile(selectedFile);
    setImportResult(null);
    setIsPreviewingConsolidated(true);
    try {
      const preview = await thermalInspectionService.previewConsolidatedExcel(selectedFile);
      setConsolidatedPreview(preview);
      const initialOverrides: Record<string, string> = {};
      preview.facilities.forEach(f => {
        if (f.matchedFacilityId) {
          initialOverrides[f.excelName] = f.matchedFacilityId;
        }
      });
      setFacilityOverrides(initialOverrides);
      toast.success(`${preview.totalFacilities} tesis ve ${preview.totalValidRows} ölçüm satırı tespit edildi.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Excel dosyası önizlenirken bir hata oluştu.');
      setConsolidatedPreview(null);
    } finally {
      setIsPreviewingConsolidated(false);
    }
  };

  const handleExecuteConsolidatedImport = async () => {
    if (!consolidatedFile) {
      toast.error('Lütfen önce bir Excel dosyası seçin.');
      return;
    }
    try {
      setIsImportingConsolidated(true);
      const res = await thermalInspectionService.importConsolidatedExcel(consolidatedFile, facilityOverrides);
      setImportResult(res);
      queryClient.invalidateQueries({ queryKey: ['thermalDashboard'] });
      queryClient.invalidateQueries({ queryKey: ['thermalSessions'] });
      queryClient.invalidateQueries({ queryKey: ['thermalPanels'] });
      toast.success(res.message);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Konsolide aktarım sırasında hata oluştu.');
    } finally {
      setIsImportingConsolidated(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // TESİS SEÇİMİ
  // ────────────────────────────────────────────────────────────────────────────
  const { data: fetchedFacilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      const data = await res.json();
      const list = Array.isArray(data) ? data : (data.facilities || data.data || []);
      return list.filter((f: any) => f.isActive !== false);
    },
    enabled: !initialFacilities || initialFacilities.length === 0
  });

  const facilities = initialFacilities && initialFacilities.length > 0 ? initialFacilities : fetchedFacilities;

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    if (activeFacilityId && activeFacilityId !== 'all') return activeFacilityId;
    return facilities[0]?.id || '';
  });

  useEffect(() => {
    if (activeFacilityId && activeFacilityId !== 'all') {
      setSelectedFacilityId(activeFacilityId);
    } else if (!selectedFacilityId && facilities.length > 0) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [activeFacilityId, facilities]);

  const handleFacilitySelect = (id: string) => {
    setSelectedFacilityId(id);
    if (onFacilityChange) {
      onFacilityChange(id);
    }
  };

  const currentFacilityName = useMemo(() => {
    return facilities.find((f: any) => f.id === selectedFacilityId)?.name || 'Seçili Tesis';
  }, [facilities, selectedFacilityId]);

  // ────────────────────────────────────────────────────────────────────────────
  // SEKME 1: BİNA, BLOK VE KAT KONUMLARI
  // ────────────────────────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingFloorItem, setEditingFloorItem] = useState<any | null>(null);

  // Manuel Ekleme Formu
  const [manualForm, setManualForm] = useState({
    facilityId: '',
    building: 'Ana Bina',
    block: '',
    floor: ''
  });

  // Excel Yükleme State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Bina ve Kat Konum Listesi
  const { data: buildingFloors = [], isLoading: isLoadingFloors } = useQuery<any[]>({
    queryKey: ['fm200BuildingFloors', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId) return [];
      const res = await api.get(`/fm200/building-floors?facilityId=${selectedFacilityId}`);
      if (!res.ok) throw new Error('Konum listesi alınamadı');
      return res.json();
    },
    enabled: !!selectedFacilityId
  });

  // Tekil Bina ve Blok Listeleri (Öneriler için)
  const existingBuildings = useMemo(() => {
    const set = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.building && bf.building.trim()) set.add(bf.building.trim().normalize('NFC'));
    });
    if (set.size === 0) set.add('Ana Bina');
    return Array.from(set);
  }, [buildingFloors]);

  const existingBlocks = useMemo(() => {
    const set = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.block && bf.block.trim()) set.add(bf.block.trim().normalize('NFC'));
    });
    return Array.from(set);
  }, [buildingFloors]);

  // Manuel Kat Ekleme Mutasyonu
  const addBuildingFloorMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/building-floors', {
        facilityId: selectedFacilityId,
        building: (manualForm.building || 'Ana Bina').trim().normalize('NFC'),
        block: manualForm.block ? manualForm.block.trim().normalize('NFC') : null,
        floor: manualForm.floor.trim().normalize('NFC')
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Bina/Kat eklenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors', selectedFacilityId] });
      toast.success('Bina/Kat konumu başarıyla eklendi');
      setIsManualModalOpen(false);
      setManualForm({
        facilityId: selectedFacilityId,
        building: existingBuildings[0] || 'Ana Bina',
        block: '',
        floor: ''
      });
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Kat Güncelleme Mutasyonu
  const updateBuildingFloorMutation = useMutation({
    mutationFn: async (payload: { id: string; building: string; block: string; floor: string }) => {
      const res = await api.put(`/fm200/building-floors/${payload.id}`, {
        building: payload.building.trim().normalize('NFC'),
        block: payload.block ? payload.block.trim().normalize('NFC') : null,
        floor: payload.floor.trim().normalize('NFC')
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Güncellenemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors', selectedFacilityId] });
      toast.success('Kat bilgisi güncellendi');
      setEditingFloorItem(null);
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Kat Silme Mutasyonu
  const deleteFloorMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fm200/building-floors/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors', selectedFacilityId] });
      toast.success('Konum kaydı silindi');
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Excel Şablon İndir
  const handleDownloadTemplate = () => {
    window.open('/api/fm200/excel-template', '_blank');
  };

  // Excel Yükle
  const handleExcelImport = async () => {
    if (!excelFile) {
      toast.error('Lütfen bir Excel dosyası seçin');
      return;
    }
    if (!selectedFacilityId) {
      toast.error('Lütfen aktarım yapılacak tesisi seçin');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('facilityId', selectedFacilityId);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/fm200/import-excel', {
        method: 'POST',
        headers: {
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: formData
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'İçe aktarma başarısız');

      toast.success(data.message || 'Konumlar başarıyla aktarıldı');
      setIsExcelModalOpen(false);
      setExcelFile(null);
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors', selectedFacilityId] });
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu');
    } finally {
      setIsImporting(false);
    }
  };

  // Kat Filtreleme
  const filteredFloors = useMemo(() => {
    const q = normalizeTr(searchQuery);
    return buildingFloors.filter(item => {
      if (!q) return true;
      const b = normalizeTr(item.building || '');
      const blk = normalizeTr(item.block || '');
      const flr = normalizeTr(item.floor || '');
      return b.includes(q) || blk.includes(q) || flr.includes(q);
    });
  }, [buildingFloors, searchQuery]);

  // ────────────────────────────────────────────────────────────────────────────
  // SEKME 2: PANO VE MAHAL TÜRLERİ (PANO TİPLERİ - SIKI KONTROL & NORMALİZASYON)
  // ────────────────────────────────────────────────────────────────────────────
  const [newRoomType, setNewRoomType] = useState('');
  const [roomTypeSearch, setRoomTypeSearch] = useState('');
  const [editingRoomType, setEditingRoomType] = useState<{ oldName: string; newName: string } | null>(null);

  // Ayarları Çek
  const { data: fm200Settings, isLoading: isLoadingSettings } = useQuery<any>({
    queryKey: ['fm200Settings'],
    queryFn: async () => {
      const res = await api.get('/fm200/settings');
      if (!res.ok) throw new Error('Ayarlar alınamadı');
      return res.json();
    }
  });

  // Sıkı Kontrollü ve Normalizasyonlu roomTypes Listesi (Kullanıcı ekledikleri korunur, Diğer hariç)
  const roomTypes: string[] = useMemo(() => {
    const raw = fm200Settings?.roomTypes;
    let list: string[] = [];
    if (Array.isArray(raw)) {
      list = raw;
    } else if (typeof raw === 'string') {
      try { list = JSON.parse(raw); } catch { list = []; }
    } else if (fm200Settings === undefined) {
      list = DEFAULT_ROOM_TYPES;
    }

    const seen = new Set<string>();
    const cleaned: string[] = [];
    for (const item of list) {
      if (typeof item === 'string' && item.trim()) {
        const norm = item.trim().normalize('NFC');
        const key = normalizeTr(norm);
        if (!seen.has(key) && key !== 'diğer' && key !== 'diger') {
          seen.add(key);
          cleaned.push(norm);
        }
      }
    }
    return cleaned;
  }, [fm200Settings]);

  // Ayarları Güncelle Mutasyonu
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: { roomTypes?: string[] }) => {
      const res = await api.put('/fm200/settings', payload);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200Settings'] });
      toast.success('Pano ve mahal türleri başarıyla güncellendi');
      setEditingRoomType(null);
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Yeni Pano Türü Ekle (Sıkı Kontrol)
  const handleAddRoomType = () => {
    const trimmed = newRoomType.trim().normalize('NFC');
    if (!trimmed) {
      toast.error('Lütfen bir pano veya mahal türü adı yazın');
      return;
    }
    const targetKey = normalizeTr(trimmed);
    if (targetKey === 'diğer' || targetKey === 'diger') {
      toast.error('"Diğer" seçeneği kullanılmamaktadır.');
      return;
    }

    if (roomTypes.some(r => normalizeTr(r) === targetKey)) {
      toast.error('Bu pano/oda türü listede zaten mevcut');
      return;
    }

    const updated = [...roomTypes, trimmed];
    updateSettingsMutation.mutate({ roomTypes: updated });
    setNewRoomType('');
  };

  // Pano Türü Düzenleme Kaydet
  const handleEditRoomTypeSave = () => {
    if (!editingRoomType) return;
    const { oldName, newName } = editingRoomType;
    const trimmed = newName.trim().normalize('NFC');
    if (!trimmed) {
      toast.error('İsim boş bırakılamaz');
      return;
    }
    const oldKey = normalizeTr(oldName);
    const newKey = normalizeTr(trimmed);

    if (newKey === 'diğer' || newKey === 'diger') {
      toast.error('"Diğer" seçeneği kullanılmamaktadır.');
      return;
    }

    if (oldKey !== newKey && roomTypes.some(r => normalizeTr(r) === newKey)) {
      toast.error('Bu isimde başka bir kayıt zaten var');
      return;
    }

    const updated = roomTypes.map(r => normalizeTr(r) === oldKey ? trimmed : r);
    updateSettingsMutation.mutate({ roomTypes: updated });
  };

  // Pano Türü Kaldır (İstisnasız her tür silinebilir)
  const handleRemoveRoomType = (typeName: string) => {
    if (window.confirm(`"${typeName}" pano tipini listeden kaldırmak istediğinize emin misiniz?`)) {
      const targetKey = normalizeTr(typeName);
      const updated = roomTypes.filter(r => normalizeTr(r) !== targetKey);
      updateSettingsMutation.mutate({ roomTypes: updated });
    }
  };

  // Filtrelenmiş Pano Türleri
  const filteredRoomTypes = useMemo(() => {
    if (!roomTypeSearch.trim()) return roomTypes;
    const q = normalizeTr(roomTypeSearch);
    return roomTypes.filter(t => normalizeTr(t).includes(q));
  }, [roomTypes, roomTypeSearch]);

  // ────────────────────────────────────────────────────────────────────────────
  // SEKME 3: TERMAL EŞİK VE ΔT DEĞERLENDİRME KRİTERLERİ
  // ────────────────────────────────────────────────────────────────────────────
  const [warningThreshold, setWarningThreshold] = useState<number>(35.0);
  const [criticalThreshold, setCriticalThreshold] = useState<number>(40.0);
  const [deltaWarning, setDeltaWarning] = useState<number>(15.0);
  const [deltaCritical, setDeltaCritical] = useState<number>(30.0);
  const [negativeDeltaWarn, setNegativeDeltaWarn] = useState<boolean>(true);
  const [loadingThresholds, setLoadingThresholds] = useState(false);
  const [savingThresholds, setSavingThresholds] = useState(false);

  useEffect(() => {
    fetchThermalThresholds();
  }, [selectedFacilityId]);

  const fetchThermalThresholds = async () => {
    try {
      setLoadingThresholds(true);
      const data = await thermalInspectionService.getSettings(selectedFacilityId || undefined);
      if (data) {
        setWarningThreshold(data.warningThreshold ?? 35.0);
        setCriticalThreshold(data.criticalThreshold ?? 40.0);
        setDeltaWarning(data.deltaWarning ?? 15.0);
        setDeltaCritical(data.deltaCritical ?? 30.0);
        setNegativeDeltaWarn(data.negativeDeltaWarn ?? true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingThresholds(false);
    }
  };

  const handleSaveThresholds = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSavingThresholds(true);
      await thermalInspectionService.updateSettings({
        facilityId: selectedFacilityId || null,
        warningThreshold,
        criticalThreshold,
        deltaWarning,
        deltaCritical,
        negativeDeltaWarn
      });
      toast.success('Termal değerlendirme ve ΔT eşik ayarları kaydedildi!');
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Eşik ayarları kaydedilemedi.');
    } finally {
      setSavingThresholds(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* ───────────────────────────────────────────────────────────── */}
      {/* ÜST BAŞLIK, TESİS SEÇİCİ VE 3'LÜ SEKME GEÇİŞİ                */}
      {/* ───────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-orange-50 dark:bg-orange-950/50 text-orange-600 dark:text-orange-400">
              <Sliders className="w-5 h-5" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                  Termal Kamera & Pano Modül Ayarları
                </h2>
                <Badge variant="secondary" className="text-[10px] font-semibold bg-orange-100 dark:bg-orange-950 text-orange-700 dark:text-orange-300">
                  Yönetici Paneli
                </Badge>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Fiziksel katlar, elektrik pano & mahal türleri ve termal risk değerlendirme eşiklerini yönetin.
              </p>
            </div>
          </div>
        </div>

        {/* 3 Sekmeli Buton Grubu */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('floors')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'floors'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Bina, Blok ve Katlar
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300">
              {buildingFloors.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'rooms'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            Pano & Mahal Türleri
            <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-4 border-slate-300">
              {roomTypes.length}
            </Badge>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('thresholds')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'thresholds'
                ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Thermometer className="w-4 h-4" />
            Termal & ΔT Eşikleri
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('bulk-import')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'bulk-import'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            Konsolide Rapor Aktarımı
            <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-0 text-[10px] px-1.5 py-0 h-4">
              Toplu
            </Badge>
          </button>
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEKME 1: BİNA, BLOK VE KAT KONUMLARI                          */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'floors' && (
        <div className="space-y-6">
          {/* Tesis Seçimi ve Üst Butonlar */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                <Building className="w-4 h-4 text-orange-600" />
                Aktif Tesis:
              </div>
              <select
                value={selectedFacilityId}
                onChange={(e) => handleFacilitySelect(e.target.value)}
                className="h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium focus:ring-2 focus:ring-orange-500/20"
              >
                {facilities.map((fac: any) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDownloadTemplate}
                className="text-xs h-9 gap-1.5"
              >
                <Download className="w-3.5 h-3.5" />
                Şablon İndir
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsExcelModalOpen(true)}
                className="text-xs h-9 gap-1.5 text-emerald-600 border-emerald-200 hover:bg-emerald-50 dark:hover:bg-emerald-950/20"
              >
                <FileSpreadsheet className="w-3.5 h-3.5" />
                Excel'den Yükle
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setManualForm({
                    facilityId: selectedFacilityId,
                    building: existingBuildings[0] || 'Ana Bina',
                    block: '',
                    floor: ''
                  });
                  setIsManualModalOpen(true);
                }}
                className="text-xs h-9 gap-1.5 bg-orange-600 hover:bg-orange-700 text-white font-medium"
              >
                <Plus className="w-3.5 h-3.5" />
                Yeni Kat Ekle
              </Button>
            </div>
          </div>

          {/* Kat Arama ve Tablo */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Bina, blok veya kat ara..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 h-9 text-xs"
                />
              </div>
              <div className="text-xs text-slate-500 font-medium">
                Toplam <strong>{filteredFloors.length}</strong> / {buildingFloors.length} Kat Kayıtlı
              </div>
            </div>

            {isLoadingFloors ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-600" />
                <span className="text-xs">Konum listesi yükleniyor...</span>
              </div>
            ) : filteredFloors.length === 0 ? (
              <div className="py-16 flex flex-col items-center justify-center text-slate-400 gap-2 text-center px-4">
                <Building2 className="w-10 h-10 stroke-1 text-slate-300" />
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                  {buildingFloors.length === 0 ? 'Bu tesis için henüz kat tanımlanmamış.' : 'Arama kriterlerine uygun kat bulunamadı.'}
                </p>
                <p className="text-xs text-slate-500 max-w-md">
                  Sağ üstteki "Yeni Kat Ekle" butonunu veya "Excel'den Yükle" seçeneğini kullanarak bina, blok ve kat tanımlarını içe aktarabilirsiniz.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-600 dark:text-slate-400 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="py-3 px-4 w-12 text-center">#</th>
                      <th className="py-3 px-4">Bina</th>
                      <th className="py-3 px-4">Blok</th>
                      <th className="py-3 px-4">Kat Adı</th>
                      <th className="py-3 px-4 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFloors.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="py-3 px-4 text-center font-mono text-slate-400">
                          {idx + 1}
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-800 dark:text-slate-200">
                          {item.building || 'Ana Bina'}
                        </td>
                        <td className="py-3 px-4 text-slate-600 dark:text-slate-400">
                          {item.block || '—'}
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-semibold px-2.5 py-1 rounded-lg bg-orange-50 dark:bg-orange-950/50 text-orange-700 dark:text-orange-300 border border-orange-200/60 dark:border-orange-900/40">
                            {item.floor}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right space-x-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingFloorItem(item)}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-blue-600"
                            title="Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              if (window.confirm(`"${item.building} - ${item.floor}" kaydını silmek istediğinize emin misiniz?`)) {
                                deleteFloorMutation.mutate(item.id);
                              }
                            }}
                            className="h-8 w-8 p-0 text-slate-500 hover:text-rose-600"
                            title="Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEKME 2: PANO VE MAHAL TÜRLERİ (PANO TİPLERİ)                 */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          {/* Yeni Pano Türü Ekle Kartı */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-orange-600" />
                Yeni Pano / Mahal Türü Ekle
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Elektrik panoları, oda ve mahal türleri. Buraya eklenen türler termal ölçüm ve denetim modüllerinde standart olarak seçilebilir.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Input
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  placeholder="Örn: Kompanzasyon Panosu, UPS Odası, Tali Elektrik Panosu..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRoomType();
                    }
                  }}
                  className="h-10 text-xs"
                />
              </div>
              <Button
                onClick={handleAddRoomType}
                disabled={!newRoomType.trim() || updateSettingsMutation.isPending}
                className="w-full sm:w-auto h-10 bg-orange-600 hover:bg-orange-700 text-white px-5 text-xs font-semibold shrink-0 gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Listeye Ekle
              </Button>
            </div>
          </div>

          {/* Tanımlı Pano Türleri Kart Grid */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  Tanımlı Pano ve Mahal Türleri
                </span>
                <Badge variant="outline" className="text-xs font-semibold px-2 border-slate-300">
                  {roomTypes.length} Tür
                </Badge>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Pano türü filtrele..."
                  value={roomTypeSearch}
                  onChange={(e) => setRoomTypeSearch(e.target.value)}
                  className="pl-8 h-8 text-xs"
                />
              </div>
            </div>

            {isLoadingSettings ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-600" />
                <span className="text-xs">Ayarlar yükleniyor...</span>
              </div>
            ) : filteredRoomTypes.length === 0 ? (
              <div className="py-12 text-center text-slate-400 text-xs">
                Arama kriterine uygun pano türü bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredRoomTypes.map((type, idx) => {
                  return (
                    <div
                      key={type}
                      className="flex items-center justify-between p-3 rounded-xl border transition-all bg-slate-50/80 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-orange-400/50"
                    >
                      <div className="flex items-center gap-2.5 truncate">
                        <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border text-[11px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                          {idx + 1}
                        </span>
                        <span className="text-xs font-semibold truncate" title={type}>
                          {type}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0 ml-2">
                        <button
                          type="button"
                          onClick={() => setEditingRoomType({ oldName: type, newName: type })}
                          className="p-1 text-slate-400 hover:text-blue-600 rounded transition-colors"
                          title="Düzenle"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveRoomType(type)}
                          className="p-1 text-slate-400 hover:text-rose-600 rounded transition-colors"
                          title="Kaldır"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEKME 3: TERMAL EŞİK VE ΔT DEĞERLENDİRME KRİTERLERİ           */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'thresholds' && (
        <div className="space-y-6">
          <form onSubmit={handleSaveThresholds} className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-orange-600" />
                  Sıcaklık ve ΔT Risk Değerlendirme Eşikleri
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Ölçülen sıcaklıklar ve ortam farkları (ΔT) bu parametrelerle karşılaştırılarak otomatik risk seviyesi atanır.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Tesis:</span>
                <Badge variant="outline" className="text-xs px-2.5 py-1">
                  {currentFacilityName}
                </Badge>
              </div>
            </div>

            {loadingThresholds ? (
              <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                <RefreshCw className="w-6 h-6 animate-spin text-orange-600" />
                <span className="text-xs">Eşik ayarları yükleniyor...</span>
              </div>
            ) : (
              <>
                {/* Açıklama Kutusu */}
                <div className="bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 rounded-xl p-3 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2.5">
                  <Info className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] leading-relaxed">
                    Termal kamera çekiminde <strong>ΔT = Ölçülen Sıcaklık - Ortam Sıcaklığı</strong> olarak hesaplanır. Ölçülen sıcaklık veya ΔT eşiklerden herhangi birini aştığında pano <strong>Takip</strong> veya <strong>Uygunsuz / Kritik</strong> olarak sınıflandırılır.
                  </p>
                </div>

                {/* 1. Ölçülen Sıcaklık Sınırları */}
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    1. Ölçülen Yüzey Sıcaklığı Sınırları (°C)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Takip Başlangıç Eşiği (°C)
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={warningThreshold}
                        onChange={(e) => setWarningThreshold(parseFloat(e.target.value) || 35)}
                        className="h-10 text-sm font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Varsayılan 35.0 °C. Bu dereceden itibaren pano izlemeye alınır.
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950/50 space-y-1.5 bg-rose-50/30 dark:bg-rose-950/10">
                      <Label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                        Kritik / Acil Eylem Eşiği (°C)
                      </Label>
                      <Input
                        type="number"
                        step="0.5"
                        value={criticalThreshold}
                        onChange={(e) => setCriticalThreshold(parseFloat(e.target.value) || 40)}
                        className="h-10 text-sm font-semibold text-rose-600 dark:text-rose-400"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Varsayılan 40.0 °C. Bu dereceden itibaren derhal teknik müdahale açılır.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 2. Sıcaklık Farkı Eşikleri (ΔT) */}
                <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">
                    2. Sıcaklık Farkı Eşikleri (ΔT = Ölçülen - Ortam)
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 space-y-1.5">
                      <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                        Uyarı Farkı (ΔT °C)
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={deltaWarning}
                        onChange={(e) => setDeltaWarning(parseFloat(e.target.value) || 15)}
                        className="h-10 text-sm font-semibold"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Varsayılan 15 °C. Ortamdan 15°C sıcak panolar takip listesine eklenir.
                      </span>
                    </div>

                    <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-950/50 space-y-1.5 bg-rose-50/30 dark:bg-rose-950/10">
                      <Label className="text-xs font-semibold text-rose-700 dark:text-rose-400">
                        Acil Farkı (ΔT °C)
                      </Label>
                      <Input
                        type="number"
                        step="1"
                        value={deltaCritical}
                        onChange={(e) => setDeltaCritical(parseFloat(e.target.value) || 30)}
                        className="h-10 text-sm font-semibold text-rose-600 dark:text-rose-400"
                      />
                      <span className="text-[10px] text-slate-400 block">
                        Varsayılan 30 °C. 30°C ve üzeri aşırı ısınma kritik risk sayılır.
                      </span>
                    </div>
                  </div>
                </div>

                {/* 3. Negatif Delta T Doğrulama */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-bold text-slate-900 dark:text-white">
                      Ortamdan Soğuk Ölçüm Uyarısı (ΔT &lt; 0)
                    </Label>
                    <p className="text-[11px] text-slate-500">
                      Pano sıcaklığı ortamdan düşük çıkarsa parlak yüzey yansıması doğrulaması uyarısı ver.
                    </p>
                  </div>
                  <input
                    type="checkbox"
                    checked={negativeDeltaWarn}
                    onChange={(e) => setNegativeDeltaWarn(e.target.checked)}
                    className="w-4 h-4 rounded text-orange-600 focus:ring-orange-500"
                  />
                </div>

                {/* Kaydet Butonu */}
                <div className="pt-4 flex items-center justify-end border-t border-slate-100 dark:border-slate-800">
                  <Button
                    type="submit"
                    disabled={savingThresholds || loadingThresholds}
                    className="bg-orange-600 hover:bg-orange-700 text-white text-xs gap-1.5 font-medium px-5 h-10"
                  >
                    {savingThresholds ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        Kaydediliyor...
                      </>
                    ) : (
                      'Eşik Ayarlarını Kaydet'
                    )}
                  </Button>
                </div>
              </>
            )}
          </form>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* SEKME 4: KONSOLİDE RAPOR AKTARIMI (Tüm Hastaneler & Ölçümler) */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === 'bulk-import' && (
        <div className="space-y-6">
          {/* Üst Bilgilendirme Kartı */}
          <div className="bg-gradient-to-r from-emerald-500/10 via-teal-500/5 to-transparent p-6 rounded-2xl border border-emerald-200/80 dark:border-emerald-900/40 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
                <FileSpreadsheet className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Konsolide Termal Rapor Aktarımı
                  </h3>
                  <Badge className="bg-emerald-600 text-white border-0 text-[10px] px-2 py-0.5">
                    Toplu İçe Aktarım
                  </Badge>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-2xl leading-relaxed">
                  Tüm hastanelerin tek bir Excel dosyasında yer aldığı konsolide ölçüm tablosunu (Kolon A: Hastane, Kolon E: Ölçüm 1, Ölçüm 2 vb.) tek seferde sisteme yükleyin. Sistem tesisleri otomatik eşleştirir ve her ölçüm periyodu için ayrı rapor oturumu açar.
                </p>
              </div>
            </div>

            {consolidatedPreview && !importResult && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setConsolidatedFile(null);
                  setConsolidatedPreview(null);
                }}
                className="text-xs h-9 gap-1.5 text-slate-600 dark:text-slate-300"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                Farklı Dosya Seç
              </Button>
            )}
          </div>

          {/* DURUM 1: AKTARIM TAMAMLANDI VE SONUÇ GÖSTERİLİYOR */}
          {importResult && (
            <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-emerald-200 dark:border-emerald-800 shadow-lg text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div className="space-y-1.5 max-w-lg mx-auto">
                <h4 className="text-lg font-bold text-slate-900 dark:text-white">
                  Konsolide Raporlar Başarıyla Aktarıldı!
                </h4>
                <p className="text-xs text-slate-500">
                  {importResult.message}
                </p>
              </div>

              {/* İstatistik Kutucukları */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-2">
                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    {importResult.stats.totalFacilities}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">
                    Aktarılan Tesis
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                    {importResult.stats.totalSessions}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">
                    Rapor Oturumu
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black text-orange-600 dark:text-orange-400">
                    {importResult.stats.totalItems.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">
                    Pano Ölçüm Satırı
                  </div>
                </div>

                <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                  <div className="text-2xl font-black text-blue-600 dark:text-blue-400">
                    {importResult.stats.totalPanelsRegistered}
                  </div>
                  <div className="text-[11px] font-medium text-slate-500 mt-1">
                    Yeni Eklenen Pano
                  </div>
                </div>
              </div>

              {/* Hızlı Erişim Butonları */}
              <div className="flex flex-wrap items-center justify-center gap-3 pt-4">
                <Button
                  onClick={() => navigate('/operations-management/thermal-camera?tab=table')}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs h-10 px-5 gap-2 font-medium"
                >
                  <Layers className="w-4 h-4" />
                  Pano Ölçüm Tablosuna Git
                </Button>
                <Button
                  variant="outline"
                  onClick={() => navigate('/operations-management/thermal-camera?tab=dashboard')}
                  className="text-xs h-10 px-5 gap-2"
                >
                  <Building2 className="w-4 h-4" />
                  Termal Dashboard'a Git
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => {
                    setConsolidatedFile(null);
                    setConsolidatedPreview(null);
                    setImportResult(null);
                  }}
                  className="text-xs h-10 px-4 text-slate-500 hover:text-slate-800 dark:hover:text-white"
                >
                  Yeni Bir Dosya Yükle
                </Button>
              </div>
            </div>
          )}

          {/* DURUM 2: HENÜZ DOSYA SEÇİLMEDİ */}
          {!consolidatedPreview && !importResult && (
            <div className="space-y-6">
              <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border-2 border-dashed border-slate-200 dark:border-slate-800 hover:border-emerald-500/50 transition-colors text-center relative">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleSelectConsolidatedFile(f);
                  }}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  id="consolidated-excel-input"
                  disabled={isPreviewingConsolidated}
                />
                <div className="flex flex-col items-center justify-center gap-3 py-6 pointer-events-none">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shadow-xs">
                    {isPreviewingConsolidated ? (
                      <RefreshCw className="w-8 h-8 animate-spin" />
                    ) : (
                      <UploadCloud className="w-8 h-8" />
                    )}
                  </div>
                  <div>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white">
                      {isPreviewingConsolidated
                        ? 'Excel Dosyası Taranıyor...'
                        : 'Konsolide Excel Dosyasını Sürükleyin veya Seçmek İçin Tıklayın'}
                    </h4>
                    <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                      {isPreviewingConsolidated
                        ? 'Tesis isimleri ve ölçüm sütunları analiz ediliyor, lütfen bekleyiniz.'
                        : 'Örnek: "Konsolide_Termal Kamera Ölçüm Değerlendirme ve Aksiyon Takip Tablosu_15.10.2026.xlsx" (.xlsx, .xls)'}
                    </p>
                  </div>
                  {!isPreviewingConsolidated && (
                    <Button
                      type="button"
                      size="sm"
                      className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs mt-2 pointer-events-auto"
                      onClick={() => document.getElementById('consolidated-excel-input')?.click()}
                    >
                      <FileSpreadsheet className="w-4 h-4 mr-1.5" />
                      Dosya Seç
                    </Button>
                  )}
                </div>
              </div>

              {/* Bilgi Kartları */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 flex items-center justify-center">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    1. Otomatik Tesis Eşleme
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    A sütunundaki hastane isimleri sistemdeki tesisler ile eşleştirilir. Önizleme ekranında gerekirse açılır listeden kolayca müdahale edebilirsiniz.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-orange-600 flex items-center justify-center">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    2. Rapor Periyotları (Ölçüm 1, 2, 3)
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    E sütunundaki her ölçüm periyodu ('Ölçüm 1', 'Ölçüm 2' vb.) ilgili tesis için bağımsız birer termal kontrol oturumu olarak kaydedilir.
                  </p>
                </div>

                <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-950/60 text-blue-600 flex items-center justify-center">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <h5 className="text-xs font-bold text-slate-900 dark:text-white">
                    3. Pano Envanteri Senkronizasyonu
                  </h5>
                  <p className="text-[11px] text-slate-500 leading-relaxed">
                    Ölçümlerde yer alan panolar, tesisinizin Elektrik Pano Envanterine henüz eklenmemişse otomatik olarak oluşturulur ve kodlanır.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* DURUM 3: ÖNİZLEME YÜKLENDİ VE KULLANICI ONAYI BEKLENİYOR */}
          {consolidatedPreview && !importResult && (
            <div className="space-y-6">
              {/* Özet Şerit */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Toplam Geçerli Satır</div>
                  <div className="text-xl font-black text-slate-900 dark:text-white mt-1">
                    {consolidatedPreview.totalValidRows.toLocaleString('tr-TR')}
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Pano ölçüm kaydı</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Tespit Edilen Tesis</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1">
                    {consolidatedPreview.totalFacilities} Hastane
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Kolon A analizi</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Açılacak Rapor Sayısı</div>
                  <div className="text-xl font-black text-orange-600 dark:text-orange-400 mt-1">
                    {consolidatedPreview.facilities.reduce((acc, f) => acc + f.measurements.length, 0)} Oturum
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Ölçüm 1, 2, 3 toplamı</div>
                </div>

                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs text-slate-500 font-medium">Eşleşme Durumu</div>
                  <div className="text-xl font-black text-emerald-600 dark:text-emerald-400 mt-1 flex items-center gap-1.5">
                    <Check className="w-5 h-5" />
                    %100 Eşleşti
                  </div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 mt-0.5">
                    {consolidatedPreview.facilities.filter(f => f.matchType === 'EXACT').length} / {consolidatedPreview.totalFacilities} Tesis Tam Uyumlu
                  </div>
                </div>
              </div>

              {/* Tesis Eşleme Tablosu */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-emerald-600" />
                      Tesis Eşleştirmeleri ve Ölçüm Dağılımı ({consolidatedPreview.facilities.length} Tesis)
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Excel'deki tesis adının sistemde hangi tesise aktarılacağını buradan kontrol edebilir veya değiştirebilirsiniz.
                    </p>
                  </div>

                  <div className="text-xs font-semibold text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800 px-3 py-1.5 rounded-lg">
                    Dosya: <span className="text-slate-900 dark:text-white font-mono">{consolidatedPreview.fileName}</span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 text-slate-500 dark:text-slate-400 font-semibold">
                        <th className="py-3 px-4 w-12 text-center">#</th>
                        <th className="py-3 px-4">Excel Tesis Adı (Kolon A)</th>
                        <th className="py-3 px-4 min-w-[240px]">Sistemdeki Eşleşen Tesis</th>
                        <th className="py-3 px-4">Raporlar / Ölçümler (Kolon E)</th>
                        <th className="py-3 px-4 text-center">Kayıt Sayısı</th>
                        <th className="py-3 px-4 text-center">Durum</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {consolidatedPreview.facilities.map((fac, idx) => {
                        const currentTargetId = facilityOverrides[fac.excelName] || fac.matchedFacilityId || '';
                        return (
                          <tr key={fac.excelName} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                            <td className="py-3.5 px-4 text-center text-slate-400 font-mono">
                              {idx + 1}
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-900 dark:text-white">
                              {fac.excelName}
                            </td>
                            <td className="py-3.5 px-4">
                              <select
                                value={currentTargetId}
                                onChange={(e) => {
                                  setFacilityOverrides(prev => ({
                                    ...prev,
                                    [fac.excelName]: e.target.value
                                  }));
                                }}
                                className="w-full text-xs h-9 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-medium"
                              >
                                <option value="">-- Tesis Seçiniz --</option>
                                {consolidatedPreview.allDbFacilities.map(db => (
                                  <option key={db.id} value={db.id}>
                                    {db.name} {db.city ? `(${db.city})` : ''}
                                  </option>
                                ))}
                              </select>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex flex-wrap items-center gap-1.5">
                                {fac.measurements.map(m => (
                                  <Badge
                                    key={m.name}
                                    variant="outline"
                                    className="text-[10px] bg-slate-50 dark:bg-slate-800/80 border-slate-200 dark:border-slate-700 font-medium"
                                  >
                                    <span className="font-semibold text-slate-700 dark:text-slate-300 mr-1">{m.name}:</span>
                                    {m.count} satır
                                    {m.sampleDate && <span className="text-slate-400 ml-1">({m.sampleDate})</span>}
                                  </Badge>
                                ))}
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-slate-700 dark:text-slate-300">
                              {fac.rowCount}
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              {fac.matchType === 'EXACT' ? (
                                <Badge className="bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border-0 text-[10px]">
                                  Tam Eşleşti
                                </Badge>
                              ) : fac.matchType === 'FUZZY' ? (
                                <Badge className="bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border-0 text-[10px]">
                                  Öneri Eşleşti
                                </Badge>
                              ) : (
                                <Badge className="bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400 border-0 text-[10px]">
                                  Seçim Gerekli
                                </Badge>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Alt Eylem ve Başlat Butonu */}
                <div className="p-5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="text-xs text-slate-500">
                    Toplam <strong className="text-slate-900 dark:text-white font-semibold">{consolidatedPreview.facilities.length} tesis</strong> için <strong className="text-slate-900 dark:text-white font-semibold">{consolidatedPreview.totalValidRows.toLocaleString('tr-TR')} pano ölçümü</strong> aktarılacaktır.
                  </div>

                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setConsolidatedFile(null);
                        setConsolidatedPreview(null);
                      }}
                      className="text-xs h-10 px-4"
                      disabled={isImportingConsolidated}
                    >
                      Vazgeç / Sıfırla
                    </Button>
                    <Button
                      onClick={handleExecuteConsolidatedImport}
                      disabled={isImportingConsolidated}
                      className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs h-10 px-6 gap-2 shadow-xs"
                    >
                      {isImportingConsolidated ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Raporlar ve Ölçümler Aktarılıyor...
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4" />
                          Tüm Raporları ve Ölçümleri Sisteme Aktar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* MODALLER                                                      */}
      {/* ───────────────────────────────────────────────────────────── */}


      {/* MODAL 1: MANUEL BİNA / KAT EKLEME */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-orange-600" />
              Yeni Kat / Konum Ekle
            </DialogTitle>
            <DialogDescription className="text-xs">
              {currentFacilityName} için fiziksel bina ve kat tanımı ekleyin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <Label className="text-xs font-semibold">Bina Adı *</Label>
              <div className="space-y-1.5 mt-1">
                <select
                  value={manualForm.building}
                  onChange={(e) => setManualForm({ ...manualForm, building: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
                >
                  {existingBuildings.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                  <option value="__NEW__">+ Yeni Bina Adı Yaz...</option>
                </select>
                {manualForm.building === '__NEW__' && (
                  <Input
                    placeholder="Yeni Bina Adı (Örn: Ek Hizmet Binası)"
                    onChange={(e) => setManualForm({ ...manualForm, building: e.target.value })}
                    className="h-9 text-xs"
                    autoFocus
                  />
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Blok (Opsiyonel)</Label>
              <div className="space-y-1.5 mt-1">
                <Input
                  placeholder="Örn: A Blok, B Blok vb."
                  value={manualForm.block}
                  onChange={(e) => setManualForm({ ...manualForm, block: e.target.value })}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            <div>
              <Label className="text-xs font-semibold">Kat Adı *</Label>
              <Input
                placeholder="Örn: Zemin Kat, 1. Kat, B1 vb."
                value={manualForm.floor}
                onChange={(e) => setManualForm({ ...manualForm, floor: e.target.value })}
                className="h-9 text-xs mt-1"
                required
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsManualModalOpen(false)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => addBuildingFloorMutation.mutate()}
              disabled={!manualForm.floor.trim() || addBuildingFloorMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {addBuildingFloorMutation.isPending ? 'Ekleniyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 2: KAT DÜZENLEME */}
      <Dialog open={!!editingFloorItem} onOpenChange={(open) => !open && setEditingFloorItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-orange-600" />
              Kat Bilgisini Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mevcut bina, blok veya kat adını güncelleyin.
            </DialogDescription>
          </DialogHeader>

          {editingFloorItem && (
            <div className="space-y-3.5 py-2">
              <div>
                <Label className="text-xs font-semibold">Bina Adı *</Label>
                <Input
                  value={editingFloorItem.building || ''}
                  onChange={(e) => setEditingFloorItem({ ...editingFloorItem, building: e.target.value })}
                  className="h-9 mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Blok</Label>
                <Input
                  value={editingFloorItem.block || ''}
                  onChange={(e) => setEditingFloorItem({ ...editingFloorItem, block: e.target.value })}
                  className="h-9 mt-1 text-xs"
                />
              </div>
              <div>
                <Label className="text-xs font-semibold">Kat Adı *</Label>
                <Input
                  value={editingFloorItem.floor || ''}
                  onChange={(e) => setEditingFloorItem({ ...editingFloorItem, floor: e.target.value })}
                  className="h-9 mt-1 text-xs"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingFloorItem(null)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => {
                if (editingFloorItem) {
                  updateBuildingFloorMutation.mutate({
                    id: editingFloorItem.id,
                    building: editingFloorItem.building,
                    block: editingFloorItem.block,
                    floor: editingFloorItem.floor
                  });
                }
              }}
              disabled={!editingFloorItem?.floor?.trim() || updateBuildingFloorMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updateBuildingFloorMutation.isPending ? 'Kaydediliyor...' : 'Güncelle'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 3: PANO TÜRÜ DÜZENLEME */}
      <Dialog open={!!editingRoomType} onOpenChange={(open) => !open && setEditingRoomType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-orange-600" />
              Pano / Mahal Türünü Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Bu pano veya mahal türünün adını güncelleyin.
            </DialogDescription>
          </DialogHeader>

          {editingRoomType && (
            <div className="space-y-3 py-2">
              <div>
                <Label className="text-xs font-semibold">Pano / Mahal Adı *</Label>
                <Input
                  value={editingRoomType.newName}
                  onChange={(e) => setEditingRoomType({ ...editingRoomType, newName: e.target.value })}
                  className="h-9 mt-1 text-xs"
                  placeholder="Örn: UPS Odası, Kat Panosu"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingRoomType(null)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleEditRoomTypeSave}
              disabled={!editingRoomType?.newName?.trim() || updateSettingsMutation.isPending}
              className="bg-orange-600 hover:bg-orange-700 text-white"
            >
              {updateSettingsMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* MODAL 4: EXCEL İLE TOPLU KAT YÜKLEME */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              Excel ile Toplu Kat Konumları Yükle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Şablon formatındaki Excel dosyasını seçerek kat konumlarını tek seferde sisteme aktarabilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold">Hedef Tesis</Label>
              <Input
                value={currentFacilityName}
                disabled
                className="h-9 mt-1 text-xs bg-slate-50 dark:bg-slate-800"
              />
            </div>

            <div>
              <Label className="text-xs font-semibold">Excel Dosyası (.xlsx, .xls) *</Label>
              <div className="mt-1 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl p-4 text-center hover:border-orange-500/50 transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => setExcelFile(e.target.files?.[0] || null)}
                  className="hidden"
                  id="thermal-excel-file-input"
                />
                <label
                  htmlFor="thermal-excel-file-input"
                  className="cursor-pointer flex flex-col items-center justify-center gap-1.5"
                >
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    {excelFile ? excelFile.name : 'Dosya Seçmek İçin Tıklayın'}
                  </span>
                  <span className="text-[10px] text-slate-400">
                    Sütunlar: Bina, Blok, Kat
                  </span>
                </label>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsExcelModalOpen(false)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleExcelImport}
              disabled={!excelFile || isImporting}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Aktarılıyor...
                </>
              ) : (
                'İçe Aktar'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
