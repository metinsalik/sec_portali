import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';

const router = Router();
const prisma = new PrismaClient();

// Multer storage for evidence photos and documents
const uploadDir = path.join(process.cwd(), 'uploads', 'electric-infrastructure');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, uploadDir);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'evidence-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 20 * 1024 * 1024 } // 20MB limit
});

// Middleware to check if user has access to ELECTRIC_INFRASTRUCTURE module
const requireModuleAccess = (req: any, res: any, next: any) => {
  const user = req.user;
  const hasAccess =
    user?.roles?.includes('admin') ||
    user?.roles?.includes('management') ||
    user?.modules?.includes('ELECTRIC_INFRASTRUCTURE');

  if (!hasAccess) {
    return res.status(403).json({ error: 'Bu modüle erişim yetkiniz yok.' });
  }
  next();
};

router.use(authMiddleware, requireModuleAccess);

// Standart 14 Excel ekipman listesi (Hızlı başlangıç için)
const DEFAULT_EQUIPMENT_TEMPLATES = [
  { orderIndex: 1, equipmentCategory: 'Ana Dağıtım Panosu (ADP)', equipmentCodeName: 'ADP-01', locationDescription: 'Trafo / Ana Elektrik Odası' },
  { orderIndex: 2, equipmentCategory: 'ADP odası', equipmentCodeName: 'ADP Odası Genel', locationDescription: 'Bodrum Kat' },
  { orderIndex: 3, equipmentCategory: 'Kat panosu', equipmentCodeName: 'Kat Panosu 1', locationDescription: '1. Kat Koridor' },
  { orderIndex: 4, equipmentCategory: 'Tali elektrik panosu', equipmentCodeName: 'Tali Pano 01', locationDescription: 'Teknik Hacim' },
  { orderIndex: 5, equipmentCategory: 'MCC / mekanik pano', equipmentCodeName: 'MCC-01 Kazan/Klima', locationDescription: 'Kazan Dairesi' },
  { orderIndex: 6, equipmentCategory: 'Kompanzasyon panosu', equipmentCodeName: 'Kompanzasyon-01', locationDescription: 'Ana Pano Odası' },
  { orderIndex: 7, equipmentCategory: 'UPS giriş-çıkış panosu', equipmentCodeName: 'UPS Pano-01', locationDescription: 'UPS Odası' },
  { orderIndex: 8, equipmentCategory: 'UPS cihazı / akü odası', equipmentCodeName: 'UPS Cihazı & Akü Grubu', locationDescription: 'Sistem Odası' },
  { orderIndex: 9, equipmentCategory: 'Trafo', equipmentCodeName: 'Trafo-01', locationDescription: 'Trafo Binası' },
  { orderIndex: 10, equipmentCategory: 'OG hücre', equipmentCodeName: 'OG Hücre Grubu', locationDescription: 'OG Odası' },
  { orderIndex: 11, equipmentCategory: 'Jeneratör', equipmentCodeName: 'Jeneratör-01', locationDescription: 'Jeneratör Dairesi / Bahçe' },
  { orderIndex: 12, equipmentCategory: 'Jeneratör panosu / ATS', equipmentCodeName: 'ATS Transfer Panosu', locationDescription: 'Jeneratör Yanı' },
  { orderIndex: 13, equipmentCategory: 'Kablo şaftı / tava / penetrasyon', equipmentCodeName: 'Dikey Kablo Şaftı', locationDescription: 'Tüm Katlar' },
  { orderIndex: 14, equipmentCategory: 'Elektrik odası söndürme sistemi', equipmentCodeName: 'Gazlı Söndürme Sistemi', locationDescription: 'Trafo / Sistem Odası' }
];

// 1. GET ALL RECORDS (With facility filtering & search)
router.get('/', async (req: AuthRequest, res) => {
  try {
    const { facilityId, category, risk, actionStatus, search } = req.query;

    const where: any = {};

    if (facilityId && facilityId !== 'all') {
      where.facilityId = String(facilityId);
    } else {
      const user = req.user;
      const isAdminOrMgmt = user?.roles?.includes('admin') || user?.roles?.includes('management');
      if (!isAdminOrMgmt && user?.facilities) {
        where.facilityId = { in: user.facilities };
      }
    }

    if (category && category !== 'all') {
      where.equipmentCategory = String(category);
    }

    if (risk && risk !== 'all') {
      where.hasRisk = String(risk);
    }

    if (actionStatus && actionStatus !== 'all') {
      where.actionStatus = String(actionStatus);
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { equipmentCodeName: { contains: q, mode: 'insensitive' } },
        { locationDescription: { contains: q, mode: 'insensitive' } },
        { detectedRisk: { contains: q, mode: 'insensitive' } },
        { responsiblePerson: { contains: q, mode: 'insensitive' } },
        { inspectorName: { contains: q, mode: 'insensitive' } }
      ];
    }

    const records = await prisma.electricInfrastructureRecord.findMany({
      where,
      include: {
        facility: {
          select: { id: true, name: true }
        }
      },
      orderBy: [
        { facilityId: 'asc' },
        { orderIndex: 'asc' },
        { createdAt: 'asc' }
      ]
    });

    res.json(records);
  } catch (error: any) {
    console.error('Error fetching electric infrastructure records:', error);
    res.status(500).json({ error: error.message || 'Kayıtlar alınamadı.' });
  }
});

