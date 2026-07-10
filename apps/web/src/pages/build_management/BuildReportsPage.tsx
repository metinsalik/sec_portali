import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Layers, Printer, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { BuildHandoverOHSPrintModal } from '@/components/build_management/BuildHandoverOHSPrintModal';
import { BuildHandoverInfectionPrintModal } from '@/components/build_management/BuildHandoverInfectionPrintModal';

export default function BuildReportsPage() {
  const [facilityId, setFacilityId] = useState<string>(localStorage.getItem('activeFacilityId') || '');
  const [search, setSearch] = useState('');
  
  const [selectedReport, setSelectedReport] = useState<any>(null);
  const [printModalOpen, setPrintModalOpen] = useState(false);

  useEffect(() => {
    const handleFacilityChange = () => {
      setFacilityId(localStorage.getItem('activeFacilityId') || '');
    };
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  const { data: reports = [], isLoading } = useQuery({
    queryKey: ['buildReports', facilityId],
    queryFn: async () => {
      const res = await api.get(`/build-management/reports?facilityId=${facilityId}`);
      if (!res.ok) throw new Error();
      return res.json();
    },
    enabled: !!facilityId
  });

  const filteredReports = reports.filter((r: any) => 
    r.projectName.toLowerCase().includes(search.toLowerCase()) || 
    r.title.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenReport = (report: any) => {
    setSelectedReport(report);
    setPrintModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white dark:bg-[#2c3135] p-6 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
        <div>
          <h2 className="text-xl font-bold text-[#011d2b] dark:text-[#cbe6fa] flex items-center gap-2">
            <Layers className="text-[#1565c0]" />
            Raporlar ve Teslim Alma Kayıtları
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Tamamlanmış teslim alma ve denetim raporlarının PDF formatındaki çıktıları.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <Input 
              placeholder="Proje veya rapor ara..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-slate-200 dark:bg-slate-800 rounded-xl"></div>
          ))}
        </div>
      ) : filteredReports.length > 0 ? (
        <div className="bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Tarih</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Proje Adı</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">Rapor Türü</th>
                <th className="p-4 font-bold text-slate-700 dark:text-slate-300">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {filteredReports.map((report: any, i: number) => (
                <tr key={`${report.id}-${i}`} className="border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                  <td className="p-4 text-sm">{new Date(report.date).toLocaleDateString('tr-TR')}</td>
                  <td className="p-4 text-sm">{report.projectName}</td>
                  <td className="p-4 text-sm">
                    <span className="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-3 py-1 rounded-full text-xs font-medium">
                      {report.title}
                    </span>
                  </td>
                  <td className="p-4">
                    <Button variant="outline" size="sm" onClick={() => handleOpenReport(report)}>
                      <Printer className="w-4 h-4 mr-2" />
                      Yazdır / PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="text-center py-12 bg-white dark:bg-[#2c3135] rounded-xl border border-slate-200 dark:border-slate-700">
          <Layers className="mx-auto text-5xl text-slate-300 mb-3 w-12 h-12" />
          <p className="text-slate-500">Bu tesiste henüz hiçbir rapor bulunmuyor.</p>
        </div>
      )}

      {printModalOpen && selectedReport?.type === 'handover_ohs' && (
        <BuildHandoverOHSPrintModal 
          open={printModalOpen}
          onOpenChange={setPrintModalOpen}
          project={selectedReport.projectData}
          inspection={selectedReport.data}
        />
      )}

      {printModalOpen && selectedReport?.type === 'handover_infection' && (
        <BuildHandoverInfectionPrintModal 
          open={printModalOpen}
          onOpenChange={setPrintModalOpen}
          project={selectedReport.projectData}
          inspection={selectedReport.data}
        />
      )}
    </div>
  );
}
