import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as XLSX from 'xlsx';

const router = Router();
const prisma = new PrismaClient();

// ──────────────────────────────────────────────────────────────────────────────
// DİNAMİK KLASÖRLÜ DOSYA YÜKLEME (uploads/fm200/<facilitySlug>/...)
// ──────────────────────────────────────────────────────────────────────────────
const sanitizeFolderName = (str: string): string => {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'C', 'ğ': 'g', 'Ğ': 'G', 'ı': 'i', 'I': 'I', 'İ': 'I',
    'ö': 'o', 'Ö': 'O', 'ş': 's', 'Ş': 'S', 'ü': 'u', 'Ü': 'U'
  };
  let clean = String(str || '').replace(/[çÇğĞıIİöÖşŞüÜ]/g, (m) => trMap[m] || m);
  clean = clean.replace(/[^a-zA-Z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return clean || 'general';
};

const storage = multer.diskStorage({
  destination: async (req: any, file, cb) => {
    try {
      let folderName = 'general';
      const rawFac = req.query.facilityName || req.body.facilityName;
      const rawFacId = req.query.facilityId || req.body.facilityId;

      if (rawFac && typeof rawFac === 'string' && rawFac.trim() !== '' && rawFac !== 'undefined') {
        folderName = sanitizeFolderName(rawFac);
      } else if (rawFacId && rawFacId !== 'all' && rawFacId !== 'general') {
        const fac = await prisma.facility.findUnique({
          where: { id: String(rawFacId) },
          select: { name: true, shortName: true }
        });
        if (fac) {
          folderName = sanitizeFolderName(fac.shortName || fac.name || String(rawFacId));
        } else {
          folderName = sanitizeFolderName(String(rawFacId));
        }
      }

      req.targetFacilityFolder = folderName;
      const targetDir = path.join(process.cwd(), 'uploads', 'fm200', folderName);
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    } catch (err: any) {
      const fallbackDir = path.join(process.cwd(), 'uploads', 'fm200', 'general');
      if (!fs.existsSync(fallbackDir)) {
        fs.mkdirSync(fallbackDir, { recursive: true });
      }
      req.targetFacilityFolder = 'general';
      cb(null, fallbackDir);
    }
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `fm200-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB max
});

// Upload Endpoint
router.post('/upload', authMiddleware, upload.array('files', 20), async (req: any, res: Response) => {
  try {
    if (!req.files || (req.files as Express.Multer.File[]).length === 0) {
      return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const folderName = req.targetFacilityFolder || 'general';
    const files = req.files as Express.Multer.File[];

    const uploadedFiles = files.map(file => ({
      name: file.originalname,
      url: `/uploads/fm200/${folderName}/${file.filename}`,
      type: file.mimetype,
      size: file.size,
      uploadedAt: new Date().toISOString()
    }));

    res.json(uploadedFiles);
  } catch (error) {
    console.error('FM200 Upload Error:', error);
    res.status(500).json({ error: 'Dosya yükleme başarısız oldu.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// AYARLAR & REFERANS METİNLERİ
// ──────────────────────────────────────────────────────────────────────────────
// ──────────────────────────────────────────────────────────────────────────────
// AYARLAR & 25 MADDELİK SIZDIRMAZLIK VE SİSTEM SORU SETİ
// ──────────────────────────────────────────────────────────────────────────────
export const DEFAULT_FM200_QUESTIONS = [
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

export const DEFAULT_ISSUE_TEMPLATES: Record<number, { teknik: string[]; firma: string[] }> = {
  4: {
    teknik: [
      '1-5 cm arası kablo geçiş boşluğu mevcut; yangın durdurucu mastik/harç ile Teknik Hizmetler tarafından kapatılmalı.',
      'Kablo tavası çevresinde lokal açıklık/çatlak var; yangın yastığı ile doldurulmalı.',
      '10 cm\'den küçük havalandırma kenar açıklığı yangın köpüğü ile izole edilecek.'
    ],
    firma: [
      'Açıklık 10 cm\'den büyük; alçıpan ve yangın bariyer levhası ile yetkili firma tarafından kapatılmalı.',
      'Tavan/duvar geçişinde büyük yapısal açıklık (>15 cm); taşyünü ve yangın yalıtımı firma tarafından yapılmalı.',
      'Bölme bütünlüğü bozulmuş; kalıcı mimari sızdırmazlık imalatı için dış firma desteği gerekli.'
    ]
  },
  5: {
    teknik: [
      'Kapı altı süpürgeliği/fitili aşınmış; Teknik Hizmetler tarafından fitil yenilenecek.',
      'Kapı hidroliğinde ayar bozukluğu var; Teknik Hizmetler tarafından kapanma hızı ve mandalı ayarlanmalı.'
    ],
    firma: [
      'Kapı kasası ve kanadı deforme olmuş; yangın kapısı revizyonu/değişimi firma tarafından yapılmalı.',
      'Yangın kapısı conta ve eşik profili eksik; standartlara uygun sızdırmaz kapı takımı temin edilmeli.'
    ]
  },
  6: {
    teknik: [
      'Damper mekanik kolunda sıkışma var; yağlama ve temizlik Teknik Hizmetler tarafından yapılacak.',
      'Damper mikroanahtarı gevşemiş; fiziksel montajı sıkılaştırılacak.'
    ],
    firma: [
      'Damper motoru/patlayıcı solenoidi arızalı veya panel bağlantısı yok; yetkili firma tarafından onarılmalı.',
      'Havalandırma kanalı üzerinde yangın damperi mevcut değil; kanal tipi motorlu yangın damperi montajı yapılmalı.'
    ]
  },
  8: {
    teknik: [],
    firma: [
      'Door Fan Test raporu mevcut değil/süresi dolmuş; akredite firmaya test yaptırılmalı.',
      'Door Fan Testi yapılmış ancak gaz tutma süresi standart sınırın (10 dk) altında kalarak başarısız olmuştur; sızdırmazlık iyileştirmesi ve yeniden test gerekli.'
    ]
  },
  12: {
    teknik: [
      'Tüp manometre camı kirli/hasarlı; yerinde fiziksel kontrol ve temizlik yapılacak.'
    ],
    firma: [
      'Tüp manometresi kırmızı alanda (gaz kaçağı/basınç kaybı); acil firma servisi ve yeniden dolum gerekli.',
      'Tüp hidrostatik test süresi (10 yıl) dolmuş; periyodik test ve yeniden belgelendirme yapılmalı.'
    ]
  },
  13: {
    teknik: [
      'Panel manuel modda unutulmuş; Teknik Hizmetler tarafından anahtarlı otomatik konuma alındı.'
    ],
    firma: [
      'Söndürme paneli otomatik modda arıza veriyor; yetkili firma tarafından kontrol kartı incelenmeli.'
    ]
  },
  15: {
    teknik: [
      'Nozul atış hattı üzerinde sunucu kabini/raf malzemesi var; yerleşimi Teknik Hizmetler tarafından kaydırılmalı.',
      'Nozul önündeki kablo tavası nozul püskürtme açısını daraltıyor; lokal tava revizyonu yapılmalı.'
    ],
    firma: [
      'Mahal oda mimarisi değişmiş, mevcut nozul sayısı ve konumları yeni odayı kapsayamıyor; hidrolik proje revizyonu ve nozul ekleme gerekli.'
    ]
  }
};

const DEFAULT_ROOM_TYPES = [
  'Sunucu Odası', 'Sistem Odası', 'UPS Odası', 'Trafo Odası', 'Arşiv Odası',
  'MCC Panosu', 'ADP Pano Odası', 'Elektrik Panosu', 'Kat Panosu', 'Radyoloji Odası',
  'Hücre Odası', 'CCTV Odası', 'Bedaş Odası', 'Anjiyo Odası', 'Jeneratör Odası', 'Diğer'
];

router.get('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    let setting = await prisma.fm200Setting.findUnique({ where: { id: 'default' } });
    if (!setting) {
      setting = await prisma.fm200Setting.create({
        data: {
          id: 'default',
          roomTypes: DEFAULT_ROOM_TYPES,
          systemTypes: ['FM-200', 'Novec1230', 'CO2', 'Inergen'],
          checklistQuestions: DEFAULT_FM200_QUESTIONS as any,
          issueTemplates: DEFAULT_ISSUE_TEMPLATES as any
        }
      });
    } else {
      // Eğer sorular veya hazır kalıplar henüz atanmamışsa varsayılanları doldur
      let needsUpdate = false;
      const updateData: any = {};
      if (!setting.checklistQuestions) {
        updateData.checklistQuestions = DEFAULT_FM200_QUESTIONS;
        needsUpdate = true;
      }
      if (!setting.issueTemplates) {
        updateData.issueTemplates = DEFAULT_ISSUE_TEMPLATES;
        needsUpdate = true;
      }
      if (needsUpdate) {
        setting = await prisma.fm200Setting.update({
          where: { id: 'default' },
          data: updateData
        });
      }
    }
    res.json(setting);
  } catch (error) {
    console.error('FM200 get settings error:', error);
    res.status(500).json({ error: 'Ayarlar getirilemedi' });
  }
});

router.put('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomTypes, systemTypes, checklistQuestions, issueTemplates } = req.body;
    const updated = await prisma.fm200Setting.upsert({
      where: { id: 'default' },
      update: {
        ...(roomTypes && { roomTypes }),
        ...(systemTypes && { systemTypes }),
        ...(checklistQuestions && { checklistQuestions }),
        ...(issueTemplates && { issueTemplates })
      },
      create: {
        id: 'default',
        roomTypes: roomTypes || DEFAULT_ROOM_TYPES,
        systemTypes: systemTypes || ['FM-200', 'Novec1230', 'CO2', 'Inergen'],
        checklistQuestions: checklistQuestions || (DEFAULT_FM200_QUESTIONS as any),
        issueTemplates: issueTemplates || (DEFAULT_ISSUE_TEMPLATES as any)
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('FM200 update settings error:', error);
    res.status(500).json({ error: 'Ayarlar kaydedilemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// LOKASYON & TÜP ENVERTERİ (SETTINGS & CRUD & EXCEL)
// ──────────────────────────────────────────────────────────────────────────────

// Tesis bazlı veya tüm konumları listele
router.get('/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;
    const where: any = { isActive: true };
    if (facilityId && facilityId !== 'all') {
      where.facilityId = String(facilityId);
    }

    const locations = await prisma.fm200Location.findMany({
      where,
      include: {
        cylinders: true,
        facility: { select: { id: true, name: true, shortName: true } },
        workOrders: {
          where: { status: { not: 'Tamamlandi' } },
          select: { id: true, status: true, trackLane: true, title: true, responsible: true, sourcePhase: true }
        },
        phase1Assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        inspections: {
          orderBy: { inspectionDate: 'desc' },
          take: 1
        },
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
          take: 1,
          include: { cylinders: true }
        },
        tightnessTests: {
          orderBy: { testDate: 'desc' },
          take: 1
        }
      },
      orderBy: [{ facilityId: 'asc' }, { building: 'asc' }, { floor: 'asc' }, { index: 'asc' }]
    });

    // Her konum için özet durum hesaplama (Bölüm 10)
    const formatted = locations.map(loc => {
      const openPhysical = loc.workOrders.filter(w => w.trackLane === 'Fiziksel');
      const openDoc = loc.workOrders.filter(w => w.trackLane === 'Dokuman');
      const appliedPendingReview = loc.workOrders.filter(w => w.status === 'Uygulandi');
      const latestTest = loc.tightnessTests[0];
      const latestPhase1 = loc.phase1Assessments[0];
      const latestInspection = loc.inspections[0];
      const latestMaintenance = loc.maintenances[0];

      let overallStatus = 'Sistem Hazır ve Uygun';
      let statusColor = 'green';

      if (!latestPhase1 || !latestPhase1.isCompleted) {
        overallStatus = 'Değerlendirme Eksik';
        statusColor = 'slate';
      } else if (openPhysical.length > 0) {
        overallStatus = 'Fiziksel İyileştirme Gerekli';
        statusColor = 'amber';
      } else if (openDoc.length > 0) {
        overallStatus = 'Bilgi / Belge Bekleniyor';
        statusColor = 'blue';
      } else if (appliedPendingReview.length > 0) {
        overallStatus = 'Doğrulama Bekleniyor';
        statusColor = 'purple';
      } else if (latestTest && latestTest.result === 'Kaldi') {
        overallStatus = 'Sızdırmazlık Başarısız';
        statusColor = 'red';
      }

      return {
        ...loc,
        overallStatus,
        statusColor,
        openWorkCount: loc.workOrders.length,
        openPhysicalCount: openPhysical.length,
        openDocCount: openDoc.length,
        latestPhase1,
        latestInspection,
        latestMaintenance,
        latestTest
      };
    });

    res.json(formatted);
  } catch (error) {
    console.error('FM200 get locations error:', error);
    res.status(500).json({ error: 'Konumlar yüklenemedi' });
  }
});

// Tek konum detayı
router.get('/locations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const location = await prisma.fm200Location.findUnique({
      where: { id },
      include: {
        facility: true,
        cylinders: true,
        workOrders: {
          include: { evidences: true, cylinder: true },
          orderBy: { createdAt: 'desc' }
        },
        phase1Assessments: { orderBy: { assessedDate: 'desc' } },
        inspections: { orderBy: { inspectionDate: 'desc' } },
        maintenances: {
          orderBy: { maintenanceDate: 'desc' },
          include: { cylinders: { include: { cylinder: true } } }
        },
        tightnessTests: { orderBy: { testDate: 'desc' } }
      }
    });

    if (!location) {
      return res.status(404).json({ error: 'Konum bulunamadı' });
    }

    res.json(location);
  } catch (error) {
    console.error('FM200 get location detail error:', error);
    res.status(500).json({ error: 'Konum detayı getirilemedi' });
  }
});

// Kat sıralama ağırlık motoru: En üstten (Çatı, Yüksek Katlar) en alta (Zemin, Bodrum Katlar: B1, B2... B7)
export const getFloorSortWeight = (floorStr: string): number => {
  if (!floorStr) return 0;
  const s = floorStr.trim().toUpperCase();

  // Çatı, Teras, Asansör Kulesi -> En üst
  if (s.includes('ÇATI') || s.includes('CATI') || s.includes('ROOF')) return 9999;
  if (s.includes('TERAS') || s.includes('KULE')) return 9990;

  // Bodrum Katlar: B1, B2, B-1, -1, -2, BODRUM vb. -> Negatif ağırlık
  // Örn: B1 -> -1, B2 -> -2, B5 -> -5 (böylece B1 > B2 > B5 şeklinde sıralanır)
  const bodrumMatch = s.match(/(?:B|BODRUM|KAT\s*-\s*|-)\s*(\d+)/i);
  if (bodrumMatch) {
    const num = parseInt(bodrumMatch[1], 10);
    return -num;
  }
  if (s.includes('BODRUM') || s.includes('SUB') || s.includes('KAZAN')) return -0.5;

  // Zemin Kat / Giriş Kat / 0. Kat -> 0
  if (s.includes('ZEMİN') || s.includes('ZEMIN') || s.includes('GİRİŞ') || s.includes('GIRIS') || s.includes('LOBİ') || s.includes('LOBI')) {
    return 0;
  }
  if (/^0(?:\.|\s*kat)?$/i.test(s) || s === '0') {
    return 0;
  }

  // Tesisat Katı veya Ara Kat varsa numara ile kombine et
  const isAra = s.includes('ARA') || s.includes('MEZZANINE');
  const isTesisat = s.includes('TESİSAT') || s.includes('TESISAT');

  // Normal Pozitif Katlar: 11.Kat, 10.Kat, Kat 4, 3 vb.
  const posMatch = s.match(/(\d+)/);
  if (posMatch) {
    let num = parseInt(posMatch[1], 10);
    if (isAra || isTesisat) {
      return num + 0.5; // Örn 4. Kat Tesisat Katı -> 4.5
    }
    return num;
  }

  return 0;
};

// Kat listesini blok/bina bazında yukarıdan aşağıya (en büyük kattan bodruma) sıralayan yardımcı
export const sortFloorsDescending = <T extends { floor: string }>(items: T[]): T[] => {
  return [...items].sort((a, b) => {
    const weightA = getFloorSortWeight(a.floor);
    const weightB = getFloorSortWeight(b.floor);
    if (weightA !== weightB) {
      return weightB - weightA; // Azalan sıra (En üst kat en başta)
    }
    return a.floor.localeCompare(b.floor, 'tr');
  });
};

// Otomatik İndeks ve UID Üretici Yardımcı Fonksiyonu
// Kullanıcı kuralı: Aynı tesiste, aynı bina, aynı blok, aynı kat ve aynı oda türü (örn: A Blok 7. Kat - Kat Panosu)
// seçildiğinde 1, 2, 3.. şeklinde otomatik sıralı numara atanır.
const generateLocationUid = async (
  facilityId: string,
  building: string,
  block: string | null | undefined,
  floor: string,
  roomType: string
) => {
  const fac = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { shortName: true, name: true }
  });
  const facCode = (fac?.shortName || fac?.name || 'TES').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) || 'TES01';
  
  // Aynı tesiste, aynı bina, blok, kat ve mahal tipindeki mevcut konum sayısı
  const whereSameLocation: any = {
    facilityId,
    building: building || 'Ana Bina',
    floor: floor || 'Zemin Kat',
    roomType
  };
  if (block) {
    whereSameLocation.block = block;
  } else {
    whereSameLocation.block = null;
  }

  const countOnSameFloor = await prisma.fm200Location.count({
    where: whereSameLocation
  });
  const nextIndex = countOnSameFloor + 1; // 1, 2, 3...

  // Mahal kodu kısaltması
  const mapCode: Record<string, string> = {
    'Sunucu Odası': 'SO', 'Sistem Odası': 'SO', 'UPS Odası': 'UPS', 'Trafo Odası': 'TRF',
    'Arşiv Odası': 'ARS', 'MCC Panosu': 'MCC', 'ADP Pano Odası': 'ADP', 'Elektrik Panosu': 'EP',
    'Kat Panosu': 'KP', 'Radyoloji Odası': 'RAD', 'Hücre Odası': 'HCR', 'CCTV Odası': 'CCTV',
    'Bedaş Odası': 'BDS', 'Anjiyo Odası': 'ANJ', 'Jeneratör Odası': 'JEN', 'Diğer': 'DGR'
  };
  const typeCode = mapCode[roomType] || 'MAH';
  const cleanBuilding = (building || 'Ana').replace(/[^A-Z0-9]/gi, '').substring(0, 3).toUpperCase() || 'B1';
  const cleanBlock = (block || '').replace(/[^A-Z0-9]/gi, '').substring(0, 3).toUpperCase();
  const cleanFloor = (floor || 'ZEM').replace(/[^A-Z0-9]/gi, '').substring(0, 4).toUpperCase() || 'K0';
  const paddedIndex = String(nextIndex).padStart(2, '0');

  const blockPart = cleanBlock ? `-${cleanBlock}` : '';
  const systemUid = `${facCode}-${cleanBuilding}${blockPart}-${cleanFloor}-${typeCode}-${paddedIndex}`;
  return { nextIndex, systemUid };
};

// Konum Ekle
router.post('/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      facilityId, building, block, floor, roomType, customRoomName,
      systemType, panelType, roomVolumeM3, cylinderCount, notes, cylinders
    } = req.body;

    if (!facilityId || !roomType) {
      return res.status(400).json({ error: 'Tesis ve Mahal Tipi zorunludur' });
    }

    const { nextIndex, systemUid } = await generateLocationUid(
      facilityId,
      building || 'Ana Bina',
      block || null,
      floor || 'Zemin Kat',
      roomType
    );

    const createdLocation = await prisma.fm200Location.create({
      data: {
        facilityId,
        building: building || 'Ana Bina',
        block: block || null,
        floor: floor || 'Zemin',
        roomType,
        customRoomName: customRoomName || null,
        index: nextIndex,
        systemUid,
        systemType: systemType || 'FM-200',
        panelType: panelType || null,
        roomVolumeM3: roomVolumeM3 ? parseFloat(roomVolumeM3) : null,
        cylinderCount: cylinderCount ? parseInt(cylinderCount) : (Array.isArray(cylinders) ? cylinders.length : 1),
        notes: notes || null,
        cylinders: {
          create: (cylinders || []).map((c: any, idx: number) => ({
            serialNumber: c.serialNumber || `SN-${Date.now()}-${idx + 1}`,
            labelCode: c.labelCode || `Tüp #${idx + 1}`,
            capacityKg: c.capacityKg ? parseFloat(c.capacityKg) : null,
            tareKg: c.tareKg ? parseFloat(c.tareKg) : null,
            manufacturingYear: c.manufacturingYear ? parseInt(c.manufacturingYear) : null,
            lastHydrostaticTestDate: c.lastHydrostaticTestDate ? new Date(c.lastHydrostaticTestDate) : null,
            notes: c.notes || null
          }))
        }
      },
      include: { cylinders: true }
    });

    res.json(createdLocation);
  } catch (error) {
    console.error('FM200 create location error:', error);
    res.status(500).json({ error: 'Konum oluşturulamadı' });
  }
});

