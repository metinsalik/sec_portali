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

// ──────────────────────────────────────────────────────────────────────────────
// YARDIMCI FONKSİYONLAR
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
// TESİS YÖNETİMİ - Admin + Management
// ──────────────────────────────────────────────────────────────────────────────
router.get('/facilities', async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      include: { buildings: true, assignments: true },
      orderBy: { id: 'asc' },
    });
    res.json(facilities);
  } catch {
    res.status(500).json({ error: 'Tesisler getirilemedi.' });
  }
});

router.get('/facilities/:id', async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const facility = await prisma.facility.findUnique({
      where: { id },
      include: { 
        buildings: true, 
        assignments: {
          include: {
            professional: true,
            employerRep: true
          }
        },
        employeeCountHistory: {
          orderBy: { effectiveDate: 'desc' },
          take: 12
        },
        activityLogs: {
          orderBy: { createdAt: 'desc' },
          take: 50
        }
      },
    });
    if (!facility) return res.status(404).json({ error: 'Tesis bulunamadı.' });
    res.json(facility);
  } catch (error) {
    res.status(500).json({ error: 'Tesis detayları getirilemedi.' });
  }
});

router.post('/facilities', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { 
    id, name, shortName, type, city, district, fullAddress, 
    phone, email, website, commercialTitle, taxOffice, 
    taxNumber, sgkNumber, naceCode, dangerClass, employeeCount, buildings 
  } = req.body;

  try {
    const facility = await prisma.facility.create({
      data: {
        id, name, shortName, type, city, district, fullAddress,
        phone, email, website, commercialTitle, taxOffice,
        taxNumber, sgkNumber, naceCode, dangerClass, 
        employeeCount: parseInt(employeeCount) || 0,
        buildings: {
          create: buildings?.map((b: any) => ({
            name: b.name,
            constructionYear: parseInt(b.constructionYear) || null,
            buildingHeight: parseFloat(b.buildingHeight) || null,
            structureHeight: parseFloat(b.structureHeight) || null,
            buildingFloors: parseInt(b.buildingFloors) || null,
            structureFloors: parseInt(b.structureFloors) || null,
            closedArea: parseFloat(b.closedArea) || null,
            parkingArea: parseFloat(b.parkingArea) || null,
            gardenArea: parseFloat(b.gardenArea) || null,
            bedCapacity: parseInt(b.bedCapacity) || null
          })) || []
        }
      },
      include: { buildings: true }
    });
    res.status(201).json(facility);
  } catch (error: any) {
    console.error('Facility creation error:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu tesis kodu zaten kullanımda.' });
    }
    res.status(500).json({ error: 'Tesis oluşturulamadı: ' + error.message });
  }
});

router.put('/facilities/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const oldId = req.params.id as any;
  const { 
    id: newId, name, shortName, type, city, district, fullAddress, 
    phone, email, website, commercialTitle, taxOffice, 
    taxNumber, sgkNumber, naceCode, dangerClass, employeeCount, buildings 
  } = req.body;

  try {
    // Once binalari temizle (basit yaklasim)
    await prisma.facilityBuilding.deleteMany({ where: { facilityId: oldId } as any });

    const facility = await prisma.facility.update({
      where: { id: oldId } as any,
      data: {
        id: (newId as string) || oldId,
        name, shortName, type, city, district, fullAddress,
        phone, email, website, commercialTitle, taxOffice,
        taxNumber, sgkNumber, naceCode, dangerClass,
        employeeCount: parseInt(employeeCount) || 0,
        isActive: req.body.isActive !== undefined ? req.body.isActive : true,
        buildings: {
          create: buildings?.map((b: any) => ({
            name: b.name,
            constructionYear: parseInt(b.constructionYear) || null,
            buildingHeight: parseFloat(b.buildingHeight) || null,
            structureHeight: parseFloat(b.structureHeight) || null,
            buildingFloors: parseInt(b.buildingFloors) || null,
            structureFloors: parseInt(b.structureFloors) || null,
            closedArea: parseFloat(b.closedArea) || null,
            parkingArea: parseFloat(b.parkingArea) || null,
            gardenArea: parseFloat(b.gardenArea) || null,
            bedCapacity: parseInt(b.bedCapacity) || null
          })) || []
        }
      },
      include: { buildings: true }
    });
    res.json(facility);
  } catch (error: any) {
    console.error('Facility update error:', error);
    res.status(500).json({ error: 'Tesis güncellenemedi: ' + error.message });
  }
});

