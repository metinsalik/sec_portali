import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Save, Upload, Image as ImageIcon, Loader2, Calendar, AlertTriangle, ShieldCheck, HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';

const API = import.meta.env.VITE_API_URL || '';

// Fine Kinney Standard Options
const PROBABILITY_OPTIONS = [
  { value: 10, label: '10 - Neredeyse Kesin (Beklenen bir durum)' },
  { value: 6, label: '6 - Çok Olası (Sık rastlanan durum)' },
  { value: 3, label: '3 - Olası (Normal ihtimal dahilinde)' },
  { value: 1, label: '1 - Beklenmedik Fakat Mümkün (Uzak ihtimal)' },
  { value: 0.5, label: '0.5 - Çok Uzak İhtimal (Nadir rastlanan)' },
  { value: 0.2, label: '0.2 - Pratik Olarak İmkansız (Çok çok nadir)' },
  { value: 0.1, label: '0.1 - Neredeyse İmkansız (Teorik ihtimal)' },
];

const FREQUENCY_OPTIONS = [
  { value: 10, label: '10 - Sürekli (Her gün, günde birkaç saat)' },
  { value: 6, label: '6 - Sık Sık (Haftada birkaç kez)' },
  { value: 3, label: '3 - Ara Sıra (Ayda birkaç kez)' },
  { value: 2, label: '2 - Sık Değil (Yılda birkaç kez)' },
  { value: 1, label: '1 - Çok Seyrek (Birkaç yılda bir)' },
  { value: 0.5, label: '0.5 - Çok Nadir (Hemen hemen hiç)' },
];

const SEVERITY_OPTIONS = [
  { value: 100, label: '100 - Afet / Çoklu Ölüm (Büyük çevre felaketi)' },
  { value: 40, label: '40 - Felaket / Ölüm (Çevre felaketi)' },
  { value: 15, label: '15 - Çok Ciddi / Ağır Yaralanma (Kalıcı sakatlık)' },
  { value: 7, label: '7 - Ciddi / Yaralanma (Raporlu iş gücü kaybı)' },
  { value: 3, label: '3 - Önemli / İlk Yardım Gerektiren Hasar (Ayakta tedavi)' },
  { value: 1, label: '1 - Önemsiz / Hasarsız Durum (Küçük sıyrıklar)' },
];

interface FormState {
  riskNo: string | number;
  detectionDate: string;
  riskCategory: string;
  subCategory: string;
  area: string;
  method: string;
  activity: string;
  hazard: string;
  riskDescription: string;
  impactDamage: string;
  affectedPeople: string;
  legislation: string;
  
  // Mevcut durum
  initialCondition: string;
  initialImage: string;
  initialProb: string;
  initialFreq: string;
  initialSev: string;
  initialScore: string;
  initialLevel: string;
  improvementResponsible: string;
  dueDate: string;
  dueDatePeriod: string;

  // İyileştirme Planı
  actionsTaken: string;
  actionDate: string;
  actionImage: string;

  // İyileştirme Sonrası
  finalProb: string;
  finalFreq: string;
  finalSev: string;
  finalScore: string;
  finalLevel: string;
  postImprovementResponsible: string;
  postImprovementDueDate: string;

  // Etkinlik Ölçümü
  effectivenessMethod: string;
  controlResponsible: string;
  controlResult: string;
  
  status: string;
}

