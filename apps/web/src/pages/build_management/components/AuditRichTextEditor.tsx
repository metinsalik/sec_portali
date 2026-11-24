import React, { useEffect, useRef, useState } from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import { Node, mergeAttributes } from '@tiptap/core';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import TextAlign from '@tiptap/extension-text-align';
import Highlight from '@tiptap/extension-highlight';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Highlighter,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Table as TableIcon,
  ImagePlus,
  Undo2,
  Redo2,
  RemoveFormatting,
  Trash2,
  Loader2,
  Rows3,
  Columns3,
  Merge,
  Split,
  ChevronDown,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { uploadAuditFiles } from '../services/auditApi';

// Custom TipTap Image Node (zero extra package required, supports width & clean print HTML)
const RichImage = Node.create({
  name: 'image',
  group: 'block',
  draggable: true,
  selectable: true,
  atom: true,

  addAttributes() {
    return {
      src: { default: null },
      alt: { default: '' },
      width: {
        default: '75%',
        parseHTML: (el) => el.getAttribute('data-width') || el.style?.width || '75%',
        renderHTML: (attrs) => ({
          'data-width': attrs.width || '75%',
          style: `width: ${attrs.width || '75%'}; max-width: 100%; height: auto;`,
        }),
      },
    };
  },

  parseHTML() {
    return [{ tag: 'img[src]' }];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'img',
      mergeAttributes(HTMLAttributes, {
        class: 'audit-rich-img',
      }),
    ];
  },
});

/**
 * Shared Tailwind styling for rendered rich HTML in Editor and Published Report screen view.
 */
export const AUDIT_RICH_CONTENT_CLASS = cn(
  'text-sm leading-relaxed text-foreground break-words',
  '[&_p]:mb-2.5 [&_p:last-child]:mb-0',
  '[&_h1]:text-xl [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:tracking-tight',
  '[&_h2]:text-lg [&_h2]:font-bold [&_h2]:mt-3.5 [&_h2]:mb-2',
  '[&_h3]:text-base [&_h3]:font-semibold [&_h3]:mt-3 [&_h3]:mb-1.5',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:space-y-1',
  '[&_li>p]:mb-0',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-primary/40 [&_blockquote]:bg-muted/30 [&_blockquote]:pl-3.5 [&_blockquote]:py-1.5 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-muted-foreground',
  '[&_hr]:my-4 [&_hr]:border-border',
  '[&_mark]:bg-amber-200/80 dark:[&_mark]:bg-amber-500/30 [&_mark]:px-0.5 [&_mark]:rounded-xs',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-xs sm:[&_table]:text-sm',
  '[&_th]:border [&_th]:border-border [&_th]:bg-muted/70 [&_th]:px-2.5 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:align-top',
  '[&_td]:border [&_td]:border-border [&_td]:px-2.5 [&_td]:py-2 [&_td]:align-top',
  '[&_.selectedCell]:bg-primary/10',
  '[&_img]:rounded-md [&_img]:border [&_img]:border-border [&_img]:my-3 [&_img]:mx-auto [&_img]:block [&_img]:object-contain',
  '[&_img.ProseMirror-selectednode]:ring-2 [&_img.ProseMirror-selectednode]:ring-primary [&_img.ProseMirror-selectednode]:ring-offset-2'
);

/**
 * Shared Tailwind styling for PDF / Print white-paper ReportTemplate.
 */
