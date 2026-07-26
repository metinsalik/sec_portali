import React, { useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getRenovationReport } from '@/services/renovationReportApi';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Printer } from 'lucide-react';
import { useReactToPrint } from 'react-to-print';
import RenovationReportPDF from './RenovationReportPDF';

interface Props {
  reportId: string;
  onBack: () => void;
}

export default function RenovationReportDetail({ reportId, onBack }: Props) {
  const componentRef = useRef<HTMLDivElement>(null);
  
  const { data: report, isLoading } = useQuery({
    queryKey: ['renovation-report', reportId],
    queryFn: () => getRenovationReport(reportId),
  });

  const handlePrint = useReactToPrint({
    content: () => componentRef.current,
    documentTitle: `Renovasyon_Raporu_${report?.projectName || 'Rapor'}`
  });

  if (isLoading) {
    return <div className="p-12 text-center">Rapor yükleniyor...</div>;
  }

  if (!report) {
    return <div className="p-12 text-center text-red-500">Rapor bulunamadı!</div>;
  }

  return (
    <div className="flex-1 w-full flex flex-col h-full bg-slate-100 dark:bg-slate-900">
      {/* Header */}
      <div className="border-b px-6 py-4 flex justify-between items-center bg-white dark:bg-slate-800 shrink-0 shadow-sm z-10">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h2 className="text-xl font-semibold">{report.projectName || 'İsimsiz Proje'}</h2>
            <p className="text-sm text-slate-500">Rapor Detayı ve Önizleme</p>
          </div>
        </div>
        <div>
          <Button onClick={handlePrint} className="gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md">
            <Printer className="w-4 h-4" />
            PDF İndir / Yazdır
          </Button>
        </div>
      </div>

      {/* PDF Viewer Container */}
      <div className="flex-1 overflow-y-auto p-4 md:p-8 flex justify-center bg-slate-200/50 dark:bg-slate-900/50">
        <div className="bg-white shadow-2xl rounded-sm max-w-[800px] w-full min-h-[1100px] overflow-hidden">
          {/* We hide the scrollbar of the inner component and handle scrolling in the parent */}
          <div ref={componentRef} className="w-full bg-white print:bg-white text-black font-sans">
            <RenovationReportPDF report={report} />
          </div>
        </div>
      </div>
    </div>
  );
}
