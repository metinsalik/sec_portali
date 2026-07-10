import React, { useMemo, useState } from 'react';
import { ChevronDown, BarChart3, ChevronUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts';

const LEVELS = [
  'Önemsiz Risk',
  'Olası Risk',
  'Önemli Risk',
  'Yüksek Risk',
  'Tolere Gösterilmez Risk'
];

const LEVEL_COLORS: Record<string, string> = {
  'Tolere Gösterilmez Risk': '#7f1d1d', // Koyu Kırmızı
  'Yüksek Risk':             '#dc2626', // Kırmızı
  'Önemli Risk':             '#ea580c', // Turuncu
  'Olası Risk':              '#eab308', // Sarı
  'Önemsiz Risk':            '#16a34a', // Yeşil
};

export default function FacilityAdvancedDashboard({ facilityRisks, defaultOpen = false }: { facilityRisks: any[], defaultOpen?: boolean }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [openSection1, setOpenSection1] = useState(true);
  const [openSection2, setOpenSection2] = useState(true);
  const [openSection3, setOpenSection3] = useState(true);
  const [openSection4, setOpenSection4] = useState(true);

  // ==========================================
  // 1. KATEGORİ VE ALT KATEGORİ HESAPLAMALARI
  // ==========================================
  const categoryData = useMemo(() => {
    const cats: Record<string, any> = {};
    facilityRisks.forEach(r => {
      const cat = r.riskCategory || 'Belirtilmemiş';
      const sub = r.subCategory || 'Diğer';
      
      if (!cats[cat]) cats[cat] = { name: cat, initial: {}, final: {}, subs: {} };
      if (!cats[cat].subs[sub]) cats[cat].subs[sub] = { name: sub, initial: {}, final: {} };
      
      const initLvl = r.initialLevel || 'Bilinmiyor';
      const finalLvl = r.finalLevel || 'Bilinmiyor'; // Eğer final score yoksa aslında initial sayılır ama mevcut durum vs iyileştirme sonrası grafiği bu şekilde. 
      // Düzeltme: Eğer kapanmamışsa "İyileştirme Sonrası" da "Mevcut Durum" ile aynı skora sahip olur mu? Görselde iyileştirme sonrasında sayıların azaldığını görüyoruz.
      // Biz doğrudan finalLevel varsa final'a yazalım.
      
      cats[cat].initial[initLvl] = (cats[cat].initial[initLvl] || 0) + 1;
      cats[cat].subs[sub].initial[initLvl] = (cats[cat].subs[sub].initial[initLvl] || 0) + 1;
      
      // Eğer finalLevel varsa (yani risk hesaplanmışsa) yazalım
      if (r.finalLevel) {
        cats[cat].final[r.finalLevel] = (cats[cat].final[r.finalLevel] || 0) + 1;
        cats[cat].subs[sub].final[r.finalLevel] = (cats[cat].subs[sub].final[r.finalLevel] || 0) + 1;
      }
    });
    return Object.values(cats);
  }, [facilityRisks]);

  const subCategoryInitialData = useMemo(() => {
    const subs: any[] = [];
    categoryData.forEach(cat => {
      Object.values(cat.subs).forEach((sub: any) => {
        const item: any = { name: `${sub.name}` };
        LEVELS.forEach(lvl => item[lvl] = sub.initial[lvl] || 0);
        subs.push(item);
      });
    });
    return subs;
  }, [categoryData]);

  const subCategoryFinalData = useMemo(() => {
    const subs: any[] = [];
    categoryData.forEach(cat => {
      Object.values(cat.subs).forEach((sub: any) => {
        const item: any = { name: `${sub.name}` };
        LEVELS.forEach(lvl => item[lvl] = sub.final[lvl] || 0);
        subs.push(item);
      });
    });
    return subs;
  }, [categoryData]);

  const subCategoryTableData = useMemo(() => {
    const subs: any[] = [];
    categoryData.forEach(cat => {
      Object.values(cat.subs).forEach((sub: any) => {
        subs.push({ ...sub, categoryName: cat.name });
      });
    });
    return subs;
  }, [categoryData]);

  // ==========================================
  // 2. İYİLEŞTİRME ÇALIŞMALARI HESAPLAMALARI
  // ==========================================
  const improvementData = useMemo(() => {
    const stats = {
      planlanan: { name: 'Planlanan Tespit Sayısı', levels: {} as Record<string,number> },
      devam: { name: 'Devam Eden Tespit Sayısı', levels: {} as Record<string,number> },
      tamam: { name: 'Tamamlanan Tespit Sayısı', levels: {} as Record<string,number> },
    };
    
    facilityRisks.forEach(r => {
      // Grafiklerde genelde güncel durumu baz alırız (final varsa final, yoksa initial)
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
      name: lvl,
      Planlanan: improvementData.planlanan.levels[lvl] || 0,
      DevamEden: improvementData.devam.levels[lvl] || 0,
      Tamamlanan: improvementData.tamam.levels[lvl] || 0,
    }));
  }, [improvementData]);

  // ==========================================
  // 3. İYİLEŞTİRME SORUMLUSU HESAPLAMALARI
  // ==========================================
  const responsibleData = useMemo(() => {
    const resps: Record<string, any> = {};
    facilityRisks.forEach(r => {
      const resp = r.improvementResponsible || 'Belirtilmemiş';
      if (!resps[resp]) resps[resp] = { name: resp, tamam: {}, devam: {} };
      
      const lvl = r.finalLevel || r.initialLevel || 'Bilinmiyor';
      if (r.status === 'KAPATILDI_GUVENLI') {
        resps[resp].tamam[lvl] = (resps[resp].tamam[lvl] || 0) + 1;
      } else if (r.status === 'ILK_MUDAHALE_EDILDI' || r.status === 'TAKIP_SURECINDE') {
        resps[resp].devam[lvl] = (resps[resp].devam[lvl] || 0) + 1;
      }
    });
    return Object.values(resps);
  }, [facilityRisks]);

  const responsibleTamamChartData = useMemo(() => {
    return responsibleData.map(r => {
      const item: any = { name: r.name };
      LEVELS.forEach(lvl => item[lvl] = r.tamam[lvl] || 0);
      return item;
    });
  }, [responsibleData]);

  const responsibleDevamChartData = useMemo(() => {
    return responsibleData.map(r => {
      const item: any = { name: r.name };
      LEVELS.forEach(lvl => item[lvl] = r.devam[lvl] || 0);
      return item;
    });
  }, [responsibleData]);

  // ==========================================
  // RENDER HELPERS
  // ==========================================
  const totalLvl = (data: any, lvl: string) => data[lvl] || 0;
  const rowTotal = (data: any) => LEVELS.reduce((sum, lvl) => sum + (data[lvl] || 0), 0);

  const LEVEL_WEIGHTS: Record<string, number> = {
    'Önemsiz Risk': 1,
    'Olası Risk': 2,
    'Önemli Risk': 3,
    'Yüksek Risk': 4,
    'Tolere Gösterilmez Risk': 5
  };

  const calculateImprovement = (initial: any, final: any) => {
    const initScore = LEVELS.reduce((sum, lvl) => sum + (initial[lvl] || 0) * LEVEL_WEIGHTS[lvl], 0);
    const finalScore = LEVELS.reduce((sum, lvl) => sum + (final[lvl] || 0) * LEVEL_WEIGHTS[lvl], 0);
    
    if (initScore === 0) return 0;
    const pct = ((initScore - finalScore) / initScore) * 100;
    return Math.max(0, pct); // In case final score is somehow higher, cap at 0
  };

  return (
    <div className="bg-card dark:bg-slate-900 rounded-xl border border-border dark:border-slate-800 form-shadow overflow-hidden mb-8">
      <div 
        className="px-6 py-4 bg-muted/30 dark:bg-slate-800/30 flex justify-between items-center cursor-pointer hover:bg-muted dark:bg-slate-800/50 transition-colors"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
           <BarChart3 className="w-5 h-5 text-primary" />
           <h4 className="text-base font-bold tracking-wide text-foreground dark:text-slate-100">
             Gelişmiş Risk Analizleri ve İyileştirme Raporları
           </h4>
        </div>
        <ChevronDown className={`w-5 h-5 text-muted-foreground dark:text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
      </div>

      {isOpen && (
        <div className="flex flex-col divide-y divide-border dark:divide-slate-700">
          
          {/* 1. Kategori Bazlı Risk Düzeyi Dağılımı */}
          <div className="p-6 bg-card dark:bg-slate-900">
            <div 
              className="flex items-center justify-between cursor-pointer mb-6"
              onClick={() => setOpenSection1(!openSection1)}
            >
              <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-slate-100 flex items-center gap-2">
                <span className="w-1.5 h-4 bg-primary rounded-full"></span>
                Kategori Bazlı Risk Düzeyi Dağılımı
              </h5>
              <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openSection1 ? 'rotate-180' : ''}`} />
            </div>
            
            {openSection1 && (
            <div className="overflow-x-auto rounded-xl border border-border dark:border-slate-700">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 dark:bg-slate-800/30 text-muted-foreground dark:text-slate-400 uppercase text-[10px] font-bold border-b border-border dark:border-slate-700">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 border-r border-border dark:border-slate-700 text-foreground dark:text-slate-100">Kategoriler</th>
                  <th colSpan={6} className="px-4 py-2 border-r border-border dark:border-slate-700 text-center border-b">Mevcut Durum</th>
                  <th colSpan={6} className="px-4 py-2 text-center border-b border-border dark:border-slate-700 border-r">İyileştirme Sonrası</th>
                  <th rowSpan={2} className="px-4 py-2 text-center text-foreground dark:text-slate-100 font-bold bg-green-500/10">İyileştirme<br/>Yüzdesi</th>
                </tr>
                <tr>
                  {LEVELS.map(lvl => <th key={`m-${lvl}`} className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center">{lvl.replace(' Risk', '').replace('Tolere Gösterilmez', 'Tolere G.')}</th>)}
                  <th className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center font-extrabold text-foreground dark:text-slate-100">Top.</th>
                  {LEVELS.map(lvl => <th key={`i-${lvl}`} className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center">{lvl.replace(' Risk', '').replace('Tolere Gösterilmez', 'Tolere G.')}</th>)}
                  <th className="px-3 py-2 border-t border-border dark:border-slate-700 text-center font-extrabold text-foreground dark:text-slate-100 border-r">Top.</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {categoryData.length === 0 && (
                  <tr><td colSpan={14} className="px-4 py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                )}
                {categoryData.map(cat => {
                  const improvePct = calculateImprovement(cat.initial, cat.final);
                  return (
                  <tr key={cat.name} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2.5 border-r font-bold text-foreground max-w-[200px] truncate" title={cat.name}>{cat.name}</td>
                    {LEVELS.map(lvl => (
                      <td key={`m-${lvl}`} className="px-3 py-2.5 border-r text-center font-medium">{totalLvl(cat.initial, lvl)}</td>
                    ))}
                    <td className="px-3 py-2.5 border-r text-center font-bold bg-muted/20">{rowTotal(cat.initial)}</td>
                    
                    {LEVELS.map(lvl => (
                      <td key={`i-${lvl}`} className="px-3 py-2.5 border-r text-center font-medium">{totalLvl(cat.final, lvl)}</td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-bold bg-muted/20 border-r">{rowTotal(cat.final)}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-green-500/5">
                      {improvePct > 0 ? `%${improvePct.toFixed(1)}` : '-'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            )}
          </div>

          {/* 2. Alt Kategori Yatay Grafikleri (PURE CSS) */}
        <div className="p-6 bg-card/50 dark:bg-slate-900/50">
          <div 
            className="flex items-center justify-between cursor-pointer mb-6"
            onClick={() => setOpenSection2(!openSection2)}
          >
            <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-secondary rounded-full"></span>
              Alt Kategori Dağılımı Grafikleri
            </h5>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openSection2 ? 'rotate-180' : ''}`} />
          </div>
          
          {openSection2 && (
          <>
            <div className="overflow-x-auto rounded-xl border border-border dark:border-slate-700 mb-8">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 dark:bg-slate-800/30 text-muted-foreground dark:text-slate-400 uppercase text-[10px] font-bold border-b border-border dark:border-slate-700">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 border-r border-border dark:border-slate-700 text-foreground dark:text-slate-100">Alt Kategori</th>
                  <th colSpan={6} className="px-4 py-2 border-r border-border dark:border-slate-700 text-center border-b">Mevcut Durum</th>
                  <th colSpan={6} className="px-4 py-2 text-center border-b border-border dark:border-slate-700 border-r">İyileştirme Sonrası</th>
                  <th rowSpan={2} className="px-4 py-2 text-center text-foreground dark:text-slate-100 font-bold bg-green-500/10">İyileştirme<br/>Yüzdesi</th>
                </tr>
                <tr>
                  {LEVELS.map(lvl => <th key={`m-${lvl}`} className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center">{lvl.replace(' Risk', '').replace('Tolere Gösterilmez', 'Tolere G.')}</th>)}
                  <th className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center font-extrabold text-foreground dark:text-slate-100">Top.</th>
                  {LEVELS.map(lvl => <th key={`i-${lvl}`} className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center">{lvl.replace(' Risk', '').replace('Tolere Gösterilmez', 'Tolere G.')}</th>)}
                  <th className="px-3 py-2 border-t border-border dark:border-slate-700 text-center font-extrabold text-foreground dark:text-slate-100 border-r">Top.</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {subCategoryTableData.length === 0 && (
                  <tr><td colSpan={14} className="px-4 py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                )}
                {subCategoryTableData.map((sub, idx) => {
                  const improvePct = calculateImprovement(sub.initial, sub.final);
                  return (
                  <tr key={idx} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-2.5 border-r font-bold text-foreground max-w-[200px] truncate" title={sub.name}>{sub.name}</td>
                    {LEVELS.map(lvl => (
                      <td key={`m-${lvl}`} className="px-3 py-2.5 border-r text-center font-medium">{totalLvl(sub.initial, lvl)}</td>
                    ))}
                    <td className="px-3 py-2.5 border-r text-center font-bold bg-muted/20">{rowTotal(sub.initial)}</td>
                    
                    {LEVELS.map(lvl => (
                      <td key={`i-${lvl}`} className="px-3 py-2.5 border-r text-center font-medium">{totalLvl(sub.final, lvl)}</td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-bold bg-muted/20 border-r">{rowTotal(sub.final)}</td>
                    <td className="px-4 py-2.5 text-center font-bold text-emerald-600 dark:text-emerald-400 bg-green-500/5">
                      {improvePct > 0 ? `%${improvePct.toFixed(1)}` : '-'}
                    </td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
              {/* Mevcut Durum */}
              <div>
                <h5 className="text-center text-xs font-medium text-muted-foreground dark:text-slate-400 mb-6 italic">Mevcut Durum</h5>
                <div className="space-y-4">
                  {subCategoryInitialData.length === 0 && (
                    <div className="h-16 flex items-center justify-center border border-dashed border-border dark:border-slate-700 rounded bg-card dark:bg-slate-900">
                      <span className="text-xs text-muted-foreground dark:text-slate-400">Veri Bulunmuyor</span>
                    </div>
                  )}
                  {subCategoryInitialData.map((sub: any, idx: number) => {
                    const total = rowTotal(sub);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-48 text-xs font-medium text-right leading-tight truncate text-foreground dark:text-slate-100" title={sub.name}>{sub.name}</span>
                        <div className="flex-1 flex h-5 bg-muted dark:bg-slate-800/50 rounded-sm overflow-hidden">
                          {total === 0 && <div className="w-full h-full bg-surface-variant/30"></div>}
                          {LEVELS.map(lvl => {
                            const val = sub[lvl] || 0;
                            if (val === 0) return null;
                            const pct = (val / total) * 100;
                            const barClass = lvl === 'Tolere Gösterilmez Risk' ? 'risk-bar-unbearable' :
                                             lvl === 'Yüksek Risk' ? 'risk-bar-high' :
                                             lvl === 'Önemli Risk' ? 'risk-bar-significant' :
                                             lvl === 'Olası Risk' ? 'risk-bar-probable' : 'risk-bar-insignificant';
                            return <div key={lvl} className={`${barClass} transition-all duration-1000`} style={{ width: `${pct}%` }} title={`${lvl}: ${val}`} />
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* İyileştirme Sonrası */}
              <div>
                <h5 className="text-center text-xs font-medium text-muted-foreground dark:text-slate-400 mb-6 italic">İyileştirme Sonrası</h5>
                <div className="space-y-4">
                  {subCategoryFinalData.length === 0 && (
                    <div className="h-16 flex items-center justify-center border border-dashed border-border dark:border-slate-700 rounded bg-card dark:bg-slate-900">
                      <span className="text-xs text-muted-foreground dark:text-slate-400">Veri Bulunmuyor</span>
                    </div>
                  )}
                  {subCategoryFinalData.map((sub: any, idx: number) => {
                    const total = rowTotal(sub);
                    return (
                      <div key={idx} className="flex items-center gap-3">
                        <span className="w-48 text-xs font-medium text-right leading-tight truncate text-foreground dark:text-slate-100" title={sub.name}>{sub.name}</span>
                        <div className="flex-1 flex h-5 bg-muted dark:bg-slate-800/50 rounded-sm overflow-hidden">
                          {total === 0 && <div className="w-full h-full bg-surface-variant/30"></div>}
                          {LEVELS.map(lvl => {
                            const val = sub[lvl] || 0;
                            if (val === 0) return null;
                            const pct = (val / total) * 100;
                            const barClass = lvl === 'Tolere Gösterilmez Risk' ? 'risk-bar-unbearable' :
                                             lvl === 'Yüksek Risk' ? 'risk-bar-high' :
                                             lvl === 'Önemli Risk' ? 'risk-bar-significant' :
                                             lvl === 'Olası Risk' ? 'risk-bar-probable' : 'risk-bar-insignificant';
                            return <div key={lvl} className={`${barClass} transition-all duration-1000`} style={{ width: `${pct}%` }} title={`${lvl}: ${val}`} />
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap justify-center gap-4 text-[10px] font-medium text-muted-foreground dark:text-slate-400 pt-4 border-t border-border dark:border-slate-700 mt-8">
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full risk-bar-unbearable"></div>Tolere Gösterilemez</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full risk-bar-high"></div>Yüksek</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full risk-bar-significant"></div>Önemli</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full risk-bar-probable"></div>Olası</div>
              <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full risk-bar-insignificant"></div>Önemsiz</div>
            </div>
          </>
          )}
        </div>

        {/* 3. İyileştirme Çalışmaları */}
        <div className="p-6 bg-card dark:bg-slate-900">
          <div 
            className="flex items-center justify-between cursor-pointer mb-6"
            onClick={() => setOpenSection3(!openSection3)}
          >
            <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full"></span>
              İyileştirme Çalışmaları
            </h5>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openSection3 ? 'rotate-180' : ''}`} />
          </div>
          
          {openSection3 && (
          <div className="space-y-6">
            <div className="overflow-x-auto rounded-xl border border-border dark:border-slate-700">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 dark:bg-slate-800/30 text-muted-foreground dark:text-slate-400 uppercase text-[10px] font-bold border-b border-border dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3 border-r border-border dark:border-slate-700 text-foreground dark:text-slate-100">Çalışma Durumu</th>
                  {LEVELS.map(lvl => <th key={lvl} className="px-3 py-2 border-r border-border dark:border-slate-700 text-center">{lvl.replace(' Risk', '').replace('Tolere Gösterilmez', 'Tolere G.')}</th>)}
                  <th className="px-3 py-2 text-center text-foreground dark:text-slate-100 font-extrabold">Top.</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {[improvementData.planlanan, improvementData.devam, improvementData.tamam].map((row: any) => (
                  <tr key={row.name} className="hover:bg-muted/10">
                    <td className="px-4 py-2.5 border-r font-bold text-foreground">{row.name}</td>
                    {LEVELS.map(lvl => (
                      <td key={lvl} className="px-3 py-2.5 border-r text-center">{totalLvl(row.levels, lvl)}</td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-bold bg-muted/20">{rowTotal(row.levels)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={improvementChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }} tickFormatter={(val) => val.replace(' Risk', '')} />
                <YAxis tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }} />
                <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-outline-variant)' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '10px', color: 'var(--color-on-surface)' }} />
                <Bar dataKey="Planlanan" fill="var(--color-error)" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10, formatter: (val: number) => val > 0 ? val : '' }} />
                <Bar dataKey="DevamEden" fill="var(--color-secondary)" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10, formatter: (val: number) => val > 0 ? val : '' }} />
                <Bar dataKey="Tamamlanan" fill="var(--color-surface-tint)" radius={[4, 4, 0, 0]} label={{ position: 'top', fontSize: 10, formatter: (val: number) => val > 0 ? val : '' }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          </div>
          )}
        </div>

        {/* 4. İyileştirme Sorumluları */}
        <div className="p-6 bg-card/50 dark:bg-slate-900/50">
          <div 
            className="flex items-center justify-between cursor-pointer mb-6"
            onClick={() => setOpenSection4(!openSection4)}
          >
            <h5 className="text-sm font-bold uppercase tracking-wider text-foreground dark:text-slate-100 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-blue-500 rounded-full"></span>
              İyileştirme Sorumluları Analizi
            </h5>
            <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openSection4 ? 'rotate-180' : ''}`} />
          </div>
          
          {openSection4 && (
          <div className="space-y-8">
            <div className="overflow-x-auto rounded-xl border border-border dark:border-slate-700">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-muted/30 dark:bg-slate-800/30 text-muted-foreground dark:text-slate-400 uppercase text-[10px] font-bold border-b border-border dark:border-slate-700">
                <tr>
                  <th rowSpan={2} className="px-4 py-3 border-r border-border dark:border-slate-700 text-foreground dark:text-slate-100">İyileştirme Sorumlusu</th>
                  <th colSpan={6} className="px-4 py-2 border-r border-border dark:border-slate-700 text-center border-b bg-green-500/5">Tamamlanan İyileştirmeler</th>
                  <th colSpan={6} className="px-4 py-2 text-center border-b bg-blue-500/5">Devam Eden İyileştirmeler</th>
                </tr>
                <tr>
                  {LEVELS.map(lvl => <th key={`t-${lvl}`} className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center">{lvl.replace(' Risk', '').replace('Tolere Gösterilmez', 'Tolere G.')}</th>)}
                  <th className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center font-extrabold text-foreground dark:text-slate-100">Top.</th>
                  {LEVELS.map(lvl => <th key={`d-${lvl}`} className="px-3 py-2 border-r border-t border-border dark:border-slate-700 text-center">{lvl.replace(' Risk', '').replace('Tolere Gösterilmez', 'Tolere G.')}</th>)}
                  <th className="px-3 py-2 border-t border-border dark:border-slate-700 text-center font-extrabold text-foreground dark:text-slate-100">Top.</th>
                </tr>
              </thead>
              <tbody className="divide-y text-xs">
                {responsibleData.length === 0 && (
                  <tr><td colSpan={13} className="px-4 py-8 text-center text-muted-foreground">Veri bulunamadı</td></tr>
                )}
                {responsibleData.map((row: any) => (
                  <tr key={row.name} className="hover:bg-muted/10">
                    <td className="px-4 py-2.5 border-r font-bold text-foreground max-w-[200px] truncate" title={row.name}>{row.name}</td>
                    {LEVELS.map(lvl => (
                      <td key={`t-${lvl}`} className="px-3 py-2.5 border-r text-center">{totalLvl(row.tamam, lvl)}</td>
                    ))}
                    <td className="px-3 py-2.5 border-r text-center font-bold bg-muted/20">{rowTotal(row.tamam)}</td>
                    
                    {LEVELS.map(lvl => (
                      <td key={`d-${lvl}`} className="px-3 py-2.5 border-r text-center">{totalLvl(row.devam, lvl)}</td>
                    ))}
                    <td className="px-3 py-2.5 text-center font-bold bg-muted/20">{rowTotal(row.devam)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8 pt-8 border-t border-border dark:border-slate-700">
             <div>
               <h3 className="text-xs font-bold mb-3 text-center text-muted-foreground dark:text-slate-400">Tamamlanan İyileştirmeler</h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responsibleTamamChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }} width={120} interval={0} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-outline-variant)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      {LEVELS.map(lvl => (
                        <Bar key={lvl} dataKey={lvl} stackId="a" fill={LEVEL_COLORS[lvl]} barSize={20} label={{ position: 'insideRight', fill: '#fff', fontSize: 10, formatter: (val: number) => val > 0 ? val : '' }} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
               </div>
             </div>
             
             <div>
               <h3 className="text-xs font-bold mb-3 text-center text-muted-foreground dark:text-slate-400">Devam Eden İyileştirmeler</h3>
               <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={responsibleDevamChartData} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: 'var(--color-on-surface-variant)' }} width={120} interval={0} />
                      <Tooltip cursor={{ fill: 'rgba(0,0,0,0.05)' }} contentStyle={{ borderRadius: '8px', border: '1px solid var(--color-outline-variant)' }} />
                      <Legend iconType="circle" wrapperStyle={{ fontSize: '10px' }} />
                      {LEVELS.map(lvl => (
                        <Bar key={lvl} dataKey={lvl} stackId="a" fill={LEVEL_COLORS[lvl]} barSize={20} label={{ position: 'insideRight', fill: '#fff', fontSize: 10, formatter: (val: number) => val > 0 ? val : '' }} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
               </div>
             </div>
            </div>
          </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
}
