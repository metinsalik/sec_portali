import React from 'react';
import type { Finding } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';

// Custom TipTap Editor Component
const RichTextEditor = ({ content, onChange, placeholder }: { content: string, onChange: (html: string) => void, placeholder?: string }) => {
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
        class: 'min-h-[150px] p-4 outline-none [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:text-xl [&_h2]:font-bold',
      },
    },
  });

  if (!editor) return null;

  return (
    <div className="border border-slate-200 rounded-lg overflow-hidden bg-white dark:bg-slate-900 dark:border-slate-700">
      <div className="bg-slate-50 border-b border-slate-200 p-2 flex flex-wrap gap-2 dark:bg-slate-800 dark:border-slate-700">
        <button onClick={() => editor.chain().focus().toggleBold().run()} className={`p-1.5 rounded ${editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}><b>B</b></button>
        <button onClick={() => editor.chain().focus().toggleItalic().run()} className={`p-1.5 rounded ${editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}><i>I</i></button>
        <button onClick={() => editor.chain().focus().toggleUnderline().run()} className={`p-1.5 rounded ${editor.isActive('underline') ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}><u>U</u></button>
        <div className="w-px h-6 bg-slate-300 dark:bg-slate-600 mx-1"></div>
        <button onClick={() => editor.chain().focus().toggleBulletList().run()} className={`p-1.5 rounded text-sm font-medium ${editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>• Liste</button>
        <button onClick={() => editor.chain().focus().toggleOrderedList().run()} className={`p-1.5 rounded text-sm font-medium ${editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700 text-blue-600' : 'hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300'}`}>1. Liste</button>
      </div>
      <div className="text-slate-800 dark:text-slate-200">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
};

export default function AnalysisTab({ findings, auditMeta, setAuditMeta }: { findings: Finding[], auditMeta: any, setAuditMeta: any }) {
  
  // Calculate stats
  const totalFindings = findings.length;
  const newFindings = findings.filter(f => f.status === 'Yeni Tespit Edilen').length;
  const carryOverFindings = totalFindings - newFindings;
  const closedFindings = findings.filter(f => f.status === 'Tamamlanan').length;
  const openFindings = totalFindings - closedFindings;
  const criticalOpen = findings.filter(f => f.status !== 'Tamamlanan' && ['Tolere Edilemez Risk', 'Yüksek Risk'].includes(f.risk)).length;

  // Risk Distribution Data
  const riskCounts = findings.reduce((acc, f) => {
    acc[f.risk] = (acc[f.risk] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
  
  const riskData = [
    { name: 'Çok Yüksek', value: riskCounts['Tolere Edilemez Risk'] || 0, color: '#991b1b' },
    { name: 'Yüksek', value: riskCounts['Yüksek Risk'] || 0, color: '#ef4444' },
    { name: 'Önemli', value: riskCounts['Önemli Risk'] || 0, color: '#f97316' },
    { name: 'Olası', value: riskCounts['Olası Risk'] || 0, color: '#eab308' },
    { name: 'Önemsiz', value: riskCounts['Önemsiz'] || 0, color: '#22c55e' }
  ].filter(d => d.value > 0);

  // Status Distribution Data
  const statusCounts = findings.reduce((acc, f) => {
    acc[f.status] = (acc[f.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const statusData = [
    { name: 'Yeni Tespit Edilen', value: statusCounts['Yeni Tespit Edilen'] || 0, color: '#3b82f6' },
    { name: 'İyileştirilmeyen', value: statusCounts['İyileştirilmeyen'] || 0, color: '#ef4444' },
    { name: 'Kısmen İyileştirilen', value: statusCounts['Kısmen İyileştirilen'] || 0, color: '#f97316' },
    { name: 'Tamamlanan', value: statusCounts['Tamamlanan'] || 0, color: '#10b981' }
  ].filter(d => d.value > 0);

  // Process Distribution (Categories)
  const processData = Object.entries(findings.reduce((acc, f) => {
    acc[f.category] = (acc[f.category] || 0) + 1;
    return acc;
  }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);

  // Department Distribution
  const deptData = Object.entries(findings.reduce((acc, f) => {
    if (f.steps && f.steps.length > 0) {
      const depts = new Set(f.steps.map(s => s.department));
      depts.forEach(d => acc[d] = (acc[d] || 0) + 1);
    }
    return acc;
  }, {} as Record<string, number>)).sort((a, b) => b[1] - a[1]);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Analiz ve Özet</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400">Risk, süreç ve kapanış dağılımlarını değerlendirin; yönetici özeti ile sonucu son haline getirin.</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-800 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-blue-500"></div>
          <div className="text-sm font-semibold text-slate-500 mb-1 dark:text-slate-400">Toplam İzlenen</div>
          <div className="text-3xl font-black text-slate-800 mb-1 dark:text-white">{totalFindings}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Devreden + yeni bulgular</div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="font-bold text-slate-700 dark:text-slate-300">{carryOverFindings}</div>
            <div className="text-xs text-slate-500">Önceki rapordan devreden</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-800 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-orange-400"></div>
          <div className="text-sm font-semibold text-slate-500 mb-1 dark:text-slate-400">Bu Denetimde Açılan</div>
          <div className="text-3xl font-black text-slate-800 mb-1 dark:text-white">{newFindings}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Yeni bulgu kaydı</div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="font-bold text-slate-700 dark:text-slate-300">{newFindings}</div>
            <div className="text-xs text-slate-500">Açılış raporu mevcut denetim</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-800 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500"></div>
          <div className="text-sm font-semibold text-slate-500 mb-1 dark:text-slate-400">Bu Denetimde Kapanan</div>
          <div className="text-3xl font-black text-slate-800 mb-1 dark:text-white">{closedFindings}</div>
          <div className="text-xs text-slate-400 dark:text-slate-500">Kapanış denetimi kaydedildi</div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="font-bold text-slate-700 dark:text-slate-300">{closedFindings}</div>
            <div className="text-xs text-slate-500">Bu denetimde kapanan</div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm dark:bg-slate-800 dark:border-slate-700 relative overflow-hidden">
          <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-red-500"></div>
          <div className="text-sm font-semibold text-slate-500 mb-1 dark:text-slate-400">Halen Açık</div>
          <div className="text-3xl font-black text-slate-800 mb-1 dark:text-white">{openFindings}</div>
          <div className="text-xs text-red-500 font-medium">{criticalOpen} kritik açık bulgu</div>
          <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-700">
            <div className="font-bold text-slate-700 dark:text-slate-300">{openFindings}</div>
            <div className="text-xs text-slate-500">Sonraki denetime devredecek</div>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 mb-6 dark:text-white">Risk Düzeyi Dağılımı</h3>
          <div className="flex items-center h-48">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={riskData.length ? riskData : [{value: 1, color: '#e2e8f0', name: 'Veri Yok'}]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(riskData.length ? riskData : [{value: 1, color: '#e2e8f0'}]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{totalFindings}</span>
                <span className="text-[10px] font-bold text-slate-400">TOPLAM</span>
              </div>
            </div>
            <div className="w-1/2 pl-6 space-y-3 border-l border-slate-100 dark:border-slate-700">
              {riskData.length === 0 && <span className="text-sm text-slate-500">Henüz bulgu eklenmedi.</span>}
              {riskData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 mb-6 dark:text-white">İyileştirme Durumu Dağılımı</h3>
          <div className="flex items-center h-48">
            <div className="w-1/2 h-full relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData.length ? statusData : [{value: 1, color: '#e2e8f0', name: 'Veri Yok'}]}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {(statusData.length ? statusData : [{value: 1, color: '#e2e8f0'}]).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-2xl font-black text-slate-800 dark:text-white">{totalFindings}</span>
                <span className="text-[10px] font-bold text-slate-400">TOPLAM</span>
              </div>
            </div>
            <div className="w-1/2 pl-6 space-y-3 border-l border-slate-100 dark:border-slate-700">
              {statusData.length === 0 && <span className="text-sm text-slate-500">Henüz bulgu eklenmedi.</span>}
              {statusData.map((d, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: d.color }}></span>
                    <span className="text-sm text-slate-600 dark:text-slate-300">{d.name}</span>
                  </div>
                  <span className="font-bold text-slate-800 dark:text-white">{d.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bars Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 mb-6 dark:text-white">Süreçlere Göre Bulgular</h3>
          <div className="space-y-4">
            {processData.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Veri yok.</p>}
            {processData.map(([name, val], i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{val}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-700 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(val / totalFindings) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
          <h3 className="text-base font-bold text-slate-800 mb-6 dark:text-white">İlgili Birimlere Göre Bulgular</h3>
          <div className="space-y-4">
            {deptData.map(([name, val], i) => (
              <div key={i}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="font-semibold text-slate-700 dark:text-slate-300">{name}</span>
                  <span className="font-bold text-slate-900 dark:text-white">{val}</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 dark:bg-slate-700 overflow-hidden">
                  <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(val / Math.max(...deptData.map(d=>d[1]))) * 100}%` }}></div>
                </div>
              </div>
            ))}
            {deptData.length === 0 && <p className="text-sm text-slate-500 text-center py-4">Birim atanmış bulgu yok.</p>}
          </div>
        </div>
      </div>

      {/* Editor Areas */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-800 mb-2 dark:text-white">Yönetici Özeti</h3>
        <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">Denetim sürecinin genel görünümü, kritik sorunlar ve acil eylem önerilerini yazın.</p>
        <RichTextEditor 
          content={auditMeta.executiveSummary || ''} 
          onChange={(html) => setAuditMeta({...auditMeta, executiveSummary: html})} 
        />
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm dark:bg-slate-800 dark:border-slate-700">
        <h3 className="text-base font-bold text-slate-800 mb-2 dark:text-white">Genel Değerlendirme ve Sonuç</h3>
        <p className="text-sm text-slate-500 mb-4 dark:text-slate-400">Denetimin son kapanış değerlendirmesi ve tesise verilen tavsiyeleri buraya ekleyebilirsiniz.</p>
        <RichTextEditor 
          content={auditMeta.generalConclusion || ''} 
          onChange={(html) => setAuditMeta({...auditMeta, generalConclusion: html})} 
        />
      </div>

    </div>
  );
}
