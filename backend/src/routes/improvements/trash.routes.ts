import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const prisma = new PrismaClient();
export const trashRouter = Router();

// 1. SİLİNEN KAYITLARI LİSTELE
trashRouter.get('/trash', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;

    const whereFacility: any = {};
    if (facilityId && facilityId !== 'ALL') {
      whereFacility.facilityId = facilityId;
    }

    const [deletedRecords, deletedReports, deletedActions] = await Promise.all([
      prisma.improvementRecord.findMany({
        where: {
          isArchived: true,
          ...whereFacility,
        },
        include: {
          facility: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.improvementOperationReport.findMany({
        where: {
          isDeleted: true,
          ...whereFacility,
        },
        include: {
          facility: { select: { id: true, name: true, shortName: true } },
        },
        orderBy: { deletedAt: 'desc' },
      }),
      prisma.improvementAction.findMany({
        where: {
          isDeleted: true,
          record: whereFacility,
        },
        include: {
          record: {
            select: {
              id: true,
              finding: true,
              facility: { select: { id: true, name: true, shortName: true } },
            },
          },
        },
        orderBy: { deletedAt: 'desc' },
      }),
    ]);

    const items = [
      ...deletedRecords.map((r) => ({
        id: r.id,
        type: 'RECORD' as const,
        title: `${r.sheetType} #${r.rowNo || '-'} · ${r.facility?.shortName || r.facility?.name}`,
        detail: r.finding,
        deletedAt: r.deletedAt,
        deletedBy: r.deletedById,
      })),
      ...deletedReports.map((rep) => ({
        id: rep.id,
        type: 'REPORT' as const,
        title: `Rapor: ${rep.sheetType} · ${rep.facility?.shortName || rep.facility?.name}`,
        detail: `${rep.reportDate ? new Date(rep.reportDate).toLocaleDateString('tr-TR') : ''} ${rep.companyName || ''}`,
        deletedAt: rep.deletedAt,
        deletedBy: rep.deletedById,
      })),
      ...deletedActions.map((a) => ({
        id: a.id,
        type: 'ACTION' as const,
        title: `Aksiyon: ${a.record?.facility?.shortName || ''} · ${a.record?.finding?.substring(0, 40) || ''}`,
        detail: a.actionDescription,
        deletedAt: a.deletedAt,
        deletedBy: a.deletedById,
      })),
    ].sort((a, b) => new Date(b.deletedAt || 0).getTime() - new Date(a.deletedAt || 0).getTime());

    res.json({ success: true, data: items, count: items.length });
  } catch (error: any) {
    console.error('Error fetching trash items:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. SİLİNENİ GERİ YÜKLE (RESTORE)
trashRouter.post('/restore', async (req: AuthRequest, res: Response) => {
  try {
    const { id, type } = req.body;

    if (!id || !type) {
      return res.status(400).json({ success: false, message: 'id ve type zorunludur.' });
    }

    if (type === 'RECORD') {
      await prisma.improvementRecord.update({
        where: { id },
        data: {
          isArchived: false,
          deletedAt: null,
          deletedById: null,
          deleteReason: null,
        },
      });
    } else if (type === 'REPORT') {
      await prisma.improvementOperationReport.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
        },
      });
    } else if (type === 'ACTION') {
      await prisma.improvementAction.update({
        where: { id },
        data: {
          isDeleted: false,
          deletedAt: null,
          deletedById: null,
        },
      });
    } else {
      return res.status(400).json({ success: false, message: 'Geçersiz type parametresi.' });
    }

    res.json({ success: true, message: 'Kayıt başarıyla geri yüklendi.' });
  } catch (error: any) {
    console.error('Error restoring trash item:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});
