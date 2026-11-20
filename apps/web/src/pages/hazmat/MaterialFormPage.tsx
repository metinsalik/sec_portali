import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_URL, BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Search,
  Check,
  Save,
  Loader2,
  Shield,
  FileText,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Plus,
  X,
  Truck,
  AlertTriangle,
  Image as ImageIcon,
  Layers,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import { HazardStatementSelector } from '@/components/hazmat/HazardStatementSelector';
import type { GbfDoc, GbfSubData } from '@/components/hazmat/gbf/gbfSchema';
import {
  GBF_SECTIONS,
  countGbfProgress,
  createEmptyGbfDoc,
  createEmptySub,
  extractLegacyFieldsFromGbf,
  getVisibleSubsForSection,
  hydrateGbfFromMaterial,
  isSectionStructured,
  splitSubtext,
} from '@/components/hazmat/gbf/gbfSchema';
import { GbfSubCard } from '@/components/hazmat/gbf/GbfSubCard';

interface PortalMetaState {
  productName: string;
  brandName: string;
  categoryId: string;
  amountValue: string;
  unitId: string;
  sdsNumber: string;
  sdsRevision: string;
  sdsDate: string;
  sdsExpiryDate: string;
  imageUrl: string;
  sdsUrl: string;
  hazardLabelIds: string[];
  adrLabelIds: string[];
  ppeIds: string[];
}

const initialPortalMeta: PortalMetaState = {
  productName: '',
  brandName: '',
  categoryId: '',
  amountValue: '',
  unitId: '',
  sdsNumber: '',
  sdsRevision: '',
  sdsDate: '',
  sdsExpiryDate: '',
  imageUrl: '',
  sdsUrl: '',
  hazardLabelIds: [],
  adrLabelIds: [],
  ppeIds: [],
};