// Konum Güncelle
router.put('/locations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      building, block, floor, roomType, customRoomName,
      systemType, panelType, roomVolumeM3, cylinderCount, notes, cylinders
    } = req.body;

    const existing = await prisma.fm200Location.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Konum bulunamadı' });

    // Konum güncelle
    const updated = await prisma.fm200Location.update({
      where: { id },
      data: {
        building: building !== undefined ? building : existing.building,
        block: block !== undefined ? block : existing.block,
        floor: floor !== undefined ? floor : existing.floor,
        roomType: roomType !== undefined ? roomType : existing.roomType,
        customRoomName: customRoomName !== undefined ? customRoomName : existing.customRoomName,
        systemType: systemType !== undefined ? systemType : existing.systemType,
        panelType: panelType !== undefined ? panelType : existing.panelType,
        roomVolumeM3: roomVolumeM3 !== undefined ? (roomVolumeM3 ? parseFloat(roomVolumeM3) : null) : existing.roomVolumeM3,
        cylinderCount: cylinderCount !== undefined ? parseInt(cylinderCount) : existing.cylinderCount,
        notes: notes !== undefined ? notes : existing.notes
      }
    });

    // Tüpleri senkronize et
    if (Array.isArray(cylinders)) {
      // Mevcut tüpleri al
      const curCyls = await prisma.fm200Cylinder.findMany({ where: { locationId: id } });
      const incomingIds = cylinders.filter(c => c.id).map(c => c.id);

      // Silinecekler
      const toDelete = curCyls.filter(c => !incomingIds.includes(c.id)).map(c => c.id);
      if (toDelete.length > 0) {
        await prisma.fm200Cylinder.deleteMany({ where: { id: { in: toDelete } } });
      }

      // Güncelle veya Ekle
      for (let i = 0; i < cylinders.length; i++) {
        const c = cylinders[i];
        if (c.id) {
          await prisma.fm200Cylinder.update({
            where: { id: c.id },
            data: {
              serialNumber: c.serialNumber,
              labelCode: c.labelCode || `Tüp #${i + 1}`,
              capacityKg: c.capacityKg ? parseFloat(c.capacityKg) : null,
              tareKg: c.tareKg ? parseFloat(c.tareKg) : null,
              manufacturingYear: c.manufacturingYear ? parseInt(c.manufacturingYear) : null,
              lastHydrostaticTestDate: c.lastHydrostaticTestDate ? new Date(c.lastHydrostaticTestDate) : null,
              notes: c.notes || null
            }
          });
        } else {
          await prisma.fm200Cylinder.create({
            data: {
              locationId: id,
              serialNumber: c.serialNumber || `SN-${Date.now()}-${i + 1}`,
              labelCode: c.labelCode || `Tüp #${i + 1}`,
              capacityKg: c.capacityKg ? parseFloat(c.capacityKg) : null,
              tareKg: c.tareKg ? parseFloat(c.tareKg) : null,
              manufacturingYear: c.manufacturingYear ? parseInt(c.manufacturingYear) : null,
              lastHydrostaticTestDate: c.lastHydrostaticTestDate ? new Date(c.lastHydrostaticTestDate) : null,
              notes: c.notes || null
            }
          });
        }
      }
    }

    const result = await prisma.fm200Location.findUnique({
      where: { id },
      include: { cylinders: true }
    });

    res.json(result);
  } catch (error) {
    console.error('FM200 update location error:', error);
    res.status(500).json({ error: 'Konum güncellenemedi' });
  }
});

