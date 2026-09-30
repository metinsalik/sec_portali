import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ImageUploadWithPreview, type PhotoItem } from '@/components/fm200/ImageUploadWithPreview';
import {
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Flame,
  FileCheck,
  ShieldAlert,
  Gauge,
  Lock,
  Unlock,
  Building2,
  Calendar,
  Layers,
  Sparkles,
  Info,
  Plus,
  Loader2
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

// FAZ 2 - 26 Madde Tanımları (Spesifikasyon Bölüm 5)
const PERIODIC_QUESTIONS = [
  { id: 1, code: 'M01', text: 'Sicil kartı ve bakım kayıtları düzenli mi?', level: 'Dusuk', resp: 'Teknik' },
  { id: 2, code: 'M02', text: 'Önceki kontrol eksiklikleri giderildi mi? (Sistem tarafından otomatik kontrol edilir)', level: 'Dusuk', resp: 'Teknik', auto: true },
  { id: 3, code: 'M03', text: 'Yetkili / eğitimli personel durumu uygun mu?', level: 'Orta', resp: 'Firma' },
  { id: 4, code: 'M04', text: 'Etiket, sertifika ve uyarılar eksiksiz ve görünür mü?', level: 'Dusuk', resp: 'Teknik' },
  { id: 5, code: 'M05', text: 'Kullanma talimatı ve acil durum levhaları asılı mı?', level: 'Dusuk', resp: 'Teknik' },
  { id: 6, code: 'M06', text: 'Rutin kontrol kayıt defteri mevcut ve işleniyor mu?', level: 'Dusuk', resp: 'Teknik' },
  { id: 7, code: 'M07', text: 'Onaylı proje ve resmi itfaiye/idare onayı mevcut mu?', level: 'Kritik', resp: 'Firma' },
  { id: 8, code: 'M08', text: 'Tesisatın sahada onaylı projeye uygunluğu tam mı?', level: 'Kritik', resp: 'Firma' },
  { id: 9, code: 'M09', text: 'Sızdırmazlık test kayıtları ve raporları geçerli mi?', level: 'Dusuk', resp: 'Firma' },
  { id: 10, code: 'M10', text: 'Gaz tankı bölme ortamı, temizliği ve aydınlatması uygun mu?', level: 'Dusuk', resp: 'Teknik' },
  { id: 11, code: 'M11', text: 'Tank vanaları, boşaltma kolu ve emniyet mühürleri sağlam mı?', level: 'Orta', resp: 'Firma' },
  { id: 12, code: 'M12', text: 'Basınç göstergeleri (Manometre) yeşil alanda ve sağlam mı?', level: 'Kritik', resp: 'Firma' },
  { id: 13, code: 'M13', text: 'Tank gaz doluluk oranları ve ağırlıkları tam mı? (GATEKEEPER)', level: 'Kritik', resp: 'Firma' },
  { id: 14, code: 'M14', text: 'Boşaltma hortumları, manifold ve boru askıları sabit mi?', level: 'Orta', resp: 'Firma' },
  { id: 15, code: 'M15', text: 'Yangın kontrol ve söndürme paneli hatasız devrede mi?', level: 'Kritik', resp: 'Firma' },
  { id: 16, code: 'M16', text: 'Elektrik beslemesi, bağımsız linye ve yedek aküler sağlam mı?', level: 'Orta', resp: 'Firma' },
  { id: 17, code: 'M17', text: 'Boşaltma nozulları temiz, hasarsız ve yönleri doğru mu?', level: 'Orta', resp: 'Firma' },
  { id: 18, code: 'M18', text: 'Aşırı basınç tahliye damperi mekanik olarak çalışır durumda mı?', level: 'Orta', resp: 'Firma' },
  { id: 19, code: 'M19', text: 'Manuel deşarj butonu sağlam, erişilebilir ve mühürlü mü?', level: 'Orta', resp: 'Firma' },
  { id: 20, code: 'M20', text: 'Deşarj durdurma (Stop) butonu işlevsel mi?', level: 'Orta', resp: 'Firma' },
  { id: 21, code: 'M21', text: 'Algılama dedektör hatları ve çapraz zonlar hatasız mı? (GATEKEEPER)', level: 'Kritik', resp: 'Firma' },
  { id: 22, code: 'M22', text: 'Alarm kornası ve flaşörler test edildiğinde çalışıyor mu?', level: 'Orta', resp: 'Firma' },
  { id: 23, code: 'M23', text: 'Gaz basma anında menfez ve havalandırma damperleri otomatik kapanıyor mu?', level: 'Kritik', resp: 'Firma' },
  { id: 24, code: 'M24', text: 'Otomatik gaz salım aktivatörü (solenoid/patlatıcı) faal mi?', level: 'Kritik', resp: 'Firma' },
  { id: 25, code: 'M25', text: 'Tekrarlayıcı ve bina ana yangın santraline sinyal iletimi var mı?', level: 'Orta', resp: 'Firma' },
  { id: 26, code: 'M26', text: 'Görevliye teslim tutanağı imzalı olarak düzenlendi mi?', level: 'Dusuk', resp: 'Teknik' }
];

export default function Fm200WizardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();

  // Wizard Adımları (1: Konum Seçimi, 2: Faz 1, 3: Faz 2, 4: Faz 3, 5: Faz 4, 6: Özet & Tamamlandı)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Seçilen Tesis ve Konum
  const [selectedFacilityId, setSelectedFacilityId] = useState<string>('');
  const [selectedLocationId, setSelectedLocationId] = useState<string>('');

  // Tesisleri Çek
  const { data: facilities = [] } = useQuery<any[]>({
    queryKey: ['facilities'],
    queryFn: async () => {
      const res = await api.get('/settings/facilities');
      if (!res.ok) throw new Error('Tesisler alınamadı');
      return res.json();
    }
  });

  // Konumları Çek
  const { data: locations = [] } = useQuery<any[]>({
    queryKey: ['fm200Locations', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId) return [];
      const res = await api.get(`/fm200/locations?facilityId=${selectedFacilityId}`);
      if (!res.ok) throw new Error('Konumlar alınamadı');
      return res.json();
    },
    enabled: !!selectedFacilityId
  });

  // Seçili Tesisin Bina, Blok ve Kat Konum Listesini Çek
  const { data: buildingFloors = [] } = useQuery<any[]>({
    queryKey: ['fm200BuildingFloors', selectedFacilityId],
    queryFn: async () => {
      if (!selectedFacilityId) return [];
      const res = await api.get(`/fm200/building-floors?facilityId=${selectedFacilityId}`);
      if (!res.ok) return [];
      return res.json();
    },
    enabled: !!selectedFacilityId
  });

  // Yeni Konum Tanımlama Modal State
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

  // Yeni Konum Ekleme Mutasyonu
  const addLocationMutation = useMutation({
    mutationFn: async (formData: typeof newLocationForm) => {
      const res = await api.post('/fm200/locations', {
        ...formData,
        facilityId: selectedFacilityId,
        roomVolumeM3: formData.roomVolumeM3 ? parseFloat(formData.roomVolumeM3) : undefined,
        cylinderCount: Number(formData.cylinderCount) || 1
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || 'Konum oluşturulamadı');
      }
      return res.json();
    },
    onSuccess: (newLoc) => {
      queryClient.invalidateQueries({ queryKey: ['fm200Locations', selectedFacilityId] });
      toast.success(`Yeni konum başarıyla oluşturuldu: ${newLoc.systemUid}`);
      setSelectedLocationId(newLoc.id);
      setIsAddLocationModalOpen(false);
      setNewLocationForm({
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
    },
    onError: (err: any) => {
      toast.error(err.message || 'Konum kaydedilirken hata oluştu');
    }
  });

  // Seçili Konum Detayı
  const { data: locationDetail, refetch: refetchLocationDetail } = useQuery<any>({
    queryKey: ['fm200LocationDetail', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return null;
      const res = await api.get(`/fm200/locations/${selectedLocationId}`);
      if (!res.ok) throw new Error('Konum detayı alınamadı');
      return res.json();
    },
    enabled: !!selectedLocationId
  });

  // İlk Açılış Parametre Kontrolü
  useEffect(() => {
    const locParam = searchParams.get('locationId');
    const facParam = searchParams.get('facilityId');
    if (facParam) setSelectedFacilityId(facParam);
    if (locParam) setSelectedLocationId(locParam);
  }, [searchParams]);

  // ────────────────────────────────────────────────────────────────────────────
  // ADIM 2: FAZ 1 STATE (Fiziksel Durum ve Tasarım Değerlendirmesi)
  // ────────────────────────────────────────────────────────────────────────────
  const [phase1Answers, setPhase1Answers] = useState<Record<string, string>>({
    f1_a1: 'Evet', f1_a2: 'Evet', f1_a3: 'Hayır', f1_a4: 'Evet',
    f1_b1: 'Evet', f1_b2: 'Evet', f1_b3: 'Evet', f1_b4: 'Evet', f1_b5: 'Evet', f1_b6: 'Evet',
    f1_c1: 'Hayır', f1_c2: 'Evet',
    f1_d1: 'Hayır', f1_d2: 'Hayır', f1_d3: 'Evet',
    f1_e1: 'Evet', f1_e2: 'Evet'
  });
  const [phase1Notes, setPhase1Notes] = useState('');
  const [phase1Photos, setPhase1Photos] = useState<PhotoItem[]>([]);

  // ────────────────────────────────────────────────────────────────────────────
  // ADIM 3: FAZ 2 STATE (26 Madde Periyodik Kontrol)
  // ────────────────────────────────────────────────────────────────────────────
  const [phase2Responses, setPhase2Responses] = useState<Record<string, { status: 'U' | 'UD' | 'UY'; note?: string }>>({});
  const [phase2Notes, setPhase2Notes] = useState('');
  const [phase2Photos, setPhase2Photos] = useState<PhotoItem[]>([]);

  // Madde 2 Otomasyon Bilgisi
  const { data: item2Status } = useQuery({
    queryKey: ['item2Status', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return null;
      const res = await api.get(`/fm200/inspections/item2-status/${selectedLocationId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedLocationId && currentStep === 3
  });

  // Faz 2 Açıldığında varsayılan U doldur
  useEffect(() => {
    if (currentStep === 3) {
      const initial: Record<string, { status: 'U' | 'UD' | 'UY'; note?: string }> = {};
      PERIODIC_QUESTIONS.forEach(q => {
        initial[q.code] = { status: 'U' };
      });
      if (item2Status) {
        initial['M02'] = { status: item2Status.status as any, note: item2Status.message };
      }
      setPhase2Responses(initial);
    }
  }, [currentStep, item2Status]);

  // ────────────────────────────────────────────────────────────────────────────
  // ADIM 4: FAZ 3 STATE (6 Aylık Bakım - Tüp Bazlı Çoklu Değerlendirme)
  // ────────────────────────────────────────────────────────────────────────────
  const [cylinderChecks, setCylinderChecks] = useState<any[]>([]);
  const [panelStatus, setPanelStatus] = useState<'U' | 'UD'>('U');
  const [panelNotes, setPanelNotes] = useState('');
  const [phase3Notes, setPhase3Notes] = useState('');
  const [phase3Photos, setPhase3Photos] = useState<PhotoItem[]>([]);

  // Konum seçildiğinde tüpleri hazırla
  useEffect(() => {
    if (locationDetail?.cylinders) {
      setCylinderChecks(
        locationDetail.cylinders.map((c: any) => ({
          cylinderId: c.id,
          labelCode: c.labelCode,
          serialNumber: c.serialNumber,
          govde: 'U',
          muhur: 'U',
          basinc: 'U',
          emniyet: 'U',
          notes: ''
        }))
      );
    }
  }, [locationDetail]);

  // ────────────────────────────────────────────────────────────────────────────
  // ADIM 5: FAZ 4 STATE (Sızdırmazlık Testi / Soft-Lock)
  // ────────────────────────────────────────────────────────────────────────────
  const [testDate, setTestDate] = useState(new Date().toISOString().split('T')[0]);
  const [retentionTime, setRetentionTime] = useState('10.5');
  const [measuredValue, setMeasuredValue] = useState('');
  const [testResult, setTestResult] = useState<'Gecti' | 'Kaldi'>('Gecti');
  const [isUnconditional, setIsUnconditional] = useState(false);
  const [overrideReason, setOverrideReason] = useState('Resmi periyot son günü');
  const [testNotes, setTestNotes] = useState('');
  const [testPhotos, setTestPhotos] = useState<PhotoItem[]>([]);

  // Soft-Lock Durum Sorgusu
  const { data: softLockInfo } = useQuery({
    queryKey: ['softLockStatus', selectedLocationId],
    queryFn: async () => {
      if (!selectedLocationId) return null;
      const res = await api.get(`/fm200/tests/soft-lock-status/${selectedLocationId}`);
      if (!res.ok) return null;
      return res.json();
    },
    enabled: !!selectedLocationId && currentStep === 5
  });

  // ────────────────────────────────────────────────────────────────────────────
  // MUTATIONS (API KAYITLARI)
  // ────────────────────────────────────────────────────────────────────────────
  const [createdSummary, setCreatedSummary] = useState<any>({
    phase1: null,
    phase2: null,
    phase3: null,
    phase4: null
  });

  // Faz 1 Kaydet
  const savePhase1Mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/assessments/phase1', {
        locationId: selectedLocationId,
        answers: phase1Answers,
        notes: phase1Notes,
        photos: phase1Photos
      });
      if (!res.ok) throw new Error('Faz 1 kaydedilemedi');
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedSummary((prev: any) => ({ ...prev, phase1: data }));
      toast.success(`Faz 1 tamamlandı. ${data.openedJobsCount || 0} adet otomatik iş açıldı.`);
      setCurrentStep(3);
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Faz 2 Kaydet
  const savePhase2Mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/inspections/phase2', {
        locationId: selectedLocationId,
        responses: phase2Responses,
        notes: phase2Notes,
        photos: phase2Photos
      });
      if (!res.ok) throw new Error('Faz 2 kaydedilemedi');
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedSummary((prev: any) => ({ ...prev, phase2: data }));
      toast.success(`Faz 2 tamamlandı. Skor: %${data.complianceScore} (${data.ratingGrade})`);
      setCurrentStep(4);
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Faz 3 Kaydet
  const savePhase3Mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/maintenances/phase3', {
        locationId: selectedLocationId,
        cylinderChecks,
        panelControlStatus: panelStatus,
        panelNotes,
        notes: phase3Notes,
        photos: phase3Photos
      });
      if (!res.ok) throw new Error('Faz 3 kaydedilemedi');
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedSummary((prev: any) => ({ ...prev, phase3: data }));
      toast.success(`Faz 3 6-Aylık Bakım kaydedildi. ${data.openedJobsCount || 0} adet iş emri üretildi.`);
      setCurrentStep(5);
    },
    onError: (err: any) => toast.error(err.message)
  });

  // Faz 4 Kaydet
  const savePhase4Mutation = useMutation({
    mutationFn: async () => {
      const res = await api.post('/fm200/tests/phase4', {
        locationId: selectedLocationId,
        testDate,
        retentionTimeMinutes: retentionTime,
        measuredValue,
        result: testResult,
        isUnconditional,
        overrideReason: isUnconditional ? overrideReason : null,
        reportUrl: testPhotos[0]?.url || null,
        notes: testNotes,
        photos: testPhotos
      });
      if (!res.ok) throw new Error('Faz 4 kaydedilemedi');
      return res.json();
    },
    onSuccess: (data) => {
      setCreatedSummary((prev: any) => ({ ...prev, phase4: data }));
      toast.success(`Sızdırmazlık testi (${testResult}) başarıyla sisteme işlendi.`);
      refetchLocationDetail();
      queryClient.invalidateQueries({ queryKey: ['fm200Locations'] });
      setCurrentStep(6);
    },
    onError: (err: any) => toast.error(err.message)
  });

  const activeFacility = facilities.find((f: any) => f.id === selectedFacilityId);

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-20">
      {/* Wizard İlerleme Başlığı (Breadcrumbs / Steps) */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-[#0051d5] dark:text-[#b4c5ff]">
              Denetim Sihirbazı
            </span>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mt-0.5">
              FM-200 ve Gazlı Söndürme Adım Adım Denetim
            </h1>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate('/operations-management')}
            className="text-xs text-slate-500"
          >
            Vazgeç ve Çık
          </Button>
        </div>

        {/* 6 Aşamalı Step Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-6 gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          {[
            { step: 1, label: '1. Konum' },
            { step: 2, label: '2. Faz 1: Tasarım' },
            { step: 3, label: '3. Faz 2: Periyodik' },
            { step: 4, label: '4. Faz 3: Bakım' },
            { step: 5, label: '5. Faz 4: Test' },
            { step: 6, label: '6. Tamamlandı' }
          ].map((item) => (
            <div
              key={item.step}
              onClick={() => {
                if (item.step < currentStep && selectedLocationId) {
                  setCurrentStep(item.step);
                }
              }}
              className={`p-2.5 rounded-xl border text-center transition-all ${
                currentStep === item.step
                  ? 'bg-blue-50 border-[#0051d5] text-[#0051d5] dark:bg-blue-950/40 dark:border-blue-500 dark:text-blue-300 font-bold shadow-xs'
                  : currentStep > item.step
                  ? 'bg-emerald-50/50 border-emerald-300 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-800 dark:text-emerald-400 cursor-pointer font-medium'
                  : 'bg-slate-50 border-slate-200 text-slate-400 dark:bg-slate-900/50 dark:border-slate-800/80 font-normal'
              }`}
            >
              <div className="text-[11px] truncate">{item.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADIM 1: TESİS VE KONUM SEÇİMİ                                              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentStep === 1 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              1. Adım: Denetlenecek Tesis ve FM-200 Konumunu Seçin
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              Spesifikasyona göre 35 tesisteki her gazlı söndürme mahali tekil bir UID ile bağımsız olarak takip edilir.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Tesis Seçimi *</label>
              <select
                value={selectedFacilityId}
                onChange={(e) => {
                  setSelectedFacilityId(e.target.value);
                  setSelectedLocationId('');
                }}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Lütfen Tesis Seçin --</option>
                {facilities.map((f: any) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Konum / Mahal *</label>
                {selectedFacilityId && (
                  <button
                    type="button"
                    onClick={() => {
                      // Form alanlarını tesisin ilk bina/kat bilgileriyle ilklendir
                      const firstBf = buildingFloors[0];
                      if (firstBf) {
                        setNewLocationForm(prev => ({
                          ...prev,
                          building: firstBf.building || 'Ana Bina',
                          block: firstBf.block || '',
                          floor: firstBf.floor || 'Zemin Kat'
                        }));
                      }
                      setIsAddLocationModalOpen(true);
                    }}
                    className="text-xs text-[#0051d5] hover:underline font-semibold flex items-center gap-1"
                  >
                    <Plus className="w-3.5 h-3.5" /> Yeni Mahal Tanımla
                  </button>
                )}
              </div>
              <select
                disabled={!selectedFacilityId}
                value={selectedLocationId}
                onChange={(e) => setSelectedLocationId(e.target.value)}
                className="w-full h-11 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-sm mt-1 focus:ring-2 focus:ring-primary/20"
              >
                <option value="">-- Korunan Mahali Seçin --</option>
                {locations.map((l: any) => (
                  <option key={l.id} value={l.id}>
                    {l.systemUid} — {l.customRoomName || `${l.roomType} #${l.index}`} ({l.building}, {l.floor})
                  </option>
                ))}
              </select>
              {locations.length === 0 && selectedFacilityId && (
                <p className="text-[11px] text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                  <Info className="w-3 h-3" /> Bu tesiste henüz tanımlı FM-200 mahali bulunmuyor. Yukarıdaki "Yeni Mahal Tanımla" butonuyla hemen ekleyebilirsiniz.
                </p>
              )}
            </div>
          </div>

          {/* Konum Kartı Özeti (Spesifikasyon Bölüm 16.1) */}
          {locationDetail && (
            <div className="mt-4 p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/40 dark:from-slate-900/60 dark:to-blue-950/20 border border-blue-200/60 dark:border-blue-900/40 space-y-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 border-b border-blue-100 dark:border-blue-900/40 pb-3">
                <div>
                  <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
                    {locationDetail.systemUid}
                  </span>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mt-1.5">
                    {locationDetail.customRoomName || `${locationDetail.roomType} #${locationDetail.index}`}
                  </h4>
                </div>
                <div className="text-xs text-right text-slate-500 dark:text-slate-400">
                  <span className="font-semibold text-slate-700 dark:text-slate-200">{locationDetail.facility?.name}</span>
                  <div>{locationDetail.building} — {locationDetail.floor}</div>
                </div>
              </div>

              {/* 4 Fazın Mevcut Durum Özeti */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-semibold">[FAZ 1] Fiziksel/Tasarım</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {locationDetail.phase1Assessments?.length > 0 ? 'Değerlendirildi' : 'Bekliyor'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-semibold">[FAZ 2] Periyodik Skor</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {locationDetail.inspections?.length > 0
                      ? `%${locationDetail.inspections[0].complianceScore} (${locationDetail.inspections[0].ratingGrade})`
                      : 'Henüz Yapılmadı'}
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-semibold">[FAZ 3] Tüp Envanteri</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {locationDetail.cylinders?.length || 0} Adet Tüp Tanımlı
                  </span>
                </div>
                <div className="p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-200/80 dark:border-slate-800">
                  <span className="text-slate-400 block mb-1 font-semibold">[FAZ 4] Sızdırmazlık</span>
                  <span className="font-bold text-slate-800 dark:text-slate-200">
                    {locationDetail.tightnessTests?.length > 0
                      ? locationDetail.tightnessTests[0].result
                      : 'Kayıt Yok'}
                  </span>
                </div>
              </div>

              {/* Açık İş Emirleri Vurgusu */}
              {locationDetail.workOrders?.length > 0 && (
                <div className="p-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl text-xs text-amber-800 dark:text-amber-300">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <AlertTriangle className="w-4 h-4 text-amber-600" />
                    Bu mahalde {locationDetail.workOrders.length} adet açık/devam eden iş emri bulunmaktadır:
                  </div>
                  <ul className="list-disc list-inside space-y-0.5 text-[11px] text-amber-900 dark:text-amber-400 pl-1">
                    {locationDetail.workOrders.slice(0, 3).map((w: any) => (
                      <li key={w.id}>
                        [{w.trackLane}] {w.title} ({w.responsible})
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="flex justify-end pt-4">
            <Button
              disabled={!selectedLocationId}
              onClick={() => setCurrentStep(2)}
              className="flex items-center gap-2 bg-[#0051d5] hover:bg-[#0042b0] text-white px-6 h-11 rounded-xl"
            >
              Devam Et (Faz 1'e Geç)
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADIM 2: FAZ 1 — FİZİKSEL DURUM VE TASARIM DEĞERLENDİRMESİ                   */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentStep === 2 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 font-mono">
              FAZ 1
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Fiziksel Durum ve Tasarım Değerlendirmesi
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Hacim, proje, nozul engelleri ve fiziksel sızdırmazlık deliklerini kontrol edin. "Hayır/Evet" yanıtları ilgili sorumlulara otomatik iş emri üretecektir.
            </p>
          </div>

          {/* Soru Grupları A-B-C-D-E */}
          <div className="space-y-6">
            {/* A Grubu */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                A — Hacim ve Boyut Bilgileri
              </h4>
              {[
                { code: 'f1_a1', q: 'F1-A1: Oda hacmi ölçüldü mü?', options: ['Evet', 'Hayır'] },
                { code: 'f1_a2', q: 'F1-A2: Tasarım hacmi ile sahada ölçülen hacim uyuşuyor mu?', options: ['Evet', 'Hayır'] },
                { code: 'f1_a3', q: 'F1-A3: Kurulumdan bu yana oda sınırlarında/yapısında değişiklik yapıldı mı?', options: ['Evet', 'Hayır'] },
                { code: 'f1_a4', q: 'F1-A4: Oda değişiklik geçmişi biliniyor mu?', options: ['Evet', 'Hayır', 'Bilinmiyor'] }
              ].map(item => (
                <div key={item.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.q}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {item.options.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPhase1Answers({ ...phase1Answers, [item.code]: opt })}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          phase1Answers[item.code] === opt
                            ? opt === 'Hayır' || opt === 'Bilinmiyor'
                              ? 'bg-amber-600 text-white'
                              : 'bg-[#0051d5] text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* B Grubu */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                B — Söndürücü Sistemi ve Tasarım Belgeleri
              </h4>
              {[
                { code: 'f1_b1', q: 'F1-B1: Onaylı tasarım hesabı mevcut mu?', options: ['Evet', 'Hayır'] },
                { code: 'f1_b2', q: 'F1-B2: Tasarım hesabının varlığı şirket kayıtlarında biliniyor mu?', options: ['Evet', 'Hayır', 'Bilinmiyor'] },
                { code: 'f1_b3', q: 'F1-B3: Tüp dolum bilgileri ve etiketler doğrulanabiliyor mu?', options: ['Evet', 'Hayır'] },
                { code: 'f1_b4', q: 'F1-B4: Kurulu gaz miktarı tasarım hesabıyla tam uyuşuyor mu?', options: ['Evet', 'Hayır'] },
                { code: 'f1_b5', q: 'F1-B5: Nozul ve borulama hidrolik izometrik hesabı var mı?', options: ['Evet', 'Hayır'] },
                { code: 'f1_b6', q: 'F1-B6: Yangın ve söndürme otomasyon senaryo dokümanı var mı?', options: ['Evet', 'Hayır'] }
              ].map(item => (
                <div key={item.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.q}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {item.options.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPhase1Answers({ ...phase1Answers, [item.code]: opt })}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          phase1Answers[item.code] === opt
                            ? opt === 'Hayır' || opt === 'Bilinmiyor'
                              ? 'bg-amber-600 text-white'
                              : 'bg-[#0051d5] text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* C & D Grubu */}
            <div className="space-y-3 bg-slate-50 dark:bg-slate-900/50 p-4 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                C & D — Dağıtım Engelleri ve Sızdırmazlık Açıklıkları (Fiziksel Yol)
              </h4>
              {[
                { code: 'f1_c1', q: 'F1-C1: Nozul atış konisi önünde fiziksel engel var mı?', options: ['Evet', 'Hayır'] },
                { code: 'f1_c2', q: 'F1-C2: Asma tavan üstü / yükseltilmiş döşeme koruma kapsamında mı?', options: ['Evet', 'Hayır', 'Bilinmiyor'] },
                { code: 'f1_d1', q: 'F1-D1: Kablo / boru geçişlerinde yalıtılmamış açıklık var mı?', options: ['Evet', 'Hayır'] },
                { code: 'f1_d2', q: 'F1-D2: Duvar, tavan veya döşemede yapısal delik/açıklık var mı?', options: ['Evet', 'Hayır'] },
                { code: 'f1_d3', q: 'F1-D3: Kapı tam kapanıyor, fitil ve sızdırmazlık sağlıyor mu?', options: ['Evet', 'Hayır'] }
              ].map(item => (
                <div key={item.code} className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2 rounded-lg bg-white dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <span className="font-medium text-slate-800 dark:text-slate-200">{item.q}</span>
                  <div className="flex gap-1.5 shrink-0">
                    {item.options.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setPhase1Answers({ ...phase1Answers, [item.code]: opt })}
                        className={`px-3 py-1 rounded-md font-semibold transition-colors ${
                          phase1Answers[item.code] === opt
                            ? (item.code === 'f1_d3' && opt === 'Hayır') || (item.code !== 'f1_d3' && opt === 'Evet')
                              ? 'bg-red-600 text-white'
                              : 'bg-[#0051d5] text-white'
                            : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
                        }`}
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {/* Sıkıştırmalı Fotoğraf Yükleyici & Önizleme */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <ImageUploadWithPreview
                facilityId={selectedFacilityId}
                facilityName={activeFacility?.name}
                photos={phase1Photos}
                onChange={setPhase1Photos}
                label="Faz 1 Saha Fotoğrafları ve Kanıtlar"
                description="Oda genel görünümü, nozul atış hatları ve açıklık tespit fotoğraflarını yükleyin."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Değerlendirme Notları</label>
              <Input
                placeholder="Ör: Kapı fitilinde yıpranma var, nozul önüne yeni pano yerleştirilmiş"
                value={phase1Notes}
                onChange={(e) => setPhase1Notes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(1)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri (Konum Seçimi)
            </Button>
            <Button
              onClick={() => savePhase1Mutation.mutate()}
              disabled={savePhase1Mutation.isPending}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white px-6"
            >
              {savePhase1Mutation.isPending ? 'Kaydediliyor...' : 'Faz 1’i Kaydet ve Faz 2’ye Geç'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADIM 3: FAZ 2 — PERİYODİK KONTROL (26 MADDE & AĞIRLIKLI SKOR)              */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentStep === 3 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300 font-mono">
                FAZ 2
              </span>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
                26 Madde Yıllık Periyodik Kontrol Listesi
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                U: Uygun | UD: Uygun Değil | UY: Uygulanamaz. UD durumlarında sistem otomatik iş emri açar.
              </p>
            </div>
            {/* Canlı Skor Rozeti */}
            <div className="text-right bg-blue-50 dark:bg-blue-950/40 p-3 rounded-xl border border-blue-200/80 dark:border-blue-900/40">
              <span className="text-[10px] uppercase font-bold text-slate-500">Mevcut Seviye</span>
              <div className="text-base font-extrabold text-[#0051d5] dark:text-[#b4c5ff]">
                Ağırlıklı Skor Motoru Aktif
              </div>
            </div>
          </div>

          {/* 26 Madde Tablosu */}
          <div className="space-y-2">
            {PERIODIC_QUESTIONS.map((q) => {
              const currentResp = phase2Responses[q.code] || { status: 'U' };
              const isUD = currentResp.status === 'UD';
              const isUY = currentResp.status === 'UY';

              return (
                <div
                  key={q.code}
                  className={`p-3 rounded-xl border transition-all ${
                    isUD
                      ? 'bg-red-50/70 border-red-300 dark:bg-red-950/20 dark:border-red-900/60'
                      : isUY
                      ? 'bg-slate-50 border-slate-200 dark:bg-slate-900/40 dark:border-slate-800 opacity-75'
                      : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-start gap-2.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[11px] font-mono font-bold text-slate-700 dark:text-slate-300 mt-0.5">
                        {q.code}
                      </span>
                      <div>
                        <div className="text-xs font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                          {q.text}
                          {q.level === 'Kritik' && (
                            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-400">
                              Kritik
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-slate-400">
                          Sorumlu: {q.resp} {q.auto ? '· Otomatik Madde' : ''}
                        </span>
                      </div>
                    </div>

                    {/* Butonlar: U / UD / UY */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-center">
                      <button
                        type="button"
                        disabled={q.auto}
                        onClick={() =>
                          setPhase2Responses({
                            ...phase2Responses,
                            [q.code]: { ...currentResp, status: 'U' }
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                          currentResp.status === 'U'
                            ? 'bg-emerald-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        U (Uygun)
                      </button>

                      <button
                        type="button"
                        disabled={q.auto}
                        onClick={() =>
                          setPhase2Responses({
                            ...phase2Responses,
                            [q.code]: { ...currentResp, status: 'UD' }
                          })
                        }
                        className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
                          currentResp.status === 'UD'
                            ? 'bg-red-600 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200'
                        }`}
                      >
                        UD (Uygun Değil)
                      </button>

                      <button
                        type="button"
                        disabled={q.auto}
                        onClick={() =>
                          setPhase2Responses({
                            ...phase2Responses,
                            [q.code]: { ...currentResp, status: 'UY' }
                          })
                        }
                        className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                          currentResp.status === 'UY'
                            ? 'bg-slate-700 text-white'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-500 hover:bg-slate-200'
                        }`}
                      >
                        UY
                      </button>
                    </div>
                  </div>

                  {/* Eğer UD ise açıklama kutusu */}
                  {isUD && (
                    <div className="mt-2.5 pt-2 border-t border-red-200 dark:border-red-900/40">
                      <Input
                        placeholder="Uygunsuzluk detayını ve saha gözlemini yazın (Ör: Vana mührü kopmuş)..."
                        value={currentResp.note || ''}
                        onChange={(e) =>
                          setPhase2Responses({
                            ...phase2Responses,
                            [q.code]: { ...currentResp, note: e.target.value }
                          })
                        }
                        className="h-8 text-xs bg-white dark:bg-slate-900 border-red-300 dark:border-red-900"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Fotoğraf Yükleyici */}
          <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
            <ImageUploadWithPreview
              facilityId={selectedFacilityId}
              facilityName={activeFacility?.name}
              photos={phase2Photos}
              onChange={setPhase2Photos}
              label="Faz 2 Periyodik Kontrol Fotoğrafları"
              description="Manometre ibreleri, panel ekranı ve etiketlerin net fotoğraflarını yükleyin."
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Genel Denetçi Notları</label>
            <Input
              placeholder="Yıllık periyodik kontrol genel tespit ve tavsiyeleri..."
              value={phase2Notes}
              onChange={(e) => setPhase2Notes(e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(2)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri (Faz 1)
            </Button>
            <Button
              onClick={() => savePhase2Mutation.mutate()}
              disabled={savePhase2Mutation.isPending}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white px-6"
            >
              {savePhase2Mutation.isPending ? 'Hesaplanıyor...' : 'Faz 2’yi Kaydet ve Faz 3’e Geç'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADIM 4: FAZ 3 — 6 AYLIK BAKIM (TÜP BAZLI ÇOKLU DEĞERLENDİRME)               */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentStep === 4 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300 font-mono">
              FAZ 3
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              6 Aylık Bakım (Varlık / Tüp Bazlı Çoklu Değerlendirme)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              Spesifikasyon Bölüm 6 gereği, mahalde bulunan her tüp bağımsız olarak Gövde, Mühür, Basınç ve Emniyet yönünden denetlenir.
            </p>
          </div>

          {/* Tüp Satırları */}
          <div className="space-y-4">
            {cylinderChecks.map((chk, idx) => (
              <div
                key={chk.cylinderId || idx}
                className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-primary"></span>
                    <span className="text-sm font-bold text-slate-900 dark:text-white">
                      {chk.labelCode} — Seri No: <span className="font-mono text-primary">{chk.serialNumber}</span>
                    </span>
                  </div>
                  <span className="text-xs text-slate-400">Tüp #{idx + 1}</span>
                </div>

                {/* 4 Parametre: Gövde, Mühür, Basınç, Emniyet */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {[
                    { key: 'govde', label: 'Tüp Gövdesi' },
                    { key: 'muhur', label: 'Emniyet Mührü' },
                    { key: 'basinc', label: 'Basınç / Manometre' },
                    { key: 'emniyet', label: 'Emniyet Tertibatı' }
                  ].map(param => (
                    <div key={param.key} className="bg-white dark:bg-slate-800 p-2.5 rounded-lg border border-slate-100 dark:border-slate-700/60 flex items-center justify-between">
                      <span className="text-xs font-medium text-slate-700 dark:text-slate-300">{param.label}</span>
                      <div className="flex gap-1">
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...cylinderChecks];
                            updated[idx][param.key] = 'U';
                            setCylinderChecks(updated);
                          }}
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            chk[param.key] === 'U'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          U
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...cylinderChecks];
                            updated[idx][param.key] = 'UD';
                            setCylinderChecks(updated);
                          }}
                          className={`px-2 py-0.5 rounded text-xs font-bold ${
                            chk[param.key] === 'UD'
                              ? 'bg-red-600 text-white'
                              : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                          }`}
                        >
                          UD
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}

            {cylinderChecks.length === 0 && (
              <div className="p-6 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 text-center text-xs text-amber-800">
                Bu konuma ait henüz tanımlı tüp bulunamadı. Lütfen "Ayarlar" sayfasından konuma ait tüpleri ekleyin.
              </div>
            )}

            {/* Panel & Hat Kontrolü */}
            <div className="p-4 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700/60 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Panel & Hat Kontrolü (Genel)
                </span>
                <p className="text-[11px] text-slate-400">Söndürme paneli ve tetikleme solenoid hatları kontrolü</p>
              </div>
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setPanelStatus('U')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    panelStatus === 'U' ? 'bg-emerald-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  U (Uygun)
                </button>
                <button
                  type="button"
                  onClick={() => setPanelStatus('UD')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold ${
                    panelStatus === 'UD' ? 'bg-red-600 text-white' : 'bg-slate-100 dark:bg-slate-700 text-slate-500'
                  }`}
                >
                  UD (Arıza Var)
                </button>
              </div>
            </div>

            {/* Fotoğraf Yükleme */}
            <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
              <ImageUploadWithPreview
                facilityId={selectedFacilityId}
                facilityName={activeFacility?.name}
                photos={phase3Photos}
                onChange={setPhase3Photos}
                label="6 Aylık Bakım Servis Formu ve Tüp Fotoğrafları"
                description="Yetkili firma servis formu ve tüplerin fotoğraflarını ekleyin."
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Bakım Açıklaması</label>
              <Input
                placeholder="Ör: Yetkili firma tarafından 6 aylık bakım formu tanzim edildi..."
                value={phase3Notes}
                onChange={(e) => setPhase3Notes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(3)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri (Faz 2)
            </Button>
            <Button
              onClick={() => savePhase3Mutation.mutate()}
              disabled={savePhase3Mutation.isPending}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white px-6"
            >
              {savePhase3Mutation.isPending ? 'Kaydediliyor...' : 'Faz 3’ü Kaydet ve Faz 4’e Geç'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADIM 5: FAZ 4 — SIZDIRMAZLIK TESTİ (SOFT-LOCK & GEREKÇELİ GİRİŞ)            */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentStep === 5 && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 space-y-6">
          <div className="border-b border-slate-100 dark:border-slate-800 pb-4">
            <span className="text-xs font-bold px-2 py-0.5 rounded bg-cyan-100 text-cyan-800 dark:bg-cyan-900/40 dark:text-cyan-300 font-mono">
              FAZ 4
            </span>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white mt-1">
              Sızdırmazlık Testi (Door Fan / Basınç Tutma Testi)
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
              NFPA 2001 ve ISO 14520 gereğince mahalin gaz tutma süresi (min. 10 dakika) test edilir.
            </p>
          </div>

          {/* SOFT-LOCK UYARI BLOĞU (Spesifikasyon Bölüm 7) */}
          {softLockInfo?.isLocked && !isUnconditional && (
            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border-2 border-amber-300 dark:border-amber-900/70 space-y-3 animate-in fade-in duration-300">
              <div className="flex items-start gap-3">
                <Lock className="w-6 h-6 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300">
                    Ön Koşul Uyarısı (Soft-Lock)
                  </h4>
                  <p className="text-xs text-amber-800 dark:text-amber-400 mt-1 leading-relaxed">
                    {softLockInfo.message} Sahada delik/açıklık veya fitil problemi varken test yapılması testin kalmasına neden olabilir.
                  </p>
                </div>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row items-center gap-2">
                <Button
                  variant="outline"
                  onClick={() => navigate('/operations-management')}
                  className="w-full sm:w-auto text-xs bg-white text-slate-700"
                >
                  Vazgeç / Önce Saha İşlerini Tamamla
                </Button>
                <Button
                  onClick={() => setIsUnconditional(true)}
                  className="w-full sm:w-auto text-xs bg-amber-600 hover:bg-amber-700 text-white flex items-center gap-1.5"
                >
                  <Unlock className="w-3.5 h-3.5" />
                  Gerekçeli İstisnai Giriş Yap (Soft-Lock Aşımı)
                </Button>
              </div>
            </div>
          )}

          {/* Gerekçeli Giriş Seçimi */}
          {isUnconditional && (
            <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-blue-900 dark:text-blue-300">
                <Info className="w-4 h-4" />
                İstisnai Test Giriş Gerekçesi (Zorunlu)
              </div>
              <select
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                className="w-full h-9 px-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-900 text-xs font-medium"
              >
                <option value="Resmi periyot son günü">Resmi periyot son günü (Yasal süre dolumu)</option>
                <option value="Firma sahada hazır">Yetkili firma sahada ve cihaz kurulu hazır</option>
                <option value="Müşteri/Yönetim talebi">Müşteri / Üst Yönetim doğrudan denetim talebi</option>
              </select>
              <span className="text-[10px] text-blue-600 dark:text-blue-400 block">
                Bu kayıt raporlara "Ön Koşulsuz / İstisnai Yapıldı" bayrağı ile işlenecektir.
              </span>
            </div>
          )}

          {/* Test Formu */}
          {(!softLockInfo?.isLocked || isUnconditional) && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Tarihi *</label>
                  <Input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="h-10 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Ölçülen Gaz Tutma Süresi (Dakika) *
                  </label>
                  <Input
                    type="number"
                    step="0.1"
                    placeholder="Ör: 11.5"
                    value={retentionTime}
                    onChange={(e) => {
                      setRetentionTime(e.target.value);
                      const val = parseFloat(e.target.value);
                      if (!isNaN(val)) {
                        setTestResult(val >= 10.0 ? 'Gecti' : 'Kaldi');
                      }
                    }}
                    className="h-10 mt-1"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Sonucu *</label>
                  <select
                    value={testResult}
                    onChange={(e) => setTestResult(e.target.value as any)}
                    className={`w-full h-10 px-3 rounded-xl border text-sm font-bold mt-1 ${
                      testResult === 'Gecti'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-300 dark:bg-emerald-950/40 dark:text-emerald-300'
                        : 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950/40 dark:text-red-300'
                    }`}
                  >
                    <option value="Gecti">GEÇTİ (Standart Sağlandı - 365 Gün Geçerli)</option>
                    <option value="Kaldi">KALDI (Başarısız - Otomatik İş Açılır)</option>
                  </select>
                </div>
              </div>

              {/* Sıkıştırmalı Rapor & Foto Yükleme */}
              <div className="p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800">
                <ImageUploadWithPreview
                  facilityId={selectedFacilityId}
                  facilityName={activeFacility?.name}
                  photos={testPhotos}
                  onChange={setTestPhotos}
                  label="Test Raporu Belgesi (PDF veya Görsel)"
                  description="Yetkili test kuruluşunun verdiği Door Fan Test Raporunu veya sertifikasını yükleyin."
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">Test Notları</label>
                <Input
                  placeholder="Test cihazı modeli, teknisyen adı veya tespit edilen sızıntı detayları..."
                  value={testNotes}
                  onChange={(e) => setTestNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>
          )}

          <div className="flex items-center justify-between pt-4 border-t border-slate-100 dark:border-slate-800">
            <Button variant="outline" onClick={() => setCurrentStep(4)}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Geri (Faz 3)
            </Button>
            <Button
              disabled={(!softLockInfo?.isLocked ? false : !isUnconditional) || savePhase4Mutation.isPending}
              onClick={() => savePhase4Mutation.mutate()}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-6"
            >
              {savePhase4Mutation.isPending ? 'Kaydediliyor...' : 'Testi Sisteme Kaydet ve Bitir'}
              <CheckCircle2 className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* ADIM 6: ÖZET VE TAMAMLANMA                                                 */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      {currentStep === 6 && (
        <div className="bg-white dark:bg-slate-900 p-8 rounded-2xl border border-slate-200/80 dark:border-slate-800 text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto shadow-sm">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white">
              Denetim Süreci Başarıyla Tamamlandı!
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-lg mx-auto">
              Mahal için tüm faz kontrolleri sisteme aktarılmış, uygunsuzluklar kanıt gerektiren iş emirlerine dönüştürülmüştür.
            </p>
          </div>

          {/* Sonuç Kartları */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto text-left text-xs">
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block mb-1">Faz 2 Uygunluk Skoru</span>
              <span className="text-lg font-bold text-[#0051d5] dark:text-[#b4c5ff]">
                %{createdSummary.phase2?.complianceScore ?? 100} (Seviye {createdSummary.phase2?.ratingGrade ?? 'A'})
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block mb-1">Açılan Otomatik İşler</span>
              <span className="text-lg font-bold text-amber-600 dark:text-amber-400">
                {(createdSummary.phase1?.openedJobsCount || 0) + (createdSummary.phase2?.openedJobsCount || 0) + (createdSummary.phase3?.openedJobsCount || 0)} İş Emri
              </span>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700">
              <span className="text-slate-400 block mb-1">Sızdırmazlık Testi</span>
              <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                {createdSummary.phase4?.test?.result || 'Geçti'}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-center gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => {
                setCurrentStep(1);
                setSelectedLocationId('');
              }}
              className="rounded-xl px-5"
            >
              Başka Bir Konum Denetle
            </Button>
            <Button
              onClick={() => navigate('/operations-management')}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white rounded-xl px-6"
            >
              Operasyon Yönetimine Dön
            </Button>
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────────────────── */}
      {/* YENİ MAHAL / KONUM TANIMLAMA MODALI                                        */}
      {/* ────────────────────────────────────────────────────────────────────────── */}
      <Dialog open={isAddLocationModalOpen} onOpenChange={setIsAddLocationModalOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" />
              Yeni Korunan Mahal / Konum Tanımla
            </DialogTitle>
            <DialogDescription className="text-xs">
              Bu tesisteki gazlı söndürme mahallini tanımlayın. Bina, Blok ve Kat bilgisi ayarlarınızdan otomatik eşleştirilir.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2 text-xs">
            {/* Bina, Blok ve Kat Seçimi */}
            <div className="p-3.5 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200/80 dark:border-slate-800 space-y-3">
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <span>1. Fiziksel Konum (Bina / Blok / Kat)</span>
                {buildingFloors.length > 0 && (
                  <span className="text-[11px] text-muted-foreground font-normal">
                    {buildingFloors.length} tanımlı kat mevcut
                  </span>
                )}
              </div>

              {buildingFloors.length > 0 ? (
                <div>
                  <Label className="text-[11px] font-semibold text-muted-foreground mb-1 block">
                    Kayıtlı Bina/Kat Listesinden Seçin:
                  </Label>
                  <select
                    className="w-full h-10 px-3 rounded-lg border text-xs bg-background"
                    value={`${newLocationForm.building}|||${newLocationForm.block || ''}|||${newLocationForm.floor}`}
                    onChange={(e) => {
                      const [b, blk, f] = e.target.value.split('|||');
                      setNewLocationForm(prev => ({
                        ...prev,
                        building: b,
                        block: blk,
                        floor: f
                      }));
                    }}
                  >
                    {buildingFloors.map((bf: any) => {
                      const display = `${bf.building}${bf.block ? ` (${bf.block})` : ''} - ${bf.floor}`;
                      const val = `${bf.building}|||${bf.block || ''}|||${bf.floor}`;
                      return (
                        <option key={bf.id} value={val}>
                          {display}
                        </option>
                      );
                    })}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <Label className="text-[11px] font-semibold">Bina *</Label>
                    <Input
                      value={newLocationForm.building}
                      onChange={e => setNewLocationForm(prev => ({ ...prev, building: e.target.value }))}
                      placeholder="Ana Bina"
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Blok</Label>
                    <Input
                      value={newLocationForm.block}
                      onChange={e => setNewLocationForm(prev => ({ ...prev, block: e.target.value }))}
                      placeholder="A Blok"
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                  <div>
                    <Label className="text-[11px] font-semibold">Kat *</Label>
                    <Input
                      value={newLocationForm.floor}
                      onChange={e => setNewLocationForm(prev => ({ ...prev, floor: e.target.value }))}
                      placeholder="Zemin Kat"
                      className="h-9 text-xs mt-1"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Mahal / Korunan Alan Bilgileri */}
            <div className="space-y-3">
              <div className="font-semibold text-slate-800 dark:text-slate-200">
                2. Korunan Mahal ve Sistem Detayı
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold">Mahal Tipi *</Label>
                  <select
                    value={newLocationForm.roomType}
                    onChange={e => setNewLocationForm(prev => ({ ...prev, roomType: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border text-xs bg-background mt-1"
                  >
                    {[
                      'Sunucu Odası', 'Sistem Odası', 'UPS Odası', 'Trafo Odası', 'Arşiv Odası',
                      'MCC Panosu', 'ADP Pano Odası', 'Elektrik Panosu', 'Kat Panosu', 'Radyoloji Odası',
                      'Hücre Odası', 'CCTV Odası', 'Bedaş Odası', 'Anjiyo Odası', 'Jeneratör Odası', 'Diğer'
                    ].map(type => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">Özel Mahal Adı / Açıklama</Label>
                  <Input
                    value={newLocationForm.customRoomName}
                    onChange={e => setNewLocationForm(prev => ({ ...prev, customRoomName: e.target.value }))}
                    placeholder="Örn: B1 Veri Merkezi Sunucu Odası"
                    className="h-9 text-xs mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <Label className="text-[11px] font-semibold">Gaz / Sistem Tipi</Label>
                  <select
                    value={newLocationForm.systemType}
                    onChange={e => setNewLocationForm(prev => ({ ...prev, systemType: e.target.value }))}
                    className="w-full h-9 px-3 rounded-lg border text-xs bg-background mt-1"
                  >
                    <option value="FM-200">FM-200 (HFC-227ea)</option>
                    <option value="Novec1230">Novec 1230 (FK-5-1-12)</option>
                    <option value="CO2">CO2 (Karbondioksit)</option>
                    <option value="Inergen">Inergen (IG-541)</option>
                  </select>
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">Tüp Sayısı (Adet) *</Label>
                  <Input
                    type="number"
                    min="1"
                    value={newLocationForm.cylinderCount}
                    onChange={e => setNewLocationForm(prev => ({ ...prev, cylinderCount: parseInt(e.target.value) || 1 }))}
                    className="h-9 text-xs mt-1"
                  />
                </div>

                <div>
                  <Label className="text-[11px] font-semibold">Oda Hacmi (m³)</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={newLocationForm.roomVolumeM3}
                    onChange={e => setNewLocationForm(prev => ({ ...prev, roomVolumeM3: e.target.value }))}
                    placeholder="Örn: 48.5"
                    className="h-9 text-xs mt-1"
                  />
                </div>
              </div>

              <div>
                <Label className="text-[11px] font-semibold">Panel Marka / Modeli</Label>
                <Input
                  value={newLocationForm.panelType}
                  onChange={e => setNewLocationForm(prev => ({ ...prev, panelType: e.target.value }))}
                  placeholder="Örn: Kentec Sigma A-XT, Notifier NFS2"
                  className="h-9 text-xs mt-1"
                />
              </div>

              <div>
                <Label className="text-[11px] font-semibold">Ek Notlar</Label>
                <Input
                  value={newLocationForm.notes}
                  onChange={e => setNewLocationForm(prev => ({ ...prev, notes: e.target.value }))}
                  placeholder="Sistemle ilgili özel notlar..."
                  className="h-9 text-xs mt-1"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 pt-2 border-t">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAddLocationModalOpen(false)}
            >
              İptal
            </Button>
            <Button
              size="sm"
              onClick={() => addLocationMutation.mutate(newLocationForm)}
              disabled={addLocationMutation.isPending || !newLocationForm.roomType}
              className="bg-[#0051d5] hover:bg-[#0042b0] text-white"
            >
              {addLocationMutation.isPending ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                  Kaydediliyor...
                </>
              ) : (
                'Mahali Tanımla ve Seç'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
