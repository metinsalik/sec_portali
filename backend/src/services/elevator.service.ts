import { PrismaClient } from '@prisma/client';
import ExcelJS from 'exceljs';

const prisma = new PrismaClient();

export const elevatorService = {
  getElevators: async (facilityId: string, filters?: { brand?: string; maintenanceCompany?: string; label?: string; type?: string; inspectionStatus?: string }) => {
    const whereClause: any = {};
    if (facilityId !== 'all') {
      whereClause.facilityId = facilityId;
    }
    if (filters?.brand) {
      whereClause.brand = { contains: filters.brand, mode: 'insensitive' };
    }
    if (filters?.maintenanceCompany) {
      whereClause.maintenanceCompany = { contains: filters.maintenanceCompany, mode: 'insensitive' };
    }
    if (filters?.label) {
      whereClause.label = { contains: filters.label, mode: 'insensitive' };
    }
    if (filters?.type) {
      whereClause.type = { contains: filters.type, mode: 'insensitive' };
    }
    if (filters?.inspectionStatus) {
      const now = new Date();
      if (filters.inspectionStatus === 'overdue') {
        whereClause.nextInspectionDate = { lt: now };
      } else if (filters.inspectionStatus === '0-30') {
        const next30 = new Date();
        next30.setDate(next30.getDate() + 30);
        whereClause.nextInspectionDate = { gte: now, lte: next30 };
      } else if (filters.inspectionStatus === '31-90') {
        const next30 = new Date();
        next30.setDate(next30.getDate() + 30);
        const next90 = new Date();
        next90.setDate(next90.getDate() + 90);
        whereClause.nextInspectionDate = { gt: next30, lte: next90 };
      } else if (filters.inspectionStatus === 'missing') {
        whereClause.nextInspectionDate = null;
      }
    }

    return prisma.elevator.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: { facility: true }
    });
  },

  getElevatorById: async (id: string) => {
    return prisma.elevator.findUnique({
      where: { id },
      include: {
        facility: true,
        inspections: {
          orderBy: { inspectionDate: 'desc' }
        }
      }
    });
  },

  addInspection: async (elevatorId: string, data: any) => {
    return prisma.$transaction(async (tx) => {
      const { nextInspectionDate, ...inspectionData } = data;
      const inspection = await tx.elevatorInspection.create({
        data: {
          ...inspectionData,
          elevatorId
        }
      });
      
      // Update elevator's next and last inspection dates only if this new inspection is the most recent one
      if (inspectionData.inspectionDate) {
        const insDate = new Date(inspectionData.inspectionDate);
        const currentElevator = await tx.elevator.findUnique({ where: { id: elevatorId } });

        if (!currentElevator?.lastInspectionDate || insDate >= currentElevator.lastInspectionDate) {
          let nextDate;
          
          if (nextInspectionDate) {
            nextDate = new Date(nextInspectionDate);
          } else {
            nextDate = new Date(insDate);
            nextDate.setFullYear(nextDate.getFullYear() + 1);
          }

          await tx.elevator.update({
            where: { id: elevatorId },
            data: {
              lastInspectionDate: insDate,
              nextInspectionDate: nextDate,
              label: inspectionData.label || undefined,
              ...(inspectionData.reportUrl ? { reportUrl: inspectionData.reportUrl } : {})
            }
          });
        }
      }

      return inspection;
    });
  },

  createElevator: async (data: any) => {
    return prisma.$transaction(async (tx) => {
      const elevator = await tx.elevator.create({
        data
      });

      if (data.lastInspectionDate || data.reportUrl) {
        await tx.elevatorInspection.create({
          data: {
            elevatorId: elevator.id,
            inspectionDate: data.lastInspectionDate ? new Date(data.lastInspectionDate) : new Date(),
            label: data.label || 'Belirsiz',
            reportUrl: data.reportUrl || null,
            inspectorName: data.source || data.maintenanceCompany || null,
            notes: 'İlk kayıt / Ana Rapor'
          }
        });
      }

      return elevator;
    });
  },

  updateElevator: async (id: string, data: any) => {
    return prisma.elevator.update({
      where: { id },
      data
    });
  },

  deleteElevator: async (id: string) => {
    return prisma.elevator.delete({
      where: { id }
    });
  },

  generateTemplate: async () => {
    const facilities = await prisma.facility.findMany({
      select: { name: true },
      orderBy: { name: 'asc' }
    });
    
    const brands = await prisma.elevatorBrand.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } });
    const companies = await prisma.elevatorMaintenanceCompany.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } });
    const types = await prisma.elevatorType.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } });
    const labels = await prisma.elevatorLabel.findMany({ select: { name: true }, distinct: ['name'], orderBy: { name: 'asc' } });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Şablon');
    
    const fillHiddenSheet = (name: string, data: { name: string }[]) => {
      if (data.length === 0) return null;
      const hiddenSheet = workbook.addWorksheet(name, { state: 'hidden' });
      data.forEach((item, index) => {
        hiddenSheet.getCell(`A${index + 1}`).value = item.name;
      });
      return hiddenSheet;
    };

    const facilitiesSheet = fillHiddenSheet('Tesisler', facilities);
    const brandsSheet = fillHiddenSheet('Markalar', brands);
    const companiesSheet = fillHiddenSheet('Firmalar', companies);
    const typesSheet = fillHiddenSheet('Turler', types);
    const labelsSheet = fillHiddenSheet('Etiketler', labels);

    const headers = [
      'Tesis Adı',
      'Asansör No',
      'Asansör Adı',
      'Türü',
      'Etiket',
      'Marka',
      'Model',
      'Seri No',
      'Kapasite (Kg)',
      'Kapasite (Kişi)',
      'Durak Sayısı',
      'Kurulum Yılı',
      'Bakım Firması',
      'Son Muayene Tarihi',
      'Sonraki Muayene Tarihi'
    ];

    sheet.addRow(headers);
    sheet.getRow(1).font = { bold: true };

    for (let i = 2; i <= 1000; i++) {
      if (facilities.length > 0) {
        sheet.getCell(`A${i}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Tesisler'!$A$1:$A$${facilities.length}`]
        };
      }
      if (types.length > 0) {
        sheet.getCell(`D${i}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Turler'!$A$1:$A$${types.length}`]
        };
      }
      if (labels.length > 0) {
        sheet.getCell(`E${i}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Etiketler'!$A$1:$A$${labels.length}`]
        };
      }
      if (brands.length > 0) {
        sheet.getCell(`F${i}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Markalar'!$A$1:$A$${brands.length}`]
        };
      }
      if (companies.length > 0) {
        sheet.getCell(`M${i}`).dataValidation = {
          type: 'list', allowBlank: true, formulae: [`'Firmalar'!$A$1:$A$${companies.length}`]
        };
      }

      // Date validation
      sheet.getCell(`N${i}`).dataValidation = {
        type: 'date', operator: 'greaterThan', showErrorMessage: true, allowBlank: true, formulae: [new Date('1900-01-01')]
      };
      sheet.getCell(`O${i}`).dataValidation = {
        type: 'date', operator: 'greaterThan', showErrorMessage: true, allowBlank: true, formulae: [new Date('1900-01-01')]
      };
      
      sheet.getCell(`N${i}`).numFmt = 'dd.mm.yyyy';
      sheet.getCell(`O${i}`).numFmt = 'dd.mm.yyyy';
    }

    // Set column widths
    sheet.columns = headers.map(() => ({ width: 20 }));

    const buffer = await workbook.xlsx.writeBuffer();
    return buffer as any;
  },

  importExcel: async (facilityIdFallback: string, buffer: Buffer) => {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as any);
    const sheet = workbook.getWorksheet('Şablon') || workbook.worksheets[0];
    if (!sheet) throw new Error('Şablon sayfası bulunamadı');

    const facilities = await prisma.facility.findMany({ select: { id: true, name: true } });
    const facilityMap = new Map(facilities.map(f => [f.name, f.id]));

    let importedCount = 0;

    const rows: any[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // Skip headers
      rows.push(row.values);
    });

    await prisma.$transaction(async (tx) => {
      for (const rowVals of rows) {
        // exceljs row.values is 1-indexed (index 0 is empty)
        const getVal = (idx: number) => {
          const val = rowVals[idx];
          if (!val) return null;
          return typeof val === 'object' && 'result' in val ? String(val.result) : String(val);
        };

        const tesisAdi = getVal(1);
        const elevatorNo = getVal(2);
        
        if (!elevatorNo) continue;

        let rowFacilityId = facilityIdFallback;
        if (tesisAdi && facilityMap.has(tesisAdi)) {
          rowFacilityId = facilityMap.get(tesisAdi)!;
        }

        if (!rowFacilityId) continue;

        // parse date strings or excel date objects
        const getDateVal = (idx: number) => {
          const val = rowVals[idx];
          if (!val) return null;
          if (val instanceof Date) return val;
          const parsed = new Date(val);
          return isNaN(parsed.getTime()) ? null : parsed;
        };

        const dataPayload = {
          name: getVal(3),
          type: getVal(4),
          label: getVal(5),
          brand: getVal(6),
          model: getVal(7),
          serialNo: getVal(8),
          capacityKg: getVal(9),
          capacityPerson: getVal(10),
          stopsCount: getVal(11),
          installationYear: getVal(12),
          maintenanceCompany: getVal(13),
          lastInspectionDate: getDateVal(14),
          nextInspectionDate: getDateVal(15),
          status: 'Aktif'
        };

        const existingElevator = await tx.elevator.findFirst({
          where: {
            facilityId: rowFacilityId,
            elevatorNo: elevatorNo
          }
        });

        if (existingElevator) {
          await tx.elevator.update({
            where: { id: existingElevator.id },
            data: dataPayload
          });
        } else {
          await tx.elevator.create({
            data: {
              facilityId: rowFacilityId,
              elevatorNo: elevatorNo,
              ...dataPayload
            }
          });
        }
        importedCount++;
      }
    });

    return { success: true, importedCount };
  }
};