// Konum Sil (Soft-delete: isActive = false)
router.delete('/locations/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fm200Location.update({
      where: { id },
      data: { isActive: false }
    });
    res.json({ success: true, message: 'Konum pasife alındı' });
  } catch (error) {
    console.error('FM200 delete location error:', error);
    res.status(500).json({ error: 'Konum silinemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// BİNA, BLOK VE KAT LİSTESİ (AYARLAR İÇİN)
// ──────────────────────────────────────────────────────────────────────────────
router.get('/building-floors', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;
    const where: any = {};
    if (facilityId && facilityId !== 'all') {
      where.facilityId = String(facilityId);
    }
    const items = await prisma.fm200BuildingFloor.findMany({
      where,
      orderBy: [{ building: 'asc' }, { block: 'asc' }]
    });

    // Gruplayarak veya doğrudan blok bazında katları yukarıdan aşağıya (en yüksek kattan bodruma) sıralayalım
    const sorted = [...items].sort((a, b) => {
      // 1. Bina karşılaştırma
      const bComp = (a.building || '').localeCompare(b.building || '', 'tr');
      if (bComp !== 0) return bComp;

      // 2. Blok karşılaştırma
      const blkA = a.block || '';
      const blkB = b.block || '';
      const blkComp = blkA.localeCompare(blkB, 'tr');
      if (blkComp !== 0) return blkComp;

      // 3. Kat yüksekliği (En yüksek kat/çatı en üstte, B1/B2/B5 en altta)
      const weightA = getFloorSortWeight(a.floor);
      const weightB = getFloorSortWeight(b.floor);
      if (weightA !== weightB) {
        return weightB - weightA; // Azalan sıra
      }
      return a.floor.localeCompare(b.floor, 'tr');
    });

    res.json(sorted);
  } catch (error) {
    console.error('FM200 get building floors error:', error);
    res.status(500).json({ error: 'Bina ve kat listesi getirilemedi' });
  }
});

// Manuel Bina/Kat Ekleme
router.post('/building-floors', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, building, block, floor } = req.body;
    if (!facilityId || !floor) {
      return res.status(400).json({ error: 'Tesis ve Kat zorunludur' });
    }
    const item = await prisma.fm200BuildingFloor.upsert({
      where: {
        facilityId_building_block_floor: {
          facilityId,
          building: (building || 'Ana Bina').trim(),
          block: block ? block.trim() : null,
          floor: floor.trim()
        }
      },
      update: {},
      create: {
        facilityId,
        building: (building || 'Ana Bina').trim(),
        block: block ? block.trim() : null,
        floor: floor.trim()
      }
    });
    res.json(item);
  } catch (error) {
    console.error('FM200 create building floor error:', error);
    res.status(500).json({ error: 'Bina/Kat kaydedilemedi' });
  }
});

// Manuel Bina/Kat Güncelleme (Edit)
router.put('/building-floors/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { building, block, floor } = req.body;
    if (!floor || !floor.trim()) {
      return res.status(400).json({ error: 'Kat bilgisi boş bırakılamaz' });
    }

    const existing = await prisma.fm200BuildingFloor.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ error: 'Kayıt bulunamadı' });
    }

    const updated = await prisma.fm200BuildingFloor.update({
      where: { id },
      data: {
        building: building !== undefined ? (building || 'Ana Bina').trim() : existing.building,
        block: block !== undefined ? (block ? block.trim() : null) : existing.block,
        floor: floor.trim()
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('FM200 update building floor error:', error);
    res.status(500).json({ error: error.message || 'Kat güncellenemedi' });
  }
});

// Bina/Kat Silme
router.delete('/building-floors/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.fm200BuildingFloor.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Silinemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// EXCEL İLE BİNA, BLOK, KAT YÜKLEME VE ŞABLON İNDİRME
// ──────────────────────────────────────────────────────────────────────────────
router.get('/excel-template', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const sampleData = [
      {
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '11.Kat'
      },
      {
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '10.Kat'
      },
      {
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '1.Kat'
      },
      {
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '0. Kat'
      },
      {
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': 'B1. Kat'
      },
      {
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': 'B2. Kat'
      },
      {
        'Bina': 'Ana Bina',
        'Blok': 'C Blok',
        'Kat': '3.Kat'
      },
      {
        'Bina': 'Ek Bina',
        'Blok': 'D Blok',
        'Kat': '2.Kat'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);
    XLSX.utils.book_append_sheet(wb, ws, 'Konum Listesi');

    const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename="FM200_Bina_Blok_Kat_Sablonu.xlsx"');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error) {
    console.error('Excel template error:', error);
    res.status(500).json({ error: 'Excel şablonu oluşturulamadı' });
  }
});

// Excel Dosyası Yükleyip Bina, Blok ve Katları Tanımlama
const excelUpload = multer({ storage: multer.memoryStorage() });

