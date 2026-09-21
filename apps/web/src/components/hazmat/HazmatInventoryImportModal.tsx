import React, { useState, useMemo } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Loader2,
  CheckCircle2,
  AlertCircle,
  Building2,
  Package,
  Layers,
  Search,
  ArrowRight,
  Plus
} from 'lucide-react';
import api from '@/lib/api';
import { toast } from 'sonner';

export interface LocationMappingInfo {
  action: 'existing' | 'new';
  locationId?: string;
  building?: string;
  floor?: string;
  department?: string;
  description?: string;
  newName?: string;
}

interface HazmatInventoryImportModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  facilityLocations: any[];
  parsedRows: any[];
  onSuccess: () => void;
}

export function HazmatInventoryImportModal({
  isOpen,
  onOpenChange,
  facilityId,
  facilityLocations,
  parsedRows,
  onSuccess
}: HazmatInventoryImportModalProps) {
  const [step, setStep] = useState<1 | 2>(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Extract unique departments from parsed rows
  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    parsedRows.forEach((r) => {
      if (r.department && String(r.department).trim()) {
        depts.add(String(r.department).trim());
      }
    });
    return Array.from(depts).sort();
  }, [parsedRows]);

  // Extract unique products
  const uniqueProducts = useMemo(() => {
    const prods = new Set<string>();
    parsedRows.forEach((r) => {
      if (r.productName && String(r.productName).trim()) {
        prods.add(String(r.productName).trim());
      }
    });
    return Array.from(prods);
  }, [parsedRows]);

  // Build existing buildings and floors from facilityLocations for quick suggestions
  const existingBuildings = useMemo(() => {
    const set = new Set<string>();
    facilityLocations.forEach(loc => {
      if (loc.building && String(loc.building).trim()) set.add(String(loc.building).trim());
    });
    return Array.from(set);
  }, [facilityLocations]);

  const existingFloors = useMemo(() => {
    const set = new Set<string>();
    facilityLocations.forEach(loc => {
      if (loc.floor && String(loc.floor).trim()) set.add(String(loc.floor).trim());
    });
    return Array.from(set);
  }, [facilityLocations]);

  // Initial smart auto-mapping state
  const [mappings, setMappings] = useState<Record<string, LocationMappingInfo>>(() => {
    const initial: Record<string, LocationMappingInfo> = {};
    const clean = (t: string) =>
      t
        .toLowerCase()
        .replace(/i̇/g, 'i')
        .replace(/ı/g, 'i')
        .replace(/ş/g, 's')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .replace(/[^a-z0-9]/g, '');

    uniqueDepartments.forEach((dept) => {
      const deptClean = clean(dept);
      // Look for a close match in existing locations
      let matchedLoc = facilityLocations.find((loc) => {
        const locClean = clean(loc.name || loc.department || '');
        return locClean === deptClean || locClean.endsWith(deptClean) || locClean.includes(deptClean);
      });

      if (matchedLoc) {
        initial[dept] = { action: 'existing', locationId: matchedLoc.id };
      } else {
        // Default to create new structured location (Bina, Kat, Birim, Mahal)
        initial[dept] = {
          action: 'new',
          building: 'Ana Bina',
          floor: 'Genel',
          department: dept,
          description: '',
          newName: `Ana Bina - ${dept}`
        };
      }
    });

    return initial;
  });

  const handleActionChange = (dept: string, action: 'existing' | 'new') => {
    setMappings((prev) => {
      const current = prev[dept] || {
        action: 'new',
        building: 'Ana Bina',
        floor: 'Genel',
        department: dept,
        description: '',
        newName: `Ana Bina - ${dept}`
      };

      if (action === 'new') {
        const b = current.building || 'Ana Bina';
        const f = current.floor || 'Genel';
        const d = current.department || dept;
        const desc = current.description || '';
        const nameParts = [b, f !== 'Genel' ? f : '', d, desc].filter(Boolean);

        return {
          ...prev,
          [dept]: {
            action: 'new',
            building: b,
            floor: f,
            department: d,
            description: desc,
            newName: nameParts.join(' - ') || `Ana Bina - ${dept}`
          }
        };
      } else {
        return {
          ...prev,
          [dept]: { action: 'existing', locationId: facilityLocations[0]?.id }
        };
      }
    });
  };

  const handleLocationSelect = (dept: string, locationId: string) => {
    setMappings((prev) => ({
      ...prev,
      [dept]: { ...prev[dept], action: 'existing', locationId }
    }));
  };

  const handleFieldChange = (
    dept: string,
    field: 'building' | 'floor' | 'department' | 'description',
    val: string
  ) => {
    setMappings((prev) => {
      const current = prev[dept] || {
        action: 'new',
        building: 'Ana Bina',
        floor: 'Genel',
        department: dept,
        description: ''
      };

      const updated = {
        ...current,
        [field]: val
      };

      const b = updated.building || 'Ana Bina';
      const f = updated.floor || '';
      const d = updated.department || dept;
      const desc = updated.description || '';
      const nameParts = [b, f !== 'Genel' && f ? f : '', d, desc].filter(Boolean);
      updated.newName = nameParts.join(' - ');

      return {
        ...prev,
        [dept]: updated
      };
    });
  };

  const filteredDepts = useMemo(() => {
    if (!searchTerm.trim()) return uniqueDepartments;
    const q = searchTerm.toLowerCase();
    return uniqueDepartments.filter((d) => d.toLowerCase().includes(q));
  }, [uniqueDepartments, searchTerm]);

  // Statistics
  const matchedExistingCount = useMemo(() => {
    return Object.values(mappings).filter((m) => m.action === 'existing').length;
  }, [mappings]);

  const createNewCount = useMemo(() => {
    return Object.values(mappings).filter((m) => m.action === 'new').length;
  }, [mappings]);

  const handleStartImport = async () => {
    setIsSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const response = await api.post(`/hazmat/inventory/bulk-import-matrix?token=${token}`, {
        facilityId,
        rows: parsedRows,
        locationMappings: mappings
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || errorData.details || 'İçe aktarım başarısız oldu.');
      }

      const resData = await response.json();
      const r = resData.results || {};
      toast.success(
        `Aktarım başarıyla tamamlandı! ${r.materialsCreated || 0} yeni madde havuza eklendi, ${r.materialsReused || 0} mevcut madde eşleştirildi, ${(r.inventoryItemsCreated || 0) + (r.inventoryItemsUpdated || 0)} envanter kaydı bağlandı.`
      );

      onSuccess();
      onOpenChange(false);
    } catch (err: any) {
      console.error('Import error:', err);
      toast.error(err.message || 'Aktarım sırasında hata oluştu.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[92vh] flex flex-col p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Layers className="w-5 h-5 text-primary" />
            Excel'den Tehlikeli Madde & Birim Envanteri Aktarma
          </DialogTitle>
        </DialogHeader>

        {/* Info badges */}
        <div className="grid grid-cols-3 gap-4 py-2">
          <div className="bg-muted/40 p-3 rounded-lg border flex items-center gap-3">
            <Package className="w-8 h-8 text-blue-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Toplam Kayıt / Madde</p>
              <p className="text-sm font-bold">
                {parsedRows.length} Satır / {uniqueProducts.length} Çeşit
              </p>
            </div>
          </div>
          <div className="bg-muted/40 p-3 rounded-lg border flex items-center gap-3">
            <Building2 className="w-8 h-8 text-emerald-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Excel'deki Birimler</p>
              <p className="text-sm font-bold">{uniqueDepartments.length} Farklı Bölüm</p>
            </div>
          </div>
          <div className="bg-muted/40 p-3 rounded-lg border flex items-center gap-3">
            <CheckCircle2 className="w-8 h-8 text-indigo-600 shrink-0" />
            <div>
              <p className="text-xs text-muted-foreground">Eşleşme Durumu</p>
              <p className="text-sm font-bold">
                {matchedExistingCount} Mevcut / {createNewCount} Yeni Açılacak
              </p>
            </div>
          </div>
        </div>

        {/* Step indicator */}
        <div className="flex items-center justify-between border-b pb-3">
          <div className="text-sm font-medium text-muted-foreground">
            {step === 1 ? (
              <span className="text-primary font-semibold">
                Adım 1: Excel Birimlerini Sistem Lokasyonlarıyla Eşleştirin
              </span>
            ) : (
              <span className="text-primary font-semibold">Adım 2: Onay ve Aktarım Özeti</span>
            )}
          </div>
          {step === 1 && (
            <div className="relative w-64">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Birimlerde ara..."
                className="pl-8 h-8 text-xs"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto min-h-[340px] max-h-[490px] pr-1">
          {step === 1 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 text-xs">
                    <TableHead className="w-1/4">Excel'deki Bölüm / Birim</TableHead>
                    <TableHead className="w-48">Eşleştirme Türü</TableHead>
                    <TableHead>Hedef Lokasyon Tanımı</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDepts.map((dept) => {
                    const currentMap = mappings[dept] || {
                      action: 'new',
                      building: 'Ana Bina',
                      floor: 'Genel',
                      department: dept,
                      description: '',
                      newName: `Ana Bina - ${dept}`
                    };

                    const selectedExistingLoc = facilityLocations.find(l => l.id === currentMap.locationId);
                    const selectedExistingName = selectedExistingLoc ? (selectedExistingLoc.name || selectedExistingLoc.department) : '';

                    return (
                      <TableRow key={dept} className="hover:bg-muted/30">
                        <TableCell className="font-medium text-xs align-top pt-3">
                          <div className="flex flex-col">
                            <span className="font-semibold text-foreground">{dept}</span>
                            <span className="text-[10px] text-muted-foreground">Excel Ham Birim</span>
                          </div>
                        </TableCell>

                        <TableCell className="align-top pt-2.5">
                          <Select
                            value={currentMap.action}
                            onValueChange={(val: 'existing' | 'new') => handleActionChange(dept, val)}
                          >
                            <SelectTrigger className="h-8 text-xs w-full">
                              <SelectValue>
                                {currentMap.action === 'existing' ? 'Mevcut Lokasyona Bağla' : '+ Yeni Lokasyon Aç'}
                              </SelectValue>
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="existing">Mevcut Lokasyona Bağla</SelectItem>
                              <SelectItem value="new">+ Yeni Lokasyon Aç</SelectItem>
                            </SelectContent>
                          </Select>
                        </TableCell>

                        <TableCell className="align-top pt-2.5">
                          {currentMap.action === 'existing' ? (
                            <Select
                              value={currentMap.locationId || ''}
                              onValueChange={(val) => handleLocationSelect(dept, val)}
                            >
                              <SelectTrigger className="h-8 text-xs w-full">
                                <SelectValue placeholder="Lokasyon seçin...">
                                  {selectedExistingName || 'Lokasyon seçin...'}
                                </SelectValue>
                              </SelectTrigger>
                              <SelectContent className="max-h-60">
                                {facilityLocations.map((loc) => {
                                  const displayName = loc.name || loc.department || 'İsimsiz Lokasyon';
                                  return (
                                    <SelectItem key={loc.id} value={loc.id} className="text-xs">
                                      {displayName}
                                    </SelectItem>
                                  );
                                })}
                              </SelectContent>
                            </Select>
                          ) : (
                            <div className="space-y-1.5 bg-muted/20 p-2.5 rounded-lg border border-border/60">
                              <div className="grid grid-cols-4 gap-2">
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Bina / Blok</label>
                                  <Input
                                    value={currentMap.building ?? 'Ana Bina'}
                                    onChange={(e) => handleFieldChange(dept, 'building', e.target.value)}
                                    placeholder="Ana Bina"
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Kat</label>
                                  <Input
                                    value={currentMap.floor ?? 'Genel'}
                                    onChange={(e) => handleFieldChange(dept, 'floor', e.target.value)}
                                    placeholder="Genel / 1. Kat"
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Birim / Departman</label>
                                  <Input
                                    value={currentMap.department ?? dept}
                                    onChange={(e) => handleFieldChange(dept, 'department', e.target.value)}
                                    placeholder="Birim Adı"
                                    className="h-7 text-xs"
                                  />
                                </div>
                                <div>
                                  <label className="text-[10px] font-semibold text-muted-foreground block mb-0.5">Mahal / Alan (İsteğe Bağlı)</label>
                                  <Input
                                    value={currentMap.description ?? ''}
                                    onChange={(e) => handleFieldChange(dept, 'description', e.target.value)}
                                    placeholder="Depo / Oda vb."
                                    className="h-7 text-xs"
                                  />
                                </div>
                              </div>
                              <div className="text-[11px] text-muted-foreground flex items-center gap-1.5 pt-0.5">
                                <span className="font-semibold text-primary">Kayıt Adı:</span>
                                <span className="font-mono bg-background px-1.5 py-0.5 rounded border text-[10px] text-foreground">
                                  {currentMap.newName || [currentMap.building || 'Ana Bina', currentMap.floor !== 'Genel' ? currentMap.floor : '', currentMap.department || dept, currentMap.description].filter(Boolean).join(' - ')}
                                </span>
                              </div>
                            </div>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="space-y-4 py-2">
              <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 p-4 rounded-lg flex items-start gap-3 text-amber-800 dark:text-amber-200 text-sm">
                <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-amber-600" />
                <div className="space-y-1">
                  <p className="font-semibold">Aktarım Öncesi Bilgilendirme</p>
                  <p className="text-xs leading-relaxed">
                    - Excel'deki tüm maddeler taranacak; küresel havuzda mevcut olanlar <strong>tekrar oluşturulmayacak</strong> (mükerrer kayıt engellendi).<br />
                    - Havuzda olmayan yeni kimyasallar MSDS güvenlik bilgileriyle havuza kaydedilecektir.<br />
                    - Eşleştirdiğiniz <strong>{uniqueDepartments.length} birim</strong> için ilgili maddelere min/max envanter limitleri atanacaktır.
                  </p>
                </div>
              </div>

              <div className="border rounded-lg p-4 space-y-3">
                <h4 className="text-sm font-semibold">Aktarılacak Veri Özeti</h4>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div className="p-3 bg-muted/40 rounded border space-y-1">
                    <span className="text-muted-foreground">Mevcut Lokasyonlara Eklenecekler:</span>
                    <p className="text-base font-bold text-foreground">{matchedExistingCount} Birim</p>
                  </div>
                  <div className="p-3 bg-muted/40 rounded border space-y-1">
                    <span className="text-muted-foreground">Sistemde Sıfırdan Açılacak Lokasyonlar:</span>
                    <p className="text-base font-bold text-foreground">{createNewCount} Birim</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer actions */}
        <DialogFooter className="flex items-center justify-between border-t pt-4">
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            İptal
          </Button>

          <div className="flex gap-2">
            {step === 2 && (
              <Button variant="outline" onClick={() => setStep(1)} disabled={isSubmitting}>
                Geri
              </Button>
            )}
            {step === 1 ? (
              <Button onClick={() => setStep(2)} className="gap-2">
                Devam Et
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button onClick={handleStartImport} disabled={isSubmitting} className="gap-2">
                {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                {isSubmitting ? 'Aktarılıyor...' : 'Aktarımı Başlat'}
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
