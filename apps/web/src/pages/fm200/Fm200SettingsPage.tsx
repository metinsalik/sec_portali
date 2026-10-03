import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
  Plus,
  Trash2,
  FileSpreadsheet,
  Download,
  Upload,
  Settings2,
  CheckCircle2,
  Building2,
  Search,
  Loader2,
  DoorOpen,
  Edit2,
  ShieldAlert,
  ClipboardList,
  Wrench,
  Building,
  AlertTriangle,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

// Standart 16 Elektrik Pano & Mahal Türü
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
  'Jeneratör Odası',
  'Diğer'
];

export default function Fm200SettingsPage() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'floors' | 'rooms' | 'questions'>('floors');

  // ────────────────────────────────────────────────────────────────────────────
  // SEKME 1: BİNA, BLOK VE KAT KONUMLARI
  // ────────────────────────────────────────────────────────────────────────────
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [editingFloorItem, setEditingFloorItem] = useState<any | null>(null);

  // Manuel Ekleme / Düzenleme Formu (Bina, Blok, Kat)
  const [manualForm, setManualForm] = useState({
    facilityId: '',
    building: 'Ana Bina',
    block: '',
    floor: ''
  });

  // Excel Yükleme State
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelTargetFacility, setExcelTargetFacility] = useState('');
  const [isImporting, setIsImporting] = useState(false);

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  // İlk yüklemede varsayılan tesis ata
  React.useEffect(() => {
    if (!selectedFacilityId && facilities.length > 0) {
      setSelectedFacilityId(facilities[0].id);
    }
  }, [facilities, selectedFacilityId]);

  // Seçili Tesisin Bina, Blok ve Kat Konum Listesini Çek
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

  // Mevcut Tesisin Tekil Bina ve Blok Listesini Çıkar (Dropdown Önerileri İçin)
  const existingBuildings = useMemo(() => {
    const set = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.building && bf.building.trim()) set.add(bf.building.trim());
    });
    if (set.size === 0) set.add('Ana Bina');
    return Array.from(set);
  }, [buildingFloors]);

  const existingBlocks = useMemo(() => {
    const set = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.block && bf.block.trim()) set.add(bf.block.trim());
    });
    return Array.from(set);
  }, [buildingFloors]);

  // Manuel Konum Ekleme Mutasyonu
  const addBuildingFloorMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/building-floors', {
        ...manualForm,
        facilityId: selectedFacilityId
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Eklenemedi');
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

  // Kat Güncelleme (Edit) Mutasyonu
  const updateBuildingFloorMutation = useMutation({
    mutationFn: async (payload: { id: string; building: string; block: string; floor: string }) => {
      const res = await api.put(`/fm200/building-floors/${payload.id}`, {
        building: payload.building,
        block: payload.block,
        floor: payload.floor
      });
      if (!res.ok) {
        const err = await res.json();
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

  // Konum Silme Mutasyonu
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const res = await api.delete(`/fm200/building-floors/${id}`);
      if (!res.ok) throw new Error('Silinemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors', selectedFacilityId] });
      toast.success('Konum silindi');
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

    const targetFacId = excelTargetFacility || selectedFacilityId;
    if (!targetFacId) {
      toast.error('Lütfen aktarım yapılacak tesisi seçin');
      return;
    }

    setIsImporting(true);
    const formData = new FormData();
    formData.append('file', excelFile);
    formData.append('facilityId', targetFacId);

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

      toast.success(data.message || 'Konumlar aktarıldı');
      setIsExcelModalOpen(false);
      setExcelFile(null);
      queryClient.invalidateQueries({ queryKey: ['fm200BuildingFloors', targetFacId] });
    } catch (err: any) {
      toast.error(err.message || 'Hata oluştu');
    } finally {
      setIsImporting(false);
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // SEKME 2: ELEKTRİK PANO ODALARI & MAHAL TÜRLERİ
  // ────────────────────────────────────────────────────────────────────────────
  const [newRoomType, setNewRoomType] = useState('');
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

  const roomTypes: string[] = fm200Settings?.roomTypes || DEFAULT_ROOM_TYPES;

  // Ayarları Güncelle
  const updateSettingsMutation = useMutation({
    mutationFn: async (payload: { roomTypes?: string[]; checklistQuestions?: any[]; issueTemplates?: any }) => {
      const res = await api.put('/fm200/settings', payload);
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Kaydedilemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fm200Settings'] });
      toast.success('Ayarlar başarıyla güncellendi');
      setEditingRoomType(null);
      setEditingQuestionItem(null);
    },
    onError: (err: any) => toast.error(err.message)
  });

  const handleAddRoomType = () => {
    const trimmed = newRoomType.trim();
    if (!trimmed) {
      toast.error('Lütfen bir oda veya pano türü adı yazın');
      return;
    }
    if (roomTypes.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Bu tür listede zaten mevcut');
      return;
    }

    const withoutDiger = roomTypes.filter(r => r !== 'Diğer');
    const updated = [...withoutDiger, trimmed, 'Diğer'];
    updateSettingsMutation.mutate({ roomTypes: updated });
    setNewRoomType('');
  };

  const handleEditRoomTypeSave = () => {
    if (!editingRoomType) return;
    const { oldName, newName } = editingRoomType;
    const trimmed = newName.trim();
    if (!trimmed) {
      toast.error('İsim boş bırakılamaz');
      return;
    }
    if (oldName.toLowerCase() !== trimmed.toLowerCase() && roomTypes.some(r => r.toLowerCase() === trimmed.toLowerCase())) {
      toast.error('Bu isimde başka bir kayıt zaten var');
      return;
    }

    const updated = roomTypes.map(r => r === oldName ? trimmed : r);
    updateSettingsMutation.mutate({ roomTypes: updated });
  };

  const handleRemoveRoomType = (typeName: string) => {
    if (typeName === 'Diğer') {
      toast.error('"Diğer" seçeneği zorunludur ve silinemez.');
      return;
    }
    if (confirm(`"${typeName}" tipini listeden kaldırmak istediğinize emin misiniz?`)) {
      const updated = roomTypes.filter(r => r !== typeName);
      updateSettingsMutation.mutate({ roomTypes: updated });
    }
  };

  // ────────────────────────────────────────────────────────────────────────────
  // SEKME 3: 25 MADDELİK SIZDIRMAZLIK VE SİSTEM SORU BANKASI + KALIP CÜMLELER
  // ────────────────────────────────────────────────────────────────────────────
  const questions: any[] = fm200Settings?.checklistQuestions || [];
  const issueTemplates: Record<number, { teknik: string[]; firma: string[] }> = fm200Settings?.issueTemplates || {};

  const [questionCategoryFilter, setQuestionCategoryFilter] = useState('ALL');
  const [editingQuestionItem, setEditingQuestionItem] = useState<any | null>(null);

  // Kalıp Cümle Ekleme State
  const [selectedQuestionForTemplates, setSelectedQuestionForTemplates] = useState<any | null>(null);
  const [newTemplateText, setNewTemplateText] = useState('');
  const [newTemplateTarget, setNewTemplateTarget] = useState<'teknik' | 'firma'>('teknik');

  const handleSaveQuestionEdit = () => {
    if (!editingQuestionItem) return;
    const updatedQuestions = questions.map((q: any) =>
      q.id === editingQuestionItem.id ? editingQuestionItem : q
    );
    updateSettingsMutation.mutate({ checklistQuestions: updatedQuestions });
  };

  const handleAddTemplate = () => {
    if (!selectedQuestionForTemplates || !newTemplateText.trim()) {
      toast.error('Lütfen bir kalıp cümle yazın');
      return;
    }
    const qId = selectedQuestionForTemplates.id;
    const curTemplates = issueTemplates[qId] || { teknik: [], firma: [] };
    const targetList = [...(curTemplates[newTemplateTarget] || []), newTemplateText.trim()];

    const updatedAll = {
      ...issueTemplates,
      [qId]: {
        ...curTemplates,
        [newTemplateTarget]: targetList
      }
    };

    updateSettingsMutation.mutate({ issueTemplates: updatedAll });
    setNewTemplateText('');
  };

  const handleRemoveTemplate = (qId: number, target: 'teknik' | 'firma', index: number) => {
    const curTemplates = issueTemplates[qId];
    if (!curTemplates) return;
    const updatedTargetList = curTemplates[target].filter((_, i) => i !== index);

    const updatedAll = {
      ...issueTemplates,
      [qId]: {
        ...curTemplates,
        [target]: updatedTargetList
      }
    };
    updateSettingsMutation.mutate({ issueTemplates: updatedAll });
  };

  // Kat Filtreleme
  const filteredFloors = buildingFloors.filter(item => {
    const q = searchQuery.toLowerCase();
    const match =
      (item.building && item.building.toLowerCase().includes(q)) ||
      (item.block && item.block.toLowerCase().includes(q)) ||
      (item.floor && item.floor.toLowerCase().includes(q));
    return match;
  });

  const filteredQuestions = questions.filter((q: any) => {
    if (questionCategoryFilter !== 'ALL' && q.category !== questionCategoryFilter) return false;
    return true;
  });

  const currentFacility = facilities.find((f: any) => f.id === selectedFacilityId);

  // Toplam nominal ağırlık
  const totalNominalWeight = questions.reduce((sum: number, q: any) => sum + (q.weight || 0), 0);
  const sealingNominalWeight = questions.filter((q: any) => q.isSealing).reduce((sum: number, q: any) => sum + (q.weight || 0), 0);

  return (
    <div className="space-y-6">
      {/* Üst Başlık & Açıklama */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/50 text-[#0051d5] dark:text-[#b4c5ff]">
              <Settings2 className="w-5 h-5" />
            </span>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">
              FM-200 Sistem Ayarları (Yönetici Paneli)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Fiziksel katlar, elektrik pano odaları, 25 kriterlik sızdırmazlık soru seti ve akıllı müdahale kalıp cümlelerini yönetin.
          </p>
        </div>

        {/* 3 Sekmeli Buton Grubu */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl overflow-x-auto">
          <button
            type="button"
            onClick={() => setActiveTab('floors')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'floors'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Building2 className="w-4 h-4" />
            Bina, Blok ve Katlar
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'rooms'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <DoorOpen className="w-4 h-4" />
            Pano & Mahal Odaları ({roomTypes.length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('questions')}
            className={`flex items-center gap-2 px-3.5 py-2 text-xs font-semibold rounded-lg transition-all shrink-0 ${
              activeTab === 'questions'
                ? 'bg-white dark:bg-slate-900 text-primary shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <ClipboardList className="w-4 h-4" />
            Soru Bankası & Kalıplar (25)
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. SEKME: BİNA, BLOK VE KAT KONUM YÖNETİMİ                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'floors' && (
        <div className="space-y-6">
          {/* Tesis Seçici ve Üst Aksiyonlar */}
          <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="w-full md:w-96">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300 block mb-1">
                  İşlem Yapılacak Tesisi Seçin *
                </label>
                <select
                  value={selectedFacilityId}
                  onChange={(e) => {
                    setSelectedFacilityId(e.target.value);
                    setExcelTargetFacility(e.target.value);
                  }}
                  className="w-full h-11 px-3.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-bold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
                >
                  {facilities.map((f: any) => (
                    <option key={f.id} value={f.id}>
                      {f.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center flex-wrap gap-2.5">
                <Button
                  variant="outline"
                  onClick={handleDownloadTemplate}
                  className="flex items-center gap-2 text-xs h-10 rounded-xl border-slate-200 dark:border-slate-800"
                >
                  <Download className="w-4 h-4 text-emerald-600" />
                  Excel Şablonu İndir
                </Button>

                <Button
                  variant="outline"
                  onClick={() => {
                    setExcelTargetFacility(selectedFacilityId);
                    setIsExcelModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-xs h-10 rounded-xl border-slate-200 dark:border-slate-800"
                >
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  Excel'den Kat Listesi Yükle
                </Button>

                <Button
                  onClick={() => {
                    setManualForm({
                      facilityId: selectedFacilityId,
                      building: existingBuildings[0] || 'Ana Bina',
                      block: existingBlocks[0] || '',
                      floor: ''
                    });
                    setIsManualModalOpen(true);
                  }}
                  className="flex items-center gap-2 text-xs h-10 bg-[#0051d5] hover:bg-[#0042b0] text-white shadow-sm rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Manuel Kat Ekle
                </Button>
              </div>
            </div>

            {/* Arama Çubuğu */}
            <div className="relative w-full">
              <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
              <Input
                placeholder="Bu tesisteki bina, blok veya katları filtreleyin..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
              />
            </div>
          </div>

          {/* Konum Tablosu & Liste */}
          {isLoadingFloors ? (
            <div className="p-12 text-center text-xs text-slate-400">Konumlar yükleniyor...</div>
          ) : filteredFloors.length === 0 ? (
            <div className="bg-white dark:bg-slate-900 p-12 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center">
              <Building2 className="w-12 h-12 text-slate-300 dark:text-slate-700 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-800 dark:text-slate-200">
                {currentFacility ? `${currentFacility.name} için Kat Bulunamadı` : 'Tanımlı Kat Bulunamadı'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Bu tesis için henüz Blok ve Kat listesi yüklenmemiş. "Excel'den Kat Listesi Yükle" butonuyla hazır listenizi tek tıkla yükleyebilirsiniz.
              </p>
            </div>
          ) : (
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
              <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                    {currentFacility?.name} — Kat Listesi ({filteredFloors.length} Kayıt)
                  </span>
                  <span className="text-[11px] text-muted-foreground ml-2">
                    (Otomatik Sıralama: En Üst/Çatı Kattan En Alt Bodruma Doğru)
                  </span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                    <tr>
                      <th className="px-6 py-3">Sıra</th>
                      <th className="px-6 py-3">Bina Adı</th>
                      <th className="px-6 py-3">Blok</th>
                      <th className="px-6 py-3">Kat</th>
                      <th className="px-6 py-3 text-right">İşlemler</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {filteredFloors.map((item, idx) => (
                      <tr key={item.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-6 py-3 text-slate-400 font-mono text-[11px]">
                          #{idx + 1}
                        </td>
                        <td className="px-6 py-3 font-bold text-slate-800 dark:text-slate-200">
                          {item.building}
                        </td>
                        <td className="px-6 py-3 text-slate-600 dark:text-slate-400 font-medium">
                          {item.block || '—'}
                        </td>
                        <td className="px-6 py-3 font-semibold text-primary">
                          {item.floor}
                        </td>
                        <td className="px-6 py-3 text-right space-x-1">
                          <button
                            type="button"
                            onClick={() => setEditingFloorItem({ ...item })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/40 transition-colors rounded-lg"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              if (confirm(`${item.building} ${item.block ? `(${item.block})` : ''} - ${item.floor} katını silmek istediğinize emin misiniz?`)) {
                                deleteMutation.mutate(item.id);
                              }
                            }}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors rounded-lg"
                            title="Sil"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. SEKME: ELEKTRİK PANO ODALARI & MAHAL LİSTESİ                            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'rooms' && (
        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <DoorOpen className="w-5 h-5 text-primary" />
                Elektrik Pano Odaları ve Korunan Mahal Listesi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Kullanıcılar FM-200 konumlarını sisteme kaydederken korunan alanı aşağıdaki listeden seçecekler.
                Aynı katta aynı pano/oda seçildiğinde sistem otomatik olarak <b>1, 2, 3..</b> şeklinde numara verir.
                Yanlış yazılan pano veya oda adlarını yanındaki düzenle butonuna basarak düzeltebilirsiniz.
              </p>
            </div>

            {/* Yeni Mahal Tipi Ekleme Çubuğu */}
            <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
              <div className="relative flex-1 w-full">
                <Input
                  placeholder="Yeni bir Elektrik Pano Odası veya Mahal türü ekleyin (Örn: Kazan Dairesi Panosu)..."
                  value={newRoomType}
                  onChange={(e) => setNewRoomType(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddRoomType();
                    }
                  }}
                  className="h-11 rounded-xl bg-slate-50/50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-xs"
                />
              </div>
              <Button
                onClick={handleAddRoomType}
                disabled={!newRoomType.trim() || updateSettingsMutation.isPending}
                className="w-full sm:w-auto h-11 bg-[#0051d5] hover:bg-[#0042b0] text-white px-6 rounded-xl text-xs font-semibold shrink-0"
              >
                <Plus className="w-4 h-4 mr-1" />
                Listeye Ekle
              </Button>
            </div>
          </div>

          {/* Mevcut Liste Kartları */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                Tanımlı Pano ve Oda Türleri ({roomTypes.length})
              </span>
              <span className="text-[11px] text-muted-foreground">
                * "Diğer" seçildiğinde kullanıcının açıklama girmesi zorunludur.
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {roomTypes.map((type, idx) => {
                const isDiger = type === 'Diğer';
                return (
                  <div
                    key={type}
                    className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                      isDiger
                        ? 'bg-amber-50/60 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50 text-amber-900 dark:text-amber-300'
                        : 'bg-slate-50 dark:bg-slate-800/40 border-slate-200/80 dark:border-slate-800 text-slate-800 dark:text-slate-200 hover:border-primary/40'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="w-6 h-6 rounded-lg bg-white dark:bg-slate-900 border text-[11px] font-bold text-slate-500 flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-semibold truncate">{type}</span>
                    </div>

                    <div className="flex items-center gap-1 shrink-0 ml-2">
                      {!isDiger && (
                        <>
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
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors"
                            title="Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                      {isDiger && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-200">
                          Zorunlu
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. SEKME: 25 MADDELİK SIZDIRMAZLIK VE SİSTEM SORU BANKASI + KALIP CÜMLELER */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {activeTab === 'questions' && (
        <div className="space-y-6">
          {/* Bilgi ve Endeks Özeti Kartı */}
          <div className="bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-900 text-white p-6 rounded-2xl shadow-sm space-y-4">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-400" />
                  <h3 className="text-lg font-bold">FM-200 Denetim & Sızdırmazlık Motoru (25 Madde)</h3>
                </div>
                <p className="text-xs text-blue-200/80 mt-1 max-w-2xl">
                  Pozitif skorlama ile çalışır (Karşılıyor: 1.0, Kısmen: 0.5, Karşılamıyor: 0.0). Kısmen veya Karşılamıyor seçildiğinde akıllı dallanma ile <b>Teknik Hizmetler</b> veya <b>Firma</b> müdahalesi belirlenir ve fotoğraf yüklemesi istenir.
                </p>
              </div>

              {/* Endeks Rozetleri */}
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs text-center border border-white/10">
                  <span className="text-[10px] text-blue-200 block uppercase font-bold">Toplam Ağırlık</span>
                  <span className="text-base font-extrabold text-white">{totalNominalWeight} Puan</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs text-center border border-white/10">
                  <span className="text-[10px] text-amber-300 block uppercase font-bold">Sızdırmazlık Endeksi</span>
                  <span className="text-base font-extrabold text-amber-400">5 Madde ({sealingNominalWeight} Puan)</span>
                </div>
                <div className="p-3 bg-white/10 rounded-xl backdrop-blur-xs text-center border border-white/10">
                  <span className="text-[10px] text-red-300 block uppercase font-bold">Kritik Bariyerler</span>
                  <span className="text-base font-extrabold text-red-400">6 Madde (Gatekeeper)</span>
                </div>
              </div>
            </div>

            {/* Kategori Filtresi */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/10">
              {['ALL', 'Fiziksel Güvenlik ve Ortam', 'Etiketleme ve İşaretleme', 'Tesisat ve Donanım', 'Periyodik Kontrol & Bakım', 'Acil Durum Senaryoları'].map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setQuestionCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    questionCategoryFilter === cat
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {cat === 'ALL' ? `Tüm Sorular (${questions.length})` : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Soru Tablosu */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 font-semibold border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3 w-12">#</th>
                    <th className="px-5 py-3 w-48">Kategori</th>
                    <th className="px-5 py-3">Kriter / Denetim Sorusu</th>
                    <th className="px-4 py-3 text-center">Ağırlık</th>
                    <th className="px-4 py-3 text-center">Kritiklik</th>
                    <th className="px-4 py-3 text-center">Kalıp Cümleler</th>
                    <th className="px-5 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredQuestions.map((q: any) => {
                    const qTemplates = issueTemplates[q.id] || { teknik: [], firma: [] };
                    const templateCount = (qTemplates.teknik?.length || 0) + (qTemplates.firma?.length || 0);

                    return (
                      <tr key={q.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-400">
                          {q.id}
                        </td>
                        <td className="px-5 py-3.5 font-medium text-slate-600 dark:text-slate-400">
                          {q.category}
                        </td>
                        <td className="px-5 py-3.5 font-semibold text-slate-800 dark:text-slate-200">
                          <div className="flex items-center gap-2">
                            <span>{q.text}</span>
                            {q.isSealing && (
                              <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 text-[10px]">
                                Sızdırmazlık
                              </Badge>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3.5 text-center font-bold text-primary font-mono">
                          {q.weight} P
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          {q.criticality === 'KRİTİK' ? (
                            <Badge className="bg-red-600 text-white text-[10px] font-bold">
                              KRİTİK (Bariyer)
                            </Badge>
                          ) : q.criticality === 'Yüksek' ? (
                            <Badge className="bg-orange-500 text-white text-[10px]">
                              Yüksek
                            </Badge>
                          ) : q.criticality === 'Düşük' ? (
                            <Badge className="bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300 text-[10px]">
                              Düşük
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-[10px]">
                              Standart
                            </Badge>
                          )}
                        </td>
                        <td className="px-4 py-3.5 text-center">
                          <button
                            type="button"
                            onClick={() => setSelectedQuestionForTemplates(q)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-950/40 text-primary text-[11px] font-bold hover:bg-blue-100 transition-colors"
                          >
                            <Wrench className="w-3 h-3" />
                            {templateCount > 0 ? `${templateCount} Kalıp` : 'Kalıp Ekle'}
                          </button>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            type="button"
                            onClick={() => setEditingQuestionItem({ ...q })}
                            className="p-1.5 text-slate-400 hover:text-blue-600 rounded-lg transition-colors"
                            title="Düzenle"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 1: MANUEL KAT EKLEME (DROPDOWN + YENİ YAZMA DESTEĞİ)                  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Yeni Kat Konumu Ekle
            </DialogTitle>
            <DialogDescription className="text-xs">
              {currentFacility?.name || 'Seçili tesis'} için bina, blok ve kat bilgisini kaydedin.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-3.5 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tesis</label>
              <Input
                disabled
                value={currentFacility?.name || ''}
                className="h-9 mt-1 text-xs bg-slate-100 dark:bg-slate-800 font-semibold"
              />
            </div>

            {/* Bina Seçici Dropdown + Serbest Yazım (Datalist) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bina Adı *</label>
                {existingBuildings.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">Listeden seçin veya yeni yazın</span>
                )}
              </div>
              <input
                list="existing-buildings-list"
                value={manualForm.building}
                onChange={(e) => setManualForm({ ...manualForm, building: e.target.value })}
                placeholder="Örn: Ana Bina, Ek Bina"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="existing-buildings-list">
                {existingBuildings.map((b) => (
                  <option key={b} value={b} />
                ))}
              </datalist>
            </div>

            {/* Blok Seçici Dropdown + Serbest Yazım (Datalist) */}
            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blok (Opsiyonel)</label>
                {existingBlocks.length > 0 && (
                  <span className="text-[10px] text-muted-foreground">Mevcut bloklardan seçin</span>
                )}
              </div>
              <input
                list="existing-blocks-list"
                value={manualForm.block}
                onChange={(e) => setManualForm({ ...manualForm, block: e.target.value })}
                placeholder="Örn: A Blok, B Blok, C Blok"
                className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
              <datalist id="existing-blocks-list">
                {existingBlocks.map((blk) => (
                  <option key={blk} value={blk} />
                ))}
              </datalist>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kat *</label>
              <Input
                placeholder="Örn: 11.Kat, 10.Kat, 0. Kat, B1. Kat, Çatı Katı"
                value={manualForm.floor}
                onChange={(e) => setManualForm({ ...manualForm, floor: e.target.value })}
                className="h-9 mt-1 text-xs"
              />
              <span className="text-[10px] text-muted-foreground mt-0.5 block">
                Sistem katı otomatik olarak yüksekten düşüğe (Çatı Katı &gt; 11.Kat &gt; Zemin &gt; B1.Kat) sıralayacaktır.
              </span>
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
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white"
            >
              {addBuildingFloorMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 2: KAT DÜZENLEME (EDIT MODAL)                                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!editingFloorItem} onOpenChange={(open) => !open && setEditingFloorItem(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              Kat Konumunu Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Mevcut bina, blok veya kat adındaki hataları düzeltin.
            </DialogDescription>
          </DialogHeader>

          {editingFloorItem && (
            <div className="space-y-3.5 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bina Adı *</label>
                <input
                  list="edit-buildings-list"
                  value={editingFloorItem.building || ''}
                  onChange={(e) => setEditingFloorItem({ ...editingFloorItem, building: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <datalist id="edit-buildings-list">
                  {existingBuildings.map((b) => (
                    <option key={b} value={b} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blok</label>
                <input
                  list="edit-blocks-list"
                  value={editingFloorItem.block || ''}
                  onChange={(e) => setEditingFloorItem({ ...editingFloorItem, block: e.target.value })}
                  placeholder="A Blok, B Blok vb."
                  className="w-full h-9 px-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1 focus:outline-none focus:ring-2 focus:ring-primary/20"
                />
                <datalist id="edit-blocks-list">
                  {existingBlocks.map((blk) => (
                    <option key={blk} value={blk} />
                  ))}
                </datalist>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Kat *</label>
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
                if (!editingFloorItem?.floor?.trim()) {
                  toast.error('Kat adı boş bırakılamaz');
                  return;
                }
                updateBuildingFloorMutation.mutate({
                  id: editingFloorItem.id,
                  building: editingFloorItem.building,
                  block: editingFloorItem.block,
                  floor: editingFloorItem.floor
                });
              }}
              disabled={updateBuildingFloorMutation.isPending}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white"
            >
              {updateBuildingFloorMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 3: PANO / MAHAL ADI DÜZENLEME (EDIT MODAL)                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!editingRoomType} onOpenChange={(open) => !open && setEditingRoomType(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              Pano / Mahal Türünü Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs">
              Bu pano veya oda türünün adını güncelleyin.
            </DialogDescription>
          </DialogHeader>

          {editingRoomType && (
            <div className="space-y-3 py-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Pano / Mahal Adı *</label>
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
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white"
            >
              {updateSettingsMutation.isPending ? 'Kaydediliyor...' : 'Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 4: SORU DÜZENLEME MODALI                                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!editingQuestionItem} onOpenChange={(open) => !open && setEditingQuestionItem(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Edit2 className="w-4 h-4 text-primary" />
              Kriter / Denetim Sorusunu Düzenle (#{editingQuestionItem?.id})
            </DialogTitle>
            <DialogDescription className="text-xs">
              Sorunun metnini, nominal ağırlık puanını ve kritiklik derecesini düzenleyin.
            </DialogDescription>
          </DialogHeader>

          {editingQuestionItem && (
            <div className="space-y-3.5 py-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Kategori</label>
                <select
                  value={editingQuestionItem.category}
                  onChange={(e) => setEditingQuestionItem({ ...editingQuestionItem, category: e.target.value })}
                  className="w-full h-9 px-3 rounded-lg border text-xs bg-background"
                >
                  <option value="Fiziksel Güvenlik ve Ortam">Fiziksel Güvenlik ve Ortam</option>
                  <option value="Etiketleme ve İşaretleme">Etiketleme ve İşaretleme</option>
                  <option value="Tesisat ve Donanım">Tesisat ve Donanım</option>
                  <option value="Periyodik Kontrol & Bakım">Periyodik Kontrol & Bakım</option>
                  <option value="Acil Durum Senaryoları">Acil Durum Senaryoları</option>
                </select>
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Soru Metni *</label>
                <Textarea
                  rows={2}
                  value={editingQuestionItem.text}
                  onChange={(e) => setEditingQuestionItem({ ...editingQuestionItem, text: e.target.value })}
                  className="text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Ağırlık Puanı (TW)</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={editingQuestionItem.weight}
                    onChange={(e) => setEditingQuestionItem({ ...editingQuestionItem, weight: parseInt(e.target.value) || 1 })}
                    className="h-9 text-xs"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300 block mb-1">Kritiklik Derecesi</label>
                  <select
                    value={editingQuestionItem.criticality}
                    onChange={(e) => setEditingQuestionItem({ ...editingQuestionItem, criticality: e.target.value })}
                    className="w-full h-9 px-3 rounded-lg border text-xs bg-background"
                  >
                    <option value="KRİTİK">KRİTİK (Gatekeeper Bariyeri)</option>
                    <option value="Yüksek">Yüksek</option>
                    <option value="Standart">Standart</option>
                    <option value="Düşük">Düşük</option>
                  </select>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border flex items-center justify-between">
                <div>
                  <span className="font-bold block text-slate-800 dark:text-slate-200">Sızdırmazlık Endeksine Dahil mi?</span>
                  <span className="text-[11px] text-muted-foreground">Odanın gaz tutma kapasitesini ölçen 5 kriterden biri</span>
                </div>
                <input
                  type="checkbox"
                  checked={!!editingQuestionItem.isSealing}
                  onChange={(e) => setEditingQuestionItem({ ...editingQuestionItem, isSealing: e.target.checked })}
                  className="w-4 h-4 rounded text-primary focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setEditingQuestionItem(null)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleSaveQuestionEdit}
              disabled={updateSettingsMutation.isPending}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white"
            >
              {updateSettingsMutation.isPending ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 5: AKILLI DALLANMA & HAZIR KALIP CÜMLE YÖNETİMİ                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!selectedQuestionForTemplates} onOpenChange={(open) => !open && setSelectedQuestionForTemplates(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wrench className="w-5 h-5 text-primary" />
              Akıllı Kalıp Cümleleri: Soru #{selectedQuestionForTemplates?.id}
            </DialogTitle>
            <DialogDescription className="text-xs">
              "{selectedQuestionForTemplates?.text}" sorusunda kullanıcı <b>Kısmen</b> veya <b>Karşılamıyor</b> dediğinde çıkacak hazır kalıp cümleler.
            </DialogDescription>
          </DialogHeader>

          {selectedQuestionForTemplates && (() => {
            const qId = selectedQuestionForTemplates.id;
            const qTemplates = issueTemplates[qId] || { teknik: [], firma: [] };

            return (
              <div className="space-y-4 py-2 text-xs">
                {/* Yeni Kalıp Ekleme Alanı */}
                <div className="p-3.5 bg-slate-50 dark:bg-slate-800/60 rounded-xl border space-y-3">
                  <span className="font-bold text-slate-800 dark:text-slate-200 block">
                    Yeni Kalıp Cümle Ekle
                  </span>

                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-muted-foreground font-semibold">Hedef Sorumlu:</span>
                    <button
                      type="button"
                      onClick={() => setNewTemplateTarget('teknik')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        newTemplateTarget === 'teknik'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border text-slate-600'
                      }`}
                    >
                      🛠️ Teknik Hizmetler (Tesis İçi / Küçük)
                    </button>
                    <button
                      type="button"
                      onClick={() => setNewTemplateTarget('firma')}
                      className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                        newTemplateTarget === 'firma'
                          ? 'bg-amber-600 text-white shadow-xs'
                          : 'bg-white dark:bg-slate-900 border text-slate-600'
                      }`}
                    >
                      🏢 Firma / Dış Servis (Büyük İş)
                    </button>
                  </div>

                  <Textarea
                    rows={2}
                    value={newTemplateText}
                    onChange={(e) => setNewTemplateText(e.target.value)}
                    placeholder={
                      newTemplateTarget === 'teknik'
                        ? 'Örn: 1-5 cm arası kablo geçiş boşluğu mevcut; yangın durdurucu mastik ile Teknik Hizmetler kapatacak.'
                        : 'Örn: Açıklık 10 cm üzerinde; alçıpan ve yangın yalıtım bariyeri ile yetkili firma tarafından kapatılmalı.'
                    }
                    className="text-xs bg-white dark:bg-slate-900"
                  />

                  <div className="flex justify-end">
                    <Button
                      size="sm"
                      onClick={handleAddTemplate}
                      disabled={!newTemplateText.trim() || updateSettingsMutation.isPending}
                      className="bg-[#0051d5] hover:bg-[#0042b0] text-white text-xs h-8 px-4"
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Kalıbı Kaydet
                    </Button>
                  </div>
                </div>

                {/* Mevcut Kalıplar: Teknik Hizmetler */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-1.5">
                      🛠️ Teknik Hizmetler Kalıp Cümleleri ({qTemplates.teknik?.length || 0})
                    </span>
                    <span className="text-[10px] text-muted-foreground">Kablo geçişi, &le;10 cm açıklıklar vb.</span>
                  </div>

                  {qTemplates.teknik?.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed">
                      Bu soru için henüz Teknik Hizmetler kalıbı eklenmemiş.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {qTemplates.teknik.map((t: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between p-2.5 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 text-blue-950 dark:text-blue-200 text-xs"
                        >
                          <span className="flex-1 pr-2 leading-relaxed">• {t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTemplate(qId, 'teknik', idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors shrink-0"
                            title="Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Mevcut Kalıplar: Firma */}
                <div className="space-y-2 pt-2 border-t">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-amber-700 dark:text-amber-300 flex items-center gap-1.5">
                      🏢 Firma / Dış Servis Kalıp Cümleleri ({qTemplates.firma?.length || 0})
                    </span>
                    <span className="text-[10px] text-muted-foreground">&gt;10 cm açıklık, alçıpan, damper vb.</span>
                  </div>

                  {qTemplates.firma?.length === 0 ? (
                    <p className="text-[11px] text-slate-400 italic p-3 bg-slate-50 dark:bg-slate-900/40 rounded-xl border border-dashed">
                      Bu soru için henüz Firma kalıbı eklenmemiş.
                    </p>
                  ) : (
                    <div className="space-y-1.5">
                      {qTemplates.firma.map((t: string, idx: number) => (
                        <div
                          key={idx}
                          className="flex items-start justify-between p-2.5 rounded-xl bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-amber-950 dark:text-amber-200 text-xs"
                        >
                          <span className="flex-1 pr-2 leading-relaxed">• {t}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveTemplate(qId, 'firma', idx)}
                            className="p-1 text-slate-400 hover:text-red-600 rounded transition-colors shrink-0"
                            title="Kaldır"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })()}

          <DialogFooter>
            <Button size="sm" onClick={() => setSelectedQuestionForTemplates(null)}>
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MODAL 6: EXCEL İLE TOPLU YÜKLEME                                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isExcelModalOpen} onOpenChange={setIsExcelModalOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Excel ile Blok ve Kat Listesi Yükleme
            </DialogTitle>
            <DialogDescription className="text-xs">
              Excel tablonuzdaki <b>Bina</b>, <b>Blok</b> ve <b>Kat</b> bilgilerini toplu olarak sisteme aktarır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Aktarılacak Hedef Tesis *</label>
              <select
                value={excelTargetFacility}
                onChange={(e) => setExcelTargetFacility(e.target.value)}
                className="w-full h-10 px-3 rounded-lg border text-xs bg-background mt-1 font-semibold"
              >
                {facilities.map((f: any) => (
                  <option key={f.id} value={f.id}>{f.name}</option>
                ))}
              </select>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border text-[11px] space-y-1 text-slate-600 dark:text-slate-300">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Excel Sütunları ve Sıralama Kuralı:
              </div>
              <ul className="list-disc list-inside space-y-0.5 pl-1 text-[11px]">
                <li>A sütunu (Tesis Adı) opsiyoneldir; yukarıda seçtiğiniz tesise aktarılır.</li>
                <li><b>Bina:</b> Ana Bina, Ek Bina vb.</li>
                <li><b>Blok:</b> A Blok, B Blok, C Blok vb.</li>
                <li><b>Kat:</b> 11.Kat, 10.Kat, 0. Kat, Ara Kat, B1. Kat, B5. Kat vb.</li>
                <li>İster en üst kattan en alta, ister alttan üste yazın; sistem otomatik olarak daima <b>en üst/çatı kattan en alt bodruma doğru</b> sıralayacaktır.</li>
              </ul>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Excel Dosyası (.xlsx) *</label>
              <div className="mt-1 flex items-center justify-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-6 text-center hover:border-primary/80 transition-colors">
                <input
                  type="file"
                  accept=".xlsx, .xls"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setExcelFile(e.target.files[0]);
                    }
                  }}
                  className="hidden"
                  id="fm200-excel-file-input"
                />
                <label htmlFor="fm200-excel-file-input" className="cursor-pointer">
                  <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                  <span className="text-xs font-semibold text-primary">
                    {excelFile ? excelFile.name : 'Dosya Seç veya Sürükle'}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-1">Sadece .xlsx dosyaları kabul edilir</p>
                </label>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400">Şablon dosyanız yok mu?</span>
              <button
                type="button"
                onClick={handleDownloadTemplate}
                className="text-primary font-semibold hover:underline flex items-center gap-1"
              >
                <Download className="w-3.5 h-3.5" /> Şablonu İndir
              </button>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" size="sm" onClick={() => setIsExcelModalOpen(false)}>
              İptal
            </Button>
            <Button
              size="sm"
              onClick={handleExcelImport}
              disabled={isImporting || !excelFile}
              className="bg-emerald-600 hover:bg-emerald-700 text-white"
            >
              {isImporting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Yükle ve Aktar'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
