import { useState, useMemo, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_URL, BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Search,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  ArrowUpDown,
  FileText,
  Info,
  Sparkles,
  Clock,
  X,
  PackageOpen,
  FileSpreadsheet,
  ChevronDown,
  Check,
  Upload
} from 'lucide-react';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { HazmatExcelImportDialog } from '@/components/hazmat/HazmatExcelImportDialog';
import { BulkDeleteConfirmDialog } from '@/components/shared/BulkDeleteConfirmDialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from '@/components/ui/dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { toast } from 'sonner';

interface SearchableFilterPopoverProps {
  value: string;
  onChange: (val: string) => void;
  options: string[];
  allLabel: string;
  searchPlaceholder: string;
}

function SearchableFilterPopover({
  value,
  onChange,
  options,
  allLabel,
  searchPlaceholder,
}: SearchableFilterPopoverProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLocaleLowerCase('tr');
    if (!q) return options;
    return options.filter((opt) => opt.toLocaleLowerCase('tr').includes(q));
  }, [options, query]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery('');
      }}
    >
      <PopoverTrigger
        type="button"
        className="flex h-8 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground outline-none transition-colors hover:bg-muted/30 focus-visible:border-ring focus-visible:ring-2 focus-visible:ring-ring/40"
      >
        <span className="truncate text-left">
          {value === 'ALL' ? allLabel : value}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-64 p-1.5 gap-1.5">
        <div className="relative">
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2 top-1/2 -translate-y-1/2 pointer-events-none" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={searchPlaceholder}
            className="h-7 pl-7 pr-6 text-xs bg-background"
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery('')}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
        <div className="max-h-56 overflow-y-auto space-y-0.5 pr-0.5">
          <button
            type="button"
            onClick={() => {
              onChange('ALL');
              setOpen(false);
            }}
            className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
              value === 'ALL'
                ? 'bg-primary/10 text-primary font-semibold'
                : 'hover:bg-muted text-foreground'
            }`}
          >
            <span className="truncate">{allLabel}</span>
            {value === 'ALL' && <Check className="w-3.5 h-3.5 shrink-0" />}
          </button>
          {filtered.length === 0 ? (
            <div className="px-2 py-3 text-center text-[11px] text-muted-foreground">
              Eşleşen kayıt bulunamadı
            </div>
          ) : (
            filtered.map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => {
                  onChange(opt);
                  setOpen(false);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded-md text-xs text-left transition-colors ${
                  value === opt
                    ? 'bg-primary/10 text-primary font-semibold'
                    : 'hover:bg-muted text-foreground'
                }`}
              >
                <span className="truncate">{opt}</span>
                {value === opt && <Check className="w-3.5 h-3.5 shrink-0" />}
              </button>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}

