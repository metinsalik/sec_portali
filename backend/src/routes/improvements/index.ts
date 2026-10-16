import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';
import { analyticsRouter } from './analytics.routes';
import { recordsRouter } from './records.routes';
import { reportsRouter } from './reports.routes';
import { actionsRouter } from './actions.routes';
import { trashRouter } from './trash.routes';

const router = Router();
const prisma = new PrismaClient();

// Tüm rotalar oturum açmış kullanıcı gerektirir
router.use(authMiddleware);

// 1. SADECE HASTANE OLAN TESİSLERİ GETİR
router.get('/facilities', async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const isAdmin = user.roles?.includes('admin') || user.roles?.includes('management') || user.isAdmin || user.isManagement;

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
              where: { isArchived: false },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    res.json({
      success: true,
      data: facilities.map((f) => ({
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

// 2. KATEGORİLER
export const DEFAULT_CATEGORIES = [
  'Yangın Güvenliği',
  'Elektrik Güvenliği',
  'Mekanik / Tesisat',
  'Kimyasal Güvenlik',
  'İş Güvenliği / Fiziksel Riskler',
  'Acil Durum & Tahliye',
  'Diğer',
];

router.get('/categories', async (_req: AuthRequest, res: Response) => {
  try {
    const setting = await prisma.improvementSetting.findUnique({
      where: { key: 'categories' },
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
      create: { key: 'categories', value: categories },
    });
    res.json({ success: true, data: setting.value });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. ALT ROTALARI BAĞLA
router.use('/', analyticsRouter);
router.use('/', recordsRouter);
router.use('/reports', reportsRouter);
router.use('/', actionsRouter);
router.use('/', trashRouter);

export default router;