router.delete('/facilities/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = req.params.id as any;
  try {
    await prisma.facilityBuilding.deleteMany({ where: { facilityId: id } as any });
    await prisma.userFacility.deleteMany({ where: { facilityId: id } as any });
    await prisma.employeeCountHistory.deleteMany({ where: { facilityId: id } as any });
    await prisma.facility.delete({ where: { id } as any });
    res.json({ message: 'Tesis başarıyla silindi.' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Tesis silinemedi.' });
  }
});

// Çalışan Sayısı Güncelleme (Tekil)
router.patch('/facilities/:id/employee-count', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { count, effectiveDate } = req.body;

  try {
    const parsedCount = parseInt(count);
    const parsedDate = new Date(effectiveDate);

    if (isNaN(parsedCount)) return res.status(400).json({ error: 'Geçersiz çalışan sayısı.' });

    const result = await prisma.$transaction([
      prisma.facility.update({
        where: { id },
        data: { employeeCount: parsedCount }
      }),
      prisma.employeeCountHistory.create({
        data: {
          facilityId: id,
          count: parsedCount,
          effectiveDate: parsedDate
        }
      }),
      prisma.activityLog.create({
        data: {
          facilityId: id,
          username: req.user!.username,
          action: 'Çalışan Sayısı Güncellendi',
          details: `Çalışan sayısı ${parsedCount} olarak güncellendi. (Yürürlük: ${parsedDate.toLocaleDateString('tr-TR')})`
        }
      })
    ]);

    res.json(result[0]);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Güncelleme başarısız: ' + error.message });
  }
});

