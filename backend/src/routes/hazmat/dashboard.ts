import express, { Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = express.Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const rawFacilityId = req.query.facilityId as string;
    const user = req.user!;
    const isAdmin = Boolean(user.isAdmin || user.isManagement || user.roles?.includes('admin') || user.roles?.includes('management'));

    const isAll = !rawFacilityId || rawFacilityId.toLowerCase() === 'all';

    let allowedFacilityIds: string[] = [];
    if (!isAdmin) {
      if (Array.isArray(user.facilities) && user.facilities.length > 0) {
        allowedFacilityIds = user.facilities;
      } else {
        const userFacilities = await prisma.userFacility.findMany({
          where: { username: user.username },
          select: { facilityId: true }
        });
        allowedFacilityIds = userFacilities.map(uf => uf.facilityId);
      }
    }

    // Determine target facility where clause
    const facilityWhere: any = {};
    if (!isAll) {
      if (!isAdmin && !allowedFacilityIds.includes(rawFacilityId)) {
        return res.status(403).json({ error: 'Bu tesise erişim yetkiniz bulunmamaktadır.' });
      }
      facilityWhere.facilityId = rawFacilityId;
    } else if (!isAdmin) {
      facilityWhere.facilityId = { in: allowedFacilityIds };
    }

    // 1. Fetch Facility Hazmat Items (allocated chemicals & quantities)
    const facilityItems = await prisma.facilityHazmatItem.findMany({
      where: facilityWhere,
      include: {
        unit: true,
        facility: { select: { id: true, name: true, shortName: true } },
        material: {
          include: {
            category: true,
            hazardLabels: {
              include: {
                label: true
              }
            }
          }
        }
      }
    });

    // 2. Quantity Normalization (Liters & Kilograms)
    let totalLiters = 0;
    let totalKilograms = 0;
    let totalPieces = 0;
    let totalCubicMeters = 0;

    const categoryMap: Record<string, { category: string; liters: number; kilograms: number; totalItems: number }> = {};
    const facilityBreakdownMap: Record<string, { facilityId: string; facilityName: string; materialsCount: number; liters: number; kilograms: number }> = {};
    const hazardLabelsMap: Record<string, { code: string; name: string; description: string; imageUrl: string | null; count: number }> = {};

    facilityItems.forEach(item => {
      const val = Number(item.amountValue) || 0;
      const unitSym = (item.unit?.symbol || '').toLowerCase().trim();
      const unitNm = (item.unit?.name || '').toLowerCase().trim();
      const catName = item.material?.category?.name || 'Diğer / Tanımsız';
      const facId = item.facilityId;
      const facName = item.facility?.name || item.facility?.shortName || facId;

      // Grouping by category
      if (!categoryMap[catName]) {
        categoryMap[catName] = { category: catName, liters: 0, kilograms: 0, totalItems: 0 };
      }
      categoryMap[catName].totalItems++;

      // Grouping by facility
      if (!facilityBreakdownMap[facId]) {
        facilityBreakdownMap[facId] = { facilityId: facId, facilityName: facName, materialsCount: 0, liters: 0, kilograms: 0 };
      }
      facilityBreakdownMap[facId].materialsCount++;

      // Unit conversion (Normalized to L for liquids, kg for solids)
      if (unitSym === 'l' || unitSym === 'lt' || unitNm === 'litre' || unitNm === 'liter') {
        totalLiters += val;
        categoryMap[catName].liters += val;
        facilityBreakdownMap[facId].liters += val;
      } else if (unitSym === 'ml' || unitNm === 'mililitre' || unitNm === 'milliliter') {
        const inL = val / 1000;
        totalLiters += inL;
        categoryMap[catName].liters += inL;
        facilityBreakdownMap[facId].liters += inL;
      } else if (unitSym === 'cl' || unitNm === 'santilitre' || unitNm === 'centiliter') {
        const inL = val / 100;
        totalLiters += inL;
        categoryMap[catName].liters += inL;
        facilityBreakdownMap[facId].liters += inL;
      } else if (unitSym === 'dl' || unitNm === 'desilitre' || unitNm === 'deciliter') {
        const inL = val / 10;
        totalLiters += inL;
        categoryMap[catName].liters += inL;
        facilityBreakdownMap[facId].liters += inL;
      } else if (unitSym === 'm³' || unitSym === 'm3' || unitNm === 'metreküp' || unitNm === 'metrekup') {
        const inL = val * 1000;
        totalCubicMeters += val;
        totalLiters += inL;
        categoryMap[catName].liters += inL;
        facilityBreakdownMap[facId].liters += inL;
      } else if (unitSym === 'kg' || unitNm === 'kilogram') {
        totalKilograms += val;
        categoryMap[catName].kilograms += val;
        facilityBreakdownMap[facId].kilograms += val;
      } else if (unitSym === 'g' || unitSym === 'gr' || unitNm === 'gram') {
        const inKg = val / 1000;
        totalKilograms += inKg;
        categoryMap[catName].kilograms += inKg;
        facilityBreakdownMap[facId].kilograms += inKg;
      } else if (unitSym === 'mg' || unitNm === 'miligram' || unitNm === 'milligram') {
        const inKg = val / 1000000;
        totalKilograms += inKg;
        categoryMap[catName].kilograms += inKg;
        facilityBreakdownMap[facId].kilograms += inKg;
      } else if (unitSym === 'ton' || unitSym === 't' || unitNm === 'ton') {
        const inKg = val * 1000;
        totalKilograms += inKg;
        categoryMap[catName].kilograms += inKg;
        facilityBreakdownMap[facId].kilograms += inKg;
      } else if (unitSym === 'adet' || unitNm === 'adet') {
        totalPieces += val;
      }

      // Hazard labels counting
      item.material?.hazardLabels?.forEach(hl => {
        const lbl = hl.label;
        if (!lbl) return;
        const key = lbl.code || lbl.name;
        if (!hazardLabelsMap[key]) {
          hazardLabelsMap[key] = {
            code: lbl.code,
            name: lbl.name,
            description: lbl.description || '',
            imageUrl: lbl.imageUrl || null,
            count: 0
          };
        }
        hazardLabelsMap[key].count++;
      });
    });

    const hazardLabelDistribution = Object.values(hazardLabelsMap).sort((a, b) => b.count - a.count);
    const categoryDistribution = Object.values(categoryMap).map(c => ({
      ...c,
      liters: Number(c.liters.toFixed(2)),
      kilograms: Number(c.kilograms.toFixed(2))
    })).sort((a, b) => (b.liters + b.kilograms) - (a.liters + a.kilograms));
    const facilityBreakdown = Object.values(facilityBreakdownMap).sort((a, b) => b.materialsCount - a.materialsCount);

    // 3. Departments / Locations count
    const uniqueDepartments = await prisma.hazmatInventoryItem.findMany({
      where: facilityWhere,
      select: { locationId: true },
      distinct: ['locationId'],
    });
    const departmentsCount = uniqueDepartments.length;

    // 4. Total Material Pool count
    const totalPoolMaterials = await prisma.hazmatMaterial.count({ where: { isActive: true } });

    // 5. Hazmat Incidents (Olağan Dışı Olaylar)
    const incidentWhere: any = {};
    if (!isAll) {
      incidentWhere.facilityId = rawFacilityId;
    } else if (!isAdmin) {
      incidentWhere.facilityId = { in: allowedFacilityIds };
    }

    const incidents = await prisma.hazmatIncident.findMany({
      where: incidentWhere,
      include: {
        category: true,
        incidentType: true,
        facility: { select: { id: true, name: true, shortName: true } }
      },
      orderBy: { incidentDate: 'desc' }
    });

    const totalIncidents = incidents.length;
    const kitsUsedCount = incidents.filter(i => i.kitUsed).length;
    const totalInjured = incidents.reduce((sum, i) => sum + (i.injuredCount || 0), 0);
    const totalDeceased = incidents.reduce((sum, i) => sum + (i.deceasedCount || 0), 0);

    const incidentTypeMap: Record<string, number> = {};
    incidents.forEach(inc => {
      const type = inc.incidentType?.name || inc.category?.name || 'Belirtilmemiş';
      incidentTypeMap[type] = (incidentTypeMap[type] || 0) + 1;
    });

    const incidentDistribution = Object.entries(incidentTypeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const recentIncidents = incidents.slice(0, 5).map(inc => ({
      id: inc.id,
      incidentDate: inc.incidentDate,
      type: inc.incidentType?.name || inc.category?.name || 'Olağan Dışı Olay',
      mode: inc.incidentMode || inc.rootCause || '-',
      facilityName: inc.facility?.name || inc.facility?.shortName || '-',
      kitUsed: inc.kitUsed,
      injuredCount: inc.injuredCount,
      deceasedCount: inc.deceasedCount
    }));

    // 6. Spill Kits & Eyewash metrics (for compatibility)
    const spillKitWhere = !isAll ? { facilityId: rawFacilityId } : (isAdmin ? {} : { facilityId: { in: allowedFacilityIds } });
    const spillKitTemplatesCount = await prisma.hazmatSpillKit.count({ where: spillKitWhere });

    const placements = await prisma.hazmatSpillKitDepartment.findMany({
      where: { kit: spillKitWhere },
      include: {
        checks: { orderBy: { createdAt: 'desc' }, take: 1 },
      }
    });

    let activePlacementsCount = placements.length;
    let needsInterventionCount = 0;
    placements.forEach(p => {
      const latestCheck = p.checks[0];
      if (p.status === 'Eksik (Müdahale Gerekli)' || latestCheck?.result === 'Eksik (Müdahale Gerekli)') {
        needsInterventionCount++;
      }
    });

    const eyewashAnalyses = await prisma.hazmatEyewashRiskAnalysis.findMany({
      where: spillKitWhere
    });
    const totalEyewashAnalyses = eyewashAnalyses.length;

    res.json({
      summary: {
        isAll,
        facilityId: rawFacilityId || 'all',
        totalRegisteredMaterials: facilityItems.length,
        uniqueMaterialsCount: new Set(facilityItems.map(i => i.materialId)).size,
        totalPoolMaterials,
        departmentsCount,
      },
      quantities: {
        totalLiters: Number(totalLiters.toFixed(2)),
        totalKilograms: Number(totalKilograms.toFixed(2)),
        totalPieces,
        totalCubicMeters: Number(totalCubicMeters.toFixed(2)),
        byCategory: categoryDistribution,
        byFacility: facilityBreakdown
      },
      hazardLabels: {
        totalLabelsTagged: hazardLabelDistribution.reduce((acc, h) => acc + h.count, 0),
        distribution: hazardLabelDistribution
      },
      incidents: {
        total: totalIncidents,
        kitsUsed: kitsUsedCount,
        injured: totalInjured,
        deceased: totalDeceased,
        distribution: incidentDistribution,
        recent: recentIncidents
      },
      inventory: {
        materialsCount: facilityItems.length,
        departmentsCount
      },
      spillKits: {
        templatesCount: spillKitTemplatesCount,
        activePlacementsCount,
        needsInterventionCount,
        incidentsLast30Days: totalIncidents,
        incidentDistribution
      },
      eyewash: {
        totalAnalyses: totalEyewashAnalyses,
      }
    });

  } catch (error) {
    console.error('Error in hazmat dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
