import { PrismaClient } from '@prisma/client';
import {
  ImprovementSheetType,
  IMPROVEMENT_SHEET_DEFINITIONS,
  ELECTRICAL_SHEET_KEYS,
  VALID_STATUSES,
  VALID_RISKS,
  calculateCompletionRate,
  isCriticalItem,
} from '@sec-portali/shared';

const prisma = new PrismaClient();

export class ImprovementAnalyticsService {
  /**
   * Ana Dashboard Verileri: 6 KPI, Kalite Grid'i, 9 Sekme Matrisi, Hastane Karşılaştırması, 3'lü Akordiyon
   */
  async getDashboardStats(params: { facilityId?: string }) {
    const { facilityId } = params;

    // Filtreye göre kayıtlar (Seçili hastane veya Tümü)
    const filterWhere: any = { isArchived: false };
    if (facilityId && facilityId !== 'ALL') {
      filterWhere.facilityId = facilityId;
    }

    // 1. Filtrelenmiş kayıtlar (KPI'lar, kalite gridi, sekme matrisi ve akordiyon için)
    // 2. TÜM hastanelerdeki kayıtlar (Hastane karşılaştırma tablosu İÇİN - her zaman grup genelini gösterir)
    const [filteredRecords, allRecords, allFacilities, reports] = await Promise.all([
      prisma.improvementRecord.findMany({
        where: filterWhere,
        include: {
          facility: { select: { id: true, name: true, shortName: true } },
          actions: { select: { id: true, isDeleted: true } },
        },
      }),
      prisma.improvementRecord.findMany({
        where: { isArchived: false },
        include: {
          facility: { select: { id: true, name: true, shortName: true } },
        },
      }),
      prisma.facility.findMany({
        where: {
          type: { in: ['Hastane', 'hastane', 'HOSPITAL', 'Hospital'] },
          isActive: true,
        },
        select: { id: true, name: true, shortName: true, city: true },
        orderBy: { name: 'asc' },
      }),
      prisma.improvementOperationReport.findMany({
        where: { isDeleted: false },
        select: {
          id: true,
          facilityId: true,
          sheetType: true,
          operationType: true,
          reportDate: true,
          nextScheduledDate: true,
          resultStatus: true,
        },
      }),
    ]);

    // -------------------------------------------------------------
    // A. KPI'LAR & VERİ KALİTESİ (DATA HYGIENE)
    // -------------------------------------------------------------
    let total = filteredRecords.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let cancelled = 0;
    let openCount = 0;

    let emptyStatus = 0;
    let undefinedStatus = 0;
    let emptyRisk = 0;
    let undefinedRisk = 0;
    let emptyOwner = 0;
    let emptyAction = 0;
    let emptyDate = 0;
    let emptyFacility = 0;

    let openCritical = 0;
    let openHigh = 0;

    const statusCounts: Record<string, number> = {};
    const riskCounts: Record<string, number> = {};

    filteredRecords.forEach((r) => {
      const st = r.status?.trim() || '';
      const rk = r.riskScore?.trim() || '';

      // Durum kontrolleri
      if (!st) {
        emptyStatus++;
      } else if (!VALID_STATUSES.includes(st as any)) {
        undefinedStatus++;
      }

      if (st === 'Tamamlandı') completed++;
      else if (st === 'Devam Ediyor') inProgress++;
      else if (st === 'Başlamadı') notStarted++;
      else if (st === 'İptal Edildi') cancelled++;
      else if (st === 'Açık') openCount++;

      statusCounts[st || 'Durumu Boş'] = (statusCounts[st || 'Durumu Boş'] || 0) + 1;

      // Risk kontrolleri
      if (!rk) {
        emptyRisk++;
      } else if (!VALID_RISKS.includes(rk as any)) {
        undefinedRisk++;
      }
      riskCounts[rk || 'Riski Boş'] = (riskCounts[rk || 'Riski Boş'] || 0) + 1;

      // Diğer hijyen kontrolleri
      if (!r.assignedTo || !r.assignedTo.trim()) emptyOwner++;
      if (!r.actionPlan || !r.actionPlan.trim()) emptyAction++;
      if (!r.recordDate) emptyDate++;
      if (!r.facilityId) emptyFacility++;

      // Kritik kalemler (Kritik, Yüksek, Çok Yüksek VE açık/devam eden)
      if (isCriticalItem(r.riskScore, r.status)) {
        if (rk === 'Kritik' || rk === 'Çok Yüksek') openCritical++;
        else if (rk === 'Yüksek') openHigh++;
      }
    });

    const completionRateObj = calculateCompletionRate({
      total,
      completed,
      inProgress,
      notStarted,
      cancelled,
      openCount,
    });

    // -------------------------------------------------------------
    // B. 9 SEKME BAZLI ÖZET MATRİSİ (Area Summary Matrix - 12 Sütun)
    // -------------------------------------------------------------
    const areaSummaryMatrix = Object.values(ImprovementSheetType).map((sheetType) => {
      const def = IMPROVEMENT_SHEET_DEFINITIONS[sheetType];
      const sheetRecords = filteredRecords.filter((r) => r.sheetType === sheetType);
      const sheetReports = reports.filter((rep) => rep.sheetType === sheetType && (facilityId === 'ALL' || rep.facilityId === facilityId));

      let sCompleted = 0;
      let sInProgress = 0;
      let sNotStarted = 0;
      let sCancelled = 0;
      let sOpenCritical = 0;
      let sOpenHigh = 0;
      let sActions = 0;

      sheetRecords.forEach((r) => {
        if (r.status === 'Tamamlandı') sCompleted++;
        else if (r.status === 'Devam Ediyor') sInProgress++;
        else if (r.status === 'Başlamadı') sNotStarted++;
        else if (r.status === 'İptal Edildi') sCancelled++;

        if (isCriticalItem(r.riskScore, r.status)) {
          if (r.riskScore === 'Kritik' || r.riskScore === 'Çok Yüksek') sOpenCritical++;
          else if (r.riskScore === 'Yüksek') sOpenHigh++;
        }

        sActions += r.actions?.filter((a) => !a.isDeleted).length || 0;
      });

      const sRateObj = calculateCompletionRate({
        total: sheetRecords.length,
        completed: sCompleted,
        inProgress: sInProgress,
        notStarted: sNotStarted,
        cancelled: sCancelled,
      });

      const today = new Date();
      const overdueReports = sheetReports.filter(
        (rep) => rep.nextScheduledDate && new Date(rep.nextScheduledDate) < today
      ).length;

      return {
        sheetType,
        label: def.label,
        moduleGroup: def.moduleGroup,
        path: def.path,
        total: sheetRecords.length,
        completed: sCompleted,
        inProgress: sInProgress,
        notStarted: sNotStarted,
        cancelled: sCancelled,
        completionRate: sRateObj.rate,
        completionRateDisplay: sRateObj.display,
        openCritical: sOpenCritical,
        openHigh: sOpenHigh,
        actionsCount: sActions,
        reportsCount: sheetReports.length,
        overdueReportsCount: overdueReports,
      };
    });

    // -------------------------------------------------------------
    // C. HASTANE KARŞILAŞTIRMA MATRİSİ (Hospital Comparison Matrix)
    // Üstteki hastane filtresinden etkilenmez, her zaman tüm hastaneleri gösterir
    // -------------------------------------------------------------
    const hospitalComparisonMatrix = allFacilities.map((fac) => {
      const facRecords = allRecords.filter((r) => r.facilityId === fac.id);
      let fCompleted = 0;
      let fInProgress = 0;
      let fNotStarted = 0;
      let fCancelled = 0;
      let fOpenCritical = 0;
      let fOpenHigh = 0;

      facRecords.forEach((r) => {
        if (r.status === 'Tamamlandı') fCompleted++;
        else if (r.status === 'Devam Ediyor') fInProgress++;
        else if (r.status === 'Başlamadı') fNotStarted++;
        else if (r.status === 'İptal Edildi') fCancelled++;

        if (isCriticalItem(r.riskScore, r.status)) {
          if (r.riskScore === 'Kritik' || r.riskScore === 'Çok Yüksek') fOpenCritical++;
          else if (r.riskScore === 'Yüksek') fOpenHigh++;
        }
      });

      const fRateObj = calculateCompletionRate({
        total: facRecords.length,
        completed: fCompleted,
        inProgress: fInProgress,
        notStarted: fNotStarted,
        cancelled: fCancelled,
      });

      return {
        facilityId: fac.id,
        facilityName: fac.name,
        shortName: fac.shortName || fac.name,
        city: fac.city || '',
        total: facRecords.length,
        completed: fCompleted,
        inProgress: fInProgress,
        notStarted: fNotStarted,
        cancelled: fCancelled,
        completionRate: fRateObj.rate,
        completionRateDisplay: fRateObj.display,
        openCritical: fOpenCritical,
        openHigh: fOpenHigh,
      };
    }).sort((a, b) => b.total - a.total);

    // -------------------------------------------------------------
    // D. 3 SEVİYELİ HASTANE BULGU AKORDİYONU (Hospital Finding Accordion)
    // Seviye 1: Hastane -> Seviye 2: Takip Alanı (Kaynak) -> Seviye 3: Kategori
    // -------------------------------------------------------------
    const hospitalMap: Record<string, {
      hospitalId: string;
      hospitalName: string;
      total: number;
      completed: number;
      cancelled: number;
      sheets: Record<string, {
        sheetType: string;
        sheetLabel: string;
        total: number;
        completed: number;
        cancelled: number;
        categories: Record<string, {
          categoryName: string;
          total: number;
          completed: number;
          cancelled: number;
        }>;
      }>;
    }> = {};

    filteredRecords.forEach((r) => {
      const hId = r.facilityId;
      const hName = r.facility?.shortName || r.facility?.name || 'Bilinmeyen Hastane';
      const sType = r.sheetType;
      const sLabel = IMPROVEMENT_SHEET_DEFINITIONS[sType as ImprovementSheetType]?.label || sType;
      const cat = r.category?.trim() || 'Kategorisiz';

      if (!hospitalMap[hId]) {
        hospitalMap[hId] = {
          hospitalId: hId,
          hospitalName: hName,
          total: 0,
          completed: 0,
          cancelled: 0,
          sheets: {},
        };
      }
      hospitalMap[hId].total++;
      if (r.status === 'Tamamlandı') hospitalMap[hId].completed++;
      if (r.status === 'İptal Edildi') hospitalMap[hId].cancelled++;

      if (!hospitalMap[hId].sheets[sType]) {
        hospitalMap[hId].sheets[sType] = {
          sheetType: sType,
          sheetLabel: sLabel,
          total: 0,
          completed: 0,
          cancelled: 0,
          categories: {},
        };
      }
      hospitalMap[hId].sheets[sType].total++;
      if (r.status === 'Tamamlandı') hospitalMap[hId].sheets[sType].completed++;
      if (r.status === 'İptal Edildi') hospitalMap[hId].sheets[sType].cancelled++;

      if (!hospitalMap[hId].sheets[sType].categories[cat]) {
        hospitalMap[hId].sheets[sType].categories[cat] = {
          categoryName: cat,
          total: 0,
          completed: 0,
          cancelled: 0,
        };
      }
      hospitalMap[hId].sheets[sType].categories[cat].total++;
      if (r.status === 'Tamamlandı') hospitalMap[hId].sheets[sType].categories[cat].completed++;
      if (r.status === 'İptal Edildi') hospitalMap[hId].sheets[sType].categories[cat].cancelled++;
    });

    const hospitalFindingAccordion = Object.values(hospitalMap).map((h) => {
      const hRate = calculateCompletionRate({
        total: h.total,
        completed: h.completed,
        inProgress: 0,
        notStarted: 0,
        cancelled: h.cancelled,
      });

      const sheetsArr = Object.values(h.sheets).map((s) => {
        const sRate = calculateCompletionRate({
          total: s.total,
          completed: s.completed,
          inProgress: 0,
          notStarted: 0,
          cancelled: s.cancelled,
        });

        const categoriesArr = Object.values(s.categories).map((c) => {
          const cRate = calculateCompletionRate({
            total: c.total,
            completed: c.completed,
            inProgress: 0,
            notStarted: 0,
            cancelled: c.cancelled,
          });

          return {
            categoryName: c.categoryName,
            total: c.total,
            completed: c.completed,
            completionRateDisplay: cRate.display,
          };
        }).sort((a, b) => b.total - a.total);

        return {
          sheetType: s.sheetType,
          sheetLabel: s.sheetLabel,
          total: s.total,
          completed: s.completed,
          completionRateDisplay: sRate.display,
          categories: categoriesArr,
        };
      }).sort((a, b) => b.total - a.total);

      return {
        hospitalId: h.hospitalId,
        hospitalName: h.hospitalName,
        total: h.total,
        completed: h.completed,
        completionRateDisplay: hRate.display,
        sheets: sheetsArr,
      };
    }).sort((a, b) => b.total - a.total);

    // Uyarı Banner Mesajı
    let notice: { type: 'amber' | 'neutral'; message: string } | null = null;
    if (completionRateObj.hasIncompleteStatus) {
      notice = {
        type: 'amber',
        message:
          'Durumu girilmemiş veya tanımsız kayıtlar bulunduğu için tamamlanma oranı hesaplanamamaktadır (n.a.). Lütfen Veri Kalitesi tablosundaki eksik durumları tamamlayınız.',
      };
    }

    return {
      kpis: {
        totalFindings: total,
        completed,
        completionRateDisplay: completionRateObj.display,
        completionRate: completionRateObj.rate,
        hasIncompleteStatus: completionRateObj.hasIncompleteStatus,
        openCritical,
        openHigh,
        missingStatusCount: emptyStatus + undefinedStatus,
        missingRiskCount: emptyRisk + undefinedRisk,
        missingOwnerCount: emptyOwner,
      },
      notice,
      qualityGrid: {
        emptyStatus,
        undefinedStatus,
        emptyRisk,
        undefinedRisk,
        emptyOwner,
        emptyAction,
        emptyDate,
        emptyFacility,
      },
      statusDistribution: Object.entries(statusCounts).map(([status, count]) => ({ status, count })),
      riskDistribution: Object.entries(riskCounts).map(([risk, count]) => ({ risk, count })),
      areaSummaryMatrix,
      hospitalComparisonMatrix,
      hospitalFindingAccordion,
    };
  }

