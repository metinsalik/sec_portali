import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  ArrowLeft, Pencil, Activity, Clock, ShieldCheck, User, 
  Layers, MapPin, Building2, AlertTriangle, FileText, CheckCircle2,
  History, Eye, X, ChevronRight, TrendingDown, ArrowRight, GitCommit,
  Calendar, ShieldAlert, Sparkles, Image as ImageIcon, Upload, Loader2,
  Paperclip, Plus, Check, PlayCircle, RefreshCw, FileCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine
} from 'recharts';

const API = import.meta.env.VITE_API_URL || '';

// Kullanıcı dostu alan adları sözlüğü
const fieldNames: Record<string, string> = {
  status: 'Risk Durumu',
  dueDate: 'Termin Tarihi',
  dueDatePeriod: 'Termin Periyodu',
  actionDate: 'İyileştirme Tarihi',
  actionsTaken: 'İyileştirme Açıklaması',
  firstActionPlan: 'Alınacak Önlemler / İyileştirici Faaliyet',
  initialScore: 'Mevcut Risk Skoru',
  initialLevel: 'Mevcut Risk Seviyesi',
  finalScore: 'İyileştirme Sonrası Skor',
  finalLevel: 'İyileştirme Sonrası Risk Seviyesi',
  detectionDate: 'Tespit Tarihi',
  improvementResponsible: 'İyileştirme Sorumlusu',
  subCategory: 'Alt Risk Kategorisi',
  riskCategory: 'Risk Kategorisi',
  legislation: 'İlgili Mevzuat',
  initialProb: 'Olasılık (P)',
  initialFreq: 'Frekans (F)',
  initialSev: 'Şiddet (S)',
  finalProb: 'Sonrası Olasılık (P)',
  finalFreq: 'Sonrası Frekans (F)',
  finalSev: 'Sonrası Şiddet (S)',
  effectivenessMethod: 'Etkinlik Ölçüm Yöntemi',
  controlResponsible: 'Kontrol Sorumlusu',
  controlResult: 'Kontrol Sonucu',
  hazard: 'Tehlike',
  riskDescription: 'Risk Tanımı',
  impactDamage: 'Sonuç / Olası Etki Zarar',
  affectedPeople: 'Riskten Etkilenecek Kişiler',
  area: 'Alan / Mahal',
};

const statusNames: Record<string, string> = {
  ACIK_TEHLIKE: 'Açık Tehlike',
  ILK_MUDAHALE_EDILDI: 'İlk Müdahale Edildi',
  TAKIP_SURECINDE: 'Takip Sürecinde',
  KAPATILDI_GUVENLI: 'Kapatıldı (Güvenli)'
};

const formatLogValue = (key: string, val: any) => {
  if (val === null || val === undefined || val === '') return '-';
  if (key === 'status') return statusNames[val as string] || val;
  if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
    return new Date(val).toLocaleDateString('tr-TR');
  }
  return String(val);
};

const LEVEL_THEME: Record<string, {
  label: string;
  badge: string;
  cardBg: string;
  cardBorder: string;
  headerBg: string;
  textColor: string;
  glowColor: string;
}> = {
  'Tolere Gösterilmez Risk': {
    label: 'Tolere Gösterilmez Risk',
    badge: 'bg-red-600 text-white border-red-700 shadow-sm font-bold',
    cardBg: 'bg-gradient-to-br from-red-500/10 via-card to-background',
    cardBorder: 'border-red-500/40 dark:border-red-600/50',
    headerBg: 'bg-red-500/15 border-red-500/20',
    textColor: 'text-red-600 dark:text-red-400',
    glowColor: '#ef4444'
  },
  'Yüksek Risk': {
    label: 'Yüksek Risk',
    badge: 'bg-rose-500 text-white border-rose-600 shadow-sm font-bold',
    cardBg: 'bg-gradient-to-br from-rose-500/10 via-card to-background',
    cardBorder: 'border-rose-500/40 dark:border-rose-600/50',
    headerBg: 'bg-rose-500/15 border-rose-500/20',
    textColor: 'text-rose-600 dark:text-rose-400',
    glowColor: '#f43f5e'
  },
  'Önemli Risk': {
    label: 'Önemli Risk',
    badge: 'bg-amber-500 text-white border-amber-600 shadow-sm font-bold',
    cardBg: 'bg-gradient-to-br from-amber-500/10 via-card to-background',
    cardBorder: 'border-amber-500/40 dark:border-amber-600/50',
    headerBg: 'bg-amber-500/15 border-amber-500/20',
    textColor: 'text-amber-600 dark:text-amber-400',
    glowColor: '#f59e0b'
  },
  'Olası Risk': {
    label: 'Olası Risk',
    badge: 'bg-yellow-500 text-yellow-950 border-yellow-600 shadow-sm font-bold',
    cardBg: 'bg-gradient-to-br from-yellow-500/10 via-card to-background',
    cardBorder: 'border-yellow-500/40 dark:border-yellow-600/50',
    headerBg: 'bg-yellow-500/15 border-yellow-500/20',
    textColor: 'text-yellow-600 dark:text-yellow-400',
    glowColor: '#eab308'
  },
  'Önemsiz Risk': {
    label: 'Önemsiz Risk',
    badge: 'bg-emerald-600 text-white border-emerald-700 shadow-sm font-bold',
    cardBg: 'bg-gradient-to-br from-emerald-500/10 via-card to-background',
    cardBorder: 'border-emerald-500/40 dark:border-emerald-600/50',
    headerBg: 'bg-emerald-500/15 border-emerald-500/20',
    textColor: 'text-emerald-600 dark:text-emerald-400',
    glowColor: '#10b981'
  },
};

const getLevelTheme = (level?: string | null) => {
  return (level && LEVEL_THEME[level]) || {
    label: level || 'Belirlenmedi',
    badge: 'bg-muted text-muted-foreground border-border',
    cardBg: 'bg-card',
    cardBorder: 'border-border',
    headerBg: 'bg-muted/30 border-border',
    textColor: 'text-muted-foreground',
    glowColor: '#64748b'
  };
};

export const STATUS_MAP: Record<string, { label: string, color: string, bg: string, border: string }> = {
  ACIK_TEHLIKE:        { label: 'Açık Tehlike',    color: 'text-rose-700 dark:text-rose-300 font-bold', bg: 'bg-rose-500/15', border: 'border-rose-300 dark:border-rose-800' },
  ILK_MUDAHALE_EDILDI: { label: 'İlk Müdahale Yapıldı', color: 'text-amber-700 dark:text-amber-300 font-bold', bg: 'bg-amber-500/15', border: 'border-amber-300 dark:border-amber-800' },
  TAKIP_SURECINDE:     { label: 'Takip Sürecinde', color: 'text-sky-700 dark:text-sky-300 font-bold',   bg: 'bg-sky-500/15', border: 'border-sky-300 dark:border-sky-800' },
  KAPATILDI_GUVENLI:   { label: 'Kapatıldı ✓ (Güvenli)', color: 'text-emerald-700 dark:text-emerald-300 font-bold', bg: 'bg-emerald-500/20', border: 'border-emerald-400 dark:border-emerald-800 shadow-xs' },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_MAP[status] || STATUS_MAP['ACIK_TEHLIKE'];
  return (
    <span className={`text-xs px-3 py-1 rounded-full border ${cfg.bg} ${cfg.color} ${cfg.border}`}>
      {cfg.label}
    </span>
  );
}

