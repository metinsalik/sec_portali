import React from 'react';
import { type Finding, RISK_COLORS, RISK_LEVELS, normalizeRiskLevel } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Custom TipTap Editor Component
const RichTextEditor = ({
  content,
  onChange,
}: {
  content: string;
  onChange: (html: string) => void;
}) => {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class:
          'min-h-[150px] p-4 outline-none text-sm text-foreground [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h1]:text-xl [&_h1]:font-bold [&_h2]:text-lg [&_h2]:font-bold',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring transition-all duration-200">
      <div className="bg-muted/40 border-b border-border p-1.5 flex flex-wrap items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bold') ? 'secondary' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBold().run()}
          className="h-7 px-2.5 text-xs font-bold"
        >
          B
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('italic') ? 'secondary' : 'ghost'}
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className="h-7 px-2.5 text-xs italic"
        >
          I
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('underline') ? 'secondary' : 'ghost'}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className="h-7 px-2.5 text-xs underline"
        >
          U
        </Button>
        <div className="w-px h-5 bg-border mx-1" />
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('bulletList') ? 'secondary' : 'ghost'}
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className="h-7 px-2.5 text-xs"
        >
          • Liste
        </Button>
        <Button
          type="button"
          size="sm"
          variant={editor.isActive('orderedList') ? 'secondary' : 'ghost'}
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className="h-7 px-2.5 text-xs"
        >
          1. Liste
        </Button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
};

