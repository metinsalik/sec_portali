"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDashboardStats = getDashboardStats;
exports.getEmployeeTrend = getEmployeeTrend;
const client_1 = require("@prisma/client");
const isgCalculator_1 = require("./isgCalculator");
const prisma = new client_1.PrismaClient();
async function getDashboardStats() {
    const [facilities, professionals, assignments, fines] = await Promise.all([
        prisma.facility.findMany({
            where: { isActive: true },
            include: {
                assignments: {
                    where: { status: 'Aktif' },
                    include: { professional: true, employerRep: true },
                },
            },
        }),
        prisma.professional.findMany({ where: { isActive: true } }),
        prisma.assignment.findMany({ where: { status: 'Aktif' } }),
        prisma.administrativeFine.findFirst({
            where: { year: new Date().getFullYear() },
        }),
    ]);
    const penaltyAmounts = {
        iguPenalty: fines?.specialistAndPhysicianLess || 0,
        hekimPenalty: fines?.specialistAndPhysicianLess || 0,
        dspPenalty: fines?.dspVeryDangerous || 0,
    };
    const complianceResults = facilities.map((f) => {
        const activeAssignments = f.assignments;
        const iguAssignments = activeAssignments
            .filter((a) => a.type === 'IGU' && a.professional)
            .map((a) => ({
            durationMinutes: a.durationMinutes,
            isFullTime: a.isFullTime,
            titleClass: a.professional.titleClass,
        }));
        const hekimAssignments = activeAssignments
            .filter((a) => a.type === 'Hekim')
            .map((a) => ({ durationMinutes: a.durationMinutes, isFullTime: a.isFullTime }));
        const dspAssignments = activeAssignments
            .filter((a) => a.type === 'DSP')
            .map((a) => ({ durationMinutes: a.durationMinutes }));
        const vekilAssignments = activeAssignments
            .filter((a) => a.type === 'Vekil' && a.employerRep)
            .map((a) => ({ name: a.employerRep.fullName }));
        return (0, isgCalculator_1.analyzeFacilityCompliance)({
            facilityId: f.id,
            facilityName: f.name,
            dangerClass: f.dangerClass,
            employeeCount: f.employeeCount,
            iguAssignments,
            hekimAssignments,
            dspAssignments,
            vekilAssignments,
            penaltyAmounts,
        });
    });
    const totalEmployees = facilities.reduce((sum, f) => sum + f.employeeCount, 0);
    // 1. Ortalama Uyum Skoru (Daha hassas hesaplama: Her tesisin % uyumluluk ortalaması)
    const averageComplianceScore = facilities.length > 0
        ? complianceResults.reduce((sum, r) => {
            const iguScore = Math.min(100, r.igu.requiredMinutes > 0 ? (r.igu.assignedMinutes / r.igu.requiredMinutes) * 100 : 100);
            const hekimScore = Math.min(100, r.hekim.requiredMinutes > 0 ? (r.hekim.assignedMinutes / r.hekim.requiredMinutes) * 100 : 100);
            const dspScore = !r.dsp.required ? 100 : Math.min(100, r.dsp.requiredMinutes > 0 ? (r.dsp.assignedMinutes / r.dsp.requiredMinutes) * 100 : 0);
            return sum + ((iguScore + hekimScore + dspScore) / 3);
        }, 0) / facilities.length
        : 0;
    // 2. Aylık OSGB Maliyeti (Reconciliation logic ile senkronize edildi)
    const monthlyOsgbCost = assignments
        .filter((a) => a.costType === 'OSGB' && (a.unitPrice || (a.professionalId && professionals.find(p => p.id === a.professionalId)?.unitPrice)))
        .reduce((sum, a) => {
        const professional = a.professionalId ? professionals.find(p => p.id === a.professionalId) : null;
        const price = a.unitPrice || professional?.unitPrice || 0;
        if (a.isFullTime)
            return sum + price;
        // Kısmi süreli: Saate yuvarla
        const hours = Math.ceil(a.durationMinutes / 60);
        return sum + (hours * price);
    }, 0);
    const monthlyPenaltyRisk = complianceResults.reduce((sum, r) => sum + r.monthlyPenaltyRisk, 0);
    // 2026 Kümülatif Ceza Riski (Şu ana kadar olan aylar + gelecek aylar tahmini)
    const currentMonth = new Date().getMonth() + 1; // 1-12
    const cumulativePenaltyRisk2026 = monthlyPenaltyRisk * 12; // Basit projeksiyon
    // Sertifika Yenileme
    const upcomingCertificates = professionals
        .map((p) => ({
        id: p.id,
        fullName: p.fullName,
        certificateDate: p.certificateDate,
        status: (0, isgCalculator_1.getCertificateStatus)(p.certificateDate),
    }))
        .filter((p) => p.status.isWarning || p.status.isCritical || p.status.isExpired)
        .sort((a, b) => (a.status.daysLeft ?? 9999) - (b.status.daysLeft ?? 9999));
    // Kaynak Eksikleri
    const missingSpecialists = complianceResults.filter((r) => !r.igu.isCompliant);
    const missingDoctors = complianceResults.filter((r) => !r.hekim.isCompliant);
    const missingDsp = complianceResults.filter((r) => r.dsp.required && !r.dsp.isCompliant);
    // Şehir Detayları (İlçeler ve Tesisler)
    const cityDetails = facilities.reduce((acc, f) => {
        const city = f.city || 'Belirtilmemiş';
        if (!acc[city]) {
            acc[city] = {
                count: 0,
                districts: {},
            };
        }
        acc[city].count += 1;
        const district = f.district || 'Belirtilmemiş';
        if (!acc[city].districts[district]) {
            acc[city].districts[district] = { count: 0, facilities: [] };
        }
        acc[city].districts[district].count += 1;
        acc[city].districts[district].facilities.push({
            id: f.id,
            name: f.name,
            dangerClass: f.dangerClass,
            employeeCount: f.employeeCount,
        });
        return acc;
    }, {});
    return {
        kpis: {
            totalFacilities: facilities.length,
            totalEmployees,
            averageComplianceScore,
            monthlyOsgbCost,
            monthlyPenaltyRisk,
            cumulativePenaltyRisk2026,
        },
        upcomingCertificates,
        resourceGaps: {
            specialists: missingSpecialists,
            doctors: missingDoctors,
            dsp: missingDsp,
        },
        cityDistribution: Object.fromEntries(Object.entries(cityDetails).map(([city, data]) => [city, data.count])),
        cityDetails,
    };
}
async function getEmployeeTrend() {
    const history = await prisma.employeeCountHistory.findMany({
        orderBy: { effectiveDate: 'asc' },
    });
    const monthlyTrendData = [];
    // Tum tarihcelerden essiz y/ay listesini alip sirala
    const allMonths = Array.from(new Set(history.map(h => h.effectiveDate.toISOString().substring(0, 7)))).sort();
    const facilityCounts = {};
    let previousMonthTotalCount = null;
    allMonths.forEach(month => {
        // Sadece bu aya ait kayitlar
        const monthHistory = history.filter(h => h.effectiveDate.toISOString().substring(0, 7) === month);
        // Her tesisin bu aydaki son guncellenen sayisini al
        monthHistory.forEach(h => {
            facilityCounts[h.facilityId] = h.count;
        });
        // O ay itibariyle sistemde kayitli (ve daha once guncellenmis) TUM tesislerin toplam calisan sayisi
        const currentMonthTotalCount = Object.values(facilityCounts).reduce((acc, count) => acc + count, 0);
        let percentChange = null;
        if (previousMonthTotalCount !== null && previousMonthTotalCount > 0) {
            percentChange = ((currentMonthTotalCount - previousMonthTotalCount) / previousMonthTotalCount) * 100;
        }
        monthlyTrendData.push({
            month,
            totalCount: currentMonthTotalCount,
            percentChange
        });
        previousMonthTotalCount = currentMonthTotalCount;
    });
    return monthlyTrendData;
}
