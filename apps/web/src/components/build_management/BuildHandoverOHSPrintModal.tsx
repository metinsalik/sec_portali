import React, { useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer } from 'lucide-react';
import { BuildHandoverOHSPrintTemplate } from './BuildHandoverOHSPrintTemplate';
import { useReactToPrint } from 'react-to-print';

interface Props {
  open: boolean;
  onOpenChange: (val: boolean) => void;
  project: any;
  inspection: any;
}

export function BuildHandoverOHSPrintModal({ open, onOpenChange, project, inspection }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  
  const handlePrint = useReactToPrint({
    contentRef: printRef,
    documentTitle: `${project?.name} - İSG Teslim Alma Formu`,
    printBackground: true
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex justify-between items-center">
            <span>Yazdırma Önizlemesi</span>
            <Button onClick={() => handlePrint()} className="bg-blue-600 hover:bg-blue-700 text-white">
              <Printer className="w-4 h-4 mr-2" />
              Yazdır
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <div className="bg-white p-8 border rounded shadow-inner overflow-x-auto text-black">
           <BuildHandoverOHSPrintTemplate ref={printRef} project={project} inspection={inspection} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
