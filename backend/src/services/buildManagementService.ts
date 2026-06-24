import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// ICRA Hesaplama Algoritması
export const calculateICRAClass = (buildType: string, riskGroup: string): string => {
  const matrix: Record<string, Record<string, string>> = {
    '1': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf II', 'D': 'Sınıf IV' },
    '2': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf III', 'D': 'Sınıf IV' },
    '3': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf IV', 'D': 'Sınıf IV' },
    '4': { 'A': 'Sınıf II', 'B': 'Sınıf IV', 'C': 'Sınıf IV', 'D': 'Sınıf IV' },
  };

  return matrix[riskGroup]?.[buildType] || 'Bilinmiyor';
};

// Risk Skoru ve Seviyesi Hesaplama
export const calculateRiskScoreAndLevel = (data: any) => {
  let score = 0;
  
  if (data.matrixData && Array.isArray(data.matrixData)) {
    data.matrixData.forEach((item: any) => {
      const itemScore = (item.likelihood || 0) * (item.severity || 0);
      if (itemScore > score) {
        score = itemScore;
      }
    });
  } else {
    // Fallback for old boolean logic
    if (data.patientCareProximity) score += 3;
    if (data.dustNoiseVibration) score += 3;
    if (data.criticalAreaAffected) score += 4;
    if (data.hvacAffected) score += 3;
    if (data.medicalGasAffected) score += 3;
    if (data.fireSafetyAffected) score += 3;
    if (data.powerOutageRisk) score += 3;
    if (data.waterLeakRisk) score += 3;
  }

  let level = 'Düşük Risk';
  if (score >= 17) level = 'Kritik Risk';
  else if (score >= 10) level = 'Yüksek Risk';
  else if (score >= 5) level = 'Orta Risk';

  return { score, level };
};

// Onay Kapısı (Gate Check) Kontrolü
export const checkProjectGate = async (projectId: string) => {
  const project = await prisma.buildProject.findUnique({
    where: { id: projectId },
    include: {
      designForm: true,
      riskAssessment: true,
      documents: true,
      approvals: true,
      handover: true,
      findings: { include: { actions: true } },
      inspectionsOHS: true,
      inspectionsInfection: true,
      handoverOHSInspections: true,
      handoverInfectionInspections: true
    }
  });

  if (!project) return { success: false, message: 'Proje bulunamadı' };

  const startRequirements = [
    { name: 'Hizmet Tasarım Formu', isMet: !!project.designForm },
    { name: 'İnşaat Öncesi Risk Değerlendirmesi (PCRA)', isMet: !!project.riskAssessment && 
        (
          (project.riskAssessment.matrixData && Array.isArray(project.riskAssessment.matrixData) && project.riskAssessment.matrixData.length > 0) || 
          !!project.riskAssessment.contractorCompliance
        ) 
    },
    { name: 'Yüklenici Evrakları', isMet: project.documents && project.documents.length > 0 && project.documents.every(d => d.status === 'Onaylandı') },
    { name: 'Onay ve İzinler', isMet: project.approvals && project.approvals.length > 0 && project.approvals.every(a => a.status === 'Onaylandı') }
  ];

  const canStart = startRequirements.every(req => req.isMet);

  // Handover Check
  const handoverRequirements = [
    { name: 'Kritik Açık Aksiyon Yok', isMet: !project.findings.some(f => f.actions.some(a => a.status === 'Açık' && a.riskLevel === 'Kritik')) },
    { name: 'Saha Denetimleri', isMet: (project.inspectionsOHS && project.inspectionsOHS.length > 0) || (project.inspectionsInfection && project.inspectionsInfection.length > 0) },
    { name: 'Teslim Alma ve Rapor', isMet: (project.handoverOHSInspections && project.handoverOHSInspections.length > 0) && (project.handoverInfectionInspections && project.handoverInfectionInspections.length > 0) }
  ];

  const canHandover = handoverRequirements.every(req => req.isMet);

  return {
    projectId,
    canStart,
    startRequirements,
    canHandover,
    handoverRequirements
  };
};

export const createProject = async (data: any, createdById: string) => {
  const icraClass = calculateICRAClass(data.buildType, data.riskGroup);
  
  return await prisma.buildProject.create({
    data: {
      ...data,
      icraClass,
      createdById
    }
  });
};