  /**
   * Grup Dashboard İstatistikleri (Elektrik & Periyodik Kontroller Grubu - 8 Sekme)
   */
  async getGroupStats(params: { group: string; facilityId?: string }) {
    const { group, facilityId } = params;

    const whereRecords: any = {
      isArchived: false,
      sheetType: { in: ELECTRICAL_SHEET_KEYS },
    };
    if (facilityId && facilityId !== 'ALL') {
      whereRecords.facilityId = facilityId;
    }

    const [records, allFacilities, reports] = await Promise.all([
      prisma.improvementRecord.findMany({
        where: whereRecords,
        include: {
          facility: { select: { id: true, name: true, shortName: true } },
          actions: { select: { id: true, costAmount: true, isDeleted: true } },
        },
      }),
      prisma.facility.findMany({
        where: {
          type: { in: ['Hastane', 'hastane', 'HOSPITAL', 'Hospital'] },
          isActive: true,
        },
        select: { id: true, name: true, shortName: true },
        orderBy: { name: 'asc' },
      }),
      prisma.improvementOperationReport.findMany({
        where: {
          isDeleted: false,
          sheetType: { in: ELECTRICAL_SHEET_KEYS },
          ...(facilityId && facilityId !== 'ALL' ? { facilityId } : {}),
        },
        include: {
          findings: { select: { id: true, status: true, riskScore: true } },
        },
      }),
    ]);

    // 1. Grup 6 KPI
    let total = records.length;
    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;
    let cancelled = 0;
    let openCritical = 0;
    let totalActionsCost = 0;

    records.forEach((r) => {
      if (r.status === 'Tamamlandı') completed++;
      else if (r.status === 'Devam Ediyor') inProgress++;
      else if (r.status === 'Başlamadı') notStarted++;
      else if (r.status === 'İptal Edildi') cancelled++;

      if (isCriticalItem(r.riskScore, r.status)) {
        openCritical++;
      }

      r.actions?.forEach((a) => {
        if (!a.isDeleted && a.costAmount) {
          totalActionsCost += Number(a.costAmount);
        }
      });
    });

    const completionRateObj = calculateCompletionRate({
      total,
      completed,
      inProgress,
      notStarted,
      cancelled,
    });

    // 2. Operasyon Metrikleri (6 Kutu)
    const facilitiesWithReports = new Set(reports.map((r) => r.facilityId)).size;
    const today = new Date();
    const overdueReports = reports.filter((r) => r.nextScheduledDate && new Date(r.nextScheduledDate) < today).length;
    const clearReports = reports.filter((r) => r.resultStatus === 'CLEAR').length;
    const findingsReports = reports.filter((r) => r.resultStatus === 'FINDINGS').length;

    // 3. Grup İçi Sekme Özeti (groupSummaryTable)
    const groupSummaryTable = ELECTRICAL_SHEET_KEYS.map((key) => {
      const def = IMPROVEMENT_SHEET_DEFINITIONS[key];
      const sRecords = records.filter((r) => r.sheetType === key);
      let sComp = 0;
      let sInProg = 0;
      let sNotSt = 0;
      let sCanc = 0;
      let sCrit = 0;

      sRecords.forEach((r) => {
        if (r.status === 'Tamamlandı') sComp++;
        else if (r.status === 'Devam Ediyor') sInProg++;
        else if (r.status === 'Başlamadı') sNotSt++;
        else if (r.status === 'İptal Edildi') sCanc++;
        if (isCriticalItem(r.riskScore, r.status)) sCrit++;
      });

      const sRate = calculateCompletionRate({
        total: sRecords.length,
        completed: sComp,
        inProgress: sInProg,
        notStarted: sNotSt,
        cancelled: sCanc,
      });

      return {
        sheetType: key,
        label: def.label,
        path: def.path,
        total: sRecords.length,
        completed: sComp,
        open: sInProg + sNotSt,
        completionRateDisplay: sRate.display,
        openCritical: sCrit,
      };
    });

    // 4. Hastane Operasyon Matrisi (hospitalOperationTable)
    const hospitalOperationTable = allFacilities.map((fac) => {
      const facReports = reports.filter((r) => r.facilityId === fac.id);
      const facRecords = records.filter((r) => r.facilityId === fac.id);

      const latestInspection = facReports
        .filter((r) => r.operationType === 'INSPECTION')
        .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())[0];

      const latestMaintenance = facReports
        .filter((r) => r.operationType === 'MAINTENANCE')
        .sort((a, b) => new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime())[0];

      let openCount = 0;
      let criticalCount = 0;
      facRecords.forEach((r) => {
        if (r.status !== 'Tamamlandı' && r.status !== 'İptal Edildi') {
          openCount++;
          if (isCriticalItem(r.riskScore, r.status)) criticalCount++;
        }
      });

      return {
        facilityId: fac.id,
        facilityName: fac.shortName || fac.name,
        latestInspectionDate: latestInspection?.reportDate || null,
        nextInspectionDate: latestInspection?.nextScheduledDate || null,
        inspectionResult: latestInspection?.resultStatus || null,
        isInspectionOverdue: latestInspection?.nextScheduledDate
          ? new Date(latestInspection.nextScheduledDate) < today
          : false,
        latestMaintenanceDate: latestMaintenance?.reportDate || null,
        nextMaintenanceDate: latestMaintenance?.nextScheduledDate || null,
        maintenanceResult: latestMaintenance?.resultStatus || null,
        isMaintenanceOverdue: latestMaintenance?.nextScheduledDate
          ? new Date(latestMaintenance.nextScheduledDate) < today
          : false,
        openCount,
        criticalCount,
      };
    }).sort((a, b) => b.openCount - a.openCount);

    return {
      groupKpis: {
        totalFindings: total,
        completed,
        completionRateDisplay: completionRateObj.display,
        openCritical,
        totalActionsCost,
      },
      operationMetrics: {
        totalHospitals: allFacilities.length,
        facilitiesWithReports,
        overdueReports,
        clearReports,
        findingsReports,
      },
      groupSummaryTable,
      hospitalOperationTable,
    };
  }
}

export const improvementAnalyticsService = new ImprovementAnalyticsService();
