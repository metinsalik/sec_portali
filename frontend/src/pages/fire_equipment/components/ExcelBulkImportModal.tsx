import React, { useRef, useState } from 'react';
import * as XLSX from 'xlsx';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { FileUp, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api';
import { useQueryClient } from '@tanstack/react-query';

export function ExcelBulkImportModal({ facilityId, onComplete }: { facilityId: string, onComplete?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const data = await file.arrayBuffer();
      const workbook = XLSX.read(data);
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData: any[] = XLSX.utils.sheet_to_json(firstSheet);

      // Clean up keys to lowercase and remove spaces for easier matching
      const cleanedData = jsonData.map(row => {
        const cleanedRow: any = {};
        for (const [key, value] of Object.entries(row)) {
          const cleanKey = key.toLowerCase().trim().replace(/ /g, '_');
          cleanedRow[cleanKey] = value;
        }
        return cleanedRow;
      });

      const res = await api.post(`/fire-equipment/equipment/bulk/${facilityId}`, { equipments: cleanedData });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Toplu yükleme başarısız oldu.');
      }
      
      const result = await res.json();
      toast.success(result.message || 'Ekipmanlar başarıyla yüklendi.');
      
      setIsOpen(false);
      queryClient.invalidateQueries({ queryKey: ['fire-equipment'] });
      if (onComplete) onComplete();
      
    } catch (error: any) {
      console.error(error);
      toast.error(error.message || 'Dosya işlenirken bir hata oluştu.');
    } finally {
      setIsLoading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <FileUp className="w-4 h-4" />
          Excel'den Yükle
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excel'den Toplu Ekipman Yükle</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p className="text-sm text-muted-foreground">
            Lütfen formata uygun bir Excel dosyası seçiniz. Sütun başlıkları (blok, kat, birim, mahal, firma, ekipman_no, not, kategori, alt_kategori, sorumlu_departman, manometre, kapasite, dolum_tarihi, imal_tarihi) olmalıdır.
          </p>
          <div className="flex justify-center border-2 border-dashed border-muted p-8 rounded-lg hover:bg-muted/50 transition-colors">
            <input 
              type="file" 
              accept=".xlsx, .xls" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleFileUpload}
            />
            <Button 
              onClick={() => fileInputRef.current?.click()} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Yükleniyor...
                </>
              ) : (
                'Dosya Seç'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
