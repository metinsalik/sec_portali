import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { 
  Save, ArrowLeft, Loader2, Settings, 
  FileText, Type, Table as TableIcon,
  Printer, FileSpreadsheet, Bold, Italic, 
  List, ListOrdered, Columns, Rows,
  Trash, PlusCircle, AlignLeft, AlignCenter, 
  AlignRight, MinusCircle, Layout, Layers
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
    <div className="flex flex-wrap items-center gap-1.5 p-2 border-b border-border/60 bg-card sticky top-0 z-10">
      <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/60">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive('bold') && 'bg-background shadow-xs text-foreground font-bold')}
        >
          <Bold className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive('italic') && 'bg-background shadow-xs text-foreground')}
        >
          <Italic className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive('underline') && 'bg-background shadow-xs text-foreground')}
        >
          <Type className="w-3.5 h-3.5 underline" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/60">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive({ textAlign: 'left' }) && 'bg-background shadow-xs text-foreground')}
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive({ textAlign: 'center' }) && 'bg-background shadow-xs text-foreground')}
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive({ textAlign: 'right' }) && 'bg-background shadow-xs text-foreground')}
        >
          <AlignRight className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/60">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
          className={cn("h-7 px-2 text-xs rounded-sm", editor.isActive('heading', { level: 1 }) && 'bg-background shadow-xs text-foreground font-semibold')}
        >
          H1
        </Button>
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn("h-7 px-2 text-xs rounded-sm", editor.isActive('heading', { level: 2 }) && 'bg-background shadow-xs text-foreground font-semibold')}
        >
          H2
        </Button>
      </div>

      <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/60">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive('bulletList') && 'bg-background shadow-xs text-foreground')}
        >
          <List className="w-3.5 h-3.5" />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn("h-7 w-7 rounded-sm", editor.isActive('orderedList') && 'bg-background shadow-xs text-foreground')}
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </Button>
      </div>

      <div className="w-px h-5 bg-border/60 mx-0.5" />

      <div className="flex items-center gap-0.5 bg-muted/40 rounded-md p-0.5 border border-border/60">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
          title="Tablo Ekle"
          className="h-7 w-7 rounded-sm"
        >
          <TableIcon className="w-3.5 h-3.5" />
        </Button>
        
        {editor.isActive('table') && (
          <>
            <div className="w-px h-3.5 bg-border/60 mx-0.5" />
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().addColumnAfter().run()} title="Sütun Ekle" className="h-7 w-7 rounded-sm">
              <Columns className="w-3.5 h-3.5 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().addRowAfter().run()} title="Satır Ekle" className="h-7 w-7 rounded-sm">
              <Rows className="w-3.5 h-3.5 text-primary" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().mergeCells().run()} title="Hücreleri Birleştir" className="h-7 w-7 rounded-sm">
              <PlusCircle className="w-3.5 h-3.5 text-amber-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().splitCell().run()} title="Hücreyi Ayır" className="h-7 w-7 rounded-sm">
              <MinusCircle className="w-3.5 h-3.5 text-amber-500" />
            </Button>
            <Button variant="ghost" size="icon" onClick={() => editor.chain().focus().deleteTable().run()} title="Tabloyu Sil" className="h-7 w-7 rounded-sm text-destructive hover:bg-destructive/10">
              <Trash className="w-3.5 h-3.5" />
            </Button>
          </>
        )}
      </div>

      <div className="flex-1" />
      <Badge variant="outline" className="text-[10px] font-mono opacity-60 rounded-md border-border/60">TIPTAP PRO</Badge>
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
        class: 'prose prose-sm focus:outline-none max-w-none min-h-[1123px] p-20 bg-card text-card-foreground report-container',
      },
    },
  });

  useEffect(() => {
    if (template && editor) {
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
        backgroundColor: '#ffffff',
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
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen -m-6 bg-background">
      <style>{`
        .report-container table {
          border-collapse: collapse;
          table-layout: fixed;
          width: 100%;
          margin: 1rem 0;
          overflow: hidden;
          border: 1.5px solid hsl(var(--border));
        }
        .report-container td, .report-container th {
          min-width: 1em;
          border: 1px solid hsl(var(--border));
          padding: 8px 12px;
          vertical-align: top;
          box-sizing: border-box;
          position: relative;
          text-align: left;
        }
        .report-container th {
          background-color: hsl(var(--muted));
          font-weight: 600;
        }
        .report-container .column-resizer {
          position: absolute;
          right: -2px;
          top: 0;
          bottom: 0;
          width: 4px;
          background-color: hsl(var(--primary));
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
          border-top: 1px solid hsl(var(--border));
          margin: 2rem 0;
        }
        .report-container p {
          margin-bottom: 0.75rem;
        }
        .report-container .selectedCell:after {
          z-index: 2;
          content: "";
          position: absolute;
          left: 0; right: 0; top: 0; bottom: 0;
          background: hsl(var(--primary) / 0.15);
          pointer-events: none;
        }
      `}</style>
      
      {/* Top Header */}
      <header className="h-14 bg-card border-b border-border/60 flex items-center justify-between px-6 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/settings/reports')} 
            className="h-8 text-xs rounded-md text-muted-foreground hover:text-foreground gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Geri
          </Button>
          <div className="h-4 w-px bg-border/60" />
          <div className="flex items-center gap-2">
            <span className="font-semibold text-sm text-foreground">{template?.name}</span>
            <Badge variant="secondary" className="text-[10px] rounded-md font-normal py-0 px-1.5">V{template?.version}</Badge>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-md gap-1.5" onClick={handleExportPDF} disabled={isExporting}>
            {isExporting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Printer className="w-3.5 h-3.5" />}
            PDF
          </Button>
          <Button variant="outline" size="sm" className="h-8 text-xs rounded-md gap-1.5" onClick={handleExportExcel}>
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Excel
          </Button>
          <Button onClick={handleSave} disabled={updateMutation.isPending} className="h-8 text-xs rounded-md gap-1.5 px-4">
            {updateMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Şablonu Kaydet
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar - Config */}
        <aside className="w-80 border-r border-border/60 bg-card flex flex-col shrink-0 overflow-y-auto p-5 space-y-5">
          <section className="space-y-3.5">
            <div className="flex items-center gap-2 text-foreground">
              <Settings className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-xs">Kalite Metadataları</h3>
            </div>
            <form key={template?.id} id="report-meta-form" className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Şablon Adı</Label>
                <Input name="name" defaultValue={template?.name} className="h-8 text-xs rounded-md" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Doküman No</Label>
                <Input name="documentNo" defaultValue={template?.documentNo} className="h-8 text-xs rounded-md" placeholder="Örn: ISG-FR-01" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">Revizyon No</Label>
                <Input name="revisionNo" defaultValue={template?.revisionNo} className="h-8 text-xs rounded-md" placeholder="00" />
              </div>
            </form>
          </section>

          <div className="h-px bg-border/60" />

          <section className="space-y-3.5">
            <div className="flex items-center gap-2 text-foreground">
              <Layout className="w-4 h-4 text-muted-foreground" />
              <h3 className="font-semibold text-xs">Sayfa Düzeni</h3>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Button 
                variant={orientation === 'PORTRAIT' ? 'default' : 'outline'} 
                className={cn(
                  "h-16 flex-col gap-1.5 rounded-lg border-border/60 text-xs font-medium transition-all duration-200",
                  orientation === 'PORTRAIT' ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setOrientation('PORTRAIT')}
              >
                <div className="w-5 h-7 border border-current rounded-xs opacity-60" />
                <span className="text-[11px]">Dikey (A4)</span>
              </Button>
              <Button 
                variant={orientation === 'LANDSCAPE' ? 'default' : 'outline'} 
                className={cn(
                  "h-16 flex-col gap-1.5 rounded-lg border-border/60 text-xs font-medium transition-all duration-200",
                  orientation === 'LANDSCAPE' ? "shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
                onClick={() => setOrientation('LANDSCAPE')}
              >
                <div className="w-7 h-5 border border-current rounded-xs opacity-60" />
                <span className="text-[11px]">Yatay (A4)</span>
              </Button>
            </div>
          </section>

          <div className="h-px bg-border/60" />

          <section className="space-y-3.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-foreground">
                <Layers className="w-4 h-4 text-muted-foreground" />
                <h3 className="font-semibold text-xs">Dinamik Alanlar</h3>
              </div>
              <Badge variant="outline" className="text-[10px] rounded-md font-normal text-muted-foreground border-border/60">İpucu</Badge>
            </div>
            <div className="grid grid-cols-1 gap-1.5">
              {[
                { label: 'Tesis Adı', code: '{{facility_name}}' },
                { label: 'Rapor Dönemi', code: '{{report_period}}' },
                { label: 'Oluşturan', code: '{{created_by}}' },
                { label: 'Logo', code: '{{company_logo}}' },
              ].map((v) => (
                <button 
                  key={v.code}
                  onClick={() => editor.chain().focus().insertContent(v.code).run()}
                  className="flex items-center justify-between p-2 rounded-md border border-border/60 bg-muted/20 hover:bg-muted/50 text-left transition-all duration-200 group"
                >
                  <span className="text-xs font-medium text-foreground">{v.label}</span>
                  <code className="text-[10px] font-mono bg-background px-1.5 py-0.5 rounded border border-border/60 text-muted-foreground group-hover:text-foreground">{v.code}</code>
                </button>
              ))}
            </div>
          </section>
        </aside>

        {/* Editor Main Area */}
        <main className="flex-1 overflow-y-auto bg-muted/20 p-8 flex justify-center">
          <div className={cn(
            "transition-all duration-200 origin-top bg-card shadow-md border border-border/60 rounded-md overflow-hidden",
            orientation === 'PORTRAIT' ? "w-[794px]" : "w-[1123px]"
          )}>
            <div className="sticky top-0 z-30 shadow-xs bg-card">
              <EditorToolbar editor={editor} />
            </div>
            <div className="p-0 min-h-full bg-card">
              <EditorContent editor={editor} />
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ReportEditorPage;
