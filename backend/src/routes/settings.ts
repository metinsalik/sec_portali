import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, adminMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Use broad auth for all settings, specific admin check where needed
router.use(authMiddleware);

// --- Tesis Yönetimi ---
router.get('/facilities', async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: { buildings: true },
      orderBy: { id: 'asc' }
    });
    res.json(facilities);
  } catch (error) {
    res.status(500).json({ error: 'Tesisler getirilemedi.' });
  }
});

router.post('/facilities', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { id, name, buildings } = req.body;
  try {
    const facility = await prisma.facility.create({
      data: {
        id,
        name,
        buildings: {
          create: buildings?.map((b: string) => ({ name: b })) || []
        }
      },
      include: { buildings: true }
    });
    res.json(facility);
  } catch (error) {
    res.status(500).json({ error: 'Tesis oluşturulamadı.' });
  }
});

// --- Kullanıcı Yönetimi (Admin Only) ---
router.get('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: { include: { role: true } },
        facilities: { include: { facility: true } }
      }
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcılar getirilemedi.' });
  }
});

router.post('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { username, fullName, roles, facilities } = req.body;
  try {
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        fullName,
        roles: {
          create: roles.map((roleId: number) => ({ roleId }))
        },
        facilities: {
          create: facilities.map((facilityId: string) => ({ facilityId }))
        }
      }
    });
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı.' });
  }
});

// --- Parametreler ---
router.get('/parameters', async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.systemSettings.findFirst({
      orderBy: { year: 'desc' }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Parametreler getirilemedi.' });
  }
});

router.post('/parameters', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { seriousAccidentDays, includeSaturday, dailyWorkHours } = req.body;
  const year = new Date().getFullYear();
  try {
    const settings = await prisma.systemSettings.upsert({
      where: { year },
      update: { seriousAccidentDays, includeSaturday, dailyWorkHours },
      create: { 
        year, 
        seriousAccidentDays, 
        includeSaturday, 
        dailyWorkHours,
        monthlyWorkDays: {} // Placeholder
      }
    });
    res.json(settings);
  } catch (error) {
    res.status(500).json({ error: 'Parametreler güncellenemedi.' });
  }
});

export default router;