// 2. GET STATS (Summary indicators matching Excel row 6)
router.get('/stats', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.query;
    const where: any = {};

    if (facilityId && facilityId !== 'all') {
      where.facilityId = String(facilityId);
    } else {
      const user = req.user;
      const isAdminOrMgmt = user?.roles?.includes('admin') || user?.roles?.includes('management');
      if (!isAdminOrMgmt && user?.facilities) {
        where.facilityId = { in: user.facilities };
      }
    }

    const records = await prisma.electricInfrastructureRecord.findMany({
      where,
      select: {
        id: true,
        hasRisk: true,
        hasMaintenanceRecord: true,
        lastMaintenanceDate: true,
        actionStatus: true,
        isInspected: true
      }
    });

    const totalCount = records.length;
    const riskCount = records.filter(r => r.hasRisk === 'Var').length;
    const noMaintenanceCount = records.filter(
      r => r.hasMaintenanceRecord === 'Yok' || !r.lastMaintenanceDate
    ).length;
    const openActionCount = records.filter(
      r => r.actionStatus === 'Açık' || r.actionStatus === 'Devam Ediyor'
    ).length;
    const notInspectedCount = records.filter(r => r.isInspected === 'Hayır').length;

    // Excel formula: IF(N6=0,"VERİ GİRİLMEDİ",IF(OR(P6>0,T6>0,V6>0),"TEYİDE HAZIR DEĞİL","KONTROL EDİLEBİLİR"))
    let statusText = 'VERİ GİRİLMEDİ';
    let statusColor = 'gray';

    if (totalCount > 0) {
      if (riskCount > 0 || openActionCount > 0 || notInspectedCount > 0) {
        statusText = 'TEYİDE HAZIR DEĞİL';
        statusColor = 'red';
      } else {
        statusText = 'KONTROL EDİLEBİLİR';
        statusColor = 'green';
      }
    }

    res.json({
      totalCount,
      riskCount,
      noMaintenanceCount,
      openActionCount,
      notInspectedCount,
      statusText,
      statusColor
    });
  } catch (error: any) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: error.message || 'İstatistikler alınamadı.' });
  }
});

// 3. POST INITIALIZE DEFAULT TEMPLATES FOR A FACILITY
router.post('/init-template', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.body;
    if (!facilityId || facilityId === 'all') {
      return res.status(400).json({ error: 'Geçerli bir tesis seçilmelidir.' });
    }

    const count = await prisma.electricInfrastructureRecord.count({
      where: { facilityId }
    });

    const created = [];
    let curIndex = count + 1;

    for (const item of DEFAULT_EQUIPMENT_TEMPLATES) {
      const record = await prisma.electricInfrastructureRecord.create({
        data: {
          facilityId,
          orderIndex: curIndex++,
          equipmentCategory: item.equipmentCategory,
          equipmentCodeName: item.equipmentCodeName,
          locationDescription: item.locationDescription,
          isInspected: 'Evet',
          hasRisk: 'Yok',
          hasMaintenanceRecord: 'Yok',
          lastMaintenanceDate: null,
          thermalControl: 'Uygun',
          overloadHeat: 'Yok',
          cablesBreakers: 'Uygun',
          cleanlinessVentilation: 'Uygun',
          extinguishingSystem: 'Var ve Uygun',
          sealingFireStop: 'Var ve Uygun',
          protectionSystem: 'Uygun',
          actionStatus: 'Tamamlandı',
          inspectorName: req.user?.fullName || req.user?.username || '',
          createdBy: req.user?.username
        }
      });
      created.push(record);
    }

    res.json({ message: `${created.length} adet standart ekipman eklendi.`, items: created });
  } catch (error: any) {
    console.error('Error init template:', error);
    res.status(500).json({ error: error.message || 'Şablon yüklenemedi.' });
  }
});

