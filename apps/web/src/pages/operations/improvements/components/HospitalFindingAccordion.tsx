import React, { useState } from 'react';
import { Building2, ChevronRight, ChevronDown, Layers, Tag } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type HospitalAccordionItem } from '../types';

interface HospitalFindingAccordionProps {
  items: HospitalAccordionItem[];
}

export const HospitalFindingAccordion: React.FC<HospitalFindingAccordionProps> = ({ items }) => {
  const [openHospitalIds, setOpenHospitalIds] = useState<Record<string, boolean>>({});
  const [openSheetKeys, setOpenSheetKeys] = useState<Record<string, boolean>>({});

  const toggleHospital = (hId: string) => {
    setOpenHospitalIds((prev) => ({ ...prev, [hId]: !prev[hId] }));
  };

  const toggleSheet = (key: string) => {
    setOpenSheetKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  if (!items || items.length === 0) {
    return (
      <Card className="p-8 text-center text-xs text-muted-foreground border-border bg-card">
        Kırılım verisi bulunamadı.
      </Card>
    );
  }

  return (
    <Card className="border-border bg-card overflow-hidden">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
            Hastane, Takip Alanı ve Kategori Kırılımı (3 Seviyeli Özet)
          </h3>
        </div>
        <Badge variant="secondary" className="text-[10px]">
          {items.length} Hastane
        </Badge>
      </div>

      <div className="divide-y divide-border">
        {items.map((hospital) => {
          const isHospOpen = !!openHospitalIds[hospital.hospitalId];

          return (
            <div key={hospital.hospitalId} className="transition-colors">
              {/* Seviye 1: Hastane Satırı */}
              <button
                type="button"
                onClick={() => toggleHospital(hospital.hospitalId)}
                className="w-full flex items-center justify-between p-3.5 text-left hover:bg-muted/30 transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {isHospOpen ? (
                    <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
                  )}
                  <Building2 className="w-4 h-4 text-primary shrink-0" />
                  <span className="text-xs font-semibold text-foreground truncate">
                    {hospital.hospitalName}
                  </span>
                </div>

                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {hospital.completed} / {hospital.total} Tamamlandı
                  </span>
                  <Badge variant="outline" className="text-[10px] font-mono font-semibold">
                    {hospital.completionRateDisplay}
                  </Badge>
                </div>
              </button>

              {/* Seviye 2: Takip Alanları (Sheets) */}
              {isHospOpen && (
                <div className="pl-8 pr-4 pb-3 space-y-2 bg-muted/10 animate-in fade-in duration-150">
                  {hospital.sheets.map((sheet) => {
                    const sheetUniqueKey = `${hospital.hospitalId}-${sheet.sheetType}`;
                    const isSheetOpen = !!openSheetKeys[sheetUniqueKey];

                    return (
                      <div
                        key={sheet.sheetType}
                        className="rounded-lg border border-border bg-card overflow-hidden"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSheet(sheetUniqueKey)}
                          className="w-full flex items-center justify-between px-3 py-2 text-left hover:bg-muted/30 transition-colors"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            {isSheetOpen ? (
                              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground" />
                            )}
                            <span className="text-xs font-medium text-foreground">
                              {sheet.sheetLabel}
                            </span>
                          </div>

                          <div className="flex items-center gap-2.5 shrink-0">
                            <span className="text-[10px] text-muted-foreground font-mono">
                              {sheet.completed} / {sheet.total}
                            </span>
                            <Badge variant="secondary" className="text-[9px] px-1.5 py-0 font-mono">
                              {sheet.completionRateDisplay}
                            </Badge>
                          </div>
                        </button>

                        {/* Seviye 3: Kategoriler */}
                        {isSheetOpen && (
                          <div className="px-4 py-2 bg-muted/20 border-t border-border space-y-1">
                            {sheet.categories.map((cat, idx) => (
                              <div
                                key={idx}
                                className="flex items-center justify-between py-1 text-[11px]"
                              >
                                <div className="flex items-center gap-2 text-muted-foreground">
                                  <Tag className="w-3 h-3" />
                                  <span>{cat.categoryName}</span>
                                </div>
                                <div className="flex items-center gap-2 font-mono">
                                  <span className="text-foreground font-medium">
                                    {cat.completed} / {cat.total}
                                  </span>
                                  <span className="text-muted-foreground text-[10px]">
                                    ({cat.completionRateDisplay})
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </Card>
  );
};