export default function MaterialsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isGlobalAdmin = user?.isAdmin || user?.isManagement;
  const canBulkImport = !!(
    user?.isAdmin ||
    user?.isManagement ||
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.roles?.includes('safety')
  );
  const [excelImportOpen, setExcelImportOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [filterBrand, setFilterBrand] = useState('ALL');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterEditStatus, setFilterEditStatus] = useState<'ALL' | 'JUST_UPDATED' | 'WITHIN_3H' | 'WITHIN_6H' | 'NOT_UPDATED'>('ALL');
  const [sortField, setSortField] = useState<'name' | 'category'>('name');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [printMaterial, setPrintMaterial] = useState<any>(null);

  const [justUpdatedId, setJustUpdatedId] = useState<string | null>(location.state?.justUpdatedMaterialId || null);

  useEffect(() => {
    if (justUpdatedId) {
      const timer = setTimeout(() => {
        setJustUpdatedId(null);
      }, 15000);
      return () => clearTimeout(timer);
    }
  }, [justUpdatedId]);

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);
  const [sdsPromptMaterial, setSdsPromptMaterial] = useState<any>(null);
  const [sdsUploading, setSdsUploading] = useState(false);
  const sdsFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleQuickSdsUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !sdsPromptMaterial) return;
    setSdsUploading(true);
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', file);
      const token = localStorage.getItem('token');
      const upRes = await fetch(`${API_URL}/hazmat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });
      if (!upRes.ok) throw new Error('SDS PDF yüklenemedi');
      const upData = await upRes.json();

      const patchRes = await api.patch(`/hazmat/materials/${sdsPromptMaterial.id}/sds`, {
        sdsUrl: upData.url,
      });
      if (!patchRes.ok) throw new Error('SDS kaydı güncellenemedi');

      toast.success(`"${sdsPromptMaterial.productName}" için SDS belgesi yüklendi.`);
      setSdsPromptMaterial(null);
      queryClient.invalidateQueries({ queryKey: ['global-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
    } catch (err: any) {
      toast.error(err?.message || 'SDS yüklenirken hata oluştu.');
    } finally {
      setSdsUploading(false);
      e.target.value = '';
    }
  };

  // Fetch all materials from central database
  const { data: items = [], isLoading } = useQuery<any[]>({
    queryKey: ['global-materials-list'],
    queryFn: async () => {
      const res = await api.get('/hazmat/materials/global');
      if (!res.ok) throw new Error('Sunucu hatası');
      const data = await res.json();
      return data.map((item: any) => ({
        ...item.material,
        isInFacility: item.isInFacility,
        facilityAmount: item.facilityAmount,
        facilityUnit: item.facilityUnit,
      }));
    },
    refetchOnMount: 'always',
  });

  // Bulk delete materials from database
  const bulkGlobalDeleteMutation = useMutation({
    mutationFn: async ({ ids, confirmUsername }: { ids: string[]; confirmUsername: string }) => {
      const res = await api.post(`/hazmat/materials/bulk-delete`, { ids, confirmUsername });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Toplu silinemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Seçili maddeler veritabanından silindi.');
      setBulkDeleteConfirm(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['global-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
    },
    onError: (err: any) => toast.error(err.message || 'Toplu silme işlemi başarısız.')
  });

  const uniqueBrands = useMemo(() => {
    const brands = new Set(items.map(item => item.brandName).filter(Boolean));
    return Array.from(brands).sort();
  }, [items]);

  const uniqueCategories = useMemo(() => {
    const categories = new Set(items.map(item => item.category?.name).filter(Boolean));
    return Array.from(categories).sort();
  }, [items]);

  const getUpdateStatus = (item: any) => {
    const isInstant = justUpdatedId === item.id;
    const updateTime = item.updatedAt ? new Date(item.updatedAt).getTime() : 0;
    const createTime = item.createdAt ? new Date(item.createdAt).getTime() : 0;
    const hasAuditUpdate = Boolean(item.auditLogs && item.auditLogs.length > 0);
    const hasTimestampDiff = Boolean(item.updatedAt && Math.abs(updateTime - createTime) > 5000);
    const hasEverBeenUpdated = hasAuditUpdate || hasTimestampDiff;

    if (!item.updatedAt || (!hasEverBeenUpdated && !isInstant)) {
      return { isInstant: false, hasEverBeenUpdated: false, type: 'NONE', label: null };
    }

    const diffMs = Date.now() - updateTime;
    const hoursAgo = diffMs / (1000 * 60 * 60);

    if (hoursAgo <= 3) {
      const minutesAgo = Math.max(1, Math.round(diffMs / (1000 * 60)));
      const timeText = minutesAgo < 60 ? `${minutesAgo} dk önce` : `${Math.floor(hoursAgo)} saat önce`;
      return { isInstant, hasEverBeenUpdated: true, type: '3H', label: `Son 3 Saat (${timeText})` };
    }

    if (hoursAgo <= 6) {
      return { isInstant, hasEverBeenUpdated: true, type: '6H', label: `Son 6 Saat (${Math.floor(hoursAgo)} sa önce)` };
    }

    return { isInstant, hasEverBeenUpdated: true, type: 'OLD', label: null };
  };

  // Resolved label for SelectTrigger (so it NEVER shows raw 'ALL' or 'all')
  const editStatusLabel = useMemo(() => {
    if (filterEditStatus === 'ALL') return 'Tüm Güncelleme Durumları';
    if (filterEditStatus === 'WITHIN_3H') return '⚡ Son 3 Saatte Düzenlenen';
    if (filterEditStatus === 'WITHIN_6H') return '🕒 Son 6 Saatte Düzenlenen';
    if (filterEditStatus === 'NOT_UPDATED') return 'İşlem Görmemişler';
    return 'Tüm Güncelleme Durumları';
  }, [filterEditStatus]);

  const filteredItems = useMemo(() => {
    const result = items.filter(item => {
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q ||
        item.productName?.toLowerCase().includes(q) ||
        item.brandName?.toLowerCase().includes(q);

      const matchesBrand = filterBrand === 'ALL' || item.brandName === filterBrand;
      const matchesCategory = filterCategory === 'ALL' || item.category?.name === filterCategory;

      if (filterEditStatus !== 'ALL') {
        const status = getUpdateStatus(item);
        if (filterEditStatus === 'JUST_UPDATED' && !status.isInstant) return false;
        if (filterEditStatus === 'WITHIN_3H' && status.type !== '3H' && !status.isInstant) return false;
        if (filterEditStatus === 'WITHIN_6H' && status.type !== '3H' && status.type !== '6H' && !status.isInstant) return false;
        if (filterEditStatus === 'NOT_UPDATED' && (status.hasEverBeenUpdated || status.isInstant)) return false;
      }

      return matchesSearch && matchesBrand && matchesCategory;
    });

    result.sort((a, b) => {
      if (sortField === 'name') {
        const nameA = a.productName || '';
        const nameB = b.productName || '';
        return sortOrder === 'asc' ? nameA.localeCompare(nameB) : nameB.localeCompare(nameA);
      } else if (sortField === 'category') {
        const catA = a.category?.name || '';
        const catB = b.category?.name || '';
        return sortOrder === 'asc' ? catA.localeCompare(catB) : catB.localeCompare(catA);
      }
      return 0;
    });

    return result;
  }, [items, searchQuery, filterBrand, filterCategory, filterEditStatus, sortField, sortOrder, justUpdatedId]);

  const hasActiveFilters = Boolean(
    searchQuery ||
    filterBrand !== 'ALL' ||
    filterCategory !== 'ALL' ||
    filterEditStatus !== 'ALL'
  );

  const resetFilters = () => {
    setSearchQuery('');
    setFilterBrand('ALL');
    setFilterCategory('ALL');
    setFilterEditStatus('ALL');
  };

  return (
    <div className="max-w-7xl mx-auto space-y-3.5 pb-8 font-sans antialiased">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Tehlikeli Maddeler
            </h1>
            <Badge variant="secondary" className="font-semibold text-[11px] px-2 py-0 h-5">
              {items.length} Kayıt
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            Tüm tesisler için tanımlı merkezi tehlikeli madde veritabanı.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          {canBulkImport && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setExcelImportOpen(true)}
              className="gap-1.5 h-8 text-xs font-semibold"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-primary" />
              Excel / CSV Şablon &amp; Yükle
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => navigate('/hazmat/materials/new')}
            className="shadow-sm gap-1.5 h-8 text-xs font-semibold"
          >
            <Plus className="w-3.5 h-3.5" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      {/* Modern Compact Filter Toolbar */}
      <div className="bg-card border border-border/70 rounded-lg p-2.5 shadow-2xs space-y-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Ürün Adı veya Marka ara..."
              className="pl-8 h-8 text-xs bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Edit Status Select */}
          <div>
            <Select value={filterEditStatus} onValueChange={(val: any) => setFilterEditStatus(val)}>
              <SelectTrigger className="w-full h-8 bg-background text-xs">
                <SelectValue>{editStatusLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Güncelleme Durumları</SelectItem>
                <SelectItem value="WITHIN_3H">⚡ Son 3 Saatte Düzenlenen</SelectItem>
                <SelectItem value="WITHIN_6H">🕒 Son 6 Saatte Düzenlenen</SelectItem>
                <SelectItem value="NOT_UPDATED">İşlem Görmemişler</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Category Select (Searchable) */}
          <div>
            <SearchableFilterPopover
              value={filterCategory}
              onChange={setFilterCategory}
              options={uniqueCategories as string[]}
              allLabel="Tüm Kategoriler"
              searchPlaceholder="Kategori ara..."
            />
          </div>

          {/* Brand Select (Searchable) */}
          <div>
            <SearchableFilterPopover
              value={filterBrand}
              onChange={setFilterBrand}
              options={uniqueBrands as string[]}
              allLabel="Tüm Markalar"
              searchPlaceholder="Marka ara..."
            />
          </div>
        </div>

        {/* Clear Filters bar if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1.5 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              Filtreler uygulandı: <strong className="text-foreground">{filteredItems.length}</strong> madde listeleniyor
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-6 text-[11px] text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <X className="w-3 h-3" />
              Filtreleri Temizle
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && isGlobalAdmin && (
        <div className="bg-muted/40 px-3 py-2 rounded-lg flex items-center justify-between border border-border/80 shadow-2xs">
          <span className="text-xs font-semibold text-foreground">
            {selectedIds.length} madde seçildi
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 h-7 text-xs font-semibold"
            onClick={() => setBulkDeleteConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Seçilenleri Veritabanından Sil
          </Button>
        </div>
      )}

      {/* Materials Table Card */}
      <div className="bg-card border border-border/70 rounded-lg shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="py-16 text-center text-muted-foreground flex flex-col items-center justify-center gap-2.5">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="text-xs font-medium">Tehlikeli maddeler yükleniyor...</span>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
              {hasActiveFilters ? <Search className="w-6 h-6" /> : <PackageOpen className="w-6 h-6" />}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {hasActiveFilters ? 'Arama kriterlerinize uygun madde bulunamadı' : 'Henüz kayıtlı tehlikeli madde bulunmuyor'}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {hasActiveFilters
                  ? 'Filtreleri temizleyerek tüm maddeleri görüntüleyebilirsiniz.'
                  : 'Yeni Ekle butonunu kullanarak merkezi veritabanına ilk tehlikeli maddeyi ekleyin.'}
              </p>
            </div>
            {hasActiveFilters ? (
              <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs mt-1">
                Filtreleri Temizle
              </Button>
            ) : (
              <Button onClick={() => navigate('/hazmat/materials/new')} size="sm" className="gap-1.5 text-xs mt-1">
                <Plus className="w-3.5 h-3.5" />
                Yeni Ekle
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[10.5px] border-b border-border/60">
                <tr>
                  {isGlobalAdmin && (
                    <th className="px-3 py-2 w-9 text-center">
                      <input
                        type="checkbox"
                        className="rounded border-input text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds(filteredItems.map(i => i.id));
                          else setSelectedIds([]);
                        }}
                        checked={selectedIds.length > 0 && selectedIds.length === filteredItems.length}
                      />
                    </th>
                  )}
                  <th
                    className="px-3 py-2 font-semibold cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => {
                      if (sortField === 'name') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('name');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Madde Adı & Marka</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </th>
                  <th
                    className="px-3 py-2 font-semibold cursor-pointer hover:text-foreground transition-colors select-none"
                    onClick={() => {
                      if (sortField === 'category') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortField('category');
                        setSortOrder('asc');
                      }
                    }}
                  >
                    <div className="flex items-center gap-1.5">
                      <span>Kategori</span>
                      <ArrowUpDown className="w-3 h-3 text-muted-foreground" />
                    </div>
                  </th>
                  <th className="px-3 py-2 font-semibold">Tehlike Etiketleri</th>
                  <th className="px-3 py-2 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {filteredItems.map((item) => {
                  const updateStatus = getUpdateStatus(item);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 ${updateStatus.isInstant
                        ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                        : 'hover:bg-muted/40'
                        }`}
                    >
                      {/* Checkbox */}
                      {isGlobalAdmin && (
                        <td className="px-3 py-2 text-center">
                          <input
                            type="checkbox"
                            className="rounded border-input text-primary focus:ring-primary cursor-pointer w-3.5 h-3.5"
                            checked={selectedIds.includes(item.id)}
                            onChange={(e) => {
                              if (e.target.checked) setSelectedIds(prev => [...prev, item.id]);
                              else setSelectedIds(prev => prev.filter(id => id !== item.id));
                            }}
                          />
                        </td>
                      )}

                      {/* Madde Adı & Marka */}
                      <td className="px-3 py-2">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className="font-semibold text-[13px] text-foreground leading-tight">
                              {item.productName}
                              {item.facilityAmount != null && Number(item.facilityAmount) > 0 && item.facilityUnit && (
                                <span className="font-medium text-muted-foreground ml-1">
                                  ({item.facilityAmount} {item.facilityUnit})
                                </span>
                              )}
                            </span>

                            {updateStatus.isInstant && (
                              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-[10px] px-1.5 py-0.5 rounded-full shadow-2xs animate-pulse">
                                <Sparkles className="w-2.5 h-2.5" />
                                Şimdi Düzenlendi
                              </span>
                            )}

                            {!updateStatus.isInstant && updateStatus.type === '3H' && (
                              <span
                                className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                title={item.updatedAt ? new Date(item.updatedAt).toLocaleString('tr-TR') : ''}
                              >
                                <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                {updateStatus.label}
                              </span>
                            )}

                            {!updateStatus.isInstant && updateStatus.type === '6H' && (
                              <span
                                className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[10px] px-1.5 py-0.5 rounded-full font-medium"
                                title={item.updatedAt ? new Date(item.updatedAt).toLocaleString('tr-TR') : ''}
                              >
                                <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                {updateStatus.label}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground leading-tight">
                            {item.brandName || <span className="italic">Marka Belirtilmemiş</span>}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-3 py-2">
                        <Badge variant="outline" className="font-normal text-[10.5px] bg-background">
                          {item.category?.name || '-'}
                        </Badge>
                      </td>

                      {/* Tehlike Etiketleri */}
                      <td className="px-3 py-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {item.hazardLabels && item.hazardLabels.length > 0 ? (
                            item.hazardLabels.slice(0, 4).map((hl: any) => (
                              <img
                                key={hl.label?.id || hl.id}
                                src={hl.label?.imageUrl}
                                alt={hl.label?.name}
                                className="w-6 h-6 rounded border border-border/80 object-contain bg-white shadow-2xs p-0.5"
                                title={hl.label?.name}
                              />
                            ))
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">-</span>
                          )}
                          {item.hazardLabels?.length > 4 && (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              +{item.hazardLabels.length - 4}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* İşlemler (2 Satır: Üstte SDS + Yazdır, Altta Görüntüle + Düzenle) */}
                      <td className="px-3 py-1.5 text-right">
                        <div className="flex flex-col items-end gap-0.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className={`h-6 w-6 p-0 border transition-colors ${
                                item.sdsUrl
                                  ? 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/30 hover:bg-emerald-500/20'
                                  : 'text-red-600 dark:text-red-400 bg-red-500/10 border-red-500/30 hover:bg-red-500/20'
                              }`}
                              title={item.sdsUrl ? 'SDS Belgesini Görüntüle' : 'SDS henüz yüklenmemiştir'}
                              onClick={() => {
                                if (item.sdsUrl) {
                                  const url = item.sdsUrl.startsWith('http')
                                    ? item.sdsUrl
                                    : `${BASE_URL}${item.sdsUrl}`;
                                  window.open(url, '_blank', 'noopener,noreferrer');
                                } else {
                                  setSdsPromptMaterial(item);
                                }
                              }}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Bilgi Kartı Yazdır"
                              onClick={() => setPrintMaterial(item)}
                            >
                              <Info className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                              title="Detay Görüntüle"
                              onClick={() => navigate(`/hazmat/materials/view/${item.id}`)}
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Düzenle"
                              onClick={() => navigate(`/hazmat/materials/edit/${item.id}`)}
                            >
                              <Pencil className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Bulk Delete Confirmation */}
      <BulkDeleteConfirmDialog
        isOpen={bulkDeleteConfirm && isGlobalAdmin && selectedIds.length > 0}
        onClose={() => setBulkDeleteConfirm(false)}
        onConfirm={(confirmUsername) => bulkGlobalDeleteMutation.mutate({ ids: selectedIds, confirmUsername })}
        title="Toplu Tehlikeli Madde Silme"
        itemCount={selectedIds.length}
        itemName="tehlikeli madde"
        description="Seçilen tehlikeli maddeleri merkezi veritabanından kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz."
        isDeleting={bulkGlobalDeleteMutation.isPending}
      />

      {/* Print Modal */}
      <PrintCardModal
        isOpen={!!printMaterial}
        onClose={() => setPrintMaterial(null)}
        material={printMaterial}
      />

      {/* Excel / CSV Toplu Şablon İndirme & Yükleme Modalı (Yönetici) */}
      <HazmatExcelImportDialog
        open={excelImportOpen}
        onOpenChange={setExcelImportOpen}
      />

      {/* Gizli SDS PDF Seçici */}
      <input
        ref={sdsFileInputRef}
        type="file"
        accept=".pdf,application/pdf"
        className="hidden"
        onChange={handleQuickSdsUpload}
      />

      {/* SDS Eksik Uyarı & Hızlı Yükleme Dialogu */}
      <Dialog
        open={!!sdsPromptMaterial}
        onOpenChange={(open) => !open && !sdsUploading && setSdsPromptMaterial(null)}
      >
        <DialogContent className="sm:max-w-md rounded-lg border border-border bg-card p-0 overflow-hidden shadow-lg gap-0">
          <DialogHeader className="px-5 py-3.5 bg-muted/30 border-b border-border">
            <DialogTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
              <span className="w-7 h-7 rounded-md bg-red-500/15 text-red-600 dark:text-red-400 border border-red-500/30 flex items-center justify-center shrink-0">
                <FileText className="w-4 h-4" />
              </span>
              SDS Belgesi Bulunamadı
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground pt-1">
              <strong className="text-foreground">{sdsPromptMaterial?.productName}</strong> için henüz Güvenlik Bilgi Formu (SDS) yüklenmemiştir. Şimdi PDF olarak yüklemek ister misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mx-0 mb-0 rounded-none px-5 py-3 bg-muted/20 border-t border-border flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={sdsUploading}
              onClick={() => setSdsPromptMaterial(null)}
              className="h-8 text-xs"
            >
              İptal
            </Button>
            <Button
              type="button"
              size="sm"
              disabled={sdsUploading}
              onClick={() => sdsFileInputRef.current?.click()}
              className="h-8 text-xs gap-1.5"
            >
              {sdsUploading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                <>
                  <Upload className="w-3.5 h-3.5" />
                  SDS Yükle (PDF)
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
