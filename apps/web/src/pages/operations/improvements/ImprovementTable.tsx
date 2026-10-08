import React, { useState, useMemo, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, Download, RefreshCw, X, Calendar, 
  Tag, Shield, AlertTriangle, CheckCircle2, Building2, Filter, Plus, Check, Trash2, ListOrdered 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type ImprovementRecord, type FacilityOption } from './types';
import { 
  InspectRecordDialog, EditRecordDialog, ActionNoteDialog, CreateRecordDialog 
} from './ImprovementRecordDialogs';

const API = import.meta.env.VITE_API_URL || '';

interface Props {
  records: ImprovementRecord[];
  loading: boolean;
  sheetTitle: string;
  sheetType: string;
  onRefresh: () => void;
  facilityName?: string;
  facilities?: FacilityOption[];
  selectedFacilityId?: string;
}

type ColumnFilterState = {
  textSearch: string;
  selectedValues: Set<string>;
};

export const ImprovementTable: React.FC<Props> = ({
  records,
  loading,
  sheetTitle,
  sheetType,
  onRefresh,
  facilityName,
  facilities = [],
  selectedFacilityId,
}) => {
  // Modal states
  const [inspectRecord, setInspectRecord] = useState<ImprovementRecord | null>(null);
  const [editRecord, setEditRecord] = useState<ImprovementRecord | null>(null);
  const [actionRecord, setActionRecord] = useState<ImprovementRecord | null>(null);
  const [deleteConfirmRecord, setDeleteConfirmRecord] = useState<ImprovementRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);
  const [isRenumbering, setIsRenumbering] = useState<boolean>(false);
  const [showCreateModal, setShowCreateModal] = useState<boolean>(false);

  // Kayıt Silme
  const handleDeleteRecord = async (recordToDelete: ImprovementRecord) => {
    try {
      setIsDeleting(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/records/${recordToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': token ? `Bearer ${token}` : ''
        }
      });
      const data = await res.json();
      if (data.success) {
        toast.success('Kayıt silindi ve numaralar otomatik güncellendi.');
        setDeleteConfirmRecord(null);
        if (editRecord?.id === recordToDelete.id) {
          setEditRecord(null);
        }
        onRefresh();
      } else {
        toast.error(data.message || 'Kayıt silinirken bir hata oluştu.');
      }
    } catch (err: any) {
      console.error('Silme hatası:', err);
      toast.error('Bağlantı hatası: Kayıt silinemedi.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Sıra Numaralarını Otomatik Yeniden Diz (1, 2, 3...)
  const handleRenumber = async () => {
    try {
      setIsRenumbering(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/renumber`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({
          facilityId: selectedFacilityId,
          sheetType: sheetType === 'KRITIK' ? undefined : sheetType,
        })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(data.message || 'Sıra numaraları yeniden düzenlendi.');
        onRefresh();
      } else {
        toast.error(data.message || 'Numaralar güncellenemedi.');
      }
    } catch (err) {
      console.error('Renumber hatası:', err);
      toast.error('Bağlantı hatası.');
    } finally {
      setIsRenumbering(false);
    }
  };

  // Genel Arama
  const [searchTerm, setSearchTerm] = useState('');

  // Sıralama
  const [sortField, setSortField] = useState<string>('rowNo');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

  // Excel Tarzı Sütun Filtreleri
  const [columnFilters, setColumnFilters] = useState<Record<string, ColumnFilterState>>({});
  const [activeFilterCol, setActiveFilterCol] = useState<string | null>(null);

  // Filtre Popover State
  const [popoverSearch, setPopoverSearch] = useState('');
  const [popoverTextFilter, setPopoverTextFilter] = useState('');
  const [popoverSelectedValues, setPopoverSelectedValues] = useState<Set<string>>(new Set());
  const [filterPos, setFilterPos] = useState<{ top: number; left: number } | null>(null);

  const filterPopoverRef = useRef<HTMLDivElement>(null);

  // Dışarı tıklandığında popover kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (filterPopoverRef.current && !filterPopoverRef.current.contains(e.target as Node)) {
        setActiveFilterCol(null);
      }
    };
    if (activeFilterCol) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [activeFilterCol]);

  // Sekme İsmi Çevirici (Kritik Listesi ve Kaynak Gösterimi için)
  const getSheetLabel = (sType?: string): string => {
    switch (sType) {
      case 'DENETIMLER': return 'Denetimler';
      case 'ELEKTRIK_PK': return 'Elektrik PK';
      case 'TOPRAKLAMA_PK': return 'Topraklama PK';
      case 'PARATONER_PK': return 'Paratoner PK';
      case 'JENERATOR_PK': return 'Jeneratör PK';
      case 'ELEKTRIK_PANO_KONTROLLERI': return 'Elektrik Pano Kontrolleri';
      case 'TRAFO': return 'Trafo';
      case 'UPS': return 'UPS';
      default: return sType || '-';
    }
  };

  // Sütun Değerini Getir
  const getColValue = (r: ImprovementRecord, colKey: string): string => {
    switch (colKey) {
      case 'rowNo':
        return String(r.rowNo || '');
      case 'facility':
        return r.facility?.shortName || r.facility?.name || '';
      case 'sheetType':
        return getSheetLabel(r.sheetType);
      case 'auditName':
        return r.auditName || '';
      case 'recordDate':
        if (!r.recordDate) return '';
        try {
          return new Date(r.recordDate).toLocaleDateString('tr-TR');
        } catch {
          return '';
        }
      case 'dueDate':
        if (!r.dueDate) return '';
        try {
          return new Date(r.dueDate).toLocaleDateString('tr-TR');
        } catch {
          return '';
        }
      case 'location':
        return r.location || '';
      case 'equipment':
        return r.equipment || '';
      case 'applicationType':
        return r.applicationType || '';
      case 'finding':
        return r.finding || '';
      case 'category':
        return r.category || 'Belirtilmemiş';
      case 'riskScore':
        return r.riskScore || 'Belirtilmedi';
      case 'assignedTo':
        return r.assignedTo || '';
      case 'status':
        return r.status || '';
      default:
        return String((r as any)[colKey] || '');
    }
  };

  // Dinamik Tarih Başlığı
  const getDateColumnHeader = () => {
    if (sheetType === 'DENETIMLER') return 'Tespit Tarihi';
    if (sheetType === 'ELEKTRIK_PANO_KONTROLLERI') return 'Rapor Tarihi';
    if (sheetType === 'TRAFO' || sheetType === 'UPS') return 'Tarih';
    return 'PK / Tespit Tarihi';
  };

  const getColHeaderName = (colKey: string): string => {
    switch (colKey) {
      case 'rowNo': return '#';
      case 'facility': return 'Hastane Adı';
      case 'sheetType': return 'Nereden Geliyor';
      case 'auditName': return 'Denetim Adı';
      case 'recordDate': return getDateColumnHeader();
      case 'dueDate': return 'Termin Tarihi';
      case 'location': return 'Mahal';
      case 'equipment': return 'Ekipman';
      case 'applicationType': return 'Uygulama';
      case 'finding': return 'Tespitler';
      case 'category': return 'Kategori';
      case 'riskScore': return 'Risk Skoru';
      case 'assignedTo': return 'Sorumlusu';
      case 'status': return 'Durum';
      default: return colKey;
    }
  };

  // Sütundaki Benzersiz Değerleri Topla
  const getUniqueColumnValues = (colKey: string): string[] => {
    const set = new Set<string>();
    records.forEach(r => {
      const val = getColValue(r, colKey);
      if (val !== undefined && val !== null && val.trim() !== '') {
        set.add(val.trim());
      }
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  };

  // Filtre Popover Aç
  const handleOpenFilter = (colKey: string, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (activeFilterCol === colKey) {
      setActiveFilterCol(null);
      setFilterPos(null);
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const popoverWidth = 320; // w-80 (20rem = 320px)
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }
    const top = rect.bottom + 6;

    setFilterPos({ top, left });

    const currentFilter = columnFilters[colKey];
    const uniqueVals = getUniqueColumnValues(colKey);

    setActiveFilterCol(colKey);
    setPopoverSearch('');
    setPopoverTextFilter(currentFilter?.textSearch || '');
    setPopoverSelectedValues(
      currentFilter?.selectedValues 
        ? new Set(currentFilter.selectedValues) 
        : new Set(uniqueVals)
    );
  };

  // Filtre Uygula
  const handleApplyFilter = () => {
    if (!activeFilterCol) return;

    const uniqueVals = getUniqueColumnValues(activeFilterCol);
    const isAllSelected = uniqueVals.length === popoverSelectedValues.size && !popoverTextFilter.trim();

    if (isAllSelected && !popoverTextFilter.trim()) {
      // Filtre yok veya hepsi seçili, temizle
      const next = { ...columnFilters };
      delete next[activeFilterCol];
      setColumnFilters(next);
    } else {
      setColumnFilters(prev => ({
        ...prev,
        [activeFilterCol]: {
          textSearch: popoverTextFilter.trim(),
          selectedValues: new Set(popoverSelectedValues),
        }
      }));
    }
    setActiveFilterCol(null);
  };

  // Sütun Filtresini Temizle
  const handleClearColumnFilter = (colKey: string) => {
    const next = { ...columnFilters };
    delete next[colKey];
    setColumnFilters(next);
    if (activeFilterCol === colKey) {
      setActiveFilterCol(null);
    }
  };

  // Tüm Filtreleri Temizle
  const handleClearAllFilters = () => {
    setColumnFilters({});
    setSearchTerm('');
    setActiveFilterCol(null);
  };

  // Popover Değer Toggle
  const toggleValueSelect = (val: string) => {
    setPopoverSelectedValues(prev => {
      const next = new Set(prev);
      if (next.has(val)) {
        next.delete(val);
      } else {
        next.add(val);
      }
      return next;
    });
  };

  // Popover Tümünü Seç / Kaldır
  const toggleSelectAll = (filteredVals: string[]) => {
    const allIn = filteredVals.every(v => popoverSelectedValues.has(v));
    setPopoverSelectedValues(prev => {
      const next = new Set(prev);
      if (allIn) {
        filteredVals.forEach(v => next.delete(v));
      } else {
        filteredVals.forEach(v => next.add(v));
      }
      return next;
    });
  };

  // Sıralama Değiştir
  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filtreleme ve Sıralama
  const filteredRecords = useMemo(() => {
    return records.filter(r => {
      // 1. Genel arama
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase();
        const matchFinding = r.finding?.toLowerCase().includes(q);
        const matchLoc = r.location?.toLowerCase().includes(q);
        const matchEquip = r.equipment?.toLowerCase().includes(q);
        const matchOwner = r.assignedTo?.toLowerCase().includes(q);
        const matchPlan = r.actionPlan?.toLowerCase().includes(q);
        const matchNote = r.currentNote?.toLowerCase().includes(q);
        const matchHosp = r.facility?.name?.toLowerCase().includes(q);
        const matchCat = r.category?.toLowerCase().includes(q);
        const matchAudit = r.auditName?.toLowerCase().includes(q);
        if (!matchFinding && !matchLoc && !matchEquip && !matchOwner && !matchPlan && !matchNote && !matchHosp && !matchCat && !matchAudit) {
          return false;
        }
      }

      // 2. Excel Sütun Filtreleri
      for (const [colKey, filterState] of Object.entries(columnFilters)) {
        const val = getColValue(r, colKey);

        // Metin içerir araması
        if (filterState.textSearch) {
          if (!val.toLowerCase().includes(filterState.textSearch.toLowerCase())) {
            return false;
          }
        }

        // Çoklu seçim kutusu
        if (filterState.selectedValues && filterState.selectedValues.size > 0) {
          if (!filterState.selectedValues.has(val)) {
            return false;
          }
        }
      }

      return true;
    }).sort((a, b) => {
      let aVal = (a as any)[sortField];
      let bVal = (b as any)[sortField];

      if (sortField === 'facility') {
        aVal = a.facility?.name || '';
        bVal = b.facility?.name || '';
      }

      if (aVal === undefined || aVal === null) aVal = '';
      if (bVal === undefined || bVal === null) bVal = '';

      if (typeof aVal === 'number' && typeof bVal === 'number') {
        return sortOrder === 'asc' ? aVal - bVal : bVal - aVal;
      }

      const cmp = String(aVal).localeCompare(String(bVal), 'tr');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [records, searchTerm, columnFilters, sortField, sortOrder]);

  // Metrikler
  const metrics = useMemo(() => {
    let open = 0;
    let critical = 0;
    let openCritical = 0;
    let openHigh = 0;
    let completed = 0;

    filteredRecords.forEach(r => {
      const isOpen = r.status === 'Başlamadı' || r.status === 'Devam Ediyor';
      const isCompleted = r.status === 'Tamamlandı';
      if (isOpen) open++;
      if (isCompleted) completed++;
      if (r.riskScore === 'Kritik') {
        critical++;
        if (isOpen) openCritical++;
      }
      if (r.riskScore === 'Yüksek' && isOpen) {
        openHigh++;
      }
    });

    return { open, critical, openCritical, openHigh, completed };
  }, [filteredRecords]);

  // Excel Export
  const handleExport = () => {
    const exportData = filteredRecords.map((r, idx) => ({
      '#': r.rowNo || idx + 1,
      'Hastane Adı': r.facility?.name || '',
      ...(sheetType === 'KRITIK' ? { 'Nereden Geliyor': getSheetLabel(r.sheetType) } : {}),
      ...(sheetType === 'DENETIMLER' ? { 'Denetim Adı': r.auditName || '' } : {}),
      [getDateColumnHeader()]: r.recordDate ? new Date(r.recordDate).toLocaleDateString('tr-TR') : '',
      'Termin Tarihi': r.dueDate ? new Date(r.dueDate).toLocaleDateString('tr-TR') : '',
      'Mahal': r.location || '',
      ...(sheetType !== 'DENETIMLER' ? { 'Ekipman': r.equipment || '' } : {}),
      'Tespitler': r.finding,
      'Kategori': r.category || 'Belirtilmemiş',
      'Risk Skoru': r.riskScore || '',
      'Sorumlusu': r.assignedTo || '',
      'Durum': r.status,
      'İş Planı': r.actionPlan || '',
      'Aksiyon / Açıklama': r.currentNote || '',
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 30));
    XLSX.writeFile(wb, `${sheetTitle}_Export.xlsx`);
  };

  const isDenetimler = sheetType === 'DENETIMLER';
  const isKritik = sheetType === 'KRITIK';
  const isTrafoOrUps = sheetType === 'TRAFO' || sheetType === 'UPS';
  const hasActiveFilters = Object.keys(columnFilters).length > 0 || !!searchTerm;

  // Sütun Başlığı Render Fonksiyonu (Excel Filtre İkonlu)
  const renderColumnHeader = (colKey: string, label: string, widthClass: string = '', alignCenter: boolean = false) => {
    const isFiltered = !!columnFilters[colKey];
    const isSorted = sortField === colKey;

    return (
      <th className={`p-2.5 ${widthClass} select-none relative group`}>
        <div className={`flex items-center gap-1.5 ${alignCenter ? 'justify-center' : 'justify-between'}`}>
          
          {/* Tıklanınca Sırala */}
          <div 
            onClick={() => handleSort(colKey)}
            className="flex items-center gap-1 cursor-pointer hover:text-foreground font-semibold truncate"
          >
            <span className="truncate">{label}</span>
            {isSorted ? (
              sortOrder === 'asc' ? (
                <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" />
              ) : (
                <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
              )
            ) : (
              <ArrowUpDown className="w-3 h-3 opacity-30 group-hover:opacity-70 shrink-0" />
            )}
          </div>

          {/* Excel Filtre Butonu */}
          <button
            type="button"
            onClick={(e) => handleOpenFilter(colKey, e)}
            title={`${label} filtresi`}
            className={`p-1 rounded transition-colors shrink-0 ${
              isFiltered
                ? 'bg-primary text-primary-foreground shadow-xs'
                : 'text-muted-foreground/60 hover:text-foreground hover:bg-muted'
            }`}
          >
            <Filter className={`w-3.5 h-3.5 ${isFiltered ? 'fill-current' : ''}`} />
          </button>

        </div>
      </th>
    );
  };

  return (
    <div className="space-y-3 font-sans">
      
      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* ÜST BİLGİ VE ARAMA BARI (Canlı Metrikler + Search + Filtre Temizle) */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border rounded-xl p-3 flex flex-wrap items-center justify-between gap-3 shadow-xs">
        
        {/* Sol: Canlı İstatistikler & Metrik Barı */}
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground font-medium">
          <span className="text-foreground">
            <strong>{filteredRecords.length}</strong> / {records.length} kayıt gösteriliyor
          </span>
          <span className="text-border">|</span>
          <span>Açık: <strong className="text-foreground">{metrics.open}</strong></span>
          <span className="text-border">|</span>
          <span>Kritik: <strong className="text-red-600 dark:text-red-400 font-bold">{metrics.critical}</strong></span>
          <span className="text-border">|</span>
          <span>Açık Kritik: <strong className="text-red-600 dark:text-red-400 font-bold">{metrics.openCritical}</strong></span>
          <span className="text-border">|</span>
          <span>Açık Yüksek: <strong className="text-orange-600 dark:text-orange-400 font-bold">{metrics.openHigh}</strong></span>
          <span className="text-border">|</span>
          <span>Tamamlanan: <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{metrics.completed}</strong></span>
        </div>

        {/* Sağ: Genel Arama, Temizle, Yeni Kayıt, Export */}
        <div className="flex items-center gap-2">
          
          {/* Genel Arama Input */}
          <div className="relative w-48 sm:w-64">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Tabloda ara..."
              className="w-full h-8 pl-8 pr-7 rounded-lg border bg-background text-foreground text-xs focus:ring-2 focus:ring-primary outline-none"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')} 
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Filtreleri Temizle Butonu (Filtre varsa görünür) */}
          {hasActiveFilters && (
            <button
              onClick={handleClearAllFilters}
              className="text-xs text-primary hover:underline px-2 py-1 font-medium whitespace-nowrap"
            >
              Filtreleri Temizle
            </button>
          )}

          {/* Yenile */}
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            className="h-8 w-8 p-0"
            title="Yenile"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </Button>

          {/* Excel Export */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            disabled={filteredRecords.length === 0}
            className="h-8 text-xs"
            title="Excel İndir"
          >
            <Download className="w-3.5 h-3.5 mr-1 text-emerald-600 dark:text-emerald-400" />
            <span className="hidden sm:inline">Excel</span>
          </Button>

          {/* Numaraları Yeniden Diz (1, 2, 3...) */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleRenumber}
            disabled={isRenumbering || loading || records.length === 0}
            className="h-8 text-xs font-normal"
            title="Eksik/silinmiş sıra numaralarını baştan düzenler (1, 2, 3...)"
          >
            <ListOrdered className={`w-3.5 h-3.5 mr-1 text-blue-600 dark:text-blue-400 ${isRenumbering ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Numaraları Sırala</span>
          </Button>

          {/* Yeni Kayıt Ekle Butonu */}
          <Button
            size="sm"
            onClick={() => setShowCreateModal(true)}
            className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
          >
            <Plus className="w-3.5 h-3.5 mr-1" />
            Yeni Kayıt
          </Button>

        </div>

      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* EXCEL FİLTRE POPOVER MENÜSÜ                                         */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {activeFilterCol && filterPos && (
        <div 
          ref={filterPopoverRef}
          style={{
            position: 'fixed',
            top: `${filterPos.top}px`,
            left: `${filterPos.left}px`,
            zIndex: 60,
          }}
          className="bg-card text-card-foreground border border-border rounded-xl shadow-2xl w-80 p-3.5 space-y-3 animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b pb-2">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-bold text-foreground truncate">
                {getColHeaderName(activeFilterCol)}
              </span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {columnFilters[activeFilterCol] && (
                <button
                  type="button"
                  onClick={() => handleClearColumnFilter(activeFilterCol)}
                  title="Filtreyi Temizle"
                  className="text-[11px] text-red-600 dark:text-red-400 hover:underline px-1.5 py-0.5 rounded font-medium"
                >
                  Temizle
                </button>
              )}
              <button 
                onClick={() => {
                  setActiveFilterCol(null);
                  setFilterPos(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded hover:bg-muted"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Sıralama Hızlı Seçenekleri */}
          <div className="space-y-1 border-b pb-2 text-xs">
            <button
              type="button"
              onClick={() => {
                setSortField(activeFilterCol);
                setSortOrder('asc');
                setActiveFilterCol(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-foreground text-left transition-colors"
            >
              <ArrowUp className="w-3.5 h-3.5 text-primary" />
              <span>Artan sırala (A'dan Z'ye)</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSortField(activeFilterCol);
                setSortOrder('desc');
                setActiveFilterCol(null);
              }}
              className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted text-foreground text-left transition-colors"
            >
              <ArrowDown className="w-3.5 h-3.5 text-primary" />
              <span>Azalan sırala (Z'den A'ya)</span>
            </button>
          </div>

          {/* Metin İçerir Araması */}
          <div className="space-y-1">
            <label className="text-[11px] font-semibold text-muted-foreground block">
              Metin içerir
            </label>
            <input
              type="text"
              value={popoverTextFilter}
              onChange={(e) => setPopoverTextFilter(e.target.value)}
              placeholder="Arama yapın..."
              className="w-full h-8 px-2.5 rounded-lg border bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />
          </div>

          {/* Değerlerde Arama & Checkbox Listesi */}
          <div className="space-y-1.5">
            <input
              type="text"
              value={popoverSearch}
              onChange={(e) => setPopoverSearch(e.target.value)}
              placeholder="Seçenekleri filtrele..."
              className="w-full h-8 px-2.5 rounded-lg border bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
            />

            {/* Değerler Listesi & Checkbox */}
            {(() => {
              const allVals = getUniqueColumnValues(activeFilterCol);
              const filteredVals = allVals.filter(v => 
                v.toLowerCase().includes(popoverSearch.toLowerCase())
              );
              const isAllSelected = filteredVals.length > 0 && filteredVals.every(v => popoverSelectedValues.has(v));

              return (
                <div className="space-y-1">
                  {/* Tümünü Seç Checkbox */}
                  <label className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted/60 cursor-pointer text-xs font-semibold text-foreground border-b pb-1.5 select-none">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={() => toggleSelectAll(filteredVals)}
                      className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                    />
                    <span>Tümünü Seç ({filteredVals.length})</span>
                  </label>

                  {/* Değer Elemanları */}
                  <div className="max-h-40 overflow-y-auto space-y-0.5 pr-1">
                    {filteredVals.length === 0 ? (
                      <div className="p-2 text-center text-xs text-muted-foreground">
                        Değer bulunamadı
                      </div>
                    ) : (
                      filteredVals.map(val => {
                        const isChecked = popoverSelectedValues.has(val);
                        return (
                          <label
                            key={val}
                            className="flex items-center gap-2 px-2 py-1 rounded hover:bg-muted cursor-pointer text-xs text-foreground truncate select-none"
                            title={val}
                          >
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleValueSelect(val)}
                              className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5 shrink-0"
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
            {columnFilters[activeFilterCol] ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearColumnFilter(activeFilterCol)}
                className="h-8 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 p-1.5"
              >
                Filtreyi Kaldır
              </Button>
            ) : <div />}

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setActiveFilterCol(null);
                  setFilterPos(null);
                }}
                className="h-8 text-xs"
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilter}
                className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/90"
              >
                Uygula
              </Button>
            </div>
          </div>

        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* TABLO KONTEYNERİ (Görsel 1 Standartlarında Sticky Başlıklar)        */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      <div className="bg-card text-card-foreground border rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] min-h-[350px]">
          <table className="w-full border-collapse text-xs text-left">
            
            {/* Tablo Başlıkları (Sticky) */}
            <thead className="sticky top-0 z-10 bg-muted/95 backdrop-blur-sm border-b text-muted-foreground uppercase tracking-wider text-[11px] font-semibold">
              <tr>
                {renderColumnHeader('rowNo', '#', 'w-14 text-center', true)}
                {renderColumnHeader('facility', 'Hastane Adı', 'w-36')}
                {isKritik && renderColumnHeader('sheetType', 'Nereden Geliyor', 'w-36')}
                {isDenetimler && renderColumnHeader('auditName', 'Denetim Adı', 'w-32')}
                {renderColumnHeader('location', 'Mahal', 'w-32')}
                {!isDenetimler && renderColumnHeader('equipment', 'Ekipman', 'w-32')}
                {isTrafoOrUps && renderColumnHeader('applicationType', 'Uygulama', 'w-28')}
                {renderColumnHeader('finding', 'Tespitler', 'min-w-[280px] max-w-[400px]')}
                {renderColumnHeader('recordDate', getDateColumnHeader(), 'w-28')}
                {renderColumnHeader('dueDate', 'Termin Tarihi', 'w-28 text-primary font-bold')}
                {renderColumnHeader('category', 'Kategori', 'w-32')}
                {renderColumnHeader('riskScore', 'Risk Skoru', 'w-28 text-center', true)}
                {renderColumnHeader('assignedTo', 'Sorumlusu', 'w-32')}
                {renderColumnHeader('status', 'Durum', 'w-28 text-center', true)}
                <th className="p-2.5 min-w-[180px] max-w-[280px] text-primary">
                  Aksiyon / Açıklama
                </th>
                <th className="p-2.5 w-24 text-center sticky right-0 bg-muted/95 border-l">
                  İşlem
                </th>
              </tr>
            </thead>

            {/* Tablo Gövdesi */}
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={16} className="p-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Kayıtlar yükleniyor...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={16} className="p-12 text-center text-muted-foreground">
                    Gösterilecek kayıt bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const isCrit = record.riskScore === 'Kritik';
                  const isHigh = record.riskScore === 'Yüksek';

                  return (
                    <tr 
                      key={record.id}
                      className="hover:bg-muted/40 transition-colors group max-h-[85px]"
                    >
                      {/* Sıra No */}
                      <td className="p-2.5 text-center text-muted-foreground font-mono text-[11px]">
                        {record.rowNo || '-'}
                      </td>

                      {/* Hastane Adı */}
                      <td className="p-2.5 text-foreground font-medium truncate max-w-[140px]" title={record.facility?.name}>
                        {record.facility?.shortName || record.facility?.name}
                      </td>

                      {/* Nereden Geliyor / Kaynak Sekme (Kritik Tablosunda Hastane Adı Yanında) */}
                      {isKritik && (
                        <td className="p-2.5">
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold bg-primary/10 text-primary border border-primary/20">
                            {getSheetLabel(record.sheetType)}
                          </span>
                        </td>
                      )}

                      {/* Denetim Adı (Denetimler sekmesinde) */}
                      {isDenetimler && (
                        <td className="p-2.5 text-muted-foreground truncate max-w-[130px]" title={record.auditName || ''}>
                          {record.auditName || '-'}
                        </td>
                      )}

                      {/* Mahal */}
                      <td className="p-2.5 text-muted-foreground truncate max-w-[130px]" title={record.location || ''}>
                        {record.location || '-'}
                      </td>

                      {/* Ekipman */}
                      {!isDenetimler && (
                        <td className="p-2.5 text-muted-foreground truncate max-w-[130px]" title={record.equipment || ''}>
                          {record.equipment || '-'}
                        </td>
                      )}

                      {/* Trafo/UPS Uygulama */}
                      {isTrafoOrUps && (
                        <td className="p-2.5 text-muted-foreground truncate max-w-[100px]">
                          {record.applicationType || '-'}
                        </td>
                      )}

                      {/* Tespitler */}
                      <td className="p-2.5 text-foreground">
                        <div className="line-clamp-4 leading-[16px] max-h-[64px] overflow-hidden whitespace-pre-wrap" title={record.finding}>
                          {record.finding}
                        </div>
                      </td>

                      {/* TESPİT / PK TARİHİ */}
                      <td className="p-2.5 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                        {record.recordDate ? new Date(record.recordDate).toLocaleDateString('tr-TR') : '-'}
                      </td>

                      {/* TERMİN TARİHİ */}
                      <td className="p-2.5 whitespace-nowrap font-mono text-[11px] font-semibold text-primary">
                        {record.dueDate ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded bg-primary/10 text-primary">
                            {new Date(record.dueDate).toLocaleDateString('tr-TR')}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/60 italic font-normal">-</span>
                        )}
                      </td>

                      {/* KATEGORİ (Risk Skoru Öncesinde) */}
                      <td className="p-2.5 text-foreground">
                        <Badge variant="outline" className="text-[10px] truncate max-w-[130px] font-normal" title={record.category || 'Belirtilmemiş'}>
                          {record.category || 'Belirtilmemiş'}
                        </Badge>
                      </td>

                      {/* Risk Skoru */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span 
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            isCrit ? 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/50' :
                            isHigh ? 'bg-orange-500/15 text-orange-700 dark:text-orange-400 border border-orange-200 dark:border-orange-900/50' :
                            record.riskScore === 'Önemli' ? 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50' :
                            'bg-muted text-muted-foreground border'
                          }`}
                        >
                          {record.riskScore || '-'}
                        </span>
                      </td>

                      {/* Sorumlusu */}
                      <td className="p-2.5 text-muted-foreground truncate max-w-[120px]" title={record.assignedTo || ''}>
                        {record.assignedTo || '-'}
                      </td>

                      {/* Durum */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        <span 
                          className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                            record.status === 'Tamamlandı' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50' :
                            record.status === 'Devam Ediyor' ? 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50' :
                            record.status === 'İptal Edildi' ? 'bg-muted text-muted-foreground border line-through' :
                            'bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50'
                          }`}
                        >
                          {record.status}
                        </span>
                      </td>

                      {/* Aksiyon / Açıklama */}
                      <td className="p-2.5 text-foreground">
                        {record.currentNote ? (
                          <div className="line-clamp-3 text-[11px] leading-[15px] italic text-primary dark:text-blue-300" title={record.currentNote}>
                            {record.currentNote}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/60 italic text-[11px]">-</span>
                        )}
                      </td>

                      {/* İşlem Butonları (İncele, Düzenle, Aksiyon Gir, Sil) */}
                      <td className="p-2 text-center sticky right-0 bg-card/95 group-hover:bg-muted/95 border-l">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() => setInspectRecord(record)}
                            className="w-20 py-0.5 rounded border border-border bg-background hover:bg-muted text-[11px] font-medium text-foreground transition-colors shadow-2xs"
                          >
                            İncele
                          </button>
                          <button
                            onClick={() => setEditRecord(record)}
                            className="w-20 py-0.5 rounded border border-border bg-background hover:bg-muted text-[11px] font-medium text-foreground transition-colors shadow-2xs"
                          >
                            Düzenle
                          </button>
                          <button
                            onClick={() => setActionRecord(record)}
                            className="w-20 py-0.5 rounded border border-emerald-300 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 transition-colors shadow-2xs"
                          >
                            Aksiyon Gir
                          </button>
                          <button
                            onClick={() => setDeleteConfirmRecord(record)}
                            className="w-20 py-0.5 rounded border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 hover:bg-red-100 dark:hover:bg-red-900/50 text-[11px] font-semibold text-red-600 dark:text-red-400 transition-colors shadow-2xs flex items-center justify-center gap-1"
                            title="Bu kaydı sil"
                          >
                            <Trash2 className="w-3 h-3" />
                            Sil
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────────── */}
      {/* DİYALOGLAR                                                          */}
      {/* ─────────────────────────────────────────────────────────────────── */}
      {inspectRecord && (
        <InspectRecordDialog
          record={inspectRecord}
          onClose={() => setInspectRecord(null)}
        />
      )}

      {editRecord && (
        <EditRecordDialog
          record={editRecord}
          onClose={() => setEditRecord(null)}
          onSuccess={onRefresh}
          onDelete={(rec) => {
            setEditRecord(null);
            setDeleteConfirmRecord(rec);
          }}
        />
      )}

      {actionRecord && (
        <ActionNoteDialog
          record={actionRecord}
          onClose={() => setActionRecord(null)}
          onSuccess={onRefresh}
        />
      )}

      {showCreateModal && (
        <CreateRecordDialog
          sheetType={sheetType}
          defaultFacilityId={selectedFacilityId}
          facilities={facilities}
          onClose={() => setShowCreateModal(false)}
          onSuccess={onRefresh}
        />
      )}

      {/* Kayıt Silme Onay Modalı */}
      {deleteConfirmRecord && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-foreground">
                  Kaydı Silmek İstiyor Musunuz?
                </h3>
                <p className="text-xs text-muted-foreground">
                  Bu işlem geri alınamaz. Kayıt ve varsa geçmiş işlem notları kalıcı olarak silinecektir.
                </p>
              </div>
            </div>

            <div className="p-3 bg-muted/40 rounded-xl border text-xs space-y-1.5">
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Hastane:</span>
                <span className="font-semibold text-foreground">
                  {deleteConfirmRecord.facility?.name || '-'}
                </span>
              </div>
              <div className="flex items-center justify-between text-muted-foreground">
                <span>Sekme:</span>
                <span className="font-semibold text-foreground">
                  {getSheetLabel(deleteConfirmRecord.sheetType)} #{deleteConfirmRecord.rowNo || '-'}
                </span>
              </div>
              <div className="text-muted-foreground">
                <span className="block mb-0.5">Tespit:</span>
                <p className="line-clamp-2 italic text-foreground bg-background/50 p-1.5 rounded border border-border/50">
                  {deleteConfirmRecord.finding}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setDeleteConfirmRecord(null)}
                disabled={isDeleting}
              >
                Vazgeç
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => handleDeleteRecord(deleteConfirmRecord)}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white flex items-center gap-1.5"
              >
                {isDeleting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Siliniyor...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Evet, Sil
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
