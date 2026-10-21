import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import * as XLSX from 'xlsx';
import { 
  Search, ArrowUpDown, ArrowUp, ArrowDown, Download, RefreshCw, X, Calendar, 
  Tag, Shield, AlertTriangle, CheckCircle2, Building2, Filter, Plus, Check, Trash2, ListOrdered,
  Camera, FileText, ExternalLink 
} from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type ImprovementRecord, type FacilityOption, formatCurrency } from './types';
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
  const navigate = useNavigate();
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
  const activeButtonElRef = useRef<HTMLButtonElement | null>(null);

  // Akıllı Konum Hesaplama (Üst / Alt / Ekran Sınırları)
  const calculateFilterPosition = (targetEl: HTMLButtonElement, popoverEl?: HTMLElement | null) => {
    const rect = targetEl.getBoundingClientRect();
    const popoverWidth = popoverEl?.offsetWidth || 320;
    const popoverHeight = popoverEl?.offsetHeight || 440;

    // Yatay Konumlandırma
    let left = rect.left;
    if (left + popoverWidth > window.innerWidth - 16) {
      left = Math.max(16, window.innerWidth - popoverWidth - 16);
    }
    if (left < 16) left = 16;

    // Dikey Konumlandırma (Akıllı Flip / Yukarı ya da Aşağı Açılma)
    const spaceBelow = window.innerHeight - rect.bottom - 12;
    const spaceAbove = rect.top - 12;

    let top: number;
    if (spaceBelow >= popoverHeight) {
      // Altta yeterli alan var -> Aşağıya aç
      top = rect.bottom + 6;
    } else if (spaceAbove >= popoverHeight) {
      // Altta alan yetersiz, üstte yeterli alan var -> Üste aç
      top = rect.top - popoverHeight - 6;
    } else if (spaceBelow >= spaceAbove) {
      // İki tarafta da tam sığmıyor ama alt taraf daha geniş
      top = Math.max(12, window.innerHeight - popoverHeight - 12);
    } else {
      // Üst taraf daha geniş
      top = Math.max(12, 12);
    }

    return { top, left };
  };

  // Popover açıldığında ve pencere/tablo kaydırıldığında konumu anlık güncelle
  useEffect(() => {
    if (!activeFilterCol || !activeButtonElRef.current) return;

    const updatePosition = () => {
      if (!activeButtonElRef.current) return;
      const targetEl = activeButtonElRef.current;
      const rect = targetEl.getBoundingClientRect();

      // Buton tamamen ekran dışındaysa kapat
      if (rect.bottom < 0 || rect.top > window.innerHeight) {
        setActiveFilterCol(null);
        setFilterPos(null);
        return;
      }

      const pos = calculateFilterPosition(targetEl, filterPopoverRef.current);
      setFilterPos(pos);
    };

    updatePosition();
    const frameId = requestAnimationFrame(updatePosition);

    window.addEventListener('resize', updatePosition);
    // useCapture: true sayesinde tablonun iç scroll hareketleri de yakalanır
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [activeFilterCol]);

  // Dışarı tıklandığında popover kapat
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        filterPopoverRef.current && 
        !filterPopoverRef.current.contains(e.target as Node) &&
        !activeButtonElRef.current?.contains(e.target as Node)
      ) {
        setActiveFilterCol(null);
        setFilterPos(null);
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
      case 'HASTANE_IC_DENETIMLERI': return 'Hastane İç Denetimleri';
      case 'MERKEZI_DENETIMLER': return 'Merkezi Denetimler';
      case 'SAGLIK_DENETIMLERI': return 'Sağlık Denetimleri';
      case 'ITFAIYE_YANGIN_DENETIMLERI': return 'İtfaiye/Yangın Komisyonu Denetimleri';
      case 'ELEKTRIK_PK': return 'Elektrik PK';
      case 'TOPRAKLAMA_PK': return 'Topraklama PK';
      case 'PARATONER_PK': return 'Paratoner PK';
      case 'JENERATOR_PK': return 'Jeneratör PK & Bakım';
      case 'ELEKTRIK_PANO_KONTROLLERI': return 'Elektrik Pano Kontrolleri';
      case 'TRAFO': return 'Trafo PK & Bakım';
      case 'UPS': return 'UPS PK & Bakım';
      case 'KAZANLAR': return 'Kazanlar';
      case 'CHILLERLER': return 'Chillerler';
      case 'KLIMA_SANTRALLERI': return 'Klima Santralleri';
      case 'SULU_SONDURME_PK_BAKIM': return 'Sulu Söndürme PK & Bakım';
      case 'GAZLI_SONDURME_PK_BAKIM': return 'Gazlı Söndürme PK & Bakım';
      case 'BASINCLANDIRMA_PK_BAKIM': return 'Basınçlandırma Sistemleri PK & Bakım';
      case 'YANGIN_ALGILAMA_PK_BAKIM': return 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım';
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
      case 'equipmentNo':
        return r.equipmentNo || '';
      case 'equipmentName':
        return r.equipmentName || r.equipment || '';
      case 'applicationType':
        return r.applicationType || '';
      case 'finding':
        return r.finding || '';
      case 'actionPlan':
        return r.actionPlan || '';
      case 'category':
        return r.category || 'Belirtilmemiş';
      case 'riskScore':
        return r.riskScore || 'Belirtilmedi';
      case 'assignedTo':
        return r.assignedTo || '';
      case 'status':
        return r.status || '';
      case 'currentNote':
        return r.currentNote || '';
      case 'technicalManagerDesc':
        return r.technicalManagerDesc || '';
      case 'discoveryNotes':
        return r.discoveryNotes || '';
      case 'estimatedBudget':
        return r.estimatedBudget !== undefined && r.estimatedBudget !== null ? String(r.estimatedBudget) : '';
      case 'actualBudget':
        return r.actualBudget !== undefined && r.actualBudget !== null ? String(r.actualBudget) : '';
      default:
        return String((r as any)[colKey] || '');
    }
  };

  // Dinamik Tarih Başlığı
  const getDateColumnHeader = () => {
    if (['DENETIMLER', 'HASTANE_IC_DENETIMLERI', 'MERKEZI_DENETIMLER', 'SAGLIK_DENETIMLERI', 'ITFAIYE_YANGIN_DENETIMLERI'].includes(sheetType)) {
      return 'Tespit Tarihi';
    }
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
      case 'equipmentNo': return 'Ekipman No';
      case 'equipmentName': return 'Ekipman Adı';
      case 'applicationType': return 'Uygulama';
      case 'finding': return 'Tespitler';
      case 'category': return 'Kategori';
      case 'riskScore': return 'Risk Skoru';
      case 'actionPlan': return 'İş Planı';
      case 'assignedTo': return 'Sorumlusu';
      case 'status': return 'Durum';
      case 'currentNote': return 'Aksiyon / Açıklama';
      case 'technicalManagerDesc': return 'Teknik Hizmetler Açıklaması';
      case 'discoveryNotes': return 'Yapılan Keşif Notları';
      case 'estimatedBudget': return 'Tahmini Bütçe';
      case 'actualBudget': return 'Gerçekleşen Bütçe';
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
      activeButtonElRef.current = null;
      return;
    }

    const buttonEl = e.currentTarget;
    activeButtonElRef.current = buttonEl;
    const initialPos = calculateFilterPosition(buttonEl);
    setFilterPos(initialPos);

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
        const matchEquip = r.equipment?.toLowerCase().includes(q) || r.equipmentNo?.toLowerCase().includes(q) || r.equipmentName?.toLowerCase().includes(q);
        const matchOwner = r.assignedTo?.toLowerCase().includes(q);
        const matchPlan = r.actionPlan?.toLowerCase().includes(q);
        const matchNote = r.currentNote?.toLowerCase().includes(q);
        const matchHosp = r.facility?.name?.toLowerCase().includes(q);
        const matchCat = r.category?.toLowerCase().includes(q);
        const matchAudit = r.auditName?.toLowerCase().includes(q);
        const matchTech = r.technicalManagerDesc?.toLowerCase().includes(q);
        const matchDisc = r.discoveryNotes?.toLowerCase().includes(q);
        if (!matchFinding && !matchLoc && !matchEquip && !matchOwner && !matchPlan && !matchNote && !matchHosp && !matchCat && !matchAudit && !matchTech && !matchDisc) {
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
    let cancelled = 0;
    let totalProgressSum = 0;

    filteredRecords.forEach(r => {
      const isOpen = r.status === 'Başlamadı' || r.status === 'Devam Ediyor';
      const isCompleted = r.status === 'Tamamlandı';
      const isCancelled = r.status === 'İptal Edildi';
      if (isOpen) open++;
      if (isCompleted) completed++;
      if (isCancelled) cancelled++;
      if (r.riskScore === 'Kritik') {
        critical++;
        if (isOpen) openCritical++;
      }
      if (r.riskScore === 'Yüksek' && isOpen) {
        openHigh++;
      }
      if (!isCancelled) {
        totalProgressSum += isCompleted ? 100 : (r.status === 'Devam Ediyor' ? Math.min(100, Math.max(0, r.progress || 0)) : 0);
      }
    });

    const active = filteredRecords.length - cancelled;
    const avgProgress = active > 0 ? Math.round(totalProgressSum / active) : 0;

    return { open, critical, openCritical, openHigh, completed, avgProgress };
  }, [filteredRecords]);

  // Excel Export
  const handleExport = () => {
    const exportData = filteredRecords.map((r, idx) => {
      const row: any = {
        '#': r.rowNo || idx + 1,
        'Hastane Adı': r.facility?.name || '',
      };

      if (isKritik) row['Nereden Geliyor'] = getSheetLabel(r.sheetType);
      if (isDenetimler) row['Denetim Adı'] = r.auditName || '';
      if (isTrafoOrUps) row['Uygulama'] = r.applicationType || '';
      if (isDenetimler) row['Tespit Tarihi'] = r.recordDate ? new Date(r.recordDate).toLocaleDateString('tr-TR') : '';
      if (!isDenetimler && !isTrafoOrUps) row[getDateColumnHeader()] = r.recordDate ? new Date(r.recordDate).toLocaleDateString('tr-TR') : '';
      if (isTrafoOrUps) row['Tarih'] = r.recordDate ? new Date(r.recordDate).toLocaleDateString('tr-TR') : '';
      row['Mahal'] = r.location || '';
      if (!isDenetimler) {
        row['Ekipman No'] = r.equipmentNo || '';
        row['Ekipman Adı'] = r.equipmentName || r.equipment || '';
      }
      row['Tespitler'] = r.finding;
      row['Kategori'] = r.category || 'Belirtilmemiş';
      row['Risk Skoru'] = r.riskScore || '';
      row['İş Planı'] = r.actionPlan || '';
      row['Termin'] = r.dueDate ? new Date(r.dueDate).toLocaleDateString('tr-TR') : '';
      row['Sorumlusu'] = r.assignedTo || '';
      row['Durum'] = r.status;
      row['Aksiyon / Açıklama'] = r.currentNote || '';

      // Yeni Eklenen Sütunlar (Excel Takip Tablosu Güncellemesi)
      row['Teknik Müdür Açıklaması'] = r.technicalManagerDesc || '';
      row['Yapılan Keşif Notları'] = r.discoveryNotes || '';
      row['Tahmini Bütçe'] = r.estimatedBudget ?? '';
      row['Gerçekleşen Bütçe'] = r.actualBudget ?? '';

      return row;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetTitle.slice(0, 30));
    XLSX.writeFile(wb, `${sheetTitle}_Export.xlsx`);
  };

  const isDenetimler = [
    'DENETIMLER',
    'HASTANE_IC_DENETIMLERI',
    'MERKEZI_DENETIMLER',
    'SAGLIK_DENETIMLERI',
    'ITFAIYE_YANGIN_DENETIMLERI',
  ].includes(sheetType);
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
          <span className="text-border">|</span>
          <span className="bg-primary/10 text-primary border border-primary/20 px-2 py-0.5 rounded-md font-bold">
            Ağırlıklı İlerleme: %{metrics.avgProgress}
          </span>
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
            zIndex: 9999,
          }}
          className="bg-card text-card-foreground border border-border/80 rounded-lg shadow-2xl w-80 p-3.5 flex flex-col max-h-[min(520px,calc(100vh-24px))] animate-in fade-in zoom-in-95 duration-150"
        >
          {/* Popover Header (Sabit - shrink-0) */}
          <div className="flex items-center justify-between border-b pb-2 shrink-0">
            <div className="flex items-center gap-1.5 min-w-0 pr-2">
              <Filter className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground truncate">
                {getColHeaderName(activeFilterCol)}
              </span>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              {columnFilters[activeFilterCol] && (
                <button
                  type="button"
                  onClick={() => handleClearColumnFilter(activeFilterCol)}
                  title="Filtreyi Temizle"
                  className="text-[11px] text-destructive hover:underline px-1.5 py-0.5 rounded font-medium"
                >
                  Temizle
                </button>
              )}
              <button 
                type="button"
                onClick={() => {
                  setActiveFilterCol(null);
                  setFilterPos(null);
                }}
                className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-muted"
                title="Kapat"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Popover Scrollable Body (flex-1 overflow-y-auto space-y-3 min-h-0 py-2 pr-1) */}
          <div className="flex-1 overflow-y-auto space-y-3 min-h-0 py-1 pr-1">
            {/* Sıralama Hızlı Seçenekleri */}
            <div className="space-y-1 border-b pb-2 text-xs">
              <button
                type="button"
                onClick={() => {
                  setSortField(activeFilterCol);
                  setSortOrder('asc');
                  setActiveFilterCol(null);
                  setFilterPos(null);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-foreground text-left transition-colors font-medium"
              >
                <ArrowUp className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Artan sırala (A'dan Z'ye)</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setSortField(activeFilterCol);
                  setSortOrder('desc');
                  setActiveFilterCol(null);
                  setFilterPos(null);
                }}
                className="w-full flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted text-foreground text-left transition-colors font-medium"
              >
                <ArrowDown className="w-3.5 h-3.5 text-primary shrink-0" />
                <span>Azalan sırala (Z'den A'ya)</span>
              </button>
            </div>

            {/* Metin İçerir Araması */}
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-muted-foreground block">
                Metin içerir
              </label>
              <input
                type="text"
                value={popoverTextFilter}
                onChange={(e) => setPopoverTextFilter(e.target.value)}
                placeholder="Arama yapın..."
                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />
            </div>

            {/* Değerlerde Arama & Checkbox Listesi */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-medium text-muted-foreground block">
                Seçenek filtresi
              </label>
              <input
                type="text"
                value={popoverSearch}
                onChange={(e) => setPopoverSearch(e.target.value)}
                placeholder="Seçenekleri filtrele..."
                className="w-full h-8 px-2.5 rounded-md border border-input bg-background text-xs text-foreground outline-none focus:ring-1 focus:ring-primary"
              />

              {/* Değerler Listesi & Checkbox */}
              {(() => {
                const allVals = getUniqueColumnValues(activeFilterCol);
                const filteredVals = allVals.filter(v => 
                  v.toLowerCase().includes(popoverSearch.toLowerCase())
                );
                const isAllSelected = filteredVals.length > 0 && filteredVals.every(v => popoverSelectedValues.has(v));

                return (
                  <div className="space-y-1 border rounded-md p-1.5 bg-muted/20">
                    {/* Tümünü Seç Checkbox */}
                    <label className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted/60 cursor-pointer text-xs font-semibold text-foreground border-b pb-1 select-none">
                      <input
                        type="checkbox"
                        checked={isAllSelected}
                        onChange={() => toggleSelectAll(filteredVals)}
                        className="rounded border-border text-primary focus:ring-primary w-3.5 h-3.5"
                      />
                      <span>Tümünü Seç ({filteredVals.length})</span>
                    </label>

                    {/* Değer Elemanları */}
                    <div className="max-h-36 overflow-y-auto space-y-0.5 pr-1">
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
                              className="flex items-center gap-2 px-1.5 py-1 rounded hover:bg-muted cursor-pointer text-xs text-foreground truncate select-none"
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
          </div>

          {/* Popover Butonları (Sabit - shrink-0) */}
          <div className="flex items-center justify-between pt-2.5 border-t shrink-0 mt-auto">
            {columnFilters[activeFilterCol] ? (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleClearColumnFilter(activeFilterCol)}
                className="h-8 text-xs text-destructive hover:bg-destructive/10 p-1.5 rounded-md"
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
                className="h-8 text-xs rounded-md"
              >
                Vazgeç
              </Button>
              <Button
                size="sm"
                onClick={handleApplyFilter}
                className="h-8 text-xs rounded-md bg-primary text-primary-foreground hover:bg-primary/90"
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
                {isTrafoOrUps && renderColumnHeader('applicationType', 'Uygulama', 'w-28')}
                {renderColumnHeader('status', 'Durum', 'w-32 text-center', true)}
                {renderColumnHeader('location', 'Mahal', 'w-32')}
                {!isDenetimler && renderColumnHeader('equipmentNo', 'Ekipman No', 'w-28')}
                {!isDenetimler && renderColumnHeader('equipmentName', 'Ekipman Adı', 'w-36')}
                {renderColumnHeader('finding', 'Tespitler', 'min-w-[280px] max-w-[400px]')}
                {renderColumnHeader('category', 'Kategori', 'w-32')}
                {renderColumnHeader('riskScore', 'Risk Skoru', 'w-28 text-center', true)}
                {renderColumnHeader('actionPlan', 'İş Planı', 'min-w-[170px] max-w-[240px]')}
                {renderColumnHeader('dueDate', 'Termin Tarihi', 'w-28 text-primary font-bold')}
                {renderColumnHeader('assignedTo', 'Sorumlusu', 'w-32')}
                {renderColumnHeader('recordDate', getDateColumnHeader(), 'w-28')}
                {renderColumnHeader('currentNote', 'Aksiyon / Açıklama', 'min-w-[180px] max-w-[280px] text-primary')}
                {renderColumnHeader('technicalManagerDesc', 'Teknik Hizmetler Açıklaması', 'min-w-[170px] max-w-[240px]')}
                {renderColumnHeader('discoveryNotes', 'Yapılan Keşif Notları', 'min-w-[170px] max-w-[240px]')}
                {renderColumnHeader('estimatedBudget', 'Tahmini Bütçe', 'w-28 text-right font-medium')}
                {renderColumnHeader('actualBudget', 'Gerçekleşen Bütçe', 'w-28 text-right font-medium')}
                <th className="p-2.5 w-24 text-center sticky right-0 bg-muted/95 border-l">
                  İşlem
                </th>
              </tr>
            </thead>

            {/* Tablo Gövdesi */}
            <tbody className="divide-y divide-border/60">
              {loading ? (
                <tr>
                  <td colSpan={25} className="p-12 text-center text-muted-foreground">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                    Kayıtlar yükleniyor...
                  </td>
                </tr>
              ) : filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={25} className="p-12 text-center text-muted-foreground">
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

                      {/* Trafo/UPS Uygulama */}
                      {isTrafoOrUps && (
                        <td className="p-2.5 text-muted-foreground truncate max-w-[100px]">
                          {record.applicationType || '-'}
                        </td>
                      )}

                      {/* Durum */}
                      <td className="p-2.5 text-center whitespace-nowrap">
                        {record.status === 'Tamamlandı' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50">
                            Tamamlandı (%100)
                          </span>
                        ) : record.status === 'Devam Ediyor' ? (
                          <div className="flex flex-col items-center gap-1">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-200 dark:border-blue-900/50">
                              Devam Ediyor (%{record.progress ?? 0})
                            </span>
                            <div className="w-16 bg-muted rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                                style={{ width: `${Math.min(100, Math.max(0, record.progress ?? 0))}%` }}
                                title={`İlerleme: %${record.progress ?? 0}`}
                              />
                            </div>
                          </div>
                        ) : record.status === 'İptal Edildi' ? (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-muted text-muted-foreground border line-through">
                            İptal Edildi
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-900/50">
                            Başlamadı (%0)
                          </span>
                        )}
                      </td>

                      {/* Mahal */}
                      <td className="p-2.5 text-muted-foreground truncate max-w-[130px]" title={record.location || ''}>
                        {record.location || '-'}
                      </td>

                      {/* Ekipman No & Adı (PK'lar, Pano, Trafo, UPS) */}
                      {!isDenetimler && (
                        <>
                          <td className="p-2.5 text-foreground font-mono font-medium truncate max-w-[110px]" title={record.equipmentNo || ''}>
                            {record.equipmentNo ? (
                              <span className="px-1.5 py-0.5 rounded bg-muted text-[11px]">
                                {record.equipmentNo}
                              </span>
                            ) : '-'}
                          </td>
                          <td className="p-2.5 text-muted-foreground truncate max-w-[140px]" title={record.equipmentName || record.equipment || ''}>
                            {record.equipmentName || record.equipment || '-'}
                          </td>
                        </>
                      )}

                      {/* Tespitler */}
                      <td className="p-2.5 text-foreground">
                        <div 
                          onClick={() => navigate(`/operations-management/improvements/records/${record.id}`)}
                          className="line-clamp-4 leading-[16px] max-h-[64px] overflow-hidden whitespace-pre-wrap cursor-pointer hover:text-primary transition-colors font-medium" 
                          title="Detaylı sayfaya gitmek için tıklayın"
                        >
                          {record.finding}
                        </div>
                        {((Array.isArray(record.findingPhotos) && record.findingPhotos.length > 0) ||
                          (Array.isArray(record.documents) && record.documents.length > 0)) && (
                          <div className="flex items-center gap-1.5 mt-1 pt-1 border-t border-border/40">
                            {Array.isArray(record.findingPhotos) && record.findingPhotos.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/operations-management/improvements/records/${record.id}`);
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-medium border border-blue-200 dark:border-blue-800 transition-colors"
                                title={`${record.findingPhotos.length} fotoğrafı sayfada görüntüle`}
                              >
                                <Camera className="w-3 h-3" />
                                <span>{record.findingPhotos.length} Foto</span>
                              </button>
                            )}
                            {Array.isArray(record.documents) && record.documents.length > 0 && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/operations-management/improvements/records/${record.id}`);
                                }}
                                className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-600 dark:text-amber-400 text-[10px] font-medium border border-amber-200 dark:border-amber-800 transition-colors"
                                title={`${record.documents.length} dokümanı sayfada görüntüle`}
                              >
                                <FileText className="w-3 h-3" />
                                <span>{record.documents.length} Belge</span>
                              </button>
                            )}
                          </div>
                        )}
                      </td>

                      {/* KATEGORİ */}
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
                            record.riskScore === 'Olası' ? 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border border-yellow-200 dark:border-yellow-900/50' :
                            record.riskScore === 'Önemsiz' ? 'bg-slate-500/15 text-slate-700 dark:text-slate-400 border border-slate-200 dark:border-slate-800' :
                            'bg-muted text-muted-foreground border'
                          }`}
                        >
                          {record.riskScore || '-'}
                        </span>
                      </td>

                      {/* İŞ PLANI */}
                      <td className="p-2.5 text-foreground">
                        {record.actionPlan ? (
                          <div className="line-clamp-3 text-[11px] leading-[15px] text-slate-700 dark:text-slate-300" title={record.actionPlan}>
                            {record.actionPlan}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px]">-</span>
                        )}
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

                      {/* Sorumlusu */}
                      <td className="p-2.5 text-muted-foreground truncate max-w-[120px]" title={record.assignedTo || ''}>
                        {record.assignedTo || '-'}
                      </td>

                      {/* TESPİT / PK TARİHİ */}
                      <td className="p-2.5 text-muted-foreground whitespace-nowrap font-mono text-[11px]">
                        {record.recordDate ? new Date(record.recordDate).toLocaleDateString('tr-TR') : '-'}
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

                      {/* Teknik Müdür Açıklaması */}
                      <td className="p-2.5 text-foreground">
                        {record.technicalManagerDesc ? (
                          <div className="line-clamp-3 text-[11px] leading-[15px] text-slate-700 dark:text-slate-300" title={record.technicalManagerDesc}>
                            {record.technicalManagerDesc}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Yapılan Keşif Notları */}
                      <td className="p-2.5 text-foreground">
                        {record.discoveryNotes ? (
                          <div className="line-clamp-3 text-[11px] leading-[15px] text-slate-700 dark:text-slate-300" title={record.discoveryNotes}>
                            {record.discoveryNotes}
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px]">-</span>
                        )}
                      </td>

                      {/* Tahmini Bütçe */}
                      <td className="p-2.5 text-right font-mono text-[11px] whitespace-nowrap">
                        {record.estimatedBudget !== undefined && record.estimatedBudget !== null ? (
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {formatCurrency(record.estimatedBudget, record.currency)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>

                      {/* Gerçekleşen Bütçe */}
                      <td className="p-2.5 text-right font-mono text-[11px] whitespace-nowrap">
                        {record.actualBudget !== undefined && record.actualBudget !== null ? (
                          <span className="font-semibold text-emerald-600 dark:text-emerald-400">
                            {formatCurrency(record.actualBudget, record.currency)}
                          </span>
                        ) : (
                          <span className="text-muted-foreground/50">-</span>
                        )}
                      </td>

                      {/* İşlem Butonları (Detay, İncele, Düzenle, Aksiyon Gir, Sil) */}
                      <td className="p-2 text-center sticky right-0 bg-card/95 group-hover:bg-muted/95 border-l">
                        <div className="flex flex-col gap-1 items-center">
                          <button
                            onClick={() => navigate(`/operations-management/improvements/records/${record.id}`)}
                            className="w-20 py-0.5 rounded border border-primary/40 bg-primary/10 hover:bg-primary/20 text-[11px] font-bold text-primary transition-colors shadow-2xs flex items-center justify-center gap-1"
                            title="Tüm detayları, fotoğrafları ve işlem geçmişini sayfada aç"
                          >
                            <ExternalLink className="w-3 h-3" />
                            Detay
                          </button>
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
