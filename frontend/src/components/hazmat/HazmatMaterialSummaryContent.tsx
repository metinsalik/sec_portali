import React, { useState } from 'react';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Box, Shield, AlertTriangle, Info, Printer, ExternalLink, Download } from 'lucide-react';
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
    <div className="grid gap-6">
      {/* Başlık ve Görsel */}
      <div className="flex items-start gap-4 mb-2">
        {material.imageUrl ? (
          <img 
            src={`${BASE_URL}${material.imageUrl}`} 
            alt={material.productName} 
            className="w-20 h-20 object-contain rounded-lg border bg-white shadow-sm cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setIsImageOpen(true)}
          />
        ) : (
          <div className="bg-primary/10 text-primary p-4 rounded-lg flex items-center justify-center shrink-0">
            <Box className="w-12 h-12" />
          </div>
        )}
        <div>
          <h2 className="text-2xl font-bold">{material.brandName ? `${material.brandName} - ` : ''}{material.productName}</h2>
          {material.category?.name && (
            <div className="text-sm font-normal text-muted-foreground mt-1">
              Kategori: {material.category.name}
            </div>
          )}
        </div>
      </div>

      {/* Miktar, Birim ve Butonlar */}
      <div className="flex flex-col sm:flex-row gap-4">
        {(amountValue !== undefined && unitName) && (
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
              <Info className="w-4 h-4" /> Ambalaj / Miktar
            </h3>
            <div className="flex items-center gap-2 text-lg font-medium bg-muted/30 p-3 rounded-lg border h-[42px]">
              {amountValue} {unitName}
            </div>
          </div>
        )}
        
        {(onPrint || onNavigateToPool || material.sdsUrl) && (
          <div className="flex-1 flex flex-col justify-end gap-2">
            {(onPrint || onNavigateToPool) && (
              <div className="flex gap-2">
                {onNavigateToPool && (
                  <Button className="flex-1 shadow-sm" variant="outline" onClick={onNavigateToPool}>
                    <ExternalLink className="w-4 h-4 mr-2" /> Maddeye Git
                  </Button>
                )}
                {onPrint && (
                  <Button className="flex-1 shadow-sm" variant="outline" onClick={onPrint}>
                    <Printer className="w-4 h-4 mr-2 text-blue-600" /> Bilgi Kartı
                  </Button>
                )}
              </div>
            )}
            {material.sdsUrl && (
              <Button 
                variant="outline" 
                className="w-full shadow-sm"
                onClick={() => window.open(`${BASE_URL}${material.sdsUrl}`, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Güvenlik Bilgi Formunu (SDS) İndir
              </Button>
            )}
          </div>
        )}
      </div>

      {/* İşaretler ve Etiketler */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-2">
        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> GHS İşaretleri
          </h3>
          <div className="flex flex-wrap gap-2">
            {material.hazardLabels?.length > 0 ? (
              material.hazardLabels.map((hl: any) => (
                <div key={hl.label.id} className="flex flex-col items-center bg-muted/30 p-2 rounded-lg border w-[80px]">
                  <img src={hl.label.imageUrl} alt={hl.label.name} className="w-10 h-10 object-contain bg-white rounded-full border border-background shadow-sm" title={hl.label.name} />
                  <span className="text-[10px] text-center mt-1 text-muted-foreground leading-tight line-clamp-2">{hl.label.name}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">GHS İşareti yok</span>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-500" /> TDR (ADR) İşaretleri
          </h3>
          <div className="flex flex-wrap gap-2">
            {material.adrLabels?.length > 0 ? (
              material.adrLabels.map((al: any) => (
                <div key={al.label.id} className="flex flex-col items-center bg-muted/30 p-2 rounded-lg border w-[80px]">
                  <img src={al.label.imageUrl} alt={al.label.name} className="w-10 h-10 object-contain bg-white rounded-full border border-background shadow-sm" title={al.label.name} />
                  <span className="text-[10px] text-center mt-1 text-muted-foreground leading-tight line-clamp-2">{al.label.name}</span>
                </div>
              ))
            ) : (
              <span className="text-sm text-muted-foreground italic">TDR İşareti yok</span>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Kişisel Koruyucu Donanım (KKD) */}
      <div>
        <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-2">
          <Shield className="w-4 h-4" /> Kişisel Koruyucu Donanım (KKD)
        </h3>
        <div className="flex flex-wrap gap-2">
          {material.ppes?.length > 0 ? (
            material.ppes.map((ppeItem: any) => (
              <div key={ppeItem.ppe.id} className="flex flex-col items-center bg-muted/30 p-2 rounded-lg border w-[80px]">
                <img src={ppeItem.ppe.imageUrl} alt={ppeItem.ppe.name} className="w-10 h-10 object-contain bg-white rounded-full border border-background shadow-sm" title={ppeItem.ppe.name} />
                <span className="text-[10px] text-center mt-1 text-muted-foreground leading-tight line-clamp-2">{ppeItem.ppe.name}</span>
              </div>
            ))
          ) : (
            <span className="text-sm text-muted-foreground italic">Özel KKD belirtilmemiş</span>
          )}
        </div>
      </div>

      {/* Görsel Lightbox Modal */}
      <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
        <DialogContent className="max-w-4xl p-1 bg-transparent border-none shadow-none flex items-center justify-center">
          <img 
            src={`${BASE_URL}${material.imageUrl}`} 
            alt={material.productName} 
            className="max-w-full max-h-[85vh] object-contain rounded-lg bg-white"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
