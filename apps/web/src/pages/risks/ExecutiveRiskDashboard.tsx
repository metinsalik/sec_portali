import React, { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { 
  Building2, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  TrendingDown, 
  Award, 
  Layers, 
  Download, 
  Printer, 
  ArrowUpRight, 
  AlertTriangle, 
  Search, 
  ChevronRight,
  Filter,
  BarChart3,
  Loader2,
  Shield,
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid, 
  PieChart, 
  Pie, 
  Cell,
  LabelList
} from 'recharts';
import * as XLSX from 'xlsx';

const API = import.meta.env.VITE_API_URL || '';

const LEVEL_COLORS: Record<string, string> = {
  'Tolere Gösterilmez Risk': '#991b1b',
  'Yüksek Risk':             '#ef4444',
  'Önemli Risk':             '#f59e0b',
  'Olası Risk':              '#eab308',
  'Önemsiz Risk':            '#10b981',
};

export default function ExecutiveRiskDashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const token = localStorage.getItem('token');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'comparison' | 'matrix' | 'facilities'>('comparison');

  const { data, isLoading, error } = useQuery({
    queryKey: ['executive-all-facilities-risks'],
    queryFn: async () => {
      const res = await fetch(`${API}/api/risks/reports/executive/all-facilities`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) {
        throw new Error('Yönetici verisi alınamadı.');
      }
      return res.json();
    }
  });

  const groupSummary = data?.groupSummary || {
    totalFacilities: 0,
    activeFacilitiesCount: 0,
    totalRisks: 0,
    closedRisks: 0,
    activeHazards: 0,
    inProgress: 0,
    criticalRisks: 0,
    resolutionRate: 0,
    avgInitialScore: 0,
    avgFinalScore: 0,
    improvementRate: 0,
    mostCriticalFacility: null,
    highestResolutionFacility: null
  };

  const facilitySummaries = data?.facilitySummaries || [];
  const groupCategories = data?.groupCategories || [];
  const groupLevels = data?.groupLevels || [];

  // Arama filtresi
  const filteredFacilities = useMemo(() => {
    if (!searchTerm) return facilitySummaries;
    const lower = searchTerm.toLowerCase();
    return facilitySummaries.filter((f: any) => 
      f.name.toLowerCase().includes(lower) || 
      f.city.toLowerCase().includes(lower)
    );
  }, [facilitySummaries, searchTerm]);

  // Excel indirme
  const handleExportExcel = () => {
    if (!facilitySummaries.length) return;
    const rows = facilitySummaries.map((f: any) => ({
      'Tesis Adı': f.name,
      'Şehir': f.city,
      'Tehlike Sınıfı': f.dangerClass,
      'Toplam Risk': f.totalRisks,
      'Açık Tehlike': f.activeHazards,
      'Takipte': f.inProgress,
      'Kapatılan': f.closedRisks,
      'Kritik Risk Sayısı': f.criticalRisks,
      'Başarı Oranı (%)': `%${f.resolutionRate}`,
      'Ortalama Risk Puanı': f.avgScore,
      'İyileştirme Sonrası Ort.': f.avgFinal,
      'Puan Düşüş Oranı': `%${f.improvementRate}`
    }));

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Tüm Tesisler Risk Özeti');
    XLSX.writeFile(wb, `Tum_Tesisler_Risk_Degerlendirmesi_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  if (isLoading) {
    return (
      <div className="h-96 flex flex-col items-center justify-center gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm font-semibold">Tüm tesislerin risk değerlendirmeleri birleştiriliyor...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-rose-500 mx-auto" />
        <h2 className="text-lg font-bold">Yetkilendirme veya Sunucu Hatası</h2>
        <p className="text-sm text-muted-foreground">Bu ekrana yalnızca Yönetim (Management) ve Admin yetkisiyle erişilebilir.</p>
        <Button onClick={() => navigate('/risks')} variant="outline">Risk Dashboard'a Dön</Button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Üst Başlık & Rozet */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground">
                  Tüm Tesisler Konsolide Risk Yönetim Kokpiti
                </h1>
                <Badge className="bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30 text-[10px] font-bold">
                  YÖNETİCİ ÖZEL
                </Badge>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Grup genelinde {groupSummary.totalFacilities} tesisin ortak kategori ve Fine-Kinney risk analitiği
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={handleExportExcel} variant="outline" size="sm" className="font-semibold shadow-2xs">
            <Download className="w-4 h-4 mr-1.5 text-emerald-600" /> Excel Konsolide İndir
          </Button>
          <Button onClick={() => window.print()} variant="outline" size="sm" className="font-semibold shadow-2xs">
            <Printer className="w-4 h-4 mr-1.5" /> Yazdır / PDF
          </Button>
        </div>
      </div>

      {/* 4 Temel Yönetici Brifing Kartı */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* Toplam Grup Riski */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-primary/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Konsolide Risk Havuzu</span>
            <div className="p-2 rounded-xl bg-blue-500/10 text-blue-600">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-foreground">{groupSummary.totalRisks}</span>
            <span className="text-xs text-muted-foreground font-medium">Toplam Kayıt</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
            <span>Aktif Tesis: <strong className="text-foreground">{groupSummary.activeFacilitiesCount} / {groupSummary.totalFacilities}</strong></span>
            <span>Açık Tehlike: <strong className="text-rose-600">{groupSummary.activeHazards}</strong></span>
          </div>
        </div>

        {/* Grup Kritik Risk Düzeyi */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-rose-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Kritik Risk Toplamı</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-600">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-rose-600">{groupSummary.criticalRisks}</span>
            <span className="text-xs font-medium text-rose-600/80">Tolere Edilemez & Yüksek</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between truncate">
            <span>En Yüksek Risk:</span>
            <span className="font-bold text-rose-600 truncate ml-1" title={groupSummary.mostCriticalFacility?.name}>
              {groupSummary.mostCriticalFacility ? `${groupSummary.mostCriticalFacility.name} (${groupSummary.mostCriticalFacility.count})` : '-'}
            </span>
          </div>
        </div>

        {/* Konsolide Çözüm Oranı */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-emerald-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Grup Kapatma Başarısı</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-emerald-600">%{groupSummary.resolutionRate}</span>
            <span className="text-xs font-medium text-muted-foreground">({groupSummary.closedRisks} Kapalı)</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between truncate">
            <span>Lider Tesis:</span>
            <span className="font-bold text-emerald-600 truncate ml-1" title={groupSummary.highestResolutionFacility?.name}>
              {groupSummary.highestResolutionFacility ? `${groupSummary.highestResolutionFacility.name} (%${groupSummary.highestResolutionFacility.rate})` : '-'}
            </span>
          </div>
        </div>

        {/* Grup Puan İyileşmesi */}
        <div className="rounded-2xl p-4 bg-card border shadow-2xs flex flex-col justify-between hover:border-amber-500/40 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Ortalama Puan Düşüşü</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black tracking-tight text-amber-600">-%{groupSummary.improvementRate}</span>
            <span className="text-xs text-muted-foreground">Grup Ortalaması</span>
          </div>
          <div className="mt-2 pt-2 border-t text-[11px] text-muted-foreground flex items-center justify-between">
            <span>İlk Ort: <strong>{groupSummary.avgInitialScore}P</strong></span>
            <span>Son Ort: <strong className="text-emerald-600">{groupSummary.avgFinalScore}P</strong></span>
          </div>
        </div>
      </div>

      {/* Sekmeli Gezinme Barı */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b pb-2">
        <div className="inline-flex rounded-xl bg-muted/40 p-1 text-xs font-bold">
          <button
            type="button"
            onClick={() => setActiveTab('comparison')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'comparison' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tesisler Karşılaştırma Grafikleri
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('matrix')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'matrix' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Ortak Kategori & Seviye Konsolidasyonu
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('facilities')}
            className={`px-4 py-2 rounded-lg transition-all ${
              activeTab === 'facilities' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            Tesis Detay Tablosu ({filteredFacilities.length})
          </button>
        </div>

        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-2.5 top-2.5 text-muted-foreground" />
            <Input 
              placeholder="Tesis veya şehir ara..." 
              value={searchTerm} 
              onChange={e => setSearchTerm(e.target.value)} 
              className="pl-8 h-9 text-xs w-64"
            />
          </div>
        </div>
      </div>

      {/* 1. SEKME: TESİSLER KARŞILAŞTIRMA GRAFİKLERİ */}
      {activeTab === 'comparison' && (
        <div className="space-y-6">
          {/* Tesis Bazında Kritik vs Çözülen Riskler (Grouped Bar) */}
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-primary" />
                Tesisler Arası Karşılaştırma: Kritik Risk vs Başarıyla Kapatılan
              </CardTitle>
              <p className="text-xs text-muted-foreground">
                Tesislerin acil aksiyon bekleyen yüksek tehlikeleri ile başarıyla sonuca bağladığı risk hacmi
              </p>
            </CardHeader>
            <CardContent className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={facilitySummaries} margin={{ top: 20, right: 30, left: 10, bottom: 25 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 10 }} 
                    angle={-20} 
                    textAnchor="end" 
                    height={40}
                  />
                  <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                  <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar dataKey="criticalRisks" name="Kritik & Yüksek Risk" fill="#ef4444" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="criticalRisks" position="top" fontSize={10} fontWeight="bold" />
                  </Bar>
                  <Bar dataKey="closedRisks" name="Başarıyla Kapatılan" fill="#10b981" radius={[4, 4, 0, 0]}>
                    <LabelList dataKey="closedRisks" position="top" fontSize={10} fontWeight="bold" />
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tesis Çözüm Başarı Sıralaması */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-600" />
                  Tesis Bazında Çözüm Oranı (%) Sıralaması
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={[...facilitySummaries].sort((a, b) => b.resolutionRate - a.resolutionRate).slice(0, 8)} 
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" domain={[0, 100]} hide />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v) => [`%${v}`, 'Kapatma Oranı']} contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="resolutionRate" name="Çözüm Oranı %" fill="#10b981" radius={[0, 6, 6, 0]}>
                      <LabelList dataKey="resolutionRate" position="right" formatter={(v: any) => `%${v}`} fontSize={11} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-blue-600" />
                  Toplam Risk Yükü Dağılımı
                </CardTitle>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart 
                    data={facilitySummaries.slice(0, 8)} 
                    layout="vertical"
                    margin={{ top: 10, right: 40, left: 20, bottom: 5 }}
                  >
                    <XAxis type="number" hide />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Bar dataKey="totalRisks" name="Toplam Risk" fill="#3b82f6" radius={[0, 6, 6, 0]}>
                      <LabelList dataKey="totalRisks" position="right" fontSize={11} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* 2. SEKME: ORTAK KATEGORİ & SEVİYE KONSOLİDASYONU */}
      {activeTab === 'matrix' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Ortak Kategori Dağılımı (Grup Geneli) */}
            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <Layers className="w-4 h-4 text-primary" />
                  Grup Geneli Risk Kategorisi Dağılımı
                </CardTitle>
                <p className="text-xs text-muted-foreground">Tüm tesislerin ortak kategorilerdeki risk hacmi</p>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupCategories.slice(0, 8)} margin={{ top: 20, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} angle={-20} textAnchor="end" height={40} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="total" name="Toplam Risk" fill="#64748b" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="critical" name="Kritik Risk" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="closed" name="Kapatılan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Grup Geneli Fine-Kinney Seviye Dağılımı */}
            <Card className="shadow-xs border-border/80">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-bold flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-600" />
                  Grup Geneli: İlk Tespit vs İyileştirme Sonrası Puanlama
                </CardTitle>
                <p className="text-xs text-muted-foreground">Grup genelindeki toplam risk seviyesi dönüşümü</p>
              </CardHeader>
              <CardContent className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={groupLevels} margin={{ top: 20, right: 20, left: 10, bottom: 10 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} tickFormatter={(val) => val.replace(' Risk', '')} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="initial" name="İlk Tespit" fill="#dc2626" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="initial" position="top" fontSize={10} fontWeight="bold" />
                    </Bar>
                    <Bar dataKey="final" name="Kalan Risk" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="final" position="top" fontSize={10} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Kategorik Konsolide Tablo */}
          <Card className="shadow-xs border-border/80">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-bold">Kategori Konsolidasyon Matrisi</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-muted/60 text-muted-foreground font-bold border-b">
                    <tr>
                      <th className="p-3">Risk Kategorisi</th>
                      <th className="p-3 text-center">Grup Toplamı</th>
                      <th className="p-3 text-center text-rose-600">Kritik Risk</th>
                      <th className="p-3 text-center text-emerald-600">Kapatılan</th>
                      <th className="p-3 text-right">Başarı Oranı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {groupCategories.map((c: any) => {
                      const rate = c.total > 0 ? Math.round((c.closed / c.total) * 100) : 0;
                      return (
                        <tr key={c.name} className="hover:bg-muted/30">
                          <td className="p-3 font-semibold text-foreground">{c.name}</td>
                          <td className="p-3 text-center font-mono font-bold">{c.total}</td>
                          <td className="p-3 text-center font-mono font-bold text-rose-600">{c.critical}</td>
                          <td className="p-3 text-center font-mono font-bold text-emerald-600">{c.closed}</td>
                          <td className="p-3 text-right font-bold">
                            <span className={`px-2 py-0.5 rounded-md ${rate >= 70 ? 'bg-emerald-500/10 text-emerald-600' : rate >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                              %{rate}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* 3. SEKME: TESİS DETAY TABLOSU */}
      {activeTab === 'facilities' && (
        <Card className="shadow-xs border-border/80">
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-base font-bold">Tüm Tesisler Detaylı Başarı & Risk Tablosu</CardTitle>
              <p className="text-xs text-muted-foreground">Tesis satırına tıklayarak doğrudan o tesisin risk sayfasına gidebilirsiniz</p>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-muted/70 text-muted-foreground uppercase text-[10px] font-bold border-b">
                  <tr>
                    <th className="px-4 py-3">Tesis Adı</th>
                    <th className="px-3 py-3">Şehir / Sınıf</th>
                    <th className="px-3 py-3 text-center">Toplam Risk</th>
                    <th className="px-3 py-3 text-center text-rose-600">Açık Tehlike</th>
                    <th className="px-3 py-3 text-center text-blue-600">Takipte</th>
                    <th className="px-3 py-3 text-center text-emerald-600">Kapatılan</th>
                    <th className="px-3 py-3 text-center font-bold text-rose-700">Kritik Risk</th>
                    <th className="px-3 py-3 text-center">Ort. Skor</th>
                    <th className="px-3 py-3 text-center">Kapatma %</th>
                    <th className="px-4 py-3 text-right">İşlem</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredFacilities.map((fac: any) => (
                    <tr 
                      key={fac.id}
                      className="hover:bg-muted/40 cursor-pointer transition-colors"
                      onClick={() => navigate(`/risks/facility/${fac.id}`)}
                    >
                      <td className="px-4 py-3">
                        <div className="font-bold text-foreground flex items-center gap-1.5">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          {fac.name}
                        </div>
                      </td>
                      <td className="px-3 py-3">
                        <div className="text-muted-foreground">{fac.city}</div>
                        <span className="text-[10px] text-muted-foreground/70">{fac.dangerClass}</span>
                      </td>
                      <td className="px-3 py-3 text-center font-mono font-bold">{fac.totalRisks}</td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-rose-600">{fac.activeHazards}</td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-blue-600">{fac.inProgress}</td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-emerald-600">{fac.closedRisks}</td>
                      <td className="px-3 py-3 text-center font-mono font-bold text-rose-700 bg-rose-500/5">{fac.criticalRisks}</td>
                      <td className="px-3 py-3 text-center font-mono">{fac.avgScore}P</td>
                      <td className="px-3 py-3 text-center font-mono font-bold">
                        <span className={`px-2 py-0.5 rounded ${fac.resolutionRate >= 70 ? 'bg-emerald-500/10 text-emerald-600' : fac.resolutionRate >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                          %{fac.resolutionRate}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button size="sm" variant="ghost" className="h-7 text-xs font-semibold gap-1 text-primary">
                          Görüntüle <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredFacilities.length === 0 && (
                    <tr>
                      <td colSpan={10} className="px-4 py-8 text-center text-muted-foreground">
                        Aranan kritere uygun tesis bulunamadı.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
