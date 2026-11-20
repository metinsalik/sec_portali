import React, { useState, useRef } from 'react';
import { FileUp, FileJson, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import type { GbfDoc } from './gbfSchema';
import { normalizeGbfDoc, splitFullSdsText } from './gbfSchema';

interface GbfImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplySections: (sections: Record<number, string>, sourceName: string) => void;
  onApplyJsonDoc: (doc: GbfDoc, meta?: { name?: string; number?: string; revision?: string; date?: string; supplier?: string }) => void;
}

export const GbfImportModal: React.FC<GbfImportModalProps> = ({
  open,
  onOpenChange,
  onApplySections,
  onApplyJsonDoc,
}) => {
  const [bulkText, setBulkText] = useState('');
  const txtInputRef = useRef<HTMLInputElement | null>(null);
  const jsonInputRef = useRef<HTMLInputElement | null>(null);

  const handleTxtFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      setBulkText(text);
      toast.success(`"${file.name}" okundu. "Bölümlere ayır" butonuna basarak aktarabilirsiniz.`);
    } catch {
      toast.error('Dosya okunamadı.');
    } finally {
      e.target.value = '';
    }
  };

  const handleJsonFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const raw = JSON.parse(await file.text()) as Record<string, unknown>;
      const doc = normalizeGbfDoc(raw);
      onApplyJsonDoc(doc, {
        name: typeof raw.name === 'string' ? raw.name : undefined,
        number: typeof raw.number === 'string' ? raw.number : undefined,
        revision: typeof raw.revision === 'string' ? raw.revision : undefined,
        date: typeof raw.date === 'string' ? raw.date : undefined,
        supplier: typeof raw.supplier === 'string' ? raw.supplier : undefined,
      });
      toast.success('JSON yedeği başarıyla içe aktarıldı.');
      onOpenChange(false);
    } catch {
      toast.error('Geçersiz JSON yedeği.');
    } finally {
      e.target.value = '';
    }
  };

  const handleApplyText = () => {
    if (!bulkText.trim()) {
      toast.error('Önce SDS metnini yapıştırın.');
      return;
    }
    const parsed = splitFullSdsText(bulkText);
    const count = Object.keys(parsed.sections).length;
    if (!parsed.matched || count === 0) {
      toast.error('Numaralı bölüm başlıkları (1..16) algılanamadı. Metni ilgili bölümün Hızlı Giriş alanına yapıştırabilirsiniz.');
      return;
    }
    if (!window.confirm(`${count} bölüm algılandı. Bu bölümlerdeki mevcut kaynak metni yenisiyle değiştirilsin mi?`)) {
      return;
    }
    onApplySections(parsed.sections, 'İçe aktarılan SDS metni');
    setBulkText('');
    onOpenChange(false);
    toast.success(`${count} bölüm başarıyla aktarıldı. Kontrol edip kaydedebilirsiniz.`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>SDS İçe Aktar</DialogTitle>
          <DialogDescription>
            16 bölümü içeren tam SDS metnini yapıştırın, TXT dosyası seçin veya daha önce yedeklediğiniz GBF JSON dosyasını açın.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-1">
          <div className="flex flex-wrap gap-2">
            <input ref={txtInputRef} type="file" accept=".txt,text/plain" className="hidden" onChange={handleTxtFile} />
            <input ref={jsonInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleJsonFile} />
            <Button type="button" variant="outline" size="sm" onClick={() => txtInputRef.current?.click()}>
              <FileUp className="w-4 h-4 mr-1.5" />
              TXT Dosyası Seç
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => jsonInputRef.current?.click()}>
              <FileJson className="w-4 h-4 mr-1.5" />
              JSON Yedeği Aç
            </Button>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground">Tam SDS Metni</label>
            <Textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              placeholder="SDS'nin 16 bölümünü içeren metni buraya yapıştırın (ör. BÖLÜM 1: ..., BÖLÜM 2: ...)…"
              className="min-h-[260px] text-xs font-mono leading-relaxed"
            />
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button type="button" onClick={handleApplyText}>
            <Sparkles className="w-4 h-4 mr-1.5" />
            Bölümlere Ayır
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
