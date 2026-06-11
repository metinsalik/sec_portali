"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const client_1 = require("@prisma/client");
const auth_1 = require("../middleware/auth");
const isgCalculator_1 = require("../services/isgCalculator");
const date_fns_1 = require("date-fns"); // Import format for date operations
const dashboardService_1 = require("../services/dashboardService");
const reconciliationService_1 = require("../services/reconciliationService");
const router = (0, express_1.Router)();
const prisma = new client_1.PrismaClient();
router.use(auth_1.authMiddleware);
router.use(auth_1.managementMiddleware);
/**
 * Profesyonel için kullanıcı kaydı oluşturur veya günceller
 */
async function syncUserForProfessional(professional, username) {
    if (!username)
        return;
    const normalizedUsername = username.toLowerCase().trim();
    // Rol belirleme
    let roleName = 'user';
    if (professional.titleClass.includes('IGU'))
        roleName = 'safety';
    else if (professional.titleClass === 'İşyeri Hekimi')
        roleName = 'doctor';
    else if (professional.titleClass === 'DSP')
        roleName = 'dsp';
    const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName }
    });
    await prisma.user.upsert({
        where: { username: normalizedUsername },
        update: {
            fullName: professional.fullName,
            email: professional.email,
            phone: professional.phone,
            employmentType: professional.employmentType,
            osgbName: professional.osgbName,
            title: professional.titleClass,
            isActive: professional.isActive,
        },
        create: {
            username: normalizedUsername,
            fullName: professional.fullName,
            email: professional.email,
            phone: professional.phone,
            employmentType: professional.employmentType,
            osgbName: professional.osgbName,
            title: professional.titleClass,
            isActive: professional.isActive,
            roles: {
                create: { roleId: role.id }
            }
        }
    });
}
/**
 * İşveren Vekili için kullanıcı kaydı oluşturur veya günceller
 */
