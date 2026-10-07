import React, { useMemo, useState } from 'react';
import type { ThermalInspectionItem, ThermalInspectionSession } from '@/services/thermal-inspection.service';
import { 
  Thermometer, 
  Search, 
  Download, 
  Layers, 
  ArrowUpDown,
  Building2,
  Camera,
  Edit2,
  Trash2,
  ChevronRight,
  Eye,
  Clock,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  ChevronLeft,
  Calendar,
  Flame,
  Plus,
  FileSpreadsheet,
  FileText,
  Check,
  FolderOpen
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

interface Props {
  items: ThermalInspectionItem[];
  sessions: ThermalInspectionSession[];
  facilityName: string;
  pageSize?: number;
  onOpenPanelDetail?: (panelName: string) => void;
  onEditItem?: (item: ThermalInspectionItem) => void;
  onDeleteItem?: (itemId: string) => void;
  onViewItem?: (item: ThermalInspectionItem) => void;
  onOpenNewReportModal: () => void;
  onOpenImportModal: (sessionId?: string) => void;
  onOpenQuickEntryModal: (sessionId?: string) => void;
  onDeleteSession?: (sessionId: string) => void;
}

export const ThermalPaginatedTable: React.FC<Props> = ({
  items,
  sessions,
  facilityName,
  pageSize = 50,
  onOpenPanelDetail,
  onEditItem,
  onDeleteItem,
  onViewItem,
  onOpenNewReportModal,
  onOpenImportModal,
  onOpenQuickEntryModal,
  onDeleteSession
}) => {
  // Session Selection: 'ALL' or specific sessionId
  const [selectedSessionId, setSelectedSessionId] = useState<string>('ALL');

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACIL' | 'UYGUNSUZ' | 'TAKIP' | 'NORMAL' | 'DOGRULAMA'>('ALL');
  const [sortField, setSortField] = useState<'SEVERITY' | 'TEMP_DESC' | 'PANEL' | 'ORDER'>('SEVERITY');
  const [currentPage, setCurrentPage] = useState(1);

  // Group items by session / date stats
  const sessionList = useMemo(() => {
    return sessions.map(sess => {
      const sessItems = items.filter(it => it.sessionId === sess.id);
      const criticalCount = sessItems.filter(it => (it.measuredTemp ?? 0) >= 40 || (it.deltaTemp ?? 0) >= 15).length;
      const d = sess.reportDate ? new Date(sess.reportDate) : new Date(sess.createdAt);
      const dateFormatted = d.toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
      return {
        ...sess,
        itemCount: sessItems.length,
        criticalCount,
        dateFormatted
      };
    });
  }, [sessions, items]);

  // Selected session object (if not ALL)
  const activeSessionObj = useMemo(() => {
    if (selectedSessionId === 'ALL') return null;
    return sessionList.find(s => s.id === selectedSessionId) || null;
  }, [selectedSessionId, sessionList]);

  // Filtered Items (by selectedSessionId, searchTerm, statusFilter)
  const processedItems = useMemo(() => {
    let list = [...items];

    // Session filter
    if (selectedSessionId !== 'ALL') {
      list = list.filter(item => item.sessionId === selectedSessionId);
    }

    // Search query
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      list = list.filter(item => 
        (item.panelName && item.panelName.toLowerCase().includes(q)) ||
        (item.floorSection && item.floorSection.toLowerCase().includes(q)) ||
        (item.buildingLocation && item.buildingLocation.toLowerCase().includes(q)) ||
        (item.equipmentConnection && item.equipmentConnection.toLowerCase().includes(q)) ||
        (item.detectedRisk && item.detectedRisk.toLowerCase().includes(q))
      );
    }

    // Status filter
    if (statusFilter !== 'ALL') {
      list = list.filter(item => {
        const m = item.measuredTemp ?? 0;
        const dT = item.deltaTemp ?? 0;
        const st = (item.status || '').toLowerCase();

        if (statusFilter === 'ACIL') {
          return m >= 60 || dT >= 30 || st === 'acil' || (item.priority || '').toLowerCase() === 'acil';
        }
        if (statusFilter === 'UYGUNSUZ') {
          return (m >= 40 || dT >= 15 || st.includes('uygunsuz') || st.includes('kritik')) && !(m >= 60 || dT >= 30);
        }
        if (statusFilter === 'TAKIP') {
          return (m >= 35 && m < 40) || st.includes('takip');
        }
        if (statusFilter === 'DOGRULAMA') {
          return dT < 0 || (item.ambientTemp !== null && m < (item.ambientTemp || 0));
        }
        if (statusFilter === 'NORMAL') {
          return m < 35 && dT >= 0 && (st.includes('normal') || !st || st === 'uygun');
        }
        return true;
      });
    }

    // Sort
    list.sort((a, b) => {
      if (sortField === 'TEMP_DESC') {
        return (b.measuredTemp ?? -999) - (a.measuredTemp ?? -999);
      }
      if (sortField === 'PANEL') {
        return (a.panelName || '').localeCompare(b.panelName || '');
      }
      if (sortField === 'ORDER') {
        return (a.orderIndex ?? 0) - (b.orderIndex ?? 0);
      }
      // SEVERITY (Default)
      const getScore = (item: ThermalInspectionItem) => {
        const m = item.measuredTemp ?? 0;
        const dT = item.deltaTemp ?? 0;
        if (m >= 60 || dT >= 30) return 4;
        if (m >= 40 || dT >= 15) return 3;
        if (m >= 35) return 2;
        if (dT < 0) return 1.5;
        return 1;
      };
      return getScore(b) - getScore(a);
    });

    return list;
  }, [items, selectedSessionId, searchTerm, statusFilter, sortField]);

  // Pagination calculation
  const totalItems = processedItems.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const validCurrentPage = Math.min(currentPage, totalPages);
  const startIndex = (validCurrentPage - 1) * pageSize;
  const paginatedItems = processedItems.slice(startIndex, startIndex + pageSize);

  // Status Badge Helper
  const renderStatusBadge = (item: ThermalInspectionItem) => {
    const m = item.measuredTemp;
    const dT = item.deltaTemp;
    const st = (item.status || '').toLowerCase();

    if (m !== null && m !== undefined && (m >= 60 || (dT !== null && dT >= 30))) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-800 animate-pulse">
          <Flame className="w-3 h-3 text-rose-600" />
          Acil (&gt;60°C)
        </span>
      );
    }
    if (m !== null && m !== undefined && (m >= 40 || (dT !== null && dT >= 15))) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300 border border-orange-200 dark:border-orange-800">
          <AlertTriangle className="w-3 h-3 text-orange-600" />
          Pik Yük Takip (&gt;40°C)
        </span>
      );
    }
    if (m !== null && m !== undefined && m >= 35) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
          <Clock className="w-3 h-3 text-amber-600" />
          İzleme (35–40°C)
        </span>
      );
    }
    if (dT !== null && dT < 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-950/60 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800" title="Ortamdan soğuk ölçüm, yansıma veya emissivity kontrol edilmeli">
          <ShieldAlert className="w-3 h-3 text-indigo-600" />
          Doğrulanacak (ΔT&lt;0)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
        <CheckCircle2 className="w-3 h-3 text-emerald-600" />
        Normal (&lt;35°C)
      </span>
    );
  };

  return (
    <div className="space-y-4">
      {/* ─────────────────────────────────────────────────────────── */}
      {/* 1. TEKİL & NET RAPOR KONTROL PANELİ (DROPDOWN + 3 BUTON)     */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-4 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          
          {/* Sol: Rapor / Ölçüm Tarihi Seçici (Sonsuz uzayan butonlar yerine temiz Dropdown) */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/40 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                  Ölçüm Raporu / Dönem:
                </span>
                <select
                  value={selectedSessionId}
                  onChange={(e) => {
                    setSelectedSessionId(e.target.value);
                    setCurrentPage(1);
                  }}
                  className="text-xs font-semibold h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500/20"
                >
                  <option value="ALL">Tüm Raporlar ({items.length} Kayıt)</option>
                  {sessionList.map((s) => (
                    <option key={s.id} value={s.id}>
                      Rapor Tarihi: {s.dateFormatted} — {s.itemCount} Pano ({s.criticalCount} Uygunsuz)
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {selectedSessionId === 'ALL'
                  ? `${facilityName} tesisine ait tüm tarihlerin kayıtları gösteriliyor.`
                  : `${activeSessionObj?.dateFormatted} raporu seçili (${activeSessionObj?.itemCount} pano).`}
              </p>
            </div>
          </div>

          {/* Sağ: 3 Net Aksiyon Butonu + Rapor Sil */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Raporu Sil (Seçili Rapor Varsa) */}
            {selectedSessionId !== 'ALL' && onDeleteSession && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => {
                  const targetSession = sessionList.find(s => s.id === selectedSessionId);
                  const sessName = targetSession ? targetSession.dateFormatted : 'bu';
                  if (window.confirm(`"${sessName}" tarihli raporu ve bağlı tüm ölçüm kayıtlarını TAMAMEN silmek istediğinize emin misiniz? Bu işlem geri alınamaz!`)) {
                    onDeleteSession(selectedSessionId);
                    setSelectedSessionId('ALL');
                  }
                }}
                className="text-xs gap-1.5 font-medium border-rose-200 dark:border-rose-900/50 bg-rose-50/50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100 hover:text-rose-800 shadow-xs"
                title="Seçili raporu ve içindeki tüm verileri tamamen siler"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                Raporu Sil
              </Button>
            )}

            {/* 1. Yeni Rapor Aç */}
            <Button
              size="sm"
              variant="outline"
              onClick={onOpenNewReportModal}
              className="text-xs gap-1.5 font-medium border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 shadow-xs"
              title="Yeni bir tarihli ölçüm raporu oluşturur"
            >
              <FileText className="w-3.5 h-3.5 text-blue-600" />
              Yeni Rapor Aç
            </Button>

            {/* 2. Excel'den Aktar */}
            <Button
              size="sm"
              variant="outline"
              onClick={() => onOpenImportModal(selectedSessionId !== 'ALL' ? selectedSessionId : undefined)}
              className="text-xs gap-1.5 font-medium border-orange-200 dark:border-orange-900/50 bg-white dark:bg-slate-800 text-orange-700 dark:text-orange-400 hover:bg-orange-50 shadow-xs"
              title="Excel dosyasındaki panoları seçili veya yeni tarihe toplu yükler"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-orange-600" />
              Excel'den Aktar
            </Button>

            {/* 3. Tek Tek Pano Ekle */}
            <Button
              size="sm"
              onClick={() => onOpenQuickEntryModal(selectedSessionId !== 'ALL' ? selectedSessionId : undefined)}
              className="text-xs gap-1.5 font-medium bg-orange-600 hover:bg-orange-700 text-white shadow-xs"
              title="Seçilen raporun içine pano isimlerini arayarak tek tek ölçüm kaydı ekler"
            >
              <Plus className="w-3.5 h-3.5" />
              Tek Tek Pano Ekle
            </Button>
          </div>

        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 2. FİLTRELEME & ARAMA TOOLBAR                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 px-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 shadow-xs">
        {/* Durum Filtreleri */}
        <div className="flex flex-wrap items-center gap-1.5">
          <button
            type="button"
            onClick={() => { setStatusFilter('ALL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'ALL'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs font-semibold'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
            }`}
          >
            Tümü ({processedItems.length})
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('ACIL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'ACIL'
                ? 'bg-rose-700 text-white shadow-xs font-semibold'
                : 'bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400 hover:bg-rose-100'
            }`}
          >
            Acil (&gt;60°C)
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('UYGUNSUZ'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'UYGUNSUZ'
                ? 'bg-orange-600 text-white shadow-xs font-semibold'
                : 'bg-orange-50 dark:bg-orange-950/30 text-orange-700 dark:text-orange-400 hover:bg-orange-100'
            }`}
          >
            Pik Yük Takip (&gt;40°C)
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('TAKIP'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'TAKIP'
                ? 'bg-amber-500 text-white shadow-xs font-semibold'
                : 'bg-amber-50 dark:bg-amber-950/30 text-amber-700 dark:text-amber-400 hover:bg-amber-100'
            }`}
          >
            İzleme (35–40°C)
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('DOGRULAMA'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'DOGRULAMA'
                ? 'bg-indigo-600 text-white shadow-xs font-semibold'
                : 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100'
            }`}
          >
            Doğrulanacak (ΔT&lt;0)
          </button>
          <button
            type="button"
            onClick={() => { setStatusFilter('NORMAL'); setCurrentPage(1); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              statusFilter === 'NORMAL'
                ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100'
            }`}
          >
            Normal
          </button>
        </div>

        {/* Sıralama & Arama */}
        <div className="flex items-center gap-2">
          <select
            value={sortField}
            onChange={(e) => setSortField(e.target.value as any)}
            className="h-9 text-xs px-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="SEVERITY">Sıralama: Önem Derecesi</option>
            <option value="TEMP_DESC">Sıralama: En Yüksek Sıcaklık</option>
            <option value="PANEL">Sıralama: Pano Adı (A-Z)</option>
            <option value="ORDER">Sıralama: Sıra No</option>
          </select>

          <div className="relative w-48 sm:w-60">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-3 text-slate-400" />
            <Input
              placeholder="Pano adı, kat veya risk ara..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-8 text-xs h-9 bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
            />
          </div>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────── */}
      {/* 3. ANA TABLO                                                */}
      {/* ─────────────────────────────────────────────────────────── */}
      <Card className="border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50 dark:bg-slate-800/60 border-b border-slate-200 dark:border-slate-800 text-slate-500 uppercase font-semibold text-[11px]">
              <tr>
                <th className="py-3 px-3 w-12 text-center">#</th>
                <th className="py-3 px-4">Pano No / Adı</th>
                <th className="py-3 px-3">Kat / Bölüm</th>
                <th className="py-3 px-3">Ekipman</th>
                <th className="py-3 px-3 text-center">Ölçülen (°C)</th>
                <th className="py-3 px-3 text-center">Ortam (°C)</th>
                <th className="py-3 px-3 text-center">ΔT (°C)</th>
                <th className="py-3 px-3">Değerlendirme</th>
                <th className="py-3 px-4">Tespit / Açıklama</th>
                <th className="py-3 px-3 text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {paginatedItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <FolderOpen className="w-8 h-8 text-slate-300" />
                      <p className="font-medium text-slate-600 dark:text-slate-400">
                        Bu raporda veya filtrede pano kaydı bulunamadı.
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => onOpenImportModal(selectedSessionId !== 'ALL' ? selectedSessionId : undefined)}
                          className="text-xs text-orange-600 border-orange-200"
                        >
                          <FileSpreadsheet className="w-3.5 h-3.5 mr-1" />
                          Excel'den Yükle
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => onOpenQuickEntryModal(selectedSessionId !== 'ALL' ? selectedSessionId : undefined)}
                          className="text-xs bg-orange-600 text-white"
                        >
                          <Plus className="w-3.5 h-3.5 mr-1" />
                          Pano Ölçümü Ekle
                        </Button>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                paginatedItems.map((item, index) => {
                  const mTemp = item.measuredTemp;
                  const dTemp = item.deltaTemp;
                  const isUrgent = mTemp !== null && mTemp >= 60;
                  const isPeak = mTemp !== null && mTemp >= 40 && !isUrgent;

                  return (
                    <tr 
                      key={item.id} 
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors"
                    >
                      <td className="py-3 px-3 text-center text-slate-400 font-mono">
                        {startIndex + index + 1}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          onClick={() => onOpenPanelDetail && onOpenPanelDetail(item.panelName)}
                          className="font-bold text-slate-900 dark:text-white hover:text-orange-600 dark:hover:text-orange-400 transition-colors text-left flex items-center gap-1 group"
                        >
                          <span className="truncate max-w-[200px]">{item.panelName}</span>
                          <ChevronRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-orange-500 shrink-0" />
                        </button>
                        {item.measurementDate && (
                          <span className="text-[10px] text-slate-400 block">
                            {new Date(item.measurementDate).toLocaleDateString('tr-TR')} {item.controlTime || ''}
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                        {item.floorSection || item.buildingLocation || '—'}
                      </td>
                      <td className="py-3 px-3 text-slate-600 dark:text-slate-300 truncate max-w-[150px]">
                        {item.equipmentConnection || '—'}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className={`font-bold font-mono px-2 py-0.5 rounded text-xs ${
                          isUrgent 
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300' 
                            : isPeak
                            ? 'bg-orange-100 text-orange-800 dark:bg-orange-950/60 dark:text-orange-300'
                            : (mTemp !== null && mTemp >= 35)
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                            : 'text-slate-800 dark:text-slate-200'
                        }`}>
                          {mTemp !== null ? `${mTemp} °C` : '—'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-slate-500 font-mono">
                        {item.ambientTemp !== null ? `${item.ambientTemp} °C` : '—'}
                      </td>
                      <td className="py-3 px-3 text-center font-mono font-semibold">
                        {dTemp !== null ? (
                          <span className={`${
                            dTemp >= 30 ? 'text-rose-600 dark:text-rose-400 font-bold' :
                            dTemp >= 15 ? 'text-orange-600 dark:text-orange-400 font-bold' :
                            dTemp < 0 ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-600 dark:text-slate-400'
                          }`}>
                            {dTemp > 0 ? `+${dTemp}` : dTemp} °C
                          </span>
                        ) : '—'}
                      </td>
                      <td className="py-3 px-3 whitespace-nowrap">
                        {renderStatusBadge(item)}
                      </td>
                      <td className="py-3 px-4 text-slate-500 max-w-[240px] truncate" title={item.detectedRisk || ''}>
                        {item.detectedRisk || (isUrgent ? 'Acil kontrol gerektirir' : isPeak ? 'Pik yükte ısınma riski' : 'Normal')}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => onOpenPanelDetail && onOpenPanelDetail(item.panelName)}
                            className="p-1.5 text-slate-500 hover:text-orange-600 hover:bg-orange-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                            title="Pano Geçmişi & Sıcaklık Grafiği"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {onEditItem && (
                            <button
                              type="button"
                              onClick={() => onEditItem(item)}
                              className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Düzenle"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {onDeleteItem && (
                            <button
                              type="button"
                              onClick={() => onDeleteItem(item.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-slate-800 rounded-lg transition-colors"
                              title="Sil"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="p-3.5 px-4 border-t border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/50 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div>
            Toplam <strong>{totalItems}</strong> kayıttan <strong>{startIndex + 1}</strong> - <strong>{Math.min(startIndex + pageSize, totalItems)}</strong> arası gösteriliyor (Sayfa başına {pageSize})
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={validCurrentPage <= 1}
              className="h-8 px-2.5 text-xs gap-1"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              Önceki
            </Button>

            <span className="px-3 py-1 rounded bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 font-semibold text-slate-800 dark:text-slate-200">
              {validCurrentPage} / {totalPages}
            </span>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={validCurrentPage >= totalPages}
              className="h-8 px-2.5 text-xs gap-1"
            >
              Sonraki
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
