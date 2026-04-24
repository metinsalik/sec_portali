import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Tüm route'lar auth gerektirir
router.use(authMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getUser(req: AuthRequest) {
  return req.user!;
}

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const userFacilities = user.facilities?.length > 0
      ? user.facilities
      : undefined;

    const facilityFilter = userFacilities
      ? { id: { in: userFacilities as string[] } }
      : {};

    const facilities = await prisma.facility.findMany({
      where: { isActive: true, ...facilityFilter },
      select: { id: true },
    });

    const facilityIds = facilities.map(f => f.id);
    const currentMonth = new Date().toISOString().slice(0, 7);

    const [hrDataCount, accidentDataCount, recentHrData, recentAccidents] = await Promise.all([
      prisma.monthlyHRData.count({
        where: { facilityId: { in: facilityIds }, month: currentMonth },
      }),
      prisma.monthlyAccidentData.count({
        where: { facilityId: { in: facilityIds }, month: currentMonth },
      }),
      prisma.monthlyHRData.findMany({
        where: { facilityId: { in: facilityIds } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { facility: { select: { name: true } } },
      }),
      prisma.monthlyAccidentData.findMany({
        where: { facilityId: { in: facilityIds } },
        orderBy: { updatedAt: 'desc' },
        take: 5,
        include: { facility: { select: { name: true } } },
      }),
    ]);

    res.json({
      totalFacilities: facilities.length,
      hrDataSubmittedThisMonth: hrDataCount,
      accidentDataSubmittedThisMonth: accidentDataCount,
      recentHrData,
      recentAccidents,
      currentMonth,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Dashboard verileri getirilemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AYLIK HR VERİLERİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/hr/:facilityId/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.facilityId);
    const month = req.query.month as string | undefined;

    const where: { facilityId: string; month?: string } = { facilityId };
    if (month) where.month = month;

    const data = await prisma.monthlyHRData.findMany({
      where,
      orderBy: { month: 'desc' },
      include: { facility: { select: { name: true } } },
    });

    res.json(data);
  } catch {
    res.status(500).json({ error: 'HR verileri getirilemedi.' });
  }
});

router.post('/hr/:facilityId/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.facilityId);
    const user = getUser(req);
    const { month, mainEmployerData, subContractorData } = req.body;

    if (!month || !facilityId) {
      return res.status(400).json({ error: 'Tesis ID ve ay bilgisi zorunludur.' });
    }

    const data = await prisma.monthlyHRData.upsert({
      where: { facilityId_month: { facilityId, month } },
      update: {
        mainEmployerData: mainEmployerData || {},
        subContractorData: subContractorData || {},
        updatedAt: new Date(),
      },
      create: {
        facilityId,
        month,
        mainEmployerData: mainEmployerData || {},
        subContractorData: subContractorData || {},
        createdBy: user.username,
      },
      include: { facility: { select: { name: true } } },
    });

    // Aktivite günlüğü ekle
    await prisma.activityLog.create({
      data: {
        facilityId,
        username: user.username,
        action: 'Aylık Personel Verisi Güncellendi',
        details: `${month} dönemi için personel verileri girildi/güncellendi.`
      }
    });

    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'HR verisi kaydedilemedi.' });
  }
});

router.put('/hr/:facilityId/monthly/:month', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.facilityId);
    const month = String(req.params.month);
    const { mainEmployerData, subContractorData } = req.body;

    const data = await prisma.monthlyHRData.update({
      where: { facilityId_month: { facilityId, month } },
      data: {
        mainEmployerData,
        subContractorData,
        updatedAt: new Date(),
      },
      include: { facility: { select: { name: true } } },
    });

    res.json(data);
  } catch {
    res.status(500).json({ error: 'HR verisi güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// KAZA VERİLERİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/accidents/:facilityId/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.facilityId);
    const month = req.query.month as string | undefined;

    const where: { facilityId: string; month?: string } = { facilityId };
    if (month) where.month = month;

    const data = await prisma.monthlyAccidentData.findMany({
      where,
      orderBy: { month: 'desc' },
      include: { facility: { select: { name: true } } },
    });

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Kaza verileri getirilemedi.' });
  }
});

