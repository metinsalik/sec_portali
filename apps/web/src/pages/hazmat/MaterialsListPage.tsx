import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
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
  Sparkles,
  Clock,
  X,
  PackageOpen
} from 'lucide-react';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';

export default function MaterialsListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isGlobalAdmin = user?.isAdmin || user?.isManagement;

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
  const [globalDeleteId, setGlobalDeleteId] = useState<string | null>(null);
  const [bulkDeleteConfirm, setBulkDeleteConfirm] = useState(false);

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

  // Delete single material from database
  const globalDeleteMutation = useMutation({
    mutationFn: async (materialId: string) => {
      const res = await api.delete(`/hazmat/materials/${materialId}`);
      if (!res.ok) throw new Error('Kalıcı silinemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Tehlikeli madde veritabanından kalıcı olarak silindi.');
      setGlobalDeleteId(null);
      setSelectedIds(prev => prev.filter(id => id !== globalDeleteId));
      queryClient.invalidateQueries({ queryKey: ['global-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
    },
    onError: () => toast.error('Silme işlemi başarısız.')
  });

  // Bulk delete materials from database
  const bulkGlobalDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await api.post(`/hazmat/materials/bulk-delete`, { ids });
      if (!res.ok) throw new Error('Toplu silinemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Seçili maddeler veritabanından silindi.');
      setBulkDeleteConfirm(false);
      setSelectedIds([]);
      queryClient.invalidateQueries({ queryKey: ['global-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
    },
    onError: () => toast.error('Toplu silme işlemi başarısız.')
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

  // Resolved labels for SelectTriggers (so they NEVER show raw 'ALL' or 'all')
  const categoryLabel = useMemo(() => {
    if (filterCategory === 'ALL') return 'Tüm Kategoriler';
    return filterCategory;
  }, [filterCategory]);

  const brandLabel = useMemo(() => {
    if (filterBrand === 'ALL') return 'Tüm Markalar';
    return filterBrand;
  }, [filterBrand]);

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
    <div className="max-w-7xl mx-auto space-y-6 pb-12 font-sans antialiased">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Tehlikeli Maddeler
            </h1>
            <Badge variant="secondary" className="font-semibold text-xs px-2.5 py-0.5">
              {items.length} Kayıt
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Tüm tesisler için tanımlı merkezi tehlikeli madde veritabanı.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => navigate('/hazmat/materials/new')}
            className="shadow-sm gap-2 h-9 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Yeni Ekle
          </Button>
        </div>
      </div>

      {/* Modern Filter Toolbar */}
      <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Ürün Adı veya Marka ara..."
              className="pl-9 h-9 text-xs bg-background"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Edit Status Select */}
          <div>
            <Select value={filterEditStatus} onValueChange={(val: any) => setFilterEditStatus(val)}>
              <SelectTrigger className="w-full h-9 bg-background text-xs">
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

          {/* Category Select */}
          <div>
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-full h-9 bg-background text-xs">
                <SelectValue>{categoryLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Kategoriler</SelectItem>
                {uniqueCategories.map(cat => (
                  <SelectItem key={cat as string} value={cat as string}>
                    {cat as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Brand Select */}
          <div>
            <Select value={filterBrand} onValueChange={setFilterBrand}>
              <SelectTrigger className="w-full h-9 bg-background text-xs">
                <SelectValue>{brandLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Tüm Markalar</SelectItem>
                {uniqueBrands.map(brand => (
                  <SelectItem key={brand as string} value={brand as string}>
                    {brand as string}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Clear Filters bar if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              Filtreler uygulandı: <strong className="text-foreground">{filteredItems.length}</strong> madde listeleniyor
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={resetFilters}
              className="h-7 text-xs text-muted-foreground hover:text-foreground gap-1 px-2"
            >
              <X className="w-3.5 h-3.5" />
              Filtreleri Temizle
            </Button>
          </div>
        )}
      </div>

      {/* Bulk Delete Bar */}
      {selectedIds.length > 0 && isGlobalAdmin && (
        <div className="bg-muted/40 p-3 rounded-xl flex items-center justify-between border border-border/80 shadow-2xs">
          <span className="text-xs font-semibold text-foreground">
            {selectedIds.length} madde seçildi
          </span>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 h-8 text-xs font-semibold"
            onClick={() => setBulkDeleteConfirm(true)}
          >
            <Trash2 className="w-3.5 h-3.5" />
            Seçilenleri Veritabanından Sil
          </Button>
        </div>
      )}

      {/* Materials Table Card */}
      <div className="bg-card border border-border/70 rounded-xl shadow-2xs overflow-hidden">
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
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border/60">
                <tr>
                  {isGlobalAdmin && (
                    <th className="px-4 py-3 w-10 text-center">
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
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors select-none"
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
                    className="px-4 py-3 font-semibold cursor-pointer hover:text-foreground transition-colors select-none"
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
                  <th className="px-4 py-3 font-semibold">Tehlike Etiketleri</th>
                  <th className="px-4 py-3 font-semibold text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {filteredItems.map((item) => {
                  const updateStatus = getUpdateStatus(item);
                  return (
                    <tr
                      key={item.id}
                      className={`transition-colors duration-150 ${
                        updateStatus.isInstant
                          ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                          : 'hover:bg-muted/40'
                      }`}
                    >
                      {/* Checkbox */}
                      {isGlobalAdmin && (
                        <td className="px-4 py-3 text-center">
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
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-semibold text-sm text-foreground">
                              {item.productName}
                            </span>

                            {updateStatus.isInstant && (
                              <span className="inline-flex items-center gap-1 bg-emerald-600 text-white font-bold text-[10px] px-2 py-0.5 rounded-full shadow-2xs animate-pulse">
                                <Sparkles className="w-2.5 h-2.5" />
                                Şimdi Düzenlendi
                              </span>
                            )}

                            {!updateStatus.isInstant && updateStatus.type === '3H' && (
                              <span
                                className="inline-flex items-center gap-1 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium"
                                title={item.updatedAt ? new Date(item.updatedAt).toLocaleString('tr-TR') : ''}
                              >
                                <Clock className="w-2.5 h-2.5 text-amber-600 dark:text-amber-400" />
                                {updateStatus.label}
                              </span>
                            )}

                            {!updateStatus.isInstant && updateStatus.type === '6H' && (
                              <span
                                className="inline-flex items-center gap-1 bg-blue-500/10 text-blue-700 dark:text-blue-300 border border-blue-500/20 text-[10px] px-2 py-0.5 rounded-full font-medium"
                                title={item.updatedAt ? new Date(item.updatedAt).toLocaleString('tr-TR') : ''}
                              >
                                <Clock className="w-2.5 h-2.5 text-blue-600 dark:text-blue-400" />
                                {updateStatus.label}
                              </span>
                            )}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {item.brandName || <span className="italic">Marka Belirtilmemiş</span>}
                          </div>
                        </div>
                      </td>

                      {/* Kategori */}
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal text-[11px] bg-background">
                          {item.category?.name || '-'}
                        </Badge>
                      </td>

                      {/* Tehlike Etiketleri */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {item.hazardLabels && item.hazardLabels.length > 0 ? (
                            item.hazardLabels.slice(0, 4).map((hl: any) => (
                              <img
                                key={hl.label?.id || hl.id}
                                src={hl.label?.imageUrl}
                                alt={hl.label?.name}
                                className="w-7 h-7 rounded-md border border-border/80 object-contain bg-white shadow-2xs p-0.5"
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

                      {/* İşlemler */}
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                            title="Bilgi Kartı Yazdır"
                            onClick={() => setPrintMaterial(item)}
                          >
                            <FileText className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            title="Detay Görüntüle"
                            onClick={() => navigate(`/hazmat/materials/view/${item.id}`)}
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                            title="Düzenle"
                            onClick={() => navigate(`/hazmat/materials/edit/${item.id}`)}
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </Button>
                          {isGlobalAdmin && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                              title="Veritabanından Sil"
                              onClick={() => setGlobalDeleteId(item.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          )}
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

      {/* Single Delete Confirmation */}
      <AlertDialog open={!!globalDeleteId} onOpenChange={(open) => !open && setGlobalDeleteId(null)}>
        <AlertDialogContent className="rounded-2xl border border-border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Tehlikeli Maddeyi Veritabanından Sil</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Bu tehlikeli maddeyi merkezi veritabanından kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-8"
              onClick={() => globalDeleteId && globalDeleteMutation.mutate(globalDeleteId)}
            >
              {globalDeleteMutation.isPending ? 'Siliniyor...' : 'Kalıcı Olarak Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Delete Confirmation */}
      <AlertDialog open={bulkDeleteConfirm} onOpenChange={setBulkDeleteConfirm}>
        <AlertDialogContent className="rounded-2xl border border-border shadow-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold">Toplu Tehlikeli Madde Silme</AlertDialogTitle>
            <AlertDialogDescription className="text-xs text-muted-foreground">
              Seçilen {selectedIds.length} tehlikeli maddeyi merkezi veritabanından kalıcı olarak silmek istediğinize emin misiniz? Bu işlem geri alınamaz.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-xs h-8">İptal</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground text-xs h-8"
              onClick={() => bulkGlobalDeleteMutation.mutate(selectedIds)}
            >
              {bulkGlobalDeleteMutation.isPending ? 'Siliniyor...' : 'Seçilenleri Sil'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Print Modal */}
      <PrintCardModal
        isOpen={!!printMaterial}
        onClose={() => setPrintMaterial(null)}
        material={printMaterial}
      />
    </div>
  );
}