function LevelBadge({ level }: { level: string }) {
  const th = getLevelTheme(level);
  return (
    <span className={`text-xs px-2.5 py-1 rounded-md border ${th.badge}`}>
      {th.label}
    </span>
  );
}

export default function RiskViewPage() {
  const { locationId, riskId } = useParams<{ locationId: string; riskId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();
  const token = localStorage.getItem('token');

  // Sekme yönetimi: 'details' (Risk Detayları) veya 'history' (Aksiyon Geçmişi & Evreler)
  const [activeTab, setActiveTab] = useState<string>('details');

  // Sayfa içi görsel ve doküman önizleme modalı (Lightbox)
  const [previewImage, setPreviewImage] = useState<{ url: string; title: string } | null>(null);

  // 4. Bölüm Sonrası: Yaşam Döngüsü Devam / Etkinlik Ölçüm & Kapatma Modalı
  const [showNextStepModal, setShowNextStepModal] = useState<boolean>(false);
  const [effectivenessMethodInput, setEffectivenessMethodInput] = useState<string>('');
  const [controlResponsibleInput, setControlResponsibleInput] = useState<string>('');
  const [controlResultInput, setControlResultInput] = useState<string>('');
  const [statusInput, setStatusInput] = useState<string>('KAPATILDI_GUVENLI');
  const [statusDateInput, setStatusDateInput] = useState<string>(new Date().toISOString().slice(0, 10));
  const [effImages, setEffImages] = useState<string[]>([]);
  const [docs, setDocs] = useState<{ name: string; url: string }[]>([]);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  // Aksiyon Logu Tarih & Bilgi Düzenleme Modalı
  const [editingLog, setEditingLog] = useState<{ id: string; action: string; details: string; date: string } | null>(null);

  const { data: risk, isLoading, refetch } = useQuery({
    queryKey: ['risk-detail-view', riskId],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/lifecycle/${riskId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Risk detayları alınamadı');
      return res.json();
    },
    enabled: !!riskId
  });

  const updateLogMutation = useMutation({
    mutationFn: async ({ logId, createdAt, details, action }: { logId: string; createdAt: string; details: string; action: string }) => {
      const res = await fetch(`${API}/api/risks/lifecycle/${riskId}/logs/${logId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ createdAt, details, action }),
      });
      if (!res.ok) throw new Error('Aksiyon kaydı güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      toast.success('Aksiyon geçmişi kaydı ve tarihi güncellendi.');
      setEditingLog(null);
      refetch();
    },
    onError: () => {
      toast.error('İşlem gerçekleştirilemedi.');
    }
  });

  // Modal açıldığında form değerlerini doldur
  const openNextStepDialog = () => {
    if (risk) {
      setEffectivenessMethodInput(risk.effectivenessMethod || '');
      setControlResponsibleInput(risk.controlResponsible || '');
      setControlResultInput(risk.controlResult || '');
      setStatusInput(risk.status || 'KAPATILDI_GUVENLI');
      setStatusDateInput(risk.statusDate ? new Date(risk.statusDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10));
      setEffImages(Array.isArray(risk.effectivenessImages) ? risk.effectivenessImages : []);
      setDocs(Array.isArray(risk.documents) ? risk.documents : []);
    }
    setShowNextStepModal(true);
  };

  // Görsel/Dosya yükleme
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, isDoc = false) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!isDoc && effImages.length >= 5) {
      toast.error('En fazla 5 kanıt fotoğrafı yükleyebilirsiniz.');
      return;
    }

    setIsUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const facilityId = risk?.location?.facilityId;
      const uploadUrl = facilityId 
        ? `${API}/api/risks/upload?facilityId=${encodeURIComponent(facilityId)}` 
        : `${API}/api/risks/upload`;
      const res = await fetch(uploadUrl, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      if (!res.ok) throw new Error();
      const data = await res.json();
      
      if (isDoc) {
        setDocs(prev => [...prev, { name: file.name, url: data.url }]);
        toast.success('Doküman başarıyla eklendi.');
      } else {
        setEffImages(prev => [...prev, data.url]);
        toast.success('Kanıt görseli yüklendi.');
      }
    } catch {
      toast.error('Dosya yüklenemedi.');
    } finally {
      setIsUploading(false);
    }
  };

  // Yaşam Döngüsü Kaydetme Mutasyonu
  const nextStepMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`${API}/api/risks/lifecycle/${riskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          effectivenessMethod: effectivenessMethodInput,
          controlResponsible: controlResponsibleInput,
          controlResult: controlResultInput,
          status: statusInput,
          statusDate: statusDateInput,
          effectivenessImages: effImages,
          documents: docs,
        }),
      });
      if (!res.ok) throw new Error();
      return res.json();
    },
    onSuccess: () => {
      toast.success('Yaşam döngüsü adımı ve denetim sonucu başarıyla kaydedildi.');
      setShowNextStepModal(false);
      refetch();
      queryClient.invalidateQueries({ queryKey: ['scoped-risks'] });
    },
    onError: () => {
      toast.error('İşlem kaydedilemedi.');
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-6xl mx-auto p-4">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!risk) return <div className="text-muted-foreground p-8 text-center">Risk kaydı bulunamadı.</div>;

  const loc = risk.location;
  const riskCode = `#${risk.riskNo}`;

  // Yaşam Döngüsü Evresi (Evrim zinciri)
  const hasRemediation = Boolean(risk.actionsTaken || risk.firstActionPlan || risk.actionDate);
  const hasFinalEvaluation = Boolean(risk.finalScore && risk.finalScore > 0);
  const isClosed = risk.status === 'KAPATILDI_GUVENLI';

  // Riskin Yaşam Boyu Skor Eğrisi Grafiği (Timeline Score Chart Verisi)
  const chartData = [
    {
      stage: '1. İlk Tespit',
      score: risk.initialScore || 0,
      level: risk.initialLevel || 'Tespit Edildi',
      date: risk.detectionDate ? new Date(risk.detectionDate).toLocaleDateString('tr-TR') : '1. Adım'
    },
    ...(risk.finalScore ? [{
      stage: '2. İyileştirme',
      score: risk.finalScore,
      level: risk.finalLevel || 'İyileştirildi',
      date: risk.actionDate ? new Date(risk.actionDate).toLocaleDateString('tr-TR') : '2. Adım'
    }] : []),
    {
      stage: isClosed ? '3. Kapatıldı (Güvenli)' : '3. Takip / Denetim',
      score: isClosed ? Math.min(risk.finalScore || risk.initialScore, 10) : (risk.finalScore || risk.initialScore),
      level: statusNames[risk.status] || risk.status,
      date: risk.statusDate ? new Date(risk.statusDate).toLocaleDateString('tr-TR') : 'Son Durum'
    }
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-16">
      
      {/* ─── Modern Üst Başlık & Eylemler ─────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b pb-5">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => {
              if (window.history.state && window.history.state.idx > 0) {
                navigate(-1);
              } else {
                navigate(location.state?.from || `/risks/location/${locationId}`);
              }
            }} 
            className="h-8 text-xs font-medium"
          >
            <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Geri
          </Button>

          <span className="font-mono text-sm font-black px-2.5 py-1 bg-primary/10 text-primary rounded-lg border border-primary/20">
            {riskCode}
          </span>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold tracking-tight text-foreground truncate max-w-xl">
                {risk.hazard || 'Risk Kaydı'}
              </h1>
              <StatusBadge status={risk.status} />
            </div>
            <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
              <span>{loc?.building || 'Bina'}</span>
              <span>•</span>
              <span>{loc?.floor || 'Kat'}</span>
              <span>•</span>
              <span className="font-semibold text-foreground">{loc?.department || risk.department?.name || 'Birim'}</span>
              {risk.area && (
                <>
                  <span>•</span>
                  <span className="text-primary font-medium">{risk.area}</span>
                </>
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={openNextStepDialog}
            className="shadow-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white"
          >
            <PlayCircle className="w-3.5 h-3.5 mr-1.5" /> Yaşam Döngüsü / Kapatma Adımı
          </Button>

          <Button 
            size="sm" 
            variant="outline"
            onClick={() => navigate(`/risks/location/${locationId}/edit/${risk.id}`)}
            className="shadow-xs font-semibold"
          >
            <Pencil className="w-3.5 h-3.5 mr-1.5" /> Düzenle
          </Button>
        </div>
      </div>

      {/* ─── RİSK YAŞAM BOYU GRAFİĞİ & EVRİM ZİNCİRİ (GENİŞ, FERAH VE DİNAMİK RENKLİ) ── */}
      <Card className="border-border/80 shadow-md bg-card overflow-hidden">
        <div className="p-5 sm:p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-border/60">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-foreground">Risk Yaşam Döngüsü ve Süreç Eğrisi</h3>
                <p className="text-[11px] text-muted-foreground">İlk tespitten alınan aksiyonlar ve kapatma denetimine kadar olan gelişim</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              {risk.finalScore ? (
                <span className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-3 py-1.5 rounded-full border border-emerald-300 dark:border-emerald-800 shadow-xs">
                  <TrendingDown className="w-4 h-4" />
                  Toplam İyileşme: {risk.initialScore} → {risk.finalScore} (-{Math.round(((risk.initialScore - risk.finalScore) / (risk.initialScore || 1)) * 100)}%)
                </span>
              ) : (
                <Badge variant="outline" className="text-rose-600 bg-rose-500/10 border-rose-300">
                  İlk Tespit Aşamasında (Aksiyon Bekleniyor)
                </Badge>
              )}
            </div>
          </div>

          {/* Ferah 4 Aşamalı Süreç Zinciri (Dinamik Risk Rengine Göre) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* 1. Aşama: İlk Tespit */}
            {(() => {
              const initTheme = getLevelTheme(risk.initialLevel);
              return (
                <div className={`p-4 rounded-2xl border transition-all shadow-xs ${initTheme.cardBg} ${initTheme.cardBorder}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${initTheme.textColor}`}>
                      1. İlk Tespit
                    </span>
                    <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${initTheme.badge}`}>
                      {risk.initialScore} P
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-foreground tracking-tight line-clamp-1">{risk.initialLevel}</h4>
                  <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
                    <span>Tespit Tarihi:</span>
                    <span className="font-semibold text-foreground">
                      {risk.detectionDate ? new Date(risk.detectionDate).toLocaleDateString('tr-TR') : '-'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 2. Aşama: İyileştirme Planı */}
            <div className={`p-4 rounded-2xl border transition-all shadow-xs ${
              hasRemediation 
                ? 'bg-gradient-to-br from-amber-500/15 via-card to-background border-amber-500/40 dark:border-amber-600/50' 
                : 'bg-muted/20 border-dashed border-border/80 opacity-70'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  2. İyileştirme
                </span>
                <span className="text-[11px] font-semibold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/60">
                  {risk.dueDatePeriod || 'Aksiyon'}
                </span>
              </div>
              <h4 className="text-sm font-bold text-foreground tracking-tight truncate">
                {risk.firstActionPlan ? 'Önlem Planlandı' : (risk.actionsTaken ? 'Aksiyon Uygulandı' : 'Bekleniyor')}
              </h4>
              <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
                <span className="truncate max-w-[100px]">Sorumlu:</span>
                <span className="font-semibold text-foreground truncate max-w-[120px] text-right">
                  {risk.improvementResponsible || '-'}
                </span>
              </div>
            </div>

            {/* 3. Aşama: Çıkan Son Skor (Çıkan sonuca göre renklenir) */}
            {(() => {
              const finTheme = getLevelTheme(risk.finalLevel || (risk.finalScore ? 'Önemsiz Risk' : null));
              return (
                <div className={`p-4 rounded-2xl border transition-all shadow-xs ${
                  hasFinalEvaluation 
                    ? `${finTheme.cardBg} ${finTheme.cardBorder}` 
                    : 'bg-muted/20 border-dashed border-border/80 opacity-70'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[11px] font-black uppercase tracking-wider ${hasFinalEvaluation ? finTheme.textColor : 'text-muted-foreground'}`}>
                      3. Son Skor
                    </span>
                    {risk.finalScore ? (
                      <span className={`text-xs font-mono font-black px-2 py-0.5 rounded-md ${finTheme.badge}`}>
                        {risk.finalScore} P
                      </span>
                    ) : (
                      <span className="text-[10px] text-muted-foreground">-</span>
                    )}
                  </div>
                  <h4 className="text-sm font-bold text-foreground tracking-tight line-clamp-1">
                    {risk.finalLevel || (risk.finalScore ? 'İyileştirildi' : 'Değerlendirilmedi')}
                  </h4>
                  <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
                    <span>Değerlendirme:</span>
                    <span className="font-semibold text-foreground">
                      {risk.actionDate ? new Date(risk.actionDate).toLocaleDateString('tr-TR') : '-'}
                    </span>
                  </div>
                </div>
              );
            })()}

            {/* 4. Aşama: Nihai Durum & Kapatma */}
            <div className={`p-4 rounded-2xl border transition-all shadow-xs ${
              isClosed 
                ? 'bg-gradient-to-br from-emerald-500/20 via-card to-background border-emerald-500/50 dark:border-emerald-500/60 ring-1 ring-emerald-500/20' 
                : 'bg-gradient-to-br from-sky-500/10 via-card to-background border-sky-400/40 dark:border-sky-600/40'
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[11px] font-black uppercase tracking-wider ${isClosed ? 'text-emerald-600 dark:text-emerald-400' : 'text-sky-600 dark:text-sky-400'}`}>
                  4. Nihai Durum
                </span>
                {isClosed ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                ) : (
                  <Clock className="w-4 h-4 text-sky-600 dark:text-sky-400" />
                )}
              </div>
              <h4 className="text-sm font-bold text-foreground tracking-tight line-clamp-1">
                {statusNames[risk.status] || risk.status}
              </h4>
              <div className="text-[11px] text-muted-foreground mt-2 flex items-center justify-between border-t border-border/40 pt-2">
                <span>Kontrol Sonucu:</span>
                <span className="font-semibold text-foreground truncate max-w-[110px] text-right">
                  {risk.controlResult ? 'Onaylandı' : 'Süreçte'}
                </span>
              </div>
            </div>

          </div>

          {/* Alt Alan: Ferah Yaşam Boyu Skor Eğrisi Grafiği */}
          <div className="mt-4 p-4 rounded-2xl border border-border/70 bg-gradient-to-b from-muted/30 to-background">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-primary" /> Fine-Kinney Risk Skoru Azalım Eğrisi
              </span>
              <span className="text-[11px] text-muted-foreground font-mono">
                Yeşil kesikli çizgi kabul edilebilir sınır (≤ 20 Puan)
              </span>
            </div>
            <div className="h-32 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="scoreColor" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.45}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.02}/>
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="stage" tick={{ fontSize: 11 }} stroke="currentColor" className="text-muted-foreground font-medium" />
                  <YAxis tick={{ fontSize: 10 }} stroke="currentColor" className="text-muted-foreground font-medium" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))', 
                      borderColor: 'hsl(var(--border))', 
                      borderRadius: '10px', 
                      fontSize: '12px',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
                    }} 
                    formatter={(val: any) => [`${val} Puan`, 'Fine-Kinney Skoru']}
                  />
                  <ReferenceLine y={20} stroke="#10b981" strokeDasharray="4 4" label={{ value: 'Kabul Edilebilir Sınır (20)', fill: '#10b981', fontSize: 10, position: 'top' }} />
                  <Area type="monotone" dataKey="score" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#scoreColor)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </Card>

      {/* ─── İKİLİ ÇALIŞMA ALANI & SEKMELER ────────────────────────────────── */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        
        {/* Sekme Seçiciler */}
        <div className="flex items-center justify-between border-b pb-3">
          <TabsList className="h-10 p-1 bg-muted/60 rounded-xl">
            <TabsTrigger value="details" className="text-xs font-bold px-5 rounded-lg data-[state=active]:shadow-xs">
              <Activity className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Risk Kartı & Detaylar
            </TabsTrigger>
            <TabsTrigger value="history" className="text-xs font-bold px-5 rounded-lg data-[state=active]:shadow-xs">
              <History className="w-3.5 h-3.5 mr-1.5 text-primary" />
              Aksiyon Geçmişi ({risk.auditLogs?.length || 0})
            </TabsTrigger>
          </TabsList>

          <span className="text-xs text-muted-foreground hidden sm:inline-block">
            {activeTab === 'details' ? 'Tüm teknik bölümler ve Fine-Kinney parametreleri' : 'Riskin yaşam döngüsü boyunca geçirdiği tüm evreler'}
          </span>
        </div>

        {/* ─── TAB 1: RİSK DETAYLARI ────────────────────────────────────────── */}
        <TabsContent value="details" className="space-y-6 focus-visible:outline-none">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Sol Kolon (Bölüm 1, 2, 3, 4) */}
            <div className="lg:col-span-2 space-y-6">
              
              {/* 1. BÖLÜM: GENEL BİLGİLER (Canlı Mavi / İndigo Teması) */}
              <Card className="shadow-md border-sky-500/30 dark:border-sky-500/40 bg-gradient-to-br from-sky-500/5 via-card to-background overflow-hidden">
                <CardHeader className="p-4 border-b border-sky-500/20 bg-sky-500/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-sky-950 dark:text-sky-200">
                    <div className="w-7 h-7 rounded-lg bg-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-300">
                      <Activity className="w-4 h-4" />
                    </div>
                    1. Bölüm: Genel Bilgiler
                  </CardTitle>
                  <span className="text-[11px] font-mono font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/15 text-sky-700 dark:text-sky-300 border border-sky-300/60 dark:border-sky-700/60">
                    {risk.method || 'Fine-Kinney Metodu'}
                  </span>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pb-4 border-b border-border/60">
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Tespit Tarihi</span>
                      <span className="font-bold text-foreground text-sm">
                        {risk.detectionDate ? new Date(risk.detectionDate).toLocaleDateString('tr-TR') : '-'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Risk Kategorisi</span>
                      <span className="font-bold text-foreground text-sm">{risk.riskCategory || '-'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50 sm:col-span-2">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Alt Risk Kategorisi</span>
                      <span className="font-bold text-foreground text-sm">{risk.subCategory || '-'}</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Birim / Departman</span>
                      <span className="font-bold text-foreground text-sm">{loc?.department || risk.department?.name || '-'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Alan / Mahal</span>
                      <span className="font-bold text-foreground text-sm">{risk.area || loc?.description || '-'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Faaliyet (Yapılan İş)</span>
                      <span className="font-bold text-foreground text-sm">{risk.activity || '-'}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* 2. BÖLÜM: MEVCUT DURUM DEĞERLENDİRMESİ (Dinamik İlk Risk Seviyesine Göre Renklenir) */}
              {(() => {
                const initTh = getLevelTheme(risk.initialLevel);
                return (
                  <Card className={`shadow-md overflow-hidden ${initTh.cardBg} ${initTh.cardBorder}`}>
                    <CardHeader className={`p-4 border-b flex flex-row items-center justify-between ${initTh.headerBg}`}>
                      <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${initTh.badge}`}>
                          <ShieldAlert className="w-4 h-4 text-white" />
                        </div>
                        2. Bölüm: Mevcut Durum Değerlendirmesi
                      </CardTitle>
                      <LevelBadge level={risk.initialLevel} />
                    </CardHeader>
                    <CardContent className="p-5 space-y-4 text-xs">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border/60">
                        <div className="p-3 rounded-xl bg-background/90 border border-border/60">
                          <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Tehlike</span>
                          <span className="font-bold text-foreground text-sm block">{risk.hazard || '-'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-background/90 border border-border/60">
                          <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Risk (Olası Tehlikeli Olay)</span>
                          <span className="font-bold text-foreground text-sm block">{risk.riskDescription || '-'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border/60">
                        <div className="p-3 rounded-xl bg-background/90 border border-border/60">
                          <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Sonuç / Olası Etki Zarar</span>
                          <span className="font-semibold text-foreground">{risk.impactDamage || '-'}</span>
                        </div>
                        <div className="p-3 rounded-xl bg-background/90 border border-border/60">
                          <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Riskten Etkilenecek Kişiler</span>
                          <span className="font-semibold text-foreground">{risk.affectedPeople || '-'}</span>
                        </div>
                      </div>

                      <div>
                        <span className="text-muted-foreground block text-[11px] mb-1.5 font-medium">
                          Mevcut Durum Açıklaması (Tespit edilen riske ilişkin mevcut önlemler)
                        </span>
                        <p className="font-medium text-foreground bg-background/95 p-3 rounded-xl border border-border/70 leading-relaxed shadow-2xs">
                          {risk.initialCondition || '-'}
                        </p>
                      </div>

                      {/* Mevcut Durum Görselleri */}
                      {(() => {
                        const initImages: string[] = (risk.initialImages && risk.initialImages.length > 0)
                          ? risk.initialImages
                          : (risk.initialImage ? [risk.initialImage] : []);

                        if (initImages.length === 0) return null;

                        return (
                          <div className="pt-3 border-t border-border/60">
                            <span className="text-muted-foreground block text-[11px] mb-2 font-medium">
                              Mevcut Durum Fotoğrafları (Büyütmek için tıklayın)
                            </span>
                            <div className="flex flex-wrap gap-3">
                              {initImages.map((img, idx) => (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setPreviewImage({ url: img, title: `Mevcut Durum Görseli ${idx + 1}` })}
                                  className="group relative block w-28 h-20 rounded-xl border overflow-hidden hover:ring-2 hover:ring-primary transition-all bg-card cursor-pointer text-left shadow-xs"
                                >
                                  <img src={img} alt={`Mevcut Durum ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Eye className="w-5 h-5 text-white" />
                                  </div>
                                </button>
                              ))}
                            </div>
                          </div>
                        );
                      })()}

                      {/* Skor Kutusu (Dinamik Renk Kodlu) */}
                      <div className="p-4 rounded-2xl border bg-background/95 shadow-xs flex flex-wrap items-center justify-between gap-4 border-border/80">
                        <div className="flex items-center gap-6 sm:gap-8">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Olasılık (P)</span>
                            <span className="text-base font-black text-foreground">{risk.initialProb ?? '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Frekans (F)</span>
                            <span className="text-base font-black text-foreground">{risk.initialFreq ?? '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Şiddet (S)</span>
                            <span className="text-base font-black text-foreground">{risk.initialSev ?? '-'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 border-l border-border/80 pl-6">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Mevcut Risk Skoru</span>
                            <span className={`text-2xl font-black ${initTh.textColor}`}>{risk.initialScore || '-'}</span>
                          </div>
                          <LevelBadge level={risk.initialLevel} />
                        </div>
                      </div>

                      {risk.legislation && (
                        <div className="pt-2 border-t border-border/60 text-[11px] flex items-center gap-2">
                          <span className="text-muted-foreground font-bold">İlgili Mevzuat:</span>
                          <span className="font-semibold text-foreground">{risk.legislation}</span>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })()}

              {/* 3. BÖLÜM: İYİLEŞTİRME PLANI / UYGULAMA (Canlı Yeşil / Zümrüt Teması) */}
              <Card className="shadow-md border-emerald-500/30 dark:border-emerald-500/40 bg-gradient-to-br from-emerald-500/5 via-card to-background overflow-hidden">
                <CardHeader className="p-4 border-b border-emerald-500/20 bg-emerald-500/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-emerald-950 dark:text-emerald-200">
                    <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-300">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    3. Bölüm: İyileştirme Planı / Uygulama
                  </CardTitle>
                  {risk.finalLevel && <LevelBadge level={risk.finalLevel} />}
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div>
                    <span className="text-muted-foreground block text-[11px] mb-1.5 font-medium">
                      Alınacak Önlemler / İyileştirici Faaliyet
                    </span>
                    <p className="font-medium text-foreground bg-background/95 p-3 rounded-xl border border-border/70 leading-relaxed shadow-2xs">
                      {risk.firstActionPlan || '-'}
                    </p>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pb-3 border-b border-border/60">
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">İyileştirme Sorumlusu</span>
                      <span className="font-bold text-foreground text-sm">{risk.improvementResponsible || '-'}</span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Termin Tarihi</span>
                      <span className="font-bold text-foreground text-sm">
                        {risk.dueDate ? new Date(risk.dueDate).toLocaleDateString('tr-TR') : '-'}
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Termin Periyodu</span>
                      <span className="font-bold text-foreground text-sm">{risk.dueDatePeriod || '-'}</span>
                    </div>
                  </div>

                  <div>
                    <span className="text-muted-foreground block text-[11px] mb-1.5 font-medium">
                      İyileştirme Açıklaması (Yapılan iyileştirmeler)
                    </span>
                    <p className="font-medium text-foreground bg-background/95 p-3 rounded-xl border border-border/70 leading-relaxed shadow-2xs">
                      {risk.actionsTaken || '-'}
                    </p>
                  </div>

                  {/* İyileştirme Sonrası Görselleri */}
                  {(() => {
                    const actImages: string[] = (risk.actionImages && risk.actionImages.length > 0)
                      ? risk.actionImages
                      : (risk.actionImage ? [risk.actionImage] : []);

                    if (actImages.length === 0) return null;

                    return (
                      <div className="pt-3 border-t border-border/60">
                        <span className="text-muted-foreground block text-[11px] mb-2 font-medium">
                          İyileştirme Sonrası Fotoğrafları (Büyütmek için tıklayın)
                        </span>
                        <div className="flex flex-wrap gap-3">
                          {actImages.map((img, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setPreviewImage({ url: img, title: `İyileştirme Sonrası Görseli ${idx + 1}` })}
                              className="group relative block w-28 h-20 rounded-xl border overflow-hidden hover:ring-2 hover:ring-emerald-500 transition-all bg-card cursor-pointer text-left shadow-xs"
                            >
                              <img src={img} alt={`İyileştirme ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Eye className="w-5 h-5 text-white" />
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  {/* İyileştirme Sonrası Risk Skoru (Çıkan Sonuca Göre Renklenir) */}
                  {(() => {
                    const resTheme = getLevelTheme(risk.finalLevel || (risk.finalScore ? 'Önemsiz Risk' : null));
                    return (
                      <div className={`p-4 rounded-2xl border shadow-xs flex flex-wrap items-center justify-between gap-4 ${
                        risk.finalScore ? `${resTheme.cardBg} ${resTheme.cardBorder}` : 'bg-background/95 border-border/80'
                      }`}>
                        <div className="flex items-center gap-6 sm:gap-8">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Son Olasılık</span>
                            <span className="text-base font-black text-foreground">{risk.finalProb ?? '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Son Frekans</span>
                            <span className="text-base font-black text-foreground">{risk.finalFreq ?? '-'}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">Son Şiddet</span>
                            <span className="text-base font-black text-foreground">{risk.finalSev ?? '-'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-4 border-l border-border/80 pl-6">
                          <div>
                            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">İyileştirme Sonrası Skor</span>
                            <span className={`text-2xl font-black ${risk.finalScore ? resTheme.textColor : 'text-muted-foreground'}`}>
                              {risk.finalScore ?? '-'}
                            </span>
                          </div>
                          {risk.finalLevel && <LevelBadge level={risk.finalLevel} />}
                        </div>
                      </div>
                    );
                  })()}
                </CardContent>
              </Card>

              {/* 4. BÖLÜM: ETKİNLİK ÖLÇÜMÜ & YAŞAM DÖNGÜSÜ DEVAMI (Mor / İndigo Teması) */}
              <Card className="shadow-md border-indigo-500/30 dark:border-indigo-500/40 bg-gradient-to-br from-indigo-500/5 via-card to-background overflow-hidden">
                <CardHeader className="p-4 border-b border-indigo-500/20 bg-indigo-500/10 flex flex-row items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2 text-indigo-950 dark:text-indigo-200">
                    <div className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-300">
                      <FileText className="w-4 h-4" />
                    </div>
                    4. Bölüm: İyileştirme Etkinlik Ölçümü & Yaşam Döngüsü
                  </CardTitle>
                  <Button 
                    size="sm" 
                    variant="outline"
                    onClick={openNextStepDialog}
                    className="h-8 text-xs font-bold bg-background text-indigo-600 border-indigo-300 hover:bg-indigo-50 shadow-xs"
                  >
                    <PlayCircle className="w-3.5 h-3.5 mr-1" />
                    Aksiyonu Güncelle / Kapat
                  </Button>
                </CardHeader>
                <CardContent className="p-5 space-y-4 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pb-4 border-b border-border/60">
                    <div className="p-3 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">Etkinlik Ölçüm Yöntemi</span>
                      <span className="font-bold text-foreground text-sm">{risk.effectivenessMethod || '-'}</span>
                    </div>
                    <div className="p-3 rounded-xl bg-background/80 border border-border/50">
                      <span className="text-muted-foreground block text-[11px] mb-1 font-medium">İyileştirme Kontrol Sorumlusu</span>
                      <span className="font-bold text-foreground text-sm">{risk.controlResponsible || '-'}</span>
                    </div>
                  </div>

                  <div className="pb-4 border-b border-border/60">
                    <span className="text-muted-foreground block text-[11px] mb-1.5 font-medium">Denetim / Kontrol Sonucu</span>
                    <p className="font-medium text-foreground bg-background/95 p-3.5 rounded-xl border border-border/70 leading-relaxed shadow-2xs">
                      {risk.controlResult || 'Henüz bir etkinlik sonucu işlenmedi.'}
                    </p>
                  </div>

                  {/* Etkinlik Kanıt Fotoğrafları */}
                  {risk.effectivenessImages && risk.effectivenessImages.length > 0 && (
                    <div className="pb-4 border-b border-border/60">
                      <span className="text-muted-foreground block text-[11px] mb-2 font-medium">
                        Etkinlik Kontrol Kanıt Görselleri
                      </span>
                      <div className="flex flex-wrap gap-3">
                        {risk.effectivenessImages.map((img: string, idx: number) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => setPreviewImage({ url: img, title: `Etkinlik Kanıt Görseli ${idx + 1}` })}
                            className="group relative block w-28 h-20 rounded-xl border overflow-hidden hover:ring-2 hover:ring-indigo-500 transition-all bg-card cursor-pointer text-left shadow-xs"
                          >
                            <img src={img} alt={`Etkinlik ${idx + 1}`} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                              <Eye className="w-5 h-5 text-white" />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Ekli Dokümanlar (PDF, Tutanak, Rapor vb.) */}
                  {risk.documents && risk.documents.length > 0 && (
                    <div>
                      <span className="text-muted-foreground block text-[11px] mb-2 font-medium">
                        Ekli Belgeler ve Denetim Tutanakları
                      </span>
                      <div className="flex flex-wrap gap-2.5">
                        {risk.documents.map((doc: any, idx: number) => (
                          <a
                            key={idx}
                            href={doc.url}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-2 px-3.5 py-2 rounded-xl border border-indigo-200 dark:border-indigo-800 bg-background/90 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/30 transition-colors text-xs font-semibold text-foreground shadow-2xs"
                          >
                            <Paperclip className="w-3.5 h-3.5 text-indigo-600" />
                            <span className="truncate max-w-[200px]">{doc.name || `Doküman ${idx + 1}`}</span>
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

            </div>

            {/* Sağ Kolon: Hızlı Aksiyon Geçmişi Özeti (Karta tıklanınca üst sekmeye geçer) */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="shadow-xs border-border overflow-hidden sticky top-6">
                <CardHeader className="p-4 border-b bg-muted/20 flex flex-row items-center justify-between">
                  <div className="flex items-center gap-2">
                    <History className="w-4 h-4 text-primary" />
                    <CardTitle className="text-sm font-bold text-foreground">Aksiyon Geçmişi</CardTitle>
                  </div>
                  <span className="font-mono text-xs px-2.5 py-0.5 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                    {risk.auditLogs?.length || 0}
                  </span>
                </CardHeader>
                
                <CardContent className="p-4 space-y-3">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Bu riskin başlangıçtan bugüne geçirdiği tüm durum değişiklikleri ve skor evreleri kayıt altındadır.
                  </p>

                  {/* Son 3 aksiyonun kompakt listesi */}
                  <div className="space-y-2.5 pt-2">
                    {risk.auditLogs && risk.auditLogs.slice(0, 3).map((log: any) => (
                      <div 
                        key={log.id} 
                        onClick={() => setActiveTab('history')}
                        className="p-2.5 rounded-xl border border-border/60 bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="font-bold text-foreground truncate">{log.action}</span>
                          <span className="text-[10px] text-muted-foreground font-mono">
                            {new Date(log.createdAt).toLocaleDateString('tr-TR')}
                          </span>
                        </div>
                        <p className="text-[11px] text-muted-foreground line-clamp-1">
                          {log.details || 'Detaylar için tıklayın'}
                        </p>
                      </div>
                    ))}
                  </div>

                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={() => setActiveTab('history')}
                    className="w-full mt-3 text-xs font-semibold"
                  >
                    Tüm Aksiyon Geçmişini İncele ({risk.auditLogs?.length || 0})
                    <ChevronRight className="w-3.5 h-3.5 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>

          </div>
        </TabsContent>

        {/* ─── TAB 2: AKSİYON GEÇMİŞİ & EVRELER (GENİŞ ZİNCİR GÖRÜNÜMÜ) ─────── */}
        <TabsContent value="history" className="space-y-6 focus-visible:outline-none">
          <Card className="shadow-xs border-border overflow-hidden">
            <CardHeader className="p-5 border-b bg-muted/20 flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                  <History className="w-4 h-4 text-primary" />
                  Risk Evreleri ve Aksiyon Geçmişi
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground mt-0.5">
                  Riskin ilk tespitinden (tolere gösterilmez/yüksek) önemsiz seviyeye ve kapatılma aşamasına kadar geçirdiği süreç zinciri.
                </CardDescription>
              </div>
              <span className="font-mono text-xs px-3 py-1 rounded-full font-semibold bg-primary/10 text-primary border border-primary/20">
                Toplam {risk.auditLogs?.length || 0} Adım
              </span>
            </CardHeader>
            
            <CardContent className="p-6">
              {risk.auditLogs && risk.auditLogs.length > 0 ? (
                <div className="relative pl-6 space-y-8 max-w-3xl">
                  {/* Zaman Çizgisi Dikey Hattı */}
                  <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-border"></div>

                  {risk.auditLogs.map((log: any, idx: number) => {
                    const isLatest = idx === 0;
                    return (
                      <div key={log.id} className="relative pl-6 group">
                        {/* Zaman Noktası */}
                        <div className={`absolute -left-[9px] top-1.5 w-4 h-4 rounded-full border-2 ring-4 ring-background transition-all ${
                          isLatest 
                            ? 'bg-primary border-primary ring-primary/20' 
                            : 'bg-background border-muted-foreground/60'
                        }`}></div>
                        
                        <div className="p-4 rounded-2xl border border-border/80 bg-card shadow-xs space-y-2">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-sm text-foreground">{log.action}</span>
                              {isLatest && (
                                <Badge variant="outline" className="text-[10px] bg-primary/10 text-primary border-primary/20">
                                  En Son İşlem
                                </Badge>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground font-mono flex items-center gap-1 bg-muted/40 px-2 py-0.5 rounded-md border border-border/50">
                                <Calendar className="w-3 h-3 text-primary" />
                                {new Date(log.createdAt).toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-7 px-2 text-[11px] text-muted-foreground hover:text-primary gap-1 rounded-lg border border-transparent hover:border-border"
                                title="Aksiyon Kayıt Tarihini / Detayını Değiştir"
                                onClick={() => {
                                  const d = new Date(log.createdAt);
                                  const dateStr = !isNaN(d.getTime()) ? d.toISOString().slice(0, 10) : '';
                                  setEditingLog({
                                    id: log.id,
                                    action: log.action || '',
                                    details: log.details || '',
                                    date: dateStr
                                  });
                                }}
                              >
                                <Pencil className="w-3 h-3" />
                                Tarihi Düzelt
                              </Button>
                            </div>
                          </div>

                          <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 opacity-70" /> 
                            İşlemi Yapan: <span className="font-semibold text-foreground">{log.displayName || log.userFullName || log.user?.fullName || log.username}</span>
                          </p>
                          
                          {log.details && (
                            <p className="text-xs text-foreground/90 bg-muted/25 p-3 rounded-xl border border-border/40 leading-relaxed">
                              {log.details}
                            </p>
                          )}
                          
                          {/* Değişen Alanların Kullanıcı Dostu Karşılaştırması */}
                          {log.changedFields && Object.keys(log.changedFields).length > 0 && (
                            <div className="mt-3 pt-3 border-t border-border/60">
                              <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                                Değişen Parametreler
                              </span>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                                {Object.entries(log.changedFields).map(([key, val]: any) => (
                                  <div key={key} className="p-2 rounded-xl bg-muted/40 border border-border/40 space-y-0.5">
                                    <span className="text-[11px] font-semibold text-muted-foreground block">
                                      {fieldNames[key] || key}
                                    </span>
                                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                                      <span className="line-through text-muted-foreground/70">{formatLogValue(key, val.old)}</span>
                                      <ArrowRight className="w-3 h-3 text-muted-foreground" />
                                      <span className="text-emerald-600 dark:text-emerald-400 font-bold">{formatLogValue(key, val.new)}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-16 text-muted-foreground text-xs space-y-2">
                  <Clock className="w-10 h-10 mx-auto opacity-30" />
                  <p className="font-semibold text-sm">Henüz bir aksiyon kaydı bulunmuyor.</p>
                  <p>Bu risk üzerinde düzenleme yapıldıkça evreler burada kronolojik zincir olarak listelenecektir.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

      </Tabs>

      {/* ─── 4. BÖLÜM: YAŞAM DÖNGÜSÜ DEVAMI / ETKİNLİK & KAPATMA DİALOGU ──── */}
      <Dialog open={showNextStepModal} onOpenChange={setShowNextStepModal}>
        <DialogContent className="max-w-2xl p-6 bg-card">
          <DialogHeader className="border-b pb-4">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" />
              Yaşam Döngüsü: Etkinlik Ölçümü, Durum & Kapatma
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-3 text-xs">
            
            {/* Durum Seçimi */}
            <div className="space-y-1.5">
              <label className="font-semibold text-foreground block">Risk Nihai Durumu *</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'ACIK_TEHLIKE', label: 'Açık Tehlike' },
                  { id: 'ILK_MUDAHALE_EDILDI', label: 'İlk Müdahale' },
                  { id: 'TAKIP_SURECINDE', label: 'Takip Sürecinde' },
                  { id: 'KAPATILDI_GUVENLI', label: 'Kapatıldı ✓' },
                ].map((st) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setStatusInput(st.id)}
                    className={`py-2 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                      statusInput === st.id 
                        ? 'bg-primary text-primary-foreground border-primary shadow-xs' 
                        : 'bg-muted/30 border-border hover:bg-muted/60 text-muted-foreground'
                    }`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">İşlem / Kapatma Tarihi *</label>
                <Input 
                  type="date" 
                  value={statusDateInput} 
                  onChange={(e) => setStatusDateInput(e.target.value)} 
                />
              </div>
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">İyileştirme Kontrol Sorumlusu</label>
                <Input 
                  placeholder="Örn: İSG Uzmanı Ahmet Yılmaz" 
                  value={controlResponsibleInput} 
                  onChange={(e) => setControlResponsibleInput(e.target.value)} 
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Etkinlik Ölçüm Yöntemi</label>
              <Input 
                placeholder="Örn: 30 gün boyunca haftalık saha kontrolleri yapıldı" 
                value={effectivenessMethodInput} 
                onChange={(e) => setEffectivenessMethodInput(e.target.value)} 
              />
            </div>

            <div className="space-y-1.5">
              <label className="font-semibold text-muted-foreground">Denetim / Kontrol Sonucu Açıklaması</label>
              <Textarea 
                placeholder="Alınan önlemler sahada doğrulanmış olup risk kabul edilebilir seviyeye indirilmiştir..." 
                rows={3} 
                value={controlResultInput} 
                onChange={(e) => setControlResultInput(e.target.value)} 
              />
            </div>

            {/* Kanıt Fotoğrafları Ekleme */}
            <div className="space-y-2 pt-2 border-t">
              <label className="font-semibold text-muted-foreground flex items-center justify-between">
                <span>Etkinlik Kanıt Fotoğrafları (Maks 5)</span>
                {isUploading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />}
              </label>

              <div className="flex flex-wrap items-center gap-3">
                {effImages.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-14 rounded-lg border overflow-hidden shrink-0">
                    <img src={img} alt={`Kanıt ${idx + 1}`} className="w-full h-full object-cover" />
                    <button 
                      type="button" 
                      onClick={() => setEffImages(prev => prev.filter((_, i) => i !== idx))} 
                      className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white transition-opacity"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}

                {effImages.length < 5 && (
                  <label className="flex flex-col items-center justify-center w-20 h-14 rounded-lg border border-dashed border-border/80 hover:border-primary/60 cursor-pointer bg-muted/20 text-[11px] text-muted-foreground">
                    <Upload className="w-4 h-4 mb-0.5 text-primary" />
                    <span>Görsel</span>
                    <input type="file" accept="image/*" className="hidden" onChange={(e) => handleFileUpload(e, false)} />
                  </label>
                )}
              </div>
            </div>

            {/* Doküman Ekleme (PDF, Tutanak vb.) */}
            <div className="space-y-2 pt-2 border-t">
              <label className="font-semibold text-muted-foreground block">Denetim Tutanakları / Belgeler</label>
              
              <div className="flex flex-wrap gap-2">
                {docs.map((doc, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border bg-muted/30 text-[11px]">
                    <Paperclip className="w-3 h-3 text-primary shrink-0" />
                    <span className="truncate max-w-[140px] font-medium">{doc.name}</span>
                    <button 
                      type="button" 
                      onClick={() => setDocs(prev => prev.filter((_, i) => i !== idx))} 
                      className="text-muted-foreground hover:text-destructive ml-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                <label className="flex items-center gap-1 px-3 py-1 rounded-lg border border-dashed border-border/80 hover:border-primary/60 cursor-pointer bg-muted/20 text-[11px] font-medium text-muted-foreground">
                  <Plus className="w-3.5 h-3.5 text-primary" />
                  <span>Doküman Ekle</span>
                  <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, true)} />
                </label>
              </div>
            </div>

          </div>

          <div className="flex items-center justify-end gap-2 border-t pt-4">
            <Button variant="ghost" size="sm" onClick={() => setShowNextStepModal(false)}>
              Vazgeç
            </Button>
            <Button 
              size="sm" 
              onClick={() => nextStepMutation.mutate()} 
              disabled={nextStepMutation.isPending}
              className="bg-primary text-primary-foreground font-semibold"
            >
              {nextStepMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
              Aksiyonu Kaydet
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── AKSİYON LOGU TARİHİ VE DETAYINI DÜZENLEME MODALI ─────────────── */}
      {editingLog && (
        <Dialog open={!!editingLog} onOpenChange={(open) => !open && setEditingLog(null)}>
          <DialogContent className="max-w-md p-6 bg-card">
            <DialogHeader className="border-b pb-3">
              <DialogTitle className="text-base font-bold flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                Aksiyon Geçmişi Kaydını Düzenle
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-3 text-xs">
              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Aksiyon Başlığı</label>
                <Input 
                  value={editingLog.action} 
                  onChange={(e) => setEditingLog({ ...editingLog, action: e.target.value })} 
                />
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-foreground">Gerçekleşme / Kayıt Tarihi *</label>
                <Input 
                  type="date" 
                  value={editingLog.date} 
                  onChange={(e) => setEditingLog({ ...editingLog, date: e.target.value })} 
                />
                <p className="text-[11px] text-muted-foreground">
                  Geçmişe dönük girilen risklerde kronolojik sıranın ve yılın (örneğin 2024) doğru yansıması için tarihi dilediğiniz gibi değiştirebilirsiniz.
                </p>
              </div>

              <div className="space-y-1.5">
                <label className="font-semibold text-muted-foreground">Açıklama / Not</label>
                <Textarea 
                  rows={3} 
                  value={editingLog.details} 
                  onChange={(e) => setEditingLog({ ...editingLog, details: e.target.value })} 
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 border-t pt-4">
              <Button variant="ghost" size="sm" onClick={() => setEditingLog(null)}>
                Vazgeç
              </Button>
              <Button 
                size="sm" 
                disabled={updateLogMutation.isPending || !editingLog.date}
                onClick={() => updateLogMutation.mutate({
                  logId: editingLog.id,
                  createdAt: editingLog.date,
                  details: editingLog.details,
                  action: editingLog.action,
                })} 
                className="bg-primary text-primary-foreground font-semibold"
              >
                {updateLogMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Check className="w-4 h-4 mr-1.5" />}
                Tarihi Güncelle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* ─── FOTOĞRAF ÖNİZLEME MODALI (LIGHTBOX) ───────────────────────────── */}
      {previewImage && (
        <Dialog open={!!previewImage} onOpenChange={(open) => !open && setPreviewImage(null)}>
          <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black/95 border-none text-white">
            <div className="p-4 flex items-center justify-between border-b border-white/10">
              <span className="text-sm font-semibold">{previewImage.title}</span>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => setPreviewImage(null)}
                className="text-white hover:bg-white/10 rounded-full h-8 w-8"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="p-4 flex items-center justify-center max-h-[75vh] overflow-hidden">
              <img 
                src={previewImage.url} 
                alt={previewImage.title} 
                className="max-h-[70vh] w-auto max-w-full object-contain rounded-lg shadow-2xl" 
              />
            </div>
          </DialogContent>
        </Dialog>
      )}

    </div>
  );
}
