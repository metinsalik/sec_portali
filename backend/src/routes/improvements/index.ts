import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Tüm rotalar oturum açmış kullanıcı gerektirir
router.use(authMiddleware);

function getUser(req: AuthRequest) {
  return req.user!;
}

// Sekme normalizasyonu
export const SHEET_MAP: Record<string, { sheetType: string; moduleGroup: string; label: string }> = {
  'Denetimler': { sheetType: 'DENETIMLER', moduleGroup: 'DENETIMLER', label: 'Denetimler' },
  'Elektrik PK': { sheetType: 'ELEKTRIK_PK', moduleGroup: 'ELEKTRIK', label: 'Elektrik PK' },
  'Topraklama PK': { sheetType: 'TOPRAKLAMA_PK', moduleGroup: 'ELEKTRIK', label: 'Topraklama PK' },
  'Paratoner PK': { sheetType: 'PARATONER_PK', moduleGroup: 'ELEKTRIK', label: 'Paratoner PK' },
  'Jeneratör PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK' },
  'Jenerator PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK' },
  'Elektrik Pano Kontrolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Elektrik Pano Kontolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Pano Kontrolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Trafo': { sheetType: 'TRAFO', moduleGroup: 'ELEKTRIK', label: 'Trafo' },
  'UPS': { sheetType: 'UPS', moduleGroup: 'ELEKTRIK', label: 'UPS' },
};

