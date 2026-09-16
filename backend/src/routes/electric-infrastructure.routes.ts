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

// 2.1. GET HOSPITAL ENTRY STATS (Only for hospital facilities: entered vs not-entered and counts)
router.get('/hospital-stats', async (req: AuthRequest, res) => {
  try {
    const hospitals = await prisma.facility.findMany({
      where: {
        type: 'Hastane',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        shortName: true,
        city: true,
        _count: {
          select: {
            electricInfrastructureRecords: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    const statusRecords = await prisma.electricInfrastructureFacilityStatus.findMany();
    const statusMap = new Map(statusRecords.map(s => [s.facilityId, s]));

    const enteredHospitals = hospitals
      .filter(h => h._count.electricInfrastructureRecords > 0)
      .map(h => {
        const s = statusMap.get(h.id);
        return {
          id: h.id,
          name: h.name,
          shortName: h.shortName || h.name,
          city: h.city,
          recordCount: h._count.electricInfrastructureRecords,
          isCompleted: s ? s.isCompleted : false,
          completedAt: s?.completedAt || null,
          completedBy: s?.completedBy || null
        };
      })
      .sort((a, b) => b.recordCount - a.recordCount);

    const notEnteredHospitals = hospitals
      .filter(h => h._count.electricInfrastructureRecords === 0)
      .map(h => {
        const s = statusMap.get(h.id);
        return {
          id: h.id,
          name: h.name,
          shortName: h.shortName || h.name,
          city: h.city,
          recordCount: 0,
          isCompleted: s ? s.isCompleted : false,
          completedAt: s?.completedAt || null,
          completedBy: s?.completedBy || null
        };
      });

    const completedHospitalsCount = enteredHospitals.filter(h => h.isCompleted).length;

    res.json({
      totalHospitals: hospitals.length,
      enteredCount: enteredHospitals.length,
      notEnteredCount: notEnteredHospitals.length,
      completedHospitalsCount,
      completionRate: hospitals.length > 0 ? Math.round((enteredHospitals.length / hospitals.length) * 100) : 0,
      verifiedCompletionRate: hospitals.length > 0 ? Math.round((completedHospitalsCount / hospitals.length) * 100) : 0,
      enteredHospitals,
      notEnteredHospitals
    });
  } catch (error: any) {
    console.error('Error fetching hospital stats:', error);
    res.status(500).json({ error: error.message || 'Hastane istatistikleri alınamadı.' });
  }
});

// 2.2. GET FACILITY COMPLETION STATUS
router.get('/facility-status/:facilityId', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.params;
    const status = await prisma.electricInfrastructureFacilityStatus.findUnique({
      where: { facilityId }
    });

    const count = await prisma.electricInfrastructureRecord.count({
      where: { facilityId }
    });

    res.json({
      facilityId,
      recordCount: count,
      isCompleted: status?.isCompleted || false,
      completedAt: status?.completedAt || null,
      completedBy: status?.completedBy || null,
      notes: status?.notes || null
    });
  } catch (error: any) {
    console.error('Error fetching facility status:', error);
    res.status(500).json({ error: 'Durum bilgisi alınamadı.' });
  }
});

// 2.3. POST TOGGLE FACILITY COMPLETION STATUS ("Tüm Girişlerim Bitti" / "Tekrar Düzenlemeye Aç")
router.post('/facility-status/:facilityId/toggle', async (req: AuthRequest, res) => {
  try {
    const { facilityId } = req.params;
    const { isCompleted, notes } = req.body;

    if (!facilityId || facilityId === 'all') {
      return res.status(400).json({ error: 'Geçerli bir tesis seçilmelidir.' });
    }

    const currentStatus = await prisma.electricInfrastructureFacilityStatus.findUnique({
      where: { facilityId }
    });

    const newIsCompleted = isCompleted !== undefined ? Boolean(isCompleted) : !currentStatus?.isCompleted;

    const updated = await prisma.electricInfrastructureFacilityStatus.upsert({
      where: { facilityId },
      create: {
        facilityId,
        isCompleted: newIsCompleted,
        completedAt: newIsCompleted ? new Date() : null,
        completedBy: newIsCompleted ? (req.user?.fullName || req.user?.username || 'Kullanıcı') : null,
        notes: notes || null
      },
      update: {
        isCompleted: newIsCompleted,
        completedAt: newIsCompleted ? new Date() : null,
        completedBy: newIsCompleted ? (req.user?.fullName || req.user?.username || 'Kullanıcı') : null,
        notes: notes !== undefined ? notes : undefined
      }
    });

    res.json({
      message: newIsCompleted ? 'Tesis veri girişi tamamlandı olarak işaretlendi.' : 'Tesis veri girişi devam ediyor durumuna alındı.',
      status: updated
    });
  } catch (error: any) {
    console.error('Error toggling facility completion status:', error);
    res.status(500).json({ error: 'İşlem tamamlanamadı.' });
  }
});

// 2.4. GET EXECUTIVE DASHBOARD (C-Level & Central Management Analytics with Filtering)
router.get('/executive-dashboard', async (req: AuthRequest, res) => {
  try {
    const user = req.user;
    const isAdminOrMgmt = user?.roles?.includes('admin') || user?.roles?.includes('management');
    if (!isAdminOrMgmt) {
      return res.status(403).json({ error: 'Bu alana yalnızca yönetici yetkisine sahip kullanıcılar erişebilir.' });
    }

    const {
      facilityType,
      completionFilter,
      riskFilter,
      selectedCategory,
      criteriaKey,
      criteriaValue
    } = req.query;

    // 1. Fetch all facilities or filter by type (default to all active facilities, focused on Hastane if specified)
    const facilityWhere: any = { isActive: true };
    if (facilityType && facilityType !== 'all') {
      facilityWhere.type = String(facilityType);
    }

    const facilities = await prisma.facility.findMany({
      where: facilityWhere,
      select: {
        id: true,
        name: true,
        shortName: true,
        type: true,
        city: true,
        dangerClass: true,
        employeeCount: true,
        electricInfrastructureRecords: {
          select: {
            id: true,
            equipmentCategory: true,
            equipmentCodeName: true,
            locationDescription: true,
            hasRisk: true,
            hasMaintenanceRecord: true,
            lastMaintenanceDate: true,
            thermalControl: true,
            overloadHeat: true,
            cablesBreakers: true,
            cleanlinessVentilation: true,
            extinguishingSystem: true,
            sealingFireStop: true,
            protectionSystem: true,
            actionStatus: true,
            isInspected: true,
            detectedRisk: true,
            suggestedAction: true,
            emergencyActionTaken: true,
            responsiblePerson: true,
            deadlineDate: true,
            inspectorName: true,
            inspectionDate: true,
            photoUrls: true,
            notes: true
          }
        },
        electricInfrastructureStatus: true
      },
      orderBy: { name: 'asc' }
    });

    // 2. Compute C-Level Aggregates
    let totalFacilitiesCount = facilities.length;
    let enteredFacilitiesCount = 0;
    let verifiedCompletedCount = 0;
    let totalEquipments = 0;
    let totalRisks = 0;
    let totalMissingMaintenance = 0;
    let totalOpenActions = 0;
    let totalThermalNotSuitable = 0;

    const categoryDistributionMap: Record<string, number> = {};
    const riskByCategoryMap: Record<string, number> = {};
    const actionStatusMap: Record<string, number> = { 'Tamamlandı': 0, 'Devam Ediyor': 0, 'Açık': 0 };

    // Criteria breakdown accumulators
    const criteriaBreakdowns: Record<string, Record<string, number>> = {
      hasRisk: { 'Var': 0, 'Yok': 0 },
      hasMaintenanceRecord: { 'Var': 0, 'Yok': 0 },
      isInspected: { 'Evet': 0, 'Hayır': 0 },
      thermalControl: { 'Uygun': 0, 'Uygun Değil': 0, 'Yapılmadı': 0 },
      overloadHeat: { 'Var': 0, 'Yok': 0, 'Kontrol Edilmedi': 0 },
      cablesBreakers: { 'Uygun': 0, 'Uygun Değil': 0, 'Kontrol Edilmedi': 0 },
      cleanlinessVentilation: { 'Uygun': 0, 'Uygun Değil': 0, 'Kontrol Edilmedi': 0 },
      extinguishingSystem: { 'Var ve Uygun': 0, 'Yok': 0, 'Uygun Değil': 0, 'Uygulanamaz': 0 },
      sealingFireStop: { 'Var ve Uygun': 0, 'Yok': 0, 'Uygun Değil': 0, 'Uygulanamaz': 0 },
      protectionSystem: { 'Uygun': 0, 'Uygun Değil': 0, 'Kontrol Edilmedi': 0 }
    };

    const facilityDetails = facilities.map(f => {
      const allRecords = f.electricInfrastructureRecords || [];
      const hasRecords = allRecords.length > 0;
      if (hasRecords) enteredFacilitiesCount++;

      const isCompleted = Boolean(f.electricInfrastructureStatus?.isCompleted);
      if (isCompleted) verifiedCompletedCount++;

      const facilityRisks = allRecords.filter(r => r.hasRisk === 'Var').length;
      const facilityNoMaint = allRecords.filter(r => r.hasMaintenanceRecord === 'Yok' || !r.lastMaintenanceDate).length;
      const facilityOpenAction = allRecords.filter(r => r.actionStatus === 'Açık' || r.actionStatus === 'Devam Ediyor').length;
      const facilityThermalNotOk = allRecords.filter(r => r.thermalControl === 'Uygun Değil').length;

      totalEquipments += allRecords.length;
      totalRisks += facilityRisks;
      totalMissingMaintenance += facilityNoMaint;
      totalOpenActions += facilityOpenAction;
      totalThermalNotSuitable += facilityThermalNotOk;

      allRecords.forEach(r => {
        categoryDistributionMap[r.equipmentCategory] = (categoryDistributionMap[r.equipmentCategory] || 0) + 1;
        if (r.hasRisk === 'Var') {
          riskByCategoryMap[r.equipmentCategory] = (riskByCategoryMap[r.equipmentCategory] || 0) + 1;
        }
        if (r.actionStatus) {
          actionStatusMap[r.actionStatus] = (actionStatusMap[r.actionStatus] || 0) + 1;
        }

        // Tally criteria breakdown
        Object.keys(criteriaBreakdowns).forEach(key => {
          const val = (r as any)[key];
          if (val) {
            criteriaBreakdowns[key][val] = (criteriaBreakdowns[key][val] || 0) + 1;
          }
        });
      });

      // Filtered equipment list for this facility based on active criteria/category filters
      let matchingRecords = allRecords;
      if (selectedCategory && selectedCategory !== 'all') {
        matchingRecords = matchingRecords.filter(r => r.equipmentCategory === selectedCategory);
      }
      if (criteriaKey && criteriaValue && criteriaValue !== 'all') {
        matchingRecords = matchingRecords.filter(r => (r as any)[criteriaKey] === criteriaValue);
      }

      // Health / Compliance score per facility (100 - risk and missing penalties)
      let complianceScore = 100;
      if (allRecords.length > 0) {
        const riskPenalty = (facilityRisks / allRecords.length) * 40;
        const maintPenalty = (facilityNoMaint / allRecords.length) * 35;
        const actionPenalty = (facilityOpenAction / allRecords.length) * 25;
        complianceScore = Math.max(0, Math.round(100 - (riskPenalty + maintPenalty + actionPenalty)));
      } else {
        complianceScore = 0;
      }

      return {
        id: f.id,
        name: f.name,
        shortName: f.shortName || f.name,
        type: f.type,
        city: f.city,
        equipmentCount: allRecords.length,
        matchingEquipmentCount: matchingRecords.length,
        matchingEquipments: matchingRecords.map(r => ({
          id: r.id,
          facilityId: f.id,
          facilityName: f.name,
          equipmentCategory: r.equipmentCategory,
          equipmentCodeName: r.equipmentCodeName,
          locationDescription: r.locationDescription,
          isInspected: r.isInspected,
          hasRisk: r.hasRisk,
          hasMaintenanceRecord: r.hasMaintenanceRecord,
          lastMaintenanceDate: r.lastMaintenanceDate,
          thermalControl: r.thermalControl,
          overloadHeat: r.overloadHeat,
          cablesBreakers: r.cablesBreakers,
          cleanlinessVentilation: r.cleanlinessVentilation,
          extinguishingSystem: r.extinguishingSystem,
          sealingFireStop: r.sealingFireStop,
          protectionSystem: r.protectionSystem,
          actionStatus: r.actionStatus,
          detectedRisk: r.detectedRisk,
          suggestedAction: r.suggestedAction,
          emergencyActionTaken: r.emergencyActionTaken,
          responsiblePerson: r.responsiblePerson,
          deadlineDate: r.deadlineDate,
          inspectorName: r.inspectorName,
          inspectionDate: r.inspectionDate,
          photoUrls: r.photoUrls,
          notes: r.notes
        })),
        hasEntered: hasRecords,
        isCompleted,
        completedAt: f.electricInfrastructureStatus?.completedAt || null,
        completedBy: f.electricInfrastructureStatus?.completedBy || null,
        riskCount: facilityRisks,
        noMaintenanceCount: facilityNoMaint,
        openActionCount: facilityOpenAction,
        thermalNotSuitableCount: facilityThermalNotOk,
        complianceScore
      };
    });

    // 3. Apply post-filtering on facility details
    let filteredFacilityDetails = facilityDetails;

    if (completionFilter === 'completed') {
      filteredFacilityDetails = filteredFacilityDetails.filter(f => f.isCompleted);
    } else if (completionFilter === 'entered_not_completed') {
      filteredFacilityDetails = filteredFacilityDetails.filter(f => f.hasEntered && !f.isCompleted);
    } else if (completionFilter === 'not_entered') {
      filteredFacilityDetails = filteredFacilityDetails.filter(f => !f.hasEntered);
    }

    if (riskFilter === 'with_risk') {
      filteredFacilityDetails = filteredFacilityDetails.filter(f => f.riskCount > 0);
    } else if (riskFilter === 'no_risk') {
      filteredFacilityDetails = filteredFacilityDetails.filter(f => f.riskCount === 0 && f.hasEntered);
    } else if (riskFilter === 'open_actions') {
      filteredFacilityDetails = filteredFacilityDetails.filter(f => f.openActionCount > 0);
    }

    // Filter by matching criteria / category if specified
    if ((selectedCategory && selectedCategory !== 'all') || (criteriaKey && criteriaValue && criteriaValue !== 'all')) {
      filteredFacilityDetails = filteredFacilityDetails.filter(f => f.matchingEquipmentCount > 0);
    }

    // Sort: Risk Count descending, then Equipment Count descending
    filteredFacilityDetails.sort((a, b) => b.riskCount - a.riskCount || b.equipmentCount - a.equipmentCount);

    const categoryBreakdown = Object.entries(categoryDistributionMap)
      .map(([name, count]) => ({
        name,
        count,
        riskCount: riskByCategoryMap[name] || 0
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      summary: {
        totalFacilitiesCount,
        enteredFacilitiesCount,
        notEnteredFacilitiesCount: totalFacilitiesCount - enteredFacilitiesCount,
        verifiedCompletedCount,
        entryCompletionRate: totalFacilitiesCount > 0 ? Math.round((enteredFacilitiesCount / totalFacilitiesCount) * 100) : 0,
        verifiedCompletionRate: totalFacilitiesCount > 0 ? Math.round((verifiedCompletedCount / totalFacilitiesCount) * 100) : 0,
        totalEquipments,
        totalRisks,
        totalMissingMaintenance,
        totalOpenActions,
        totalThermalNotSuitable
      },
      categoryBreakdown,
      actionStatusBreakdown: [
        { name: 'Tamamlandı', value: actionStatusMap['Tamamlandı'] || 0, color: '#10b981' },
        { name: 'Devam Ediyor', value: actionStatusMap['Devam Ediyor'] || 0, color: '#f59e0b' },
        { name: 'Açık', value: actionStatusMap['Açık'] || 0, color: '#ef4444' }
      ],
      criteriaBreakdowns,
      facilities: filteredFacilityDetails
    });
  } catch (error: any) {
    console.error('Error fetching executive dashboard:', error);
    res.status(500).json({ error: error.message || 'Yönetici gösterge paneli verileri alınamadı.' });
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

