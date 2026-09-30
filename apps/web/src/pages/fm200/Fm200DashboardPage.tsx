import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
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
  FileText
} from 'lucide-react';

export default function Fm200DashboardPage() {
  const navigate = useNavigate();
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('all');

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  // KPI Dashboard İstatistikleri (Spesifikasyon Bölüm 11)
  const { data: stats, isLoading: isLoadingStats } = useQuery<any>({
    queryKey: ['fm200Stats', selectedFacilityId],
    queryFn: async () => {
      const res = await api.get(`/fm200/dashboard-stats?facilityId=${selectedFacilityId}`);
      if (!res.ok) throw new Error('İstatistikler alınamadı');
      return res.json();
    }
  });

  // Konumları Çek
  const { data: locations = [], isLoading: isLoadingLocations } = useQuery<any[]>({
    queryKey: ['fm200Locations', selectedFacilityId],
    queryFn: async () => {
      const url = selectedFacilityId === 'all'
        ? '/fm200/locations'
        : `/fm200/locations?facilityId=${selectedFacilityId}`;
      const res = await api.get(url);
      if (!res.ok) throw new Error('Konumlar alınamadı');
      return res.json();
    }
  });

  return (
    <div className="space-y-6">
      {/* Üst Karşılama ve Navigasyon Çubuğu */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400">
              <Flame className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
                FM-200 ve Gazlı Yangın Söndürme Portalı
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                35 tesis genelinde periyodik kontrol, bakım, sızdırmazlık testleri ve aksiyon takibi.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <Button
            variant="outline"
            onClick={() => navigate('/fm200/work-orders')}
            className="flex items-center gap-2 text-xs h-10 border-slate-200 dark:border-slate-800"
          >
            <FileText className="w-4 h-4 text-primary" />
            İş Emirleri ({stats?.openWorks ?? 0})
          </Button>

          <Button
            variant="outline"
            onClick={() => navigate('/fm200/settings')}
            className="flex items-center gap-2 text-xs h-10 border-slate-200 dark:border-slate-800"
          >
            <Settings2 className="w-4 h-4 text-slate-600 dark:text-slate-300" />
            Konum & Excel Ayarları
          </Button>

          <Button
            onClick={() => navigate('/fm200/wizard')}
            className="flex items-center gap-2 text-xs h-10 bg-[#0051d5] hover:bg-[#0042b0] text-white shadow-sm"
          >
            <PlusCircle className="w-4 h-4" />
            Yeni Denetim Başlat (Wizard)
          </Button>
        </div>
      </div>

      {/* Tesis Filtreleme */}
      <div className="flex items-center justify-between gap-3">
        <div className="w-full sm:w-80">
          <select
            value={selectedFacilityId}
            onChange={(e) => setSelectedFacilityId(e.target.value)}
            className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary/20"
          >
            <option value="all">Tüm Tesisler (Genel Bakış)</option>
            {facilities.map((f: any) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 4 Temel Yönetici KPI Kartı (Spesifikasyon Bölüm 11) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* KPI 1: Toplam Konum & Tüp */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Korunan Mahal & Varlık
            </span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
              <Building2 className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-slate-900 dark:text-white">
            {stats?.totalLocations ?? 0} <span className="text-sm font-normal text-slate-500">Mahal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Toplam <b>{stats?.totalCylinders ?? 0}</b> adet gaz tüpü izleniyor
          </p>
        </div>

        {/* KPI 2: Ağırlıklı Uygunluk Skoru */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Ortalama Uygunluk Skoru
            </span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            %{stats?.avgScore ?? 100}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {stats?.avgScore >= 95
              ? 'Seviye A — Kusursuz Operasyon'
              : stats?.avgScore >= 80
              ? 'Seviye B — Yeterli'
              : 'Müdahale ve Servis Gerekli'}
          </p>
        </div>

        {/* KPI 3: İş Kapatma Başarı Oranı */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Aksiyon Kapatma Başarısı
            </span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600 dark:bg-purple-950/40 dark:text-purple-400">
              <FileCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-[#0051d5] dark:text-[#b4c5ff]">
            %{stats?.workSuccessRate ?? 100}
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            <b>{stats?.completedWorks ?? 0}</b> / {stats?.totalWorks ?? 0} iş tamamlandı
          </p>
        </div>

        {/* KPI 4: Kritik Risk & Gatekeeper */}
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
              Fonksiyonel Risk / Kırmızı Bayrak
            </span>
            <span className="p-2 rounded-xl bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-400">
              <ShieldAlert className="w-4 h-4" />
            </span>
          </div>
          <div className="text-2xl font-extrabold text-red-600 dark:text-red-400">
            {stats?.redFlaggedCount ?? 0} <span className="text-sm font-normal text-slate-500">Mahal</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            M13 (Gaz) veya M21 (Algılama) kritik kesinti riski
          </p>
        </div>
      </div>

      {/* İki Paralel Yol İlerleme İstatistiği (Bölüm 9 & 11) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Fiziksel Yol */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-amber-500"></span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Fiziksel Yol (Saha & Yalıtım İşleri)
              </h3>
            </div>
            <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-full">
              {stats?.physicalOpen ?? 0} Açık İş
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Delik yalıtımı, kapı fitili, nozul yönü ve vana mekanik müdahaleleri. Sızdırmazlık testinin ön koşuludur.
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-amber-500 h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats?.totalWorks ? Math.round(((stats.totalWorks - stats.physicalOpen) / stats.totalWorks) * 100) : 100}%`
              }}
            />
          </div>
        </div>

        {/* Doküman Yolu */}
        <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500"></span>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                Doküman Yolu (Hesap, Proje & Eğitim)
              </h3>
            </div>
            <span className="text-xs font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-full">
              {stats?.docOpen ?? 0} Açık İş
            </span>
          </div>
          <p className="text-xs text-slate-500 mb-3">
            Onaylı tasarım hesabı, izometrik şema, oda hacim kontrolü ve personel eğitim belgeleri.
          </p>
          <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
            <div
              className="bg-blue-600 h-full rounded-full transition-all duration-500"
              style={{
                width: `${stats?.totalWorks ? Math.round(((stats.totalWorks - stats.docOpen) / stats.totalWorks) * 100) : 100}%`
              }}
            />
          </div>
        </div>
      </div>

      {/* Konum Kartları Matrisi (Spesifikasyon Bölüm 10 & 16.1) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            Tesis Gazlı Söndürme Mahal Kartları ({locations.length})
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/fm200/settings')}
            className="text-xs text-primary"
          >
            Tümünü Yönet / Düzenle ➔
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {locations.map((loc) => (
            <div
              key={loc.id}
              className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-blue-50 dark:bg-blue-950/60 text-[#0051d5] dark:text-[#b4c5ff]">
                      {loc.systemUid}
                    </span>
                    <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1">
                      {loc.customRoomName || `${loc.roomType} #${loc.index}`}
                    </h4>
                  </div>

                  <span
                    className={`text-[11px] font-bold px-2 py-1 rounded-full ${
                      loc.overallStatus === 'Sistem Hazır ve Uygun'
                        ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200'
                        : loc.overallStatus === 'Fiziksel İyileştirme Gerekli'
                        ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400 border border-amber-200'
                        : 'bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400 border border-blue-200'
                    }`}
                  >
                    {loc.overallStatus}
                  </span>
                </div>

                <div className="text-xs text-slate-500 mb-3">
                  {loc.facility?.shortName || loc.facility?.name} · {loc.building} ({loc.floor})
                </div>

                {/* Fazlar Özet Izgarası */}
                <div className="grid grid-cols-2 gap-2 text-[11px] p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800 mb-3">
                  <div>
                    <span className="text-slate-400 block font-medium">Faz 1: Tasarım</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {loc.latestPhase1 ? 'Tamamlandı' : 'Bekliyor'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Faz 2: Skor</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {loc.latestInspection ? `%${loc.latestInspection.complianceScore}` : '—'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Faz 3: Tüpler</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {loc.cylinders?.length || 0} Adet Tüp
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Faz 4: Test</span>
                    <span className="font-bold text-slate-800 dark:text-slate-200">
                      {loc.latestTest ? loc.latestTest.result : '—'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Aksiyon Butonu */}
              <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                <span className="text-xs text-slate-400">
                  {loc.openWorkCount > 0 ? (
                    <span className="text-amber-600 font-semibold">{loc.openWorkCount} Açık İş</span>
                  ) : (
                    'İş Emri Yok'
                  )}
                </span>

                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => navigate(`/fm200/wizard?facilityId=${loc.facilityId}&locationId=${loc.id}`)}
                  className="text-xs h-8 rounded-lg flex items-center gap-1 text-primary hover:text-primary"
                >
                  Denetle (Wizard)
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
