import React, { useMemo, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { thermalInspectionService, type ThermalInspectionItem, type ThermalPanel } from '@/services/thermal-inspection.service';
import { 
  Building2, Layers, Search, ChevronRight, 
  Calendar, Thermometer, TrendingUp, AlertTriangle, 
  CheckCircle2, Flame, Eye, ArrowUpDown, Filter, GitMerge,
  Plus, Edit2, Trash2, MapPin, Zap, Hash, Sparkles, FileText,
  Download, FileSpreadsheet, Building, Loader2
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { ThermalCreatePanelModal } from './ThermalCreatePanelModal';
import { toast } from 'sonner';

interface Props {
  items: ThermalInspectionItem[];
  onOpenPanelDetail: (panelName: string) => void;
  onOpenMergeModal?: () => void;
  activeFacilityId?: string;
  facilities?: Array<{ id: string; name: string; shortName?: string | null }>;
  isAdminOrMgmt?: boolean;
}

export const ThermalPanelsInventoryView: React.FC<Props> = ({
  items,
  onOpenPanelDetail,
  onOpenMergeModal,
  activeFacilityId,
  facilities = [],
  isAdminOrMgmt = false
}) => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'ALL' | 'INVENTORY' | 'MULTI_MEASURE' | 'CRITICAL'>('ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>('ALL');

  // Modal State'leri
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPanel, setEditingPanel] = useState<ThermalPanel | null>(null);
  const [panelToDelete, setPanelToDelete] = useState<ThermalPanel | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Excel / Dışa Aktarma State'leri
  const [isExporting, setIsExporting] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);

  const effectiveFacilityId = useMemo(() => {
    if (activeFacilityId && activeFacilityId !== 'all') return activeFacilityId;
    return facilities[0]?.id || '';
  }, [activeFacilityId, facilities]);

  const currentFacilityName = useMemo(() => {
    return facilities.find(f => f.id === effectiveFacilityId)?.name || 'Seçili Tesis';
  }, [facilities, effectiveFacilityId]);

  // Kayıtlı Pano Envanterini Çek
  const { data: registeredPanels = [], refetch: refetchPanels, isLoading: isLoadingPanels } = useQuery<ThermalPanel[]>({
    queryKey: ['thermalPanels', effectiveFacilityId],
    queryFn: async () => {
      if (!effectiveFacilityId) return [];
      return await thermalInspectionService.getPanels({ facilityId: effectiveFacilityId });
    },
    enabled: !!effectiveFacilityId
  });

  // Silme Mutasyonu
  const handleDeletePanel = async () => {
    if (!panelToDelete) return;
    setIsDeleting(true);
    try {
      await thermalInspectionService.deletePanel(panelToDelete.id);
      toast.success(`'${panelToDelete.panelCode}' panosu envanterden silindi.`);
      setPanelToDelete(null);
      refetchPanels();
      queryClient.invalidateQueries({ queryKey: ['thermalPanels'] });
    } catch (err: any) {
      toast.error(err.message || 'Pano silinemedi.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Excel Olarak İndir (Yönetici: Tüm Tesisler veya Seçili Tesis; Kullanıcı: Kendi Tesisi)
  const handleExportExcel = async (exportAll: boolean = false) => {
    setIsExporting(true);
    try {
      const targetId = exportAll ? 'all' : effectiveFacilityId;
      toast.info('Pano envanteri Excel dosyası hazırlanıyor...');
      const { blob, filename } = await thermalInspectionService.exportPanelsExcel(targetId);

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`${filename} başarıyla indirildi.`);
      setShowExportModal(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Excel dosyası indirilemedi.');
    } finally {
      setIsExporting(false);
    }
  };

  // CSV Olarak İndir (Mevcut Filtrelenmiş Liste)
  const handleExportCSV = () => {
    try {
      if (filteredPanels.length === 0) {
        toast.error('İndirilecek pano kaydı bulunamadı.');
        return;
      }
      const headers = [
        'Sıra No',
        'Tesis / Hastane',
        'Pano Kodu',
        'Pano Adı',
        'Bina',
        'Blok',
        'Kat',
        'Pano Tipi',
        'Açıklama',
        'Ekipman / Bağlantı',
        'Ölçüm Noktası',
        'Ölçüm Sayısı',
        'Son Sıcaklık (°C)',
        'Maksimum Sıcaklık (°C)',
        'Son Durum'
      ];
      const rows = filteredPanels.map((p, idx) => [
        idx + 1,
        `"${p.registeredPanel?.facility?.name || currentFacilityName}"`,
        `"${p.panelCode}"`,
        `"${p.panelName || ''}"`,
        `"${p.buildingLocation || 'Ana Bina'}"`,
        `"${p.registeredPanel?.block || '-'}"`,
        `"${p.floorSection || ''}"`,
        `"${p.panelType || ''}"`,
        `"${(p.description || '-').replace(/"/g, '""')}"`,
        `"${(p.equipmentConnection || '-').replace(/"/g, '""')}"`,
        `"${(p.measurementPoint || '-').replace(/"/g, '""')}"`,
        p.measurementCount,
        p.latestTemp !== null ? p.latestTemp : '-',
        p.maxTemp !== null ? p.maxTemp : '-',
        `"${p.isCritical ? 'Kritik' : 'Normal'}"`
      ]);

      const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `Pano_Envanteri_${new Date().toISOString().split('T')[0].replace(/-/g, '')}.csv`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success('CSV dosyası başarıyla indirildi.');
      setShowExportModal(false);
    } catch (err: any) {
      toast.error('CSV dosyası oluşturulamadı.');
    }
  };

  // Ölçüm Geçmişini Grupla
  const measurementsByPanel = useMemo(() => {
    const map = new Map<string, ThermalInspectionItem[]>();
    items.forEach(item => {
      const name = item.panelName ? item.panelName.trim().toUpperCase() : '';
      if (!name) return;
      if (!map.has(name)) map.set(name, []);
      map.get(name)!.push(item);
    });
    return map;
  }, [items]);

  // Envanterdeki Panolar ile Ölçümlerdeki Panoları Birleştir
  const unifiedPanels = useMemo(() => {
    const seenKeys = new Set<string>();
    const list: Array<{
      key: string;
      id?: string;
      panelCode: string;
      panelName: string;
      buildingLocation?: string;
      floorSection?: string;
      equipmentConnection?: string;
      measurementPoint?: string;
      panelType?: string;
      description?: string;
      locationCode?: string;
      floorCode?: string;
      typeCode?: string;
      sequenceNumber?: number;
      isRegistered: boolean;
      registeredPanel?: ThermalPanel;
      measurements: ThermalInspectionItem[];
      latestTemp: number | null;
      maxTemp: number | null;
      latestDelta: number | null;
      isCritical: boolean;
      measurementCount: number;
    }> = [];

    // 1. Önce Envanterdeki Kayıtlı Panoları Ekle
    registeredPanels.forEach(p => {
      const codeKey = p.panelCode.trim().toUpperCase();
      const nameKey = p.panelName ? p.panelName.trim().toUpperCase() : codeKey;
      seenKeys.add(codeKey);
      seenKeys.add(nameKey);

      // İlgili ölçümleri bul (kod veya isim eşleşmesi)
      const directMeasures = measurementsByPanel.get(codeKey) || [];
      const nameMeasures = (nameKey !== codeKey && measurementsByPanel.get(nameKey)) || [];
      const allMeasures = [...directMeasures, ...nameMeasures];

      allMeasures.sort((a, b) => {
        const da = a.measurementDate ? new Date(a.measurementDate).getTime() : 0;
        const db = b.measurementDate ? new Date(b.measurementDate).getTime() : 0;
        return da - db;
      });

      const count = allMeasures.length || (p.measurementCount ?? 0);
      const latest = allMeasures[allMeasures.length - 1];
      const maxT = allMeasures.length > 0 
        ? Math.max(...allMeasures.map(m => m.measuredTemp ?? -999)) 
        : (p.maxTemp ?? null);

      const isCrit = p.isCritical || allMeasures.some(m => (m.measuredTemp ?? 0) >= 40 || (m.deltaTemp ?? 0) >= 15);

      list.push({
        key: p.id,
        id: p.id,
        panelCode: p.panelCode,
        panelName: p.panelName || p.panelCode,
        buildingLocation: p.block ? `${p.building || 'Ana Bina'} - ${p.block}` : (p.building || 'Ana Bina'),
        floorSection: p.floor,
        equipmentConnection: p.equipmentConnection || latest?.equipmentConnection || undefined,
        measurementPoint: p.measurementPoint || latest?.measurementPoint || undefined,
        panelType: p.panelType,
        description: p.description || undefined,
        locationCode: p.locationCode || undefined,
        floorCode: p.floorCode || undefined,
        typeCode: p.typeCode || undefined,
        sequenceNumber: p.sequenceNumber || undefined,
        isRegistered: true,
        registeredPanel: p,
        measurements: allMeasures,
        measurementCount: count,
        latestTemp: latest?.measuredTemp ?? p.latestTemp ?? null,
        latestDelta: latest?.deltaTemp ?? p.latestDelta ?? null,
        maxTemp: maxT !== -999 ? maxT : null,
        isCritical: Boolean(isCrit)
      });
    });

    // 2. Geçmiş Ölçümlerde Olup Henüz Envantere Kaydedilmemiş Panoları Ekle
    measurementsByPanel.forEach((measures, rawKey) => {
      if (seenKeys.has(rawKey)) return;
      seenKeys.add(rawKey);

      measures.sort((a, b) => {
        const da = a.measurementDate ? new Date(a.measurementDate).getTime() : 0;
        const db = b.measurementDate ? new Date(b.measurementDate).getTime() : 0;
        return da - db;
      });

      const count = measures.length;
      const latest = measures[count - 1];
      const maxT = Math.max(...measures.map(m => m.measuredTemp ?? -999));
      const isCrit = measures.some(m => (m.measuredTemp ?? 0) >= 40 || (m.deltaTemp ?? 0) >= 15);

      list.push({
        key: rawKey,
        panelCode: latest?.panelName || rawKey,
        panelName: latest?.panelName || rawKey,
        buildingLocation: latest?.buildingLocation || undefined,
        floorSection: latest?.floorSection || undefined,
        equipmentConnection: latest?.equipmentConnection || undefined,
        measurementPoint: latest?.measurementPoint || undefined,
        isRegistered: false,
        measurements: measures,
        measurementCount: count,
        latestTemp: latest?.measuredTemp ?? null,
        latestDelta: latest?.deltaTemp ?? null,
        maxTemp: maxT !== -999 ? maxT : null,
        isCritical: isCrit
      });
    });

    return list;
  }, [registeredPanels, measurementsByPanel]);

  // Kat Seçenekleri
  const uniqueFloors = useMemo(() => {
    const set = new Set<string>();
    unifiedPanels.forEach(p => {
      if (p.floorSection && p.floorSection.trim()) set.add(p.floorSection.trim());
    });
    return Array.from(set).sort();
  }, [unifiedPanels]);

  // Arama & Filtreleme
  const filteredPanels = useMemo(() => {
    let list = [...unifiedPanels];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(p => 
        p.panelCode.toLowerCase().includes(q) ||
        p.panelName.toLowerCase().includes(q) ||
        (p.floorSection && p.floorSection.toLowerCase().includes(q)) ||
        (p.panelType && p.panelType.toLowerCase().includes(q)) ||
        (p.description && p.description.toLowerCase().includes(q)) ||
        (p.equipmentConnection && p.equipmentConnection.toLowerCase().includes(q))
      );
    }

    if (selectedFloor !== 'ALL') {
      list = list.filter(p => p.floorSection === selectedFloor);
    }

    if (filterType === 'INVENTORY') {
      list = list.filter(p => p.isRegistered);
    } else if (filterType === 'MULTI_MEASURE') {
      list = list.filter(p => p.measurementCount > 1);
    } else if (filterType === 'CRITICAL') {
      list = list.filter(p => p.isCritical);
    }

    // Sıralama: Envanter kayıtlıları ve kritik olanlar öne
    list.sort((a, b) => {
      if (a.isCritical && !b.isCritical) return -1;
      if (!a.isCritical && b.isCritical) return 1;
      if (a.isRegistered && !b.isRegistered) return -1;
      if (!a.isRegistered && b.isRegistered) return 1;
      return b.measurementCount - a.measurementCount;
    });

    return list;
  }, [unifiedPanels, searchTerm, filterType, selectedFloor]);

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* HEADER & HIZLI AKSİYONLAR                                   */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-600 dark:text-orange-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-bold text-sm text-slate-900 dark:text-white">
                Pano Envanteri & Ölçüm Döngüleri
              </h3>
              <Badge variant="outline" className="text-[10px] bg-slate-50 dark:bg-slate-800">
                {registeredPanels.length} Envanter Kayıtlı
              </Badge>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Toplam {unifiedPanels.length} pano | {unifiedPanels.filter(p => p.measurementCount > 1).length} panoda çoklu ölçüm döngüsü
            </p>
          </div>
        </div>

        {/* Aksiyon Butonları */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Excel / CSV İndir Butonu */}
          {isAdminOrMgmt ? (
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowExportModal(true)}
              disabled={isExporting}
              className="text-xs h-9 gap-1.5 font-semibold border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              title="Pano envanterini Excel veya CSV olarak indirin (Yönetici / Tesis bazlı)"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {isExporting ? 'İndiriliyor...' : 'Excel / CSV İndir'}
            </Button>
          ) : (
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleExportExcel(false)}
              disabled={isExporting}
              className="text-xs h-9 gap-1.5 font-semibold border-emerald-300 dark:border-emerald-800 bg-emerald-50/60 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100"
              title="Tesisinizin pano envanterini Excel tablosu olarak indirin"
            >
              {isExporting ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
              ) : (
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              )}
              {isExporting ? 'İndiriliyor...' : 'Excel İndir'}
            </Button>
          )}

          {/* Yeni Pano Ekle Butonu */}
          <Button
            size="sm"
            onClick={() => {
              setEditingPanel(null);
              setIsCreateModalOpen(true);
            }}
            className="text-xs h-9 gap-1.5 font-bold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Yeni Pano Ekle
          </Button>

          {onOpenMergeModal && (
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenMergeModal}
              className="text-xs h-9 gap-1.5 font-semibold border-orange-300 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-300 hover:bg-orange-100"
              title="Aynı panonun farklı yazılmış isimlerini tek bir standart isim altında birleştirir"
            >
              <GitMerge className="w-3.5 h-3.5 text-orange-600" />
              Panoları Birleştir
            </Button>
          )}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* FİLTRE VE ARAMA ÇUBUĞU                                      */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          {/* Sekme Filtreleri */}
          <div className="inline-flex rounded-lg bg-slate-100 dark:bg-slate-800 p-0.5 text-xs">
            <button
              onClick={() => setFilterType('ALL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'ALL' ? 'bg-white dark:bg-slate-700 shadow-sm font-semibold text-slate-900 dark:text-white' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Tümü ({unifiedPanels.length})
            </button>
            <button
              onClick={() => setFilterType('INVENTORY')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'INVENTORY' ? 'bg-indigo-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Envanter ({registeredPanels.length})
            </button>
            <button
              onClick={() => setFilterType('MULTI_MEASURE')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'MULTI_MEASURE' ? 'bg-orange-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Döngülü ({unifiedPanels.filter(p => p.measurementCount > 1).length})
            </button>
            <button
              onClick={() => setFilterType('CRITICAL')}
              className={`px-2.5 py-1 rounded-md transition-colors ${filterType === 'CRITICAL' ? 'bg-rose-600 text-white shadow-sm font-semibold' : 'text-slate-600 dark:text-slate-400'}`}
            >
              Kritik ({unifiedPanels.filter(p => p.isCritical).length})
            </button>
          </div>

          {/* Kat Seçici */}
          {uniqueFloors.length > 0 && (
            <select
              value={selectedFloor}
              onChange={(e) => setSelectedFloor(e.target.value)}
              className="h-8 rounded-md border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 px-2.5 text-xs text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-1 focus:ring-orange-500"
            >
              <option value="ALL">Tüm Katlar</option>
              {uniqueFloors.map(flr => (
                <option key={flr} value={flr}>{flr}</option>
              ))}
            </select>
          )}
        </div>

        {/* Arama Input */}
        <div className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-slate-400" />
          <Input
            placeholder="Pano kodu, kat veya açıklama ara..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-8 text-xs h-8"
          />
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* PANO LİSTESİ KARTLARI                                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      {filteredPanels.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 space-y-3">
          <div className="w-12 h-12 mx-auto rounded-full bg-orange-50 dark:bg-orange-950/40 text-orange-500 flex items-center justify-center">
            <Layers className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-bold text-sm text-slate-900 dark:text-white">
              Pano Bulunamadı
            </h4>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              {searchTerm ? 'Arama kriterlerinize uygun pano bulunamadı.' : 'Henüz kayıtlı bir pano envanteri bulunmuyor. Yeni bir pano ekleyerek başlayabilirsiniz.'}
            </p>
          </div>
          <Button
            size="sm"
            onClick={() => {
              setEditingPanel(null);
              setIsCreateModalOpen(true);
            }}
            className="text-xs h-8 font-semibold bg-orange-600 hover:bg-orange-700 text-white gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            İlk Panoyu Ekle
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredPanels.map((panel) => {
            // Kod parçalarını ayrıştır (örn: BAH-B1K-ADP-001)
            const parts = panel.panelCode.split('-');
            const locPart = panel.locationCode || (parts.length >= 4 ? parts[0] : null);
            const flrPart = panel.floorCode || (parts.length >= 4 ? parts[1] : null);
            const typPart = panel.typeCode || (parts.length >= 4 ? parts[2] : null);
            const seqPart = panel.sequenceNumber 
              ? String(panel.sequenceNumber).padStart(3, '0') 
              : (parts.length >= 4 ? parts[3] : null);

            return (
              <Card 
                key={panel.key}
                className={`border transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 relative group ${
                  panel.isCritical 
                    ? 'border-orange-300 dark:border-orange-900/60 bg-orange-50/20 dark:bg-orange-950/10' 
                    : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900'
                }`}
              >
                <CardContent className="p-4 space-y-3">
                  {/* Üst Bar: Pano Kodu & 4 Segment Etiketleri */}
                  <div className="space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 
                            onClick={() => onOpenPanelDetail(panel.panelCode)}
                            className="font-mono font-black text-sm text-slate-900 dark:text-white truncate cursor-pointer hover:text-orange-600 tracking-wide"
                            title={panel.panelCode}
                          >
                            {panel.panelCode}
                          </h4>
                          {panel.isRegistered && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-300 border-indigo-200">
                              Envanter
                            </Badge>
                          )}
                        </div>

                        {panel.panelName && panel.panelName !== panel.panelCode && (
                          <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 font-medium">
                            {panel.panelName}
                          </p>
                        )}
                      </div>

                      {/* Ölçüm Sayısı Rozeti */}
                      <Badge 
                        variant={panel.isCritical ? 'destructive' : 'outline'}
                        className="text-[10px] px-2 py-0.5 shrink-0"
                      >
                        {panel.measurementCount} Ölçüm
                      </Badge>
                    </div>

                    {/* 4 Renkli Segment Rozetleri (Kullanıcının yüklediği görseldeki şema) */}
                    {locPart && flrPart && typPart && seqPart && (
                      <div className="flex items-center gap-1 text-[9px] font-mono font-bold pt-0.5">
                        <span className="px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800" title="Lokasyon Kodu">
                          {locPart}
                        </span>
                        <span className="text-slate-400 font-normal">-</span>
                        <span className="px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800" title="Kat Kodu">
                          {flrPart}
                        </span>
                        <span className="text-slate-400 font-normal">-</span>
                        <span className="px-1.5 py-0.5 rounded bg-cyan-100 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border border-cyan-200 dark:border-cyan-800" title="Pano Türü">
                          {typPart}
                        </span>
                        <span className="text-slate-400 font-normal">-</span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-100 dark:bg-purple-950/60 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800" title="Sıra Numarası">
                          {seqPart}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Konum ve Pano Türü Detayı */}
                  <div className="text-[11px] text-slate-500 space-y-1">
                    <div className="flex items-center gap-1.5 truncate">
                      <Layers className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span className="truncate">
                        <strong className="text-slate-700 dark:text-slate-300">{panel.floorSection || 'Kat Belirtilmemiş'}</strong>
                        {panel.buildingLocation && ` • ${panel.buildingLocation}`}
                      </span>
                    </div>

                    {panel.panelType && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Zap className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                        <span className="truncate">{panel.panelType}</span>
                      </div>
                    )}
                  </div>

                  {/* Açıklama (Opsiyonel - Varsa Göster) */}
                  {panel.description && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg line-clamp-2">
                      <span className="text-slate-400 font-medium">Açıklama:</span> {panel.description}
                    </div>
                  )}

                  {/* Ekipman Detayı */}
                  {panel.equipmentConnection && (
                    <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-800/60 p-2 rounded-lg truncate">
                      <span className="text-slate-400 font-medium">Ekipman:</span> {panel.equipmentConnection}
                    </div>
                  )}

                  {/* Sıcaklık & Delta T Göstergeleri */}
                  <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100 dark:border-slate-800 text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Son Ölçülen:</span>
                      <span className={`font-bold font-mono text-sm ${
                        panel.latestTemp && panel.latestTemp >= 40 ? 'text-rose-600' :
                        panel.latestTemp && panel.latestTemp >= 35 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        {panel.latestTemp !== null ? `${panel.latestTemp} °C` : '—'}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Maksimum Sıcaklık:</span>
                      <span className="font-bold font-mono text-sm text-slate-800 dark:text-slate-200">
                        {panel.maxTemp !== null ? `${panel.maxTemp} °C` : '—'}
                      </span>
                    </div>
                  </div>

                  {/* Alt Aksiyon Çubuğu */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2">
                    <button
                      onClick={() => onOpenPanelDetail(panel.panelCode)}
                      className="text-[11px] text-orange-600 hover:text-orange-700 font-medium flex items-center gap-1 transition-colors"
                    >
                      <span>Ölçüm geçmişi</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>

                    <div className="flex items-center gap-1">
                      {panel.isRegistered && panel.registeredPanel ? (
                        <>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setEditingPanel(panel.registeredPanel!);
                              setIsCreateModalOpen(true);
                            }}
                            className="h-7 w-7 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/40"
                            title="Panoyu Düzenle"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            size="icon"
                            variant="ghost"
                            onClick={() => setPanelToDelete(panel.registeredPanel!)}
                            className="h-7 w-7 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40"
                            title="Panoyu Envanterden Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      ) : (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingPanel({
                              id: '',
                              facilityId: effectiveFacilityId,
                              panelCode: panel.panelCode,
                              panelName: panel.panelName,
                              floor: panel.floorSection || '',
                              panelType: 'ADP Pano Odası',
                              building: panel.buildingLocation || 'Ana Bina',
                              equipmentConnection: panel.equipmentConnection || null,
                              measurementPoint: panel.measurementPoint || null,
                              isActive: true,
                              createdAt: '',
                              updatedAt: ''
                            });
                            setIsCreateModalOpen(true);
                          }}
                          className="h-7 px-2 text-[10px] font-semibold text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                          title="Bu panoyu resmi envantere kaydet"
                        >
                          <Sparkles className="w-3 h-3 mr-1" />
                          Envantere Kaydet
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* MODALLER                                                    */}
      {/* ─────────────────────────────────────────────────────────── */}
      {isCreateModalOpen && (
        <ThermalCreatePanelModal
          isOpen={isCreateModalOpen}
          onClose={() => {
            setIsCreateModalOpen(false);
            setEditingPanel(null);
          }}
          facilities={facilities}
          activeFacilityId={effectiveFacilityId}
          panelToEdit={editingPanel}
          onSaved={() => {
            refetchPanels();
            queryClient.invalidateQueries({ queryKey: ['thermalPanels'] });
          }}
        />
      )}

      {/* Silme Onay Dialog */}
      {panelToDelete && (
        <Dialog open={!!panelToDelete} onOpenChange={(open) => !open && setPanelToDelete(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-base text-rose-600 flex items-center gap-2">
                <Trash2 className="w-4 h-4" />
                Pano Envanter Kaydını Sil
              </DialogTitle>
              <DialogDescription className="text-xs text-slate-500 mt-2">
                <strong className="font-mono text-slate-800 dark:text-slate-200">{panelToDelete.panelCode}</strong> kodlu panoyu envanterden silmek istediğinize emin misiniz?
                <br /><br />
                <span className="text-slate-400">Not: Geçmiş termal ölçüm kayıtları silinmez, yalnızca pano envanter listesinden çıkarılır.</span>
              </DialogDescription>
            </DialogHeader>
            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPanelToDelete(null)}
                disabled={isDeleting}
                className="text-xs h-8"
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDeletePanel}
                disabled={isDeleting}
                className="text-xs h-8"
              >
                {isDeleting ? 'Siliniyor...' : 'Evet, Envanterden Sil'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* ─────────────────────────────────────────────────────────── */}
      {/* YÖNETİCİ DIŞA AKTARMA SEÇİM DİYALOĞU                       */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Dialog open={showExportModal} onOpenChange={setShowExportModal}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Pano Envanteri İndir (Excel / CSV)
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 mt-1">
              Yönetici yetkinizle istediğiniz kapsamda pano envanterini Bina, Blok, Kat ve Açıklamaları ile birlikte indirebilirsiniz.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-2">
            {/* Seçenek 1: Seçili Tesis */}
            <div 
              onClick={() => !isExporting && handleExportExcel(false)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-emerald-500 dark:hover:border-emerald-500/70 bg-white dark:bg-slate-900/60 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 cursor-pointer transition-all flex items-start gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Building className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-400">
                    Seçili Tesisin Envanteri (Excel)
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-emerald-700 border-emerald-300">
                    Önerilen
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-600 dark:text-slate-300 font-medium mt-0.5 truncate">
                  {currentFacilityName}
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Yalnızca seçili tesise ait pano kayıtlarını ve ölçüm istatistiklerini Excel tablosu olarak indirir.
                </span>
              </div>
            </div>

            {/* Seçenek 2: Tüm Tesisler (Yönetici) */}
            <div 
              onClick={() => !isExporting && handleExportExcel(true)}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-indigo-500 dark:hover:border-indigo-500/70 bg-white dark:bg-slate-900/60 hover:bg-indigo-50/30 dark:hover:bg-indigo-950/20 cursor-pointer transition-all flex items-start gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-indigo-100 dark:bg-indigo-950/60 text-indigo-700 dark:text-indigo-400 flex items-center justify-center shrink-0 mt-0.5 group-hover:scale-105 transition-transform">
                <Download className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-indigo-700 dark:group-hover:text-indigo-400">
                    Tüm Tesislerin Envanteri (Yönetici)
                  </h4>
                  <Badge variant="outline" className="text-[10px] text-indigo-700 border-indigo-300">
                    Tüm Hastaneler
                  </Badge>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Sistemdeki tüm hastane ve tesislerin pano envanteri
                </p>
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Tüm hastanelerdeki panoları Bina, Blok, Kat ve Açıklamaları ile konsolide tek Excel olarak indirir.
                </span>
              </div>
            </div>

            {/* Seçenek 3: CSV İndir */}
            <div 
              onClick={handleExportCSV}
              className="p-3.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-900/60 hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-all flex items-start gap-3 group"
            >
              <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 flex items-center justify-center shrink-0 mt-0.5">
                <FileText className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                  CSV Tablosu Olarak İndir
                </h4>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Ekranda listelenen filtrelenmiş panoları noktalı virgüllü CSV formatında indirir.
                </span>
              </div>
            </div>
          </div>

          <DialogFooter className="pt-2 border-t border-slate-100 dark:border-slate-800">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExportModal(false)}
              disabled={isExporting}
              className="text-xs h-8"
            >
              Kapat
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