async function syncUserForEmployerRep(employerRep, username) {
    if (!username)
        return;
    const normalizedUsername = username.toLowerCase().trim();
    const roleName = 'user';
    const role = await prisma.role.upsert({
        where: { name: roleName },
        update: {},
        create: { name: roleName }
    });
    await prisma.user.upsert({
        where: { username: normalizedUsername },
        update: {
            fullName: employerRep.fullName,
            email: employerRep.email,
            phone: employerRep.phone,
            title: employerRep.title || 'İşveren Vekili',
            isActive: employerRep.isActive,
        },
        create: {
            username: normalizedUsername,
            fullName: employerRep.fullName,
            email: employerRep.email,
            phone: employerRep.phone,
            title: employerRep.title || 'İşveren Vekili',
            isActive: employerRep.isActive,
            roles: {
                create: { roleId: role.id }
            }
        }
    });
}
// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD KPI
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req, res) => {
    try {
        const [stats, trend] = await Promise.all([
            (0, dashboardService_1.getDashboardStats)(),
            (0, dashboardService_1.getEmployeeTrend)(),
        ]);
        res.json({
            ...stats,
            employeeTrend: trend,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Dashboard verileri getirilemedi.' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// TESİS LİSTESİ (atama odaklı görünüm)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/facilities', async (req, res) => {
    try {
        const facilities = await prisma.facility.findMany({
            where: { isActive: true },
            include: {
                assignments: {
                    where: { status: 'Aktif' },
                    include: { professional: true },
                },
                buildings: true,
            },
            orderBy: { name: 'asc' },
        });
        res.json(facilities);
    }
    catch {
        res.status(500).json({ error: 'Tesisler getirilemedi.' });
    }
});
// Tesis uyumluluk analizi
router.get('/facilities/:id/compliance', async (req, res) => {
    try {
        const facility = await prisma.facility.findUnique({
            where: { id: String(req.params.id) },
            include: {
                assignments: {
                    where: { status: 'Aktif' },
                    include: { professional: true, employerRep: true }, // Include employerRep
                },
            },
        });
        if (!facility)
            return res.status(404).json({ error: 'Tesis bulunamadı.' });
        const dangerClass = facility.dangerClass ?? 'Az Tehlikeli';
        const employeeCount = facility.employeeCount ?? 0;
        const activeAssignments = facility.assignments;
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
            .map((a) => ({ name: a.employerRep.fullName })); // Add vekilAssignments
        const result = (0, isgCalculator_1.analyzeFacilityCompliance)({
            facilityId: facility.id,
            facilityName: facility.name,
            dangerClass,
            employeeCount,
            iguAssignments,
            hekimAssignments,
            dspAssignments,
            vekilAssignments, // Pass vekilAssignments
        }); // Closing the analyzeFacilityCompliance call
        res.json(result);
    }
    catch (error) {
        console.error('Facility Compliance Error:', error);
        res.status(500).json({ error: 'Uyumluluk analizi yapılamadı.' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// PROFESYONELLER
// ─────────────────────────────────────────────────────────────────────────────
router.get('/professionals', async (req, res) => {
    try {
        const { archived } = req.query;
        const professionals = await prisma.professional.findMany({
            where: { isActive: archived === 'true' ? false : true },
            include: {
                assignments: {
                    where: { status: 'Aktif' },
                    include: { facility: true },
                },
            },
            orderBy: { fullName: 'asc' },
        });
        // Her profesyonele sertifika durumu ekle
        const enriched = professionals.map((p) => ({
            ...p,
            certificateStatus: (0, isgCalculator_1.getCertificateStatus)(p.certificateDate),
        }));
        res.json(enriched);
    }
    catch {
        res.status(500).json({ error: 'Profesyoneller getirilemedi.' });
    }
});
router.post('/professionals', async (req, res) => {
    const { fullName, employmentType, osgbName, titleClass, certificateNo, certificateDate, phone, email, unitPrice, username } = req.body;
    if (!fullName || !employmentType || !titleClass) {
        return res.status(400).json({ error: 'Ad soyad, istihdam tipi ve sınıf/unvan zorunludur.' });
    }
    try {
        const professional = await prisma.professional.create({
            data: {
                fullName,
                employmentType,
                osgbName,
                titleClass,
                certificateNo,
                certificateDate: certificateDate ? new Date(certificateDate) : null,
                phone,
                email,
                unitPrice: unitPrice ? parseFloat(unitPrice) : null,
                username: username?.toLowerCase().trim() || null,
            },
        });
        if (username) {
            await syncUserForProfessional(professional, username);
        }
        res.status(201).json(professional);
    }
    catch (error) {
        console.error('Professional Create Error:', error);
        res.status(500).json({ error: 'Profesyonel oluşturulamadı.' });
    }
});
router.put('/professionals/:id', async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { fullName, employmentType, osgbName, titleClass, certificateNo, certificateDate, phone, email, unitPrice, username } = req.body;
    try {
        const professional = await prisma.professional.update({
            where: { id },
            data: {
                fullName,
                employmentType,
                osgbName,
                titleClass,
                certificateNo,
                certificateDate: certificateDate ? new Date(certificateDate) : null,
                phone,
                email,
                unitPrice: unitPrice ? parseFloat(unitPrice) : null,
                username: username?.toLowerCase().trim() || null,
            },
        });
        if (username) {
            await syncUserForProfessional(professional, username);
        }
        res.json(professional);
    }
    catch (error) {
        console.error('Professional Update Error:', error);
        res.status(500).json({ error: 'Profesyonel güncellenemedi.' });
    }
});
router.post('/professionals/:id/archive', async (req, res) => {
    const id = parseInt(String(req.params.id));
    try {
        // Aktif atamalarını sonlandır
        await prisma.assignment.updateMany({
            where: { professionalId: id, status: 'Aktif' },
            data: { status: 'Sona Erdi', endDate: new Date() },
        });
        const professional = await prisma.professional.update({
            where: { id },
            data: { isActive: false },
        });
        res.json(professional);
    }
    catch {
        res.status(500).json({ error: 'Profesyonel arşivlenemedi.' });
    }
});
// Tek profesyonel detay (Yaşam Kartı)
router.get('/professionals/:id', async (req, res) => {
    const id = parseInt(String(req.params.id));
    try {
        const professional = await prisma.professional.findUnique({
            where: { id },
            include: {
                assignments: {
                    include: { facility: true },
                    orderBy: { startDate: 'desc' },
                },
            },
        });
        if (!professional)
            return res.status(404).json({ error: 'Profesyonel bulunamadı.' });
        // Sertifika durumu
        const certificateStatus = (0, isgCalculator_1.getCertificateStatus)(professional.certificateDate);
        // Aktivite loglarını bul (ProfessionalId veya Email üzerinden User eşleştirmesi ile)
        let activityLogs = await prisma.activityLog.findMany({
            where: { professionalId: id },
            include: { facility: true },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });
        if (activityLogs.length === 0 && professional.email) {
            const user = await prisma.user.findFirst({
                where: { email: professional.email },
            });
            if (user) {
                activityLogs = await prisma.activityLog.findMany({
                    where: { username: user.username },
                    include: { facility: true },
                    orderBy: { createdAt: 'desc' },
                    take: 50,
                });
            }
        }
        res.json({
            ...professional,
            certificateStatus,
            activityLogs,
        });
    }
    catch (error) {
        console.error('Professional Detail Error:', error);
        res.status(500).json({ error: 'Profesyonel detayları getirilemedi.' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// OSGB FİRMALARI
// ─────────────────────────────────────────────────────────────────────────────
router.get('/osgb', async (req, res) => {
    try {
        const companies = await prisma.oSGBCompany.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' },
        });
        res.json(companies);
    }
    catch {
        res.status(500).json({ error: 'OSGB firmaları getirilemedi.' });
    }
});
router.post('/osgb', async (req, res) => {
    const { name, contact, phone, email, city, district } = req.body;
    if (!name)
        return res.status(400).json({ error: 'Firma adı zorunludur.' });
    try {
        const company = await prisma.oSGBCompany.create({ data: { name, contact, phone, email, city, district } });
        res.status(201).json(company);
    }
    catch {
        res.status(500).json({ error: 'OSGB firması oluşturulamadı.' });
    }
});
router.put('/osgb/:id', async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { name, contact, phone, email, city, district, isActive } = req.body;
    try {
        const company = await prisma.oSGBCompany.update({
            where: { id },
            data: { name, contact, phone, email, city, district, isActive },
        });
        res.json(company);
    }
    catch {
        res.status(500).json({ error: 'OSGB firması güncellenemedi.' });
    }
});
// OSGB Detay (Yaşam Kartı)
router.get('/osgb/:id', async (req, res) => {
    const id = parseInt(String(req.params.id));
    try {
        const company = await prisma.oSGBCompany.findUnique({
            where: { id },
        });
        if (!company)
            return res.status(404).json({ error: 'OSGB firması bulunamadı.' });
        // Bu OSGB'ye bağlı profesyonelleri bul
        // osgbName üzerinden eşleştiriyoruz (schema'da string olarak tutulduğu için)
        const professionals = await prisma.professional.findMany({
            where: { osgbName: company.name },
            include: {
                assignments: {
                    where: { status: 'Aktif' },
                    include: { facility: true },
                },
            },
        });
        res.json({
            ...company,
            professionals,
        });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'OSGB detayları getirilemedi.' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// İŞVEREN VEKİLLERİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employers', async (req, res) => {
    try {
        const employers = await prisma.employerRepresentative.findMany({
            where: { isActive: true },
            orderBy: { fullName: 'asc' },
        });
        res.json(employers);
    }
    catch {
        res.status(500).json({ error: 'İşveren vekilleri getirilemedi.' });
    }
});
router.post('/employer-representatives', async (req, res) => {
    const { fullName, title, phone, email, username } = req.body;
    if (!fullName)
        return res.status(400).json({ error: 'Ad soyad zorunludur.' });
    try {
        const employer = await prisma.employerRepresentative.create({
            data: {
                fullName,
                title,
                phone,
                email,
                username: username?.toLowerCase().trim() || null
            }
        });
        if (username) {
            await syncUserForEmployerRep(employer, username);
        }
        res.status(201).json(employer);
    }
    catch (error) {
        console.error('Employer Rep Create Error:', error);
        res.status(500).json({ error: 'İşveren vekili oluşturulamadı.' });
    }
});
router.put('/employer-representatives/:id', async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { fullName, title, phone, email, username } = req.body;
    try {
        const employer = await prisma.employerRepresentative.update({
            where: { id },
            data: {
                fullName,
                title,
                phone,
                email,
                username: username?.toLowerCase().trim() || null
            }
        });
        if (username) {
            await syncUserForEmployerRep(employer, username);
        }
        res.json(employer);
    }
    catch (error) {
        console.error('Employer Rep Update Error:', error);
        res.status(500).json({ error: 'İşveren vekili güncellenemedi.' });
    }
});
router.post('/employers/:id/archive', async (req, res) => {
    const id = parseInt(String(req.params.id));
    try {
        const employer = await prisma.employerRepresentative.update({ where: { id }, data: { isActive: false } });
        res.json(employer);
    }
    catch {
        res.status(500).json({ error: 'İşveren vekili arşivlenemedi.' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// ATAMA YÖNETİMİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/assignments/compliance-status', async (req, res) => {
    try {
        const facilities = await prisma.facility.findMany({
            where: { isActive: true },
            include: {
                assignments: {
                    where: { status: 'Aktif' },
                    include: { professional: true, employerRep: true },
                },
            },
            orderBy: { name: 'asc' },
        });
        const results = facilities.map((f) => {
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
            const compliance = (0, isgCalculator_1.analyzeFacilityCompliance)({
                facilityId: f.id,
                facilityName: f.name,
                dangerClass: f.dangerClass,
                employeeCount: f.employeeCount,
                iguAssignments,
                hekimAssignments,
                dspAssignments,
                vekilAssignments,
            });
            let category = 'compliant';
            if (f.assignments.length === 0) {
                category = 'none';
            }
            else if (!compliance.overallCompliant) {
                category = 'missing';
            }
            return {
                ...compliance,
                category,
                assignmentsCount: f.assignments.length,
            };
        });
        res.json(results);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Atama uyumluluk durumları getirilemedi.' });
    }
});
router.get('/assignments', async (req, res) => {
    try {
        const { facilityId, status } = req.query;
        const assignments = await prisma.assignment.findMany({
            where: {
                ...(facilityId ? { facilityId: facilityId } : {}),
                ...(status ? { status: status } : {}),
            },
            include: {
                facility: true,
                professional: true,
                employerRep: true,
            },
            orderBy: { createdAt: 'desc' },
        });
        res.json(assignments);
    }
    catch {
        res.status(500).json({ error: 'Atamalar getirilemedi.' });
    }
});
router.post('/assignments', async (req, res) => {
    const { facilityId, professionalId, employerRepId, type, durationMinutes, isFullTime, startDate, costType, unitPrice, } = req.body;
    if (!facilityId || !type || !startDate) {
        return res.status(400).json({ error: 'Tesis, tip ve başlangıç tarihi zorunludur.' });
    }
    try {
        // Profesyonel kontrolleri
        if (professionalId) {
            const profId = parseInt(professionalId);
            const activeAssignments = await prisma.assignment.findMany({
                where: { professionalId: profId, status: 'Aktif' },
                include: { facility: true },
            });
            // 1. Aynı tesise mükerrer atama kontrolü
            const isAlreadyAssignedToThisFacility = activeAssignments.some(a => a.facilityId === facilityId);
            if (isAlreadyAssignedToThisFacility) {
                return res.status(409).json({ error: 'Bu profesyonel zaten bu tesise atanmış durumda.' });
            }
            // 2. Tam zamanlılık kontrolü (Herhangi bir yerde tam zamanlıysa yeni atama yapılamaz)
            const isFullTimeElsewhere = activeAssignments.some(a => a.isFullTime);
            if (isFullTimeElsewhere) {
                return res.status(409).json({ error: 'Bu profesyonel başka bir tesiste tam zamanlı olarak atanmış durumda, yeni atama yapılamaz.' });
            }
            // 3. Kapasite kontrolü (11700 dk sınırı)
            const currentMinutes = activeAssignments.reduce((sum, a) => sum + a.durationMinutes, 0);
            const newMinutes = isFullTime ? 11700 : parseInt(String(durationMinutes || 0));
            const capacity = (0, isgCalculator_1.checkCapacity)(currentMinutes, newMinutes);
            if (capacity.wouldExceed) {
                return res.status(409).json({
                    error: `Kapasite aşımı: Bu profesyonelin toplam süresi ${currentMinutes} dk. Yeni atama ile ${currentMinutes + newMinutes} dk olacak (Sınır: 11700 dk).`,
                });
            }
            // 4. Başka tesiste atama uyarısı (Onaylanmamışsa)
            const { confirmed } = req.body;
            if (!confirmed && activeAssignments.length > 0) {
                const otherFacility = activeAssignments[0].facility;
                return res.status(409).json({
                    code: 'PROFESSIONAL_ASSIGNED_ELSEWHERE',
                    error: `${otherFacility?.name || 'Bir'} tesisinde bu İSG profesyoneli atanmış durumda. Buraya da eklemek istiyor musunuz?`,
                });
            }
        }
        const assignment = await prisma.assignment.create({
            data: {
                facilityId,
                professionalId: professionalId ? parseInt(professionalId) : null,
                employerRepId: employerRepId ? parseInt(String(employerRepId)) : null,
                type,
                durationMinutes: isFullTime ? 11700 : parseInt(String(durationMinutes || 0)),
                isFullTime: isFullTime ?? false,
                startDate: new Date(startDate),
                status: 'Aktif',
                costType,
                unitPrice: unitPrice ? parseFloat(unitPrice) : null,
            },
            include: { facility: true, professional: true, employerRep: true }, // Include employerRep
        });
        await prisma.activityLog.create({
            data: {
                facilityId,
                username: req.user.username,
                action: 'Yeni Atama Yapıldı',
                details: `${(0, date_fns_1.format)(new Date(startDate), 'dd.MM.yyyy')} tarihinde ${assignment.professional?.fullName || assignment.employerRep?.fullName || 'Bilinmiyor'} - ${type} tipi atama yapıldı. (${durationMinutes} dk.)`
            }
        });
        // Atama değişikliği sonrası mutabakatı tetikle
        const month = (0, date_fns_1.format)(new Date(startDate), 'yyyy-MM');
        await (0, reconciliationService_1.syncReconciliation)(month);
        res.status(201).json(assignment);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Atama oluşturulamadı.' });
    }
});
router.put('/assignments/:id', async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { durationMinutes, isFullTime, costType, unitPrice, startDate, endDate, updatedAt } = req.body;
    try {
        // Optimistic locking
        const existing = await prisma.assignment.findUnique({
            where: { id },
            include: {
                professional: true,
                employerRep: true,
                facility: true,
            }
        });
        if (!existing)
            return res.status(404).json({ error: 'Atama bulunamadı.' });
        if (updatedAt && existing.updatedAt.toISOString() !== updatedAt) {
            return res.status(409).json({ error: 'Atama başka bir kullanıcı tarafından güncellenmiş. Lütfen sayfayı yenileyin.' });
        }
        const updateData = {
            durationMinutes: isFullTime ? 11700 : parseInt(String(durationMinutes || 0)),
            isFullTime,
            costType,
            unitPrice: unitPrice ? parseFloat(unitPrice) : null
        };
        if (startDate) {
            updateData.startDate = new Date(startDate);
        }
        if (endDate) {
            updateData.endDate = new Date(endDate);
        }
        const assignment = await prisma.assignment.update({
            where: { id },
            data: updateData,
            include: { facility: true, professional: true, employerRep: true },
        });
        // Log kaydı oluştur
        const updatedBy = req.user.fullName || req.user.username;
        const assignedTo = assignment.professional?.fullName || assignment.employerRep?.fullName || 'Bilinmiyor';
        const facilityName = assignment.facility?.name || 'Bilinmiyor';
        let details = `${assignedTo}'in ${facilityName} tesisindeki ${assignment.type} ataması ${updatedBy} tarafından güncellendi.`;
        if (existing.durationMinutes !== assignment.durationMinutes) {
            details += ` Süre: ${existing.durationMinutes} dk -> ${assignment.durationMinutes} dk.`;
        }
        if (existing.isFullTime !== assignment.isFullTime) {
            details += ` Tam zamanlı durumu: ${existing.isFullTime} -> ${assignment.isFullTime}.`;
        }
        if (startDate && existing.startDate.toISOString() !== new Date(startDate).toISOString()) {
            details += ` Başlangıç tarihi: ${(0, date_fns_1.format)(existing.startDate, 'dd.MM.yyyy')} -> ${(0, date_fns_1.format)(new Date(startDate), 'dd.MM.yyyy')}.`;
        }
        if (endDate && existing.endDate?.toISOString() !== new Date(endDate).toISOString()) {
            details += ` Bitiş tarihi: ${existing.endDate ? (0, date_fns_1.format)(existing.endDate, 'dd.MM.yyyy') : 'Yok'} -> ${(0, date_fns_1.format)(new Date(endDate), 'dd.MM.yyyy')}.`;
        }
        await prisma.activityLog.create({
            data: {
                facilityId: existing.facilityId,
                username: req.user.username,
                professionalId: existing.professionalId,
                action: 'Atama Güncellendi',
                details: details
            }
        });
        // Atama değişikliği sonrası mutabakatı tetikle
        const month = (0, date_fns_1.format)(new Date(existing.startDate), 'yyyy-MM');
        await (0, reconciliationService_1.syncReconciliation)(month);
        if (startDate && (0, date_fns_1.format)(new Date(startDate), 'yyyy-MM') !== month) {
            await (0, reconciliationService_1.syncReconciliation)((0, date_fns_1.format)(new Date(startDate), 'yyyy-MM'));
        }
        if (endDate && (0, date_fns_1.format)(new Date(endDate), 'yyyy-MM') !== month) {
            await (0, reconciliationService_1.syncReconciliation)((0, date_fns_1.format)(new Date(endDate), 'yyyy-MM'));
        }
        res.json(assignment);
    }
    catch (error) {
        console.error('Assignment Update Error:', error);
        res.status(500).json({ error: 'Atama güncellenemedi.' });
    }
});
router.post('/assignments/:id/terminate', async (req, res) => {
    const id = parseInt(String(req.params.id));
    const { endDate } = req.body;
    try {
        const existing = await prisma.assignment.findUnique({
            where: { id },
            include: {
                professional: true,
                employerRep: true,
                facility: true,
            }
        });
        if (!existing)
            return res.status(404).json({ error: 'Atama bulunamadı.' });
        const [assignment] = await prisma.$transaction([
            prisma.assignment.update({
                where: { id },
                data: {
                    status: 'Sona Erdi',
                    endDate: endDate ? new Date(endDate) : new Date()
                },
            }),
            prisma.activityLog.create({
                data: {
                    facilityId: existing.facilityId,
                    username: req.user.username,
                    action: 'Atama Sonlandırıldı',
                    details: `${existing.professional?.fullName || existing.employerRep?.fullName || 'Bilinmiyor'}'in ${existing.facility?.name || 'Bilinmiyor'} tesisindeki ${existing.type} ataması ${(0, date_fns_1.format)(endDate ? new Date(endDate) : new Date(), 'dd.MM.yyyy')} tarihinde ${req.user.fullName || req.user.username} tarafından sonlandırıldı.`
                }
            })
        ]);
        // Atama değişikliği sonrası mutabakatı tetikle
        const month = (0, date_fns_1.format)(new Date(existing.startDate), 'yyyy-MM');
        await (0, reconciliationService_1.syncReconciliation)(month);
        if (endDate) {
            const endMonth = (0, date_fns_1.format)(new Date(endDate), 'yyyy-MM');
            if (endMonth !== month)
                await (0, reconciliationService_1.syncReconciliation)(endMonth);
        }
        res.json(assignment);
    }
    catch {
        res.status(500).json({ error: 'Atama sonlandırılamadı.' });
    }
});
// ─────────────────────────────────────────────────────────────────────────────
// MUTABAKAT
// ─────────────────────────────────────────────────────────────────────────────
router.get('/reconciliation', async (req, res) => {
    try {
        const items = await prisma.reconciliation.findMany({
            include: {
                osgbCompany: true,
                facility: true,
            },
            orderBy: [{ month: 'desc' }, { osgbCompany: { name: 'asc' } }],
        });
        res.json(items);
    }
    catch {
        res.status(500).json({ error: 'Mutabakat kayıtları getirilemedi.' });
    }
});
// Mutabakat hesaplama önizleme
router.get('/reconciliation/calculate', async (req, res) => {
    const { month } = req.query;
    if (!month)
        return res.status(400).json({ error: 'Ay (month) parametresi gereklidir.' });
    try {
        const results = await (0, reconciliationService_1.calculateMonthlyReconciliation)(String(month));
        res.json(results);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Hesaplama yapılamadı.' });
    }
});
// Mutabakat kayıtlarını oluştur/güncelle (Sync)
router.post('/reconciliation/sync', async (req, res) => {
    const { month } = req.body;
    if (!month)
        return res.status(400).json({ error: 'Ay (month) parametresi gereklidir.' });
    try {
        const items = await (0, reconciliationService_1.syncReconciliation)(String(month));
        res.json(items);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Senkronizasyon yapılamadı.' });
    }
});
// Otomatik tüm ayları senkronize et
router.post('/reconciliation/auto-sync', async (req, res) => {
    try {
        await (0, reconciliationService_1.autoSyncAllMonths)(2026);
        res.json({ success: true });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Otomatik senkronizasyon başarısız.' });
    }
});
// Excel Export
router.get('/reconciliation/export', async (req, res) => {
    const { osgbId, month } = req.query;
    try {
        const items = await prisma.reconciliation.findMany({
            where: {
                ...(osgbId ? { osgbCompanyId: parseInt(String(osgbId)) } : {}),
                ...(month ? { month: String(month) } : {})
            },
            include: { osgbCompany: true, facility: true }
        });
        const buffer = await (0, reconciliationService_1.exportReconciliationToExcel)(items);
        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', `attachment; filename=mutabakat_${month || 'tum'}.xlsx`);
        res.send(buffer);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Excel dışa aktarma başarısız.' });
    }
});
router.post('/reconciliation', async (req, res) => {
    const { facilityId, osgbCompanyId, month, amount, note } = req.body;
    if (!facilityId || !osgbCompanyId || !month) {
        return res.status(400).json({ error: 'Tesis, OSGB firması ve dönem zorunludur.' });
    }
    try {
        const item = await prisma.reconciliation.create({
            data: { facilityId, osgbCompanyId: parseInt(osgbCompanyId), month, amount: amount ? parseFloat(amount) : null, note },
            include: { osgbCompany: true, facility: true },
        });
        res.status(201).json(item);
    }
    catch {
        res.status(500).json({ error: 'Mutabakat oluşturulamadı.' });
    }
});
router.put('/reconciliation/:id', async (req, res) => {
    const id = parseInt(String(req.params.id)); // Cast to string
    const { invoiceAmount, status, note, amount } = req.body;
    try {
        const existing = await prisma.reconciliation.findUnique({ where: { id } });
        if (!existing)
            return res.status(404).json({ error: 'Kayıt bulunamadı.' });
        const calcAmount = existing.calculatedAmount || 0;
        const invAmount = invoiceAmount !== undefined ? parseFloat(invoiceAmount) : (existing.invoiceAmount || 0);
        const diff = calcAmount - invAmount;
        const item = await prisma.reconciliation.update({
            where: { id },
            data: {
                invoiceAmount: invAmount,
                difference: diff,
                status: status || existing.status,
                note: note !== undefined ? note : existing.note,
                amount: amount !== undefined ? parseFloat(amount) : existing.amount
            },
            include: { osgbCompany: true, facility: true }
        });
        res.json(item);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Güncelleme yapılamadı.' });
    }
});
exports.default = router;
