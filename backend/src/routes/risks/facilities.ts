import express, { Request, Response } from 'express';
import { AuthRequest } from "../../middleware/auth";
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';
import {
  buildCanonicalLocationName,
  deleteLocationNode,
  ensureFacilityBuilding,
  inferLocationType,
  renameLocationNode,
  upsertFacilityLocation,
} from '../../utils/locationHierarchy';

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



// Locations endpoints for experts & modules
router.get('/:id/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { includeCleaningCarts } = req.query as Record<string, string>;
  try {
    const whereClause: any = {
      facilityId: id,
      isActive: true,
    };
    if (includeCleaningCarts !== 'true') {
      whereClause.OR = [{ type: null }, { type: { not: 'TEMIZLIK_ARABASI' } }];
    }

    const locations = await prisma.facilityLocation.findMany({
      where: whereClause,
      include: { facilityBuilding: true },
      orderBy: [
        { buildingName: 'asc' },
        { building: 'asc' },
        { floor: 'asc' },
        { department: 'asc' },
        { description: 'asc' },
        { name: 'asc' },
      ],
    });
    res.json(locations);
  } catch (err) {
    res.status(500).json({ error: 'Lokasyonlar getirilemedi.' });
  }
});

router.post('/:id/locations', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const { buildingName, building, block, floor, department, description, name, type } = req.body;
  if (!buildingName && !building && !block && !name) {
    return res.status(400).json({ error: 'Bina, Blok veya Lokasyon Adı zorunludur.' });
  }
  try {
    const { location } = await upsertFacilityLocation(prisma, {
      facilityId: id,
      buildingName,
      building,
      block,
      floor,
      department,
      description,
      name,
      type,
    });
    res.status(201).json(location);
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Lokasyon oluşturulamadı.' });
  }
});

router.put('/:id/locations/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id, locationId } = req.params;
  const { buildingName, building, block, floor, department, description, name, type } = req.body;
  if (!buildingName && !building && !block && !name) {
    return res.status(400).json({ error: 'Bina, Blok veya Lokasyon Adı zorunludur.' });
  }
  try {
    const existing = await prisma.facilityLocation.findUnique({ where: { id: locationId } });
    if (!existing) return res.status(404).json({ error: 'Lokasyon bulunamadı.' });

    const nextBuildingName = buildingName !== undefined ? (buildingName?.trim() || null) : existing.buildingName;
    const rawBlk = block !== undefined ? block : building;
    const nextBuilding = rawBlk !== undefined ? (rawBlk?.trim() || null) : existing.building;
    const nextFloor = floor !== undefined ? (floor?.trim() || null) : existing.floor;
    const nextDept = department !== undefined ? (department?.trim() || null) : existing.department;
    const nextDesc = description !== undefined ? (description?.trim() || null) : existing.description;

    const buildingId = await ensureFacilityBuilding(prisma, id, nextBuildingName);
    const nextName = buildCanonicalLocationName({
      buildingName: nextBuildingName,
      building: nextBuilding,
      floor: nextFloor,
      department: nextDept,
      description: nextDesc,
      name,
    });
    const nextType = inferLocationType({
      buildingName: nextBuildingName,
      building: nextBuilding,
      floor: nextFloor,
      department: nextDept,
      description: nextDesc,
      type: type ?? existing.type,
    });

    const loc = await prisma.facilityLocation.update({
      where: { id: locationId },
      data: {
        buildingId,
        buildingName: nextBuildingName,
        building: nextBuilding,
        floor: nextFloor,
        department: nextDept,
        description: nextDesc,
        name: nextName,
        type: nextType,
      },
      include: { facilityBuilding: true },
    });
    res.json(loc);
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Lokasyon güncellenemedi.' });
  }
});

router.post('/:id/locations/rename-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    level,
    oldValue,
    newValue,
    parentBuildingName,
    parentBuilding,
    parentFloor,
    parentDepartment,
  } = req.body;

  try {
    const result = await renameLocationNode(prisma, {
      facilityId: id,
      level,
      oldValue,
      newValue,
      parentBuildingName,
      parentBuilding,
      parentFloor,
      parentDepartment,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'İsim güncellenemedi.' });
  }
});

router.post('/:id/locations/delete-node', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { id } = req.params;
  const {
    level,
    value,
    parentBuildingName,
    parentBuilding,
    parentFloor,
    parentDepartment,
  } = req.body;

  try {
    const result = await deleteLocationNode(prisma, {
      facilityId: id,
      level,
      value,
      parentBuildingName,
      parentBuilding,
      parentFloor,
      parentDepartment,
    });
    res.json({ success: true, ...result });
  } catch (err: any) {
    res.status(err.statusCode || 500).json({ error: err.message || 'Düğüm silinemedi.' });
  }
});

router.delete('/:id/locations/:locationId', authMiddleware, async (req: AuthRequest, res: Response) => {
  const { locationId } = req.params;
  try {
    await prisma.facilityLocation.update({
      where: { id: locationId },
      data: { isActive: false },
    });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Lokasyon silinemedi.' });
  }
});

export default router;

