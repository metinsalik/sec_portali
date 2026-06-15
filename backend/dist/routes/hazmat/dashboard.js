"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
router.get('/', async (req, res) => {
    try {
        const facilityId = req.query.facilityId;
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
        const incidentTypesMap = {};
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
        const chemRiskDist = { 'Yüksek': 0, 'Orta': 0, 'Düşük': 0, 'Kabul Edilebilir': 0 };
        const bioRiskDist = { 'Yüksek': 0, 'Orta': 0, 'Düşük': 0, 'Kabul Edilebilir': 0 };
        eyewashAnalyses.forEach(ea => {
            if (ea.chemRiskLevel)
                chemRiskDist[ea.chemRiskLevel] = (chemRiskDist[ea.chemRiskLevel] || 0) + 1;
            if (ea.bioRiskLevel)
                bioRiskDist[ea.bioRiskLevel] = (bioRiskDist[ea.bioRiskLevel] || 0) + 1;
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
    }
    catch (error) {
        console.error('Error in hazmat dashboard metrics:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.default = router;
