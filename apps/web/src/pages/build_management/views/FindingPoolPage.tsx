import React, { useState, useEffect, useMemo } from 'react';
import {
  Database,
  Plus,
  Search,
  Tag,
  AlertTriangle,
  Pencil,
  Trash2,
  GitMerge,
  CheckSquare,
  Square,
  Sparkles,
  BookOpen,
  Power,
  Loader2,
  X,
} from 'lucide-react';
import toast from 'react-hot-toast';
import { useIRSC } from '../context/IRSCContext';
import {
  type IrscFindingTemplate,
  RISK_LEVELS,
  getRiskBadgeClass,
  normalizeRiskLevel,
} from '../types';
import {
  fetchFindingPool,
  checkSimilarPoolTemplates,
  createPoolTemplate,
  updatePoolTemplate,
  mergePoolTemplates,
  deletePoolTemplate,
} from '../services/auditApi';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';

export const getPoolRiskBadgeClass = (risk: string) => getRiskBadgeClass(risk);

// ─────────────────────────────────────────────────────────────────────────────
// Yeniden Kullanılabilir Şablon Ekleme / Düzenleme Modalı (Benzerlik Kalkanlı)
// ─────────────────────────────────────────────────────────────────────────────
export interface PoolTemplateDialogProps {
  open: boolean;
  onClose: () => void;
  onSaved: (saved: IrscFindingTemplate) => void;
  editingTemplate?: IrscFindingTemplate | null;
  initialValues?: Partial<IrscFindingTemplate>;
}