router.post('/accidents/:facilityId/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.facilityId);
    const user = getUser(req);
    const { month, mainEmployerData, subContractorData, internData } = req.body;

    if (!month || !facilityId) {
      return res.status(400).json({ error: 'Tesis ID ve ay bilgisi zorunludur.' });
    }

    const data = await prisma.monthlyAccidentData.upsert({
      where: { facilityId_month: { facilityId, month } },
      update: {
        mainEmployerData: mainEmployerData || {},
        subContractorData: subContractorData || {},
        internData: internData || {},
        updatedAt: new Date(),
      },
      create: {
        facilityId,
        month,
        mainEmployerData: mainEmployerData || {},
        subContractorData: subContractorData || {},
        internData: internData || {},
        createdBy: user.username,
      },
      include: { facility: { select: { name: true } } },
    });

    res.status(201).json(data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Kaza verisi kaydedilemedi.' });
  }
});

router.put('/accidents/:facilityId/monthly/:month', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.facilityId);
    const month = String(req.params.month);
    const { mainEmployerData, subContractorData, internData } = req.body;

    const data = await prisma.monthlyAccidentData.update({
      where: { facilityId_month: { facilityId, month } },
      data: {
        mainEmployerData,
        subContractorData,
        internData,
        updatedAt: new Date(),
      },
      include: { facility: { select: { name: true } } },
    });

    res.json(data);
  } catch {
    res.status(500).json({ error: 'Kaza verisi güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TESİS YÖNETİMİ (Sadece atanmış tesisler)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/facilities', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const facilityFilter = user.facilities?.length > 0
      ? { id: { in: user.facilities as string[] } }
      : {};

    const facilities = await prisma.facility.findMany({
      where: { isActive: true, ...facilityFilter },
      include: {
        buildings: true,
      },
      orderBy: { name: 'asc' },
    });

    res.json(facilities);
  } catch {
    res.status(500).json({ error: 'Tesisler getirilemedi.' });
  }
});

router.get('/facilities/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = getUser(req);

    // Yetki kontrolü (admin/management değilse ve tesise atanmamışsa)
    const isAssigned = user.isAdmin || user.isManagement || user.facilities?.includes(id);
    if (!isAssigned) {
      return res.status(403).json({ error: 'Bu tesise erişim yetkiniz bulunmamaktadır.' });
    }

    const facility = await prisma.facility.findUnique({
      where: { id },
      include: {
        buildings: true,
        assignments: {
          include: {
            professional: true,
            employerRep: true
          }
        }
      },
    });

    if (!facility) return res.status(404).json({ error: 'Tesis bulunamadı.' });
    res.json(facility);
  } catch {
    res.status(500).json({ error: 'Tesis bilgileri getirilemedi.' });
  }
});

router.put('/facilities/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const user = getUser(req);
    const {
      name, shortName, type, city, district, fullAddress,
      phone, email, website, commercialTitle, taxOffice,
      taxNumber, sgkNumber, naceCode, dangerClass, employeeCount, buildings
    } = req.body;

    // Yetki kontrolü
    const isAssigned = user.isAdmin || user.isManagement || user.facilities?.includes(id);
    if (!isAssigned) {
      return res.status(403).json({ error: 'Bu tesisi güncelleme yetkiniz bulunmamaktadır.' });
    }

    // Mevcut binaları temizle ve yenilerini ekle (Settings rotasındaki mantığın aynısı)
    await prisma.facilityBuilding.deleteMany({ where: { facilityId: id } });

    const facility = await prisma.facility.update({
      where: { id },
      data: {
        name, shortName, type, city, district, fullAddress,
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

    // Aktivite günlüğü ekle
    await prisma.activityLog.create({
      data: {
        facilityId: id,
        username: user.username,
        action: 'Tesis Bilgileri Güncellendi',
        details: 'Tesis bilgileri kullanıcı tarafından güncellendi.'
      }
    });

    res.json(facility);
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ error: 'Tesis güncellenemedi: ' + error.message });
  }
});

export default router;