import { PrismaClient, Prisma } from '@prisma/client';
import {
  ImprovementSheetType,
  ImprovementOperationType,
  ImprovementReportResult,
  IMPROVEMENT_SHEET_DEFINITIONS,
  isCriticalItem,
} from '@sec-portali/shared';

const prisma = new PrismaClient();

export class ImprovementReportService {
  /**
   * Sekme Üstündeki Kompakt Rapor Özeti Tablosu (CompactReportOverview)
   * Her hastane için son kontrol, son bakım, sonraki tarih, gecikme ve çelişki durumunu döner.
   */
  async getReportsOverview(params: { sheetType: ImprovementSheetType; facilityId?: string }) {
    const { sheetType, facilityId } = params;

    const facWhere: any = {
      type: { in: ['Hastane', 'hastane', 'HOSPITAL', 'Hospital'] },
      isActive: true,
    };
    if (facilityId && facilityId !== 'ALL') {
      facWhere.id = facilityId;
    }

    const [facilities, reports, records] = await Promise.all([
      prisma.facility.findMany({
        where: facWhere,
        select: { id: true, name: true, shortName: true },
        orderBy: { name: 'asc' },
      }),
      prisma.improvementOperationReport.findMany({
        where: {
          sheetType,
          isDeleted: false,
          ...(facilityId && facilityId !== 'ALL' ? { facilityId } : {}),
        },
        orderBy: { reportDate: 'desc' },
      }),
      prisma.improvementRecord.findMany({
        where: {
          sheetType,
          isArchived: false,
          ...(facilityId && facilityId !== 'ALL' ? { facilityId } : {}),
        },
        select: {
          id: true,
          facilityId: true,
          reportId: true,
          status: true,
          riskScore: true,
        },
      }),
    ]);

    const today = new Date();

    const overviewRows = facilities.map((fac) => {
      const facReports = reports.filter((r) => r.facilityId === fac.id);
      const facRecords = records.filter((r) => r.facilityId === fac.id);

      const latestInspection = facReports.find((r) => r.operationType === ImprovementOperationType.INSPECTION);
      const latestMaintenance = facReports.find((r) => r.operationType === ImprovementOperationType.MAINTENANCE);

      // Açık ve kritik bulgu sayıları
      let openCount = 0;
      let criticalCount = 0;
      facRecords.forEach((r) => {
        if (r.status !== 'Tamamlandı' && r.status !== 'İptal Edildi') {
          openCount++;
          if (isCriticalItem(r.riskScore, r.status)) criticalCount++;
        }
      });

      // Çelişki (Conflict) Kontrolü:
      // Rapor CLEAR (Uygunsuzluk Yok) işaretlenmiş ama rapora bağlı açık bulgu varsa
      const inspectionHasConflict =
        latestInspection?.resultStatus === ImprovementReportResult.CLEAR &&
        facRecords.some((r) => r.reportId === latestInspection.id && r.status !== 'Tamamlandı' && r.status !== 'İptal Edildi');

      const maintenanceHasConflict =
        latestMaintenance?.resultStatus === ImprovementReportResult.CLEAR &&
        facRecords.some((r) => r.reportId === latestMaintenance.id && r.status !== 'Tamamlandı' && r.status !== 'İptal Edildi');

      const hasConflict = inspectionHasConflict || maintenanceHasConflict;

      return {
        facilityId: fac.id,
        facilityName: fac.shortName || fac.name,
        inspection: latestInspection
          ? {
              id: latestInspection.id,
              reportDate: latestInspection.reportDate,
              nextScheduledDate: latestInspection.nextScheduledDate,
              resultStatus: latestInspection.resultStatus,
              isOverdue: latestInspection.nextScheduledDate
                ? new Date(latestInspection.nextScheduledDate) < today
                : false,
              companyName: latestInspection.companyName,
              reportNo: latestInspection.reportNo,
              hasConflict: inspectionHasConflict,
            }
          : null,
        maintenance: latestMaintenance
          ? {
              id: latestMaintenance.id,
              reportDate: latestMaintenance.reportDate,
              nextScheduledDate: latestMaintenance.nextScheduledDate,
              resultStatus: latestMaintenance.resultStatus,
              isOverdue: latestMaintenance.nextScheduledDate
                ? new Date(latestMaintenance.nextScheduledDate) < today
                : false,
              companyName: latestMaintenance.companyName,
              reportNo: latestMaintenance.reportNo,
              hasConflict: maintenanceHasConflict,
            }
          : null,
        openFindingsCount: openCount,
        criticalFindingsCount: criticalCount,
        hasConflict,
        conflictMessage: hasConflict ? 'Rapor temiz işaretli ancak açık tespit kaydı bulunuyor.' : null,
      };
    });

    return overviewRows;
  }

