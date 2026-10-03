import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ImageUploadWithPreview, type PhotoItem } from '@/components/fm200/ImageUploadWithPreview';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Flame,
  Building2,
  Layers,
  Sparkles,
  Info,
  Plus,
  Loader2,
  ShieldAlert,
  ShieldCheck,
  Wrench,
  HelpCircle,
  Camera,
  DoorOpen,
  Filter,
  Check,
  RotateCcw,
  Edit2,
  FileCheck2,
  ClipboardList,
  Calendar,
  Search,
  Trash2,
  Settings2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

// Varsayılan Soru Listesi (Eğer backend ayarlarından gelmezse)
const DEFAULT_QUESTIONS_FALLBACK = [
  { id: 1, category: 'Fiziksel Güvenlik ve Ortam', text: 'Gaz tüpleri mahal dışında ve yetkisiz erişimden korunacak şekilde mi?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 2, category: 'Fiziksel Güvenlik ve Ortam', text: 'Gaz tüpleri doğrudan güneş ışığı, ısı veya titreşime maruz kalıyor mu?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 3, category: 'Fiziksel Güvenlik ve Ortam', text: 'Kontrol paneli mahal dışında ve korunmuş şekilde mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 4, category: 'Fiziksel Güvenlik ve Ortam', text: 'Duvar, tavan, döşeme geçişleri ve kablo tavalarında sızdırmazlık tam mı?', weight: 10, criticality: 'KRİTİK', isSealing: true },
  { id: 5, category: 'Fiziksel Güvenlik ve Ortam', text: 'Kapı altları, contalar ve birleşim yerleri yeterli sızdırmazlıkta mı?', weight: 10, criticality: 'Yüksek', isSealing: true },
  { id: 6, category: 'Fiziksel Güvenlik ve Ortam', text: 'Havalandırma açıklıkları/damperler gaz boşalmasında otomatik kapanıyor mu?', weight: 10, criticality: 'KRİTİK', isSealing: true },
  { id: 7, category: 'Fiziksel Güvenlik ve Ortam', text: 'Odanın mevcut kullanım düzeni ve net hacmi tasarım hacmiyle uyumlu mu?', weight: 10, criticality: 'Standart', isSealing: true },
  { id: 8, category: 'Fiziksel Güvenlik ve Ortam', text: 'Güncel Door Fan Test raporu var mı ve gaz tutma süresi standardı sağlıyor mu?', weight: 10, criticality: 'KRİTİK', isSealing: true },
  { id: 9, category: 'Etiketleme ve İşaretleme', text: 'Tüpler üzerinde üretici, içerik, seri no etiketleri okunabilir mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 10, category: 'Etiketleme ve İşaretleme', text: 'Tüpler üzerinde güncel dolum ve kontrol tarihleri mevcut mu?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 11, category: 'Etiketleme ve İşaretleme', text: 'Giriş kapısında tehlike uyarı levhası var mı?', weight: 3, criticality: 'Düşük', isSealing: false },
  { id: 12, category: 'Tesisat ve Donanım', text: 'Tüpler dolu, kullanıma hazır ve manometre basınçları yeşil alanda mı?', weight: 10, criticality: 'KRİTİK', isSealing: false },
  { id: 13, category: 'Tesisat ve Donanım', text: 'Sistem normal işletim koşullarında "Otomatik" modda mı?', weight: 5, criticality: 'KRİTİK', isSealing: false },
  { id: 14, category: 'Tesisat ve Donanım', text: 'Acil durdurma butonu mahal dışında, erişilebilir ve çalışır durumda mı?', weight: 5, criticality: 'Standart', isSealing: false },
  { id: 15, category: 'Tesisat ve Donanım', text: 'Nozul atış yönünde gaz dağılımını engelleyen kabin, tava vb. engel var mı?', weight: 10, criticality: 'KRİTİK', isSealing: false },
  { id: 16, category: 'Tesisat ve Donanım', text: 'Asma tavan veya yükseltilmiş döşemede ayrı nozul koruması var mı?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 17, category: 'Tesisat ve Donanım', text: 'Dedektörler yangını erken algılayacak konumda mı?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 18, category: 'Tesisat ve Donanım', text: 'Dedektör çevrelerinde hava akışını/dumanı engelleyen bariyer var mı?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 19, category: 'Tesisat ve Donanım', text: 'Asma tavan ve döşeme altında gereken algılama sağlanmış mı?', weight: 7, criticality: 'Standart', isSealing: false },
  { id: 20, category: 'Periyodik Kontrol & Bakım', text: 'Yetkili kurum periyodik kontrol raporları eksiksiz ve güncel mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 21, category: 'Periyodik Kontrol & Bakım', text: 'Üretici talimatlarına uygun düzenli bakım kayıtları mevcut mu?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 22, category: 'Acil Durum Senaryoları', text: 'Boşalma öncesi çalışanları uyaran sesli ve ışıklı alarm sistemi var mı?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 23, category: 'Acil Durum Senaryoları', text: 'Genel yangın ihbar sistemine entegrasyon test edilmiş mi?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 24, category: 'Acil Durum Senaryoları', text: 'Yangın damperi ve havalandırma durdurma otomasyonu entegre çalışıyor mu?', weight: 10, criticality: 'Standart', isSealing: false },
  { id: 25, category: 'Acil Durum Senaryoları', text: 'Boşalma sonrası gaz tahliyesi için mekanik/doğal tahliye sistemi var mı?', weight: 7, criticality: 'Standart', isSealing: false }
];

export interface QuestionResponse {
  status: 'Karşılıyor' | 'Kısmen Karşılıyor' | 'Karşılamıyor' | 'Kapsam Dışı';
  responsible?: 'Teknik' | 'Firma'; // geriye dönük uyumluluk
  responsibles?: ('Teknik' | 'Firma')[]; // hem Teknik hem Firma çoklu seçim imkanı
  templates?: string[];
  customNote?: string;
  photos?: PhotoItem[];
}

export default function Fm200WizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Aktif Tesis (Global Side Menü FacilitySwitcher ile senkron)
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>(() => {
    return searchParams.get('facilityId') || localStorage.getItem('activeFacilityId') || '';
  });

  // Wizard Açık mı?
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [isExitConfirmOpen, setIsExitConfirmOpen] = useState(false);
  const [editingInspectionId, setEditingInspectionId] = useState<string | null>(null);

  // Denetimi Yapılan Mahaller Tablo Filtreleri
  const [tableFilterBlock, setTableFilterBlock] = useState<string>('all');
  const [tableFilterFloor, setTableFilterFloor] = useState<string>('all');
  const [tableFilterRoomType, setTableFilterRoomType] = useState<string>('all');
  const [tableFilterStatus, setTableFilterStatus] = useState<string>('all'); // all, Devam Ediyor, Tamamlandi
  const [tableSearchQuery, setTableSearchQuery] = useState<string>('');

  // Form Alanları (Konum Seçimi)
  const [selectedBuilding, setSelectedBuilding] = useState<string>('');
  const [selectedBlock, setSelectedBlock] = useState<string>('');
  const [selectedFloor, setSelectedFloor] = useState<string>('');
  const [selectedRoomType, setSelectedRoomType] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Soru Sırası & Yanıtlar
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState<number>(0);
  const [responses, setResponses] = useState<Record<number, QuestionResponse>>({});

  // Manuel Konum Tanımlama Modal
  const [isAddLocationModalOpen, setIsAddLocationModalOpen] = useState(false);
  const [newLocationForm, setNewLocationForm] = useState({
    building: 'Ana Bina',
    block: '',
    floor: 'Zemin Kat',
    roomType: 'Sunucu Odası',
    customRoomName: '',
    systemType: 'FM-200',
    panelType: '',
    roomVolumeM3: '',
    cylinderCount: 1,
    notes: ''
  });

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  // Side Menü FacilitySwitcher ile Çift Yönlü Senkronizasyon
  useEffect(() => {
    const handleFacilityChange = () => {
      const activeFac = localStorage.getItem('activeFacilityId') || '';
      if (activeFac && activeFac !== 'all') {
        setSelectedFacilityId(activeFac);
      }
    };
    handleFacilityChange();
    window.addEventListener('facilityChanged', handleFacilityChange);
    return () => window.removeEventListener('facilityChanged', handleFacilityChange);
  }, []);

  // Bina, Blok ve Kat Listesini Çek
  const { data: buildingFloors = [] } = useQuery<any[]>({
    queryKey: ['fm200BuildingFloors', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId || selectedFacilityId === 'all') return [];
      const res = await api.get(`/fm200/building-floors?facilityId=${selectedFacilityId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedFacilityId && selectedFacilityId !== 'all'
  });

  // Ayarları ve Soru Setini Çek
  const { data: fm200Settings } = useQuery<any>({
    queryKey: ['fm200Settings'],
    queryFn: async () => {
      const res = await api.get('/fm200/settings');
      if (!res.ok) return null;
      return res.json();
    }
  });

  const questions = useMemo(() => {
    return (fm200Settings?.checklistQuestions as any[]) || DEFAULT_QUESTIONS_FALLBACK;
  }, [fm200Settings]);

  const issueTemplates = useMemo(() => {
    return (fm200Settings?.issueTemplates as Record<number, { teknik: string[]; firma: string[] }>) || {};
  }, [fm200Settings]);

  const availableRoomTypes = useMemo(() => {
    return fm200Settings?.roomTypes || [
      'Sunucu Odası', 'Sistem Odası', 'UPS Odası', 'Trafo Odası', 'Arşiv Odası',
      'MCC Panosu', 'ADP Pano Odası', 'Elektrik Panosu', 'Kat Panosu', 'Radyoloji Odası',
      'Hücre Odası', 'CCTV Odası', 'Bedaş Odası', 'Anjiyo Odası', 'Jeneratör Odası', 'Diğer'
    ];
  }, [fm200Settings]);

  // Bu Tesise Ait Denetim Yapılan / Yapılacak Konumları Çek
  const { data: locations = [], refetch: refetchLocations } = useQuery<any[]>({
    queryKey: ['fm200Locations', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId || selectedFacilityId === 'all') return [];
      const res = await api.get(`/fm200/locations?facilityId=${selectedFacilityId}`);
      if (!res.ok) throw new Error('Konumlar alınamadı');
      return res.json();
    },
    enabled: !!selectedFacilityId && selectedFacilityId !== 'all'
  });

  // Bu Tesise Ait Tamamlanmış Denetim Kayıtlarını Çek
  const { data: inspections = [], refetch: refetchInspections } = useQuery<any[]>({
    queryKey: ['fm200Inspections', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId || selectedFacilityId === 'all') return [];
      const res = await api.get(`/fm200/inspections?facilityId=${selectedFacilityId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedFacilityId && selectedFacilityId !== 'all'
  });

  // URL'den locationId veya edit ID gelmişse doğrudan aç
  useEffect(() => {
    const locParam = searchParams.get('locationId');
    if (locParam) {
      setSelectedLocationId(locParam);
      const locObj = locations.find((l: any) => l.id === locParam);
      if (locObj) {
        setSelectedBuilding(locObj.building || '');
        setSelectedBlock(locObj.block || '');
        setSelectedFloor(locObj.floor || '');
        setSelectedRoomType(locObj.roomType || '');
      }
      initQuestions();
      setIsWizardOpen(true);
    }
  }, [searchParams, locations]);

  // Bina, Blok ve Kat Filtreleri
  const availableBuildings = useMemo(() => {
    const bSet = new Set<string>();
    buildingFloors.forEach((bf: any) => {
      if (bf.building) bSet.add(bf.building);
    });
    return Array.from(bSet);
  }, [buildingFloors]);

  const availableBlocks = useMemo(() => {
    const blkSet = new Set<string>();
    buildingFloors
      .filter((bf: any) => !selectedBuilding || bf.building === selectedBuilding)
      .forEach((bf: any) => {
        if (bf.block) blkSet.add(bf.block);
      });
    return Array.from(blkSet);
  }, [buildingFloors, selectedBuilding]);

  const availableFloors = useMemo(() => {
    return buildingFloors
      .filter((bf: any) => {
        if (selectedBuilding && bf.building !== selectedBuilding) return false;
        if (selectedBlock && bf.block !== selectedBlock) return false;
        return true;
      })
      .map((bf: any) => bf.floor);
  }, [buildingFloors, selectedBuilding, selectedBlock]);

  // Seçili Filtrelere Uyan Konumlar
  const filteredLocations = useMemo(() => {
    return locations.filter((loc: any) => {
      if (selectedBuilding && loc.building !== selectedBuilding) return false;
      if (selectedBlock && (loc.block || '') !== selectedBlock) return false;
      if (selectedFloor && loc.floor !== selectedFloor) return false;
      if (selectedRoomType && loc.roomType !== selectedRoomType) return false;
      return true;
    });
  }, [locations, selectedBuilding, selectedBlock, selectedFloor, selectedRoomType]);

  // Aynı Seçimde Kaçıncı Mahal Olacağı (#1, #2, #3...)
  const duplicateCount = useMemo(() => {
    if (!selectedFacilityId || !selectedFloor || !selectedRoomType) return 1;
    const sameCount = locations.filter((l: any) =>
      l.building === (selectedBuilding || 'Ana Bina') &&
      (l.block || '') === selectedBlock &&
      l.floor === selectedFloor &&
      l.roomType === selectedRoomType
    ).length;
    return sameCount + 1;
  }, [locations, selectedFacilityId, selectedBuilding, selectedBlock, selectedFloor, selectedRoomType]);

  // Tablo Filtreleri için Seçenek Listeleri
  const tableAvailableBlocks = useMemo(() => {
    const s = new Set<string>();
    inspections.forEach((insp: any) => {
      if (insp.location?.block) s.add(insp.location.block);
    });
    return Array.from(s).sort();
  }, [inspections]);

  const tableAvailableFloors = useMemo(() => {
    const s = new Set<string>();
    inspections.forEach((insp: any) => {
      if (insp.location?.floor) s.add(insp.location.floor);
    });
    return Array.from(s);
  }, [inspections]);

  const tableAvailableRoomTypes = useMemo(() => {
    const s = new Set<string>();
    inspections.forEach((insp: any) => {
      if (insp.location?.roomType) s.add(insp.location.roomType);
    });
    return Array.from(s).sort();
  }, [inspections]);

  // Filtrelenmiş Denetim Kayıtları (Blok, Kat, Pano/Mahal, Arama)
  const filteredInspections = useMemo(() => {
    return inspections.filter((insp: any) => {
      // Blok Filtresi
      if (tableFilterBlock !== 'all') {
        const blk = insp.location?.block || '';
        if (blk !== tableFilterBlock) return false;
      }

      // Kat Filtresi
      if (tableFilterFloor !== 'all') {
        const flr = insp.location?.floor || '';
        if (flr !== tableFilterFloor) return false;
      }

      // Pano / Mahal Türü Filtresi
      if (tableFilterRoomType !== 'all') {
        const rt = insp.location?.roomType || '';
        if (rt !== tableFilterRoomType) return false;
      }

      // Durum Filtresi (Devam Ediyor / Tamamlandı)
      if (tableFilterStatus !== 'all') {
        const isCompleted = insp.status === 'Tamamlandi' && insp.isCompleted !== false;
        if (tableFilterStatus === 'Tamamlandi' && !isCompleted) return false;
        if (tableFilterStatus === 'Devam Ediyor' && isCompleted) return false;
      }

      // Arama Metni Filtresi (UID, customRoomName, roomType, inspectedBy, notes)
      if (tableSearchQuery.trim()) {
        const query = tableSearchQuery.toLowerCase().trim();
        const uid = (insp.location?.systemUid || '').toLowerCase();
        const roomName = (insp.location?.customRoomName || '').toLowerCase();
        const roomType = (insp.location?.roomType || '').toLowerCase();
        const inspectedBy = (insp.inspectedBy || '').toLowerCase();
        const floor = (insp.location?.floor || '').toLowerCase();
        const block = (insp.location?.block || '').toLowerCase();

        const match =
          uid.includes(query) ||
          roomName.includes(query) ||
          roomType.includes(query) ||
          inspectedBy.includes(query) ||
          floor.includes(query) ||
          block.includes(query);

        if (!match) return false;
      }

      return true;
    });
  }, [inspections, tableFilterBlock, tableFilterFloor, tableFilterRoomType, tableSearchQuery]);

  // Soruları İlklendir
  const initQuestions = (existingResponses?: Record<number, QuestionResponse>, startIndex: number = 0) => {
    const initObj: Record<number, QuestionResponse> = {};
    questions.forEach((q: any) => {
      if (existingResponses && (existingResponses[q.id] || (existingResponses as any)[String(q.id)])) {
        const item = existingResponses[q.id] || (existingResponses as any)[String(q.id)];
        const respList: ('Teknik' | 'Firma')[] = Array.isArray(item.responsibles) && item.responsibles.length > 0
          ? item.responsibles
          : item.responsible ? [item.responsible] : ['Teknik'];

        initObj[q.id] = {
          ...item,
          responsible: respList[0] || 'Teknik',
          responsibles: respList
        };
      } else {
        initObj[q.id] = {
          status: 'Karşılıyor',
          responsible: 'Teknik',
          responsibles: ['Teknik'],
          templates: [],
          customNote: '',
          photos: []
        };
      }
    });
    setResponses(initObj);
    setCurrentQuestionIndex(Math.max(0, Math.min(questions.length - 1, startIndex)));
  };

  // Soru Yanıtını Güncelle
  const updateQuestionResponse = (qId: number, patch: Partial<QuestionResponse>) => {
    setResponses(prev => ({
      ...prev,
      [qId]: {
        ...(prev[qId] || { status: 'Karşılıyor', responsible: 'Teknik', templates: [], customNote: '', photos: [] }),
        ...patch
      }
    }));
  };

  // Skor ve Risk Analizi Hesaplamaları
  const stats = useMemo(() => {
    const GATEKEEPER_IDS = [4, 6, 8, 12, 13, 15];
    const SEALING_IDS = [4, 5, 6, 7, 8];

    let totalWeight = 0;
    let earnedWeight = 0;
    let totalSealingWeight = 0;
    let earnedSealingWeight = 0;
    let totalHardwareWeight = 0;
    let earnedHardwareWeight = 0;

    let redFlagFound = false;

    questions.forEach((q: any) => {
      const resp = responses[q.id] || { status: 'Karşılıyor' };
      const status = resp.status;

      if (status === 'Kapsam Dışı') return;

      const weight = Number(q.weight) || 10;
      let multiplier = 0;
      if (status === 'Karşılıyor') multiplier = 1.0;
      else if (status === 'Kısmen Karşılıyor') multiplier = 0.5;
      else if (status === 'Karşılamıyor') multiplier = 0.0;

      const earned = weight * multiplier;
      totalWeight += weight;
      earnedWeight += earned;

      if (SEALING_IDS.includes(q.id) || q.isSealing) {
        totalSealingWeight += weight;
        earnedSealingWeight += earned;
      } else {
        totalHardwareWeight += weight;
        earnedHardwareWeight += earned;
      }

      if (GATEKEEPER_IDS.includes(q.id) && (status === 'Kısmen Karşılıyor' || status === 'Karşılamıyor')) {
        redFlagFound = true;
      }
    });

    const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 1000) / 10 : 100;
    const sealingScore = totalSealingWeight > 0 ? Math.round((earnedSealingWeight / totalSealingWeight) * 1000) / 10 : 100;
    const hardwareScore = totalHardwareWeight > 0 ? Math.round((earnedHardwareWeight / totalHardwareWeight) * 1000) / 10 : 100;

    let riskLevel = 'DÜŞÜK RİSK';
    let ratingGrade = 'A';

    if (redFlagFound || overallScore < 60 || sealingScore < 60) {
      riskLevel = 'YÜKSEK RİSK';
      ratingGrade = 'D';
    } else if (overallScore < 80 || sealingScore < 80) {
      riskLevel = 'ORTA RİSK';
      ratingGrade = 'C';
    } else if (overallScore < 95) {
      ratingGrade = 'B';
    }

    return {
      overallScore,
      sealingScore,
      hardwareScore,
      riskLevel,
      ratingGrade,
      redFlagFound
    };
  }, [questions, responses]);

  // Denetimi Başlat / Yeni Mahal Oluştur
  const handleStartInspection = async () => {
    if (!selectedFacilityId || selectedFacilityId === 'all') {
      toast.error('Lütfen sol üst menüden bir tesis seçiniz.');
      return;
    }
    if (!selectedFloor || !selectedRoomType) {
      toast.error('Lütfen Kat ve Mahal Tipini seçiniz.');
      return;
    }

    try {
      let locId = selectedLocationId;
      if (!locId) {
        // Otomatik yeni mahal kaydet
        const res = await api.post('/fm200/locations', {
          facilityId: selectedFacilityId,
          building: selectedBuilding || 'Ana Bina',
          block: selectedBlock || null,
          floor: selectedFloor,
          roomType: selectedRoomType,
          systemType: 'FM-200',
          cylinderCount: 1
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error || 'Mahal oluşturulamadı');
        }
        const createdLoc = await res.json();
        locId = createdLoc.id;
        setSelectedLocationId(locId);
        refetchLocations();
        toast.success(`Mahal tanımlandı: ${createdLoc.systemUid}`);
      }

      setEditingInspectionId(null);
      initQuestions();
      setIsWizardOpen(true);
    } catch (e: any) {
      toast.error(e.message || 'Denetim başlatılamadı');
    }
  };

  // Mevcut Denetimi Düzenle / Kaldığı Yerden Devam Et
  const handleEditInspection = (insp: any) => {
    setEditingInspectionId(insp.id);
    setSelectedLocationId(insp.locationId);
    if (insp.location) {
      setSelectedBuilding(insp.location.building || '');
      setSelectedBlock(insp.location.block || '');
      setSelectedFloor(insp.location.floor || '');
      setSelectedRoomType(insp.location.roomType || '');
    }

    // Kaldığı soru indeksini tespit et (Notlardan "Soru X" varsa veya ilk cevaplanmamış / taslak sorusu)
    let resumeIndex = 0;
    if (insp.notes) {
      const match = insp.notes.match(/Soru\s*(\d+)/i);
      if (match) {
        const qNum = parseInt(match[1], 10);
        const idx = questions.findIndex((q: any) => q.id === qNum);
        if (idx >= 0) resumeIndex = idx;
      }
    }

    initQuestions(insp.itemResponses, resumeIndex);
    setIsWizardOpen(true);
  };

  // Denetimi Kaydet / Güncelle (Tamamla veya Devam Ediyor Olarak Taslak Kaydet)
  const saveInspectionMutation = useMutation({
    mutationFn: async ({ isDraft = false }: { isDraft?: boolean } = {}) => {
      const targetStatus = isDraft ? 'Devam Ediyor' : 'Tamamlandi';
      const isCompleted = !isDraft;

      // Tamamlama durumunda doğrulama: Kısmen veya Karşılamıyor seçildiyse kalıp veya açıklama zorunludur!
      if (!isDraft) {
        for (let i = 0; i < questions.length; i++) {
          const q = questions[i];
          const resp = responses[q.id];
          if (resp && (resp.status === 'Kısmen Karşılıyor' || resp.status === 'Karşılamıyor')) {
            const hasTemplate = Array.isArray(resp.templates) && resp.templates.length > 0;
            const hasNote = Boolean(resp.customNote && resp.customNote.trim().length > 0);
            if (!hasTemplate && !hasNote) {
              setCurrentQuestionIndex(i);
              throw new Error(`Kriter ${i + 1} (${q.category}): "${resp.status}" seçildi ancak ne hazır kalıp tespit seçilmiş ne de açıklama yazılmış. Lütfen hazır kalıplardan birini seçin veya açıklama yazın.`);
            }
          }
        }
      }

      if (editingInspectionId) {
        // Güncelleme (PUT)
        const res = await api.put(`/fm200/inspections/${editingInspectionId}`, {
          responses,
          status: targetStatus,
          isCompleted,
          notes: isDraft
            ? `FM-200 Denetimi Devam Ediyor (Soru ${currentQuestionIndex + 1}/${questions.length})`
            : `FM-200 Denetimi Tamamlandı - Skor: %${stats.overallScore} (${stats.riskLevel})`
        });
        if (!res.ok) throw new Error('Denetim güncellenemedi');
        return res.json();
      } else {
        // Yeni Kayıt (POST)
        const res = await api.post('/fm200/inspections', {
          locationId: selectedLocationId,
          responses,
          status: targetStatus,
          isCompleted,
          notes: isDraft
            ? `FM-200 Denetimi Devam Ediyor (Soru ${currentQuestionIndex + 1}/${questions.length})`
            : `FM-200 Saha Denetimi - Skor: %${stats.overallScore} (${stats.riskLevel})`
        });
        if (!res.ok) throw new Error('Denetim kaydedilemedi');
        return res.json();
      }
    },
    onSuccess: (data, variables) => {
      const isDraft = variables?.isDraft;
      toast.success(
        isDraft
          ? 'Denetim "Devam Ediyor" olarak kaydedildi.'
          : (editingInspectionId ? 'Denetim başarıyla güncellendi!' : 'Denetim tamamlandı ve kaydedildi!')
      );
      refetchInspections();
      refetchLocations();
      queryClient.invalidateQueries({ queryKey: ['fm200Inspections'] });
      setIsWizardOpen(false);
      setEditingInspectionId(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Kayıt sırasında hata oluştu');
    }
  });

  // Seçili Konum Bilgisini Güncelleme (Pano Türü / Adı Değiştirme)
  const [isEditingLocationDetails, setIsEditingLocationDetails] = useState(false);
  const [editRoomType, setEditRoomType] = useState('');
  const [editCustomRoomName, setEditCustomRoomName] = useState('');

  // Konum (Pano / Mahal) Güncelleme Mutation
  const updateLocationMutation = useMutation({
    mutationFn: async ({ locId, roomType, customRoomName }: { locId: string; roomType: string; customRoomName?: string }) => {
      const res = await api.put(`/fm200/locations/${locId}`, {
        roomType,
        customRoomName: customRoomName || null
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Mahal bilgisi güncellenemedi');
      }
      return res.json();
    },
    onSuccess: (updatedLoc) => {
      toast.success(`Pano / Mahal bilgisi güncellendi: ${updatedLoc.roomType}`);
      refetchLocations();
      refetchInspections();
      setIsEditingLocationDetails(false);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Güncelleme başarısız');
    }
  });

  // Denetimi Silme Onay State
  const [inspectionToDelete, setInspectionToDelete] = useState<any | null>(null);

  // Denetim Kaydını Kalıcı Olarak Silme Mutation
  const deleteInspectionMutation = useMutation({
    mutationFn: async (inspId: string) => {
      const res = await api.delete(`/fm200/inspections/${inspId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Denetim silinemedi');
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success('Denetim kaydı ve bağlı iş emirleri başarıyla silindi.');
      refetchInspections();
      queryClient.invalidateQueries({ queryKey: ['fm200Inspections'] });
      queryClient.invalidateQueries({ queryKey: ['fm200WorkOrders'] });
      setInspectionToDelete(null);
    },
    onError: (err: any) => {
      toast.error(err.message || 'Silme işlemi sırasında hata oluştu');
    }
  });

  // Aktif Tesis Nesnesi
  const activeFacility = facilities.find((f: any) => f.id === selectedFacilityId);
  const activeLocation = locations.find((l: any) => l.id === selectedLocationId);

  const currentQ = questions[currentQuestionIndex] || questions[0];
  const currentResp = currentQ ? (responses[currentQ.id] || { status: 'Karşılıyor', responsible: 'Teknik', templates: [], customNote: '', photos: [] }) : null;

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-20">
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* WIZARD MODAL / SAHA DENETİM EKRANI (TAM EKRAN MOBİL FORMAT)               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {isWizardOpen && currentQ && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
          <div className="bg-white dark:bg-slate-900 w-full max-w-3xl rounded-2xl border border-slate-200 dark:border-slate-800 shadow-2xl flex flex-col max-h-[96vh] overflow-hidden my-auto animate-in fade-in-50 zoom-in-95">
            {/* Modal Header: Tesis, Konum ve Durum Bilgisi */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded text-[11px] font-mono font-bold bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-200">
                    {activeLocation?.systemUid || 'MAHAL DENETİMİ'}
                  </span>
                  <span className="text-xs text-slate-500 font-medium">
                    {activeFacility?.name} · {selectedBuilding || 'Ana Bina'} {selectedBlock ? `/ ${selectedBlock}` : ''} ({selectedFloor})
                  </span>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {editingInspectionId ? 'Denetimi Düzenle' : 'Saha Denetimi'}: {activeLocation?.customRoomName || `${activeLocation?.roomType || selectedRoomType} #${duplicateCount}`}
                  </h3>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditRoomType(activeLocation?.roomType || selectedRoomType || 'Kat Panosu');
                      setEditCustomRoomName(activeLocation?.customRoomName || '');
                      setIsEditingLocationDetails(true);
                    }}
                    className="h-6 px-2 text-[11px] font-semibold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 flex items-center gap-1"
                    title="Panonun / Mahalin Türünü Değiştir"
                  >
                    <Settings2 className="w-3 h-3 text-blue-600" />
                    Pano Türünü Düzenle
                  </Button>
                </div>
              </div>

              {/* Kapat Butonu */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsExitConfirmOpen(true)}
                className="text-xs text-slate-500 hover:text-slate-900"
              >
                Kapat ✕
              </Button>
            </div>

            {/* Modal Gövdesi: Mobil Uyumlu Sadeleştirilmiş Soru Kartı */}
            <div className="p-4 sm:p-6 overflow-y-auto space-y-5 flex-1">
              {/* Canlı İlerleme Çubuğu */}
              <div>
                <div className="flex items-center justify-between text-xs mb-1.5 font-semibold text-slate-600 dark:text-slate-300">
                  <span>Kriter {currentQuestionIndex + 1} / {questions.length}</span>
                  <span className="text-primary font-bold">
                    %{Math.round(((currentQuestionIndex + 1) / questions.length) * 100)} Tamamlandı
                  </span>
                </div>
                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className="bg-[#0051d5] h-full rounded-full transition-all duration-300"
                    style={{ width: `${((currentQuestionIndex + 1) / questions.length) * 100}%` }}
                  />
                </div>
              </div>

              {/* Soru Başlığı */}
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                  <Badge variant="outline" className="text-[10px] bg-white dark:bg-slate-900">
                    {currentQ.category}
                  </Badge>
                  {currentQ.isSealing && (
                    <Badge className="bg-cyan-100 text-cyan-800 dark:bg-cyan-950/40 dark:text-cyan-300 text-[10px]">
                      Sızdırmazlık
                    </Badge>
                  )}
                  {currentQ.criticality === 'KRİTİK' && (
                    <Badge className="bg-red-100 text-red-800 dark:bg-red-950/40 dark:text-red-300 text-[10px] font-bold">
                      Kritik Risk
                    </Badge>
                  )}
                  <span className="text-[11px] text-slate-400 ml-auto">Ağırlık: %{currentQ.weight}</span>
                </div>
                <h4 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white leading-relaxed">
                  {currentQ.text}
                </h4>
              </div>

              {/* 4 Seçenek Butonu */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { value: 'Karşılıyor', label: 'Karşılıyor', color: 'emerald' },
                  { value: 'Kısmen Karşılıyor', label: 'Kısmen', color: 'amber' },
                  { value: 'Karşılamıyor', label: 'Karşılamıyor', color: 'red' },
                  { value: 'Kapsam Dışı', label: 'Kapsam Dışı', color: 'slate' }
                ].map((opt) => {
                  const isSelected = currentResp?.status === opt.value;
                  return (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => updateQuestionResponse(currentQ.id, { status: opt.value as any })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        isSelected
                          ? opt.color === 'emerald'
                            ? 'bg-emerald-500 text-white font-bold border-emerald-600 shadow-sm'
                            : opt.color === 'amber'
                            ? 'bg-amber-500 text-white font-bold border-amber-600 shadow-sm'
                            : opt.color === 'red'
                            ? 'bg-red-600 text-white font-bold border-red-700 shadow-sm'
                            : 'bg-slate-600 text-white font-bold border-slate-700 shadow-sm'
                          : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-50'
                      }`}
                    >
                      <div className="text-xs sm:text-sm font-semibold">{opt.label}</div>
                    </button>
                  );
                })}
              </div>

              {/* Akıllı Dallanma Paneli (Kısmen veya Karşılamıyor için) */}
              {(currentResp?.status === 'Kısmen Karşılıyor' || currentResp?.status === 'Karşılamıyor') && (
                <div className="p-4 rounded-xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 space-y-3.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900 dark:text-amber-300 uppercase">
                    <Wrench className="w-3.5 h-3.5 text-amber-600" />
                    Uygunsuzluk Çözüm & Sorumlu Seçimi
                  </div>

                  {/* Sorumlu Seçimi (Çoklu Seçim Desteği: Hem Teknik Hem Firma) */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300">
                        Sorumlu Birim (İkisi Birlikte Seçilebilir):
                      </Label>
                      {((currentResp?.responsibles?.length || 0) > 1) && (
                        <span className="text-[10px] text-amber-700 font-bold bg-amber-100 dark:bg-amber-900/40 px-1.5 py-0.5 rounded">
                          Ortak Müdahale (Teknik + Firma)
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {/* Teknik Hizmetler */}
                      {(() => {
                        const isTeknikSelected = currentResp?.responsibles?.includes('Teknik') ?? (currentResp?.responsible === 'Teknik');
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              const cur = currentResp?.responsibles || (currentResp?.responsible ? [currentResp.responsible] : ['Teknik']);
                              let next: ('Teknik' | 'Firma')[];
                              if (isTeknikSelected) {
                                if (cur.length > 1) {
                                  next = cur.filter(r => r !== 'Teknik');
                                } else {
                                  next = ['Firma'];
                                }
                              } else {
                                next = [...cur, 'Teknik'];
                              }
                              updateQuestionResponse(currentQ.id, {
                                responsibles: next,
                                responsible: next[0]
                              });
                            }}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-all relative ${
                              isTeknikSelected
                                ? 'bg-white dark:bg-slate-900 border-blue-600 text-blue-900 dark:text-blue-300 font-bold shadow-xs ring-1 ring-blue-500'
                                : 'bg-white/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-[#0051d5]">
                                <Wrench className="w-3.5 h-3.5" /> Teknik Hizmetler
                              </div>
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                                isTeknikSelected ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 bg-white'
                              }`}>
                                {isTeknikSelected ? '✓' : ''}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal block mt-1">≤ 10 cm küçük açıklık</span>
                          </button>
                        );
                      })()}

                      {/* Yetkili Firma */}
                      {(() => {
                        const isFirmaSelected = currentResp?.responsibles?.includes('Firma') ?? (currentResp?.responsible === 'Firma');
                        return (
                          <button
                            type="button"
                            onClick={() => {
                              const cur = currentResp?.responsibles || (currentResp?.responsible ? [currentResp.responsible] : ['Teknik']);
                              let next: ('Teknik' | 'Firma')[];
                              if (isFirmaSelected) {
                                if (cur.length > 1) {
                                  next = cur.filter(r => r !== 'Firma');
                                } else {
                                  next = ['Teknik'];
                                }
                              } else {
                                next = [...cur, 'Firma'];
                              }
                              updateQuestionResponse(currentQ.id, {
                                responsibles: next,
                                responsible: next[0]
                              });
                            }}
                            className={`p-2.5 rounded-lg border text-left text-xs transition-all relative ${
                              isFirmaSelected
                                ? 'bg-white dark:bg-slate-900 border-purple-600 text-purple-900 dark:text-purple-300 font-bold shadow-xs ring-1 ring-purple-500'
                                : 'bg-white/50 border-slate-200 text-slate-500 hover:bg-slate-100'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1.5 font-bold text-purple-700">
                                <Building2 className="w-3.5 h-3.5" /> Yetkili Firma
                              </div>
                              <span className={`w-4 h-4 rounded flex items-center justify-center text-[10px] border ${
                                isFirmaSelected ? 'bg-purple-600 text-white border-purple-600' : 'border-slate-300 bg-white'
                              }`}>
                                {isFirmaSelected ? '✓' : ''}
                              </span>
                            </div>
                            <span className="text-[10px] text-slate-500 font-normal block mt-1">&gt; 10 cm / Alçıpan / Damper</span>
                          </button>
                        );
                      })()}
                    </div>
                  </div>

                  {/* Hazır Kalıplar (Her iki taraf seçilmişse ikisinin kalıpları da listelenir) */}
                  {issueTemplates[currentQ.id] && (() => {
                    const selectedRespList = currentResp?.responsibles || (currentResp?.responsible ? [currentResp.responsible] : ['Teknik']);
                    const availableTpls: { tpl: string; source: string }[] = [];
                    if (selectedRespList.includes('Teknik')) {
                      (issueTemplates[currentQ.id]?.teknik || []).forEach((t: string) => {
                        availableTpls.push({ tpl: t, source: 'Teknik' });
                      });
                    }
                    if (selectedRespList.includes('Firma')) {
                      (issueTemplates[currentQ.id]?.firma || []).forEach((t: string) => {
                        if (!availableTpls.some(a => a.tpl === t)) {
                          availableTpls.push({ tpl: t, source: 'Firma' });
                        }
                      });
                    }

                    if (availableTpls.length === 0) return null;

                    return (
                      <div>
                        <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                          Hazır Tespit Kalıpları:
                        </Label>
                        <div className="space-y-1">
                          {availableTpls.map((item, idx: number) => {
                            const isChecked = currentResp?.templates?.includes(item.tpl);
                            return (
                              <label
                                key={idx}
                                className={`flex items-start gap-2 p-2 rounded-lg border text-xs cursor-pointer ${
                                  isChecked
                                    ? 'bg-white dark:bg-slate-900 border-amber-500 font-medium'
                                    : 'bg-white/60 dark:bg-slate-900/40 border-slate-200/80 text-slate-600'
                                }`}
                              >
                                <input
                                  type="checkbox"
                                  checked={!!isChecked}
                                  onChange={(e) => {
                                    const cur = currentResp?.templates || [];
                                    const upd = e.target.checked ? [...cur, item.tpl] : cur.filter(t => t !== item.tpl);
                                    updateQuestionResponse(currentQ.id, { templates: upd });
                                  }}
                                  className="rounded text-amber-600 focus:ring-amber-500 mt-0.5"
                                />
                                <div className="flex-1">
                                  <span className="text-[11px]">{item.tpl}</span>
                                  {selectedRespList.length > 1 && (
                                    <span className={`ml-1.5 text-[9px] px-1 py-0.2 rounded font-semibold ${
                                      item.source === 'Teknik' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                                    }`}>
                                      {item.source}
                                    </span>
                                  )}
                                </div>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })()}

                  {/* Ek Açıklama */}
                  <div>
                    <Label className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 mb-1 block">
                      Ek Açıklama (İsteğe Bağlı):
                    </Label>
                    <Textarea
                      value={currentResp?.customNote || ''}
                      onChange={(e) => updateQuestionResponse(currentQ.id, { customNote: e.target.value })}
                      placeholder="Sahadaki ek notunuz..."
                      rows={2}
                      className="text-xs bg-white dark:bg-slate-900"
                    />
                  </div>

                  {/* Fotoğraf Yükleme */}
                  <div>
                    <Label className="text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1 block">
                      Uygunsuzluk Fotoğrafları (Kamera / Galeri):
                    </Label>
                    <ImageUploadWithPreview
                      facilityId={selectedFacilityId}
                      facilityName={activeFacility?.shortName || activeFacility?.name || 'facility'}
                      photos={currentResp?.photos || []}
                      onChange={(newPhotos) => updateQuestionResponse(currentQ.id, { photos: newPhotos })}
                      maxCount={5}
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer: İleri / Geri & Bitir Butonları */}
            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 flex items-center justify-between gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={currentQuestionIndex === 0}
                onClick={() => setCurrentQuestionIndex(prev => Math.max(0, prev - 1))}
                className="text-xs"
              >
                <ArrowLeft className="w-3.5 h-3.5 mr-1" /> Önceki
              </Button>

              <div className="text-xs font-bold text-slate-600 dark:text-slate-300">
                Kriter {currentQuestionIndex + 1} / {questions.length}
              </div>

              {currentQuestionIndex < questions.length - 1 ? (
                <Button
                  size="sm"
                  onClick={() => setCurrentQuestionIndex(prev => Math.min(questions.length - 1, prev + 1))}
                  className="bg-[#0051d5] hover:bg-[#0042b0] text-white text-xs"
                >
                  Sonraki <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => saveInspectionMutation.mutate()}
                  disabled={saveInspectionMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                >
                  {saveInspectionMutation.isPending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                      Kaydediliyor...
                    </>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5 mr-1" />
                      {editingInspectionId ? 'Değişiklikleri Kaydet' : 'Denetimi Tamamla'}
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ANA DENETİM SAYFASI: YENİ DENETİM BAŞLATMA + DENETLENENLER LİSTESİ         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <div className="space-y-6">
        {/* Üst Karşılama Kartı */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/40 text-[#0051d5] dark:text-[#b4c5ff]">
                <Flame className="w-6 h-6" />
              </span>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                  FM-200 Gazlı Söndürme Denetim Merkezi
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Aktif Tesis: <strong className="font-semibold text-slate-800 dark:text-slate-200">{activeFacility?.name || 'Lütfen sol menüden tesis seçin'}</strong>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/fm200')}
              className="text-xs h-9"
            >
              Yönetici Özeti ➔
            </Button>
          </div>
        </div>

        {/* Yeni Denetim Başlatma Kartı (Tesis seçimi sol menüden gelir, sadece Bina, Blok, Kat ve Mahal seçilir) */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-3">
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Plus className="w-4 h-4 text-[#0051d5]" /> Yeni Denetim Başlat
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Denetim yapacağınız konumu seçip "Denetime Başla" butonuna basarak sihirbazı açın.
            </p>
          </div>

          {/* Konum Seçim Alanları */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
            {/* Bina */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bina</Label>
              <select
                value={selectedBuilding}
                onChange={(e) => {
                  setSelectedBuilding(e.target.value);
                  setSelectedLocationId('');
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1"
              >
                <option value="">Tüm Binalar / Ana Bina</option>
                {availableBuildings.map((b) => (
                  <option key={b} value={b}>{b}</option>
                ))}
              </select>
            </div>

            {/* Blok */}
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Blok</Label>
              <select
                value={selectedBlock}
                onChange={(e) => {
                  setSelectedBlock(e.target.value);
                  setSelectedLocationId('');
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1"
              >
                <option value="">Tüm Bloklar</option>
                {availableBlocks.map((blk) => (
                  <option key={blk} value={blk}>{blk}</option>
                ))}
              </select>
            </div>

            {/* Kat (Çatıdan Bodruma Sıralı) */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Kat * (Sıralı)</Label>
              <select
                value={selectedFloor}
                onChange={(e) => {
                  setSelectedFloor(e.target.value);
                  setSelectedLocationId('');
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1 font-medium"
              >
                <option value="">-- Kat Seçin --</option>
                {availableFloors.map((floor: string, idx: number) => (
                  <option key={`${floor}-${idx}`} value={floor}>{floor}</option>
                ))}
              </select>
            </div>

            {/* Pano / Mahal Türü */}
            <div>
              <Label className="text-xs font-bold text-slate-700 dark:text-slate-300">Pano / Mahal Türü *</Label>
              <select
                value={selectedRoomType}
                onChange={(e) => {
                  setSelectedRoomType(e.target.value);
                  setSelectedLocationId('');
                }}
                className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs mt-1 font-medium"
              >
                <option value="">-- Mahal Türü Seçin --</option>
                {availableRoomTypes.map((type: string) => (
                  <option key={type} value={type}>{type}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Aksiyon Satırı: Başlat Butonu & İndeks Bilgisi */}
          {selectedFloor && selectedRoomType && (
            <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/40 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="text-xs">
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  Seçilen: {selectedBuilding || 'Ana Bina'} {selectedBlock ? `/ ${selectedBlock}` : ''} — {selectedFloor} Katı / {selectedRoomType}
                </span>
                <div className="text-slate-500 text-[11px] mt-0.5">
                  Otomatik İndeksleme: <span className="font-bold text-blue-700 dark:text-blue-300">#{duplicateCount}</span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {filteredLocations.length > 0 && (
                  <select
                    value={selectedLocationId}
                    onChange={(e) => setSelectedLocationId(e.target.value)}
                    className="h-9 px-2.5 rounded-lg border border-blue-300 bg-white dark:bg-slate-900 text-xs font-medium"
                  >
                    <option value="">-- Mevcut #{filteredLocations.length} Kayıttan Seç --</option>
                    {filteredLocations.map((loc: any) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.systemUid} — {loc.customRoomName || `${loc.roomType} #${loc.index}`}
                      </option>
                    ))}
                  </select>
                )}

                <Button
                  onClick={handleStartInspection}
                  className="bg-[#0051d5] hover:bg-[#0042b0] text-white text-xs h-9 px-4 font-bold"
                >
                  <Flame className="w-3.5 h-3.5 mr-1" />
                  Denetime Başla (Wizard)
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* ────────────────────────────────────────────────────────────────────────── */}
        {/* DENETİMİ YAPILAN YERLERİN LİSTESİ (TAMAMLANANLAR & EDİT İMKANI)             */}
        {/* ────────────────────────────────────────────────────────────────────────── */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3 gap-3">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <ClipboardList className="w-4 h-4 text-emerald-600" />
                Denetimi Yapılan Mahaller Listesi ({filteredInspections.length} / {inspections.length})
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tamamlanmış denetimlerin özet skorları ve düzenleme (Edit) geçmişi.
              </p>
            </div>

            {/* Arama Kutusu */}
            <div className="relative w-full sm:w-64">
              <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
              <Input
                type="text"
                placeholder="UID, mahal, denetleyen ara..."
                value={tableSearchQuery}
                onChange={(e) => setTableSearchQuery(e.target.value)}
                className="pl-8.5 h-9 text-xs rounded-xl bg-slate-50/60 dark:bg-slate-800/60 border-slate-200 dark:border-slate-800"
              />
            </div>
          </div>

          {/* FİLTRE ÇUBUĞU: BLOK, KAT, PANO / MAHAL TÜRÜ */}
          <div className="p-3 rounded-xl bg-slate-50/70 dark:bg-slate-800/40 border border-slate-200/70 dark:border-slate-800 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <span>Filtreler:</span>
            </div>

            {/* Blok Filtresi */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-medium text-slate-500">Blok:</label>
              <select
                value={tableFilterBlock}
                onChange={(e) => setTableFilterBlock(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
              >
                <option value="all">Tüm Bloklar</option>
                {tableAvailableBlocks.map((blk) => (
                  <option key={blk} value={blk}>{blk}</option>
                ))}
              </select>
            </div>

            {/* Kat Filtresi */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-medium text-slate-500">Kat:</label>
              <select
                value={tableFilterFloor}
                onChange={(e) => setTableFilterFloor(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
              >
                <option value="all">Tüm Katlar</option>
                {tableAvailableFloors.map((flr) => (
                  <option key={flr} value={flr}>{flr}</option>
                ))}
              </select>
            </div>

            {/* Pano / Mahal Türü Filtresi */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-medium text-slate-500">Pano / Mahal:</label>
              <select
                value={tableFilterRoomType}
                onChange={(e) => setTableFilterRoomType(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-medium"
              >
                <option value="all">Tüm Mahaller / Panolar</option>
                {tableAvailableRoomTypes.map((rt) => (
                  <option key={rt} value={rt}>{rt}</option>
                ))}
              </select>
            </div>

            {/* Durum Filtresi (Devam Ediyor / Tamamlandı) */}
            <div className="flex items-center gap-1.5">
              <label className="text-[11px] font-medium text-slate-500">Durum:</label>
              <select
                value={tableFilterStatus}
                onChange={(e) => setTableFilterStatus(e.target.value)}
                className="h-8 px-2.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-xs font-semibold text-slate-700 dark:text-slate-200"
              >
                <option value="all">Tüm Durumlar</option>
                <option value="Devam Ediyor">⏳ Devam Edenler</option>
                <option value="Tamamlandi">✓ Tamamlananlar</option>
              </select>
            </div>

            {/* Filtreleri Sıfırla Butonu */}
            {(tableFilterBlock !== 'all' || tableFilterFloor !== 'all' || tableFilterRoomType !== 'all' || tableFilterStatus !== 'all' || tableSearchQuery.trim() !== '') && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setTableFilterBlock('all');
                  setTableFilterFloor('all');
                  setTableFilterRoomType('all');
                  setTableFilterStatus('all');
                  setTableSearchQuery('');
                }}
                className="h-8 text-xs text-rose-600 hover:text-rose-700 hover:bg-rose-50 ml-auto"
              >
                <RotateCcw className="w-3 h-3 mr-1" />
                Filtreleri Temizle
              </Button>
            )}
          </div>

          {inspections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-2">
              <ClipboardList className="w-8 h-8 mx-auto opacity-50 text-slate-400" />
              <p className="text-xs font-medium">Bu tesiste henüz denetim kaydı bulunmuyor.</p>
              <p className="text-[11px] text-slate-400">Yukarıdaki formdan konum seçip "Denetime Başla" butonuyla ilk denetimi gerçekleştirebilirsiniz.</p>
            </div>
          ) : filteredInspections.length === 0 ? (
            <div className="p-8 text-center text-slate-400 border border-dashed rounded-xl space-y-2">
              <Filter className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
              <p className="text-xs font-medium">Seçili filtrelere uygun denetim kaydı bulunamadı.</p>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setTableFilterBlock('all');
                  setTableFilterFloor('all');
                  setTableFilterRoomType('all');
                  setTableSearchQuery('');
                }}
                className="text-xs mt-2"
              >
                Filtreleri Sıfırla
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-semibold">
                    <th className="pb-2.5">Sistem UID / Mahal</th>
                    <th className="pb-2.5">Konum (Bina / Kat)</th>
                    <th className="pb-2.5 text-center">Genel Skor</th>
                    <th className="pb-2.5 text-center">Sızdırmazlık</th>
                    <th className="pb-2.5 text-center">Risk / Durum</th>
                    <th className="pb-2.5">Denetleyen / Tarih</th>
                    <th className="pb-2.5 text-right">İşlemler</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {filteredInspections.map((insp: any) => (
                    <tr key={insp.id} className="hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="py-3 font-medium text-slate-800 dark:text-slate-200">
                        <div className="font-mono text-[11px] text-[#0051d5] font-bold">
                          {insp.location?.systemUid}
                        </div>
                        <div className="text-xs mt-0.5">
                          {insp.location?.customRoomName || `${insp.location?.roomType} #${insp.location?.index}`}
                        </div>
                      </td>
                      <td className="py-3 text-slate-600 dark:text-slate-400">
                        {insp.location?.building} {insp.location?.block ? `/ ${insp.location?.block}` : ''}
                        <div className="text-[11px] text-slate-400 font-semibold">{insp.location?.floor}</div>
                      </td>
                      <td className="py-3 text-center">
                        <span className="font-extrabold text-xs text-slate-800 dark:text-slate-200">
                          %{insp.complianceScore}
                        </span>
                        <div className="text-[10px] text-slate-400 font-bold">({insp.ratingGrade})</div>
                      </td>
                      <td className="py-3 text-center font-bold text-cyan-700 dark:text-cyan-400">
                        %{insp.sealingScore ?? insp.complianceScore}
                      </td>
                      <td className="py-3 text-center space-y-1">
                        <div>
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            insp.isRedFlagged || insp.riskLevel === 'YÜKSEK RİSK'
                              ? 'bg-red-100 text-red-700 dark:bg-red-950/40 dark:text-red-300'
                              : insp.riskLevel === 'ORTA RİSK'
                              ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/40 dark:text-amber-300'
                              : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                          }`}>
                            {insp.riskLevel || (insp.isRedFlagged ? 'YÜKSEK RİSK' : 'DÜŞÜK RİSK')}
                          </span>
                        </div>
                        <div>
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-semibold ${
                            insp.status === 'Devam Ediyor' || !insp.isCompleted
                              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/50 dark:text-amber-300 animate-pulse'
                              : 'bg-blue-50 text-blue-700 dark:bg-blue-950/30 dark:text-blue-300'
                          }`}>
                            {insp.status === 'Devam Ediyor' || !insp.isCompleted ? '⏳ Devam Ediyor' : '✓ Tamamlandı'}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-slate-500">
                        <div className="font-medium text-slate-700 dark:text-slate-300">{insp.inspectedBy}</div>
                        <div className="text-[10px] text-slate-400">
                          {new Date(insp.inspectionDate).toLocaleDateString('tr-TR')}
                        </div>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditInspection(insp)}
                            className="h-8 text-xs text-blue-600 border-blue-200 hover:bg-blue-50"
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            {insp.status === 'Devam Ediyor' || !insp.isCompleted ? 'Devam Et' : 'Düzenle (Edit)'}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setInspectionToDelete(insp)}
                            className="h-8 text-xs text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700"
                            title="Denetim Kaydını Sil"
                          >
                            <Trash2 className="w-3.5 h-3.5 mr-1" />
                            Sil
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* DENETİMDEN ÇIKIŞ ONAY MODAL DIALOG                                         */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isExitConfirmOpen} onOpenChange={setIsExitConfirmOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-950/50 flex items-center justify-center mb-2">
              <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Denetimden Çıkılsın mı?
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1 leading-relaxed">
              Şu an {currentQuestionIndex + 1}. sorudasınız. Çıkış yaparken mevcut yanıtlarınızı <strong>"Devam Ediyor"</strong> olarak kaydedebilir veya kaydetmeden çıkabilirsiniz.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsExitConfirmOpen(false)}
              className="text-xs"
            >
              Vazgeç (Denetime Dön)
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={saveInspectionMutation.isPending}
              onClick={() => {
                setIsExitConfirmOpen(false);
                saveInspectionMutation.mutate({ isDraft: true });
              }}
              className="text-xs bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200 font-semibold"
            >
              {saveInspectionMutation.isPending ? 'Kaydediliyor...' : 'Taslak Kaydet & Çık'}
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                setIsExitConfirmOpen(false);
                setIsWizardOpen(false);
                setEditingInspectionId(null);
                toast.info('Denetim ekranı kapatıldı.');
              }}
              className="text-xs"
            >
              Kaydetmeden Çık
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* PANO TÜRÜ / MAHAL ADI DÜZENLEME MODAL DİALOG                                */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isEditingLocationDetails} onOpenChange={setIsEditingLocationDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-950/50 flex items-center justify-center mb-2">
              <Settings2 className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Pano Türü ve Mahal Adını Düzenle
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1 leading-relaxed">
              Bu mahalin veya panonun tipini yanlış seçtiyseniz (örn: ADP Panosu yerine Kat Panosu) buradan değiştirebilirsiniz. Bu değişiklik mevcut denetime ve bağlı iş listesine anında yansır.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Pano / Mahal Türü:
              </Label>
              <select
                value={editRoomType}
                onChange={(e) => setEditRoomType(e.target.value)}
                className="w-full mt-1.5 h-10 rounded-lg border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 text-xs font-medium focus:ring-2 focus:ring-blue-500"
              >
                {availableRoomTypes.map((pt: string) => (
                  <option key={pt} value={pt}>{pt}</option>
                ))}
              </select>
            </div>

            <div>
              <Label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Özel Mahal / Pano Tanımı (Opsiyonel):
              </Label>
              <Input
                value={editCustomRoomName}
                onChange={(e) => setEditCustomRoomName(e.target.value)}
                placeholder="Örn: Kat Panosu (Yoğun Bakım Yanı)"
                className="mt-1.5 h-10 text-xs"
              />
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-end mt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditingLocationDetails(false)}
              className="text-xs"
            >
              İptal
            </Button>
            <Button
              size="sm"
              disabled={updateLocationMutation.isPending || !activeLocation?.id}
              onClick={() => {
                if (activeLocation?.id) {
                  updateLocationMutation.mutate({
                    locId: activeLocation.id,
                    roomType: editRoomType,
                    customRoomName: editCustomRoomName
                  });
                }
              }}
              className="text-xs bg-[#0051d5] hover:bg-blue-700 text-white font-semibold"
            >
              {updateLocationMutation.isPending ? 'Güncelleniyor...' : 'Pano Türünü Kaydet'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* DENETİMİ TAMAMEN SİLME ONAY MODAL DİALOG                                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={!!inspectionToDelete} onOpenChange={(open) => !open && setInspectionToDelete(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/50 flex items-center justify-center mb-2">
              <Trash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
            </div>
            <DialogTitle className="text-base font-bold text-slate-900 dark:text-white">
              Denetim Kaydını Sil
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500 pt-1 leading-relaxed">
              <strong>{inspectionToDelete?.location?.systemUid}</strong> - {inspectionToDelete?.location?.customRoomName || inspectionToDelete?.location?.roomType} mahaline ait denetim kaydını silmek üzeresiniz.
              <br /><br />
              <span className="text-rose-600 font-semibold">Dikkat:</span> Bu denetime bağlı oluşturulmuş iş emirleri de silinecektir. Bu işlem geri alınamaz.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 justify-end mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInspectionToDelete(null)}
              className="text-xs"
            >
              Vazgeç
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={deleteInspectionMutation.isPending}
              onClick={() => {
                if (inspectionToDelete?.id) {
                  deleteInspectionMutation.mutate(inspectionToDelete.id);
                }
              }}
              className="text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white"
            >
              {deleteInspectionMutation.isPending ? 'Siliniyor...' : 'Evet, Denetimi Sil'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
