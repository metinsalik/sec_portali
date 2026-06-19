import React from 'react';
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { MapPin, ArrowRight } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { HazmatMaterialSummaryContent } from './HazmatMaterialSummaryContent';

interface HazmatMaterialSummaryDialogProps {
  material: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  amountValue?: number;
  unitName?: string;
  departments?: any[];
  onPrint?: () => void;
  onNavigateToPool?: () => void;
  onNavigateToLocations?: () => void;
}

export function HazmatMaterialSummaryDialog({
  material,
  isOpen,
  onOpenChange,
  amountValue,
  unitName,
  departments,
  onPrint,
  onNavigateToPool,
  onNavigateToLocations
}: HazmatMaterialSummaryDialogProps) {
  if (!material) return null;

  // Use the explicitly provided departments array, or fallback to the material.inventory array if populated
  const displayDepartments = departments || (material.inventory || []).map((inv: any) => inv.department);
  const totalDepartments = displayDepartments.length;
  const topDepartments = displayDepartments.slice(0, 3);

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        
        <HazmatMaterialSummaryContent 
          material={material}
          amountValue={amountValue}
          unitName={unitName}
          onPrint={onPrint}
          onNavigateToPool={onNavigateToPool}
        />

        <Separator className="my-2" />

        {/* Bulunduğu Departmanlar (Özet) */}
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="w-4 h-4" /> Atandığı Konumlar ({totalDepartments})
            </div>
          </h3>
          
          {totalDepartments > 0 ? (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {topDepartments.map((dept: any, index: number) => {
                  const isCart = dept.isCleaningCart || dept.name?.includes('[Temizlik Arabası]');
                  const label = dept.name && dept.name.includes(']') ? dept.name : 
                    `${isCart ? '[Temizlik Arabası] ' : ''}${dept.building ? dept.building + ' / ' : ''}${dept.floor ? dept.floor + ' / ' : ''}${dept.name || ''} ${dept.description ? '/ ' + dept.description : ''}`.trim() || 'İsimsiz Lokasyon';
                  
                  return (
                    <div key={dept.id || index} className="flex items-start gap-2 bg-muted/20 p-2 rounded border line-clamp-2" title={label}>
                      <MapPin className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                      <span className="text-xs">{label}</span>
                    </div>
                  );
                })}
              </div>
              
              {onNavigateToLocations && (
                <Button 
                  className="w-full" 
                  variant="outline" 
                  onClick={onNavigateToLocations}
                >
                  Tüm Lokasyonları Gör ({totalDepartments}) <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              )}
            </div>
          ) : (
            <span className="text-sm text-muted-foreground italic">Tesiste hiçbir departmana atanmamış.</span>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
