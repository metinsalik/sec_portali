import React, { useState, useEffect } from 'react';
import { X, Calendar, FileText, CheckCircle2, AlertTriangle, Building2, Trash2, Edit2, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import toast from 'react-hot-toast';
import type { ImprovementPeriodicReport } from './types';

const API = import.meta.env.VITE_API_URL || '';

interface PeriodicReportHistoryModalProps {
  facilityId: string;
  facilityName: string;
  sheetType: string;
  sheetTitle: string;
  onClose: () => void;
  onEditReport: (report: ImprovementPeriodicReport) => void;
  onRefresh: () => void;
}

export const PeriodicReportHistoryModal: React.FC<PeriodicReportHistoryModalProps> = ({
  facilityId,
  facilityName,
  sheetType,
  sheetTitle,
  onClose,
  onEditReport,
  onRefresh,
}) => {
  const [reports, setReports] = useState<ImprovementPeriodicReport[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/periodic-reports/history?facilityId=${facilityId}&sheetType=${sheetType}`, {
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const d = await res.json();
      if (d.success && Array.isArray(d.data)) {
        setReports(d.data);
      }
    } catch (err: any) {
      toast.error('Geçmiş yüklenemedi: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [facilityId, sheetType]);

  const handleDelete = async (id: string, reportNo?: string | null) => {
    if (!window.confirm(`${reportNo || 'Bu'} periyodik kontrol raporunu silmek istediğinize emin misiniz?`)) {
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${API}/api/operations/improvements/periodic-reports/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': token ? `Bearer ${token}` : '' }
      });
      const d = await res.json();
      if (!res.ok || !d.success) throw new Error(d.message || 'Silinemedi');

      toast.success('Rapor başarıyla silindi.');
      fetchHistory();
      onRefresh();
    } catch (err: any) {
      toast.error('Hata: ' + err.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto font-sans animate-in fade-in duration-150">
      <div className="bg-card text-card-foreground border rounded-2xl w-full max-w-3xl shadow-2xl overflow-hidden my-6">
        
        {/* Header */}
        <div className="px-6 py-4 border-b flex items-center justify-between bg-muted/40">
          <div>
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="text-xs font-bold text-foreground">{facilityName}</span>
              <span className="text-xs text-muted-foreground">• {sheetTitle}</span>
            </div>
            <h3 className="text-base font-bold text-foreground mt-0.5">
              Periyodik Kontrol Geçmişi
            </h3>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-3">
          {loading ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Geçmiş raporlar yükleniyor...
            </div>
          ) : reports.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Bu hastaneye ait henüz kaydedilmiş bir periyodik kontrol raporu bulunmuyor.
            </div>
          ) : (
            <div className="space-y-3">
              {reports.map((rep) => {
                const isUygun = rep.result === 'Uygun';
                const sDateStr = rep.inspectionDate 
                  ? new Date(rep.inspectionDate).toLocaleDateString('tr-TR') 
                  : '-';
                const nextDateStr = rep.nextInspectionDate 
                  ? new Date(rep.nextInspectionDate).toLocaleDateString('tr-TR') 
                  : '-';

                return (
                  <div 
                    key={rep.id}
                    className="p-4 rounded-xl border bg-card hover:border-primary/40 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs"
                  >
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge 
                          className={`text-xs font-bold flex items-center gap-1 ${
                            isUygun 
                              ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-300 dark:border-emerald-800' 
                              : 'bg-red-500/15 text-red-700 dark:text-red-400 border border-red-300 dark:border-red-800'
                          }`}
                        >
                          {isUygun ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <AlertTriangle className="w-3.5 h-3.5 text-red-600" />}
                          {rep.result}
                        </Badge>
                        <span className="font-mono font-bold text-xs text-foreground">
                          {rep.reportNo ? `Rapor No: ${rep.reportNo}` : 'Rapor Numarasız'}
                        </span>
                        {rep.actionType && (
                          <span className="text-[11px] px-2 py-0.5 rounded-md bg-muted text-muted-foreground border">
                            {rep.actionType}
                          </span>
                        )}
                        {rep.isgKatipId && (
                          <span className="text-[11px] font-mono text-muted-foreground">
                            İSG-KATİP: {rep.isgKatipId}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          Kontrol Tarihi: <strong className="text-foreground">{sDateStr}</strong>
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-primary" />
                          Sonraki Kontrol: <strong className="text-foreground">{nextDateStr}</strong>
                        </span>
                        {rep.firmName && (
                          <>
                            <span>•</span>
                            <span>Firma: <strong className="text-foreground">{rep.firmName}</strong></span>
                          </>
                        )}
                      </div>

                      {rep.notes && (
                        <p className="text-xs text-slate-600 dark:text-slate-300 bg-muted/40 p-2 rounded-lg italic">
                          "{rep.notes}"
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          onEditReport(rep);
                          onClose();
                        }}
                        className="h-8 px-2.5 text-xs"
                        title="Raporu Düzenle"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-1" />
                        Düzenle
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(rep.id, rep.reportNo)}
                        className="h-8 px-2.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                        title="Raporu Sil"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </Button>
                    </div>

                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t bg-muted/20 flex justify-end">
          <Button variant="outline" size="sm" onClick={onClose} className="h-8 text-xs">
            Kapat
          </Button>
        </div>

      </div>
    </div>
  );
};
