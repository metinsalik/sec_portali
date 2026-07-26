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
    const isAdmin = user.roles?.includes('admin') || user.roles?.includes('management');
    
    // Facility parameter allows filtering when sent from frontend (for both admin & expert)
    const activeFacilityId = req.query.facilityId as string;
    
    const userFacilities = user.facilities?.length > 0 ? user.facilities : undefined;

    // Determine the final facility IDs to query
    let facilityFilter: any = {};
    if (activeFacilityId) {
      // If user is not admin, ensure they own this facility
      if (!isAdmin && userFacilities && !userFacilities.includes(activeFacilityId)) {
        return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
      }
      facilityFilter = { id: activeFacilityId };
    } else if (userFacilities) {
      facilityFilter = { id: { in: userFacilities as string[] } };
    }

    const facilities = await prisma.facility.findMany({
      where: { isActive: true, ...facilityFilter },
      select: { id: true, name: true },
    });

    const facilityIds = facilities.map(f => f.id);
    const currentMonth = new Date().toISOString().slice(0, 7);

    if (isAdmin && !activeFacilityId) {
      // ADMIN GLOBAL DASHBOARD
      const [hrData, accidentData] = await Promise.all([
        prisma.monthlyHRData.findMany({
          where: { facilityId: { in: facilityIds }, month: currentMonth },
          select: { facilityId: true }
        }),
        prisma.monthlyAccidentData.findMany({
          where: { facilityId: { in: facilityIds }, month: currentMonth },
          select: { facilityId: true }
        })
      ]);

      const hrDataFacilityIds = new Set(hrData.map(d => d.facilityId));
      const accidentDataFacilityIds = new Set(accidentData.map(d => d.facilityId));

      const facilitiesStatus = facilities.map(f => ({
        id: f.id,
        name: f.name,
        hasHrData: hrDataFacilityIds.has(f.id),
        hasAccidentData: accidentDataFacilityIds.has(f.id)
      }));

      return res.json({
        isAdminView: true,
        totalFacilities: facilities.length,
        hrDataSubmittedThisMonth: hrDataFacilityIds.size,
        accidentDataSubmittedThisMonth: accidentDataFacilityIds.size,
        facilitiesStatus,
        currentMonth,
      });
    }

    // EXPERT OR SPECIFIC FACILITY DASHBOARD
    const [recentHrData, recentAccidents, currentMonthHr, currentMonthAccidents] = await Promise.all([
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
      prisma.monthlyHRData.findFirst({
        where: { facilityId: { in: facilityIds }, month: currentMonth },
      }),
      prisma.monthlyAccidentData.findFirst({
        where: { facilityId: { in: facilityIds }, month: currentMonth },
      })
    ]);

    const totalWorkersThisMonth = currentMonthHr ? (
      (currentMonthHr.mainEmployerData as any)?.totalWorkers || 0
    ) + (
      (currentMonthHr.subContractorData as any)?.totalWorkers || 0
    ) : 0;

    const totalAccidentsThisMonth = currentMonthAccidents ? (
      (currentMonthAccidents.mainEmployerData as any)?.accidents || 0
    ) + (
      (currentMonthAccidents.subContractorData as any)?.accidents || 0
    ) : 0;

    res.json({
      isAdminView: false,
      totalFacilities: facilities.length,
      recentHrData,
      recentAccidents,
      currentMonth,
      totalWorkersThisMonth,
      totalAccidentsThisMonth,
      hasHrDataThisMonth: !!currentMonthHr,
      hasAccidentDataThisMonth: !!currentMonthAccidents
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Dashboard verileri getirilemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ANALİTİK & KPI (Yönetici & Genel)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/analytics/kpi', async (req: AuthRequest, res: Response) => {
  try {
    const user = getUser(req);
    const isAdmin = user.isAdmin || user.isManagement;
    const year = req.query.year ? String(req.query.year) : new Date().getFullYear().toString();

    let facilityFilter: any = {};
    if (!isAdmin) {
      if (user.facilities && user.facilities.length > 0) {
        facilityFilter = { id: { in: user.facilities as string[] } };
      } else {
        return res.json({ hrData: [], accidentData: [] }); // No access
      }
    }

    const facilities = await prisma.facility.findMany({
      where: { isActive: true, ...facilityFilter },
      select: { id: true },
    });
    const facilityIds = facilities.map(f => f.id);

    // Fetch all HR and Accident data for the year
    const hrData = await prisma.monthlyHRData.findMany({
      where: { facilityId: { in: facilityIds }, ...(year !== 'all' ? { month: { startsWith: year } } : {}) },
    });

    const accidentData = await prisma.monthlyAccidentData.findMany({
      where: { facilityId: { in: facilityIds }, ...(year !== 'all' ? { month: { startsWith: year } } : {}) },
    });

    res.json({
      hrData,
      accidentData
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'KPI verileri getirilemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// AYLIK HR VERİLERİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/hr/:facilityId/monthly', async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.facilityId);
    const month = req.query.month as string;

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
    const month = req.query.month as string;

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
    
    let facilityFilter = {};
    if (!user.isAdmin && !user.isManagement) {
      if (user.facilities && user.facilities.length > 0) {
        facilityFilter = { id: { in: user.facilities as string[] } };
      } else {
        return res.json([]); // Not admin and no facilities assigned, return empty
      }
    }

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
    const { id } = (req.params as Record<string, string>);
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
    const { id } = (req.params as Record<string, string>);
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