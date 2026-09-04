import express, { Request, Response } from 'express';
import { AuthRequest } from "../../middleware/auth";
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/risks/facilities
// Admin/Management → tüm tesisler; Specialist → atandığı tesisler
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const isAdminOrMgmt = user?.isAdmin || user?.isManagement;

    let facilities;

    if (isAdminOrMgmt) {
      facilities = await prisma.facility.findMany({
        where: { isActive: true },
        select: {
          id: true,
          name: true,
          shortName: true,
          city: true,
          dangerClass: true,
          commercialTitle: true,
          fullAddress: true,
          district: true,
          logoUrl: true,
          phone: true,
          assignments: {
            include: {
              professional: true,
              employerRep: true,
            }
          },
          locations: {
            select: {
              id: true,
              name: true,
              _count: { select: { risks: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    } else {
      // Uzman: sadece atandığı tesisler
      const userFacilities = await prisma.userFacility.findMany({
        where: { username: user!.username },
        select: { facilityId: true },
      });
      const facilityIds = userFacilities.map((f: any) => f.facilityId);

      facilities = await prisma.facility.findMany({
        where: { id: { in: facilityIds }, isActive: true },
        select: {
          id: true,
          name: true,
          shortName: true,
          city: true,
          dangerClass: true,
          commercialTitle: true,
          fullAddress: true,
          district: true,
          logoUrl: true,
          phone: true,
          assignments: {
            include: {
              professional: true,
              employerRep: true,
            }
          },
          locations: {
            select: {
              id: true,
              name: true,
              _count: { select: { risks: true } },
            },
          },
        },
        orderBy: { name: 'asc' },
      });
    }

    // Her tesis için risk özeti hesapla
    const withStats = await Promise.all(
      facilities.map(async (f: any) => {
        const stats = await prisma.riskLifecycle.groupBy({
          by: ['status'],
          where: {
            location: { facilityId: f.id },
          },
          _count: { id: true },
        });

        const statusMap: Record<string, number> = {};
        stats.forEach((s: any) => {
          statusMap[s.status] = s._count.id;
        });

        return {
          ...f,
          riskStats: {
            total: Object.values(statusMap).reduce((a: number, b: number) => a + b, 0),
            acik: statusMap['ACIK_TEHLIKE'] || 0,
            mudahale: statusMap['ILK_MUDAHALE_EDILDI'] || 0,
            takip: statusMap['TAKIP_SURECINDE'] || 0,
            kapali: statusMap['KAPATILDI_GUVENLI'] || 0,
          },
        };
      })
    );

    res.json(withStats);
  } catch (error) {
    console.error('Risk facilities error:', error);
    res.status(500).json({ error: 'Tesisler alınamadı.' });
  }
});



// Locations endpoints for experts
router.get('/:id/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  try {
    const locations = await prisma.facilityLocation.findMany({
      where: { facilityId: id },
      orderBy: { name: 'asc' }
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Lokasyonlar getirilemedi.' });
  }
});

router.post('/:id/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { building, floor, department, description, name } = req.body;
  if (!building && !name) return res.status(400).json({ error: 'Blok veya Lokasyon Adı zorunludur.' });
  try {
    const loc = await prisma.facilityLocation.create({
      data: { facilityId: id, name, building, floor, department, description }
    });
    res.status(201).json(loc);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lokasyon oluşturulamadı.' });
  }
});

router.put('/:id/locations/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { locationId } = req.params;
  const { building, floor, department, description, name } = req.body;
  if (!building && !name) return res.status(400).json({ error: 'Blok veya Lokasyon Adı zorunludur.' });
  try {
    const loc = await prisma.facilityLocation.update({
      where: { id: locationId },
      data: { name, building, floor, department, description }
    });
    res.json(loc);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lokasyon güncellenemedi.' });
  }
});


router.post('/:id/locations/rename-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { level, oldValue, newValue, parentBuilding, parentFloor } = req.body;
  if (!newValue || newValue.trim() === '') return res.status(400).json({ error: 'Yeni isim boş olamaz.' });
  
  try {
    let whereClause: any = { facilityId: id };
    let dataClause: any = {};
    
    const cleanOld = oldValue.startsWith('Belirtilmemiş') ? '' : oldValue;
    const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
    const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;

    if (level === 'building') {
      whereClause.building = cleanOld;
      dataClause.building = newValue;
    } else if (level === 'floor') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanOld;
      dataClause.floor = newValue;
    } else if (level === 'department') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanPF;
      whereClause.department = cleanOld;
      dataClause.department = newValue;
    } else {
      return res.status(400).json({ error: 'Geçersiz seviye.' });
    }

    await prisma.facilityLocation.updateMany({
      where: whereClause,
      data: dataClause
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'İsim güncellenemedi.' });
  }
});


router.post('/:id/locations/delete-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { level, value, parentBuilding, parentFloor } = req.body;
  
  try {
    let whereClause: any = { facilityId: id };
    let dataClause: any = {};
    
    const cleanVal = value.startsWith('Belirtilmemiş') ? '' : value;
    const cleanPB = parentBuilding && parentBuilding.startsWith('Belirtilmemiş') ? '' : parentBuilding;
    const cleanPF = parentFloor && parentFloor.startsWith('Belirtilmemiş') ? '' : parentFloor;
    
    if (level === 'building') {
      whereClause.building = cleanVal;
      dataClause.building = '';
    } else if (level === 'floor') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanVal;
      dataClause.floor = '';
    } else if (level === 'department') {
      whereClause.building = cleanPB;
      whereClause.floor = cleanPF;
      whereClause.department = cleanVal;
      dataClause.department = '';
    } else {
      return res.status(400).json({ error: 'Geçersiz seviye.' });
    }

    await prisma.facilityLocation.updateMany({
      where: whereClause,
      data: dataClause
    });
    
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Düğüm silinemedi.' });
  }
});

router.delete('/:id/locations/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { locationId } = req.params;
  try {
    await prisma.facilityLocation.delete({
      where: { id: locationId }
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lokasyon silinemedi.' });
  }
});

export default router;

