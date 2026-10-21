import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  Sparkles, 
  CheckCircle2, 
  Clock, 
  Layers, 
  ChevronRight,
  ArrowUpRight,
  ShieldCheck,
  Zap,
  Wrench,
  Flame,
  ClipboardList
} from 'lucide-react';
import { type DashboardStats, AUDIT_SHEETS } from './types';

interface ExecutiveProgressCockpitProps {
  stats: DashboardStats | null;
  mode: 'MAIN' | 'MODULE';
  moduleGroup?: string;
  moduleTitle?: string;
  className?: string;
}

const MODULE_ICONS: Record<string, any> = {
  DENETIMLER: ClipboardList,
  ELEKTRIK: Zap,
  MEKANIK: Wrench,
  YANGIN: Flame,
};

const MODULE_COLORS: Record<string, { border: string; bg: string; text: string; bar: string }> = {
  DENETIMLER: { border: 'border-emerald-500/30', bg: 'bg-emerald-500/10', text: 'text-emerald-600 dark:text-emerald-400', bar: 'bg-emerald-500' },
  ELEKTRIK: { border: 'border-amber-500/30', bg: 'bg-amber-500/10', text: 'text-amber-600 dark:text-amber-400', bar: 'bg-amber-500' },
  MEKANIK: { border: 'border-blue-500/30', bg: 'bg-blue-500/10', text: 'text-blue-600 dark:text-blue-400', bar: 'bg-blue-500' },
  YANGIN: { border: 'border-rose-500/30', bg: 'bg-rose-500/10', text: 'text-rose-600 dark:text-rose-400', bar: 'bg-rose-500' },
};

