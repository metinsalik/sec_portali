import React, { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { thermalInspectionService, type ThermalPanel } from '@/services/thermal-inspection.service';
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
  MapPin,
  Layers,
  Zap,
  Hash,
  Sparkles,
  Info,
  Check,
  Copy,
  Building2,
  SlidersHorizontal,
  ChevronDown,
  RotateCcw
} from 'lucide-react';
import { toast } from 'sonner';

// Standart Mahal/Pano Tipleri
const DEFAULT_ROOM_TYPES = [
  'ADP Pano Odası',
  'Kompanzasyon',
  'Kat Panosu',
  'MCC Panosu',
  'Elektrik Panosu',
  'Trafo Odası',
  'UPS Odası',
  'Sunucu Odası',
  'Sistem Odası',
  'Jeneratör Odası',
  'Arşiv Odası',
  'Radyoloji Odası',
  'Hücre Odası',
  'CCTV Odası',
  'Bedaş Odası',
  'Anjiyo Odası'
];

export function getFacilityLocationCode(fac?: { name?: string; shortName?: string | null }): string {
  if (fac?.shortName && fac.shortName.trim().length >= 2) {
    const clean = fac.shortName.trim().toUpperCase().replace(/[^A-ZÇĞİÖŞÜ]/g, '');
    if (clean.length >= 3) return clean.substring(0, 3);
    if (clean.length === 2) return clean + '1';
  }
  if (!fac?.name) return 'LOK';

  const n = fac.name.trim().toLocaleUpperCase('tr-TR');
  if (n.includes('BAHÇELİEVLER') || n.includes('BAHCELIEVLER')) return 'BAH';
  if (n.includes('ULUS')) return 'ULS';
  if (n.includes('ATAŞEHİR') || n.includes('ATASEHIR')) return 'ATA';
  if (n.includes('GÖZTEPE') || n.includes('GOZTEPE')) return 'GOZ';
  if (n.includes('KADIKÖY') || n.includes('KADIKOY')) return 'KDK';
  if (n.includes('BEŞİKTAŞ') || n.includes('BESIKTAS')) return 'BSK';
  if (n.includes('BAKIRKÖY') || n.includes('BAKIRKOY')) return 'BAK';
  if (n.includes('ANKARA')) return 'ANK';
  if (n.includes('ANTALYA')) return 'ANT';
  if (n.includes('BURSA')) return 'BUR';
  if (n.includes('ÇAMLICA') || n.includes('CAMLICA')) return 'CAM';
  if (n.includes('FLORYA')) return 'FLO';
  if (n.includes('GAZİOSMANPAŞA') || n.includes('GOP')) return 'GOP';
  if (n.includes('FATİH') || n.includes('FATIH')) return 'FTH';
  if (n.includes('SAMSUN')) return 'SAM';
  if (n.includes('TOKAT')) return 'TOK';
  if (n.includes('TRABZON')) return 'TRB';
  if (n.includes('İZMİR') || n.includes('IZMIR')) return 'IZM';
  if (n.includes('KOCAELİ') || n.includes('KOCAELI')) return 'KOC';
  if (n.includes('MALTEPE')) return 'MLT';
  if (n.includes('PENDİK') || n.includes('PENDIK')) return 'PND';
  if (n.includes('ÜMRANİYE') || n.includes('UMRANIYE')) return 'UMR';
  if (n.includes('ÜSKÜDAR') || n.includes('USKUDAR')) return 'USK';
  if (n.includes('SARIYER')) return 'SRY';
  if (n.includes('ŞİŞLİ') || n.includes('SISLI')) return 'SSL';

  const cleaned = n.replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
  return cleaned.substring(0, 3).padEnd(3, 'X');
}

