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
// YARDIMCI FONKSİYONLAR
// ─────────────────────────────────────────────────────────────
async function ensureRolesExist() {
  const roleNames = ['admin', 'management', 'user', 'safety', 'doctor', 'dsp'];
  for (const name of roleNames) {
    await prisma.role.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }
}

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
  const { 
    id, name, shortName, type, city, district, fullAddress, 
    phone, email, website, commercialTitle, taxOffice, 
    taxNumber, sgkNumber, naceCode, dangerClass, employeeCount, buildings 
  } = req.body;

  if (!id || !name) {
    return res.status(400).json({ error: 'Tesis kodu ve adı zorunludur.' });
  }
  try {
    const facility = await prisma.facility.create({
      data: {
        id,
        name,
        shortName,
        type,
        city,
        district,
        fullAddress,
        phone,
        email,
        website,
        commercialTitle,
        taxOffice,
        taxNumber,
        sgkNumber,
        naceCode,
        dangerClass: dangerClass || 'Az Tehlikeli',
        employeeCount: employeeCount ? parseInt(String(employeeCount)) : 0,
        buildings: {
          create: (buildings as any[] | undefined)?.map((b) => ({
            name: b.name,
            constructionYear: b.constructionYear ? parseInt(String(b.constructionYear)) : null,
            buildingHeight: b.buildingHeight ? parseFloat(String(b.buildingHeight)) : null,
            structureHeight: b.structureHeight ? parseFloat(String(b.structureHeight)) : null,
            buildingFloors: b.buildingFloors ? parseInt(String(b.buildingFloors)) : null,
            structureFloors: b.structureFloors ? parseInt(String(b.structureFloors)) : null,
            closedArea: b.closedArea ? parseFloat(String(b.closedArea)) : null,
            parkingArea: b.parkingArea ? parseFloat(String(b.parkingArea)) : null,
            gardenArea: b.gardenArea ? parseFloat(String(b.gardenArea)) : null,
            bedCapacity: b.bedCapacity ? parseInt(String(b.bedCapacity)) : null,
          })) ?? [],
        },
      },
      include: { buildings: true },
    });
    res.status(201).json(facility);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tesis oluşturulamadı.' });
  }
});

router.put('/facilities/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = String(req.params.id);
  const { 
    name, shortName, type, city, district, fullAddress, 
    phone, email, website, commercialTitle, taxOffice, 
    taxNumber, sgkNumber, naceCode, dangerClass, employeeCount, isActive, buildings 
  } = req.body;
  try {
    // Önce mevcut binaları silelim (veya güncelleyelim, ama silip yeniden oluşturmak daha basit şimdilik)
    if (buildings !== undefined) {
      await prisma.facilityBuilding.deleteMany({ where: { facilityId: id } });
    }

    const facility = await prisma.facility.update({
      where: { id },
      data: { 
        name, shortName, type, city, district, fullAddress, 
        phone, email, website, commercialTitle, taxOffice, 
        taxNumber, sgkNumber, naceCode, dangerClass,
        employeeCount: employeeCount ? parseInt(String(employeeCount)) : 0,
        isActive,
        buildings: buildings !== undefined ? {
          create: (buildings as any[] | undefined)?.map((b) => ({
            name: b.name,
            constructionYear: b.constructionYear ? parseInt(String(b.constructionYear)) : null,
            buildingHeight: b.buildingHeight ? parseFloat(String(b.buildingHeight)) : null,
            structureHeight: b.structureHeight ? parseFloat(String(b.structureHeight)) : null,
            buildingFloors: b.buildingFloors ? parseInt(String(b.buildingFloors)) : null,
            structureFloors: b.structureFloors ? parseInt(String(b.structureFloors)) : null,
            closedArea: b.closedArea ? parseFloat(String(b.closedArea)) : null,
            parkingArea: b.parkingArea ? parseFloat(String(b.parkingArea)) : null,
            gardenArea: b.gardenArea ? parseFloat(String(b.gardenArea)) : null,
            bedCapacity: b.bedCapacity ? parseInt(String(b.bedCapacity)) : null,
          })) ?? [],
        } : undefined,
      },
      include: { buildings: true },
    });
    res.json(facility);
  } catch (error) {
    console.error(error);
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
  const { username, fullName, email, phone, department, title, roles, facilities } = req.body;

  // Zorunlu alan kontrolü
  if (!username || !fullName || !email || !phone || !department || !title || !roles?.length) {
    return res.status(400).json({
      error: 'Kullanıcı adı, ad soyad, e-posta, telefon, departman, ünvan ve en az bir rol zorunludur.'
    });
  }

  try {
    // Rollerin var olduğundan emin ol
    await ensureRolesExist();

    // Rol isimlerini ID'lere çevir
    const roleRecords = await prisma.role.findMany({
      where: { name: { in: roles as string[] } },
    });

    if (roleRecords.length !== (roles as string[]).length) {
      return res.status(400).json({ error: 'Geçersiz rol adı.' });
    }

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        fullName: fullName.trim(),
        email: email.toLowerCase().trim(),
        phone: phone.trim(),
        department: department.trim(),
        title: title.trim(),
        roles: {
          create: roleRecords.map((r) => ({ roleId: r.id })),
        },
        facilities: {
          create: (facilities as string[] | undefined)?.map((facilityId) => ({ facilityId })) ?? [],
        },
      },
      include: {
        roles: { include: { role: true } },
        facilities: { include: { facility: true } },
      },
    });
    res.status(201).json(user);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'Bu kullanıcı adı zaten kullanılıyor.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Kullanıcı oluşturulamadı.' });
  }
});

