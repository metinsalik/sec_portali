import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, managementMiddleware, AuthRequest } from '../middleware/auth';
import {
  analyzeFacilityCompliance,
  getCertificateStatus,
  checkCapacity,
} from '../services/isgCalculator';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(managementMiddleware);

// ─────────────────────────────────────────────────────────────────────────────
// DASHBOARD KPI
// ─────────────────────────────────────────────────────────────────────────────
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const [facilities, professionals, assignments] = await Promise.all([
      prisma.facility.findMany({
        where: { isActive: true },
        include: { assignments: { where: { status: 'Aktif' } } },
      }),
      prisma.professional.findMany({ where: { isActive: true } }),
      prisma.assignment.findMany({ where: { status: 'Aktif' } }),
    ]);

    // Sertifika uyarıları
    const certWarnings = professionals.filter((p) => {
      const status = getCertificateStatus(p.certificateDate);
      return status.isWarning || status.isCritical || status.isExpired;
    });

    const certCritical = professionals.filter((p) => {
      const status = getCertificateStatus(p.certificateDate);
      return status.isCritical || status.isExpired;
    });

    res.json({
      totalFacilities: facilities.length,
      totalProfessionals: professionals.length,
      totalActiveAssignments: assignments.length,
      certWarningCount: certWarnings.length,
      certCriticalCount: certCritical.length,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Dashboard verileri getirilemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// TESİS LİSTESİ (atama odaklı görünüm)
// ─────────────────────────────────────────────────────────────────────────────
router.get('/facilities', async (req: AuthRequest, res: Response) => {
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
  } catch {
    res.status(500).json({ error: 'Tesisler getirilemedi.' });
  }
});

// Tesis uyumluluk analizi
router.get('/facilities/:id/compliance', async (req: AuthRequest, res: Response) => {
  try {
    const facility = await prisma.facility.findUnique({
      where: { id: String(req.params.id) },
      include: {
        assignments: {
          where: { status: 'Aktif' },
          include: { professional: true },
        },
      },
    });
    if (!facility) return res.status(404).json({ error: 'Tesis bulunamadı.' });

    const dangerClass = (facility as any).dangerClass ?? 'Az Tehlikeli';
    const employeeCount = (facility as any).employeeCount ?? 0;

    const activeAssignments = facility.assignments;
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

    const result = analyzeFacilityCompliance({
      facilityId: facility.id,
      facilityName: facility.name,
      dangerClass,
      employeeCount,
      iguAssignments,
      hekimAssignments,
      dspAssignments,
    });
    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Uyumluluk analizi yapılamadı.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFESYONELLER
// ─────────────────────────────────────────────────────────────────────────────
router.get('/professionals', async (req: AuthRequest, res: Response) => {
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
      certificateStatus: getCertificateStatus(p.certificateDate),
    }));
    res.json(enriched);
  } catch {
    res.status(500).json({ error: 'Profesyoneller getirilemedi.' });
  }
});

router.post('/professionals', async (req: AuthRequest, res: Response) => {
  const { fullName, employmentType, osgbName, titleClass, certificateNo, certificateDate, phone, email, unitPrice } = req.body;
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
      },
    });
    res.status(201).json(professional);
  } catch {
    res.status(500).json({ error: 'Profesyonel oluşturulamadı.' });
  }
});

router.put('/professionals/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { fullName, employmentType, osgbName, titleClass, certificateNo, certificateDate, phone, email, unitPrice } = req.body;
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
      },
    });
    res.json(professional);
  } catch {
    res.status(500).json({ error: 'Profesyonel güncellenemedi.' });
  }
});

