import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  authMiddleware,
  adminMiddleware,
  managementMiddleware,
  AuthRequest,
} from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Tüm settings rotaları kimlik doğrulama gerektirir
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────
// TESİS YÖNETİMİ — Admin + Management
// ─────────────────────────────────────────────────────────────
router.get('/facilities', async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: { buildings: true },
      orderBy: { id: 'asc' },
    });
    res.json(facilities);
  } catch {
    res.status(500).json({ error: 'Tesisler getirilemedi.' });
  }
});

router.post('/facilities', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { id, name, buildings } = req.body;
  if (!id || !name) {
    return res.status(400).json({ error: 'Tesis kodu ve adı zorunludur.' });
  }
  try {
    const facility = await prisma.facility.create({
      data: {
        id,
        name,
        buildings: {
          create: (buildings as string[] | undefined)?.map((b) => ({ name: b })) ?? [],
        },
      },
      include: { buildings: true },
    });
    res.status(201).json(facility);
  } catch {
    res.status(500).json({ error: 'Tesis oluşturulamadı.' });
  }
});

router.put('/facilities/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { name, isActive } = req.body;
  try {
    const facility = await prisma.facility.update({
      where: { id },
      data: { name, isActive },
      include: { buildings: true },
    });
    res.json(facility);
  } catch {
    res.status(500).json({ error: 'Tesis güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────
// KULLANICI YÖNETİMİ — Sadece Admin
// ─────────────────────────────────────────────────────────────
router.get('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: { include: { role: true } },
        facilities: { include: { facility: true } },
      },
      orderBy: { fullName: 'asc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Kullanıcılar getirilemedi.' });
  }
});

router.post('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { username, fullName, employmentType, osgbName, roles, facilities } = req.body;
  if (!username || !fullName || !roles?.length) {
    return res.status(400).json({ error: 'Kullanıcı adı, ad soyad ve en az bir rol zorunludur.' });
  }
  try {
    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        fullName,
        employmentType,
        osgbName,
        roles: {
          create: (roles as number[]).map((roleId) => ({ roleId })),
        },
        facilities: {
          create: (facilities as string[] | undefined)?.map((facilityId) => ({ facilityId })) ?? [],
        },
      },
    });
    res.status(201).json(user);
  } catch {
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı.' });
  }
});

router.put('/users/:username', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const username = String(req.params.username);
  const { fullName, employmentType, osgbName, isActive, roles, facilities } = req.body;
  try {
    // Mevcut rolleri ve tesisleri temizle, yeniden yaz
    await prisma.userRole.deleteMany({ where: { username } });
    await prisma.userFacility.deleteMany({ where: { username } });

    const user = await prisma.user.update({
      where: { username },
      data: {
        fullName,
        employmentType,
        osgbName,
        isActive,
        roles: {
          create: (roles as number[] | undefined)?.map((roleId) => ({ roleId })) ?? [],
        },
        facilities: {
          create: (facilities as string[] | undefined)?.map((facilityId) => ({ facilityId })) ?? [],
        },
      },
    });
    res.json(user);
  } catch {
    res.status(500).json({ error: 'Kullanıcı güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────
// SİSTEM PARAMETRELERİ — Admin + Management
// ─────────────────────────────────────────────────────────────
router.get('/parameters', async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const settings = await prisma.systemSettings.findFirst({
      where: { year },
      orderBy: { year: 'desc' },
    });
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Parametreler getirilemedi.' });
  }
});

router.post('/parameters', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { seriousAccidentDays, includeSaturday, dailyWorkHours, monthlyWorkDays, year } = req.body;
  const targetYear = year || new Date().getFullYear();
  try {
    const settings = await prisma.systemSettings.upsert({
      where: { year: targetYear },
      update: { seriousAccidentDays, includeSaturday, dailyWorkHours, monthlyWorkDays },
      create: {
        year: targetYear,
        seriousAccidentDays: seriousAccidentDays ?? 4,
        includeSaturday: includeSaturday ?? true,
        dailyWorkHours: dailyWorkHours ?? 7.5,
        monthlyWorkDays: monthlyWorkDays ?? {},
      },
    });
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'Parametreler güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────
// KATEGORİLER & ALT KATEGORİLER & DEPARTMANLAR — Admin + Management
// ─────────────────────────────────────────────────────────────
router.get('/definitions/categories', async (req: AuthRequest, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      include: { subCategories: true },
      orderBy: { name: 'asc' },
    });
    res.json(categories);
  } catch {
    res.status(500).json({ error: 'Kategoriler getirilemedi.' });
  }
});

router.post('/definitions/categories', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Kategori adı zorunludur.' });
  try {
    const category = await prisma.category.create({ data: { name } });
    res.status(201).json(category);
  } catch {
    res.status(500).json({ error: 'Kategori oluşturulamadı.' });
  }
});

router.patch('/definitions/categories/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name } = req.body;
  try {
    const category = await prisma.category.update({ where: { id }, data: { name } });
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Kategori güncellenemedi.' });
  }
});

router.post('/definitions/subcategories', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, categoryId } = req.body;
  if (!name || !categoryId) return res.status(400).json({ error: 'Alt kategori adı ve kategori ID zorunludur.' });
  try {
    const sub = await prisma.subCategory.create({ data: { name, categoryId } });
    res.status(201).json(sub);
  } catch {
    res.status(500).json({ error: 'Alt kategori oluşturulamadı.' });
  }
});

router.patch('/definitions/subcategories/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name } = req.body;
  try {
    const sub = await prisma.subCategory.update({ where: { id }, data: { name } });
    res.json(sub);
  } catch {
    res.status(500).json({ error: 'Alt kategori güncellenemedi.' });
  }
});

router.get('/definitions/departments', async (req: AuthRequest, res: Response) => {
  try {
    const departments = await prisma.department.findMany({ orderBy: { name: 'asc' } });
    res.json(departments);
  } catch {
    res.status(500).json({ error: 'Departmanlar getirilemedi.' });
  }
});

router.post('/definitions/departments', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: 'Departman adı zorunludur.' });
  try {
    const dept = await prisma.department.create({ data: { name } });
    res.status(201).json(dept);
  } catch {
    res.status(500).json({ error: 'Departman oluşturulamadı.' });
  }
});

router.patch('/definitions/departments/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name } = req.body;
  try {
    const dept = await prisma.department.update({ where: { id }, data: { name } });
    res.json(dept);
  } catch {
    res.status(500).json({ error: 'Departman güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────
// ROL LİSTESİ — Kullanıcı yönetimi formu için
// ─────────────────────────────────────────────────────────────
router.get('/roles', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
    res.json(roles);
  } catch {
    res.status(500).json({ error: 'Roller getirilemedi.' });
  }
});

export default router;