router.post('/import-excel', authMiddleware, excelUpload.single('file'), async (req: any, res: Response) => {
  try {
    const { facilityId } = req.body;
    if (!req.file) {
      return res.status(400).json({ error: 'Excel dosyası yüklenmedi' });
    }

    const workbook = XLSX.read(req.file.buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const rows: any[] = XLSX.utils.sheet_to_json(sheet);

    if (!rows || rows.length === 0) {
      return res.status(400).json({ error: 'Excel dosyasında veri bulunamadı' });
    }

    const allFacilities = await prisma.facility.findMany({
      select: { id: true, name: true, shortName: true }
    });

    let addedCount = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      // Kullanıcı kuralı: Tesis adı sütunu önemsenmeyebilir, formdan seçilen facilityId önceliklidir
      const rawFacilityName = (row['Tesis Adı'] || row['Tesis'] || '').toString().trim();
      const building = (row['Bina'] || 'Ana Bina').toString().trim();
      const block = row['Blok'] ? row['Blok'].toString().trim() : null;
      const floor = (row['Kat'] || '').toString().trim();

      if (!floor) continue;

      let targetFacilityId = facilityId;
      // Eğer kullanıcı formdan belirli bir tesis seçmemişse ('all' veya boş ise) Excel'deki tesis adını eşleştirmeye çalış
      if ((!targetFacilityId || targetFacilityId === 'all') && rawFacilityName) {
        const matched = allFacilities.find(f => 
          f.name.toLowerCase() === rawFacilityName.toLowerCase() ||
          (f.shortName && f.shortName.toLowerCase() === rawFacilityName.toLowerCase()) ||
          f.name.toLowerCase().includes(rawFacilityName.toLowerCase()) ||
          rawFacilityName.toLowerCase().includes(f.name.toLowerCase())
        );
        if (matched) {
          targetFacilityId = matched.id;
        }
      }

      if (!targetFacilityId || targetFacilityId === 'all') {
        errors.push(`Satır ${i + 2}: Tesis seçilmemiş veya Excel'deki tesis adı ("${rawFacilityName}") eşleştirilemedi.`);
        continue;
      }

      try {
        await prisma.fm200BuildingFloor.upsert({
          where: {
            facilityId_building_block_floor: {
              facilityId: targetFacilityId,
              building: building || 'Ana Bina',
              block: block || null,
              floor
            }
          },
          update: {},
          create: {
            facilityId: targetFacilityId,
            building: building || 'Ana Bina',
            block: block || null,
            floor
          }
        });
        addedCount++;
      } catch (err: any) {
        errors.push(`Satır ${i + 2}: ${err.message}`);
      }
    }

    res.json({
      success: true,
      message: `${addedCount} adet Bina/Blok/Kat konumu başarıyla tanımlandı.`,
      addedCount,
      errors
    });
  } catch (error: any) {
    console.error('FM200 Excel import error:', error);
    res.status(500).json({ error: error.message || 'Excel yükleme sırasında hata oluştu' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// OTOMATİK İŞ EMİRLERİ MOTORU & ESKALASYON (Bölüm 13 & 14)
// ──────────────────────────────────────────────────────────────────────────────
const triggerWorkOrder = async (params: {
  locationId: string;
  cylinderId?: string;
  sourcePhase: string;
  sourceCode: string;
  title: string;
  workType: 'Kucuk' | 'Buyuk';
  responsible: 'Teknik' | 'Firma';
  trackLane: 'Fiziksel' | 'Dokuman';
  dueDate?: Date | null;
  questionText?: string | null;
  templates?: any[];
  customNote?: string | null;
  photos?: any[];
}) => {
  // Mükerrer kontrolü: Aynı konum ve kaynak kod için Tamamlanmamış iş var mı?
  const existing = await prisma.fm200WorkOrder.findFirst({
    where: {
      locationId: params.locationId,
      sourceCode: params.sourceCode,
      status: { not: 'Tamamlandi' },
      cylinderId: params.cylinderId || null
    }
  });

  if (existing) {
    // Eskalasyon: tekrar sayacını artır ve yeni detayları ekle
    return await prisma.fm200WorkOrder.update({
      where: { id: existing.id },
      data: {
        repeatCount: existing.repeatCount + 1,
        title: params.title,
        workType: params.workType,
        responsible: params.responsible,
        questionText: params.questionText !== undefined ? params.questionText : existing.questionText,
        templates: (params.templates !== undefined ? params.templates : (existing.templates || [])) as any,
        customNote: params.customNote !== undefined ? params.customNote : existing.customNote,
        photos: (params.photos !== undefined && params.photos.length > 0 ? params.photos : (existing.photos || [])) as any,
        dueDate: params.dueDate !== undefined ? params.dueDate : existing.dueDate,
        updatedAt: new Date()
      }
    });
  } else {
    // Yeni iş kaydı aç
    return await prisma.fm200WorkOrder.create({
      data: {
        locationId: params.locationId,
        cylinderId: params.cylinderId || null,
        sourcePhase: params.sourcePhase,
        sourceCode: params.sourceCode,
        title: params.title,
        workType: params.workType,
        responsible: params.responsible,
        trackLane: params.trackLane,
        status: 'Planlandi',
        repeatCount: 1,
        dueDate: params.dueDate || null,
        questionText: params.questionText || null,
        templates: params.templates || [],
        customNote: params.customNote || null,
        photos: params.photos || []
      }
    });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// FAZ 1 — FİZİKSEL DURUM VE TASARIM DEĞERLENDİRMESİ
// ──────────────────────────────────────────────────────────────────────────────
router.post('/assessments/phase1', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, answers, notes, photos } = req.body;
    if (!locationId || !answers) {
      return res.status(400).json({ error: 'Konum ve yanıtlar zorunludur' });
    }

    const user = req.user!;
    const assessment = await prisma.fm200Phase1Assessment.create({
      data: {
        locationId,
        assessedBy: user.fullName || user.username,
        f1_a1: answers.f1_a1,
        f1_a2: answers.f1_a2,
        f1_a3: answers.f1_a3,
        f1_a4: answers.f1_a4,
        f1_b1: answers.f1_b1,
        f1_b2: answers.f1_b2,
        f1_b3: answers.f1_b3,
        f1_b4: answers.f1_b4,
        f1_b5: answers.f1_b5,
        f1_b6: answers.f1_b6,
        f1_c1: answers.f1_c1,
        f1_c2: answers.f1_c2,
        f1_d1: answers.f1_d1,
        f1_d2: answers.f1_d2,
        f1_d3: answers.f1_d3,
        f1_e1: answers.f1_e1,
        f1_e2: answers.f1_e2,
        notes: notes || null,
        photos: photos || [],
        isCompleted: true
      }
    });

    // Otomatik İş Üretimi (Bölüm 4 spesifikasyonu)
    const openedJobs = [];

    // F1-A1: Oda hacmi ölçüldü mü? Hayır -> Doküman, Teknik, Küçük
    if (answers.f1_a1 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-A1',
        title: 'Oda ölçülerinin alınması ve korunan hacmin hesaplanması',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Dokuman'
      }));
    }
    // F1-A2: Tasarım ile ölçülen uyuşuyor mu? Hayır -> Doküman, Firma, Büyük
    if (answers.f1_a2 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-A2',
        title: 'Hacim farklılığının teknik incelenmesi ve tasarıma etkisinin belirlenmesi',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }
    // F1-A3: Oda değişikliği yapıldı mı? Evet -> Doküman, Firma, Büyük
    if (answers.f1_a3 === 'Evet') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-A3',
        title: 'Değişen mahal sınırlarına göre tasarımın yeniden değerlendirilmesi',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }
    // F1-A4: Değişiklik geçmişi biliniyor mu? Bilinmiyor -> Doküman, Teknik, Küçük
    if (answers.f1_a4 === 'Bilinmiyor') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-A4',
        title: 'Mahal değişiklik geçmişinin arşivden araştırılması',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Dokuman'
      }));
    }

    // F1-B1: Onaylı tasarım hesabı var mı? Hayır -> Doküman, Firma, Büyük
    if (answers.f1_b1 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-B1',
        title: 'Tasarım hesabının temin edilmesi; yoksa yeniden hazırlatılması',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }
    // F1-B2: Biliniyor mu? Bilinmiyor -> Doküman, Teknik, Küçük
    if (answers.f1_b2 === 'Bilinmiyor') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-B2',
        title: 'Tasarım hesabının şirket kayıtlarında araştırılması',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Dokuman'
      }));
    }
    // F1-B3: Tüp dolum bilgileri doğrulanıyor mu? Hayır -> Doküman, Teknik, Küçük
    if (answers.f1_b3 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-B3',
        title: 'Tüp etiket ve dolum miktarlarının yerinde doğrulanması',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Dokuman'
      }));
    }
    // F1-B4: Kurulu gaz miktarı uyuşuyor mu? Hayır -> Doküman, Firma, Büyük
    if (answers.f1_b4 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-B4',
        title: 'Gaz miktarı uyuşmazlığının teknik incelenmesi',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }
    // F1-B5: Nozul hidrolik hesabı var mı? Hayır -> Doküman, Firma, Büyük
    if (answers.f1_b5 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-B5',
        title: 'Nozul dağıtım ve borulama izometrik hesap dokümanının temini',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }
    // F1-B6: Yangın senaryo dokümanı var mı? Hayır -> Doküman, Firma, Büyük
    if (answers.f1_b6 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-B6',
        title: 'Yangın söndürme otomasyon senaryo dokümanının temini',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }

    // F1-C1: Nozul atış konisi önünde engel var mı? Evet -> Fiziksel, Teknik, Küçük
    if (answers.f1_c1 === 'Evet') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-C1',
        title: 'Nozul atışını engelleyen fiziksel engellerin kaldırılması',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Fiziksel'
      }));
    }
    // F1-C2: Asma tavan/yükseltilmiş döşeme kapsamda mı? Bilinmiyor -> Doküman, Firma, Büyük
    if (answers.f1_c2 === 'Bilinmiyor') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-C2',
        title: 'Hacim boşluklarının koruma kapsamının teknik olarak netleştirilmesi',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }

    // F1-D1: Kablo/boru geçişlerinde açıklık var mı? Evet -> Fiziksel, Teknik, Küçük
    if (answers.f1_d1 === 'Evet') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-D1',
        title: 'Kablo/boru geçişlerinin yangın durdurucu harç/yastık ile yalıtılması',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Fiziksel'
      }));
    }
    // F1-D2: Duvar, tavan, döşeme delik var mı? Evet -> Fiziksel, Teknik, Küçük
    if (answers.f1_d2 === 'Evet') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-D2',
        title: 'Bölme bütünlüğünü bozan yapısal delik ve açıklıkların kapatılması',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Fiziksel'
      }));
    }
    // F1-D3: Kapı tam kapanıyor mu? Hayır -> Fiziksel, Teknik, Küçük
    if (answers.f1_d3 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-D3',
        title: 'Kapı fitili, eşik veya hidrolik kapatıcı arızalarının giderilmesi',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Fiziksel'
      }));
    }

    // F1-E1: Sızdırmazlık testi yapıldı mı? Hayır -> Doküman, Firma, Büyük
    if (answers.f1_e1 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-E1',
        title: 'FAZ 4 kapsamında ilk sızdırmazlık testinin planlanması',
        workType: 'Buyuk', responsible: 'Firma', trackLane: 'Dokuman'
      }));
    }
    // F1-E2: Geçerli raporu var mı? Hayır -> Doküman, Teknik, Küçük
    if (answers.f1_e2 === 'Hayır') {
      openedJobs.push(await triggerWorkOrder({
        locationId, sourcePhase: 'FAZ1', sourceCode: 'F1-E2',
        title: 'Önceki test raporunun ilgili kurum veya firmadan temini',
        workType: 'Kucuk', responsible: 'Teknik', trackLane: 'Dokuman'
      }));
    }

    res.json({
      success: true,
      assessment,
      openedJobsCount: openedJobs.length,
      openedJobs
    });
  } catch (error) {
    console.error('FM200 phase1 error:', error);
    res.status(500).json({ error: 'Faz 1 değerlendirmesi kaydedilemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// FAZ 2 — PERİYODİK KONTROL (26 MADDE & AĞIRLIKLI SKOR)
// ──────────────────────────────────────────────────────────────────────────────

// Madde Ağırlık ve Metin Konfigürasyonu (Bölüm 5 & Bölüm 15)
const PERIODIC_ITEMS_DEF: Record<number, {
  name: string;
  weight: number;
  level: 'Kritik' | 'Orta' | 'Dusuk';
  defaultJob: string;
  responsible: 'Teknik' | 'Firma';
  workType: 'Kucuk' | 'Buyuk';
  trackLane: 'Fiziksel' | 'Dokuman';
}> = {
  1: { name: 'Sicil kartı ve bakım kayıtları', weight: 2.5, level: 'Dusuk', defaultJob: 'Sicil kartı ve periyodik bakım kayıtlarının düzenlenmesi', responsible: 'Teknik', workType: 'Kucuk', trackLane: 'Dokuman' },
  2: { name: 'Önceki kontrol eksiklikleri', weight: 0, level: 'Dusuk', defaultJob: 'Önceki dönem eksikliklerinin kapatılması', responsible: 'Teknik', workType: 'Kucuk', trackLane: 'Dokuman' }, // Otomatik
  3: { name: 'Yetkili / eğitimli personel durumu', weight: 3.5, level: 'Orta', defaultJob: 'Görevli personele gazlı söndürme kullanıcı eğitiminin verilmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Dokuman' },
  4: { name: 'Etiket, sertifika ve uyarılar', weight: 2.25, level: 'Dusuk', defaultJob: 'Sistem tüp ve panel etiketlerinin standartlara uygun asılması', responsible: 'Teknik', workType: 'Kucuk', trackLane: 'Dokuman' },
  5: { name: 'Kullanma talimatı ve levhalar', weight: 2.25, level: 'Dusuk', defaultJob: 'Mahal girişine acil durum ve kullanma talimatının asılması', responsible: 'Teknik', workType: 'Kucuk', trackLane: 'Dokuman' },
  6: { name: 'Rutin kontrol kayıt defteri', weight: 2.25, level: 'Dusuk', defaultJob: 'Aylık/3 aylık kullanıcı kontrol formlarının işletilmeye başlanması', responsible: 'Teknik', workType: 'Kucuk', trackLane: 'Dokuman' },
  7: { name: 'Onaylı proje ve resmi onay', weight: 6.5, level: 'Kritik', defaultJob: 'Onaylı projenin temin edilerek sistem dosyasına eklenmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Dokuman' },
  8: { name: 'Tesisatın projeye uygunluğu', weight: 6.5, level: 'Kritik', defaultJob: 'Sahadaki tesisat farklılıklarının projeye uygun hale getirilmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  9: { name: 'Sızdırmazlık test kayıtları', weight: 2.25, level: 'Dusuk', defaultJob: 'Mahalin geçerli sızdırmazlık test kaydının temini/yenilenmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Dokuman' },
  10: { name: 'Gaz tankı bölme ortamı', weight: 2.25, level: 'Dusuk', defaultJob: 'Tüp odasının temizliği, havalandırması ve aydınlatmasının düzeltilmesi', responsible: 'Teknik', workType: 'Kucuk', trackLane: 'Fiziksel' },
  11: { name: 'Tank vanaları, kol ve mühürler', weight: 3.5, level: 'Orta', defaultJob: 'Vana emniyet pimi, boşaltma kolu ve mühürlerin yenilenmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  12: { name: 'Basınç göstergeleri (Manometre)', weight: 6.0, level: 'Kritik', defaultJob: 'Bozuk veya kalibrasyonsuz manometrelerin değiştirilmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  13: { name: 'Tank gaz doluluk oranları (GATEKEEPER)', weight: 6.5, level: 'Kritik', defaultJob: 'Gaz kaçağı olan veya eksik tüpün yeniden doldurulması', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  14: { name: 'Boşaltma hortumları ve borular', weight: 3.5, level: 'Orta', defaultJob: 'Korozyonlu boruların onarımı ve boru askılarının sabitlenmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  15: { name: 'Yangın kontrol paneli durumu', weight: 6.0, level: 'Kritik', defaultJob: 'Söndürme panelinin arızalarının giderilmesi ve devreye alınması', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  16: { name: 'Elektrik beslemesi ve aküler', weight: 3.5, level: 'Orta', defaultJob: 'Panel akülerinin yenilenmesi ve bağımsız linyenin sağlanması', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  17: { name: 'Boşaltma nozulları', weight: 3.5, level: 'Orta', defaultJob: 'Hasarlı veya yönü hatalı nozulların düzeltilmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  18: { name: 'Aşırı basınç tahliye damperi', weight: 3.5, level: 'Orta', defaultJob: 'Basınç tahliye damperinin mekanik bakımının yapılması', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  19: { name: 'Manuel deşarj butonu', weight: 3.5, level: 'Orta', defaultJob: 'Manuel boşaltma butonunun tamir edilmesi ve mühürlenmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  20: { name: 'Deşarj durdurma (Stop) butonu', weight: 3.5, level: 'Orta', defaultJob: 'Durdurma butonunun mekanik ve elektriksel onarımı', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  21: { name: 'Algılama dedektör hatları (GATEKEEPER)', weight: 6.5, level: 'Kritik', defaultJob: 'Çapraz zon (cross-zone) dedektör arızalarının giderilmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  22: { name: 'Alarm kornası ve flaşörler', weight: 3.5, level: 'Orta', defaultJob: '1. ve 2. kademe alarm ünitelerinin çalışır hale getirilmesi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  23: { name: 'Menfez ve damperlerin kapanması', weight: 6.0, level: 'Kritik', defaultJob: 'Gaz basma anında havalandırmayı kapatan damperin onarımı', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  24: { name: 'Otomatik gaz salım aktivatörü', weight: 6.0, level: 'Kritik', defaultJob: 'Solenoid vana veya patlatıcı aktüatörün onarımı/değişimi', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  25: { name: 'Tekrarlayıcı ve ana panel iletimi', weight: 3.5, level: 'Orta', defaultJob: 'Söndürme sinyallerinin bina ana yangın santraline aktarımı', responsible: 'Firma', workType: 'Buyuk', trackLane: 'Fiziksel' },
  26: { name: 'Görevliye teslim tutanağı', weight: 2.25, level: 'Dusuk', defaultJob: 'Sistemin çalışır vaziyette tutanakla bina sorumlusuna teslimi', responsible: 'Teknik', workType: 'Kucuk', trackLane: 'Dokuman' },
};

// Madde 2 Otomasyon Bilgisini Getir
router.get('/inspections/item2-status/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId } = req.params;
    const openPhase2Jobs = await prisma.fm200WorkOrder.count({
      where: {
        locationId,
        sourcePhase: 'FAZ2',
        status: { not: 'Tamamlandi' }
      }
    });

    if (openPhase2Jobs === 0) {
      res.json({ status: 'U', message: 'Önceki dönemden devam eden açık iş bulunmamaktadır.' });
    } else {
      res.json({
        status: 'UD',
        message: `Önceki dönemden devam eden ${openPhase2Jobs} adet açık iş kaydı bulunmaktadır.`
      });
    }
  } catch (error) {
    res.status(500).json({ error: 'Madde 2 kontrolü yapılamadı' });
  }
});

// 25 Kriterlik FM-200 Denetimi Kaydet & Skor Hesapla (Audit Engine)
router.post('/inspections', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, responses, notes, photos, status: reqStatus } = req.body;
    if (!locationId || !responses) {
      return res.status(400).json({ error: 'Konum ve yanıtlar zorunludur' });
    }

    const inspectionStatus = reqStatus || 'Tamamlandi';
    const user = req.user!;

    // Sistem ayarlarındaki soruları veya varsayılan soruları al
    const settings = await prisma.fm200Setting.findUnique({
      where: { id: 'default' }
    });
    const questions: any[] = (settings?.checklistQuestions as any[]) || DEFAULT_FM200_QUESTIONS;

    // Gatekeeper ID'leri: [4, 6, 8, 12, 13, 15]
    const GATEKEEPER_IDS = [4, 6, 8, 12, 13, 15];
    const SEALING_IDS = [4, 5, 6, 7, 8];

    let totalWeight = 0;
    let earnedWeight = 0;

    let totalSealingWeight = 0;
    let earnedSealingWeight = 0;

    let totalHardwareWeight = 0;
    let earnedHardwareWeight = 0;

    let isRedFlagged = false;
    const openedJobs = [];

    for (const q of questions) {
      const qId = q.id;
      const resp = responses[qId] || responses[String(qId)] || { status: 'Karşılıyor' };
      const status = resp.status; // 'Karşılıyor' | 'Kısmen Karşılıyor' | 'Karşılamıyor' | 'Kapsam Dışı'

      if (status === 'Kapsam Dışı') {
        continue; // Ağırlık hesaba katılmaz
      }

      const weight = Number(q.weight) || 10;
      let multiplier = 0;
      if (status === 'Karşılıyor') multiplier = 1.0;
      else if (status === 'Kısmen Karşılıyor') multiplier = 0.5;
      else if (status === 'Karşılamıyor') multiplier = 0.0;

      const earned = weight * multiplier;
      totalWeight += weight;
      earnedWeight += earned;

      // Sızdırmazlık Endeksi (4, 5, 6, 7, 8)
      if (SEALING_IDS.includes(qId) || q.isSealing) {
        totalSealingWeight += weight;
        earnedSealingWeight += earned;
      } else {
        totalHardwareWeight += weight;
        earnedHardwareWeight += earned;
      }

      // Gatekeeper Kontrolü (4, 6, 8, 12, 13, 15)
      if (GATEKEEPER_IDS.includes(qId) && (status === 'Kısmen Karşılıyor' || status === 'Karşılamıyor')) {
        isRedFlagged = true;
      }

      // Kısmen veya Karşılamıyor ise İş Emri Oluştur (Yalnızca Tamamlandı durumundaysa)
      const inspectionStatus = req.body.status || 'Tamamlandi';
      if (inspectionStatus === 'Tamamlandi' && (status === 'Kısmen Karşılıyor' || status === 'Karşılamıyor')) {
        // Kullanıcı hem Teknik hem Firma seçmiş olabilir (responsibles: ['Teknik', 'Firma'])
        let responsiblesList: string[] = [];
        if (Array.isArray(resp.responsibles) && resp.responsibles.length > 0) {
          responsiblesList = resp.responsibles;
        } else if (resp.responsible) {
          responsiblesList = [resp.responsible];
        } else {
          responsiblesList = ['Teknik'];
        }

        const templates = Array.isArray(resp.templates) ? resp.templates.join(' | ') : '';
        const customNote = resp.customNote || resp.note || '';
        
        let titleParts = [];
        if (templates) titleParts.push(templates);
        if (customNote) titleParts.push(customNote);
        const baseTitle = titleParts.length > 0 
          ? `[Soru ${qId}] ${titleParts.join(' - ')}`
          : `[Soru ${qId}] ${q.text} (${status})`;

        for (const r of responsiblesList) {
          const normResponsible = (r === 'Teknik Hizmetler' || r === 'Teknik') ? 'Teknik' : 'Firma';
          const fullTitle = responsiblesList.length > 1 ? `${baseTitle} (${normResponsible})` : baseTitle;
          openedJobs.push(await triggerWorkOrder({
            locationId,
            sourcePhase: 'DENETIM',
            sourceCode: `S${qId}`,
            title: fullTitle.slice(0, 500),
            workType: normResponsible === 'Teknik' ? 'Kucuk' : 'Buyuk',
            responsible: normResponsible,
            trackLane: SEALING_IDS.includes(qId) || q.isSealing ? 'Fiziksel' : 'Dokuman',
            questionText: `[Kriter ${qId}] ${q.text}`,
            templates: Array.isArray(resp.templates) ? resp.templates : [],
            customNote: customNote || null,
            photos: Array.isArray(resp.photos) ? resp.photos : []
          }));
        }
      }
    }

    // Skor Hesapları (Yüzde 0 - 100)
    const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 1000) / 10 : 100;
    const sealingScore = totalSealingWeight > 0 ? Math.round((earnedSealingWeight / totalSealingWeight) * 1000) / 10 : 100;
    const hardwareScore = totalHardwareWeight > 0 ? Math.round((earnedHardwareWeight / totalHardwareWeight) * 1000) / 10 : 100;

    // Risk Seviyesi ve Derece
    let riskLevel = 'DÜŞÜK RİSK';
    let ratingGrade = 'A';

    if (isRedFlagged || overallScore < 60 || sealingScore < 60) {
      riskLevel = 'YÜKSEK RİSK';
      ratingGrade = 'D';
    } else if (overallScore < 80 || sealingScore < 80) {
      riskLevel = 'ORTA RİSK';
      ratingGrade = 'C';
    } else if (overallScore < 95) {
      ratingGrade = 'B';
    }

    const inspection = await prisma.fm200PeriodicInspection.create({
      data: {
        locationId,
        inspectedBy: user.fullName || user.username,
        itemResponses: responses,
        complianceScore: overallScore,
        sealingScore,
        hardwareScore,
        ratingGrade,
        riskLevel,
        isRedFlagged,
        openWorkOrdersCount: openedJobs.length,
        status: inspectionStatus,
        isCompleted: inspectionStatus === 'Tamamlandi',
        notes: notes || null,
        photos: photos || []
      }
    });

    res.json({
      success: true,
      inspection,
      overallScore,
      sealingScore,
      hardwareScore,
      ratingGrade,
      riskLevel,
      isRedFlagged,
      openedJobsCount: openedJobs.length,
      openedJobs
    });
  } catch (error) {
    console.error('FM200 inspection error:', error);
    res.status(500).json({ error: 'Denetim kaydedilemedi' });
  }
});

// Denetimleri Listele
router.get('/inspections', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, locationId } = req.query;
    const where: any = {};
    if (locationId) {
      where.locationId = String(locationId);
    } else if (facilityId && facilityId !== 'all') {
      where.location = { facilityId: String(facilityId) };
    }

    const inspections = await prisma.fm200PeriodicInspection.findMany({
      where,
      include: {
        location: {
          select: {
            id: true, systemUid: true, building: true, block: true, floor: true,
            roomType: true, customRoomName: true, index: true, facilityId: true,
            facility: { select: { id: true, name: true, shortName: true } }
          }
        }
      },
      orderBy: { inspectionDate: 'desc' }
    });

    res.json(inspections);
  } catch (error) {
    console.error('FM200 get inspections error:', error);
    res.status(500).json({ error: 'Denetim kayıtları yüklenemedi' });
  }
});

// Tek Denetim Detayı
router.get('/inspections/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const inspection = await prisma.fm200PeriodicInspection.findUnique({
      where: { id },
      include: {
        location: {
          include: {
            facility: true,
            cylinders: true
          }
        }
      }
    });

    if (!inspection) return res.status(404).json({ error: 'Denetim kaydı bulunamadı' });
    res.json(inspection);
  } catch (error) {
    console.error('FM200 get inspection detail error:', error);
    res.status(500).json({ error: 'Denetim detayı getirilemedi' });
  }
});

