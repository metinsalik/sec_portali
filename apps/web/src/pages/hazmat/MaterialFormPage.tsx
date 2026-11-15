import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api, { API_URL, BASE_URL } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  ArrowLeft,
  Search,
  Check,
  Save,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  Shield,
  FileText,
  RotateCcw,
  Sparkles,
  FlaskConical,
  Flame,
  Truck,
  FileCheck
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { toast } from 'sonner';
import { HazardStatementSelector } from '@/components/hazmat/HazardStatementSelector';

const initialEmptyForm = {
  productName: '',
  brandName: '',
  amountValue: '',
  unitId: '',
  categoryId: '',
  usageMethod: '',
  composition: '',
  hazardDescription: '',
  firstAid: '',
  fireFightingMeasures: '',
  accidentalReleaseMeasures: '',
  handlingAndStorage: '',
  exposureControls: '',
  physicalProperties: '',
  stabilityAndReactivity: '',
  toxicologicalInfo: '',
  ecologicalInfo: '',
  disposalConsiderations: '',
  transportInfo: '',
  regulatoryInfo: '',
  hazardLabelIds: [] as string[],
  adrLabelIds: [] as string[],
  ppeIds: [] as string[],
  imageUrl: '',
  sdsUrl: '',
  sdsExpiryDate: ''
};