export const AUDIT_PRINT_RICH_CONTENT_CLASS = cn(
  'text-[14px] leading-relaxed text-slate-800 break-words',
  '[&_p]:mb-2.5 [&_p:last-child]:mb-0',
  '[&_h1]:text-lg [&_h1]:font-bold [&_h1]:mt-4 [&_h1]:mb-2 [&_h1]:text-slate-900',
  '[&_h2]:text-base [&_h2]:font-bold [&_h2]:mt-3 [&_h2]:mb-1.5 [&_h2]:text-slate-900',
  '[&_h3]:text-[15px] [&_h3]:font-semibold [&_h3]:mt-2.5 [&_h3]:mb-1 [&_h3]:text-slate-800',
  '[&_ul]:list-disc [&_ul]:pl-6 [&_ul]:my-2 [&_ul]:space-y-1',
  '[&_ol]:list-decimal [&_ol]:pl-6 [&_ol]:my-2 [&_ol]:space-y-1',
  '[&_li>p]:mb-0',
  '[&_blockquote]:border-l-4 [&_blockquote]:border-slate-400 [&_blockquote]:bg-slate-50 [&_blockquote]:pl-3.5 [&_blockquote]:py-1.5 [&_blockquote]:my-3 [&_blockquote]:italic [&_blockquote]:text-slate-700',
  '[&_hr]:my-4 [&_hr]:border-slate-300',
  '[&_mark]:bg-amber-200 [&_mark]:px-0.5',
  '[&_table]:w-full [&_table]:border-collapse [&_table]:my-3 [&_table]:text-xs [&_table]:border [&_table]:border-slate-400',
  '[&_th]:border [&_th]:border-slate-300 [&_th]:bg-slate-100 [&_th]:px-2.5 [&_th]:py-1.5 [&_th]:text-left [&_th]:font-bold [&_th]:align-top',
  '[&_td]:border [&_td]:border-slate-300 [&_td]:px-2.5 [&_td]:py-1.5 [&_td]:align-top',
  '[&_img]:rounded [&_img]:border [&_img]:border-slate-300 [&_img]:my-3 [&_img]:mx-auto [&_img]:block [&_img]:max-h-[420px] [&_img]:object-contain'
);

interface AuditRichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  facilityId?: string;
  facilityName?: string;
  placeholder?: string;
  disabled?: boolean;
  minHeightClass?: string;
}

const TABLE_PRESETS = [
  { label: '2 × 2', rows: 2, cols: 2 },
  { label: '3 × 3', rows: 3, cols: 3 },
  { label: '4 × 3', rows: 4, cols: 3 },
  { label: '4 × 4', rows: 4, cols: 4 },
  { label: '5 × 4', rows: 5, cols: 4 },
];

