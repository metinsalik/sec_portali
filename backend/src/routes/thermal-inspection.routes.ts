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

// Helper: Sanitize folder name to safe ASCII filesystem name
function sanitizeFolderName(name: string): string {
  return name
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
      let facilityId = req.body?.facilityId || req.query?.facilityId;

      // If facilityId was not directly provided in form body, look up via item id from route params
      if ((!facilityId || facilityId === 'all') && req.params?.id) {
        const itemRecord = await prisma.thermalInspectionItem.findUnique({
          where: { id: req.params.id },
          include: { session: { select: { facilityId: true } } }
        });
        if (itemRecord?.session?.facilityId) {
          facilityId = itemRecord.session.facilityId;
        }
      }

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
// 5. BULK DELETE SESSIONS
// ─────────────────────────────────────────────────────────
router.delete('/sessions/bulk', async (req: AuthRequest, res) => {
  try {
    const rawIds = req.body?.sessionIds || (typeof req.query.ids === 'string' ? req.query.ids.split(',') : undefined);
    const sessionIds = Array.isArray(rawIds) ? rawIds : [];
    if (sessionIds.length === 0) {
      return res.status(400).json({ error: 'Silinecek rapor listesi (sessionIds) gereklidir.' });
    }

    // 1. Fetch items to clean up physical photo files from disk
    const items = await prisma.thermalInspectionItem.findMany({
      where: { sessionId: { in: sessionIds } },
      select: { id: true, photoUrls: true, actionPhotos: true }
    });

    for (const item of items) {
      const allUrls = [
        ...(Array.isArray(item.photoUrls) ? (item.photoUrls as string[]) : []),
        ...(Array.isArray(item.actionPhotos) ? (item.actionPhotos as string[]) : [])
      ];
      for (const pUrl of allUrls) {
        if (typeof pUrl === 'string' && pUrl) {
          try {
            const relPath = pUrl.startsWith('/') ? pUrl.slice(1) : pUrl;
            const fullDiskPath = path.join(process.cwd(), relPath);
            if (fs.existsSync(fullDiskPath)) {
              fs.unlinkSync(fullDiskPath);
            }
          } catch (e) {
            // ignore disk unlink error
          }
        }
      }
    }

    // 2. Delete items
    const deletedItems = await prisma.thermalInspectionItem.deleteMany({
      where: { sessionId: { in: sessionIds } }
    });

    // 3. Delete sessions
    const deletedSessions = await prisma.thermalInspectionSession.deleteMany({
      where: { id: { in: sessionIds } }
    });

    res.json({
      message: `${deletedSessions.count} adet rapor ve ${deletedItems.count} adet ölçüm kaydı başarıyla silindi.`,
      deletedSessionCount: deletedSessions.count,
      deletedItemCount: deletedItems.count
    });
  } catch (error: any) {
    console.error('Error bulk deleting thermal sessions:', error);
    res.status(500).json({ error: error.message || 'Raporlar toplu silinirken hata oluştu.' });
  }
});

// ─────────────────────────────────────────────────────────
// 5.1 DELETE SINGLE SESSION
// ─────────────────────────────────────────────────────────
router.delete('/sessions/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch items to clean up physical photo files from disk
    const items = await prisma.thermalInspectionItem.findMany({
      where: { sessionId: id },
      select: { id: true, photoUrls: true, actionPhotos: true }
    });

    for (const item of items) {
      const allUrls = [
        ...(Array.isArray(item.photoUrls) ? (item.photoUrls as string[]) : []),
        ...(Array.isArray(item.actionPhotos) ? (item.actionPhotos as string[]) : [])
      ];
      for (const pUrl of allUrls) {
        if (typeof pUrl === 'string' && pUrl) {
          try {
            const relPath = pUrl.startsWith('/') ? pUrl.slice(1) : pUrl;
            const fullDiskPath = path.join(process.cwd(), relPath);
            if (fs.existsSync(fullDiskPath)) {
              fs.unlinkSync(fullDiskPath);
            }
          } catch (e) {
            // ignore disk unlink error
          }
        }
      }
    }

    // 2. Delete items explicitly first to prevent any foreign key constraint issues
    await prisma.thermalInspectionItem.deleteMany({
      where: { sessionId: id }
    });

    // 3. Delete session
    await prisma.thermalInspectionSession.delete({
      where: { id }
    });

    res.json({ message: 'Termal kontrol oturumu ve bağlı tüm ölçümler başarıyla silindi.' });
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
      const ambVal = colAmbTemp !== -1 && row[colAmbTemp] != null ? String(row[colAmbTemp]).trim() : '';
      const descVal = colDesc !== -1 && row[colDesc] != null ? String(row[colDesc]).trim() : '';
      const orderNoVal = colNo !== -1 && row[colNo] != null && !isNaN(parseInt(String(row[colNo]), 10)) ? parseInt(String(row[colNo]), 10) : null;

      // Skip row if it has no meaningful content (no panel name, no measurement point, no measured temp, no finding/risk)
      // Having only an order number (e.g. 1, 2, 3 in column A) without actual data is an empty row and must be ignored!
      if (!panelVal && !pointVal && !measVal && !descVal) {
        continue;
      }

      // If panelVal looks like just an order index (e.g. "1", "2") and no temp/point/desc, skip it as empty
      if (/^\d+$/.test(panelVal) && !pointVal && !measVal && !descVal) {
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
        // Sütun bulunmuşsa ve hücre doluysa değeri oku; yoksa boş bırak.
        // Boş bırakmak önemlidir: Frontend bu alanlar boşken sıcaklık eşikleriyle otomatik kategori hesaplar.
        // 'Normal' / 'Düşük' gibi hard-coded default atamak tüm satırları zorla NORMAL yapar!
        status: colStatus !== -1 && row[colStatus] != null && String(row[colStatus]).trim() !== '' ? String(row[colStatus]).trim() : null,
        priority: colPriority !== -1 && row[colPriority] != null && String(row[colPriority]).trim() !== '' ? String(row[colPriority]).trim() : null,
        detectedRisk: colDesc !== -1 && row[colDesc] ? String(row[colDesc]).trim() : null,
        actionTaken: colAction !== -1 && row[colAction] ? String(row[colAction]).trim() : null,
        photoUrls: []
      });
    }

    if (itemsToCreate.length === 0) {
      return res.status(400).json({ error: 'Excel içinde okunabilecek pano ölçüm satırı bulunamadı.' });
    }

    const targetFacilityId = (await resolveFacilityId(facilityId)) || facilityId;
    const customReportDate = req.body.reportDate ? new Date(req.body.reportDate) : null;

    // Create session
    const session = await prisma.thermalInspectionSession.create({
      data: {
        facilityId: targetFacilityId,
        reportDate: customReportDate || firstFoundDate || new Date(),
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

// Boş ve anlamsız ölçüm satırlarını toplu temizleme endpoint'i
router.post('/cleanup-empty', async (req: AuthRequest, res) => {
  try {
    const { facilityId, sessionId } = req.body;

    // Filter to inspect
    const sessionWhere: any = {};
    if (sessionId) {
      sessionWhere.id = sessionId;
    } else if (facilityId && facilityId !== 'all') {
      const targetFacilityId = (await resolveFacilityId(facilityId)) || facilityId;
      sessionWhere.facilityId = targetFacilityId;
    }

    const items = await prisma.thermalInspectionItem.findMany({
      where: Object.keys(sessionWhere).length > 0 ? { session: sessionWhere } : {},
      select: {
        id: true,
        panelName: true,
        measuredTemp: true,
        ambientTemp: true,
        measurementPoint: true,
        equipmentConnection: true,
        detectedRisk: true,
        actionTaken: true,
        actionPlan: true,
        photoUrls: true,
        sessionId: true
      }
    });

    const idsToDelete: string[] = [];

    for (const it of items) {
      const hasTemp = it.measuredTemp !== null && it.measuredTemp !== undefined;
      const hasAmb = it.ambientTemp !== null && it.ambientTemp !== undefined;
      const hasPoint = it.measurementPoint && it.measurementPoint.trim() !== '';
      const hasRisk = it.detectedRisk && it.detectedRisk.trim() !== '';
      const hasAction = it.actionTaken && it.actionTaken.trim() !== '';
      const hasEquip = it.equipmentConnection && it.equipmentConnection.trim() !== '';
      const hasPlan = it.actionPlan && it.actionPlan.trim() !== '';
      let photos: any[] = [];
      try {
        photos = typeof it.photoUrls === 'string' ? JSON.parse(it.photoUrls) : (it.photoUrls || []);
      } catch (e) {}
      const hasPhotos = Array.isArray(photos) && photos.length > 0;

      // An item is completely empty/meaningless if it has no measurement, no point, no finding, no equipment, no plan, no photos
      if (!hasTemp && !hasAmb && !hasPoint && !hasRisk && !hasAction && !hasEquip && !hasPlan && !hasPhotos) {
        idsToDelete.push(it.id);
      }
    }

    let deletedCount = 0;
    if (idsToDelete.length > 0) {
      const result = await prisma.thermalInspectionItem.deleteMany({
        where: { id: { in: idsToDelete } }
      });
      deletedCount = result.count;
    }

    res.json({
      message: `Temizlik tamamlandı. Toplam ${deletedCount} adet boş/anlamsız satır silindi.`,
      deletedCount
    });
  } catch (error: any) {
    console.error('Error cleaning up empty thermal items:', error);
    res.status(500).json({ error: error.message || 'Boş satırlar temizlenirken bir hata oluştu.' });
  }
});

// Pano Birleştirme (Farklı veya hatalı yazılmış pano isimlerini tek bir standart isim altında birleştirme)
router.post('/merge-panels', async (req: AuthRequest, res) => {
  try {
    const { targetPanelName, sourcePanelNames, facilityId } = req.body;

    if (!targetPanelName || !targetPanelName.trim()) {
      return res.status(400).json({ error: 'Hedef pano adı zorunludur.' });
    }
    if (!Array.isArray(sourcePanelNames) || sourcePanelNames.length === 0) {
      return res.status(400).json({ error: 'Birleştirilecek kaynak panolar seçilmelidir.' });
    }

    const cleanTargetName = targetPanelName.trim();
    const cleanSourceNames = sourcePanelNames.map((s: string) => s.trim()).filter((s: string) => s && s !== cleanTargetName);

    if (cleanSourceNames.length === 0) {
      return res.status(400).json({ error: 'Hedef isimden farklı en az bir pano seçilmelidir.' });
    }

    const whereClause: any = {
      panelName: { in: cleanSourceNames }
    };

    if (facilityId && facilityId !== 'all') {
      const canonicalFacId = (await resolveFacilityId(facilityId)) || facilityId;
      whereClause.session = { facilityId: canonicalFacId };
    }

    const updateResult = await prisma.thermalInspectionItem.updateMany({
      where: whereClause,
      data: {
        panelName: cleanTargetName
      }
    });

    res.json({
      message: `${updateResult.count} adet ölçüm kaydı başarıyla "${cleanTargetName}" panosu altında birleştirildi.`,
      updatedCount: updateResult.count,
      targetPanelName: cleanTargetName
    });
  } catch (error: any) {
    console.error('Error merging panels:', error);
    res.status(500).json({ error: error.message || 'Panolar birleştirilirken bir hata oluştu.' });
  }
});

// ─────────────────────────────────────────────────────────
// AKSİYON AL / GÜNCELLE VE TAKİP ENDPOINTLERİ
// ─────────────────────────────────────────────────────────

// Update Action for Item (Plan, Termin, Sorumlu, Durum, Tamamlama Notu ve Fotoğrafları)
router.patch('/items/:id/action', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      actionPlan,
      actionDueDate,
      actionAssignee,
      actionStatus,
      actionCompletedDate,
      actionNotes,
      actionPhotos,
      status,
      priority,
      measuredTemp,
      ambientTemp
    } = req.body;

    const existing = await prisma.thermalInspectionItem.findUnique({
      where: { id }
    });
    if (!existing) {
      return res.status(404).json({ error: 'Ölçüm kaydı bulunamadı.' });
    }

    // If new measurements provided, update measuredTemp & ambientTemp & deltaTemp
    let newMeasuredTemp = existing.measuredTemp;
    let newAmbientTemp = existing.ambientTemp;
    let newDeltaTemp = existing.deltaTemp;

    if (measuredTemp !== undefined && measuredTemp !== '' && measuredTemp !== null) {
      newMeasuredTemp = parseFloat(measuredTemp);
    }
    if (ambientTemp !== undefined && ambientTemp !== '' && ambientTemp !== null) {
      newAmbientTemp = parseFloat(ambientTemp);
    }
    if (newMeasuredTemp !== null && newAmbientTemp !== null) {
      newDeltaTemp = Number((newMeasuredTemp - newAmbientTemp).toFixed(1));
    }

    // If actionStatus is TAMAMLANDI and user hasn't explicitly set status, transition to Normal
    let resolvedStatus = status !== undefined ? status : undefined;
    let resolvedPriority = priority !== undefined ? priority : undefined;
    if (actionStatus === 'TAMAMLANDI' && status === undefined) {
      resolvedStatus = 'Normal';
      resolvedPriority = 'Düşük';
    }

    const updated = await prisma.thermalInspectionItem.update({
      where: { id },
      data: {
        actionPlan: actionPlan !== undefined ? actionPlan : undefined,
        actionDueDate: actionDueDate ? new Date(actionDueDate) : (actionDueDate === null ? null : undefined),
        actionAssignee: actionAssignee !== undefined ? actionAssignee : undefined,
        actionStatus: actionStatus !== undefined ? actionStatus : undefined,
        actionCompletedDate: actionCompletedDate ? new Date(actionCompletedDate) : (actionStatus === 'TAMAMLANDI' && !existing.actionCompletedDate ? new Date() : (actionCompletedDate === null ? null : undefined)),
        actionNotes: actionNotes !== undefined ? actionNotes : undefined,
        actionPhotos: actionPhotos !== undefined ? actionPhotos : undefined,
        status: resolvedStatus,
        priority: resolvedPriority,
        measuredTemp: newMeasuredTemp,
        ambientTemp: newAmbientTemp,
        deltaTemp: newDeltaTemp,
        // Sync with legacy actionTaken if updated
        actionTaken: actionPlan || actionNotes || existing.actionTaken
      }
    });

    res.json(updated);
  } catch (error: any) {
    console.error('Error updating item action:', error);
    res.status(500).json({ error: error.message || 'Aksiyon güncellenemedi.' });
  }
});

