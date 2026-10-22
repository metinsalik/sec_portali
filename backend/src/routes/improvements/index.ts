import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import path from 'path';
import fs from 'fs';
import multer from 'multer';
import sharp from 'sharp';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Tesis adını temiz ve güvenli bir klasör ismine dönüştürür (örn: LIV VADİ -> liv_vadi)
const sanitizeFolderName = (str: string): string => {
  const trMap: Record<string, string> = {
    'ç': 'c', 'Ç': 'c', 'ğ': 'g', 'Ğ': 'g', 'ı': 'i', 'I': 'i', 'İ': 'i',
    'ö': 'o', 'Ö': 'o', 'ş': 's', 'Ş': 's', 'ü': 'u', 'Ü': 'u'
  };
  let clean = String(str || '').toLowerCase().replace(/[çÇğĞıIİöÖşŞüÜ]/g, (m) => trMap[m] || m);
  clean = clean.replace(/[^a-z0-9_-]/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '');
  return clean || 'general';
};

const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 35 * 1024 * 1024, // 35MB max ham dosya boyutu
  }
});

// Tüm rotalar oturum açmış kullanıcı gerektirir
router.use(authMiddleware);

function getUser(req: AuthRequest) {
  return req.user!;
}

// Sekme normalizasyonu
export const SHEET_MAP: Record<string, { sheetType: string; moduleGroup: string; label: string }> = {
  // Denetimler (Excel'deki Denetimler sekmesi Merkezi Denetimler olarak kaydedilir)
  'Denetimler': { sheetType: 'MERKEZI_DENETIMLER', moduleGroup: 'DENETIMLER', label: 'Merkezi Denetimler' },
  'Hastane İç Denetimleri': { sheetType: 'HASTANE_IC_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Hastane İç Denetimleri' },
  'Hastane Ic Denetimleri': { sheetType: 'HASTANE_IC_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Hastane İç Denetimleri' },
  'Merkezi Denetimler': { sheetType: 'MERKEZI_DENETIMLER', moduleGroup: 'DENETIMLER', label: 'Merkezi Denetimler' },
  'Sağlık Denetimleri': { sheetType: 'SAGLIK_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Sağlık Denetimleri' },
  'Saglik Denetimleri': { sheetType: 'SAGLIK_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'Sağlık Denetimleri' },
  'İtfaiye/Yangın Komisyonu Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },
  'İtfaiye Yangın Komisyonu Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },
  'Itfaiye Yangin Komisyonu Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },
  'İtfaiye Denetimleri': { sheetType: 'ITFAIYE_YANGIN_DENETIMLERI', moduleGroup: 'DENETIMLER', label: 'İtfaiye/Yangın Komisyonu Denetimleri' },

  // Elektrik Emniyet Raporu
  'Elektrik PK': { sheetType: 'ELEKTRIK_PK', moduleGroup: 'ELEKTRIK', label: 'Elektrik PK' },
  'Topraklama PK': { sheetType: 'TOPRAKLAMA_PK', moduleGroup: 'ELEKTRIK', label: 'Topraklama PK' },
  'Paratoner PK': { sheetType: 'PARATONER_PK', moduleGroup: 'ELEKTRIK', label: 'Paratoner PK' },
  'Jeneratör PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK & Bakım' },
  'Jenerator PK': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK & Bakım' },
  'Jeneratör PK & Bakım': { sheetType: 'JENERATOR_PK', moduleGroup: 'ELEKTRIK', label: 'Jeneratör PK & Bakım' },
  'Elektrik Pano Kontrolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Elektrik Pano Kontolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Pano Kontrolleri': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Enerji Analiz Raporu': { sheetType: 'ELEKTRIK_PANO_KONTROLLERI', moduleGroup: 'ELEKTRIK', label: 'Elektrik Pano Kontrolleri' },
  'Trafo': { sheetType: 'TRAFO', moduleGroup: 'ELEKTRIK', label: 'Trafo PK & Bakım' },
  'Trafo PK & Bakım': { sheetType: 'TRAFO', moduleGroup: 'ELEKTRIK', label: 'Trafo PK & Bakım' },
  'UPS': { sheetType: 'UPS', moduleGroup: 'ELEKTRIK', label: 'UPS PK & Bakım' },
  'UPS PK & Bakım': { sheetType: 'UPS', moduleGroup: 'ELEKTRIK', label: 'UPS PK & Bakım' },

  // Mekanik Emniyet Raporu
  'Kazanlar': { sheetType: 'KAZANLAR', moduleGroup: 'MEKANIK', label: 'Kazanlar' },
  'Chillerler': { sheetType: 'CHILLERLER', moduleGroup: 'MEKANIK', label: 'Chillerler' },
  'Klima Santralleri': { sheetType: 'KLIMA_SANTRALLERI', moduleGroup: 'MEKANIK', label: 'Klima Santralleri' },

  // Yangın Sistemleri Emniyet Raporu
  'Sulu Söndürme PK & Bakım': { sheetType: 'SULU_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Sulu Söndürme PK & Bakım' },
  'Sulu Söndürme PK': { sheetType: 'SULU_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Sulu Söndürme PK & Bakım' },
  'Sulu Söndürme': { sheetType: 'SULU_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Sulu Söndürme PK & Bakım' },
  'Gazlı Söndürme PK & Bakım': { sheetType: 'GAZLI_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Gazlı Söndürme PK & Bakım' },
  'Gazlı Söndürme PK': { sheetType: 'GAZLI_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Gazlı Söndürme PK & Bakım' },
  'Gazlı Söndürme': { sheetType: 'GAZLI_SONDURME_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Gazlı Söndürme PK & Bakım' },
  'Basınçlandırma Sistemleri PK & Bakım': { sheetType: 'BASINCLANDIRMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Basınçlandırma Sistemleri PK & Bakım' },
  'Basınçlandırma Sistemleri': { sheetType: 'BASINCLANDIRMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Basınçlandırma Sistemleri PK & Bakım' },
  'Yangın Algılama ve Uyarı Sistemleri PK & Bakım': { sheetType: 'YANGIN_ALGILAMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım' },
  'Yangın Algılama ve Uyarı Sistemleri': { sheetType: 'YANGIN_ALGILAMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım' },
  'Yangın Algılama': { sheetType: 'YANGIN_ALGILAMA_PK_BAKIM', moduleGroup: 'YANGIN', label: 'Yangın Algılama ve Uyarı Sistemleri PK & Bakım' },
};

export function parseBudget(val: any): number | null {
  if (val === undefined || val === null || val === '') return null;
  if (typeof val === 'number') return isNaN(val) ? null : val;
  if (typeof val === 'string') {
    let cleaned = val.replace(/[^0-9.,]/g, '').trim();
    if (!cleaned) return null;
    if (cleaned.includes('.') && cleaned.includes(',')) {
      cleaned = cleaned.replace(/\./g, '').replace(',', '.');
    } else if (cleaned.includes(',')) {
      cleaned = cleaned.replace(',', '.');
    }
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }
  return null;
}

export function normalizeRiskScore(val: any): string {
  const s = (val || '').toString().trim();
  if (!s) return 'Önemli';
  const lower = s.toLowerCase();
  if (lower === 'kritik') return 'Kritik';
  if (lower === 'çok yüksek' || lower === 'cok yuksek' || lower === 'yüksek' || lower === 'yuksek') return 'Yüksek';
  if (lower === 'önemli' || lower === 'onemli' || lower === 'orta') return 'Önemli';
  if (lower === 'olası' || lower === 'olasi' || lower === 'düşük' || lower === 'dusuk') return 'Olası';
  if (lower === 'önemsiz' || lower === 'onemsiz') return 'Önemsiz';
  return s;
}

