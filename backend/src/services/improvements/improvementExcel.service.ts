import { PrismaClient, Prisma } from '@prisma/client';
import {
  ImprovementSheetType,
  IMPROVEMENT_SHEET_DEFINITIONS,
} from '@sec-portali/shared';

const prisma = new PrismaClient();

export class ImprovementExcelService {
  /**
   * Excel Sekme Adını 9 Standart Takip Alanından birine normalize eder
   */
  normalizeSheetName(rawName: string): ImprovementSheetType {
    const clean = rawName.trim();

    for (const [key, def] of Object.entries(IMPROVEMENT_SHEET_DEFINITIONS)) {
      if (def.excelAliases.some((alias) => alias.toLowerCase() === clean.toLowerCase())) {
        return key as ImprovementSheetType;
      }
    }

    if (clean.toLowerCase().includes('denetim')) return ImprovementSheetType.DENETIMLER;
    if (clean.toLowerCase().includes('topraklama')) return ImprovementSheetType.TOPRAKLAMA_PK;
    if (clean.toLowerCase().includes('paratoner')) return ImprovementSheetType.PARATONER_PK;
    if (clean.toLowerCase().includes('jenerat')) return ImprovementSheetType.JENERATOR_PK;
    if (clean.toLowerCase().includes('enerji') || clean.toLowerCase().includes('termal')) return ImprovementSheetType.ELEKTRIK_PANO_KONTROLLERI;
    if (clean.toLowerCase().includes('pano') && clean.toLowerCase().includes('bak')) return ImprovementSheetType.ELEKTRIK_PANO_BAKIMLARI;
    if (clean.toLowerCase().includes('trafo')) return ImprovementSheetType.TRAFO;
    if (clean.toLowerCase().includes('ups')) return ImprovementSheetType.UPS;
    if (clean.toLowerCase().includes('elektrik')) return ImprovementSheetType.ELEKTRIK_PK;

    return ImprovementSheetType.DENETIMLER;
  }

  parseDate(val: any): Date | null {
    if (!val && val !== 0) return null;
    if (typeof val === 'number') {
      if (val > 20000 && val < 60000) {
        return new Date(Math.round((val - 25569) * 86400 * 1000));
      }
    }
    if (typeof val === 'string') {
      const s = val.trim();
      if (!s) return null;
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
  }

  /**
   * Tip A, Tip B ve Tip C sütun haritalarına uygun toplu içe aktarma
   */
  async importSheetRows(params: {
    facilityId: string;
    sheetName: string;
    rows: any[];
    sourceFileName?: string;
    mode?: 'append' | 'replace';
    userId: string;
  }) {
    const { facilityId, sheetName, rows, sourceFileName, mode = 'append', userId } = params;

    const sheetType = this.normalizeSheetName(sheetName);
    const def = IMPROVEMENT_SHEET_DEFINITIONS[sheetType];
    const moduleGroup = def.moduleGroup;

    if (mode === 'replace') {
      await prisma.improvementRecord.deleteMany({
        where: { facilityId, sheetType },
      });
    }

    let insertedCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const r = rows[i];
      const findingText = r.finding || r.Tespitler || r.tespit || r.Tespit || r.Uygunsuzluk;
      if (!findingText || String(findingText).trim() === '') {
        continue;
      }

      const rowNoVal = r.rowNo || r['#'] || r['Sıra No'] || r['Sıra'] || i + 1;
      const parsedRowNo = parseInt(String(rowNoVal), 10) || i + 1;

      const recordDate = this.parseDate(
        r.recordDate || r.Tarih || r['Tespit Tarihi'] || r['PK Tarihi'] || r['Rapor Tarihi'] || r['Denetim Tarihi'] || r['Kontrol Tarihi']
      );

      const dueDate = this.parseDate(
        r.dueDate || r.Termin || r['Termin Tarihi'] || r['Hedef Tarih']
      );

      let assignedCategory = (r.category || r.Kategori || '').trim();
      if (!assignedCategory) {
        assignedCategory = moduleGroup === 'ELEKTRIK_BAKIM_KONTROL' ? 'Elektrik Güvenliği' : 'İş Güvenliği / Fiziksel Riskler';
      }

      // Bütçe / Maliyet
      const budgetVal = r.legacyBudget || r.budget || r.Maliyet || r.Bütçe || r['Tahmini Bütçe'] || null;
      let legacyBudget: Prisma.Decimal | null = null;
      if (budgetVal !== null && budgetVal !== undefined) {
        const num = parseFloat(String(budgetVal).replace(/[^0-9.-]+/g, ''));
        if (!isNaN(num)) legacyBudget = new Prisma.Decimal(num);
      }

      // Dinamik Tip A, B, C ekstra alanları
      const extraFields: Record<string, any> = {};
      if (r['Firma'] || r['Kontrol Kurumu'] || r['Firma / Kurum']) {
        extraFields.companyName = r['Firma'] || r['Kontrol Kurumu'] || r['Firma / Kurum'];
      }
      if (r['Öneri'] || r['Teknik Öneri'] || r['Önerilen Düzeltici Faaliyet']) {
        extraFields.recommendation = r['Öneri'] || r['Teknik Öneri'] || r['Önerilen Düzeltici Faaliyet'];
      }
      if (r['Cihaz'] || r['Trafo'] || r['UPS'] || r['Güç'] || r['Cihaz / Bölüm']) {
        extraFields.equipmentSpec = r['Cihaz'] || r['Trafo'] || r['UPS'] || r['Güç'] || r['Cihaz / Bölüm'];
      }
      if (r['Denetim Türü']) {
        extraFields.auditType = r['Denetim Türü'];
      }

      await prisma.improvementRecord.create({
        data: {
          facilityId,
          moduleGroup,
          sheetType,
          rowNo: parsedRowNo,
          location: r.location || r.Mahal || r.Konum || r.Bölüm || null,
          equipment: r.equipment || r.Ekipman || r.Pano || r.Trafo || r.UPS || null,
          finding: String(findingText).trim(),
          riskScore: r.riskScore || r['Risk Skoru'] || r.risk || r.Risk || 'Önemli',
          assignedTo: r.assignedTo || r.Sorumlusu || r.sorumlu || r.Sorumlu || null,
          status: r.status || r.Durum || 'Başlamadı',
          actionPlan: r.actionPlan || r['İş Planı'] || r['Is Plani'] || r['Planlanan Aksiyon'] || null,
          currentNote: r.currentNote || r['Aksiyon / Açıklama'] || r['Aksiyon/Açıklama'] || r['Aksiyon'] || null,
          auditName: r.auditName || r['Denetim Adı'] || null,
          category: assignedCategory,
          recordDate,
          dueDate,
          applicationType: r.applicationType || r.Uygulama || null,
          legacyBudget,
          currency: 'TRY',
          extraFields: Object.keys(extraFields).length ? extraFields : undefined,
          sourceFileName: sourceFileName || 'Excel İçe Aktarım',
          createdBy: userId,
        },
      });

      insertedCount++;
    }

    return {
      sheetType,
      insertedCount,
    };
  }
}

export const improvementExcelService = new ImprovementExcelService();