// Çalışan Sayısı Güncelleme (Toplu)
router.post('/facilities/bulk-employee-count', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const { updates, effectiveDate } = req.body; // updates: { id: string, count: number }[]

  try {
    const parsedDate = new Date(effectiveDate);

    await prisma.$transaction(
      updates.map((u: any) => [
        prisma.facility.update({
          where: { id: u.id },
          data: { employeeCount: parseInt(u.count) }
        }),
        prisma.employeeCountHistory.create({
          data: {
            facilityId: u.id,
            count: parseInt(u.count),
            effectiveDate: parsedDate
          }
        }),
        prisma.activityLog.create({
          data: {
            facilityId: u.id,
            username: req.user!.username,
            action: 'Toplu Çalışan Sayısı Güncelleme',
            details: `Toplu güncelleme ile çalışan sayısı ${u.count} yapıldı.`
          }
        })
      ]).flat()
    );

    res.json({ message: 'Toplu güncelleme başarılı.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Toplu güncelleme başarısız: ' + error.message });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// KULLANICI YÖNETİMİ - Sadece Admin
// ──────────────────────────────────────────────────────────────────────────────
router.get('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        roles: { include: { role: true } },
        facilities: { include: { facility: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(users);
  } catch {
    res.status(500).json({ error: 'Kullanıcılar getirilemedi.' });
  }
});

router.post('/users', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { username, fullName, email, phone, department, title, roles, facilities } = req.body;

  if (!username || !fullName) {
    return res.status(400).json({ error: 'Kullanıcı adı ve ad soyad zorunludur.' });
  }

  try {
    await ensureRolesExist();
    const roleRecords = await prisma.role.findMany({
      where: { name: { in: roles as string[] } },
    });

    const user = await prisma.user.create({
      data: {
        username: username.toLowerCase().trim(),
        fullName: fullName.trim(),
        email: email?.toLowerCase().trim(),
        phone: phone?.trim(),
        department: department?.trim(),
        title: title?.trim(),
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

router.post('/users/:username/facilities', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const username = String(req.params.username);
  const { facilityId, action } = req.body; 

  if (!facilityId) {
    return res.status(400).json({ error: 'Tesis ID zorunludur.' });
  }

  try {
    if (action === 'add') {
      await prisma.userFacility.upsert({
        where: { username_facilityId: { username, facilityId } },
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

// ──────────────────────────────────────────────────────────────────────────────
// SİSTEM PARAMETRELERİ - Admin + Management
// ──────────────────────────────────────────────────────────────────────────────
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

// ──────────────────────────────────────────────────────────────────────────────
// KATEGORİLER & ALT KATEGORİLER & DEPARTMANLAR - Admin + Management
// ──────────────────────────────────────────────────────────────────────────────
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

router.put('/definitions/categories/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name } = req.body;
  try {
    const category = await prisma.category.update({ where: { id }, data: { name } });
    res.json(category);
  } catch {
    res.status(500).json({ error: 'Kategori güncellenemedi.' });
  }
});

router.delete('/definitions/categories/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  try {
    // Önce alt kategorileri sil (veya kontrol et)
    await prisma.subCategory.deleteMany({ where: { categoryId: id } });
    await prisma.category.delete({ where: { id } });
    res.json({ message: 'Kategori silindi.' });
  } catch (error) {
    res.status(500).json({ error: 'Kategori silinemedi. Başka verilerle ilişkili olabilir.' });
  }
});

router.get('/definitions/subcategories', async (req: AuthRequest, res: Response) => {
  try {
    const subs = await prisma.subCategory.findMany({ include: { category: true }, orderBy: { name: 'asc' } });
    res.json(subs);
  } catch {
    res.status(500).json({ error: 'Alt kategoriler getirilemedi.' });
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

router.put('/definitions/subcategories/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name } = req.body;
  try {
    const sub = await prisma.subCategory.update({ where: { id }, data: { name } });
    res.json(sub);
  } catch {
    res.status(500).json({ error: 'Alt kategori güncellenemedi.' });
  }
});

router.delete('/definitions/subcategories/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  try {
    await prisma.subCategory.delete({ where: { id } });
    res.json({ message: 'Alt kategori silindi.' });
  } catch {
    res.status(500).json({ error: 'Alt kategori silinemedi.' });
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

router.put('/definitions/departments/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name } = req.body;
  try {
    const dept = await prisma.department.update({ where: { id }, data: { name } });
    res.json(dept);
  } catch {
    res.status(500).json({ error: 'Departman güncellenemedi.' });
  }
});

router.delete('/definitions/departments/:id', managementMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  try {
    await prisma.department.delete({ where: { id } });
    res.json({ message: 'Departman silindi.' });
  } catch {
    res.status(500).json({ error: 'Departman silinemedi.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// ROL LİSTESİ - Kullanıcı yönetimi formu için
// ──────────────────────────────────────────────────────────────────────────────
router.get('/roles', async (req: AuthRequest, res: Response) => {
  try {
    const roles = await prisma.role.findMany({
      orderBy: { name: 'asc' }
    });
    res.json(roles);
  } catch {
    res.status(500).json({ error: 'Roller getirilemedi.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// SMTP AYARLARI - Sadece Admin
// ──────────────────────────────────────────────────────────────────────────────
router.get('/smtp', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const settings = await prisma.smtpSettings.findFirst({ where: { id: 1 } });
    res.json(settings);
  } catch {
    res.status(500).json({ error: 'SMTP ayarları getirilemedi.' });
  }
});

router.post('/smtp', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { host, port, user, pass, secure, fromEmail, fromName } = req.body;
  
  if (!host || !port || !user || !pass || !fromEmail) {
    return res.status(400).json({ error: 'Tüm alanlar zorunludur.' });
  }

  try {
    const settings = await prisma.smtpSettings.upsert({
      where: { id: 1 },
      update: { host, port: parseInt(String(port)), user, pass, secure, fromEmail, fromName },
      create: { id: 1, host, port: parseInt(String(port)), user, pass, secure, fromEmail, fromName },
    });
    res.json(settings);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'SMTP ayarları kaydedilemedi.' });
  }
});

router.post('/smtp/test', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { to } = req.body;
  if (!to) return res.status(400).json({ error: 'Alıcı e-posta adresi zorunludur.' });

  try {
    const { sendMail } = require('../services/mail');
    await sendMail(
      to, 
      'SEC Portalı - SMTP Test Mesajı', 
      'SEC Portalı SMTP ayarları başarıyla doğrulandı.'
    );
    res.json({ message: 'Test e-postası başarıyla gönderildi.' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: `Test e-postası gönderilemedi: ${error.message}` });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// BİLDİRİM AYARLARI & ŞABLONLARI - Sadece Admin
// ──────────────────────────────────────────────────────────────────────────────

async function seedNotificationConfigs() {
  const configs = [
    { code: 'NEW_ACCIDENT', module: 'OPERATIONS', name: 'Yeni Kaza Bildirimi', description: 'Yeni bir iş kazası kaydedildiğinde bildirim gider.' },
    { code: 'ASSIGNMENT_REMINDER', module: 'OPERATIONS', name: 'Atama Hatırlatıcı', description: 'Süresi dolmak üzere olan atamalar için bildirim gider.' },
    { code: 'RECONCILIATION_APPROVED', module: 'PANEL', name: 'Mutabakat Onayı', description: 'Bir mutabakat onaylandığında bildirim gider.' },
    { code: 'SYSTEM_ALERT', module: 'SYSTEM', name: 'Sistem Uyarısı', description: 'Kritik sistem olaylarında bildirim gider.' },
  ];

  for (const config of configs) {
    await prisma.notificationConfig.upsert({
      where: { code: config.code },
      update: { module: config.module, description: config.description },
      create: { 
        code: config.code, 
        module: config.module, 
        description: config.description,
        emailEnabled: true,
        appEnabled: true,
        priority: 'normal'
      },
    });

    // Varsayılan şablonları da oluştur (eğer yoksa)
    await prisma.notificationTemplate.upsert({
      where: { code: config.code },
      update: {},
      create: {
        code: config.code,
        name: config.name,
        module: config.module,
        subject: `${config.name} - SEC Portalı`,
        body: `Sayın Yetkili,\n\n${config.description}\n\nDetaylar için lütfen sisteme giriş yapınız.\n\nİyi çalışmalar.`
      }
    });
  }
}

router.get('/notification-configs', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    await seedNotificationConfigs(); // Her ihtimale karşı seedle
    const configs = await prisma.notificationConfig.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }]
    });
    res.json(configs);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Bildirim ayarları getirilemedi.' });
  }
});

router.post('/notification-configs', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { code, name, module, description, priority } = req.body;
  
  if (!code || !name || !module) {
    return res.status(400).json({ error: 'Kod, isim ve modül zorunludur.' });
  }

  try {
    const config = await prisma.notificationConfig.create({
      data: {
        code: code.toUpperCase().replace(/\s+/g, '_'),
        module: module.toUpperCase(),
        description,
        priority: priority || 'normal',
        emailEnabled: true,
        appEnabled: true,
      }
    });

    await prisma.notificationTemplate.create({
      data: {
        code: config.code,
        name: name,
        module: config.module,
        subject: `${name} - SEC Portalı`,
        body: `Sayın Yetkili,\n\n${description || name}\n\nDetaylar için lütfen sisteme giriş yapınız.\n\nİyi çalışmalar.`
      }
    });

    res.status(201).json(config);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu kod ile bir bildirim zaten mevcut.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Bildirim türü oluşturulamadı.' });
  }
});

router.put('/notification-configs/:code', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { code } = req.params;
  const { emailEnabled, appEnabled, priority } = req.body;
  try {
    const config = await prisma.notificationConfig.update({
      where: { code },
      data: { emailEnabled, appEnabled, priority }
    });
    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Bildirim ayarı güncellenemedi.' });
  }
});

router.get('/notification-templates', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.notificationTemplate.findMany({
      orderBy: [{ module: 'asc' }, { code: 'asc' }]
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Bildirim şablonları getirilemedi.' });
  }
});

router.put('/notification-templates/:code', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { code } = req.params;
  const { subject, body } = req.body;
  try {
    const template = await prisma.notificationTemplate.update({
      where: { code },
      data: { subject, body }
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Bildirim şablonu güncellenemedi.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// İDARİ PARA CEZALARI (Panel Ayarları) - Sadece Admin
// ──────────────────────────────────────────────────────────────────────────────
router.get('/fines', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const fines = await prisma.administrativeFine.findUnique({
      where: { year },
    });
    res.json(fines);
  } catch {
    res.status(500).json({ error: 'Cezalar getirilemedi.' });
  }
});

router.post('/fines', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { 
    year, 
    specialistAndPhysicianVery, 
    specialistAndPhysicianDanger, 
    specialistAndPhysicianLess, 
    dspVeryDangerous 
  } = req.body;

  try {
    const fines = await prisma.administrativeFine.upsert({
      where: { year: parseInt(String(year)) },
      update: { 
        specialistAndPhysicianVery: parseFloat(String(specialistAndPhysicianVery)),
        specialistAndPhysicianDanger: parseFloat(String(specialistAndPhysicianDanger)),
        specialistAndPhysicianLess: parseFloat(String(specialistAndPhysicianLess)),
        dspVeryDangerous: parseFloat(String(dspVeryDangerous))
      },
      create: { 
        year: parseInt(String(year)),
        specialistAndPhysicianVery: parseFloat(String(specialistAndPhysicianVery)),
        specialistAndPhysicianDanger: parseFloat(String(specialistAndPhysicianDanger)),
        specialistAndPhysicianLess: parseFloat(String(specialistAndPhysicianLess)),
        dspVeryDangerous: parseFloat(String(dspVeryDangerous))
      },
    });
    res.json(fines);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Cezalar kaydedilemedi.' });
  }
});

// ──────────────────────────────────────────────────────────────────────────────
// RAPOR ŞABLONLARI - Sadece Admin
// ──────────────────────────────────────────────────────────────────────────────

router.get('/report-templates', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const templates = await prisma.reportTemplate.findMany({
      orderBy: [{ code: 'asc' }, { version: 'desc' }]
    });
    res.json(templates);
  } catch (error) {
    res.status(500).json({ error: 'Rapor şablonları getirilemedi.' });
  }
});

router.get('/report-templates/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const template = await prisma.reportTemplate.findUnique({
      where: { id: parseInt(req.params.id) }
    });
    if (!template) return res.status(404).json({ error: 'Şablon bulunamadı.' });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Şablon getirilemedi.' });
  }
});

router.post('/report-templates', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const { name, code, module, content, orientation, documentNo, revisionNo, releaseDate } = req.body;
  
  if (!name || !code || !module) {
    return res.status(400).json({ error: 'İsim, kod ve modül zorunludur.' });
  }

  try {
    const template = await prisma.reportTemplate.create({
      data: {
        name,
        code: code.toUpperCase().replace(/\s+/g, '_'),
        module: module.toUpperCase(),
        content: content || {},
        orientation: orientation || 'PORTRAIT',
        documentNo,
        revisionNo,
        releaseDate: releaseDate ? new Date(releaseDate) : null,
      }
    });
    res.status(201).json(template);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Bu kod ve versiyon kombinasyonu zaten mevcut.' });
    }
    console.error(error);
    res.status(500).json({ error: 'Şablon oluşturulamadı.' });
  }
});

router.put('/report-templates/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  const { name, content, orientation, documentNo, revisionNo, releaseDate, isActive } = req.body;

  try {
    const template = await prisma.reportTemplate.update({
      where: { id },
      data: {
        name,
        content,
        orientation,
        documentNo,
        revisionNo,
        releaseDate: releaseDate ? new Date(releaseDate) : undefined,
        isActive,
      }
    });
    res.json(template);
  } catch (error) {
    res.status(500).json({ error: 'Şablon güncellenemedi.' });
  }
});

router.post('/report-templates/:id/clone', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    const source = await prisma.reportTemplate.findUnique({ where: { id } });
    if (!source) return res.status(404).json({ error: 'Kaynak şablon bulunamadı.' });

    // En son versiyonu bul
    const lastVersion = await prisma.reportTemplate.findFirst({
      where: { code: source.code },
      orderBy: { version: 'desc' }
    });

    const nextVersion = (lastVersion?.version || source.version) + 1;

    const clone = await prisma.reportTemplate.create({
      data: {
        ...source,
        id: undefined,
        version: nextVersion,
        isActive: false,
        name: `${source.name} (Kopya V${nextVersion})`,
        createdAt: undefined,
        updatedAt: undefined,
      }
    });

    res.status(201).json(clone);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Şablon kopyalanamadı.' });
  }
});

