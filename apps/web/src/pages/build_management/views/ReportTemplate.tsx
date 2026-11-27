import React, { forwardRef } from 'react';
import {
  type Audit,
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
  facilityAudits?: Audit[];
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
  const size = 112;
  const strokeWidth = 16;
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
        style={{ fontSize: '18px' }}
      >
        {centerValue}
      </text>
      <text
        x="50%"
        y="64%"
        textAnchor="middle"
        dominantBaseline="central"
        className="fill-slate-500 font-semibold"
        style={{ fontSize: '7.5px', letterSpacing: '0.06em' }}
      >
        {centerLabel}
      </text>
    </svg>
  );
}

const ReportTemplate = forwardRef<HTMLDivElement, ReportTemplateProps>(
  ({ auditMeta, findings, facility, facilityAudits = [], logoUrl }, ref) => {
    const sortByFloorAndRisk = (list: Finding[]) =>
      [...list].sort((a, b) => {
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

    const isCarryoverFinding = (f: Finding) =>
      Boolean(f.isCarryover || (f.history && f.history.includes('Devreden Bulgu')));

    const hasRealActionSteps = (f: Finding) =>
      Boolean(
        (f.steps && f.steps.some((s) => s.stepType !== 'YERINDE_KONTROL_YOK')) ||
        (f.progress || 0) > 0
      );

    const getRepeatAndAge = (f: Finding) => {
      const key = (f.rootFindingId || f.no || f.id).trim();
      const pastCount = facilityAudits.filter(
        (a) =>
          a.meta?.reportNo !== auditMeta.reportNo &&
          a.findings?.some((pf) => (pf.rootFindingId || pf.no || pf.id).trim() === key)
      ).length;
      const repeatCount = Math.max(isCarryoverFinding(f) ? 2 : 1, pastCount + 1);
      const originStr = f.originReportDate || '';
      const curStr = auditMeta.reportDate || auditMeta.start || '';
      const openDays =
        originStr && curStr
          ? Math.max(
            0,
            Math.floor(
              (new Date(curStr).getTime() - new Date(originStr).getTime()) /
              (1000 * 60 * 60 * 24)
            )
          )
          : 0;
      const isChronic =
        f.status !== 'Tamamlanan' && (repeatCount >= 3 || openDays >= 180);
      return { repeatCount, openDays, isChronic };
    };

    // 4 Ana Grup Sıralaması: Yeni -> Devreden (Aksiyon Alınmamış) -> Devreden (Devam Eden) -> Tamamlanan
    const groupNew = sortByFloorAndRisk(
      findings.filter((f) => !isCarryoverFinding(f) && f.status !== 'Tamamlanan')
    );
    const groupCarryNoAction = sortByFloorAndRisk(
      findings.filter(
        (f) =>
          isCarryoverFinding(f) &&
          f.status !== 'Tamamlanan' &&
          !hasRealActionSteps(f)
      )
    );
    const groupCarryInProgress = sortByFloorAndRisk(
      findings.filter(
        (f) =>
          isCarryoverFinding(f) &&
          f.status !== 'Tamamlanan' &&
          hasRealActionSteps(f)
      )
    );
    const groupCompleted = sortByFloorAndRisk(
      findings.filter((f) => f.status === 'Tamamlanan')
    );

    const rawFindingGroups = [
      {
        key: 'NEW',
        title: 'Yeni Tespit Edilen Bulgular',
        badgeColor: 'bg-[#415463] text-white',
        items: groupNew,
      },
      {
        key: 'CARRY_NO_ACTION',
        title: 'Önceki Denetimden Devreden — Aksiyon Alınmamış Bulgular',
        badgeColor: 'bg-red-700 text-white',
        items: groupCarryNoAction,
      },
      {
        key: 'CARRY_IN_PROGRESS',
        title: 'Önceki Denetimden Devreden — İyileştirme Süreci Devam Eden Bulgular',
        badgeColor: 'bg-[#ed7d31] text-white',
        items: groupCarryInProgress,
      },
      {
        key: 'COMPLETED',
        title: 'Bu Dönemde Tamamlanan Bulgular',
        badgeColor: 'bg-emerald-700 text-white',
        items: groupCompleted,
      },
    ].filter((g) => g.items.length > 0);

    const findingGroups = rawFindingGroups.map((g, idx) => ({
      ...g,
      code: `3.${idx + 1}`,
    }));

    const sortedFindings = findingGroups.flatMap((g) => g.items);

    // 2. KPI & Veri Özeti Hesaplamaları
    const totalFindings = findings.length;
    const newFindings = groupNew.length;
    const carryOverFindings = totalFindings - newFindings;
    const closedFindings = groupCompleted.length;
    const partialFindings = findings.filter(
      (f) => f.status !== 'Tamamlanan' && hasRealActionSteps(f)
    ).length;
    const unimprovedFindings = groupCarryNoAction.length;
    const chronicFindingsCount = findings.filter((f) => {
      if (f.status === 'Tamamlanan' || !isCarryoverFinding(f)) return false;
      return getRepeatAndAge(f).isChronic;
    }).length;
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

    // İçindekiler ve sayfa numarası hesabı:
    // 1: Ön Kapak, 2: İçindekiler, 3: Bölüm 1, 4: Bölüm 2, 5: Bölüm 3 Giriş, 6..N: Bulgular, N+1: Bölüm 4, N+2: EK-1 İndeks
    const countFindingPages = (f: Finding) => {
      const impDesc = (f as any).improvementDesc as string | undefined;
      const hasImp = Boolean((f.steps && f.steps.length > 0) || (impDesc && impDesc.trim().length > 0));
      return 1 + (hasImp ? 1 : 0);
    };

    let runningPage = 6;
    const groupTocEntries = findingGroups.map((g) => {
      const startPage = runningPage;
      const pagesInGroup = g.items.reduce((sum, f) => sum + countFindingPages(f), 0);
      runningPage += pagesInGroup;
      return {
        label: `${g.code}: ${g.title.toUpperCase()} (${g.items.length})`,
        page: startPage,
        isSub: true,
      };
    });

    const section4Page = runningPage;
    const appendix1Page = section4Page + 1;

    const tocItems: { label: string; page: number; isSub?: boolean }[] = [
      { label: 'BÖLÜM 1: YÖNETİCİ ÖZETİ', page: 3 },
      { label: 'BÖLÜM 2: DENETİM HAKKINDA BİLGİLER', page: 4 },
      { label: 'BÖLÜM 3: BULGULAR', page: 5 },
      ...(findingGroups.length > 1 ? groupTocEntries : []),
      { label: 'BÖLÜM 4: GENEL DEĞERLENDİRME VE SONUÇ', page: section4Page },
      { label: 'EK-1: KÜMÜLATİF DENETİM VE BULGU İZLEME İNDEKSİ', page: appendix1Page },
    ];

    // EK-1 Kümülatif Denetim İzleme İndeksi: Tesisin geçmiş tüm PUBLISHED raporları + bu raporun bulguları
    // Kök bulgu kimliğine (rootFindingId || no) göre birleştirilerek denetim zincirinin kırılmaması sağlanır.
    const cumulativeIndexRows = (() => {
      const chronologicalAudits = [...facilityAudits]
        .filter((a) => a.meta?.reportNo !== auditMeta.reportNo)
        .sort((a, b) => {
          const dA = new Date(a.meta?.reportDate || a.meta?.start || 0).getTime();
          const dB = new Date(b.meta?.reportDate || b.meta?.start || 0).getTime();
          return dA - dB;
        });

      interface LedgerRow {
        key: string;
        no: string;
        originReportNo: string;
        originReportDate: string;
        location: string;
        category: string;
        summary: string;
        risk: string;
        statusLabel: string;
        isClosed: boolean;
        progress: number;
        closedReportNo: string;
        closedDate: string;
        seenCount: number;
        openDays: number;
      }

      const ledger = new Map<string, LedgerRow>();

      const ingestFinding = (f: Finding, repNo?: string, repDate?: string, isCurrentReport = false) => {
        const key = (f.rootFindingId || f.no || f.id).trim();
        const prev = ledger.get(key);
        const floorInfo = getFloorInfo(f);
        const unit = getUnitLabel(f);
        const locLabel = unit && unit !== floorInfo.label ? `${floorInfo.label} • ${unit}` : (f.area || floorInfo.label);
        const isClosed = f.status === 'Tamamlanan';
        const lastCompletedStep = [...(f.steps || [])]
          .reverse()
          .find((s) => s.status === 'Tamamlandı');
        const resolvedClosedDate =
          f.closedAt || lastCompletedStep?.completedAt || lastCompletedStep?.actionDate || (isClosed ? repDate || '' : '');
        const resolvedClosedRep =
          f.closedInReportNo || (isClosed ? repNo || prev?.closedReportNo || '' : '');

        let statusLabel = 'Yeni Tespit';
        if (isClosed) {
          statusLabel = 'Tamamlandı';
        } else if (hasRealActionSteps(f)) {
          statusLabel = `Devam Ediyor (%${f.progress || 25})`;
        } else if (isCarryoverFinding(f) || prev) {
          statusLabel = 'Aksiyon Alınmadı';
        } else if (!isCurrentReport) {
          statusLabel = 'Açık (Önceki Tur)';
        }

        const originRep = prev?.originReportNo || f.originReportNo || repNo || '—';
        const originDt = prev?.originReportDate || f.originReportDate || repDate || '';
        const seenCount = (prev?.seenCount || 0) + 1;
        const refEndDate = isClosed
          ? resolvedClosedDate || repDate || ''
          : auditMeta.reportDate || auditMeta.start || repDate || '';
        const openDays =
          originDt && refEndDate
            ? Math.max(
              0,
              Math.floor(
                (new Date(refEndDate).getTime() - new Date(originDt).getTime()) /
                (1000 * 60 * 60 * 24)
              )
            )
            : 0;

        ledger.set(key, {
          key,
          no: prev?.no || f.no || '—',
          originReportNo: originRep,
          originReportDate: originDt,
          location: locLabel,
          category: f.category || prev?.category || '—',
          summary: (f.findingDesc || prev?.summary || '').slice(0, 95),
          risk: normalizeRiskLevel(f.risk),
          statusLabel,
          isClosed,
          progress: isClosed ? 100 : f.progress || 0,
          closedReportNo: isClosed ? (prev?.closedReportNo || resolvedClosedRep || '—') : '—',
          closedDate: isClosed ? (prev?.closedDate || resolvedClosedDate || '') : '',
          seenCount,
          openDays,
        });
      };

      chronologicalAudits.forEach((a) => {
        (a.findings || []).forEach((f) =>
          ingestFinding(f, a.meta?.reportNo, a.meta?.reportDate, false)
        );
      });

      findings.forEach((f) =>
        ingestFinding(f, auditMeta.reportNo, auditMeta.reportDate, true)
      );

      return Array.from(ledger.values()).sort((a, b) =>
        a.no.localeCompare(b.no, 'tr-TR', { numeric: true })
      );
    })();

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
              margin: 0;
              @bottom-right {
                content: none;
              }
            }
            @page cover-page {
              size: A4 portrait;
              margin: 0;
              @bottom-right {
                content: none;
              }
            }
            .cover-named-page {
              page: cover-page;
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
            KAPAK SAYFASI (MLPCARE KURUMSAL A4 FULL-BLEED KAPAK)
            ============================================================ */}
        <div className="page-break-after relative w-full min-h-[29.7cm] print:h-[29.7cm] bg-white flex flex-col justify-between overflow-hidden border border-slate-200 print:border-0">
          {/* Üst Koyu Hero Alanı (#415463) */}
          <div className="relative bg-[#415463] text-white px-12 pt-11 pb-12 flex flex-col justify-between min-h-[16.4cm] overflow-hidden">
            {/* Arka Plan Geometrik Vektör Desen (Daireler + Sağlık/Güvenlik Artısı + Turuncu Kare) */}
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none select-none"
              viewBox="0 0 800 560"
              preserveAspectRatio="xMaxYMin slice"
              aria-hidden="true"
            >
              {/* İç içe ince daireler */}
              <circle cx="640" cy="145" r="145" fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="1" />
              <circle cx="640" cy="145" r="220" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              <circle cx="640" cy="145" r="295" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              {/* İnce yatay çizgi */}
              <line x1="0" y1="205" x2="800" y2="205" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
              {/* Beyaz çizgili sağlık / güvenlik artı sembolü */}
              <path
                d="M610 85 H670 V115 H700 V175 H670 V205 H610 V175 H580 V115 H610 Z"
                fill="none"
                stroke="rgba(255,255,255,0.72)"
                strokeWidth="1.6"
              />
              {/* Artı sağ alt köşesinde kurumsal turuncu kare (#ed7d31) */}
              <rect x="698" y="173" width="14" height="14" fill="#ed7d31" />
            </svg>

            {/* Üst Satır: MLPCARE Logo + Sağ Gizlilik Rozeti */}
            <div className="relative z-10 flex items-start justify-between gap-6">
              <div>
                {logoUrl ? (
                  <img
                    src={logoUrl}
                    alt="MLPCARE HSE Logo"
                    className="h-16 max-w-[260px] object-contain"
                  />
                ) : (
                  <div>
                    <div className="text-[28px] leading-none tracking-tight text-white">
                      <span className="font-extrabold">MLP</span>
                      <span className="font-light tracking-normal">CARE</span>
                    </div>
                    <div className="mt-1.5 text-[10px] tracking-[0.14em] text-white/75 font-medium">
                      MEDICAL PARK <span className="mx-1 text-white/40">|</span> <span className="italic">Liv Hospital</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="text-right">
                <div className="inline-block bg-[#ed7d31] text-[#1e293b] px-4 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.16em]">
                  GİZLİ • KURUMSAL DENETİM
                </div>
                <div className="mt-2 pt-1.5 border-t border-white/25 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/85">
                  MLPCARE HSE
                </div>
              </div>
            </div>

            {/* Ana Başlık Bloğu */}
            <div className="relative z-10 mt-auto pt-14 space-y-4">
              <div className="w-16 h-1 bg-[#ed7d31]" />
              <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-white/80">
                SAHA DEĞERLENDİRME &amp; RİSK YÖNETİMİ
              </p>
              <h1 className="text-[42px] font-black uppercase tracking-tight text-white leading-[1.08]">
                ENTEGRE RİSK
                <br />
                VE GÜVENLİK
                <br />
                DENETİM RAPORU
              </h1>
            </div>
          </div>

          {/* Orta Beyaz Alan: Tesis Adı + 3 Sütunlu Özet Şeridi */}
          <div className="flex-1 bg-white px-12 py-10 flex flex-col justify-center gap-10">
            {/* Tesis Vurgu Bloğu */}
            <div className="border-l-[5px] border-[#ed7d31] pl-5 py-1">
              <div className="text-[10.5px] font-bold uppercase tracking-[0.18em] text-slate-400">
                DENETLENEN TESİS / LOKASYON
              </div>
              <div className="text-[30px] font-extrabold tracking-tight text-[#1e293b] mt-1.5 leading-tight">
                {facility ? facility.name : 'Tesis Seçilmedi'}
              </div>
            </div>

            {/* 3 Sütunlu Bilgi Şeridi (Rapor No / Rapor Tarihi / Toplam Bulgu) */}
            <div className="border-t-2 border-[#415463] border-b border-slate-200 grid grid-cols-3 divide-x divide-slate-200">
              <div className="py-5 pr-5">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  RAPOR NO
                </div>
                <div className="text-[17px] font-extrabold text-[#1e293b] mt-1.5 truncate">
                  {auditMeta.reportNo || '—'}
                </div>
              </div>
              <div className="py-5 px-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  RAPOR TARİHİ
                </div>
                <div className="text-[17px] font-extrabold text-[#1e293b] mt-1.5 tabular-nums">
                  {formatTrDate(auditMeta.reportDate)}
                </div>
              </div>
              <div className="py-5 pl-6">
                <div className="text-[10px] font-bold uppercase tracking-[0.16em] text-slate-400">
                  TOPLAM BULGU
                </div>
                <div className="text-[17px] font-extrabold text-[#1e293b] mt-1.5 tabular-nums">
                  {totalFindings} Adet
                </div>
              </div>
            </div>
          </div>

          {/* Alt Koyu Footer Şeridi (#415463) */}
          <div className="relative bg-[#415463] text-white px-12 py-7">
            <div className="absolute top-0 left-0 w-16 h-1 bg-[#ed7d31]" />
            <div className="grid grid-cols-3 gap-6 items-center">
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/60">
                  DENETİM DÖNEMİ
                </div>
                <div className="text-xs font-semibold text-white mt-1 tabular-nums">
                  {formatTrDate(auditMeta.start)}
                  {auditMeta.end ? ` – ${formatTrDate(auditMeta.end)}` : ''}
                </div>
              </div>
              <div>
                <div className="text-[9.5px] font-bold uppercase tracking-[0.16em] text-white/60">
                  RAPORLAYAN BİRİM
                </div>
                <div className="text-xs font-semibold text-white mt-1">
                  {auditMeta.reporter || 'MLPCARE | HSE Direktörlüğü'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs font-extrabold tracking-[0.14em] text-white">
                  MLPCARE | HSE
                </div>
                <div className="text-[8.5px] font-medium tracking-[0.12em] text-white/65 uppercase mt-1 leading-snug">
                  HEALTH SAFETY ENVIRONMENT
                  <br />
                  DIRECTORATE
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
                    İÇİNDEKİLER SAYFASI
                    ============================================================ */}
                <div className="page-break-after w-full pt-4 space-y-6">
                  <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                    İçindekiler
                  </h2>

                  <div className="space-y-3.5 pt-2">
                    {tocItems.map((item) => (
                      <div
                        key={item.label}
                        className={`flex items-baseline gap-2 text-slate-900 ${item.isSub ? 'pl-6 text-[12px] text-slate-600' : 'text-[13.5px]'
                          }`}
                      >
                        <span className={item.isSub ? 'font-medium shrink-0' : 'font-semibold tracking-wide shrink-0'}>
                          {item.label}
                        </span>
                        <span className="flex-1 border-b border-dotted border-slate-400 translate-y-[-3px]" />
                        <span className="font-semibold tabular-nums shrink-0 pl-1">
                          {item.page}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* ============================================================
                    BÖLÜM 1: YÖNETİCİ ÖZETİ & KPI VERİ ÖZETİ
                    ============================================================ */}
                <div className="page-break-after w-full space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#415463] text-white text-xs font-extrabold tracking-wider">
                      BÖLÜM 1
                    </span>
                    <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                      Yönetici Özeti ve Veri Özeti
                    </h2>
                  </div>

                  {/* Yönetici Özeti Zengin Metin Alanı (Kutusuz / Kenarlıksız) */}
                  <div className="py-1">
                    <div
                      className={AUDIT_PRINT_RICH_CONTENT_CLASS}
                      dangerouslySetInnerHTML={{
                        __html: auditMeta.executiveSummary || '<p>Yönetici özeti girilmedi.</p>',
                      }}
                    />
                  </div>

                  {/* VERİ ÖZETİ & KPI BLOĞU (Kutusuz / Dış Kenarlıksız) */}
                  <div className="avoid-break space-y-4 pt-2">
                    <div className="bg-[#415463] text-white px-4 py-2 rounded flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider">
                        Veri Özeti ve Performans Göstergeleri (KPI)
                      </span>
                      <span className="text-[11px] text-white/80 tabular-nums">
                        Denetim: {formatTrDate(auditMeta.start)}
                      </span>
                    </div>

                    <div className="space-y-4">
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

                      {carryOverFindings > 0 && (unimprovedFindings > 0 || chronicFindingsCount > 0) && (
                        <div className="rounded-md border border-red-300 bg-red-50/70 px-3.5 py-2 flex items-center justify-between gap-3 text-[10.5px] text-red-900">
                          <div>
                            <strong className="uppercase tracking-wide">Tekerrür ve Kronik Bulgu Özeti:</strong>{' '}
                            Önceki denetimlerden devreden <strong>{carryOverFindings}</strong> bulgunun{' '}
                            <strong>{unimprovedFindings}</strong> tanesinde henüz hiçbir iyileştirme aksiyonu alınmamıştır.
                          </div>
                          {chronicFindingsCount > 0 && (
                            <span className="px-2 py-0.5 rounded bg-red-700 text-white font-bold text-[9.5px] shrink-0 tabular-nums">
                              {chronicFindingsCount} Kronik Bulgu (3+ Denetim / 180+ Gün)
                            </span>
                          )}
                        </div>
                      )}

                      {/* Risk Düzeyi Dağılımı + İyileştirme Durumu Donut Grafiği */}
                      <div className="grid grid-cols-2 gap-4 pt-1">
                        {/* Sol: Risk Düzeyi Dağılımı */}
                        <div className="rounded-md border border-slate-200 p-3.5 space-y-2.5 min-w-0 overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5">
                            Risk Düzeyi Dağılımı
                          </div>
                          <div className="space-y-2">
                            {riskDistribution.map((r) => (
                              <div key={r.name} className="space-y-1">
                                <div className="flex items-center justify-between gap-2 text-[11px]">
                                  <span className="flex items-center gap-1.5 font-semibold text-slate-700 min-w-0 truncate">
                                    <span
                                      className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
                                      style={{ backgroundColor: r.color }}
                                    />
                                    <span className="truncate">{r.name}</span>
                                  </span>
                                  <span className="font-bold tabular-nums text-slate-900 shrink-0">
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

                        {/* Sağ: İyileştirme Durumu Vektör SVG Donut + Taşmayan Lejant */}
                        <div className="rounded-md border border-slate-200 p-3.5 flex flex-col justify-between min-w-0 overflow-hidden">
                          <div className="text-xs font-bold text-slate-800 border-b border-slate-200 pb-1.5 mb-2">
                            İyileştirme Durumu Dağılımı
                          </div>
                          <div className="flex items-center gap-3 my-auto min-w-0">
                            <PrintDonutChart
                              data={statusData}
                              centerValue={`%${completionRate}`}
                              centerLabel="TAMAMLANMA"
                            />
                            <div className="flex-1 min-w-0 space-y-2 text-[10.5px]">
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
                                      className="flex items-start justify-between gap-2 min-w-0"
                                    >
                                      <span className="flex items-start gap-1.5 text-slate-700 min-w-0 leading-tight">
                                        <span
                                          className="w-2 h-2 rounded-full inline-block shrink-0 mt-1"
                                          style={{ backgroundColor: s.color }}
                                        />
                                        <span className="break-words">{s.name}</span>
                                      </span>
                                      <span className="font-bold tabular-nums text-slate-900 shrink-0 whitespace-nowrap">
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
                                className="flex items-center justify-between gap-2 bg-white border border-slate-200 rounded px-2.5 py-1.5 min-w-0"
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
                    <span className="px-2.5 py-0.5 rounded bg-[#415463] text-white text-xs font-extrabold tracking-wider">
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
                <div className="page-break-after w-full min-h-[24.2cm] flex flex-col">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#415463] text-white text-xs font-extrabold tracking-wider">
                      BÖLÜM 3
                    </span>
                    <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                      Bulgular
                    </h2>
                  </div>

                  <div className="flex-1 flex flex-col justify-center items-center px-6">
                    <div className="max-w-2xl space-y-5 text-[14px] leading-relaxed text-slate-800 text-justify">
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
                      <p className="font-semibold text-slate-900 text-center pt-2">
                        Denetim sürecinde ortaya konulan bulgular aşağıda sunulmuştur.
                      </p>
                    </div>
                  </div>
                </div>

                {/* ============================================================
                    BÖLÜM 3: BULGULAR (4 GRUP: YENİ -> AKSİYONSUZ -> DEVAM EDEN -> TAMAMLANAN)
                    HER BULGU 1 TAM SAYFA + AKSİYON GİRİLMİŞSE 2. SAYFA İYİLEŞTİRME SÜREÇ YÖNETİMİ
                    ============================================================ */}
                {findingGroups.map((group) =>
                  group.items.map((finding, groupIdx) => {
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
                        .map((sf) => ({
                          ...sf,
                          stepNo: sIdx + 1,
                          dept: s.department,
                          actor: s.performedByName || '',
                          date: s.actionDate || '',
                        }))
                    );

                    const lastCompletedStep = [...(finding.steps || [])]
                      .reverse()
                      .find((s) => s.status === 'Tamamlandı');
                    const closedDateStr =
                      finding.closedAt ||
                      lastCompletedStep?.completedAt ||
                      lastCompletedStep?.actionDate ||
                      '';
                    const effectiveProgress =
                      finding.status === 'Tamamlanan' ? 100 : finding.progress || 0;

                    const dayanakText =
                      ((finding as any).dayanak as string | undefined)?.trim() ||
                      ((finding as any).basis as string | undefined)?.trim() ||
                      finding.riskReasoning?.trim() ||
                      '—';
                    const visiblePhotos = imageFiles.slice(0, 3);
                    const { repeatCount, openDays, isChronic } = getRepeatAndAge(finding);

                    return (
                      <React.Fragment key={finding.id}>
                        {/* BULGU SAYFA 1: TAM 1 A4 SAYFA — KESİN CM ÖLÇÜLÜ TABLO */}
                        <div className="page-break-after w-full">
                          {/* Grup Başlık Bandı (Grup ilk bulgusunda vurgulu, diğerlerinde ince referans) */}
                          <div className="flex items-center justify-between gap-2 mb-1.5 px-2 py-1 rounded bg-slate-100 border border-slate-300 text-[10px]">
                            <div className="flex items-center gap-2 font-bold text-slate-800 min-w-0">
                              <span className={`px-2 py-0.5 rounded text-[9.5px] font-extrabold shrink-0 ${group.badgeColor}`}>
                                BÖLÜM {group.code}
                              </span>
                              <span className="uppercase tracking-wide truncate">{group.title}</span>
                              {isCarryoverFinding(finding) && finding.status !== 'Tamamlanan' && (
                                <span
                                  className={`px-1.5 py-0.5 rounded text-[9px] font-extrabold uppercase shrink-0 tabular-nums ${isChronic
                                      ? 'bg-red-700 text-white'
                                      : 'bg-amber-500 text-white'
                                    }`}
                                >
                                  {isChronic
                                    ? `${repeatCount}. Denetim (Kronik Bulgu)`
                                    : `${repeatCount}. Denetim (Yinelenen)`}
                                  {openDays > 0 ? ` • ${openDays} Gün` : ''}
                                </span>
                              )}
                            </div>
                            <span className="font-semibold text-slate-600 tabular-nums shrink-0">
                              {groupIdx + 1} / {group.items.length}
                              {finding.originReportNo && isCarryoverFinding(finding)
                                ? ` • İlk Tespit: ${finding.originReportNo}`
                                : ''}
                            </span>
                          </div>

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
                              {/* 1. SATIR: 1.1cm */}
                              <tr style={{ height: '1.1cm' }} className="border-b border-slate-300">
                                <td className="px-2 py-1 font-bold bg-slate-100 border-r border-slate-300 align-middle text-slate-800">
                                  Tespit No:
                                </td>
                                <td className="px-2 py-1 font-extrabold text-slate-900 border-r border-slate-300 align-middle text-center tabular-nums">
                                  {finding.no || `#${groupIdx + 1}`}
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

                              {/* 2. SATIR: 1.1cm */}
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

                              {/* 3. SATIR: 0.1cm */}
                              <tr style={{ height: '0.1cm' }}>
                                <td
                                  colSpan={6}
                                  className="p-0 bg-white border-y border-slate-300"
                                  style={{ height: '0.1cm', lineHeight: '0.1cm', fontSize: '1px' }}
                                >
                                  &nbsp;
                                </td>
                              </tr>

                              {/* 4. SATIR: 0.8cm */}
                              <tr style={{ height: '0.8cm' }} className="border-b border-slate-400 bg-slate-200">
                                <td
                                  colSpan={6}
                                  className="px-3 py-1 font-extrabold text-center uppercase tracking-wider text-slate-900 align-middle text-[11.5px]"
                                >
                                  Tespit Detayları
                                </td>
                              </tr>

                              {/* 5. SATIR: 3.8cm */}
                              <tr style={{ height: '3.8cm' }} className="border-b border-slate-300">
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

                              {/* 6. SATIR: 1.1cm */}
                              <tr style={{ height: '1.1cm' }} className="border-b border-slate-300">
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

                              {/* 7. SATIR: 4.6cm */}
                              <tr style={{ height: '4.6cm' }} className="border-b border-slate-300">
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

                              {/* 8. SATIR: 4.6cm */}
                              <tr style={{ height: '4.6cm' }} className="border-b border-slate-300">
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

                              {/* 9. SATIR: 0.1cm */}
                              <tr style={{ height: '0.1cm' }}>
                                <td
                                  colSpan={6}
                                  className="p-0 bg-white border-y border-slate-300"
                                  style={{ height: '0.1cm', lineHeight: '0.1cm', fontSize: '1px' }}
                                >
                                  &nbsp;
                                </td>
                              </tr>

                              {/* 10. SATIR: 0.8cm */}
                              <tr style={{ height: '0.8cm' }} className="border-b border-slate-400 bg-slate-200">
                                <td
                                  colSpan={6}
                                  className="px-3 py-1 font-extrabold text-center uppercase tracking-wider text-slate-900 align-middle text-[11.5px]"
                                >
                                  Ek (Fotoğraf, Doküman v.b.)
                                </td>
                              </tr>

                              {/* 11. SATIR: 5.8cm */}
                              <tr style={{ height: '5.8cm' }}>
                                <td colSpan={6} className="p-1 align-middle text-center">
                                  {visiblePhotos.length === 0 ? (
                                    <div className="text-xs text-slate-400 italic">
                                      Bu bulguya ait fotoğraf eklenmemiştir.
                                    </div>
                                  ) : (
                                    <div
                                      className="w-full flex items-center justify-center gap-2"
                                      style={{ height: '5.6cm' }}
                                    >
                                      {visiblePhotos.map((img, i) => (
                                        <div
                                          key={i}
                                          className="flex items-center justify-center overflow-hidden"
                                          style={{
                                            flex: '1 1 0%',
                                            height: '5.6cm',
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
                                              maxHeight: '5.6cm',
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

                        {/* BULGU SAYFA 2: KOŞULLU İYİLEŞTİRME SÜREÇ YÖNETİMİ (AD SOYAD, UNVAN, TARİH, % İLERLEME, KANIT GÖRSELLERİ) */}
                        {hasImprovementPage && (
                          <div className="page-break-after w-full min-h-[24.4cm] print:min-h-[24.4cm] flex flex-col">
                            <div className="flex items-center justify-between border-b-2 border-[#415463] pb-2 mb-3">
                              <div className="flex items-center gap-2.5">
                                <span className="px-2.5 py-0.5 rounded bg-[#415463] text-white text-[11px] font-extrabold tracking-wider">
                                  İYİLEŞTİRME SÜREÇ YÖNETİMİ
                                </span>
                                <span className="text-sm font-extrabold text-slate-900">
                                  {finding.no || `Bulgu #${groupIdx + 1}`} — Aksiyon ve Takip Kayıtları
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 rounded bg-slate-100 border border-slate-300 text-[10.5px] font-bold text-slate-800 tabular-nums">
                                  İlerleme: %{effectiveProgress}
                                </span>
                                <span
                                  className={`px-2.5 py-0.5 rounded text-[10.5px] font-bold ${finding.status === 'Tamamlanan'
                                      ? 'bg-emerald-700 text-white'
                                      : getRiskSolidClass(finding.risk)
                                    }`}
                                >
                                  {finding.status === 'Tamamlanan' ? 'TAMAMLANDI' : normRisk}
                                </span>
                              </div>
                            </div>

                            <div className="flex-1 flex flex-col border border-slate-400 bg-white">
                              {/* İlgili Bulgu Referans Özet Barı */}
                              <table className="w-full text-[11px] border-collapse border-b-2 border-slate-400">
                                <tbody>
                                  <tr>
                                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-300 w-[13%]">
                                      Tespit No
                                    </td>
                                    <td className="p-2 font-extrabold border-r border-slate-300 w-[17%] tabular-nums">
                                      {finding.no || `#${groupIdx + 1}`}
                                    </td>
                                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-300 w-[13%]">
                                      İlk Tespit
                                    </td>
                                    <td className="p-2 font-medium border-r border-slate-300 w-[23%] tabular-nums">
                                      {finding.originReportNo || auditMeta.reportNo || '—'}
                                      {finding.originReportDate
                                        ? ` (${formatTrDate(finding.originReportDate)})`
                                        : ''}
                                    </td>
                                    <td className="p-2 bg-slate-100 font-bold border-r border-slate-300 w-[13%]">
                                      {finding.status === 'Tamamlanan' ? 'Tamamlanma' : 'Güncel Durum'}
                                    </td>
                                    <td
                                      className={`p-2 font-bold text-center w-[21%] tabular-nums ${finding.status === 'Tamamlanan'
                                          ? 'bg-emerald-50 text-emerald-800'
                                          : 'text-slate-900'
                                        }`}
                                    >
                                      {finding.status === 'Tamamlanan'
                                        ? `Tamamlandı${closedDateStr ? ` (${formatTrDate(closedDateStr)})` : ''}`
                                        : finding.status}
                                    </td>
                                  </tr>
                                </tbody>
                              </table>

                              {/* İyileştirme Durumu Özeti (varsa) */}
                              {improvementDesc && improvementDesc.trim() && (
                                <div className="border-b border-slate-300 p-3 bg-slate-50/60">
                                  <div className="text-[10.5px] font-extrabold uppercase tracking-wider text-slate-700 mb-1">
                                    İyileştirme Durumu Değerlendirmesi
                                  </div>
                                  <p className="text-[11px] leading-relaxed text-slate-800 whitespace-pre-wrap">
                                    {improvementDesc}
                                  </p>
                                </div>
                              )}

                              {/* Aksiyon ve Süreç Yönetimi Tablosu */}
                              <div className="bg-slate-200 border-b border-slate-400 px-3 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                                Alınan Aksiyonlar ve Süreç Geçmişi ({finding.steps?.length || 0} Kayıt)
                              </div>

                              <table className="w-full text-[10.5px] border-collapse">
                                <thead>
                                  <tr className="bg-slate-100 border-b border-slate-400">
                                    <th className="p-2 border-r border-slate-300 w-[6%] text-center">
                                      No
                                    </th>
                                    <th className="p-2 border-r border-slate-300 w-[11%] text-center">
                                      Tarih
                                    </th>
                                    <th className="p-2 border-r border-slate-300 w-[21%] text-left">
                                      İşlemi Giren (Ad &amp; Unvan)
                                    </th>
                                    <th className="p-2 border-r border-slate-300 w-[15%] text-left">
                                      Sorumlu Birim
                                    </th>
                                    <th className="p-2 border-r border-slate-300 w-[35%] text-left">
                                      Yapılan İşlem / Aksiyon Açıklaması
                                    </th>
                                    <th className="p-2 w-[12%] text-center">Durum</th>
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
                                        <td className="p-2 border-r border-slate-300">
                                          <div className="font-bold text-slate-900 leading-tight">
                                            {s.performedByName || 'Sistem Kaydı'}
                                          </div>
                                          {s.performedByTitle && (
                                            <div className="text-[9.5px] text-slate-500 mt-0.5 leading-tight">
                                              {s.performedByTitle}
                                            </div>
                                          )}
                                        </td>
                                        <td className="p-2 border-r border-slate-300 font-semibold text-slate-800">
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
                                        <td className="p-2 text-center">
                                          <div
                                            className={`font-bold text-[10px] ${s.status === 'Tamamlandı'
                                                ? 'text-emerald-700'
                                                : 'text-slate-800'
                                              }`}
                                          >
                                            {s.status}
                                          </div>
                                          {typeof s.progress === 'number' && (
                                            <div className="text-[9.5px] font-semibold text-slate-500 tabular-nums">
                                              %{s.progress}
                                            </div>
                                          )}
                                        </td>
                                      </tr>
                                    ))
                                  ) : (
                                    <tr>
                                      <td
                                        colSpan={6}
                                        className="p-4 text-center text-slate-400 italic"
                                      >
                                        Aksiyon adımı kaydı bulunmamaktadır.
                                      </td>
                                    </tr>
                                  )}
                                </tbody>
                              </table>

                              {/* Aksiyon / Tamamlanma Kanıt Görselleri (varsa) */}
                              {stepEvidencePhotos.length > 0 && (
                                <div className="mt-auto border-t-2 border-slate-400">
                                  <div className="bg-slate-200 border-b border-slate-300 px-3 py-1.5 text-center text-[11px] font-extrabold uppercase tracking-wider text-slate-900">
                                    İyileştirme ve Tamamlanma Kanıt Görselleri
                                  </div>
                                  <div className="p-3 grid grid-cols-3 gap-2.5">
                                    {stepEvidencePhotos.slice(0, 6).map((photo, pi) => (
                                      <div
                                        key={pi}
                                        className="border border-slate-300 rounded p-1.5 bg-slate-50/50 space-y-1 text-center"
                                      >
                                        <img
                                          src={photo.url}
                                          alt={photo.name || `Kanıt ${pi + 1}`}
                                          className="max-h-[45mm] max-w-full object-contain mx-auto rounded"
                                        />
                                        <div className="text-[9.5px] font-medium text-slate-600 truncate">
                                          Adım {photo.stepNo}
                                          {photo.date ? ` • ${formatTrDate(photo.date)}` : ''}
                                          {photo.actor ? ` • ${photo.actor}` : ''}
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
                  })
                )}

                {/* ============================================================
                    BÖLÜM 4: GENEL DEĞERLENDİRME VE SONUÇ
                    ============================================================ */}
                <div className="w-full space-y-5">
                  <div className="flex items-center gap-3 border-b border-slate-300 pb-2">
                    <span className="px-2.5 py-0.5 rounded bg-[#415463] text-white text-xs font-extrabold tracking-wider">
                      BÖLÜM 4
                    </span>
                    <h2 className="text-lg font-extrabold uppercase tracking-wide text-slate-900">
                      Genel Değerlendirme ve Sonuç
                    </h2>
                  </div>

                  <div className="py-1">
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
                  <div className="avoid-break mt-8 pt-4 border-t border-slate-300 flex items-center justify-between text-xs text-slate-600">
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

                {/* ============================================================
                    EK-1: KÜMÜLATİF DENETİM VE BULGU İZLEME İNDEKSİ (ZİNCİR SİCİL TABLOSU)
                    ============================================================ */}
                <div className="page-break-before w-full space-y-4">
                  <div className="flex items-center justify-between border-b border-slate-300 pb-2">
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-0.5 rounded bg-[#415463] text-white text-xs font-extrabold tracking-wider">
                        EK-1
                      </span>
                      <h2 className="text-base font-extrabold uppercase tracking-wide text-slate-900">
                        Kümülatif Denetim ve Bulgu İzleme İndeksi
                      </h2>
                    </div>
                    <span className="text-xs font-semibold text-slate-500 tabular-nums">
                      Toplam {cumulativeIndexRows.length} Sicil Kaydı
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-600 leading-relaxed">
                    Bu indeks, tesiste bugüne kadar gerçekleştirilen tüm denetim turlarında tespit edilen
                    bulguların kök numaralarını, ilk tespit edildikleri raporları, güncel süreç durumlarını
                    ve kapatıldıkları denetim dönemlerini kesintisiz bir denetim zinciri halinde sunar.
                  </p>

                  {/* Kümülatif Özet Sayaçlar */}
                  <div className="grid grid-cols-4 gap-2.5 text-center text-[11px]">
                    <div className="p-2 rounded border border-slate-300 bg-slate-50">
                      <div className="text-[9.5px] font-bold uppercase text-slate-500">Toplam Sicil</div>
                      <div className="text-base font-extrabold text-slate-900 tabular-nums">
                        {cumulativeIndexRows.length}
                      </div>
                    </div>
                    <div className="p-2 rounded border border-emerald-300 bg-emerald-50/70">
                      <div className="text-[9.5px] font-bold uppercase text-emerald-700">Tamamlanan</div>
                      <div className="text-base font-extrabold text-emerald-800 tabular-nums">
                        {cumulativeIndexRows.filter((r) => r.isClosed).length}
                      </div>
                    </div>
                    <div className="p-2 rounded border border-amber-300 bg-amber-50/70">
                      <div className="text-[9.5px] font-bold uppercase text-amber-700">Süreci Devam Eden</div>
                      <div className="text-base font-extrabold text-amber-800 tabular-nums">
                        {cumulativeIndexRows.filter((r) => !r.isClosed && r.progress > 0).length}
                      </div>
                    </div>
                    <div className="p-2 rounded border border-red-300 bg-red-50/70">
                      <div className="text-[9.5px] font-bold uppercase text-red-700">Yeni / Başlamamış</div>
                      <div className="text-base font-extrabold text-red-800 tabular-nums">
                        {cumulativeIndexRows.filter((r) => !r.isClosed && r.progress === 0).length}
                      </div>
                    </div>
                  </div>

                  <table className="w-full border-collapse border border-slate-400 text-[10px] leading-snug">
                    <thead>
                      <tr className="bg-[#415463] text-white">
                        <th className="p-1.5 border-r border-white/20 text-left w-[13%]">Bulgu Kodu</th>
                        <th className="p-1.5 border-r border-white/20 text-left w-[14%]">İlk Tespit</th>
                        <th className="p-1.5 border-r border-white/20 text-left w-[14%]">Kat / Birim</th>
                        <th className="p-1.5 border-r border-white/20 text-left w-[22%]">Kategori &amp; Konu Özeti</th>
                        <th className="p-1.5 border-r border-white/20 text-center w-[8%]">Risk</th>
                        <th className="p-1.5 border-r border-white/20 text-center w-[11%]">Tekerrür / Süre</th>
                        <th className="p-1.5 border-r border-white/20 text-center w-[9%]">Güncel Durum</th>
                        <th className="p-1.5 text-left w-[9%]">Kapanış</th>
                      </tr>
                    </thead>
                    <tbody>
                      {cumulativeIndexRows.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="p-4 text-center text-slate-400 italic">
                            Henüz kayıtlı bulgu bulunmuyor.
                          </td>
                        </tr>
                      ) : (
                        cumulativeIndexRows.map((row, rIdx) => {
                          const rowIsChronic =
                            !row.isClosed && (row.seenCount >= 3 || row.openDays >= 180);
                          return (
                            <tr
                              key={row.key || rIdx}
                              className={`border-b border-slate-300 ${row.isClosed ? 'bg-emerald-50/30' : rIdx % 2 === 1 ? 'bg-slate-50/60' : 'bg-white'
                                }`}
                            >
                              <td className="p-1.5 border-r border-slate-300 font-bold text-slate-900 tabular-nums">
                                {row.no}
                              </td>
                              <td className="p-1.5 border-r border-slate-300 tabular-nums text-slate-700">
                                <div className="font-semibold text-slate-900">{row.originReportNo}</div>
                                {row.originReportDate && (
                                  <div className="text-[9px] text-slate-500">
                                    {formatTrDate(row.originReportDate)}
                                  </div>
                                )}
                              </td>
                              <td className="p-1.5 border-r border-slate-300 text-slate-700">
                                {row.location}
                              </td>
                              <td className="p-1.5 border-r border-slate-300 text-slate-800">
                                <span className="font-semibold">{row.category}:</span>{' '}
                                <span className="text-slate-600">{row.summary}</span>
                              </td>
                              <td className="p-1.5 border-r border-slate-300 text-center">
                                <span
                                  className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${getRiskSolidClass(
                                    row.risk
                                  )}`}
                                >
                                  {row.risk}
                                </span>
                              </td>
                              <td className="p-1.5 border-r border-slate-300 text-center tabular-nums">
                                <div
                                  className={`font-bold text-[9.5px] ${rowIsChronic
                                      ? 'text-red-700'
                                      : row.seenCount >= 2 && !row.isClosed
                                        ? 'text-amber-700'
                                        : 'text-slate-700'
                                    }`}
                                >
                                  {rowIsChronic
                                    ? `${row.seenCount}. Denetim (Kronik)`
                                    : row.seenCount >= 2
                                      ? `${row.seenCount}. Denetim (Yinelenen)`
                                      : '1. Denetim'}
                                </div>
                                {row.openDays > 0 && (
                                  <div className="text-[9px] text-slate-500">
                                    {row.openDays} gün
                                  </div>
                                )}
                              </td>
                              <td
                                className={`p-1.5 border-r border-slate-300 text-center font-bold ${row.isClosed
                                    ? 'text-emerald-700'
                                    : row.progress > 0
                                      ? 'text-amber-700'
                                      : 'text-red-700'
                                  }`}
                              >
                                {row.statusLabel}
                              </td>
                              <td className="p-1.5 text-slate-700 tabular-nums">
                                {row.isClosed ? (
                                  <>
                                    <div className="font-semibold text-emerald-800">
                                      {row.closedReportNo}
                                    </div>
                                    {row.closedDate && (
                                      <div className="text-[9px] text-slate-500">
                                        {formatTrDate(row.closedDate)}
                                      </div>
                                    )}
                                  </>
                                ) : (
                                  <span className="text-slate-400">—</span>
                                )}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        {/* ============================================================
            BİTİŞ (ARKA) KAPAĞI (MLPCARE KURUMSAL FULL-BLEED A4)
            ============================================================ */}
        <div className="cover-named-page page-break-before relative w-full min-h-[29.7cm] print:h-[29.7cm] bg-[#415463] text-white flex flex-col justify-between overflow-hidden border border-slate-200 print:border-0">
          {/* Üst Turuncu Vurgu Şeridi */}
          <div className="w-full h-1.5 bg-[#ed7d31]" />

          {/* Arka Plan Geometrik Vektör Desen */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none select-none"
            viewBox="0 0 800 1120"
            preserveAspectRatio="xMidYMid slice"
            aria-hidden="true"
          >
            <circle cx="400" cy="540" r="190" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <circle cx="400" cy="540" r="285" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <circle cx="400" cy="540" r="380" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
            <line x1="0" y1="540" x2="800" y2="540" stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
          </svg>

          {/* Orta Kurumsal Kapanış Bloğu */}
          <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-12 space-y-6">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt="MLPCARE HSE Logo"
                className="h-20 max-w-[280px] object-contain"
              />
            ) : (
              <div className="text-4xl tracking-tight text-white">
                <span className="font-extrabold">MLP</span>
                <span className="font-light">CARE</span>
              </div>
            )}

            <div className="w-16 h-1 bg-[#ed7d31]" />

            <div className="space-y-2 max-w-lg">
              <p className="text-[11px] font-bold uppercase tracking-[0.26em] text-white/70">
                MLPCARE HSE DİREKTÖRLÜĞÜ
              </p>
              <h2 className="text-2xl font-extrabold uppercase tracking-wide text-white">
                Entegre Risk ve Güvenlik Denetim Raporu
              </h2>
              <p className="text-sm font-medium text-white/80 pt-1">
                {facility ? facility.name : ''}
                {auditMeta.reportNo ? ` • ${auditMeta.reportNo}` : ''}
              </p>
            </div>

            <div className="pt-4 text-[11px] uppercase tracking-[0.2em] text-[#ed7d31] font-bold">
              RAPOR SONU
            </div>
          </div>

          {/* Alt Gizlilik ve Kurumsal Bilgi Şeridi */}
          <div className="relative z-10 px-12 pb-10 pt-6 border-t border-white/15 flex items-end justify-between gap-6">
            <div className="max-w-md text-[10px] leading-relaxed text-white/65">
              Bu rapor MLPCARE Sağlık Grubu HSE Direktörlüğü tarafından kurumsal kullanım amacıyla
              hazırlanmıştır. İzinsiz çoğaltılamaz ve üçüncü taraflarla paylaşılamaz.
            </div>
            <div className="text-right shrink-0">
              <div className="text-xs font-extrabold tracking-[0.14em] text-white">
                MLPCARE | HSE
              </div>
              <div className="text-[8.5px] font-medium tracking-[0.12em] text-white/60 uppercase mt-0.5">
                Health Safety Environment Directorate
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
);

ReportTemplate.displayName = 'ReportTemplate';
export default ReportTemplate;
