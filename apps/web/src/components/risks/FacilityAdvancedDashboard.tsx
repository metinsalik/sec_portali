import React, { useMemo, useState } from 'react';
import { 
  ChevronDown, 
  BarChart3, 
  TrendingDown, 
  Layers, 
  CheckCircle2, 
  Clock, 
  UserCheck, 
  ShieldAlert, 
  Award, 
  Sparkles,
  ArrowRight,
  Filter
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer, 
  Legend, 
  CartesianGrid, 
  LabelList,
  Cell
} from 'recharts';

const LEVELS = [
  'Tolere Gösterilmez Risk',
  'Yüksek Risk',
  'Önemli Risk',
  'Olası Risk',
  'Önemsiz Risk'
];

const LEVEL_CONFIG: Record<string, { fill: string, label: string, badge: string, dot: string }> = {
  'Tolere Gösterilmez Risk': { fill: '#991b1b', label: 'Tolere Edilemez', badge: 'bg-red-900/15 text-red-700 dark:text-red-400 border-red-700/30', dot: 'bg-red-800' },
  'Yüksek Risk':             { fill: '#ef4444', label: 'Yüksek', badge: 'bg-rose-500/15 text-rose-700 dark:text-rose-400 border-rose-500/30', dot: 'bg-rose-500' },
  'Önemli Risk':             { fill: '#f59e0b', label: 'Önemli', badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30', dot: 'bg-amber-500' },
  'Olası Risk':              { fill: '#eab308', label: 'Olası', badge: 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-yellow-500/30', dot: 'bg-yellow-500' },
  'Önemsiz Risk':            { fill: '#10b981', label: 'Önemsiz', badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border-emerald-500/30', dot: 'bg-emerald-500' },
};

const LEVEL_WEIGHTS: Record<string, number> = {
  'Önemsiz Risk': 1,
  'Olası Risk': 2,
  'Önemli Risk': 3,
  'Yüksek Risk': 4,
  'Tolere Gösterilmez Risk': 5
};

export default function FacilityAdvancedDashboard({ facilityRisks, defaultOpen = false }: { facilityRisks: any[], defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  // Alt sekmeler: 'categories' | 'comparison' | 'actions' | 'responsibles'
  const [activeSubTab, setActiveSubTab] = useState<'categories' | 'comparison' | 'actions' | 'responsibles'>('categories');

  // Kategori & Alt Kategori Hesaplamaları
  const categoryData = useMemo(() => {
    const cats: Record<string, any> = {};
    facilityRisks.forEach(r => {
      const cat = r.riskCategory || 'Genel';
      const sub = r.subCategory || 'Genel';
      
      if (!cats[cat]) cats[cat] = { name: cat, initial: {}, final: {}, subs: {} };
      if (!cats[cat].subs[sub]) cats[cat].subs[sub] = { name: sub, initial: {}, final: {} };
      
      const initLvl = r.initialLevel || 'Bilinmiyor';
      cats[cat].initial[initLvl] = (cats[cat].initial[initLvl] || 0) + 1;
      cats[cat].subs[sub].initial[initLvl] = (cats[cat].subs[sub].initial[initLvl] || 0) + 1;
      
      const finalLvl = r.finalLevel || (r.status === 'KAPATILDI_GUVENLI' ? 'Önemsiz Risk' : initLvl);
      cats[cat].final[finalLvl] = (cats[cat].final[finalLvl] || 0) + 1;
      cats[cat].subs[sub].final[finalLvl] = (cats[cat].subs[sub].final[finalLvl] || 0) + 1;
    });
    return Object.values(cats);
  }, [facilityRisks]);

  const subCategoryTableData = useMemo(() => {
    const subs: any[] = [];
    categoryData.forEach(cat => {
      Object.values(cat.subs).forEach((sub: any) => {
        subs.push({ ...sub, categoryName: cat.name });
      });
    });
    return subs;
  }, [categoryData]);

  // Alt Kategori Karşılaştırmalı Grafik Verisi
  const subCategoryComparisonData = useMemo(() => {
    return subCategoryTableData.slice(0, 10).map((sub: any) => {
      const initScore = LEVELS.reduce((sum, lvl) => sum + (sub.initial[lvl] || 0) * LEVEL_WEIGHTS[lvl], 0);
      const finalScore = LEVELS.reduce((sum, lvl) => sum + (sub.final[lvl] || 0) * LEVEL_WEIGHTS[lvl], 0);
      const initialTotal = LEVELS.reduce((sum, lvl) => sum + (sub.initial[lvl] || 0), 0);
      const finalTotal = LEVELS.reduce((sum, lvl) => sum + (sub.final[lvl] || 0), 0);
      
      return {
        name: sub.name,
        category: sub.categoryName,
        'İlk Tehlike Yükü': initScore,
        'Kalan Risk Yükü': finalScore,
        initialTotal,
        finalTotal
      };
    });
  }, [subCategoryTableData]);

  // İyileştirme Faaliyetleri (Planlanan, Devam Eden, Tamamlanan)
  const improvementData = useMemo(() => {
    const stats = {
      planlanan: { name: 'Açık / Planlanan', levels: {} as Record<string, number> },
      devam:     { name: 'Devam Eden / Takipte', levels: {} as Record<string, number> },
      tamam:     { name: 'Tamamlanan / Kapatıldı', levels: {} as Record<string, number> },
    };
    
    facilityRisks.forEach(r => {
      const lvl = r.finalLevel || r.initialLevel || 'Bilinmiyor';
      if (r.status === 'ACIK_TEHLIKE') {
        stats.planlanan.levels[lvl] = (stats.planlanan.levels[lvl] || 0) + 1;
      } else if (r.status === 'ILK_MUDAHALE_EDILDI' || r.status === 'TAKIP_SURECINDE') {
        stats.devam.levels[lvl] = (stats.devam.levels[lvl] || 0) + 1;
      } else if (r.status === 'KAPATILDI_GUVENLI') {
        stats.tamam.levels[lvl] = (stats.tamam.levels[lvl] || 0) + 1;
      }
    });
    return stats;
  }, [facilityRisks]);

  const improvementChartData = useMemo(() => {
    return LEVELS.map(lvl => ({
      name: LEVEL_CONFIG[lvl]?.label || lvl,
      'Açık / Planlanan': improvementData.planlanan.levels[lvl] || 0,
      'Devam Eden':       improvementData.devam.levels[lvl] || 0,
      'Tamamlanan':       improvementData.tamam.levels[lvl] || 0,
    }));
  }, [improvementData]);

  // Sorumlu Analiz Verisi
  const responsibleData = useMemo(() => {
    const resps: Record<string, any> = {};
    facilityRisks.forEach(r => {
      const resp = (r.improvementResponsible || 'Belirtilmemiş').trim().split('\n')[0].replace(/\r/g, '');
      if (!resps[resp]) resps[resp] = { name: resp, tamam: 0, devam: 0, acik: 0, total: 0 };
      
      resps[resp].total += 1;
      if (r.status === 'KAPATILDI_GUVENLI') {
        resps[resp].tamam += 1;
      } else if (r.status === 'ILK_MUDAHALE_EDILDI' || r.status === 'TAKIP_SURECINDE') {
        resps[resp].devam += 1;
      } else {
        resps[resp].acik += 1;
      }
    });
    return Object.values(resps).sort((a, b) => b.total - a.total).slice(0, 10);
  }, [facilityRisks]);

  const totalLvl = (data: any, lvl: string) => data[lvl] || 0;
  const rowTotal = (data: any) => LEVELS.reduce((sum, lvl) => sum + (data[lvl] || 0), 0);

  const calculateImprovement = (initial: any, final: any) => {
    const initScore = LEVELS.reduce((sum, lvl) => sum + (initial[lvl] || 0) * LEVEL_WEIGHTS[lvl], 0);
    const finalScore = LEVELS.reduce((sum, lvl) => sum + (final[lvl] || 0) * LEVEL_WEIGHTS[lvl], 0);
    if (initScore === 0) return 0;
    const pct = ((initScore - finalScore) / initScore) * 100;
    return Math.max(0, pct);
  };

  return (
    <div className="bg-card rounded-2xl border shadow-xs overflow-hidden transition-all duration-300">
      {/* Akordeon Başlık */}
      <div 
        className="px-6 py-4 bg-muted/25 flex justify-between items-center cursor-pointer hover:bg-muted/40 transition-colors border-b"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-primary/10 text-primary">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-base font-bold text-foreground flex items-center gap-2">
              Gelişmiş Risk Analizleri ve İyileştirme Matrisi
              <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-primary/10 text-primary border border-primary/20">
                Fine-Kinney Metodolojisi
              </span>
            </h4>
            <p className="text-xs text-muted-foreground">
              Kategorik risk yükü, alt kategori aksiyon başarıları ve iyileştirme durum matrisi
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground hidden sm:inline">
            {isOpen ? 'Görünümü Daralt' : 'Tüm Grafikleri Genişlet'}
          </span>
          <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
        </div>
      </div>

      {isOpen && (
        <div className="p-6 space-y-6 animate-in fade-in duration-200">
          {/* Dashboard İçi Alt Sekmeler */}
          <div className="flex items-center justify-between border-b pb-2">
            <div className="inline-flex rounded-xl bg-muted/40 p-1 text-xs font-bold">
              <button
                type="button"
                onClick={() => setActiveSubTab('categories')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeSubTab === 'categories' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                1. Kategori & Alt Kategori Matrisi
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('comparison')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeSubTab === 'comparison' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                2. Öncesi / Sonrası Karşılaştırma Grafiği
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('actions')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeSubTab === 'actions' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                3. İyileştirme Çalışmaları Dağılımı
              </button>
              <button
                type="button"
                onClick={() => setActiveSubTab('responsibles')}
                className={`px-3.5 py-1.5 rounded-lg transition-all ${
                  activeSubTab === 'responsibles' ? 'bg-background text-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                4. Sorumlu Aksiyon Karnesi
              </button>
            </div>

            {/* Renk Lejantı */}
            <div className="hidden lg:flex items-center gap-3 text-[11px] font-medium text-muted-foreground">
              {LEVELS.map(lvl => (
                <div key={lvl} className="flex items-center gap-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${LEVEL_CONFIG[lvl]?.dot}`}></span>
                  <span>{LEVEL_CONFIG[lvl]?.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 1. SEKME: KATEGORİ VE ALT KATEGORİ TABLOSU */}
          {activeSubTab === 'categories' && (
            <div className="space-y-6">
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-primary"></span>
                  Kategori Bazında İlk Durum ve İyileştirme Sonrası Puanlama
                </h5>
                <div className="overflow-x-auto rounded-xl border shadow-2xs">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b">
                      <tr>
                        <th rowSpan={2} className="px-4 py-3 border-r text-foreground">Risk Kategorisi</th>
                        <th colSpan={6} className="px-4 py-2 border-r text-center border-b bg-rose-500/5 text-rose-700 dark:text-rose-400">
                          İlk Tespit Durumu
                        </th>
                        <th colSpan={6} className="px-4 py-2 text-center border-b border-r bg-emerald-500/5 text-emerald-700 dark:text-emerald-400">
                          İyileştirme Sonrası Kalan Durum
                        </th>
                        <th rowSpan={2} className="px-4 py-2 text-center font-bold bg-primary/10 text-primary">
                          İyileştirme<br/>Başarısı
                        </th>
                      </tr>
                      <tr>
                        {LEVELS.map(lvl => (
                          <th key={`m-${lvl}`} className="px-2.5 py-2 border-r text-center font-medium">
                            {LEVEL_CONFIG[lvl]?.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 border-r text-center font-black bg-muted/40 text-foreground">Toplam</th>
                        {LEVELS.map(lvl => (
                          <th key={`i-${lvl}`} className="px-2.5 py-2 border-r text-center font-medium">
                            {LEVEL_CONFIG[lvl]?.label}
                          </th>
                        ))}
                        <th className="px-3 py-2 border-r text-center font-black bg-muted/40 text-foreground">Toplam</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {categoryData.length === 0 && (
                        <tr><td colSpan={14} className="px-4 py-6 text-center text-muted-foreground">Kayıt bulunamadı</td></tr>
                      )}
                      {categoryData.map(cat => {
                        const improvePct = calculateImprovement(cat.initial, cat.final);
                        return (
                          <tr key={cat.name} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2.5 border-r font-bold text-foreground max-w-[220px] truncate" title={cat.name}>
                              {cat.name}
                            </td>
                            {LEVELS.map(lvl => (
                              <td key={`m-${lvl}`} className="px-2.5 py-2.5 border-r text-center font-medium font-mono">
                                {totalLvl(cat.initial, lvl) || '-'}
                              </td>
                            ))}
                            <td className="px-3 py-2.5 border-r text-center font-bold bg-muted/20 font-mono">
                              {rowTotal(cat.initial)}
                            </td>
                            
                            {LEVELS.map(lvl => (
                              <td key={`i-${lvl}`} className="px-2.5 py-2.5 border-r text-center font-medium font-mono">
                                {totalLvl(cat.final, lvl) || '-'}
                              </td>
                            ))}
                            <td className="px-3 py-2.5 text-center font-bold bg-muted/20 border-r font-mono">
                              {rowTotal(cat.final)}
                            </td>
                            <td className="px-4 py-2.5 text-center font-bold text-emerald-600 bg-emerald-500/5 font-mono">
                              {improvePct > 0 ? `%${improvePct.toFixed(1)}` : '-'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Alt Kategoriler Detayı */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-secondary"></span>
                  Alt Kategori Bazında Risk Dağılımı ve İyileştirmeler
                </h5>
                <div className="overflow-x-auto rounded-xl border max-h-72 overflow-y-auto shadow-2xs">
                  <table className="w-full text-xs text-left whitespace-nowrap">
                    <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b sticky top-0 z-10">
                      <tr>
                        <th className="px-4 py-2.5 border-r text-foreground">Alt Kategori</th>
                        <th className="px-3 py-2.5 border-r">Ana Kategori</th>
                        <th className="px-3 py-2.5 border-r text-center font-bold text-rose-600">İlk Risk Toplamı</th>
                        <th className="px-3 py-2.5 border-r text-center font-bold text-emerald-600">Son Durum Toplamı</th>
                        <th className="px-3 py-2.5 text-center font-bold text-primary">İyileştirme Başarısı</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/60">
                      {subCategoryTableData.map((sub: any, idx: number) => {
                        const improvePct = calculateImprovement(sub.initial, sub.final);
                        const initTot = rowTotal(sub.initial);
                        const finTot = rowTotal(sub.final);
                        return (
                          <tr key={idx} className="hover:bg-muted/30 transition-colors">
                            <td className="px-4 py-2 border-r font-semibold text-foreground max-w-[240px] truncate" title={sub.name}>
                              {sub.name}
                            </td>
                            <td className="px-3 py-2 border-r text-muted-foreground max-w-[180px] truncate">
                              {sub.categoryName}
                            </td>
                            <td className="px-3 py-2 border-r text-center font-mono font-bold text-rose-600">
                              {initTot}
                            </td>
                            <td className="px-3 py-2 border-r text-center font-mono font-bold text-emerald-600">
                              {finTot}
                            </td>
                            <td className="px-3 py-2 text-center font-mono font-bold">
                              <span className={`px-2 py-0.5 rounded ${improvePct >= 50 ? 'bg-emerald-500/10 text-emerald-600' : improvePct > 0 ? 'bg-amber-500/10 text-amber-600' : 'text-muted-foreground'}`}>
                                {improvePct > 0 ? `%${improvePct.toFixed(1)}` : '0%'}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 2. SEKME: ÖNCESİ / SONRASI GRAFİĞİ (Interactive Recharts Grouped Bar) */}
          {activeSubTab === 'comparison' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h5 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    Alt Kategorilerde Tehlike Yükü Azalımı (Top 10 Alt Kategori)
                  </h5>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    İyileştirme aksiyonları sayesinde alt kategorilerde risk şiddetinin nasıl düştüğünü gösteren mukayese grafiği
                  </p>
                </div>
              </div>

              <div className="h-80 w-full border rounded-xl p-4 bg-card shadow-2xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={subCategoryComparisonData} margin={{ top: 10, right: 20, left: 10, bottom: 25 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fontSize: 10 }} 
                      interval={0} 
                      angle={-20} 
                      textAnchor="end"
                      height={45}
                    />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip 
                      formatter={(val: any, name: any) => [`${val} Puan`, name]}
                      contentStyle={{ borderRadius: '12px', fontSize: '12px' }}
                    />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="İlk Tehlike Yükü" fill="#dc2626" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="İlk Tehlike Yükü" position="top" fontSize={10} fontWeight="bold" />
                    </Bar>
                    <Bar dataKey="Kalan Risk Yükü" fill="#10b981" radius={[4, 4, 0, 0]}>
                      <LabelList dataKey="Kalan Risk Yükü" position="top" fontSize={10} fontWeight="bold" />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 3. SEKME: İYİLEŞTİRME ÇALIŞMALARI DAĞILIMI */}
          {activeSubTab === 'actions' && (
            <div className="space-y-6">
              {/* Tablo */}
              <div className="overflow-x-auto rounded-xl border shadow-2xs">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b">
                    <tr>
                      <th className="px-4 py-3 border-r text-foreground">Çalışma Durumu</th>
                      {LEVELS.map(lvl => (
                        <th key={lvl} className="px-3 py-2 border-r text-center">{LEVEL_CONFIG[lvl]?.label}</th>
                      ))}
                      <th className="px-4 py-2 text-center text-foreground font-black bg-muted/40">Toplam</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[improvementData.planlanan, improvementData.devam, improvementData.tamam].map((row: any) => (
                      <tr key={row.name} className="hover:bg-muted/30">
                        <td className="px-4 py-2.5 border-r font-bold text-foreground">{row.name}</td>
                        {LEVELS.map(lvl => (
                          <td key={lvl} className="px-3 py-2.5 border-r text-center font-mono font-medium">
                            {totalLvl(row.levels, lvl) || '-'}
                          </td>
                        ))}
                        <td className="px-4 py-2.5 text-center font-bold bg-muted/20 font-mono text-foreground">
                          {rowTotal(row.levels)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Çoklu Çubuk Grafik */}
              <div className="h-72 w-full border rounded-xl p-4 bg-card shadow-2xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={improvementChartData} margin={{ top: 15, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.15} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fontWeight: 600 }} />
                    <YAxis tick={{ fontSize: 10 }} allowDecimals={false} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                    <Bar dataKey="Açık / Planlanan" fill="#ef4444" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Devam Eden" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="Tamamlanan" fill="#10b981" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* 4. SEKME: SORUMLU AKSİYON KARNESİ */}
          {activeSubTab === 'responsibles' && (
            <div className="space-y-6">
              <div className="overflow-x-auto rounded-xl border shadow-2xs">
                <table className="w-full text-xs text-left whitespace-nowrap">
                  <thead className="bg-muted/60 text-muted-foreground uppercase text-[10px] font-bold border-b">
                    <tr>
                      <th className="px-4 py-3 border-r text-foreground">İyileştirme Sorumlusu</th>
                      <th className="px-3 py-2 border-r text-center text-rose-600 font-bold">Açık Risk</th>
                      <th className="px-3 py-2 border-r text-center text-blue-600 font-bold">Devam Eden</th>
                      <th className="px-3 py-2 border-r text-center text-emerald-600 font-bold">Kapatılan</th>
                      <th className="px-3 py-2 border-r text-center font-black">Toplam Yük</th>
                      <th className="px-4 py-2 text-right font-bold text-primary">Kapatma Oranı</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {responsibleData.map((row: any) => {
                      const rate = row.total > 0 ? Math.round((row.tamam / row.total) * 100) : 0;
                      return (
                        <tr key={row.name} className="hover:bg-muted/30">
                          <td className="px-4 py-2.5 border-r font-semibold text-foreground max-w-[240px] truncate" title={row.name}>
                            {row.name}
                          </td>
                          <td className="px-3 py-2.5 border-r text-center font-mono font-bold text-rose-600">{row.acik}</td>
                          <td className="px-3 py-2.5 border-r text-center font-mono font-bold text-blue-600">{row.devam}</td>
                          <td className="px-3 py-2.5 border-r text-center font-mono font-bold text-emerald-600">{row.tamam}</td>
                          <td className="px-3 py-2.5 border-r text-center font-mono font-bold bg-muted/20">{row.total}</td>
                          <td className="px-4 py-2.5 text-right font-mono font-bold">
                            <span className={`px-2 py-0.5 rounded ${rate >= 70 ? 'bg-emerald-500/10 text-emerald-600' : rate >= 40 ? 'bg-amber-500/10 text-amber-600' : 'bg-rose-500/10 text-rose-600'}`}>
                              %{rate}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Sorumlu Stacked Bar Grafiği */}
              <div className="h-72 w-full border rounded-xl p-4 bg-card shadow-2xs">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={responsibleData} layout="vertical" margin={{ top: 10, right: 30, left: 10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} opacity={0.15} />
                    <XAxis type="number" allowDecimals={false} tick={{ fontSize: 10 }} />
                    <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 10 }} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: '12px' }} />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Bar dataKey="tamam" name="Kapatıldı" stackId="a" fill="#10b981" />
                    <Bar dataKey="devam" name="Devam Ediyor" stackId="a" fill="#3b82f6" />
                    <Bar dataKey="acik" name="Açık Tehlike" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
