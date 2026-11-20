import React from 'react';
import {
  Plus,
  Table2,
  FileText,
  Heading2,
  Trash2,
  ChevronUp,
  ChevronDown,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import type {
  GbfSubData,
  GbfCustomHeading,
  GbfTable,
} from './gbfSchema';
import { GBF_SUGGEST, gbfUid } from './gbfSchema';

interface GbfSubCardProps {
  code: string;
  title: string;
  data: GbfSubData;
  onChange: (next: GbfSubData) => void;
  extraContent?: React.ReactNode;
}

export const GbfSubCard: React.FC<GbfSubCardProps> = ({
  code,
  title,
  data,
  onChange,
  extraContent,
}) => {
  const suggest = GBF_SUGGEST[code] || [];

  const update = (patch: Partial<GbfSubData>) => {
    onChange({ ...data, ...patch });
  };

  // Pairs
  const addPair = (label = '') => {
    if (label && data.rows.some((r) => r.label === label)) return;
    update({ rows: [...data.rows, { label, value: '' }] });
  };

  const updatePair = (idx: number, field: 'label' | 'value', val: string) => {
    const next = data.rows.map((r, i) => (i === idx ? { ...r, [field]: val } : r));
    update({ rows: next });
  };

  const removePair = (idx: number) => {
    update({ rows: data.rows.filter((_, i) => i !== idx) });
  };

  // TextBoxes
  const addTextBox = () => {
    update({ textBoxes: [...data.textBoxes, { title: '', text: '' }] });
  };

  const updateTextBox = (idx: number, field: 'title' | 'text', val: string) => {
    const next = data.textBoxes.map((b, i) => (i === idx ? { ...b, [field]: val } : b));
    update({ textBoxes: next });
  };

  const removeTextBox = (idx: number) => {
    const b = data.textBoxes[idx];
    if (b?.text?.trim() && !window.confirm('Bu metin kutusu ve içindeki açıklama silinsin mi?')) return;
    update({ textBoxes: data.textBoxes.filter((_, i) => i !== idx) });
  };

  // Tables
  const addTable = () => {
    update({
      tables: [
        ...data.tables,
        { headers: ['Madde / Parametre', 'Değer', 'Açıklama'], rows: [['', '', '']] },
      ],
    });
  };

  const updateTable = (ti: number, nextTable: GbfTable) => {
    update({ tables: data.tables.map((t, i) => (i === ti ? nextTable : t)) });
  };

  const removeTable = (ti: number) => {
    update({ tables: data.tables.filter((_, i) => i !== ti) });
  };

  // Custom Nested Headings
  const addHeading = () => {
    const h: GbfCustomHeading = {
      id: gbfUid(),
      title: '',
      text: '',
      rows: [],
      tables: [],
      textBoxes: [],
    };
    update({ headings: [...data.headings, h] });
  };

  const updateHeading = (hi: number, nextHeading: GbfCustomHeading) => {
    update({ headings: data.headings.map((h, i) => (i === hi ? nextHeading : h)) });
  };

  const removeHeading = (hi: number) => {
    const h = data.headings[hi];
    const hasContent =
      h.title.trim() || h.text.trim() || h.rows.length > 0 || h.tables.length > 0 || h.textBoxes.length > 0;
    if (hasContent && !window.confirm('Bu özel alt başlık ve içindeki veriler silinsin mi?')) return;
    update({ headings: data.headings.filter((_, i) => i !== hi) });
  };

  const moveHeading = (hi: number, dir: -1 | 1) => {
    const target = hi + dir;
    if (target < 0 || target >= data.headings.length) return;
    const copy = [...data.headings];
    const [moved] = copy.splice(hi, 1);
    copy.splice(target, 0, moved);
    update({ headings: copy });
  };

  const renderTableEditor = (
    table: GbfTable,
    onTableChange: (next: GbfTable) => void,
    onRemove: () => void
  ) => (
    <div className="mt-3 border border-border rounded-lg overflow-hidden bg-background">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-xs min-w-[480px]">
          <thead>
            <tr className="bg-muted/60">
              {table.headers.map((h, ci) => (
                <th key={ci} className="border-b border-r border-border/60 p-1 last:border-r-0">
                  <input
                    className="w-full bg-transparent px-2 py-1 font-semibold text-foreground outline-none focus:bg-muted/60 rounded"
                    aria-label="Sütun başlığı"
                    value={h}
                    onChange={(e) => {
                      const headers = table.headers.map((val, idx) => (idx === ci ? e.target.value : val));
                      onTableChange({ ...table, headers });
                    }}
                  />
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table.rows.map((row, ri) => (
              <tr key={ri} className="border-b border-border/40 last:border-b-0">
                {table.headers.map((_, ci) => (
                  <td key={ci} className="border-r border-border/40 p-1 last:border-r-0">
                    <input
                      className="w-full bg-transparent px-2 py-1 text-foreground outline-none focus:bg-muted/40 rounded"
                      aria-label={`Satır ${ri + 1} değer`}
                      value={row[ci] || ''}
                      onChange={(e) => {
                        const rows = table.rows.map((r, rIdx) =>
                          rIdx === ri ? table.headers.map((__, cIdx) => (cIdx === ci ? e.target.value : r[cIdx] || '')) : r
                        );
                        onTableChange({ ...table, rows });
                      }}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center gap-2 p-2 bg-muted/30 border-t border-border/60">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[11px]"
          onClick={() => onTableChange({ ...table, rows: [...table.rows, table.headers.map(() => '')] })}
        >
          + Satır
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 text-[11px]"
          onClick={() =>
            onTableChange({
              headers: [...table.headers, 'Yeni sütun'],
              rows: table.rows.map((r) => [...r, '']),
            })
          }
        >
          + Sütun
        </Button>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 text-[11px] text-amber-700 dark:text-amber-400 hover:text-destructive ml-auto"
          onClick={onRemove}
        >
          Tabloyu kaldır
        </Button>
      </div>
    </div>
  );

  return (
    <div className="border border-border/80 rounded-xl overflow-hidden bg-card shadow-xs mb-4">
      <div className="px-4 py-3 bg-muted/40 border-b border-border/60 flex items-center gap-2.5">
        <span className="px-2 py-0.5 rounded-md bg-primary/10 text-primary font-bold text-xs whitespace-nowrap">
          {code}
        </span>
        <span className="text-sm font-semibold text-foreground leading-snug">{title}</span>
      </div>

      <div className="p-4 space-y-3">
        {/* Sistem Özel İçeriği (Örn: 2.2 GHS, 8.2 KKD, 14.3 ADR) */}
        {extraContent}

        {/* Ana açıklama alanı */}
        <Textarea
          value={data.text}
          onChange={(e) => update({ text: e.target.value })}
          placeholder="Bu alt başlıkla ilgili açıklamayı yazın…"
          className="min-h-[92px] text-xs leading-relaxed bg-background"
        />

        {/* Metin Kutuları */}
        {data.textBoxes.map((box, bi) => (
          <div key={bi} className="border border-border/70 rounded-lg bg-muted/20 p-3 space-y-2">
            <div className="flex items-center gap-2">
              <Input
                value={box.title}
                onChange={(e) => updateTextBox(bi, 'title', e.target.value)}
                placeholder="Metin kutusu başlığı (isteğe bağlı)"
                className="h-8 text-xs bg-background"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-muted-foreground hover:text-destructive shrink-0"
                onClick={() => removeTextBox(bi)}
                title="Metin kutusunu sil"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            <Textarea
              value={box.text}
              onChange={(e) => updateTextBox(bi, 'text', e.target.value)}
              placeholder="Açıklama, paragraf, uyarı veya SDS metni girin…"
              className="min-h-[95px] text-xs bg-background"
            />
          </div>
        ))}

        {/* Anahtar - Değer Çiftleri */}
        {data.rows.length > 0 && (
          <div className="space-y-2">
            {data.rows.map((row, ri) => (
              <div key={ri} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_32px] gap-2 items-center">
                <Input
                  value={row.label}
                  onChange={(e) => updatePair(ri, 'label', e.target.value)}
                  placeholder="Bilgi adı"
                  className="h-8 text-xs bg-background"
                />
                <Input
                  value={row.value}
                  onChange={(e) => updatePair(ri, 'value', e.target.value)}
                  placeholder="Değer / açıklama"
                  className="h-8 text-xs bg-background"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  onClick={() => removePair(ri)}
                  title="Satırı sil"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Tablolar */}
        {data.tables.map((t, ti) => (
          <React.Fragment key={ti}>
            {renderTableEditor(
              t,
              (nextT) => updateTable(ti, nextT),
              () => removeTable(ti)
            )}
          </React.Fragment>
        ))}

        {/* Kullanıcı Tarafından Eklenen Özel Alt Başlıklar */}
        {data.headings.map((h, hi) => (
          <div key={h.id} className="border border-border rounded-xl bg-muted/20 overflow-hidden">
            <div className="px-3 py-2.5 bg-muted/50 border-b border-border/60 flex items-center gap-2 flex-wrap">
              <span className="px-2 py-0.5 rounded bg-primary/10 text-primary text-[10px] font-bold tracking-wide whitespace-nowrap">
                ÖZEL ALT BAŞLIK
              </span>
              <Input
                value={h.title}
                onChange={(e) => updateHeading(hi, { ...h, title: e.target.value })}
                placeholder="Alt başlık adını yazın…"
                className="flex-1 min-w-[160px] h-8 text-xs font-semibold bg-background"
              />
              <div className="flex items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={hi === 0}
                  onClick={() => moveHeading(hi, -1)}
                  title="Yukarı taşı"
                >
                  <ChevronUp className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  disabled={hi === data.headings.length - 1}
                  onClick={() => moveHeading(hi, 1)}
                  title="Aşağı taşı"
                >
                  <ChevronDown className="w-3.5 h-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7 text-muted-foreground hover:text-destructive"
                  onClick={() => removeHeading(hi)}
                  title="Alt başlığı sil"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </Button>
              </div>
            </div>

            <div className="p-3 space-y-2.5">
              <Textarea
                value={h.text}
                onChange={(e) => updateHeading(hi, { ...h, text: e.target.value })}
                placeholder="Bu özel alt başlık için açıklama (isteğe bağlı)…"
                className="min-h-[68px] text-xs bg-background"
              />

              {h.rows.length > 0 && (
                <div className="space-y-1.5">
                  {h.rows.map((r, ri) => (
                    <div key={ri} className="grid grid-cols-1 sm:grid-cols-[1fr_2fr_30px] gap-2 items-center">
                      <Input
                        value={r.label}
                        onChange={(e) =>
                          updateHeading(hi, {
                            ...h,
                            rows: h.rows.map((item, idx) => (idx === ri ? { ...item, label: e.target.value } : item)),
                          })
                        }
                        placeholder="Bilgi adı"
                        className="h-8 text-xs bg-background"
                      />
                      <Input
                        value={r.value}
                        onChange={(e) =>
                          updateHeading(hi, {
                            ...h,
                            rows: h.rows.map((item, idx) => (idx === ri ? { ...item, value: e.target.value } : item)),
                          })
                        }
                        placeholder="Değer / açıklama"
                        className="h-8 text-xs bg-background"
                      />
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        onClick={() =>
                          updateHeading(hi, { ...h, rows: h.rows.filter((_, idx) => idx !== ri) })
                        }
                      >
                        <X className="w-3.5 h-3.5" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {h.textBoxes.map((b, bi) => (
                <div key={bi} className="border border-border rounded-lg p-2.5 bg-background space-y-2">
                  <div className="flex items-center gap-2">
                    <Input
                      value={b.title}
                      onChange={(e) =>
                        updateHeading(hi, {
                          ...h,
                          textBoxes: h.textBoxes.map((item, idx) =>
                            idx === bi ? { ...item, title: e.target.value } : item
                          ),
                        })
                      }
                      placeholder="Metin kutusu başlığı (isteğe bağlı)"
                      className="h-7 text-xs"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() =>
                        updateHeading(hi, {
                          ...h,
                          textBoxes: h.textBoxes.filter((_, idx) => idx !== bi),
                        })
                      }
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                  <Textarea
                    value={b.text}
                    onChange={(e) =>
                      updateHeading(hi, {
                        ...h,
                        textBoxes: h.textBoxes.map((item, idx) =>
                          idx === bi ? { ...item, text: e.target.value } : item
                        ),
                      })
                    }
                    placeholder="Açıklama veya SDS metni…"
                    className="min-h-[75px] text-xs"
                  />
                </div>
              ))}

              {h.tables.map((t, ti) => (
                <React.Fragment key={ti}>
                  {renderTableEditor(
                    t,
                    (nextT) =>
                      updateHeading(hi, {
                        ...h,
                        tables: h.tables.map((item, idx) => (idx === ti ? nextT : item)),
                      }),
                    () =>
                      updateHeading(hi, {
                        ...h,
                        tables: h.tables.filter((_, idx) => idx !== ti),
                      })
                  )}
                </React.Fragment>
              ))}

              <div className="flex flex-wrap gap-1.5 pt-1">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() => updateHeading(hi, { ...h, rows: [...h.rows, { label: '', value: '' }] })}
                >
                  + Alan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() =>
                    updateHeading(hi, {
                      ...h,
                      tables: [...h.tables, { headers: ['Parametre', 'Değer', 'Açıklama'], rows: [['', '', '']] }],
                    })
                  }
                >
                  + Tablo
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="h-7 text-[11px]"
                  onClick={() =>
                    updateHeading(hi, { ...h, textBoxes: [...h.textBoxes, { title: '', text: '' }] })
                  }
                >
                  + Metin kutusu
                </Button>
              </div>
            </div>
          </div>
        ))}

        {/* Alt başlık aksiyon araç çubuğu */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={() => addPair()}>
            <Plus className="w-3 h-3 mr-1" />
            Alan
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={addTable}>
            <Table2 className="w-3 h-3 mr-1" />
            Tablo
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={addTextBox}>
            <FileText className="w-3 h-3 mr-1" />
            Metin kutusu
          </Button>
          <Button type="button" variant="outline" size="sm" className="h-7 text-[11px]" onClick={addHeading}>
            <Heading2 className="w-3 h-3 mr-1" />
            Alt başlık
          </Button>
        </div>

        {/* Önerilen veri başlıkları (Chips) */}
        {suggest.length > 0 && (
          <details className="border-t border-dashed border-border/70 pt-2.5">
            <summary className="text-[11px] text-muted-foreground cursor-pointer select-none hover:text-foreground">
              Önerilen veri başlıkları ({suggest.length})
            </summary>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {suggest.map((label) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => addPair(label)}
                  className="px-2.5 py-1 rounded-full border border-border bg-background hover:border-primary hover:text-primary text-[11px] text-muted-foreground transition-colors"
                >
                  + {label}
                </button>
              ))}
            </div>
          </details>
        )}
      </div>
    </div>
  );
};