export function getFloorCode(floorName?: string): string {
  if (!floorName) return 'ZMK';
  const f = floorName.trim().toLocaleLowerCase('tr-TR');

  if (f.includes('çatı') || f.includes('cati') || f.includes('çtk')) return 'ÇTK';
  if (f.includes('zemin') || f === 'zk' || f === '0' || f === '0. kat') return 'ZMK';
  if (f.includes('asma')) return 'ASM';
  if (f.includes('teras')) return 'TRS';
  if (f.includes('otopark')) return 'OTP';

  const bodrumMatch = f.match(/(?:bodrum|-|b)\s*(\d+)/i) || f.match(/(\d+)\.\s*bodrum/i);
  if (bodrumMatch) {
    return `B${bodrumMatch[1]}K`;
  }

  const katMatch = f.match(/(?:kat\s*)?(\d+)(?:\.\s*kat)?/i);
  if (katMatch) {
    const num = parseInt(katMatch[1], 10);
    return num < 10 ? `K0${num}` : `K${num}`;
  }

  const clean = floorName.toLocaleUpperCase('tr-TR').replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
  return clean.substring(0, 3).padEnd(3, 'K');
}

export function getTypeCode(panelTypeName?: string): string {
  if (!panelTypeName) return 'ELK';
  const t = panelTypeName.trim().toLocaleLowerCase('tr-TR');

  if (t.includes('adp')) return 'ADP';
  if (t.includes('kompanzasyon') || t.includes('kmp')) return 'KMP';
  if (t.includes('mcc')) return 'MCC';
  if (t.includes('kat pano') || t.includes('kat')) return 'KTP';
  if (t.includes('trafo')) return 'TRF';
  if (t.includes('ups')) return 'UPS';
  if (t.includes('sunucu')) return 'SNC';
  if (t.includes('sistem')) return 'SST';
  if (t.includes('jeneratör') || t.includes('jenerator')) return 'JNR';
  if (t.includes('arşiv') || t.includes('arsiv')) return 'ARS';
  if (t.includes('radyoloji')) return 'RAD';
  if (t.includes('hücre') || t.includes('hucre')) return 'HCR';
  if (t.includes('cctv')) return 'CTV';
  if (t.includes('bedaş') || t.includes('bedas')) return 'BDS';
  if (t.includes('anjiyo')) return 'ANJ';
  if (t.includes('aydınlatma') || t.includes('aydinlatma')) return 'AYD';
  if (t.includes('mekanik')) return 'MKN';
  if (t.includes('yangın') || t.includes('yangin')) return 'YNG';
  if (t.includes('elektrik')) return 'ELK';

  const clean = panelTypeName.toLocaleUpperCase('tr-TR').replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
  return clean.substring(0, 3).padEnd(3, 'P');
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  facilities: Array<{ id: string; name: string; shortName?: string | null }>;
  activeFacilityId?: string;
  panelToEdit?: ThermalPanel | null;
  onSaved: () => void;
}