export const ExecutiveProgressCockpit: React.FC<ExecutiveProgressCockpitProps> = ({
  stats,
  mode,
  moduleGroup = 'ALL',
  moduleTitle,
  className = '',
}) => {
  const navigate = useNavigate();

  if (!stats) return null;

  const summary = stats.summary;
  const total = summary.total || 0;
  const completed = summary.completed || 0;
  const inProgress = summary.inProgress || 0;
  const notStarted = summary.notStarted || 0;
  const cancelled = summary.cancelled || 0;
  const activeTotal = total - cancelled;

  const rawCompletion = summary.completionPercentage || 0;
  const weightedCompletion = summary.weightedCompletionPercentage ?? (
    activeTotal > 0 ? Math.round(((summary.totalProgressSum || 0) / activeTotal) * 10) / 10 : 0
  );

  const avgInProgress = summary.avgInProgressProgress ?? (
    inProgress > 0 ? Math.round(((summary.totalProgressSum || 0) - (completed * 100)) / inProgress) : 0
  );

  // Devam eden işlerin sisteme kattığı ekstra tamamlanma yüzdesi
  const inProgressContributionPct = Math.max(0, Math.round((weightedCompletion - rawCompletion) * 10) / 10);
  const remainingPct = Math.max(0, Math.round((100 - weightedCompletion) * 10) / 10);

  // Bitişe yakınlık kademeleri
  const brackets = summary.inProgressBrackets || {
    nearCompletion: 0,
    inExecution: 0,
    earlyStage: 0,
  };

  // Sağ taraf listesi: MAIN modda 4 Ana Modül, MODULE modda alt sekmeler
  const rightItems = (() => {
    if (mode === 'MAIN') {
      const defaultModules = [
        { key: 'DENETIMLER', label: 'Denetimler', path: '/operations-management/improvements/denetimler/dashboard' },
        { key: 'ELEKTRIK', label: 'Elektrik', path: '/operations-management/improvements/electrical/dashboard' },
        { key: 'MEKANIK', label: 'Mekanik', path: '/operations-management/improvements/mechanical/dashboard' },
        { key: 'YANGIN', label: 'Yangın Güvenliği', path: '/operations-management/improvements/fire/dashboard' },
      ];

      return defaultModules.map(dm => {
        const modStat = stats.modules?.[dm.key];
        const mTotal = modStat?.total || 0;
        const mCompleted = modStat?.completed || 0;
        const mInProgress = modStat?.inProgress || 0;
        const mActive = mTotal - (modStat?.cancelled || 0);
        const mWeighted = modStat?.weightedCompletionPercentage || (
          mActive > 0 ? Math.round(((modStat?.progressSum || 0) / mActive) * 10) / 10 : 0
        );
        const mRawPct = modStat?.completionPercentage || (
          mActive > 0 ? Math.round((mCompleted / mActive) * 100) : 0
        );
        const mAvgInProg = modStat?.avgInProgressProgress || 0;

        return {
          id: dm.key,
          title: dm.label,
          path: dm.path,
          total: mTotal,
          completed: mCompleted,
          inProgress: mInProgress,
          weightedPercentage: mWeighted,
          rawPercentage: mRawPct,
          avgInProgress: mAvgInProg,
          icon: MODULE_ICONS[dm.key] || Layers,
          color: MODULE_COLORS[dm.key] || MODULE_COLORS.ELEKTRIK,
        };
      });
    } else {
      // Modüle özgü sekmeler
      const sheetKeys = Object.keys(stats.sheets || {});
      return sheetKeys.map(sKey => {
        const s = stats.sheets[sKey];
        const sTotal = s.total || 0;
        const sCompleted = s.completed || 0;
        const sInProgress = s.inProgress || 0;
        const sActive = sTotal - (s.cancelled || 0);
        const sWeighted = s.weightedCompletionPercentage || (
          sActive > 0 ? Math.round(((s.completed * 100 + (sInProgress * (s.avgInProgressProgress || 0))) / sActive) * 10) / 10 : 0
        );
        const sRawPct = s.completionPercentage || (sActive > 0 ? Math.round((sCompleted / sActive) * 100) : 0);

        // Sekme başlığını bul
        const auditSheet = AUDIT_SHEETS.find(as => as.key === sKey);
        const title = auditSheet?.name || sKey.replace(/_/g, ' ');

        return {
          id: sKey,
          title,
          total: sTotal,
          completed: sCompleted,
          inProgress: sInProgress,
          weightedPercentage: sWeighted,
          rawPercentage: sRawPct,
          avgInProgress: s.avgInProgressProgress || 0,
          icon: Layers,
          color: MODULE_COLORS.ELEKTRIK,
        };
      }).sort((a, b) => b.total - a.total);
    }
  })();

  return (
    <div className={`bg-card text-card-foreground border border-border/80 rounded-3xl p-5 sm:p-6 shadow-xs relative overflow-hidden ${className}`}>
      
      {/* Arka Plan Hafif Gradient Detayı */}
      <div className="absolute -top-24 -right-24 w-96 h-96 bg-gradient-to-br from-blue-500/5 via-indigo-500/5 to-transparent rounded-full blur-3xl pointer-events-none" />

      {/* ── ÜST BAŞLIK BANDI ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4 mb-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-xs">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground flex items-center gap-2">
              <span>{mode === 'MAIN' ? 'Yönetici İlerleme ve Saha Olgunluk Kokpiti' : `${moduleTitle || 'Modül'} İlerleme Kokpiti`}</span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/15 text-blue-700 dark:text-blue-400 border border-blue-300 dark:border-blue-800">
                Ağırlıklı Efor
              </span>
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {mode === 'MAIN' 
                ? 'Bulgu hacmi, kesin kapananlar ve devam eden işlerin bitişe yakınlık analizi.'
                : 'Bu modül altındaki alt sekmelerin hacmi ve sahadaki fiili ilerleme oranları.'}
            </p>
          </div>
        </div>

        {/* Sağ: Toplam Bulgu ve Efektif Başarı Özeti */}
        <div className="flex items-center gap-3">
          <div className="bg-muted/40 border rounded-2xl px-3.5 py-1.5 flex items-center gap-2.5">
            <div className="text-right">
              <div className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Toplam Bulgu</div>
              <div className="text-sm font-black font-mono text-foreground leading-tight">{total} Adet</div>
            </div>
            <div className="h-6 w-px bg-border/80" />
            <div className="text-right">
              <div className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Ağırlıklı Başarı</div>
              <div className="text-sm font-black font-mono text-emerald-600 dark:text-emerald-400 leading-tight">
                %{weightedCompletion}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── İKİ SÜTUNLU KOKPİT GRİDİ ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SOL BÖLÜM (5 SÜTUN): DEVAM EDENLERİN İÇ OLGUNLUĞU & KAZANILMIŞ DEĞER    */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-4 bg-muted/20 border border-border/70 rounded-2xl p-4 sm:p-5">
          
          {/* 1. Makro İlerleme Spektrumu (3 Renkli Bant) */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="font-bold text-foreground flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                Saha Gerçekleşme Spektrumu
              </span>
              <span className="font-mono text-xs font-black text-blue-600 dark:text-blue-400">
                %{weightedCompletion} Gerçekleşti
              </span>
            </div>

            {/* Çift/Üç Renkli Yığılmış İlerleme Bandı */}
            <div className="w-full bg-slate-200 dark:bg-slate-800 rounded-xl h-3.5 flex overflow-hidden p-0.5 shadow-inner">
              {/* Yeşil: Tamamlanan */}
              <div 
                className="bg-emerald-500 h-full rounded-l-lg transition-all duration-500"
                style={{ width: `${Math.min(100, rawCompletion)}%` }}
                title={`Tam Kapanan: %${rawCompletion} (${completed} Bulgu)`}
              />
              {/* Canlı Mavi: Devam Edenlerin Tamamlanan Payı */}
              <div 
                className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full transition-all duration-500"
                style={{ width: `${Math.min(100 - rawCompletion, inProgressContributionPct)}%` }}
                title={`Devam Edenlerin Katkısı: +%${inProgressContributionPct}`}
              />
            </div>

            {/* Spektrum Lejantı */}
            <div className="grid grid-cols-3 gap-1 pt-1 text-[11px]">
              <div className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-400 font-semibold truncate">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
                <span>Tam: {completed} (%{rawCompletion})</span>
              </div>
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-semibold truncate">
                <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span>Süreçte: +%{inProgressContributionPct}</span>
              </div>
              <div className="flex items-center gap-1.5 text-muted-foreground font-medium justify-end truncate">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-400 dark:bg-slate-600 shrink-0" />
                <span>Kalan: %{remainingPct}</span>
              </div>
            </div>
          </div>

          <div className="h-px bg-border/60" />

          {/* 2. Devam Edenlerin Bitişe Yakınlık Vurgu Kartı (Kullanıcının İstediği Çarpıcı Alan) */}
          <div className="space-y-3 bg-card border border-blue-500/25 rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
                <span className="text-xs font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                  Devam Eden {inProgress} İşin Durumu
                </span>
              </div>
              <span className="text-xs font-mono font-bold text-muted-foreground">
                Ortalama %{avgInProgress}
              </span>
            </div>

            {/* Çift Göstergeli Olgunluk Bandı: Tamamlandı vs Kaldı */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-xs font-bold font-mono">
                <span className="text-blue-600 dark:text-blue-400">%{avgInProgress} Tamamlandı</span>
                <span className="text-muted-foreground">%{Math.max(0, 100 - avgInProgress)} Kaldı</span>
              </div>

              <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-3 flex overflow-hidden border border-border/60">
                <div 
                  className="bg-blue-600 h-full transition-all duration-500"
                  style={{ width: `${Math.min(100, Math.max(0, avgInProgress))}%` }}
                />
                <div 
                  className="bg-blue-200 dark:bg-blue-950/70 h-full flex-1"
                />
              </div>

              <p className="text-[11px] text-muted-foreground leading-snug pt-0.5">
                💡 Devam eden işlerin <strong className="text-foreground font-bold">%{avgInProgress}'si</strong> tamamlandı. Aksiyon adımları ilerledikçe bu işler doğrudan <em>"Tamamlandı"</em> statüsüne geçecektir.
              </p>
            </div>

            {/* 3 Kademe Rozetleri (Bitişe Yakınlık Kademeleri) */}
            <div className="grid grid-cols-3 gap-2 pt-1">
              {/* Kademe 1: Bitişe Çok Yakın (%70+) */}
              <div className="bg-emerald-500/10 border border-emerald-500/25 rounded-xl p-2 text-center">
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 uppercase tracking-tight flex items-center justify-center gap-1">
                  <span>🏁 Bitişe Yakın</span>
                </div>
                <div className="text-base font-black font-mono text-emerald-700 dark:text-emerald-400 mt-0.5">
                  {brackets.nearCompletion}
                </div>
                <div className="text-[9px] text-muted-foreground font-medium">%70 ve üzeri</div>
              </div>

              {/* Kademe 2: Tedarik & Montaj (%30 - %69) */}
              <div className="bg-blue-500/10 border border-blue-500/25 rounded-xl p-2 text-center">
                <div className="text-[10px] font-bold text-blue-700 dark:text-blue-400 uppercase tracking-tight flex items-center justify-center gap-1">
                  <span>⚙️ Tedarik / İşlem</span>
                </div>
                <div className="text-base font-black font-mono text-blue-700 dark:text-blue-400 mt-0.5">
                  {brackets.inExecution}
                </div>
                <div className="text-[9px] text-muted-foreground font-medium">%30 - %69</div>
              </div>

              {/* Kademe 3: Yeni Başlayan (%0 - %29) */}
              <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl p-2 text-center">
                <div className="text-[10px] font-bold text-amber-700 dark:text-amber-400 uppercase tracking-tight flex items-center justify-center gap-1">
                  <span>📝 Talep / İhale</span>
                </div>
                <div className="text-base font-black font-mono text-amber-700 dark:text-amber-400 mt-0.5">
                  {brackets.earlyStage}
                </div>
                <div className="text-[9px] text-muted-foreground font-medium">%0 - %29</div>
              </div>
            </div>

          </div>

        </div>

        {/* ═══════════════════════════════════════════════════════════════════════ */}
        {/* SAĞ BÖLÜM (7 SÜTUN): BÖLÜMLERİN / ALT SEKMELELERİN HACİM & İLERLEMESİ   */}
        {/* ═══════════════════════════════════════════════════════════════════════ */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-3">
          
          <div className="flex items-center justify-between pb-1">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-primary" />
              {mode === 'MAIN' ? 'Bölümler Bazında Hacim ve Gerçekleşme' : 'Alt Başlıklar Bazında Hacim ve Gerçekleşme'}
            </span>
            <span className="text-[11px] text-muted-foreground font-medium">
              (Bulgu Hacmi & Ağırlıklı %)
            </span>
          </div>

          {/* İtem Listesi / Yatay Bileşik Efor Barları */}
          <div className="space-y-2.5">
            {rightItems.length === 0 ? (
              <div className="p-8 text-center text-xs text-muted-foreground border rounded-2xl bg-muted/10">
                Bu görünümde henüz kayıt bulunamadı.
              </div>
            ) : (
              rightItems.map((item) => {
                const ItemIcon = item.icon || Layers;
                const hasPath = 'path' in item && Boolean(item.path);

                return (
                  <div 
                    key={item.id}
                    onClick={() => {
                      if (hasPath && (item as any).path) {
                        navigate((item as any).path);
                      }
                    }}
                    className={`p-3 rounded-2xl border transition-all ${
                      hasPath 
                        ? 'cursor-pointer hover:bg-muted/40 hover:border-primary/40 group' 
                        : 'bg-card'
                    }`}
                  >
                    {/* Başlık ve Metrikler Satırı */}
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${item.color.bg} ${item.color.text}`}>
                          <ItemIcon className="w-3.5 h-3.5" />
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground truncate group-hover:text-primary transition-colors">
                              {item.title}
                            </span>
                            {hasPath && (
                              <ArrowUpRight className="w-3 h-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <div className="text-[10px] text-muted-foreground">
                            {item.total} Bulgu • {item.completed} Biten • {item.inProgress} Süreçte
                          </div>
                        </div>
                      </div>

                      {/* Sağ: Yüzdeler */}
                      <div className="text-right shrink-0">
                        <div className="text-sm font-black font-mono text-foreground leading-tight">
                          %{item.weightedPercentage}
                        </div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Devam Eden Ort: %{item.avgInProgress}
                        </div>
                      </div>
                    </div>

                    {/* Çift Katmanlı Yatay İlerleme Çubuğu */}
                    <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-2 flex overflow-hidden border border-border/40">
                      {/* Yeşil: Tam kapanan */}
                      <div 
                        className="bg-emerald-500 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100, item.rawPercentage)}%` }}
                        title={`Kesin Biten: %${item.rawPercentage}`}
                      />
                      {/* Mavi: Devam edenlerin ağırlıklı payı */}
                      <div 
                        className="bg-blue-600 h-full transition-all duration-300"
                        style={{ width: `${Math.min(100 - item.rawPercentage, Math.max(0, item.weightedPercentage - item.rawPercentage))}%` }}
                        title={`Devam Eden Katkısı: +%${Math.max(0, Math.round((item.weightedPercentage - item.rawPercentage) * 10) / 10)}`}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Alt Yönetici Bilgi Notu */}
          <div className="p-2.5 rounded-xl bg-muted/40 border text-[11px] text-muted-foreground flex items-center justify-between">
            <span className="flex items-center gap-1.5 font-medium">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Çubuk renkleri: 🟩 Yeşil = Tam Kapanan, 🟦 Mavi = Devam Edenlerin Tamamlanan Payı
            </span>
            <span className="hidden sm:inline font-mono font-bold text-foreground">
              {rightItems.length} Grup İnceleniyor
            </span>
          </div>

        </div>

      </div>

    </div>
  );
};
