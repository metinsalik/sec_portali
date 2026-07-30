import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, managementMiddleware, AuthRequest } from '../middleware/auth';
import {
  analyzeFacilityCompliance,
  getCertificateStatus,
  checkCapacity,
} from '../services/isgCalculator';
import { format } from 'date-fns'; // Import format for date operations
import ExcelJS from 'exceljs';

import { getDashboardStats, getEmployeeTrend } from '../services/dashboardService';
import { 
  calculateMonthlyReconciliation, 
  syncReconciliation, 
  autoSyncAllMonths,
  exportReconciliationToExcel
} from '../services/reconciliationService';
import { processKatipImport } from '../services/katipImportService';
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);
router.use(managementMiddleware);

/**
 * Profesyonel için kullanıcı kaydı oluşturur veya günceller
 */
async function syncUserForProfessional(professional: any, username: string) {
  if (!username) return;

  const normalizedUsername = username.toLowerCase().trim();
  
  // Rol belirleme
  let roleName = 'user';
  if (professional.titleClass.includes('IGU')) roleName = 'safety';
  else if (professional.titleClass === 'İşyeri Hekimi') roleName = 'doctor';
  else if (professional.titleClass === 'DSP') roleName = 'dsp';

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
async function syncUserForEmployerRep(employerRep: any, username: string) {
  if (!username) return;

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
router.get('/dashboard', async (req: AuthRequest, res: Response) => {
  try {
    const [stats, trend] = await Promise.all([
      getDashboardStats(),
      getEmployeeTrend(),
    ]);

    res.json({
      ...stats,
      employeeTrend: trend,
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

// İSG-KATİP Excel Import
router.post('/facilities/:id/import-katip', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    const facilityId = String(req.params.id);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'Excel dosyası yüklenmedi.' });
    }

    const username = req.user!.username;
    const result = await processKatipImport(facilityId, file.buffer, username);
    
    res.json(result);
  } catch (error) {
    console.error('Katip Import Error:', error);
    res.status(500).json({ error: 'Excel içe aktarılırken bir hata oluştu.' });
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
          include: { professional: true, employerRep: true }, // Include employerRep
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
    const vekilAssignments = activeAssignments
      .filter((a) => a.type === 'Vekil' && a.employerRep)
      .map((a) => ({ name: a.employerRep!.fullName })); // Add vekilAssignments

    const result = analyzeFacilityCompliance({
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
  } catch (error) {
    console.error('Facility Compliance Error:', error);
    res.status(500).json({ error: 'Uyumluluk analizi yapılamadı.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PROFESYONELLER
// ─────────────────────────────────────────────────────────────────────────────
router.get('/professionals', async (req: AuthRequest, res: Response) => {
  try {
    const { archived } = req.query as Record<string, any>;
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
  const { 
    fullName, employmentType, osgbName, titleClass, 
    certificateNo, certificateDate, phone, email, unitPrice, username 
  } = req.body;

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
  } catch (error) {
    console.error('Professional Create Error:', error);
    res.status(500).json({ error: 'Profesyonel oluşturulamadı.' });
  }
});

router.put('/professionals/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { 
    fullName, employmentType, osgbName, titleClass, 
    certificateNo, certificateDate, phone, email, unitPrice, username 
  } = req.body;

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
  } catch (error) {
    console.error('Professional Update Error:', error);
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

// Tek profesyonel detay (Yaşam Kartı)
router.get('/professionals/:id', async (req: AuthRequest, res: Response) => {
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

    if (!professional) return res.status(404).json({ error: 'Profesyonel bulunamadı.' });

    // Sertifika durumu
    const certificateStatus = getCertificateStatus(professional.certificateDate);

    // Aktivite loglarını bul (ProfessionalId veya Email üzerinden User eşleştirmesi ile)
    let activityLogs: any[] = await prisma.activityLog.findMany({
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
  } catch (error) {
    console.error('Professional Detail Error:', error);
    res.status(500).json({ error: 'Profesyonel detayları getirilemedi.' });
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
  const { name, contact, phone, email, city, district } = req.body;
  if (!name) return res.status(400).json({ error: 'Firma adı zorunludur.' });
  try {
    const company = await prisma.oSGBCompany.create({ data: { name, contact, phone, email, city, district } });
    res.status(201).json(company);
  } catch {
    res.status(500).json({ error: 'OSGB firması oluşturulamadı.' });
  }
});

router.put('/osgb/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  const { name, contact, phone, email, city, district, isActive } = req.body;
  try {
    const company = await prisma.oSGBCompany.update({
      where: { id },
      data: { name, contact, phone, email, city, district, isActive },
    });
    res.json(company);
  } catch {
    res.status(500).json({ error: 'OSGB firması güncellenemedi.' });
  }
});

// OSGB Detay (Yaşam Kartı)
router.get('/osgb/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id));
  try {
    const company = await prisma.oSGBCompany.findUnique({
      where: { id },
    });

    if (!company) return res.status(404).json({ error: 'OSGB firması bulunamadı.' });

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'OSGB detayları getirilemedi.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// İŞVEREN VEKİLLERİ
// ─────────────────────────────────────────────────────────────────────────────
router.get('/employers', async (req: AuthRequest, res: Response) => {
  try {
    const employers = await prisma.employerRepresentative.findMany({
      where: { isActive: true },
      include: {
        appointments: {
          where: { status: 'Aktif' },
          include: { facility: true }
        }
      },
      orderBy: { fullName: 'asc' },
    });
    res.json(employers);
  } catch {
    res.status(500).json({ error: 'İşveren vekilleri getirilemedi.' });
  }
});

router.post('/employers', async (req: AuthRequest, res: Response) => {
  const { fullName, title, phone, email, username } = req.body;
  if (!fullName) return res.status(400).json({ error: 'Ad soyad zorunludur.' });
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
  } catch (error) {
    console.error('Employer Rep Create Error:', error);
    res.status(500).json({ error: 'İşveren vekili oluşturulamadı.' });
  }
});

router.put('/employers/:id', async (req: AuthRequest, res: Response) => {
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
  } catch (error) {
    console.error('Employer Rep Update Error:', error);
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
router.get('/assignments/compliance-status', async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          include: { professional: true, employerRep: true },
          orderBy: { endDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const results = facilities.map((f) => {
      const activeAssignments = f.assignments.filter(a => a.status === 'Aktif');
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

      const compliance = analyzeFacilityCompliance({
        facilityId: f.id,
        facilityName: f.name,
        dangerClass: f.dangerClass,
        employeeCount: f.employeeCount,
        iguAssignments,
        hekimAssignments,
        dspAssignments,
        vekilAssignments,
      });

      // Calculate countdown for missing requirements
      const today = new Date();
      
      const computeCountdown = (type: string, isCompliant: boolean, required: boolean) => {
        if (isCompliant || !required) return { daysLeft: null, startDate: null };
        const pastAssignments = f.assignments.filter(a => a.type === type && a.status === 'Sona Erdi' && a.endDate);
        pastAssignments.sort((a, b) => b.endDate!.getTime() - a.endDate!.getTime());
        const startDate = pastAssignments.length > 0 ? pastAssignments[0].endDate : f.createdAt;
        if (!startDate) return { daysLeft: null, startDate: null };
        const diffTime = today.getTime() - startDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        return { daysLeft: Math.max(0, 30 - diffDays), startDate };
      };

      const iguTimer = computeCountdown('IGU', compliance.igu.isCompliant, true);
      compliance.igu.countdownDays = iguTimer.daysLeft;
      compliance.igu.deficiencyStartDate = iguTimer.startDate;

      const hekimTimer = computeCountdown('Hekim', compliance.hekim.isCompliant, true);
      compliance.hekim.countdownDays = hekimTimer.daysLeft;
      compliance.hekim.deficiencyStartDate = hekimTimer.startDate;

      const dspTimer = computeCountdown('DSP', compliance.dsp.isCompliant, compliance.dsp.required);
      compliance.dsp.countdownDays = dspTimer.daysLeft;
      compliance.dsp.deficiencyStartDate = dspTimer.startDate;

      let category: 'missing' | 'none' | 'compliant' = 'compliant';
      if (activeAssignments.length === 0) {
        category = 'none';
      } else if (!compliance.overallCompliant) {
        category = 'missing';
      }

      return {
        ...compliance,
        category,
        assignmentsCount: activeAssignments.length,
        activeAssignments,
      };
    });

    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Atama uyumluluk durumları getirilemedi.' });
  }
});

// EXCEL EKSIK ATAMALAR RAPORU
router.get('/reports/missing-assignments/excel', async (req: AuthRequest, res: Response) => {
  try {
    const facilities = await prisma.facility.findMany({
      where: { isActive: true },
      include: {
        assignments: {
          include: { professional: true, employerRep: true },
          orderBy: { endDate: 'desc' },
        },
      },
      orderBy: { name: 'asc' },
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Eksik Atamalar Listesi');

    worksheet.columns = [
      { header: 'Pozisyon / Tesis', key: 'position', width: 40 },
      { header: 'Eksik Detayı', key: 'missingDetails', width: 25 },
      { header: 'Gerekli / Atanan (Dk)', key: 'minutes', width: 25 },
      { header: 'Kalan Yasal Süre', key: 'timeLeft', width: 25 },
      { header: 'Mevcut Atanmış Profesyoneller', key: 'assignedPros', width: 60 },
    ];

    // Stil ayarları (Başlık satırı)
    worksheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F2937' } };

    const today = new Date();

    for (const f of facilities) {
      const activeAssignments = f.assignments.filter(a => a.status === 'Aktif');
      const iguAssignments = activeAssignments.filter((a) => a.type === 'IGU' && a.professional).map((a) => ({ durationMinutes: a.durationMinutes, isFullTime: a.isFullTime, titleClass: a.professional!.titleClass }));
      const hekimAssignments = activeAssignments.filter((a) => a.type === 'Hekim').map((a) => ({ durationMinutes: a.durationMinutes, isFullTime: a.isFullTime }));
      const dspAssignments = activeAssignments.filter((a) => a.type === 'DSP').map((a) => ({ durationMinutes: a.durationMinutes }));

      const compliance = analyzeFacilityCompliance({
        facilityId: f.id, facilityName: f.name, dangerClass: f.dangerClass, employeeCount: f.employeeCount,
        iguAssignments, hekimAssignments, dspAssignments, vekilAssignments: [],
      });

      if (compliance.overallCompliant) continue;

      const getAssignedProsText = (type: string) => {
        const pros = activeAssignments.filter(a => a.type === type && a.professional);
        if (pros.length === 0) return 'Yok';
        return pros.map(a => `${a.professional!.fullName} (${a.professional!.employmentType === 'OSGB Kadrosu' ? 'OSGB' : 'Tesis'})`).join(', ');
      };

      const computeCountdown = (type: string, isCompliant: boolean, required: boolean) => {
        if (isCompliant || !required) return { daysLeft: null };
        const pastAssignments = f.assignments.filter(a => a.type === type && a.status === 'Sona Erdi' && a.endDate);
        pastAssignments.sort((a, b) => b.endDate!.getTime() - a.endDate!.getTime());
        const startDate = pastAssignments.length > 0 ? pastAssignments[0].endDate : f.createdAt;
        if (!startDate) return { daysLeft: null };
        const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
        return { daysLeft: Math.max(0, 30 - diffDays) };
      };

      // Tesis başlığı satırı
      const facilityRow = worksheet.addRow({ position: `Tesis: ${f.name} (Çalışan: ${f.employeeCount})` });
      worksheet.mergeCells(`A${facilityRow.number}:E${facilityRow.number}`);
      facilityRow.font = { bold: true, size: 12, color: { argb: 'FF000000' } };
      facilityRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF3F4F6' } };

      const formatMissingDetails = (missingMins: number, requiredMins: number, employeeCount: number) => {
        if (employeeCount === 0 || requiredMins === 0) return `${missingMins} dk eksik`;
        const missingPersons = Math.ceil(missingMins / (requiredMins / employeeCount));
        return `${missingMins} dk eksik (${missingPersons} çalışan için)`;
      };

      if (!compliance.igu.isCompliant) {
        const missingMins = Math.max(0, compliance.igu.requiredMinutes - compliance.igu.assignedMinutes);
        worksheet.addRow({
          position: '   • İş Güvenliği Uzmanı',
          missingDetails: formatMissingDetails(missingMins, compliance.igu.requiredMinutes, f.employeeCount),
          minutes: `${compliance.igu.requiredMinutes} dk / ${compliance.igu.assignedMinutes} dk`,
          timeLeft: computeCountdown('IGU', false, true).daysLeft + ' Gün Kaldı',
          assignedPros: getAssignedProsText('IGU')
        });
      }

      if (!compliance.hekim.isCompliant) {
        const missingMins = Math.max(0, compliance.hekim.requiredMinutes - compliance.hekim.assignedMinutes);
        worksheet.addRow({
          position: '   • İşyeri Hekimi',
          missingDetails: formatMissingDetails(missingMins, compliance.hekim.requiredMinutes, f.employeeCount),
          minutes: `${compliance.hekim.requiredMinutes} dk / ${compliance.hekim.assignedMinutes} dk`,
          timeLeft: computeCountdown('Hekim', false, true).daysLeft + ' Gün Kaldı',
          assignedPros: getAssignedProsText('Hekim')
        });
      }

      if (compliance.dsp.required && !compliance.dsp.isCompliant) {
        const missingMins = Math.max(0, compliance.dsp.requiredMinutes - compliance.dsp.assignedMinutes);
        worksheet.addRow({
          position: '   • Diğer Sağlık Personeli',
          missingDetails: formatMissingDetails(missingMins, compliance.dsp.requiredMinutes, f.employeeCount),
          minutes: `${compliance.dsp.requiredMinutes} dk / ${compliance.dsp.assignedMinutes} dk`,
          timeLeft: computeCountdown('DSP', false, true).daysLeft + ' Gün Kaldı',
          assignedPros: getAssignedProsText('DSP')
        });
      }

      // Boş satır
      worksheet.addRow({});
    }

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="eksik_atamalar_raporu_${format(new Date(), 'yyyy-MM-dd')}.xlsx"`);
    
    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Excel raporu oluşturulamadı.' });
  }
});

router.get('/assignments', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, status } = req.query as Record<string, any>;
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
      const capacity = checkCapacity(currentMinutes, newMinutes);

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
        username: req.user!.username,
        action: 'Yeni Atama Yapıldı',
        details: `${format(new Date(startDate), 'dd.MM.yyyy')} tarihinde ${assignment.professional?.fullName || assignment.employerRep?.fullName || 'Bilinmiyor'} - ${type} tipi atama yapıldı. (${durationMinutes} dk.)`
      }
    });

    // Atama değişikliği sonrası mutabakatı tetikle
    const month = format(new Date(startDate), 'yyyy-MM');
    await syncReconciliation(month);

    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Atama oluşturulamadı.' });
  }
});

router.put('/assignments/:id', async (req: AuthRequest, res: Response) => {
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
    if (!existing) return res.status(404).json({ error: 'Atama bulunamadı.' });
    if (updatedAt && existing.updatedAt.toISOString() !== updatedAt) {
      return res.status(409).json({ error: 'Atama başka bir kullanıcı tarafından güncellenmiş. Lütfen sayfayı yenileyin.' });
    }

    const updateData: any = { 
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
    const updatedBy = req.user!.fullName || req.user!.username;
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
      details += ` Başlangıç tarihi: ${format(existing.startDate, 'dd.MM.yyyy')} -> ${format(new Date(startDate), 'dd.MM.yyyy')}.`;
    }
    if (endDate && existing.endDate?.toISOString() !== new Date(endDate).toISOString()) {
      details += ` Bitiş tarihi: ${existing.endDate ? format(existing.endDate, 'dd.MM.yyyy') : 'Yok'} -> ${format(new Date(endDate), 'dd.MM.yyyy')}.`;
    }


    await prisma.activityLog.create({
      data: {
        facilityId: existing.facilityId,
        username: req.user!.username,
        professionalId: existing.professionalId,
        action: 'Atama Güncellendi',
        details: details
      }
    });

    // Atama değişikliği sonrası mutabakatı tetikle
    const month = format(new Date(existing.startDate), 'yyyy-MM');
    await syncReconciliation(month);
    if (startDate && format(new Date(startDate), 'yyyy-MM') !== month) {
      await syncReconciliation(format(new Date(startDate), 'yyyy-MM'));
    }
    if (endDate && format(new Date(endDate), 'yyyy-MM') !== month) {
      await syncReconciliation(format(new Date(endDate), 'yyyy-MM'));
    }


    res.json(assignment);
  } catch (error) {
    console.error('Assignment Update Error:', error);
    res.status(500).json({ error: 'Atama güncellenemedi.' });
  }
});

router.post('/assignments/:id/terminate', async (req: AuthRequest, res: Response) => {
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
    if (!existing) return res.status(404).json({ error: 'Atama bulunamadı.' });

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
          username: req.user!.username,
          action: 'Atama Sonlandırıldı',
          details: `${existing.professional?.fullName || existing.employerRep?.fullName || 'Bilinmiyor'}'in ${existing.facility?.name || 'Bilinmiyor'} tesisindeki ${existing.type} ataması ${format(endDate ? new Date(endDate) : new Date(), 'dd.MM.yyyy')} tarihinde ${req.user!.fullName || req.user!.username} tarafından sonlandırıldı.`
        }
      })
    ]);

    // Atama değişikliği sonrası mutabakatı tetikle
    const month = format(new Date(existing.startDate), 'yyyy-MM');
    await syncReconciliation(month);
    if (endDate) {
        const endMonth = format(new Date(endDate), 'yyyy-MM');
        if (endMonth !== month) await syncReconciliation(endMonth);
    }

    res.json(assignment);
  } catch {
    res.status(500).json({ error: 'Atama sonlandırılamadı.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ATAMA DOKÜMANLARI
// ─────────────────────────────────────────────────────────────────────────────
router.get('/assignments/:id/documents', async (req: AuthRequest, res: Response) => {
  const assignmentId = parseInt(String(req.params.id));
  try {
    const documents = await prisma.assignmentDocument.findMany({
      where: { assignmentId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(documents);
  } catch (error) {
    res.status(500).json({ error: 'Dokümanlar getirilemedi.' });
  }
});

router.post('/assignments/:id/documents', upload.single('file'), async (req: AuthRequest, res: Response) => {
  const assignmentId = parseInt(String(req.params.id));
  const { name, date } = req.body;
  const file = req.file;

  if (!name || !date || !file) {
    return res.status(400).json({ error: 'Ad, tarih ve dosya zorunludur.' });
  }

  try {
    const fs = require('fs');
    const path = require('path');
    const crypto = require('crypto');
    const ext = path.extname(file.originalname);
    const fileName = `${crypto.randomUUID()}${ext}`;
    const uploadDir = path.join(process.cwd(), 'uploads', 'assignments');
    
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    const filePath = path.join(uploadDir, fileName);
    fs.writeFileSync(filePath, file.buffer);

    const document = await prisma.assignmentDocument.create({
      data: {
        assignmentId,
        name,
        date: new Date(date),
        filePath: `/uploads/assignments/${fileName}`,
      },
    });

    res.status(201).json(document);
  } catch (error) {
    console.error('Document Upload Error:', error);
    res.status(500).json({ error: 'Doküman yüklenemedi.' });
  }
});

router.delete('/assignments/documents/:docId', async (req: AuthRequest, res: Response) => {
  const docId = String(req.params.docId);
  try {
    const document = await prisma.assignmentDocument.findUnique({ where: { id: docId } });
    if (!document) return res.status(404).json({ error: 'Doküman bulunamadı.' });

    await prisma.assignmentDocument.delete({ where: { id: docId } });
    
    const fs = require('fs');
    const path = require('path');
    const fullPath = path.join(process.cwd(), document.filePath);
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath);
    }
    res.json(document);
  } catch (error) {
    res.status(500).json({ error: 'Doküman silinemedi.' });
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
      orderBy: [{ month: 'desc' }, { osgbCompany: { name: 'asc' } }],
    });
    res.json(items);
  } catch {
    res.status(500).json({ error: 'Mutabakat kayıtları getirilemedi.' });
  }
});

// Mutabakat hesaplama önizleme
router.get('/reconciliation/calculate', async (req: AuthRequest, res: Response) => {
  const { month } = req.query as Record<string, any>;
  if (!month) return res.status(400).json({ error: 'Ay (month) parametresi gereklidir.' });
  
  try {
    const results = await calculateMonthlyReconciliation(String(month));
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Hesaplama yapılamadı.' });
  }
});

// Mutabakat kayıtlarını oluştur/güncelle (Sync)
router.post('/reconciliation/sync', async (req: AuthRequest, res: Response) => {
  const { month } = req.body;
  if (!month) return res.status(400).json({ error: 'Ay (month) parametresi gereklidir.' });

  try {
    const items = await syncReconciliation(String(month));
    res.json(items);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Senkronizasyon yapılamadı.' });
  }
});

// Otomatik tüm ayları senkronize et
router.post('/reconciliation/auto-sync', async (req: AuthRequest, res: Response) => {
  try {
    await autoSyncAllMonths(2026);
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Otomatik senkronizasyon başarısız.' });
  }
});

// Excel Export
router.get('/reconciliation/export', async (req: AuthRequest, res: Response) => {
  const { osgbId, month } = req.query as Record<string, any>;
  try {
    const items = await prisma.reconciliation.findMany({
      where: {
        ...(osgbId ? { osgbCompanyId: parseInt(String(osgbId)) } : {}),
        ...(month ? { month: String(month) } : {})
      },
      include: { osgbCompany: true, facility: true }
    });

    const buffer = await exportReconciliationToExcel(items);
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=mutabakat_${month || 'tum'}.xlsx`);
    res.send(buffer);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Excel dışa aktarma başarısız.' });
  }
});

router.post('/reconciliation', async (req: AuthRequest, res: Response) => {
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
  } catch {
    res.status(500).json({ error: 'Mutabakat oluşturulamadı.' });
  }
});

router.put('/reconciliation/:id', async (req: AuthRequest, res: Response) => {
  const id = parseInt(String(req.params.id)); // Cast to string
  const { invoiceAmount, status, note, amount } = req.body;

  try {
    const existing = await prisma.reconciliation.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ error: 'Kayıt bulunamadı.' });

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
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Güncelleme yapılamadı.' });
  }
});

export default router;