router.post('/professionals/:id/archive', async (req: AuthRequest, res: Response) => {
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
  } catch {
    res.status(500).json({ error: 'Profesyonel arşivlenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// OSGB FİRMALARI
// ─────────────────────────────────────────────────────────────────────────────
router.get('/osgb', async (req: AuthRequest, res: Response) => {
  try {
    const companies = await prisma.oSGBCompany.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
    });
    res.json(companies);
  } catch {
    res.status(500).json({ error: 'OSGB firmaları getirilemedi.' });
  }
});

router.post('/osgb', async (req: AuthRequest, res: Response) => {
  const { name, contact, phone, email } = req.body;
  if (!name) return res.status(400).json({ error: 'Firma adı zorunludur.' });
  try {
    const company = await prisma.oSGBCompany.create({ data: { name, contact, phone, email } });
    res.status(201).json(company);
  } catch {
    res.status(500).json({ error: 'OSGB firması oluşturulamadı.' });
  }
});

router.put('/osgb/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name, contact, phone, email, isActive } = req.body;
  try {
    const company = await prisma.oSGBCompany.update({ where: { id }, data: { name, contact, phone, email, isActive } });
    res.json(company);
  } catch {
    res.status(500).json({ error: 'OSGB firması güncellenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// İŞVEREN VEKİLLERİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employers', async (req: AuthRequest, res: Response) => {
  try {
    const employers = await prisma.employerRepresentative.findMany({
      where: { isActive: true },
      orderBy: { fullName: 'asc' },
    });
    res.json(employers);
  } catch {
    res.status(500).json({ error: 'İşveren vekilleri getirilemedi.' });
  }
});

router.post('/employers', async (req: AuthRequest, res: Response) => {
  const { fullName, title, phone, email } = req.body;
  if (!fullName) return res.status(400).json({ error: 'Ad soyad zorunludur.' });
  try {
    const employer = await prisma.employerRepresentative.create({ data: { fullName, title, phone, email } });
    res.status(201).json(employer);
  } catch {
    res.status(500).json({ error: 'İşveren vekili oluşturulamadı.' });
  }
});

router.put('/employers/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { fullName, title, phone, email } = req.body;
  try {
    const employer = await prisma.employerRepresentative.update({ where: { id }, data: { fullName, title, phone, email } });
    res.json(employer);
  } catch {
    res.status(500).json({ error: 'İşveren vekili güncellenemedi.' });
  }
});

router.post('/employers/:id/archive', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  try {
    const employer = await prisma.employerRepresentative.update({ where: { id }, data: { isActive: false } });
    res.json(employer);
  } catch {
    res.status(500).json({ error: 'İşveren vekili arşivlenemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ATAMA YÖNETİMİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, status } = req.query;
    const assignments = await prisma.assignment.findMany({
      where: {
        ...(facilityId ? { facilityId: facilityId as string } : {}),
        ...(status ? { status: status as string } : {}),
      },
      include: {
        facility: true,
        professional: true,
        employerRep: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(assignments);
  } catch {
    res.status(500).json({ error: 'Atamalar getirilemedi.' });
  }
});

router.post('/assignments', async (req: AuthRequest, res: Response) => {
  const {
    facilityId, professionalId, employerRepId,
    type, durationMinutes, isFullTime, startDate, costType, unitPrice,
  } = req.body;

  if (!facilityId || !type || !startDate) {
    return res.status(400).json({ error: 'Tesis, tip ve başlangıç tarihi zorunludur.' });
  }

  try {
    // Kapasite kontrolü (profesyonel için)
    if (professionalId) {
      const existingAssignments = await prisma.assignment.findMany({
        where: { professionalId: parseInt(professionalId), status: 'Aktif' },
      });
      const currentMinutes = existingAssignments.reduce((sum, a) => sum + a.durationMinutes, 0);
      const capacity = checkCapacity(currentMinutes, parseInt(durationMinutes));

      if (capacity.wouldExceed) {
        return res.status(409).json({
          error: `Kapasite aşımı: Bu profesyonelin kalan kapasitesi ${capacity.remaining} dk/ay. Girilen: ${durationMinutes} dk.`,
        });
      }
    }

    const assignment = await prisma.assignment.create({
      data: {
        facilityId,
        professionalId: professionalId ? parseInt(professionalId) : null,
        employerRepId: employerRepId ? parseInt(employerRepId) : null,
        type,
        durationMinutes: parseInt(durationMinutes),
        isFullTime: isFullTime ?? false,
        startDate: new Date(startDate),
        status: 'Aktif',
        costType,
        unitPrice: unitPrice ? parseFloat(unitPrice) : null,
      },
      include: { facility: true, professional: true },
    });
    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Atama oluşturulamadı.' });
  }
});

router.put('/assignments/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { durationMinutes, isFullTime, costType, unitPrice, updatedAt } = req.body;
  try {
    // Optimistic locking
    const existing = await prisma.assignment.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Atama bulunamadı.' });
    if (updatedAt && existing.updatedAt.toISOString() !== updatedAt) {
      return res.status(409).json({ error: 'Atama başka bir kullanıcı tarafından güncellenmiş. Lütfen sayfayı yenileyin.' });
    }
    const assignment = await prisma.assignment.update({
      where: { id },
      data: { durationMinutes, isFullTime, costType, unitPrice: unitPrice ? parseFloat(unitPrice) : null },
    });
    res.json(assignment);
  } catch {
    res.status(500).json({ error: 'Atama güncellenemedi.' });
  }
});

router.post('/assignments/:id/terminate', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  try {
    const assignment = await prisma.assignment.update({
      where: { id },
      data: { status: 'Sona Erdi', endDate: new Date() },
    });
    res.json(assignment);
  } catch {
    res.status(500).json({ error: 'Atama sonlandırılamadı.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// MUTABAKAT
// ─────────────────────────────────────────────────────────────────────────────
router.get('/reconciliation', async (req: AuthRequest, res: Response) => {
  try {
    const items = await prisma.reconciliation.findMany({
      include: {
        osgbCompany: true,
        facility: true,
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Mutabakat kayıtları getirilemedi.' });
  }
});

router.post('/reconciliation', async (req: AuthRequest, res: Response) => {
  const { facilityId, osgbCompanyId, month, amount, note } = req.body;
  if (!facilityId || !osgbCompanyId || !month) {
    return res.status(400).json({ error: 'Tesis, OSGB firması ve dönem zorunludur.' });
  }
  try {
    const item = await prisma.reconciliation.create({
      data: { facilityId, osgbCompanyId, month, amount: amount ? parseFloat(amount) : null, note },
      include: { osgbCompany: true, facility: true },
    });
    res.status(201).json(item);
  } catch {
    res.status(500).json({ error: 'Mutabakat oluşturulamadı.' });
  }
});

export default router;
