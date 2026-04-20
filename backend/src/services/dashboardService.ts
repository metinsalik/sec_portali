import { PrismaClient } from '@prisma/client';
import { analyzeFacilityCompliance, getCertificateStatus } from './isgCalculator';

const prisma = new PrismaClient();

export async function getDashboardStats() {
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
        titleClass: a.professional!.titleClass,
      }));
    const hekimAssignments = activeAssignments
      .filter((a) => a.type === 'Hekim')
      .map((a) => ({ durationMinutes: a.durationMinutes, isFullTime: a.isFullTime }));
    const dspAssignments = activeAssignments
      .filter((a) => a.type === 'DSP')
      .map((a) => ({ durationMinutes: a.durationMinutes }));
    const vekilAssignments = activeAssignments
      .filter((a) => a.type === 'Vekil' && a.employerRep)
      .map((a) => ({ name: a.employerRep!.fullName }));

    return analyzeFacilityCompliance({
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
  const totalCompliant = complianceResults.filter((r) => r.overallCompliant).length;
  const averageComplianceScore = facilities.length > 0 ? (totalCompliant / facilities.length) * 100 : 0;

  const monthlyOsgbCost = assignments
    .filter((a) => a.costType === 'OSGB' && a.unitPrice)
    .reduce((sum, a) => sum + (a.unitPrice || 0), 0);

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
      status: getCertificateStatus(p.certificateDate),
    }))
    .filter((p) => p.status.isWarning || p.status.isCritical || p.status.isExpired)
    .sort((a, b) => (a.status.daysLeft ?? 9999) - (b.status.daysLeft ?? 9999));

  // Kaynak Eksikleri
  const missingSpecialists = complianceResults.filter((r) => !r.igu.isCompliant);
  const missingDoctors = complianceResults.filter((r) => !r.hekim.isCompliant);
  const missingDsp = complianceResults.filter((r) => r.dsp.required && !r.dsp.isCompliant);

  // Şehir Detayları (İlçeler ve Tesisler)
  const cityDetails = facilities.reduce((acc: any, f) => {
    const city = f.city || 'Belirtilmemiş';
    if (!acc[city]) {
      acc[city] = {
        count: 0,
        districts: {} as Record<string, { count: number; facilities: any[] }>,
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
    cityDistribution: Object.fromEntries(
      Object.entries(cityDetails).map(([city, data]: any) => [city, data.count])
    ),
    cityDetails,
  };
}

export async function getEmployeeTrend() {
  const history = await prisma.employeeCountHistory.findMany({
    orderBy: { effectiveDate: 'asc' },
  });

  // Ay bazında grupla
  const trend: Record<string, number> = {};
  history.forEach((h) => {
    const month = h.effectiveDate.toISOString().substring(0, 7); // YYYY-MM
    trend[month] = (trend[month] || 0) + h.count;
  });

  return Object.entries(trend).map(([month, count]) => ({ month, count }));
}
