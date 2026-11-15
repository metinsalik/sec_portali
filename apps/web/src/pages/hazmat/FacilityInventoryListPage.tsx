import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Plus,
  Search,
  Printer,
  Loader2,
  Sparkles,
  Clock,
  Pencil,
  X,
  PackageOpen,
  Building2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { HazmatMaterialSummaryDialog } from '@/components/hazmat/HazmatMaterialSummaryDialog';
import { HazmatAddFromPoolModal } from '@/components/hazmat/HazmatAddFromPoolModal';

export default function FacilityInventoryListPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const activeFacilityId = useActiveFacility();

  const currentEffectiveFacilityId = activeFacilityId || localStorage.getItem('activeFacilityId') || 'all';
  const isManagerOrAdmin = Boolean(user?.isAdmin || user?.isManagement || currentEffectiveFacilityId === 'all');

  // Filters state
  const [searchMaterial, setSearchMaterial] = useState('');
  const [searchAdrCategory, setSearchAdrCategory] = useState('all');
  const [filterEditStatus, setFilterEditStatus] = useState<'ALL' | 'WITHIN_3H' | 'WITHIN_6H' | 'NOT_UPDATED'>('ALL');
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

  // Dialog state
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Havuzdan Madde Ekle Modalı State
  const [isAddFromPoolOpen, setIsAddFromPoolOpen] = useState(false);

  // 1. Fetch summary for the active facility
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['inventory-summary', currentEffectiveFacilityId],
    queryFn: async () => {
      const res = await api.get(`/hazmat/inventory/summary?facilityId=${encodeURIComponent(currentEffectiveFacilityId)}`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      return data.facilityItems || [];
    },
    refetchOnMount: 'always'
  });

  // 2. Fetch ADR categories
  const { data: adrCategories = [] } = useQuery({
    queryKey: ['hazmat-hazard-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/hazard-labels');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const groupedSummary = useMemo(() => {
    if (!summaryData) return [];

    const materialMap = new Map<string, any>();

    for (const facItem of summaryData) {
      const mat = facItem.material;
      if (!mat || !mat.id) continue;

      const facilityInfo = {
        facilityId: facItem.facilityId,
        facilityName: facItem.facility?.name || '',
        amountValue: facItem.amountValue,
        unitName: facItem.unit?.name,
        unitSymbol: facItem.unit?.symbol
      };

      const existing = materialMap.get(mat.id);
      if (!existing) {
        const departments = (mat.inventory || [])
          .filter((invItem: any) => invItem.location || invItem.department)
          .map((invItem: any) => {
            const dept = invItem.location || invItem.department;
            const deptName = `${dept.isCleaningCart ? '[Temizlik Arabası] ' : ''}${dept.building ? dept.building + ' / ' : ''}${dept.floor ? dept.floor + ' / ' : ''}${dept.department ? dept.department + ' / ' : ''}${dept.name || dept.description || ''}`.trim().replace(/\/$/, '').trim() || 'İsimsiz Lokasyon';
            return {
              id: dept.id,
              name: deptName
            };
          });

        materialMap.set(mat.id, {
          materialId: mat.id,
          productName: mat.productName,
          brandName: mat.brandName,
          categoryName: mat.category?.name || 'Kategorisiz',
          hazardLabels: mat.hazardLabels || [],
          adrLabels: mat.adrLabels || [],
          ppes: mat.ppes || [],
          sdsUrl: mat.sdsUrl,
          departments,
          material: mat,
          auditLogs: mat.auditLogs || [],
          updatedAt: mat.updatedAt,
          createdAt: mat.createdAt,
          amountValue: facItem.amountValue,
          unitName: facItem.unit?.name,
          unitSymbol: facItem.unit?.symbol,
          facilityName: facItem.facility?.name || '',
          facilityId: facItem.facilityId || '',
          facilities: [facilityInfo]
        });
      } else {
        // Madde zaten varsa, tesis listesine ekle ve eksik miktar bilgisini tamamla
        if (!existing.facilities.some((f: any) => f.facilityId === facItem.facilityId)) {
          existing.facilities.push(facilityInfo);
        }
        if (!existing.amountValue && facItem.amountValue) {
          existing.amountValue = facItem.amountValue;
          existing.unitName = facItem.unit?.name;
          existing.unitSymbol = facItem.unit?.symbol;
        }
      }
    }

    return Array.from(materialMap.values());
  }, [summaryData]);

  const getUpdateStatus = (item: any) => {
    const isInstant = justUpdatedId === item.materialId;
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

  // Resolved labels for SelectTriggers (so they NEVER show raw 'all' or 'ALL')
  const adrCategoryLabel = useMemo(() => {
    if (searchAdrCategory === 'all') return 'Tüm ADR Kategorileri';
    const found = adrCategories.find((c: any) => c.id === searchAdrCategory);
    return found ? found.name : 'Tüm ADR Kategorileri';
  }, [searchAdrCategory, adrCategories]);

  const editStatusLabel = useMemo(() => {
    if (filterEditStatus === 'ALL') return 'Tüm Güncelleme Durumları';
    if (filterEditStatus === 'WITHIN_3H') return '⚡ Son 3 Saatte Düzenlenen';
    if (filterEditStatus === 'WITHIN_6H') return '🕒 Son 6 Saatte Düzenlenen';
    if (filterEditStatus === 'NOT_UPDATED') return 'İşlem Görmemişler';
    return 'Tüm Güncelleme Durumları';
  }, [filterEditStatus]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    if (!groupedSummary) return [];
    let filtered = groupedSummary;

    if (searchMaterial) {
      const q = searchMaterial.toLowerCase().trim();
      filtered = filtered.filter((g: any) =>
        g.productName?.toLowerCase().includes(q) ||
        g.brandName?.toLowerCase().includes(q)
      );
    }

    if (searchAdrCategory !== 'all') {
      filtered = filtered.filter((g: any) =>
        g.hazardLabels.some((hl: any) => hl.label?.id === searchAdrCategory)
      );
    }

    if (filterEditStatus !== 'ALL') {
      filtered = filtered.filter((g: any) => {
        const status = getUpdateStatus(g);
        if (filterEditStatus === 'WITHIN_3H') return status.type === '3H' || status.isInstant;
        if (filterEditStatus === 'WITHIN_6H') return status.type === '3H' || status.type === '6H' || status.isInstant;
        if (filterEditStatus === 'NOT_UPDATED') return !status.hasEverBeenUpdated && !status.isInstant;
        return true;
      });
    }

    return filtered;
  }, [groupedSummary, searchMaterial, searchAdrCategory, filterEditStatus, justUpdatedId]);

  const hasActiveFilters = Boolean(
    searchMaterial ||
    searchAdrCategory !== 'all' ||
    filterEditStatus !== 'ALL'
  );

  const resetFilters = () => {
    setSearchMaterial('');
    setSearchAdrCategory('all');
    setFilterEditStatus('ALL');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12 font-sans antialiased">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Tesis Envanteri
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Tesisteki tehlikeli maddeleri listeleyin ve havuzdan yeni kimyasallar ekleyin.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Button
            onClick={() => setIsAddFromPoolOpen(true)}
            className="shadow-sm gap-2 h-9 text-xs font-semibold"
          >
            <Plus className="w-4 h-4" />
            Havuzdan Tesise Ekle
          </Button>
        </div>
      </div>

      {/* Modern Filter Toolbar (3 clean filters) */}
      <div className="bg-card border border-border/70 rounded-xl p-3.5 shadow-2xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search Material */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
            <Input
              placeholder="Madde veya Marka Ara..."
              className="pl-9 h-9 text-xs bg-background"
              value={searchMaterial}
              onChange={(e) => setSearchMaterial(e.target.value)}
            />
          </div>

          {/* ADR Category Select */}
          <div>
            <Select value={searchAdrCategory} onValueChange={setSearchAdrCategory}>
              <SelectTrigger className="w-full h-9 bg-background text-xs">
                <SelectValue>{adrCategoryLabel}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tüm ADR Kategorileri</SelectItem>
                {adrCategories.map((cat: any) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
        </div>

        {/* Clear Filters bar if active */}
        {hasActiveFilters && (
          <div className="flex items-center justify-between pt-1 border-t border-border/40 text-xs">
            <span className="text-muted-foreground">
              Filtreler uygulandı: <strong className="text-foreground">{filteredGroups.length}</strong> kayıt listeleniyor
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

      {/* Main Inventory Card */}
      <Card className="border border-border/70 shadow-2xs rounded-xl overflow-hidden">
        <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/15">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <CardTitle className="text-base sm:text-lg font-bold text-foreground">
                Envanter Listesi
              </CardTitle>
              <Badge variant="secondary" className="font-semibold text-xs px-2 py-0.5">
                {filteredGroups.length} Madde
              </Badge>
            </div>
            <CardDescription className="text-xs text-muted-foreground">
              Maddenin detaylarını ve güvenlik bilgilerini görüntülemek için satıra tıklayın.
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/40 text-muted-foreground font-semibold uppercase tracking-wider text-[11px] border-b border-border/60">
                <tr>
                  <th className="px-5 py-3">Tehlikeli Madde & Marka</th>
                  <th className="px-5 py-3">Kategori</th>
                  <th className="px-5 py-3">Birim / Miktar</th>
                  <th className="px-5 py-3 text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 font-sans">
                {isLoading ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center text-muted-foreground">
                      <div className="flex flex-col items-center justify-center gap-2.5">
                        <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        <span className="text-xs font-medium">Tesis envanteri yükleniyor...</span>
                      </div>
                    </td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-16 text-center">
                      <div className="flex flex-col items-center justify-center gap-3 max-w-md mx-auto">
                        <div className="w-12 h-12 rounded-full bg-muted/60 flex items-center justify-center text-muted-foreground">
                          {hasActiveFilters ? (
                            <Search className="w-6 h-6" />
                          ) : (
                            <PackageOpen className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">
                            {hasActiveFilters
                              ? 'Arama kriterlerinize uygun kayıt bulunamadı'
                              : 'Bu tesiste henüz kayıtlı tehlikeli madde bulunmuyor'}
                          </p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {hasActiveFilters
                              ? 'Filtreleri temizleyerek veya arama kelimesini değiştirerek tekrar deneyebilirsiniz.'
                              : 'Merkezi kimyasal havuzundaki maddeleri tesisinize eklemek için yukarıdaki butonu kullanabilirsiniz.'}
                          </p>
                        </div>
                        {hasActiveFilters ? (
                          <Button variant="outline" size="sm" onClick={resetFilters} className="text-xs mt-1">
                            Filtreleri Temizle
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => setIsAddFromPoolOpen(true)}
                            className="text-xs gap-1.5 mt-1 shadow-sm"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            Havuzdan Madde Ekle
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((item: any) => {
                    const updateStatus = getUpdateStatus(item);
                    return (
                      <tr
                        key={item.materialId}
                        className={`cursor-pointer group transition-colors duration-150 ${updateStatus.isInstant
                            ? 'bg-emerald-50/60 dark:bg-emerald-950/20'
                            : 'hover:bg-muted/40'
                          }`}
                        onClick={() => setSelectedGroup(item)}
                      >
                        {/* Madde & Marka & Pictograms */}
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {/* Hazard pictograms */}
                            {item.hazardLabels && item.hazardLabels.length > 0 && (
                              <div className="flex -space-x-1.5 shrink-0">
                                {item.hazardLabels.slice(0, 3).map((hl: any) => (
                                  <img
                                    key={hl.label?.id || hl.id}
                                    src={hl.label?.imageUrl}
                                    alt={hl.label?.name}
                                    className="w-7 h-7 rounded-md border border-border/80 object-contain bg-white shadow-2xs p-0.5"
                                    title={hl.label?.name}
                                  />
                                ))}
                              </div>
                            )}

                            <div className="space-y-0.5">
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="font-semibold text-sm text-foreground group-hover:text-primary transition-colors">
                                  {item.productName}
                                </span>

                                {/* Yönetici / Genel Görünüm: Kaç tesiste tanımlı olduğunu belirten rozet */}
                                {isManagerOrAdmin && item.facilities && item.facilities.length > 0 && (
                                  <Badge
                                    variant="outline"
                                    className="text-[10px] font-medium px-2 py-0.5 bg-muted/50 border-border/70 text-muted-foreground flex items-center gap-1 cursor-help hover:bg-muted/80 transition-colors"
                                    title={item.facilities.map((f: any) => f.facilityName || 'Tesis').filter(Boolean).join(', ')}
                                  >
                                    <Building2 className="w-2.5 h-2.5 text-primary/70" />
                                    {item.facilities.length} Tesis
                                  </Badge>
                                )}

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
                          </div>
                        </td>

                        {/* Kategori */}
                        <td className="px-5 py-3.5">
                          <Badge variant="outline" className="font-normal text-[11px] bg-background">
                            {item.categoryName}
                          </Badge>
                        </td>

                        {/* Birim / Miktar */}
                        <td className="px-5 py-3.5">
                          <div className="font-semibold text-foreground text-xs">
                            {item.amountValue ? item.amountValue : '-'}
                          </div>
                          <div className="text-[11px] text-muted-foreground">
                            {item.unitName ? `${item.unitName} ${item.unitSymbol ? `(${item.unitSymbol})` : ''}` : '-'}
                          </div>
                        </td>

                        {/* Aksiyon Butonları */}
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
                              title="Maddeyi Düzenle"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/hazmat/materials/edit/${item.materialId}`, {
                                  state: { returnTo: '/hazmat/inventory' }
                                });
                              }}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-8 w-8 p-0 text-muted-foreground hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 transition-colors"
                              title="Bilgi Kartı Oluştur"
                              onClick={(e) => {
                                e.stopPropagation();
                                setPrintMaterial(item.material);
                              }}
                            >
                              <Printer className="h-4 w-4" />
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
        </CardContent>
      </Card>

      {/* Modals & Dialogs */}
      <PrintCardModal
        isOpen={!!printMaterial}
        onClose={() => setPrintMaterial(null)}
        material={printMaterial}
      />

      <HazmatMaterialSummaryDialog
        material={selectedGroup?.material}
        isOpen={!!selectedGroup}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
        amountValue={selectedGroup?.amountValue}
        unitName={selectedGroup?.unitName}
        departments={selectedGroup?.departments}
        facilities={selectedGroup?.facilities}
        onPrint={() => {
          setSelectedGroup(null);
          setPrintMaterial(selectedGroup?.material);
        }}
        onNavigateToPool={() => {
          setSelectedGroup(null);
          navigate(`/hazmat/materials/view/${selectedGroup?.materialId}`, {
            state: { returnTo: '/hazmat/inventory' }
          });
        }}
        onNavigateToLocations={() => {
          setSelectedGroup(null);
          navigate(`/hazmat/inventory/material/${selectedGroup?.materialId}`, {
            state: { returnTo: '/hazmat/inventory' }
          });
        }}
      />

      <HazmatAddFromPoolModal
        isOpen={isAddFromPoolOpen}
        onOpenChange={setIsAddFromPoolOpen}
        facilityId={currentEffectiveFacilityId}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inventory-summary', currentEffectiveFacilityId] });
        }}
      />
    </div>
  );
}
