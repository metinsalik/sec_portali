import React, { useRef, useState, useMemo } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Printer, Loader2, Layers, Building2, MapPin, CheckCircle, Filter } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RiskPrintTable } from './RiskPrintTable';

interface FacilityRiskPrintModalProps {
  isOpen: boolean;
  onClose: () => void;
  departments: any[];
  facilityRisks: any[];
  facility: any;
  defaultScope?: {
    level?: 'all' | 'building' | 'floor' | 'department' | 'unit';
    building?: string;
    floor?: string;
    department?: string;
    unitId?: string;
  };
}

export function FacilityRiskPrintModal({ 
  isOpen, 
  onClose, 
  departments, 
  facilityRisks, 
  facility,
  defaultScope 
}: FacilityRiskPrintModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  // Kapsam Seçimi: 'all' | 'building' | 'floor' | 'department'
  const [scopeType, setScopeType] = useState<'all' | 'building' | 'floor' | 'department'>(
    defaultScope?.level && defaultScope.level !== 'unit' ? (defaultScope.level as any) : 'all'
  );

  const [selectedBuilding, setSelectedBuilding] = useState<string>(defaultScope?.building || 'ALL');
  const [selectedFloor, setSelectedFloor] = useState<string>(defaultScope?.floor || 'ALL');
  const [selectedDept, setSelectedDept] = useState<string>(
    defaultScope?.department || (defaultScope?.unitId ? defaultScope.unitId : 'ALL')
  );

  // Benzersiz Bina, Kat ve Departman Listeleri
  const availableBuildings = useMemo(() => {
    const set = new Set<string>();
    departments.forEach(d => {
      if (d.building) set.add(d.building);
    });
    return Array.from(set).sort();
  }, [departments]);

  const availableFloors = useMemo(() => {
    const set = new Set<string>();
    departments.forEach(d => {
      if (selectedBuilding === 'ALL' || d.building === selectedBuilding) {
        if (d.floor) set.add(d.floor);
      }
    });
    return Array.from(set).sort();
  }, [departments, selectedBuilding]);

  const availableDepartments = useMemo(() => {
    return departments.filter(d => {
      if (selectedBuilding !== 'ALL' && d.building !== selectedBuilding) return false;
      if (selectedFloor !== 'ALL' && d.floor !== selectedFloor) return false;
      return true;
    });
  }, [departments, selectedBuilding, selectedFloor]);

  // Seçilen Kapsama Göre Lokasyonları Filtrele
  const filteredDepartments = useMemo(() => {
    if (scopeType === 'all') {
      return departments;
    }

    if (scopeType === 'building') {
      if (selectedBuilding === 'ALL') return departments;
      return departments.filter(d => d.building === selectedBuilding);
    }

    if (scopeType === 'floor') {
      return departments.filter(d => {
        if (selectedBuilding !== 'ALL' && d.building !== selectedBuilding) return false;
        if (selectedFloor !== 'ALL' && d.floor !== selectedFloor) return false;
        return true;
      });
    }

    if (scopeType === 'department') {
      if (selectedDept === 'ALL') {
        return departments.filter(d => {
          if (selectedBuilding !== 'ALL' && d.building !== selectedBuilding) return false;
          if (selectedFloor !== 'ALL' && d.floor !== selectedFloor) return false;
          return true;
        });
      }
      return departments.filter(d => d.id === selectedDept || d.department === selectedDept || d.name === selectedDept);
    }

    return departments;
  }, [departments, scopeType, selectedBuilding, selectedFloor, selectedDept]);

  // Filtrelenen lokasyonların ID kümesi
  const filteredDeptIds = useMemo(() => new Set(filteredDepartments.map(d => d.id)), [filteredDepartments]);

  // Kapsama dahil olan risklerin toplam sayısı
  const scopedRisksCount = useMemo(() => {
    return facilityRisks.filter(r => filteredDeptIds.has(r.departmentId || r.locationId)).length;
  }, [facilityRisks, filteredDeptIds]);

  const handleGeneratePdf = () => {
    if (!printRef.current) return;
    setIsGenerating(true);
    
    setTimeout(() => {
      try {
        const iframe = document.createElement('iframe');
        iframe.style.position = 'absolute';
        iframe.style.top = '-10000px';
        document.body.appendChild(iframe);
        
        const contentWindow = iframe.contentWindow;
        const contentDocument = iframe.contentDocument;
        
        if (contentDocument && printRef.current) {
          const headHtml = document.head.innerHTML;
          contentDocument.open();
          contentDocument.write(`
            <html>
              <head>
                ${headHtml}
                <style>
                  @page { size: landscape; margin: 8mm; }
                  body { margin: 0; padding: 0; background: white; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
                  .page-break-after { page-break-after: always; }
                  .page-break-after:last-child { page-break-after: auto; }
                </style>
              </head>
              <body>
                ${printRef.current.outerHTML}
              </body>
            </html>
          `);
          contentDocument.close();
          
          setTimeout(() => {
            contentWindow?.focus();
            contentWindow?.print();
            document.body.removeChild(iframe);
            setIsGenerating(false);
          }, 1200);
        } else {
          setIsGenerating(false);
        }
      } catch (error) {
        console.error('Yazdırma hatası:', error);
        setIsGenerating(false);
      }
    }, 100);
  };

  if (!departments || departments.length === 0) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-[96vw] w-full max-h-[96vh] flex flex-col p-0 overflow-hidden shadow-2xl border-border">
        {/* Üst Başlık & Çıktı Alma Çubuğu */}
        <DialogHeader className="px-6 py-4 border-b shrink-0 flex flex-row items-center justify-between bg-card">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400">
                <Printer className="w-4 h-4" />
              </span>
              <DialogTitle className="text-base font-bold text-foreground">
                Hiyerarşik Risk Değerlendirme Çıktısı (Fine Kinney Metodu)
              </DialogTitle>
            </div>
            <p className="text-xs text-muted-foreground">
              İşyeri bilgileri, logo ve atanan uzman imzaları ile resmi İSG-F56 formatında landscape PDF / yazıcı çıktısı.
            </p>
          </div>
          
          <div className="flex gap-3 items-center pr-6">
            <div className="text-right mr-2 hidden sm:block">
              <div className="text-xs font-semibold text-foreground">
                {filteredDepartments.length} Birim / Mahal
              </div>
              <div className="text-[11px] text-muted-foreground">
                Toplam {scopedRisksCount} Adet Risk Kaydı
              </div>
            </div>

            <Button 
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs h-9 px-4 rounded-xl shadow-xs" 
              disabled={isGenerating || filteredDepartments.length === 0}
              onClick={handleGeneratePdf}
            >
              {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Printer className="w-4 h-4 mr-2" />}
              Çıktı Al / PDF Kaydet
            </Button>
          </div>
        </DialogHeader>

        {/* Kapsam Filtreleme Araç Çubuğu (Kullanıcı Talebi: Lokasyondaki Her Step İçin Çıktı) */}
        <div className="px-6 py-3 bg-muted/40 border-b flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
              <Filter className="w-3.5 h-3.5 text-primary" />
              Çıktı Kapsamı:
            </div>

            {/* Scope Type Tabs */}
            <div className="inline-flex p-0.5 rounded-xl bg-background border shadow-2xs">
              <button
                type="button"
                onClick={() => setScopeType('all')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  scopeType === 'all' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Tüm Tesis
              </button>

              <button
                type="button"
                onClick={() => setScopeType('building')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  scopeType === 'building' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Bina / Blok
              </button>

              <button
                type="button"
                onClick={() => setScopeType('floor')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  scopeType === 'floor' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Kat Bazlı
              </button>

              <button
                type="button"
                onClick={() => setScopeType('department')}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-all ${
                  scopeType === 'department' 
                    ? 'bg-primary text-primary-foreground shadow-xs' 
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Mahal / Birim
              </button>
            </div>

            {/* Dynamic Dropdown Selectors based on Scope */}
            {scopeType !== 'all' && (
              <div className="flex flex-wrap items-center gap-2">
                {/* Building Select */}
                {(scopeType === 'building' || scopeType === 'floor' || scopeType === 'department') && availableBuildings.length > 0 && (
                  <Select value={selectedBuilding} onValueChange={(val) => {
                    setSelectedBuilding(val);
                    setSelectedFloor('ALL');
                    setSelectedDept('ALL');
                  }}>
                    <SelectTrigger className="h-8 text-xs w-36 rounded-lg bg-background">
                      <SelectValue placeholder="Bina Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm Binalar</SelectItem>
                      {availableBuildings.map(b => (
                        <SelectItem key={b} value={b}>{b}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Floor Select */}
                {(scopeType === 'floor' || scopeType === 'department') && availableFloors.length > 0 && (
                  <Select value={selectedFloor} onValueChange={(val) => {
                    setSelectedFloor(val);
                    setSelectedDept('ALL');
                  }}>
                    <SelectTrigger className="h-8 text-xs w-36 rounded-lg bg-background">
                      <SelectValue placeholder="Kat Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm Katlar</SelectItem>
                      {availableFloors.map(f => (
                        <SelectItem key={f} value={f}>{f}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Specific Dept / Mahal Select */}
                {scopeType === 'department' && (
                  <Select value={selectedDept} onValueChange={setSelectedDept}>
                    <SelectTrigger className="h-8 text-xs w-48 rounded-lg bg-background">
                      <SelectValue placeholder="Mahal / Birim Seçiniz" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ALL">Tüm Mahaller</SelectItem>
                      {availableDepartments.map(d => (
                        <SelectItem key={d.id} value={d.id}>
                          {d.department || d.description || d.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </div>
            )}
          </div>

          <div className="text-[11px] text-muted-foreground italic">
            * Seçilen basamak ve altındaki tüm bağlı birimlerin riskleri derlenerek yazdırılır.
          </div>
        </div>
        
        {/* Önizleme Alanı */}
        <div className="flex-1 overflow-auto p-6 bg-slate-100 dark:bg-slate-950 flex justify-center">
          {filteredDepartments.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center text-muted-foreground">
              <Building2 className="w-12 h-12 opacity-30 mb-3" />
              <p className="font-semibold text-sm">Seçilen kriterlere uygun birim veya risk kaydı bulunamadı.</p>
              <p className="text-xs mt-1">Lütfen filtre kriterlerinizi değiştirin veya tüm tesisi seçin.</p>
            </div>
          ) : (
            <div className="bg-white text-black shadow-2xl border border-slate-200 overflow-x-auto w-full max-w-6xl rounded-lg" style={{ transform: 'scale(0.88)', transformOrigin: 'top center' }}>
              <div ref={printRef} className="w-full">
                {filteredDepartments.map((dept) => {
                  const deptRisks = facilityRisks.filter(r => (r.departmentId || r.locationId) === dept.id);
                  return (
                    <div key={dept.id} className="page-break-after w-full">
                      <RiskPrintTable 
                        risks={deptRisks}
                        department={{
                          ...dept, 
                          facility: facility || dept.facility || facilityRisks[0]?.department?.facility || facilityRisks[0]?.location?.facility
                        }}
                        deptCode={dept.id}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