// 4. POST CREATE SINGLE RECORD
router.post('/', async (req: AuthRequest, res) => {
  try {
    const {
      facilityId,
      equipmentCategory,
      equipmentCodeName,
      locationDescription,
      isInspected,
      hasRisk,
      hasMaintenanceRecord,
      lastMaintenanceDate,
      thermalControl,
      overloadHeat,
      cablesBreakers,
      cleanlinessVentilation,
      extinguishingSystem,
      sealingFireStop,
      protectionSystem,
      detectedRisk,
      suggestedAction,
      emergencyActionTaken,
      responsiblePerson,
      deadlineDate,
      actionStatus,
      evidenceNo,
      photoUrls,
      inspectorName,
      inspectionDate,
      notes
    } = req.body;

    if (!facilityId || facilityId === 'all') {
      return res.status(400).json({ error: 'Tesis seçilmelidir.' });
    }
    if (!equipmentCategory || !equipmentCodeName || !locationDescription) {
      return res.status(400).json({ error: 'Ekipman türü, adı ve konumu zorunludur.' });
    }

    const lastRecord = await prisma.electricInfrastructureRecord.findFirst({
      where: { facilityId },
      orderBy: { orderIndex: 'desc' }
    });

    const nextIndex = (lastRecord?.orderIndex || 0) + 1;

    const record = await prisma.electricInfrastructureRecord.create({
      data: {
        facilityId,
        orderIndex: nextIndex,
        equipmentCategory,
        equipmentCodeName,
        locationDescription,
        isInspected: isInspected || 'Evet',
        hasRisk: hasRisk || 'Yok',
        hasMaintenanceRecord: hasMaintenanceRecord || 'Var',
        lastMaintenanceDate: lastMaintenanceDate ? new Date(lastMaintenanceDate) : null,
        thermalControl: thermalControl || null,
        overloadHeat: overloadHeat || null,
        cablesBreakers: cablesBreakers || null,
        cleanlinessVentilation: cleanlinessVentilation || null,
        extinguishingSystem: extinguishingSystem || null,
        sealingFireStop: sealingFireStop || null,
        protectionSystem: protectionSystem || null,
        detectedRisk: detectedRisk || null,
        suggestedAction: suggestedAction || null,
        emergencyActionTaken: emergencyActionTaken || null,
        responsiblePerson: responsiblePerson || null,
        deadlineDate: deadlineDate ? new Date(deadlineDate) : null,
        actionStatus: actionStatus || 'Tamamlandı',
        evidenceNo: evidenceNo || null,
        photoUrls: photoUrls || [],
        inspectorName: inspectorName || req.user?.fullName || req.user?.username || '',
        inspectionDate: inspectionDate ? new Date(inspectionDate) : new Date(),
        notes: notes || null,
        createdBy: req.user?.username
      },
      include: {
        facility: {
          select: { id: true, name: true }
        }
      }
    });

    res.status(201).json(record);
  } catch (error: any) {
    console.error('Error creating record:', error);
    res.status(500).json({ error: error.message || 'Kayıt eklenemedi.' });
  }
});

