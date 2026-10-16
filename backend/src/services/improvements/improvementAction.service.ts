import { PrismaClient, Prisma } from '@prisma/client';

const prisma = new PrismaClient();

export class ImprovementActionService {
  /**
   * Bulguya Ait Aksiyonları Listeleme
   */
  async getRecordActions(recordId: string) {
    const actions = await prisma.improvementAction.findMany({
      where: {
        recordId,
        isDeleted: false,
      },
      orderBy: { actionDate: 'desc' },
    });

    return actions;
  }

  /**
   * Yeni Aksiyon Kartı Ekleme
   * Aksiyon eklendiğinde bulgunun durumu ve son notu güncellenir.
   */
  async createAction(
    recordId: string,
    data: {
      actionDescription: string;
      statusAfterAction?: string;
      responsiblePerson?: string;
      actionDate?: string;
      dueDate?: string;
      costAmount?: number;
      currency?: string;
      extraDetails?: any;
    },
    userId: string
  ) {
    const {
      actionDescription,
      statusAfterAction,
      responsiblePerson,
      actionDate,
      dueDate,
      costAmount,
      currency = 'TRY',
      extraDetails,
    } = data;

    if (!actionDescription || !actionDescription.trim()) {
      throw new Error('Aksiyon açıklaması zorunludur.');
    }

    const record = await prisma.improvementRecord.findUnique({
      where: { id: recordId },
    });

    if (!record) {
      throw new Error('Bulgu kaydı bulunamadı.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Aksiyon kartını oluştur
      const action = await tx.improvementAction.create({
        data: {
          recordId,
          actionDescription,
          statusAfterAction: statusAfterAction || record.status,
          responsiblePerson: responsiblePerson || record.assignedTo,
          actionDate: actionDate ? new Date(actionDate) : new Date(),
          dueDate: dueDate ? new Date(dueDate) : record.dueDate,
          costAmount: costAmount ? new Prisma.Decimal(costAmount) : null,
          currency,
          extraDetails: extraDetails || undefined,
          createdById: userId,
        },
      });

      // 2. Bulgu kaydını son aksiyona göre güncelle
      const newStatus = statusAfterAction || record.status;
      const updateData: Prisma.ImprovementRecordUpdateInput = {
        currentNote: actionDescription,
        status: newStatus,
        updatedBy: userId,
      };

      if (responsiblePerson) {
        updateData.assignedTo = responsiblePerson;
      }
      if (dueDate) {
        updateData.dueDate = new Date(dueDate);
      }

      await tx.improvementRecord.update({
        where: { id: recordId },
        data: updateData,
      });

      // 3. Tarihçe kaydı oluştur
      await tx.improvementRecordHistory.create({
        data: {
          recordId,
          previousNote: record.currentNote,
          newNote: actionDescription,
          previousStatus: record.status,
          newStatus,
          changedBy: userId,
        },
      });

      return action;
    });
  }

  /**
   * Aksiyon Kartını Silme (Soft-delete)
   */
  async deleteAction(actionId: string, userId: string) {
    const action = await prisma.improvementAction.findUnique({
      where: { id: actionId },
    });

    if (!action) {
      throw new Error('Aksiyon bulunamadı.');
    }

    const deleted = await prisma.improvementAction.update({
      where: { id: actionId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
        deletedById: userId,
      },
    });

    // Bulgunun son güncel notunu bir önceki aktif aksiyondan yenile
    const latestAction = await prisma.improvementAction.findFirst({
      where: {
        recordId: action.recordId,
        isDeleted: false,
      },
      orderBy: { actionDate: 'desc' },
    });

    if (latestAction) {
      await prisma.improvementRecord.update({
        where: { id: action.recordId },
        data: {
          currentNote: latestAction.actionDescription,
          status: latestAction.statusAfterAction || undefined,
          updatedBy: userId,
        },
      });
    }

    return deleted;
  }
}

export const improvementActionService = new ImprovementActionService();
