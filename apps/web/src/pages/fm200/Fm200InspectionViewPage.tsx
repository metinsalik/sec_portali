import React, { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Printer,
  Edit2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MinusCircle,
  Flame,
  Building2,
  ShieldAlert,
  ShieldCheck,
  Calendar,
  User,
  Copy,
  Check,
  Search,
  Filter,
  Wrench,
  ClipboardList,
  FileText,
  DoorOpen,
  Camera,
  Download,
  X,
  Gauge,
  Maximize2
} from 'lucide-react';
import { toast } from 'sonner';

// Varsayılan Soru Listesi (Eğer backend ayarlarından gelmezse)
const DEFAULT_QUESTIONS_FALLBACK = [
  { id: 1, category: 'Fiziksel Güvenlik ve Ortam', text: 'Gaz tüpleri mahal dışında ve yetkisiz erişimden korunacak şekilde mi?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 2, category: 'Fiziksel Güvenlik ve Ortam', text: 'Gaz tüpleri doğrudan güneş ışığı, ısı veya titreşime maruz kalıyor mu?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 3, category: 'Fiziksel Güvenlik ve Ortam', text: 'Kontrol paneli mahal dışında ve korunmuş şekilde mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 4, category: 'Fiziksel Güvenlik ve Ortam', text: 'Duvar, tavan, döşeme geçişleri ve kablo tavalarında sızdırmazlık tam mı?', weight: 10, criticality: 'KRİTİK', isSealing: true },
  { id: 5, category: 'Fiziksel Güvenlik ve Ortam', text: 'Kapı altları, contalar ve birleşim yerleri yeterli sızdırmazlıkta mı?', weight: 10, criticality: 'Yüksek', isSealing: true },
  { id: 6, category: 'Fiziksel Güvenlik ve Ortam', text: 'Havalandırma açıklıkları/damperler gaz boşalmasında otomatik kapanıyor mu?', weight: 10, criticality: 'KRİTİK', isSealing: true },
  { id: 7, category: 'Fiziksel Güvenlik ve Ortam', text: 'Odanın mevcut kullanım düzeni ve net hacmi tasarım hacmiyle uyumlu mu?', weight: 10, criticality: 'Standart', isSealing: true },
  { id: 8, category: 'Fiziksel Güvenlik ve Ortam', text: 'Güncel Door Fan Test raporu var mı ve gaz tutma süresi standardı sağlıyor mu?', weight: 10, criticality: 'KRİTİK', isSealing: true },
  { id: 9, category: 'Etiketleme ve İşaretleme', text: 'Tüpler üzerinde üretici, içerik, seri no etiketleri okunabilir mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 10, category: 'Etiketleme ve İşaretleme', text: 'Tüpler üzerinde güncel dolum ve kontrol tarihleri mevcut mu?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 11, category: 'Etiketleme ve İşaretleme', text: 'Giriş kapısında tehlike uyarı levhası var mı?', weight: 3, criticality: 'Düşük', isSealing: false },
  { id: 12, category: 'Tesisat ve Donanım', text: 'Tüpler dolu, kullanıma hazır ve manometre basınçları yeşil alanda mı?', weight: 10, criticality: 'KRİTİK', isSealing: false },
  { id: 13, category: 'Tesisat ve Donanım', text: 'Sistem normal işletim koşullarında "Otomatik" modda mı?', weight: 5, criticality: 'KRİTİK', isSealing: false },
  { id: 14, category: 'Tesisat ve Donanım', text: 'Acil durdurma butonu mahal dışında, erişilebilir ve çalışır durumda mı?', weight: 5, criticality: 'Standart', isSealing: false },
  { id: 15, category: 'Tesisat ve Donanım', text: 'Nozul atış yönünde gaz dağılımını engelleyen kabin, tava vb. engel var mı?', weight: 10, criticality: 'KRİTİK', isSealing: false },
  { id: 16, category: 'Tesisat ve Donanım', text: 'Asma tavan veya yükseltilmiş döşemede ayrı nozul koruması var mı?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 17, category: 'Tesisat ve Donanım', text: 'Dedektörler yangını erken algılayacak konumda mı?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 18, category: 'Tesisat ve Donanım', text: 'Dedektör çevrelerinde hava akışını/dumanı engelleyen bariyer var mı?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 19, category: 'Tesisat ve Donanım', text: 'Asma tavan ve döşeme altında gereken algılama sağlanmış mı?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 20, category: 'Periyodik Kontrol & Bakım', text: 'Yetkili kurum periyodik kontrol raporları eksiksiz ve güncel mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 21, category: 'Periyodik Kontrol & Bakım', text: 'Üretici talimatlarına uygun düzenli bakım kayıtları mevcut mu?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 22, category: 'Acil Durum Senaryoları', text: 'Boşalma öncesi çalışanları uyaran sesli ve ışıklı alarm sistemi var mı?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 23, category: 'Acil Durum Senaryoları', text: 'Genel yangın ihbar sistemine entegrasyon test edilmiş mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 24, category: 'Acil Durum Senaryoları', text: 'Yangın damperi ve havalandırma durdurma otomasyonu entegre çalışıyor mu?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 25, category: 'Acil Durum Senaryoları', text: 'Boşalma sonrası gaz tahliyesi için mekanik/doğal tahliye sistemi var mı?', weight: 7, criticality: 'Standart', isSealing: false }
];

const GATEKEEPER_IDS = [4, 6, 8, 12, 13, 15];
const SEALING_IDS = [4, 5, 6, 7, 8];

export default function Fm200InspectionViewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // Tab & Filtre State'leri
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all'); // all, issues, compliant, scope, gatekeeper, sealing
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isCopiedUid, setIsCopiedUid] = useState<boolean>(false);

  // Lightbox Resim Büyütme Modal State'i
  const [lightboxImage, setLightboxImage] = useState<{ url: string; name?: string } | null>(null);

  // Denetim Detayını Çek
  const { data: inspection, isLoading, error } = useQuery<any>({
    queryKey: ['fm200InspectionDetail', id],
    queryFn: async () => {
      const res = await api.get(`/fm200/inspections/${id}`);
      if (!res.ok) throw new Error('Denetim kaydı bulunamadı');
      return res.json();
    },
    enabled: !!id
  });

  // Sorular Listesi (Backend'den gelmişse oradan, yoksa fallback)
  const questions = useMemo(() => {
    return inspection?.checklistQuestions || DEFAULT_QUESTIONS_FALLBACK;
  }, [inspection]);

  // Yanıtlar Objesi
  const responses = useMemo(() => {
    return (inspection?.itemResponses as Record<string | number, any>) || {};
  }, [inspection]);

  // Kategoriler Listesi
  const categories = useMemo(() => {
    const set = new Set<string>();
    questions.forEach((q: any) => {
      if (q.category) set.add(q.category);
    });
    return Array.from(set);
  }, [questions]);

  const loc = inspection?.location || {};
  const fac = loc.facility || {};
  const isCompleted = inspection?.isCompleted !== false && inspection?.status === 'Tamamlandi';
  const complianceScore = Math.round(Number(inspection?.complianceScore) || 0);
  const sealingScore = Math.round(Number(inspection?.sealingScore ?? inspection?.complianceScore) || 0);
  const hardwareScore = Math.round(Number(inspection?.hardwareScore ?? inspection?.complianceScore) || 0);

  // Gatekeeper İhlalleri (Red Flag)
  const redFlagIssues = useMemo(() => {
    return questions.filter((q: any) => {
      if (!GATEKEEPER_IDS.includes(q.id)) return false;
      const resp = responses[q.id] || responses[String(q.id)];
      return resp && (resp.status === 'Karşılamıyor' || resp.status === 'Kısmen Karşılıyor');
    });
  }, [questions, responses]);

  // Uygunsuzluk Sayısı (Kısmen + Karşılamıyor)
  const totalIssuesCount = useMemo(() => {
    return questions.filter((q: any) => {
      const resp = responses[q.id] || responses[String(q.id)];
      return resp && (resp.status === 'Karşılamıyor' || resp.status === 'Kısmen Karşılıyor');
    }).length;
  }, [questions, responses]);

  // ──────────────────────────────────────────────────────────────────────────
  // SAHA İŞ LİSTESİ: ÜSTTE GÖRÜNECEK OLAN İŞLER VE TESPİTLER (FOTOĞRAFLARIYLA)
  // ──────────────────────────────────────────────────────────────────────────
  const actionListItems = useMemo(() => {
    const items: any[] = [];
    const seenCodes = new Set<string>();

    // 1. Önce doğrudan location.workOrders içindeki kayıtları al
    (loc.workOrders || []).forEach((wo: any) => {
      const code = wo.sourceCode || wo.title;
      seenCodes.add(code);

      // Fotoğraflar, hazır kalıplar ve notları senkronize et
      let itemPhotos = Array.isArray(wo.photos) && wo.photos.length > 0 ? wo.photos : [];
      let itemTemplates = Array.isArray(wo.templates) && wo.templates.length > 0 ? wo.templates : [];
      let itemNote = wo.customNote || '';

      const qMatch = (wo.sourceCode || '').match(/^S(\d+)$/i);
      if (qMatch) {
        const qId = parseInt(qMatch[1], 10);
        const qResp = responses[qId] || responses[String(qId)];
        if (qResp) {
          if (itemPhotos.length === 0 && Array.isArray(qResp.photos) && qResp.photos.length > 0) {
            itemPhotos = qResp.photos;
          }
          if (itemTemplates.length === 0 && Array.isArray(qResp.templates)) {
            itemTemplates = qResp.templates;
          }
          if (!itemNote && qResp.customNote) {
            itemNote = qResp.customNote;
          }
        }
      }

      items.push({
        id: wo.id,
        sourceCode: wo.sourceCode || 'İŞ',
        title: wo.title,
        responsible: wo.responsible || 'Teknik',
        trackLane: wo.trackLane || 'Fiziksel',
        workType: wo.workType || 'Kucuk',
        status: wo.status || 'Planlandi',
        dueDate: wo.dueDate,
        templates: itemTemplates,
        customNote: itemNote,
        photos: itemPhotos
      });
    });

    // 2. Eğer henüz workOrder açılmamış ama denetimde 'Kısmen Karşılıyor' veya 'Karşılamıyor' olan soru varsa listeye ekle
    questions.forEach((q: any) => {
      const resp = responses[q.id] || responses[String(q.id)];
      if (!resp) return;
      if (resp.status !== 'Karşılamıyor' && resp.status !== 'Kısmen Karşılıyor') return;

      const code = `S${q.id}`;
      if (seenCodes.has(code)) return;

      const respList = Array.isArray(resp.responsibles) && resp.responsibles.length > 0
        ? resp.responsibles
        : resp.responsible ? [resp.responsible] : ['Teknik'];

      respList.forEach((r: string, rIdx: number) => {
        items.push({
          id: `virtual-${q.id}-${rIdx}`,
          sourceCode: `S${q.id}`,
          title: `[Kriter ${q.id}] ${q.text} (${resp.status})`,
          responsible: r,
          trackLane: SEALING_IDS.includes(q.id) || q.isSealing ? 'Fiziksel' : 'Doküman',
          workType: r === 'Teknik' ? 'Kucuk' : 'Buyuk',
          status: 'Planlandi',
          dueDate: null,
          templates: Array.isArray(resp.templates) ? resp.templates : [],
          customNote: resp.customNote || '',
          photos: Array.isArray(resp.photos) ? resp.photos : []
        });
      });
    });

    return items;
  }, [loc.workOrders, questions, responses]);

  // Filtrelenmiş Sorular
  const filteredQuestions = useMemo(() => {
    return questions.filter((q: any) => {
      const resp = responses[q.id] || responses[String(q.id)] || { status: 'Karşılıyor' };
      const st = resp.status;

      // Kategori Filtresi
      if (filterCategory !== 'all' && q.category !== filterCategory) return false;

      // Durum Filtresi
      if (filterStatus === 'issues') {
        if (st !== 'Karşılamıyor' && st !== 'Kısmen Karşılıyor') return false;
      } else if (filterStatus === 'compliant') {
        if (st !== 'Karşılıyor') return false;
      } else if (filterStatus === 'scope') {
        if (st !== 'Kapsam Dışı') return false;
      } else if (filterStatus === 'gatekeeper') {
        if (!GATEKEEPER_IDS.includes(q.id)) return false;
      } else if (filterStatus === 'sealing') {
        if (!SEALING_IDS.includes(q.id) && !q.isSealing) return false;
      }

      // Arama Metni Filtresi
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const qNum = String(q.id);
        const text = (q.text || '').toLowerCase();
        const note = (resp.customNote || '').toLowerCase();
        const cat = (q.category || '').toLowerCase();
        const templates = Array.isArray(resp.templates) ? resp.templates.join(' ').toLowerCase() : '';

        const match =
          qNum === query ||
          text.includes(query) ||
          note.includes(query) ||
          cat.includes(query) ||
          templates.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [questions, responses, filterCategory, filterStatus, searchQuery]);

  // UID Panoya Kopyalama
  const handleCopyUid = (uid: string) => {
    if (!uid) return;
    navigator.clipboard.writeText(uid);
    setIsCopiedUid(true);
    toast.success(`Sistem UID (${uid}) panoya kopyalandı`);
    setTimeout(() => setIsCopiedUid(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/40 flex items-center justify-center animate-pulse">
          <Flame className="w-6 h-6 text-[#0051d5] animate-bounce" />
        </div>
        <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
          FM-200 Denetim Detay Raporu Yükleniyor...
        </div>
        <p className="text-xs text-slate-400">Veriler ve sızdırmazlık endeksleri getiriliyor.</p>
      </div>
    );
  }

  if (error || !inspection) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/40 flex items-center justify-center text-rose-600">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-lg font-bold text-slate-900 dark:text-white">Denetim Kaydı Bulunamadı</h2>
        <p className="text-xs text-slate-500 max-w-md">
          Talep edilen denetim kaydı sistemde mevcut değil veya erişim yetkiniz bulunmuyor.
        </p>
        <Button
          onClick={() => navigate('/fm200/wizard')}
          className="bg-[#0051d5] hover:bg-[#0042b0] text-white text-xs font-bold"
        >
          <ArrowLeft className="w-3.5 h-3.5 mr-1" />
          Denetim Sihirbazına Dön
        </Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* PRINT-ONLY OFFICIAL HEADER                                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="hidden print:block border-b-2 border-slate-900 pb-4 mb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-black uppercase tracking-tight text-slate-900">
              FM-200 Gazlı Yangın Söndürme & Sızdırmazlık Denetim Raporu
            </h1>
            <p className="text-xs text-slate-600 mt-1">
              Sağlık Hizmetleri Tesis Güvenliği & Yangın Korunum Sistemleri Denetim Formu
            </p>
          </div>
          <div className="text-right text-xs text-slate-700">
            <div><strong>Tarih:</strong> {new Date(inspection.inspectionDate).toLocaleDateString('tr-TR')}</div>
            <div><strong>UID:</strong> {loc.systemUid}</div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ÜST BAR & AKSİYON BUTONLARI (NO-PRINT)                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="no-print flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(`/fm200/wizard?facilityId=${loc.facilityId || ''}`)}
            className="h-9 px-3 text-xs font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-1.5" />
            Denetim Listesi
          </Button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-slate-400 font-medium">Denetim Görünümü /</span>
            <span className="font-mono text-xs font-black text-[#0051d5] dark:text-blue-400">
              {loc.systemUid || 'UID Yok'}
            </span>
            <Badge
              variant="outline"
              className={`text-[10px] font-bold ${
                isCompleted
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 animate-pulse'
              }`}
            >
              {isCompleted ? '✓ Denetim Tamamlandı' : '⏳ Devam Ediyor'}
            </Badge>
          </div>
        </div>

        <div className="flex items-center gap-2 self-end sm:self-auto">
          {/* Düzenle (Wizard'da Devam Et) Butonu */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/fm200/wizard?facilityId=${loc.facilityId || ''}&locationId=${loc.id}&inspectionId=${inspection.id}`)}
            className="h-9 text-xs text-blue-600 border-blue-200 hover:bg-blue-50 font-bold"
          >
            <Edit2 className="w-3.5 h-3.5 mr-1.5" />
            {isCompleted ? 'Denetimi Düzenle (Edit)' : 'Denetime Devam Et'}
          </Button>

          {/* İş Listesine Git */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/fm200/work-orders?facilityId=${loc.facilityId || ''}&locationId=${loc.id}`)}
            className="h-9 text-xs text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40 font-bold"
          >
            <ClipboardList className="w-3.5 h-3.5 mr-1.5 text-purple-600" />
            Saha İş Listesi ({actionListItems.length})
          </Button>

          {/* Yazdır / PDF Butonu */}
          <Button
            size="sm"
            onClick={() => window.print()}
            className="bg-[#0051d5] hover:bg-[#0042b0] text-white text-xs font-bold h-9 shadow-sm"
          >
            <Printer className="w-3.5 h-3.5 mr-1.5" />
            Yazdır / Rapor Çıkar
          </Button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* MAHAL KİMLİĞİ VE DENETÇİ PROFİLİ HERO KARTI                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl relative overflow-hidden">
        {/* Dekoratif Işık Efekti */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-64 h-64 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-700/60 pb-6">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 text-xs font-black tracking-wide uppercase border border-cyan-500/30 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-orange-400" />
                  {loc.systemType || 'FM-200 Gazlı Söndürme'}
                </span>
                {loc.panelType && (
                  <span className="px-2.5 py-0.5 rounded-full bg-slate-800 text-slate-300 text-xs font-semibold border border-slate-700">
                    Pano: {loc.panelType}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => handleCopyUid(loc.systemUid)}
                  className="px-2.5 py-0.5 rounded-full bg-slate-800 hover:bg-slate-700 text-cyan-300 font-mono text-xs font-bold border border-slate-700 flex items-center gap-1 transition-colors"
                  title="Sistem UID'sini Kopyala"
                >
                  {loc.systemUid}
                  {isCopiedUid ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-slate-400" />}
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight pt-1">
                {loc.customRoomName || `${loc.roomType || 'Gazlı Söndürme Mahalli'} #${loc.index || 1}`}
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 flex items-center gap-1.5 flex-wrap">
                <Building2 className="w-3.5 h-3.5 text-blue-400" />
                <span className="font-bold text-white">{fac.name || 'Tesis'}</span>
                <span>•</span>
                <span>{loc.building || 'Ana Bina'} {loc.block ? `/ ${loc.block}` : ''}</span>
                <span>•</span>
                <span className="text-cyan-300 font-bold">{loc.floor || 'Kat'}</span>
                <span>•</span>
                <span className="text-slate-400">Pano Türü: {loc.roomType}</span>
              </p>
            </div>

            {/* Denetleyen ve Tarih Bilgisi */}
            <div className="flex items-center gap-4 bg-white/5 backdrop-blur-md px-4 py-3 rounded-2xl border border-white/10 shrink-0">
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-400/30 flex items-center justify-center text-cyan-300">
                <User className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <div className="text-slate-400 text-[10px] font-medium">Denetleyen Uzman</div>
                <div className="font-bold text-white text-sm">{inspection.inspectedBy || 'Bilinmiyor'}</div>
                <div className="text-slate-400 text-[11px] flex items-center gap-1 mt-0.5">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  {new Date(inspection.inspectionDate).toLocaleString('tr-TR')}
                </div>
              </div>
            </div>
          </div>

          {/* Hızlı Parametreler (Hacim, Tüp Sayısı, Açık İş Listesi Sayısı) */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-slate-400 text-[10px] font-medium">Korunan Oda Hacmi</div>
              <div className="font-bold text-base text-white mt-0.5">
                {loc.roomVolumeM3 ? `${loc.roomVolumeM3} m³` : 'Belirtilmemiş'}
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-slate-400 text-[10px] font-medium">Gaz Tüpü Sayısı</div>
              <div className="font-bold text-base text-white mt-0.5">
                {loc.cylinderCount || (loc.cylinders ? loc.cylinders.length : 1)} Adet
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-slate-400 text-[10px] font-medium">Saha İş Listesi (Aksiyonlar)</div>
              <div className="font-bold text-base text-amber-400 mt-0.5">
                {actionListItems.length} Madde
              </div>
            </div>
            <div className="p-3 rounded-xl bg-slate-800/60 border border-slate-700/60">
              <div className="text-slate-400 text-[10px] font-medium">Tespit Edilen Uygunsuzluk</div>
              <div className={`font-bold text-base mt-0.5 ${totalIssuesCount > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
                {totalIssuesCount} Kriter
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* KIRMIZI BAYRAK / GATEKEEPER UYARI PANELİ (VARSA)                           */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {(inspection.isRedFlagged || redFlagIssues.length > 0) && (
        <div className="p-5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border-2 border-rose-500/40 text-rose-950 dark:text-rose-200 shadow-sm space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-md">
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black tracking-tight text-rose-900 dark:text-rose-100 flex items-center gap-2">
                <span>KRİTİK GÜVENLİK KİLİDİ (GATEKEEPER) İHLALİ!</span>
                <Badge className="bg-rose-600 hover:bg-rose-700 text-white font-black text-[10px]">
                  VETO / YÜKSEK RİSK
                </Badge>
              </h3>
              <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">
                Bu mahalde gazın boşalmasını engelleyen, basınç kaçağı oluşturan veya gaz tutma süresini imkansız kılan kritik kriter(ler) tespit edilmiştir.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-2 border-t border-rose-200 dark:border-rose-900/60">
            {redFlagIssues.map((q: any) => {
              const resp = responses[q.id] || responses[String(q.id)] || {};
              return (
                <div
                  key={q.id}
                  className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-rose-200 dark:border-rose-900/50 flex items-start gap-2.5 text-xs"
                >
                  <span className="w-6 h-6 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 font-black text-xs flex items-center justify-center shrink-0">
                    #{q.id}
                  </span>
                  <div className="space-y-0.5 flex-1">
                    <div className="font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                      {q.text}
                    </div>
                    <div className="flex items-center gap-2 text-[11px]">
                      <span className="font-semibold text-rose-600 dark:text-rose-400">
                        {resp.status}
                      </span>
                      {resp.responsible && (
                        <span className="text-slate-400">• Sorumlu: {resp.responsible}</span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SKOR VE KPI KARTLARI (GENEL UYUMLULUK, SIZDIRMAZLIK, DONANIM, RİSK DERECESİ) */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Genel FM-200 Başarı Skoru */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Genel Başarı Skoru</span>
            <span className={`px-2 py-0.5 rounded-md text-xs font-black ${
              inspection.ratingGrade === 'A' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
              inspection.ratingGrade === 'B' ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300' :
              inspection.ratingGrade === 'C' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
              'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
            }`}>
              Not: {inspection.ratingGrade || 'A'}
            </span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight ${
              complianceScore >= 85 ? 'text-emerald-600 dark:text-emerald-400' :
              complianceScore >= 65 ? 'text-amber-600 dark:text-amber-400' :
              'text-rose-600 dark:text-rose-400'
            }`}>
              %{complianceScore}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ %100</span>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  complianceScore >= 85 ? 'bg-emerald-500' :
                  complianceScore >= 65 ? 'bg-amber-500' :
                  'bg-rose-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, complianceScore))}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Hedef: %90+</span>
              <span>25 Kriter Ağırlıklı</span>
            </div>
          </div>
        </div>

        {/* 2. Sızdırmazlık Endeksi (Door Fan / Sealing Score) */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-700 dark:text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <DoorOpen className="w-4 h-4" />
              Sızdırmazlık Endeksi
            </span>
            <Badge variant="outline" className="text-[10px] border-cyan-200 dark:border-cyan-800 text-cyan-700 dark:text-cyan-300">
              5 Kritik Kriter
            </Badge>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight ${
              sealingScore >= 80 ? 'text-cyan-600 dark:text-cyan-400' :
              sealingScore >= 60 ? 'text-amber-600 dark:text-amber-400' :
              'text-rose-600 dark:text-rose-400'
            }`}>
              %{sealingScore}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ %100</span>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-600 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, sealingScore))}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Geçişler, Contalar & Damper</span>
              <span className="font-semibold text-cyan-600">NFPA 2001</span>
            </div>
          </div>
        </div>

        {/* 3. Donanım ve Tesisat Skoru */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <Gauge className="w-4 h-4 text-slate-400" />
              Donanım & Tesisat
            </span>
            <span className="text-[11px] text-slate-400 font-semibold">20 Kriter</span>
          </div>

          <div className="my-3 flex items-baseline gap-2">
            <span className={`text-4xl font-black tracking-tight ${
              hardwareScore >= 80 ? 'text-slate-800 dark:text-slate-100' : 'text-amber-600 dark:text-amber-400'
            }`}>
              %{hardwareScore}
            </span>
            <span className="text-xs text-slate-400 font-medium">/ %100</span>
          </div>

          <div className="space-y-1">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full bg-indigo-500 transition-all duration-700"
                style={{ width: `${Math.min(100, Math.max(5, hardwareScore))}%` }}
              />
            </div>
            <div className="text-[11px] text-slate-400 flex justify-between">
              <span>Basınç, Nozul & Panel</span>
              <span>Aktif Donanım</span>
            </div>
          </div>
        </div>

        {/* 4. Risk Seviyesi & Durum */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Mahal Risk Durumu</span>
            <ShieldCheck className="w-4 h-4 text-slate-400" />
          </div>

          <div className="my-3">
            <span className={`inline-block px-3 py-1 rounded-xl text-sm font-black tracking-wide ${
              inspection.riskLevel === 'YÜKSEK RİSK' || inspection.isRedFlagged
                ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300 border border-rose-300 dark:border-rose-900'
                : inspection.riskLevel === 'ORTA RİSK'
                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-900'
                : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-900'
            }`}>
              {inspection.riskLevel || (inspection.isRedFlagged ? 'YÜKSEK RİSK' : 'DÜŞÜK RİSK')}
            </span>
          </div>

          <div className="text-[11px] text-slate-500 dark:text-slate-400">
            {inspection.isRedFlagged ? (
              <span className="text-rose-600 font-bold">Kritik güvenlik kilidi engeline takıldı.</span>
            ) : complianceScore >= 85 ? (
              <span className="text-emerald-600 font-semibold">Tesis güvenlik standartlarına tam uyumlu.</span>
            ) : (
              <span>Planlı iyileştirme adımları gereklidir.</span>
            )}
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 🌟 SAHA İŞ LİSTESİ (ÜSTTE GÖRÜNÜR — FOTOĞRAFLARI, NOTLARI VE KALIPLARIYLA)  */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border-2 border-purple-200 dark:border-purple-900/60 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                <Wrench className="w-5 h-5 stroke-[2.2]" />
              </span>
              <div>
                <h3 className="text-base font-black text-slate-900 dark:text-white flex items-center gap-2">
                  Saha İş Listesi & Aksiyonlar ({actionListItems.length})
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bu mahal denetiminde tespit edilen eksiklikler, fotoğrafları, sorumlu birimler ve hazır tespit kalıpları.
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate(`/fm200/work-orders?facilityId=${loc.facilityId || ''}&locationId=${loc.id}`)}
              className="h-8.5 text-xs font-bold text-purple-700 dark:text-purple-300 border-purple-300 dark:border-purple-800 hover:bg-purple-50 dark:hover:bg-purple-950/40"
            >
              İş Listesi Modülünde Yönet ➔
            </Button>
          </div>
        </div>

        {actionListItems.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl space-y-1.5 bg-slate-50/50 dark:bg-slate-800/30">
            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 opacity-80" />
            <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
              Bu mahalde açık iş kaydı veya uygunsuzluk bulunmuyor.
            </p>
            <p className="text-[11px] text-slate-400">
              Tüm kriterler başarıyla karşılanmış durumdadır.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {actionListItems.map((item, itemIdx) => {
              const itemPhotos = item.photos || [];
              const itemTemplates = item.templates || [];

              return (
                <div
                  key={item.id || itemIdx}
                  className="p-4 sm:p-5 rounded-2xl border border-purple-100 dark:border-purple-950/60 bg-gradient-to-br from-white to-purple-50/30 dark:from-slate-900 dark:to-purple-950/20 shadow-xs flex flex-col justify-between space-y-3"
                >
                  <div className="space-y-2">
                    {/* Üst Satır: Kod, Sorumlu, Durum */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-purple-600 text-white shadow-xs">
                          {item.sourceCode}
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                          item.responsible === 'Teknik' || item.responsible === 'Teknik Hizmetler'
                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                            : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200'
                        }`}>
                          {item.responsible === 'Teknik' ? '🔧 Teknik Hizmetler' : '🏢 Yetkili Dış Firma'}
                        </span>
                        <span className="text-[10px] font-semibold text-slate-400">
                          {item.trackLane} Yol
                        </span>
                      </div>

                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                        item.status === 'Tamamlandi'
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                          : item.status === 'Uygulandi'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                          : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                      }`}>
                        {item.status === 'Tamamlandi' ? '✓ Tamamlandı' : item.status === 'Uygulandi' ? 'Onay Bekliyor' : '⏳ Devam Ediyor'}
                      </span>
                    </div>

                    {/* Başlık */}
                    <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white leading-snug">
                      {item.title}
                    </h4>

                    {/* Hazır Kalıp Tespitler */}
                    {itemTemplates.length > 0 && (
                      <div className="space-y-1 pt-1">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                          Tespit Edilen Kalıp:
                        </span>
                        {itemTemplates.map((tpl: string, tIdx: number) => (
                          <div
                            key={tIdx}
                            className="p-2 rounded-xl bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-950 dark:text-amber-200 flex items-start gap-1.5"
                          >
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                            <span className="font-medium text-[11px] leading-relaxed">{tpl}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Saha Notu */}
                    {item.customNote && (
                      <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300 italic">
                        "{item.customNote}"
                      </div>
                    )}
                  </div>

                  {/* Fotoğraflar / Kanıtlar (Büyütülebilir) */}
                  {itemPhotos.length > 0 && (
                    <div className="pt-2 border-t border-purple-100 dark:border-purple-950/60">
                      <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                        <Camera className="w-3 h-3 text-slate-400" />
                        Tespit Fotoğrafları ({itemPhotos.length}):
                      </span>
                      <div className="flex items-center gap-2 flex-wrap">
                        {itemPhotos.map((p: any, pIdx: number) => {
                          const imgUrl = typeof p === 'string' ? p : p.url;
                          const imgName = typeof p === 'string' ? `Fotoğraf #${pIdx + 1}` : (p.name || `Fotoğraf #${pIdx + 1}`);
                          return (
                            <div
                              key={pIdx}
                              onClick={() => setLightboxImage({ url: imgUrl, name: imgName })}
                              className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm hover:ring-2 hover:ring-[#0051d5] transition-all"
                            >
                              <img
                                src={imgUrl}
                                alt={imgName}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={(e) => {
                                  (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                }}
                              />
                              <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 25 KRİTER DENETİM DEĞERLENDİRMESİ & SAHA TESPİTLERİ                       */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-5">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-emerald-600" />
              Denetlenen Kriterler & Saha Tespitleri ({filteredQuestions.length} / {questions.length})
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Her bir kriterin yerinde tespit durumu, atanan sorumlular, hazır şablonlar ve yüklenen fotoğraflar.
            </p>
          </div>

          {/* Arama Kutusu */}
          <div className="relative w-full md:w-72">
            <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
            <Input
              type="text"
              placeholder="Soru metni, not veya no ara..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-8.5 h-9 text-xs rounded-xl bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"
            />
          </div>
        </div>

        {/* FİLTRE BUTONLARI */}
        <div className="no-print flex items-center gap-2 flex-wrap text-xs">
          <button
            type="button"
            onClick={() => { setFilterStatus('all'); setFilterCategory('all'); }}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors ${
              filterStatus === 'all' && filterCategory === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
            }`}
          >
            Tüm Maddeler ({questions.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'issues' ? 'all' : 'issues')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'issues'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'bg-rose-50 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300 hover:bg-rose-100'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            Uygunsuzluklar ({totalIssuesCount})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'gatekeeper' ? 'all' : 'gatekeeper')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'gatekeeper'
                ? 'bg-red-700 text-white shadow-sm'
                : 'bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300 hover:bg-red-100'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            Gatekeeper (Kritik 6)
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'sealing' ? 'all' : 'sealing')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'sealing'
                ? 'bg-cyan-700 text-white shadow-sm'
                : 'bg-cyan-50 text-cyan-700 dark:bg-cyan-950/40 dark:text-cyan-300 hover:bg-cyan-100'
            }`}
          >
            <DoorOpen className="w-3.5 h-3.5" />
            Sızdırmazlık ({SEALING_IDS.length})
          </button>

          <button
            type="button"
            onClick={() => setFilterStatus(filterStatus === 'compliant' ? 'all' : 'compliant')}
            className={`px-3 py-1.5 rounded-xl font-bold transition-colors flex items-center gap-1.5 ${
              filterStatus === 'compliant'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300 hover:bg-emerald-100'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Karşılayanlar
          </button>

          {/* Kategori Seçim Dropdown */}
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="h-8 px-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold ml-auto"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* SORU KARTLARI LİSTESİ */}
        {filteredQuestions.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border border-dashed rounded-2xl space-y-2">
            <Filter className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-xs font-medium">Seçili filtrelere uyan denetim kriteri bulunamadı.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => { setFilterStatus('all'); setFilterCategory('all'); setSearchQuery(''); }}
              className="text-xs mt-1"
            >
              Filtreleri Temizle
            </Button>
          </div>
        ) : (
          <div className="space-y-3.5">
            {filteredQuestions.map((q: any) => {
              const resp = responses[q.id] || responses[String(q.id)] || { status: 'Karşılıyor' };
              const st = resp.status;
              const isGatekeeper = GATEKEEPER_IDS.includes(q.id);
              const isSealing = SEALING_IDS.includes(q.id) || q.isSealing;

              const isIssue = st === 'Karşılamıyor' || st === 'Kısmen Karşılıyor';
              const responsiblesList: string[] = Array.isArray(resp.responsibles) && resp.responsibles.length > 0
                ? resp.responsibles
                : resp.responsible ? [resp.responsible] : [];

              const templatesList: string[] = Array.isArray(resp.templates) ? resp.templates : [];
              const photosList: any[] = Array.isArray(resp.photos) ? resp.photos : [];

              return (
                <div
                  key={q.id}
                  className={`p-4 sm:p-5 rounded-2xl border transition-all break-inside-avoid ${
                    st === 'Karşılamıyor'
                      ? 'border-rose-300 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/10'
                      : st === 'Kısmen Karşılıyor'
                      ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10'
                      : st === 'Kapsam Dışı'
                      ? 'border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 opacity-70'
                      : 'border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    {/* Soru No & Metin */}
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="w-6 h-6 rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-mono text-xs font-black flex items-center justify-center shrink-0">
                          {q.id}
                        </span>

                        <Badge variant="outline" className="text-[10px] font-semibold text-slate-500">
                          {q.category}
                        </Badge>

                        {isGatekeeper && (
                          <Badge className="bg-red-600 text-white text-[10px] font-bold">
                            🚩 Gatekeeper (Kritik)
                          </Badge>
                        )}

                        {isSealing && (
                          <Badge variant="outline" className="text-[10px] font-bold border-cyan-300 text-cyan-700 dark:text-cyan-300 bg-cyan-50/50 dark:bg-cyan-950/30">
                            🛡️ Sızdırmazlık
                          </Badge>
                        )}

                        <span className="text-[10px] text-slate-400 font-medium">
                          Ağırlık: <b>{q.weight || 10} Puan</b>
                        </span>
                      </div>

                      <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 leading-snug">
                        {q.text}
                      </h4>
                    </div>

                    {/* Durum Rozeti */}
                    <div className="shrink-0 self-start">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-black shadow-sm ${
                          st === 'Karşılıyor'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                            : st === 'Kısmen Karşılıyor'
                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 border border-amber-300'
                            : st === 'Karşılamıyor'
                            ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                            : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-300'
                        }`}
                      >
                        {st === 'Karşılıyor' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {st === 'Kısmen Karşılıyor' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {st === 'Karşılamıyor' && <XCircle className="w-3.5 h-3.5 text-rose-600" />}
                        {st === 'Kapsam Dışı' && <MinusCircle className="w-3.5 h-3.5 text-slate-400" />}
                        {st}
                      </span>
                    </div>
                  </div>

                  {/* Sorumlular ve Tespit Detayları */}
                  {(isIssue || resp.customNote || templatesList.length > 0 || photosList.length > 0) && (
                    <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                      {/* Atanan Sorumlu Birimler */}
                      {responsiblesList.length > 0 && isIssue && (
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <span className="text-[11px] font-bold text-slate-500">Müdahale Edecek Sorumlu:</span>
                          {responsiblesList.map((r) => (
                            <span
                              key={r}
                              className={`px-2 py-0.5 rounded-lg text-[10px] font-extrabold ${
                                r === 'Teknik' || r === 'Teknik Hizmetler'
                                  ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 border border-blue-200'
                                  : 'bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 border border-purple-200'
                              }`}
                            >
                              {r === 'Teknik' ? '🔧 Teknik Hizmetler' : '🏢 Yetkili Dış Firma'}
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Hazır Tespit Şablonları */}
                      {templatesList.length > 0 && (
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                            Tespit Edilen Uygunsuzluk Kalıpları:
                          </span>
                          <div className="space-y-1">
                            {templatesList.map((tpl, tIdx) => (
                              <div
                                key={tIdx}
                                className="p-2 rounded-lg bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200/60 dark:border-amber-900/40 text-xs font-medium text-amber-950 dark:text-amber-200 flex items-start gap-2"
                              >
                                <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                                <span>{tpl}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Saha Açıklama Notu */}
                      {resp.customNote && (
                        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-800 text-xs text-slate-700 dark:text-slate-300">
                          <span className="text-[10px] font-bold text-slate-400 block mb-0.5 uppercase tracking-wide">
                            Denetçi Saha Notu:
                          </span>
                          <p className="italic">"{resp.customNote}"</p>
                        </div>
                      )}

                      {/* Tespit Fotoğrafları Galeri */}
                      {photosList.length > 0 && (
                        <div>
                          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1.5 flex items-center gap-1">
                            <Camera className="w-3 h-3 text-slate-400" />
                            Tespit Fotoğrafları ({photosList.length}):
                          </span>
                          <div className="flex items-center gap-2 flex-wrap">
                            {photosList.map((p: any, pIdx: number) => {
                              const imgUrl = typeof p === 'string' ? p : p.url;
                              const imgName = typeof p === 'string' ? `Fotoğraf #${pIdx + 1}` : (p.name || `Fotoğraf #${pIdx + 1}`);
                              return (
                                <div
                                  key={pIdx}
                                  onClick={() => setLightboxImage({ url: imgUrl, name: imgName })}
                                  className="group relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 cursor-pointer shadow-sm hover:ring-2 hover:ring-[#0051d5] transition-all"
                                >
                                  <img
                                    src={imgUrl}
                                    alt={imgName}
                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                    onError={(e) => {
                                      (e.target as any).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="%2394a3b8" stroke-width="1.5"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>';
                                    }}
                                  />
                                  <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <Maximize2 className="w-4 h-4 text-white drop-shadow" />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* SİSTEM TÜPLERİ VE DONANIM DETAYI (VARSA)                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {loc.cylinders && loc.cylinders.length > 0 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-3">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            Mahale Bağlı Gaz Tüpleri ({loc.cylinders.length} Adet)
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                  <th className="pb-2">Tüp Kodu / Etiket</th>
                  <th className="pb-2">Seri Numarası</th>
                  <th className="pb-2 text-right">Gaz Kapasitesi (kg)</th>
                  <th className="pb-2 text-right">Dara Ağırlığı (kg)</th>
                  <th className="pb-2 text-center">İmal Yılı</th>
                  <th className="pb-2">Son Test Tarihi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {loc.cylinders.map((cyl: any) => (
                  <tr key={cyl.id}>
                    <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                      {cyl.labelCode || 'Tüp'}
                    </td>
                    <td className="py-2.5 font-mono text-slate-600 dark:text-slate-400">
                      {cyl.serialNumber || '-'}
                    </td>
                    <td className="py-2.5 text-right font-medium">
                      {cyl.capacityKg ? `${cyl.capacityKg} kg` : '-'}
                    </td>
                    <td className="py-2.5 text-right text-slate-500">
                      {cyl.tareKg ? `${cyl.tareKg} kg` : '-'}
                    </td>
                    <td className="py-2.5 text-center text-slate-600 dark:text-slate-400">
                      {cyl.manufacturingYear || '-'}
                    </td>
                    <td className="py-2.5 text-slate-500">
                      {cyl.lastHydrostaticTestDate
                        ? new Date(cyl.lastHydrostaticTestDate).toLocaleDateString('tr-TR')
                        : 'Kayıt Yok'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* GENEL DENETİM NOTLARI (VARSA)                                             */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {inspection.notes && (
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-2">
          <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide flex items-center gap-1.5">
            <FileText className="w-3.5 h-3.5 text-slate-400" />
            Genel Denetim Değerlendirme Notu
          </h4>
          <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed italic bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
            "{inspection.notes}"
          </p>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* YAZDIRMA İÇİN ONAY VE İMZA ALANI (PRINT ONLY)                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="hidden print:grid grid-cols-3 gap-6 pt-12 text-xs border-t border-slate-300 mt-8">
        <div className="space-y-12">
          <div>
            <div className="font-bold text-slate-900">Denetimi Gerçekleştiren</div>
            <div className="text-slate-500 mt-0.5">{inspection.inspectedBy || 'İsim Soyisim'}</div>
            <div className="text-[10px] text-slate-400">Yangın Güvenliği Uzmanı</div>
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 text-[10px] text-slate-400">İmza / Tarih</div>
        </div>

        <div className="space-y-12">
          <div>
            <div className="font-bold text-slate-900">Teknik Hizmetler Sorumlusu</div>
            <div className="text-slate-500 mt-0.5">Kaşe / İsim</div>
            <div className="text-[10px] text-slate-400">Bina Tesis Yöneticisi</div>
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 text-[10px] text-slate-400">İmza / Tarih</div>
        </div>

        <div className="space-y-12">
          <div>
            <div className="font-bold text-slate-900">Tesis Genel Müdürü / Direktör</div>
            <div className="text-slate-500 mt-0.5">Onay</div>
            <div className="text-[10px] text-slate-400">Yönetim Onayı</div>
          </div>
          <div className="border-t border-dashed border-slate-400 pt-2 text-[10px] text-slate-400">İmza / Mühür</div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* LIGHTBOX MODAL (RESMİ BÜYÜTEREK GÖSTERME)                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {lightboxImage && (
        <div
          className="fixed inset-0 z-50 bg-black/90 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setLightboxImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-slate-950 rounded-2xl overflow-hidden shadow-2xl border border-slate-800 flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-slate-900 flex items-center justify-between text-white border-b border-slate-800">
              <span className="text-xs font-bold truncate max-w-md">
                {lightboxImage.name || 'Tespit Fotoğrafı'}
              </span>
              <div className="flex items-center gap-2">
                <a
                  href={lightboxImage.url}
                  download
                  target="_blank"
                  rel="noreferrer"
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                  title="İndir"
                >
                  <Download className="w-4 h-4" />
                </a>
                <button
                  type="button"
                  onClick={() => setLightboxImage(null)}
                  className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-300 hover:text-white transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-2 flex items-center justify-center bg-black/60 max-h-[80vh] overflow-auto">
              <img
                src={lightboxImage.url}
                alt={lightboxImage.name}
                className="max-w-full max-h-[75vh] object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