// Sıkı Takipteki Panolar ve Açık Aksiyonlar Listesi (Watchlist)
router.get('/watchlist', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.query;
    const canonicalFacId = await resolveFacilityId(facilityId as string);

    const whereClause: any = {};
    if (canonicalFacId) {
      whereClause.session = { facilityId: canonicalFacId };
    }

    // Filter items that need action/attention:
    // (status is Dikkat/Kritik/Uygunsuz OR priority is Acil/Yüksek OR actionStatus != TAMAMLANDI, Normal olanlar hariç)
    const items = await prisma.thermalInspectionItem.findMany({
      where: {
        ...whereClause,
        status: { not: 'Normal' },
        OR: [
          { priority: { in: ['Acil', 'Yüksek', 'Orta'] } },
          { status: { in: ['Kritik', 'Dikkat', 'Uygunsuz', 'Takip'] } },
          { actionStatus: { in: ['BEKLIYOR', 'DEVAM_EDIYOR', 'GECIKTI'] } },
          {
            AND: [
              { status: null },
              { OR: [{ deltaTemp: { gte: 15 } }, { measuredTemp: { gte: 50 } }] }
            ]
          }
        ]
      },
      include: {
        session: {
          select: {
            id: true,
            facilityId: true,
            reportDate: true,
            facility: {
              select: {
                id: true,
                name: true,
                shortName: true,
                city: true
              }
            }
          }
        }
      },
      orderBy: [
        { actionDueDate: 'asc' },
        { measuredTemp: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Categorize for quick dashboard consumption
    const now = new Date();
    const categorized = items.map(it => {
      const isOverdue = it.actionDueDate && new Date(it.actionDueDate) < now && it.actionStatus !== 'TAMAMLANDI';
      const isUrgent = it.priority === 'Acil' || (it.measuredTemp && it.measuredTemp >= 60);
      return {
        ...it,
        isOverdue: Boolean(isOverdue),
        isUrgent: Boolean(isUrgent)
      };
    });

    res.json(categorized);
  } catch (error: any) {
    console.error('Error fetching thermal watchlist:', error);
    res.status(500).json({ error: error.message || 'Takip listesi alınamadı.' });
  }
});

// Belirli bir panonun geçmiş ölçüm tarihçesi (Panel Measurement History / Trend)
router.get('/panel-history', async (req: AuthRequest, res) => {
  try {
    const { panelName, facilityId } = req.query;
    if (!panelName) {
      return res.status(400).json({ error: 'Pano adı (panelName) gereklidir.' });
    }

    const canonicalFacId = await resolveFacilityId(facilityId as string);
    const whereClause: any = {
      panelName: {
        equals: String(panelName).trim(),
        mode: 'insensitive'
      }
    };

    if (canonicalFacId) {
      whereClause.session = { facilityId: canonicalFacId };
    }

    const history = await prisma.thermalInspectionItem.findMany({
      where: whereClause,
      include: {
        session: {
          select: {
            id: true,
            reportDate: true,
            createdAt: true,
            facility: { select: { id: true, name: true, shortName: true } }
          }
        }
      },
      orderBy: { createdAt: 'asc' }
    });

    res.json(history);
  } catch (error: any) {
    console.error('Error fetching panel history:', error);
    res.status(500).json({ error: error.message || 'Pano geçmişi alınamadı.' });
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
    if (currentPhotos.length + files.length > 3) {
      return res.status(400).json({
        error: `Bir satır için en fazla 3 fotoğraf eklenebilir. Şu an ${currentPhotos.length} fotoğraf var, ${files.length} daha eklenemez.`
      });
    }

    const newUrls = files.map(f => {
      // Derive path accurately from where multer actually saved the file
      const parts = f.destination.split('uploads');
      const relDest = parts.length > 1 ? parts[1] : '/electric-infrastructure/Genel/thermal';
      return `/uploads${relDest.startsWith('/') ? '' : '/'}${relDest}/${f.filename}`.replace(/\\/g, '/').replace(/\/+/g, '/');
    });
    const updatedPhotos = [...currentPhotos, ...newUrls];

    const updated = await prisma.thermalInspectionItem.update({
      where: { id },
      data: {
        photoUrls: updatedPhotos
      }
    });

    res.json({
      message: `${files.length} adet fotoğraf başarıyla eklendi.`,
      newUrls,
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

      const isNormal = (it: any) =>
        (it.status && it.status.toLowerCase().includes('normal')) ||
        (it.priority && (it.priority.toLowerCase().includes('rutin') || it.priority.toLowerCase().includes('düşük')));

      const criticalCount = sess?.items?.filter((it: any) =>
        !isNormal(it) && (
          it.status === 'Kritik' ||
          it.priority === 'Acil' ||
          (!it.status && it.deltaTemp && it.deltaTemp >= 25)
        )
      ).length || 0;

      const warningCount = sess?.items?.filter((it: any) =>
        !isNormal(it) && (
          it.status === 'Dikkat' ||
          it.status === 'Uygunsuz' ||
          it.priority === 'Yüksek' ||
          (!it.status && it.deltaTemp && it.deltaTemp >= 15)
        )
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

// ─────────────────────────────────────────────────────────
// 12. GET & PUT SETTINGS (DELTA T VE EŞİK DEĞERLERİ)
// ─────────────────────────────────────────────────────────
router.get('/settings', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.query;
    let targetFacilityId: string | null = null;
    if (facilityId && facilityId !== 'all') {
      targetFacilityId = (await resolveFacilityId(String(facilityId))) || String(facilityId);
    }

    let setting = null;
    if (targetFacilityId) {
      setting = await prisma.thermalSetting.findUnique({
        where: { facilityId: targetFacilityId }
      });
    }

    if (!setting) {
      // Genel sistem varsayılanı (facilityId = null veya ilk kayıt)
      setting = await prisma.thermalSetting.findFirst({
        where: { facilityId: null }
      });
    }

    if (!setting) {
      setting = {
        id: 'default',
        facilityId: null,
        warningThreshold: 35.0,
        criticalThreshold: 40.0,
        deltaWarning: 15.0,
        deltaCritical: 30.0,
        negativeDeltaWarn: true,
        updatedAt: new Date(),
        createdAt: new Date()
      };
    }

    res.json({ success: true, data: setting });
  } catch (error: any) {
    console.error('Error fetching thermal settings:', error);
    res.status(500).json({ error: error.message || 'Ayarlar alınamadı.' });
  }
});

router.put('/settings', async (req: AuthRequest, res) => {
  try {
    const {
      facilityId,
      warningThreshold,
      criticalThreshold,
      deltaWarning,
      deltaCritical,
      negativeDeltaWarn
    } = req.body;

    let targetFacilityId: string | null = null;
    if (facilityId && facilityId !== 'all') {
      targetFacilityId = (await resolveFacilityId(String(facilityId))) || String(facilityId);
    }

    const payload = {
      warningThreshold: parseFloat(warningThreshold) || 35.0,
      criticalThreshold: parseFloat(criticalThreshold) || 40.0,
      deltaWarning: parseFloat(deltaWarning) || 15.0,
      deltaCritical: parseFloat(deltaCritical) || 30.0,
      negativeDeltaWarn: negativeDeltaWarn !== false
    };

    let setting;
    if (targetFacilityId) {
      setting = await prisma.thermalSetting.upsert({
        where: { facilityId: targetFacilityId },
        update: payload,
        create: { ...payload, facilityId: targetFacilityId }
      });
    } else {
      const existing = await prisma.thermalSetting.findFirst({ where: { facilityId: null } });
      if (existing) {
        setting = await prisma.thermalSetting.update({
          where: { id: existing.id },
          data: payload
        });
      } else {
        setting = await prisma.thermalSetting.create({
          data: { ...payload, facilityId: null }
        });
      }
    }

    res.json({ success: true, data: setting, message: 'Ayarlar başarıyla kaydedildi.' });
  } catch (error: any) {
    console.error('Error saving thermal settings:', error);
    res.status(500).json({ error: error.message || 'Ayarlar kaydedilemedi.' });
  }
});

// ─────────────────────────────────────────────────────────
// 14. PANO KODU ÜRETİM MOTORU VE YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────────────────

export function generateLocationCode(facilityName?: string, facilityShortName?: string): string {
  if (facilityShortName && facilityShortName.trim().length >= 2) {
    const clean = facilityShortName.trim().toUpperCase().replace(/[^A-ZÇĞİÖŞÜ]/g, '');
    if (clean.length >= 3) return clean.substring(0, 3);
    if (clean.length === 2) return clean + '1';
  }
  if (!facilityName) return 'GEN';

  const nameUpper = facilityName.trim().toLocaleUpperCase('tr-TR');
  
  // Bilinen Tesis / Hastane Lokasyon Haritası
  if (nameUpper.includes('BAHÇELİEVLER') || nameUpper.includes('BAHCELIEVLER')) return 'BAH';
  if (nameUpper.includes('ULUS')) return 'ULS';
  if (nameUpper.includes('ATAŞEHİR') || nameUpper.includes('ATASEHIR')) return 'ATA';
  if (nameUpper.includes('GÖZTEPE') || nameUpper.includes('GOZTEPE')) return 'GOZ';
  if (nameUpper.includes('KADIKÖY') || nameUpper.includes('KADIKOY')) return 'KDK';
  if (nameUpper.includes('BEŞİKTAŞ') || nameUpper.includes('BESIKTAS')) return 'BSK';
  if (nameUpper.includes('BAKIRKÖY') || nameUpper.includes('BAKIRKOY')) return 'BAK';
  if (nameUpper.includes('ANKARA')) return 'ANK';
  if (nameUpper.includes('ANTALYA')) return 'ANT';
  if (nameUpper.includes('BURSA')) return 'BUR';
  if (nameUpper.includes('ÇAMLICA') || nameUpper.includes('CAMLICA')) return 'CAM';
  if (nameUpper.includes('FLORYA')) return 'FLO';
  if (nameUpper.includes('GAZİOSMANPAŞA') || nameUpper.includes('GOP')) return 'GOP';
  if (nameUpper.includes('FATİH') || nameUpper.includes('FATIH')) return 'FTH';
  if (nameUpper.includes('SAMSUN')) return 'SAM';
  if (nameUpper.includes('TOKAT')) return 'TOK';
  if (nameUpper.includes('TRABZON')) return 'TRB';
  if (nameUpper.includes('İZMİR') || nameUpper.includes('IZMIR')) return 'IZM';
  if (nameUpper.includes('KOCAELİ') || nameUpper.includes('KOCAELI')) return 'KOC';
  if (nameUpper.includes('MALTEPE')) return 'MLT';
  if (nameUpper.includes('PENDİK') || nameUpper.includes('PENDIK')) return 'PND';
  if (nameUpper.includes('ÜMRANİYE') || nameUpper.includes('UMRANIYE')) return 'UMR';
  if (nameUpper.includes('ÜSKÜDAR') || nameUpper.includes('USKUDAR')) return 'USK';
  if (nameUpper.includes('SARIYER')) return 'SRY';
  if (nameUpper.includes('ŞİŞLİ') || nameUpper.includes('SISLI')) return 'SSL';

  // Genel algoritma: Türkçe büyük harflerden ilk 3 harf
  const cleaned = nameUpper.replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
  return cleaned.substring(0, 3).padEnd(3, 'X');
}

export function generateFloorCode(floorName?: string): string {
  if (!floorName) return 'ZMK';
  const f = floorName.trim().toLocaleLowerCase('tr-TR');

  if (f.includes('çatı') || f.includes('cati') || f.includes('çtk')) return 'ÇTK';
  if (f.includes('zemin') || f === 'zk' || f === '0' || f === '0. kat') return 'ZMK';
  if (f.includes('asma')) return 'ASM';
  if (f.includes('teras')) return 'TRS';
  if (f.includes('otopark')) return 'OTP';

  // Bodrum kat kontrolleri (örn: "bodrum 1", "b1", "b1. kat", "-1", "-1. kat")
  const bodrumMatch = f.match(/(?:bodrum|-|b)\s*(\d+)/i) || f.match(/(\d+)\.\s*bodrum/i);
  if (bodrumMatch) {
    return `B${bodrumMatch[1]}K`;
  }

  // Pozitif kat kontrolleri (örn: "1. kat", "kat 1", "2.kat", "kat 12")
  const katMatch = f.match(/(?:kat\s*)?(\d+)(?:\.\s*kat)?/i);
  if (katMatch) {
    const num = parseInt(katMatch[1], 10);
    return num < 10 ? `K0${num}` : `K${num}`;
  }

  // Fallback: 3 karakter büyük harf
  const clean = floorName.toLocaleUpperCase('tr-TR').replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
  return clean.substring(0, 3).padEnd(3, 'K');
}

export function generateTypeCode(panelTypeName?: string): string {
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

  // Fallback: ilk 3 harf
  const clean = panelTypeName.toLocaleUpperCase('tr-TR').replace(/[^A-ZÇĞİÖŞÜ0-9]/g, '');
  return clean.substring(0, 3).padEnd(3, 'P');
}

// ─────────────────────────────────────────────────────────
// 15. GET PANEL ENVENTORY LIST
// ─────────────────────────────────────────────────────────
router.get('/panels', async (req: AuthRequest, res) => {
  try {
    const { facilityId, floor, panelType, search } = req.query;
    if (!facilityId || facilityId === 'all') {
      return res.status(400).json({ error: 'Lütfen geçerli bir tesis seçin.' });
    }

    const canonicalFacilityId = await resolveFacilityId(String(facilityId));
    if (!canonicalFacilityId) {
      return res.status(404).json({ error: 'Tesis bulunamadı.' });
    }

    const where: any = {
      facilityId: canonicalFacilityId,
      isActive: true
    };

    if (floor && String(floor).trim()) {
      where.floor = String(floor).trim();
    }

    if (panelType && String(panelType).trim()) {
      where.panelType = String(panelType).trim();
    }

    if (search && String(search).trim()) {
      const q = String(search).trim();
      where.OR = [
        { panelCode: { contains: q, mode: 'insensitive' } },
        { panelName: { contains: q, mode: 'insensitive' } },
        { floor: { contains: q, mode: 'insensitive' } },
        { building: { contains: q, mode: 'insensitive' } },
        { block: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { equipmentConnection: { contains: q, mode: 'insensitive' } }
      ];
    }

    const panels = await prisma.thermalPanel.findMany({
      where,
      orderBy: [
        { floor: 'asc' },
        { sequenceNumber: 'asc' },
        { panelCode: 'asc' }
      ]
    });

    // Her panel için ölçüm istatistiklerini getir
    const panelCodesOrNames = panels.flatMap(p => [p.panelCode, p.panelName].filter(Boolean) as string[]);

    // Tesisin tüm ölçümlerini getir
    const inspectionItems = await prisma.thermalInspectionItem.findMany({
      where: {
        session: { facilityId: canonicalFacilityId },
        panelName: { in: panelCodesOrNames }
      },
      select: {
        panelName: true,
        measuredTemp: true,
        ambientTemp: true,
        deltaTemp: true,
        status: true,
        measurementDate: true
      },
      orderBy: { measurementDate: 'asc' }
    });

    // İstatistikleri haritala
    const statsMap = new Map<string, {
      count: number;
      latestTemp: number | null;
      maxTemp: number | null;
      latestDelta: number | null;
      latestDate: string | null;
      isCritical: boolean;
      status: string | null;
    }>();

    inspectionItems.forEach(item => {
      const key = item.panelName.trim();
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          count: 0,
          latestTemp: null,
          maxTemp: null,
          latestDelta: null,
          latestDate: null,
          isCritical: false,
          status: null
        });
      }
      const s = statsMap.get(key)!;
      s.count += 1;
      s.latestTemp = item.measuredTemp;
      s.latestDelta = item.deltaTemp;
      s.latestDate = item.measurementDate ? item.measurementDate.toISOString() : null;
      s.status = item.status || null;
      if (item.measuredTemp !== null && (s.maxTemp === null || item.measuredTemp > s.maxTemp)) {
        s.maxTemp = item.measuredTemp;
      }
      if ((item.measuredTemp ?? 0) >= 40 || (item.deltaTemp ?? 0) >= 15 || item.status === 'Kritik') {
        s.isCritical = true;
      }
    });

    const enrichedPanels = panels.map(p => {
      const stats = statsMap.get(p.panelCode) || (p.panelName ? statsMap.get(p.panelName) : null) || {
        count: 0,
        latestTemp: null,
        maxTemp: null,
        latestDelta: null,
        latestDate: null,
        isCritical: false,
        status: null
      };
      return {
        ...p,
        measurementCount: stats.count,
        latestTemp: stats.latestTemp,
        maxTemp: stats.maxTemp,
        latestDelta: stats.latestDelta,
        latestDate: stats.latestDate,
        isCritical: stats.isCritical,
        latestStatus: stats.status
      };
    });

    res.json({ success: true, data: enrichedPanels });
  } catch (error: any) {
    console.error('Error getting thermal panels:', error);
    res.status(500).json({ error: error.message || 'Pano listesi alınamadı.' });
  }
});

// ─────────────────────────────────────────────────────────
// 16. GET NEXT SEQUENCE & SUGGESTED PANEL CODE
// ─────────────────────────────────────────────────────────
router.get('/panels/next-sequence', async (req: AuthRequest, res) => {
  try {
    const { facilityId, locationCode, floorCode, typeCode } = req.query;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId gereklidir.' });
    }

    const canonicalFacilityId = await resolveFacilityId(String(facilityId));
    if (!canonicalFacilityId) {
      return res.status(404).json({ error: 'Tesis bulunamadı.' });
    }

    const loc = String(locationCode || '').trim();
    const flr = String(floorCode || '').trim();
    const typ = String(typeCode || '').trim();

    const prefix = `${loc}-${flr}-${typ}-`;

    // Bu prefix ile başlayan panoları bul
    const existing = await prisma.thermalPanel.findMany({
      where: {
        facilityId: canonicalFacilityId,
        panelCode: { startsWith: prefix }
      },
      select: { panelCode: true, sequenceNumber: true }
    });

    let maxSeq = 0;
    existing.forEach(p => {
      if (p.sequenceNumber && p.sequenceNumber > maxSeq) {
        maxSeq = p.sequenceNumber;
      }
      const parts = p.panelCode.split('-');
      const lastPart = parts[parts.length - 1];
      const parsedNum = parseInt(lastPart, 10);
      if (!isNaN(parsedNum) && parsedNum > maxSeq) {
        maxSeq = parsedNum;
      }
    });

    const nextSeq = maxSeq + 1;
    const formattedSeq = String(nextSeq).padStart(3, '0');
    const suggestedCode = `${prefix}${formattedSeq}`;

    res.json({
      success: true,
      nextSequence: nextSeq,
      formattedSequence: formattedSeq,
      suggestedCode
    });
  } catch (error: any) {
    console.error('Error getting next panel sequence:', error);
    res.status(500).json({ error: error.message || 'Sıra numarası hesaplanamadı.' });
  }
});

// ─────────────────────────────────────────────────────────
// 17. CREATE PANEL (PANO ENVANTERİ KAYDI)
// ─────────────────────────────────────────────────────────
router.post('/panels', async (req: AuthRequest, res) => {
  try {
    const {
      facilityId,
      panelCode,
      panelName,
      building,
      block,
      floor,
      panelType,
      description,
      locationCode,
      floorCode,
      typeCode,
      sequenceNumber,
      equipmentConnection,
      measurementPoint
    } = req.body;

    if (!facilityId) {
      return res.status(400).json({ error: 'Lütfen bir tesis seçin.' });
    }
    if (!floor || !String(floor).trim()) {
      return res.status(400).json({ error: 'Lütfen bir kat seçin.' });
    }
    if (!panelType || !String(panelType).trim()) {
      return res.status(400).json({ error: 'Lütfen pano tipi seçin.' });
    }

    const canonicalFacilityId = await resolveFacilityId(String(facilityId));
    if (!canonicalFacilityId) {
      return res.status(404).json({ error: 'Tesis bulunamadı.' });
    }

    // Tesis bilgilerini al
    const facility = await prisma.facility.findUnique({
      where: { id: canonicalFacilityId },
      select: { name: true, shortName: true }
    });

    // Otomatik kod bileşenlerini türet (eğer verilmemişse)
    const locCode = locationCode ? String(locationCode).trim().toUpperCase() : generateLocationCode(facility?.name, facility?.shortName || undefined);
    const flrCode = floorCode ? String(floorCode).trim().toUpperCase() : generateFloorCode(floor);
    const typCode = typeCode ? String(typeCode).trim().toUpperCase() : generateTypeCode(panelType);

    let finalSeq = sequenceNumber ? parseInt(String(sequenceNumber), 10) : 1;
    let finalCode = panelCode ? String(panelCode).trim().toUpperCase() : '';

    if (!finalCode) {
      // Kod otomatik oluştur
      const prefix = `${locCode}-${flrCode}-${typCode}-`;
      const existing = await prisma.thermalPanel.findMany({
        where: {
          facilityId: canonicalFacilityId,
          panelCode: { startsWith: prefix }
        },
        select: { panelCode: true, sequenceNumber: true }
      });
      let maxSeq = 0;
      existing.forEach(p => {
        if (p.sequenceNumber && p.sequenceNumber > maxSeq) maxSeq = p.sequenceNumber;
        const parts = p.panelCode.split('-');
        const parsed = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(parsed) && parsed > maxSeq) maxSeq = parsed;
      });
      finalSeq = maxSeq + 1;
      finalCode = `${prefix}${String(finalSeq).padStart(3, '0')}`;
    }

    // Kodun tekilliğini kontrol et
    const existingSameCode = await prisma.thermalPanel.findUnique({
      where: {
        facilityId_panelCode: {
          facilityId: canonicalFacilityId,
          panelCode: finalCode
        }
      }
    });

    if (existingSameCode) {
      return res.status(400).json({
        error: `Bu tesis için '${finalCode}' kodlu pano zaten mevcut. Lütfen sıra numarasını veya pano kodunu değiştirin.`
      });
    }

    const panel = await prisma.thermalPanel.create({
      data: {
        facilityId: canonicalFacilityId,
        panelCode: finalCode,
        panelName: panelName && String(panelName).trim() ? String(panelName).trim() : finalCode,
        building: building ? String(building).trim() : 'Ana Bina',
        block: block ? String(block).trim() : null,
        floor: String(floor).trim(),
        panelType: String(panelType).trim(),
        description: description && String(description).trim() ? String(description).trim() : null,
        locationCode: locCode,
        floorCode: flrCode,
        typeCode: typCode,
        sequenceNumber: finalSeq,
        equipmentConnection: equipmentConnection && String(equipmentConnection).trim() ? String(equipmentConnection).trim() : null,
        measurementPoint: measurementPoint && String(measurementPoint).trim() ? String(measurementPoint).trim() : null,
        isActive: true
      }
    });

    res.status(201).json({
      success: true,
      message: `'${panel.panelCode}' panosu başarıyla envantere eklendi.`,
      data: panel
    });
  } catch (error: any) {
    console.error('Error creating thermal panel:', error);
    res.status(500).json({ error: error.message || 'Pano kaydedilemedi.' });
  }
});

// ─────────────────────────────────────────────────────────
// 18. UPDATE PANEL
// ─────────────────────────────────────────────────────────
router.put('/panels/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const {
      panelCode,
      panelName,
      building,
      block,
      floor,
      panelType,
      description,
      locationCode,
      floorCode,
      typeCode,
      sequenceNumber,
      equipmentConnection,
      measurementPoint,
      isActive
    } = req.body;

    const existing = await prisma.thermalPanel.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pano bulunamadı.' });
    }

    // Kod değişiyorsa tekilliği kontrol et
    if (panelCode && panelCode.trim().toUpperCase() !== existing.panelCode) {
      const codeDuplicate = await prisma.thermalPanel.findUnique({
        where: {
          facilityId_panelCode: {
            facilityId: existing.facilityId,
            panelCode: panelCode.trim().toUpperCase()
          }
        }
      });
      if (codeDuplicate && codeDuplicate.id !== id) {
        return res.status(400).json({
          error: `'${panelCode}' kodlu başka bir pano zaten mevcut.`
        });
      }
    }

    const updated = await prisma.thermalPanel.update({
      where: { id },
      data: {
        ...(panelCode ? { panelCode: panelCode.trim().toUpperCase() } : {}),
        ...(panelName !== undefined ? { panelName: panelName ? panelName.trim() : existing.panelCode } : {}),
        ...(building !== undefined ? { building: building ? building.trim() : null } : {}),
        ...(block !== undefined ? { block: block ? block.trim() : null } : {}),
        ...(floor ? { floor: floor.trim() } : {}),
        ...(panelType ? { panelType: panelType.trim() } : {}),
        ...(description !== undefined ? { description: description && description.trim() ? description.trim() : null } : {}),
        ...(locationCode !== undefined ? { locationCode: locationCode ? locationCode.trim().toUpperCase() : null } : {}),
        ...(floorCode !== undefined ? { floorCode: floorCode ? floorCode.trim().toUpperCase() : null } : {}),
        ...(typeCode !== undefined ? { typeCode: typeCode ? typeCode.trim().toUpperCase() : null } : {}),
        ...(sequenceNumber !== undefined ? { sequenceNumber: sequenceNumber ? parseInt(String(sequenceNumber), 10) : null } : {}),
        ...(equipmentConnection !== undefined ? { equipmentConnection: equipmentConnection ? equipmentConnection.trim() : null } : {}),
        ...(measurementPoint !== undefined ? { measurementPoint: measurementPoint ? measurementPoint.trim() : null } : {}),
        ...(isActive !== undefined ? { isActive: Boolean(isActive) } : {})
      }
    });

    res.json({
      success: true,
      message: 'Pano bilgileri güncellendi.',
      data: updated
    });
  } catch (error: any) {
    console.error('Error updating thermal panel:', error);
    res.status(500).json({ error: error.message || 'Pano güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────
// 19. DELETE PANEL
// ─────────────────────────────────────────────────────────
router.delete('/panels/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.thermalPanel.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ error: 'Pano bulunamadı.' });
    }

    await prisma.thermalPanel.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: `'${existing.panelCode}' panosu envanterden silindi.`
    });
  } catch (error: any) {
    console.error('Error deleting thermal panel:', error);
    res.status(500).json({ error: error.message || 'Pano silinemedi.' });
  }
});

