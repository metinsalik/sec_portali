import React, { useMemo, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import api, { BASE_URL } from '@/lib/api';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MapPin, ArrowLeft, Building2, Package, Layers, AlertTriangle, 
  Shield, Printer, ExternalLink, Download, ChevronRight, Droplets, Scale, Box
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { Dialog, DialogContent } from '@/components/ui/dialog';

// Helper function to convert raw piece counts and packaging size to normalized Liters (L) or Kilograms (kg)
function formatNormalizedQuantity(pieces: number, packageAmount: number | null | undefined, unitSymbol: string | null | undefined, unitName: string | null | undefined) {
  const sym = (unitSymbol || '').toLowerCase().trim();
  const nm = (unitName || '').toLowerCase().trim();
  const amt = packageAmount && packageAmount > 0 ? packageAmount : 1;
  const rawTotal = pieces * amt;

  if (sym === 'l' || sym === 'lt' || nm === 'litre' || nm === 'liter') {
    return {
      type: 'liquid',
      pieces,
      normalizedValue: rawTotal,
      formatted: `${rawTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L`
    };
  } else if (sym === 'ml' || nm === 'mililitre' || nm === 'milliliter') {
    const inL = rawTotal / 1000;
    return {
      type: 'liquid',
      pieces,
      normalizedValue: inL,
      formatted: `${inL.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L (${rawTotal.toLocaleString('tr-TR')} mL)`
    };
  } else if (sym === 'cl' || nm === 'santilitre') {
    const inL = rawTotal / 100;
    return {
      type: 'liquid',
      pieces,
      normalizedValue: inL,
      formatted: `${inL.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L`
    };
  } else if (sym === 'm³' || sym === 'm3' || nm === 'metreküp') {
    const inL = rawTotal * 1000;
    return {
      type: 'liquid',
      pieces,
      normalizedValue: inL,
      formatted: `${inL.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} L (${rawTotal} m³)`
    };
  } else if (sym === 'kg' || nm === 'kilogram') {
    return {
      type: 'solid',
      pieces,
      normalizedValue: rawTotal,
      formatted: `${rawTotal.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg`
    };
  } else if (sym === 'g' || sym === 'gr' || nm === 'gram') {
    const inKg = rawTotal / 1000;
    return {
      type: 'solid',
      pieces,
      normalizedValue: inKg,
      formatted: `${inKg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg (${rawTotal.toLocaleString('tr-TR')} g)`
    };
  } else if (sym === 'mg' || nm === 'miligram') {
    const inKg = rawTotal / 1000000;
    return {
      type: 'solid',
      pieces,
      normalizedValue: inKg,
      formatted: `${inKg.toLocaleString('tr-TR', { maximumFractionDigits: 4 })} kg`
    };
  } else if (sym === 'ton' || sym === 't' || nm === 'ton') {
    const inKg = rawTotal * 1000;
    return {
      type: 'solid',
      pieces,
      normalizedValue: inKg,
      formatted: `${inKg.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} kg`
    };
  }

  return {
    type: 'piece',
    pieces,
    normalizedValue: pieces,
    formatted: `${pieces} Adet`
  };
}

export default function HazmatFacilityMaterialPage() {
  const { id: materialId } = useParams();
  const navigate = useNavigate();
  const activeFacilityId = useActiveFacility();
  const [printMaterial, setPrintMaterial] = useState<any>(null);
  const [isImageOpen, setIsImageOpen] = useState(false);

  const effectiveFacilityId = activeFacilityId || localStorage.getItem('activeFacilityId') || 'all';

  const { data: summaryData = [], isLoading } = useQuery({
    queryKey: ['inventory-summary-material', effectiveFacilityId, materialId],
    queryFn: async () => {
      // First try effective facility
      let res = await api.get(`/hazmat/inventory/summary?facilityId=${encodeURIComponent(effectiveFacilityId)}`);
      if (res.ok) {
        const data = await res.json();
        const items = data.facilityItems || [];
        const found = items.find((item: any) => item.material?.id === materialId);
        if (found) return items;
      }
      // If not found in effective facility, search all facilities
      res = await api.get('/hazmat/inventory/summary?facilityId=all');
      if (res.ok) {
        const data = await res.json();
        return data.facilityItems || [];
      }
      return [];
    },
    refetchOnMount: 'always'
  });

  const facilityItem = useMemo(() => {
    if (!summaryData || summaryData.length === 0) return null;
    return summaryData.find((item: any) => item.material?.id === materialId) || null;
  }, [summaryData, materialId]);

  const { totalMinPieces, totalMaxPieces, departments } = useMemo(() => {
    if (!facilityItem || !facilityItem.material || !facilityItem.material.inventory) {
      return { totalMinPieces: 0, totalMaxPieces: 0, departments: [] };
    }
    
    let tMin = 0;
    let tMax = 0;
    const depts: any[] = [];

    facilityItem.material.inventory.forEach((invItem: any) => {
      tMin += (invItem.minQuantity || 0);
      tMax += (invItem.maxQuantity || 0);
      const loc = invItem.location || invItem.department;
      if (loc) {
        depts.push({
          ...loc,
          inventoryItem: invItem
        });
      }
    });

    return { totalMinPieces: tMin, totalMaxPieces: tMax, departments: depts };
  }, [facilityItem]);

  // Normalized calculations for totals
  const minStats = useMemo(() => {
    return formatNormalizedQuantity(
      totalMinPieces, 
      facilityItem?.amountValue, 
      facilityItem?.unit?.symbol, 
      facilityItem?.unit?.name
    );
  }, [totalMinPieces, facilityItem]);

  const maxStats = useMemo(() => {
    return formatNormalizedQuantity(
      totalMaxPieces, 
      facilityItem?.amountValue, 
      facilityItem?.unit?.symbol, 
      facilityItem?.unit?.name
    );
  }, [totalMaxPieces, facilityItem]);


  if (isLoading) {
    return (
      <div className="p-6 max-w-6xl mx-auto space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded-lg" />
        <div className="h-44 w-full bg-muted animate-pulse rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="h-24 bg-muted animate-pulse rounded-xl" />
          <div className="h-24 bg-muted animate-pulse rounded-xl" />
          <div className="h-24 bg-muted animate-pulse rounded-xl" />
          <div className="h-24 bg-muted animate-pulse rounded-xl" />
        </div>
      </div>
    );
  }

  if (!facilityItem) {
    return (
      <div className="p-12 text-center border border-border/80 rounded-2xl m-6 bg-card max-w-lg mx-auto shadow-sm space-y-3">
        <Building2 className="w-12 h-12 text-muted-foreground/40 mx-auto" />
        <h3 className="text-base font-bold text-foreground">Malzeme Bulunamadı</h3>
        <p className="text-xs text-muted-foreground">Bu tehlikeli madde bu tesise henüz eklenmemiş.</p>
        <Button size="sm" onClick={() => navigate(-1)} className="text-xs">Geri Dön</Button>
      </div>
    );
  }

  const material = facilityItem.material;
  const isLiquid = minStats.type === 'liquid';

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-5 font-sans antialiased">
      {/* Üst Bar: Navigasyon ve Butonlar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-3.5">
        <div className="flex items-center gap-3">
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => navigate(-1)}
            className="h-8 w-8 rounded-lg shadow-2xs"
            title="Geri Dön"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Tesis Geneli Kimyasal Durumu
            </h1>
            <p className="text-xs text-muted-foreground font-medium">
              {facilityItem.facility?.name || 'Seçili Tesis'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate(`/hazmat/materials/view/${material.id}`)}
            className="h-8 text-xs font-medium gap-1.5 shadow-2xs"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Havuz Kartı</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPrintMaterial(material)}
            className="h-8 text-xs font-medium gap-1.5 shadow-2xs text-emerald-600 dark:text-emerald-400 hover:text-emerald-700"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Bilgi Kartı</span>
          </Button>
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

      {/* 1. Üst Kısım: Malzeme Kimlik ve Güvenlik Kartı (Design System Standart) */}
      <Card className="shadow-2xs border-border/70 bg-card overflow-hidden">
        <CardContent className="p-4 sm:p-5 space-y-4">
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
                <div className="w-16 h-16 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0 border border-primary/20">
                  <Box className="w-8 h-8" />
                </div>
              )}
              <div className="space-y-1">
                <h2 className="text-base sm:text-lg font-bold tracking-tight text-foreground leading-snug">
                  {material.brandName ? `${material.brandName} - ` : ''}{material.productName}
                </h2>
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  {material.category?.name && (
                    <Badge variant="outline" className="text-xs bg-muted/40 font-medium">
                      {material.category.name}
                    </Badge>
                  )}
                  {facilityItem.amountValue ? (
                    <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary border-none">
                      Birim Ambalaj: {facilityItem.amountValue} {facilityItem.unit?.symbol || facilityItem.unit?.name || ''}
                    </Badge>
                  ) : null}
                </div>
              </div>
            </div>
          </div>

          {/* Tehlike Piktogramları, Taşıma ve KKD Çipleri */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t border-border/60">
            {/* GHS Piktogramları */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-rose-500" /> GHS Tehlike Piktogramları
              </span>
              <div className="flex flex-wrap gap-1.5">
                {material.hazardLabels && material.hazardLabels.length > 0 ? (
                  material.hazardLabels.map((hl: any) => (
                    <div 
                      key={hl.label?.id || hl.id}
                      className="flex items-center gap-1.5 bg-muted/30 border border-border/60 rounded-md p-1 px-2 text-[11px] font-medium"
                    >
                      {hl.label?.imageUrl && (
                        <img src={hl.label.imageUrl} alt={hl.label.name} className="w-4 h-4 object-contain bg-white rounded p-0.5" />
                      )}
                      <span>{hl.label?.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Belirtilmemiş</span>
                )}
              </div>
            </div>

            {/* ADR Taşıma İşaretleri */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-amber-500" /> ADR Taşıma İşaretleri
              </span>
              <div className="flex flex-wrap gap-1.5">
                {material.adrLabels && material.adrLabels.length > 0 ? (
                  material.adrLabels.map((al: any) => (
                    <div 
                      key={al.label?.id || al.id}
                      className="flex items-center gap-1.5 bg-muted/30 border border-border/60 rounded-md p-1 px-2 text-[11px] font-medium"
                    >
                      {al.label?.imageUrl && (
                        <img src={al.label.imageUrl} alt={al.label.name} className="w-4 h-4 object-contain bg-white rounded p-0.5" />
                      )}
                      <span>{al.label?.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Belirtilmemiş</span>
                )}
              </div>
            </div>

            {/* KKD */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
                <Shield className="w-3 h-3 text-blue-500" /> Kişisel Koruyucu Donanım
              </span>
              <div className="flex flex-wrap gap-1.5">
                {material.ppes && material.ppes.length > 0 ? (
                  material.ppes.map((ppeItem: any) => (
                    <div 
                      key={ppeItem.ppe?.id || ppeItem.id}
                      className="flex items-center gap-1.5 bg-muted/30 border border-border/60 rounded-md p-1 px-2 text-[11px] font-medium"
                    >
                      {ppeItem.ppe?.imageUrl && (
                        <img src={ppeItem.ppe.imageUrl} alt={ppeItem.ppe.name} className="w-4 h-4 object-contain rounded-full bg-blue-50/60 p-0.5" />
                      )}
                      <span>{ppeItem.ppe?.name}</span>
                    </div>
                  ))
                ) : (
                  <span className="text-xs text-muted-foreground italic">Belirtilmemiş</span>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 2. Orta Kısım: Tesis Toplam Miktarları (4'lü KPI Kartları - Adet ve Litre/Kg net) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        {/* KPI 1: Birim Ambalaj */}
        <Card className="shadow-2xs border-border/70 bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0 border border-blue-500/20">
              <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">BİRİM AMBALAJ</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {facilityItem.amountValue || '-'}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">
                  {facilityItem.unit?.symbol || facilityItem.unit?.name || 'Birim'}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* KPI 2: Tesis Geneli Minimum Miktar */}
        <Card className="shadow-2xs border-border/70 bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-cyan-500/10 flex items-center justify-center shrink-0 border border-cyan-500/20">
              <Droplets className="w-5 h-5 text-cyan-600 dark:text-cyan-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">MİNİMUM MİKTAR</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-cyan-600 dark:text-cyan-400">
                  {totalMinPieces}
                </span>
                <span className="text-xs font-bold text-foreground">Adet</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 truncate">
                Toplam: {minStats.formatted}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 3: Tesis Geneli Maksimum Miktar */}
        <Card className="shadow-2xs border-border/70 bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 flex items-center justify-center shrink-0 border border-indigo-500/20">
              <Scale className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">MAKSİMUM MİKTAR</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-indigo-600 dark:text-indigo-400">
                  {totalMaxPieces}
                </span>
                <span className="text-xs font-bold text-foreground">Adet</span>
              </div>
              <p className="text-[11px] text-muted-foreground font-semibold mt-0.5 truncate">
                Toplam: {maxStats.formatted}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* KPI 4: Bulunduğu Lokasyon Sayısı */}
        <Card className="shadow-2xs border-border/70 bg-card">
          <CardContent className="p-3.5 sm:p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 border border-emerald-500/20">
              <MapPin className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">LOKASYON SAYISI</p>
              <div className="flex items-baseline gap-1 mt-0.5">
                <span className="text-xl sm:text-2xl font-black text-foreground">
                  {departments.length}
                </span>
                <span className="text-xs text-muted-foreground font-medium">alan</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3. Alt Kısım: Bulunduğu Lokasyonlar Tablosu */}
      <Card className="shadow-2xs border-border/70 overflow-hidden bg-card">
        <CardHeader className="p-3.5 pb-2.5 border-b border-border/60 bg-muted/20 flex flex-row items-center justify-between space-y-0">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary/10 flex items-center justify-center border border-primary/20 shrink-0">
              <MapPin className="w-3.5 h-3.5 text-primary" />
            </div>
            <CardTitle className="text-xs sm:text-sm font-bold text-foreground">
              Bulunduğu Lokasyonlar ({departments.length})
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {departments.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/30">
                  <TableHead className="text-xs">Lokasyon / Birim / Mahal</TableHead>
                  <TableHead className="text-xs text-center">Bina / Kat</TableHead>
                  <TableHead className="text-xs text-center">Min. Miktar</TableHead>
                  <TableHead className="text-xs text-center">Maks. Miktar</TableHead>
                  <TableHead className="text-right text-xs">İşlem</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {departments.filter(Boolean).map((dept: any) => {
                  const isCart = dept.isCleaningCart || dept.name?.includes('[Temizlik Arabası]');
                  const nameStr = dept.name || dept.description || dept.department || dept.floor || dept.building || 'İsimsiz Lokasyon';
                  const minPieces = dept.inventoryItem?.minQuantity || 0;
                  const maxPieces = dept.inventoryItem?.maxQuantity || 0;
                  const deptMinStats = formatNormalizedQuantity(minPieces, facilityItem.amountValue, facilityItem.unit?.symbol, facilityItem.unit?.name);
                  const deptMaxStats = formatNormalizedQuantity(maxPieces, facilityItem.amountValue, facilityItem.unit?.symbol, facilityItem.unit?.name);

                  return (
                    <TableRow 
                      key={dept.id} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => navigate(`/hazmat/departments/${dept.id}`)}
                    >
                      <TableCell className="text-xs py-3">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                          <span className="font-semibold text-foreground group-hover:text-primary transition-colors">
                            {isCart && <Badge variant="secondary" className="mr-1.5 text-[9px] h-4 px-1">Temizlik Arabası</Badge>}
                            {nameStr}
                          </span>
                        </div>
                        {dept.description && dept.name && (
                          <div className="text-[11px] text-muted-foreground mt-0.5 ml-5">{dept.description}</div>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-center text-muted-foreground py-3">
                        {dept.building || '-'} {dept.floor ? `/ ${dept.floor}` : ''}
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="inline-flex flex-col items-center">
                          <Badge variant="outline" className="text-xs font-bold bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border-cyan-500/30">
                            {minPieces} Adet
                          </Badge>
                          {facilityItem.amountValue ? (
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {deptMinStats.formatted}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-center py-3">
                        <div className="inline-flex flex-col items-center">
                          <Badge variant="outline" className="text-xs font-bold bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/30">
                            {maxPieces} Adet
                          </Badge>
                          {facilityItem.amountValue ? (
                            <span className="text-[10px] text-muted-foreground font-mono mt-0.5">
                              {deptMaxStats.formatted}
                            </span>
                          ) : null}
                        </div>
                      </TableCell>
                      <TableCell className="text-right py-3" onClick={(e) => e.stopPropagation()}>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 px-2 text-xs text-primary hover:text-primary gap-1"
                          onClick={() => navigate(`/hazmat/departments/${dept.id}`)}
                        >
                          <span>Detay</span>
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center p-8 text-xs text-muted-foreground">
              Bu tehlikeli madde tesiste henüz hiçbir lokasyona atanmamış.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Yazdırma Modalı */}
      <PrintCardModal 
        isOpen={!!printMaterial}
        onClose={() => setPrintMaterial(null)}
        material={printMaterial}
      />

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
    </div>
  );
}
