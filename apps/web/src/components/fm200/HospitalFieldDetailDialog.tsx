import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import * as XLSX from 'xlsx';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  ShieldCheck,
  Building2,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertOctagon,
  Search,
  Download,
  Filter,
  Layers,
  ArrowRight,
  ExternalLink,
  Info,
  Calendar,
  XCircle,
  HelpCircle,
  Activity
} from 'lucide-react';
import { toast } from 'sonner';

interface FieldReportItem {
  sira: number;
  tesis: string;
  facilityId?: string | null;
  facilityName?: string | null;
  konum: string;
  mahalTuru: string;
  mahalAdiUid: string;
  kriterSoru: string;
  kategori: string;
  risk: string;
  ekAciklama: string;
  sorumluEkip: string;
  durum: string;
  kayitTarihi?: string;
  terminTarihi?: string;
  aksiyon?: string;
  isEffectiveCompleted: boolean;
  scoreWeight: number;
}

export interface FacilityRoomGroup {
  mahalAdiUid: string;
  konum: string;
  mahalTuru: string;
  totalActions: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  detectedCount: number;
  effectiveCompletedPoints: number;
  roomSecurityRate: number;
  items: FieldReportItem[];
}

interface FacilityFieldSummary {
  tesis: string;
  facilityId: string | null;
  facilityName: string | null;
  totalItems: number;
  uniqueRoomCount?: number;
  rooms?: FacilityRoomGroup[];
  doorfanCount?: number;
  preventiveMaintenanceCount?: number;
  periodicControlCount?: number;
  tightnessCount?: number;
  completedCount: number;
  inProgressCount: number;
  notStartedCount: number;
  detectedCount: number;
  cancelledCount: number;
  otherCount: number;
  effectiveCompletedPoints: number;
  securityReportRate: number;
  iletilmeDurumu: string | null;
  hastaneNotu: string | null;
  categories: Record<string, number>;
  risks: Record<string, number>;
  items: FieldReportItem[];
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  facilityId: string | null;
  facilityName?: string | null;
  onGoToRooms?: (facilityId: string) => void;
}