export const ThermalCreatePanelModal: React.FC<Props> = ({
  isOpen,
  onClose,
  facilities,
  activeFacilityId,
  panelToEdit,
  onSaved
}) => {
  const [facilityId, setFacilityId] = useState<string>(() => {
    if (panelToEdit?.facilityId) return panelToEdit.facilityId;
    if (activeFacilityId && activeFacilityId !== 'all') return activeFacilityId;
    return facilities[0]?.id || '';
  });

  const [building, setBuilding] = useState<string>(panelToEdit?.building || 'Ana Bina');
  const [block, setBlock] = useState<string>(panelToEdit?.block || '');
  const [floor, setFloor] = useState<string>(panelToEdit?.floor || '');
  const [panelType, setPanelType] = useState<string>(panelToEdit?.panelType || 'ADP Pano Odası');
  const [description, setDescription] = useState<string>(panelToEdit?.description || '');
  const [equipmentConnection, setEquipmentConnection] = useState<string>(panelToEdit?.equipmentConnection || '');
  const [measurementPoint, setMeasurementPoint] = useState<string>(panelToEdit?.measurementPoint || '');

  // 4 Bileşen Kodu State'leri (Kullanıcı manuel ince ayar da yapabilsin)
  const [locationCode, setLocationCode] = useState<string>(panelToEdit?.locationCode || '');
  const [floorCode, setFloorCode] = useState<string>(panelToEdit?.floorCode || '');
  const [typeCode, setTypeCode] = useState<string>(panelToEdit?.typeCode || '');
  const [sequenceNumber, setSequenceNumber] = useState<number>(panelToEdit?.sequenceNumber || 1);

  // Manuel kod düzenleme modu
  const [manualCodeOverride, setManualCodeOverride] = useState<boolean>(false);
  const [customPanelCode, setCustomPanelCode] = useState<string>(panelToEdit?.panelCode || '');
  const [panelName, setPanelName] = useState<string>(panelToEdit?.panelName || '');
  const [copied, setCopied] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Aktif tesis objesi
  const selectedFacility = useMemo(() => {
    return facilities.find(f => f.id === facilityId) || facilities[0];
  }, [facilities, facilityId]);

  // Bina & Kat Konumları Listesi (Ortak Ayarlardan)
  const { data: buildingFloors = [] } = useQuery<any[]>({
    queryKey: ['fm200BuildingFloors', facilityId],
    queryFn: async () => {
      if (!facilityId) return [];
      const res = await api.get(`/fm200/building-floors?facilityId=${facilityId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!facilityId && isOpen
  });

  // Ortak Ayarlardaki Pano Tipleri Listesi
  const { data: fm200Settings } = useQuery<any>({
    queryKey: ['fm200Settings'],
    queryFn: async () => {
      const res = await api.get('/fm200/settings');
      if (!res.ok) return null;
      return res.json();
    },
    enabled: isOpen
  });

  const configuredRoomTypes: string[] = useMemo(() => {
    const raw = fm200Settings?.roomTypes;
    let list: string[] = [];
    if (Array.isArray(raw)) list = raw;
    else if (typeof raw === 'string') {
      try { list = JSON.parse(raw); } catch { list = []; }
    } else {
      list = DEFAULT_ROOM_TYPES;
    }
    const set = new Set<string>();
    const res: string[] = [];
    list.forEach(item => {
      if (typeof item === 'string' && item.trim()) {
        const norm = item.trim().normalize('NFC');
        const low = norm.toLocaleLowerCase('tr-TR');
        if (!set.has(low) && low !== 'diğer' && low !== 'diger') {
          set.add(low);
          res.push(norm);
        }
      }
    });
    return res.length > 0 ? res : DEFAULT_ROOM_TYPES;
  }, [fm200Settings]);

  // Mevcut Binalar, Bloklar ve Katlar
  const availableBuildings = useMemo(() => {
    const set = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.building && bf.building.trim()) set.add(bf.building.trim());
    });
    if (set.size === 0) set.add('Ana Bina');
    return Array.from(set);
  }, [buildingFloors]);

  const availableBlocks = useMemo(() => {
    const set = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.block && bf.block.trim()) set.add(bf.block.trim());
    });
    return Array.from(set);
  }, [buildingFloors]);

  const availableFloors = useMemo(() => {
    const set = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.floor && bf.floor.trim()) set.add(bf.floor.trim());
    });
    return Array.from(set);
  }, [buildingFloors]);

  // Düzenleme modunda veya yeni açılışta state reset
  useEffect(() => {
    if (panelToEdit) {
      setFacilityId(panelToEdit.facilityId);
      setBuilding(panelToEdit.building || 'Ana Bina');
      setBlock(panelToEdit.block || '');
      setFloor(panelToEdit.floor || '');
      setPanelType(panelToEdit.panelType || 'ADP Pano Odası');
      setDescription(panelToEdit.description || '');
      setEquipmentConnection(panelToEdit.equipmentConnection || '');
      setMeasurementPoint(panelToEdit.measurementPoint || '');
      setLocationCode(panelToEdit.locationCode || '');
      setFloorCode(panelToEdit.floorCode || '');
      setTypeCode(panelToEdit.typeCode || '');
      setSequenceNumber(panelToEdit.sequenceNumber || 1);
      setCustomPanelCode(panelToEdit.panelCode || '');
      setPanelName(panelToEdit.panelName || '');
    } else {
      if (activeFacilityId && activeFacilityId !== 'all') {
        setFacilityId(activeFacilityId);
      }
      if (availableFloors.length > 0 && !floor) {
        setFloor(availableFloors[0]);
      }
    }
  }, [panelToEdit, isOpen]);

  // Kat veya Tesis seçildiğinde varsayılan kat ayarı
  useEffect(() => {
    if (!panelToEdit && availableFloors.length > 0 && !floor) {
      setFloor(availableFloors[0]);
    }
  }, [availableFloors, floor, panelToEdit]);

  // Otomatik Kod Segmentlerini Güncelle
  useEffect(() => {
    if (!panelToEdit || !locationCode) {
      const derivedLoc = getFacilityLocationCode(selectedFacility);
      setLocationCode(derivedLoc);
    }
  }, [selectedFacility, panelToEdit]);

  useEffect(() => {
    if (!panelToEdit || !floorCode) {
      const derivedFlr = getFloorCode(floor);
      setFloorCode(derivedFlr);
    }
  }, [floor, panelToEdit]);

  useEffect(() => {
    if (!panelToEdit || !typeCode) {
      const derivedTyp = getTypeCode(panelType);
      setTypeCode(derivedTyp);
    }
  }, [panelType, panelToEdit]);

  // Backend'den bir sonraki sıra numarasını otomatik sorgula
  useEffect(() => {
    if (panelToEdit) return; // Düzenlemede var olan sıra no korunur
    if (!facilityId || !locationCode || !floorCode || !typeCode) return;

    let isMounted = true;
    const fetchNextSeq = async () => {
      try {
        const res = await thermalInspectionService.getNextPanelSequence({
          facilityId,
          locationCode,
          floorCode,
          typeCode
        });
        if (isMounted && res.nextSequence) {
          setSequenceNumber(res.nextSequence);
        }
      } catch (err) {
        console.error('Sequence fetch error:', err);
      }
    };

    const timer = setTimeout(fetchNextSeq, 200);
    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [facilityId, locationCode, floorCode, typeCode, panelToEdit]);

  // Formatlı 3 basamaklı sıra no string
  const formattedSeq = useMemo(() => {
    return String(sequenceNumber).padStart(3, '0');
  }, [sequenceNumber]);

  // Bileşik Otomatik Pano Kodu (Örn: BAH-B1K-ADP-001)
  const computedCompositeCode = useMemo(() => {
    const loc = (locationCode || 'LOK').toUpperCase();
    const flr = (floorCode || 'KAT').toUpperCase();
    const typ = (typeCode || 'PNO').toUpperCase();
    return `${loc}-${flr}-${typ}-${formattedSeq}`;
  }, [locationCode, floorCode, typeCode, formattedSeq]);

  const activePanelCode = manualCodeOverride ? customPanelCode : computedCompositeCode;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activePanelCode);
    setCopied(true);
    toast.success('Pano kodu kopyalandı: ' + activePanelCode);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!facilityId) {
      toast.error('Lütfen bir tesis seçin');
      return;
    }
    if (!floor.trim()) {
      toast.error('Lütfen bir kat seçin veya girin');
      return;
    }
    if (!panelType.trim()) {
      toast.error('Lütfen pano tipi seçin');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload: Partial<ThermalPanel> = {
        facilityId,
        panelCode: activePanelCode.trim().toUpperCase(),
        panelName: panelName.trim() ? panelName.trim() : activePanelCode.trim().toUpperCase(),
        building: building.trim() || 'Ana Bina',
        block: block.trim() || null,
        floor: floor.trim(),
        panelType: panelType.trim(),
        description: description.trim() || null,
        locationCode: locationCode.trim().toUpperCase(),
        floorCode: floorCode.trim().toUpperCase(),
        typeCode: typeCode.trim().toUpperCase(),
        sequenceNumber,
        equipmentConnection: equipmentConnection.trim() || null,
        measurementPoint: measurementPoint.trim() || null
      };

      if (panelToEdit?.id) {
        await thermalInspectionService.updatePanel(panelToEdit.id, payload);
        toast.success(`'${payload.panelCode}' panosu başarıyla güncellendi`);
      } else {
        await thermalInspectionService.createPanel(payload);
        toast.success(`'${payload.panelCode}' panosu başarıyla envantere eklendi`);
      }

      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Pano kaydedilemedi');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto p-0 border border-slate-200 dark:border-slate-800 shadow-2xl">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white rounded-t-lg border-b border-slate-800 relative overflow-hidden">
          <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-orange-400 shadow-inner">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <DialogTitle className="text-lg font-bold text-white tracking-tight">
                  {panelToEdit ? 'Pano Envanterini Düzenle' : 'Yeni Pano Envanteri Kaydı'}
                </DialogTitle>
                <DialogDescription className="text-xs text-slate-300 mt-0.5">
                  Kat, blok ve pano tipine göre 4 kademeli standart Pano Kodu (UUID) üretimi
                </DialogDescription>
              </div>
            </div>
            {panelToEdit && (
              <Badge variant="outline" className="border-orange-400 text-orange-300 text-xs font-mono">
                Düzenleme Modu
              </Badge>
            )}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* ─────────────────────────────────────────────────────────── */}
          {/* CANLI PANO KODU ÜRETİM KARTI (GÖRSEL ŞEMAYA UYUMLU)           */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/50 p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider">
                  Otomatik Üretilen Pano Kodu
                </span>
                <span className="text-[10px] text-slate-500 font-normal">
                  (4 Bölümlü Standart Yapı)
                </span>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setManualCodeOverride(!manualCodeOverride)}
                className="text-xs h-7 text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 gap-1 font-medium"
              >
                <SlidersHorizontal className="w-3 h-3" />
                {manualCodeOverride ? 'Otomatik Koda Dön' : 'Kodu Özelleştir'}
              </Button>
            </div>

            {/* 4 Renkli Segment Kutucukları (Kullanıcının yüklediği görselin birebir tasarımı) */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {/* 1. Lokasyon Kodu (Yeşil) */}
              <div className="rounded-lg border border-emerald-300 dark:border-emerald-800/80 bg-emerald-50 dark:bg-emerald-950/30 p-2.5 text-center relative group transition-all">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-emerald-800 dark:text-emerald-300 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span>1. Lokasyon</span>
                </div>
                <div className="font-mono text-base font-black text-emerald-900 dark:text-emerald-100 tracking-wider">
                  {locationCode || 'LOK'}
                </div>
                <div className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80 truncate mt-0.5">
                  {selectedFacility?.shortName || selectedFacility?.name || 'Tesis'}
                </div>
              </div>

              {/* 2. Kat Kodu (Turuncu) */}
              <div className="rounded-lg border border-amber-300 dark:border-amber-800/80 bg-amber-50 dark:bg-amber-950/30 p-2.5 text-center relative group transition-all">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-amber-800 dark:text-amber-300 mb-1">
                  <Layers className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                  <span>2. Kat Kodu</span>
                </div>
                <div className="font-mono text-base font-black text-amber-900 dark:text-amber-100 tracking-wider">
                  {floorCode || 'KAT'}
                </div>
                <div className="text-[10px] text-amber-700/80 dark:text-amber-400/80 truncate mt-0.5">
                  {floor || 'Kat seçilmedi'}
                </div>
              </div>

              {/* 3. Pano Türü (Cyan/Mavi) */}
              <div className="rounded-lg border border-cyan-300 dark:border-cyan-800/80 bg-cyan-50 dark:bg-cyan-950/30 p-2.5 text-center relative group transition-all">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-cyan-800 dark:text-cyan-300 mb-1">
                  <Zap className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>3. Pano Türü</span>
                </div>
                <div className="font-mono text-base font-black text-cyan-900 dark:text-cyan-100 tracking-wider">
                  {typeCode || 'PNO'}
                </div>
                <div className="text-[10px] text-cyan-700/80 dark:text-cyan-400/80 truncate mt-0.5">
                  {panelType || 'Pano tipi'}
                </div>
              </div>

              {/* 4. Pano Numarası (Mor) */}
              <div className="rounded-lg border border-purple-300 dark:border-purple-800/80 bg-purple-50 dark:bg-purple-950/30 p-2.5 text-center relative group transition-all">
                <div className="flex items-center justify-center gap-1 text-[11px] font-semibold text-purple-800 dark:text-purple-300 mb-1">
                  <Hash className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400" />
                  <span>4. Pano No</span>
                </div>
                <div className="font-mono text-base font-black text-purple-900 dark:text-purple-100 tracking-wider">
                  {formattedSeq}
                </div>
                <div className="text-[10px] text-purple-700/80 dark:text-purple-400/80 truncate mt-0.5">
                  Sıra No #{sequenceNumber}
                </div>
              </div>
            </div>

            {/* Büyük Pano Kodu Önizleme Şeridi */}
            <div className="flex items-center justify-between gap-3 bg-white dark:bg-slate-950 p-3 rounded-lg border border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-500">Nihai Kod:</span>
                <span className="font-mono font-black text-lg text-slate-900 dark:text-white tracking-wider">
                  {activePanelCode}
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleCopyCode}
                className="text-xs h-8 gap-1.5 font-medium"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Kopyalandı' : 'Kodu Kopyala'}
              </Button>
            </div>

            {/* Manuel Kod Düzenleme Alanı (Opsiyonel) */}
            {manualCodeOverride && (
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <div>
                  <Label className="text-[11px] text-slate-600 dark:text-slate-400">Lokasyon Kodu</Label>
                  <Input
                    value={locationCode}
                    onChange={(e) => setLocationCode(e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600 dark:text-slate-400">Kat Kodu</Label>
                  <Input
                    value={floorCode}
                    onChange={(e) => setFloorCode(e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600 dark:text-slate-400">Pano Tür Kodu</Label>
                  <Input
                    value={typeCode}
                    onChange={(e) => setTypeCode(e.target.value.toUpperCase())}
                    className="h-8 font-mono text-xs uppercase"
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-slate-600 dark:text-slate-400">Sıra Numarası</Label>
                  <Input
                    type="number"
                    min={1}
                    max={999}
                    value={sequenceNumber}
                    onChange={(e) => setSequenceNumber(parseInt(e.target.value, 10) || 1)}
                    className="h-8 font-mono text-xs"
                  />
                </div>
              </div>
            )}
          </div>

          {/* ─────────────────────────────────────────────────────────── */}
          {/* FORM ALANLARI: KAT, BLOK, BİNA, PANO TİPİ, AÇIKLAMA          */}
          {/* ─────────────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {/* Tesis Seçimi (Eğer birden çok tesis varsa) */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tesis / Lokasyon <span className="text-rose-500">*</span>
              </Label>
              <select
                value={facilityId}
                onChange={(e) => setFacilityId(e.target.value)}
                className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 mt-1"
              >
                {facilities.map((fac) => (
                  <option key={fac.id} value={fac.id}>
                    {fac.name} {fac.shortName ? `(${fac.shortName})` : ''}
                  </option>
                ))}
              </select>
            </div>

            {/* Kat, Blok ve Bina Seçimi */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* Kat Seçimi (Zorunlu) */}
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Kat <span className="text-rose-500">*</span>
                </Label>
                <div className="relative mt-1">
                  <Input
                    list="floors-list"
                    value={floor}
                    onChange={(e) => setFloor(e.target.value)}
                    placeholder="Örn: B1. Kat, Zemin Kat..."
                    className="h-9 text-xs"
                    required
                  />
                  <datalist id="floors-list">
                    {availableFloors.map((flr) => (
                      <option key={flr} value={flr} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Blok Seçimi (Opsiyonel / Hazır Liste) */}
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Blok
                </Label>
                <div className="relative mt-1">
                  <Input
                    list="blocks-list"
                    value={block}
                    onChange={(e) => setBlock(e.target.value)}
                    placeholder="Örn: A Blok, B Blok..."
                    className="h-9 text-xs"
                  />
                  <datalist id="blocks-list">
                    {availableBlocks.map((blk) => (
                      <option key={blk} value={blk} />
                    ))}
                  </datalist>
                </div>
              </div>

              {/* Bina Adı (Varsayılan: Ana Bina) */}
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Bina
                </Label>
                <div className="relative mt-1">
                  <Input
                    list="buildings-list"
                    value={building}
                    onChange={(e) => setBuilding(e.target.value)}
                    placeholder="Örn: Ana Bina"
                    className="h-9 text-xs"
                  />
                  <datalist id="buildings-list">
                    {availableBuildings.map((b) => (
                      <option key={b} value={b} />
                    ))}
                  </datalist>
                </div>
              </div>
            </div>

            {/* Pano Tipi Seçimi (Zorunlu - Standart Listeden) */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pano Tipi <span className="text-rose-500">*</span>
              </Label>
              <div className="relative mt-1">
                <select
                  value={panelType}
                  onChange={(e) => setPanelType(e.target.value)}
                  className="w-full h-9 rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-1.5 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
                >
                  {configuredRoomTypes.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Görünen Pano Adı (Opsiyonel - Özel Takma İsim) */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Görünen Pano Adı / Tanımı <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                </Label>
                <span className="text-[10px] text-slate-400">
                  Boş bırakılırsa Pano Kodu kullanılır
                </span>
              </div>
              <Input
                value={panelName}
                onChange={(e) => setPanelName(e.target.value)}
                placeholder={`Örn: B1. Kat ADP Ana Dağıtım Panosu (Varsayılan: ${activePanelCode})`}
                className="h-9 text-xs mt-1"
              />
            </div>

            {/* Açıklama (Opsiyonel - Kullanıcının özellikle belirttiği alan: ister doldurur ister boş bırakır) */}
            <div>
              <div className="flex items-center justify-between">
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Açıklama <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                </Label>
                <span className="text-[10px] text-slate-400">
                  İster doldurabilir, ister boş bırakabilirsiniz
                </span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Pano hakkında özel notlar, besleme kaynağı, pano konumu veya açıklama..."
                rows={2}
                className="w-full rounded-md border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500 mt-1 resize-none"
              />
            </div>

            {/* İsteğe Bağlı Ekipman / Bağlantı & Ölçüm Noktası */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ekipman / Bağlantı <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                </Label>
                <Input
                  value={equipmentConnection}
                  onChange={(e) => setEquipmentConnection(e.target.value)}
                  placeholder="Örn: Ana Şalter, Kompanzasyon Barası..."
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Ölçüm Noktası <span className="text-slate-400 font-normal">(Opsiyonel)</span>
                </Label>
                <Input
                  value={measurementPoint}
                  onChange={(e) => setMeasurementPoint(e.target.value)}
                  placeholder="Örn: R-S-T Giriş Klemensleri..."
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <DialogFooter className="pt-4 border-t border-slate-200 dark:border-slate-800 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
              className="text-xs h-9"
            >
              İptal
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="text-xs h-9 font-semibold bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-sm gap-1.5"
            >
              {isSubmitting ? (
                <>Kaydediliyor...</>
              ) : panelToEdit ? (
                <>Değişiklikleri Güncelle</>
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5" />
                  Panoyu Envantere Kaydet
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