export const PoolTemplateDialog: React.FC<PoolTemplateDialogProps> = ({
  open,
  onClose,
  onSaved,
  editingTemplate,
  initialValues,
}) => {
  const { departments } = useIRSC();
  const isEditing = Boolean(editingTemplate);

  const [code, setCode] = useState('');
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('');
  const [tagsText, setTagsText] = useState('');
  const [defaultRisk, setDefaultRisk] = useState<string>('Önemli');
  const [legislationRef, setLegislationRef] = useState('');
  const [findingDesc, setFindingDesc] = useState('');
  const [riskDesc, setRiskDesc] = useState('');
  const [recommendation, setRecommendation] = useState('');
  const [defaultDepartments, setDefaultDepartments] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  const [similarMatches, setSimilarMatches] = useState<
    Array<{ template: IrscFindingTemplate; similarity: number }>
  >([]);
  const [checkingSimilar, setCheckingSimilar] = useState(false);

  useEffect(() => {
    if (!open) return;
    const src = editingTemplate || initialValues;
    setCode(src?.code || '');
    setTitle(src?.title || '');
    setCategory(src?.category || '');
    setTagsText(Array.isArray(src?.tags) ? src!.tags.join(', ') : '');
    setDefaultRisk(src?.defaultRisk ? normalizeRiskLevel(src.defaultRisk) : 'Önemli');
    setLegislationRef(src?.legislationRef || '');
    setFindingDesc(src?.findingDesc || '');
    setRiskDesc(src?.riskDesc || '');
    setRecommendation(src?.recommendation || '');
    setDefaultDepartments(Array.isArray(src?.defaultDepartments) ? src!.defaultDepartments : []);
    setSimilarMatches([]);
  }, [open, editingTemplate, initialValues]);

  // Benzerlik kontrolü (yeni eklerken mükerrer şablon oluşmasını engeller)
  useEffect(() => {
    if (!open || isEditing) return;
    const combined = `${title} ${findingDesc}`.trim();
    if (combined.length < 12) {
      setSimilarMatches([]);
      return;
    }

    const timer = setTimeout(async () => {
      setCheckingSimilar(true);
      try {
        const matches = await checkSimilarPoolTemplates({
          title,
          findingDesc,
          category,
        });
        setSimilarMatches(Array.isArray(matches) ? matches : []);
      } catch {
        setSimilarMatches([]);
      } finally {
        setCheckingSimilar(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [open, isEditing, title, findingDesc, category]);

  const toggleDept = (name: string) => {
    setDefaultDepartments((prev) =>
      prev.includes(name) ? prev.filter((d) => d !== name) : [...prev, name]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !findingDesc.trim()) {
      toast.error('Şablon başlığı ve standart tespit metni zorunludur.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        code: code.trim() || undefined,
        title: title.trim(),
        category: category.trim() || undefined,
        tags: tagsText
          .split(',')
          .map((t) => t.replace(/^#/, '').trim())
          .filter(Boolean),
        defaultRisk,
        legislationRef: legislationRef.trim() || undefined,
        findingDesc: findingDesc.trim(),
        riskDesc: riskDesc.trim() || undefined,
        recommendation: recommendation.trim() || undefined,
        defaultDepartments,
      };

      const saved =
        isEditing && editingTemplate
          ? await updatePoolTemplate(editingTemplate.id, payload)
          : await createPoolTemplate(payload);

      toast.success(isEditing ? 'Havuz şablonu güncellendi.' : 'Denetim havuzuna eklendi.');
      onSaved(saved);
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Şablon kaydedilemedi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Database className="w-5 h-5 text-primary" />
            {isEditing ? 'Havuz Şablonunu Düzenle' : 'Denetim Havuzuna Standart Şablon Ekle'}
          </DialogTitle>
          <DialogDescription>
            Tesise özel mahal/kat ifadelerini temizleyip tüm tesislerde temel alınabilecek genel standart şablonu kaydedin.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          {/* Benzerlik Kalkanı Uyarısı */}
          {!isEditing && similarMatches.length > 0 && (
            <div className="p-3.5 rounded-lg border border-amber-500/40 bg-amber-500/10 space-y-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Havuzda benzer şablon(lar) bulundu — mükerrer kayıt oluşturmamak için kontrol edin:</span>
              </div>
              <div className="space-y-1.5">
                {similarMatches.map(({ template, similarity }) => (
                  <div
                    key={template.id}
                    className="p-2 rounded-md bg-background/90 border border-border flex items-start justify-between gap-2"
                  >
                    <div className="min-w-0">
                      <div className="font-semibold text-foreground flex items-center gap-1.5 flex-wrap">
                        {template.code && <Badge variant="outline" className="text-[10px]">{template.code}</Badge>}
                        <span>{template.title}</span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2 mt-0.5">
                        {template.findingDesc}
                      </p>
                    </div>
                    <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30 text-[10px] shrink-0">
                      %{similarity} benzer
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-3 space-y-1">
              <label className="font-semibold text-foreground block">Kısa Standart Başlık *</label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Örn: UPS Odası İklimlendirme ve Sıcaklık Takibi Eksikliği"
                required
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Kod (Opsiyonel)</label>
              <Input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Oto: HVZ-001"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Kategori</label>
              <Input
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Örn: Elektrik Güvenliği"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Etiketler (virgülle)</label>
              <Input
                value={tagsText}
                onChange={(e) => setTagsText(e.target.value)}
                placeholder="UPS, Akü, İklimlendirme"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Varsayılan Risk Seviyesi</label>
              <select
                value={defaultRisk}
                onChange={(e) => setDefaultRisk(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-ring"
              >
                {RISK_LEVELS.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">
              Standart Tespit Metni (Şablon) *
              {checkingSimilar && (
                <span className="ml-2 text-[10px] text-muted-foreground font-normal">
                  Benzer kayıtlar kontrol ediliyor...
                </span>
              )}
            </label>
            <textarea
              rows={3}
              value={findingDesc}
              onChange={(e) => setFindingDesc(e.target.value)}
              placeholder="Genel tespit kalıbını yazın (sahada kullanırken tamamen özelleştirilebilir)..."
              required
              className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Standart Risk / Etki Açıklaması</label>
              <textarea
                rows={3}
                value={riskDesc}
                onChange={(e) => setRiskDesc(e.target.value)}
                placeholder="Olası tehlike, kesinti veya kaza sonuçları..."
                className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="font-semibold text-foreground block">Standart Öneri / Aksiyon Planı</label>
              <textarea
                rows={3}
                value={recommendation}
                onChange={(e) => setRecommendation(e.target.value)}
                placeholder="Önerilen düzeltici / önleyici faaliyet..."
                className="w-full p-2.5 rounded-lg border border-input bg-background text-foreground text-xs leading-relaxed outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="font-semibold text-foreground block">Mevzuat / Standart Dayanağı (Opsiyonel)</label>
            <Input
              value={legislationRef}
              onChange={(e) => setLegislationRef(e.target.value)}
              placeholder="Örn: JCI FMS.02, Elektrik İç Tesisleri Yönetmeliği"
              className="h-9 text-xs"
            />
          </div>

          {departments.length > 0 && (
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">Varsayılan Sorumlu Birimler</label>
              <div className="flex flex-wrap gap-1.5">
                {departments.map((d) => {
                  const selected = defaultDepartments.includes(d.name);
                  return (
                    <button
                      key={d.id}
                      type="button"
                      onClick={() => toggleDept(d.name)}
                      className={`px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors duration-200 ${
                        selected
                          ? 'bg-primary text-primary-foreground border-primary'
                          : 'bg-background text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {d.name}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <DialogFooter className="pt-2 border-t border-border gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={saving}>
              Vazgeç
            </Button>
            <Button type="submit" size="sm" disabled={saving} className="gap-1.5">
              {saving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              {isEditing ? 'Şablonu Güncelle' : 'Havuza Kaydet'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Ana Denetim Havuzu Yönetim Sayfası (/renovation-report/pool)
// ─────────────────────────────────────────────────────────────────────────────
export default function FindingPoolPage() {
  const [templates, setTemplates] = useState<IrscFindingTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [riskFilter, setRiskFilter] = useState<string>('ALL');
  const [tagFilter, setTagFilter] = useState<string>('ALL');
  const [showInactive, setShowInactive] = useState(false);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<IrscFindingTemplate | null>(null);
  const [deletingTemplate, setDeletingTemplate] = useState<IrscFindingTemplate | null>(null);

  // Birleştirme (Merge) modu
  const [mergeMode, setMergeMode] = useState(false);
  const [selectedForMerge, setSelectedForMerge] = useState<string[]>([]);
  const [mergeTargetId, setMergeTargetId] = useState<string>('');
  const [mergeConfirmOpen, setMergeConfirmOpen] = useState(false);
  const [merging, setMerging] = useState(false);

  const loadTemplates = async () => {
    setLoading(true);
    try {
      const data = await fetchFindingPool({ includeInactive: true });
      setTemplates(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      toast.error('Denetim havuzu yüklenemedi.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTemplates();
  }, []);

  const allTags = useMemo(() => {
    const counts = new Map<string, number>();
    templates
      .filter((t) => t.isActive)
      .forEach((t) => {
        (t.tags || []).forEach((tag) => {
          counts.set(tag, (counts.get(tag) || 0) + 1);
        });
      });
    return Array.from(counts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 14);
  }, [templates]);

  const filteredTemplates = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return templates.filter((t) => {
      if (!showInactive && !t.isActive) return false;
      if (riskFilter !== 'ALL' && t.defaultRisk !== riskFilter) return false;
      if (tagFilter !== 'ALL' && !(t.tags || []).includes(tagFilter)) return false;
      if (!q) return true;
      return (
        t.title.toLowerCase().includes(q) ||
        (t.code || '').toLowerCase().includes(q) ||
        t.findingDesc.toLowerCase().includes(q) ||
        (t.riskDesc || '').toLowerCase().includes(q) ||
        (t.recommendation || '').toLowerCase().includes(q) ||
        (t.category || '').toLowerCase().includes(q) ||
        (t.tags || []).some((tg) => tg.toLowerCase().includes(q))
      );
    });
  }, [templates, showInactive, riskFilter, tagFilter, searchQuery]);

  const toggleMergeSelection = (id: string) => {
    setSelectedForMerge((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleToggleActive = async (tpl: IrscFindingTemplate) => {
    try {
      const updated = await updatePoolTemplate(tpl.id, { isActive: !tpl.isActive });
      setTemplates((prev) => prev.map((t) => (t.id === tpl.id ? updated : t)));
      toast.success(updated.isActive ? 'Şablon aktifleştirildi.' : 'Şablon pasife alındı.');
    } catch (err: any) {
      toast.error(err.message || 'Güncellenemedi.');
    }
  };

  const handleDelete = async () => {
    if (!deletingTemplate) return;
    try {
      await deletePoolTemplate(deletingTemplate.id);
      setTemplates((prev) => prev.filter((t) => t.id !== deletingTemplate.id));
      toast.success('Şablon silindi.');
    } catch (err: any) {
      toast.error(err.message || 'Silinemedi.');
    } finally {
      setDeletingTemplate(null);
    }
  };

  const handleExecuteMerge = async () => {
    if (!mergeTargetId || selectedForMerge.length < 2) return;
    const sourceIds = selectedForMerge.filter((id) => id !== mergeTargetId);
    setMerging(true);
    try {
      await mergePoolTemplates(mergeTargetId, sourceIds);
      toast.success(`${sourceIds.length} benzer şablon tek standartta birleştirildi.`);
      setMergeConfirmOpen(false);
      setMergeMode(false);
      setSelectedForMerge([]);
      setMergeTargetId('');
      loadTemplates();
    } catch (err: any) {
      toast.error(err.message || 'Birleştirme başarısız.');
    } finally {
      setMerging(false);
    }
  };

  const activeCount = templates.filter((t) => t.isActive).length;
  const totalUsage = templates.reduce((sum, t) => sum + (t.usageCount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Üst Başlık */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Denetim Havuzu
            </h2>
            <Badge variant="secondary" className="text-xs tabular-nums">
              {activeCount} Aktif Şablon
            </Badge>
            <Badge variant="outline" className="text-xs tabular-nums">
              {totalUsage} Toplam Kullanım
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Tesis denetimlerinde tekrar eden bulgular için kurumsal standart şablonlar. Yeni bulgu girerken tek tıkla alınıp olaya göre tamamen özelleştirilebilir.
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap shrink-0">
          <Button
            variant={mergeMode ? 'secondary' : 'outline'}
            size="sm"
            onClick={() => {
              setMergeMode((prev) => !prev);
              setSelectedForMerge([]);
            }}
            className="gap-1.5 text-xs"
          >
            <GitMerge className="w-4 h-4" />
            {mergeMode ? 'Birleştirmeyi Kapat' : 'Benzerleri Birleştir'}
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setEditingTemplate(null);
              setDialogOpen(true);
            }}
            className="gap-1.5 text-xs"
          >
            <Plus className="w-4 h-4" />
            Yeni Şablon
          </Button>
        </div>
      </div>

      {/* Birleştirme Aksiyon Bandı */}
      {mergeMode && (
        <Card className="border-primary/40 bg-primary/5">
          <CardContent className="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <GitMerge className="w-4 h-4 text-primary shrink-0" />
              <span className="font-medium text-foreground">
                Birleştirmek istediğiniz en az 2 benzer şablonu seçin ({selectedForMerge.length} seçili). Kullanım sayıları ve etiketleri tek ana şablonda toplanır.
              </span>
            </div>
            <Button
              size="sm"
              disabled={selectedForMerge.length < 2}
              onClick={() => {
                setMergeTargetId(selectedForMerge[0]);
                setMergeConfirmOpen(true);
              }}
              className="shrink-0 gap-1.5 text-xs"
            >
              <GitMerge className="w-3.5 h-3.5" />
              Seçilenleri Birleştir ({selectedForMerge.length})
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Arama ve Filtreler */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Başlık, kod, tespit metni, öneri veya etiket ara (örn: UPS, topraklama)..."
                className="pl-9 h-9 text-sm"
              />
            </div>

            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="h-9 px-3 rounded-lg border border-input bg-background text-foreground text-xs outline-none focus:ring-2 focus:ring-ring"
            >
              <option value="ALL">Tüm Risk Seviyeleri</option>
              {RISK_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>

            <Button
              variant={showInactive ? 'secondary' : 'outline'}
              size="sm"
              onClick={() => setShowInactive((v) => !v)}
              className="h-9 text-xs shrink-0"
            >
              {showInactive ? 'Pasifler Gösteriliyor' : 'Pasifleri Göster'}
            </Button>
          </div>

          {/* Popüler Etiketler */}
          {allTags.length > 0 && (
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[11px] font-semibold text-muted-foreground flex items-center gap-1 mr-1">
                <Tag className="w-3 h-3" /> Etiketler:
              </span>
              <button
                type="button"
                onClick={() => setTagFilter('ALL')}
                className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                  tagFilter === 'ALL'
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'bg-background text-muted-foreground border-border hover:text-foreground'
                }`}
              >
                Tümü
              </button>
              {allTags.map(([tg, count]) => (
                <button
                  key={tg}
                  type="button"
                  onClick={() => setTagFilter(tagFilter === tg ? 'ALL' : tg)}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-medium border transition-colors ${
                    tagFilter === tg
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'bg-muted/40 text-foreground border-border hover:border-primary/40'
                  }`}
                >
                  #{tg} ({count})
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Şablon Listesi */}
      {loading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">Denetim havuzu yükleniyor...</div>
      ) : filteredTemplates.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-xl bg-muted mx-auto flex items-center justify-center text-muted-foreground">
              <Sparkles className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-semibold text-foreground">
                {templates.length === 0 ? 'Denetim Havuzu Henüz Boş' : 'Eşleşen Şablon Bulunamadı'}
              </h3>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                {templates.length === 0
                  ? 'Denetim yaparken tekrar eden bulguları tek tıkla havuza aktarabilir veya buradan ilk standart şablonunuzu oluşturabilirsiniz.'
                  : 'Farklı bir arama terimi veya etiket filtresi deneyebilirsiniz.'}
              </p>
            </div>
            {templates.length === 0 && (
              <Button
                size="sm"
                onClick={() => {
                  setEditingTemplate(null);
                  setDialogOpen(true);
                }}
                className="gap-1.5"
              >
                <Plus className="w-4 h-4" />
                İlk Şablonu Oluştur
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {filteredTemplates.map((tpl) => {
            const isSelected = selectedForMerge.includes(tpl.id);
            return (
              <Card
                key={tpl.id}
                className={`transition-all duration-200 ${
                  !tpl.isActive ? 'opacity-60 border-dashed' : 'hover:border-primary/40'
                } ${isSelected ? 'ring-2 ring-primary border-primary' : ''}`}
              >
                <CardHeader className="p-4 pb-3 border-b border-border/60">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-start gap-2.5 min-w-0">
                      {mergeMode && (
                        <button
                          type="button"
                          onClick={() => toggleMergeSelection(tpl.id)}
                          className="mt-0.5 text-primary shrink-0"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-4 h-4" />
                          ) : (
                            <Square className="w-4 h-4 text-muted-foreground" />
                          )}
                        </button>
                      )}
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {tpl.code && (
                            <Badge variant="outline" className="text-[10px] font-mono">
                              {tpl.code}
                            </Badge>
                          )}
                          <Badge className={`text-[10px] border ${getPoolRiskBadgeClass(tpl.defaultRisk)}`}>
                            {tpl.defaultRisk}
                          </Badge>
                          <Badge variant="secondary" className="text-[10px] tabular-nums">
                            {tpl.usageCount} kullanım
                          </Badge>
                          {!tpl.isActive && (
                            <Badge variant="outline" className="text-[10px] text-muted-foreground">
                              Pasif
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-sm font-bold leading-snug">{tpl.title}</CardTitle>
                        {tpl.category && (
                          <CardDescription className="text-xs">{tpl.category}</CardDescription>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-primary"
                        title="Düzenle"
                        onClick={() => {
                          setEditingTemplate(tpl);
                          setDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-amber-600"
                        title={tpl.isActive ? 'Pasife Al' : 'Aktifleştir'}
                        onClick={() => handleToggleActive(tpl)}
                      >
                        <Power className="w-3.5 h-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        title="Sil"
                        onClick={() => setDeletingTemplate(tpl)}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="p-4 space-y-2.5 text-xs">
                  <div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground block mb-0.5">
                      Standart Tespit:
                    </span>
                    <p className="text-foreground whitespace-pre-wrap leading-relaxed">
                      {tpl.findingDesc}
                    </p>
                  </div>

                  {tpl.recommendation && (
                    <div className="pt-2 border-t border-border/50">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-primary block mb-0.5">
                        Standart Öneri:
                      </span>
                      <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">
                        {tpl.recommendation}
                      </p>
                    </div>
                  )}

                  {((tpl.tags && tpl.tags.length > 0) || tpl.legislationRef) && (
                    <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2">
                      <div className="flex flex-wrap gap-1">
                        {(tpl.tags || []).map((tg) => (
                          <span
                            key={tg}
                            className="px-1.5 py-0.5 rounded bg-muted text-muted-foreground text-[10px] font-medium"
                          >
                            #{tg}
                          </span>
                        ))}
                      </div>
                      {tpl.legislationRef && (
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {tpl.legislationRef}
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Ekle / Düzenle Diyaloğu */}
      <PoolTemplateDialog
        open={dialogOpen}
        onClose={() => {
          setDialogOpen(false);
          setEditingTemplate(null);
        }}
        editingTemplate={editingTemplate}
        onSaved={() => loadTemplates()}
      />

      {/* Birleştirme Onay Diyaloğu */}
      <Dialog open={mergeConfirmOpen} onOpenChange={(o) => !o && setMergeConfirmOpen(false)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Benzer Şablonları Birleştir</DialogTitle>
            <DialogDescription>
              Korunacak <strong>ana şablonu</strong> seçin. Diğer seçili şablonların etiketleri ve kullanım sayıları ana şablona aktarılıp silinecektir.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            {selectedForMerge.map((id) => {
              const tpl = templates.find((t) => t.id === id);
              if (!tpl) return null;
              return (
                <label
                  key={id}
                  className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer text-xs ${
                    mergeTargetId === id ? 'border-primary bg-primary/5' : 'border-border'
                  }`}
                >
                  <input
                    type="radio"
                    name="mergeTarget"
                    checked={mergeTargetId === id}
                    onChange={() => setMergeTargetId(id)}
                    className="mt-0.5"
                  />
                  <div>
                    <div className="font-semibold text-foreground">{tpl.title}</div>
                    <div className="text-[11px] text-muted-foreground">
                      {tpl.code || '-'} • {tpl.usageCount} kullanım
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setMergeConfirmOpen(false)} disabled={merging}>
              İptal
            </Button>
            <Button size="sm" onClick={handleExecuteMerge} disabled={merging || !mergeTargetId}>
              {merging ? 'Birleştiriliyor...' : 'Birleştir'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Silme Onay Diyaloğu */}
      <Dialog open={Boolean(deletingTemplate)} onOpenChange={(o) => !o && setDeletingTemplate(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Şablonu Sil</DialogTitle>
            <DialogDescription>
              &quot;{deletingTemplate?.title}&quot; şablonunu havuzdan kalıcı olarak silmek istediğinize emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" size="sm" onClick={() => setDeletingTemplate(null)}>
              İptal
            </Button>
            <Button variant="destructive" size="sm" onClick={handleDelete}>
              Sil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
