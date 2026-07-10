import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Printer, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { MaterialPrintCard } from './MaterialPrintCard';

interface PrintCardModalProps {
  isOpen: boolean;
  onClose: () => void;
  material: any;
  facilityLogoUrl?: string;
}

export function PrintCardModal({ isOpen, onClose, material, facilityLogoUrl }: PrintCardModalProps) {
  const [size, setSize] = useState<'A3' | 'A4' | 'A5'>('A4');
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);
  
  const activeFacilityId = localStorage.getItem('activeFacilityId');

  const { data: facility } = useQuery({
    queryKey: ['facility', activeFacilityId],
    queryFn: async () => {
      if (!activeFacilityId) return null;
      const res = await api.get(`/settings/facilities/${activeFacilityId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!activeFacilityId && isOpen
  });

  const actualLogoUrl = facilityLogoUrl || facility?.logoUrl || '/mlpcare.jpg';

  const getPreviewScale = () => {
    switch(size) {
      case 'A3': return 'scale(0.45)';
      case 'A4': return 'scale(0.65)';
      case 'A5': return 'scale(0.85)';
      default: return 'scale(0.65)';
    }
  };

  const handleGeneratePdf = () => {
    if (!printRef.current) return;
    setIsGenerating(true);

    setTimeout(() => {
      try {
        const el = printRef.current!;
        const contentWidth = el.offsetWidth;
        const contentHeight = el.offsetHeight;

        // 96 DPI bazında mm → px
        const mmToPx = (mm: number) => mm * 96 / 25.4;
        const margin = mmToPx(5);

        const pagePx = {
          A3: { w: mmToPx(297), h: mmToPx(420) },
          A4: { w: mmToPx(210), h: mmToPx(297) },
          A5: { w: mmToPx(148), h: mmToPx(210) },
        };

        const avail = pagePx[size];
        const availW = avail.w - margin * 2;
        
        // Sadece genişliğe göre scale al çünkü yüksekliği zaten biz kilitledik
        const scale = availW / contentWidth;

        const iframe = document.createElement('iframe');
        iframe.style.cssText = 'position:fixed;top:-10000px;left:-10000px;width:1px;height:1px;';
        document.body.appendChild(iframe);

        const iframeDoc = iframe.contentDocument!;
        iframeDoc.open();
        iframeDoc.write(`<!DOCTYPE html>
<html>
<head>
  ${document.head.innerHTML}
  <style>
    @page { size: ${size} portrait; margin: 5mm; }
    html, body {
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      zoom: ${scale};
    }
  </style>
</head>
<body>${el.outerHTML}</body>
</html>`);
        iframeDoc.close();

        setTimeout(() => {
          iframe.contentWindow?.focus();
          iframe.contentWindow?.print();
          document.body.removeChild(iframe);
          setIsGenerating(false);
        }, 1000);

      } catch (e) {
        console.error('Yazdırma hatası:', e);
        setIsGenerating(false);
      }
    }, 100);
  };

  if (!material) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[1000px] h-[85vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Bilgi Kartı Yazdır / İndir</DialogTitle>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex gap-6 overflow-hidden pt-4 border-t">
          <div className="w-64 flex flex-col gap-6 shrink-0 overflow-y-auto">
            <div className="space-y-3">
              <label className="text-sm font-medium text-slate-700">Kağıt Boyutu</label>
              <Select value={size} onValueChange={(v: 'A3' | 'A4' | 'A5') => setSize(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Boyut seçin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="A3">A3 Boyutu (297 x 420 mm)</SelectItem>
                  <SelectItem value="A4">A4 Boyutu (210 x 297 mm)</SelectItem>
                  <SelectItem value="A5">A5 Boyutu (148 x 210 mm)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-xs text-slate-500">
                Farklı boyut seçenekleri, sahadaki kullanım senaryosuna göre otomatik ölçeklenir.
              </p>
            </div>

            <div className="flex flex-col gap-3 mt-auto">
              <Button 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white" 
                disabled={isGenerating}
                onClick={handleGeneratePdf}
              >
                {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
                Çıktı Al / PDF Kaydet
              </Button>
              <p className="text-[10px] text-slate-500 text-center leading-tight">
                Tarayıcınızın yazdırma ekranı açılacaktır. PDF olarak kaydetmek için Hedef (Yazıcı) kısmından "PDF olarak kaydet" seçeneğini seçebilirsiniz.
              </p>
            </div>
          </div>

          {/* Önizleme Alanı */}
          <div className="flex-1 bg-slate-100 rounded-xl border border-slate-200 overflow-auto flex items-start justify-center p-8 relative custom-scrollbar">
            <div className="origin-top transition-transform duration-300" style={{ transform: getPreviewScale(), transformOrigin: 'top center', marginBottom: '-35%' }}>
              <div ref={printRef} className="bg-white shadow-2xl border border-slate-200">
                <MaterialPrintCard 
                  material={material} 
                  size={size} 
                  facilityLogoUrl={actualLogoUrl} 
                />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
