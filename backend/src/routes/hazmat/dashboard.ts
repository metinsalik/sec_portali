import express from 'express';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

router.get('/', async (req, res) => {
  try {
    const facilityId = req.query.facilityId as string;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    // 1. Inventory Metrics
    const materialsCount = await prisma.facilityHazmatItem.count({ where: { facilityId } });
    const uniqueDepartments = await prisma.hazmatInventoryItem.findMany({
      where: { facilityId },
      select: { departmentId: true },
      distinct: ['departmentId'],
    });
    const departmentsCount = uniqueDepartments.length;

    // 2. Spill Kit Metrics
    const spillKitTemplatesCount = await prisma.hazmatSpillKit.count({ where: { facilityId } });
    
    // Physical Placements
    const placements = await prisma.hazmatSpillKitDepartment.findMany({
      where: { kit: { facilityId } },
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

    // Recent Incidents (Last 30 Days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const incidents = await prisma.hazmatSpillKitIncident.findMany({
      where: {
        placement: { kit: { facilityId } },
        incidentDate: { gte: thirtyDaysAgo }
      }
    });

    // Group incidents by type
    const incidentTypesMap: Record<string, number> = {};
    incidents.forEach(inc => {
      const type = inc.incidentType || 'Belirtilmemiş';
      incidentTypesMap[type] = (incidentTypesMap[type] || 0) + 1;
    });

    const incidentDistribution = Object.keys(incidentTypesMap).map(k => ({
      name: k,
      value: incidentTypesMap[k]
    }));

    // 3. Eyewash Risk Analysis
    const eyewashAnalyses = await prisma.hazmatEyewashRiskAnalysis.findMany({
      where: { facilityId }
    });

    const totalEyewashAnalyses = eyewashAnalyses.length;
    
    const chemRiskDist: Record<string, number> = { 'Yüksek': 0, 'Orta': 0, 'Düşük': 0, 'Kabul Edilebilir': 0 };
    const bioRiskDist: Record<string, number> = { 'Yüksek': 0, 'Orta': 0, 'Düşük': 0, 'Kabul Edilebilir': 0 };

    eyewashAnalyses.forEach(ea => {
      if (ea.chemRiskLevel) chemRiskDist[ea.chemRiskLevel] = (chemRiskDist[ea.chemRiskLevel] || 0) + 1;
      if (ea.bioRiskLevel) bioRiskDist[ea.bioRiskLevel] = (bioRiskDist[ea.bioRiskLevel] || 0) + 1;
    });

    const eyewashRiskData = [
      { name: 'Yüksek', Kimyasal: chemRiskDist['Yüksek'] || 0, Biyolojik: bioRiskDist['Yüksek'] || 0 },
      { name: 'Orta', Kimyasal: chemRiskDist['Orta'] || 0, Biyolojik: bioRiskDist['Orta'] || 0 },
      { name: 'Düşük', Kimyasal: chemRiskDist['Düşük'] || 0, Biyolojik: bioRiskDist['Düşük'] || 0 },
      { name: 'Kabul Edilebilir', Kimyasal: chemRiskDist['Kabul Edilebilir'] || 0, Biyolojik: bioRiskDist['Kabul Edilebilir'] || 0 },
    ];

    res.json({
      inventory: {
        materialsCount,
        departmentsCount
      },
      spillKits: {
        templatesCount: spillKitTemplatesCount,
        activePlacementsCount,
        needsInterventionCount,
        incidentsLast30Days: incidents.length,
        incidentDistribution
      },
      eyewash: {
        totalAnalyses: totalEyewashAnalyses,
        riskDistribution: eyewashRiskData
      }
    });

  } catch (error) {
    console.error('Error in hazmat dashboard metrics:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
