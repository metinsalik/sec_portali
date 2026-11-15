import { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Box, Shield, AlertTriangle, Printer, ExternalLink, Download } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BASE_URL } from '@/lib/api';
import { Dialog, DialogContent } from "@/components/ui/dialog";

interface HazmatMaterialSummaryContentProps {
  material: any;
  amountValue?: number;
  unitName?: string;
  onPrint?: () => void;
  onNavigateToPool?: () => void;
}

export function HazmatMaterialSummaryContent({
  material,
  amountValue,
  unitName,
  onPrint,
  onNavigateToPool
}: HazmatMaterialSummaryContentProps) {
  const [isImageOpen, setIsImageOpen] = useState(false);

  if (!material) return null;

  return (
    <div className="space-y-5 font-sans">
      {/* Header: Title, Image, Category and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div className="flex items-start gap-3.5">
          {material.imageUrl ? (
            <img 
              src={`${BASE_URL}${material.imageUrl}`} 
              alt={material.productName} 
              className="w-16 h-16 object-contain rounded-xl border border-border/80 bg-white p-1 shadow-2xs cursor-pointer hover:opacity-85 transition-opacity shrink-0"
              onClick={() => setIsImageOpen(true)}
              title="Görseli büyüt"
            />
          ) : (
            <div className="w-14 h-14 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Box className="w-7 h-7" />
            </div>
          )}
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold tracking-tight text-foreground leading-snug">
              {material.brandName ? `${material.brandName} - ` : ''}{material.productName}
            </h2>
            <div className="flex flex-wrap items-center gap-2 pt-0.5">
              {material.category?.name && (
                <Badge variant="outline" className="text-xs bg-muted/40 font-medium">
                  Kategori: {material.category.name}
                </Badge>
              )}
              {(amountValue !== undefined && amountValue !== null && unitName) && (
                <Badge variant="secondary" className="text-xs font-semibold">
                  Ambalaj: {amountValue} {unitName}
                </Badge>
              )}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateToPool && (
            <Button
              variant="outline"
              size="sm"
              onClick={onNavigateToPool}
              className="h-8 text-xs font-medium gap-1.5 shadow-2xs"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              Maddeye Git
            </Button>
          )}
          {onPrint && (
            <Button
              variant="outline"
              size="sm"
              onClick={onPrint}
              className="h-8 text-xs font-medium gap-1.5 shadow-2xs text-emerald-600 hover:text-emerald-700"
            >
              <Printer className="w-3.5 h-3.5" />
              Bilgi Kartı
            </Button>
          )}
          {material.sdsUrl && (
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs font-medium gap-1.5 shadow-2xs"
              onClick={() => window.open(`${BASE_URL}${material.sdsUrl}`, '_blank')}
            >
              <Download className="w-3.5 h-3.5" />
              SDS İndir
            </Button>
          )}
        </div>
      </div>

      {/* Pictograms: GHS and ADR */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
        {/* GHS Tehlike Piktogramları */}
        <div className="bg-muted/20 border border-border/70 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-red-500" /> GHS Tehlike Piktogramları
          </h3>
          <div className="flex flex-wrap gap-2">
            {material.hazardLabels && material.hazardLabels.length > 0 ? (
              material.hazardLabels.map((hl: any) => (
                <div
                  key={hl.label?.id || hl.id}
                  className="flex flex-col items-center bg-card p-2 rounded-xl border border-border/80 shadow-2xs w-[88px] text-center gap-1.5 transition-all hover:border-primary/40"
                >
                  <img
                    src={hl.label?.imageUrl}
                    alt={hl.label?.name}
                    className="w-12 h-12 object-contain bg-white rounded-md p-0.5"
                    title={hl.label?.name}
                  />
                  <span className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">
                    {hl.label?.name}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">GHS işareti belirtilmemiş</span>
            )}
          </div>
        </div>

        {/* ADR Taşıma İşaretleri */}
        <div className="bg-muted/20 border border-border/70 rounded-xl p-3.5 space-y-2.5">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> TDR (ADR) Taşıma İşaretleri
          </h3>
          <div className="flex flex-wrap gap-2">
            {material.adrLabels && material.adrLabels.length > 0 ? (
              material.adrLabels.map((al: any) => (
                <div
                  key={al.label?.id || al.id}
                  className="flex flex-col items-center bg-card p-2 rounded-xl border border-border/80 shadow-2xs w-[88px] text-center gap-1.5 transition-all hover:border-primary/40"
                >
                  <img
                    src={al.label?.imageUrl}
                    alt={al.label?.name}
                    className="w-12 h-12 object-contain bg-white rounded-md p-0.5"
                    title={al.label?.name}
                  />
                  <span className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">
                    {al.label?.name}
                  </span>
                </div>
              ))
            ) : (
              <span className="text-xs text-muted-foreground italic">TDR (ADR) işareti belirtilmemiş</span>
            )}
          </div>
        </div>
      </div>

      {/* Kişisel Koruyucu Donanım (KKD) */}
      <div className="bg-muted/20 border border-border/70 rounded-xl p-3.5 space-y-2.5">
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Shield className="w-3.5 h-3.5 text-primary" /> Kişisel Koruyucu Donanım (KKD)
        </h3>
        <div className="flex flex-wrap gap-2">
          {material.ppes && material.ppes.length > 0 ? (
            material.ppes.map((ppeItem: any) => (
              <div
                key={ppeItem.ppe?.id || ppeItem.id}
                className="flex flex-col items-center bg-card p-2 rounded-xl border border-border/80 shadow-2xs w-[88px] text-center gap-1.5 transition-all hover:border-primary/40"
              >
                <img
                  src={ppeItem.ppe?.imageUrl}
                  alt={ppeItem.ppe?.name}
                  className="w-12 h-12 object-contain rounded-full bg-blue-50/60 p-0.5"
                  title={ppeItem.ppe?.name}
                />
                <span className="text-[10px] font-medium text-foreground leading-tight line-clamp-2">
                  {ppeItem.ppe?.name}
                </span>
              </div>
            ))
          ) : (
            <span className="text-xs text-muted-foreground italic">Özel KKD belirtilmemiş</span>
          )}
        </div>
      </div>

      {/* Görsel Lightbox Modal */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-3xl p-1 bg-transparent border-none shadow-none flex items-center justify-center">
          <img 
            src={`${BASE_URL}${material.imageUrl}`} 
            alt={material.productName} 
            className="max-w-full max-h-[85vh] object-contain rounded-xl bg-white shadow-2xl"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
