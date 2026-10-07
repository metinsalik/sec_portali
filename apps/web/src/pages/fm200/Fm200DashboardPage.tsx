import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import * as XLSX from 'xlsx';
import {
  Flame,
  CheckCircle2,
  AlertTriangle,
  Building2,
  Layers,
  ArrowRight,
  PlusCircle,
  AlertOctagon,
  Wrench,
  ShieldCheck,
  ChevronRight,
  Activity,
  FileSpreadsheet,
  Search,
  RefreshCw,
  ArrowLeft,
  Settings2,
  DoorOpen,
  Calendar,
  User,
  Download,
  Check,
  Filter,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';

export default function Fm200DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Arama, filtre ve seçili hastane state'i (İlk Bakış ➔ Detay mimarisi)
  const [selectedHospital, setSelectedHospital] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterMode, setFilterMode] = useState<'all' | 'inspected' | 'missing'>('all');
  const [detailSubTab, setDetailSubTab] = useState<'locations' | 'workOrders'>('locations');

  // ──────────────────────────────────────────────────────────────────────────
  // 1. DİNAMİK KONSOLİDE HASTANE DENETİM MATRİSİ (VERİTABANINDAN CANLI)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: matrix = [], isLoading: isLoadingMatrix, refetch: refetchMatrix } = useQuery<any[]>({
    queryKey: ['fm200HospitalMatrix'],
    queryFn: async () => {
      const res = await api.get('/fm200/hospital-audit-matrix');
      if (!res.ok) throw new Error('Konsolide matris yüklenemedi');
      return res.json();
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. SEÇİLİ HASTANENİN MAHAL VE DENETİM DETAYLARI
  // ──────────────────────────────────────────────────────────────────────────
  const { data: hospitalLocations = [], isLoading: isLoadingLocations } = useQuery<any[]>({
    queryKey: ['fm200Locations', selectedHospital?.facilityId],
    queryFn: async () => {
      const res = await api.get(`/fm200/locations?facilityId=${selectedHospital.facilityId}`);
      if (!res.ok) throw new Error('Mahaller alınamadı');
      return res.json();
    },
    enabled: !!selectedHospital?.facilityId
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. SEÇİLİ HASTANENİN SAHA İŞ LİSTESİ (BEKLEYEN AKSİYONLAR)
  // ──────────────────────────────────────────────────────────────────────────
  const { data: hospitalWorkOrders = [], isLoading: isLoadingWorks } = useQuery<any[]>({
    queryKey: ['fm200WorkOrders', selectedHospital?.facilityId],
    queryFn: async () => {
      const res = await api.get(`/fm200/work-orders?facilityId=${selectedHospital.facilityId}`);
      if (!res.ok) throw new Error('İş listesi alınamadı');
      return res.json();
    },
    enabled: !!selectedHospital?.facilityId
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. SAHA VERİLERİNİ SENKRONİZE ET (TOPLU KONSOLİDASYON ENTEGRASYONU)
  // ──────────────────────────────────────────────────────────────────────────
  const syncMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/sync-baseline-data', {});
      if (!res.ok) throw new Error('Senkronizasyon başarısız oldu');
      return res.json();
    },
    onSuccess: (data) => {
      toast.success(data.message || 'Saha denetim verileri başarıyla sisteme aktarıldı.');
      queryClient.invalidateQueries({ queryKey: ['fm200HospitalMatrix'] });
      queryClient.invalidateQueries({ queryKey: ['fm200Locations'] });
      queryClient.invalidateQueries({ queryKey: ['fm200WorkOrders'] });
      refetchMatrix();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Senkronizasyon hatası');
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // FİLTRELEME & HESAPLAMALAR
  // ──────────────────────────────────────────────────────────────────────────
  const filteredMatrix = useMemo(() => {
    return matrix.filter((row) => {
      // Metin araması (Hastane adı veya il)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesName = row.name?.toLowerCase().includes(q);
        const matchesCity = row.city?.toLowerCase().includes(q);
        if (!matchesName && !matchesCity) return false;
      }

      // Kategori/Mod filtresi
      if (filterMode === 'inspected') {
        return row.locationCount > 0;
      }
      if (filterMode === 'missing') {
        return row.locationCount === 0;
      }
      return true;
    });
  }, [matrix, searchQuery, filterMode]);

  // Konsolide Toplamlar
  const totals = useMemo(() => {
    return matrix.reduce(
      (acc, r) => ({
        doorfan: acc.doorfan + (r.doorfan || 0),
        preventiveMaintenance: acc.preventiveMaintenance + (r.preventiveMaintenance || 0),
        periodicControl: acc.periodicControl + (r.periodicControl || 0),
        tightness: acc.tightness + (r.tightness || 0),
        total: acc.total + (r.total || 0),
        locations: acc.locations + (r.locationCount || 0),
        openWorks: acc.openWorks + (r.openWorkOrdersCount || 0)
      }),
      { doorfan: 0, preventiveMaintenance: 0, periodicControl: 0, tightness: 0, total: 0, locations: 0, openWorks: 0 }
    );
  }, [matrix]);

  // KPI Hesaplamaları
  const totalHospitals = matrix.length;
  const configuredHospitals = matrix.filter((r) => r.locationCount > 0).length;
  const missingHospitals = totalHospitals - configuredHospitals;
  const inspectedWithScore = matrix.filter((r) => r.score > 0);
  const avgOverallScore =
    inspectedWithScore.length > 0
      ? Math.round(inspectedWithScore.reduce((acc, r) => acc + r.score, 0) / inspectedWithScore.length)
      : 100;

  // Excel (.xlsx) Olarak İndir
  const handleExportExcel = () => {
    try {
      const exportData = filteredMatrix.map((r, idx) => ({
        'No': idx + 1,
        'Hastaneler': r.name,
        'İl': r.city || '-',
        'Mahal Sayısı': r.locationCount || 0,
        'Doorfan Testi': r.doorfan || 0,
        'Önleyici Bakım Uygunluğu': r.preventiveMaintenance || 0,
        'Periyodik Kontrol Uygunluğu': r.periodicControl || 0,
        'Sızdırmazlık': r.tightness || 0,
        'Genel Toplam': r.total || 0,
        'Başarı Skoru (%)': r.score ? `%${r.score}` : '-',
        'Açık İş Sayısı': r.openWorkOrdersCount || 0,
        'Durum': r.status
      }));

      // Toplam satırı
      exportData.push({
        'No': 999 as any,
        'Hastaneler': 'GENEL TOPLAM',
        'İl': '-',
        'Mahal Sayısı': totals.locations,
        'Doorfan Testi': totals.doorfan,
        'Önleyici Bakım Uygunluğu': totals.preventiveMaintenance,
        'Periyodik Kontrol Uygunluğu': totals.periodicControl,
        'Sızdırmazlık': totals.tightness,
        'Genel Toplam': totals.total,
        'Başarı Skoru (%)': `%${avgOverallScore}`,
        'Açık İş Sayısı': totals.openWorks,
        'Durum': 'Konsolide'
      });

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Hastaneler Matrisi');
      XLSX.writeFile(workbook, `FM200_Hastaneler_Denetim_Matrisi_${new Date().toISOString().slice(0, 10)}.xlsx`);
      toast.success('Excel dosyası başarıyla indirildi.');
    } catch (err) {
      toast.error('Excel oluşturulurken hata meydana geldi');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // GÖRÜNÜM 2: HASTANENİN DETAYI (BİR HASTANE SEÇİLDİĞİNDE)
  // ──────────────────────────────────────────────────────────────────────────
  if (selectedHospital) {
    const isConfigured = selectedHospital.locationCount > 0;

    return (
      <div className="space-y-6 pb-20 animate-in fade-in duration-200">
        {/* Üst Geri Dönüş ve Başlık Kartı */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedHospital(null)}
              className="text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100 h-9"
            >
              <ArrowLeft className="w-4 h-4 mr-1.5" />
              Tüm Hastaneler Konsolide Tablosuna Dön
            </Button>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/fm200/settings?facilityId=${selectedHospital.facilityId}`)}
                className="text-xs font-bold h-9 border-slate-200 hover:bg-slate-100"
              >
                <Settings2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Bina / Kat Yapılandırması
              </Button>

              <Button
                size="sm"
                onClick={() => navigate(`/fm200/wizard?facilityId=${selectedHospital.facilityId}`)}
                className="text-xs font-bold h-9 bg-[#0051d5] hover:bg-[#0042b0] text-white shadow-xs"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                Yeni Denetim Yap
              </Button>
            </div>
          </div>

          {/* Hastane Özet Banner'ı */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 pt-3 border-t border-slate-100 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-[#0051d5] dark:text-blue-400">
                  <Building2 className="w-5 h-5 stroke-[2.2]" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 dark:text-white tracking-tight">
                      {selectedHospital.name}
                    </h2>
                    <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                      selectedHospital.status === 'Uygun' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                      selectedHospital.status === 'Kritik Risk (Veto)' ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300' :
                      selectedHospital.status === 'İyileştirme Gerekli' ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                      'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}>
                      {selectedHospital.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {selectedHospital.city ? `${selectedHospital.city} · ` : ''}{selectedHospital.type || 'Hastane'} · ID: <span className="font-mono">{selectedHospital.facilityId}</span>
                  </p>
                </div>
              </div>
            </div>

            {/* 4 Özet Metrik Kutusu */}
            <div className="flex items-center gap-3 flex-wrap">
              <div className="px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-center min-w-[90px]">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Mahal</span>
                <span className="text-lg font-black text-slate-900 dark:text-white">{selectedHospital.locationCount}</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40 text-center min-w-[90px]">
                <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider block">Doorfan</span>
                <span className="text-lg font-black text-blue-700 dark:text-blue-300">{selectedHospital.doorfan}</span>
              </div>
              <div className="px-4 py-2.5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/40 border border-purple-100 dark:border-purple-900/40 text-center min-w-[90px]">
                <span className="text-[10px] font-bold text-purple-600 uppercase tracking-wider block">Saha İş</span>
                <span className="text-lg font-black text-purple-700 dark:text-purple-300">{selectedHospital.openWorkOrdersCount}</span>
              </div>
              <div className="px-5 py-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/40 text-center min-w-[100px]">
                <span className="text-[10px] font-bold text-emerald-600 uppercase tracking-wider block">Genel Skor</span>
                <span className="text-xl font-black text-emerald-600">
                  {selectedHospital.score > 0 ? `%${selectedHospital.score}` : '-'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Detay Çalışma Alanı: Korunan Mahaller vs Saha İş Listesi */}
        {!isConfigured ? (
          <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-amber-200 dark:border-amber-900/50 shadow-sm text-center space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Bu Hastanede Henüz FM-200 Mahali Tanımlanmamış
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
                Hastanenin sunucu, UPS, trafo veya santral gibi gazlı söndürme korumalı odalarını ekleyerek denetim sürecini başlatabilirsiniz.
              </p>
            </div>
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => navigate(`/fm200/settings?facilityId=${selectedHospital.facilityId}`)}
                className="text-xs font-bold"
              >
                <Settings2 className="w-3.5 h-3.5 mr-1 text-slate-500" />
                Önce Bina ve Katları Tanımla
              </Button>
              <Button
                onClick={() => navigate(`/fm200/wizard?facilityId=${selectedHospital.facilityId}`)}
                className="bg-[#0051d5] hover:bg-[#0042b0] text-white text-xs font-bold"
              >
                <PlusCircle className="w-3.5 h-3.5 mr-1" />
                İlk Mahali Ekle ve Denetim Başlat
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Sekme Seçici: Mahaller ve Saha İş Listesi */}
            <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setDetailSubTab('locations')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    detailSubTab === 'locations'
                      ? 'bg-[#0051d5] text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Layers className="w-4 h-4" />
                  Korunan Mahaller & Odalar ({hospitalLocations.length})
                </button>

                <button
                  type="button"
                  onClick={() => setDetailSubTab('workOrders')}
                  className={`px-4 py-2 rounded-xl text-xs font-black transition-all flex items-center gap-2 cursor-pointer ${
                    detailSubTab === 'workOrders'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 border border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <Wrench className="w-4 h-4" />
                  Saha İş Listesi ({hospitalWorkOrders.length})
                </button>
              </div>

              <span className="text-xs text-slate-400 font-medium">
                {selectedHospital.name} İş Konsolu
              </span>
            </div>

            {/* TAB 1: Mahaller Listesi */}
            {detailSubTab === 'locations' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {hospitalLocations.map((loc: any) => {
                  const latestInsp = loc.inspections?.[0];
                  const hasInspection = !!latestInsp;
                  const score = latestInsp ? Math.round(latestInsp.complianceScore) : null;
                  const isVetoed = latestInsp?.isRedFlagged;

                  return (
                    <div
                      key={loc.id}
                      className="p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between gap-4 hover:border-blue-300 transition-all"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-black text-[#0051d5] bg-blue-50 dark:bg-blue-950 px-2 py-0.5 rounded-lg border border-blue-200">
                            {loc.systemUid}
                          </span>
                          {isVetoed ? (
                            <Badge className="bg-rose-600 text-white text-[10px] font-black">VETO (KRİTİK)</Badge>
                          ) : score !== null ? (
                            <span className={`text-xs font-black px-2 py-0.5 rounded-lg ${
                              score >= 85 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              %{score}
                            </span>
                          ) : (
                            <Badge variant="outline" className="text-[10px] text-slate-400">Denetimsiz</Badge>
                          )}
                        </div>

                        <div>
                          <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-snug">
                            {loc.customRoomName || loc.roomType}
                          </h4>
                          <p className="text-[11px] text-slate-400 mt-0.5">
                            {loc.building} · <b>{loc.floor}</b> · {loc.systemType || 'FM-200'} ({loc.cylinderCount || 1} Tüp)
                          </p>
                        </div>
                      </div>

                      {/* Aksiyonlar */}
                      <div className="flex items-center gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
                        {hasInspection && latestInsp.id ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => navigate(`/fm200/inspections/${latestInsp.id}`)}
                            className="flex-1 h-8 text-[11px] font-bold text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            Denetim Raporu ➔
                          </Button>
                        ) : null}

                        <Button
                          size="sm"
                          onClick={() => navigate(`/fm200/wizard?facilityId=${selectedHospital.facilityId}&locationId=${loc.id}`)}
                          className="flex-1 h-8 text-[11px] font-bold bg-[#0051d5] hover:bg-[#0042b0] text-white"
                        >
                          Denetime Git
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* TAB 2: Saha İş Listesi */}
            {detailSubTab === 'workOrders' && (
              <div className="space-y-3">
                {hospitalWorkOrders.length === 0 ? (
                  <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl border border-slate-200 text-center text-slate-400 space-y-1">
                    <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto opacity-80" />
                    <p className="text-xs font-bold text-slate-700 dark:text-slate-300">
                      Bu hastanede bekleyen açık saha işi bulunmuyor.
                    </p>
                    <p className="text-[11px]">Tüm sızdırmazlık ve bakım kriterleri tam durumdadır.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {hospitalWorkOrders.map((wo: any) => (
                      <div
                        key={wo.id}
                        className="p-4 rounded-2xl border border-purple-100 dark:border-purple-950 bg-white dark:bg-slate-900 shadow-xs flex flex-col justify-between gap-3"
                      >
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-black px-2 py-0.5 rounded-lg bg-purple-600 text-white">
                              {wo.sourceCode || 'İŞ'}
                            </span>
                            <span className={`px-2 py-0.5 rounded-lg text-[10px] font-black ${
                              wo.status === 'Tamamlandi' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                            }`}>
                              {wo.status === 'Tamamlandi' ? '✓ Tamamlandı' : '⏳ Bekliyor'}
                            </span>
                          </div>

                          <h5 className="text-xs font-bold text-slate-900 dark:text-white leading-snug">
                            {wo.title}
                          </h5>

                          <p className="text-[11px] text-slate-400">
                            Sorumlu: <b>{wo.responsible || 'Teknik'}</b> · Yol: <b>{wo.trackLane || 'Fiziksel'}</b>
                          </p>
                        </div>

                        <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => navigate(`/fm200/work-orders?facilityId=${selectedHospital.facilityId}`)}
                            className="h-7 text-xs font-bold text-purple-700 hover:bg-purple-50"
                          >
                            İş Listesinde Yönet ➔
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // ──────────────────────────────────────────────────────────────────────────
  // GÖRÜNÜM 1: HASTANELERİN İLK BAKIŞI (KONSOLİDE YÖNETİCİ TABLOSU)
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6 pb-20">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 1. ÜST BAŞLIK VE HIZLI AKSİYON ALANI                                      */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2.5 rounded-2xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <Flame className="w-6 h-6 stroke-[2.2]" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                  Yangın Söndürme & Sızdırmazlık Takibi
                </span>
                <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                  Konsolide İlk Bakış
                </span>
              </div>
              <h1 className="text-2xl font-black text-slate-900 dark:text-white mt-0.5 tracking-tight">
                FM-200 Hastaneler Yönetim & Risk Konsolu
              </h1>
            </div>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 max-w-3xl">
            Tüm hastanelerin Doorfan testi, önleyici bakım, periyodik kontrol ve sızdırmazlık metriklerinin sistemden canlı konsolidasyonu.
            Herhangi bir hastaneye tıklayarak detaylı odalarına ve saha iş listesine ulaşabilirsiniz.
          </p>
        </div>

        <div className="flex items-center flex-wrap gap-2.5 shrink-0">
          <Button
            variant="outline"
            onClick={() => syncMutation.mutate()}
            disabled={syncMutation.isPending}
            className="flex items-center gap-2 text-xs h-10 border-blue-200 text-blue-700 hover:bg-blue-50 font-bold"
            title="Saha denetim verilerini veritabanına aktarır ve konsolide eder"
          >
            <RefreshCw className={`w-4 h-4 text-blue-600 ${syncMutation.isPending ? 'animate-spin' : ''}`} />
            {syncMutation.isPending ? 'Eşitleniyor...' : 'Saha Verilerini Eşitle'}
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/fm200/work-orders')}
            className="flex items-center gap-2 text-xs h-10 border-slate-200 dark:border-slate-800 font-semibold"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            İş Listesi ({totals.openWorks} Açık)
          </Button>

          <Button
            onClick={() => navigate('/fm200/wizard')}
            className="flex items-center gap-2 text-xs h-10 bg-[#0051d5] hover:bg-[#0042b0] text-white font-bold shadow-sm px-4"
          >
            <PlusCircle className="w-4 h-4" />
            Yeni Denetim Yap
          </Button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 2. SADE 4 KPI KARTI (İLK BAKIŞ ÖZETİ)                                     */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Hastane Kapsamı */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Hastane Kapsamı
            </span>
            <div className="text-2xl font-black text-slate-900 dark:text-white mt-0.5">
              {configuredHospitals} <span className="text-xs font-normal text-slate-400">/ {totalHospitals} Hastane</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              <b>{totals.locations}</b> korunan mahal tanımlandı
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-blue-50 text-[#0051d5] dark:bg-blue-950/40">
            <Building2 className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* 2. Doorfan Testi Toplamı */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Doorfan Test Başarısı
            </span>
            <div className="text-2xl font-black text-cyan-600 mt-0.5">
              {totals.doorfan} <span className="text-xs font-normal text-slate-400">Oda Geçti</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              NFPA 2001 gaz tutulum standardı
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-cyan-50 text-cyan-600 dark:bg-cyan-950/40">
            <DoorOpen className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* 3. Konsolide Güvenlik Skoru */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Genel Başarı Ortalaması
            </span>
            <div className="text-2xl font-black text-emerald-600 mt-0.5">
              %{avgOverallScore}
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              25 denetim kriteri ağırlıklı skoru
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40">
            <ShieldCheck className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>

        {/* 4. Açık Saha İş Listesi */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Bekleyen Saha İşleri
            </span>
            <div className="text-2xl font-black text-purple-600 mt-0.5">
              {totals.openWorks} <span className="text-xs font-normal text-slate-400">Aksiyon</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">
              Sızdırmazlık ve bakım işleri
            </p>
          </div>
          <div className="p-3 rounded-2xl bg-purple-50 text-purple-600 dark:bg-purple-950/40">
            <Wrench className="w-6 h-6 stroke-[2.2]" />
          </div>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* 3. HASTANELER KONSOLİDE TABLOSU (İLK BAKIŞ VE TIKLANABİLİR LİSTE)         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-sm overflow-hidden p-6 space-y-4">
        {/* Tablo Üst Kontrolleri: Filtre Sekmeleri, Arama ve Excel Butonu */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterMode === 'all'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Tüm Hastaneler ({totalHospitals})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('inspected')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer ${
                filterMode === 'inspected'
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300'
              }`}
            >
              Denetim Yapılanlar ({configuredHospitals})
            </button>

            <button
              type="button"
              onClick={() => setFilterMode('missing')}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition-all cursor-pointer flex items-center gap-1.5 ${
                filterMode === 'missing'
                  ? 'bg-amber-600 text-white'
                  : 'bg-amber-50 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-300'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5" />
              Mahal Girilmemiş Hastaneler ({missingHospitals})
            </button>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="relative w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <Input
                type="text"
                placeholder="Hastane veya il ara..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8.5 h-9 text-xs rounded-xl bg-slate-50/70 dark:bg-slate-800/60"
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={handleExportExcel}
              className="h-9 text-xs font-bold text-slate-700 dark:text-slate-300 border-slate-200 hover:bg-slate-100"
            >
              <Download className="w-3.5 h-3.5 mr-1 text-slate-500" />
              Excel İndir
            </Button>
          </div>
        </div>

        {/* Tablo Alanı */}
        <div className="overflow-x-auto rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-800 text-white font-bold border-b border-slate-700">
                <th className="py-3 px-4 text-xs font-extrabold">Hastaneler</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold">Mahal</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold bg-slate-700/60">Doorfan Testi</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold">Önleyici Bakım</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold">Periyodik Kontrol</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold">Sızdırmazlık</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold bg-slate-700/80">Genel Toplam</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold">Başarı Skoru</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold">Açık İş</th>
                <th className="py-3 px-3 text-center text-xs font-extrabold">Durum</th>
                <th className="py-3 px-3 text-right text-xs font-extrabold">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredMatrix.length === 0 ? (
                <tr>
                  <td colSpan={11} className="py-12 text-center text-slate-400">
                    Aramaya veya filtreye uygun hastane bulunamadı.
                  </td>
                </tr>
              ) : (
                filteredMatrix.map((row, idx) => {
                  const hasLocs = row.locationCount > 0;

                  return (
                    <tr
                      key={row.facilityId || idx}
                      onClick={() => setSelectedHospital(row)}
                      className="hover:bg-blue-50/50 dark:hover:bg-blue-950/20 cursor-pointer transition-colors group"
                    >
                      <td className="py-3 px-4">
                        <div className="font-bold text-slate-900 dark:text-white group-hover:text-[#0051d5] flex items-center gap-1.5">
                          <span>{row.name}</span>
                          <ChevronRight className="w-3.5 h-3.5 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                        <span className="text-[10px] text-slate-400 block">{row.city || 'Tesis'}</span>
                      </td>

                      <td className="py-3 px-3 text-center">
                        {hasLocs ? (
                          <span className="font-bold text-slate-800 dark:text-slate-200">
                            {row.locationCount} Oda
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                            Mahal Yok
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center font-bold text-blue-700 dark:text-blue-300 bg-blue-50/30 dark:bg-blue-950/20">
                        {row.doorfan || (hasLocs ? 0 : '-')}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {row.preventiveMaintenance || (hasLocs ? 0 : '-')}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {row.periodicControl || (hasLocs ? 0 : '-')}
                      </td>

                      <td className="py-3 px-3 text-center font-semibold text-slate-700 dark:text-slate-300">
                        {row.tightness || (hasLocs ? 0 : '-')}
                      </td>

                      <td className="py-3 px-3 text-center font-black text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/40 text-sm">
                        {row.total || (hasLocs ? 0 : '-')}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {row.score > 0 ? (
                          <span className={`px-2 py-0.5 rounded-lg text-xs font-black ${
                            row.score >= 85 ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300' :
                            row.score >= 60 ? 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300' :
                            'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                          }`}>
                            %{row.score}
                          </span>
                        ) : (
                          <span className="text-slate-300">-</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        {row.openWorkOrdersCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-lg text-[11px] font-black bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300">
                            {row.openWorkOrdersCount} İş
                          </span>
                        ) : (
                          <span className="text-slate-300">0</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-center">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                          row.status === 'Uygun' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                          row.status === 'Kritik Risk (Veto)' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                          row.status === 'İyileştirme Gerekli' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                          'bg-slate-100 text-slate-600'
                        }`}>
                          {row.status}
                        </span>
                      </td>

                      <td className="py-3 px-3 text-right">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedHospital(row);
                          }}
                          className="h-7 text-xs font-bold text-[#0051d5] hover:bg-blue-50"
                        >
                          Detay ➔
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            {/* Genel Toplam Satırı */}
            <tfoot>
              <tr className="bg-slate-800 text-white font-black text-xs border-t-2 border-slate-700">
                <td className="py-3.5 px-4 font-black">
                  GENEL TOPLAM ({filteredMatrix.length} Hastane)
                </td>
                <td className="py-3.5 px-3 text-center">{totals.locations} Mahal</td>
                <td className="py-3.5 px-3 text-center text-cyan-300 bg-slate-700/60 font-black">{totals.doorfan}</td>
                <td className="py-3.5 px-3 text-center">{totals.preventiveMaintenance}</td>
                <td className="py-3.5 px-3 text-center">{totals.periodicControl}</td>
                <td className="py-3.5 px-3 text-center">{totals.tightness}</td>
                <td className="py-3.5 px-3 text-center text-rose-400 text-sm font-black bg-slate-900">
                  {totals.total}
                </td>
                <td className="py-3.5 px-3 text-center text-emerald-400">%{avgOverallScore}</td>
                <td className="py-3.5 px-3 text-center text-purple-300">{totals.openWorks} Açık</td>
                <td className="py-3.5 px-3 text-center">-</td>
                <td className="py-3.5 px-3 text-right"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