export default function RiskFormPage() {
  const { departmentId, riskId } = useParams<{ departmentId: string; riskId?: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');
  const isEdit = !!riskId;

  const [form, setForm] = useState<FormState>({
    riskNo: '',
    detectionDate: new Date().toISOString().slice(0, 10),
    riskCategory: '',
    subCategory: '',
    area: '',
    method: 'Fine Kinney',
    activity: '',
    hazard: '',
    riskDescription: '',
    impactDamage: '',
    affectedPeople: '',
    legislation: '',
    initialCondition: '',
    initialImage: '',
    initialProb: '',
    initialFreq: '',
    initialSev: '',
    initialScore: '',
    initialLevel: '',
    improvementResponsible: '',
    dueDate: '',
    dueDatePeriod: '',
    actionsTaken: '',
    actionDate: '',
    actionImage: '',
    finalProb: '',
    finalFreq: '',
    finalSev: '',
    finalScore: '',
    finalLevel: '',
    postImprovementResponsible: '',
    postImprovementDueDate: '',
    effectivenessMethod: '',
    controlResponsible: '',
    controlResult: '',
    status: 'ACIK_TEHLIKE',
  });

  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // 1. Fetch Department & Facility Context
  const { data: department, isLoading: deptLoading } = useQuery({
    queryKey: ['risk-department-details', departmentId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/departments/${departmentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!departmentId,
  });

  const facilityId = department?.facilityId;
  const departmentAreas = department?.areas || [];
  const hasAreas = departmentAreas.length > 0;

  // 3. Fetch Settings (Categories and custom Departments)
  const { data: settingsData } = useQuery<{
    departments: any[];
    categories: any[];
  }>({
    queryKey: ['risk-settings', facilityId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/settings?facilityId=${facilityId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId,
  });

  // 4. Fetch existing Risk details if Edit
  const { data: existingRisk, isLoading: riskLoading } = useQuery({
    queryKey: ['risk-detail', riskId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/lifecycle/${riskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: isEdit,
  });

  // Initialize form for editing
  useEffect(() => {
    if (existingRisk) {
      setForm({
        riskNo: existingRisk.riskNo || '',
        detectionDate: existingRisk.detectionDate ? existingRisk.detectionDate.slice(0, 10) : '',
        riskCategory: existingRisk.riskCategory || '',
        subCategory: existingRisk.subCategory || '',
        area: existingRisk.area || '',
        method: existingRisk.method || 'Fine Kinney',
        activity: existingRisk.activity || '',
        hazard: existingRisk.hazard || '',
        riskDescription: existingRisk.riskDescription || '',
        impactDamage: existingRisk.impactDamage || '',
        affectedPeople: existingRisk.affectedPeople || '',
        legislation: existingRisk.legislation || '',
        initialCondition: existingRisk.initialCondition || '',
        initialImage: existingRisk.initialImage || '',
        initialProb: existingRisk.initialProb !== null ? String(existingRisk.initialProb) : '',
        initialFreq: existingRisk.initialFreq !== null ? String(existingRisk.initialFreq) : '',
        initialSev: existingRisk.initialSev !== null ? String(existingRisk.initialSev) : '',
        initialScore: existingRisk.initialScore !== null ? String(existingRisk.initialScore) : '',
        initialLevel: existingRisk.initialLevel || '',
        improvementResponsible: existingRisk.improvementResponsible || '',
        dueDate: existingRisk.dueDate ? existingRisk.dueDate.slice(0, 10) : '',
        dueDatePeriod: existingRisk.dueDatePeriod || '',
        actionsTaken: existingRisk.actionsTaken || '',
        actionDate: existingRisk.actionDate ? existingRisk.actionDate.slice(0, 10) : '',
        actionImage: existingRisk.actionImage || '',
        finalProb: existingRisk.finalProb !== null ? String(existingRisk.finalProb) : '',
        finalFreq: existingRisk.finalFreq !== null ? String(existingRisk.finalFreq) : '',
        finalSev: existingRisk.finalSev !== null ? String(existingRisk.finalSev) : '',
        finalScore: existingRisk.finalScore !== null ? String(existingRisk.finalScore) : '',
        finalLevel: existingRisk.finalLevel || '',
        postImprovementResponsible: existingRisk.postImprovementResponsible || '',
        postImprovementDueDate: existingRisk.postImprovementDueDate ? existingRisk.postImprovementDueDate.slice(0, 10) : '',
        effectivenessMethod: existingRisk.effectivenessMethod || '',
        controlResponsible: existingRisk.controlResponsible || '',
        controlResult: existingRisk.controlResult || '',
        status: existingRisk.status || 'ACIK_TEHLIKE',
      });
    }
  }, [existingRisk]);

  const updateField = (key: keyof FormState, val: any) => {
    setForm((f) => ({ ...f, [key]: val }));
  };

  const handleCategoryChange = (val: string) => {
    setForm((f) => ({ ...f, riskCategory: val, subCategory: '' }));
  };

  // Fine-Kinney Level and Color Computations
  const getLevelInfo = (score: number) => {
    if (score > 400) {
      return {
        label: 'Tolere Gösterilmez Risk',
        badge: 'bg-red-900 text-red-100 border-red-950 dark:bg-red-950 dark:text-red-200',
        card: 'border-red-900 bg-red-50/20 dark:bg-red-950/20',
      };
    }
    if (score > 200) {
      return {
        label: 'Yüksek Risk',
        badge: 'bg-red-100 text-red-700 border-red-300 dark:bg-red-900/30 dark:text-red-400 dark:border-red-800',
        card: 'border-red-300 bg-red-50/10 dark:bg-red-900/10',
      };
    }
    if (score > 70) {
      return {
        label: 'Önemli Risk',
        badge: 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-900/30 dark:text-orange-400 dark:border-orange-800',
        card: 'border-orange-300 bg-orange-50/10 dark:bg-orange-900/10',
      };
    }
    if (score > 20) {
      return {
        label: 'Olası Risk',
        badge: 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-yellow-900/30 dark:text-yellow-400 dark:border-yellow-800',
        card: 'border-amber-300 bg-amber-50/10 dark:bg-yellow-900/10',
      };
    }
    if (score > 0.1) {
      return {
        label: 'Önemsiz Risk',
        badge: 'bg-emerald-100 text-emerald-700 border-emerald-300 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
        card: 'border-emerald-300 bg-emerald-50/10 dark:bg-emerald-900/10',
      };
    }
    return {
      label: 'Belirlenmedi',
      badge: 'bg-muted text-muted-foreground border-border',
      card: 'border-border',
    };
  };

  // Live Score Calculator
  const handleScoreInput = (
    key: 'initialProb' | 'initialFreq' | 'initialSev' | 'finalProb' | 'finalFreq' | 'finalSev',
    val: string
  ) => {
    const isInitial = key.startsWith('initial');
    const updated = { ...form, [key]: val };

    const prob = parseFloat(updated[isInitial ? 'initialProb' : 'finalProb']) || 0;
    const freq = parseFloat(updated[isInitial ? 'initialFreq' : 'finalFreq']) || 1;
    const sev = parseFloat(updated[isInitial ? 'initialSev' : 'finalSev']) || 0;
    const scoreVal = (prob * freq * sev).toFixed(0);

    if (isInitial) {
      updated.initialScore = scoreVal;
      updated.initialLevel = getLevelInfo(Number(scoreVal)).label;
    } else {
      updated.finalScore = scoreVal;
      updated.finalLevel = getLevelInfo(Number(scoreVal)).label;
    }
    setForm(updated);
  };

  // Image upload
  const uploadImage = async (field: 'initialImage' | 'actionImage', file: File) => {
    setUploadingField(field);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const res = await fetch(`${API}/api/risks/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      updateField(field, data.url);
      toast.success('Fotoğraf başarıyla yüklendi.');
    } catch {
      toast.error('Fotoğraf yüklenemedi.');
    } finally {
      setUploadingField(null);
    }
  };

  const mutation = useMutation({
    mutationFn: async () => {
      const url = isEdit
        ? `${API}/api/risks/lifecycle/${riskId}`
        : `${API}/api/risks/lifecycle`;
      const res = await fetch(url, {
        method: isEdit ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ...form, departmentId, area: hasAreas ? form.area : (department?.name || '') }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'İşlem başarısız.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success(isEdit ? 'Risk değerlendirmesi güncellendi.' : 'Risk değerlendirmesi eklendi.');
      queryClient.invalidateQueries({ queryKey: ['risks', departmentId] });
      navigate(`/risks/department/${departmentId}`);
    },
    onError: (e: any) => toast.error(e.message),
  });

  const categoryOptions = settingsData?.categories || [];
  const selectedCatObj = categoryOptions.find((c) => c.name === form.riskCategory);
  const subCategoryOptions = selectedCatObj?.subCategories || [];
  const settingsDepartments = settingsData?.departments || [];

  const isFormValid =
    !!form.detectionDate &&
    !!form.riskCategory &&
    (!subCategoryOptions.length || !!form.subCategory) &&
    (!hasAreas || !!form.area) &&
    !!form.activity &&
    !!form.hazard &&
    !!form.riskDescription &&
    !!form.initialCondition &&
    !!form.initialProb &&
    !!form.initialFreq &&
    !!form.initialSev &&
    !!form.improvementResponsible &&
    (!!form.dueDate || !!form.dueDatePeriod);

  const initialScoreNum = parseFloat(form.initialScore) || 0;
  const initialLevelInfo = getLevelInfo(initialScoreNum);

  const finalScoreNum = parseFloat(form.finalScore) || 0;
  const finalLevelInfo = getLevelInfo(finalScoreNum);

  if (deptLoading || (isEdit && riskLoading)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-2">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm text-muted-foreground">Yükleniyor...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Üst Bar */}
      <div className="flex items-center justify-between gap-4 border-b pb-4">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shrink-0"
            onClick={() => navigate(`/risks/department/${departmentId}`)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">
              {isEdit ? 'Risk Değerlendirmesi Düzenle' : 'Yeni Risk Değerlendirmesi'}
            </h1>
            <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>{department?.name}</span>
              <span>·</span>
              <span className="font-semibold text-primary">Fine-Kinney Yöntemi</span>
            </p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            onClick={() => navigate(`/risks/department/${departmentId}`)}
          >
            Vazgeç
          </Button>
          <Button onClick={() => mutation.mutate()} disabled={mutation.isPending || !isFormValid}>
            {mutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
            {isEdit ? 'Güncelle' : 'Risk Kaydet'}
          </Button>
        </div>
      </div>

      
      <div className="space-y-6">
        {/* Bölüm 1: Genel Bilgiler */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">1. Bölüm: Genel Bilgiler</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-primary" /> Tespit Tarihi *
                </label>
                <Input type="date" value={form.detectionDate} onChange={(e) => updateField('detectionDate', e.target.value)} required />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Risk Kategorisi *</label>
                <select value={form.riskCategory} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seçiniz...</option>
                  {categoryOptions.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Alt Risk Kategorisi *</label>
                <select value={form.subCategory} onChange={(e) => updateField('subCategory', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring" disabled={!form.riskCategory}>
                  <option value="">Seçiniz...</option>
                  {subCategoryOptions.map((sc: any) => <option key={sc.id} value={sc.name}>{sc.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Birim / Bölüm *</label>
                <Input value={department?.name || ''} disabled className="bg-muted" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Alan *</label>
                {hasAreas ? (
                  <select value={form.area} onChange={(e) => updateField('area', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {departmentAreas.map((a: any) => <option key={a.id} value={a.name}>{a.name}</option>)}
                  </select>
                ) : (
                  <Input value={department?.name || ''} disabled className="bg-muted text-muted-foreground" />
                )}
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Faaliyet *</label>
                <Input value={form.activity} onChange={(e) => updateField('activity', e.target.value)} placeholder="Örn: Kimyasal atıkların taşınması" />
              </div>
            </div>
            {isEdit && (
              <div className="w-1/3 space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">No</label>
                <Input type="number" value={form.riskNo} onChange={(e) => updateField('riskNo', e.target.value)} placeholder="Örn: 1" />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Bölüm 2: Mevcut Durum Değerlendirmesi */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">2. Bölüm: Mevcut Durum Değerlendirmesi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Tehlike *</label>
                <Input value={form.hazard} onChange={(e) => updateField('hazard', e.target.value)} placeholder="Örn: Koruyucu eldiven kullanılmaması" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Risk *</label>
                <Input value={form.riskDescription} onChange={(e) => updateField('riskDescription', e.target.value)} placeholder="Örn: Kimyasalın cilde teması sonucu yanık" />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Sonuç/ Olası Etki Zarar</label>
                <Input value={form.impactDamage} onChange={(e) => updateField('impactDamage', e.target.value)} placeholder="Örn: Yaralanma, İş gücü kaybı" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Riskten Etkilenecek Kişiler</label>
                <Input value={form.affectedPeople} onChange={(e) => updateField('affectedPeople', e.target.value)} placeholder="Örn: Hemşireler, Temizlik Personeli" />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Mevcut Durum Açıklaması (Tespit edilen riske ilişkin mevcut önlemler) *</label>
              <Textarea value={form.initialCondition} onChange={(e) => updateField('initialCondition', e.target.value)} placeholder="Açıklama giriniz..." rows={2} />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold text-muted-foreground block">Mevcut Durum Görseli (Varsa tespit edilen riske ilişkin görsel)</label>
              <div className="flex flex-wrap items-center gap-4 border p-3 rounded-lg bg-muted/10">
                {form.initialImage ? (
                  <div className="relative group w-28 h-20 rounded-md overflow-hidden border">
                    <img src={form.initialImage} alt="Mevcut Durum" className="w-full h-full object-cover" />
                    <a href={form.initialImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white transition-opacity font-medium">Görüntüle</a>
                  </div>
                ) : (
                  <div className="w-28 h-20 bg-muted/40 rounded-md border border-dashed flex flex-col items-center justify-center text-muted-foreground text-xs gap-1">
                    <ImageIcon className="w-5 h-5 text-muted-foreground/50" /><span>Görsel Yok</span>
                  </div>
                )}
                <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed rounded-md px-4 py-2 hover:border-foreground/40 transition-colors bg-background">
                  {uploadingField === 'initialImage' ? <Loader2 className="w-4 h-4 animate-spin text-primary" /> : <Upload className="w-4 h-4" />}
                  Fotoğraf Yükle
                  <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage('initialImage', e.target.files[0]); }} />
                </label>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-slate-50 dark:bg-slate-900/50">
              <h5 className="text-sm font-bold mb-4">Mevcut Risk Skoru</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Olasılık (P)</label>
                  <select value={form.initialProb} onChange={(e) => handleScoreInput('initialProb', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {PROBABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Frekans (F)</label>
                  <select value={form.initialFreq} onChange={(e) => handleScoreInput('initialFreq', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Şiddet (S)</label>
                  <select value={form.initialSev} onChange={(e) => handleScoreInput('initialSev', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Risk Puanı</span>
                  <span className="text-2xl font-extrabold">{form.initialScore || '0'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">Risk Seviyesi</span>
                  <Badge variant="outline" className={`font-semibold ${initialLevelInfo.badge}`}>{initialLevelInfo.label}</Badge>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">İlgili Mevzuat</label>
              <Textarea value={form.legislation} onChange={(e) => updateField('legislation', e.target.value)} placeholder="Örn: 6331 Sayılı İSG Kanunu" rows={2} />
            </div>
          </CardContent>
        </Card>

        {/* Bölüm 3: İyileştirme Planı / Uygulama */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">3. Bölüm: İyileştirme Planı / Uygulama</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Alınacak Önlemler / İyileştirici Faaliyet</label>
              <Textarea value={form.actionsTaken} onChange={(e) => updateField('actionsTaken', e.target.value)} placeholder="Açıklama giriniz..." rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">İyileştirme Sorumlusu</label>
                <select value={form.improvementResponsible} onChange={(e) => updateField('improvementResponsible', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seçiniz...</option>
                  {settingsDepartments.map((dept: any) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                </select>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Termin Tarihi *</label>
                <Input type="date" value={form.dueDate} onChange={(e) => updateField('dueDate', e.target.value)} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Termin Periyodu</label>
                <select value={form.dueDatePeriod} onChange={(e) => updateField('dueDatePeriod', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Belli bir tarih</option>
                  <option value="Sürekli">Sürekli</option>
                  <option value="1 Ay">1 Ay</option>
                  <option value="3 Ay">3 Ay</option>
                  <option value="6 Ay">6 Ay</option>
                  <option value="1 Yıl">1 Yıl</option>
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">İyileştirme Açıklaması (Tespit edilen riske ilişkin yapılan iyileştirmeler)</label>
              <Textarea value={form.actionsTaken} onChange={(e) => updateField('actionsTaken', e.target.value)} placeholder="Açıklama giriniz..." rows={2} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">İyileştirme Tamamlanma Tarihi</label>
                <Input type="date" value={form.actionDate} onChange={(e) => updateField('actionDate', e.target.value)} />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">İyileştirme Sonrası Görseli (Yapılan iyileştirme sonrasını gösteren görsel)</label>
                <div className="flex items-center gap-3">
                  {form.actionImage && (
                    <div className="relative group w-20 h-10 rounded border overflow-hidden shrink-0">
                      <img src={form.actionImage} alt="İyileştirme Sonrası" className="w-full h-full object-cover" />
                      <a href={form.actionImage} target="_blank" rel="noreferrer" className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-[8px] text-white transition-opacity">Görüntüle</a>
                    </div>
                  )}
                  <label className="flex items-center gap-1.5 cursor-pointer text-xs font-semibold text-muted-foreground hover:text-foreground border border-dashed rounded px-3 py-1.5 hover:border-foreground/40 transition-colors bg-background">
                    {uploadingField === 'actionImage' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    Yükle
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage('actionImage', e.target.files[0]); }} />
                  </label>
                </div>
              </div>
            </div>

            <div className="p-4 border rounded-lg bg-emerald-50 dark:bg-emerald-900/10 mt-4">
              <h5 className="text-sm font-bold mb-4">İyileştirme Sonrası Risk Skoru</h5>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Olasılık (P)</label>
                  <select value={form.finalProb} onChange={(e) => handleScoreInput('finalProb', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {PROBABILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Frekans (F)</label>
                  <select value={form.finalFreq} onChange={(e) => handleScoreInput('finalFreq', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {FREQUENCY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-semibold text-muted-foreground">Şiddet (S)</label>
                  <select value={form.finalSev} onChange={(e) => handleScoreInput('finalSev', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="">Seçiniz...</option>
                    {SEVERITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-6 mt-4 pt-4 border-t border-emerald-200 dark:border-emerald-800">
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block">Risk Puanı</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">{form.finalScore || '0'}</span>
                </div>
                <div>
                  <span className="text-xs font-semibold text-muted-foreground block mb-1">Risk Seviyesi</span>
                  <Badge variant="outline" className={`font-semibold ${finalLevelInfo.badge}`}>{finalLevelInfo.label}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Bölüm 4: İyileştirme Etkinlik Ölçümü */}
        <Card className="shadow-sm border-muted">
          <CardHeader className="pb-3 border-b bg-muted/20">
            <CardTitle className="text-base font-bold text-foreground">4. Bölüm: İyileştirme Etkinlik Ölçümü</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">Etkinlik Ölçüm Yöntemi</label>
                <Input value={form.effectivenessMethod} onChange={(e) => updateField('effectivenessMethod', e.target.value)} placeholder="Örn: 30 gün boyunca haftalık saha denetimleri" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-muted-foreground">İyileştirme Kontrol Sorumlusu</label>
                <select value={form.controlResponsible} onChange={(e) => updateField('controlResponsible', e.target.value)} className="w-full h-9 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="">Seçiniz...</option>
                  {settingsDepartments.map((dept: any) => <option key={dept.id} value={dept.name}>{dept.name}</option>)}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground">Sonuç</label>
              <Textarea value={form.controlResult} onChange={(e) => updateField('controlResult', e.target.value)} placeholder="Örn: Yapılan denetimlerde sorun görülmedi." rows={2} />
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