// ─────────────────────────────────────────────────────────
// 20. GET PANEL AUTOCOMPLETE / SUGGESTIONS (ENVANTER + ÖLÇÜMLER)
// ─────────────────────────────────────────────────────────
router.get('/panels/suggestions', async (req: AuthRequest, res) => {
  try {
    const { facilityId, search } = req.query;
    let canonicalFacilityId: string | null = null;
    if (facilityId && facilityId !== 'all') {
      canonicalFacilityId = await resolveFacilityId(String(facilityId));
    }

    const q = search ? String(search).trim() : '';

    // 1. Envanterdeki kayıtlı panolar (Öncelikli)
    const inventoryPanels = await prisma.thermalPanel.findMany({
      where: {
        isActive: true,
        ...(canonicalFacilityId ? { facilityId: canonicalFacilityId } : {}),
        ...(q ? {
          OR: [
            { panelCode: { contains: q, mode: 'insensitive' } },
            { panelName: { contains: q, mode: 'insensitive' } }
          ]
        } : {})
      },
      select: {
        id: true,
        panelCode: true,
        panelName: true,
        building: true,
        block: true,
        floor: true,
        panelType: true,
        equipmentConnection: true,
        measurementPoint: true,
        description: true
      },
      take: 20,
      orderBy: { panelCode: 'asc' }
    });

    // 2. Geçmiş ölçümlerde yer alan panolar
    const whereItems: any = {};
    if (canonicalFacilityId) {
      whereItems.session = { facilityId: canonicalFacilityId };
    }
    if (q) {
      whereItems.panelName = { contains: q, mode: 'insensitive' };
    }

    const items = await prisma.thermalInspectionItem.findMany({
      where: whereItems,
      select: {
        panelName: true,
        buildingLocation: true,
        floorSection: true,
        equipmentConnection: true,
        measurementPoint: true
      },
      distinct: ['panelName'],
      take: 20,
      orderBy: { updatedAt: 'desc' }
    });

    // Envanter sonuçları ile ölçüm sonuçlarını harmanla (envanter öncelikli)
    const seenNames = new Set<string>();
    const combined: any[] = [];

    // Önce envanter panoları
    inventoryPanels.forEach(p => {
      seenNames.add(p.panelCode.toUpperCase());
      if (p.panelName) seenNames.add(p.panelName.toUpperCase());

      combined.push({
        panelName: p.panelCode,
        displayName: p.panelName && p.panelName !== p.panelCode ? `${p.panelCode} (${p.panelName})` : p.panelCode,
        buildingLocation: p.block ? `${p.building || 'Ana Bina'} - ${p.block}` : (p.building || 'Ana Bina'),
        floorSection: p.floor,
        panelType: p.panelType,
        equipmentConnection: p.equipmentConnection,
        measurementPoint: p.measurementPoint,
        isInventory: true,
        panelId: p.id
      });
    });

    // Sonra ölçüm geçmişindeki diğerleri
    items.forEach(item => {
      const up = item.panelName.trim().toUpperCase();
      if (!seenNames.has(up)) {
        seenNames.add(up);
        combined.push({
          panelName: item.panelName,
          displayName: item.panelName,
          buildingLocation: item.buildingLocation,
          floorSection: item.floorSection,
          equipmentConnection: item.equipmentConnection,
          measurementPoint: item.measurementPoint,
          isInventory: false
        });
      }
    });

    res.json({ success: true, data: combined.slice(0, 25) });
  } catch (error: any) {
    console.error('Error getting panel suggestions:', error);
    res.status(500).json({ error: error.message || 'Pano önerileri alınamadı.' });
  }
});

