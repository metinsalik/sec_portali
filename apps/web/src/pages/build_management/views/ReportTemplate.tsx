import React, { forwardRef } from 'react';
import {
  type Finding,
  type AuditMeta,
  type IRSCFacility,
  RISK_LEVELS,
  RISK_COLORS,
  normalizeRiskLevel,
  getRiskSolidClass,
} from '../types';
import { AUDIT_PRINT_RICH_CONTENT_CLASS } from '../components/AuditRichTextEditor';

interface ReportTemplateProps {
  auditMeta: AuditMeta & { criteria?: string[] };
  findings: Finding[];
  facility?: IRSCFacility;
  logoUrl?: string;
}

const RISK_WEIGHTS: Record<string, number> = {
  Kritik: 5,
  Yüksek: 4,
  Önemli: 3,
  Olası: 2,
  Önemsiz: 1,
};

/**
 * Binanın en üstünden (Çatı -> 15. Kat -> ... -> 1. Kat -> Asma -> Zemin -> -1/B1 -> -2/B2 -> Dış Alan)
 * aşağıya doğru deterministik kat sıralama puanı üretir.
 */
function getFloorInfo(f: Finding): { rank: number; label: string } {
  const candidates = [
    f.floor || '',
    ...(f.area ? f.area.split(/[>|/]/).map((s) => s.trim()) : []),
    f.subarea || '',
  ].filter(Boolean);

  for (const raw of candidates) {
    const s = raw.toLocaleLowerCase('tr-TR').trim();
    if (!s) continue;

    // Çatı / Teras / Makine Dairesi (En üst)
    if (
      s.includes('çatı') ||
      s.includes('cati') ||
      s.includes('teras') ||
      s.includes('roof') ||
      s.includes('makine dairesi')
    ) {
      return { rank: 1000, label: raw.trim() };
    }

    // Negatif / Bodrum katlar: -1. Kat, -2 Kat, B1, B2, 1. Bodrum, Bodrum 2, Eksi 1
    const negNumMatch = s.match(/(?:^|[\s(])-\s*(\d{1,2})\s*(?:\.?\s*kat|k)?(?:\b|$)/i);
    if (negNumMatch) {
      const n = parseInt(negNumMatch[1], 10);
      return { rank: -n, label: `${-n}. Kat` };
    }
    const bCodeMatch = s.match(/\bb\s*-?\s*(\d{1,2})\b/i);
    if (bCodeMatch) {
      const n = parseInt(bCodeMatch[1], 10);
      return { rank: -n, label: `B${n} (${n}. Bodrum)` };
    }
    const bodrumNumMatch =
      s.match(/(\d{1,2})\s*\.?\s*bodrum/i) ||
      s.match(/bodrum\s*(?:kat)?\s*[-#]?\s*(\d{1,2})/i) ||
      s.match(/eksi\s*(\d{1,2})/i);
    if (bodrumNumMatch) {
      const n = parseInt(bodrumNumMatch[1], 10);
      return { rank: -n, label: `${n}. Bodrum Kat` };
    }
    if (s.includes('bodrum') || s.includes('sığınak') || s.includes('siginak')) {
      return { rank: -1, label: 'Bodrum Kat' };
    }

    // Pozitif katlar: 15. Kat, 15.Kat, 15 Kat, Kat 15, K15, +3
    const posKatMatch =
      s.match(/(?:^|[\s(])(\d{1,2})\s*\.?\s*kat\b/i) ||
      s.match(/\bkat\s*[:#-]?\s*(\d{1,2})\b/i) ||
      s.match(/\bk\s*\.?\s*(\d{1,2})\b/i) ||
      s.match(/^\+?(\d{1,2})\.?$/);
    if (posKatMatch) {
      const n = parseInt(posKatMatch[1], 10);
      if (n === 0) return { rank: 0, label: 'Zemin Kat' };
      return { rank: n, label: `${n}. Kat` };
    }

    // Asma / Ara kat
    if (s.includes('asma') || s.includes('ara kat') || s.includes('mezzanin')) {
      return { rank: 0.5, label: 'Asma Kat' };
    }

    // Zemin / Giriş / Lobi
    if (
      s.includes('zemin') ||
      s.includes('giriş') ||
      s.includes('giris') ||
      s.includes('lobi')
    ) {
      return { rank: 0, label: 'Zemin Kat' };
    }
  }

  return { rank: -999, label: 'Genel / Diğer Alanlar' };
}

/**
 * Mahallere inmeden sadece Birim / Bölüm bilgisini çıkarır.
 */
function getUnitLabel(f: Finding): string {
  if (f.department && f.department.trim()) return f.department.trim();
  if (f.area && f.area.trim()) {
    const parts = f.area
      .split('>')
      .map((p) => p.trim())
      .filter(Boolean);
    if (parts.length >= 2) {
      return parts[parts.length - 1];
    }
    return parts[0] || f.area.trim();
  }
  return '';
}

function formatTrDate(val?: string | null): string {
  if (!val) return '—';
  const d = new Date(val);
  return Number.isNaN(d.getTime()) ? val : d.toLocaleDateString('tr-TR');
}

/**
 * Print/PDF ortamında asla kesilmeyen ve boş çıkmayan saf vektör SVG Donut grafik.
 */
function PrintDonutChart({
  data,
  centerValue,
  centerLabel,
}: {
  data: { name: string; value: number; color: string }[];
  centerValue: string;
  centerLabel: string;
}) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const size = 148;
  const strokeWidth = 22;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let cumulativePercent = 0;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0"
      role="img"
      aria-label={centerLabel}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e2e8f0"
        strokeWidth={strokeWidth}
      />
      {total > 0 &&
        data.map((slice, idx) => {
          const pct = slice.value / total;
          const dashLength = pct * circumference;
          const dashOffset = -cumulativePercent * circumference;
          cumulativePercent += pct;
          return (
            <circle
              key={idx}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={slice.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
            />
          );
        })}
      <text
        x="50%"
        y="46%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-900 font-extrabold"
        style={{ fontSize: '22px' }}
      >
        {centerValue}
      </text>
      <text
        x="50%"
        y="63%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-500 font-semibold"
        style={{ fontSize: '9px', letterSpacing: '0.06em' }}
      >
        {centerLabel}
      </text>
    </svg>
  );
}

const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ auditMeta, findings, facility, logoUrl }, ref) => {
    // 1. Bulguları binanın en üst katından (Çatı -> 15. Kat -> ... -> Zemin -> Bodrum)
    //    ve her kat içinde Kritikten Önemsize doğru sırala
    const sortedFindings = [...findings].sort((a, b) => {
      const floorA = getFloorInfo(a);
      const floorB = getFloorInfo(b);
      if (floorB.rank !== floorA.rank) return floorB.rank - floorA.rank;

      const riskA = RISK_WEIGHTS[normalizeRiskLevel(a.risk)] || 0;
      const riskB = RISK_WEIGHTS[normalizeRiskLevel(b.risk)] || 0;
      if (riskB !== riskA) return riskB - riskA;

      const unitCompare = getUnitLabel(a).localeCompare(getUnitLabel(b), 'tr-TR');
      if (unitCompare !== 0) return unitCompare;

      return (a.no || '').localeCompare(b.no || '', 'tr-TR');
    });

    // 2. KPI & Veri Özeti Hesaplamaları
    const totalFindings = findings.length;
    const newFindings = findings.filter((f) => f.status === 'Yeni Tespit Edilen').length;
    const carryOverFindings = totalFindings - newFindings;
    const closedFindings = findings.filter((f) => f.status === 'Tamamlanan').length;
    const partialFindings = findings.filter((f) => f.status === 'Kısmen İyileştirilen').length;
    const unimprovedFindings = findings.filter((f) => f.status === 'İyileştirilmeyen').length;
    const openFindings = totalFindings - closedFindings;
    const criticalHighOpen = findings.filter(
      (f) =>
        f.status !== 'Tamamlanan' &&
        ['Kritik', 'Yüksek'].includes(normalizeRiskLevel(f.risk))
    ).length;
    const completionRate = totalFindings > 0 ? Math.round((closedFindings / totalFindings) * 100) : 0;

    const riskCounts = findings.reduce((acc, f) => {
      const key = normalizeRiskLevel(f.risk);
      acc[key] = (acc[key] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const riskDistribution = RISK_LEVELS.map((level) => ({
      name: level,
      value: riskCounts[level] || 0,
      pct: totalFindings > 0 ? Math.round(((riskCounts[level] || 0) / totalFindings) * 100) : 0,
      color: RISK_COLORS[level],
    }));

    const statusData = [
      { name: 'Tamamlanan', value: closedFindings, color: '#10b981' },
      { name: 'Kısmen İyileştirilen', value: partialFindings, color: '#f59e0b' },
      { name: 'Yeni Tespit Edilen', value: newFindings, color: '#3b82f6' },
      { name: 'İyileştirilmeyen', value: unimprovedFindings, color: '#ef4444' },
    ].filter((d) => d.value > 0);

    const topCategories = Object.entries(
      findings.reduce((acc, f) => {
        const cat = (f.category || 'Belirtilmemiş').trim();
        acc[cat] = (acc[cat] || 0) + 1;
        return acc;
      }, {} as Record<string, number>)
    )
      .sort((a, b) => b[1] - a[1])
      .slice(0, 6);

    // 3. Bölüm 2: Mahaller yerine sadece Katlar ve Birimler özeti
    const floorSummaryMap = new Map<string, { label: string; rank: number; count: number }>();
    const unitSummaryMap = new Map<string, number>();

    sortedFindings.forEach((f) => {
      const fl = getFloorInfo(f);
      const prevF = floorSummaryMap.get(fl.label);
      if (prevF) {
        prevF.count += 1;
      } else {
        floorSummaryMap.set(fl.label, { label: fl.label, rank: fl.rank, count: 1 });
      }

      const unit = getUnitLabel(f);
      if (unit && unit !== fl.label) {
        unitSummaryMap.set(unit, (unitSummaryMap.get(unit) || 0) + 1);
      }
    });

    const floorSummary = Array.from(floorSummaryMap.values()).sort((a, b) => b.rank - a.rank);
    const unitSummary = Array.from(unitSummaryMap.entries()).sort((a, b) => b[1] - a[1]);

    // Her sayfada tekrar eden kurumsal üst başlık (~1.4cm kompakt yükseklik)
    const RepeatingHeader = () => (
      <div className="mb-2 pb-1.5 border-b-2 border-slate-400 flex items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-2.5 min-w-0">
          {logoUrl && (
            <img
              src={logoUrl}
              alt="Logo"
              className="h-8 max-w-[110px] object-contain shrink-0"
            />
          )}
          <div className="border-l border-slate-300 pl-2.5 min-w-0">
            <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-900 leading-tight">
              Entegre Risk ve Güvenlik Denetim Raporu
            </div>
            <div className="text-[9.5px] font-medium text-slate-500 truncate">
              {facility ? facility.name : 'Tesis Belirtilmedi'}
            </div>
          </div>
        </div>

        <table className="border-collapse text-[9.5px] shrink-0">
          <tbody>
            <tr>
              <td className="px-2 py-0.5 bg-slate-100 border border-slate-300 font-semibold text-slate-600">
                Rapor No
              </td>
              <td className="px-2 py-0.5 border border-slate-300 font-bold text-slate-900">
                {auditMeta.reportNo || '—'}
              </td>
            </tr>
            <tr>
              <td className="px-2 py-0.5 bg-slate-100 border border-slate-300 font-semibold text-slate-600">
                Rapor Tarihi
              </td>
              <td className="px-2 py-0.5 border border-slate-300 font-medium text-slate-800">
                {formatTrDate(auditMeta.reportDate)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );

    return (
      <div
        ref={ref}
        className="bg-white print:bg-white text-slate-800 w-full max-w-[960px] mx-auto print:max-w-none print:mx-0 font-sans"
      >
        <style type="text/css" media="print">
          {`
            @page {
              size: A4 portrait;
              margin: 1.25cm;
              @bottom-right {
                content: counter(page) " / " counter(pages);
                font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
                font-size: 9pt;
                font-weight: 600;
                color: #64748b;
              }
            }
            @page :first {
              @bottom-right {
                content: none;
              }
            }
            html, body {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              background: #ffffff !important;
              margin: 0 !important;
              padding: 0 !important;
            }
            .page-break-after { page-break-after: always; break-after: page; }
            .page-break-before { page-break-before: always; break-before: page; }
            .avoid-break { page-break-inside: avoid; break-inside: avoid; }
            thead { display: table-header-group; }
            tr, img { page-break-inside: avoid; break-inside: avoid; }
          `}
        </style>

        {/* ============================================================
            KAPAK SAYFASI (MODERN KURUMSAL A4 KAPAK TASARIMI)
            ============================================================ */}
        <div className="page-break-after relative w-full min-h-[26.8cm] print:min-h-[26.8cm] bg-white flex flex-col justify-between overflow-hidden border border-slate-200 print:border-0">
          {/* Sol Dikey Kurumsal Şerit */}
          <div className="absolute inset-y-0 left-0 w-4 bg-slate-900" />
          <div className="absolute inset-y-0 left-4 w-1.5 bg-blue-600" />

          {/* Üst Alan: Logo + Kurumsal Etiket */}
          <div className="pl-14 pr-10 pt-12 flex items-start justify-between gap-6">
            <div>
              {logoUrl && (
                <img
                  src={logoUrl}
                  alt="MLPCARE HSE Logo"
                  className="h-16 max-w-[220px] object-contain"
                />
              )}
            </div>
            <div className="text-right">
              <div className="inline-block px-3 py-1 rounded bg-slate-900 text-white text-[10px] font-bold uppercase tracking-[0.18em]">
                GİZLİ • KURUMSAL DENETİM
              </div>
              <div className="mt-2 text-xs font-semibold text-slate-500">
                {auditMeta.reporter || 'MLPCARE HSE'}
              </div>
            </div>
          </div>

          {/* Orta Ana Başlık Bloğu */}
          <div className="pl-14 pr-10 my-auto py-10 space-y-6">
            <div className="space-y-2">
              <div className="w-16 h-1.5 bg-blue-600 rounded-full" />
              <p className="text-xs font-bold uppercase tracking-[0.25em] text-blue-700 pt-2">
                SAHA DEĞERLENDİRME &amp; RİSK YÖNETİMİ
              </p>
              <h1 className="text-4xl font-black uppercase tracking-tight text-slate-900 leading-[1.12]">
                Entegre Risk ve Güvenlik
                <br />
                Denetim Raporu
              </h1>
            </div>

            {/* Tesis Vurgu Kutusu */}
            <div className="border-l-4 border-slate-900 bg-slate-50 px-6 py-5 rounded-r-lg">
              <div className="text-[11px] font-bold uppercase tracking-widest text-slate-500">
                DENETLENEN TESİS / LOKASYON
              </div>
              <div className="text-2xl font-extrabold text-slate-900 mt-1">
                {facility ? facility.name : 'Tesis Seçilmedi'}
              </div>
              {auditMeta.purpose && (
                <p className="text-xs text-slate-600 mt-2 leading-relaxed line-clamp-3">
                  {auditMeta.purpose}
                </p>
              )}
            </div>

            {/* Hızlı Özet Metrik Şeridi */}
            <div className="grid grid-cols-4 gap-3 pt-2">
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="text-[10px] font-semibold uppercase text-slate-500">Rapor No</div>
                <div className="text-sm font-extrabold text-slate-900 mt-1 truncate">
                  {auditMeta.reportNo || '—'}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="text-[10px] font-semibold uppercase text-slate-500">Rapor Tarihi</div>
                <div className="text-sm font-extrabold text-slate-900 mt-1 tabular-nums">
                  {formatTrDate(auditMeta.reportDate)}
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="text-[10px] font-semibold uppercase text-slate-500">Toplam Bulgu</div>
                <div className="text-sm font-extrabold text-slate-900 mt-1 tabular-nums">
                  {totalFindings} Adet
                </div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-white p-3.5">
                <div className="text-[10px] font-semibold uppercase text-slate-500">Tamamlanma</div>
                <div className="text-sm font-extrabold text-emerald-700 mt-1 tabular-nums">
                  %{completionRate}
                </div>
              </div>
            </div>
          </div>

          {/* Alt Kurumsal Bilgi Şeridi */}
          <div className="pl-14 pr-10 pb-10 pt-6 border-t border-slate-200 bg-slate-50/70">
            <div className="grid grid-cols-3 gap-6 text-xs">
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Denetim Dönemi
                </div>
                <div className="font-semibold text-slate-800 mt-0.5 tabular-nums">
                  {formatTrDate(auditMeta.start)}
                  {auditMeta.end ? ` – ${formatTrDate(auditMeta.end)}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Raporlayan Birim
                </div>
                <div className="font-semibold text-slate-800 mt-0.5">
                  {auditMeta.reporter || 'MLPCARE | HSE Direktörlüğü'}
                </div>
              </div>
              <div className="text-right">
                <div className="font-black text-slate-900 tracking-widest text-xs">
                  MLPCARE | HSE
                </div>
                <div className="text-[9px] font-medium tracking-wider text-slate-500 uppercase mt-0.5">
                  Health Safety Environment Directorate
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================
            RAPOR GÖVDESİ (TEKRARLAYAN ÜST BAŞLIKLI ANA TABLO)
            ============================================================ */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <td>
                <RepeatingHeader />
              </td>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>
                {/* ============================================================
                    BÖLÜM 1: YÖNETİCİ ÖZETİ & KPI VERİ ÖZETİ
                    ============================================================ */}
                <div className="page-break-after w-full space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-xs font-extrabold tracking-wider">
                      BÖLÜM 1
                    </span>
                    <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                      Yönetici Özeti ve Veri Özeti
                    </h2>
                  </div>

                  {/* Yönetici Özeti Zengin Metin Alanı */}
                  <div className="rounded-lg border border-slate-200 bg-white p-4">
                    <div className="text-[11px] font-bold uppercase tracking-wider text-slate-500 mb-2">
                      Yönetici Özeti
                    </div>
                    <div
                      className={AUDIT_PRINT_RICH_CONTENT_CLASS}
                      dangerouslySetInnerHTML={{
                        __html: auditMeta.executiveSummary || '<p>Yönetici özeti girilmedi.</p>',
                      }}
                    />
                  </div>

                  {/* VERİ ÖZETİ & KPI BLOĞU (Kesilmeden / bölünmeden tek parça akar) */}
                  <div className="avoid-break rounded-lg border border-slate-400 overflow-hidden bg-white">
                    <div className="bg-slate-900 text-white px-4 py-2 flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Veri Özeti ve Performans Göstergeleri (KPI)
                      </span>
                      <span className="text-[11px] text-slate-300 tabular-nums">
                        Denetim: {formatTrDate(auditMeta.start)}
                      </span>
                    </div>

                    <div className="p-4 space-y-4">
                      {/* 4 KPI Kartı */}
                      <div className="grid grid-cols-4 gap-3">
                        <div className="rounded-md border border-slate-200 bg-slate-50 p-3">
                          <div className="text-[10px] font-semibold uppercase text-slate-500">
                            Toplam İzlenen
                          </div>
                          <div className="text-2xl font-black text-slate-900 tabular-nums mt-0.5">
                            {totalFindings}
                          </div>
                          <div className="text-[10px] text-slate-500 mt-0.5">
                            {carryOverFindings} devreden • {newFindings} yeni
                          </div>
                        </div>

                        <div className="rounded-md border border-blue-200 bg-blue-50/60 p-3">
                          <div className="text-[10px] font-semibold uppercase text-blue-700">
                            Bu Denetimde Açılan
                          </div>
                          <div className="text-2xl font-black text-blue-900 tabular-nums mt-0.5">
                            {newFindings}
                          </div>
                          <div className="text-[10px] text-blue-700/80 mt-0.5">
                            Yeni bulgu kaydı
                          </div>
                        </div>

                        <div className="rounded-md border border-emerald-200 bg-emerald-50/60 p-3">
                          <div className="text-[10px] font-semibold uppercase text-emerald-700">
                            Kapanan (Tamamlanan)
                          </div>
                          <div className="text-2xl font-black text-emerald-800 tabular-nums mt-0.5">
                            {closedFindings}
                          </div>
                          <div className="text-[10px] font-bold text-emerald-700 mt-0.5 tabular-nums">
                            Tamamlanma: %{completionRate}
                          </div>
                        </div>

                        <div className="rounded-md border border-red-200 bg-red-50/60 p-3">
                          <div className="text-[10px] font-semibold uppercase text-red-700">
                            Halen Açık
                          </div>
                          <div className="text-2xl font-black text-red-800 tabular-nums mt-0.5">
                            {openFindings}
                          </div>
                          <div className="text-[10px] font-bold text-red-700 mt-0.5 tabular-nums">
                            {criticalHighOpen} Kritik / Yüksek açık
                          </div>
                        </div>
                      </div>

                      {/* Risk Düzeyi Dağılımı + İyileştirme Durumu Donut Grafiği */}
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        {/* Sol: Risk Düzeyi Dağılımı */}
                        <div className="rounded-md border border-slate-200 p-3.5 space-y-2.5">
                          <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                            Risk Düzeyi Dağılımı
                          </div>
                          <div className="space-y-2">
                            {riskDistribution.map((r) => (
                              <div key={r.name} className="space-y-1">
                                <div className="flex items-center justify-between text-[11px]">
                                  <span className="flex items-center gap-1.5 font-semibold text-slate-700">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                      style={{ backgroundColor: r.color }}
                                    />
                                    {r.name}
                                  </span>
                                  <span className="font-bold tabular-nums text-slate-900">
                                    {r.value}{' '}
                                    <span className="text-slate-400 font-normal">(%{r.pct})</span>
                                  </span>
                                </div>
                                <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                                  <div
                                    className="h-full rounded-full"
                                    style={{
                                      width: `${r.pct}%`,
                                      backgroundColor: r.color,
                                    }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Sağ: İyileştirme Durumu Vektör SVG Donut + Lejant */}
                        <div className="rounded-md border border-slate-200 p-3.5 flex flex-col justify-between">
                          <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
                            İyileştirme Durumu Dağılımı
                          </div>
                          <div className="flex items-center gap-4 my-auto">
                            <PrintDonutChart
                              data={statusData}
                              centerValue={`%${completionRate}`}
                              centerLabel="TAMAMLANMA"
                            />
                            <div className="flex-1 space-y-1.5 text-[11px]">
                              {statusData.length === 0 ? (
                                <div className="text-slate-400">Bulgu bulunmuyor.</div>
                              ) : (
                                statusData.map((s) => {
                                  const pct =
                                    totalFindings > 0
                                      ? Math.round((s.value / totalFindings) * 100)
                                      : 0;
                                  return (
                                    <div
                                      key={s.name}
                                      className="flex items-center justify-between gap-2"
                                    >
                                      <span className="flex items-center gap-1.5 text-slate-700 truncate">
                                        <span
                                          className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                          style={{ backgroundColor: s.color }}
                                        />
                                        <span className="truncate">{s.name}</span>
                                      </span>
                                      <span className="font-bold tabular-nums text-slate-900 shrink-0">
                                        {s.value} (%{pct})
                                      </span>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Öne Çıkan Süreç / Kategori Özeti */}
                      {topCategories.length > 0 && (
                        <div className="rounded-md border border-slate-200 p-3 bg-slate-50/60">
                          <div className="text-[11px] font-bold text-slate-700 mb-2">
                            Süreç / Kategori Dağılımı (Öne Çıkanlar)
                          </div>
                          <div className="grid grid-cols-3 gap-2 text-[11px]">
                            {topCategories.map(([cat, count]) => (
                              <div
                                key={cat}
                                className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded px-2.5 py-1.5"
                              >
                                <span className="truncate font-medium text-slate-700">{cat}</span>
                                <span className="font-extrabold tabular-nums text-slate-900 shrink-0">
                                  {count}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* ============================================================
                    BÖLÜM 2: DENETİM HAKKINDA BİLGİLER
                    ============================================================ */}
                <div className="page-break-after w-full space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-xs font-extrabold tracking-wider">
                      BÖLÜM 2
                    </span>
                    <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                      Denetim Hakkında Bilgiler
                    </h2>
                  </div>

                  {/* Temel Denetim Bilgileri */}
                  <table className="w-full text-left text-xs border-collapse border border-slate-400">
                    <tbody>
                      <tr>
                        <td className="border border-slate-300 bg-slate-100 p-2.5 font-bold w-[24%]">
                          Lokasyon / Tesis
                        </td>
                        <td className="border border-slate-300 p-2.5 font-semibold text-slate-900">
                          {facility ? facility.name : 'Tesis Seçilmedi'}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 bg-slate-100 p-2.5 font-bold">
                          Denetim Tarihleri
                        </td>
                        <td className="border border-slate-300 p-2.5 tabular-nums">
                          Başlangıç: {formatTrDate(auditMeta.start)} &nbsp;/&nbsp; Bitiş:{' '}
                          {formatTrDate(auditMeta.end)}
                        </td>
                      </tr>
                      <tr>
                        <td className="border border-slate-300 bg-slate-100 p-2.5 font-bold">
                          Denetimin Amacı
                        </td>
                        <td className="border border-slate-300 p-2.5 text-justify leading-relaxed">
                          {auditMeta.purpose || 'Belirtilmedi'}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Değerlendirme Ekibi & Katılımcılar */}
                  <div className="grid grid-cols-1 gap-4">
                    <div className="avoid-break border border-slate-400">
                      <div className="bg-slate-100 font-bold text-xs p-2 border-b-2 border-slate-400 uppercase tracking-wide">
                        Değerlendirme Ekibi
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-300 p-2 w-1/3">Ad Soyad</th>
                            <th className="border border-slate-300 p-2 w-1/3">Departman</th>
                            <th className="border border-slate-300 p-2 w-1/3">Unvan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditMeta.team && auditMeta.team.filter(Boolean).length > 0 ? (
                            auditMeta.team.filter(Boolean).map((t: string, i: number) => {
                              const parts = t.split(/[,|]/).map((s) => s.trim());
                              return (
                                <tr key={i}>
                                  <td className="border border-slate-300 p-2 font-medium">
                                    {parts[0] || t}
                                  </td>
                                  <td className="border border-slate-300 p-2">{parts[1] || '—'}</td>
                                  <td className="border border-slate-300 p-2">{parts[2] || '—'}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="border border-slate-300 p-2.5 text-center text-slate-400"
                              >
                                Ekip bilgisi girilmedi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    <div className="avoid-break border border-slate-400">
                      <div className="bg-slate-100 font-bold text-xs p-2 border-b-2 border-slate-400 uppercase tracking-wide">
                        Tesis Katılımcıları
                      </div>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50">
                            <th className="border border-slate-300 p-2 w-1/3">Ad Soyad</th>
                            <th className="border border-slate-300 p-2 w-1/3">Departman</th>
                            <th className="border border-slate-300 p-2 w-1/3">Unvan</th>
                          </tr>
                        </thead>
                        <tbody>
                          {auditMeta.participants &&
                          auditMeta.participants.filter(Boolean).length > 0 ? (
                            auditMeta.participants.filter(Boolean).map((t: string, i: number) => {
                              const parts = t.split(/[,|]/).map((s) => s.trim());
                              return (
                                <tr key={i}>
                                  <td className="border border-slate-300 p-2 font-medium">
                                    {parts[0] || t}
                                  </td>
                                  <td className="border border-slate-300 p-2">{parts[1] || '—'}</td>
                                  <td className="border border-slate-300 p-2">{parts[2] || '—'}</td>
                                </tr>
                              );
                            })
                          ) : (
                            <tr>
                              <td
                                colSpan={3}
                                className="border border-slate-300 p-2.5 text-center text-slate-400"
                              >
                                Katılımcı bilgisi girilmedi.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Değerlendirme Yapılan Katlar ve Birimler (Özet — gereksiz mahal detayı olmadan) */}
                  <div className="avoid-break border border-slate-400">
                    <div className="bg-slate-100 font-bold text-xs p-2 border-b-2 border-slate-400 uppercase tracking-wide">
                      Değerlendirme Yapılan Katlar ve Birimler
                    </div>
                    <div className="p-3.5 space-y-3 text-xs">
                      {floorSummary.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Değerlendirilen Katlar (Üstten Alta)
                          </div>
                          <div className="flex flex-wrap gap-1.5">
                            {floorSummary.map((fl) => (
                              <span
                                key={fl.label}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded border border-slate-300 bg-slate-50 font-semibold text-slate-800"
                              >
                                <span>{fl.label}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-200 text-slate-700 tabular-nums">
                                  {fl.count}
                                </span>
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {unitSummary.length > 0 && (
                        <div className="pt-2 border-t border-slate-200">
                          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                            Değerlendirilen Birimler
                          </div>
                          <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                            {unitSummary.map(([unit, count]) => (
                              <div key={unit} className="flex items-center justify-between gap-2">
                                <span className="flex items-center gap-1.5 truncate">
                                  <span className="font-bold text-blue-700">✓</span>
                                  <span className="truncate font-medium text-slate-800">{unit}</span>
                                </span>
                                <span className="text-[10px] text-slate-500 tabular-nums shrink-0">
                                  ({count})
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {floorSummary.length === 0 && unitSummary.length === 0 && (
                        <div className="text-slate-400">Henüz bulgu veya lokasyon eklenmedi.</div>
                      )}
                    </div>
                  </div>

                  {/* Değerlendirme Kriterleri */}
                  {auditMeta.criteria && auditMeta.criteria.filter(Boolean).length > 0 && (
                    <div className="avoid-break border border-slate-400">
                      <div className="bg-slate-100 font-bold text-xs p-2 border-b-2 border-slate-400 uppercase tracking-wide">
                        Değerlendirme Sürecinde Dikkat Edilen Kriterler
                      </div>
                      <div className="p-3.5 text-xs space-y-1">
                        {auditMeta.criteria.filter(Boolean).map((c: string, i: number) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="font-bold text-slate-700">✓</span>
                            <span>{c}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* ============================================================
                    BÖLÜM 3: BULGULAR — GİRİŞ SAYFASI (SONRASINDA HER BULGU YENİ SAYFADA)
                    ============================================================ */}
                <div className="page-break-after w-full space-y-6">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-xs font-extrabold tracking-wider">
                      BÖLÜM 3
                    </span>
                    <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                      Bulgular
                    </h2>
                  </div>

                  <div className="rounded-lg border border-slate-300 bg-white p-6 space-y-4 text-[13.5px] leading-relaxed text-slate-800 text-justify">
                    <p>
                      Gerçekleştirilen Entegre Risk ve Güvenlik Denetimi kapsamında; tesisin yapısal,
                      mekanik, elektrik, yangın güvenliği, iş sağlığı ve güvenliği ile operasyonel
                      süreçleri ilgili mevzuat, teknik standartlar ve kurumsal prosedürler çerçevesinde
                      detaylı olarak incelenmiştir. Denetim sürecinde gerçekleştirilen saha gözlemleri
                      ve doküman incelemeleri sonucunda mevcut durum değerlendirilmiş; iyileştirme
                      gerektiren hususlar tespit edilmiştir. Bu bölümde, denetim kapsamında elde edilen
                      somut bulgular sistematik bir şekilde sunulmakta olup, her bir bulguya ilişkin
                      risk düzeyi ve önerilen aksiyonlar ayrıca belirtilmektedir.
                    </p>
                    <p className="font-semibold text-slate-900">
                      Denetim sürecinde ortaya konulan bulgular aşağıda sunulmuştur.
                    </p>
                  </div>

                  {/* Özet Risk & Sıralama Bilgilendirme Kutusu */}
                  <div className="avoid-break rounded-lg border border-slate-300 bg-slate-50/70 p-4 space-y-3">
                    <div className="flex items-center justify-between text-xs border-b border-slate-300 pb-2">
                      <span className="font-bold uppercase tracking-wider text-slate-700">
                        Bulgu Sunum Düzeni ve Risk Skalası
                      </span>
                      <span className="font-semibold text-slate-600 tabular-nums">
                        Toplam {sortedFindings.length} Bulgu
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-relaxed">
                      Bulgular binanın en üst katından aşağıya doğru ve her kat içinde yüksek riskten
                      düşük riske göre sıralanmış olup her bir bulgu müstakil bir sayfada yer almaktadır.
                    </p>
                    <div className="grid grid-cols-5 gap-2 pt-1">
                      {riskDistribution.map((r) => (
                        <div
                          key={r.name}
                          className="rounded border border-slate-300 bg-white p-2 text-center"
                        >
                          <div className="flex items-center justify-center gap-1.5 text-[11px] font-bold text-slate-800">
                            <span
                              className="w-2.5 h-2.5 rounded-full shrink-0"
                              style={{ backgroundColor: r.color }}
                            />
                            {r.name}
                          </div>
                          <div className="text-sm font-extrabold text-slate-900 tabular-nums mt-0.5">
                            {r.value}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ============================================================
                    BÖLÜM 3: BULGULAR (HER BULGU 1 TAM SAYFA + KOŞULLU 2. SAYFA İYİLEŞTİRME)
                    ============================================================ */}
                {sortedFindings.map((finding, idx) => {
                  const floorInfo = getFloorInfo(finding);
                  const normRisk = normalizeRiskLevel(finding.risk);
                  const imageFiles = (finding.files || []).filter(
                    (f) => !f.type || f.type.startsWith('image/')
                  );
                  const responsibleDepts = Array.from(
                    new Set([
                      ...(finding.departments || []),
                      ...(finding.steps?.map((s) => s.department).filter(Boolean) || []),
                    ])
                  );
                  const improvementDesc = (finding as any).improvementDesc as string | undefined;
                  const hasImprovementPage = Boolean(
                    (finding.steps && finding.steps.length > 0) ||
                      (improvementDesc && improvementDesc.trim().length > 0)
                  );
                  const stepEvidencePhotos = (finding.steps || []).flatMap((s, sIdx) =>
                    (s.files || [])
                      .filter((sf) => !sf.type || sf.type.startsWith('image/'))
                      .map((sf) => ({ ...sf, stepNo: sIdx + 1, dept: s.department }))
                  );

                  const dayanakText =
                    ((finding as any).dayanak as string | undefined)?.trim() ||
                    ((finding as any).basis as string | undefined)?.trim() ||
                    finding.riskReasoning?.trim() ||
                    '—';
                  const visiblePhotos = imageFiles.slice(0, 3);

                  return (
                    <React.Fragment key={finding.id}>
                      {/* BULGU SAYFA 1: TAM 1 A4 SAYFA — KESİN CM ÖLÇÜLÜ TABLO */}
                      <div className="page-break-after w-full">
                        <table
                          className="w-full border-collapse border border-slate-400 bg-white text-[11px] leading-snug"
                          style={{ tableLayout: 'fixed' }}
                        >
                          <colgroup>
                            <col style={{ width: '13%' }} />
                            <col style={{ width: '20%' }} />
                            <col style={{ width: '12%' }} />
                            <col style={{ width: '28%' }} />
                            <col style={{ width: '13%' }} />
                            <col style={{ width: '14%' }} />
                          </colgroup>
                          <tbody>
                            {/* 1. SATIR: 1.1cm — 6 Sütun (Tespit No | No | Yer/Konum | Veri | Risk Düzeyi | Değer & Renk) */}
                            <tr style={{ height: '1.1cm' }} className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100 border-r border-slate-300 align-middle text-slate-800">
                                Tespit No:
                              </td>
                              <td className="px-2 py-1 font-extrabold text-slate-900 border-r border-slate-300 align-middle text-center tabular-nums">
                                {finding.no || `#${idx + 1}`}
                              </td>
                              <td className="px-2 py-1 font-bold bg-slate-100 border-r border-slate-300 align-middle text-slate-800">
                                Yer/Konum:
                              </td>
                              <td className="px-2 py-1 font-semibold text-slate-900 border-r border-slate-300 align-middle">
                                {finding.area || floorInfo.label}
                                {finding.subarea ? ` — ${finding.subarea}` : ''}
                              </td>
                              <td className="px-2 py-1 font-bold bg-slate-100 border-r border-slate-300 align-middle text-slate-800">
                                Risk Düzeyi:
                              </td>
                              <td
                                className={`px-2 py-1 font-extrabold text-center uppercase tracking-wide align-middle ${getRiskSolidClass(
                                  finding.risk
                                )}`}
                              >
                                {normRisk}
                              </td>
                            </tr>

                            {/* 2. SATIR: 1.1cm — 4 Sütun (İlgili Süreç | Kategori | İlgili Birim sola kaydırılmış | Geniş Departman Alanı) */}
                            <tr style={{ height: '1.1cm' }} className="border-b border-slate-300">
                              <td className="px-2 py-1 font-bold bg-slate-100 border-r border-slate-300 align-middle text-slate-800">
                                İlgili Süreç:
                              </td>
                              <td className="px-2 py-1 font-medium text-slate-900 border-r border-slate-300 align-middle">
                                {finding.category || '—'}
                              </td>
                              <td className="px-2 py-1 font-bold bg-slate-100 border-r border-slate-300 align-middle text-slate-800">
                                İlgili Birim:
                              </td>
                              <td
                                colSpan={3}
                                className="px-2 py-1 font-semibold text-slate-900 align-middle text-[10.5px] leading-tight"
                              >
                                {responsibleDepts.join(', ') || 'Atanmadı'}
                              </td>
                            </tr>

                            {/* 3. SATIR: 0.1cm — Ara Bölme Satırı (Zemin rengiyle aynı) */}
                            <tr style={{ height: '0.1cm' }}>
                              <td
                                colSpan={6}
                                className="p-0 bg-white border-y border-slate-300"
                                style={{ height: '0.1cm', lineHeight: '0.1cm', fontSize: '1px' }}
                              >
                                &nbsp;
                              </td>
                            </tr>

                            {/* 4. SATIR: 0.8cm — Tespit Detayları Başlık Bandı */}
                            <tr style={{ height: '0.8cm' }} className="border-b border-slate-400 bg-slate-200">
                              <td
                                colSpan={6}
                                className="px-3 py-1 font-extrabold text-center uppercase tracking-wider text-slate-900 align-middle text-[11.5px]"
                              >
                                Tespit Detayları
                              </td>
                            </tr>

                            {/* 5. SATIR: 4.0cm — 2 Sütun (Tespit: | Değeri) */}
                            <tr style={{ height: '4cm' }} className="border-b border-slate-300">
                              <td className="px-2.5 py-2 font-extrabold bg-slate-50 border-r border-slate-300 align-middle text-center text-slate-800">
                                Tespit:
                              </td>
                              <td
                                colSpan={5}
                                className="px-3 py-2 align-middle text-justify leading-relaxed whitespace-pre-wrap text-slate-900 overflow-hidden"
                              >
                                {finding.findingDesc || '—'}
                              </td>
                            </tr>

                            {/* 6. SATIR: 1.2cm — 2 Sütun (Dayanak: | İçeriği) */}
                            <tr style={{ height: '1.2cm' }} className="border-b border-slate-300">
                              <td className="px-2.5 py-1 font-extrabold bg-slate-50 border-r border-slate-300 align-middle text-center text-slate-800">
                                Dayanak:
                              </td>
                              <td
                                colSpan={5}
                                className="px-3 py-1 align-middle leading-snug whitespace-pre-wrap text-slate-800"
                              >
                                {dayanakText}
                              </td>
                            </tr>

                            {/* 7. SATIR: 4.8cm — 2 Sütun (Risk: | Değeri) */}
                            <tr style={{ height: '4.8cm' }} className="border-b border-slate-300">
                              <td className="px-2.5 py-2 font-extrabold bg-slate-50 border-r border-slate-300 align-middle text-center text-slate-800">
                                Risk:
                              </td>
                              <td
                                colSpan={5}
                                className="px-3 py-2 align-middle text-justify leading-relaxed whitespace-pre-wrap text-slate-900 overflow-hidden"
                              >
                                {finding.riskDesc || '—'}
                              </td>
                            </tr>

                            {/* 8. SATIR: 4.8cm — 2 Sütun (Öneri: | Değeri) */}
                            <tr style={{ height: '4.8cm' }} className="border-b border-slate-300">
                              <td className="px-2.5 py-2 font-extrabold bg-slate-50 border-r border-slate-300 align-middle text-center text-slate-800">
                                Öneri:
                              </td>
                              <td
                                colSpan={5}
                                className="px-3 py-2 align-middle text-justify leading-relaxed whitespace-pre-wrap text-slate-900 overflow-hidden"
                              >
                                {finding.recommendation || '—'}
                              </td>
                            </tr>

                            {/* 9. SATIR: 0.1cm — Ara Boşluk (Zemin rengiyle aynı) */}
                            <tr style={{ height: '0.1cm' }}>
                              <td
                                colSpan={6}
                                className="p-0 bg-white border-y border-slate-300"
                                style={{ height: '0.1cm', lineHeight: '0.1cm', fontSize: '1px' }}
                              >
                                &nbsp;
                              </td>
                            </tr>

                            {/* 10. SATIR: 0.8cm — Ek (Fotoğraf, Doküman v.b.) */}
                            <tr style={{ height: '0.8cm' }} className="border-b border-slate-400 bg-slate-200">
                              <td
                                colSpan={6}
                                className="px-3 py-1 font-extrabold text-center uppercase tracking-wider text-slate-900 align-middle text-[11.5px]"
                              >
                                Ek (Fotoğraf, Doküman v.b.)
                              </td>
                            </tr>

                            {/* 11. SATIR: 6.0cm — Fotoğraf Alanı (1, 2 veya 3 görsel orantılı; maks. yükseklik 5.8cm) */}
                            <tr style={{ height: '6cm' }}>
                              <td colSpan={6} className="p-1 align-middle text-center">
                                {visiblePhotos.length === 0 ? (
                                  <div className="text-xs text-slate-400 italic">
                                    Bu bulguya ait fotoğraf eklenmemiştir.
                                  </div>
                                ) : (
                                  <div
                                    className="w-full flex items-center justify-center gap-2"
                                    style={{ height: '5.8cm' }}
                                  >
                                    {visiblePhotos.map((img, i) => (
                                      <div
                                        key={i}
                                        className="flex items-center justify-center overflow-hidden"
                                        style={{
                                          flex: '1 1 0%',
                                          height: '5.8cm',
                                          maxWidth:
                                            visiblePhotos.length === 1
                                              ? '100%'
                                              : visiblePhotos.length === 2
                                                ? '49%'
                                                : '32.5%',
                                        }}
                                      >
                                        <img
                                          src={img.url}
                                          alt={img.name || `Bulgu fotoğrafı ${i + 1}`}
                                          className="rounded border border-slate-300 object-contain"
                                          style={{
                                            maxHeight: '5.8cm',
                                            maxWidth: '100%',
                                            width: 'auto',
                                            height: 'auto',
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* BULGU SAYFA 2: KOŞULLU İYİLEŞTİRME SÜREÇ YÖNETİMİ (YALNIZCA GİRİLMİŞSE) */}
                      {hasImprovementPage && (
                        <div className="page-break-after w-full min-h-[24.8cm] print:min-h-[24.8cm] flex flex-col">
                          <div className="flex items-center justify-between border-b border-slate-300 pb-2 mb-3">
                            <div className="flex items-center gap-2.5">
                              <span className="px-2.5 py-0.5 rounded bg-blue-700 text-white text-[11px] font-extrabold tracking-wider">
                                İYİLEŞTİRME SÜREÇ YÖNETİMİ
                              </span>
                              <span className="text-sm font-extrabold text-slate-900">
                                {finding.no || `Bulgu #${idx + 1}`} — Takip ve Aksiyon Kayıtları
                              </span>
                            </div>
                            <span
                              className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${getRiskSolidClass(
                                finding.risk
                              )}`}
                            >
                              {normRisk}
                            </span>
                          </div>

                          <div className="flex-1 flex flex-col border border-slate-400 bg-white">
                            {/* İlgili Bulgu Referans Özet Barı */}
                            <table className="w-full text-xs border-collapse border-b-2 border-slate-400">
                              <tbody>
                                <tr>
                                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-300 w-[15%]">
                                    İlgili Tespit No
                                  </td>
                                  <td className="p-2 font-extrabold border-r border-slate-300 w-[18%]">
                                    {finding.no || `#${idx + 1}`}
                                  </td>
                                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-300 w-[14%]">
                                    Kat / Konum
                                  </td>
                                  <td className="p-2 font-medium border-r border-slate-300 w-[33%]">
                                    {finding.area || floorInfo.label}
                                    {finding.subarea ? ` — ${finding.subarea}` : ''}
                                  </td>
                                  <td className="p-2 bg-slate-100 font-bold border-r border-slate-300 w-[10%]">
                                    Durum
                                  </td>
                                  <td className="p-2 font-bold text-center text-slate-900 w-[10%]">
                                    {finding.status}
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            {/* İyileştirme Durumu Özeti (varsa) */}
                            {improvementDesc && improvementDesc.trim() && (
                              <div className="border-b-2 border-slate-400 p-3.5 bg-slate-50/60">
                                <div className="text-[11px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                                  İyileştirme Durumu Değerlendirmesi
                                </div>
                                <p className="text-xs leading-relaxed text-slate-800 whitespace-pre-wrap">
                                  {improvementDesc}
                                </p>
                              </div>
                            )}

                            {/* Aksiyon ve Süreç Yönetimi Tablosu */}
                            <div className="bg-slate-200/80 border-b-2 border-slate-400 px-3 py-1.5 text-center text-xs font-extrabold uppercase tracking-wider text-slate-900">
                              Aksiyon Adımları ve Süreç Yönetimi
                            </div>

                            <table className="w-full text-xs border-collapse">
                              <thead>
                                <tr className="bg-slate-100 border-b-2 border-slate-400">
                                  <th className="p-2 border-r border-slate-300 w-[7%] text-center">
                                    Adım
                                  </th>
                                  <th className="p-2 border-r border-slate-300 w-[14%] text-center">
                                    İşlem Tarihi
                                  </th>
                                  <th className="p-2 border-r border-slate-300 w-[20%] text-left">
                                    Sorumlu Birim
                                  </th>
                                  <th className="p-2 border-r border-slate-300 w-[45%] text-left">
                                    Aksiyon Açıklaması
                                  </th>
                                  <th className="p-2 w-[14%] text-center">Durum</th>
                                </tr>
                              </thead>
                              <tbody>
                                {finding.steps && finding.steps.length > 0 ? (
                                  finding.steps.map((s, si) => (
                                    <tr key={s.id || si} className="border-b border-slate-300">
                                      <td className="p-2 border-r border-slate-300 text-center font-bold tabular-nums">
                                        {si + 1}
                                      </td>
                                      <td className="p-2 border-r border-slate-300 text-center tabular-nums">
                                        {formatTrDate(s.actionDate)}
                                      </td>
                                      <td className="p-2 border-r border-slate-300 font-semibold text-slate-900">
                                        {s.department || '—'}
                                      </td>
                                      <td className="p-2 border-r border-slate-300 leading-relaxed whitespace-pre-wrap">
                                        {s.title ? (
                                          <div className="font-bold text-slate-900 mb-0.5">
                                            {s.title}
                                          </div>
                                        ) : null}
                                        <div>{s.explanation || '—'}</div>
                                      </td>
                                      <td className="p-2 text-center font-bold text-[11px]">
                                        {s.status}
                                      </td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="p-4 text-center text-slate-400 italic"
                                    >
                                      Aksiyon adımı kaydı bulunmamaktadır.
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {/* Aksiyon Kanıt Görselleri (varsa) */}
                            {stepEvidencePhotos.length > 0 && (
                              <div className="mt-auto border-t-2 border-slate-400">
                                <div className="bg-slate-200/80 border-b border-slate-300 px-3 py-1.5 text-center text-xs font-extrabold uppercase tracking-wider text-slate-900">
                                  İyileştirme Kanıt Görselleri
                                </div>
                                <div className="p-3.5 grid grid-cols-2 gap-3">
                                  {stepEvidencePhotos.slice(0, 4).map((photo, pi) => (
                                    <div
                                      key={pi}
                                      className="border border-slate-300 rounded p-2 bg-slate-50/50 space-y-1 text-center"
                                    >
                                      <img
                                        src={photo.url}
                                        alt={photo.name || `Kanıt ${pi + 1}`}
                                        className="max-h-[55mm] max-w-full object-contain mx-auto rounded"
                                      />
                                      <div className="text-[10px] font-medium text-slate-600 truncate">
                                        Adım {photo.stepNo} • {photo.dept}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}

                {/* ============================================================
                    BÖLÜM 4: GENEL DEĞERLENDİRME VE SONUÇ
                    ============================================================ */}
                <div className="w-full space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                    <span className="px-2.5 py-0.5 rounded bg-slate-900 text-white text-xs font-extrabold tracking-wider">
                      BÖLÜM 4
                    </span>
                    <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                      Genel Değerlendirme ve Sonuç
                    </h2>
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-white p-5">
                    <div
                      className={AUDIT_PRINT_RICH_CONTENT_CLASS}
                      dangerouslySetInnerHTML={{
                        __html:
                          auditMeta.generalConclusion ||
                          '<p>Genel değerlendirme ve sonuç girilmedi.</p>',
                      }}
                    />
                  </div>

                  {/* Kurumsal Kapanış / Rapor İmza Şeridi */}
                  <div className="avoid-break mt-8 pt-4 border-t-2 border-slate-400 flex items-center justify-between text-xs text-slate-600">
                    <div>
                      <div className="font-bold text-slate-900">
                        {auditMeta.reporter || 'MLPCARE | HSE Direktörlüğü'}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        Entegre Risk ve Güvenlik Denetim Raporu — {auditMeta.reportNo || '—'}
                      </div>
                    </div>
                    <div className="text-right tabular-nums">
                      <div className="font-bold text-slate-900">
                        Rapor Tarihi: {formatTrDate(auditMeta.reportDate)}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {facility ? facility.name : ''}
                      </div>
                    </div>
                  </div>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }
);

ReportTemplate.displayName = 'ReportTemplate';
export default ReportTemplate;
