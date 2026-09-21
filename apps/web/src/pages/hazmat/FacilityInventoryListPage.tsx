import { useState, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import api, { BASE_URL } from '@/lib/api';
import { useActiveFacility } from '@/hooks/useActiveFacility';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Search, Filter, Printer, ExternalLink, Download, LayoutGrid, Upload, Loader2, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { PrintCardModal } from '@/components/hazmat/PrintCardModal';
import { HazmatMaterialSummaryDialog } from '@/components/hazmat/HazmatMaterialSummaryDialog';
import { HazmatInventoryImportModal } from '@/components/hazmat/HazmatInventoryImportModal';
import { toast } from 'sonner';
import * as XLSX from 'xlsx';

export default function FacilityInventoryListPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const activeFacilityId = useActiveFacility();

  const [searchMaterial, setSearchMaterial] = useState('');
  const [searchDepartment, setSearchDepartment] = useState('');
  const [searchAdrCategory, setSearchAdrCategory] = useState('all');
  const [printMaterial, setPrintMaterial] = useState<any>(null);
  
  // Dialog state
  const [selectedGroup, setSelectedGroup] = useState<any>(null);

  // Import Modal State
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [parsedRowsForImport, setParsedRowsForImport] = useState<any[]>([]);
  const [isParsingExcel, setIsParsingExcel] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 0. Fetch facility locations for mapping
  const { data: facilityLocations = [] } = useQuery<any[]>({
    queryKey: ['facility-locations', activeFacilityId],
    queryFn: async () => {
      const facId = activeFacilityId || localStorage.getItem('activeFacilityId');
      if (!facId) return [];
      const res = await api.get(`/risks/facilities/${facId}/locations`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!(activeFacilityId || localStorage.getItem('activeFacilityId'))
  });

  // 1. Fetch summary for the list
  const { data: summaryData, isLoading } = useQuery({
    queryKey: ['inventory-summary', activeFacilityId],
    queryFn: async () => {
      const facId = activeFacilityId || localStorage.getItem('activeFacilityId');
      if (!facId) return [];
      const res = await api.get(`/hazmat/inventory/summary?facilityId=${facId}`);
      if (!res.ok) throw new Error('Failed to fetch summary');
      const data = await res.json();
      return data.facilityItems;
    },
    refetchOnMount: 'always',
    enabled: !!(activeFacilityId || localStorage.getItem('activeFacilityId'))
  });

  // 2. Fetch facility materials for amount and unit
  const { data: facilityItems = [] } = useQuery({
    queryKey: ['facility-materials', activeFacilityId],
    queryFn: async () => {
      const facId = activeFacilityId || localStorage.getItem('activeFacilityId');
      if (!facId) return [];
      const res = await api.get(`/hazmat/materials?facilityId=${facId}`);
      if (!res.ok) return [];
      return res.json();
    },
    refetchOnMount: 'always',
    enabled: !!(activeFacilityId || localStorage.getItem('activeFacilityId'))
  });

  // 3. Fetch ADR categories
  const { data: adrCategories = [] } = useQuery({
    queryKey: ['hazmat-hazard-labels'],
    queryFn: async () => {
      const res = await api.get('/hazmat/settings/hazard-labels');
      if (!res.ok) return [];
      return res.json();
    }
  });

  const groupedSummary = useMemo(() => {
    if (!summaryData) return [];
    
    return summaryData.map((facItem: any) => {
      const mat = facItem.material;
      
      const departments = (mat.inventory || [])
        .filter((invItem: any) => invItem.location || invItem.department)
        .map((invItem: any) => {
        const dept = invItem.location || invItem.department;
        const deptName = `${dept.isCleaningCart ? '[Temizlik Arabası] ' : ''}${dept.building ? dept.building + ' / ' : ''}${dept.floor ? dept.floor + ' / ' : ''}${dept.department ? dept.department + ' / ' : ''}${dept.name || dept.description || ''}`.trim().replace(/\/$/, '').trim() || 'İsimsiz Lokasyon';
        return {
          id: dept.id,
          name: deptName
        };
      });

      return {
        materialId: mat.id,
        productName: mat.productName,
        brandName: mat.brandName,
        categoryName: mat.category?.name || 'Kategorisiz',
        hazardLabels: mat.hazardLabels || [],
        ppes: mat.ppes || [],
        sdsUrl: mat.sdsUrl,
        departments,
        material: mat,
        amountValue: facItem.amountValue,
        unitName: facItem.unit?.name,
        unitSymbol: facItem.unit?.symbol
      };
    });
  }, [summaryData]);

  // Apply filters
  const filteredGroups = useMemo(() => {
    if (!groupedSummary) return [];
    let filtered = groupedSummary;

    if (searchMaterial) {
      const q = searchMaterial.toLowerCase();
      filtered = filtered.filter((g: any) => 
        g.productName?.toLowerCase().includes(q) || 
        g.brandName?.toLowerCase().includes(q)
      );
    }

    if (searchDepartment) {
      const q = searchDepartment.toLowerCase();
      filtered = filtered.filter((g: any) => 
        g.departments.some((d: any) => d.name.toLowerCase().includes(q))
      );
    }

    if (searchAdrCategory !== 'all') {
      filtered = filtered.filter((g: any) => 
        g.hazardLabels.some((hl: any) => hl.label.id === searchAdrCategory)
      );
    }

    return filtered;
  }, [groupedSummary, searchMaterial, searchDepartment, searchAdrCategory]);

  const handleExcelFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const facId = activeFacilityId || localStorage.getItem('activeFacilityId');
    if (!facId || facId === 'all') {
      toast.error('Lütfen Excel aktarımı yapmadan önce yukarıdaki menüden spesifik bir tesis seçin.');
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    const file = e.target.files?.[0];
    if (!file) return;

    setIsParsingExcel(true);
    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const wb = XLSX.read(bstr, { type: 'binary' });

        const rowsToImport: any[] = [];

        // Sheet selection preference:
        // If a sheet contains "TÜM BİRİM" or "FLORYA" or first non-empty sheet
        let targetSheetName = wb.SheetNames.find(s => s.toUpperCase().includes('TÜM BİRİM')) || wb.SheetNames[0];

        const ws = wb.Sheets[targetSheetName];
        const data: any[][] = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (data.length <= 1) {
          toast.error('Seçilen Excel sayfası boş görünüyor.');
          return;
        }

        // Find header row containing department and product name keywords
        const normalizeText = (text: any) => String(text || '').toLocaleLowerCase('tr-TR').trim();
        let headerRowIndex = -1;
        let headerRow: any[] = [];

        for (let i = 0; i < Math.min(data.length, 25); i++) {
          const row = data[i] || [];
          const rowStr = row.map(c => normalizeText(c)).join(' ');
          if (
            (rowStr.includes('ürün adı') || rowStr.includes('madde') || rowStr.includes('malzeme') || rowStr.includes('productname')) &&
            (rowStr.includes('bölüm') || rowStr.includes('departman') || rowStr.includes('birim') || rowStr.includes('kullanıldığı'))
          ) {
            headerRowIndex = i;
            headerRow = row;
            break;
          }
        }

        if (headerRowIndex === -1) {
          // Fallback: search row having >= 4 non-empty values
          for (let i = 0; i < Math.min(data.length, 10); i++) {
            const r = (data[i] || []).filter(Boolean);
            if (r.length >= 4) {
              headerRowIndex = i;
              headerRow = data[i];
              break;
            }
          }
        }

        if (headerRowIndex === -1) {
          toast.error('Excel başlık satırı tespit edilemedi.');
          return;
        }

        const getColIndex = (kw: string[]) =>
          headerRow.findIndex((h: any) => h && kw.some(k => normalizeText(h).includes(k)));

        const idxDept = getColIndex(['kullanıldığı ve depolandığı', 'bölüm', 'departman', 'birim', 'kullanıldığı']);
        const idxName = getColIndex(['ürün adı', 'madde adı', 'malzeme adı', 'isim', 'productname']);
        const idxAmount = getColIndex(['adet/ miktar', 'miktar', 'adedi', 'amountvalue']);
        const idxBrand = getColIndex(['firma tedarikçi', 'tedarikçi', 'marka', 'brandname']);
        const idxUsage = getColIndex(['kullanım şekli', 'usagemethod']);
        const idxComp = getColIndex(['bileşimi', 'içerik', 'composition']);
        const idxHazard = getColIndex(['tehlike tanımları', 'tehlike', 'hazarddescription']);
        const idxFirstAid = getColIndex(['ilk yardım', 'ilkyardım', 'firstaid']);
        const idxFire = getColIndex(['yangınla', 'yangında', 'yangın', 'firefightingmeasures']);
        const idxRelease = getColIndex(['kaza sonucu', 'serbest kalması', 'accidentalreleasemeasures']);
        const idxHandling = getColIndex(['kullanım ve depolama', 'depolama', 'handlingandstorage']);
        const idxExposure = getColIndex(['maruz kalma', 'kişisel korunma', 'exposurecontrolsppe']);
        const idxPhysical = getColIndex(['fiziksel ve kimyasal', 'fiziksel', 'physicalandchemicalproperties']);
        const idxStability = getColIndex(['stabilite', 'reaktivite', 'stabilityandreactivity']);
        const idxTox = getColIndex(['toksikolojik', 'toxicologicalinformation']);
        const idxDisposal = getColIndex(['temizlik', 'imha', 'disposalconsiderations']);
        const idxTransport = getColIndex(['taşıma', 'tehlikeli madde sınıfı', 'transportinfo']);

        const parseAmountRange = (val: any) => {
          if (!val) return { min: 1, max: 1 };
          const s = String(val).replace(/,/g, '.');
          const rangeMatch = s.match(/(\d+(?:\.\d+)?)\s*-\s*(\d+(?:\.\d+)?)/);
          if (rangeMatch) {
            return {
              min: parseFloat(rangeMatch[1]) || 1,
              max: parseFloat(rangeMatch[2]) || 1
            };
          }
          const singleMatch = s.match(/(\d+(?:\.\d+)?)/);
          if (singleMatch) {
            const v = parseFloat(singleMatch[1]) || 1;
            return { min: v, max: v };
          }
          return { min: 1, max: 1 };
        };

        for (let i = headerRowIndex + 1; i < data.length; i++) {
          const row = data[i];
          if (!row || row.length === 0) continue;

          let productName = '';
          if (idxName !== -1 && row[idxName]) productName = String(row[idxName]).trim();
          else if (idxBrand !== -1 && row[idxBrand]) productName = String(row[idxBrand]).trim();

          if (!productName) continue;

          let department = '';
          if (idxDept !== -1 && row[idxDept]) department = String(row[idxDept]).trim();
          if (!department) department = 'Genel';

          const { min, max } = parseAmountRange(idxAmount !== -1 ? row[idxAmount] : null);

          rowsToImport.push({
            department,
            productName,
            brandName: idxBrand !== -1 && row[idxBrand] ? String(row[idxBrand]).trim() : undefined,
            minQuantity: min,
            maxQuantity: max,
            usageMethod: idxUsage !== -1 && row[idxUsage] ? String(row[idxUsage]).trim() : undefined,
            composition: idxComp !== -1 && row[idxComp] ? String(row[idxComp]).trim() : undefined,
            hazardDescription: idxHazard !== -1 && row[idxHazard] ? String(row[idxHazard]).trim() : undefined,
            firstAid: idxFirstAid !== -1 && row[idxFirstAid] ? String(row[idxFirstAid]).trim() : undefined,
            fireFightingMeasures: idxFire !== -1 && row[idxFire] ? String(row[idxFire]).trim() : undefined,
            accidentalReleaseMeasures: idxRelease !== -1 && row[idxRelease] ? String(row[idxRelease]).trim() : undefined,
            handlingAndStorage: idxHandling !== -1 && row[idxHandling] ? String(row[idxHandling]).trim() : undefined,
            exposureControlsPpe: idxExposure !== -1 && row[idxExposure] ? String(row[idxExposure]).trim() : undefined,
            physicalAndChemicalProperties: idxPhysical !== -1 && row[idxPhysical] ? String(row[idxPhysical]).trim() : undefined,
            stabilityAndReactivity: idxStability !== -1 && row[idxStability] ? String(row[idxStability]).trim() : undefined,
            toxicologicalInformation: idxTox !== -1 && row[idxTox] ? String(row[idxTox]).trim() : undefined,
            disposalConsiderations: idxDisposal !== -1 && row[idxDisposal] ? String(row[idxDisposal]).trim() : undefined,
            transportInfo: idxTransport !== -1 && row[idxTransport] ? String(row[idxTransport]).trim() : undefined,
          });
        }

        if (rowsToImport.length === 0) {
          toast.error('Dosyadan okunabilir madde veya envanter kaydı bulunamadı.');
          return;
        }

        setParsedRowsForImport(rowsToImport);
        setIsImportModalOpen(true);
      } catch (err) {
        console.error('Excel parse error:', err);
        toast.error('Excel dosyası okunurken hata oluştu.');
      } finally {
        setIsParsingExcel(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsBinaryString(file);
  };

  const currentEffectiveFacilityId = activeFacilityId || localStorage.getItem('activeFacilityId') || '';
  const filteredFacilityLocations = useMemo(() => {
    if (!currentEffectiveFacilityId || currentEffectiveFacilityId === 'all') return [];
    return facilityLocations.filter(loc => !loc.facilityId || loc.facilityId === currentEffectiveFacilityId);
  }, [facilityLocations, currentEffectiveFacilityId]);

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Tesis Envanteri</h1>
          <p className="text-muted-foreground mt-1">
            Tesisteki tehlikeli maddeleri ve atandıkları departmanları listeleyin.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 shrink-0">
          <input
            type="file"
            accept=".xlsx, .xls"
            ref={fileInputRef}
            onChange={handleExcelFileSelected}
            className="hidden"
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="shadow-sm gap-2"
            disabled={isParsingExcel}
          >
            {isParsingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4 text-emerald-600" />}
            {isParsingExcel ? 'Okunuyor...' : "Excel'den Envanter Yükle"}
          </Button>
          <Button onClick={() => navigate('/hazmat/inventory/new', { state: { returnTo: '/hazmat/inventory' } })} className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Tesise Ekle (Envantere Ekle)
          </Button>
          <Button onClick={() => navigate('/hazmat/materials/new', { state: { returnTo: '/hazmat/inventory' } })} variant="outline" className="shadow-md">
            <Plus className="w-4 h-4 mr-2" />
            Havuza Yeni Madde
          </Button>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 bg-muted/30 p-4 rounded-lg border border-border/50">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Tehlikeli Madde veya Marka Ara..." 
            className="pl-9 bg-background"
            value={searchMaterial}
            onChange={(e) => setSearchMaterial(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Departman Adı Ara..." 
            className="pl-9 bg-background"
            value={searchDepartment}
            onChange={(e) => setSearchDepartment(e.target.value)}
          />
        </div>
        <div className="relative flex-1">
          <select 
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
            value={searchAdrCategory}
            onChange={(e) => setSearchAdrCategory(e.target.value)}
          >
            <option value="all">Tüm ADR Kategorileri</option>
            {adrCategories.map((cat: any) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      </div>

      <Card className="border-primary/20 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
        <CardHeader>
          <CardTitle>Envanter Listesi</CardTitle>
          <CardDescription>Maddenin detaylarını görmek için satıra tıklayın.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="bg-muted/50 text-muted-foreground">
                  <tr>
                    <th className="px-4 py-3 font-medium">Tehlikeli Madde</th>
                    <th className="px-4 py-3 font-medium">Kategori</th>
                    <th className="px-4 py-3 font-medium">Birim / Ambalaj</th>
                    <th className="px-4 py-3 font-medium">Bulunduğu Departmanlar</th>
                    <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                {isLoading ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted-foreground">Yükleniyor...</td>
                  </tr>
                ) : filteredGroups.length === 0 ? (
                  <tr>
                    <td colSpan={5}>
                      <div className="py-8 text-center text-muted-foreground bg-muted/20">
                        {groupedSummary.length === 0 
                          ? "Henüz departmanlara atanmış bir tehlikeli madde bulunmuyor."
                          : "Arama kriterlerinize uygun kayıt bulunamadı."}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredGroups.map((item: any, i: number) => (
                    <tr 
                      key={i} 
                      className="hover:bg-muted/30 transition-colors cursor-pointer group"
                      onClick={() => setSelectedGroup(item)}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <div className="flex items-center gap-3">
                          <div className="flex -space-x-2">
                            {item.hazardLabels?.slice(0, 3).map((hl: any) => (
                              <img 
                                key={hl.label.id} 
                                src={hl.label.imageUrl} 
                                alt={hl.label.name} 
                                className="w-8 h-8 rounded-full border-2 border-background object-contain bg-white" 
                                title={hl.label.name}
                              />
                            ))}
                          </div>
                          <div>
                            <span className="group-hover:text-primary transition-colors">{item.productName}</span>
                            <div className="text-xs text-muted-foreground font-normal">
                              {item.brandName || 'Marka Belirtilmemiş'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="font-normal bg-muted/50">
                          {item.categoryName}
                        </Badge>
                      </td>
                      <td className="px-4 py-3">
                        <div className="font-medium">
                          {item.amountValue ? item.amountValue : '-'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.unitName ? `${item.unitName} ${item.unitSymbol ? `(${item.unitSymbol})` : ''}` : '-'}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {item.departments.slice(0, 3).map((d: any, idx: number) => (
                            <Badge key={idx} variant="secondary" className="font-normal text-xs bg-primary/5 hover:bg-primary/10 transition-colors">
                              {d.name.split(' / ').pop()}
                            </Badge>
                          ))}
                          {item.departments.length > 3 && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground">
                              +{item.departments.length - 3} departman
                            </span>
                          )}
                          {item.departments.length === 0 && (
                            <span className="text-xs text-muted-foreground italic">Atanmamış</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 z-10 relative"
                          title="Bilgi Kartı Oluştur"
                          onClick={(e) => {
                            e.stopPropagation();
                            setPrintMaterial(item.material);
                          }}
                        >
                          <Printer className="h-4 w-4 text-blue-600" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>

      <PrintCardModal 
        isOpen={!!printMaterial}
        onClose={() => setPrintMaterial(null)}
        material={printMaterial}
      />

      <HazmatMaterialSummaryDialog 
        material={selectedGroup?.material}
        isOpen={!!selectedGroup}
        onOpenChange={(open) => !open && setSelectedGroup(null)}
        amountValue={selectedGroup?.amountValue}
        unitName={selectedGroup?.unitName}
        departments={selectedGroup?.departments}
        onPrint={() => {
          setSelectedGroup(null);
          setPrintMaterial(selectedGroup?.material);
        }}
        onNavigateToPool={() => {
          setSelectedGroup(null);
          navigate(`/hazmat/materials/view/${selectedGroup?.materialId}`);
        }}
        onNavigateToLocations={() => {
          setSelectedGroup(null);
          navigate(`/hazmat/inventory/material/${selectedGroup?.materialId}`);
        }}
      />

      <HazmatInventoryImportModal
        isOpen={isImportModalOpen}
        onOpenChange={setIsImportModalOpen}
        facilityId={currentEffectiveFacilityId}
        facilityLocations={filteredFacilityLocations}
        parsedRows={parsedRowsForImport}
        onSuccess={() => {
          queryClient.invalidateQueries({ queryKey: ['inventory-summary', activeFacilityId] });
          queryClient.invalidateQueries({ queryKey: ['facility-materials', activeFacilityId] });
          queryClient.invalidateQueries({ queryKey: ['facility-locations', activeFacilityId] });
        }}
      />
    </div>
  );
}