// ─────────────────────────────────────────────────────────
// 21. EXPORT PANEL INVENTORY TO EXCEL (YÖNETİCİ & KULLANICI ÖZELİNDE)
// ─────────────────────────────────────────────────────────
router.get('/panels/export', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.query;
    const isAdminOrMgmt = Boolean(
      req.user?.isAdmin ||
      req.user?.isManagement ||
      req.user?.roles?.some(r => ['admin', 'management', 'manager', 'yonetici'].includes(r.toLowerCase()))
    );

    let where: any = { isActive: true };
    let exportTitle = 'Pano_Envanteri';

    if (facilityId && facilityId !== 'all') {
      const canonicalFacilityId = await resolveFacilityId(String(facilityId));
      if (!canonicalFacilityId) {
        return res.status(404).json({ error: 'Belirtilen tesis bulunamadı.' });
      }
      where.facilityId = canonicalFacilityId;
      const fac = await prisma.facility.findUnique({
        where: { id: canonicalFacilityId },
        select: { name: true, shortName: true }
      });
      if (fac) {
        exportTitle = `${sanitizeFolderName(fac.name)}_Pano_Envanteri`;
      }
    } else {
      // facilityId === 'all' or empty:
      // Eğer kullanıcı yönetici değilse, sadece kullanıcının erişebildiği tesisleri filtrele
      if (!isAdminOrMgmt && req.user?.facilities && req.user.facilities.length > 0) {
        where.facilityId = { in: req.user.facilities };
      }
      exportTitle = 'Tum_Tesisler_Pano_Envanteri';
    }

    const panels = await prisma.thermalPanel.findMany({
      where,
      include: {
        facility: {
          select: { name: true, shortName: true }
        }
      },
      orderBy: [
        { facility: { name: 'asc' } },
        { floor: 'asc' },
        { sequenceNumber: 'asc' },
        { panelCode: 'asc' }
      ]
    });

    // İlgili panoların ölçüm istatistiklerini getir
    const panelCodesOrNames = panels.flatMap(p => [p.panelCode, p.panelName].filter(Boolean) as string[]);
    const inspectionItems = await prisma.thermalInspectionItem.findMany({
      where: {
        ...(where.facilityId ? (typeof where.facilityId === 'string' ? { session: { facilityId: where.facilityId } } : { session: { facilityId: where.facilityId } }) : {}),
        panelName: { in: panelCodesOrNames }
      },
      select: {
        panelName: true,
        measuredTemp: true,
        ambientTemp: true,
        deltaTemp: true,
        status: true,
        measurementDate: true
      },
      orderBy: { measurementDate: 'asc' }
    });

    const statsMap = new Map<string, {
      count: number;
      latestTemp: number | null;
      maxTemp: number | null;
      latestDelta: number | null;
      latestDate: string | null;
      isCritical: boolean;
      status: string | null;
    }>();

    inspectionItems.forEach(item => {
      const key = item.panelName.trim();
      if (!statsMap.has(key)) {
        statsMap.set(key, {
          count: 0,
          latestTemp: null,
          maxTemp: null,
          latestDelta: null,
          latestDate: null,
          isCritical: false,
          status: null
        });
      }
      const s = statsMap.get(key)!;
      s.count += 1;
      s.latestTemp = item.measuredTemp;
      s.latestDelta = item.deltaTemp;
      s.latestDate = item.measurementDate ? item.measurementDate.toLocaleDateString('tr-TR') : null;
      s.status = item.status || null;
      if (item.measuredTemp !== null && (s.maxTemp === null || item.measuredTemp > s.maxTemp)) {
        s.maxTemp = item.measuredTemp;
      }
    });

    // Excel satırlarını hazırla
    const rows = panels.map((p, idx) => {
      const stats = statsMap.get(p.panelCode) || (p.panelName ? statsMap.get(p.panelName) : null) || {
        count: 0,
        latestTemp: null,
        maxTemp: null,
        latestDelta: null,
        latestDate: null,
        status: null
      };

      const createdDateStr = p.createdAt ? new Date(p.createdAt).toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }) : '-';

      return {
        'Sıra No': idx + 1,
        'Tesis / Hastane': p.facility?.name || '—',
        'Pano Kodu': p.panelCode,
        'Pano Adı / Tanımı': p.panelName || p.panelCode,
        'Bina': p.building || 'Ana Bina',
        'Blok': p.block || '-',
        'Kat': p.floor,
        'Pano Tipi': p.panelType,
        'Açıklama': p.description || '-',
        'Ekipman / Bağlantı': p.equipmentConnection || '-',
        'Ölçüm Noktası': p.measurementPoint || '-',
        'Ölçüm Sayısı': stats.count,
        'Son Sıcaklık (°C)': stats.latestTemp !== null ? Number(stats.latestTemp) : '-',
        'Maksimum Sıcaklık (°C)': stats.maxTemp !== null ? Number(stats.maxTemp) : '-',
        'Son Durum': stats.status || (stats.count > 0 ? 'Normal' : 'Ölçüm Yok'),
        'Son Ölçüm Tarihi': stats.latestDate || '-',
        'Kayıt Tarihi': createdDateStr
      };
    });

    const wb = xlsx.utils.book_new();
    const ws = xlsx.utils.json_to_sheet(rows.length > 0 ? rows : [{
      'Bilgi': 'Kayıtlı pano envanteri bulunamadı.'
    }]);

    // Sütun genişlikleri
    ws['!cols'] = [
      { wch: 8 },  // Sıra No
      { wch: 28 }, // Tesis
      { wch: 22 }, // Pano Kodu
      { wch: 26 }, // Pano Adı
      { wch: 15 }, // Bina
      { wch: 12 }, // Blok
      { wch: 14 }, // Kat
      { wch: 22 }, // Pano Tipi
      { wch: 38 }, // Açıklama
      { wch: 22 }, // Ekipman / Bağlantı
      { wch: 20 }, // Ölçüm Noktası
      { wch: 14 }, // Ölçüm Sayısı
      { wch: 18 }, // Son Sıcaklık
      { wch: 20 }, // Maksimum Sıcaklık
      { wch: 14 }, // Son Durum
      { wch: 16 }, // Son Ölçüm Tarihi
      { wch: 18 }  // Kayıt Tarihi
    ];

    xlsx.utils.book_append_sheet(wb, ws, 'Pano Envanteri');

    const dateSuffix = new Date().toISOString().split('T')[0].replace(/-/g, '');
    const filename = `${exportTitle}_${dateSuffix}.xlsx`;
    const buf = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });

    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buf);
  } catch (error: any) {
    console.error('Error exporting panel inventory to excel:', error);
    res.status(500).json({ error: error.message || 'Excel oluşturulamadı.' });
  }
});

export default router;