// 5. PUT UPDATE RECORD
router.put('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const body = req.body;

    const updateData: any = {};
    const allowedFields = [
      'equipmentCategory',
      'equipmentCodeName',
      'locationDescription',
      'isInspected',
      'hasRisk',
      'hasMaintenanceRecord',
      'thermalControl',
      'overloadHeat',
      'cablesBreakers',
      'cleanlinessVentilation',
      'extinguishingSystem',
      'sealingFireStop',
      'protectionSystem',
      'detectedRisk',
      'suggestedAction',
      'emergencyActionTaken',
      'responsiblePerson',
      'actionStatus',
      'evidenceNo',
      'photoUrls',
      'inspectorName',
      'notes',
      'orderIndex'
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    }

    if (body.lastMaintenanceDate !== undefined) {
      updateData.lastMaintenanceDate = body.lastMaintenanceDate ? new Date(body.lastMaintenanceDate) : null;
    }
    if (body.deadlineDate !== undefined) {
      updateData.deadlineDate = body.deadlineDate ? new Date(body.deadlineDate) : null;
    }
    if (body.inspectionDate !== undefined) {
      updateData.inspectionDate = body.inspectionDate ? new Date(body.inspectionDate) : null;
    }

    const updated = await prisma.electricInfrastructureRecord.update({
      where: { id },
      data: updateData,
      include: {
        facility: {
          select: { id: true, name: true }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating record:', error);
    res.status(500).json({ error: error.message || 'Kayıt güncellenemedi.' });
  }
});

// 5.4. EXPORT TO EXCEL (Matching the official columns) - Must be before /:id route
router.get('/export-excel', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.query;
    const where: any = {};

    if (facilityId && facilityId !== 'all') {
      where.facilityId = String(facilityId);
    } else {
      const user = req.user;
      const isAdminOrMgmt = user?.roles?.includes('admin') || user?.roles?.includes('management');
      if (!isAdminOrMgmt && user?.facilities) {
        where.facilityId = { in: user.facilities };
      }
    }

    const records = await prisma.electricInfrastructureRecord.findMany({
      where,
      include: { facility: { select: { name: true } } },
      orderBy: [{ facilityId: 'asc' }, { orderIndex: 'asc' }]
    });

    const rows = records.map((r, idx) => ({
      'Sıra No': r.orderIndex || idx + 1,
      'Tesis': r.facility?.name || '',
      'İlgili bölüm / ekipman': r.equipmentCategory,
      'Pano / ekipman adı-kodu': r.equipmentCodeName,
      'Kat / konum': r.locationDescription,
      'Kontrol edildi mi?': r.isInspected || '',
      'Risk var mı?': r.hasRisk || '',
      'Bakım kaydı var mı?': r.hasMaintenanceRecord || '',
      'Son bakım tarihi': r.lastMaintenanceDate ? new Date(r.lastMaintenanceDate).toLocaleDateString('tr-TR') : '',
      'Termal kontrol': r.thermalControl || '',
      'Aşırı yük / ısınma': r.overloadHeat || '',
      'Bağlantı-kablo-şalter': r.cablesBreakers || '',
      'Temizlik / havalandırma': r.cleanlinessVentilation || '',
      'Söndürme sistemi': r.extinguishingSystem || '',
      'Sızdırmazlık / yangın durdurucu': r.sealingFireStop || '',
      'Koruma sistemi': r.protectionSystem || '',
      'Tespit edilen risk / uygunsuzluk': r.detectedRisk || '',
      'Önerilen önlem': r.suggestedAction || '',
      'Yapılan acil aksiyon': r.emergencyActionTaken || '',
      'Sorumlu': r.responsiblePerson || '',
      'Termin': r.deadlineDate ? new Date(r.deadlineDate).toLocaleDateString('tr-TR') : '',
      'Aksiyon durumu': r.actionStatus || '',
      'Fotoğraf / kanıt no': r.evidenceNo || (Array.isArray(r.photoUrls) && (r.photoUrls as any[]).length > 0 ? `${(r.photoUrls as any[]).length} adet dosya` : ''),
      'Kontrol eden': r.inspectorName || '',
      'Kontrol tarihi': r.inspectionDate ? new Date(r.inspectionDate).toLocaleDateString('tr-TR') : ''
    }));

    const worksheet = xlsx.utils.json_to_sheet(rows);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Elektrik Kontrol Formu');

    const buffer = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="Elektrik_Altyapi_Kontrol_Formu.xlsx"');
    res.send(buffer);
  } catch (error: any) {
    console.error('Error exporting excel:', error);
    res.status(500).json({ error: error.message || 'Excel dışa aktarılamadı.' });
  }
});

// 5.5. GET SINGLE RECORD
router.get('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const record = await prisma.electricInfrastructureRecord.findUnique({
      where: { id },
      include: {
        facility: {
          select: { id: true, name: true }
        }
      }
    });
    if (!record) {
      return res.status(404).json({ error: 'Kayıt bulunamadı.' });
    }
    res.json(record);
  } catch (error: any) {
    console.error('Error fetching record:', error);
    res.status(500).json({ error: error.message || 'Kayıt alınamadı.' });
  }
});

// 6. DELETE RECORD
router.delete('/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.electricInfrastructureRecord.delete({
      where: { id }
    });
    res.json({ message: 'Kayıt başarıyla silindi.' });
  } catch (error: any) {
    console.error('Error deleting record:', error);
    res.status(500).json({ error: error.message || 'Kayıt silinemedi.' });
  }
});

// 7. UPLOAD EVIDENCE / PHOTOS
router.post('/upload-evidence', upload.array('files', 10), async (req: AuthRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Yüklenecek dosya bulunamadı.' });
    }

    const uploadedUrls = files.map(f => `/uploads/electric-infrastructure/${f.filename}`);
    res.json({ urls: uploadedUrls });
  } catch (error: any) {
    console.error('Error uploading evidence:', error);
    res.status(500).json({ error: error.message || 'Dosya yükleme hatası.' });
  }
});

export default router;

