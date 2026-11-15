import { useState, useMemo, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/api';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import {
  Building,
  Building2,
  Layers,
  Briefcase,
  DoorOpen,
  Loader2,
  Plus,
  Sparkles
} from 'lucide-react';
import { toast } from 'sonner';
import { extractLocationParts } from '@/utils/locationHierarchy';
import { STANDARD_FLOORS } from '@/data/locationStandards';

// Sık kullanılan hastane/tesis birimleri için hızlı öneriler
const COMMON_HAZMAT_DEPARTMENTS = [
  'Biyokimya Laboratuvarı',
  'Mikrobiyoloji Laboratuvarı',
  'Patoloji Laboratuvarı',
  'Eczane & İlaç Deposu',
  'Merkezi Sterilizasyon (MSÜ)',
  'Ameliyathane',
  'Yoğun Bakım Ünitesi',
  'Acil Servis',
  'Radyoloji & Görüntüleme',
  'Teknik Hizmetler & Bakım',
  'Temizlik & Kat Hizmetleri',
  'Morg & Otopsi',
  'Arşiv & Genel Depo'
];

interface HazmatAddDepartmentModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  facilityId: string;
  locations: any[];
  initialValues?: {
    buildingName?: string;
    block?: string;
    floor?: string;
    department?: string;
  };
  onSuccess?: () => void;
}

