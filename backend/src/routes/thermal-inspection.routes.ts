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
    const { sessionIds } = req.body as { sessionIds?: string[] };
    if (!Array.isArray(sessionIds) || sessionIds.length === 0) {
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
// 13. GET PANEL AUTOCOMPLETE / SUGGESTIONS
// ─────────────────────────────────────────────────────────
router.get('/panels/suggestions', async (req: AuthRequest, res) => {
  try {
    const { facilityId, search } = req.query;
    const where: any = {};

    if (facilityId && facilityId !== 'all') {
      const canonical = await resolveFacilityId(String(facilityId));
      where.session = { facilityId: canonical || String(facilityId) };
    }

    if (search && String(search).trim()) {
      where.panelName = {
        contains: String(search).trim(),
        mode: 'insensitive'
      };
    }

    // Tekil pano isimleri ve son konum bilgileri
    const items = await prisma.thermalInspectionItem.findMany({
      where,
      select: {
        panelName: true,
        buildingLocation: true,
        floorSection: true,
        equipmentConnection: true,
        measurementPoint: true
      },
      distinct: ['panelName'],
      take: 25,
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ success: true, data: items });
  } catch (error: any) {
    console.error('Error getting panel suggestions:', error);
    res.status(500).json({ error: error.message || 'Pano önerileri alınamadı.' });
  }
});

export default router;