router.post('/report-templates/:id/publish', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);

  try {
    const template = await prisma.reportTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: 'Şablon bulunamadı.' });

    // Aynı koddaki diğer tüm aktifleri deaktif et
    await prisma.reportTemplate.updateMany({
      where: { code: template.code, isActive: true },
      data: { isActive: false }
    });

    // Bunu aktif et
    const updated = await prisma.reportTemplate.update({
      where: { id },
      data: { isActive: true }
    });

    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Şablon yayınlanamadı.' });
  }
});

router.post('/report-templates/:id/deactivate', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const updated = await prisma.reportTemplate.update({
      where: { id },
      data: { isActive: false }
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: 'Şablon pasife alınamadı.' });
  }
});

router.delete('/report-templates/:id', adminMiddleware, async (req: AuthRequest, res: Response) => {
  const id = parseInt(req.params.id);
  try {
    const template = await prisma.reportTemplate.findUnique({ where: { id } });
    if (!template) return res.status(404).json({ error: 'Şablon bulunamadı.' });
    if (template.isActive) return res.status(400).json({ error: 'Aktif bir şablon silinemez. Önce pasife alın veya başka bir sürümü yayınlayın.' });

    await prisma.reportTemplate.delete({ where: { id } });
    res.json({ message: 'Şablon başarıyla silindi.' });
  } catch (error) {
    res.status(500).json({ error: 'Şablon silinemedi.' });
  }
});

export default router;
