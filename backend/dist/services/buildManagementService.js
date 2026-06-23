"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createProject = exports.checkProjectGate = exports.calculateRiskScoreAndLevel = exports.calculateICRAClass = void 0;
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
// ICRA Hesaplama Algoritması
const calculateICRAClass = (buildType, riskGroup) => {
    const matrix = {
        '1': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf II', 'D': 'Sınıf IV' },
        '2': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf III', 'D': 'Sınıf IV' },
        '3': { 'A': 'Sınıf I', 'B': 'Sınıf II', 'C': 'Sınıf IV', 'D': 'Sınıf IV' },
        '4': { 'A': 'Sınıf II', 'B': 'Sınıf IV', 'C': 'Sınıf IV', 'D': 'Sınıf IV' },
    };
    return matrix[riskGroup]?.[buildType] || 'Bilinmiyor';
};
exports.calculateICRAClass = calculateICRAClass;
// Risk Skoru ve Seviyesi Hesaplama
const calculateRiskScoreAndLevel = (data) => {
    let score = 0;
    if (data.patientCareProximity)
        score += 3;
    if (data.dustNoiseVibration)
        score += 3;
    if (data.criticalAreaAffected)
        score += 4;
    if (data.hvacAffected)
        score += 3;
    if (data.medicalGasAffected)
        score += 3;
    if (data.fireSafetyAffected)
        score += 3;
    if (data.powerOutageRisk)
        score += 3;
    if (data.waterLeakRisk)
        score += 3;
    let level = 'Düşük Risk';
    if (score >= 16)
        level = 'Kritik Risk';
    else if (score >= 10)
        level = 'Yüksek Risk';
    else if (score >= 5)
        level = 'Orta Risk';
    return { score, level };
};
exports.calculateRiskScoreAndLevel = calculateRiskScoreAndLevel;
// Onay Kapısı (Gate Check) Kontrolü
const checkProjectGate = async (projectId) => {
    const project = await prisma.buildProject.findUnique({
        where: { id: projectId },
        include: {
            designForm: true,
            riskAssessment: true,
            documents: true,
            approvals: true,
            handover: true,
            findings: { include: { actions: true } }
        }
    });
    if (!project)
        return { success: false, message: 'Proje bulunamadı' };
    const startRequirements = [
        { name: 'Tasarım / Geliştirme Formu', isMet: !!project.designForm },
        { name: 'İnşaat Öncesi Risk Değerlendirmesi', isMet: !!project.riskAssessment },
        { name: 'ENF-F15-02 Başlangıç Onayı (Evrak)', isMet: project.documents.some(d => d.documentType === 'ENF-F15-02' && d.status === 'Onaylandı') },
        { name: 'Teknik Hizmetler Onayı', isMet: project.approvals.some(a => a.approvalType === 'Teknik Hizmetler' && a.status === 'Onaylandı') },
        { name: 'İSG Uzmanı Onayı', isMet: project.approvals.some(a => a.approvalType === 'İSG Uzmanı' && a.status === 'Onaylandı') },
        { name: 'Enfeksiyon Kontrol Onayı', isMet: project.approvals.some(a => a.approvalType === 'Enfeksiyon Kontrol' && a.status === 'Onaylandı') },
        { name: 'Yangın Güvenliği Onayı', isMet: project.approvals.some(a => a.approvalType === 'Yangın Güvenliği' && a.status === 'Onaylandı') }
    ];
    const canStart = startRequirements.every(req => req.isMet);
    // Handover Check
    const handoverRequirements = [
        { name: 'Kritik Açık Aksiyon Yok', isMet: !project.findings.some(f => f.actions.some(a => a.status === 'Açık' && a.riskLevel === 'Kritik')) },
        { name: 'ENF-F76-00 Final Onayı (Evrak)', isMet: project.documents.some(d => d.documentType === 'ENF-F76-00' && d.status === 'Onaylandı') },
        { name: 'Teslim Alma Kontrolleri (Handover Modeli)', isMet: project.handover?.status === 'Onaylandı' }
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
exports.checkProjectGate = checkProjectGate;
const createProject = async (data, createdById) => {
    const icraClass = (0, exports.calculateICRAClass)(data.buildType, data.riskGroup);
    return await prisma.buildProject.create({
        data: {
            ...data,
            icraClass,
            createdById
        }
    });
};
exports.createProject = createProject;
