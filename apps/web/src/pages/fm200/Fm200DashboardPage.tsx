import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Building2,
  Layers,
  ArrowRight,
  TrendingUp,
  FileCheck,
  Settings2,
  PlusCircle,
  FileText,
  AlertOctagon,
  Wrench,
  ShieldCheck,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Zap,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

export default function Fm200DashboardPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    return localStorage.getItem('activeFacilityId') || 'all';
  });

  // URL'den kategori filtresini oku veya yaz
  const categoryParam = searchParams.get('category');
  const selectedCategoryIndex = categoryParam !== null ? parseInt(categoryParam, 10) : null;

  const setSelectedCategoryIndex = (idx: number | null) => {
    const newParams = new URLSearchParams(searchParams);
    if (idx === null || isNaN(idx)) {
      newParams.delete('category');
    } else {
      newParams.set('category', String(idx));
    }
    setSearchParams(newParams);
  };

  // Sol menü FacilitySwitcher ile senkronizasyon
  React.useEffect(() => {
    const handleFacilityChange = () => {
      const activeFac = localStorage.getItem('activeFacilityId') || 'all';
      setSelectedFacilityId(activeFac);
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  const activeFacility = facilities.find((f: any) => f.id === selectedFacilityId);

  // Gelişmiş Dashboard İstatistikleri (Hastane Skoru, 5 Kategori, En Kötü Odalar, Kat Hiyerarşisi)
  const { data: stats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ['fm200Stats', selectedFacilityId],
    queryFn: async () => {
      const res = await api.get(`/fm200/dashboard-stats?facilityId=${selectedFacilityId}`);
      if (!res.ok) throw new Error('İstatistikler alınamadı');
      return res.json();
    }
  });

  const hospitalScore = stats?.hospitalOverallScore ?? stats?.avgScore ?? 100;
  const criticalVetoCount = stats?.criticalVetoLocationsCount ?? 0;
  const categories = stats?.categoryStats || [];
  const worstLocations = stats?.worstLocations || [];
  const floorHierarchy = stats?.floorHierarchy || [];
  const isAllFacilities = !selectedFacilityId || selectedFacilityId === 'all';
  const facilityStats: any[] = stats?.facilityStats || [];

  // Tesis değiştirme ve filtreleri koruma:
  // URL'deki ?category=X parametresini KORUYARAK tesise odaklan
  const handleSelectFacility = (facId: string) => {
    localStorage.setItem('activeFacilityId', facId);
    setSelectedFacilityId(facId);
    window.dispatchEvent(new Event('facilityChanged'));
  };

  // Tüm Tesisler modunda seçilen kategoriye göre tesisleri en kötüden en iyiye (%) sırala
  const categoryRankedFacilities = React.useMemo(() => {
    if (selectedCategoryIndex === null || !isAllFacilities) return [];
    return [...facilityStats].sort((a, b) => {
      const scoreA = a.categoryScores?.[selectedCategoryIndex] ?? 100;
      const scoreB = b.categoryScores?.[selectedCategoryIndex] ?? 100;
      return scoreA - scoreB; // En kötüden (düşük %) en iyiye
    });
  }, [facilityStats, selectedCategoryIndex, isAllFacilities]);

  // Seçilen kategoriye göre panoları en kötüden en iyiye (%) sırala
  const allInspectedLocations: any[] = stats?.allInspectedLocations || [];
  const categoryRankedLocations = React.useMemo(() => {
    if (selectedCategoryIndex === null) return [];
    return [...allInspectedLocations]
      .filter((loc) => loc.categoryScores && loc.categoryScores[selectedCategoryIndex] !== undefined)
      .sort((a, b) => {
        const scoreA = a.categoryScores?.[selectedCategoryIndex] ?? 0;
        const scoreB = b.categoryScores?.[selectedCategoryIndex] ?? 0;
        return scoreA - scoreB; // En kötüden (en düşük %) en iyiye
      });
  }, [allInspectedLocations, selectedCategoryIndex]);

  const selectedCategoryObj = selectedCategoryIndex !== null ? categories[selectedCategoryIndex] : null;

  return (
    <div className="space-y-6 pb-20">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. ÜST BAŞLIK VE HIZLI AKSİYON ALANI                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <Flame className="w-6 h-6 stroke-[2.2]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Yangın Söndürme & Sızdırmazlık İzleme
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                  {isAllFacilities ? 'Tüm Hastaneler / Tesisler (Konsolide)' : (activeFacility?.name || 'Tesis')}
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                {isAllFacilities ? 'Tüm Tesisler FM-200 Konsolide Risk Konsolu' : 'FM-200 Gazlı Söndürme & Risk Yönetim Konsolu'}
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">
            {isAllFacilities 
              ? 'Tüm bağlı hastane ve tesislerin makro düzeyde 5 ana kategori skoru, kritik veto durumları ve tesisler arası performans kıyaslaması.'
              : '25 denetim kriteri ve 5 ana kategoride sızdırmazlık bütünlüğü, kritik bariyerler (veto kuralları) ve iş aksiyonlarının konsolide takibi.'}
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => navigate('/fm200/work-orders')}
            className="flex items-center gap-2 text-xs h-10 border-slate-200 dark:border-slate-800 font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            İş Listesi ({stats?.openWorks ?? 0} Açık)
          </Button>

          <Button
            onClick={() => navigate('/fm200/wizard')}
            className="flex items-center gap-2 text-xs h-10 bg-[#0051d5] hover:bg-[#0042b0] text-white font-bold shadow-sm px-4"
          >
            <PlusCircle className="w-4 h-4" />
            Yeni Denetim Yap (Wizard)
          </Button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. ANA HASTANE SAĞLIK SKORU & KRİTİK BARIYER VETO BANNER'I                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Ana Kart: Genel % Skoru & İki Kademeli Karar */}
        <div className="lg:col-span-8 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white rounded-3xl p-6 sm:p-7 shadow-lg relative overflow-hidden border border-slate-700/60">
          {/* Arka plan siber ızgara efekti */}
          <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:16px_16px] opacity-10 pointer-events-none" />

          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 mb-2">
                <Activity className="w-3.5 h-3.5" />
                {isAllFacilities ? 'Tüm Tesisler Konsolide Güvenlik Skoru' : 'Hastane Konsolide Güvenlik Skoru'}
              </div>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight">
                {isAllFacilities ? 'Tüm Tesisler (Genel Ortalama)' : (activeFacility?.name || 'Tesis Konsolide Durumu')}
              </h2>
              <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                {isAllFacilities
                  ? 'Bağlı tüm hastanelerin denetlenen mahallerinden ağırlıklı ortalama başarı oranıdır. Veto yemiş odalar doğrudan risk olarak işaretlenir.'
                  : 'Kapsam dışı maddeler düşülerek hesaplanan uygulanabilir ağırlıklı başarı oranıdır. Kritik bariyerleri karşılamayan mahaller doğrudan veto edilir.'}
              </p>

              {/* Nihai Durum Kararı */}
              <div className="mt-4 flex items-center gap-2 flex-wrap">
                <span className="text-xs text-slate-400 font-medium">Sistem Kararı:</span>
                {criticalVetoCount > 0 ? (
                  <Badge className="bg-red-500/90 text-white border-red-400 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5 shadow-sm">
                    <AlertOctagon className="w-3.5 h-3.5 text-white" />
                    KRİTİK UYGUNSUZ (Veto Yemiş {criticalVetoCount} Mahal Var)
                  </Badge>
                ) : hospitalScore >= 85 ? (
                  <Badge className="bg-emerald-500/90 text-white border-emerald-400 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    UYGUN — Gaz Tutulumu & Sistem Tam Hazır
                  </Badge>
                ) : (
                  <Badge className="bg-amber-500/90 text-white border-amber-400 px-3 py-1 text-xs font-extrabold flex items-center gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    İYİLEŞTİRME GEREKLİ (%85 Altında)
                  </Badge>
                )}
              </div>
            </div>

            {/* Büyük Skor Göstergesi */}
            <div className="shrink-0 flex flex-col items-center justify-center p-5 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md min-w-[160px]">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">
                Genel Başarı
              </span>
              <div className={`text-4xl sm:text-5xl font-black mt-1 ${
                hospitalScore >= 85 ? 'text-emerald-400' : hospitalScore >= 60 ? 'text-amber-400' : 'text-red-400'
              }`}>
                %{hospitalScore}
              </div>
              <span className="text-[10px] text-slate-400 font-semibold mt-1">
                {stats?.inspectedLocationsCount ?? 0} Denetlenen Mahal
              </span>
            </div>
          </div>

          {/* İlerleme Çubuğu */}
          <div className="mt-6 pt-5 border-t border-slate-700/60">
            <div className="flex items-center justify-between text-xs text-slate-300 font-semibold mb-1.5">
              <span>Sistem & Sızdırmazlık Bütünlüğü</span>
              <span>Hedef: %85 ve Üzeri</span>
            </div>
            <div className="w-full bg-slate-700/80 h-3 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${
                  hospitalScore >= 85 ? 'bg-gradient-to-r from-emerald-500 to-teal-400' : hospitalScore >= 60 ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-red-600 to-rose-400'
                }`}
                style={{ width: `${Math.min(100, Math.max(5, hospitalScore))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Sağ Kolon: Kritik Bariyer & Hızlı Özet Kartları */}
        <div className="lg:col-span-4 flex flex-col justify-between gap-3">
          {/* Kritik Bariyer (Veto) Kartı */}
          <div className={`rounded-3xl p-5 border shadow-xs flex items-center justify-between ${
            criticalVetoCount > 0
              ? 'bg-rose-50 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/50'
              : 'bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/40'
          }`}>
            <div>
              <span className={`text-[11px] font-bold uppercase tracking-wider block ${
                criticalVetoCount > 0 ? 'text-rose-700 dark:text-rose-400' : 'text-emerald-700 dark:text-emerald-400'
              }`}>
                Veto Edilen (Güvensiz) Odalar
              </span>
              <div className={`text-2xl font-black mt-0.5 ${
                criticalVetoCount > 0 ? 'text-rose-700 dark:text-rose-300' : 'text-emerald-700 dark:text-emerald-300'
              }`}>
                {criticalVetoCount} Mahal
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Madde 4, 6, 8, 12, 13, 15 kritik bariyerine takılanlar
              </p>
            </div>
            <div className={`p-3 rounded-2xl ${
              criticalVetoCount > 0 ? 'bg-rose-100 text-rose-700 dark:bg-rose-900/50' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40'
            }`}>
              <AlertOctagon className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Açık İş Emirleri ve Saha Aksiyonu */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Bekleyen Saha İş Listesi
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {stats?.openWorks ?? 0} <span className="text-xs font-normal text-slate-400">/ {stats?.totalWorks ?? 0} İş</span>
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Fiziksel: <b>{stats?.physicalOpen ?? 0}</b> | Doküman: <b>{stats?.docOpen ?? 0}</b>
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
              <Wrench className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>

          {/* Korunan Mahaller & Tüpler */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl p-5 border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                Korunan Mahal & Tüp Sayısı
              </span>
              <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
                {stats?.totalLocations ?? 0} Mahal
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Toplam <b>{stats?.totalCylinders ?? 0}</b> adet gaz tüpü sisteme bağlı
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-blue-50 text-[#0051d5] dark:bg-blue-950/40 dark:text-blue-300">
              <Building2 className="w-6 h-6 stroke-[2.2]" />
            </div>
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. 5 ANA KATEGORİ PERFORMANS VE SKOR DAĞILIMI                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-blue-600" />
              5 Ana Kategoriye Göre Denetim & Sızdırmazlık Başarısı
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hastanenin genel yüzdesini oluşturan 25 kriterin kategori bazlı ağırlık ortalaması
            </p>
          </div>
          <span className="text-xs font-semibold text-slate-400">
            Formül: (Alınan Puan / Uygulanabilir Ağırlık) × 100
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3.5 pt-2">
          {categories.map((cat: any, idx: number) => {
            const isDanger = cat.score < 60;
            const isWarning = cat.score >= 60 && cat.score < 80;
            const isSelected = selectedCategoryIndex === idx;

            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setSelectedCategoryIndex(isSelected ? null : idx)}
                className={`p-4 rounded-2xl border text-left transition-all relative flex flex-col justify-between cursor-pointer ${
                  isSelected
                    ? 'ring-2 ring-[#0051d5] border-[#0051d5] bg-blue-50/50 dark:bg-blue-950/30 shadow-md scale-[1.02]'
                    : 'border-slate-200/80 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-xs'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${
                      isSelected
                        ? 'bg-blue-600 text-white border-blue-600'
                        : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300'
                    }`}>
                      Kategori {idx + 1}
                    </span>
                    {cat.isSealing && (
                      <span className="text-[10px] font-bold text-cyan-700 bg-cyan-50 dark:bg-cyan-950/40 px-1.5 py-0.5 rounded">
                        Sızdırmazlık
                      </span>
                    )}
                  </div>
                  <h4 className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-2 min-h-[32px]">
                    {cat.name}
                  </h4>
                </div>

                <div className="mt-4">
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="text-[11px] text-slate-400 font-medium">Konsolide Skor:</span>
                    <span className={`text-lg font-black ${
                      isDanger ? 'text-red-600 dark:text-red-400' : isWarning ? 'text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'
                    }`}>
                      %{cat.score}
                    </span>
                  </div>
                  <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(100, Math.max(5, cat.score))}%` }}
                    />
                  </div>
                  <div className="mt-2 text-center">
                    <span className={`text-[10px] font-semibold ${isSelected ? 'text-[#0051d5] underline' : 'text-slate-400'}`}>
                      {isSelected ? '▲ Panoları Gizle' : '▼ Panoları Sırala'}
                    </span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── Kategori Drill-Down: Seçilen Kategoriye Göre Basamaklı İnceleme (Makrodan Mikroya) ── */}
        {selectedCategoryIndex !== null && selectedCategoryObj && (
          <div className="mt-6 pt-5 border-t border-slate-200 dark:border-slate-800 space-y-6">
            {/* 1. BASAMAK: 'TÜM TESİSLER' MODUNDA SADECE HASTANELERİN EN KÖTÜDEN EN İYİYE DOĞRU SIRALANMASI */}
            {isAllFacilities ? (
              <div className="bg-slate-50/90 dark:bg-slate-800/70 p-6 rounded-3xl border border-blue-200 dark:border-blue-900/50 space-y-5 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#0051d5] text-white">
                        1. Basamak: Hastanelerin Başarı Sıralaması
                      </span>
                      <h4 className="text-base font-black text-slate-900 dark:text-white">
                        {selectedCategoryObj.name} — Hastaneler (En Kötüden En İyiye %)
                      </h4>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      Bu kategoride <b>en riskli / en düşük skora sahip hastaneden en güvenliye doğru</b> sıralanmıştır. İncelemek istediğiniz hastaneye tıklayarak filtreyi koruyarak detaylarına inebilirsiniz.
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tüm Tesisler Kategori Ortalaması</span>
                      <span className="text-xl font-black text-[#0051d5]">%{selectedCategoryObj.score}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedCategoryIndex(null)}
                      className="text-xs text-slate-500 hover:text-slate-700 h-9"
                    >
                      Kapat ✕
                    </Button>
                  </div>
                </div>

                {categoryRankedFacilities.length === 0 ? (
                  <div className="text-center py-10 text-xs text-slate-400 border border-dashed rounded-2xl">
                    Bu kategoriye ait denetlenmiş hastane bulunamadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryRankedFacilities.map((fac: any, rankIdx: number) => {
                      const facScore = fac.categoryScores?.[selectedCategoryIndex] ?? 100;
                      const isDanger = facScore < 60;
                      const isWarning = facScore >= 60 && facScore < 85;

                      return (
                        <div
                          key={fac.facilityId}
                          onClick={() => handleSelectFacility(fac.facilityId)}
                          className={`p-5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-4 group hover:shadow-lg hover:scale-[1.02] ${
                            isDanger
                              ? 'bg-rose-50/80 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900/60'
                              : isWarning
                              ? 'bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900/60'
                              : 'bg-white dark:bg-slate-900 border-slate-200/90 dark:border-slate-800'
                          }`}
                        >
                          <div>
                            <div className="flex items-center justify-between gap-2 mb-2">
                              <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                                rankIdx === 0 && isDanger
                                  ? 'bg-rose-600 text-white shadow-xs'
                                  : 'bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200'
                              }`}>
                                #{rankIdx + 1} {rankIdx === 0 && isDanger ? 'En Riskli Hastane' : 'Sıralama'}
                              </span>
                              {fac.vetoCount > 0 ? (
                                <Badge className="bg-rose-600 text-white text-[11px] px-2.5 py-0.5 font-extrabold shadow-xs">
                                  {fac.vetoCount} VETO
                                </Badge>
                              ) : (
                                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1">
                                  <ShieldCheck className="w-3.5 h-3.5" /> Veto Yok
                                </span>
                              )}
                            </div>
                            <h5 className="text-base font-black text-slate-900 dark:text-white group-hover:text-[#0051d5] transition-colors flex items-center gap-2">
                              <Building2 className="w-5 h-5 text-slate-400 group-hover:text-[#0051d5]" />
                              {fac.facilityName}
                            </h5>
                            <span className="text-xs text-slate-400 mt-1 block font-medium">
                              {fac.totalInspected} Denetlenen Mahal · Genel Skor: <b>%{fac.overallScore}</b>
                            </span>
                          </div>

                          <div className="space-y-2 pt-3 border-t border-slate-200/60 dark:border-slate-800">
                            <div className="flex items-baseline justify-between text-xs">
                              <span className="text-slate-500 font-semibold">Bu Kategori Skoru:</span>
                              <span className={`text-xl font-black ${
                                isDanger ? 'text-rose-600' : isWarning ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                %{facScore}
                              </span>
                            </div>
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2.5 rounded-full overflow-hidden p-0.5">
                              <div
                                className={`h-full rounded-full transition-all duration-500 ${
                                  isDanger ? 'bg-gradient-to-r from-red-600 to-rose-500' : isWarning ? 'bg-gradient-to-r from-amber-500 to-yellow-400' : 'bg-gradient-to-r from-emerald-500 to-teal-400'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, facScore))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-xs font-bold text-[#0051d5] pt-1 group-hover:translate-x-1 transition-transform">
                              <span className="text-[11px] text-slate-400 font-normal">Detaylı panoları gör</span>
                              <span>Bu Hastaneyi Aç ➔</span>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ) : (
              /* 2. BASAMAK: BELİRLİ BİR HASTANE SEÇİLDİĞİNDE O HASTANENİN PANOLARI (EN KÖTÜDEN EN İYİYE %) */
              <div className="bg-slate-50/80 dark:bg-slate-800/60 p-6 rounded-3xl border border-blue-100 dark:border-blue-900/40 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={() => handleSelectFacility('all')}
                        className="text-xs text-blue-600 hover:underline font-bold flex items-center gap-1"
                      >
                        ◀ Tüm Tesisler Sıralamasına Dön
                      </button>
                      <span className="text-slate-300">/</span>
                      <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-[#0051d5] text-white">
                        {activeFacility?.name}
                      </span>
                    </div>
                    <h4 className="text-base font-black text-slate-900 dark:text-white mt-1">
                      {selectedCategoryObj.name} — Panoların Başarı Sıralaması
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                      <b>{activeFacility?.name}</b> bünyesinde bu kategorideki panolar <b>en düşük başarıdan (% kötüden) en yükseğe doğru</b> sıralanmıştır.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Tesis Kategori Skoru</span>
                      <span className="text-lg font-black text-[#0051d5]">%{selectedCategoryObj.score}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setSelectedCategoryIndex(null)}
                      className="text-xs text-slate-400 hover:text-slate-600"
                    >
                      Kapat ✕
                    </Button>
                  </div>
                </div>

                {categoryRankedLocations.length === 0 ? (
                  <div className="text-center py-8 text-xs text-slate-400 border border-dashed rounded-2xl">
                    Bu hastanede bu kategoriye ait denetlenmiş pano bulunamadı.
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
                    {categoryRankedLocations.map((loc: any, rankIdx: number) => {
                      const score = loc.categoryScores?.[selectedCategoryIndex] ?? 0;
                      return (
                        <div
                          key={loc.id || loc.systemUid}
                          className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                            score < 60
                              ? 'bg-rose-50/70 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                              : score < 85
                              ? 'bg-amber-50/50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900/50'
                              : 'bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="text-[10px] font-extrabold px-1.5 py-0.2 rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200">
                                  #{rankIdx + 1}
                                </span>
                                <span className="font-mono text-xs font-bold text-[#0051d5]">
                                  {loc.systemUid}
                                </span>
                                {loc.isVetoed && (
                                  <span className="px-1.5 py-0.2 rounded text-[9px] font-black bg-rose-600 text-white">
                                    VETO
                                  </span>
                                )}
                              </div>
                              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 line-clamp-1">
                                {loc.customRoomName || loc.roomType}
                              </div>
                              <div className="text-[11px] text-slate-400">
                                {loc.building} {loc.block ? `(${loc.block})` : ''} · <b>{loc.floor}</b>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-[10px] text-slate-400 block font-semibold">Kategori %</span>
                              <span className={`text-base font-black ${
                                score < 60 ? 'text-rose-600' : score < 85 ? 'text-amber-600' : 'text-emerald-600'
                              }`}>
                                %{score}
                              </span>
                            </div>
                          </div>

                          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
                            <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full overflow-hidden">
                              <div
                                className={`h-full rounded-full ${
                                  score < 60 ? 'bg-rose-500' : score < 85 ? 'bg-amber-500' : 'bg-emerald-500'
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, score))}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-slate-400 pt-0.5">
                              <span>Genel Skor: <b>%{loc.complianceScore}</b></span>
                              <button
                                type="button"
                                onClick={() => navigate(`/fm200/wizard?facilityId=${selectedFacilityId}&locationId=${loc.locationId}`)}
                                className="text-[#0051d5] hover:underline font-bold"
                              >
                                Denetime Git ➔
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 4. EN KÖTÜ / ACİL MÜDAHALE GEREKTİREN MAHALLER (TEK BAKIŞTA)                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Sol Kolon: En Kötü 8 Mahal */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <AlertOctagon className="w-5 h-5 text-rose-600" />
                Acil Müdahale Gerektiren En Riskli Mahaller
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Veto kurallarını bozan (kablo boşluğu, damper, tüp basıncı vb.) veya skoru en düşük odalar
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/fm200/wizard')}
              className="text-xs text-[#0051d5] font-semibold"
            >
              Tüm Denetimler ➔
            </Button>
          </div>

          {worstLocations.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl">
              <ShieldCheck className="w-8 h-8 mx-auto text-emerald-500 opacity-60 mb-2" />
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">Harika! Kritik risk veya düşük puanlı mahal bulunmuyor.</p>
              <p className="text-[11px] text-slate-400 mt-0.5">Tüm mahaller yangın söndürme standartlarını karşılıyor.</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {worstLocations.map((loc: any) => (
                <div
                  key={loc.id}
                  className="p-3.5 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-800/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-100/70 transition-colors"
                >
                  <div className="flex items-start gap-3">
                    <span className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                      loc.isVetoed
                        ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300'
                    }`}>
                      {loc.isVetoed ? <AlertOctagon className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#0051d5]">
                          {loc.systemUid}
                        </span>
                        <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                          {loc.customRoomName || loc.roomType}
                        </span>
                        {loc.isVetoed && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-extrabold bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300">
                            VETO (KRİTİK)
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        {loc.building} {loc.block ? `/ ${loc.block}` : ''} · <b>{loc.floor}</b>
                      </div>
                      {loc.vetoReasons && loc.vetoReasons.length > 0 && (
                        <div className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
                          ⚠️ {loc.vetoReasons.join(' | ')}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-800">
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Skor</span>
                      <span className={`text-base font-black ${
                        loc.complianceScore < 60 ? 'text-rose-600' : loc.complianceScore < 80 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        %{loc.complianceScore}
                      </span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate(`/fm200/wizard?facilityId=${selectedFacilityId}&locationId=${loc.locationId}`)}
                      className="h-8 text-xs font-semibold px-2.5 text-blue-600 border-blue-200 hover:bg-blue-50"
                    >
                      Denetim / Çözüm
                      <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Sağ Kolon: Kat ve Blok Bazında Risk Hiyerarşisi */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-indigo-600" />
              Kat & Blok Bazında Risk Hiyerarşisi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hastaneden kata, oradan mahallere göre ortalama skor sıralaması
            </p>
          </div>

          {floorHierarchy.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-2xl text-xs">
              Henüz denetim yapılan kat bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3 max-h-[460px] overflow-y-auto pr-1">
              {floorHierarchy.map((fh: any, index: number) => {
                const isWorst = index === 0;
                return (
                  <div
                    key={`${fh.building}_${fh.block}_${fh.floor}`}
                    className={`p-3.5 rounded-2xl border transition-all ${
                      isWorst && fh.avgScore < 70
                        ? 'bg-rose-50/50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                        : 'bg-slate-50/60 dark:bg-slate-800/40 border-slate-100 dark:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          {fh.building} {fh.block ? `(${fh.block})` : ''} — {fh.floor}
                        </span>
                        {fh.vetoCount > 0 && (
                          <span className="px-1.5 py-0.2 rounded text-[9px] font-extrabold bg-rose-100 text-rose-700">
                            {fh.vetoCount} Veto
                          </span>
                        )}
                      </div>
                      <span className={`text-xs font-black ${
                        fh.avgScore < 70 ? 'text-rose-600' : fh.avgScore < 85 ? 'text-amber-600' : 'text-emerald-600'
                      }`}>
                        %{fh.avgScore}
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          fh.avgScore < 70 ? 'bg-rose-500' : fh.avgScore < 85 ? 'bg-amber-500' : 'bg-emerald-500'
                        }`}
                        style={{ width: `${Math.min(100, Math.max(5, fh.avgScore))}%` }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-1.5">
                      <span>{fh.count} Denetlenen Mahal</span>
                      <span className="font-semibold text-slate-500">
                        {fh.avgScore >= 85 ? 'Güvenli Bölge' : fh.avgScore >= 70 ? 'Orta Düzey Risk' : 'Öncelikli Müdahale'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

