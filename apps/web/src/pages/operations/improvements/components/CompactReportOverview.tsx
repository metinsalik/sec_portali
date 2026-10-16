import React, { useState } from 'react';
import { 
  FileCheck2, ChevronDown, ChevronRight, Plus, History, 
  AlertTriangle, Calendar, Building2, CheckCircle2, Clock 
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  ImprovementSheetType, 
  type CompactReportOverviewRow,
  IMPROVEMENT_SHEET_DEFINITIONS 
} from '../types';

interface CompactReportOverviewProps {
  sheetType: ImprovementSheetType;
  rows: CompactReportOverviewRow[];
  onOpenWizard: (facilityId?: string) => void;
  onOpenHistory: (facilityId: string) => void;
}

export const CompactReportOverview: React.FC<CompactReportOverviewProps> = ({
  sheetType,
  rows,
  onOpenWizard,
  onOpenHistory,
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const def = IMPROVEMENT_SHEET_DEFINITIONS[sheetType];
  const isAudit = sheetType === ImprovementSheetType.DENETIMLER;

  return (
    <Card className="border-border bg-card mb-4 overflow-hidden shadow-sm">
      {/* Başlık ve Araç Çubuğu */}
      <div className="p-3 bg-muted/30 border-b border-border flex items-center justify-between flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2 text-xs font-semibold text-foreground hover:text-primary transition-colors"
        >
          {isOpen ? (
            <ChevronDown className="w-4 h-4 text-muted-foreground" />
          ) : (
            <ChevronRight className="w-4 h-4 text-muted-foreground" />
          )}
          <FileCheck2 className="w-4 h-4 text-primary" />
          <span>
            {isAudit ? 'Denetim Raporları ve Takip Durumu' : `${def.label} Periyodik Kontrol ve Bakım Özeti`}
          </span>
          <Badge variant="secondary" className="text-[10px] ml-1">
            {rows.length} Hastane
          </Badge>
        </button>

        <div className="flex items-center gap-2">
          <Button
            type="button"
            size="sm"
            onClick={() => onOpenWizard()}
            className="h-7 text-xs gap-1.5 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{isAudit ? 'Denetim Raporu Ekle' : 'Rapor / Kontrol Ekle'}</span>
          </Button>
        </div>
      </div>

      {/* Rapor Özeti Tablosu */}
      {isOpen && (
        <div className="overflow-x-auto max-h-56 overflow-y-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead className="bg-muted/40 sticky top-0 z-10 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider border-b border-border">
              <tr>
                <th className="py-2 px-3">Hastane</th>
                <th className="py-2 px-3">{isAudit ? 'Son Denetim' : 'Son Kontrol'}</th>
                {!isAudit && <th className="py-2 px-3">Son Bakım</th>}
                <th className="py-2 px-3 text-right">Açık Tespit</th>
                <th className="py-2 px-3 text-right">Kritik</th>
                <th className="py-2 px-3 text-right">İşlem</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map((row) => (
                <tr key={row.facilityId} className="hover:bg-muted/20 transition-colors">
                  {/* Hastane Adı ve Çelişki Uyarısı */}
                  <td className="py-2 px-3 font-medium text-foreground">
                    <div className="flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                      <span className="truncate max-w-[180px]">{row.facilityName}</span>
                      {row.hasConflict && (
                        <span
                          title={row.conflictMessage || 'Rapor çelişkisi var'}
                          className="inline-flex items-center text-amber-600 dark:text-amber-400"
                        >
                          <AlertTriangle className="w-3.5 h-3.5" />
                        </span>
                      )}
                    </div>
                  </td>

                  {/* Son Kontrol / Denetim */}
                  <td className="py-2 px-3">
                    {row.inspection ? (
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-foreground font-medium">
                          {new Date(row.inspection.reportDate).toLocaleDateString('tr-TR')}
                        </span>
                        <Badge
                          variant="outline"
                          className={`text-[9px] px-1.5 py-0 ${
                            row.inspection.resultStatus === 'CLEAR'
                              ? 'text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30'
                              : row.inspection.resultStatus === 'FINDINGS'
                              ? 'text-amber-600 border-amber-300 bg-amber-50 dark:bg-amber-950/30'
                              : 'text-muted-foreground'
                          }`}
                        >
                          {row.inspection.resultStatus === 'CLEAR'
                            ? 'Uygunsuzluk Yok'
                            : row.inspection.resultStatus === 'FINDINGS'
                            ? 'Tespit Var'
                            : 'Taslak'}
                        </Badge>
                        {row.inspection.isOverdue && (
                          <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                            Gecikti
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-[11px]">-</span>
                    )}
                  </td>

                  {/* Son Bakım */}
                  {!isAudit && (
                    <td className="py-2 px-3">
                      {row.maintenance ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono text-foreground font-medium">
                            {new Date(row.maintenance.reportDate).toLocaleDateString('tr-TR')}
                          </span>
                          <Badge
                            variant="outline"
                            className="text-[9px] px-1.5 py-0 text-emerald-600 border-emerald-300 bg-emerald-50 dark:bg-emerald-950/30"
                          >
                            Bakım Yapıldı
                          </Badge>
                          {row.maintenance.isOverdue && (
                            <Badge variant="destructive" className="text-[9px] px-1.5 py-0">
                              Gecikti
                            </Badge>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-[11px]">-</span>
                      )}
                    </td>
                  )}

                  {/* Açık Tespit */}
                  <td className="py-2 px-3 text-right font-mono font-medium">
                    <span className={row.openFindingsCount > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-muted-foreground'}>
                      {row.openFindingsCount}
                    </span>
                  </td>

                  {/* Kritik */}
                  <td className="py-2 px-3 text-right font-mono font-bold">
                    <span className={row.criticalFindingsCount > 0 ? 'text-destructive' : 'text-muted-foreground'}>
                      {row.criticalFindingsCount}
                    </span>
                  </td>

                  {/* İşlem Butonları */}
                  <td className="py-2 px-3 text-right space-x-1 whitespace-nowrap">
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onOpenHistory(row.facilityId)}
                      className="h-6 px-2 text-[10px]"
                      title="Rapor Geçmişi"
                    >
                      <History className="w-3 h-3 mr-1" />
                      Geçmiş
                    </Button>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => onOpenWizard(row.facilityId)}
                      className="h-6 px-2 text-[10px]"
                      title="Yeni Rapor Gir"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Ekle
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
};
