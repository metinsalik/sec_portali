import React from 'react';
import { 
  History, Calendar, Building2, Trash2, CheckCircle2, 
  AlertTriangle, Wrench, Shield, FileText 
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { 
  ImprovementSheetType, 
  ImprovementOperationType, 
  ImprovementReportResult,
  type ImprovementOperationReportSummary 
} from '../../types';
import { useReportHistoryQuery, useImprovementMutations } from '../../hooks/useImprovementsQueries';

interface SeparatedHistoryDialogProps {
  sheetType: ImprovementSheetType;
  facilityId: string | null;
  facilityName?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const SeparatedHistoryDialog: React.FC<SeparatedHistoryDialogProps> = ({
  sheetType,
  facilityId,
  facilityName,
  open,
  onOpenChange,
}) => {
  const { data: reports = [], isLoading } = useReportHistoryQuery(sheetType, facilityId);
  const { deleteReportMutation } = useImprovementMutations();

  const inspections = reports.filter((r) => r.operationType === ImprovementOperationType.INSPECTION);
  const maintenances = reports.filter((r) => r.operationType === ImprovementOperationType.MAINTENANCE);

  const handleDelete = async (reportId: string) => {
    if (!confirm('Bu raporu silmek istediğinize emin misiniz?')) return;
    try {
      await deleteReportMutation.mutateAsync(reportId);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[88vh] flex flex-col p-0 overflow-hidden bg-background border rounded-2xl">
        {/* Üst Başlık */}
        <DialogHeader className="p-4 border-b border-border bg-muted/30 shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-sm font-bold text-foreground flex items-center gap-2">
                <History className="w-4 h-4 text-primary" />
                <span>Rapor & Operasyon Geçmişi</span>
              </DialogTitle>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                {facilityName || 'Hastane'} · {sheetType}
              </p>
            </div>
            <Badge variant="secondary" className="text-xs">
              Toplam {reports.length} Rapor
            </Badge>
          </div>
        </DialogHeader>

        {/* Gövde: 2 Sütunlu Karşılaştırma (Sol: Kontrol/Denetim, Sağ: Bakım) */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* SOL: Periyodik Kontrol / Denetim */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-primary" />
                <span>Periyodik Kontroller / Denetimler</span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                {inspections.length}
              </Badge>
            </div>

            {inspections.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center border rounded-xl bg-muted/10">
                Kayıtlı periyodik kontrol raporu yok.
              </p>
            ) : (
              inspections.map((rep) => (
                <Card key={rep.id} className="p-3 border-border bg-card space-y-2 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {new Date(rep.reportDate).toLocaleDateString('tr-TR')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className={`text-[9px] px-1.5 py-0 ${
                          rep.resultStatus === ImprovementReportResult.CLEAR
                            ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
                            : rep.resultStatus === ImprovementReportResult.FINDINGS
                            ? 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                            : 'text-muted-foreground'
                        }`}
                      >
                        {rep.resultStatus === ImprovementReportResult.CLEAR
                          ? 'Uygunsuzluk Yok'
                          : rep.resultStatus === ImprovementReportResult.FINDINGS
                          ? 'Tespit Var'
                          : 'Taslak'}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rep.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Raporu Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {(rep.companyName || rep.reportNo) && (
                    <div className="text-[11px] text-muted-foreground">
                      {rep.companyName && <span>Kurum: {rep.companyName} </span>}
                      {rep.reportNo && <span>(No: {rep.reportNo})</span>}
                    </div>
                  )}

                  {rep.summaryNotes && (
                    <p className="text-[11px] text-foreground/80 whitespace-pre-wrap break-words">
                      {rep.summaryNotes}
                    </p>
                  )}

                  {rep.nextScheduledDate && (
                    <div className="text-[10px] text-primary font-mono pt-1 border-t border-border/50">
                      Sonraki Tarih: {new Date(rep.nextScheduledDate).toLocaleDateString('tr-TR')}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>

          {/* SAĞ: Bakım İşlemleri */}
          <div className="space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <Wrench className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>Bakım İşlemleri</span>
              </span>
              <Badge variant="outline" className="text-[10px]">
                {maintenances.length}
              </Badge>
            </div>

            {maintenances.length === 0 ? (
              <p className="text-xs text-muted-foreground p-6 text-center border rounded-xl bg-muted/10">
                Kayıtlı bakım raporu yok.
              </p>
            ) : (
              maintenances.map((rep) => (
                <Card key={rep.id} className="p-3 border-border bg-card space-y-2 text-xs shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-foreground">
                      {new Date(rep.reportDate).toLocaleDateString('tr-TR')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <Badge
                        variant="outline"
                        className="text-[9px] px-1.5 py-0 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                      >
                        Bakım Yapıldı
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(rep.id)}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive"
                        title="Raporu Sil"
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>

                  {(rep.companyName || rep.reportNo) && (
                    <div className="text-[11px] text-muted-foreground">
                      {rep.companyName && <span>Yapan: {rep.companyName} </span>}
                      {rep.reportNo && <span>(No: {rep.reportNo})</span>}
                    </div>
                  )}

                  {rep.summaryNotes && (
                    <p className="text-[11px] text-foreground/80 whitespace-pre-wrap break-words">
                      {rep.summaryNotes}
                    </p>
                  )}

                  {rep.nextScheduledDate && (
                    <div className="text-[10px] text-emerald-600 font-mono pt-1 border-t border-border/50">
                      Sonraki Bakım: {new Date(rep.nextScheduledDate).toLocaleDateString('tr-TR')}
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Alt Kapat */}
        <div className="p-3 border-t border-border bg-muted/30 flex justify-end shrink-0">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="h-8 text-xs"
          >
            Kapat
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
