import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { 
  Box, AlertTriangle, Shield, Printer, ExternalLink, Download, 
  MapPin, Building2, ChevronRight, PackageCheck
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { BASE_URL } from '@/lib/api';

interface HazmatMaterialSummaryDialogProps {
  material: any;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  amountValue?: number;
  unitName?: string;
  departments?: any[];
  facilities?: any[];
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
  facilities,
  onPrint,
  onNavigateToPool,
  onNavigateToLocations
}: HazmatMaterialSummaryDialogProps) {
  const navigate = useNavigate();
  const [isImageOpen, setIsImageOpen] = useState(false);

  if (!material) return null;

  const displayDepartments = departments || (material.inventory || []).map((inv: any) => inv.location || inv.department);
  const totalDepartments = displayDepartments.length;

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-4xl w-full p-5 sm:p-6 rounded-2xl border border-border/80 shadow-2xl bg-card overflow-x-hidden">
          <DialogHeader className="sr-only">
            <DialogTitle>{material.productName} Özeti</DialogTitle>
            <DialogDescription>Tehlikeli madde güvenlik ve lokasyon bilgileri</DialogDescription>
          </DialogHeader>

          {/* 1. Üst Başlık & Butonlar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3.5 border-b border-border/70 pb-4">
            <div className="flex items-center gap-3 min-w-0">
              {material.imageUrl ? (
                <img 
                  src={`${BASE_URL}${material.imageUrl}`} 
                  alt={material.productName} 
                  className="w-12 h-12 object-contain rounded-xl border border-border/80 bg-white p-1 shadow-2xs cursor-pointer hover:opacity-85 transition-opacity shrink-0"
                  onClick={() => setIsImageOpen(true)}
                  title="Görseli büyüt"
                />
              ) : (
                <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Box className="w-6 h-6" />
                </div>
              )}
              <div className="min-w-0 space-y-0.5">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground truncate">
                  {material.brandName ? `${material.brandName} - ` : ''}{material.productName}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 text-xs">
                  {material.category?.name && (
                    <Badge variant="outline" className="text-[11px] bg-muted/40 font-medium h-5 px-2">
                      {material.category.name}
                    </Badge>
                  )}
                  {(amountValue !== undefined && amountValue !== null && unitName) && (
                    <Badge variant="secondary" className="text-[11px] font-semibold h-5 px-2 bg-primary/10 text-primary border-none">
                      Ambalaj: {amountValue} {unitName}
                    </Badge>
                  )}
                </div>
              </div>
            </div>

            {/* Aksiyon Butonları */}
            <div className="flex items-center gap-1.5 shrink-0">
              {onNavigateToPool && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onNavigateToPool}
                  className="h-8 text-xs font-medium gap-1.5 shadow-2xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>Maddeye Git</span>
                </Button>
              )}
              {onPrint && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onPrint}
                  className="h-8 text-xs font-medium gap-1.5 shadow-2xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Bilgi Kartı</span>
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
                  <span>SDS</span>
                </Button>
              )}
            </div>
          </div>

          {/* 2. Ana Gövde: 2 Sütunlu Kompakt Yapı (Scroll Olmadan Tüm Bilgi Ekranda) */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
            {/* Sol Sütun: Güvenlik, Piktogramlar ve KKD */}
            <div className="space-y-3.5">
              {/* GHS Tehlike Piktogramları */}
              <div className="bg-muted/20 border border-border/70 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-500" /> GHS Tehlike Piktogramları
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {material.hazardLabels && material.hazardLabels.length > 0 ? (
                    material.hazardLabels.map((hl: any) => (
                      <div
                        key={hl.label?.id || hl.id}
                        className="flex items-center gap-2 bg-card p-1.5 px-2.5 rounded-lg border border-border/70 shadow-2xs text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
                        title={hl.label?.name}
                      >
                        {hl.label?.imageUrl ? (
                          <img
                            src={hl.label?.imageUrl}
                            alt={hl.label?.name}
                            className="w-5 h-5 object-contain bg-white rounded p-0.5"
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                        )}
                        <span className="text-[11px]">{hl.label?.name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">GHS işareti belirtilmemiş</span>
                  )}
                </div>
              </div>

              {/* ADR Taşıma İşaretleri */}
              <div className="bg-muted/20 border border-border/70 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500" /> ADR Taşıma İşaretleri
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {material.adrLabels && material.adrLabels.length > 0 ? (
                    material.adrLabels.map((al: any) => (
                      <div
                        key={al.label?.id || al.id}
                        className="flex items-center gap-2 bg-card p-1.5 px-2.5 rounded-lg border border-border/70 shadow-2xs text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
                        title={al.label?.name}
                      >
                        {al.label?.imageUrl ? (
                          <img
                            src={al.label?.imageUrl}
                            alt={al.label?.name}
                            className="w-5 h-5 object-contain bg-white rounded p-0.5"
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-amber-500" />
                        )}
                        <span className="text-[11px]">{al.label?.name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">ADR işareti belirtilmemiş</span>
                  )}
                </div>
              </div>

              {/* Kişisel Koruyucu Donanım (KKD) */}
              <div className="bg-muted/20 border border-border/70 rounded-xl p-3 space-y-2">
                <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Shield className="w-3.5 h-3.5 text-blue-500" /> Kişisel Koruyucu Donanım (KKD)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {material.ppes && material.ppes.length > 0 ? (
                    material.ppes.map((ppeItem: any) => (
                      <div
                        key={ppeItem.ppe?.id || ppeItem.id}
                        className="flex items-center gap-2 bg-card p-1.5 px-2.5 rounded-lg border border-border/70 shadow-2xs text-xs font-medium text-foreground hover:border-primary/40 transition-colors"
                        title={ppeItem.ppe?.name}
                      >
                        {ppeItem.ppe?.imageUrl ? (
                          <img
                            src={ppeItem.ppe?.imageUrl}
                            alt={ppeItem.ppe?.name}
                            className="w-5 h-5 object-contain rounded-full bg-blue-50/60 p-0.5"
                          />
                        ) : (
                          <span className="w-2 h-2 rounded-full bg-blue-500" />
                        )}
                        <span className="text-[11px]">{ppeItem.ppe?.name}</span>
                      </div>
                    ))
                  ) : (
                    <span className="text-xs text-muted-foreground italic">Özel KKD belirtilmemiş</span>
                  )}
                </div>
              </div>
            </div>

            {/* Sağ Sütun: Tanımlı Tesisler ve Lokasyonlar */}
            <div className="space-y-3.5">
              {/* Tanımlı Olduğu Tesisler */}
              {facilities && facilities.length > 0 && (
                <div className="bg-muted/20 border border-border/70 rounded-xl p-3 space-y-2">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-primary" /> Tanımlı Olduğu Tesisler ({facilities.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {facilities.map((fac: any, idx: number) => (
                      <span
                        key={fac.facilityId || idx}
                        className="inline-flex items-center gap-1.5 bg-card px-2.5 py-1 rounded-md border border-border/70 text-xs text-foreground shadow-2xs font-medium"
                      >
                        <Building2 className="w-3 h-3 text-muted-foreground" />
                        <span>{fac.facilityName || 'Tesis'}</span>
                        {fac.amountValue ? (
                          <Badge variant="outline" className="text-[10px] h-4 px-1 ml-0.5 font-mono">
                            {fac.amountValue} {fac.unitSymbol || fac.unitName || ''}
                          </Badge>
                        ) : null}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Atandığı Konumlar / Departmanlar */}
              <div className="bg-muted/20 border border-border/70 rounded-xl p-3 space-y-2">
                <div 
                  onClick={() => {
                    onOpenChange(false);
                    navigate(`/hazmat/inventory/material/${material.id}`);
                  }}
                  className="flex items-center justify-between cursor-pointer group hover:text-primary transition-colors select-none"
                  title="Tüm konumlardaki toplam miktar ve dağılım detaylarını gör"
                >
                  <span className="text-[11px] font-bold text-muted-foreground group-hover:text-primary uppercase tracking-wider flex items-center gap-1.5 transition-colors">
                    <MapPin className="w-3.5 h-3.5 text-primary" /> Atandığı Konumlar ({totalDepartments})
                  </span>
                  <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                </div>

                {totalDepartments > 0 ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-1 gap-1.5 max-h-[220px] overflow-y-auto pr-1">
                      {displayDepartments.slice(0, 6).filter(Boolean).map((dept: any, index: number) => {
                        const isCart = dept.isCleaningCart || dept.name?.includes('[Temizlik Arabası]');
                        const label = dept.name && dept.name.includes(']') ? dept.name : 
                          `${isCart ? '[Temizlik Arabası] ' : ''}${dept.building ? dept.building + ' / ' : ''}${dept.floor ? dept.floor + ' / ' : ''}${dept.department ? dept.department + ' / ' : ''}${dept.name || dept.description || ''}`.trim().replace(/\/$/, '').trim() || 'İsimsiz Lokasyon';
                        
                        return (
                          <div
                            key={dept.id || index}
                            onClick={() => {
                              onOpenChange(false);
                              if (dept.id) {
                                navigate(`/hazmat/departments/${dept.id}`);
                              } else {
                                navigate(`/hazmat/inventory/material/${material.id}`);
                              }
                            }}
                            className="flex items-center justify-between bg-card p-2 rounded-lg border border-border/70 shadow-2xs text-xs text-foreground cursor-pointer hover:border-primary/50 hover:bg-muted/40 transition-all group"
                            title={`${label} - Konuma gitmek için tıklayın`}
                          >
                            <div className="flex items-center gap-2 min-w-0 pr-2">
                              <MapPin className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                              <span className="truncate leading-tight font-medium group-hover:text-primary transition-colors" title={label}>{label}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isCart && (
                                <Badge variant="secondary" className="text-[9px] h-4 px-1">
                                  Araba
                                </Badge>
                              )}
                              <ChevronRight className="w-3 h-3 text-muted-foreground/60 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    
                    <Button 
                      className="w-full h-7 text-xs font-medium shadow-2xs gap-1 mt-1 text-primary hover:text-primary" 
                      variant="ghost" 
                      onClick={() => {
                        onOpenChange(false);
                        navigate(`/hazmat/inventory/material/${material.id}`);
                      }}
                    >
                      <span>Tüm {totalDepartments} Lokasyondaki Miktar ve Detayları Gör</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground italic block py-2">
                    Tesiste henüz hiçbir departmana atanmamış.
                  </span>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Görsel Büyütme Lightbox */}
      {isImageOpen && (
        <Dialog open={isImageOpen} onOpenChange={setIsImageOpen}>
          <DialogContent className="max-w-2xl p-2 bg-transparent border-none shadow-none flex items-center justify-center">
            <img 
              src={`${BASE_URL}${material.imageUrl}`} 
              alt={material.productName} 
              className="max-w-full max-h-[80vh] object-contain rounded-xl bg-white p-2 shadow-2xl"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}