export default function MaterialFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const returnTo = (location.state as { returnTo?: string } | null)?.returnTo || '/hazmat/materials';
  const isEditMode = Boolean(id);
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const draftKey = `hazmat_gbf_draft_${id || 'new'}`;

  // 2 Aşamalı Akış: Step 1 = Belge & Ürün Bilgileri, Step 2 = 16 Bölümlü GBF
  const [step, setStep] = useState<1 | 2>(1);

  // Core State: Portal Metadata + 16-Section GBF Doc
  const [meta, setMeta] = useState<PortalMetaState>(initialPortalMeta);
  const [gbfDoc, setGbfDoc] = useState<GbfDoc>(createEmptyGbfDoc);
  const [currentSection, setCurrentSection] = useState<number>(1);
  const [activeView, setActiveView] = useState<'quick' | 'detail'>('quick');

  // UI & Draft State
  const [isDataLoaded, setIsDataLoaded] = useState(!isEditMode);
  const [isDirty, setIsDirty] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGlobalMaterial, setSelectedGlobalMaterial] = useState<any>(null);

  // Reference Data Queries
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ['hazmat-units'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/units');
      if (!res.ok) throw new Error('Birimler alınamadı');
      return res.json();
    },
  });

  const { data: hazardLabels = [] } = useQuery<any[]>({
    queryKey: ['hazmat-hazard-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/hazard-labels');
      if (!res.ok) throw new Error('GHS etiketleri alınamadı');
      return res.json();
    },
  });

  const { data: adrLabels = [] } = useQuery<any[]>({
    queryKey: ['hazmat-adr-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/adr-labels');
      if (!res.ok) throw new Error('ADR etiketleri alınamadı');
      return res.json();
    },
  });

  const { data: ppes = [] } = useQuery<any[]>({
    queryKey: ['hazmat-ppes'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/ppes');
      if (!res.ok) throw new Error('KKD listesi alınamadı');
      return res.json();
    },
  });

  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['hazmat-categories'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/categories');
      if (!res.ok) throw new Error('Kategoriler alınamadı');
      return res.json();
    },
  });

  // Global Library Smart Search
  const { data: searchResults = [], isFetching: isSearching } = useQuery<any[]>({
    queryKey: ['hazmat-search', searchQuery],
    queryFn: async () => {
      if (searchQuery.length < 2) return [];
      const res = await api.get(`/hazmat/materials/search?q=${encodeURIComponent(searchQuery)}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: searchQuery.length >= 2,
  });

  // Edit Mode: Fetch Server Data
  useQuery({
    queryKey: ['material-edit-details', id],
    queryFn: async () => {
      if (!isEditMode) return null;
      const res = await api.get(`/hazmat/materials/${id}`);
      if (!res.ok) throw new Error('Madde bilgileri alınamadı');
      const data = await res.json();
      const mat = data.material || data;
      const fac = data.facilityItem;

      setMeta({
        productName: mat.productName || '',
        brandName: mat.brandName || '',
        categoryId: mat.categoryId || '',
        amountValue: fac?.amountValue !== undefined && fac?.amountValue !== null ? String(fac.amountValue) : '',
        unitId: fac?.unitId || '',
        sdsNumber: mat.sdsNumber || '',
        sdsRevision: mat.sdsRevision || '',
        sdsDate: mat.sdsDate ? new Date(mat.sdsDate).toISOString().split('T')[0] : '',
        sdsExpiryDate: mat.sdsExpiryDate ? new Date(mat.sdsExpiryDate).toISOString().split('T')[0] : '',
        imageUrl: mat.imageUrl || '',
        sdsUrl: mat.sdsUrl || '',
        hazardLabelIds: mat.hazardLabels?.map((hl: any) => hl.labelId || hl.label?.id || hl.id) || [],
        adrLabelIds: mat.adrLabels?.map((al: any) => al.labelId || al.label?.id || al.id) || [],
        ppeIds: mat.ppes?.map((p: any) => p.ppeId || p.ppe?.id || p.id) || [],
      });

      setGbfDoc(hydrateGbfFromMaterial(mat));
      setIsDataLoaded(true);
      setIsDirty(false);
      return data;
    },
    enabled: isEditMode,
    refetchOnWindowFocus: false,
  });

  // Load Local Draft for New Mode
  useEffect(() => {
    if (!isEditMode) {
      const saved = localStorage.getItem(draftKey);
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as { meta?: PortalMetaState; gbfDoc?: GbfDoc };
          if (parsed.meta) setMeta({ ...initialPortalMeta, ...parsed.meta });
          if (parsed.gbfDoc) setGbfDoc(hydrateGbfFromMaterial({ sdsStructuredData: parsed.gbfDoc }));
        } catch {
          // ignore
        }
      }
      setIsDataLoaded(true);
    }
  }, [isEditMode, draftKey]);

  // Debounced Auto-Save Draft
  useEffect(() => {
    if (!isDataLoaded || !isDirty) return;
    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify({ meta, gbfDoc }));
        setAutoSaveStatus('saved');
      } catch {
        setAutoSaveStatus('idle');
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [meta, gbfDoc, isDirty, isDataLoaded, draftKey]);

  const updateMeta = <K extends keyof PortalMetaState>(key: K, value: PortalMetaState[K]) => {
    setMeta((prev) => ({ ...prev, [key]: value }));
    setIsDirty(true);
  };

  const updateGbf = (updater: (prev: GbfDoc) => GbfDoc) => {
    setGbfDoc((prev) => updater(prev));
    setIsDirty(true);
  };

  const toggleSelection = (key: 'hazardLabelIds' | 'adrLabelIds' | 'ppeIds', itemId: string) => {
    setMeta((prev) => {
      const list = prev[key];
      const exists = list.includes(itemId);
      return {
        ...prev,
        [key]: exists ? list.filter((x) => x !== itemId) : [...list, itemId],
      };
    });
    setIsDirty(true);
  };

  const handleSelectGlobal = (mat: any) => {
    setSelectedGlobalMaterial(mat);
    setSearchQuery('');
    setMeta((prev) => ({
      ...prev,
      productName: mat.productName || '',
      brandName: mat.brandName || '',
      categoryId: mat.categoryId || '',
      sdsNumber: mat.sdsNumber || '',
      sdsRevision: mat.sdsRevision || '',
      sdsDate: mat.sdsDate ? new Date(mat.sdsDate).toISOString().split('T')[0] : '',
      sdsExpiryDate: mat.sdsExpiryDate ? new Date(mat.sdsExpiryDate).toISOString().split('T')[0] : '',
      imageUrl: mat.imageUrl || '',
      sdsUrl: mat.sdsUrl || '',
      hazardLabelIds: mat.hazardLabels?.map((hl: any) => hl.labelId || hl.label?.id || hl.id) || [],
      adrLabelIds: mat.adrLabels?.map((al: any) => al.labelId || al.label?.id || al.id) || [],
      ppeIds: mat.ppes?.map((p: any) => p.ppeId || p.ppe?.id || p.id) || [],
    }));
    setGbfDoc(hydrateGbfFromMaterial(mat));
    setIsDirty(true);
    toast.success('Kütüphaneden bilgiler başarıyla çekildi.');
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, fieldName: 'imageUrl' | 'sdsUrl') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formDataUpload = new FormData();
    formDataUpload.append('file', file);

    const uploadToast = toast.loading('Dosya yükleniyor...');
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API_URL}/hazmat/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formDataUpload,
      });
      if (!res.ok) throw new Error('Yükleme başarısız');
      const data = await res.json();
      updateMeta(fieldName, data.url);
      toast.success('Dosya yüklendi.', { id: uploadToast });
    } catch {
      toast.error('Dosya yüklenirken hata oluştu.', { id: uploadToast });
    } finally {
      e.target.value = '';
    }
  };

  const handleClearDraft = () => {
    if (!window.confirm('Mevcut taslak sıfırlansın mı?')) return;
    localStorage.removeItem(draftKey);
    setMeta(initialPortalMeta);
    setGbfDoc(createEmptyGbfDoc());
    setSelectedGlobalMaterial(null);
    setStep(1);
    setCurrentSection(1);
    setActiveView('quick');
    setIsDirty(false);
    setAutoSaveStatus('idle');
    toast.info('Taslak temizlendi.');
  };

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!meta.productName.trim()) {
        throw new Error('Ürün / madde adı zorunludur.');
      }

      const legacyFields = extractLegacyFieldsFromGbf(gbfDoc);
      const effectiveFacility = activeFacilityId && activeFacilityId !== 'all' ? activeFacilityId : undefined;

      const body = {
        facilityId: effectiveFacility,
        productName: meta.productName.trim(),
        brandName: meta.brandName.trim() || null,
        categoryId: meta.categoryId || null,
        amountValue: meta.amountValue || null,
        unitId: meta.unitId || null,
        sdsNumber: meta.sdsNumber.trim() || null,
        sdsRevision: meta.sdsRevision.trim() || null,
        sdsDate: meta.sdsDate || null,
        sdsExpiryDate: meta.sdsExpiryDate || null,
        sdsRegime: gbfDoc.regime || 'KKDİK Ek-2',
        productKind: gbfDoc.kind || 'karışım',
        sdsStructuredData: gbfDoc,
        imageUrl: meta.imageUrl || null,
        sdsUrl: meta.sdsUrl || null,
        hazardLabels: meta.hazardLabelIds,
        adrLabels: meta.adrLabelIds,
        ppes: meta.ppeIds,
        ...legacyFields,
      };

      const res = isEditMode
        ? await api.put(`/hazmat/materials/${id}`, body)
        : await api.post('/hazmat/materials', body);

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Kayıt başarısız oldu.');
      }
      return res.json();
    },
    onSuccess: (resData) => {
      localStorage.removeItem(draftKey);
      setIsDirty(false);
      queryClient.invalidateQueries({ queryKey: ['global-materials-list'] });
      queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
      queryClient.invalidateQueries({ queryKey: ['material-details', id] });
      toast.success(isEditMode ? 'Kimyasal madde kaydı güncellendi.' : 'Yeni kimyasal madde başarıyla kaydedildi.');
      const savedId = resData?.material?.id || resData?.id || id;
      navigate(returnTo, { state: { justUpdatedMaterialId: savedId } });
    },
    onError: (err: Error) => {
      toast.error(err.message);
    },
  });

  // Current Section Helpers
  const secDef = GBF_SECTIONS[currentSection - 1];
  const secData = gbfDoc.sections[currentSection] || { raw: '', sub: {}, custom: [] };
  const visibleSubs = getVisibleSubsForSection(currentSection, gbfDoc.kind);
  const progressStats = countGbfProgress(gbfDoc);

  const updateCurrentRaw = (raw: string) => {
    updateGbf((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [currentSection]: { ...prev.sections[currentSection], raw },
      },
    }));
  };

  const updateSubData = (subCode: string, nextSub: GbfSubData) => {
    updateGbf((prev) => ({
      ...prev,
      sections: {
        ...prev.sections,
        [currentSection]: {
          ...prev.sections[currentSection],
          sub: {
            ...prev.sections[currentSection].sub,
            [subCode]: nextSub,
          },
        },
      },
    }));
  };

  const handleAutoDetectSubs = () => {
    if (secDef.subs.length > 0 && secData.raw.trim()) {
      const detected = splitSubtext(currentSection, secData.raw, gbfDoc.kind);
      let applied = 0;
      const nextSubMap = { ...secData.sub };
      for (const [k, val] of Object.entries(detected)) {
        const existing = nextSubMap[k] || createEmptySub();
        if (!existing.text.trim()) {
          nextSubMap[k] = { ...existing, text: val };
          applied += 1;
        }
      }
      if (applied > 0) {
        updateGbf((prev) => ({
          ...prev,
          sections: {
            ...prev.sections,
            [currentSection]: { ...prev.sections[currentSection], sub: nextSubMap },
          },
        }));
        toast.success(`${applied} alt başlık için metin önerisi yerleştirildi.`);
      } else {
        toast.info('Otomatik alt başlık ayırımı bulunamadı veya alanlar zaten dolu.');
      }
    }
    setActiveView('detail');
  };

  const handleGoToStep2 = () => {
    if (!meta.productName.trim()) {
      toast.error('2. aşamaya geçmeden önce Ürün / Madde Adı alanını doldurun.');
      return;
    }
    setStep(2);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Portal-specific embedded selectors inside official GBF sections (2.2, 8.2, 14.3)
  const renderSubExtraContent = (subCode: string) => {
    if (subCode === '2.2') {
      return (
        <div className="space-y-3 p-3 rounded-lg border border-amber-500/30 bg-amber-50/30 dark:bg-amber-950/15">
          <div className="space-y-2">
            <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
              GHS Zararlılık Piktogramları ({meta.hazardLabelIds.length} seçili)
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
              {hazardLabels.map((lbl: any) => {
                const selected = meta.hazardLabelIds.includes(lbl.id);
                return (
                  <button
                    key={lbl.id}
                    type="button"
                    onClick={() => toggleSelection('hazardLabelIds', lbl.id)}
                    className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                      selected
                        ? 'border-amber-600 bg-amber-500/15 ring-1 ring-amber-500'
                        : 'border-border bg-background hover:border-amber-400'
                    }`}
                  >
                    {lbl.imageUrl ? (
                      <img
                        src={lbl.imageUrl.startsWith('http') ? lbl.imageUrl : `${BASE_URL}${lbl.imageUrl}`}
                        alt={lbl.name}
                        className="w-9 h-9 object-contain"
                      />
                    ) : (
                      <AlertTriangle className="w-6 h-6 text-amber-500" />
                    )}
                    <span className="text-[10px] font-medium leading-tight line-clamp-2">{lbl.name}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-amber-500/20">
            <Label className="text-[11px] font-bold mb-1.5 block">
              H / EUH Zararlılık İfadeleri Hızlı Seçici (Bölüm 2.2 metnine ekler)
            </Label>
            <HazardStatementSelector
              value={secData.sub?.['2.2']?.text || ''}
              onChange={(val) => {
                const cur = secData.sub?.['2.2'] || createEmptySub();
                updateSubData('2.2', { ...cur, text: val });
              }}
            />
          </div>
        </div>
      );
    }

    if (subCode === '8.2') {
      return (
        <div className="space-y-2 p-3 rounded-lg border border-blue-500/30 bg-blue-50/30 dark:bg-blue-950/15">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-blue-600" />
            Zorunlu Kişisel Koruyucu Donanımlar — KKD ({meta.ppeIds.length} seçili)
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2">
            {ppes.map((ppe: any) => {
              const selected = meta.ppeIds.includes(ppe.id);
              return (
                <button
                  key={ppe.id}
                  type="button"
                  onClick={() => toggleSelection('ppeIds', ppe.id)}
                  className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                    selected
                      ? 'border-blue-600 bg-blue-500/15 ring-1 ring-blue-500'
                      : 'border-border bg-background hover:border-blue-400'
                  }`}
                >
                  {ppe.imageUrl ? (
                    <img
                      src={ppe.imageUrl.startsWith('http') ? ppe.imageUrl : `${BASE_URL}${ppe.imageUrl}`}
                      alt={ppe.name}
                      className="w-8 h-8 object-contain"
                    />
                  ) : (
                    <Shield className="w-6 h-6 text-blue-500" />
                  )}
                  <span className="text-[10px] font-medium leading-tight line-clamp-2">{ppe.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    if (subCode === '14.3') {
      return (
        <div className="space-y-2 p-3 rounded-lg border border-orange-500/30 bg-orange-50/30 dark:bg-orange-950/15">
          <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
            <Truck className="w-3.5 h-3.5 text-orange-600" />
            ADR Taşımacılık Etiketleri ({meta.adrLabelIds.length} seçili)
          </span>
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 gap-2">
            {adrLabels.map((lbl: any) => {
              const selected = meta.adrLabelIds.includes(lbl.id);
              return (
                <button
                  key={lbl.id}
                  type="button"
                  onClick={() => toggleSelection('adrLabelIds', lbl.id)}
                  className={`p-2 rounded-lg border text-center transition-all flex flex-col items-center gap-1 ${
                    selected
                      ? 'border-orange-600 bg-orange-500/15 ring-1 ring-orange-500'
                      : 'border-border bg-background hover:border-orange-400'
                  }`}
                >
                  {lbl.imageUrl ? (
                    <img
                      src={lbl.imageUrl.startsWith('http') ? lbl.imageUrl : `${BASE_URL}${lbl.imageUrl}`}
                      alt={lbl.name}
                      className="w-9 h-9 object-contain"
                    />
                  ) : (
                    <Truck className="w-6 h-6 text-orange-500" />
                  )}
                  <span className="text-[10px] font-medium leading-tight line-clamp-2">{lbl.name}</span>
                </button>
              );
            })}
          </div>
        </div>
      );
    }

    return null;
  };

  if (isEditMode && !isDataLoaded) {
    return (
      <div className="py-24 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <Loader2 className="w-7 h-7 animate-spin text-primary" />
        <span className="text-xs font-medium">Güvenlik Bilgi Formu yükleniyor...</span>
      </div>
    );
  }

  return (
    <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-5 text-foreground">
      {/* ─── ÜST BAŞLIK VE KAYDET ÇUBUĞU ─── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/70">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => navigate(returnTo)}
            className="h-8 px-2.5 text-xs shrink-0"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            Geri
          </Button>
          <div className="min-w-0">
            <h1 className="font-semibold text-base sm:text-lg tracking-tight truncate max-w-[440px]">
              {meta.productName || (isEditMode ? 'Kimyasal Madde Düzenle' : 'Yeni Kimyasal Madde Ekle')}
            </h1>
            <div className="text-xs text-muted-foreground truncate">
              {[meta.sdsNumber && `GBF ${meta.sdsNumber}`, meta.brandName, gbfDoc.regime].filter(Boolean).join(' · ') ||
                'Önce belge bilgilerini kaydedebilir, 16 bölümlü GBF verisini dilerseniz sonra ekleyebilirsiniz.'}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {!isEditMode && (
            <Button type="button" variant="ghost" size="sm" className="h-8 text-xs text-muted-foreground" onClick={handleClearDraft}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Sıfırla
            </Button>
          )}
          <Button
            type="button"
            size="sm"
            disabled={saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
            className="h-8 text-xs font-semibold"
          >
            {saveMutation.isPending ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <Save className="w-3.5 h-3.5 mr-1.5" />
            )}
            {isEditMode ? 'Güncelle ve Çık' : 'Kaydet ve Çık'}
          </Button>
        </div>
      </div>

      {/* ─── 2 AŞAMALI ANA ADIM SEÇİCİ ─── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        <button
          type="button"
          onClick={() => setStep(1)}
          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
            step === 1
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border/70 bg-card hover:bg-muted/40'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              step === 1 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            1
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <ClipboardList className="w-3.5 h-3.5" />
              1. Aşama: Belge & Ürün Bilgileri
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              Ürün adı, tedarikçi, kategori, GBF no, SDS PDF ve görsel — tek başına kaydedilebilir
            </p>
          </div>
        </button>

        <button
          type="button"
          onClick={handleGoToStep2}
          className={`flex items-center gap-3 p-3.5 rounded-xl border text-left transition-all ${
            step === 2
              ? 'border-primary bg-primary/5 ring-1 ring-primary/20'
              : 'border-border/70 bg-card hover:bg-muted/40'
          }`}
        >
          <div
            className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
              step === 2 ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
            }`}
          >
            2
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-xs font-bold text-foreground flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5" />
              2. Aşama: 16 Bölümlü GBF Detayları
              <Badge variant="secondary" className="text-[10px] ml-auto">
                {progressStats.any} / 16
              </Badge>
            </div>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              Opsiyonel — 16 resmî GBF bölümü, GHS, KKD ve ADR bilgileri (sonra da doldurulabilir)
            </p>
          </div>
        </button>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 1. AŞAMA: BELGE & ÜRÜN BİLGİLERİ                                       */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {step === 1 && (
        <div className="rounded-xl border border-border/70 bg-card p-5 shadow-xs space-y-5">
          {/* Akıllı Global Kütüphane Arama (Sadece yeni kayıtta) */}
          {!isEditMode && (
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Kütüphanede kayıtlı bir maddeden kopyalamak için arayın (en az 2 karakter)..."
                className="h-9 pl-8 text-xs bg-muted/30"
              />
              {searchQuery.length >= 2 && (
                <div className="absolute left-0 right-0 top-10 z-30 rounded-lg border border-border bg-popover shadow-md max-h-56 overflow-y-auto">
                  {isSearching ? (
                    <div className="p-3 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Aranıyor...
                    </div>
                  ) : searchResults.length === 0 ? (
                    <div className="p-3 text-xs text-muted-foreground">Eşleşen kayıt bulunamadı.</div>
                  ) : (
                    searchResults.map((mat: any) => (
                      <button
                        key={mat.id}
                        type="button"
                        onClick={() => handleSelectGlobal(mat)}
                        className="w-full px-3 py-2 text-left text-xs hover:bg-muted flex items-center justify-between border-b border-border/40 last:border-b-0"
                      >
                        <div>
                          <div className="font-semibold text-foreground">{mat.productName}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {mat.brandName || 'Marka yok'} {mat.category?.name ? `· ${mat.category.name}` : ''}
                          </div>
                        </div>
                        <Badge variant="secondary" className="text-[10px]">
                          Aktar
                        </Badge>
                      </button>
                    ))
                  )}
                </div>
              )}
              {selectedGlobalMaterial && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5 mt-2">
                  <Check className="w-3.5 h-3.5" />
                  <span>
                    <b>{selectedGlobalMaterial.productName}</b> kaydından şablon olarak kopyalandı.
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Temel Ürün & Belge Formu */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="sm:col-span-2 lg:col-span-2 space-y-1.5">
              <Label className="text-xs font-semibold">
                Ürün / Madde Adı <span className="text-destructive">*</span>
              </Label>
              <Input
                value={meta.productName}
                onChange={(e) => updateMeta('productName', e.target.value)}
                placeholder="Örn: PREMY PROTECT ALKAMAX"
                className="h-9 text-xs font-medium"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Kategori</Label>
              <select
                value={meta.categoryId}
                onChange={(e) => updateMeta('categoryId', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Kategori seçin...</option>
                {categories.map((c: any) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tedarikçi / Marka</Label>
              <Input
                value={meta.brandName}
                onChange={(e) => updateMeta('brandName', e.target.value)}
                placeholder="Üretici veya tedarikçi firma"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">GBF Numarası</Label>
              <Input
                value={meta.sdsNumber}
                onChange={(e) => updateMeta('sdsNumber', e.target.value)}
                placeholder="Örn: SDS-7404"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Revizyon Numarası</Label>
              <Input
                value={meta.sdsRevision}
                onChange={(e) => updateMeta('sdsRevision', e.target.value)}
                placeholder="Örn: Rev 02"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Hazırlanma / Revizyon Tarihi</Label>
              <Input
                type="date"
                value={meta.sdsDate}
                onChange={(e) => updateMeta('sdsDate', e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">SDS Geçerlilik Son Tarihi</Label>
              <Input
                type="date"
                value={meta.sdsExpiryDate}
                onChange={(e) => updateMeta('sdsExpiryDate', e.target.value)}
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Ürün Türü</Label>
              <select
                value={gbfDoc.kind}
                onChange={(e) =>
                  updateGbf((prev) => ({ ...prev, kind: e.target.value === 'madde' ? 'madde' : 'karışım' }))
                }
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="karışım">Karışım</option>
                <option value="madde">Madde</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Mevzuat / Belge Dönemi</Label>
              <select
                value={gbfDoc.regime}
                onChange={(e) => updateGbf((prev) => ({ ...prev, regime: e.target.value }))}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="KKDİK Ek-2">KKDİK Ek-2</option>
                <option value="2014 GBF formatı">2014 GBF formatı</option>
                <option value="Diğer / eski format">Diğer / eski format</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tesis Miktarı (Opsiyonel)</Label>
              <Input
                type="number"
                step="any"
                value={meta.amountValue}
                onChange={(e) => updateMeta('amountValue', e.target.value)}
                placeholder="Örn: 20"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Miktar Birimi</Label>
              <select
                value={meta.unitId}
                onChange={(e) => updateMeta('unitId', e.target.value)}
                className="w-full h-9 rounded-md border border-input bg-background px-2.5 text-xs outline-none focus:ring-2 focus:ring-ring/40"
              >
                <option value="">Birim seçin...</option>
                {units.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} {u.symbol ? `(${u.symbol})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Dosya Yükleme Alanı (Ürün Görseli & Orijinal SDS PDF) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border/60">
            <div className="space-y-2 border border-border/60 rounded-lg p-3.5 bg-muted/20">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-primary" />
                Ürün Görseli
              </Label>
              <Input type="file" accept="image/*" onChange={(e) => handleFileUpload(e, 'imageUrl')} className="h-8 text-xs" />
              {meta.imageUrl && (
                <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400">
                  <span className="truncate">Görsel yüklendi</span>
                  <button
                    type="button"
                    className="text-destructive hover:underline ml-2"
                    onClick={() => updateMeta('imageUrl', '')}
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </div>

            <div className="space-y-2 border border-border/60 rounded-lg p-3.5 bg-muted/20">
              <Label className="text-xs font-semibold flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-primary" />
                Orijinal GBF / SDS PDF Dosyası
              </Label>
              <Input type="file" accept=".pdf" onChange={(e) => handleFileUpload(e, 'sdsUrl')} className="h-8 text-xs" />
              {meta.sdsUrl && (
                <div className="flex items-center justify-between text-[11px] text-emerald-600 dark:text-emerald-400">
                  <a
                    href={meta.sdsUrl.startsWith('http') ? meta.sdsUrl : `${BASE_URL}${meta.sdsUrl}`}
                    target="_blank"
                    rel="noreferrer"
                    className="underline truncate"
                  >
                    PDF dosyasını görüntüle
                  </a>
                  <button
                    type="button"
                    className="text-destructive hover:underline ml-2"
                    onClick={() => updateMeta('sdsUrl', '')}
                  >
                    Kaldır
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* 1. Aşama Alt Aksiyonları: Doğrudan Kaydet veya 2. Aşamaya Geç */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-border/60">
            <span className="text-[11px] text-muted-foreground">
              {autoSaveStatus === 'saving'
                ? 'Taslak kaydediliyor…'
                : autoSaveStatus === 'saved'
                  ? 'Taslak tarayıcıda korundu'
                  : 'Sadece belge bilgilerini kaydedip çıkabilir veya 2. aşamadan devam edebilirsiniz.'}
            </span>

            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={saveMutation.isPending}
                onClick={() => saveMutation.mutate()}
                className="h-9 text-xs font-semibold"
              >
                {saveMutation.isPending ? (
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                ) : (
                  <Save className="w-3.5 h-3.5 mr-1.5" />
                )}
                {isEditMode ? 'Güncelle ve Çık' : 'Kaydet ve Çık'}
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={handleGoToStep2}
                className="h-9 text-xs font-semibold"
              >
                2. Aşamaya Geç (16 Bölüm GBF)
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {/* 2. AŞAMA: 16 RESMÎ GBF BÖLÜMÜ (ADIM ADIM GİRİŞ)                        */}
      {/* ═══════════════════════════════════════════════════════════════════════ */}
      {step === 2 && (
        <>
          {/* 16 Resmî Bölüm Yatay Stepper */}
          <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-xs space-y-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  16 Resmî GBF Bölümü
                </span>
                <Badge variant="secondary" className="text-[10px] font-semibold">
                  {progressStats.any} / 16 Dolu
                </Badge>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  Ayrıntılı giriş
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Ham metin
                </span>
                <div className="hidden sm:flex items-center gap-2">
                  <div className="w-24 h-1.5 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${(progressStats.any / 16) * 100}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-1.5">
              {GBF_SECTIONS.map((sec) => {
                const s = gbfDoc.sections[sec.num];
                const isStruct = isSectionStructured(s);
                const hasRaw = Boolean(s?.raw?.trim());
                const isActive = currentSection === sec.num;

                return (
                  <button
                    key={sec.num}
                    type="button"
                    onClick={() => setCurrentSection(sec.num)}
                    title={`${sec.num}. ${sec.title}`}
                    className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all min-w-0 ${
                      isActive
                        ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                        : 'bg-background hover:bg-muted/70 border-border/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span
                      className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                        isActive
                          ? 'bg-primary-foreground/20 text-primary-foreground'
                          : 'bg-muted text-foreground/70'
                      }`}
                    >
                      {String(sec.num).padStart(2, '0')}
                    </span>
                    <span className="text-[11px] truncate flex-1">{sec.title}</span>
                    <span
                      className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                        isStruct
                          ? isActive ? 'bg-emerald-300' : 'bg-emerald-500'
                          : hasRaw
                            ? isActive ? 'bg-amber-300' : 'bg-amber-400'
                            : isActive ? 'bg-primary-foreground/30' : 'bg-border'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aktif Bölüm Çalışma Kartı */}
          <div className="rounded-xl border border-border/70 bg-card shadow-xs overflow-hidden">
            {/* Bölüm Başlığı & Sekmeler */}
            <div className="px-4 sm:px-5 py-3.5 border-b border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  BÖLÜM {String(currentSection).padStart(2, '0')} / 16
                </div>
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground">
                  {secDef.title}
                </h2>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {(currentSection === 2 || currentSection === 8 || currentSection === 14) && activeView === 'quick' && (
                  <button
                    type="button"
                    onClick={() => setActiveView('detail')}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    {currentSection === 2
                      ? 'GHS Piktogramları & H/P Kodları →'
                      : currentSection === 8
                        ? 'KKD (PPE) Seçimi →'
                        : 'ADR Etiketleri →'}
                  </button>
                )}

                <div className="inline-flex p-1 rounded-lg bg-muted border border-border/60">
                  <button
                    type="button"
                    onClick={() => setActiveView('quick')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeView === 'quick'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Hızlı giriş
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveView('detail')}
                    className={`px-3.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                      activeView === 'detail'
                        ? 'bg-background text-foreground shadow-xs'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Alt başlıklara ayır
                  </button>
                </div>
              </div>
            </div>

            {/* İçerik */}
            <div className="p-4 sm:p-5">
              {activeView === 'quick' ? (
                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs font-semibold">{currentSection}. bölümün metni</Label>
                    <Textarea
                      value={secData.raw}
                      onChange={(e) => updateCurrentRaw(e.target.value)}
                      placeholder="SDS içerisindeki bu bölümü buraya yapıştırın veya yazın…"
                      className="min-h-[280px] text-xs leading-relaxed font-mono bg-background"
                    />
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                    <span className="text-[11px] text-muted-foreground">
                      Serbest metin, satır sonları ve tablolar korunur.
                    </span>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={handleAutoDetectSubs}
                    >
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {secDef.subs.length > 0 ? 'Alt başlıkları algıla →' : 'Ayrıntı ekle →'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {currentSection === 3 && (
                    <div className="max-w-xs space-y-1">
                      <Label className="text-xs font-semibold">Ürün tipi</Label>
                      <select
                        value={gbfDoc.kind}
                        onChange={(e) =>
                          updateGbf((prev) => ({
                            ...prev,
                            kind: e.target.value === 'madde' ? 'madde' : 'karışım',
                          }))
                        }
                        className="w-full h-9 rounded-md border border-input bg-background px-3 text-xs outline-none focus:ring-2 focus:ring-ring/40"
                      >
                        <option value="karışım">Karışım → Bölüm 3.2</option>
                        <option value="madde">Madde → Bölüm 3.1</option>
                      </select>
                    </div>
                  )}

                  {/* Tam Genişlikte Resmi Alt Başlık Kartları + Serbest Ek Alanlar */}
                  <div>
                    {visibleSubs.map((subDef) => (
                      <GbfSubCard
                        key={subDef.code}
                        code={subDef.code}
                        title={subDef.title}
                        data={secData.sub?.[subDef.code] || createEmptySub()}
                        onChange={(nextSub) => updateSubData(subDef.code, nextSub)}
                        extraContent={renderSubExtraContent(subDef.code)}
                      />
                    ))}

                    {secData.custom.map((c, ci) => (
                      <div key={ci} className="border border-border rounded-xl overflow-hidden bg-card mb-3">
                        <div className="px-3.5 py-2 bg-muted/40 border-b border-border/60 flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-[10px] font-bold">
                              EK
                            </Badge>
                            <span className="text-xs font-bold">Özel bilgi alanı</span>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-destructive"
                            onClick={() =>
                              updateGbf((prev) => ({
                                ...prev,
                                sections: {
                                  ...prev.sections,
                                  [currentSection]: {
                                    ...prev.sections[currentSection],
                                    custom: prev.sections[currentSection].custom.filter((_, idx) => idx !== ci),
                                  },
                                },
                              }))
                            }
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="p-3 grid grid-cols-1 sm:grid-cols-[1fr_2fr] gap-2">
                          <Input
                            value={c.label}
                            onChange={(e) =>
                              updateGbf((prev) => ({
                                ...prev,
                                sections: {
                                  ...prev.sections,
                                  [currentSection]: {
                                    ...prev.sections[currentSection],
                                    custom: prev.sections[currentSection].custom.map((item, idx) =>
                                      idx === ci ? { ...item, label: e.target.value } : item
                                    ),
                                  },
                                },
                              }))
                            }
                            placeholder="Başlık"
                            className="h-8 text-xs"
                          />
                          <Input
                            value={c.value}
                            onChange={(e) =>
                              updateGbf((prev) => ({
                                ...prev,
                                sections: {
                                  ...prev.sections,
                                  [currentSection]: {
                                    ...prev.sections[currentSection],
                                    custom: prev.sections[currentSection].custom.map((item, idx) =>
                                      idx === ci ? { ...item, value: e.target.value } : item
                                    ),
                                  },
                                },
                              }))
                            }
                            placeholder="Açıklama"
                            className="h-8 text-xs"
                          />
                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="h-8 text-xs"
                      onClick={() =>
                        updateGbf((prev) => ({
                          ...prev,
                          sections: {
                            ...prev.sections,
                            [currentSection]: {
                              ...prev.sections[currentSection],
                              custom: [...prev.sections[currentSection].custom, { label: '', value: '' }],
                            },
                          },
                        }))
                      }
                    >
                      <Plus className="w-3.5 h-3.5 mr-1" />
                      Serbest ek alan
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* Alt Navigasyon Çubuğu */}
            <div className="px-4 py-3 border-t border-border/60 bg-muted/20 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  onClick={() => {
                    if (currentSection === 1) {
                      setStep(1);
                    } else {
                      setCurrentSection((n) => Math.max(1, n - 1));
                    }
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  {currentSection === 1 ? '1. Aşamaya Dön' : 'Önceki Bölüm'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-8 text-xs"
                  disabled={currentSection === 16}
                  onClick={() => {
                    setCurrentSection((n) => Math.min(16, n + 1));
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                >
                  Sonraki Bölüm
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] text-muted-foreground hidden sm:inline">
                  {autoSaveStatus === 'saving'
                    ? 'Taslak kaydediliyor…'
                    : autoSaveStatus === 'saved'
                      ? 'Taslak kaydedildi'
                      : 'Otomatik taslak aktif'}
                </span>
                <Button
                  type="button"
                  size="sm"
                  disabled={saveMutation.isPending}
                  onClick={() => saveMutation.mutate()}
                  className="h-8 text-xs font-semibold"
                >
                  {saveMutation.isPending ? (
                    <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  ) : (
                    <Save className="w-3.5 h-3.5 mr-1.5" />
                  )}
                  {isEditMode ? 'Güncelle' : 'Kaydet'}
                </Button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