// Denetimi Güncelle / Edit Et (Mevcut Yanıtları ve Skorları Yeniden Hesapla)
router.put('/inspections/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { responses, notes, photos } = req.body;

    const existing = await prisma.fm200PeriodicInspection.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Denetim kaydı bulunamadı' });

    const settings = await prisma.fm200Setting.findUnique({ where: { id: 'default' } });
    const questions: any[] = (settings?.checklistQuestions as any[]) || DEFAULT_FM200_QUESTIONS;

    const GATEKEEPER_IDS = [4, 6, 8, 12, 13, 15];
    const SEALING_IDS = [4, 5, 6, 7, 8];

    let totalWeight = 0;
    let earnedWeight = 0;
    let totalSealingWeight = 0;
    let earnedSealingWeight = 0;
    let totalHardwareWeight = 0;
    let earnedHardwareWeight = 0;
    let isRedFlagged = false;

    for (const q of questions) {
      const qId = q.id;
      const resp = responses[qId] || responses[String(qId)] || { status: 'Karşılıyor' };
      const status = resp.status;

      if (status === 'Kapsam Dışı') continue;

      const weight = Number(q.weight) || 10;
      let multiplier = 0;
      if (status === 'Karşılıyor') multiplier = 1.0;
      else if (status === 'Kısmen Karşılıyor') multiplier = 0.5;
      else if (status === 'Karşılamıyor') multiplier = 0.0;

      const earned = weight * multiplier;
      totalWeight += weight;
      earnedWeight += earned;

      if (SEALING_IDS.includes(qId) || q.isSealing) {
        totalSealingWeight += weight;
        earnedSealingWeight += earned;
      } else {
        totalHardwareWeight += weight;
        earnedHardwareWeight += earned;
      }

      if (GATEKEEPER_IDS.includes(qId) && (status === 'Kısmen Karşılıyor' || status === 'Karşılamıyor')) {
        isRedFlagged = true;
      }
    }

    const overallScore = totalWeight > 0 ? Math.round((earnedWeight / totalWeight) * 1000) / 10 : 100;
    const sealingScore = totalSealingWeight > 0 ? Math.round((earnedSealingWeight / totalSealingWeight) * 1000) / 10 : 100;
    const hardwareScore = totalHardwareWeight > 0 ? Math.round((earnedHardwareWeight / totalHardwareWeight) * 1000) / 10 : 100;

    let riskLevel = 'DÜŞÜK RİSK';
    let ratingGrade = 'A';

    if (isRedFlagged || overallScore < 60 || sealingScore < 60) {
      riskLevel = 'YÜKSEK RİSK';
      ratingGrade = 'D';
    } else if (overallScore < 80 || sealingScore < 80) {
      riskLevel = 'ORTA RİSK';
      ratingGrade = 'C';
    } else if (overallScore < 95) {
      ratingGrade = 'B';
    }

    const inspectionStatus = req.body.status !== undefined ? req.body.status : existing.status;
    const isCompleted = req.body.isCompleted !== undefined 
      ? req.body.isCompleted 
      : (inspectionStatus === 'Tamamlandi');

    const updated = await prisma.fm200PeriodicInspection.update({
      where: { id },
      data: {
        locationId: req.body.locationId || existing.locationId,
        itemResponses: responses,
        complianceScore: overallScore,
        sealingScore,
        hardwareScore,
        ratingGrade,
        riskLevel,
        isRedFlagged,
        status: inspectionStatus,
        isCompleted,
        notes: notes !== undefined ? notes : existing.notes,
        photos: photos !== undefined ? photos : existing.photos
      },
      include: {
        location: {
          include: { facility: true }
        }
      }
    });

    res.json({
      success: true,
      inspection: updated,
      overallScore,
      sealingScore,
      hardwareScore,
      ratingGrade,
      riskLevel,
      isRedFlagged
    });
  } catch (error) {
    console.error('FM200 update inspection error:', error);
    res.status(500).json({ error: 'Denetim güncellenemedi' });
  }
});