export function HazmatAddDepartmentModal({
  isOpen,
  onOpenChange,
  facilityId,
  locations = [],
  initialValues,
  onSuccess
}: HazmatAddDepartmentModalProps) {
  const queryClient = useQueryClient();

  // 1. Tesisin mevcut fiziksel hiyerarşisini (Bina > Blok > Kat) çıkar
  const facilityStructure = useMemo(() => {
    const buildings: Record<string, { blocks: Record<string, Set<string>> }> = {};
    const existingDepts = new Set<string>();

    locations.forEach((loc) => {
      if (loc.isCleaningCart || loc.type === 'TEMIZLIK_ARABASI') return;
      const parts = extractLocationParts(loc);
      const bName = parts.buildingName || loc.buildingName || 'Ana Bina';
      const blk = parts.block || loc.building || 'A Blok';
      const flr = parts.floor || loc.floor || 'Z.Kat';

      if (!buildings[bName]) {
        buildings[bName] = { blocks: {} };
      }
      if (!buildings[bName].blocks[blk]) {
        buildings[bName].blocks[blk] = new Set<string>();
      }
      buildings[bName].blocks[blk].add(flr);

      if (parts.department) {
        existingDepts.add(parts.department);
      }
    });

    const buildingList = Object.keys(buildings);
    if (buildingList.length === 0) {
      // Tesis henüz hiç lokasyon içermiyorsa varsayılan temel yapı oluştur
      buildings['Ana Bina'] = {
        blocks: {
          'A Blok': new Set(['-1.Kat', 'Z.Kat', '1.Kat', '2.Kat', '3.Kat'])
        }
      };
    }

    return {
      buildings,
      buildingList: Object.keys(buildings),
      existingDepts: Array.from(existingDepts)
    };
  }, [locations]);

  // Form State
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [departmentName, setDepartmentName] = useState<string>('');
  const [descriptionName, setDescriptionName] = useState<string>('');

  // Initial values veya ilk açılışta varsayılanları doldur
  useEffect(() => {
    if (isOpen) {
      const defaultBuilding = initialValues?.buildingName || facilityStructure.buildingList[0] || 'Ana Bina';
      setSelectedBuilding(defaultBuilding);

      const availableBlocks = Object.keys(facilityStructure.buildings[defaultBuilding]?.blocks || {});
      const defaultBlock = initialValues?.block || availableBlocks[0] || 'A Blok';
      setSelectedBlock(defaultBlock);

      const availableFloors = Array.from(facilityStructure.buildings[defaultBuilding]?.blocks[defaultBlock] || []);
      const defaultFloor = initialValues?.floor || availableFloors[0] || 'Z.Kat';
      setSelectedFloor(defaultFloor);

      setDepartmentName(initialValues?.department || '');
      setDescriptionName('');
    }
  }, [isOpen, initialValues, facilityStructure]);

  // Bina değiştikçe blokları güncelle
  const availableBlocks = useMemo(() => {
    if (!selectedBuilding || !facilityStructure.buildings[selectedBuilding]) return ['A Blok'];
    const blks = Object.keys(facilityStructure.buildings[selectedBuilding].blocks);
    return blks.length > 0 ? blks : ['A Blok'];
  }, [selectedBuilding, facilityStructure]);

  // Blok değiştikçe katları güncelle
  const availableFloors = useMemo(() => {
    if (!selectedBuilding || !selectedBlock || !facilityStructure.buildings[selectedBuilding]?.blocks[selectedBlock]) {
      return STANDARD_FLOORS.map(f => f.name);
    }
    const flrs = Array.from(facilityStructure.buildings[selectedBuilding].blocks[selectedBlock]);
    return flrs.length > 0 ? flrs : STANDARD_FLOORS.map(f => f.name);
  }, [selectedBuilding, selectedBlock, facilityStructure]);

  // Lokasyon Kayıt Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      if (!departmentName.trim()) {
        throw new Error('Lütfen birim adını belirtin.');
      }

      const payload = {
        buildingName: selectedBuilding.trim(),
        block: selectedBlock.trim(),
        floor: selectedFloor.trim(),
        department: departmentName.trim(),
        description: descriptionName.trim() || undefined
      };

      const res = await api.post(`/risks/facilities/${facilityId}/locations`, payload);
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Lokasyon eklenemedi.');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Birim ve mahal başarıyla tanımlandı.');
      queryClient.invalidateQueries({ queryKey: ['facility-locations', facilityId] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary', facilityId] });
      onOpenChange(false);
      if (onSuccess) onSuccess();
    },
    onError: (err: any) => {
      toast.error(err.message || 'Kayıt sırasında bir hata oluştu.');
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl p-5 sm:p-6 rounded-2xl border border-border shadow-2xl font-sans">
        <DialogHeader className="border-b border-border/70 pb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center shrink-0">
              <Briefcase className="w-4 h-4" />
            </div>
            <div>
              <DialogTitle className="text-base sm:text-lg font-bold text-foreground">
                Tehlikeli Madde Birimi & Mahal Tanımla
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                Tesisin mevcut Bina, Blok ve Kat yapısına tehlikeli madde kullanacak birim ve mahal ekleyin.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-2">
          {/* BÖLÜM 1: Otomatik Gelen Fiziksel Konum (Bina > Blok > Kat) */}
          <div className="bg-muted/25 border border-border/70 rounded-xl p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-primary" />
                1. Tesis Fiziksel Konumu (Otomatik)
              </span>
              <Badge variant="outline" className="text-[10px] font-normal bg-background/80">
                Tesis Altyapısı
              </Badge>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {/* Bina Seçimi */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">Bina Adı</Label>
                <Select value={selectedBuilding} onValueChange={(val) => {
                  setSelectedBuilding(val);
                  const firstBlk = Object.keys(facilityStructure.buildings[val]?.blocks || {})[0] || 'A Blok';
                  setSelectedBlock(firstBlk);
                }}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Bina Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {facilityStructure.buildingList.map((bName) => (
                      <SelectItem key={bName} value={bName} className="text-xs">
                        {bName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Blok Seçimi */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">Blok</Label>
                <Select value={selectedBlock} onValueChange={setSelectedBlock}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Blok Seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableBlocks.map((blk) => (
                      <SelectItem key={blk} value={blk} className="text-xs">
                        {blk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Kat Seçimi */}
              <div className="space-y-1">
                <Label className="text-[11px] font-semibold text-foreground">Kat</Label>
                <Select value={selectedFloor} onValueChange={setSelectedFloor}>
                  <SelectTrigger className="h-8 text-xs bg-background">
                    <SelectValue placeholder="Kat Seçin" />
                  </SelectTrigger>
                  <SelectContent className="max-h-56">
                    {availableFloors.map((flr) => (
                      <SelectItem key={flr} value={flr} className="text-xs">
                        {flr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* BÖLÜM 2: Hazmat Modülü Özel Tanımlamaları (Birim & Mahal) */}
          <div className="bg-card border border-border/70 rounded-xl p-3.5 space-y-3 shadow-2xs">
            <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              2. Bu Modüle Özel Birim ve Mahal
            </span>

            {/* Birim Adı Girişi */}
            <div className="space-y-1.5">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Birim / Bölüm Adı <span className="text-destructive">*</span></span>
                <span className="text-[10px] text-muted-foreground font-normal">Örn: Biyokimya Lab, Eczane, Morg</span>
              </Label>
              <Input
                placeholder="Örn: Biyokimya Laboratuvarı"
                className="h-8 text-xs bg-background"
                value={departmentName}
                onChange={(e) => setDepartmentName(e.target.value)}
                autoFocus
              />

              {/* Hızlı Öneri Etiketleri */}
              <div className="pt-1">
                <span className="text-[10px] text-muted-foreground block mb-1">Hızlı Seçim:</span>
                <div className="flex flex-wrap gap-1 max-h-20 overflow-y-auto">
                  {COMMON_HAZMAT_DEPARTMENTS.slice(0, 8).map((dept) => (
                    <button
                      type="button"
                      key={dept}
                      onClick={() => setDepartmentName(dept)}
                      className={`text-[10px] px-2 py-0.5 rounded-md border transition-colors cursor-pointer ${
                        departmentName === dept
                          ? 'bg-primary text-primary-foreground border-primary font-semibold'
                          : 'bg-muted/40 hover:bg-muted text-muted-foreground border-border/70'
                      }`}
                    >
                      {dept}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mahal / Konum Detayı Girişi */}
            <div className="space-y-1.5 pt-1 border-t border-border/40">
              <Label className="text-xs font-semibold text-foreground flex items-center justify-between">
                <span>Mahal / Oda / Dolap Detayı</span>
                <span className="text-[10px] text-muted-foreground font-normal">İsteğe Bağlı Detay</span>
              </Label>
              <Input
                placeholder="Örn: Kimyasal Deposu, Çeker Ocak, İlaç Hazırlama Odası"
                className="h-8 text-xs bg-background"
                value={descriptionName}
                onChange={(e) => setDescriptionName(e.target.value)}
              />
              <p className="text-[10px] text-muted-foreground">
                Tehlikeli maddelerin birim içerisindeki spesifik saklama alanını (oda, dolap, çeker ocak vb.) belirtebilirsiniz.
              </p>
            </div>
          </div>

          {/* Konum Önizleme Özeti */}
          <div className="bg-muted/15 border border-dashed border-border/80 rounded-lg p-2.5 flex items-center gap-2 text-xs text-muted-foreground">
            <Layers className="w-4 h-4 text-primary shrink-0" />
            <div className="truncate">
              <span className="font-semibold text-foreground">Oluşturulacak Yol: </span>
              <span>{selectedBuilding} &gt; {selectedBlock} &gt; {selectedFloor} &gt; </span>
              <span className="font-semibold text-foreground">{departmentName.trim() || 'Birim Adı'}</span>
              {descriptionName.trim() && (
                <span> &gt; <strong className="text-foreground">{descriptionName.trim()}</strong></span>
              )}
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t border-border/60">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => onOpenChange(false)}
              className="text-xs h-8 px-4"
            >
              İptal
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={createMutation.isPending || !departmentName.trim()}
              className="text-xs h-8 px-4 font-semibold gap-1.5 shadow-sm"
            >
              {createMutation.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              {createMutation.isPending ? 'Kaydediliyor...' : 'Birimi Tanımla'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
