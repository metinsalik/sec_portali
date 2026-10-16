import React, { useState, useMemo } from 'react';
import { 
  Eye, MessageSquarePlus, Edit3, Image as ImageIcon, 
  ArrowUpDown, Search, X, CheckCircle2, Clock, AlertOctagon 
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { type ImprovementRecord, ImprovementSheetType } from '../types';
import { ColumnFilterPopover } from './ColumnFilterPopover';

interface AdvancedSourceTableProps {
  sheetType: ImprovementSheetType;
  records: ImprovementRecord[];
  isLoading?: boolean;
  onInspect: (record: ImprovementRecord) => void;
  onAction: (record: ImprovementRecord) => void;
  onEdit: (record: ImprovementRecord) => void;
}

export const AdvancedSourceTable: React.FC<AdvancedSourceTableProps> = ({
  sheetType,
  records,
  isLoading,
  onInspect,
  onAction,
  onEdit,
}) => {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('rowNo');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  // Sütun filtreleri
  const [columnFilters, setColumnFilters] = useState<Record<string, string[]>>({});

  const handleFilterChange = (colKey: string, selected: string[]) => {
    setColumnFilters((prev) => ({
      ...prev,
      [colKey]: selected,
    }));
  };

  const handleSort = (field: string, direction: 'asc' | 'desc') => {
    setSortField(field);
    setSortDirection(direction);
  };

  // Filtrelenmiş ve Sıralanmış Kayıtlar
  const filteredRecords = useMemo(() => {
    let result = [...records];

    // Genel metin araması
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (r) =>
          r.finding?.toLowerCase().includes(q) ||
          r.actionPlan?.toLowerCase().includes(q) ||
          r.currentNote?.toLowerCase().includes(q) ||
          r.assignedTo?.toLowerCase().includes(q) ||
          r.location?.toLowerCase().includes(q) ||
          r.equipment?.toLowerCase().includes(q) ||
          r.category?.toLowerCase().includes(q) ||
          r.facility?.name?.toLowerCase().includes(q)
      );
    }

    // Sütun bazlı popover filtreleri
    Object.entries(columnFilters).forEach(([colKey, selectedValues]) => {
      if (selectedValues && selectedValues.length > 0) {
        result = result.filter((r) => {
          let val = '';
          if (colKey === 'facility') val = r.facility?.shortName || r.facility?.name || '';
          else if (colKey === 'riskScore') val = r.riskScore || 'Risk Belirtilmedi';
          else if (colKey === 'status') val = r.status || 'Belirtilmedi';
          else if (colKey === 'category') val = r.category || 'Kategorisiz';
          else if (colKey === 'assignedTo') val = r.assignedTo || 'Sorumlu Yok';
          return selectedValues.includes(val);
        });
      }
    });

    // Sıralama
    result.sort((a: any, b: any) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === 'facility') {
        valA = a.facility?.name || '';
        valB = b.facility?.name || '';
      }

      if (valA === valB) return 0;
      if (valA === null || valA === undefined) return 1;
      if (valB === null || valB === undefined) return -1;

      if (typeof valA === 'number' && typeof valB === 'number') {
        return sortDirection === 'asc' ? valA - valB : valB - valA;
      }

      return sortDirection === 'asc'
        ? String(valA).localeCompare(String(valB), 'tr')
        : String(valB).localeCompare(String(valA), 'tr');
    });

    return result;
  }, [records, search, columnFilters, sortField, sortDirection]);

  // Sütun filtre seçenekleri için değer listeleri
  const facilityValues = useMemo(
    () => records.map((r) => r.facility?.shortName || r.facility?.name || ''),
    [records]
  );
  const statusValues = useMemo(() => records.map((r) => r.status || 'Belirtilmedi'), [records]);
  const riskValues = useMemo(() => records.map((r) => r.riskScore || 'Risk Belirtilmedi'), [records]);
  const categoryValues = useMemo(() => records.map((r) => r.category || 'Kategorisiz'), [records]);
  const assignedValues = useMemo(() => records.map((r) => r.assignedTo || 'Sorumlu Yok'), [records]);

  const hasActiveFilters = search || Object.values(columnFilters).some((f) => f.length > 0);

  const clearAllFilters = () => {
    setSearch('');
    setColumnFilters({});
  };

  return (
    <div className="space-y-3">
      {/* Tablo Üstü Araç Çubuğu */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 flex-1 max-w-sm">
          <div className="relative w-full">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input
              placeholder="Bulgu, mahal, sorumlu veya aksiyon ara..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 pl-8 text-xs bg-card"
            />
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-muted-foreground font-mono">
            <strong>{filteredRecords.length}</strong> / {records.length} Kayıt
          </span>

          {hasActiveFilters && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={clearAllFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1"
            >
              <X className="w-3 h-3" />
              <span>Filtreleri Temizle</span>
            </Button>
          )}
        </div>
      </div>

      {/* Ana Tablo */}
      <div className="border border-border rounded-xl bg-card overflow-hidden shadow-sm">
        <div className="overflow-x-auto max-h-[calc(100vh-280px)] overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse min-w-[1250px]">
            <thead className="bg-muted/50 sticky top-0 z-20 text-[11px] font-semibold text-muted-foreground border-b border-border select-none">
              <tr>
                {/* Sıra No */}
                <th className="py-2.5 px-3 w-14 text-center sticky left-0 z-30 bg-muted/60">
                  #
                </th>

                {/* Hastane */}
                <th className="py-2.5 px-3 w-40">
                  <div className="flex items-center justify-between gap-1">
                    <span>Hastane</span>
                    <ColumnFilterPopover
                      columnLabel="Hastane"
                      values={facilityValues}
                      selectedValues={columnFilters.facility || []}
                      onFilterChange={(sel) => handleFilterChange('facility', sel)}
                      onSort={(dir) => handleSort('facility', dir)}
                    />
                  </div>
                </th>

                {/* Tespit / Uygunsuzluk */}
                <th className="py-2.5 px-3 min-w-[340px]">
                  <span>Tespit / Uygunsuzluk</span>
                </th>

                {/* Kategori */}
                <th className="py-2.5 px-3 w-36">
                  <div className="flex items-center justify-between gap-1">
                    <span>Kategori</span>
                    <ColumnFilterPopover
                      columnLabel="Kategori"
                      values={categoryValues}
                      selectedValues={columnFilters.category || []}
                      onFilterChange={(sel) => handleFilterChange('category', sel)}
                      onSort={(dir) => handleSort('category', dir)}
                    />
                  </div>
                </th>

                {/* Risk */}
                <th className="py-2.5 px-3 w-28 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>Risk</span>
                    <ColumnFilterPopover
                      columnLabel="Risk"
                      values={riskValues}
                      selectedValues={columnFilters.riskScore || []}
                      onFilterChange={(sel) => handleFilterChange('riskScore', sel)}
                    />
                  </div>
                </th>

                {/* Sorumlu */}
                <th className="py-2.5 px-3 w-36">
                  <div className="flex items-center justify-between gap-1">
                    <span>Sorumlu</span>
                    <ColumnFilterPopover
                      columnLabel="Sorumlu"
                      values={assignedValues}
                      selectedValues={columnFilters.assignedTo || []}
                      onFilterChange={(sel) => handleFilterChange('assignedTo', sel)}
                    />
                  </div>
                </th>

                {/* Durum */}
                <th className="py-2.5 px-3 w-32 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <span>Durum</span>
                    <ColumnFilterPopover
                      columnLabel="Durum"
                      values={statusValues}
                      selectedValues={columnFilters.status || []}
                      onFilterChange={(sel) => handleFilterChange('status', sel)}
                    />
                  </div>
                </th>

                {/* Termin / Tarih */}
                <th className="py-2.5 px-3 w-28 text-center">
                  <span>Termin</span>
                </th>

                {/* Aksiyon / Açıklama */}
                <th className="py-2.5 px-3 min-w-[280px]">
                  <span>Planlanan Aksiyon / Güncel Durum</span>
                </th>

                {/* SABİT (STICKY) İŞLEMLER SÜTUNU (100px) */}
                <th className="py-2.5 px-2 w-[100px] min-w-[100px] text-center sticky right-0 z-30 bg-muted/95 border-l border-border shadow-[-4px_0_10px_rgba(0,0,0,0.03)]">
                  İşlem
                </th>
              </tr>
            </thead>

            <tbody className="divide-y divide-border">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-muted-foreground text-xs">
                    {isLoading ? 'Veriler yükleniyor...' : 'Eşleşen kayıt bulunamadı.'}
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const photosCount = record.photos?.length || 0;

                  return (
                    <tr
                      key={record.id}
                      className="hover:bg-muted/20 transition-colors group"
                    >
                      {/* Sıra No */}
                      <td className="py-2.5 px-2 text-center font-mono text-[11px] text-muted-foreground sticky left-0 bg-card group-hover:bg-muted/20 border-r border-border/50">
                        {record.rowNo || '-'}
                      </td>

                      {/* Hastane */}
                      <td className="py-2.5 px-3 font-medium text-foreground">
                        <span className="truncate block max-w-[150px]" title={record.facility?.name}>
                          {record.facility?.shortName || record.facility?.name || '-'}
                        </span>
                      </td>

                      {/* Tespit / Uygunsuzluk (4 Satır Clamp ve Fotoğraf Rozeti) */}
                      <td className="py-2.5 px-3">
                        <div className="space-y-1">
                          <p
                            className="text-foreground text-[11px] leading-relaxed line-clamp-4 overflow-hidden break-words"
                            title={record.finding}
                          >
                            {record.finding}
                          </p>

                          <div className="flex items-center gap-2 flex-wrap">
                            {record.location && (
                              <span className="text-[10px] text-muted-foreground">
                                📍 {record.location}
                              </span>
                            )}
                            {record.equipment && (
                              <span className="text-[10px] text-muted-foreground">
                                ⚙️ {record.equipment}
                              </span>
                            )}
                            {photosCount > 0 && (
                              <Badge
                                variant="outline"
                                className="text-[9px] px-1.5 py-0 h-4 gap-1 text-primary border-primary/30 bg-primary/5"
                              >
                                <ImageIcon className="w-2.5 h-2.5" />
                                <span>{photosCount} Fotoğraf</span>
                              </Badge>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                        <span className="truncate block max-w-[130px]" title={record.category || ''}>
                          {record.category || '-'}
                        </span>
                      </td>

                      {/* Risk */}
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 font-semibold ${
                            record.riskScore === 'Kritik' || record.riskScore === 'Çok Yüksek'
                              ? 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-300'
                              : record.riskScore === 'Yüksek'
                              ? 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border-orange-300'
                              : record.riskScore === 'Önemli'
                              ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300'
                              : 'bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-300'
                          }`}
                        >
                          {record.riskScore || 'Belirtilmedi'}
                        </Badge>
                      </td>

                      {/* Sorumlu */}
                      <td className="py-2.5 px-3 text-muted-foreground text-[11px]">
                        <span className="truncate block max-w-[130px]" title={record.assignedTo || ''}>
                          {record.assignedTo || '-'}
                        </span>
                      </td>

                      {/* Durum */}
                      <td className="py-2.5 px-3 text-center">
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-2 py-0.5 font-semibold ${
                            record.status === 'Tamamlandı'
                              ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-300'
                              : record.status === 'Devam Ediyor'
                              ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-300'
                              : record.status === 'İptal Edildi'
                              ? 'bg-muted text-muted-foreground'
                              : 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-300'
                          }`}
                        >
                          {record.status || 'Başlamadı'}
                        </Badge>
                      </td>

                      {/* Termin */}
                      <td className="py-2.5 px-3 text-center font-mono text-[11px] text-muted-foreground">
                        {record.dueDate ? new Date(record.dueDate).toLocaleDateString('tr-TR') : '-'}
                      </td>

                      {/* Planlanan Aksiyon / Güncel Not */}
                      <td className="py-2.5 px-3">
                        <p
                          className="text-muted-foreground text-[11px] leading-relaxed line-clamp-4 overflow-hidden break-words"
                          title={record.currentNote || record.actionPlan || ''}
                        >
                          {record.currentNote || record.actionPlan || '-'}
                        </p>
                      </td>

                      {/* SABİT (STICKY) İŞLEM SÜTUNU (3 Alt Alta Kompakt Buton) */}
                      <td className="py-2 px-1 text-center sticky right-0 bg-card group-hover:bg-muted/30 border-l border-border shadow-[-4px_0_10px_rgba(0,0,0,0.03)] z-10">
                        <div className="flex flex-col gap-1 w-full max-w-[88px] mx-auto">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => onInspect(record)}
                            className="h-6 px-2 text-[10px] justify-center"
                          >
                            <Eye className="w-3 h-3 mr-1 text-primary" />
                            İncele
                          </Button>
                          <Button
                            type="button"
                            variant="secondary"
                            size="sm"
                            onClick={() => onAction(record)}
                            className="h-6 px-2 text-[10px] justify-center text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 border border-emerald-200 dark:border-emerald-800"
                          >
                            <MessageSquarePlus className="w-3 h-3 mr-1" />
                            Aksiyon
                          </Button>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => onEdit(record)}
                            className="h-6 px-2 text-[10px] justify-center text-muted-foreground hover:text-foreground"
                          >
                            <Edit3 className="w-3 h-3 mr-1" />
                            Düzenle
                          </Button>
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
    </div>
  );
};