// Denetim Kaydını Tamamen Sil
router.delete('/inspections/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const existing = await prisma.fm200PeriodicInspection.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Denetim kaydı bulunamadı' });

    // İlgili mahale ait bu fazdaki iş emirlerini temizle
    await prisma.fm200WorkOrder.deleteMany({
      where: {
        locationId: existing.locationId,
        sourcePhase: 'FAZ2'
      }
    });

    await prisma.fm200PeriodicInspection.delete({
      where: { id }
    });

    res.json({ success: true, message: 'Denetim kaydı ve bağlı kayıtlar başarıyla silindi' });
  } catch (error) {
    console.error('FM200 delete inspection error:', error);
    res.status(500).json({ error: 'Denetim kaydı silinemedi' });
  }
});

// Faz 2 Kaydet & Skor Hesapla (Geriye Dönük Uyumluluk)
router.post('/inspections/phase2', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, responses, notes, photos } = req.body;
    if (!locationId || !responses) {
      return res.status(400).json({ error: 'Konum ve yanıtlar zorunludur' });
    }

    // Eğer yeni 25 soru formatında geldiyse /inspections ile aynı hesaplamayı uygula
    const isNewFormat = Object.keys(responses).some(k => !isNaN(Number(k)) || k.startsWith('item_'));
    if (isNewFormat) {
      // Forward to same logic
      req.url = '/inspections';
      return (router as any).handle(req, res);
    }

    const user = req.user!;

    // Madde 2 Otomasyon kontrolü
    const openPhase2JobsCount = await prisma.fm200WorkOrder.count({
      where: {
        locationId,
        sourcePhase: 'FAZ2',
        status: { not: 'Tamamlandi' }
      }
    });
    responses['M02'] = {
      status: openPhase2JobsCount === 0 ? 'U' : 'UD',
      note: openPhase2JobsCount === 0
        ? 'Önceki dönem eksikliği bulunmuyor'
        : `Önceki dönemden devam eden ${openPhase2JobsCount} adet açık iş kaydı bulunmaktadır.`
    };

    let totalUdWeight = 0;
    let totalUyWeight = 0;
    let isRedFlagged = false;
    const openedJobs = [];

    for (let i = 1; i <= 26; i++) {
      const code = `M${String(i).padStart(2, '0')}`;
      const itemDef = PERIODIC_ITEMS_DEF[i];
      const resp = responses[code] || { status: 'U' };

      if (resp.status === 'UD') {
        totalUdWeight += itemDef.weight;
        if (i === 13 || i === 21) {
          isRedFlagged = true;
        }

        if (i !== 2) {
          openedJobs.push(await triggerWorkOrder({
            locationId,
            sourcePhase: 'FAZ2',
            sourceCode: code,
            title: resp.jobTitle || itemDef.defaultJob,
            workType: itemDef.workType,
            responsible: itemDef.responsible,
            trackLane: itemDef.trackLane
          }));
        }
      } else if (resp.status === 'UY') {
        totalUyWeight += itemDef.weight;
      }
    }

    const effectiveDenominator = Math.max(1, 100 - totalUyWeight);
    let complianceScore = Math.max(0, Math.min(100, Math.round((100 - (totalUdWeight / effectiveDenominator) * 100) * 10) / 10));

    let ratingGrade = 'A';
    if (complianceScore >= 95) ratingGrade = 'A';
    else if (complianceScore >= 80) ratingGrade = 'B';
    else if (complianceScore >= 60) ratingGrade = 'C';
    else ratingGrade = 'D';

    const inspection = await prisma.fm200PeriodicInspection.create({
      data: {
        locationId,
        inspectedBy: user.fullName || user.username,
        itemResponses: responses,
        complianceScore,
        sealingScore: complianceScore,
        hardwareScore: complianceScore,
        ratingGrade,
        riskLevel: isRedFlagged ? 'YÜKSEK RİSK' : (complianceScore < 70 ? 'ORTA RİSK' : 'DÜŞÜK RİSK'),
        isRedFlagged,
        openWorkOrdersCount: openedJobs.length,
        notes: notes || null,
        photos: photos || []
      }
    });

    res.json({
      success: true,
      inspection,
      complianceScore,
      ratingGrade,
      isRedFlagged,
      openedJobsCount: openedJobs.length,
      openedJobs
    });
  } catch (error) {
    console.error('FM200 phase2 error:', error);
    res.status(500).json({ error: 'Faz 2 periyodik kontrol kaydedilemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// FAZ 3 — 6 AYLIK BAKIM (TÜP BAZLI ÇOKLU DEĞERLENDİRME)
// ──────────────────────────────────────────────────────────────────────────────
router.post('/maintenances/phase3', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, cylinderChecks, panelControlStatus, panelNotes, notes, photos } = req.body;
    if (!locationId || !Array.isArray(cylinderChecks)) {
      return res.status(400).json({ error: 'Konum ve tüp kontrolleri zorunludur' });
    }

    const user = req.user!;
    const maintenance = await prisma.fm200Maintenance.create({
      data: {
        locationId,
        performedBy: user.fullName || user.username,
        panelControlStatus: panelControlStatus || 'U',
        panelNotes: panelNotes || null,
        notes: notes || null,
        photos: photos || []
      }
    });

    const location = await prisma.fm200Location.findUnique({
      where: { id: locationId },
      include: { cylinders: true }
    });

    const openedJobs = [];

    for (const chk of cylinderChecks) {
      await prisma.fm200MaintenanceCylinder.create({
        data: {
          maintenanceId: maintenance.id,
          cylinderId: chk.cylinderId,
          govde: chk.govde || 'U',
          muhur: chk.muhur || 'U',
          basinc: chk.basinc || 'U',
          emniyet: chk.emniyet || 'U',
          notes: chk.notes || null
        }
      });

      const cyl = location?.cylinders.find(c => c.id === chk.cylinderId);
      const cylLabel = cyl ? `${cyl.labelCode} (SN: ${cyl.serialNumber})` : 'Tüp';

      if (chk.govde === 'UD') {
        openedJobs.push(await triggerWorkOrder({
          locationId,
          cylinderId: chk.cylinderId,
          sourcePhase: 'FAZ3',
          sourceCode: 'F3-GOVDE',
          title: `${location?.roomType} #${location?.index} bünyesindeki ${cylLabel} için: Gövdede hasar/korozyon tespit edildi; hidrostatik test veya değişim yapılması.`,
          workType: 'Buyuk',
          responsible: 'Firma',
          trackLane: 'Fiziksel'
        }));
      }

      if (chk.muhur === 'UD') {
        openedJobs.push(await triggerWorkOrder({
          locationId,
          cylinderId: chk.cylinderId,
          sourcePhase: 'FAZ3',
          sourceCode: 'F3-MUHUR',
          title: `${location?.roomType} #${location?.index} bünyesindeki ${cylLabel} için: Emniyet mührü kopuk/hasarlı; vana kontrolü ve yeniden mühürleme.`,
          workType: 'Kucuk',
          responsible: 'Firma',
          trackLane: 'Fiziksel'
        }));
      }

      if (chk.basinc === 'UD') {
        openedJobs.push(await triggerWorkOrder({
          locationId,
          cylinderId: chk.cylinderId,
          sourcePhase: 'FAZ3',
          sourceCode: 'F3-BASINC',
          title: `${location?.roomType} #${location?.index} bünyesindeki ${cylLabel} için: Basınç kaybı tespit edildi; gaz dolumu ve sızdırmazlık onarımı.`,
          workType: 'Buyuk',
          responsible: 'Firma',
          trackLane: 'Fiziksel'
        }));
      }

      if (chk.emniyet === 'UD') {
        openedJobs.push(await triggerWorkOrder({
          locationId,
          cylinderId: chk.cylinderId,
          sourcePhase: 'FAZ3',
          sourceCode: 'F3-EMNIYET',
          title: `${location?.roomType} #${location?.index} bünyesindeki ${cylLabel} için: Emniyet tertibatında uygunsuzluk giderilmesi.`,
          workType: 'Buyuk',
          responsible: 'Firma',
          trackLane: 'Fiziksel'
        }));
      }
    }

    // Panel & Hat arızası varsa iş aç
    if (panelControlStatus === 'UD') {
      openedJobs.push(await triggerWorkOrder({
        locationId,
        sourcePhase: 'FAZ3',
        sourceCode: 'F3-PANEL',
        title: `${location?.roomType} #${location?.index} söndürme paneli ve tetikleme hatlarında arıza onarımı.`,
        workType: 'Buyuk',
        responsible: 'Firma',
        trackLane: 'Fiziksel'
      }));
    }

    res.json({
      success: true,
      maintenance,
      openedJobsCount: openedJobs.length,
      openedJobs
    });
  } catch (error) {
    console.error('FM200 phase3 error:', error);
    res.status(500).json({ error: 'Faz 3 bakımı kaydedilemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// FAZ 4 — SIZDIRMAZLIK TESTİ (SOFT-LOCK & GEREKÇELİ GİRİŞ)
// ──────────────────────────────────────────────────────────────────────────────

// Açık Fiziksel İşleri ve Soft-Lock Durumunu Sorgula
router.get('/tests/soft-lock-status/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId } = req.params;
    const openPhysicalJobs = await prisma.fm200WorkOrder.findMany({
      where: {
        locationId,
        trackLane: 'Fiziksel',
        status: { not: 'Tamamlandi' }
      }
    });

    const isLocked = openPhysicalJobs.length > 0;
    res.json({
      isLocked,
      openPhysicalCount: openPhysicalJobs.length,
      openPhysicalJobs,
      message: isLocked
        ? `Bu mahalde ${openPhysicalJobs.length} adet açık fiziksel sızdırmazlık işi bulunmaktadır. Testin başarısız olma ihtimali yüksektir.`
        : 'Fiziksel yol tamamlanmış durumda. Test formuna doğrudan geçebilirsiniz.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Soft-lock kontrolü yapılamadı' });
  }
});

// Testi Kaydet
router.post('/tests/phase4', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const {
      locationId, testDate, retentionTimeMinutes, measuredValue,
      result, isUnconditional, overrideReason, reportUrl, notes, photos
    } = req.body;

    if (!locationId || !result) {
      return res.status(400).json({ error: 'Konum ve test sonucu zorunludur' });
    }

    const user = req.user!;
    const parsedTestDate = testDate ? new Date(testDate) : new Date();

    let nextTestDate: Date | null = null;
    if (result === 'Gecti') {
      nextTestDate = new Date(parsedTestDate);
      nextTestDate.setDate(nextTestDate.getDate() + 365);
    }

    const test = await prisma.fm200TightnessTest.create({
      data: {
        locationId,
        performedBy: user.fullName || user.username,
        testDate: parsedTestDate,
        retentionTimeMinutes: retentionTimeMinutes ? parseFloat(retentionTimeMinutes) : null,
        measuredValue: measuredValue ? parseFloat(measuredValue) : null,
        result,
        isUnconditional: !!isUnconditional,
        overrideReason: overrideReason || null,
        reportUrl: reportUrl || null,
        nextTestDate,
        notes: notes || null,
        photos: photos || []
      }
    });

    let openedJob = null;
    // Eğer Test Kaldı ise otomatik iş aç (Bölüm 7.1)
    if (result === 'Kaldi') {
      openedJob = await triggerWorkOrder({
        locationId,
        sourcePhase: 'FAZ4',
        sourceCode: 'F4-TEST',
        title: 'Sızdırmazlık testinden geçilemedi; sızıntı noktalarının tespiti, izolasyonu ve testin tekrarlanması.',
        workType: 'Buyuk',
        responsible: 'Firma',
        trackLane: 'Fiziksel'
      });
    }

    res.json({
      success: true,
      test,
      openedJob
    });
  } catch (error) {
    console.error('FM200 phase4 error:', error);
    res.status(500).json({ error: 'Sızdırmazlık testi kaydedilemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// İŞ YÖNETİMİ & KANITLI ONAY DÖNGÜSÜ (Bölüm 8 & 9)
// ──────────────────────────────────────────────────────────────────────────────

// Tüm işleri veya filtreli listele
router.get('/work-orders', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, locationId, status, trackLane, responsible } = req.query;
    const where: any = {};

    if (locationId) {
      where.locationId = String(locationId);
    } else if (facilityId && facilityId !== 'all') {
      where.location = { facilityId: String(facilityId) };
    }

    if (status && status !== 'all') where.status = String(status);
    if (trackLane && trackLane !== 'all') where.trackLane = String(trackLane);
    if (responsible && responsible !== 'all') where.responsible = String(responsible);

    const workOrders = await prisma.fm200WorkOrder.findMany({
      where,
      include: {
        location: {
          select: {
            id: true, systemUid: true, roomType: true, index: true,
            building: true, block: true, floor: true, customRoomName: true,
            facility: { select: { id: true, name: true, shortName: true } }
          }
        },
        cylinder: true,
        evidences: true
      },
      orderBy: [{ repeatCount: 'desc' }, { createdAt: 'desc' }]
    });

    res.json(workOrders);
  } catch (error) {
    console.error('FM200 get work orders error:', error);
    res.status(500).json({ error: 'İş emirleri getirilemedi' });
  }
});

// Saha / Firma: Kanıt Ekle ve "Uygulandı" Yap
router.post('/work-orders/:id/action', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { evidences, companyTrackNo } = req.body;
    const user = req.user!;

    const job = await prisma.fm200WorkOrder.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'İş kaydı bulunamadı' });

    // Kanıtları kaydet
    if (Array.isArray(evidences) && evidences.length > 0) {
      for (const ev of evidences) {
        await prisma.fm200WorkOrderEvidence.create({
          data: {
            workOrderId: id,
            fileType: ev.fileType || 'Foto_Sonrasi',
            fileUrl: ev.fileUrl,
            fileName: ev.fileName || 'Kanıt',
            uploadedBy: user.fullName || user.username
          }
        });
      }
    }

    // Durumu Uygulandi yap
    const updated = await prisma.fm200WorkOrder.update({
      where: { id },
      data: {
        status: 'Uygulandi',
        companyTrackNo: companyTrackNo !== undefined ? companyTrackNo : job.companyTrackNo,
        revisionNote: null
      },
      include: { evidences: true }
    });

    res.json({ success: true, workOrder: updated });
  } catch (error) {
    console.error('FM200 work order action error:', error);
    res.status(500).json({ error: 'İşlem kaydedilemedi' });
  }
});

