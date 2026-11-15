import React, { useState, useMemo, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Search,
  Plus,
  Check,
  Loader2,
  CheckCircle2,
  Layers,
  Sparkles,
  Building2,
} from 'lucide-react';
import { toast } from 'sonner';

interface HazmatAddFromPoolModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  onSuccess?: () => void;
}

export const HazmatAddFromPoolModal: React.FC<HazmatAddFromPoolModalProps> = ({
  isOpen,
  onOpenChange,
  facilityId,
  onSuccess,
}) => {
  const queryClient = useQueryClient();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [selectedMaterialIds, setSelectedMaterialIds] = useState<string[]>([]);
  const [addingSingleId, setAddingSingleId] = useState<string | null>(null);

  // Fetch facilities list in case facilityId is 'all' or empty
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities-list'],
    queryFn: async () => {
      const res = await api.get('/risks/facilities');
      if (!res.ok) return [];
      return res.json();
    },
    enabled: isOpen,
  });

  const [targetFacilityId, setTargetFacilityId] = useState<string>(() => {
    if (facilityId && facilityId !== 'all') return facilityId;
    return '';
  });

  useEffect(() => {
    if (facilityId && facilityId !== 'all') {
      setTargetFacilityId(facilityId);
    } else if (!targetFacilityId && facilities.length > 0) {
      setTargetFacilityId(facilities[0].id);
    }
  }, [facilityId, facilities, targetFacilityId]);

  const effectiveFacilityId = (facilityId && facilityId !== 'all') ? facilityId : targetFacilityId;

  // Always fetch global materials pool
  const { data: poolItems = [], isLoading } = useQuery<any[]>({
    queryKey: ['global-materials-pool', effectiveFacilityId],
    queryFn: async () => {
      const url = effectiveFacilityId
        ? `/hazmat/materials/global?facilityId=${encodeURIComponent(effectiveFacilityId)}`
        : `/hazmat/materials/global`;
      const res = await api.get(url);
      if (!res.ok) throw new Error('Kimyasal havuzu yüklenemedi');
      return res.json();
    },
    enabled: isOpen,
  });

  // Extract unique categories for filter
  const categories = useMemo(() => {
    const map = new Map<string, string>();
    poolItems.forEach((item: any) => {
      if (item.material?.category?.id && item.material?.category?.name) {
        map.set(item.material.category.id, item.material.category.name);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name }));
  }, [poolItems]);

  // Filtered pool items (NO hidden materials by default - all are shown)
  const filteredItems = useMemo(() => {
    return poolItems.filter((item: any) => {
      const mat = item.material;
      if (!mat) return false;

      // Filter by category
      if (selectedCategory !== 'ALL' && mat.category?.id !== selectedCategory) {
        return false;
      }

      // Filter by search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const pName = mat.productName?.toLowerCase() || '';
        const bName = mat.brandName?.toLowerCase() || '';
        const cName = mat.category?.name?.toLowerCase() || '';
        return pName.includes(q) || bName.includes(q) || cName.includes(q);
      }

      return true;
    });
  }, [poolItems, selectedCategory, searchQuery]);

  // Bulk add mutation
  const bulkAddMutation = useMutation({
    mutationFn: async (materialIds: string[]) => {
      if (!effectiveFacilityId) {
        throw new Error('Lütfen önce bir hedef tesis seçiniz');
      }
      const res = await api.post('/hazmat/materials/bulk-add-to-facility', {
        facilityId: effectiveFacilityId,
        materialIds,
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Maddeler tesise eklenemedi');
      }
      return res.json();
    },
    onSuccess: (data, variables) => {
      const count = variables.length;
      toast.success(
        count === 1
          ? '1 kimyasal madde başarıyla tesise eklendi.'
          : `${count} kimyasal madde başarıyla tesise eklendi.`
      );
      setSelectedMaterialIds([]);
      setAddingSingleId(null);
      // Invalidate queries so lists update in real time
      queryClient.invalidateQueries({ queryKey: ['inventory-summary', effectiveFacilityId] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials', effectiveFacilityId] });
      queryClient.invalidateQueries({ queryKey: ['global-materials-pool', effectiveFacilityId] });
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      setAddingSingleId(null);
      toast.error(err.message || 'Eklenirken bir hata oluştu');
    },
  });

  // Toggle single material checkbox selection
  const handleToggleSelect = (materialId: string) => {
    setSelectedMaterialIds(prev =>
      prev.includes(materialId) ? prev.filter(id => id !== materialId) : [...prev, materialId]
    );
  };

  // Select all visible selectable materials
  const handleToggleSelectAll = () => {
    const selectable = filteredItems
      .filter((i: any) => !i.isInFacility)
      .map((i: any) => i.material.id);

    const isAllSelected = selectable.length > 0 && selectable.every(id => selectedMaterialIds.includes(id));

    if (isAllSelected) {
      setSelectedMaterialIds(prev => prev.filter(id => !selectable.includes(id)));
    } else {
      setSelectedMaterialIds(prev => Array.from(new Set([...prev, ...selectable])));
    }
  };

  // Single-click direct add
  const handleAddSingle = (materialId: string) => {
    setAddingSingleId(materialId);
    bulkAddMutation.mutate([materialId]);
  };

  // Bulk add selected
  const handleAddSelected = () => {
    if (selectedMaterialIds.length === 0) return;
    bulkAddMutation.mutate(selectedMaterialIds);
  };

  const selectableCount = filteredItems.filter((i: any) => !i.isInFacility).length;
  const isAllSelectableChecked =
    selectableCount > 0 &&
    filteredItems.filter((i: any) => !i.isInFacility).every((i: any) => selectedMaterialIds.includes(i.material.id));

  // Find facility name
  const currentFacilityName = useMemo(() => {
    const found = facilities.find((f: any) => f.id === effectiveFacilityId);
    return found ? found.name : effectiveFacilityId;
  }, [facilities, effectiveFacilityId]);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] flex flex-col p-0 overflow-hidden sm:rounded-2xl">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b bg-muted/20 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center font-bold">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2">
                Havuzdan Tesise Kimyasal Madde Ekle
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Merkezi kimyasal havuzundaki tüm maddeler aşağıda listelenmiştir. Tekli veya çoklu seçimle tesisinize ekleyebilirsiniz.
              </DialogDescription>
            </div>
          </div>

          {/* Facility warning / selector if no specific facility is selected */}
          {(!facilityId || facilityId === 'all') && facilities.length > 0 && (
            <div className="mt-3 p-3 bg-primary/10 border border-primary/20 rounded-xl flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-primary shrink-0" />
                <span className="font-semibold text-foreground">
                  Kimyasal eklenecek tesis:
                </span>
              </div>
              <select
                value={targetFacilityId}
                onChange={e => setTargetFacilityId(e.target.value)}
                className="h-8 px-3 text-xs rounded-lg border bg-background text-foreground font-semibold outline-none focus:ring-1 focus:ring-primary"
              >
                {facilities.map((fac: any) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Search & Category Filter Toolbar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 pt-1">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Havuzda ara (ürün adı, marka veya kategori)..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9 bg-background h-9 text-xs"
                autoFocus
              />
            </div>

            {categories.length > 0 && (
              <select
                value={selectedCategory}
                onChange={e => setSelectedCategory(e.target.value)}
                className="h-9 px-3 text-xs rounded-md border border-input bg-background text-foreground shrink-0 outline-none focus:ring-1 focus:ring-primary"
              >
                <option value="ALL">Tüm Kategoriler ({categories.length})</option>
                {categories.map(c => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </DialogHeader>

        {/* Multi-Selection Control Bar */}
        <div className="px-6 py-2.5 bg-muted/40 border-b flex items-center justify-between gap-3 shrink-0 text-xs">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 font-semibold cursor-pointer select-none">
              <Checkbox
                checked={isAllSelectableChecked}
                onCheckedChange={handleToggleSelectAll}
                disabled={selectableCount === 0}
              />
              <span>Tümünü Seç ({selectableCount} Eklenebilir)</span>
            </label>

            {selectedMaterialIds.length > 0 && (
              <Badge variant="secondary" className="bg-primary/10 text-primary border border-primary/20 font-bold px-2 py-0.5">
                {selectedMaterialIds.length} Madde İşaretlendi
              </Badge>
            )}
          </div>

          <Button
            size="sm"
            onClick={handleAddSelected}
            disabled={selectedMaterialIds.length === 0 || bulkAddMutation.isPending}
            className="h-8 text-xs font-semibold gap-1.5 shadow-sm"
          >
            {bulkAddMutation.isPending && !addingSingleId ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Sparkles className="w-3.5 h-3.5" />
            )}
            Seçilenleri Tesise Ekle ({selectedMaterialIds.length})
          </Button>
        </div>

        {/* Pool Materials List Table */}
        <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[500px]">
          {isLoading ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-3">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="text-xs font-medium">Kimyasal havuzu yükleniyor...</span>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center text-muted-foreground flex flex-col items-center gap-2">
              <Layers className="w-8 h-8 text-muted-foreground/50" />
              <p className="text-sm font-semibold">Havuzda uygun kimyasal bulunamadı</p>
              <p className="text-xs text-muted-foreground max-w-sm">
                {searchQuery
                  ? `"${searchQuery}" aramanıza uygun bir kimyasal bulunamadı.`
                  : 'Havuzda henüz kayıtlı kimyasal madde bulunmuyor.'}
              </p>
            </div>
          ) : (
            <table className="w-full text-xs text-left border-collapse">
              <thead className="bg-muted/60 text-muted-foreground sticky top-0 z-10 border-b shadow-2xs">
                <tr>
                  <th className="w-10 px-4 py-2.5 text-center">Seç</th>
                  <th className="px-4 py-2.5 font-semibold">Tehlikeli Madde & Marka</th>
                  <th className="px-4 py-2.5 font-semibold">Kategori</th>
                  <th className="px-4 py-2.5 font-semibold">Tehlike İşaretleri</th>
                  <th className="px-4 py-2.5 font-semibold text-center">Tesis Durumu</th>
                  <th className="px-4 py-2.5 font-semibold text-right">İşlem</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60">
                {filteredItems.map((item: any) => {
                  const mat = item.material;
                  const isInFacility = !!item.isInFacility;
                  const isChecked = selectedMaterialIds.includes(mat.id);
                  const isBeingAdded = addingSingleId === mat.id && bulkAddMutation.isPending;

                  return (
                    <tr
                      key={mat.id}
                      onClick={() => !isInFacility && handleToggleSelect(mat.id)}
                      className={`transition-colors ${isInFacility
                          ? 'bg-muted/10 hover:bg-muted/20'
                          : isChecked
                            ? 'bg-primary/5 hover:bg-primary/10 cursor-pointer'
                            : 'hover:bg-muted/30 cursor-pointer'
                        }`}
                    >
                      {/* Checkbox */}
                      <td className="px-4 py-3 text-center" onClick={e => e.stopPropagation()}>
                        <Checkbox
                          checked={isInFacility || isChecked}
                          disabled={isInFacility}
                          onCheckedChange={() => !isInFacility && handleToggleSelect(mat.id)}
                        />
                      </td>

                      {/* Product Name & Brand */}
                      <td className="px-4 py-3">
                        <div className="space-y-0.5">
                          <p className="font-bold text-foreground text-sm leading-tight">
                            {mat.productName}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {mat.brandName || <span className="italic">Marka belirtilmemiş</span>}
                          </p>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal text-[11px] bg-background">
                          {mat.category?.name || 'Kategorisiz'}
                        </Badge>
                      </td>

                      {/* Hazard Pictograms */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {Array.isArray(mat.hazardLabels) && mat.hazardLabels.length > 0 ? (
                            mat.hazardLabels.slice(0, 3).map((hl: any) => (
                              <img
                                key={hl.label?.id || hl.id}
                                src={hl.label?.imageUrl}
                                alt={hl.label?.name}
                                title={hl.label?.name}
                                className="w-6 h-6 object-contain rounded border bg-white p-0.5 shadow-2xs"
                              />
                            ))
                          ) : (
                            <span className="text-muted-foreground italic text-[11px]">-</span>
                          )}
                          {mat.hazardLabels?.length > 3 && (
                            <span className="text-[10px] text-muted-foreground font-semibold">
                              +{mat.hazardLabels.length - 3}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status Badge: Tesiste var */}
                      <td className="px-4 py-3 text-center">
                        {isInFacility ? (
                          <Badge className="bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800 text-xs font-bold gap-1 shadow-2xs">
                            <Check className="w-3.5 h-3.5 text-emerald-600 stroke-[2.5]" />
                            Tesiste var
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-muted-foreground text-[11px]">
                            Tesiste yok
                          </Badge>
                        )}
                      </td>

                      {/* Single Add Action */}
                      <td className="px-4 py-3 text-right" onClick={e => e.stopPropagation()}>
                        {isInFacility ? (
                          <span className="text-xs text-emerald-700 dark:text-emerald-400 font-semibold flex items-center justify-end gap-1">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            Ekli
                          </span>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAddSingle(mat.id)}
                            disabled={isBeingAdded || bulkAddMutation.isPending}
                            className="h-7 text-xs font-semibold gap-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-2xs"
                          >
                            {isBeingAdded ? (
                              <Loader2 className="w-3 h-3 animate-spin" />
                            ) : (
                              <Plus className="w-3 h-3" />
                            )}
                            Tesise Ekle
                          </Button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 px-6 border-t bg-muted/20 flex items-center justify-between gap-4 shrink-0 text-xs">
          <div className="text-muted-foreground flex items-center gap-2">
            <span>
              Toplam Havuz: <strong>{poolItems.length}</strong> madde
            </span>
            <span>•</span>
            <span>
              Hedef Tesis: <strong className="text-foreground">{currentFacilityName}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
            >
              Kapat
            </Button>

            {selectedMaterialIds.length > 0 && (
              <Button
                type="button"
                size="sm"
                onClick={handleAddSelected}
                disabled={bulkAddMutation.isPending}
                className="font-semibold gap-1.5"
              >
                {bulkAddMutation.isPending && !addingSingleId ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Plus className="w-3.5 h-3.5" />
                )}
                Seçilenleri Tesise Ekle ({selectedMaterialIds.length})
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
