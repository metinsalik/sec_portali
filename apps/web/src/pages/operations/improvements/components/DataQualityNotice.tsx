import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { type QualityGridData } from '../types';

interface DataQualityNoticeProps {
  notice: { type: 'amber' | 'neutral'; message: string } | null;
  qualityGrid: QualityGridData;
}

export const DataQualityNotice: React.FC<DataQualityNoticeProps> = ({ notice, qualityGrid }) => {
  const hasQualityIssues =
    qualityGrid.emptyStatus > 0 ||
    qualityGrid.undefinedStatus > 0 ||
    qualityGrid.emptyRisk > 0 ||
    qualityGrid.undefinedRisk > 0 ||
    qualityGrid.emptyOwner > 0 ||
    qualityGrid.emptyAction > 0;

  return (
    <div className="space-y-3 mb-6">
      {/* Uyarı Banner'ı */}
      {notice && (
        <div className="flex items-start gap-3 p-3.5 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200 text-xs leading-relaxed animate-in fade-in duration-200">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
          <div className="min-w-0">
            <strong className="font-semibold block mb-0.5">Veri Bütünlüğü Uyarısı</strong>
            <span>{notice.message}</span>
          </div>
        </div>
      )}

      {/* 8'li Veri Kalitesi (Data Hygiene) Grid'i */}
      <Card className="p-4 border-border bg-card">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              Veri Kalitesi ve Eksik Bilgi Denetimi
            </h3>
          </div>
          <span className="text-[11px] text-muted-foreground font-medium">
            {hasQualityIssues ? 'Eksik kayıtlar tamamlanmalıdır' : 'Tüm alanlar eksiksiz'}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-2">
          {/* 1. Durumu Boş */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Durumu Boş</span>
            <span
              className={`text-base font-bold font-mono mt-0.5 block ${
                qualityGrid.emptyStatus > 0 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-foreground'
              }`}
            >
              {qualityGrid.emptyStatus}
            </span>
          </div>

          {/* 2. Tanımsız Durum */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Tanımsız Durum</span>
            <span
              className={`text-base font-bold font-mono mt-0.5 block ${
                qualityGrid.undefinedStatus > 0 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-foreground'
              }`}
            >
              {qualityGrid.undefinedStatus}
            </span>
          </div>

          {/* 3. Riski Boş */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Riski Boş</span>
            <span
              className={`text-base font-bold font-mono mt-0.5 block ${
                qualityGrid.emptyRisk > 0 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-foreground'
              }`}
            >
              {qualityGrid.emptyRisk}
            </span>
          </div>

          {/* 4. Tanımsız Risk */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Tanımsız Risk</span>
            <span
              className={`text-base font-bold font-mono mt-0.5 block ${
                qualityGrid.undefinedRisk > 0 ? 'text-amber-600 dark:text-amber-400 font-extrabold' : 'text-foreground'
              }`}
            >
              {qualityGrid.undefinedRisk}
            </span>
          </div>

          {/* 5. Sorumlusu Boş */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Sorumlusu Boş</span>
            <span
              className={`text-base font-bold font-mono mt-0.5 block ${
                qualityGrid.emptyOwner > 0 ? 'text-muted-foreground font-semibold' : 'text-foreground'
              }`}
            >
              {qualityGrid.emptyOwner}
            </span>
          </div>

          {/* 6. Aksiyonu Boş */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Aksiyonu Boş</span>
            <span
              className={`text-base font-bold font-mono mt-0.5 block ${
                qualityGrid.emptyAction > 0 ? 'text-muted-foreground font-semibold' : 'text-foreground'
              }`}
            >
              {qualityGrid.emptyAction}
            </span>
          </div>

          {/* 7. Tarihi Boş */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Tarihi Boş</span>
            <span className="text-base font-bold font-mono mt-0.5 block text-foreground">
              {qualityGrid.emptyDate}
            </span>
          </div>

          {/* 8. Hastanesi Boş */}
          <div className="p-2.5 rounded-lg border border-border bg-muted/20 text-center">
            <span className="text-[10px] text-muted-foreground block truncate">Hastanesi Boş</span>
            <span className="text-base font-bold font-mono mt-0.5 block text-foreground">
              {qualityGrid.emptyFacility}
            </span>
          </div>
        </div>
      </Card>
    </div>
  );
};