// Teknik Sorumlu: Onayla (Tamamlandı) VEYA Reddet (Revize_Gerekli) VEYA Yeni Fiziksel İş Doğur
router.post('/work-orders/:id/verify', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { decision, revisionNote, createPhysicalFollowUp, followUpTitle } = req.body;

    const job = await prisma.fm200WorkOrder.findUnique({ where: { id } });
    if (!job) return res.status(404).json({ error: 'İş kaydı bulunamadı' });

    if (decision === 'Tamamlandi') {
      const updated = await prisma.fm200WorkOrder.update({
        where: { id },
        data: {
          status: 'Tamamlandi',
          correctApproval: true,
          closedAt: new Date(),
          revisionNote: null
        }
      });

      // Yol Dönüşümü (Bölüm 9.2): Doküman işi kapatılırken sahada fiziksel iş gerekiyorsa yeni iş aç
      let followUpJob = null;
      if (createPhysicalFollowUp && followUpTitle) {
        followUpJob = await prisma.fm200WorkOrder.create({
          data: {
            locationId: job.locationId,
            sourcePhase: job.sourcePhase,
            sourceCode: `${job.sourceCode}-FIZ`,
            title: followUpTitle,
            workType: 'Buyuk',
            responsible: 'Firma',
            trackLane: 'Fiziksel',
            status: 'Planlandi',
            sourceWorkId: job.id
          }
        });
      }

      return res.json({ success: true, workOrder: updated, followUpJob });
    } else if (decision === 'Revize_Gerekli') {
      if (!revisionNote) {
        return res.status(400).json({ error: 'Düzeltme talep ederken revizyon notu girilmesi zorunludur' });
      }
      const updated = await prisma.fm200WorkOrder.update({
        where: { id },
        data: {
          status: 'Revize_Gerekli',
          revisionNote,
          correctApproval: false
        }
      });
      return res.json({ success: true, workOrder: updated });
    } else {
      return res.status(400).json({ error: 'Geçersiz karar' });
    }
  } catch (error) {
    console.error('FM200 verify work order error:', error);
    res.status(500).json({ error: 'Doğrulama işlemi başarısız' });
  }
});

