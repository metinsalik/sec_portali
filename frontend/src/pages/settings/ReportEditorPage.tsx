import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Save, ArrowLeft, Loader2, Settings, Monitor, 
  FileText, Type, Table as TableIcon, Image as ImageIcon,
  ChevronRight, CheckCircle2, Info, Layout, Layers,
  Printer, FileSpreadsheet, Download, X, Bold, Italic, 
  List, ListOrdered, Minus, Columns, Rows, PlusSquare, 
  Trash, Trash2, PlusCircle, AlignLeft, AlignCenter, 
  AlignRight, PlusCircle as PlusCircleIcon, MinusCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// Tiptap Imports
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Underline } from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';

interface ReportTemplate {
  id: number;
  code: string;
  name: string;
  version: number;
  isActive: boolean;
  module: string;
  documentNo: string;
  revisionNo: string;
  releaseDate: string;
  content: any;
  orientation: 'PORTRAIT' | 'LANDSCAPE';
}

const EditorToolbar = ({ editor }: { editor: any }) => {
  if (!editor) return null;

  return (
    <div className="flex flex-wrap items-center gap-1 p-2 border-b border-[#e2e8f0] bg-white sticky top-0 z-10">
      <div className="flex items-center gap-1 bg-[#f8f9fa] rounded-md p-0.5 border border-[#e2e8f0]">
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(editor.isActive('bold') && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <Bold className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(editor.isActive('italic') && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <Italic className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn(editor.isActive('underline') && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <Type className="w-4 h-4 underline" />
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-[#f8f9fa] rounded-md p-0.5 border border-[#e2e8f0]">
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn(editor.isActive({ textAlign: 'left' }) && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <AlignLeft className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn(editor.isActive({ textAlign: 'center' }) && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <AlignCenter className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn(editor.isActive({ textAlign: 'right' }) && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <AlignRight className="w-4 h-4" />
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-[#f8f9fa] rounded-md p-0.5 border border-[#e2e8f0]">
        <Button 
          variant="ghost" size="sm" 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn(editor.isActive('heading', { level: 1 }) && 'bg-white shadow-sm text-[#0f172a]')}
        >
          H1
        </Button>
        <Button 
          variant="ghost" size="sm" 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(editor.isActive('heading', { level: 2 }) && 'bg-white shadow-sm text-[#0f172a]')}
        >
          H2
        </Button>
      </div>

      <div className="flex items-center gap-1 bg-[#f8f9fa] rounded-md p-0.5 border border-[#e2e8f0]">
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(editor.isActive('bulletList') && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <List className="w-4 h-4" />
        </Button>
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(editor.isActive('orderedList') && 'bg-white shadow-sm text-[#0f172a]')}
        >
          <ListOrdered className="w-4 h-4" />
        </Button>
      </div>

      <div className="w-px h-6 bg-[#e2e8f0] mx-1" />

      <div className="flex items-center gap-1 bg-[#f8f9fa] rounded-md p-0.5 border border-[#e2e8f0]">
        <Button 
          variant="ghost" size="icon-sm" 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Tablo Ekle"
        >
          <TableIcon className="w-4 h-4" />
        </Button>
        
        {editor.isActive('table') && (
          <>
            <div className="w-px h-4 bg-[#e2e8f0] mx-1" />
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Sütun Ekle">
              <Columns className="w-3.5 h-3.5 text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().addRowAfter().run()} title="Satır Ekle">
              <Rows className="w-3.5 h-3.5 text-blue-600" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().mergeCells().run()} title="Hücreleri Birleştir">
              <PlusCircle className="w-3.5 h-3.5 text-orange-600" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().splitCell().run()} title="Hücreyi Ayır">
              <MinusCircle className="w-3.5 h-3.5 text-orange-600" />
            </Button>
            <Button variant="ghost" size="icon-sm" onClick={() => editor.chain().focus().deleteTable().run()} title="Tabloyu Sil">
              <Trash className="w-3.5 h-3.5 text-red-500" />
            </Button>
          </>
        )}
      </div>

      <div className="flex-1" />
      <Badge variant="outline" className="text-[10px] font-mono opacity-50 border-[#e2e8f0]">TIPTAP PRO</Badge>
    </div>
  );
};

const ReportEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [orientation, setOrientation] = useState<'PORTRAIT' | 'LANDSCAPE'>('PORTRAIT');
  const [isExporting, setIsExporting] = useState(false);

  const { data: template, isLoading } = useQuery<ReportTemplate>({
    queryKey: ['report-template', id],
    queryFn: async () => {
      const res = await api.get(`/settings/report-templates/${id}`);
      if (!res.ok) throw new Error('Yüklenemedi');
      return res.json();
    },
  });

  const editor = useEditor({
    extensions: [
      StarterKit,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      Underline,
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Highlight,
    ],
    content: '',
    editorProps: {
      attributes: {
        class: 'prose prose-sm focus:outline-none max-w-none min-h-[1123px] p-24 bg-white report-container',
      },
    },
  });

  useEffect(() => {
    if (template && editor) {
      // Handle empty or invalid content safely
      const initialContent = (template.content && Object.keys(template.content).length > 0) 
        ? template.content 
        : { type: 'doc', content: [{ type: 'paragraph', content: [{ type: 'text', text: 'Rapor içeriğinizi buraya yazın...' }] }] };
      
      editor.commands.setContent(initialContent);
      setOrientation(template.orientation);
    }
  }, [template, editor]);

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await api.put(`/settings/report-templates/${id}`, data);
      if (!res.ok) throw new Error('Güncellenemedi');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['report-template', id] });
      queryClient.invalidateQueries({ queryKey: ['report-templates'] });
      toast.success('Rapor şablonu başarıyla kaydedildi.');
    }
  });

  const handleSave = () => {
    if (!editor) return;
    const form = document.getElementById('report-meta-form') as HTMLFormElement;
    const formData = new FormData(form);

    updateMutation.mutate({
      name: formData.get('name'),
      documentNo: formData.get('documentNo'),
      revisionNo: formData.get('revisionNo'),
      orientation,
      content: editor.getJSON(),
    });
  };

  const handleExportPDF = async () => {
    if (!editor) return;
    setIsExporting(true);
    try {
      const element = document.querySelector('.report-container') as HTMLElement;
      if (!element) return;

      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff', // Explicit background for html2canvas
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: orientation === 'PORTRAIT' ? 'p' : 'l',
        unit: 'mm',
        format: 'a4'
      });

      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`${template?.name || 'rapor'}.pdf`);
      toast.success('PDF başarıyla oluşturuldu.');
    } catch (error) {
      console.error(error);
      toast.error('PDF oluşturulurken bir hata oluştu.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportExcel = () => {
    try {
      const tables = document.querySelectorAll('.report-container table');
      if (tables.length === 0) {
        toast.error('Raporda dışa aktarılacak tablo bulunamadı.');
        return;
      }

      const wb = XLSX.utils.book_new();
      tables.forEach((table, index) => {
        const ws = XLSX.utils.table_to_sheet(table as HTMLTableElement);
        XLSX.utils.book_append_sheet(wb, ws, `Tablo ${index + 1}`);
      });

      XLSX.writeFile(wb, `${template?.name || 'rapor'}.xlsx`);
      toast.success('Excel başarıyla oluşturuldu.');
    } catch (error) {
      toast.error('Excel oluşturulurken bir hata oluştu.');
    }
  };

  if (isLoading || !editor) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen -m-6 bg-[#f8f9fa]">
      <style>{`
        .report-container table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
          border: 2px solid #444444;
        }
        .report-container td, .report-container th {
          min-width: 1em;
          border: 1px solid #666666;
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          text-align: left;
        }
        .report-container th {
          background-color: #f1f5f9;
          font-weight: bold;
        }
        .report-container .column-resizer {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: #3b82f6;
          cursor: col-resize;
          z-index: 20;
          opacity: 0;
          transition: opacity 0.2s;
        }
        .report-container table:hover .column-resizer {
          opacity: 0.5;
        }
        .report-container .column-resizer:hover {
          opacity: 1 !important;
        }
        .report-container hr {
          border: none;
          border-top: 2px solid #cccccc;
          margin: 2rem 0;
        }
        .report-container p {
          margin-bottom: 1rem;
        }
        .report-container .selectedCell:after {
          z-index: 2;
          content: "";
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          background: rgba(200, 200, 255, 0.4);
          pointer-events: none;
        }
      `}</style>
      
      {/* Top Header */}
      <header className="h-14 bg-white border-b border-[#e2e8f0] flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" onClick={() => navigate('/settings/reports')} className="text-[#64748b]">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Geri
          </Button>
          <div className="h-4 w-px bg-[#e2e8f0]" />
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#1e293b]">{template?.name}</span>
            <Badge variant="secondary" className="text-[10px] bg-[#f1f5f9] text-[#475569]">V{template?.version}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" className="gap-2 border-[#e2e8f0] text-[#475569]" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Printer className="w-4 h-4" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" className="gap-2 border-[#e2e8f0] text-[#475569]" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-4 h-4" />
            Excel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="gap-2 px-6 bg-[#0f172a] text-white hover:bg-[#1e293b]">
            {updateMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Şablonu Kaydet
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Config */}
        <aside className="w-80 border-r border-[#e2e8f0] bg-white flex flex-col shrink-0 overflow-y-auto p-6 space-y-6">
          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#0f172a]">
              <Settings className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Kalite Metadataları</h3>
            </div>
            <form key={template?.id} id="report-meta-form" className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-[#64748b]">Şablon Adı</Label>
                <Input name="name" defaultValue={template?.name} className="h-8 text-sm border-[#e2e8f0]" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-[#64748b]">Doküman No</Label>
                <Input name="documentNo" defaultValue={template?.documentNo} className="h-8 text-sm border-[#e2e8f0]" placeholder="Örn: ISG-FR-01" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-[10px] uppercase text-[#64748b]">Revizyon No</Label>
                <Input name="revisionNo" defaultValue={template?.revisionNo} className="h-8 text-sm border-[#e2e8f0]" placeholder="00" />
              </div>
            </form>
          </section>

          <div className="h-px bg-[#e2e8f0]" />

          <section className="space-y-4">
            <div className="flex items-center gap-2 text-[#0f172a]">
              <Layout className="w-4 h-4" />
              <h3 className="font-semibold text-sm">Sayfa Düzeni</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={orientation === 'PORTRAIT' ? 'default' : 'outline'} 
                className={cn(
                  "h-20 flex-col gap-2 border-[#e2e8f0]",
                  orientation === 'PORTRAIT' ? "bg-[#0f172a] text-white" : "text-[#475569]"
                )}
                onClick={() => setOrientation('PORTRAIT')}
              >
                <div className="w-6 h-8 border-2 border-current rounded-sm opacity-50" />
                <span className="text-[10px]">Dikey (A4)</span>
              </Button>
              <Button 
                variant={orientation === 'LANDSCAPE' ? 'default' : 'outline'} 
                className={cn(
                  "h-20 flex-col gap-2 border-[#e2e8f0]",
                  orientation === 'LANDSCAPE' ? "bg-[#0f172a] text-white" : "text-[#475569]"
                )}
                onClick={() => setOrientation('LANDSCAPE')}
              >
                <div className="w-8 h-6 border-2 border-current rounded-sm opacity-50" />
                <span className="text-[10px]">Yatay (A4)</span>
              </Button>
            </div>
          </section>

          <div className="h-px bg-[#e2e8f0]" />

          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[#0f172a]">
                <Layers className="w-4 h-4" />
                <h3 className="font-semibold text-sm">Dinamik Alanlar</h3>
              </div>
              <Badge variant="outline" className="text-[10px] border-[#e2e8f0] text-[#64748b]">İpucu</Badge>
            </div>
            <div className="grid grid-cols-1 gap-2">
              {[
                { label: 'Tesis Adı', code: '{{facility_name}}' },
                { label: 'Rapor Dönemi', code: '{{report_period}}' },
                { label: 'Oluşturan', code: '{{created_by}}' },
                { label: 'Logo', code: '{{company_logo}}' },
              ].map((v) => (
                <button 
                  key={v.code}
                  onClick={() => editor.chain().focus().insertContent(v.code).run()}
                  className="flex items-center justify-between p-2 rounded border border-[#e2e8f0] bg-[#f8f9fa] hover:bg-[#f1f5f9] text-left transition-colors group"
                >
                  <span className="text-xs font-medium text-[#1e293b]">{v.label}</span>
                  <code className="text-[9px] bg-white px-1 rounded border border-[#e2e8f0] opacity-0 group-hover:opacity-100 transition-opacity">{v.code}</code>
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Editor Main Area */}
        <main className="flex-1 overflow-y-auto bg-[#f1f5f9] p-12 flex justify-center">
          <div className={cn(
            "transition-all duration-300 origin-top bg-white shadow-[0_0_50px_rgba(0,0,0,0.1)] text-black",
            orientation === 'PORTRAIT' ? "w-[794px]" : "w-[1123px]"
          )}>
            <div className="sticky top-0 z-30 shadow-sm bg-white">
              <EditorToolbar editor={editor} />
            </div>
            <div className="p-0 min-h-full bg-white">
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportEditorPage;
