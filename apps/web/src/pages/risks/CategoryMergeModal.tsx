import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Merge, ArrowRight, AlertCircle, Loader2, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  facilityRisks: any[];
  initialMergeType?: 'mainCategory' | 'subCategory';
  initialSourceCategory?: string;
  initialSourceMainCategory?: string;
  onSuccess?: () => void;
}

export default function CategoryMergeModal({
  open,
  onOpenChange,
  facilityId,
  facilityRisks,
  initialMergeType = 'subCategory',
  initialSourceCategory = '',
  initialSourceMainCategory = '',
  onSuccess
}: Props) {
  const token = localStorage.getItem('token');
  const [mergeType, setMergeType] = useState<'mainCategory' | 'subCategory'>(initialMergeType);
  const [sourceName, setSourceName] = useState(initialSourceCategory);
  const [targetName, setTargetName] = useState('');
  const [customTargetName, setCustomTargetName] = useState('');
  const [isCustomTarget, setIsCustomTarget] = useState(false);
  const [sourceMainCategory, setSourceMainCategory] = useState(initialSourceMainCategory);
  const [targetMainCategory, setTargetMainCategory] = useState(initialSourceMainCategory);
  const [loading, setLoading] = useState(false);

  // Modal her açıldığında veya başlangıç parametreleri değiştiğinde state'leri senkronize et
  React.useEffect(() => {
    if (open) {
      setMergeType(initialMergeType);
      setSourceName(initialSourceCategory);
      setSourceMainCategory(initialSourceMainCategory);
      setTargetMainCategory(initialSourceMainCategory);
      setTargetName('');
      setCustomTargetName('');
      setIsCustomTarget(false);
    }
  }, [open, initialMergeType, initialSourceCategory, initialSourceMainCategory]);

  // Mevcut Ana Kategoriler
  const mainCategories = React.useMemo(() => {
    const set = new Set<string>();
    facilityRisks.forEach((r: any) => {
      const cat = (r.riskCategory || '').trim();
      if (cat) set.add(cat);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [facilityRisks]);

  // Mevcut Alt Kategoriler (Eğer sourceMainCategory seçiliyse o ana kategoriye göre, yoksa tümü)
  const subCategories = React.useMemo(() => {
    const set = new Set<string>();
    facilityRisks.forEach((r: any) => {
      const main = (r.riskCategory || '').trim();
      if (sourceMainCategory && main.toLocaleLowerCase('tr') !== sourceMainCategory.trim().toLocaleLowerCase('tr')) {
        return;
      }
      const sub = (r.subCategory || '').trim();
      if (sub) set.add(sub);
    });
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'tr'));
  }, [facilityRisks, sourceMainCategory]);

  // Seçilen kaynağa göre etkilenecek risk sayısı
  const affectedCount = React.useMemo(() => {
    if (!sourceName) return 0;
    const normSource = sourceName.trim().toLocaleLowerCase('tr');

    return facilityRisks.filter((r: any) => {
      if (mergeType === 'mainCategory') {
        const cat = (r.riskCategory || '').trim().toLocaleLowerCase('tr');
        return cat === normSource;
      } else {
        const sub = (r.subCategory || '').trim().toLocaleLowerCase('tr');
        const main = (r.riskCategory || '').trim().toLocaleLowerCase('tr');
        if (sourceMainCategory && main !== sourceMainCategory.trim().toLocaleLowerCase('tr')) {
          return false;
        }
        return sub === normSource;
      }
    }).length;
  }, [facilityRisks, mergeType, sourceName, sourceMainCategory]);

  const handleMerge = async () => {
    const finalTarget = isCustomTarget ? customTargetName.trim() : targetName.trim();
    const finalSource = sourceName.trim();

    if (!finalSource) {
      toast.error('Lütfen birleştirilecek kaynak kategoriyi seçin.');
      return;
    }

    if (!finalTarget) {
      toast.error('Lütfen hedef (birleşik) kategori adını seçin veya girin.');
      return;
    }

    if (finalSource.toLocaleLowerCase('tr') === finalTarget.toLocaleLowerCase('tr')) {
      toast.error('Kaynak ve hedef kategori aynı olamaz.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/risks/lifecycle/merge-categories`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          facilityId,
          mergeType,
          sourceName: finalSource,
          targetName: finalTarget,
          sourceMainCategory: mergeType === 'subCategory' ? sourceMainCategory : undefined,
          targetMainCategory: mergeType === 'subCategory' ? (targetMainCategory || sourceMainCategory) : undefined
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Kategori birleştirme başarısız oldu.');
      }

      toast.success(data.message || 'Kategoriler başarıyla birleştirildi.');
      onOpenChange(false);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      toast.error(err.message || 'Kategoriler birleştirilirken hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[550px] p-6 rounded-2xl">
        <DialogHeader>
          <div className="flex items-center gap-2 text-primary font-bold text-lg">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <Merge className="w-4 h-4 text-primary" />
            </div>
            Kategori Birleştirme & Düzenleme
          </div>
          <DialogDescription className="text-xs text-muted-foreground pt-1">
            Excel ile aktarırken benzer isimle (örn. "İnşaat Renovasyon" ile "İnşaat ve Renovasyon ile ilgili riskler")
            açılmış kategorileri tek bir ana veya alt kategori altında toplayın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Birleştirme Türü (Ana Kategori mi, Alt Kategori mi?) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Birleştirme Kapsamı
            </Label>
            <RadioGroup
              value={mergeType}
              onValueChange={(val: any) => {
                setMergeType(val);
                setSourceName('');
                setTargetName('');
              }}
              className="grid grid-cols-2 gap-2"
            >
              <div className="flex items-center space-x-2 border rounded-xl p-2.5 bg-muted/20 hover:bg-muted/40 cursor-pointer">
                <RadioGroupItem value="subCategory" id="subCategory" />
                <Label htmlFor="subCategory" className="text-xs font-medium cursor-pointer">
                  Alt Kategori Birleştir
                </Label>
              </div>
              <div className="flex items-center space-x-2 border rounded-xl p-2.5 bg-muted/20 hover:bg-muted/40 cursor-pointer">
                <RadioGroupItem value="mainCategory" id="mainCategory" />
                <Label htmlFor="mainCategory" className="text-xs font-medium cursor-pointer">
                  Ana Kategori Birleştir
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Alt Kategori ise Kaynak Ana Kategori Filtresi */}
          {mergeType === 'subCategory' && (
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Ana Kategori (Filtre / Kapsam)
              </Label>
              <Select
                value={sourceMainCategory || 'ALL'}
                onValueChange={(val) => {
                  const selected = val === 'ALL' ? '' : val;
                  setSourceMainCategory(selected);
                  setTargetMainCategory(selected);
                  setSourceName('');
                  setTargetName('');
                }}
              >
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Tüm Ana Kategoriler" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">Tüm Ana Kategoriler (Filtresiz)</SelectItem>
                  {mainCategories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Kaynak Kategori Seçimi (Birleştirilecek / Silinecek olan) */}
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center justify-between">
              <span>Birleştirilecek Kaynak Kategori (Değişecek Olan)</span>
              {affectedCount > 0 && (
                <Badge variant="outline" className="text-[10px] text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30">
                  {affectedCount} risk etkilenecek
                </Badge>
              )}
            </Label>
            <Select value={sourceName} onValueChange={setSourceName}>
              <SelectTrigger className="text-xs h-9">
                <SelectValue placeholder="Kaynak kategoriyi seçin..." />
              </SelectTrigger>
              <SelectContent>
                {(mergeType === 'mainCategory' ? mainCategories : subCategories).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {cat}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-center my-1 text-muted-foreground">
            <ArrowRight className="w-5 h-5 text-primary rotate-90 sm:rotate-0" />
          </div>

          {/* Hedef Kategori Seçimi (İçine Aktarılacak olan) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Hedef Kategori (Aktarılacak Birleşik İsim)
              </Label>
              <button
                type="button"
                onClick={() => {
                  setIsCustomTarget(!isCustomTarget);
                  setTargetName('');
                  setCustomTargetName('');
                }}
                className="text-[11px] text-primary hover:underline font-medium flex items-center gap-1"
              >
                <Sparkles className="w-3 h-3" />
                {isCustomTarget ? 'Mevcut Listeden Seç' : '+ Yeni İsim Yaz'}
              </button>
            </div>

            {isCustomTarget ? (
              <Input
                placeholder="Örn: İnşaat ve Renovasyon İhtiyaçları"
                value={customTargetName}
                onChange={(e) => setCustomTargetName(e.target.value)}
                className="text-xs h-9"
              />
            ) : (
              <Select value={targetName} onValueChange={setTargetName}>
                <SelectTrigger className="text-xs h-9">
                  <SelectValue placeholder="Hedef mevcut kategoriyi seçin..." />
                </SelectTrigger>
                <SelectContent>
                  {(mergeType === 'mainCategory' ? mainCategories : subCategories)
                    .filter((cat) => cat !== sourceName)
                    .map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Bilgi Kutusu */}
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 text-xs text-blue-800 dark:text-blue-300 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-blue-600 mt-0.5" />
            <div>
              <strong>Otomatik Güncelleme:</strong> Bu işlem onaylandığında,{' '}
              <span className="font-semibold underline">{sourceName || 'seçilen kategoriye'}</span> ait tüm mevcut risk
              kayıtları kalıcı olarak{' '}
              <span className="font-semibold underline">
                {isCustomTarget ? customTargetName || 'yeni kategoriye' : targetName || 'hedef kategoriye'}
              </span>{' '}
              aktarılacaktır.
            </div>
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0 mt-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            Vazgeç
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={handleMerge}
            disabled={loading || !sourceName || (!targetName && !customTargetName)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                Birleştiriliyor...
              </>
            ) : (
              <>
                <Merge className="w-3.5 h-3.5 mr-1.5" />
                Kategorileri Birleştir
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
