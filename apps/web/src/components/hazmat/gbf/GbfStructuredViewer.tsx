import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LayoutList, CheckCircle2 } from 'lucide-react';
import type { GbfDoc, GbfTable } from './gbfSchema';
import {
  GBF_SECTIONS,
  countGbfProgress,
  getVisibleSubsForSection,
  isSectionStructured,
} from './gbfSchema';

interface GbfStructuredViewerProps {
  doc: GbfDoc;
}

const RenderReadOnlyTable: React.FC<{ table: GbfTable }> = ({ table }) => {
  const nonEmptyRows = (table.rows || []).filter((r) => r.some((c) => c.trim()));
  if (!nonEmptyRows.length && !(table.headers || []).some((h) => h.trim())) return null;
  return (
    <div className="overflow-x-auto border border-border/70 rounded-lg my-2">
      <table className="w-full text-xs border-collapse">
        <thead>
          <tr className="bg-muted/60">
            {(table.headers || []).map((h, i) => (
              <th
                key={i}
                className="text-left px-2.5 py-1.5 font-semibold border-b border-r border-border/60 last:border-r-0"
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {nonEmptyRows.map((row, ri) => (
            <tr key={ri} className="border-b border-border/40 last:border-b-0">
              {(table.headers || []).map((_, ci) => (
                <td key={ci} className="px-2.5 py-1.5 border-r border-border/40 last:border-r-0 align-top">
                  {row[ci] || ''}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export const GbfStructuredViewer: React.FC<GbfStructuredViewerProps> = ({ doc }) => {
  const [selectedSection, setSelectedSection] = useState<number | 'all'>('all');
  const progress = countGbfProgress(doc);

  const filledSections = GBF_SECTIONS.filter((sec) => {
    const s = doc.sections[sec.num];
    return Boolean(s?.raw?.trim() || isSectionStructured(s));
  });

  const sectionsToDisplay =
    selectedSection === 'all'
      ? filledSections
      : GBF_SECTIONS.filter((sec) => sec.num === selectedSection);

  return (
    <div className="space-y-4">
      {/* 16 Resmî GBF Bölümü Hızlı Geçiş ve Durum Çubuğu */}
      <div className="rounded-xl border border-border/70 bg-card p-3.5 shadow-2xs space-y-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
              16 Resmî GBF Bölümü
            </span>
            <Badge variant="secondary" className="text-[10px] font-semibold">
              {progress.any} / 16 Dolu
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            {selectedSection !== 'all' && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setSelectedSection('all')}
                className="h-7 text-[11px]"
              >
                <LayoutList className="w-3.5 h-3.5 mr-1" />
                Tüm Dolu Bölümleri Göster ({filledSections.length})
              </Button>
            )}
            <div className="hidden sm:flex items-center gap-2">
              <div className="w-20 h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className="h-full bg-primary transition-all"
                  style={{ width: `${(progress.any / 16) * 100}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
          {GBF_SECTIONS.map((sec) => {
            const s = doc.sections[sec.num];
            const isStruct = isSectionStructured(s);
            const hasRaw = Boolean(s?.raw?.trim());
            const hasAny = isStruct || hasRaw;
            const isActive = selectedSection === sec.num;

            return (
              <button
                key={sec.num}
                type="button"
                disabled={!hasAny}
                onClick={() => setSelectedSection(isActive ? 'all' : sec.num)}
                title={`${sec.num}. ${sec.title}${hasAny ? '' : ' (Veri girilmemiş)'}`}
                className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg border text-left transition-all min-w-0 ${
                  isActive
                    ? 'bg-primary text-primary-foreground border-primary font-semibold shadow-2xs'
                    : hasAny
                      ? 'bg-background hover:bg-muted/70 border-border/70 text-foreground'
                      : 'bg-muted/20 border-border/40 text-muted-foreground/50 cursor-not-allowed'
                }`}
              >
                <span
                  className={`text-[10px] font-bold px-1.5 py-0.5 rounded shrink-0 ${
                    isActive
                      ? 'bg-primary-foreground/20 text-primary-foreground'
                      : hasAny
                        ? 'bg-muted text-foreground/80'
                        : 'bg-muted/50 text-muted-foreground/50'
                  }`}
                >
                  {String(sec.num).padStart(2, '0')}
                </span>
                <span className="text-[11px] truncate flex-1">{sec.title}</span>
                <span
                  className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isStruct
                      ? isActive ? 'bg-emerald-300' : 'bg-emerald-500'
                      : hasRaw
                        ? isActive ? 'bg-amber-300' : 'bg-amber-400'
                        : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </div>
      </div>

      {/* Bölüm İçerikleri */}
      {sectionsToDisplay.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground border border-border/70 rounded-xl bg-card">
          <p className="text-xs">Bu tehlikeli madde için henüz 16 bölümlü GBF verisi doldurulmamış.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sectionsToDisplay.map((sec) => {
            const s = doc.sections[sec.num];
            const structured = isSectionStructured(s);
            const visibleSubs = getVisibleSubsForSection(sec.num, doc.kind);

            return (
              <Card key={sec.num} className="border-border/70 shadow-2xs overflow-hidden rounded-xl">
                <CardHeader className="py-2.5 px-4 bg-muted/35 border-b border-border/60 flex flex-row items-center justify-between gap-2">
                  <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2">
                    <span className="px-1.5 py-0.5 rounded bg-primary/10 text-primary font-mono text-[11px] font-bold">
                      {String(sec.num).padStart(2, '0')}
                    </span>
                    <span>{sec.title}</span>
                  </CardTitle>
                  <Badge variant="outline" className="text-[10px] font-medium gap-1 shrink-0">
                    {structured && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
                    {structured ? 'Ayrıntılı Giriş' : 'Ham Metin'}
                  </Badge>
                </CardHeader>
                <CardContent className="p-4 space-y-3 text-xs">
                  {structured ? (
                    <>
                      {visibleSubs.map((subDef) => {
                        const sub = s.sub?.[subDef.code];
                        if (!sub) return null;
                        const hasAny =
                          sub.text?.trim() ||
                          sub.rows?.some((r) => r.label?.trim() || r.value?.trim()) ||
                          sub.tables?.some((t) => t.rows?.some((row) => row.some((c) => c.trim()))) ||
                          sub.textBoxes?.some((b) => b.title?.trim() || b.text?.trim()) ||
                          sub.headings?.some(
                            (h) =>
                              h.title?.trim() ||
                              h.text?.trim() ||
                              h.rows?.some((r) => r.label?.trim() || r.value?.trim()) ||
                              h.tables?.length ||
                              h.textBoxes?.length
                          );
                        if (!hasAny) return null;

                        return (
                          <div
                            key={subDef.code}
                            className="space-y-2 pb-3 border-b border-border/40 last:border-b-0 last:pb-0"
                          >
                            <div className="flex items-center gap-2">
                              <span className="px-1.5 py-0.5 rounded bg-muted text-foreground font-mono font-bold text-[11px]">
                                {subDef.code}
                              </span>
                              <span className="font-semibold text-foreground">{subDef.title}</span>
                            </div>

                            {sub.text?.trim() && (
                              <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">
                                {sub.text}
                              </p>
                            )}

                            {sub.textBoxes?.map((b, bi) =>
                              b.title?.trim() || b.text?.trim() ? (
                                <div key={bi} className="rounded-lg border border-border/60 bg-muted/20 p-2.5 space-y-1">
                                  {b.title?.trim() && <div className="font-semibold text-foreground">{b.title}</div>}
                                  {b.text?.trim() && (
                                    <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{b.text}</p>
                                  )}
                                </div>
                              ) : null
                            )}

                            {sub.rows?.some((r) => r.label?.trim() || r.value?.trim()) && (
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                {sub.rows.map((r, ri) =>
                                  r.label?.trim() || r.value?.trim() ? (
                                    <div key={ri} className="rounded-md border border-border/60 bg-background px-2.5 py-1.5">
                                      {r.label?.trim() && (
                                        <span className="text-[10px] font-semibold text-muted-foreground block">
                                          {r.label}
                                        </span>
                                      )}
                                      <span className="text-xs text-foreground">{r.value}</span>
                                    </div>
                                  ) : null
                                )}
                              </div>
                            )}

                            {sub.tables?.map((t, ti) => (
                              <RenderReadOnlyTable key={ti} table={t} />
                            ))}

                            {sub.headings?.map((h) => (
                              <div
                                key={h.id}
                                className="rounded-lg border border-border bg-muted/20 p-3 space-y-2"
                              >
                                {h.title?.trim() && (
                                  <div className="font-semibold text-foreground text-xs">{h.title}</div>
                                )}
                                {h.text?.trim() && (
                                  <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{h.text}</p>
                                )}
                                {h.rows?.some((r) => r.label?.trim() || r.value?.trim()) && (
                                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                                    {h.rows.map((r, ri) =>
                                      r.label?.trim() || r.value?.trim() ? (
                                        <div key={ri} className="rounded border border-border/60 bg-background px-2.5 py-1.5">
                                          {r.label?.trim() && (
                                            <span className="text-[10px] font-semibold text-muted-foreground block">
                                              {r.label}
                                            </span>
                                          )}
                                          <span className="text-xs text-foreground">{r.value}</span>
                                        </div>
                                      ) : null
                                    )}
                                  </div>
                                )}
                                {h.textBoxes?.map((b, bi) =>
                                  b.title?.trim() || b.text?.trim() ? (
                                    <div key={bi} className="rounded border border-border/60 bg-background p-2 space-y-1">
                                      {b.title?.trim() && <div className="font-semibold">{b.title}</div>}
                                      {b.text?.trim() && <p className="whitespace-pre-wrap">{b.text}</p>}
                                    </div>
                                  ) : null
                                )}
                                {h.tables?.map((t, ti) => (
                                  <RenderReadOnlyTable key={ti} table={t} />
                                ))}
                              </div>
                            ))}
                          </div>
                        );
                      })}

                      {s.custom?.some((c) => c.label?.trim() || c.value?.trim()) && (
                        <div className="pt-2 space-y-1.5">
                          <span className="text-[10px] font-bold text-muted-foreground uppercase">Ek Bilgiler</span>
                          {s.custom.map((c, ci) =>
                            c.label?.trim() || c.value?.trim() ? (
                              <div key={ci} className="rounded border border-border/60 px-2.5 py-1.5">
                                <span className="font-semibold">{c.label}: </span>
                                <span>{c.value}</span>
                              </div>
                            ) : null
                          )}
                        </div>
                      )}
                    </>
                  ) : (
                    <p className="whitespace-pre-wrap text-foreground/90 leading-relaxed">{s.raw}</p>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};