// 1. SADECE HASTANE OLAN TESİSLERİ GETİR
router.get('/facilities', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const isAdmin = user.roles?.includes('admin') || user.roles?.includes('management');

    const whereClause: any = {
      type: { in: ['Hastane', 'hastane', 'HOSPITAL', 'Hospital'] },
      isActive: true,
    };

    if (!isAdmin && user.facilities && user.facilities.length > 0) {
      whereClause.id = { in: user.facilities };
    }

    const facilities = await prisma.facility.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        shortName: true,
        city: true,
        _count: {
          select: {
            improvementRecords: {
              where: { isArchived: false }
            }
          }
        }
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: facilities.map(f => ({
        id: f.id,
        name: f.name,
        shortName: f.shortName || f.name,
        city: f.city || '',
        recordCount: f._count.improvementRecords,
      })),
    });
  } catch (error: any) {
    console.error('Error fetching improvement facilities:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. DASHBOARD ÖZET VERİLERİ (Grup ve Hastane Kırılımı)
router.get('/dashboard-stats', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;

    const whereClause: any = { isArchived: false };
    if (facilityId && facilityId !== 'ALL') {
      whereClause.facilityId = facilityId as string;
    }

    const records = await prisma.improvementRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        facilityId: true,
        moduleGroup: true,
        sheetType: true,
        category: true,
        status: true,
        riskScore: true,
        facility: {
          select: { name: true, shortName: true }
        }
      }
    });

    // Hesaplama motoru (Devir dokümanındaki formüllere sadık)
    let total = records.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let cancelled = 0;
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let negligible = 0;
    let openCritical = 0;
    let openHigh = 0;

    // Kategori ve Sekme Kırılımı
    const sheetCounts: Record<string, { total: number; completed: number; open: number; inProgress: number; notStarted: number }> = {};
    const hospitalCounts: Record<string, { 
      hospitalId: string; 
      hospitalName: string; 
      total: number; 
      completed: number; 
      inProgress: number;
      notStarted: number;
      cancelled: number;
      open: number;
      sheets: Record<string, {
        total: number;
        completed: number;
        inProgress: number;
        notStarted: number;
        cancelled: number;
        open: number;
      }>;
    }> = {};
    const categoryCounts: Record<string, number> = {};

    records.forEach(r => {
      const isCompleted = r.status === 'Tamamlandı';
      const isInProgress = r.status === 'Devam Ediyor';
      const isNotStarted = r.status === 'Başlamadı';
      const isCancelled = r.status === 'İptal Edildi';
      const isOpen = isInProgress || isNotStarted;

      if (isCompleted) completed++;
      else if (isInProgress) inProgress++;
      else if (isNotStarted) notStarted++;
      else if (isCancelled) cancelled++;

      if (r.riskScore === 'Kritik') {
        critical++;
        if (isOpen) openCritical++;
      } else if (r.riskScore === 'Yüksek') {
        high++;
        if (isOpen) openHigh++;
      } else if (r.riskScore === 'Önemli') {
        medium++;
      } else if (r.riskScore === 'Olası') {
        low++;
      } else if (r.riskScore === 'Önemsiz') {
        negligible++;
      }

      // Sekme
      if (!sheetCounts[r.sheetType]) {
        sheetCounts[r.sheetType] = { total: 0, completed: 0, open: 0, inProgress: 0, notStarted: 0 };
      }
      sheetCounts[r.sheetType].total++;
      if (isCompleted) sheetCounts[r.sheetType].completed++;
      if (isInProgress) sheetCounts[r.sheetType].inProgress++;
      if (isNotStarted) sheetCounts[r.sheetType].notStarted++;
      if (isOpen) sheetCounts[r.sheetType].open++;

      // Hastane
      const hospName = r.facility?.shortName || r.facility?.name || 'Bilinmeyen';
      if (!hospitalCounts[r.facilityId]) {
        hospitalCounts[r.facilityId] = { 
          hospitalId: r.facilityId, 
          hospitalName: hospName, 
          total: 0, 
          completed: 0, 
          inProgress: 0,
          notStarted: 0,
          cancelled: 0,
          open: 0,
          sheets: {}
        };
      }
      hospitalCounts[r.facilityId].total++;
      if (isCompleted) hospitalCounts[r.facilityId].completed++;
      if (isInProgress) hospitalCounts[r.facilityId].inProgress++;
      if (isNotStarted) hospitalCounts[r.facilityId].notStarted++;
      if (isCancelled) hospitalCounts[r.facilityId].cancelled++;
      if (isOpen) hospitalCounts[r.facilityId].open++;

      // Hastane Sekme Kırılımı
      if (!hospitalCounts[r.facilityId].sheets[r.sheetType]) {
        hospitalCounts[r.facilityId].sheets[r.sheetType] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          cancelled: 0,
          open: 0,
        };
      }
      hospitalCounts[r.facilityId].sheets[r.sheetType].total++;
      if (isCompleted) hospitalCounts[r.facilityId].sheets[r.sheetType].completed++;
      if (isInProgress) hospitalCounts[r.facilityId].sheets[r.sheetType].inProgress++;
      if (isNotStarted) hospitalCounts[r.facilityId].sheets[r.sheetType].notStarted++;
      if (isCancelled) hospitalCounts[r.facilityId].sheets[r.sheetType].cancelled++;
      if (isOpen) hospitalCounts[r.facilityId].sheets[r.sheetType].open++;

      // Kategori
      if (r.category) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      }
    });

    const activeTotal = total - cancelled;
    let completionRatio = activeTotal > 0 ? (completed / activeTotal) : 0;
    let pct = Math.round(completionRatio * 10000) / 100;
    if (completionRatio < 1 && pct >= 100) {
      pct = 99.99;
    }

    res.json({
      success: true,
      data: {
        summary: {
          total,
          completed,
          inProgress,
          notStarted,
          cancelled,
          open: inProgress + notStarted,
          completionPercentage: pct,
          openCritical,
          openHigh,
          risks: {
            critical,
            high,
            medium,
            low,
            negligible,
          }
        },
        sheets: sheetCounts,
        hospitals: Object.values(hospitalCounts).sort((a, b) => b.total - a.total),
        categories: categoryCounts,
      }
    });
  } catch (error: any) {
    console.error('Error fetching improvement dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. KAYITLARI LİSTELE (Filtreleme, Sekme ve Arama Destekli)
router.get('/records', async (req: AuthRequest, res: Response) => {
  try {
    const {
      facilityId,
      moduleGroup,
      sheetType,
      riskScore,
      status,
      category,
      search,
      page = '1',
      limit = '500',
    } = req.query;

    const whereClause: any = { isArchived: false };

    if (facilityId && facilityId !== 'ALL') {
      whereClause.facilityId = facilityId as string;
    }
    if (moduleGroup && moduleGroup !== 'ALL') {
      whereClause.moduleGroup = moduleGroup as string;
    }
    if (sheetType && sheetType !== 'ALL') {
      whereClause.sheetType = sheetType as string;
    }
    if (riskScore && riskScore !== 'ALL') {
      whereClause.riskScore = riskScore as string;
    }
    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }
    if (category && category !== 'ALL') {
      whereClause.category = category as string;
    }

    if (search) {
      const q = String(search).trim();
      whereClause.OR = [
        { finding: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { equipment: { contains: q, mode: 'insensitive' } },
        { assignedTo: { contains: q, mode: 'insensitive' } },
        { actionPlan: { contains: q, mode: 'insensitive' } },
        { currentNote: { contains: q, mode: 'insensitive' } },
      ];
    }

    const p = parseInt(page as string, 10) || 1;
    const l = Math.min(parseInt(limit as string, 10) || 500, 3000);
    const skip = (p - 1) * l;

    const [total, records] = await Promise.all([
      prisma.improvementRecord.count({ where: whereClause }),
      prisma.improvementRecord.findMany({
        where: whereClause,
        include: {
          facility: {
            select: { id: true, name: true, shortName: true }
          },
          histories: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          }
        },
        orderBy: [
          { rowNo: 'asc' },
          { createdAt: 'desc' }
        ],
        skip,
        take: l,
      })
    ]);

    res.json({
      success: true,
      data: records,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      }
    });
  } catch (error: any) {
    console.error('Error fetching improvement records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 4. KRİTİK MADDELER HAVUZU (Tüm Sekmelerdeki Kritik Kayıtlar)
router.get('/critical', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, status, sheetType } = req.query;

    const whereClause: any = {
      isArchived: false,
      riskScore: 'Kritik',
    };

    if (facilityId && facilityId !== 'ALL') {
      whereClause.facilityId = facilityId as string;
    }
    if (status && status !== 'ALL') {
      whereClause.status = status as string;
    }
    if (sheetType && sheetType !== 'ALL') {
      whereClause.sheetType = sheetType as string;
    }

    const records = await prisma.improvementRecord.findMany({
      where: whereClause,
      include: {
        facility: {
          select: { id: true, name: true, shortName: true }
        }
      },
      orderBy: [
        { facility: { name: 'asc' } },
        { sheetType: 'asc' },
        { rowNo: 'asc' }
      ]
    });

    res.json({
      success: true,
      data: records,
      total: records.length,
    });
  } catch (error: any) {
    console.error('Error fetching critical improvements:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 5. TEKİL KAYIT EKLE (Yeni Kayıt Formu)
router.post('/records', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const {
      facilityId,
      moduleGroup,
      sheetType,
      location,
      equipment,
      finding,
      riskScore,
      assignedTo,
      status,
      actionPlan,
      currentNote,
      auditName,
      category,
      recordDate,
      dueDate,
      applicationType,
    } = req.body;

    if (!facilityId || !finding) {
      return res.status(400).json({ success: false, message: 'Hastane ve Tespit alanları zorunludur.' });
    }

    // Sıradaki rowNo değerini bul
    const lastRecord = await prisma.improvementRecord.findFirst({
      where: { facilityId, sheetType },
      orderBy: { rowNo: 'desc' },
      select: { rowNo: true }
    });
    const nextRowNo = (lastRecord?.rowNo || 0) + 1;

    const record = await prisma.improvementRecord.create({
      data: {
        facilityId,
        moduleGroup: moduleGroup || (sheetType === 'DENETIMLER' ? 'DENETIMLER' : 'ELEKTRIK'),
        sheetType,
        rowNo: nextRowNo,
        location,
        equipment,
        finding,
        riskScore: riskScore || 'Önemli',
        assignedTo,
        status: status || 'Başlamadı',
        actionPlan,
        currentNote,
        auditName,
        category,
        recordDate: recordDate ? new Date(recordDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        applicationType,
        createdBy: user.username,
      }
    });

    // İlk not girilmişse tarihçeye ekle
    if (currentNote) {
      await prisma.improvementRecordHistory.create({
        data: {
          recordId: record.id,
          newNote: currentNote,
          newStatus: record.status,
          changedBy: user.username,
          changedByName: user.fullName || user.username,
        }
      });
    }

    res.json({ success: true, data: record });
  } catch (error: any) {
    console.error('Error creating improvement record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 6. TÜM ALANLARI GÜNCELLE (Düzenle Formu)
router.put('/records/:id', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const { id } = req.params;
    const {
      location,
      equipment,
      finding,
      riskScore,
      assignedTo,
      status,
      actionPlan,
      currentNote,
      auditName,
      category,
      recordDate,
      dueDate,
      applicationType,
    } = req.body;

    const existing = await prisma.improvementRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    }

    const updated = await prisma.improvementRecord.update({
      where: { id },
      data: {
        location,
        equipment,
        finding,
        riskScore,
        assignedTo,
        status,
        actionPlan,
        currentNote,
        auditName,
        category,
        recordDate: recordDate ? new Date(recordDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        applicationType,
        updatedBy: user.username,
      }
    });

    // Durum veya Not değişmişse geçmişe yaz
    if (currentNote !== existing.currentNote || status !== existing.status) {
      await prisma.improvementRecordHistory.create({
        data: {
          recordId: id,
          previousNote: existing.currentNote,
          newNote: currentNote || '',
          previousStatus: existing.status,
          newStatus: status,
          changedBy: user.username,
          changedByName: user.fullName || user.username,
        }
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating improvement record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. HIZLI AKSİYON GİR ("Aksiyon Gir" Penceresi)
router.patch('/records/:id/action-note', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const { id } = req.params;
    const { currentNote, status, actionPlan, dueDate, recordDate } = req.body;

    const existing = await prisma.improvementRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    }

    const newStatus = status || existing.status;

    const updateData: any = {
      currentNote,
      status: newStatus,
      updatedBy: user.username,
    };

    if (actionPlan !== undefined) {
      updateData.actionPlan = actionPlan;
    }
    if (dueDate !== undefined) {
      updateData.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (recordDate !== undefined) {
      updateData.recordDate = recordDate ? new Date(recordDate) : null;
    }

    const updated = await prisma.improvementRecord.update({
      where: { id },
      data: updateData,
    });

    await prisma.improvementRecordHistory.create({
      data: {
        recordId: id,
        previousNote: existing.currentNote,
        newNote: currentNote || '',
        previousStatus: existing.status,
        newStatus: newStatus,
        changedBy: user.username,
        changedByName: user.fullName || user.username,
      }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error adding action note:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 8. TEKİL KAYIT SİL VE SIRA NUMARALARINI GÜNCELLE
router.delete('/records/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    const existing = await prisma.improvementRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    }

    const { facilityId, sheetType, rowNo } = existing;

    await prisma.$transaction(async (tx) => {
      // 1. Kaydı sil
      await tx.improvementRecord.delete({
        where: { id }
      });

      // 2. Eğer silinen kaydın sıra numarası varsa, kendisinden sonraki kayıtların numarasını 1 azaltarak zinciri düzelt
      if (typeof rowNo === 'number' && rowNo > 0) {
        await tx.improvementRecord.updateMany({
          where: {
            facilityId,
            sheetType,
            rowNo: { gt: rowNo }
          },
          data: {
            rowNo: { decrement: 1 }
          }
        });
      }
    });

    res.json({ success: true, message: 'Kayıt silindi ve sıra numaraları güncellendi.' });
  } catch (error: any) {
    console.error('Error deleting improvement record:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. GEÇMİŞ (Audit Log)
router.get('/records/:id/history', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const histories = await prisma.improvementRecordHistory.findMany({
      where: { recordId: id },
      orderBy: { createdAt: 'desc' }
    });

    res.json({ success: true, data: histories });
  } catch (error: any) {
    console.error('Error fetching record history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9. EXCEL İÇE AKTARMA (Sheet Seçimli Toplu Aktarım - `risks` modülü tarzında)
router.post('/import-sheet', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const {
      facilityId,
      sheetName,
      rows,
      sourceFileName,
      mode = 'append', // 'append' (ekle) veya 'replace' (sekmedekileri sil ve yeniden yaz)
    } = req.body;

    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'Hedef hastane seçilmelidir.' });
    }
    if (!sheetName || !Array.isArray(rows) || rows.length === 0) {
      return res.status(400).json({ success: false, message: 'Geçerli bir sekme ve en az bir satır veri gereklidir.' });
    }

    const mapping = SHEET_MAP[sheetName.trim()];
    const sheetType = mapping?.sheetType || 'DENETIMLER';
    const moduleGroup = mapping?.moduleGroup || (sheetType === 'DENETIMLER' ? 'DENETIMLER' : 'ELEKTRIK');

    // Eğer replace modu seçildiyse ilgili hastanenin bu sekmesindeki eski kayıtları temizle
    if (mode === 'replace') {
      await prisma.improvementRecord.deleteMany({
        where: { facilityId, sheetType }
      });
    }

    let insertedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      // Tespit metni olmayan boş satırları geç
      const findingText = r.finding || r.Tespitler || r.tespit;
      if (!findingText || String(findingText).trim() === '') {
        continue;
      }

      const rowNoVal = r.rowNo || r['#'] || (i + 1);
      const parsedRowNo = parseInt(String(rowNoVal), 10) || (i + 1);

      const parseDateVal = (val: any): Date | null => {
        if (!val && val !== 0) return null;
        if (typeof val === 'number') {
          // Excel serial date (days since 1900-01-01)
          if (val > 20000 && val < 60000) {
            return new Date(Math.round((val - 25569) * 86400 * 1000));
          }
        }
        if (typeof val === 'string') {
          const s = val.trim();
          if (!s) return null;
          // Format: DD.MM.YYYY veya DD/MM/YYYY
          const parts = s.split(/[./-]/);
          if (parts.length === 3 && parts[0].length <= 2 && parts[1].length <= 2 && parts[2].length === 4) {
            const day = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const year = parseInt(parts[2], 10);
            const d = new Date(Date.UTC(year, month, day));
            if (!isNaN(d.getTime())) return d;
          }
          const d = new Date(s);
          if (!isNaN(d.getTime())) return d;
        }
        if (val instanceof Date && !isNaN(val.getTime())) {
          return val;
        }
        return null;
      };

      const rawRecordDate = r.recordDate || r.Tarih || r['Tespit Tarihi'] || r['PK Tarihi'] || r['Rapor Tarihi'] || r['Denetim Tarihi'];
      const recordDate = parseDateVal(rawRecordDate);

      const rawDueDate = r.dueDate || r.Termin || r['Termin Tarihi'] || r['Termin'];
      const dueDate = parseDateVal(rawDueDate);

      // Kategori boş gelmişse bile modül grubuna ve tespit içeriğine göre otomatik uygun kategori ata
      let assignedCategory = (r.category || r.Kategori || '').trim();
      if (!assignedCategory) {
        if (moduleGroup === 'ELEKTRIK') {
          assignedCategory = 'Elektrik Güvenliği';
        } else {
          assignedCategory = 'İş Güvenliği / Fiziksel Riskler';
        }
      }

      await prisma.improvementRecord.create({
        data: {
          facilityId,
          moduleGroup,
          sheetType,
          rowNo: parsedRowNo,
          location: r.location || r.Mahal || null,
          equipment: r.equipment || r.Ekipman || null,
          finding: String(findingText).trim(),
          riskScore: r.riskScore || r['Risk Skoru'] || r.risk || 'Önemli',
          assignedTo: r.assignedTo || r.Sorumlusu || r.sorumlu || null,
          status: r.status || r.Durum || 'Başlamadı',
          actionPlan: r.actionPlan || r['İş Planı'] || r['Is Plani'] || null,
          currentNote: r.currentNote || r['Aksiyon / Açıklama'] || r['Aksiyon/Açıklama'] || null,
          auditName: r.auditName || r['Denetim Adı'] || null,
          category: assignedCategory,
          recordDate,
          dueDate,
          applicationType: r.applicationType || r.Uygulama || null,
          sourceFileName: sourceFileName || 'Excel İçe Aktarım',
          createdBy: user.username,
        }
      });

      insertedCount++;
    }

    res.json({
      success: true,
      message: `${sheetName} sekmesinden ${insertedCount} kayıt başarıyla aktarıldı.`,
      insertedCount,
      sheetType,
    });
  } catch (error: any) {
    console.error('Error importing improvement sheet:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 10. HASTANE VEYA SEKME BAZLI KAYITLARI TEMİZLE / SİL
router.delete('/facility-records', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const { facilityId, sheetType } = req.body;

    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'facilityId zorunludur.' });
    }

    const whereClause: any = { facilityId };
    if (sheetType && sheetType !== 'ALL') {
      whereClause.sheetType = sheetType;
    }

    const deleteResult = await prisma.improvementRecord.deleteMany({
      where: whereClause,
    });

    res.json({
      success: true,
      message: `${deleteResult.count} adet kayıt başarıyla silindi.`,
      deletedCount: deleteResult.count,
    });
  } catch (error: any) {
    console.error('Error deleting facility records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 11. KATEGORİ LİSTESİ YÖNETİMİ
export const DEFAULT_CATEGORIES = [
  'Yangın Güvenliği',
  'Elektrik Güvenliği',
  'Mekanik / Tesisat',
  'Kimyasal Güvenlik',
  'İş Güvenliği / Fiziksel Riskler',
  'Acil Durum & Tahliye',
  'Diğer'
];

router.get('/categories', async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.improvementSetting.findUnique({
      where: { key: 'categories' }
    });
    const categories = setting?.value && Array.isArray(setting.value)
      ? setting.value
      : DEFAULT_CATEGORIES;
    res.json({ success: true, data: categories });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/categories', async (req: AuthRequest, res: Response) => {
  try {
    const { categories } = req.body;
    if (!Array.isArray(categories)) {
      return res.status(400).json({ success: false, message: 'Kategori listesi dizi olmalıdır.' });
    }
    const setting = await prisma.improvementSetting.upsert({
      where: { key: 'categories' },
      update: { value: categories },
      create: { key: 'categories', value: categories, description: 'İyileştirme Takip Kategori Listesi' }
    });
    res.json({ success: true, data: setting.value });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 12. SIRA NUMARALARINI YENİDEN DÜZENLE (Otomatik Boşluk Giderme)
router.post('/renumber', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, sheetType } = req.body;
    const whereClause: any = { isArchived: false };
    if (facilityId && facilityId !== 'ALL') {
      whereClause.facilityId = facilityId;
    }
    if (sheetType && sheetType !== 'ALL') {
      whereClause.sheetType = sheetType;
    }

    const records = await prisma.improvementRecord.findMany({
      where: whereClause,
      orderBy: [
        { facilityId: 'asc' },
        { sheetType: 'asc' },
        { rowNo: 'asc' },
        { createdAt: 'asc' }
      ],
      select: { id: true, facilityId: true, sheetType: true, rowNo: true }
    });

    // Her hastane ve sekme grubu için 1'den başlat
    const groups: Record<string, typeof records> = {};
    for (const r of records) {
      const key = `${r.facilityId}_${r.sheetType}`;
      if (!groups[key]) groups[key] = [];
      groups[key].push(r);
    }

    let updatedCount = 0;
    await prisma.$transaction(async (tx) => {
      for (const key of Object.keys(groups)) {
        const list = groups[key];
        for (let i = 0; i < list.length; i++) {
          const expectedNo = i + 1;
          if (list[i].rowNo !== expectedNo) {
            await tx.improvementRecord.update({
              where: { id: list[i].id },
              data: { rowNo: expectedNo }
            });
            updatedCount++;
          }
        }
      }
    });

    res.json({
      success: true,
      message: `Sıra numaraları başarıyla güncellendi. (${updatedCount} kayıt düzeltildi)`,
      updatedCount
    });
  } catch (error: any) {
    console.error('Error renumbering improvement records:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
