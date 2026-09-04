"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../../middleware/auth");
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
const router = express_1.default.Router();
// Helper to check facility access
async function checkFacilityAccess(req, facilityId) {
    const user = req.user;
    if (!user)
        return false;
    if (user.isAdmin || user.isManagement)
        return true;
    const access = await prisma.userFacility.findUnique({
        where: {
            username_facilityId: {
                username: user.username,
                facilityId: facilityId
            }
        }
    });
    return !!access;
}
const LEVEL_ORDER = [
    'Tolere Gösterilmez Risk',
    'Yüksek Risk',
    'Önemli Risk',
    'Olası Risk',
    'Önemsiz Risk'
];
// GET /api/risks/reports/executive/all-facilities
router.get('/executive/all-facilities', auth_1.authMiddleware, async (req, res) => {
    try {
        const user = req.user;
        if (!user)
            return res.status(401).json({ error: 'Yetkisiz erişim.' });
        if (!user.isAdmin && !user.isManagement) {
            return res.status(403).json({ error: 'Bu alana yalnızca yönetim ve admin yetkisine sahip kullanıcılar erişebilir.' });
        }
        // 1. Tüm aktif tesisleri getir
        const facilities = await prisma.facility.findMany({
            orderBy: { name: 'asc' },
            select: {
                id: true,
                name: true,
                city: true,
                dangerClass: true,
                locations: {
                    select: {
                        id: true,
                        name: true,
                        department: true,
                        building: true,
                        floor: true
                    }
                }
            }
        });
        // 2. Tüm riskleri konum bilgisiyle çek
        const allRisks = await prisma.riskLifecycle.findMany({
            include: {
                location: {
                    select: {
                        id: true,
                        name: true,
                        department: true,
                        facilityId: true,
                    }
                }
            },
            orderBy: { detectionDate: 'desc' }
        });
        // 3. Tesis bazlı veri gruplaması
        const facilityMap = {};
        facilities.forEach(f => {
            facilityMap[f.id] = {
                id: f.id,
                name: f.name,
                city: f.city || 'Belirtilmemiş',
                dangerClass: f.dangerClass || 'Tehlikeli',
                totalRisks: 0,
                activeHazards: 0,
                inProgress: 0,
                closedRisks: 0,
                criticalRisks: 0,
                initialScoreSum: 0,
                finalScoreSum: 0,
                scoredCount: 0,
                categories: {},
                levels: {
                    'Tolere Gösterilmez Risk': 0,
                    'Yüksek Risk': 0,
                    'Önemli Risk': 0,
                    'Olası Risk': 0,
                    'Önemsiz Risk': 0
                }
            };
        });
        // Grup geneli kategori ve seviye haritası
        const groupCategories = {};
        const groupLevels = {};
        LEVEL_ORDER.forEach(lvl => {
            groupLevels[lvl] = { name: lvl, initial: 0, final: 0 };
        });
        let groupTotalInitialScore = 0;
        let groupTotalFinalScore = 0;
        let groupScoredCount = 0;
        allRisks.forEach((risk) => {
            const facId = risk.location?.facilityId;
            const st = risk.status || 'ACIK_TEHLIKE';
            const initLvl = risk.initialLevel || 'Bilinmiyor';
            const finLvl = risk.finalLevel || (st === 'KAPATILDI_GUVENLI' ? 'Önemsiz Risk' : initLvl);
            const cat = risk.riskCategory || 'Genel';
            const initScore = Number(risk.initialScore) || 0;
            const finScore = risk.finalScore !== null && risk.finalScore !== undefined ? Number(risk.finalScore) : (st === 'KAPATILDI_GUVENLI' ? 1 : initScore);
            // Grup geneli
            if (groupLevels[initLvl])
                groupLevels[initLvl].initial += 1;
            if (groupLevels[finLvl])
                groupLevels[finLvl].final += 1;
            if (!groupCategories[cat]) {
                groupCategories[cat] = { name: cat, total: 0, closed: 0, critical: 0 };
            }
            groupCategories[cat].total += 1;
            if (st === 'KAPATILDI_GUVENLI')
                groupCategories[cat].closed += 1;
            if (initLvl === 'Tolere Gösterilmez Risk' || initLvl === 'Yüksek Risk')
                groupCategories[cat].critical += 1;
            groupTotalInitialScore += initScore;
            groupTotalFinalScore += finScore;
            groupScoredCount++;
            // Tesis özeli
            if (facId && facilityMap[facId]) {
                const fac = facilityMap[facId];
                fac.totalRisks += 1;
                fac.initialScoreSum += initScore;
                fac.finalScoreSum += finScore;
                fac.scoredCount += 1;
                if (st === 'ACIK_TEHLIKE')
                    fac.activeHazards += 1;
                else if (st === 'KAPATILDI_GUVENLI')
                    fac.closedRisks += 1;
                else
                    fac.inProgress += 1;
                if (initLvl === 'Tolere Gösterilmez Risk' || initLvl === 'Yüksek Risk') {
                    fac.criticalRisks += 1;
                }
                if (fac.levels[initLvl] !== undefined) {
                    fac.levels[initLvl] += 1;
                }
                fac.categories[cat] = (fac.categories[cat] || 0) + 1;
            }
        });
        // Tesis listesi ve performans oranları
        const facilitySummaries = Object.values(facilityMap).map(f => {
            const resolutionRate = f.totalRisks > 0 ? Math.round((f.closedRisks / f.totalRisks) * 100) : 0;
            const avgScore = f.totalRisks > 0 ? Math.round(f.initialScoreSum / f.totalRisks) : 0;
            const avgFinal = f.scoredCount > 0 ? Math.round(f.finalScoreSum / f.scoredCount) : avgScore;
            const improvementRate = avgScore > 0 ? Math.max(0, Math.round(((avgScore - avgFinal) / avgScore) * 100)) : 0;
            return {
                ...f,
                resolutionRate,
                avgScore,
                avgFinal,
                improvementRate
            };
        }).sort((a, b) => b.totalRisks - a.totalRisks);
        // Grup Geneli Özet
        const totalGroupRisks = allRisks.length;
        const totalGroupClosed = allRisks.filter(r => r.status === 'KAPATILDI_GUVENLI').length;
        const totalGroupActive = allRisks.filter(r => r.status === 'ACIK_TEHLIKE').length;
        const totalGroupInProgress = totalGroupRisks - totalGroupClosed - totalGroupActive;
        const totalGroupCritical = (groupLevels['Tolere Gösterilmez Risk']?.initial || 0) + (groupLevels['Yüksek Risk']?.initial || 0);
        const groupResolutionRate = totalGroupRisks > 0 ? Math.round((totalGroupClosed / totalGroupRisks) * 100) : 0;
        const avgGroupInitialScore = totalGroupRisks > 0 ? Math.round(groupTotalInitialScore / totalGroupRisks) : 0;
        const avgGroupFinalScore = groupScoredCount > 0 ? Math.round(groupTotalFinalScore / groupScoredCount) : avgGroupInitialScore;
        const groupImprovementRate = avgGroupInitialScore > 0 ? Math.max(0, Math.round(((avgGroupInitialScore - avgGroupFinalScore) / avgGroupInitialScore) * 100)) : 0;
        // En başarılı ve en riskli tesis
        const activeFacilitiesWithRisks = facilitySummaries.filter(f => f.totalRisks > 0);
        const mostCriticalFacility = activeFacilitiesWithRisks.length > 0
            ? [...activeFacilitiesWithRisks].sort((a, b) => b.criticalRisks - a.criticalRisks)[0]
            : null;
        const highestResolutionFacility = activeFacilitiesWithRisks.length > 0
            ? [...activeFacilitiesWithRisks].sort((a, b) => b.resolutionRate - a.resolutionRate)[0]
            : null;
        res.json({
            groupSummary: {
                totalFacilities: facilities.length,
                activeFacilitiesCount: activeFacilitiesWithRisks.length,
                totalRisks: totalGroupRisks,
                closedRisks: totalGroupClosed,
                activeHazards: totalGroupActive,
                inProgress: totalGroupInProgress,
                criticalRisks: totalGroupCritical,
                resolutionRate: groupResolutionRate,
                avgInitialScore: avgGroupInitialScore,
                avgFinalScore: avgGroupFinalScore,
                improvementRate: groupImprovementRate,
                mostCriticalFacility: mostCriticalFacility ? { id: mostCriticalFacility.id, name: mostCriticalFacility.name, count: mostCriticalFacility.criticalRisks } : null,
                highestResolutionFacility: highestResolutionFacility ? { id: highestResolutionFacility.id, name: highestResolutionFacility.name, rate: highestResolutionFacility.resolutionRate } : null,
            },
            facilitySummaries,
            groupCategories: Object.values(groupCategories).sort((a, b) => b.total - a.total),
            groupLevels: LEVEL_ORDER.map(l => groupLevels[l])
        });
    }
    catch (error) {
        console.error('Executive facilities reports error:', error);
        res.status(500).json({ error: 'Tüm tesisler analitiği alınırken hata oluştu.' });
    }
});
// GET /api/risks/reports
router.get('/', auth_1.authMiddleware, async (req, res) => {
    try {
        const { facilityId, startDate, endDate, statuses, category, department } = req.query;
        if (!facilityId) {
            return res.status(400).json({ error: 'facilityId zorunludur.' });
        }
        const hasAccess = await checkFacilityAccess(req, facilityId);
        if (!hasAccess) {
            return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
        }
        const whereClause = {
            location: { facilityId },
        };
        if (startDate || endDate) {
            const dateFilter = {};
            if (startDate)
                dateFilter.gte = new Date(startDate);
            if (endDate)
                dateFilter.lte = new Date(endDate);
            whereClause.detectionDate = dateFilter;
        }
        if (statuses) {
            const statusList = statuses.split(',');
            if (statusList.length > 0 && !statusList.includes('ALL')) {
                whereClause.status = { in: statusList };
            }
        }
        if (category && category !== 'ALL') {
            whereClause.riskCategory = category;
        }
        if (department && department !== 'ALL') {
            whereClause.location = {
                ...whereClause.location,
                OR: [
                    { department: department },
                    { name: department }
                ]
            };
        }
        const risks = await prisma.riskLifecycle.findMany({
            where: whereClause,
            include: {
                location: true,
            },
            orderBy: { detectionDate: 'desc' }
        });
        // 1. Statü Gruplaması
        const byStatusMap = {
            'ACIK_TEHLIKE': 0,
            'ILK_MUDAHALE_EDILDI': 0,
            'TAKIP_SURECINDE': 0,
            'KAPATILDI_GUVENLI': 0,
        };
        // 2. Risk Seviyesi (Başlangıç vs Son Durum)
        const initialLevelsMap = {};
        const finalLevelsMap = {};
        LEVEL_ORDER.forEach(l => {
            initialLevelsMap[l] = 0;
            finalLevelsMap[l] = 0;
        });
        // 3. Departman Bazlı Risk Puanları & Sayıları
        const byDepartmentMap = {};
        // 4. Kategori Bazlı Dağılım
        const byCategoryMap = {};
        // 5. Tarihsel Trend (Aylık Tespit vs Kapatma)
        const monthlyTrendMap = {};
        // 6. Sorumlu Performansı
        const responsibleMap = {};
        let totalInitialScore = 0;
        let totalFinalScore = 0;
        let scoredFinalCount = 0;
        risks.forEach((risk) => {
            // Statü
            const st = risk.status || 'ACIK_TEHLIKE';
            byStatusMap[st] = (byStatusMap[st] || 0) + 1;
            // Seviye
            const initLvl = risk.initialLevel || 'Bilinmiyor';
            initialLevelsMap[initLvl] = (initialLevelsMap[initLvl] || 0) + 1;
            const finLvl = risk.finalLevel || (risk.status === 'KAPATILDI_GUVENLI' ? 'Önemsiz Risk' : initLvl);
            finalLevelsMap[finLvl] = (finalLevelsMap[finLvl] || 0) + 1;
            // Skor toplama
            const initScore = Number(risk.initialScore) || 0;
            totalInitialScore += initScore;
            if (risk.finalScore !== null && risk.finalScore !== undefined) {
                totalFinalScore += Number(risk.finalScore);
                scoredFinalCount++;
            }
            else if (risk.status === 'KAPATILDI_GUVENLI') {
                totalFinalScore += 1;
                scoredFinalCount++;
            }
            else {
                totalFinalScore += initScore;
                scoredFinalCount++;
            }
            // Departman
            const deptName = risk.location?.department || risk.location?.name || 'Genel';
            if (!byDepartmentMap[deptName]) {
                byDepartmentMap[deptName] = { total: 0, critical: 0, closed: 0, totalScore: 0 };
            }
            byDepartmentMap[deptName].total += 1;
            byDepartmentMap[deptName].totalScore += initScore;
            if (initLvl === 'Tolere Gösterilmez Risk' || initLvl === 'Yüksek Risk') {
                byDepartmentMap[deptName].critical += 1;
            }
            if (st === 'KAPATILDI_GUVENLI') {
                byDepartmentMap[deptName].closed += 1;
            }
            // Kategori
            const cat = risk.riskCategory || 'Genel';
            if (!byCategoryMap[cat]) {
                byCategoryMap[cat] = { total: 0, closed: 0, initialScoreSum: 0, finalScoreSum: 0 };
            }
            byCategoryMap[cat].total += 1;
            byCategoryMap[cat].initialScoreSum += initScore;
            byCategoryMap[cat].finalScoreSum += (risk.finalScore ? Number(risk.finalScore) : initScore);
            if (st === 'KAPATILDI_GUVENLI') {
                byCategoryMap[cat].closed += 1;
            }
            // Tarihsel Trend (Tespit Tarihi)
            if (risk.detectionDate) {
                const d = new Date(risk.detectionDate);
                if (!isNaN(d.getTime())) {
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (!monthlyTrendMap[monthKey]) {
                        const trMonth = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
                        monthlyTrendMap[monthKey] = { month: trMonth, detected: 0, closed: 0 };
                    }
                    monthlyTrendMap[monthKey].detected += 1;
                }
            }
            // Kapanma/Aksiyon Tarihi
            if (st === 'KAPATILDI_GUVENLI' && (risk.actionDate || risk.updatedAt)) {
                const d = new Date(risk.actionDate || risk.updatedAt);
                if (!isNaN(d.getTime())) {
                    const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                    if (!monthlyTrendMap[monthKey]) {
                        const trMonth = d.toLocaleDateString('tr-TR', { month: 'short', year: '2-digit' });
                        monthlyTrendMap[monthKey] = { month: trMonth, detected: 0, closed: 0 };
                    }
                    monthlyTrendMap[monthKey].closed += 1;
                }
            }
            // Sorumlu
            const resp = (risk.improvementResponsible || risk.controlResponsible || 'Atanmamış').trim();
            const cleanResp = resp.split('\n')[0].replace(/\r/g, '').trim();
            if (!responsibleMap[cleanResp]) {
                responsibleMap[cleanResp] = { total: 0, closed: 0, pending: 0 };
            }
            responsibleMap[cleanResp].total += 1;
            if (st === 'KAPATILDI_GUVENLI') {
                responsibleMap[cleanResp].closed += 1;
            }
            else {
                responsibleMap[cleanResp].pending += 1;
            }
        });
        const totalRisks = risks.length;
        const closedRisks = byStatusMap['KAPATILDI_GUVENLI'] || 0;
        const activeHazards = (byStatusMap['ACIK_TEHLIKE'] || 0);
        const inProgress = (byStatusMap['ILK_MUDAHALE_EDILDI'] || 0) + (byStatusMap['TAKIP_SURECINDE'] || 0);
        const criticalRisks = (initialLevelsMap['Tolere Gösterilmez Risk'] || 0) + (initialLevelsMap['Yüksek Risk'] || 0);
        const resolutionRate = totalRisks > 0 ? Math.round((closedRisks / totalRisks) * 100) : 0;
        const avgInitialScore = totalRisks > 0 ? Math.round(totalInitialScore / totalRisks) : 0;
        const avgFinalScore = scoredFinalCount > 0 ? Math.round(totalFinalScore / scoredFinalCount) : avgInitialScore;
        const riskReductionRate = avgInitialScore > 0 ? Math.max(0, Math.round(((avgInitialScore - avgFinalScore) / avgInitialScore) * 100)) : 0;
        // Seviye Karşılaştırma Grafiği için (Before vs After)
        const levelComparison = LEVEL_ORDER.map(level => ({
            name: level,
            displayName: level.replace(' Risk', ''),
            initial: initialLevelsMap[level] || 0,
            final: finalLevelsMap[level] || 0,
        }));
        // Aylık Trend Listesi
        const monthlyTrend = Object.keys(monthlyTrendMap)
            .sort()
            .slice(-12)
            .map(k => monthlyTrendMap[k]);
        // Departman listesi
        const departmentsList = Object.keys(byDepartmentMap).map(dept => ({
            name: dept,
            total: byDepartmentMap[dept].total,
            critical: byDepartmentMap[dept].critical,
            closed: byDepartmentMap[dept].closed,
            avgScore: Math.round(byDepartmentMap[dept].totalScore / byDepartmentMap[dept].total),
            rate: Math.round((byDepartmentMap[dept].closed / byDepartmentMap[dept].total) * 100)
        })).sort((a, b) => b.total - a.total);
        // Kategori Dağılımı
        const categoriesList = Object.keys(byCategoryMap).map(cat => ({
            name: cat,
            total: byCategoryMap[cat].total,
            closed: byCategoryMap[cat].closed,
            efficiency: byCategoryMap[cat].initialScoreSum > 0
                ? Math.round(((byCategoryMap[cat].initialScoreSum - byCategoryMap[cat].finalScoreSum) / byCategoryMap[cat].initialScoreSum) * 100)
                : 0
        })).sort((a, b) => b.total - a.total);
        // Sorumlu Performans Listesi
        const responsiblesList = Object.keys(responsibleMap).map(resp => ({
            name: resp,
            total: responsibleMap[resp].total,
            closed: responsibleMap[resp].closed,
            pending: responsibleMap[resp].pending,
            rate: Math.round((responsibleMap[resp].closed / responsibleMap[resp].total) * 100)
        })).sort((a, b) => b.total - a.total).slice(0, 10);
        const mappedRisks = risks.map(r => ({
            ...r,
            departmentId: r.locationId,
            department: r.location ? { id: r.location.id, name: r.location.department || r.location.name || 'Bölüm' } : null
        }));
        res.json({
            risks: mappedRisks,
            summary: {
                totalRisks,
                closedRisks,
                activeHazards,
                inProgress,
                criticalRisks,
                resolutionRate,
                avgInitialScore,
                avgFinalScore,
                riskReductionRate
            },
            analysis: {
                byStatus: Object.keys(byStatusMap).map(name => ({ name, value: byStatusMap[name] })),
                levelComparison,
                monthlyTrend,
                departments: departmentsList,
                categories: categoriesList,
                responsibles: responsiblesList
            }
        });
    }
    catch (error) {
        console.error('Risk reports fetch error:', error);
        res.status(500).json({ error: 'Rapor alınırken hata oluştu.' });
    }
});
exports.default = router;