// İş Emri Bilgilerini Güncelle (Termin Tarihi / Sorumlu / Not / Durum)
router.put('/work-orders/:id', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { dueDate, responsible, status, title, revisionNote, companyTrackNo } = req.body;

    const existing = await prisma.fm200WorkOrder.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'İş kaydı bulunamadı' });

    const updated = await prisma.fm200WorkOrder.update({
      where: { id },
      data: {
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existing.dueDate,
        responsible: responsible !== undefined ? responsible : existing.responsible,
        status: status !== undefined ? status : existing.status,
        title: title !== undefined ? title : existing.title,
        revisionNote: revisionNote !== undefined ? revisionNote : existing.revisionNote,
        companyTrackNo: companyTrackNo !== undefined ? companyTrackNo : existing.companyTrackNo,
        closedAt: status === 'Tamamlandi' ? new Date() : (status ? null : existing.closedAt)
      },
      include: {
        location: {
          select: {
            id: true, systemUid: true, roomType: true, index: true,
            building: true, block: true, floor: true,
            facility: { select: { id: true, name: true, shortName: true } }
          }
        },
        evidences: true
      }
    });

    res.json({ success: true, workOrder: updated });
  } catch (error) {
    console.error('FM200 update work order error:', error);
    res.status(500).json({ error: 'İş emri güncellenemedi' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// DASHBOARD & KPI İSTATİSTİKLERİ (Bölüm 11)
// ──────────────────────────────────────────────────────────────────────────────
router.get('/dashboard-stats', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;
    const locationWhere: any = { isActive: true };
    const workOrderWhere: any = {};

    if (facilityId && facilityId !== 'all') {
      locationWhere.facilityId = String(facilityId);
      workOrderWhere.location = { facilityId: String(facilityId) };
    }

    const totalLocations = await prisma.fm200Location.count({ where: locationWhere });
    const totalCylinders = await prisma.fm200Cylinder.count({
      where: { location: locationWhere }
    });

    const workOrders = await prisma.fm200WorkOrder.findMany({
      where: workOrderWhere,
      select: { id: true, status: true, trackLane: true, repeatCount: true, sourceCode: true }
    });

    const totalWorks = workOrders.length;
    const completedWorks = workOrders.filter(w => w.status === 'Tamamlandi').length;
    const openWorks = totalWorks - completedWorks;
    const physicalOpen = workOrders.filter(w => w.trackLane === 'Fiziksel' && w.status !== 'Tamamlandi').length;
    const docOpen = workOrders.filter(w => w.trackLane === 'Dokuman' && w.status !== 'Tamamlandi').length;
    const reviewPending = workOrders.filter(w => w.status === 'Uygulandi').length;
    const escalatedCount = workOrders.filter(w => w.repeatCount > 1 && w.status !== 'Tamamlandi').length;

    // Aksiyon Kapatma Başarı Oranı (%)
    const workSuccessRate = totalWorks === 0 ? 100 : Math.round((completedWorks / totalWorks) * 100);

    // Son Denetim Kayıtları (Mahal bazında en güncel olanları al)
    const allInspections = await prisma.fm200PeriodicInspection.findMany({
      where: { location: locationWhere },
      include: {
        location: {
          select: {
            id: true, systemUid: true, building: true, block: true, floor: true,
            roomType: true, customRoomName: true, facilityId: true,
            facility: { select: { id: true, name: true, shortName: true } }
          }
        }
      },
      orderBy: { inspectionDate: 'desc' }
    });

    // Her mahal için sadece en son denetimi baz al
    const latestInspectionByLoc = new Map<string, any>();
    allInspections.forEach(insp => {
      if (!latestInspectionByLoc.has(insp.locationId)) {
        latestInspectionByLoc.set(insp.locationId, insp);
      }
    });

    const activeInspections = Array.from(latestInspectionByLoc.values());

    // 5 Ana Kategori İndeksi
    // 1. Fiziksel Güvenlik & Sızdırmazlık (1-8)
    // 2. Etiketleme ve İşaretleme (9-11)
    // 3. Tesisat ve Donanım (12-19)
    // 4. Periyodik Kontrol & Bakım (20-21)
    // 5. Acil Durum Senaryoları & Otomasyon (22-25)
    const CATEGORIES = [
      { name: 'Fiziksel Güvenlik ve Ortam (Sızdırmazlık)', questionIds: [1, 2, 3, 4, 5, 6, 7, 8], isSealing: true },
      { name: 'Etiketleme ve İşaretleme', questionIds: [9, 10, 11], isSealing: false },
      { name: 'Tesisat ve Donanım Bütünlüğü', questionIds: [12, 13, 14, 15, 16, 17, 18, 19], isSealing: false },
      { name: 'Periyodik Kontrol & Bakım Kayıtları', questionIds: [20, 21], isSealing: false },
      { name: 'Acil Durum Senaryoları & Otomasyon', questionIds: [22, 23, 24, 25], isSealing: false }
    ];

    // Soruların ağırlık referansları
    const questionWeights: Record<number, number> = {
      1: 7, 2: 7, 3: 10, 4: 10, 5: 10, 6: 10, 7: 10, 8: 10,
      9: 10, 10: 10, 11: 3,
      12: 10, 13: 5, 14: 5, 15: 10, 16: 10, 17: 10, 18: 7, 19: 7,
      20: 10, 21: 10,
      22: 10, 23: 10, 24: 10, 25: 7
    };

    const GATEKEEPER_BARRIERS = [4, 6, 8, 12, 13, 15];

    // 5 Kategori İstatistiklerini Topla
    const categoryStats = CATEGORIES.map(cat => {
      let catEarned = 0;
      let catApplicable = 0;

      activeInspections.forEach(insp => {
        const respMap = (insp.itemResponses || {}) as Record<string, any>;
        cat.questionIds.forEach(qId => {
          const resp = respMap[qId] || respMap[`item_${qId}`];
          const weight = questionWeights[qId] || 10;
          if (!resp || resp.status === 'Kapsam Dışı') return;

          catApplicable += weight;
          if (resp.status === 'Karşılıyor') {
            catEarned += weight;
          } else if (resp.status === 'Kısmen Karşılıyor') {
            catEarned += weight * 0.5;
          }
        });
      });

      const score = catApplicable > 0 ? Math.round((catEarned / catApplicable) * 1000) / 10 : 100;
      return {
        name: cat.name,
        isSealing: cat.isSealing,
        score,
        applicableWeight: catApplicable,
        earnedWeight: catEarned
      };
    });

    // Hastane Genel Uygunluk Skoru (Aktif denetimlerin ağırlıklı ortalaması)
    let hospitalEarnedWeight = 0;
    let hospitalApplicableWeight = 0;
    let criticalVetoLocationsCount = 0;

    const inspectedLocationsList = activeInspections.map(insp => {
      const respMap = (insp.itemResponses || {}) as Record<string, any>;
      let hasVeto = false;
      const vetoReasons: string[] = [];

      GATEKEEPER_BARRIERS.forEach(barrierId => {
        const r = respMap[barrierId] || respMap[`item_${barrierId}`];
        if (r && (r.status === 'Kısmen Karşılıyor' || r.status === 'Karşılamıyor')) {
          hasVeto = true;
          if (barrierId === 4) vetoReasons.push('Madde 4: Tesisat Geçişi / Sızdırmazlık Açıklığı');
          else if (barrierId === 6) vetoReasons.push('Madde 6: Yangın Damperi / Havalandırma Kapanmıyor');
          else if (barrierId === 8) vetoReasons.push('Madde 8: Door Fan Test / Oda Bütünlüğü Eksik');
          else if (barrierId === 12) vetoReasons.push('Madde 12: Tüp Basıncı / Manometre Uygunsuz');
          else if (barrierId === 13) vetoReasons.push('Madde 13: Sistem Otomatik Modda Değil');
          else if (barrierId === 15) vetoReasons.push('Madde 15: Nozul Atış Önünde Engel Var');
        }
      });

      if (hasVeto || insp.isRedFlagged) {
        criticalVetoLocationsCount++;
      }

      // Skor hesaplama
      let locEarned = 0;
      let locApplicable = 0;
      for (let q = 1; q <= 25; q++) {
        const r = respMap[q] || respMap[`item_${q}`];
        const w = questionWeights[q] || 10;
        if (!r || r.status === 'Kapsam Dışı') continue;
        locApplicable += w;
        if (r.status === 'Karşılıyor') locEarned += w;
        else if (r.status === 'Kısmen Karşılıyor') locEarned += w * 0.5;
      }

      // Kategori bazlı skorları bu mahal için hesapla
      const locationCategoryScores: Record<number, number> = {};
      CATEGORIES.forEach((cat, catIdx) => {
        let catEarned = 0;
        let catApplicable = 0;
        cat.questionIds.forEach(qId => {
          const r = respMap[qId] || respMap[String(qId)] || respMap[`item_${qId}`];
          const w = questionWeights[qId] || 10;
          if (!r || r.status === 'Kapsam Dışı') return;
          catApplicable += w;
          if (r.status === 'Karşılıyor') catEarned += w;
          else if (r.status === 'Kısmen Karşılıyor') catEarned += w * 0.5;
        });
        locationCategoryScores[catIdx] = catApplicable > 0 ? Math.round((catEarned / catApplicable) * 1000) / 10 : 100;
      });

      const standardScore = locApplicable > 0 ? Math.round((locEarned / locApplicable) * 1000) / 10 : insp.complianceScore;
      hospitalEarnedWeight += locEarned;
      hospitalApplicableWeight += locApplicable;

      return {
        id: insp.id,
        locationId: insp.locationId,
        systemUid: insp.location?.systemUid,
        roomType: insp.location?.roomType,
        customRoomName: insp.location?.customRoomName,
        building: insp.location?.building,
        block: insp.location?.block,
        floor: insp.location?.floor,
        facilityId: insp.location?.facilityId,
        facility: insp.location?.facility,
        complianceScore: standardScore,
        sealingScore: insp.sealingScore,
        categoryScores: locationCategoryScores,
        isVetoed: hasVeto || insp.isRedFlagged,
        vetoReasons,
        riskLevel: hasVeto ? 'KRİTİK UYGUNSUZ (VETO)' : insp.riskLevel,
        inspectionDate: insp.inspectionDate
      };
    });

    const hospitalOverallScore = hospitalApplicableWeight > 0
      ? Math.round((hospitalEarnedWeight / hospitalApplicableWeight) * 1000) / 10
      : (activeInspections.length > 0 ? Math.round(activeInspections.reduce((a, b) => a + b.complianceScore, 0) / activeInspections.length) : 100);

    // Tesisler Bazında Konsolide İstatistikler (Tüm Tesisler seçildiğinde kıyaslama için)
    const facilityMap = new Map<string, {
      facilityId: string;
      facilityName: string;
      shortName?: string;
      totalInspected: number;
      vetoCount: number;
      earnedSum: number;
      applicableSum: number;
      categoryEarned: number[];
      categoryApplicable: number[];
    }>();

    inspectedLocationsList.forEach(loc => {
      const fId = loc.facilityId || 'unknown';
      const fName = loc.facility?.name || 'Tesis';
      const sName = loc.facility?.shortName || fName;

      if (!facilityMap.has(fId)) {
        facilityMap.set(fId, {
          facilityId: fId,
          facilityName: fName,
          shortName: sName,
          totalInspected: 0,
          vetoCount: 0,
          earnedSum: 0,
          applicableSum: 0,
          categoryEarned: [0, 0, 0, 0, 0],
          categoryApplicable: [0, 0, 0, 0, 0]
        });
      }

      const fData = facilityMap.get(fId)!;
      fData.totalInspected++;
      if (loc.isVetoed) fData.vetoCount++;

      // Kategori skorlarını topla
      CATEGORIES.forEach((_, cIdx) => {
        const cScore = loc.categoryScores?.[cIdx] ?? 100;
        fData.categoryEarned[cIdx] += cScore;
        fData.categoryApplicable[cIdx] += 1;
      });

      fData.earnedSum += loc.complianceScore;
      fData.applicableSum += 1;
    });

    const facilityStats = Array.from(facilityMap.values()).map(f => {
      const overallScore = f.applicableSum > 0 ? Math.round((f.earnedSum / f.applicableSum) * 10) / 10 : 100;
      const categoryScores: number[] = f.categoryEarned.map((sum, i) => {
        const count = f.categoryApplicable[i];
        return count > 0 ? Math.round((sum / count) * 10) / 10 : 100;
      });

      return {
        facilityId: f.facilityId,
        facilityName: f.facilityName,
        shortName: f.shortName,
        overallScore,
        vetoCount: f.vetoCount,
        totalInspected: f.totalInspected,
        categoryScores
      };
    });

    // En Kötü / Müdahale Gerektiren Odalar (Skoru en düşük veya Veto yemişler en başta)
    const worstLocations = [...inspectedLocationsList]
      .sort((a, b) => {
        if (a.isVetoed && !b.isVetoed) return -1;
        if (!a.isVetoed && b.isVetoed) return 1;
        return a.complianceScore - b.complianceScore;
      })
      .slice(0, 8);

    // Kat Bazında Risk & Skor Hiyerarşisi
    const floorGroups: Record<string, { total: number; sumScore: number; vetoCount: number; building: string; block: string; floor: string }> = {};
    inspectedLocationsList.forEach(loc => {
      const key = `${loc.building || 'Bina'}_${loc.block || 'Blok'}_${loc.floor || 'Kat'}`;
      if (!floorGroups[key]) {
        floorGroups[key] = {
          total: 0,
          sumScore: 0,
          vetoCount: 0,
          building: loc.building || 'Ana Bina',
          block: loc.block || '',
          floor: loc.floor || 'Zemin Kat'
        };
      }
      floorGroups[key].total++;
      floorGroups[key].sumScore += loc.complianceScore;
      if (loc.isVetoed) floorGroups[key].vetoCount++;
    });

    const floorHierarchy = Object.values(floorGroups)
      .map(fg => ({
        building: fg.building,
        block: fg.block,
        floor: fg.floor,
        count: fg.total,
        vetoCount: fg.vetoCount,
        avgScore: Math.round((fg.sumScore / fg.total) * 10) / 10
      }))
      .sort((a, b) => a.avgScore - b.avgScore);

    // Sızdırmazlık Testi İstatistikleri
    const tests = await prisma.fm200TightnessTest.findMany({
      where: { location: locationWhere },
      orderBy: { testDate: 'desc' }
    });
    const passedTests = tests.filter(t => t.result === 'Gecti').length;
    const failedTests = tests.filter(t => t.result === 'Kaldi').length;

    res.json({
      totalLocations,
      totalCylinders,
      totalWorks,
      completedWorks,
      openWorks,
      physicalOpen,
      docOpen,
      reviewPending,
      escalatedCount,
      workSuccessRate,
      hospitalOverallScore,
      avgScore: hospitalOverallScore,
      criticalVetoLocationsCount,
      inspectedLocationsCount: activeInspections.length,
      categoryStats,
      facilityStats,
      worstLocations,
      allInspectedLocations: inspectedLocationsList,
      floorHierarchy,
      passedTests,
      failedTests
    });
  } catch (error) {
    console.error('FM200 dashboard stats error:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

export default router;
