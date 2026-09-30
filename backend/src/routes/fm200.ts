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
          systemTypes: ['FM-200', 'Novec1230', 'CO2', 'Inergen']
        }
      });
    }
    res.json(setting);
  } catch (error) {
    console.error('FM200 get settings error:', error);
    res.status(500).json({ error: 'Ayarlar getirilemedi' });
  }
});

router.put('/settings', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { roomTypes, systemTypes } = req.body;
    const updated = await prisma.fm200Setting.upsert({
      where: { id: 'default' },
      update: {
        ...(roomTypes && { roomTypes }),
        ...(systemTypes && { systemTypes })
      },
      create: {
        id: 'default',
        roomTypes: roomTypes || DEFAULT_ROOM_TYPES,
        systemTypes: systemTypes || ['FM-200', 'Novec1230', 'CO2', 'Inergen']
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

// Otomatik İndeks ve UID Üretici Yardımcı Fonksiyonu
const generateLocationUid = async (facilityId: string, building: string, floor: string, roomType: string) => {
  const fac = await prisma.facility.findUnique({
    where: { id: facilityId },
    select: { shortName: true, name: true }
  });
  const facCode = (fac?.shortName || fac?.name || 'TES').toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) || 'TES01';
  
  // Aynı tesiste bu mahal tipindeki mevcut konum sayısı
  const count = await prisma.fm200Location.count({
    where: { facilityId, roomType }
  });
  const nextIndex = count + 1;

  // Mahal kodu kısaltması
  const mapCode: Record<string, string> = {
    'Sunucu Odası': 'SO', 'Sistem Odası': 'SO', 'UPS Odası': 'UPS', 'Trafo Odası': 'TRF',
    'Arşiv Odası': 'ARS', 'MCC Panosu': 'MCC', 'ADP Pano Odası': 'ADP', 'Elektrik Panosu': 'EP',
    'Kat Panosu': 'KP', 'Radyoloji Odası': 'RAD', 'Hücre Odası': 'HCR', 'CCTV Odası': 'CCTV',
    'Bedaş Odası': 'BDS', 'Anjiyo Odası': 'ANJ', 'Jeneratör Odası': 'JEN', 'Diğer': 'DGR'
  };
  const typeCode = mapCode[roomType] || 'MAH';
  const cleanBuilding = building.replace(/[^A-Z0-9]/gi, '').substring(0, 3).toUpperCase() || 'B1';
  const cleanFloor = floor.replace(/[^A-Z0-9]/gi, '').substring(0, 3).toUpperCase() || 'K0';
  const paddedIndex = String(nextIndex).padStart(3, '0');

  const systemUid = `${facCode}-${cleanBuilding}-${cleanFloor}-${typeCode}-${paddedIndex}`;
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
      floor || 'Zemin',
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
      orderBy: [{ building: 'asc' }, { block: 'asc' }, { floor: 'asc' }]
    });
    res.json(items);
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
          building: building || 'Ana Bina',
          block: block || null,
          floor
        }
      },
      update: {},
      create: {
        facilityId,
        building: building || 'Ana Bina',
        block: block || null,
        floor
      }
    });
    res.json(item);
  } catch (error) {
    console.error('FM200 create building floor error:', error);
    res.status(500).json({ error: 'Bina/Kat kaydedilemedi' });
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
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': 'Zemin Kat'
      },
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'A Blok',
        'Kat': '1.Kat'
      },
      {
        'Tesis Adı': 'MP Adana',
        'Bina': 'Ana Bina',
        'Blok': 'B Blok',
        'Kat': 'B1.Kat'
      },
      {
        'Tesis Adı': 'Liv Gaziantep',
        'Bina': 'Ana Bina',
        'Blok': 'Ana Bina',
        'Kat': 'Zemin Kat'
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
      const rawFacilityName = (row['Tesis Adı'] || row['Tesis'] || '').toString().trim();
      const building = (row['Bina'] || 'Ana Bina').toString().trim();
      const block = row['Blok'] ? row['Blok'].toString().trim() : null;
      const floor = (row['Kat'] || '').toString().trim();

      if (!floor) continue;

      let targetFacilityId = facilityId;
      if (rawFacilityName) {
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

      if (!targetFacilityId) {
        errors.push(`Satır ${i + 2}: Tesis adı ("${rawFacilityName}") eşleştirilemedi.`);
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
    // Eskalasyon: tekrar sayacını artır
    return await prisma.fm200WorkOrder.update({
      where: { id: existing.id },
      data: {
        repeatCount: existing.repeatCount + 1,
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
        repeatCount: 1
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

// Faz 2 Kaydet & Skor Hesapla
router.post('/inspections/phase2', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { locationId, responses, notes, photos } = req.body;
    if (!locationId || !responses) {
      return res.status(400).json({ error: 'Konum ve yanıtlar zorunludur' });
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

    // Matematiksel Model ve Skor Hesabı (Bölüm 11.3 & Bölüm 15)
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
        // Gatekeeper Kuralı (M13 ve M21)
        if (i === 13 || i === 21) {
          isRedFlagged = true;
        }

        // Otomatik İş Emri Aç (Madde 2 hariç, çünkü zaten devam eden işler var)
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

    // Skor Hesabı: Uygunluk Skoru (%) = 100 - [ (Toplam UD / (100 - Toplam UY)) * 100 ]
    const effectiveDenominator = Math.max(1, 100 - totalUyWeight);
    let complianceScore = Math.max(0, Math.min(100, Math.round((100 - (totalUdWeight / effectiveDenominator) * 100) * 10) / 10));

    // Derece: A (%95-100), B (%80-94), C (%60-79), D (%0-59)
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
        ratingGrade,
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
            building: true, floor: true,
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

    // Son Periyodik Kontrollerin Ortalama Skoru ve Gatekeeper Kırmızı Bayraklar
    const recentInspections = await prisma.fm200PeriodicInspection.findMany({
      where: { location: locationWhere },
      orderBy: { inspectionDate: 'desc' }
    });

    const avgScore = recentInspections.length > 0
      ? Math.round(recentInspections.reduce((acc, i) => acc + i.complianceScore, 0) / recentInspections.length)
      : 100;

    const redFlaggedCount = recentInspections.filter(i => i.isRedFlagged).length;

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
      avgScore,
      redFlaggedCount,
      passedTests,
      failedTests
    });
  } catch (error) {
    console.error('FM200 dashboard stats error:', error);
    res.status(500).json({ error: 'İstatistikler yüklenemedi' });
  }
});

export default router;
