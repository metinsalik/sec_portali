import { PrismaClient, Prisma } from '@prisma/client';
import {
  ImprovementSheetType,
  MAX_PHOTOS_PER_RECORD,
  ImprovementPhoto,
  isCriticalItem,
} from '@sec-portali/shared';
import { storageService } from '../storageService';

const prisma = new PrismaClient();

export class ImprovementRecordService {
  /**
   * Bulguları filtreleme, arama ve sayfalama ile listeleme
   */
  async getRecords(params: {
    facilityId?: string;
    moduleGroup?: string;
    sheetType?: string;
    riskScore?: string;
    status?: string;
    category?: string;
    reportId?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      facilityId,
      moduleGroup,
      sheetType,
      riskScore,
      status,
      category,
      reportId,
      search,
      page = 1,
      limit = 500,
    } = params;

    const where: Prisma.ImprovementRecordWhereInput = {
      isArchived: false,
    };

    if (facilityId && facilityId !== 'ALL') {
      where.facilityId = facilityId;
    }
    if (moduleGroup && moduleGroup !== 'ALL') {
      where.moduleGroup = moduleGroup;
    }
    if (sheetType && sheetType !== 'ALL') {
      where.sheetType = sheetType as ImprovementSheetType;
    }
    if (riskScore && riskScore !== 'ALL') {
      where.riskScore = riskScore;
    }
    if (status && status !== 'ALL') {
      where.status = status;
    }
    if (category && category !== 'ALL') {
      where.category = category;
    }
    if (reportId && reportId !== 'ALL') {
      where.reportId = reportId;
    }

    if (search) {
      const q = search.trim();
      where.OR = [
        { finding: { contains: q, mode: 'insensitive' } },
        { location: { contains: q, mode: 'insensitive' } },
        { equipment: { contains: q, mode: 'insensitive' } },
        { assignedTo: { contains: q, mode: 'insensitive' } },
        { actionPlan: { contains: q, mode: 'insensitive' } },
        { currentNote: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { auditName: { contains: q, mode: 'insensitive' } },
      ];
    }

    const p = Math.max(page, 1);
    const l = Math.min(Math.max(limit, 1), 3000);
    const skip = (p - 1) * l;

    const [total, records] = await Promise.all([
      prisma.improvementRecord.count({ where }),
      prisma.improvementRecord.findMany({
        where,
        include: {
          facility: { select: { id: true, name: true, shortName: true } },
          report: {
            select: {
              id: true,
              reportDate: true,
              operationType: true,
              resultStatus: true,
              companyName: true,
              reportNo: true,
            },
          },
          actions: {
            where: { isDeleted: false },
            orderBy: { actionDate: 'desc' },
          },
          histories: {
            orderBy: { createdAt: 'desc' },
            take: 3,
          },
        },
        orderBy: [
          { rowNo: 'asc' },
          { createdAt: 'desc' },
        ],
        skip,
        take: l,
      }),
    ]);

    return {
      records,
      pagination: {
        page: p,
        limit: l,
        total,
        totalPages: Math.ceil(total / l),
      },
    };
  }

  /**
   * Kritik Kalemler Listesi
   */
  async getCriticalRecords(params: {
    facilityId?: string;
    sheetType?: string;
    category?: string;
    status?: string;
  }) {
    const { facilityId, sheetType, category, status } = params;

    const where: Prisma.ImprovementRecordWhereInput = {
      isArchived: false,
      riskScore: { in: ['Kritik', 'Yüksek', 'Çok Yüksek'] },
      status: { notIn: ['Tamamlandı', 'İptal Edildi'] },
    };

    if (facilityId && facilityId !== 'ALL') where.facilityId = facilityId;
    if (sheetType && sheetType !== 'ALL') where.sheetType = sheetType as ImprovementSheetType;
    if (category && category !== 'ALL') where.category = category;
    if (status && status !== 'ALL') where.status = status;

    const records = await prisma.improvementRecord.findMany({
      where,
      include: {
        facility: { select: { id: true, name: true, shortName: true } },
        actions: { where: { isDeleted: false }, orderBy: { actionDate: 'desc' } },
      },
      orderBy: [
        { facility: { name: 'asc' } },
        { sheetType: 'asc' },
        { rowNo: 'asc' },
      ],
    });

    return records;
  }

  /**
   * Tekil Kayıt Detayı
   */
  async getRecordById(id: string) {
    const record = await prisma.improvementRecord.findUnique({
      where: { id },
      include: {
        facility: { select: { id: true, name: true, shortName: true } },
        report: true,
        actions: {
          where: { isDeleted: false },
          orderBy: { actionDate: 'desc' },
        },
        histories: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!record) {
      throw new Error('Kayıt bulunamadı.');
    }

    return record;
  }

  /**
   * Yeni Bulgu / Tespit Ekleme
   */
  async createRecord(data: any, userId: string) {
    const {
      facilityId,
      moduleGroup,
      sheetType,
      reportId,
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
      legacyBudget,
      currency,
      extraFields,
    } = data;

    if (!facilityId || !finding) {
      throw new Error('Hastane ve Tespit alanları zorunludur.');
    }

    // Sıradaki rowNo değerini bul
    const lastRecord = await prisma.improvementRecord.findFirst({
      where: { facilityId, sheetType },
      orderBy: { rowNo: 'desc' },
      select: { rowNo: true },
    });
    const nextRowNo = (lastRecord?.rowNo || 0) + 1;

    const record = await prisma.improvementRecord.create({
      data: {
        facilityId,
        moduleGroup: moduleGroup || (sheetType === 'DENETIMLER' ? 'DENETIM' : 'ELEKTRIK_BAKIM_KONTROL'),
        sheetType,
        reportId: reportId || null,
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
        legacyBudget: legacyBudget ? new Prisma.Decimal(legacyBudget) : null,
        currency: currency || 'TRY',
        extraFields: extraFields || undefined,
        createdBy: userId,
      },
      include: {
        facility: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (currentNote) {
      await prisma.improvementRecordHistory.create({
        data: {
          recordId: record.id,
          newNote: currentNote,
          newStatus: record.status,
          changedBy: userId,
        },
      });
    }

    return record;
  }

  /**
   * Bulgu Güncelleme
   */
  async updateRecord(id: string, data: any, userId: string) {
    const existing = await prisma.improvementRecord.findUnique({
      where: { id },
    });
    if (!existing) {
      throw new Error('Kayıt bulunamadı.');
    }

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
      legacyBudget,
      currency,
      extraFields,
      reportId,
    } = data;

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
        recordDate: recordDate !== undefined ? (recordDate ? new Date(recordDate) : null) : undefined,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : undefined,
        applicationType,
        legacyBudget: legacyBudget !== undefined ? (legacyBudget ? new Prisma.Decimal(legacyBudget) : null) : undefined,
        currency: currency || undefined,
        extraFields: extraFields !== undefined ? extraFields : undefined,
        reportId: reportId !== undefined ? reportId : undefined,
        updatedBy: userId,
      },
      include: {
        facility: { select: { id: true, name: true, shortName: true } },
      },
    });

    if (currentNote !== existing.currentNote || status !== existing.status) {
      await prisma.improvementRecordHistory.create({
        data: {
          recordId: id,
          previousNote: existing.currentNote,
          newNote: currentNote || '',
          previousStatus: existing.status,
          newStatus: status || existing.status,
          changedBy: userId,
        },
      });
    }

    return updated;
  }

  /**
   * Yumuşak Silme (Soft Delete)
   */
  async deleteRecord(id: string, userId: string, deleteReason?: string) {
    const record = await prisma.improvementRecord.findUnique({
      where: { id },
    });
    if (!record) {
      throw new Error('Kayıt bulunamadı.');
    }

    const deleted = await prisma.improvementRecord.update({
      where: { id },
      data: {
        isArchived: true,
        deletedAt: new Date(),
        deletedById: userId,
        deleteReason: deleteReason || null,
      },
    });

    return deleted;
  }

  /**
   * ============================================================================
   * FOTOĞRAF YÖNETİMİ (MAKS. 5 FOTOĞRAF, SÜRÜKLE-BIRAK, MOBİL DESTEK)
   * ============================================================================
   */
  async addPhotos(recordId: string, files: Express.Multer.File[], userId: string) {
    const record = await prisma.improvementRecord.findUnique({
      where: { id: recordId },
      select: { id: true, photos: true },
    });

    if (!record) {
      throw new Error('Kayıt bulunamadı.');
    }

    const currentPhotos = (record.photos as unknown as ImprovementPhoto[]) || [];
    const incomingCount = files.length;

    // Maksimum 5 fotoğraf kontrolü
    if (currentPhotos.length + incomingCount > MAX_PHOTOS_PER_RECORD) {
      throw new Error(
        `Bir bulgu maddesine en fazla ${MAX_PHOTOS_PER_RECORD} fotoğraf eklenebilir. Şu anda ${currentPhotos.length} fotoğraf var, ${incomingCount} adet daha eklenemez.`
      );
    }

    const newPhotos: ImprovementPhoto[] = [];

    for (const file of files) {
      // storageService ile diskte güvenli klasöre yaz
      const fileUrl = await storageService.saveFile(file, 'improvements/photos');
      const photoItem: ImprovementPhoto = {
        id: 'photo-' + Date.now() + '-' + Math.round(Math.random() * 1e6),
        url: fileUrl,
        name: file.originalname,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        uploadedBy: userId,
      };
      newPhotos.push(photoItem);
    }

    const updatedPhotos = [...currentPhotos, ...newPhotos];

    await prisma.improvementRecord.update({
      where: { id: recordId },
      data: {
        photos: updatedPhotos as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedPhotos;
  }

  /**
   * Fotoğraf Silme
   */
  async deletePhoto(recordId: string, photoId: string, userId: string) {
    const record = await prisma.improvementRecord.findUnique({
      where: { id: recordId },
      select: { id: true, photos: true },
    });

    if (!record) {
      throw new Error('Kayıt bulunamadı.');
    }

    const currentPhotos = (record.photos as unknown as ImprovementPhoto[]) || [];
    const targetPhoto = currentPhotos.find((p) => p.id === photoId);

    if (!targetPhoto) {
      throw new Error('Fotoğraf bulunamadı.');
    }

    // Diskten sil
    await storageService.deleteFile(targetPhoto.url);

    // Diziden çıkar
    const updatedPhotos = currentPhotos.filter((p) => p.id !== photoId);

    await prisma.improvementRecord.update({
      where: { id: recordId },
      data: {
        photos: updatedPhotos as unknown as Prisma.InputJsonValue,
      },
    });

    return updatedPhotos;
  }
}

export const improvementRecordService = new ImprovementRecordService();
