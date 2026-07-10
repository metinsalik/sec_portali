import React, { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2 } from 'lucide-react';
import { RiskPrintTable } from './RiskPrintTable';

interface FacilityRiskPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: any[];
  facilityRisks: any[];
  facility: any;
}

export function FacilityRiskPrintModal({ isOpen, onClose, departments, facilityRisks, facility }: FacilityRiskPrintModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const handleGeneratePdf = () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-10000px';
        document.body.appendChild(iframe);
        
        const contentWindow = iframe.contentWindow;
        const contentDocument = iframe.contentDocument;
        
        if (contentDocument && printRef.current) {
          const headHtml = document.head.innerHTML;
          contentDocument.open();
          contentDocument.write(`
            <html>
              <head>
                ${headHtml}
                <style>
                  @page { size: landscape; margin: 10mm; }
                  body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .page-break-after { page-break-after: always; }
                  .page-break-after:last-child { page-break-after: auto; }
                </style>
              </head>
              <body>
                ${printRef.current.outerHTML}
              </body>
            </html>
          `);
          contentDocument.close();
          
          setTimeout(() => {
            contentWindow?.focus();
            contentWindow?.print();
            document.body.removeChild(iframe);
            setIsGenerating(false);
          }, 1500); // Wait a bit longer for all departments to render images
        } else {
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('Yazdırma hatası:', error);
        setIsGenerating(false);
      }
    }, 100);
  };

  if (!departments || departments.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[95vw] w-full max-h-[95vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between">
          <div>
            <DialogTitle>Tesis Geneli Toplu Risk Değerlendirme Çıktısı</DialogTitle>
            <p className="text-sm text-muted-foreground mt-1">Yatay (landscape) düzende, tüm departmanlar arka arkaya eklenecek</p>
          </div>
          <div className="flex gap-4 items-center pr-8">
            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white" 
              disabled={isGenerating}
              onClick={handleGeneratePdf}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
              Çıktı Al / PDF Kaydet
            </Button>
          </div>
        </DialogHeader>
        
        <div className="flex-1 overflow-auto p-6 bg-slate-100 flex justify-center">
          <div className="bg-white shadow-2xl border border-slate-200 overflow-x-auto w-full" style={{ transform: 'scale(0.85)', transformOrigin: 'top center' }}>
            <div ref={printRef} className="w-full">
              {departments.map((dept) => {
                const deptRisks = facilityRisks.filter(r => r.departmentId === dept.id);
                return (
                  <div key={dept.id} className="page-break-after w-full">
                    <RiskPrintTable 
                      risks={deptRisks}
                      department={{...dept, facility: facility || dept.facility || facilityRisks[0]?.department?.facility}} // Use explicit facility prop
                      deptCode={dept.id}
                    />
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