export default function HospitalFieldDetailDialog({
  isOpen,
  onClose,
  facilityId,
  facilityName,
  onGoToRooms
}: Props) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'rooms' | 'items'>('rooms');
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);

  // Hastanenin Detaylı Saha Verilerini Getir
  const { data: detail, isLoading, error } = useQuery<FacilityFieldSummary>({
    queryKey: ['fm200FieldFacilityDetail', facilityId, facilityName],
    queryFn: async () => {
      if (!facilityId && !facilityName) return null as any;
      const idParam = facilityId || 'by-name';
      const nameParam = facilityName ? `?facilityName=${encodeURIComponent(facilityName)}` : '';
      const res = await api.get(`/fm200/field-report/facility/${encodeURIComponent(idParam)}${nameParam}`);
      if (!res.ok) throw new Error('Hastane saha raporu detayı alınamadı');
      return res.json();
    },
    enabled: isOpen && (!!facilityId || !!facilityName)
  });

  // Mahal / Oda Bazlı Gruplama
  // Kullanıcı kuralı: "Birde mahallerde birden çok işlem olabilir oda adlarına göre onları da yazabilirsin birden çok işi de olsa oda 1 tane yapabilirsin."
  const facilityRooms = useMemo(() => {
    if (detail?.rooms && detail.rooms.length > 0) {
      return detail.rooms;
    }
    if (!detail?.items) return [];

    const map: Record<string, FacilityRoomGroup> = {};
    for (const it of detail.items) {
      const uid = it.mahalAdiUid && it.mahalAdiUid !== '-' ? it.mahalAdiUid : 'Genel / Belirtilmemiş Mahal';
      if (!map[uid]) {
        map[uid] = {
          mahalAdiUid: uid,
          konum: it.konum,
          mahalTuru: it.mahalTuru,
          totalActions: 0,
          completedCount: 0,
          inProgressCount: 0,
          detectedCount: 0,
          notStartedCount: 0,
          effectiveCompletedPoints: 0,
          roomSecurityRate: 0,
          items: []
        };
      }
      const r = map[uid];
      r.totalActions++;
      r.effectiveCompletedPoints += it.scoreWeight;
      if (it.durum === 'Tamamlandı') r.completedCount++;
      else if (it.durum === 'Devam Ediyor') r.inProgressCount++;
      else if (it.durum === 'Tespit Edildi') r.detectedCount++;
      else if (it.durum === 'Başlamadı') r.notStartedCount++;
      r.items.push(it);
    }
    const arr = Object.values(map);
    for (const r of arr) {
      r.roomSecurityRate = r.totalActions > 0
        ? Number(((r.effectiveCompletedPoints / r.totalActions) * 100).toFixed(1))
        : 0;
    }
    return arr;
  }, [detail?.rooms, detail?.items]);

  // Filtreleme
  const filteredItems = useMemo(() => {
    if (!detail?.items) return [];

    return detail.items.filter((item) => {
      // Durum Filtresi
      if (selectedStatus !== 'all') {
        if (selectedStatus === 'inProgress' && item.durum !== 'Devam Ediyor') return false;
        if (selectedStatus === 'completed' && item.durum !== 'Tamamlandı') return false;
        if (selectedStatus === 'pending' && item.durum !== 'Başlamadı' && item.durum !== 'Tespit Edildi') return false;
        if (selectedStatus === 'cancelled' && item.durum !== 'İptal') return false;
        if (!['inProgress', 'completed', 'pending', 'cancelled'].includes(selectedStatus) && item.durum !== selectedStatus) {
          return false;
        }
      }

      // Kategori Filtresi
      if (selectedCategory !== 'all' && item.kategori !== selectedCategory) {
        return false;
      }

      // Arama Metni
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        const matchesUid = item.mahalAdiUid?.toLowerCase().includes(q);
        const matchesQuestion = item.kriterSoru?.toLowerCase().includes(q);
        const matchesNote = item.ekAciklama?.toLowerCase().includes(q);
        const matchesAction = item.aksiyon?.toLowerCase().includes(q);
        const matchesLoc = item.konum?.toLowerCase().includes(q);
        const matchesCategory = item.kategori?.toLowerCase().includes(q);
        const matchesRisk = item.risk?.toLowerCase().includes(q);

        if (!matchesUid && !matchesQuestion && !matchesNote && !matchesAction && !matchesLoc && !matchesCategory && !matchesRisk) {
          return false;
        }
      }

      return true;
    });
  }, [detail?.items, selectedStatus, selectedCategory, searchTerm]);

  // Excel Olarak İndir
  const handleExportFacilityExcel = () => {
    if (!detail?.items || detail.items.length === 0) {
      toast.error('Dışa aktarılacak saha kaydı bulunamadı.');
      return;
    }

    try {
      const exportRows = detail.items.map((it) => ({
        'Sıra': it.sira,
        'Tesis': it.tesis,
        'Konum': it.konum,
        'Mahal Türü': it.mahalTuru,
        'Pano / Mahal Adı (UID)': it.mahalAdiUid,
        'Denetim Kriteri & Sorusu': it.kriterSoru,
        'Kategori': it.kategori,
        'Riski': it.risk,
        'Durum': it.durum,
        'Etki Katsayısı': it.scoreWeight === 1 ? '1.0 (Tam)' : it.scoreWeight === 0.5 ? '0.5 (Yarım)' : '0.0 (Bekliyor)',
        'Sorumlu Ekip': it.sorumluEkip,
        'Ek Saha Açıklaması / Not': it.ekAciklama,
        'Alınan Aksiyon/ Açıklama': it.aksiyon || '',
        'Kayıt Tarihi': it.kayitTarihi || '',
        'Termin Tarihi': it.terminTarihi || ''
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Saha İnceleme Listesi');
      const safeName = (detail.facilityName || detail.tesis || 'Hastane').replace(/[^a-zA-Z0-9_-]/g, '_');
      XLSX.writeFile(workbook, `FM200_${safeName}_Saha_Raporu_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Hastanenin saha raporu Excel olarak indirildi.');
    } catch (err) {
      toast.error('Excel oluşturulurken hata meydana geldi.');
    }
  };

  const displayName = detail?.facilityName || detail?.tesis || facilityName || 'Hastane Detayı';

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-5xl! w-[95vw]! max-h-[92vh]! p-0 overflow-hidden flex flex-col bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 rounded-3xl shadow-2xl">
        {/* Üst Başlık Bölümü */}
        <DialogHeader className="p-6 pb-4 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-slate-50 via-white to-blue-50/30 dark:from-slate-900 dark:to-slate-800/50">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-2xl bg-blue-600 text-white shadow-md shadow-blue-500/20">
                <Building2 className="w-6 h-6 stroke-[2.2]" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <DialogTitle className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                    {displayName}
                  </DialogTitle>
                  {detail?.iletilmeDurumu && (
                    <Badge className={`text-[11px] font-bold ${
                      detail.iletilmeDurumu.toLowerCase() === 'evet'
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                    }`}>
                      Rapor İletildi: {detail.iletilmeDurumu}
                    </Badge>
                  )}
                </div>
                <DialogDescription className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Tesislerden gelen son durum saha denetim raporu, kategori & risk kavram haritası ve aksiyon listesi.
                </DialogDescription>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportFacilityExcel}
                disabled={!detail || detail.totalItems === 0}
                className="h-9 text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100"
              >
                <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Excel İndir
              </Button>

              {onGoToRooms && facilityId && (
                <Button
                  size="sm"
                  onClick={() => {
                    onClose();
                    onGoToRooms(facilityId);
                  }}
                  className="h-9 text-xs font-bold bg-[#0051d5] hover:bg-[#0042b0] text-white"
                >
                  <Layers className="w-3.5 h-3.5 mr-1" />
                  Mahal / Odalara Git
                </Button>
              )}
            </div>
          </div>

          {/* Varsa Hastane İletilme Notu */}
          {detail?.hastaneNotu && (
            <div className="mt-3 p-2.5 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-200 text-xs flex items-center gap-2">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span><b>Tesis İletişim Notu:</b> {detail.hastaneNotu}</span>
            </div>
          )}
        </DialogHeader>

        {/* İçerik Alanı (Kaydırılabilir) */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {isLoading ? (
            <div className="py-20 text-center space-y-3">
              <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto" />
              <p className="text-xs font-bold text-slate-500">Tesisin saha verileri ve güvenlik raporu yükleniyor...</p>
            </div>
          ) : error || !detail ? (
            <div className="p-8 text-center rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 text-amber-800 dark:text-amber-200 space-y-2">
              <AlertTriangle className="w-8 h-8 text-amber-600 mx-auto" />
              <h4 className="font-bold text-sm">Bu Hastane İçin Saha Raporu Kaydı Bulunamadı</h4>
              <p className="text-xs max-w-md mx-auto text-slate-600 dark:text-slate-400">
                Yüklenen Excel dosyasında ({displayName}) adına ait kayıt tespit edilemedi veya henüz saha raporu eşleştirilmemiş.
              </p>
            </div>
          ) : (
            <>
              {/* ────────────────────────────────────────────────────────────────── */}
              {/* 1. GÜVENLİK RAPORU YÜZDELİĞİ & DURUM DAĞILIMI BANNERI              */}
              {/* ────────────────────────────────────────────────────────────────── */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-blue-950 text-white shadow-lg space-y-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
                  {/* Sol: Büyük Skor ve Formül İzahı */}
                  <div className="flex items-center gap-4">
                    <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 shrink-0">
                      <div className="text-center">
                        <span className="text-2xl font-black text-emerald-400">
                          %{detail.securityReportRate}
                        </span>
                        <span className="text-[9px] font-bold uppercase tracking-wider block text-slate-300">
                          Tamamlanma
                        </span>
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        <h3 className="text-base font-black tracking-tight">
                          Saha Güvenlik Raporu Tamamlanma Oranı
                        </h3>
                      </div>
                      <p className="text-xs text-slate-300 mt-1 max-w-md leading-relaxed">
                        Formül: <b>(Tamamlandı × 1.0 + Devam Ediyor × 0.5) / Toplam İş Sayısı</b>
                      </p>
                      <div className="mt-1.5 font-mono text-[11px] text-emerald-300 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10 inline-block">
                        ({detail.completedCount} × 1.0 + {detail.inProgressCount} × 0.5) ÷ {detail.totalItems} = <b>{detail.effectiveCompletedPoints} / {detail.totalItems}</b> (%{detail.securityReportRate})
                      </div>
                    </div>
                  </div>

                  {/* Sağ: 4 Özet Durum Sayacı */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Tamamlandı (1.0x)</span>
                      <span className="text-lg font-black text-emerald-400">{detail.completedCount}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Devam Ediyor (0.5x)</span>
                      <span className="text-lg font-black text-blue-400">{detail.inProgressCount}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Başlamadı (0.0x)</span>
                      <span className="text-lg font-black text-amber-400">{detail.notStartedCount}</span>
                    </div>

                    <div className="p-3 rounded-2xl bg-white/5 border border-white/10 text-center">
                      <span className="text-[10px] font-bold text-rose-300 uppercase tracking-wider block">Tespit Edildi</span>
                      <span className="text-lg font-black text-rose-400">{detail.detectedCount}</span>
                    </div>
                  </div>
                </div>

                {/* Dinamik İlerleme Çubuğu */}
                <div className="space-y-1.5 pt-2 border-t border-white/10">
                  <div className="w-full h-3 bg-white/10 rounded-full overflow-hidden flex">
                    <div
                      style={{ width: `${detail.totalItems > 0 ? (detail.completedCount / detail.totalItems) * 100 : 0}%` }}
                      className="bg-emerald-500 h-full transition-all"
                      title={`Tamamlandı: ${detail.completedCount} (%${((detail.completedCount / detail.totalItems) * 100).toFixed(1)})`}
                    />
                    <div
                      style={{ width: `${detail.totalItems > 0 ? (detail.inProgressCount / detail.totalItems) * 100 : 0}%` }}
                      className="bg-blue-500 h-full transition-all"
                      title={`Devam Ediyor: ${detail.inProgressCount} (%${((detail.inProgressCount / detail.totalItems) * 100).toFixed(1)})`}
                    />
                    <div
                      style={{ width: `${detail.totalItems > 0 ? ((detail.notStartedCount + detail.detectedCount) / detail.totalItems) * 100 : 0}%` }}
                      className="bg-amber-500/80 h-full transition-all"
                      title={`Bekliyor: ${detail.notStartedCount + detail.detectedCount}`}
                    />
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-slate-300 px-0.5">
                    <span>Toplam: <b>{detail.totalItems} Saha Aksiyonu</b></span>
                    <span className="flex items-center gap-3">
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500"></span> %100 Biten</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-blue-500"></span> %50 Devam Eden</span>
                      <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500"></span> Bekleyen</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────────────── */}
              {/* 2. KATEGORİ & RİSK KAVRAM EŞLEŞTİRME VE DAĞILIM PANELİ              */}
              {/* ────────────────────────────────────────────────────────────────── */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-[#0051d5]" />
                    <h4 className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-slate-300">
                      Kategori & Risk Kavram Eşleşmesi Dağılımı ({Object.keys(detail.categories).length} Kategori)
                    </h4>
                  </div>
                  <span className="text-[11px] text-slate-400">
                    Filtrelemek için karta tıklayabilirsiniz
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
                  {Object.entries(detail.categories).map(([cat, count]) => {
                    const isSelected = selectedCategory === cat;
                    const catRisk = Object.entries(detail.risks)[0]?.[0] || 'Yangın & Can Güvenliği';

                    return (
                      <button
                        type="button"
                        key={cat}
                        onClick={() => setSelectedCategory(isSelected ? 'all' : cat)}
                        className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                          isSelected
                            ? 'bg-blue-50 border-[#0051d5] text-[#0051d5] dark:bg-blue-950/60 dark:border-blue-500 shadow-xs ring-1 ring-blue-500'
                            : 'bg-white dark:bg-slate-800/60 border-slate-200/80 dark:border-slate-800 hover:border-blue-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-xs font-bold truncate" title={cat}>
                            {cat}
                          </span>
                          <span className={`text-xs font-black px-2 py-0.5 rounded-lg shrink-0 ${
                            isSelected ? 'bg-[#0051d5] text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300'
                          }`}>
                            {count}
                          </span>
                        </div>
                        <span className="text-[10px] text-slate-400 truncate block">
                          Eşleşen Risk: <b>{catRisk}</b>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ────────────────────────────────────────────────────────────────── */}
              {/* 3. GÖRÜNÜM SEÇİCİ: MAHAL / ODA BAZLI vs TÜM SAHA AKSİYONLARI       */}
              {/* ────────────────────────────────────────────────────────────────── */}
              <div className="space-y-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                {/* Görünüm Değiştirme Sekmeleri */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50 dark:bg-slate-800/40 p-2 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => setViewMode('rooms')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        viewMode === 'rooms'
                          ? 'bg-[#0051d5] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Building2 className="w-3.5 h-3.5" />
                      Mahal / Oda Bazlı Görünüm ({facilityRooms.length} Oda)
                    </button>

                    <button
                      type="button"
                      onClick={() => setViewMode('items')}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-2 ${
                        viewMode === 'items'
                          ? 'bg-[#0051d5] text-white shadow-xs'
                          : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100'
                      }`}
                    >
                      <Layers className="w-3.5 h-3.5" />
                      Tüm Saha Aksiyonları ({detail.totalItems} Kalem)
                    </button>
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium px-2">
                    {viewMode === 'rooms'
                      ? 'Bir odada birden çok aksiyon olsa dahi oda 1 tane sayılır.'
                      : 'Tüm saha aksiyonlarını filtreleyin ve arayın.'}
                  </span>
                </div>

                {/* ──────────────────────────────────────────────────────────────── */}
                {/* GÖRÜNÜM 1: MAHAL / ODA BAZLI KARTLAR LİSTESİ                    */}
                {/* ──────────────────────────────────────────────────────────────── */}
                {viewMode === 'rooms' && (
                  <div className="space-y-3">
                    {facilityRooms.length === 0 ? (
                      <div className="p-8 text-center text-slate-400 bg-slate-50 dark:bg-slate-800/40 rounded-2xl">
                        Mahal verisi bulunamadı.
                      </div>
                    ) : (
                      facilityRooms.map((room, rIdx) => {
                        const isExpanded = expandedRoom === room.mahalAdiUid;
                        const rRate = room.roomSecurityRate ?? 0;

                        return (
                          <div
                            key={rIdx}
                            className="rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 overflow-hidden shadow-xs"
                          >
                            {/* Oda Başlık Çubuğu */}
                            <div
                              onClick={() => setExpandedRoom(isExpanded ? null : room.mahalAdiUid)}
                              className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:bg-blue-50/30 dark:hover:bg-slate-800/40 transition-colors"
                            >
                              <div className="space-y-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-mono text-xs font-black text-[#0051d5] bg-blue-50 dark:bg-blue-950/60 px-2.5 py-0.5 rounded-lg border border-blue-200/60">
                                    {room.mahalAdiUid}
                                  </span>
                                  <Badge variant="outline" className="text-[10px] font-bold">
                                    {room.mahalTuru}
                                  </Badge>
                                  <span className="text-[11px] font-black text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/40 px-2 py-0.5 rounded-lg">
                                    {room.totalActions} Aksiyon / İşlem
                                  </span>
                                </div>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                  Konum: <b>{room.konum}</b>
                                </p>
                              </div>

                              <div className="flex items-center gap-4 shrink-0">
                                <div className="text-right">
                                  <div className="flex items-center gap-1.5 justify-end">
                                    <span className={`px-2.5 py-0.5 rounded-lg text-xs font-black ${
                                      rRate >= 60
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : rRate >= 35
                                        ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                        : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                    }`}>
                                      %{rRate} Güvenlik Skoru
                                    </span>
                                  </div>
                                  <span className="text-[10px] text-slate-400 block mt-0.5">
                                    {room.completedCount} Tamam · {room.inProgressCount} Devam (0.5x) · {room.detectedCount} Tespit
                                  </span>
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 text-xs font-bold text-blue-600 hover:bg-blue-50"
                                >
                                  {isExpanded ? 'Gizle ▲' : `İşleri Gör (${room.totalActions}) ▼`}
                                </Button>
                              </div>
                            </div>

                            {/* Açılabilir Oda İçi İşlemler Listesi */}
                            {isExpanded && (
                              <div className="p-4 pt-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-900/60 space-y-2">
                                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {room.items.map((item, itemIdx) => (
                                    <div key={itemIdx} className="py-2.5 flex flex-col md:flex-row md:items-center justify-between gap-2">
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                          <span className="font-semibold text-xs text-slate-900 dark:text-white">
                                            {item.kriterSoru}
                                          </span>
                                        </div>
                                        <div className="flex items-center gap-2 text-[10px] text-slate-500 flex-wrap">
                                          <span>Kategori: <b>{item.kategori}</b></span>
                                          <span>·</span>
                                          <span className="text-rose-600 font-bold">Risk: {item.risk}</span>
                                          {item.ekAciklama && item.ekAciklama !== '-' && (
                                            <>
                                              <span>·</span>
                                              <span className="text-slate-600 dark:text-slate-400">Not: {item.ekAciklama}</span>
                                            </>
                                          )}
                                        </div>
                                      </div>

                                      <div className="flex items-center gap-2 shrink-0">
                                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                                          item.durum === 'Tamamlandı'
                                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                            : item.durum === 'Devam Ediyor'
                                            ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                            : item.durum === 'Başlamadı'
                                            ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                            : item.durum === 'İptal'
                                            ? 'bg-slate-100 text-slate-600'
                                            : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                        }`}>
                                          {item.durum} ({item.scoreWeight}x)
                                        </span>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* ──────────────────────────────────────────────────────────────── */}
                {/* GÖRÜNÜM 2: TÜM SAHA İŞ LİSTESİ FİLTRE VE TABLOSU                 */}
                {/* ──────────────────────────────────────────────────────────────── */}
                {viewMode === 'items' && (
                  <div className="space-y-3">
                    {/* Filtre ve Arama Çubuğu */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <button
                          type="button"
                          onClick={() => setSelectedStatus('all')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                            selectedStatus === 'all'
                              ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                              : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                          }`}
                        >
                          Tümü ({detail.totalItems})
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedStatus('inProgress')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            selectedStatus === 'inProgress'
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300'
                          }`}
                        >
                          <Clock className="w-3.5 h-3.5" />
                          Devam Edenler ({detail.inProgressCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedStatus('completed')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            selectedStatus === 'completed'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Tamamlananlar ({detail.completedCount})
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedStatus('pending')}
                          className={`px-3 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1 ${
                            selectedStatus === 'pending'
                              ? 'bg-amber-600 text-white'
                              : 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                          }`}
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                          Bekleyenler ({detail.notStartedCount + detail.detectedCount})
                        </button>

                        {selectedCategory !== 'all' && (
                          <button
                            type="button"
                            onClick={() => setSelectedCategory('all')}
                            className="px-2.5 py-1.5 rounded-xl text-xs font-bold bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-300 flex items-center gap-1 cursor-pointer"
                            title="Kategori filtresini temizle"
                          >
                            Kategori: {selectedCategory} ✕
                          </button>
                        )}
                      </div>

                      <div className="relative w-full sm:w-64">
                        <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                        <Input
                          type="text"
                          placeholder="UID, soru, not veya aksiyon ara..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-8.5 h-8.5 text-xs rounded-xl bg-slate-50 dark:bg-slate-800/60"
                        />
                      </div>
                    </div>

                    {/* Tablo */}
                    <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800 max-h-[380px] overflow-y-auto">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead className="sticky top-0 bg-slate-800 text-white z-10 shadow-xs">
                          <tr>
                            <th className="py-2.5 px-3 w-12 text-center font-extrabold">#</th>
                            <th className="py-2.5 px-3 font-extrabold w-44">Mahal & UID</th>
                            <th className="py-2.5 px-3 font-extrabold min-w-[220px]">Kriter & Soru</th>
                            <th className="py-2.5 px-3 font-extrabold w-36">Kategori & Risk</th>
                            <th className="py-2.5 px-3 text-center font-extrabold w-28">Durum</th>
                            <th className="py-2.5 px-3 font-extrabold min-w-[200px]">Ek Saha Notu</th>
                            <th className="py-2.5 px-3 font-extrabold min-w-[180px]">Alınan Aksiyon</th>
                            <th className="py-2.5 px-3 text-center font-extrabold w-24">Sorumlu</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-slate-800 bg-white dark:bg-slate-900">
                          {filteredItems.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="py-12 text-center text-slate-400">
                                Arama ve filtre kriterlerine uygun saha kaydı bulunamadı.
                              </td>
                            </tr>
                          ) : (
                            filteredItems.map((item, idx) => (
                              <tr
                                key={idx}
                                className="hover:bg-blue-50/40 dark:hover:bg-blue-950/20 transition-colors"
                              >
                                <td className="py-2.5 px-3 text-center font-mono text-[11px] text-slate-400">
                                  {item.sira || idx + 1}
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="font-mono text-[11px] font-black text-[#0051d5] block leading-tight">
                                    {item.mahalAdiUid || '-'}
                                  </span>
                                  <span className="text-[10px] text-slate-400 mt-0.5 block">
                                    {item.konum} · <b>{item.mahalTuru}</b>
                                  </span>
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="font-semibold text-slate-900 dark:text-white leading-snug block">
                                    {item.kriterSoru}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3">
                                  <span className="text-[11px] font-bold text-slate-800 dark:text-slate-200 block">
                                    {item.kategori}
                                  </span>
                                  <span className="text-[10px] text-rose-600 dark:text-rose-400 block mt-0.5" title="Eşleşen Risk">
                                    ⚠ {item.risk}
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-center">
                                  <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black inline-block whitespace-nowrap ${
                                    item.durum === 'Tamamlandı'
                                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                      : item.durum === 'Devam Ediyor'
                                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300'
                                      : item.durum === 'Başlamadı'
                                      ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300'
                                      : item.durum === 'İptal'
                                      ? 'bg-slate-100 text-slate-600'
                                      : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                  }`}>
                                    {item.durum} ({item.scoreWeight}x)
                                  </span>
                                </td>

                                <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400 text-[11px]">
                                  {item.ekAciklama && item.ekAciklama !== '-' ? (
                                    <span className="line-clamp-2" title={item.ekAciklama}>
                                      {item.ekAciklama}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">-</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-[11px]">
                                  {item.aksiyon && item.aksiyon !== '-' ? (
                                    <span className="text-emerald-700 dark:text-emerald-400 font-medium line-clamp-2" title={item.aksiyon}>
                                      ✓ {item.aksiyon}
                                    </span>
                                  ) : (
                                    <span className="text-slate-300">Aksiyon girilmedi</span>
                                  )}
                                </td>

                                <td className="py-2.5 px-3 text-center text-[10px] font-semibold text-slate-500">
                                  {item.sorumluEkip || 'Teknik'}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </div>

        {/* Alt Butonlar */}
        <DialogFooter className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/60 flex items-center justify-between sm:justify-between w-full">
          <div className="text-xs text-slate-500 font-medium">
            Gösterilen: <b>{filteredItems.length}</b> / {detail?.totalItems || 0} Saha Aksiyonu
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onClose}
              className="text-xs font-bold"
            >
              Kapat
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