export const AuditRichTextEditor: React.FC<AuditRichTextEditorProps> = ({
  content,
  onChange,
  facilityId,
  facilityName,
  disabled = false,
  minHeightClass = 'min-h-[220px]',
}) => {
  const imageInputRef = useRef<HTMLInputElement>(null);
  const editorRef = useRef<any>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [showTablePicker, setShowTablePicker] = useState(false);
  const [, forceRerender] = useState(0);

  const uploadAndInsertImages = async (files: File[], targetEditor: any) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0 || !targetEditor) return;

    setUploadingImage(true);
    try {
      const uploaded = await uploadAuditFiles(imageFiles, facilityId, facilityName);
      if (Array.isArray(uploaded) && uploaded.length > 0) {
        uploaded.forEach((item: any) => {
          if (item?.url) {
            targetEditor
              .chain()
              .focus()
              .insertContent({
                type: 'image',
                attrs: {
                  src: item.url,
                  alt: item.name || 'Rapor görseli',
                  width: '75%',
                },
              })
              .run();
          }
        });
        toast.success(`${uploaded.length} görsel WebP olarak sıkıştırılıp metne eklendi.`);
      }
    } catch {
      toast.error('Görsel yüklenirken hata oluştu.');
    } finally {
      setUploadingImage(false);
    }
  };

  const editor = useEditor({
    editable: !disabled,
    extensions: [
      StarterKit,
      Underline,
      Highlight,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      RichImage,
    ],
    content: content || '',
    onUpdate: ({ editor: ed }) => {
      onChange(ed.getHTML());
    },
    onSelectionUpdate: () => {
      forceRerender((n) => n + 1);
    },
    onTransaction: () => {
      forceRerender((n) => n + 1);
    },
    editorProps: {
      attributes: {
        class: cn(minHeightClass, 'p-4 outline-none', AUDIT_RICH_CONTENT_CLASS),
      },
      handlePaste: (_view, event) => {
        if (disabled) return false;
        const items = Array.from(event.clipboardData?.items || []);
        const imageFiles = items
          .filter((i) => i.type.startsWith('image/'))
          .map((i) => i.getAsFile())
          .filter((f): f is File => Boolean(f));
        if (imageFiles.length > 0) {
          event.preventDefault();
          void uploadAndInsertImages(imageFiles, editorRef.current);
          return true;
        }
        return false;
      },
      handleDrop: (_view, event) => {
        if (disabled) return false;
        const files = Array.from(event.dataTransfer?.files || []);
        const imageFiles = files.filter((f) => f.type.startsWith('image/'));
        if (imageFiles.length > 0) {
          event.preventDefault();
          void uploadAndInsertImages(imageFiles, editorRef.current);
          return true;
        }
        return false;
      },
    },
  });

  editorRef.current = editor;

  // Sync external content when switching between audits
  useEffect(() => {
    if (!editor) return;
    const incoming = content || '';
    if (incoming !== editor.getHTML()) {
      editor.commands.setContent(incoming, { emitUpdate: false });
    }
  }, [content, editor]);

  useEffect(() => {
    if (editor) {
      editor.setEditable(!disabled);
    }
  }, [disabled, editor]);

  if (!editor) return null;

  const isInTable = editor.isActive('table');
  const isImageSelected = editor.isActive('image');
  const currentImageWidth = editor.getAttributes('image')?.width || '75%';

  const handleImageFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (files.length === 0) return;
    await uploadAndInsertImages(files, editor);
  };

  const insertTable = (rows: number, cols: number) => {
    editor.chain().focus().insertTable({ rows, cols, withHeaderRow: true }).run();
    setShowTablePicker(false);
  };

  const ToolBtn = ({
    active,
    onClick,
    title,
    disabledBtn,
    children,
  }: {
    active?: boolean;
    onClick: () => void;
    title: string;
    disabledBtn?: boolean;
    children: React.ReactNode;
  }) => (
    <Button
      type="button"
      variant="ghost"
      size="sm"
      title={title}
      disabled={disabled || disabledBtn}
      onMouseDown={(e) => e.preventDefault()}
      onClick={onClick}
      className={cn(
        'h-7 px-2 text-xs rounded-sm text-muted-foreground hover:text-foreground',
        active && 'bg-background shadow-xs text-foreground font-semibold border border-border/70'
      )}
    >
      {children}
    </Button>
  );

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background focus-within:ring-2 focus-within:ring-ring transition-all">
      {/* ANA WORD ARAÇ ÇUBUĞU */}
      {!disabled && (
        <div className="bg-muted/40 border-b border-border px-2 py-1.5 flex flex-wrap items-center gap-1">
          {/* Geri Al / Yinele */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/60">
            <ToolBtn
              title="Geri Al (Ctrl+Z)"
              disabledBtn={!editor.can().undo()}
              onClick={() => editor.chain().focus().undo().run()}
            >
              <Undo2 className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Yinele (Ctrl+Y)"
              disabledBtn={!editor.can().redo()}
              onClick={() => editor.chain().focus().redo().run()}
            >
              <Redo2 className="w-3.5 h-3.5" />
            </ToolBtn>
          </div>

          {/* Başlıklar */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/60">
            <ToolBtn
              title="Ana Başlık (H1)"
              active={editor.isActive('heading', { level: 1 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            >
              <Heading1 className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Alt Başlık (H2)"
              active={editor.isActive('heading', { level: 2 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            >
              <Heading2 className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Bölüm Başlığı (H3)"
              active={editor.isActive('heading', { level: 3 })}
              onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            >
              <Heading3 className="w-3.5 h-3.5" />
            </ToolBtn>
          </div>

          {/* Biçimlendirme */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/60">
            <ToolBtn
              title="Kalın (Ctrl+B)"
              active={editor.isActive('bold')}
              onClick={() => editor.chain().focus().toggleBold().run()}
            >
              <Bold className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="İtalik (Ctrl+I)"
              active={editor.isActive('italic')}
              onClick={() => editor.chain().focus().toggleItalic().run()}
            >
              <Italic className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Altı Çizili (Ctrl+U)"
              active={editor.isActive('underline')}
              onClick={() => editor.chain().focus().toggleUnderline().run()}
            >
              <UnderlineIcon className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Üstü Çizili"
              active={editor.isActive('strike')}
              onClick={() => editor.chain().focus().toggleStrike().run()}
            >
              <Strikethrough className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Vurgula"
              active={editor.isActive('highlight')}
              onClick={() => editor.chain().focus().toggleHighlight().run()}
            >
              <Highlighter className="w-3.5 h-3.5" />
            </ToolBtn>
          </div>

          {/* Hizalama */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/60">
            <ToolBtn
              title="Sola Hizala"
              active={editor.isActive({ textAlign: 'left' })}
              onClick={() => editor.chain().focus().setTextAlign('left').run()}
            >
              <AlignLeft className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Ortala"
              active={editor.isActive({ textAlign: 'center' })}
              onClick={() => editor.chain().focus().setTextAlign('center').run()}
            >
              <AlignCenter className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Sağa Hizala"
              active={editor.isActive({ textAlign: 'right' })}
              onClick={() => editor.chain().focus().setTextAlign('right').run()}
            >
              <AlignRight className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="İki Yana Yasla"
              active={editor.isActive({ textAlign: 'justify' })}
              onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            >
              <AlignJustify className="w-3.5 h-3.5" />
            </ToolBtn>
          </div>

          {/* Maddeleme & Alıntı & Ayırıcı */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/60">
            <ToolBtn
              title="Madde İşaretli Liste"
              active={editor.isActive('bulletList')}
              onClick={() => editor.chain().focus().toggleBulletList().run()}
            >
              <List className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Numaralı Liste"
              active={editor.isActive('orderedList')}
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
            >
              <ListOrdered className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Alıntı / Not Kutusu"
              active={editor.isActive('blockquote')}
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
            >
              <Quote className="w-3.5 h-3.5" />
            </ToolBtn>
            <ToolBtn
              title="Yatay Ayırıcı Çizgi"
              onClick={() => editor.chain().focus().setHorizontalRule().run()}
            >
              <Minus className="w-3.5 h-3.5" />
            </ToolBtn>
          </div>

          {/* Tablo Ekle */}
          <div className="relative flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/60">
            <ToolBtn
              title="Tablo Ekle"
              active={isInTable || showTablePicker}
              onClick={() => setShowTablePicker((v) => !v)}
            >
              <TableIcon className="w-3.5 h-3.5 mr-1" />
              <span>Tablo</span>
              <ChevronDown className="w-3 h-3 ml-0.5 opacity-70" />
            </ToolBtn>

            {showTablePicker && (
              <div className="absolute left-0 top-full mt-1 z-30 bg-popover border border-border rounded-md shadow-lg p-2 min-w-[165px] space-y-1">
                <div className="text-[11px] font-semibold text-muted-foreground px-1.5 pb-1 border-b border-border">
                  Tablo Boyutu Seçin
                </div>
                {TABLE_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => insertTable(p.rows, p.cols)}
                    className="w-full text-left px-2 py-1 text-xs rounded hover:bg-muted text-foreground flex items-center justify-between"
                  >
                    <span>{p.label} Tablo</span>
                    <span className="text-[10px] text-muted-foreground">
                      {p.rows} satır, {p.cols} sütun
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Görsel Ekle */}
          <div className="flex items-center gap-0.5 bg-muted/50 rounded-md p-0.5 border border-border/60">
            <ToolBtn
              title="Görsel Yükle (veya Ctrl+V ile yapıştır / sürükle-bırak)"
              disabledBtn={uploadingImage}
              onClick={() => imageInputRef.current?.click()}
            >
              {uploadingImage ? (
                <Loader2 className="w-3.5 h-3.5 mr-1 animate-spin" />
              ) : (
                <ImagePlus className="w-3.5 h-3.5 mr-1" />
              )}
              <span>Görsel Ekle</span>
            </ToolBtn>
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleImageFileSelect}
            />
          </div>

          {/* Biçimi Temizle */}
          <ToolBtn
            title="Biçimlendirmeyi Temizle"
            onClick={() => editor.chain().focus().clearNodes().unsetAllMarks().run()}
          >
            <RemoveFormatting className="w-3.5 h-3.5" />
          </ToolBtn>
        </div>
      )}

      {/* BAĞLAMSAL TABLO ARAÇ ÇUBUĞU (İmleç tablo içindeyken görünür) */}
      {!disabled && isInTable && (
        <div className="bg-primary/5 border-b border-border px-2.5 py-1 flex flex-wrap items-center gap-1 text-[11px]">
          <span className="font-semibold text-primary mr-1 flex items-center gap-1">
            <TableIcon className="w-3 h-3" /> Tablo:
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addRowBefore().run()}
            className="h-6 px-2 text-[11px] gap-1"
          >
            <Rows3 className="w-3 h-3" /> + Üste Satır
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addRowAfter().run()}
            className="h-6 px-2 text-[11px] gap-1"
          >
            <Rows3 className="w-3 h-3" /> + Alta Satır
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteRow().run()}
            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
          >
            Satır Sil
          </Button>
          <span className="w-px h-4 bg-border mx-0.5" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addColumnBefore().run()}
            className="h-6 px-2 text-[11px] gap-1"
          >
            <Columns3 className="w-3 h-3" /> + Sola Sütun
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().addColumnAfter().run()}
            className="h-6 px-2 text-[11px] gap-1"
          >
            <Columns3 className="w-3 h-3" /> + Sağa Sütun
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteColumn().run()}
            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive"
          >
            Sütun Sil
          </Button>
          <span className="w-px h-4 bg-border mx-0.5" />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().mergeCells().run()}
            className="h-6 px-2 text-[11px] gap-1"
            title="Seçili hücreleri birleştir"
          >
            <Merge className="w-3 h-3" /> Birleştir
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().splitCell().run()}
            className="h-6 px-2 text-[11px] gap-1"
            title="Hücreyi böl"
          >
            <Split className="w-3 h-3" /> Böl
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().toggleHeaderRow().run()}
            className="h-6 px-2 text-[11px]"
          >
            Başlık Satırı
          </Button>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteTable().run()}
            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive ml-auto gap-1"
          >
            <Trash2 className="w-3 h-3" /> Tabloyu Sil
          </Button>
        </div>
      )}

      {/* BAĞLAMSAL GÖRSEL BOYUT ÇUBUĞU (Görsel seçiliyken görünür) */}
      {!disabled && isImageSelected && (
        <div className="bg-primary/5 border-b border-border px-2.5 py-1 flex flex-wrap items-center gap-1.5 text-[11px]">
          <span className="font-semibold text-primary">Görsel Boyutu:</span>
          {(['35%', '50%', '75%', '100%'] as const).map((w) => (
            <Button
              key={w}
              type="button"
              variant={currentImageWidth === w ? 'secondary' : 'ghost'}
              size="sm"
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => editor.chain().focus().updateAttributes('image', { width: w }).run()}
              className="h-6 px-2 text-[11px]"
            >
              {w === '35%' ? 'Küçük (%35)' : w === '50%' ? 'Orta (%50)' : w === '75%' ? 'Büyük (%75)' : 'Tam (%100)'}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => editor.chain().focus().deleteSelection().run()}
            className="h-6 px-2 text-[11px] text-destructive hover:text-destructive ml-auto gap-1"
          >
            <Trash2 className="w-3 h-3" /> Görseli Sil
          </Button>
        </div>
      )}

      {/* EDİTÖR ALANI */}
      <div onClick={() => showTablePicker && setShowTablePicker(false)}>
        <EditorContent editor={editor} />
      </div>

      {/* ALT İPUCU SATIRI */}
      {!disabled && (
        <div className="px-3 py-1.5 border-t border-border bg-muted/20 text-[11px] text-muted-foreground flex flex-wrap items-center justify-between gap-2">
          <span>
            İpucu: Tablo ekleyebilir, ekran görüntüsünü doğrudan <strong>Ctrl+V</strong> ile yapıştırabilir veya görsel sürükleyip bırakabilirsiniz.
          </span>
          {uploadingImage && (
            <span className="inline-flex items-center gap-1 text-primary font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> Görsel yükleniyor...
            </span>
          )}
        </div>
      )}
    </div>
  );
};