export default function AnalysisTab({
  findings,
  auditMeta,
  setAuditMeta,
}: {
  findings: Finding[];
  auditMeta: any;
  setAuditMeta: any;
}) {
  const totalFindings = findings.length;
  const newFindings = findings.filter((f) => f.status === 'Yeni Tespit Edilen').length;
  const carryOverFindings = totalFindings - newFindings;
  const closedFindings = findings.filter((f) => f.status === 'Tamamlanan').length;
  const openFindings = totalFindings - closedFindings;
  const criticalOpen = findings.filter(
    (f) =>
      f.status !== 'Tamamlanan' &&
      ['Kritik', 'Yüksek'].includes(normalizeRiskLevel(f.risk))
  ).length;

  const riskCounts = findings.reduce((acc, f) => {
    const key = normalizeRiskLevel(f.risk);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const riskData = RISK_LEVELS.map((level) => ({
    name: level,
    value: riskCounts[level] || 0,
    color: RISK_COLORS[level],
  })).filter((d) => d.value > 0);

  const statusCounts = findings.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: 'Yeni Tespit Edilen', value: statusCounts['Yeni Tespit Edilen'] || 0, color: '#3b82f6' },
    { name: 'İyileştirilmeyen', value: statusCounts['İyileştirilmeyen'] || 0, color: '#ef4444' },
    { name: 'Kısmen İyileştirilen', value: statusCounts['Kısmen İyileştirilen'] || 0, color: '#f97316' },
    { name: 'Tamamlanan', value: statusCounts['Tamamlanan'] || 0, color: '#10b981' },
  ].filter((d) => d.value > 0);

  const processData = Object.entries(
    findings.reduce((acc, f) => {
      const cat = f.category || 'Belirtilmemiş';
      acc[cat] = (acc[cat] || 0) + 1;
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const deptData = Object.entries(
    findings.reduce((acc, f) => {
      if (f.steps && f.steps.length > 0) {
        const depts = new Set(f.steps.map((s) => s.department));
        depts.forEach((d) => (acc[d] = (acc[d] || 0) + 1));
      }
      return acc;
    }, {} as Record<string, number>)
  ).sort((a, b) => b[1] - a[1]);

  const maxDeptVal = deptData.length > 0 ? Math.max(...deptData.map((d) => d[1])) : 1;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-bold tracking-tight text-foreground">Analiz ve Özet</h2>
        <p className="text-sm text-muted-foreground">
          Risk, süreç ve kapanış dağılımlarını değerlendirin; yönetici özeti ile sonucu son haline getirin.
        </p>
      </div>

      {/* Özet Kartları */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-blue-500" />
            <p className="text-xs font-medium text-muted-foreground">Toplam İzlenen</p>
            <p className="text-3xl font-bold tabular-nums text-foreground mt-1">{totalFindings}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Devreden + yeni bulgular</p>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-sm font-semibold tabular-nums text-foreground">{carryOverFindings}</div>
              <div className="text-xs text-muted-foreground">Önceki rapordan devreden</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-amber-500" />
            <p className="text-xs font-medium text-muted-foreground">Bu Denetimde Açılan</p>
            <p className="text-3xl font-bold tabular-nums text-foreground mt-1">{newFindings}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Yeni bulgu kaydı</p>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-sm font-semibold tabular-nums text-foreground">{newFindings}</div>
              <div className="text-xs text-muted-foreground">Açılış raporu mevcut denetim</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <p className="text-xs font-medium text-muted-foreground">Bu Denetimde Kapanan</p>
            <p className="text-3xl font-bold tabular-nums text-foreground mt-1">{closedFindings}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Kapanış denetimi kaydedildi</p>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-sm font-semibold tabular-nums text-foreground">{closedFindings}</div>
              <div className="text-xs text-muted-foreground">Bu denetimde kapanan</div>
            </div>
          </CardContent>
        </Card>

        <Card className="relative overflow-hidden">
          <CardContent className="p-5">
            <span className="absolute top-4 right-4 w-2.5 h-2.5 rounded-full bg-red-500" />
            <p className="text-xs font-medium text-muted-foreground">Halen Açık</p>
            <p className="text-3xl font-bold tabular-nums text-foreground mt-1">{openFindings}</p>
            <p className="text-xs text-red-600 dark:text-red-400 font-medium mt-0.5">
              {criticalOpen} kritik açık bulgu
            </p>
            <div className="mt-4 pt-3 border-t border-border">
              <div className="text-sm font-semibold tabular-nums text-foreground">{openFindings}</div>
              <div className="text-xs text-muted-foreground">Sonraki denetime devredecek</div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Grafikler */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Risk Düzeyi Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center h-48">
              <div className="w-1/2 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={riskData.length ? riskData : [{ value: 1, color: '#e2e8f0', name: 'Veri Yok' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(riskData.length ? riskData : [{ value: 1, color: '#e2e8f0' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{totalFindings}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">TOPLAM</span>
                </div>
              </div>
              <div className="w-1/2 pl-5 space-y-2.5 border-l border-border">
                {riskData.length === 0 && (
                  <span className="text-xs text-muted-foreground">Henüz bulgu eklenmedi.</span>
                )}
                {riskData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">İyileştirme Durumu Dağılımı</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center h-48">
              <div className="w-1/2 h-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusData.length ? statusData : [{ value: 1, color: '#e2e8f0', name: 'Veri Yok' }]}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={78}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {(statusData.length ? statusData : [{ value: 1, color: '#e2e8f0' }]).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-bold tabular-nums text-foreground">{totalFindings}</span>
                  <span className="text-[10px] font-semibold text-muted-foreground">TOPLAM</span>
                </div>
              </div>
              <div className="w-1/2 pl-5 space-y-2.5 border-l border-border">
                {statusData.length === 0 && (
                  <span className="text-xs text-muted-foreground">Henüz bulgu eklenmedi.</span>
                )}
                {statusData.map((d, i) => (
                  <div key={i} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: d.color }} />
                      <span className="text-muted-foreground">{d.name}</span>
                    </div>
                    <span className="font-semibold tabular-nums text-foreground">{d.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dağılım Çubukları */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Süreçlere Göre Bulgular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {processData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Veri yok.</p>
            )}
            {processData.map(([name, val], i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="font-semibold tabular-nums text-foreground">{val}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-200"
                    style={{ width: `${totalFindings > 0 ? (val / totalFindings) * 100 : 0}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">İlgili Birimlere Göre Bulgular</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3.5">
            {deptData.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">Birim atanmış bulgu yok.</p>
            )}
            {deptData.map(([name, val], i) => (
              <div key={i} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-medium text-foreground">{name}</span>
                  <span className="font-semibold tabular-nums text-foreground">{val}</span>
                </div>
                <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-primary h-2 rounded-full transition-all duration-200"
                    style={{ width: `${(val / maxDeptVal) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Editör Alanları */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Yönetici Özeti</CardTitle>
          <CardDescription>
            Denetim sürecinin genel görünümü, kritik sorunlar ve acil eylem önerilerini yazın.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={auditMeta.executiveSummary || ''}
            onChange={(html) => setAuditMeta({ ...auditMeta, executiveSummary: html })}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Genel Değerlendirme ve Sonuç</CardTitle>
          <CardDescription>
            Denetimin son kapanış değerlendirmesi ve tesise verilen tavsiyeleri buraya ekleyebilirsiniz.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <RichTextEditor
            content={auditMeta.generalConclusion || ''}
            onChange={(html) => setAuditMeta({ ...auditMeta, generalConclusion: html })}
          />
        </CardContent>
      </Card>
    </div>
  );
}