export function getModuleGroup(sheetType: string, explicitGroup?: string): string {
  if (explicitGroup) return explicitGroup;
  if (['HASTANE_IC_DENETIMLERI', 'MERKEZI_DENETIMLER', 'SAGLIK_DENETIMLERI', 'ITFAIYE_YANGIN_DENETIMLERI', 'DENETIMLER'].includes(sheetType)) {
    return 'DENETIMLER';
  }
  if (['KAZANLAR', 'CHILLERLER', 'KLIMA_SANTRALLERI'].includes(sheetType)) {
    return 'MEKANIK';
  }
  if (['SULU_SONDURME_PK_BAKIM', 'GAZLI_SONDURME_PK_BAKIM', 'BASINCLANDIRMA_PK_BAKIM', 'YANGIN_ALGILAMA_PK_BAKIM'].includes(sheetType)) {
    return 'YANGIN';
  }
  return 'ELEKTRIK';
}

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
    const { facilityId, moduleGroup } = req.query;

    const MODULE_SHEET_MAP: Record<string, string[]> = {
      DENETIMLER: ['HASTANE_IC_DENETIMLERI', 'MERKEZI_DENETIMLER', 'SAGLIK_DENETIMLERI', 'ITFAIYE_YANGIN_DENETIMLERI', 'DENETIMLER'],
      ELEKTRIK: ['ELEKTRIK_PK', 'TOPRAKLAMA_PK', 'PARATONER_PK', 'JENERATOR_PK', 'ELEKTRIK_PANO_KONTROLLERI', 'TRAFO', 'UPS'],
      MEKANIK: ['KAZANLAR', 'CHILLERLER', 'KLIMA_SANTRALLERI'],
      YANGIN: ['SULU_SONDURME_PK_BAKIM', 'GAZLI_SONDURME_PK_BAKIM', 'BASINCLANDIRMA_PK_BAKIM', 'YANGIN_ALGILAMA_PK_BAKIM'],
    };

    const whereAnd: any[] = [{ isArchived: false }];

    if (facilityId && facilityId !== 'ALL') {
      whereAnd.push({ facilityId: facilityId as string });
    }

    if (moduleGroup && moduleGroup !== 'ALL') {
      const allowedSheets = MODULE_SHEET_MAP[moduleGroup as string] || [];
      whereAnd.push({
        OR: [
          { moduleGroup: moduleGroup as string },
          { sheetType: { in: allowedSheets } }
        ]
      });
    }

    const whereClause = whereAnd.length === 1 ? whereAnd[0] : { AND: whereAnd };

    const records = await prisma.improvementRecord.findMany({
      where: whereClause,
      select: {
        id: true,
        facilityId: true,
        moduleGroup: true,
        sheetType: true,
        category: true,
        status: true,
        progress: true,
        riskScore: true,
        assignedTo: true,
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
    let totalProgressSum = 0;
    let inProgressProgressSum = 0;
    let nearCompletion = 0; // >= 70
    let inExecution = 0;    // 30 - 69
    let earlyStage = 0;     // < 30
    let critical = 0;
    let high = 0;
    let medium = 0;
    let low = 0;
    let negligible = 0;
    let openCritical = 0;
    let openHigh = 0;
    let missingAssigneeTotal = 0;

    // Kategori, Sekme ve Modül Kırılımı
    const sheetCounts: Record<string, any> = {};
    const hospitalCounts: Record<string, any> = {};
    const categoryCounts: Record<string, number> = {};

    const moduleCounts: Record<string, any> = {
      DENETIMLER: { key: 'DENETIMLER', label: 'Denetimler', path: '/operations-management/improvements/denetimler/dashboard', total: 0, completed: 0, inProgress: 0, notStarted: 0, cancelled: 0, progressSum: 0, inProgressProgressSum: 0, inProgressBrackets: { nearCompletion: 0, inExecution: 0, earlyStage: 0 } },
      ELEKTRIK: { key: 'ELEKTRIK', label: 'Elektrik', path: '/operations-management/improvements/electrical/dashboard', total: 0, completed: 0, inProgress: 0, notStarted: 0, cancelled: 0, progressSum: 0, inProgressProgressSum: 0, inProgressBrackets: { nearCompletion: 0, inExecution: 0, earlyStage: 0 } },
      MEKANIK: { key: 'MEKANIK', label: 'Mekanik', path: '/operations-management/improvements/mechanical/dashboard', total: 0, completed: 0, inProgress: 0, notStarted: 0, cancelled: 0, progressSum: 0, inProgressProgressSum: 0, inProgressBrackets: { nearCompletion: 0, inExecution: 0, earlyStage: 0 } },
      YANGIN: { key: 'YANGIN', label: 'Yangın Güvenliği', path: '/operations-management/improvements/fire/dashboard', total: 0, completed: 0, inProgress: 0, notStarted: 0, cancelled: 0, progressSum: 0, inProgressProgressSum: 0, inProgressBrackets: { nearCompletion: 0, inExecution: 0, earlyStage: 0 } },
    };

    // 1. Durum Dağılımı Sayaçları (Grafik 1 - 7 Kategori)
    const statusDistribution: Record<string, number> = {
      'Tamamlandı': 0,
      'Devam Ediyor': 0,
      'Başlamadı': 0,
      'İptal Edildi': 0,
      'Açık': 0,
      'Girilmemiş': 0,
      'Tanımsız durum': 0,
    };

    // 2. Risk Dağılımı Sayaçları (Kritik, Yüksek, Önemli, Olası, Önemsiz, Girilmemiş, Tanımsız)
    const riskDistribution: Record<string, number> = {
      'Kritik': 0,
      'Yüksek': 0,
      'Önemli': 0,
      'Olası': 0,
      'Önemsiz': 0,
      'Girilmemiş': 0,
      'Tanımsız risk': 0,
    };

    records.forEach(r => {
      const isCompleted = r.status === 'Tamamlandı';
      const isInProgress = r.status === 'Devam Ediyor';
      const isNotStarted = r.status === 'Başlamadı';
      const isCancelled = r.status === 'İptal Edildi';
      const isDirectOpen = r.status === 'Açık';
      const isOpen = isInProgress || isNotStarted || isDirectOpen;
      const isHighCritical = (r.riskScore === 'Kritik' || r.riskScore === 'Yüksek');
      const isOpenHighCritical = isHighCritical && !isCompleted && !isCancelled;

      if (isCompleted) {
        completed++;
      } else if (isInProgress) {
        inProgress++;
        const p = Math.min(100, Math.max(0, r.progress || 0));
        if (p >= 70) nearCompletion++;
        else if (p >= 30) inExecution++;
        else earlyStage++;
      } else if (isNotStarted) {
        notStarted++;
      } else if (isCancelled) {
        cancelled++;
      }

      // İlerleme Yüzdesi (Progress) Katkısı
      const recProgress = isCompleted ? 100 : (isInProgress ? Math.min(100, Math.max(0, r.progress || 0)) : 0);
      if (!isCancelled) {
        totalProgressSum += recProgress;
        if (isInProgress) {
          inProgressProgressSum += recProgress;
        }
      }

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

      // Durum Dağılımı Sınıflandırma
      const st = (r.status || '').trim();
      let isUnspecifiedStatus = false;
      if (!st) {
        statusDistribution['Girilmemiş']++;
        isUnspecifiedStatus = true;
      } else if (st === 'Tamamlandı') {
        statusDistribution['Tamamlandı']++;
      } else if (st === 'Devam Ediyor') {
        statusDistribution['Devam Ediyor']++;
      } else if (st === 'Başlamadı') {
        statusDistribution['Başlamadı']++;
      } else if (st === 'İptal Edildi') {
        statusDistribution['İptal Edildi']++;
      } else if (st === 'Açık') {
        statusDistribution['Açık']++;
      } else {
        const lowerSt = st.toLowerCase();
        if (lowerSt === 'tamamlandi' || lowerSt === 'bitti' || lowerSt === 'kapalı' || lowerSt === 'kapali') {
          statusDistribution['Tamamlandı']++;
        } else if (lowerSt === 'devam' || lowerSt === 'sürüyor') {
          statusDistribution['Devam Ediyor']++;
        } else if (lowerSt === 'baslamadi' || lowerSt === 'yeni') {
          statusDistribution['Başlamadı']++;
        } else if (lowerSt === 'iptal') {
          statusDistribution['İptal Edildi']++;
        } else if (lowerSt === 'acik') {
          statusDistribution['Açık']++;
        } else {
          statusDistribution['Tanımsız durum']++;
          isUnspecifiedStatus = true;
        }
      }

      // Risk Dağılımı Sınıflandırma
      const rs = (r.riskScore || '').trim();
      if (!rs) {
        riskDistribution['Girilmemiş']++;
      } else if (rs === 'Kritik') {
        riskDistribution['Kritik']++;
      } else if (rs === 'Yüksek') {
        riskDistribution['Yüksek']++;
      } else if (rs === 'Önemli') {
        riskDistribution['Önemli']++;
      } else if (rs === 'Olası') {
        riskDistribution['Olası']++;
      } else if (rs === 'Önemsiz') {
        riskDistribution['Önemsiz']++;
      } else {
        const lowerRs = rs.toLowerCase();
        if (lowerRs === 'kritik') {
          riskDistribution['Kritik']++;
        } else if (lowerRs === 'çok yüksek' || lowerRs === 'cok yuksek' || lowerRs === 'yüksek' || lowerRs === 'yuksek') {
          riskDistribution['Yüksek']++;
        } else if (lowerRs === 'önemli' || lowerRs === 'onemli' || lowerRs === 'orta') {
          riskDistribution['Önemli']++;
        } else if (lowerRs === 'olası' || lowerRs === 'olasi' || lowerRs === 'düşük' || lowerRs === 'dusuk') {
          riskDistribution['Olası']++;
        } else if (lowerRs === 'önemsiz' || lowerRs === 'onemsiz') {
          riskDistribution['Önemsiz']++;
        } else {
          riskDistribution['Tanımsız risk']++;
        }
      }

      // Sekme
      if (!sheetCounts[r.sheetType]) {
        sheetCounts[r.sheetType] = { 
          total: 0, 
          completed: 0, 
          open: 0, 
          inProgress: 0, 
          notStarted: 0, 
          openStatus: 0, 
          cancelled: 0, 
          openHighCritical: 0,
          critical: 0,
          durumEksik: 0,
          missingAssignee: 0,
          progressSum: 0,
          inProgressProgressSum: 0,
          completionPercentage: 0,
          weightedCompletionPercentage: 0,
          avgInProgressProgress: 0,
          inProgressBrackets: { nearCompletion: 0, inExecution: 0, earlyStage: 0 }
        };
      }
      sheetCounts[r.sheetType].total++;
      if (isCompleted) sheetCounts[r.sheetType].completed++;
      if (isInProgress) {
        sheetCounts[r.sheetType].inProgress++;
        const p = Math.min(100, Math.max(0, r.progress || 0));
        sheetCounts[r.sheetType].inProgressProgressSum = (sheetCounts[r.sheetType].inProgressProgressSum || 0) + p;
        if (p >= 70) sheetCounts[r.sheetType].inProgressBrackets.nearCompletion++;
        else if (p >= 30) sheetCounts[r.sheetType].inProgressBrackets.inExecution++;
        else sheetCounts[r.sheetType].inProgressBrackets.earlyStage++;
      }
      if (isNotStarted) sheetCounts[r.sheetType].notStarted++;
      if (isDirectOpen) sheetCounts[r.sheetType].openStatus++;
      if (isCancelled) sheetCounts[r.sheetType].cancelled++;
      if (isOpen) sheetCounts[r.sheetType].open++;
      if (isOpenHighCritical) sheetCounts[r.sheetType].openHighCritical++;
      if (r.riskScore === 'Kritik') sheetCounts[r.sheetType].critical++;
      if (isUnspecifiedStatus) sheetCounts[r.sheetType].durumEksik++;
      if (!isCancelled) sheetCounts[r.sheetType].progressSum += recProgress;
      if (!r.assignedTo || !r.assignedTo.trim()) {
        sheetCounts[r.sheetType].missingAssignee++;
        missingAssigneeTotal++;
      }

      // Modül Kırılımı (Denetimler, Elektrik, Mekanik, Yangın)
      const matchedMod = Object.keys(MODULE_SHEET_MAP).find(mg => 
        r.moduleGroup === mg || MODULE_SHEET_MAP[mg].includes(r.sheetType)
      ) || (r.moduleGroup && moduleCounts[r.moduleGroup] ? r.moduleGroup : null);

      if (matchedMod && moduleCounts[matchedMod]) {
        const mc = moduleCounts[matchedMod];
        mc.total++;
        if (isCompleted) mc.completed++;
        if (isInProgress) {
          mc.inProgress++;
          const p = Math.min(100, Math.max(0, r.progress || 0));
          mc.inProgressProgressSum += p;
          if (p >= 70) mc.inProgressBrackets.nearCompletion++;
          else if (p >= 30) mc.inProgressBrackets.inExecution++;
          else mc.inProgressBrackets.earlyStage++;
        }
        if (isNotStarted) mc.notStarted++;
        if (isCancelled) mc.cancelled++;
        if (!isCancelled) mc.progressSum += recProgress;
      }

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
          openStatus: 0,
          cancelled: 0,
          openHighCritical: 0,
          progressSum: 0,
          completionPercentage: 0,
          weightedCompletionPercentage: 0,
          open: 0,
          sheets: {}
        };
      }
      hospitalCounts[r.facilityId].total++;
      if (isCompleted) hospitalCounts[r.facilityId].completed++;
      if (isInProgress) hospitalCounts[r.facilityId].inProgress++;
      if (isNotStarted) hospitalCounts[r.facilityId].notStarted++;
      if (isDirectOpen) hospitalCounts[r.facilityId].openStatus++;
      if (isCancelled) hospitalCounts[r.facilityId].cancelled++;
      if (isOpen) hospitalCounts[r.facilityId].open++;
      if (isOpenHighCritical) hospitalCounts[r.facilityId].openHighCritical++;
      if (!isCancelled) hospitalCounts[r.facilityId].progressSum += recProgress;

      // Hastane Sekme Kırılımı
      if (!hospitalCounts[r.facilityId].sheets[r.sheetType]) {
        hospitalCounts[r.facilityId].sheets[r.sheetType] = {
          total: 0,
          completed: 0,
          inProgress: 0,
          notStarted: 0,
          openStatus: 0,
          cancelled: 0,
          open: 0,
          openHighCritical: 0,
          progressSum: 0,
          completionPercentage: 0,
          weightedCompletionPercentage: 0,
        };
      }
      hospitalCounts[r.facilityId].sheets[r.sheetType].total++;
      if (isCompleted) hospitalCounts[r.facilityId].sheets[r.sheetType].completed++;
      if (isInProgress) hospitalCounts[r.facilityId].sheets[r.sheetType].inProgress++;
      if (isNotStarted) hospitalCounts[r.facilityId].sheets[r.sheetType].notStarted++;
      if (isDirectOpen) hospitalCounts[r.facilityId].sheets[r.sheetType].openStatus++;
      if (isCancelled) hospitalCounts[r.facilityId].sheets[r.sheetType].cancelled++;
      if (isOpen) hospitalCounts[r.facilityId].sheets[r.sheetType].open++;
      if (isOpenHighCritical) hospitalCounts[r.facilityId].sheets[r.sheetType].openHighCritical++;
      if (!isCancelled) hospitalCounts[r.facilityId].sheets[r.sheetType].progressSum += recProgress;

      // Kategori
      if (r.category) {
        categoryCounts[r.category] = (categoryCounts[r.category] || 0) + 1;
      }
    });

    // Her sekmenin tamamlanma ve ağırlıklı ilerleme yüzdesini hesapla
    Object.keys(sheetCounts).forEach(sKey => {
      const s = sheetCounts[sKey];
      const active = s.total - s.cancelled;
      s.completionPercentage = active > 0 ? Math.round((s.completed / active) * 10000) / 100 : 0;
      s.weightedCompletionPercentage = active > 0 ? Math.round(((s.progressSum || 0) / active) * 100) / 100 : 0;
      s.avgInProgressProgress = s.inProgress > 0 ? Math.round(((s.inProgressProgressSum || 0) / s.inProgress) * 10) / 10 : 0;
    });

    // Her ana modülün (Denetimler, Elektrik, Mekanik, Yangın) tamamlanma ve ağırlıklı ilerleme yüzdesini hesapla
    Object.keys(moduleCounts).forEach(mKey => {
      const m = moduleCounts[mKey];
      const active = m.total - m.cancelled;
      m.completionPercentage = active > 0 ? Math.round((m.completed / active) * 10000) / 100 : 0;
      m.weightedCompletionPercentage = active > 0 ? Math.round(((m.progressSum || 0) / active) * 100) / 100 : 0;
      m.avgInProgressProgress = m.inProgress > 0 ? Math.round(((m.inProgressProgressSum || 0) / m.inProgress) * 10) / 10 : 0;
    });

    // Her hastanenin tamamlanma ve ağırlıklı ilerleme yüzdesini hesapla
    Object.keys(hospitalCounts).forEach(hId => {
      const h = hospitalCounts[hId];
      const active = h.total - h.cancelled;
      h.completionPercentage = active > 0 ? Math.round((h.completed / active) * 10000) / 100 : 0;
      h.weightedCompletionPercentage = active > 0 ? Math.round(((h.progressSum || 0) / active) * 100) / 100 : 0;
    });

    // Grup genelindeki hastane karşılaştırma listesi (Hastane seçiminden bağımsız)
    let groupHospitals: any[] = [];
    if (facilityId && facilityId !== 'ALL') {
      const compWhere: any = { isArchived: false };
      if (moduleGroup && moduleGroup !== 'ALL') {
        const allowedSheets = MODULE_SHEET_MAP[moduleGroup as string] || [];
        compWhere.OR = [
          { moduleGroup: moduleGroup as string },
          { sheetType: { in: allowedSheets } }
        ];
      }
      const allHospitalRecs = await prisma.improvementRecord.findMany({
        where: compWhere,
        select: {
          facilityId: true,
          status: true,
          progress: true,
          riskScore: true,
          facility: { select: { name: true, shortName: true } }
        }
      });
      const ghCounts: Record<string, any> = {};
      allHospitalRecs.forEach(r => {
        const isComp = r.status === 'Tamamlandı';
        const isProg = r.status === 'Devam Ediyor';
        const isNotSt = r.status === 'Başlamadı';
        const isCanc = r.status === 'İptal Edildi';
        const isDirOpen = r.status === 'Açık';
        const isOp = isProg || isNotSt || isDirOpen;
        const isHighCrit = (r.riskScore === 'Kritik' || r.riskScore === 'Yüksek');
        const isOpHighCrit = isHighCrit && !isComp && !isCanc;
        const recProgress = isComp ? 100 : (isProg ? Math.min(100, Math.max(0, r.progress || 0)) : 0);

        const hName = r.facility?.shortName || r.facility?.name || 'Bilinmeyen';
        if (!ghCounts[r.facilityId]) {
          ghCounts[r.facilityId] = {
            hospitalId: r.facilityId,
            hospitalName: hName,
            total: 0,
            completed: 0,
            inProgress: 0,
            notStarted: 0,
            openStatus: 0,
            cancelled: 0,
            open: 0,
            openHighCritical: 0,
            progressSum: 0,
            completionPercentage: 0,
            weightedCompletionPercentage: 0,
          };
        }
        ghCounts[r.facilityId].total++;
        if (isComp) ghCounts[r.facilityId].completed++;
        if (isProg) ghCounts[r.facilityId].inProgress++;
        if (isNotSt) ghCounts[r.facilityId].notStarted++;
        if (isDirOpen) ghCounts[r.facilityId].openStatus++;
        if (isCanc) ghCounts[r.facilityId].cancelled++;
        if (isOp) ghCounts[r.facilityId].open++;
        if (isOpHighCrit) ghCounts[r.facilityId].openHighCritical++;
        if (!isCanc) ghCounts[r.facilityId].progressSum += recProgress;
      });
      Object.keys(ghCounts).forEach(hId => {
        const h = ghCounts[hId];
        const active = h.total - h.cancelled;
        h.completionPercentage = active > 0 ? Math.round((h.completed / active) * 10000) / 100 : 0;
        h.weightedCompletionPercentage = active > 0 ? Math.round(((h.progressSum || 0) / active) * 100) / 100 : 0;
      });
      groupHospitals = Object.values(ghCounts).sort((a, b) => b.total - a.total);
    } else {
      groupHospitals = Object.values(hospitalCounts).sort((a, b) => b.total - a.total);
    }

    const activeTotal = total - cancelled;
    let completionRatio = activeTotal > 0 ? (completed / activeTotal) : 0;
    let pct = Math.round(completionRatio * 10000) / 100;
    if (completionRatio < 1 && pct >= 100) {
      pct = 99.99;
    }

    const weightedRatio = activeTotal > 0 ? (totalProgressSum / activeTotal) : 0;
    const weightedPct = Math.round(weightedRatio * 100) / 100;
    const avgInProgress = inProgress > 0 ? Math.round(inProgressProgressSum / inProgress) : 0;

    res.json({
      success: true,
      data: {
        summary: {
          total,
          completed,
          inProgress,
          notStarted,
          cancelled,
          open: inProgress + notStarted + (statusDistribution['Açık'] || 0),
          completionPercentage: pct,
          weightedCompletionPercentage: weightedPct,
          avgInProgressProgress: avgInProgress,
          totalProgressSum,
          inProgressBrackets: {
            nearCompletion,
            inExecution,
            earlyStage,
          },
          openCritical,
          openHigh,
          critical,
          unspecifiedStatus: statusDistribution['Girilmemiş'] + statusDistribution['Tanımsız durum'],
          missingAssignee: missingAssigneeTotal,
          risks: {
            critical,
            high,
            medium,
            low,
            negligible,
          }
        },
        statusDistribution,
        riskDistribution,
        sheets: sheetCounts,
        modules: moduleCounts,
        hospitals: Object.values(hospitalCounts).sort((a, b) => b.total - a.total),
        hospitalComparison: groupHospitals,
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
        { equipmentNo: { contains: q, mode: 'insensitive' } },
        { equipmentName: { contains: q, mode: 'insensitive' } },
        { assignedTo: { contains: q, mode: 'insensitive' } },
        { actionPlan: { contains: q, mode: 'insensitive' } },
        { currentNote: { contains: q, mode: 'insensitive' } },
        { technicalManagerDesc: { contains: q, mode: 'insensitive' } },
        { discoveryNotes: { contains: q, mode: 'insensitive' } },
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

// 4.5 FOTOĞRAF VE DOKÜMAN YÜKLEME (WebP Sıkıştırmalı & Tesis Bazlı Klasörleme)
router.post('/upload', uploadMemory.array('files', 10), async (req: AuthRequest, res: Response) => {
  try {
    const rawFiles = req.files as Express.Multer.File[];
    if (!rawFiles || rawFiles.length === 0) {
      return res.status(400).json({ success: false, message: 'Yüklenecek dosya seçilmedi.' });
    }

    const { facilityId, facilityName } = req.query as Record<string, string>;
    let folderName = 'general';

    if (facilityName && typeof facilityName === 'string' && facilityName.trim() !== '' && facilityName !== 'undefined') {
      folderName = sanitizeFolderName(facilityName);
    } else if (facilityId && facilityId !== 'ALL' && facilityId !== 'general') {
      const fac = await prisma.facility.findUnique({
        where: { id: String(facilityId) },
        select: { name: true, shortName: true }
      });
      if (fac) {
        folderName = sanitizeFolderName(fac.shortName || fac.name || String(facilityId));
      } else {
        folderName = sanitizeFolderName(String(facilityId));
      }
    }

    const targetDir = path.join(process.cwd(), 'uploads', 'improvements', folderName);
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }

    const uploadedFiles: Array<{
      name: string;
      url: string;
      type: string;
      size: number;
      originalSize: number;
      uploadedAt: string;
    }> = [];

    for (const file of rawFiles) {
      // Multer busboy latin1 -> utf8 düzeltmesi (Türkçe karakterlerin bozulmasını önler)
      let originalName = file.originalname;
      try {
        originalName = Buffer.from(file.originalname, 'latin1').toString('utf8');
      } catch {
        originalName = file.originalname;
      }

      const isImage = file.mimetype.startsWith('image/') || /\.(jpg|jpeg|png|webp|heic|heif|bmp|tiff)$/i.test(originalName);
      const isPdf = file.mimetype === 'application/pdf' || /\.pdf$/i.test(originalName);
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);

      if (isImage) {
        // WebP Dönüştürme & Optimize Etme (EXIF otomatik yönlendirme, max 1920px boyut, %82 kalite)
        const targetFilename = `imp-${uniqueSuffix}.webp`;
        const destPath = path.join(targetDir, targetFilename);

        try {
          const processedBuffer = await sharp(file.buffer)
            .rotate() // Mobil kamera yönünü otomatik düzeltir
            .resize({
              width: 1920,
              height: 1920,
              fit: 'inside',
              withoutEnlargement: true
            })
            .webp({ quality: 82, effort: 4 })
            .toBuffer();

          await fs.promises.writeFile(destPath, processedBuffer);

          uploadedFiles.push({
            name: originalName.replace(/\.[^/.]+$/, "") + ".webp",
            url: `/uploads/improvements/${folderName}/${targetFilename}`,
            type: 'image/webp',
            size: processedBuffer.length,
            originalSize: file.size,
            uploadedAt: new Date().toISOString()
          });
        } catch (imgErr) {
          console.error('Sharp error, saving original:', imgErr);
          const ext = path.extname(originalName) || '.jpg';
          const fallbackFilename = `imp-${uniqueSuffix}${ext}`;
          const fallbackPath = path.join(targetDir, fallbackFilename);
          await fs.promises.writeFile(fallbackPath, file.buffer);

          uploadedFiles.push({
            name: originalName,
            url: `/uploads/improvements/${folderName}/${fallbackFilename}`,
            type: file.mimetype,
            size: file.size,
            originalSize: file.size,
            uploadedAt: new Date().toISOString()
          });
        }
      } else {
        // PDF ve Dokümanlar
        const ext = path.extname(originalName) || (isPdf ? '.pdf' : '.bin');
        const docFilename = `imp-doc-${uniqueSuffix}${ext}`;
        const destPath = path.join(targetDir, docFilename);

        await fs.promises.writeFile(destPath, file.buffer);

        uploadedFiles.push({
          name: originalName,
          url: `/uploads/improvements/${folderName}/${docFilename}`,
          type: file.mimetype || (isPdf ? 'application/pdf' : 'application/octet-stream'),
          size: file.size,
          originalSize: file.size,
          uploadedAt: new Date().toISOString()
        });
      }
    }

    res.json({
      success: true,
      files: uploadedFiles,
    });
  } catch (error: any) {
    console.error('Error uploading improvement files:', error);
    res.status(500).json({ success: false, message: error.message || 'Dosya yükleme başarısız oldu.' });
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
      equipmentNo,
      equipmentName,
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
      technicalManagerDesc,
      discoveryNotes,
      estimatedBudget,
      actualBudget,
      currency,
      findingPhotos,
      documents,
      periodicReportId,
      standardNoteCode,
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

    const finalEquipNo = equipmentNo?.trim() || null;
    const finalEquipName = equipmentName?.trim() || null;
    let finalEquip = equipment?.trim() || null;
    if (!finalEquip && (finalEquipNo || finalEquipName)) {
      finalEquip = [finalEquipNo, finalEquipName].filter(Boolean).join(' - ');
    }

    const validPhotos = Array.isArray(findingPhotos) ? findingPhotos.slice(0, 3) : [];
    const validDocs = Array.isArray(documents) ? documents : [];

    const record = await prisma.improvementRecord.create({
      data: {
        facilityId,
        moduleGroup: getModuleGroup(sheetType, moduleGroup),
        sheetType,
        rowNo: nextRowNo,
        location,
        equipment: finalEquip,
        equipmentNo: finalEquipNo,
        equipmentName: finalEquipName,
        finding,
        riskScore: normalizeRiskScore(riskScore),
        assignedTo,
        status: status || 'Başlamadı',
        actionPlan,
        currentNote,
        auditName,
        category,
        recordDate: recordDate ? new Date(recordDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        applicationType,
        technicalManagerDesc: technicalManagerDesc || null,
        discoveryNotes: discoveryNotes || null,
        estimatedBudget: parseBudget(estimatedBudget),
        actualBudget: parseBudget(actualBudget),
        currency: currency || 'TRY',
        findingPhotos: validPhotos as any,
        documents: validDocs as any,
        periodicReportId: periodicReportId || null,
        standardNoteCode: standardNoteCode || null,
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

function formatHistoryItem(h: any) {
  let photos: any[] = [];
  let documents: any[] = [];
  let stepType: string | null = h.stepType || null;
  let stepTitle: string | null = h.stepTitle || null;
  let stepFields: Record<string, any> | null = null;

  if (Array.isArray(h.evidencePhotos)) {
    h.evidencePhotos.forEach((item: any) => {
      if (item.type?.includes('pdf') || item.name?.toLowerCase().endsWith('.pdf') || item.isDocument) {
        documents.push(item);
      } else {
        photos.push(item);
      }
    });
  } else if (h.evidencePhotos && typeof h.evidencePhotos === 'object') {
    const raw = h.evidencePhotos as any;
    photos = Array.isArray(raw.photos) ? raw.photos : [];
    documents = Array.isArray(raw.documents) ? raw.documents : [];
    stepType = h.stepType || raw.stepType || null;
    stepTitle = h.stepTitle || raw.stepTitle || null;
    stepFields = raw.stepFields || null;
  }

  return {
    ...h,
    progress: h.progress !== undefined ? h.progress : null,
    progressAdded: h.progressAdded !== undefined ? h.progressAdded : null,
    evidencePhotos: photos,
    documents,
    stepType,
    stepTitle,
    stepFields,
  };
}

// 5.5 TEK BİR KAYDIN DETAYINI GETİR (Dinamik Detay Sayfası & Geçmiş Tarihçesi İçin)
router.get('/records/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const record = await prisma.improvementRecord.findUnique({
      where: { id },
      include: {
        facility: {
          select: { id: true, name: true, shortName: true, city: true }
        },
        histories: {
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!record) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    }

    const formattedRecord = {
      ...record,
      histories: record.histories.map(formatHistoryItem)
    };

    res.json({ success: true, data: formattedRecord });
  } catch (error: any) {
    console.error('Error fetching improvement record detail:', error);
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
      equipmentNo,
      equipmentName,
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
      technicalManagerDesc,
      discoveryNotes,
      estimatedBudget,
      actualBudget,
      currency,
      findingPhotos,
      documents,
      periodicReportId,
      standardNoteCode,
    } = req.body;

    const existing = await prisma.improvementRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    }

    const finalEquipNo = equipmentNo !== undefined ? (equipmentNo?.trim() || null) : existing.equipmentNo;
    const finalEquipName = equipmentName !== undefined ? (equipmentName?.trim() || null) : existing.equipmentName;
    let finalEquip = equipment !== undefined ? (equipment?.trim() || null) : existing.equipment;
    if (!finalEquip && (finalEquipNo || finalEquipName)) {
      finalEquip = [finalEquipNo, finalEquipName].filter(Boolean).join(' - ');
    }

    const validPhotos = findingPhotos !== undefined 
      ? (Array.isArray(findingPhotos) ? findingPhotos.slice(0, 3) : [])
      : ((existing.findingPhotos as any) ?? []);
    const validDocs = documents !== undefined 
      ? (Array.isArray(documents) ? documents : [])
      : ((existing.documents as any) ?? []);

    let finalProgress = existing.progress || 0;
    if (req.body.progress !== undefined && req.body.progress !== null) {
      finalProgress = Math.min(100, Math.max(0, Number(req.body.progress)));
    } else if (status === 'Tamamlandı') {
      finalProgress = 100;
    } else if (status === 'Başlamadı') {
      finalProgress = 0;
    }

    const updated = await prisma.improvementRecord.update({
      where: { id },
      data: {
        location,
        equipment: finalEquip,
        equipmentNo: finalEquipNo,
        equipmentName: finalEquipName,
        finding,
        riskScore,
        assignedTo,
        status,
        progress: finalProgress,
        actionPlan,
        currentNote,
        auditName,
        category,
        recordDate: recordDate ? new Date(recordDate) : null,
        dueDate: dueDate ? new Date(dueDate) : null,
        applicationType,
        technicalManagerDesc: technicalManagerDesc !== undefined ? (technicalManagerDesc || null) : existing.technicalManagerDesc,
        discoveryNotes: discoveryNotes !== undefined ? (discoveryNotes || null) : existing.discoveryNotes,
        estimatedBudget: estimatedBudget !== undefined ? parseBudget(estimatedBudget) : existing.estimatedBudget,
        actualBudget: actualBudget !== undefined ? parseBudget(actualBudget) : existing.actualBudget,
        currency: currency !== undefined ? (currency || 'TRY') : (existing.currency || 'TRY'),
        findingPhotos: validPhotos as any,
        documents: validDocs as any,
        periodicReportId: periodicReportId !== undefined ? (periodicReportId || null) : existing.periodicReportId,
        standardNoteCode: standardNoteCode !== undefined ? (standardNoteCode || null) : existing.standardNoteCode,
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

// 6.1 HIZLI DURUM GÜNCELLEME (Tek tıkla Başlamadı, Devam Ediyor, Tamamlandı, İptal)
router.patch('/records/:id/status', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const { id } = req.params;
    const { status, note } = req.body;

    if (!status) {
      return res.status(400).json({ success: false, message: 'Durum zorunludur.' });
    }

    const existing = await prisma.improvementRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    }

    const newProg = status === 'Tamamlandı' ? 100 : (status === 'Başlamadı' ? 0 : (existing.progress || 10));
    const updated = await prisma.improvementRecord.update({
      where: { id },
      data: {
        status,
        progress: newProg,
        updatedBy: user.username,
      }
    });

    // Durum değişmişse işlem geçmişine (log) ekle
    if (existing.status !== status) {
      await prisma.improvementRecordHistory.create({
        data: {
          recordId: id,
          previousStatus: existing.status,
          newStatus: status,
          previousNote: existing.currentNote,
          newNote: note || `Durum hızlı kontrol ile "${existing.status}" -> "${status}" olarak güncellendi.`,
          changedBy: user.username,
          changedByName: user.fullName || user.username,
        }
      });
    }

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating status:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 7. HIZLI AKSİYON GİR ("Aksiyon Gir" Penceresi - Kademeli Yüzdelik İlerleme Sistemi)
router.patch('/records/:id/action-note', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const { id } = req.params;
    const { 
      currentNote, 
      status, 
      actionPlan, 
      dueDate, 
      recordDate, 
      evidencePhotos, 
      documents, 
      stepType, 
      stepTitle, 
      stepFields,
      progress,
      progressAdded
    } = req.body;

    const existing = await prisma.improvementRecord.findUnique({
      where: { id }
    });

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Kayıt bulunamadı.' });
    }

    const currentProg = existing.progress || 0;
    let newStatus = status || existing.status;
    let newProgress = currentProg;
    let actualAdded = 0;

    // Kademeli İlerleme Mantığı:
    // 1. Giderim & Test Tamamlandı seçilirse diğer seçilenler kalan % eklenerek %100 olmalı.
    if (newStatus === 'Tamamlandı' || stepType === 'TAMAMLANDI') {
      newStatus = 'Tamamlandı';
      newProgress = 100;
      actualAdded = Math.max(0, 100 - currentProg);
    } else if (newStatus === 'Başlamadı') {
      newProgress = 0;
      actualAdded = 0;
    } else {
      // Devam Ediyor durumunda
      if (progress !== undefined && progress !== null) {
        newProgress = Math.min(99, Math.max(0, Number(progress)));
        actualAdded = progressAdded !== undefined ? Number(progressAdded) : Math.max(0, newProgress - currentProg);
      } else {
        // İlgili şablonun ağırlığını bul
        let weight = 10;
        if (progressAdded !== undefined && progressAdded !== null) {
          weight = Number(progressAdded);
        } else if (stepType) {
          const tpl = DEFAULT_ACTION_TEMPLATES.find(t => t.id === stepType);
          if (tpl && tpl.progressWeight !== undefined) {
            weight = tpl.progressWeight;
          }
        }
        actualAdded = Math.max(0, weight);
        newProgress = Math.min(99, currentProg + actualAdded);
      }

      if (newStatus === 'Başlamadı' && newProgress > 0) {
        newStatus = 'Devam Ediyor';
      }
    }

    const updateData: any = {
      currentNote,
      status: newStatus,
      progress: newProgress,
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

    // Dokümanlar geldiyse ana kaydın documents alanına da ekle
    if (Array.isArray(documents) && documents.length > 0) {
      const existingDocs: any[] = Array.isArray(existing.documents) ? (existing.documents as any[]) : [];
      const mergedDocs = [...existingDocs];
      documents.forEach(d => {
        if (!mergedDocs.some(m => m.url === d.url)) {
          mergedDocs.push(d);
        }
      });
      updateData.documents = mergedDocs;
    }

    const updated = await prisma.improvementRecord.update({
      where: { id },
      data: updateData,
    });

    const validEvidence = Array.isArray(evidencePhotos) ? evidencePhotos : [];
    const validDocs = Array.isArray(documents) ? documents : [];

    const historyPayload = {
      photos: validEvidence,
      documents: validDocs,
      stepType: stepType || null,
      stepTitle: stepTitle || null,
      stepFields: stepFields || null,
    };

    await prisma.improvementRecordHistory.create({
      data: {
        recordId: id,
        previousNote: existing.currentNote,
        newNote: currentNote || '',
        previousStatus: existing.status,
        newStatus: newStatus,
        progress: newProgress,
        progressAdded: actualAdded,
        stepType: stepType || null,
        stepTitle: stepTitle || null,
        evidencePhotos: historyPayload,
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

    res.json({ success: true, data: histories.map(formatHistoryItem) });
  } catch (error: any) {
    console.error('Error fetching record history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9.1 AKSİYON ADIMINI / GEÇMİŞİ DÜZENLE (Edit Action History Step)
router.put('/records/:recordId/history/:historyId', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const { recordId, historyId } = req.params;
    const { 
      newNote, 
      stepTitle, 
      stepType, 
      newStatus, 
      progress, 
      progressAdded, 
      stepFields, 
      evidencePhotos, 
      documents,
      createdAt 
    } = req.body;

    const existingHistory = await prisma.improvementRecordHistory.findUnique({
      where: { id: historyId }
    });

    if (!existingHistory || existingHistory.recordId !== recordId) {
      return res.status(404).json({ success: false, message: 'Aksiyon geçmiş kaydı bulunamadı.' });
    }

    const currentPhotos = (existingHistory.evidencePhotos as any) || {};
    const validPhotos = Array.isArray(evidencePhotos) ? evidencePhotos : (Array.isArray(currentPhotos.photos) ? currentPhotos.photos : []);
    const validDocs = Array.isArray(documents) ? documents : (Array.isArray(currentPhotos.documents) ? currentPhotos.documents : []);
    const updatedPayload = {
      photos: validPhotos,
      documents: validDocs,
      stepType: stepType !== undefined ? stepType : (existingHistory.stepType || currentPhotos.stepType || null),
      stepTitle: stepTitle !== undefined ? stepTitle : (existingHistory.stepTitle || currentPhotos.stepTitle || null),
      stepFields: stepFields !== undefined ? stepFields : (currentPhotos.stepFields || null),
    };

    const updateHistoryData: any = {
      evidencePhotos: updatedPayload,
    };

    if (newNote !== undefined) updateHistoryData.newNote = String(newNote).trim();
    if (stepTitle !== undefined) updateHistoryData.stepTitle = stepTitle ? String(stepTitle).trim() : null;
    if (stepType !== undefined) updateHistoryData.stepType = stepType ? String(stepType).trim() : null;
    if (newStatus !== undefined) updateHistoryData.newStatus = String(newStatus).trim();
    if (progress !== undefined) updateHistoryData.progress = Number(progress);
    if (progressAdded !== undefined) updateHistoryData.progressAdded = Number(progressAdded);
    if (createdAt) updateHistoryData.createdAt = new Date(createdAt);

    const updatedHistory = await prisma.improvementRecordHistory.update({
      where: { id: historyId },
      data: updateHistoryData,
    });

    // Kaydın tüm geçmişini çekip en son adıma göre ana kaydı güncelle
    const allHistories = await prisma.improvementRecordHistory.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' }
    });

    const latest = allHistories[0];
    if (latest && latest.id === historyId) {
      const parentUpdate: any = {
        updatedBy: user.username,
      };
      if (updatedHistory.newNote !== undefined) {
        parentUpdate.currentNote = updatedHistory.newNote;
      }
      if (updatedHistory.newStatus) {
        parentUpdate.status = updatedHistory.newStatus;
      }
      if (updatedHistory.progress !== undefined && updatedHistory.progress !== null) {
        parentUpdate.progress = updatedHistory.progress;
      }
      await prisma.improvementRecord.update({
        where: { id: recordId },
        data: parentUpdate,
      });
    }

    // Güncel kaydı ve formatlanmış tarihçeyi döndür
    const fullRecord = await prisma.improvementRecord.findUnique({
      where: { id: recordId },
      include: {
        facility: { select: { id: true, name: true, shortName: true, city: true } },
        histories: { orderBy: { createdAt: 'desc' } }
      }
    });

    res.json({
      success: true,
      message: 'Aksiyon adımı başarıyla güncellendi.',
      data: fullRecord ? {
        ...fullRecord,
        histories: fullRecord.histories.map(formatHistoryItem)
      } : null
    });
  } catch (error: any) {
    console.error('Error updating action history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 9.2 AKSİYON ADIMINI / GEÇMİŞİ SİL (Delete Action History Step & Revert/Recalculate)
router.delete('/records/:recordId/history/:historyId', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const { recordId, historyId } = req.params;

    const existingHistory = await prisma.improvementRecordHistory.findUnique({
      where: { id: historyId }
    });

    if (!existingHistory || existingHistory.recordId !== recordId) {
      return res.status(404).json({ success: false, message: 'Silinecek aksiyon adımı bulunamadı.' });
    }

    // 1. İlgili geçmiş adımını sil
    await prisma.improvementRecordHistory.delete({
      where: { id: historyId }
    });

    // 2. Kalan adımları tarihe göre en yeni başta olacak şekilde sıralı al
    const remaining = await prisma.improvementRecordHistory.findMany({
      where: { recordId },
      orderBy: { createdAt: 'desc' }
    });

    // 3. Ana kaydın durum, ilerleme ve son notunu en güncel kalan adıma göre geriye al
    const parentUpdate: any = {
      updatedBy: user.username,
    };

    if (remaining.length > 0) {
      const latestRemaining = remaining[0];
      parentUpdate.currentNote = latestRemaining.newNote || null;
      parentUpdate.status = latestRemaining.newStatus || (
        latestRemaining.progress === 100 ? 'Tamamlandı' : (latestRemaining.progress && latestRemaining.progress > 0 ? 'Devam Ediyor' : 'Başlamadı')
      );
      parentUpdate.progress = latestRemaining.progress !== undefined && latestRemaining.progress !== null
        ? latestRemaining.progress
        : (parentUpdate.status === 'Tamamlandı' ? 100 : 0);
    } else {
      // Başka hiçbir aksiyon adımı kalmadıysa kaydı başlangıç haline döndür
      parentUpdate.currentNote = null;
      parentUpdate.status = 'Başlamadı';
      parentUpdate.progress = 0;
    }

    const updatedRecord = await prisma.improvementRecord.update({
      where: { id: recordId },
      data: parentUpdate,
      include: {
        facility: { select: { id: true, name: true, shortName: true, city: true } },
        histories: { orderBy: { createdAt: 'desc' } }
      }
    });

    res.json({
      success: true,
      message: 'Aksiyon adımı silindi ve süreç başarıyla bir önceki adıma güncellendi.',
      data: {
        ...updatedRecord,
        histories: updatedRecord.histories.map(formatHistoryItem)
      }
    });
  } catch (error: any) {
    console.error('Error deleting action history step:', error);
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
    const sheetType = mapping?.sheetType || 'MERKEZI_DENETIMLER';
    const moduleGroup = mapping?.moduleGroup || (sheetType === 'MERKEZI_DENETIMLER' ? 'DENETIMLER' : 'ELEKTRIK');

    // Eğer replace modu seçildiyse ilgili hastanenin bu sekmesindeki eski kayıtları temizle
    if (mode === 'replace') {
      await prisma.improvementRecord.deleteMany({
        where: { facilityId, sheetType }
      });
    }

    // Hastane adından dinamik eşleştirme için tesis listesini al
    const allFacilities = await prisma.facility.findMany({
      select: { id: true, name: true, shortName: true }
    });

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

      // Satırda Hastane Adı varsa ilgili hastaneyi otomatik tespit et
      const rawHospName = (r['Hastane Adı'] || r['Hastane Adi'] || r['Hastane'] || r.facilityName || '').toString().trim();
      let targetFacilityId = facilityId;
      if (rawHospName) {
        const found = allFacilities.find(f => 
          f.name.toLowerCase() === rawHospName.toLowerCase() ||
          (f.shortName && f.shortName.toLowerCase() === rawHospName.toLowerCase()) ||
          f.name.toLowerCase().includes(rawHospName.toLowerCase()) ||
          rawHospName.toLowerCase().includes(f.name.toLowerCase())
        );
        if (found) {
          targetFacilityId = found.id;
        }
      }

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

      // Kategori: v4 Excel'de her sekmede Kategori sütunu mevcuttur
      let assignedCategory = (r.category || r.Kategori || r['Kategori'] || '').toString().trim();
      if (!assignedCategory) {
        if (moduleGroup === 'ELEKTRIK') {
          assignedCategory = 'Elektrik Güvenliği';
        } else if (moduleGroup === 'MEKANIK') {
          assignedCategory = 'Mekanik / Tesisat';
        } else if (moduleGroup === 'YANGIN') {
          assignedCategory = 'Yangın Güvenliği';
        } else {
          assignedCategory = 'İş Güvenliği / Fiziksel Riskler';
        }
      }

      // Ekipman No & Ekipman Adı (v4 Excel standartı)
      const equipmentNo = (
        r.equipmentNo || 
        r['Ekipman No'] || 
        r['Ekipman No.'] || 
        r['Ekipman no'] || 
        r['Ekipman Numarası'] || 
        ''
      ).toString().trim() || null;

      const equipmentName = (
        r.equipmentName || 
        r['Ekipman Adı'] || 
        r['Ekipman Adi'] || 
        r['Ekipman Tanımı'] || 
        r['Ekipman Tanimi'] || 
        ''
      ).toString().trim() || null;

      let combinedEquipment = (r.equipment || r.Ekipman || r['Ekipman'] || '').toString().trim() || null;
      if (!combinedEquipment && (equipmentNo || equipmentName)) {
        combinedEquipment = [equipmentNo, equipmentName].filter(Boolean).join(' - ');
      }

      // İş Planı
      const actionPlan = (
        r.actionPlan || 
        r['İş Planı'] || 
        r['Is Plani'] || 
        r['İş planı'] || 
        ''
      ).toString().trim() || null;

      // Aksiyon / Açıklama
      const currentNote = (
        r.currentNote || 
        r['Aksiyon / Açıklama'] || 
        r['Aksiyon/Açıklama'] || 
        r['Aksiyon / Aciklama'] || 
        r['Aksiyon/Aciklama'] || 
        r['Aksiyon Açıklama'] || 
        r['Aksiyon'] || 
        ''
      ).toString().trim() || null;

      // Yeni Eklenen Sütunlar (Teknik Müdür Açıklaması, Keşif Notları, Tahmini/Gerçekleşen Bütçe)
      const technicalManagerDesc = (
        r.technicalManagerDesc || 
        r['Teknik Müdür Açıklaması'] || 
        r['Teknik Mudur Aciklamasi'] || 
        r['Teknik Müdür Açıklaması '] || 
        ''
      ).toString().trim() || null;

      const discoveryNotes = (
        r.discoveryNotes || 
        r['Yapılan Keşif Notları'] || 
        r['Yapilan Kesif Notlari'] || 
        r['Keşif Notları'] || 
        r['Yapılan Keşif Notları '] || 
        ''
      ).toString().trim() || null;

      const rawEst = r.estimatedBudget ?? r['Tahmini Bütçe '] ?? r['Tahmini Bütçe'] ?? r['Tahmini Butce'] ?? r['Tahmini Butce '] ?? null;
      const estimatedBudget = parseBudget(rawEst);

      const rawAct = r.actualBudget ?? r['Gerçekleşen Bütçe'] ?? r['Gerceklesen Butce'] ?? r['Gerçekleşen Bütçe '] ?? null;
      const actualBudget = parseBudget(rawAct);

      await prisma.improvementRecord.create({
        data: {
          facilityId: targetFacilityId,
          moduleGroup,
          sheetType,
          rowNo: parsedRowNo,
          location: (r.location || r.Mahal || r['Mahal'] || '').toString().trim() || null,
          equipment: combinedEquipment,
          equipmentNo,
          equipmentName,
          finding: String(findingText).trim(),
          riskScore: normalizeRiskScore(r.riskScore || r['Risk Skoru'] || r.risk),
          assignedTo: (r.assignedTo || r.Sorumlusu || r.sorumlu || '').toString().trim() || null,
          status: (r.status || r.Durum || 'Başlamadı').toString().trim(),
          actionPlan,
          currentNote,
          auditName: (r.auditName || r['Denetim Adı'] || r['Denetim Adi'] || '').toString().trim() || null,
          category: assignedCategory,
          recordDate,
          dueDate,
          applicationType: (r.applicationType || r.Uygulama || r['Uygulama'] || '').toString().trim() || null,
          technicalManagerDesc,
          discoveryNotes,
          estimatedBudget,
          actualBudget,
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

// 11.5 AKSİYON KALIPLARI VE ŞABLON YÖNETİMİ (Step-by-Step Süreç Kalıpları & İlerleme Yüzdeleri)
export const DEFAULT_ACTION_TEMPLATES = [
  {
    id: 'TALEP_ACILDI',
    title: 'Talep Açıldı',
    description: 'Satınalma / bakım talebi sisteme girildi',
    icon: 'FileText',
    color: 'blue',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 10,
    fields: [
      { key: 'talepNo', label: 'Talep Numarası', type: 'text', placeholder: 'Örn: 2026-9481', required: true },
      { key: 'tarih', label: 'Talep Tarihi', type: 'date', required: false },
      { key: 'aciklama', label: 'Talep Kapsamı / Not', type: 'text', placeholder: 'Kısa not...', required: false }
    ],
    sentenceTemplate: '{tarih} tarihinde #{talepNo} numaralı satınalma/hizmet talebi açılmıştır.{aciklama}',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'IHALE_SURECINDE',
    title: 'İhale Sürecinde',
    description: 'Satınalma / ihale değerlendirme sürecinde',
    icon: 'Scale',
    color: 'purple',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 10,
    fields: [
      { key: 'ihaleTarihi', label: 'İhale / Toplantı Tarihi', type: 'date', required: false },
      { key: 'teklifSayisi', label: 'Alınan Teklif Sayısı / Detay', type: 'text', placeholder: 'Örn: 3 firma teklifi toplandı', required: false },
      { key: 'aciklama', label: 'Süreç Açıklaması', type: 'text', placeholder: 'İhale komisyonu değerlendirmesi...', required: false }
    ],
    sentenceTemplate: 'İhale ve satınalma değerlendirme sürecine alınmıştır.{ihaleTarihi}{teklifSayisi}{aciklama}',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'SS_VERILDI',
    title: 'SS / Sipariş Verildi',
    description: 'İhale/alım tamamlandı, satınalma siparişi iletildi',
    icon: 'ShoppingCart',
    color: 'emerald',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 20,
    fields: [
      { key: 'siparisNo', label: 'Sipariş (SS) Numarası', type: 'text', placeholder: 'Örn: SS-84210', required: true },
      { key: 'firma', label: 'Yüklenici / Tedarikçi Firma', type: 'text', placeholder: 'Örn: ABC İklimlendirme Ltd.', required: true },
      { key: 'siparisTarihi', label: 'Sipariş Tarihi', type: 'date', required: false },
      { key: 'aciklama', label: 'Sipariş Detayı / Kapsamı', type: 'text', placeholder: 'Parça/işçilik siparişi onaylandı...', required: false }
    ],
    sentenceTemplate: '{siparisTarihi} tarihinde {firma} firmasına #{siparisNo} nolu satınalma siparişi (SS) iletilmiştir.{aciklama}',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'MALZEME_TEMINI',
    title: 'Malzeme Temini / Bekleniyor',
    description: 'Yedek parça ve malzeme kargoda veya imalatta',
    icon: 'Package',
    color: 'indigo',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 10,
    fields: [
      { key: 'malzeme', label: 'Malzeme / Parça Adı', type: 'text', placeholder: 'Örn: Danfoss Genleşme Valfi', required: true },
      { key: 'terminTarihi', label: 'Tahmini Teslim Tarihi', type: 'date', required: false },
      { key: 'aciklama', label: 'Tedarik Detayı', type: 'text', placeholder: 'Yurtdışı sipariş...', required: false }
    ],
    sentenceTemplate: '{malzeme} malzemesi sipariş edilmiş olup, tahmini teslim tarihi: {terminTarihi}.{aciklama}',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'FIRMA_BEKLENIYOR',
    title: 'Firma Sahaya Bekleniyor',
    description: 'Firma ile randevu teyit edildi, sahaya gelmesi bekleniyor',
    icon: 'HardHat',
    color: 'amber',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 10,
    fields: [
      { key: 'firma', label: 'Firma Adı', type: 'text', placeholder: 'Örn: Güven Yangın Sistemleri', required: true },
      { key: 'beklenenTarih', label: 'Sahaya Geliş Tarihi', type: 'date', required: false },
      { key: 'aciklama', label: 'Hazırlık / Çalışma Planı', type: 'text', placeholder: 'Sıcak çalışma izinleri hazırlandı...', required: false }
    ],
    sentenceTemplate: '{firma} firması ile mutabakat sağlanmış olup, {beklenenTarih} tarihinde sahada müdahaleye başlaması beklenmektedir.{aciklama}',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'SAHA_CALISMASI',
    title: 'Saha Çalışması Devam Ediyor',
    description: 'Ekipler sahada montaj / tamirat / bakım yapıyor',
    icon: 'Wrench',
    color: 'cyan',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 10,
    fields: [
      { key: 'ekip', label: 'Müdahale Eden Ekip / Firma', type: 'text', placeholder: 'Örn: Hastane Biyomedikal / Dış Servis', required: true },
      { key: 'yapilanIslem', label: 'Yapılan Müdahale', type: 'text', placeholder: 'Örn: Kablo çekimi ve montaj', required: true },
      { key: 'aciklama', label: 'İlerleme Notu', type: 'text', placeholder: '%70 tamamlandı...', required: false }
    ],
    sentenceTemplate: '{ekip} tarafından sahada fiziki çalışma başlatılmış olup işlemler devam etmektedir. Çalışma: {yapilanIslem}.{aciklama}',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'TAMAMLANDI',
    title: 'Giderim & Test Tamamlandı',
    description: 'Bulgu giderildi, testler yapıldı ve onaylandı',
    icon: 'CheckCircle2',
    color: 'emerald',
    suggestedStatus: 'Tamamlandı',
    progressWeight: 100,
    fields: [
      { key: 'tamamlanmaTarihi', label: 'Tamamlanma Tarihi', type: 'date', required: false },
      { key: 'yapilanIslem', label: 'Uygulanan Çözüm', type: 'text', placeholder: 'Örn: Pano yenilendi ve devreye alındı', required: true },
      { key: 'testSonucu', label: 'Test & Ölçüm Sonucu', type: 'text', placeholder: 'Örn: Termal ölçüm normal, etiketleme yapıldı', required: false }
    ],
    sentenceTemplate: '{tamamlanmaTarihi} tarihinde bulgu tamamen giderilmiştir. Yapılan işlem: {yapilanIslem}.{testSonucu}',
    isDefault: true,
    isActive: true,
  },
  {
    id: 'DIGER',
    title: 'Diğer / Serbest Aksiyon',
    description: 'Özel veya standart dışı aksiyon girişi',
    icon: 'MoreHorizontal',
    color: 'slate',
    suggestedStatus: 'Devam Ediyor',
    progressWeight: 0,
    fields: [
      { key: 'konu', label: 'Aksiyon Konusu', type: 'text', placeholder: 'Örn: İtfaiye Uygunluk Raporu', required: false },
      { key: 'aciklama', label: 'Açıklama Detayı', type: 'text', placeholder: 'Aksiyon detaylarını yazınız...', required: true }
    ],
    sentenceTemplate: '{konu}{aciklama}',
    isDefault: true,
    isActive: true,
  }
];

router.get('/action-templates', async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.improvementSetting.findUnique({
      where: { key: 'action_templates' }
    });
    let templates: any[] = setting?.value && Array.isArray(setting.value) && (setting.value as any[]).length > 0
      ? (setting.value as any[])
      : DEFAULT_ACTION_TEMPLATES;

    // Her şablonun progressWeight değerini garantiye al
    templates = templates.map(t => {
      const def = DEFAULT_ACTION_TEMPLATES.find(d => d.id === t.id);
      return {
        ...t,
        progressWeight: t.progressWeight !== undefined ? Number(t.progressWeight) : (def?.progressWeight ?? 10)
      };
    });

    res.json({ success: true, data: templates });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

router.post('/action-templates', async (req: AuthRequest, res: Response) => {
  try {
    const { templates } = req.body;
    if (!Array.isArray(templates)) {
      return res.status(400).json({ success: false, message: 'Şablon listesi dizi olmalıdır.' });
    }
    const setting = await prisma.improvementSetting.upsert({
      where: { key: 'action_templates' },
      update: { value: templates },
      create: { key: 'action_templates', value: templates, description: 'Aksiyon Kalıpları ve Şablon Listesi' }
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

// 13. PERİYODİK KONTROL RAPORLARI (PK Takip Bilgileri)
router.get('/periodic-reports', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, sheetType = 'TOPRAKLAMA_PK', moduleGroup } = req.query;

    const whereFacility: any = {
      type: { in: ['Hastane', 'hastane', 'HOSPITAL', 'Hospital'] },
      isActive: true,
    };
    if (facilityId && facilityId !== 'ALL') {
      whereFacility.id = facilityId as string;
    }

    const facilities = await prisma.facility.findMany({
      where: whereFacility,
      select: { id: true, name: true, shortName: true },
      orderBy: { name: 'asc' }
    });

    const facilityIds = facilities.map(f => f.id);

    // Her hastane için PK raporlarını çek
    const reports = await prisma.improvementPeriodicReport.findMany({
      where: {
        facilityId: { in: facilityIds },
        sheetType: sheetType as string,
      },
      orderBy: [
        { inspectionDate: 'desc' },
        { startDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    // Açık bulgu sayılarını hesapla (İlgili sekmedeki açık ve kritik bulgular)
    const openRecords = await prisma.improvementRecord.findMany({
      where: {
        facilityId: { in: facilityIds },
        sheetType: sheetType as string,
        isArchived: false,
        status: { notIn: ['Tamamlandı', 'İptal Edildi'] }
      },
      select: {
        facilityId: true,
        riskScore: true
      }
    });

    const openCountsByFacility: Record<string, { totalOpen: number; criticalOpen: number }> = {};
    openRecords.forEach(r => {
      if (!openCountsByFacility[r.facilityId]) {
        openCountsByFacility[r.facilityId] = { totalOpen: 0, criticalOpen: 0 };
      }
      openCountsByFacility[r.facilityId].totalOpen++;
      if (r.riskScore === 'Kritik') {
        openCountsByFacility[r.facilityId].criticalOpen++;
      }
    });

    // Her hastanenin en güncel raporunu eşle
    const latestReportMap: Record<string, typeof reports[0]> = {};
    reports.forEach(rep => {
      if (!latestReportMap[rep.facilityId]) {
        latestReportMap[rep.facilityId] = rep;
      }
    });

    const now = new Date();
    const result = facilities
      .map(fac => {
        const rep = latestReportMap[fac.id] || null;
        const counts = openCountsByFacility[fac.id] || { totalOpen: 0, criticalOpen: 0 };

        let isOverdue = false;
        let daysRemaining: number | null = null;
        if (rep && rep.nextInspectionDate) {
          const nextDate = new Date(rep.nextInspectionDate);
          const diffMs = nextDate.getTime() - now.getTime();
          daysRemaining = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isOverdue = daysRemaining < 0;
        }

        return {
          facility: fac,
          report: rep,
          openCount: counts.totalOpen,
          openCriticalCount: counts.criticalOpen,
          isOverdue,
          daysRemaining,
        };
      })
      .filter(item => {
        // Belirli bir hastane seçiliyse boş da olsa göster (kullanıcı rapor girebilsin)
        if (facilityId && facilityId !== 'ALL') return true;
        // Tüm hastaneler modunda: Raporu olmayan ve açık bulgusu 0 olanları gizle
        return item.report !== null || item.openCount > 0;
      });

    res.json({ success: true, data: result });
  } catch (error: any) {
    console.error('Error fetching periodic reports:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13.1 HASTANENİN TÜM GEÇMİŞ PK RAPORLARI
router.get('/periodic-reports/history', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, sheetType = 'TOPRAKLAMA_PK' } = req.query;
    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'facilityId zorunludur.' });
    }

    const reports = await prisma.improvementPeriodicReport.findMany({
      where: {
        facilityId: facilityId as string,
        sheetType: sheetType as string,
      },
      include: {
        facility: { select: { id: true, name: true, shortName: true } },
        _count: { select: { records: true } }
      },
      orderBy: [
        { inspectionDate: 'desc' },
        { startDate: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    res.json({ success: true, data: reports });
  } catch (error: any) {
    console.error('Error fetching periodic report history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13.2 YENİ PK RAPORU EKLE
router.post('/periodic-reports', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const {
      facilityId,
      moduleGroup = 'ELEKTRIK',
      sheetType = 'TOPRAKLAMA_PK',
      reportNo,
      reportDate,
      isgKatipId,
      actionType = 'Periyodik Kontrol',
      startDate,
      endDate,
      inspectionDate,
      nextInspectionDate,
      firmName,
      inspectorName,
      result = 'Uygun',
      notes,
      documents = [],
    } = req.body;

    if (!facilityId) {
      return res.status(400).json({ success: false, message: 'Hastane seçimi zorunludur.' });
    }

    const sDate = startDate ? new Date(startDate) : (inspectionDate ? new Date(inspectionDate) : new Date());
    let nextDate: Date | null = nextInspectionDate ? new Date(nextInspectionDate) : null;

    // Kural: Topraklama uygun ise 1 yıl süresi vardır (Başlangıç/Gerçekleşme tarihinden 1 yıl sonra)
    if (!nextDate && result === 'Uygun') {
      nextDate = new Date(sDate);
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    }

    const report = await prisma.improvementPeriodicReport.create({
      data: {
        facilityId,
        moduleGroup: getModuleGroup(sheetType, moduleGroup),
        sheetType,
        reportNo: reportNo?.trim() || null,
        reportDate: reportDate ? new Date(reportDate) : null,
        isgKatipId: isgKatipId?.trim() || null,
        actionType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        inspectionDate: inspectionDate ? new Date(inspectionDate) : sDate,
        nextInspectionDate: nextDate,
        firmName: firmName?.trim() || null,
        inspectorName: inspectorName?.trim() || null,
        result: result === 'Uygun Değil' ? 'Uygun Değil' : 'Uygun',
        notes: notes?.trim() || null,
        documents: Array.isArray(documents) ? documents : [],
        createdBy: user.username,
      },
      include: {
        facility: { select: { id: true, name: true, shortName: true } }
      }
    });

    res.json({ success: true, data: report });
  } catch (error: any) {
    console.error('Error creating periodic report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13.3 PK RAPORU GÜNCELLE
router.put('/periodic-reports/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const {
      reportNo,
      reportDate,
      isgKatipId,
      actionType,
      startDate,
      endDate,
      inspectionDate,
      nextInspectionDate,
      firmName,
      inspectorName,
      result,
      notes,
      documents,
    } = req.body;

    const dataToUpdate: any = {};
    if (reportNo !== undefined) dataToUpdate.reportNo = reportNo?.trim() || null;
    if (reportDate !== undefined) dataToUpdate.reportDate = reportDate ? new Date(reportDate) : null;
    if (isgKatipId !== undefined) dataToUpdate.isgKatipId = isgKatipId?.trim() || null;
    if (actionType !== undefined) dataToUpdate.actionType = actionType;
    if (startDate !== undefined) dataToUpdate.startDate = startDate ? new Date(startDate) : null;
    if (endDate !== undefined) dataToUpdate.endDate = endDate ? new Date(endDate) : null;
    if (inspectionDate !== undefined) dataToUpdate.inspectionDate = inspectionDate ? new Date(inspectionDate) : null;
    if (nextInspectionDate !== undefined) dataToUpdate.nextInspectionDate = nextInspectionDate ? new Date(nextInspectionDate) : null;
    if (firmName !== undefined) dataToUpdate.firmName = firmName?.trim() || null;
    if (inspectorName !== undefined) dataToUpdate.inspectorName = inspectorName?.trim() || null;
    if (result !== undefined) dataToUpdate.result = result;
    if (notes !== undefined) dataToUpdate.notes = notes?.trim() || null;
    if (documents !== undefined && Array.isArray(documents)) dataToUpdate.documents = documents;

    const updated = await prisma.improvementPeriodicReport.update({
      where: { id },
      data: dataToUpdate,
      include: {
        facility: { select: { id: true, name: true, shortName: true } }
      }
    });

    res.json({ success: true, data: updated });
  } catch (error: any) {
    console.error('Error updating periodic report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 13.4 PK RAPORU SİL
router.delete('/periodic-reports/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    await prisma.improvementPeriodicReport.delete({
      where: { id }
    });
    res.json({ success: true, message: 'Periyodik kontrol raporu silindi.' });
  } catch (error: any) {
    console.error('Error deleting periodic report:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
