import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import * as xlsx from 'xlsx';

const router = Router();
const prisma = new PrismaClient();

// Multer storage for Excel upload (in memory or temp disk)
const tempUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 25 * 1024 * 1024 }
});

// Helper: Sanitize folder name
function sanitizeFolderName(name: string): string {
  return name
    .replace(/[\\/*?:"<>|]/g, '')
    .replace(/\s+/g, '_')
    .trim() || 'facility';
}

// Helper: Resolve canonical facility ID handling Unicode differences (NFC vs NFD, Turkish I vs dotted İ, ASCII vs Unicode)
async function resolveFacilityId(rawId?: string | null): Promise<string | null> {
  if (!rawId || rawId === 'all') return null;
  const nfc = rawId.normalize('NFC').trim();
  const nfd = rawId.normalize('NFD').trim();

  // 1. Direct DB lookup
  const fac = await prisma.facility.findFirst({
    where: {
      OR: [
        { id: rawId },
        { id: nfc },
        { id: nfd }
      ]
    },
    select: { id: true }
  });

  if (fac) return fac.id;

  // 2. Normalize and compare against all facilities in DB
  const clean = (str: string) =>
    str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/İ/g, 'I')
      .replace(/ı/g, 'i')
      .replace(/Ğ/g, 'G')
      .replace(/ğ/g, 'g')
      .replace(/Ü/g, 'U')
      .replace(/ü/g, 'u')
      .replace(/Ş/g, 'S')
      .replace(/ş/g, 's')
      .replace(/Ö/g, 'O')
      .replace(/ö/g, 'o')
      .replace(/Ç/g, 'C')
      .replace(/ç/g, 'c')
      .toUpperCase()
      .trim();

  const targetClean = clean(rawId);
  const allFacs = await prisma.facility.findMany({
    select: { id: true, name: true, shortName: true }
  });

  const matched = allFacs.find(f => {
    if (clean(f.id) === targetClean) return true;
    if (f.name && clean(f.name) === targetClean) return true;
    if (f.shortName && clean(f.shortName) === targetClean) return true;
    return false;
  });

  return matched?.id || rawId;
}

// Multer disk storage for evidence / thermal photos
const photoStorage = multer.diskStorage({
  destination: async (req: any, _file, cb) => {
    try {
      const facilityId = req.body.facilityId || req.query.facilityId;
      let folderSub = 'Genel';
      
      if (facilityId && facilityId !== 'all') {
        const fac = await prisma.facility.findUnique({
          where: { id: facilityId },
          select: { shortName: true, name: true }
        });
        if (fac) {
          folderSub = sanitizeFolderName(fac.shortName || fac.name);
        }
      }

      const targetDir = path.join(process.cwd(), 'uploads', 'electric-infrastructure', folderSub, 'thermal');
      if (!fs.existsSync(targetDir)) {
        fs.mkdirSync(targetDir, { recursive: true });
      }
      cb(null, targetDir);
    } catch (err: any) {
      cb(err, path.join(process.cwd(), 'uploads', 'electric-infrastructure'));
    }
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'thermal-' + uniqueSuffix + ext);
  }
});

const uploadPhotos = multer({
  storage: photoStorage,
  limits: { fileSize: 30 * 1024 * 1024 }
});

// Middleware: Check permission
const requireAccess = (req: any, res: any, next: any) => {
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

router.use(authMiddleware, requireAccess);

// ─────────────────────────────────────────────────────────
// 1. GET SESSIONS (Tesis bazlı veya tüm oturumlar)
// ─────────────────────────────────────────────────────────
router.get('/sessions', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.query;
    const where: any = {};

    if (facilityId && facilityId !== 'all') {
      const canonicalId = await resolveFacilityId(String(facilityId));
      const rawStr = String(facilityId);
      const nfc = rawStr.normalize('NFC').trim();
      const nfd = rawStr.normalize('NFD').trim();
      const ids = Array.from(new Set([canonicalId, rawStr, nfc, nfd].filter(Boolean) as string[]));
      where.facilityId = ids.length === 1 ? ids[0] : { in: ids };
    } else {
      const user = req.user;
      const isAdminOrMgmt = user?.roles?.includes('admin') || user?.roles?.includes('management');
      if (!isAdminOrMgmt && user?.facilities) {
        where.facilityId = { in: user.facilities };
      }
    }

    const sessions = await prisma.thermalInspectionSession.findMany({
      where,
      include: {
        facility: {
          select: { id: true, name: true, shortName: true, city: true }
        },
        _count: {
          select: { items: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(sessions);
  } catch (error: any) {
    console.error('Error fetching thermal sessions:', error);
    res.status(500).json({ error: error.message || 'Termal denetim oturumları alınamadı.' });
  }
});

// ─────────────────────────────────────────────────────────
// 2. GET SINGLE SESSION WITH ITEMS
// ─────────────────────────────────────────────────────────
router.get('/sessions/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const session = await prisma.thermalInspectionSession.findUnique({
      where: { id },
      include: {
        facility: {
          select: { id: true, name: true, shortName: true, city: true }
        },
        items: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    if (!session) {
      return res.status(404).json({ error: 'Termal denetim oturumu bulunamadı.' });
    }

    res.json(session);
  } catch (error: any) {
    console.error('Error fetching thermal session detail:', error);
    res.status(500).json({ error: error.message || 'Oturum detayları alınamadı.' });
  }
});

// ─────────────────────────────────────────────────────────
// 3. CREATE MANUAL SESSION
// ─────────────────────────────────────────────────────────
router.post('/sessions', async (req: AuthRequest, res) => {
  try {
    const { facilityId, reportDate, notes } = req.body;
    if (!facilityId || facilityId === 'all') {
      return res.status(400).json({ error: 'Geçerli bir tesis seçilmelidir.' });
    }
    const targetFacilityId = (await resolveFacilityId(facilityId)) || facilityId;

    const session = await prisma.thermalInspectionSession.create({
      data: {
        facilityId: targetFacilityId,
        reportDate: reportDate ? new Date(reportDate) : new Date(),
        status: 'DEVAM_EDIYOR',
        notes: notes || null,
        uploadedBy: req.user?.fullName || req.user?.username || 'Kullanıcı'
      },
      include: {
        facility: {
          select: { id: true, name: true, shortName: true }
        },
        items: true
      }
    });

    res.status(201).json(session);
  } catch (error: any) {
    console.error('Error creating thermal session:', error);
    res.status(500).json({ error: error.message || 'Termal kontrol oturumu oluşturulamadı.' });
  }
});

// ─────────────────────────────────────────────────────────
// 4. TOGGLE / UPDATE SESSION STATUS ("Ölçümler Tamamlandı" vb.)
// ─────────────────────────────────────────────────────────
router.patch('/sessions/:id/status', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // 'TAMAMLANDI' or 'DEVAM_EDIYOR'

    const current = await prisma.thermalInspectionSession.findUnique({ where: { id } });
    if (!current) {
      return res.status(404).json({ error: 'Oturum bulunamadı.' });
    }

    const isCompleting = status === 'TAMAMLANDI';

    const updated = await prisma.thermalInspectionSession.update({
      where: { id },
      data: {
        status: isCompleting ? 'TAMAMLANDI' : 'DEVAM_EDIYOR',
        completedAt: isCompleting ? new Date() : null,
        completedBy: isCompleting ? (req.user?.fullName || req.user?.username) : null
      },
      include: {
        facility: {
          select: { id: true, name: true, shortName: true }
        }
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating session status:', error);
    res.status(500).json({ error: error.message || 'Durum güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────
// 5. DELETE SESSION
// ─────────────────────────────────────────────────────────
router.delete('/sessions/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.thermalInspectionSession.delete({
      where: { id }
    });
    res.json({ message: 'Termal kontrol oturumu silindi.' });
  } catch (error: any) {
    console.error('Error deleting session:', error);
    res.status(500).json({ error: error.message || 'Oturum silinemedi.' });
  }
});

// ─────────────────────────────────────────────────────────
// 6. IMPORT FROM EXCEL
// ─────────────────────────────────────────────────────────
router.post('/import-excel', tempUpload.single('file'), async (req: AuthRequest, res) => {
  try {
    const file = req.file;
    const facilityId = req.body.facilityId;

    if (!file) {
      return res.status(400).json({ error: 'Excel dosyası yüklenmedi.' });
    }
    if (!facilityId || facilityId === 'all') {
      return res.status(400).json({ error: 'Lütfen bir tesis seçiniz.' });
    }

    // Read excel workbook
    const workbook = xlsx.read(file.buffer, { type: 'buffer', cellDates: true });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    const rawRows = xlsx.utils.sheet_to_json<any[]>(worksheet, { header: 1 });

    if (!rawRows || rawRows.length < 5) {
      return res.status(400).json({ error: 'Excel içeriği geçerli bir formatta değil.' });
    }

    // Determine header row (scan first 15 rows)
    const normalizeCell = (c: any) =>
      String(c || '')
        .toLocaleLowerCase('tr-TR')
        .replace(/ı/g, 'i')
        .replace(/ğ/g, 'g')
        .replace(/ü/g, 'u')
        .replace(/ş/g, 's')
        .replace(/ö/g, 'o')
        .replace(/ç/g, 'c')
        .trim();

    let headerRowIndex = -1;
    let maxHeaderMatches = 0;

    for (let i = 0; i < Math.min(15, rawRows.length); i++) {
      const row = rawRows[i];
      if (Array.isArray(row) && row.length > 2) {
        const rowTexts = row.map(normalizeCell);
        const matches = rowTexts.filter(c =>
          c.includes('pano') || c.includes('panel') ||
          c.includes('sicaklik') || c.includes('olculen') ||
          c.includes('nokta') || c.includes('lokasyon') ||
          c.includes('kat') || c.includes('blok') ||
          c.includes('tarih') || c.includes('saat') ||
          c.includes('durum') || c.includes('oncelik')
        ).length;

        if (matches >= 2 && matches > maxHeaderMatches) {
          maxHeaderMatches = matches;
          headerRowIndex = i;
        }
      }
    }

    // Fallback if header wasn't caught by match count
    if (headerRowIndex === -1) {
      for (let i = 0; i < Math.min(15, rawRows.length); i++) {
        const row = rawRows[i];
        if (Array.isArray(row) && row.length > 2) {
          const rowTexts = row.map(normalizeCell);
          const hasPanel = rowTexts.some(c => c.includes('pano') || c.includes('panel'));
          const hasTemp = rowTexts.some(c => c.includes('sicaklik') || c.includes('olculen') || c.includes('derece'));
          if (hasPanel && hasTemp) {
            headerRowIndex = i;
            break;
          }
        }
      }
    }

    if (headerRowIndex === -1) {
      return res.status(400).json({ error: 'Excel tablosunda başlık satırı (Pano No / Sıcaklık) tespit edilemedi.' });
    }

    const header = (rawRows[headerRowIndex] as any[]).map(normalizeCell);
    const findCol = (keywords: string[]) => {
      const normalizedKeywords = keywords.map(normalizeCell);
      return header.findIndex(h => normalizedKeywords.some(k => h.includes(k)));
    };

    let colNo = findCol(['no', 'sira']);
    // B sütunu: Kat / Blok / Lokasyon / Bina
    let colLoc = findCol(['lokasyon', 'bina', 'yer', 'blok', 'kat/blok']);
    // C sütunu: Konum / Mahal / Kat / Bölüm
    let colFloor = findCol(['konum', 'mahal', 'kat', 'bolum', 'alan', 'kisim']);
    let colDate = findCol(['tarih']);
    let colTime = findCol(['saat', 'kontrol saati', 'zaman']);
    let colPanel = findCol(['pano no', 'pano adi', 'pano', 'panel']);
    let colPoint = findCol(['olcum noktasi', 'nokta', 'olcum yeri']);
    let colEquip = findCol(['ekipman', 'baglanti', 'cihaz']);
    let colMeasTemp = findCol(['olculen', 'olculen sicaklik', 'sicaklik']);
    let colAmbTemp = findCol(['ortam', 'ortam sicakligi']);
    let colStatus = findCol(['durum']);
    let colPriority = findCol(['oncelik']);
    let colDesc = findCol(['tespit', 'aciklama', 'not']);
    let colAction = findCol(['aksiyon', 'onlem', 'yapilan']);

    // Standart sütun sıralaması fallbackleri:
    // Sütun B (index 1): Kat / Blok (Lokasyon / Bina)
    // Sütun C (index 2): Konum / Mahal (Kat / Bölüm)
    if (colNo === -1 && header.length > 0) colNo = 0;
    if (colLoc === -1 && header.length > 1) colLoc = 1; // Sütun B
    if (colFloor === -1 && header.length > 2) colFloor = 2; // Sütun C
    if (colDate === -1 && header.length > 3) colDate = 3;
    if (colTime === -1 && header.length > 4) colTime = 4;
    if (colPanel === -1 && header.length > 5) colPanel = 5;
    if (colPoint === -1 && header.length > 6) colPoint = 6;
    if (colEquip === -1 && header.length > 7) colEquip = 7;
    if (colMeasTemp === -1 && header.length > 8) colMeasTemp = 8;
    if (colAmbTemp === -1 && header.length > 9) colAmbTemp = 9;

    // Parse items & find first valid date for reportDate
    let firstFoundDate: Date | null = null;
    const itemsToCreate: any[] = [];
    let curOrder = 1;

    for (let r = headerRowIndex + 1; r < rawRows.length; r++) {
      const row = rawRows[r] as any[];
      if (!row || row.length === 0) continue;

      const panelVal = colPanel !== -1 && row[colPanel] != null ? String(row[colPanel]).trim() : '';
      const pointVal = colPoint !== -1 && row[colPoint] != null ? String(row[colPoint]).trim() : '';
      const measVal = colMeasTemp !== -1 && row[colMeasTemp] != null ? String(row[colMeasTemp]).trim() : '';
      const orderNoVal = colNo !== -1 && row[colNo] != null && !isNaN(parseInt(String(row[colNo]), 10)) ? parseInt(String(row[colNo]), 10) : null;

      // Skip row if completely empty (no orderNo, no panel, no point, no measurement)
      if (!orderNoVal && !panelVal && !pointVal && !measVal) {
        continue;
      }

      // Date parsing
      let itemDate: Date | null = null;
      if (colDate !== -1 && row[colDate] != null) {
        const val = row[colDate];
        if (val instanceof Date && !isNaN(val.getTime())) {
          itemDate = val;
        } else if (typeof val === 'number') {
          // Excel serial date number (e.g. 46280)
          const parsed = new Date((val - (25567 + 2)) * 86400 * 1000);
          if (!isNaN(parsed.getTime())) itemDate = parsed;
        } else if (typeof val === 'string' && val.trim()) {
          const parts = val.trim().split(/[./-]/);
          if (parts.length === 3) {
            // DD.MM.YYYY
            const d = parseInt(parts[0], 10);
            const m = parseInt(parts[1], 10) - 1;
            const y = parseInt(parts[2].length === 2 ? '20' + parts[2] : parts[2], 10);
            const parsed = new Date(y, m, d);
            if (!isNaN(parsed.getTime())) itemDate = parsed;
          }
        }
      }

      if (itemDate && !firstFoundDate) {
        firstFoundDate = itemDate;
      }

      // Time parsing (handles fraction numbers like 0.375 -> 09:00, or Date object from cellDates: true)
      let controlTimeStr: string | null = null;
      if (colTime !== -1 && row[colTime] != null) {
        const tVal = row[colTime];
        if (tVal instanceof Date && !isNaN(tVal.getTime())) {
          // cellDates: true may convert time cells into Date objects (e.g. 1899-12-30T10:28:00)
          const hh = String(tVal.getHours()).padStart(2, '0');
          const mm = String(tVal.getMinutes()).padStart(2, '0');
          controlTimeStr = `${hh}:${mm}`;
        } else if (typeof tVal === 'number' && tVal >= 0 && tVal < 1) {
          const totalSeconds = Math.round(tVal * 24 * 3600);
          const hours = Math.floor(totalSeconds / 3600);
          const minutes = Math.floor((totalSeconds % 3600) / 60);
          controlTimeStr = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        } else if (typeof tVal === 'string') {
          // Match HH:mm
          const match = tVal.match(/(\d{1,2}):(\d{2})/);
          if (match) {
            controlTimeStr = `${match[1].padStart(2, '0')}:${match[2]}`;
          } else {
            controlTimeStr = tVal.trim();
          }
        }
      }

      // Temp numbers
      const parseTemp = (v: any) => {
        if (v == null || v === '') return null;
        const num = parseFloat(String(v).replace(',', '.').replace(/[^\d.-]/g, ''));
        return isNaN(num) ? null : num;
      };

      const measuredTemp = parseTemp(colMeasTemp !== -1 ? row[colMeasTemp] : null);
      const ambientTemp = parseTemp(colAmbTemp !== -1 ? row[colAmbTemp] : null);
      const deltaTemp = (measuredTemp !== null && ambientTemp !== null) ? Number((measuredTemp - ambientTemp).toFixed(1)) : null;

      const orderNo = (colNo !== -1 && row[colNo] && !isNaN(parseInt(row[colNo], 10)))
        ? parseInt(row[colNo], 10)
        : curOrder++;

      itemsToCreate.push({
        orderIndex: orderNo,
        buildingLocation: colLoc !== -1 && row[colLoc] ? String(row[colLoc]).trim() : null,
        floorSection: colFloor !== -1 && row[colFloor] ? String(row[colFloor]).trim() : null,
        measurementDate: itemDate,
        controlTime: controlTimeStr,
        panelName: panelVal || `Pano ${orderNo}`,
        measurementPoint: pointVal || null,
        equipmentConnection: colEquip !== -1 && row[colEquip] ? String(row[colEquip]).trim() : null,
        measuredTemp,
        ambientTemp,
        deltaTemp,
        status: colStatus !== -1 && row[colStatus] ? String(row[colStatus]).trim() : 'Normal',
        priority: colPriority !== -1 && row[colPriority] ? String(row[colPriority]).trim() : 'Düşük',
        detectedRisk: colDesc !== -1 && row[colDesc] ? String(row[colDesc]).trim() : null,
        actionTaken: colAction !== -1 && row[colAction] ? String(row[colAction]).trim() : null,
        photoUrls: []
      });
    }

    if (itemsToCreate.length === 0) {
      return res.status(400).json({ error: 'Excel içinde okunabilecek pano ölçüm satırı bulunamadı.' });
    }

    const targetFacilityId = (await resolveFacilityId(facilityId)) || facilityId;

    // Create session
    const session = await prisma.thermalInspectionSession.create({
      data: {
        facilityId: targetFacilityId,
        reportDate: firstFoundDate || new Date(),
        status: 'DEVAM_EDIYOR',
        notes: `${file.originalname} dosyasından ${itemsToCreate.length} satır aktarıldı.`,
        uploadedBy: req.user?.fullName || req.user?.username || 'Kullanıcı',
        items: {
          create: itemsToCreate
        }
      },
      include: {
        facility: {
          select: { id: true, name: true, shortName: true }
        },
        items: {
          orderBy: { orderIndex: 'asc' }
        }
      }
    });

    res.status(201).json({
      message: `Excel başarıyla aktarıldı. Toplam ${itemsToCreate.length} pano ölçümü eklendi.`,
      session
    });
  } catch (error: any) {
    console.error('Error importing thermal excel:', error);
    res.status(500).json({ error: error.message || 'Excel dosyası işlenirken hata oluştu.' });
  }
});

// ─────────────────────────────────────────────────────────
// 7. ITEM CRUD (Elle ekleme, düzenleme, silme)
// ─────────────────────────────────────────────────────────
router.post('/items', async (req: AuthRequest, res) => {
  try {
    const {
      sessionId,
      orderIndex,
      buildingLocation,
      floorSection,
      measurementDate,
      controlTime,
      panelName,
      measurementPoint,
      equipmentConnection,
      measuredTemp,
      ambientTemp,
      status,
      priority,
      detectedRisk,
      actionTaken,
      photoUrls
    } = req.body;

    if (!sessionId) {
      return res.status(400).json({ error: 'Oturum ID zorunludur.' });
    }
    if (!panelName) {
      return res.status(400).json({ error: 'Pano adı zorunludur.' });
    }

    const mTemp = measuredTemp !== undefined && measuredTemp !== '' ? parseFloat(measuredTemp) : null;
    const aTemp = ambientTemp !== undefined && ambientTemp !== '' ? parseFloat(ambientTemp) : null;
    const dTemp = (mTemp !== null && aTemp !== null) ? Number((mTemp - aTemp).toFixed(1)) : null;

    let index = orderIndex;
    if (!index) {
      const last = await prisma.thermalInspectionItem.findFirst({
        where: { sessionId },
        orderBy: { orderIndex: 'desc' }
      });
      index = (last?.orderIndex || 0) + 1;
    }

    const item = await prisma.thermalInspectionItem.create({
      data: {
        sessionId,
        orderIndex: Number(index),
        buildingLocation: buildingLocation || null,
        floorSection: floorSection || null,
        measurementDate: measurementDate ? new Date(measurementDate) : null,
        controlTime: controlTime || null,
        panelName,
        measurementPoint: measurementPoint || null,
        equipmentConnection: equipmentConnection || null,
        measuredTemp: mTemp,
        ambientTemp: aTemp,
        deltaTemp: dTemp,
        status: status || 'Normal',
        priority: priority || 'Düşük',
        detectedRisk: detectedRisk || null,
        actionTaken: actionTaken || null,
        photoUrls: Array.isArray(photoUrls) ? photoUrls : []
      }
    });

    res.status(201).json(item);
  } catch (error: any) {
    console.error('Error creating thermal item:', error);
    res.status(500).json({ error: error.message || 'Ölçüm kaydı eklenemedi.' });
  }
});

router.put('/items/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      orderIndex,
      buildingLocation,
      floorSection,
      measurementDate,
      controlTime,
      panelName,
      measurementPoint,
      equipmentConnection,
      measuredTemp,
      ambientTemp,
      status,
      priority,
      detectedRisk,
      actionTaken,
      photoUrls
    } = req.body;

    const mTemp = measuredTemp !== undefined && measuredTemp !== '' && measuredTemp !== null ? parseFloat(measuredTemp) : null;
    const aTemp = ambientTemp !== undefined && ambientTemp !== '' && ambientTemp !== null ? parseFloat(ambientTemp) : null;
    const dTemp = (mTemp !== null && aTemp !== null) ? Number((mTemp - aTemp).toFixed(1)) : null;

    const updated = await prisma.thermalInspectionItem.update({
      where: { id },
      data: {
        orderIndex: orderIndex !== undefined ? Number(orderIndex) : undefined,
        buildingLocation: buildingLocation !== undefined ? buildingLocation : undefined,
        floorSection: floorSection !== undefined ? floorSection : undefined,
        measurementDate: measurementDate ? new Date(measurementDate) : (measurementDate === null ? null : undefined),
        controlTime: controlTime !== undefined ? controlTime : undefined,
        panelName: panelName !== undefined ? panelName : undefined,
        measurementPoint: measurementPoint !== undefined ? measurementPoint : undefined,
        equipmentConnection: equipmentConnection !== undefined ? equipmentConnection : undefined,
        measuredTemp: mTemp,
        ambientTemp: aTemp,
        deltaTemp: dTemp,
        status: status !== undefined ? status : undefined,
        priority: priority !== undefined ? priority : undefined,
        detectedRisk: detectedRisk !== undefined ? detectedRisk : undefined,
        actionTaken: actionTaken !== undefined ? actionTaken : undefined,
        photoUrls: photoUrls !== undefined ? photoUrls : undefined
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating thermal item:', error);
    res.status(500).json({ error: error.message || 'Ölçüm kaydı güncellenemedi.' });
  }
});

router.delete('/items/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    await prisma.thermalInspectionItem.delete({ where: { id } });
    res.json({ message: 'Ölçüm kaydı silindi.' });
  } catch (error: any) {
    console.error('Error deleting thermal item:', error);
    res.status(500).json({ error: error.message || 'Ölçüm kaydı silinemedi.' });
  }
});

// ─────────────────────────────────────────────────────────
// 8. MULTI-PHOTO UPLOAD (Max 5 photos per item, mobile / drag / paste)
// ─────────────────────────────────────────────────────────
router.post('/items/:id/photos', uploadPhotos.array('photos', 5), async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'Yüklenecek görsel bulunamadı.' });
    }

    const item = await prisma.thermalInspectionItem.findUnique({
      where: { id },
      include: {
        session: {
          include: {
            facility: {
              select: { id: true, name: true, shortName: true }
            }
          }
        }
      }
    });

    if (!item) {
      return res.status(404).json({ error: 'Ölçüm maddesi bulunamadı.' });
    }

    const currentPhotos = Array.isArray(item.photoUrls) ? (item.photoUrls as string[]) : [];
    if (currentPhotos.length + files.length > 5) {
      return res.status(400).json({
        error: `Bir satır için en fazla 5 fotoğraf eklenebilir. Şu an ${currentPhotos.length} fotoğraf var, ${files.length} daha eklenemez.`
      });
    }

    const fac = item.session?.facility;
    const folderSub = sanitizeFolderName(fac?.shortName || fac?.name || 'facility');

    const newUrls = files.map(f => `/uploads/electric-infrastructure/${folderSub}/thermal/${f.filename}`);
    const updatedPhotos = [...currentPhotos, ...newUrls];

    const updated = await prisma.thermalInspectionItem.update({
      where: { id },
      data: {
        photoUrls: updatedPhotos
      }
    });

    res.json({
      message: `${files.length} adet fotoğraf başarıyla eklendi.`,
      photoUrls: updated.photoUrls,
      item: updated
    });
  } catch (error: any) {
    console.error('Error uploading item photos:', error);
    res.status(500).json({ error: error.message || 'Fotoğraf yüklenemedi.' });
  }
});

// DELETE A SPECIFIC PHOTO FROM AN ITEM
router.delete('/items/:id/photos', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ error: 'Silinecek fotoğraf yolu belirtilmelidir.' });
    }

    const item = await prisma.thermalInspectionItem.findUnique({ where: { id } });
    if (!item) {
      return res.status(404).json({ error: 'Ölçüm bulunamadı.' });
    }

    const currentPhotos = Array.isArray(item.photoUrls) ? (item.photoUrls as string[]) : [];
    const filtered = currentPhotos.filter(p => p !== photoUrl);

    // Also remove from disk if inside uploads
    try {
      const relPath = photoUrl.startsWith('/') ? photoUrl.slice(1) : photoUrl;
      const fullDiskPath = path.join(process.cwd(), relPath);
      if (fs.existsSync(fullDiskPath)) {
        fs.unlinkSync(fullDiskPath);
      }
    } catch (fsErr) {
      console.warn('Could not delete physical file:', fsErr);
    }

    const updated = await prisma.thermalInspectionItem.update({
      where: { id },
      data: { photoUrls: filtered }
    });

    res.json({ message: 'Fotoğraf silindi.', photoUrls: updated.photoUrls });
  } catch (error: any) {
    console.error('Error removing photo:', error);
    res.status(500).json({ error: error.message || 'Fotoğraf kaldırılamadı.' });
  }
});

// ─────────────────────────────────────────────────────────
// 9. EXECUTIVE DASHBOARD & HOSPITAL ENTRY REPORT
// ─────────────────────────────────────────────────────────
router.get('/dashboard-stats', async (req: AuthRequest, res) => {
  try {
    // 1. Get all active facilities (Hospital prioritised)
    const facilities = await prisma.facility.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        shortName: true,
        city: true,
        type: true
      },
      orderBy: [
        { type: 'asc' },
        { name: 'asc' }
      ]
    });

    // 2. Get latest sessions for facilities
    const sessions = await prisma.thermalInspectionSession.findMany({
      include: {
        items: {
          select: {
            id: true,
            status: true,
            priority: true,
            measuredTemp: true,
            ambientTemp: true,
            deltaTemp: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Group sessions by facility (latest session per facility)
    const norm = (str?: string | null) => (str || '').normalize('NFC').trim();
    const sessionMap = new Map<string, any>();
    sessions.forEach(s => {
      const key = norm(s.facilityId);
      if (!sessionMap.has(key)) {
        sessionMap.set(key, s);
      }
    });

    const facilityStats = facilities.map(fac => {
      const sess = sessionMap.get(norm(fac.id));
      const hasEntered = !!sess;
      const isCompleted = sess?.status === 'TAMAMLANDI';
      const itemCount = sess?.items?.length || 0;

      const criticalCount = sess?.items?.filter((it: any) =>
        it.status === 'Kritik' || it.priority === 'Acil' || (it.deltaTemp && it.deltaTemp >= 15)
      ).length || 0;

      const warningCount = sess?.items?.filter((it: any) =>
        it.status === 'Dikkat' || it.priority === 'Yüksek' || (it.deltaTemp && it.deltaTemp >= 8 && it.deltaTemp < 15)
      ).length || 0;

      return {
        id: fac.id,
        name: fac.name,
        shortName: fac.shortName || fac.name,
        city: fac.city,
        type: fac.type,
        hasEntered,
        status: sess ? sess.status : 'GIRILMEDI',
        isCompleted,
        sessionId: sess?.id || null,
        reportDate: sess?.reportDate || null,
        completedAt: sess?.completedAt || null,
        completedBy: sess?.completedBy || null,
        itemCount,
        criticalCount,
        warningCount
      };
    });

    const totalFacilities = facilities.length;
    const enteredFacilities = facilityStats.filter(f => f.hasEntered);
    const completedFacilities = facilityStats.filter(f => f.isCompleted);
    const inProgressFacilities = facilityStats.filter(f => f.hasEntered && !f.isCompleted);
    const notEnteredFacilities = facilityStats.filter(f => !f.hasEntered);

    const totalPanelsMeasured = facilityStats.reduce((acc, f) => acc + f.itemCount, 0);
    const totalCriticalIssues = facilityStats.reduce((acc, f) => acc + f.criticalCount, 0);

    res.json({
      summary: {
        totalFacilities,
        enteredCount: enteredFacilities.length,
        notEnteredCount: notEnteredFacilities.length,
        inProgressCount: inProgressFacilities.length,
        completedCount: completedFacilities.length,
        completionRate: totalFacilities > 0 ? Math.round((completedFacilities.length / totalFacilities) * 100) : 0,
        entryRate: totalFacilities > 0 ? Math.round((enteredFacilities.length / totalFacilities) * 100) : 0,
        totalPanelsMeasured,
        totalCriticalIssues
      },
      facilities: facilityStats
    });
  } catch (error: any) {
    console.error('Error fetching thermal dashboard stats:', error);
    res.status(500).json({ error: error.message || 'Termal yönetici paneli verileri alınamadı.' });
  }
});

export default router;