export default function MaterialFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const returnTo = location.state?.returnTo || '/hazmat/materials';
  const isEditMode = !!id;
  const queryClient = useQueryClient();
  const activeFacilityId = localStorage.getItem('activeFacilityId');
  const draftKey = `hazmat_draft_${id || 'new'}`;

  const [formData, setFormData] = useState(initialEmptyForm);
  const [isDataLoaded, setIsDataLoaded] = useState(!isEditMode);
  const [isDirty, setIsDirty] = useState(false);
  const [hasLoadedDraft, setHasLoadedDraft] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  // Akıllı Arama
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGlobalMaterial, setSelectedGlobalMaterial] = useState<any>(null);

  // Miktar Cinsleri
  const { data: units = [] } = useQuery<any[]>({
    queryKey: ['hazmat-units'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/units');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // GHS Etiketleri
  const { data: hazardLabels = [] } = useQuery<any[]>({
    queryKey: ['hazmat-hazard-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/hazard-labels');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // ADR Etiketleri
  const { data: adrLabels = [] } = useQuery<any[]>({
    queryKey: ['hazmat-adr-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/adr-labels');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // KKD'ler
  const { data: ppes = [] } = useQuery<any[]>({
    queryKey: ['hazmat-ppes'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/ppes');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // Kategoriler
  const { data: categories = [] } = useQuery<any[]>({
    queryKey: ['hazmat-categories'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/categories');
      if (!res.ok) throw new Error('Hata');
      return res.json();
    }
  });

  // Akıllı Arama Query
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
      if (!res.ok) throw new Error('Hata');
      const data = await res.json();
      const mat = data.material || data;
      const fac = data.facilityItem;

      const serverFormData = {
        productName: mat.productName || '',
        brandName: mat.brandName || '',
        amountValue: fac?.amountValue ? String(fac.amountValue) : '',
        unitId: fac?.unitId || '',
        categoryId: mat.categoryId || '',
        usageMethod: mat.usageMethod || '',
        composition: mat.composition || '',
        hazardDescription: mat.hazardDescription || '',
        firstAid: mat.firstAid || '',
        fireFightingMeasures: mat.fireFightingMeasures || '',
        accidentalReleaseMeasures: mat.accidentalReleaseMeasures || '',
        handlingAndStorage: mat.handlingAndStorage || '',
        exposureControls: mat.exposureControlsPpe || '',
        physicalProperties: mat.physicalAndChemicalProperties || '',
        stabilityAndReactivity: mat.stabilityAndReactivity || '',
        toxicologicalInfo: mat.toxicologicalInformation || '',
        ecologicalInfo: mat.ecologicalInformation || '',
        disposalConsiderations: mat.disposalConsiderations || '',
        transportInfo: mat.transportInfo || '',
        regulatoryInfo: mat.regulatoryInfo || '',
        hazardLabelIds: mat.hazardLabels?.map((hl: any) => hl.labelId || hl.id) || [],
        adrLabelIds: mat.adrLabels?.map((al: any) => al.labelId || al.id) || [],
        ppeIds: mat.ppes?.map((p: any) => p.ppeId || p.id) || [],
        imageUrl: mat.imageUrl || '',
        sdsUrl: mat.sdsUrl || '',
        sdsExpiryDate: mat.sdsExpiryDate ? new Date(mat.sdsExpiryDate).toISOString().split('T')[0] : ''
      };

      // Check if there is an unsaved draft
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object' && parsed.productName) {
            setFormData({ ...serverFormData, ...parsed });
            setHasLoadedDraft(true);
            setIsDataLoaded(true);
            return data;
          }
        } catch (e) {
          console.error('Failed to parse draft:', e);
        }
      }

      setFormData(serverFormData);
      setIsDataLoaded(true);
      return data;
    },
    enabled: isEditMode
  });

  // Check draft on mount for new mode
  useEffect(() => {
    if (!isEditMode) {
      const savedDraft = localStorage.getItem(draftKey);
      if (savedDraft) {
        try {
          const parsed = JSON.parse(savedDraft);
          if (parsed && typeof parsed === 'object' && parsed.productName) {
            setFormData({ ...initialEmptyForm, ...parsed });
            setHasLoadedDraft(true);
          }
        } catch (e) {
          console.error(e);
        }
      }
    }
  }, [isEditMode, draftKey]);

  // Debounced auto-save to localStorage only when user actually makes changes (isDirty)
  useEffect(() => {
    if (!isDataLoaded || !isDirty) return;

    setAutoSaveStatus('saving');
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(draftKey, JSON.stringify(formData));
        setAutoSaveStatus('saved');
      } catch (err) {
        console.error('Draft auto-save error:', err);
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [formData, isDirty, isDataLoaded, draftKey]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  const handleClearDraft = () => {
    localStorage.removeItem(draftKey);
    setFormData(initialEmptyForm);
    setSelectedGlobalMaterial(null);
    setHasLoadedDraft(false);
    setIsDirty(false);
    setAutoSaveStatus('idle');
    toast.info('Taslak temizlendi.');
  };

  const handleSelectGlobal = (mat: any) => {
    setSelectedGlobalMaterial(mat);
    setSearchQuery('');
    setFormData(prev => ({
      ...prev,
      productName: mat.productName || '',
      brandName: mat.brandName || '',
      categoryId: mat.categoryId || '',
      usageMethod: mat.usageMethod || '',
      composition: mat.composition || '',
      hazardDescription: mat.hazardDescription || '',
      firstAid: mat.firstAid || '',
      fireFightingMeasures: mat.fireFightingMeasures || '',
      accidentalReleaseMeasures: mat.accidentalReleaseMeasures || '',
      handlingAndStorage: mat.handlingAndStorage || '',
      exposureControls: mat.exposureControlsPpe || mat.exposureControls || '',
      physicalProperties: mat.physicalAndChemicalProperties || mat.physicalProperties || '',
      stabilityAndReactivity: mat.stabilityAndReactivity || '',
      toxicologicalInfo: mat.toxicologicalInformation || mat.toxicologicalInfo || '',
      ecologicalInfo: mat.ecologicalInformation || mat.ecologicalInfo || '',
      disposalConsiderations: mat.disposalConsiderations || '',
      transportInfo: mat.transportInfo || '',
      regulatoryInfo: mat.regulatoryInfo || '',
      hazardLabelIds: mat.hazardLabels?.map((hl: any) => hl.labelId || hl.id) || [],
      adrLabelIds: mat.adrLabels?.map((hl: any) => hl.labelId || hl.id) || [],
      ppeIds: mat.ppes?.map((p: any) => p.ppeId || p.id) || [],
      imageUrl: mat.imageUrl || '',
      sdsUrl: mat.sdsUrl || '',
      sdsExpiryDate: mat.sdsExpiryDate ? new Date(mat.sdsExpiryDate).toISOString().split('T')[0] : ''
    }));
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
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (!res.ok) throw new Error('Yükleme başarısız');
      const data = await res.json();
      updateField(fieldName, data.url);
      toast.success('Dosya yüklendi.', { id: uploadToast });
    } catch (error) {
      console.error(error);
      toast.error('Dosya yüklenirken hata oluştu.', { id: uploadToast });
    }
  };

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const { hazardLabelIds, adrLabelIds, ppeIds, amountValue, unitId, ...materialData } = data;

      const effectiveFacility = (activeFacilityId && activeFacilityId !== 'all') ? activeFacilityId : undefined;

      if (isEditMode) {
        const res = await api.put(`/hazmat/materials/${id}`, {
          facilityId: effectiveFacility,
          amountValue: amountValue || null,
          unitId: unitId || null,
          ...materialData,
          hazardLabels: hazardLabelIds,
          adrLabels: adrLabelIds,
          ppes: ppeIds
        });
        if (!res.ok) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error || 'Güncelleme sırasında sunucu hatası oluştu.');
        }
        return res.json();
      }

      // Create new material in central DB
      const res = await api.post('/hazmat/materials', {
        facilityId: effectiveFacility,
        amountValue: amountValue || null,
        unitId: unitId || null,
        ...materialData,
        hazardLabels: hazardLabelIds,
        adrLabels: adrLabelIds,
        ppes: ppeIds
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Kayıt sırasında sunucu hatası oluştu.');
      }
      return res.json();
    },
    onSuccess: async (data: any) => {
      localStorage.removeItem(draftKey);
      await queryClient.invalidateQueries({ queryKey: ['global-materials-list'] });
      await queryClient.invalidateQueries({ queryKey: ['facility-materials'] });
      await queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      toast.success(isEditMode ? 'Tehlikeli Madde başarıyla güncellendi!' : 'Yeni Tehlikeli Madde başarıyla kaydedildi!');
      const targetId = id || data?.id || data?.materialId || selectedGlobalMaterial?.id;
      navigate(returnTo, { state: { justUpdatedMaterialId: targetId } });
    },
    onError: (err: any) => {
      toast.error(err.message || 'Kayıt yapılamadı. Lütfen alanları kontrol ediniz.');
    }
  });

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.productName.trim()) {
      toast.error('Lütfen Ürün Adı alanını doldurunuz.');
      return;
    }
    createMutation.mutate(formData);
  };

  const toggleArrayItem = (listName: 'hazardLabelIds' | 'adrLabelIds' | 'ppeIds', itemId: string) => {
    setFormData(prev => ({
      ...prev,
      [listName]: prev[listName].includes(itemId)
        ? prev[listName].filter((x: string) => x !== itemId)
        : [...prev[listName], itemId]
    }));
    setIsDirty(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-24 font-sans antialiased">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/80 pb-5">
        <div className="flex items-center gap-3.5">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate(returnTo)}
            className="h-9 w-9 rounded-lg shrink-0 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
                {isEditMode ? 'Tehlikeli Maddeyi Düzenle' : 'Yeni Tehlikeli Madde Ekle'}
              </h1>

              {autoSaveStatus === 'saving' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20">
                  <Loader2 className="w-3 h-3 animate-spin" />
                  Taslak kaydediliyor...
                </span>
              )}
              {autoSaveStatus === 'saved' && (
                <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Taslak kaydedildi
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditMode
                ? 'Merkezi veritabanındaki tehlikeli madde bilgilerini güncelleyin.'
                : 'Merkezi tehlikeli madde veritabanına yeni bir kimyasal madde tanımlayın.'}
            </p>
          </div>
        </div>

        {hasLoadedDraft && (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearDraft}
              className="h-8 text-xs text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Taslağı Sıfırla
            </Button>
          </div>
        )}
      </div>

      {/* Akıllı Kütüphane Araması (Sadece Yeni Girişlerde) */}
      {!isEditMode && !selectedGlobalMaterial && (
        <Card className="border border-primary/30 bg-primary/5 shadow-2xs rounded-xl overflow-hidden">
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary shrink-0" />
              <span className="text-xs font-semibold text-foreground">
                Akıllı Arama (Önceden Kayıtlı Maddeler)
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              Eklemek istediğiniz kimyasalın adını yazarak sistemde mevcutsa tüm özelliklerini tek tıkla yükleyebilirsiniz.
            </p>
            <div className="relative pt-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              <Input
                placeholder="Ürün adı veya marka yazın (Örn: Aseton, Hidrojen Peroksit, Derhand...)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 text-xs bg-background shadow-2xs"
              />
              {isSearching && (
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                </span>
              )}
            </div>

            {searchQuery.length >= 2 && searchResults.length > 0 && (
              <div className="bg-popover border border-border/80 rounded-xl shadow-lg mt-2 max-h-56 overflow-y-auto divide-y divide-border/60">
                {searchResults.map((res: any) => (
                  <div
                    key={res.id}
                    className="p-3 hover:bg-muted/50 cursor-pointer flex items-center justify-between transition-colors"
                    onClick={() => handleSelectGlobal(res)}
                  >
                    <div>
                      <div className="text-xs font-bold text-foreground">{res.productName}</div>
                      <div className="text-[11px] text-muted-foreground">Marka: {res.brandName || '-'} | Kategori: {res.category?.name || '-'}</div>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs font-medium">
                      Verileri Al
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedGlobalMaterial && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 p-3.5 rounded-xl flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>
              <strong>{selectedGlobalMaterial.productName}</strong> verileri kütüphaneden dolduruldu. İstediğiniz alanları düzenleyip kaydedebilirsiniz.
            </span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleClearDraft}
            className="h-7 text-xs text-emerald-800 hover:text-emerald-900 hover:bg-emerald-500/20"
          >
            Sıfırla
          </Button>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={onSubmit} className="space-y-6">
        {/* KART 1: Temel Bilgiler */}
        <Card className="border border-border/70 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/15">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-primary" />
              1. Temel Ürün Bilgileri
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Maddenin ürün adı, markası ve kategori sınıflandırması.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Ürün Adı */}
              <div className="space-y-1.5 sm:col-span-2">
                <Label className="text-xs font-semibold">
                  Ürün Adı <span className="text-destructive">*</span>
                </Label>
                <Input
                  required
                  placeholder="Örn: INCIDIN FOAM (750 mL)"
                  value={formData.productName}
                  onChange={(e) => updateField('productName', e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Markası */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Markası</Label>
                <Input
                  placeholder="Örn: ECOLAB, AQUA, MERCK..."
                  value={formData.brandName}
                  onChange={(e) => updateField('brandName', e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Kategorisi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Tehlikeli Madde Kategorisi</Label>
                <Select
                  value={formData.categoryId || 'none'}
                  onValueChange={(val) => updateField('categoryId', val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="w-full h-9 bg-background text-xs">
                    <SelectValue>
                      {categories.find((c: any) => c.id === formData.categoryId)?.name || 'Kategori Seçiniz (Opsiyonel)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Kategori Belirtilmemiş</SelectItem>
                    {categories.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Miktarı (Opsiyonel) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Varsayılan Ambalaj / Miktar (Opsiyonel)</Label>
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Örn: 750, 1, 50..."
                  value={formData.amountValue}
                  onChange={(e) => updateField('amountValue', e.target.value)}
                  className="h-9 text-xs"
                />
              </div>

              {/* Birimi (Opsiyonel) */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Miktar Birimi</Label>
                <Select
                  value={formData.unitId || 'none'}
                  onValueChange={(val) => updateField('unitId', val === 'none' ? '' : val)}
                >
                  <SelectTrigger className="w-full h-9 bg-background text-xs">
                    <SelectValue>
                      {units.find((u: any) => u.id === formData.unitId)?.name
                        ? `${units.find((u: any) => u.id === formData.unitId)?.name} (${units.find((u: any) => u.id === formData.unitId)?.symbol})`
                        : 'Birim Seçiniz (Opsiyonel)'}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Birim Belirtilmemiş</SelectItem>
                    {units.map((u: any) => (
                      <SelectItem key={u.id} value={u.id}>
                        {u.name} ({u.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KART 2: Tehlike Tanımları & Güvenlik Etiketleri */}
        <Card className="border border-border/70 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/15">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Flame className="w-4 h-4 text-red-500" />
              2. Tehlike Tanımları & Güvenlik Piktogramları
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              H-İfadeleri, GHS piktogramları, ADR taşıma işaretleri ve gerekli KKD'ler.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-5">
            {/* Tehlike Tanımı (H-Statements) */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold">Tehlike Tanımı (H-Zararlılık İfadeleri)</Label>
              <HazardStatementSelector
                value={formData.hazardDescription}
                onChange={(val) => updateField('hazardDescription', val)}
              />
            </div>

            {/* GHS Tehlike Piktogramları */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  GHS Tehlike Piktogramları ({formData.hazardLabelIds.length} Seçili)
                </Label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {hazardLabels.map((hl: any) => {
                  const isSelected = formData.hazardLabelIds.includes(hl.id);
                  return (
                    <div
                      key={hl.id}
                      onClick={() => toggleArrayItem('hazardLabelIds', hl.id)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer select-none transition-all w-[92px] h-[98px] ${
                        isSelected
                          ? 'border-primary bg-primary/5 ring-2 ring-primary/40 shadow-xs'
                          : 'border-border/80 bg-card hover:bg-muted/40 shadow-2xs'
                      }`}
                    >
                      {hl.imageUrl ? (
                        <img
                          src={hl.imageUrl}
                          alt={hl.name}
                          className="w-11 h-11 object-contain bg-white rounded-md p-0.5"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          Yok
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-center line-clamp-2 mt-1 leading-tight text-foreground">
                        {hl.name}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ADR Taşıma İşaretleri */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground">
                  TDR (ADR) Taşıma Sınıfı Etiketleri ({formData.adrLabelIds.length} Seçili)
                </Label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {adrLabels.map((al: any) => {
                  const isSelected = formData.adrLabelIds.includes(al.id);
                  return (
                    <div
                      key={al.id}
                      onClick={() => toggleArrayItem('adrLabelIds', al.id)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer select-none transition-all w-[92px] h-[98px] ${
                        isSelected
                          ? 'border-amber-500 bg-amber-500/5 ring-2 ring-amber-500/40 shadow-xs'
                          : 'border-border/80 bg-card hover:bg-muted/40 shadow-2xs'
                      }`}
                    >
                      {al.imageUrl ? (
                        <img
                          src={al.imageUrl}
                          alt={al.name}
                          className="w-11 h-11 object-contain bg-white rounded-md p-0.5"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                          Yok
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-center line-clamp-2 mt-1 leading-tight text-foreground">
                        {al.name}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Kişisel Koruyucu Donanımlar (KKD) */}
            <div className="space-y-2 pt-2 border-t border-border/60">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-primary" />
                  Gereken Kişisel Koruyucu Donanımlar ({formData.ppeIds.length} Seçili)
                </Label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {ppes.map((ppe: any) => {
                  const isSelected = formData.ppeIds.includes(ppe.id);
                  return (
                    <div
                      key={ppe.id}
                      onClick={() => toggleArrayItem('ppeIds', ppe.id)}
                      className={`relative flex flex-col items-center justify-center p-2 rounded-xl border cursor-pointer select-none transition-all w-[92px] h-[98px] ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-500/5 ring-2 ring-emerald-500/40 shadow-xs'
                          : 'border-border/80 bg-card hover:bg-muted/40 shadow-2xs'
                      }`}
                    >
                      {ppe.imageUrl ? (
                        <img
                          src={ppe.imageUrl}
                          alt={ppe.name}
                          className="w-11 h-11 object-contain rounded-full bg-blue-50/50 p-0.5"
                        />
                      ) : (
                        <div className="w-11 h-11 bg-muted rounded-full flex items-center justify-center text-xs text-muted-foreground">
                          Yok
                        </div>
                      )}
                      <span className="text-[10px] font-medium text-center line-clamp-2 mt-1 leading-tight text-foreground">
                        {ppe.name}
                      </span>
                      {isSelected && (
                        <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-emerald-500 text-white flex items-center justify-center">
                          <Check className="w-2.5 h-2.5" />
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KART 3: Acil Durum & İlk Yardım */}
        <Card className="border border-border/70 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/15">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              3. Acil Durum ve İlk Yardım Tedbirleri
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              İlkyardım adımları, yangın ve dökülme/sızma anında müdahale bilgileri.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">İlkyardım Önlemleri</Label>
                <Textarea
                  placeholder="Gözle temas, yutma, soluma durumunda ilk yardım..."
                  rows={3}
                  value={formData.firstAid}
                  onChange={(e) => updateField('firstAid', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Yangınla Mücadele Tedbirleri</Label>
                <Textarea
                  placeholder="Uygun söndürme maddeleri, özel tehlikeler..."
                  rows={3}
                  value={formData.fireFightingMeasures}
                  onChange={(e) => updateField('fireFightingMeasures', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kaza Sonucu Serbest Kalma</Label>
                <Textarea
                  placeholder="Dökülme anında alınacak tedbirler, temizleme..."
                  rows={3}
                  value={formData.accidentalReleaseMeasures}
                  onChange={(e) => updateField('accidentalReleaseMeasures', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KART 4: Kullanım, Depolama & Taşıma */}
        <Card className="border border-border/70 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/15">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <Truck className="w-4 h-4 text-primary" />
              4. Kullanım, Depolama ve Taşıma Bilgileri
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              Güvenli kullanım şekli, içerik, depolama şartları ve taşıma gereksinimleri.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kullanım Şekli</Label>
                <Textarea
                  placeholder="Maddenin tesiste kullanım amacı ve talimatları..."
                  rows={2}
                  value={formData.usageMethod}
                  onChange={(e) => updateField('usageMethod', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Bileşimi / İçeriği</Label>
                <Textarea
                  placeholder="Kimyasal bileşenler, CAS numaraları, konsantrasyon..."
                  rows={2}
                  value={formData.composition}
                  onChange={(e) => updateField('composition', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Kullanım ve Depolama</Label>
                <Textarea
                  placeholder="Sıcaklık, havalandırma, uyumsuz kimyasallar..."
                  rows={2}
                  value={formData.handlingAndStorage}
                  onChange={(e) => updateField('handlingAndStorage', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Maruz Kalma Kontrolü</Label>
                <Textarea
                  placeholder="Mesleki maruziyet sınır değerleri, havalandırma..."
                  rows={2}
                  value={formData.exposureControls}
                  onChange={(e) => updateField('exposureControls', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Temizlik / İmha Yöntemi</Label>
                <Textarea
                  placeholder="Atık bertaraf yöntemi, yerel mevzuat kuralları..."
                  rows={2}
                  value={formData.disposalConsiderations}
                  onChange={(e) => updateField('disposalConsiderations', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Taşıma Bilgisi (UN No vb.)</Label>
                <Textarea
                  placeholder="UN Numarası, Taşıma Grubu, Ambalajlama Grubu..."
                  rows={2}
                  value={formData.transportInfo}
                  onChange={(e) => updateField('transportInfo', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KART 5: Görsel, SDS & Teknik Bilgiler */}
        <Card className="border border-border/70 shadow-2xs rounded-xl overflow-hidden">
          <CardHeader className="p-4 sm:p-5 border-b border-border/60 bg-muted/15">
            <CardTitle className="text-sm sm:text-base font-bold flex items-center gap-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              5. Görsel, Güvenlik Bilgi Formu (SDS) ve Teknik Detaylar
            </CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              SDS belgesi, geçerlilik tarihi, ürün görseli ve fiziksel/kimyasal veriler.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-5 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Ürün Görseli */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Ürün Görseli</Label>
                {formData.imageUrl && (
                  <div className="mb-2 relative w-20 h-20 border border-border/80 rounded-xl overflow-hidden flex items-center justify-center bg-white shadow-2xs p-1">
                    <img
                      src={`${BASE_URL}${formData.imageUrl}`}
                      alt="Ürün Görseli"
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                )}
                <Input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileUpload(e, 'imageUrl')}
                  className="h-9 text-xs file:text-xs"
                />
              </div>

              {/* SDS PDF */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Güvenlik Bilgi Formu (SDS - PDF)</Label>
                {formData.sdsUrl && (
                  <div className="mb-2 text-xs text-primary font-medium flex items-center gap-1">
                    <FileText className="w-3.5 h-3.5" />
                    <a
                      href={`${BASE_URL}${formData.sdsUrl}`}
                      target="_blank"
                      rel="noreferrer"
                      className="underline"
                    >
                      Mevcut SDS Belgesini Görüntüle
                    </a>
                  </div>
                )}
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => handleFileUpload(e, 'sdsUrl')}
                  className="h-9 text-xs file:text-xs"
                />
              </div>

              {/* SDS Geçerlilik Tarihi */}
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">SDS Geçerlilik Tarihi</Label>
                <Input
                  type="date"
                  value={formData.sdsExpiryDate}
                  onChange={(e) => updateField('sdsExpiryDate', e.target.value)}
                  className="h-9 text-xs"
                />
              </div>
            </div>

            {/* İsteğe Bağlı Teknik Notlar */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/60">
              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Fiziksel ve Kimyasal Özellikler</Label>
                <Textarea
                  placeholder="Görünüm, koku, pH, kaynama noktası, parlama noktası..."
                  rows={2}
                  value={formData.physicalProperties}
                  onChange={(e) => updateField('physicalProperties', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Stabilite ve Reaktivite</Label>
                <Textarea
                  placeholder="Kimyasal kararlılık, kaçınılması gereken durumlar..."
                  rows={2}
                  value={formData.stabilityAndReactivity}
                  onChange={(e) => updateField('stabilityAndReactivity', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Toksikolojik ve Ekolojik Bilgi</Label>
                <Textarea
                  placeholder="Akut toksisite, çevreye olan etkileri..."
                  rows={2}
                  value={formData.toxicologicalInfo}
                  onChange={(e) => updateField('toxicologicalInfo', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>

              <div className="space-y-1.5">
                <Label className="text-xs font-semibold">Mevzuat ve Yönetmelik Bilgisi</Label>
                <Textarea
                  placeholder="Maddeye ilişkin özel güvenlik, sağlık ve çevre mevzuatı..."
                  rows={2}
                  value={formData.regulatoryInfo}
                  onChange={(e) => updateField('regulatoryInfo', e.target.value)}
                  className="text-xs resize-none"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sticky Action Footer - Yan Yana Sağa Yaslı */}
        <div className="sticky bottom-4 z-20 bg-background/95 backdrop-blur-md border border-border/80 p-3.5 rounded-xl shadow-lg flex items-center justify-end gap-3">
          {hasLoadedDraft && (
            <Button
              variant="outline"
              type="button"
              onClick={handleClearDraft}
              className="text-xs h-9 text-muted-foreground hover:text-foreground gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Taslağı Temizle
            </Button>
          )}

          <Button
            variant="outline"
            type="button"
            onClick={() => navigate(returnTo)}
            className="text-xs h-9 px-5 border border-border/80 bg-background text-foreground hover:bg-muted font-medium shadow-2xs"
          >
            İptal
          </Button>

          <Button
            type="submit"
            disabled={createMutation.isPending}
            className="px-6 h-9 text-xs font-semibold gap-2 shadow-sm"
          >
            {createMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {createMutation.isPending
              ? 'Kaydediliyor...'
              : isEditMode
                ? 'Değişiklikleri Güncelle'
                : 'Veritabanına Kaydet'}
          </Button>
        </div>
      </form>
    </div>
  );
}