  /**
   * Hastanenin Rapor Geçmişi (Kontrol ve Bakım Kartları)
   */
  async getReportHistory(params: { sheetType: ImprovementSheetType; facilityId: string }) {
    const { sheetType, facilityId } = params;

    const reports = await prisma.improvementOperationReport.findMany({
      where: {
        sheetType,
        facilityId,
        isDeleted: false,
      },
      include: {
        findings: {
          where: { isArchived: false },
          select: {
            id: true,
            rowNo: true,
            finding: true,
            status: true,
            riskScore: true,
            assignedTo: true,
          },
        },
      },
      orderBy: { reportDate: 'desc' },
    });

    return reports;
  }

  /**
   * 2 Adımlı Periyodik Kontrol & Denetim Sihirbazı Kaydı
   * Tek Prisma $transaction içinde raporu ve bulguları atomik kaydeder.
   */
  async createWizardReport(
    data: {
      facilityId: string;
      sheetType: ImprovementSheetType;
      operationType: ImprovementOperationType;
      reportDate: string;
      nextScheduledDate?: string | null;
      resultStatus: ImprovementReportResult;
      companyName?: string | null;
      inspectorName?: string | null;
      reportNo?: string | null;
      summaryNotes?: string | null;
      newFindings?: Array<{
        finding: string;
        location?: string;
        equipment?: string;
        riskScore?: string;
        assignedTo?: string;
        status?: string;
        actionPlan?: string;
        dueDate?: string;
        category?: string;
        legacyBudget?: number;
      }>;
      linkedFindingIds?: string[];
    },
    userId: string
  ) {
    const {
      facilityId,
      sheetType,
      operationType,
      reportDate,
      nextScheduledDate,
      resultStatus,
      companyName,
      inspectorName,
      reportNo,
      summaryNotes,
      newFindings = [],
      linkedFindingIds = [],
    } = data;

    if (!facilityId || !sheetType || !reportDate) {
      throw new Error('Hastane, Takip Alanı ve Rapor Tarihi zorunludur.');
    }

    if (resultStatus === ImprovementReportResult.CLEAR && (newFindings.length > 0 || linkedFindingIds.length > 0)) {
      throw new Error('Sonuç "Bulgu bulunmadı" seçiliyken bulgu kaydı eklenemez.');
    }

    const def = IMPROVEMENT_SHEET_DEFINITIONS[sheetType];

    return await prisma.$transaction(async (tx) => {
      // 1. Raporu oluştur
      const report = await tx.improvementOperationReport.create({
        data: {
          facilityId,
          sheetType,
          operationType,
          reportDate: new Date(reportDate),
          nextScheduledDate: nextScheduledDate ? new Date(nextScheduledDate) : null,
          resultStatus,
          companyName,
          inspectorName,
          reportNo,
          summaryNotes,
          createdById: userId,
        },
      });

      // 2. Sıradaki rowNo değerini bul
      const lastRec = await tx.improvementRecord.findFirst({
        where: { facilityId, sheetType },
        orderBy: { rowNo: 'desc' },
        select: { rowNo: true },
      });
      let nextRowNo = (lastRec?.rowNo || 0) + 1;

      // 3. Yeni bulguları oluştur ve rapora bağla
      for (const item of newFindings) {
        if (!item.finding || !item.finding.trim()) continue;

        await tx.improvementRecord.create({
          data: {
            facilityId,
            moduleGroup: def.moduleGroup,
            sheetType,
            reportId: report.id,
            rowNo: nextRowNo++,
            finding: item.finding,
            location: item.location || null,
            equipment: item.equipment || null,
            riskScore: item.riskScore || 'Önemli',
            assignedTo: item.assignedTo || null,
            status: item.status || 'Başlamadı',
            actionPlan: item.actionPlan || null,
            dueDate: item.dueDate ? new Date(item.dueDate) : null,
            category: item.category || null,
            legacyBudget: item.legacyBudget ? new Prisma.Decimal(item.legacyBudget) : null,
            recordDate: new Date(reportDate),
            createdBy: userId,
          },
        });
      }

      // 4. Mevcut seçilen bulguların reportId alanını güncelle
      if (linkedFindingIds.length > 0) {
        await tx.improvementRecord.updateMany({
          where: {
            id: { in: linkedFindingIds },
            facilityId,
            sheetType,
          },
          data: {
            reportId: report.id,
          },
        });
      }

      return report;
    });
  }

  /**
   * Raporu Silme (Soft-delete)
   */
  async deleteReport(reportId: string, userId: string) {
    const report = await prisma.improvementOperationReport.findUnique({
      where: { id: reportId },
      include: { findings: true },
    });

    if (!report) {
      throw new Error('Rapor bulunamadı.');
    }

    await prisma.$transaction(async (tx) => {
      // Raporu soft delete yap
      await tx.improvementOperationReport.update({
        where: { id: reportId },
        data: {
          isDeleted: true,
          deletedAt: new Date(),
          deletedById: userId,
        },
      });

      // Bağlı bulguların reportId bağlantısını kaldır (SetNull)
      await tx.improvementRecord.updateMany({
        where: { reportId },
        data: { reportId: null },
      });
    });

    return { success: true };
  }
}

export const improvementReportService = new ImprovementReportService();