router.put('/users/:username', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const usernameParam = String(req.params.username);
  const { fullName, email, phone, department, title, isActive, roles, facilities } = req.body;

  try {
    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = fullName.trim();
    if (email !== undefined) updateData.email = email.toLowerCase().trim();
    if (phone !== undefined) updateData.phone = phone.trim();
    if (department !== undefined) updateData.department = department.trim();
    if (title !== undefined) updateData.title = title.trim();
    if (isActive !== undefined) updateData.isActive = isActive;

    // Rolleri sadece gelirse güncelle
    if (roles !== undefined) {
      await prisma.userRole.deleteMany({ where: { username: usernameParam } });
      await ensureRolesExist();
      const roleRecords = await prisma.role.findMany({
        where: { name: { in: roles as string[] } },
      });
      updateData.roles = {
        create: roleRecords.map((r) => ({ roleId: r.id })),
      };
    }

    // Tesisleri sadece gelirse güncelle
    if (facilities !== undefined) {
      await prisma.userFacility.deleteMany({ where: { username: usernameParam } });
      updateData.facilities = {
        create: (facilities as string[] | undefined)?.map((facilityId) => ({ facilityId })) ?? [],
      };
    }

    const user = await prisma.user.update({
      where: { username: usernameParam },
      data: updateData,
      include: {
        roles: { include: { role: true } },
        facilities: { include: { facility: true } },
      },
    });
    res.json(user);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Kullanıcı güncellenemedi.' });
  }
});

// Kullanıcı tesis erişimi ekle/kaldır (mevcut kullanıcıya tesis ekleme)
router.post('/users/:username/facilities', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const username = String(req.params.username);
  const { facilityId, action } = req.body; // action: 'add' | 'remove'

  if (!facilityId) {
    return res.status(400).json({ error: 'Tesis ID zorunludur.' });
  }

  try {
    if (action === 'add') {
      await prisma.userFacility.upsert({
        where: {
          username_facilityId: { username, facilityId },
        },
        update: {},
        create: { username, facilityId },
      });
    } else if (action === 'remove') {
      await prisma.userFacility.delete({
        where: { username_facilityId: { username, facilityId } },
      });
    }

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: { include: { role: true } },
        facilities: { include: { facility: true } },
      },
    });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tesis erişimi güncellenemedi.' });
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
    // İlk istekte roller yoksa oluştur
    await ensureRolesExist();
    const roles = await prisma.role.findMany({ orderBy: { name: 'asc' } });
    res.json(roles);
  } catch {
    res.status(500).json({ error: 'Roller getirilemedi.' });
  }
});

export default router;