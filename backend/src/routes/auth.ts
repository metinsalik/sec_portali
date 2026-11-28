import { Router, Response } from 'express';
import ntlm from 'express-ntlm';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getCertificateStatus } from '../services/isgCalculator';

const router = Router();
const prisma = new PrismaClient();

// Password-less Login Endpoint (POST)
router.post('/login', async (req: any, res: Response) => {
  try {
    const { username: inputUsername } = req.body;

    if (!inputUsername) {
      return res.status(400).json({ error: 'Kullanıcı adı gereklidir.' });
    }

    // if (process.env.NODE_ENV !== 'development') {
    //   return res.status(403).json({ error: 'Bu sisteme yalnızca NTLM (Tek Tıkla Giriş) ile erişilebilir. Manuel giriş devre dışıdır.' });
    // }

    const username = inputUsername.toLowerCase();

    let user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: { include: { role: true } },
        facilities: true,
        modules: { include: { module: true } },
      }
    });

    // Removed Development auto-registration block to restrict login to defined users only.

    if (!user) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı. Lütfen sistem yöneticinizle iletişime geçin.' });
    }

    if (!user.isActive) {
      return res.status(401).json({ error: 'Kullanıcı hesabı pasif durumda.' });
    }

    const payload = {
      username: user.username,
      fullName: user.fullName,
      roles: user.roles.map((r: any) => r.role.name),
      facilities: user.facilities.map((f: any) => f.facilityId),
      modules: user.modules ? user.modules.map((m: any) => m.module.code) : [],
      isAdmin: user.roles.some((r: any) => r.role.name === 'admin'),
      isManagement: user.roles.some((r: any) => r.role.name === 'management'),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
    });

    return res.json({ token, user: { ...payload, hasTelegram: !!user.telegramChatId } });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// NTLM Login Endpoint (Keep as fallback)
router.get('/login', ntlm({
  domain: '',
  domaincontroller: ''
}), async (req: any, res: Response) => {
  try {
    let username = req.ntlm?.UserName;

    if (process.env.NODE_ENV === 'development' && process.env.DEV_USER) {
      username = process.env.DEV_USER;
    }

    if (!username) {
      return res.status(401).json({ error: 'NTLM authentication failed' });
    }

    username = username.toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: { include: { role: true } },
        facilities: true,
        modules: { include: { module: true } },
      }
    });

    if (!user || (!user.isActive && username !== process.env.DEV_USER)) {
      return res.status(401).json({ error: 'Kullanıcı bulunamadı veya pasif durumda.' });
    }

    const payload = {
      username: user.username,
      fullName: user.fullName,
      roles: user.roles.map((r: any) => r.role.name),
      facilities: user.facilities.map((f: any) => f.facilityId),
      modules: user.modules ? user.modules.map((m: any) => m.module.code) : [],
      isAdmin: user.roles.some((r: any) => r.role.name === 'admin'),
      isManagement: user.roles.some((r: any) => r.role.name === 'management'),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
    });

    return res.json({ token, user: { ...payload, hasTelegram: !!user.telegramChatId } });
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(500).json({ error: 'Sunucu hatası.' });
  }
});

// Profile / Me Endpoint
router.get('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user!.username;
    const dbUser = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: {
          include: {
            role: {
              include: {
                modules: { include: { module: true } },
              },
            },
          },
        },
        facilities: true,
        modules: { include: { module: true } },
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const isAdmin = dbUser.roles.some((r) => r.role.name === 'admin');
    const isManagement = dbUser.roles.some((r) => r.role.name === 'management');

    const [allOrMatchedModules, professionalRecord] = await Promise.all([
      isAdmin
        ? prisma.module.findMany({ where: { isActive: true }, orderBy: { name: 'asc' } })
        : Promise.resolve([]),
      prisma.professional.findFirst({
        where: {
          isActive: true,
          OR: [
            { username },
            { fullName: { equals: dbUser.fullName, mode: 'insensitive' } },
          ],
        },
        include: {
          assignments: {
            include: {
              facility: {
                select: { id: true, name: true, dangerClass: true, employeeCount: true },
              },
              documents: {
                orderBy: { date: 'desc' },
              },
            },
            orderBy: [{ status: 'asc' }, { startDate: 'desc' }],
          },
        },
      }),
    ]);

    // Kullanıcının doğrudan ve rol üzerinden erişebildiği aktif modülleri birleştir
    const moduleMap = new Map<string, { code: string; name: string; description: string | null; icon: string | null; source: string }>();

    if (isAdmin) {
      allOrMatchedModules.forEach((m) => {
        moduleMap.set(m.code, {
          code: m.code,
          name: m.name,
          description: m.description,
          icon: m.icon,
          source: 'Yönetici Yetkisi',
        });
      });
    } else {
      dbUser.roles.forEach((ur) => {
        ur.role.modules.forEach((rm) => {
          if (rm.module.isActive && !moduleMap.has(rm.module.code)) {
            moduleMap.set(rm.module.code, {
              code: rm.module.code,
              name: rm.module.name,
              description: rm.module.description,
              icon: rm.module.icon,
              source: `Rol (${ur.role.name})`,
            });
          }
        });
      });
      dbUser.modules.forEach((um) => {
        if (um.module.isActive) {
          moduleMap.set(um.module.code, {
            code: um.module.code,
            name: um.module.name,
            description: um.module.description,
            icon: um.module.icon,
            source: 'Özel Atama',
          });
        }
      });
    }

    res.json({
      user: {
        ...req.user,
        username: dbUser.username,
        fullName: dbUser.fullName,
        email: dbUser.email,
        phone: dbUser.phone,
        title: dbUser.title,
        department: dbUser.department,
        employmentType: dbUser.employmentType,
        osgbName: dbUser.osgbName,
        telegramChatId: dbUser.telegramChatId,
        hasTelegram: !!dbUser.telegramChatId,
        roles: dbUser.roles.map((r) => r.role.name),
        facilities: dbUser.facilities.map((f) => f.facilityId),
        modules: Array.from(moduleMap.keys()),
        accessibleModules: Array.from(moduleMap.values()),
        isAdmin,
        isManagement,
        createdAt: dbUser.createdAt,
        updatedAt: dbUser.updatedAt,
        professionalProfile: professionalRecord
          ? {
              id: professionalRecord.id,
              fullName: professionalRecord.fullName,
              employmentType: professionalRecord.employmentType,
              osgbName: professionalRecord.osgbName,
              titleClass: professionalRecord.titleClass,
              certificateNo: professionalRecord.certificateNo,
              certificateDate: professionalRecord.certificateDate,
              certificateStatus: getCertificateStatus(professionalRecord.certificateDate),
              totalAssignedMinutes: professionalRecord.assignments
                .filter((a) => a.status === 'Aktif' || a.status === 'ACTIVE')
                .reduce((sum, a) => sum + (a.durationMinutes || 0), 0),
              assignments: professionalRecord.assignments.map((a) => ({
                id: a.id,
                facilityId: a.facilityId,
                facilityName: a.facility?.name || a.facilityId,
                dangerClass: a.facility?.dangerClass || null,
                employeeCount: a.facility?.employeeCount ?? null,
                type: a.type,
                durationMinutes: a.durationMinutes,
                isFullTime: a.isFullTime,
                startDate: a.startDate,
                endDate: a.endDate,
                status: a.status,
                documents: (a.documents || []).map((doc) => ({
                  id: doc.id,
                  name: doc.name,
                  date: doc.date,
                  filePath: doc.filePath,
                })),
              })),
            }
          : null,
      },
    });
  } catch (error) {
    console.error('GET /auth/me error:', error);
    res.status(500).json({ error: 'Kullanıcı bilgileri alınamadı.' });
  }
});

// Update own profile (fullName, email, phone, title, department, telegramChatId, certificate fields)
router.put('/me', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user!.username;
    const {
      fullName,
      email,
      phone,
      title,
      department,
      telegramChatId,
      titleClass,
      certificateNo,
      certificateDate,
    } = req.body as {
      fullName?: string;
      email?: string | null;
      phone?: string | null;
      title?: string | null;
      department?: string | null;
      telegramChatId?: string | null;
      titleClass?: string | null;
      certificateNo?: string | null;
      certificateDate?: string | null;
    };

    if (fullName !== undefined && !String(fullName).trim()) {
      return res.status(400).json({ error: 'Ad Soyad alanı boş bırakılamaz.' });
    }

    const cleanEmail = email !== undefined ? String(email || '').trim() || null : undefined;
    if (cleanEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return res.status(400).json({ error: 'Lütfen geçerli bir e-posta adresi girin.' });
    }

    let parsedCertDate: Date | null | undefined = undefined;
    if (certificateDate !== undefined) {
      if (!certificateDate) {
        parsedCertDate = null;
      } else {
        const d = new Date(certificateDate);
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: 'Lütfen geçerli bir sertifika tarihi girin.' });
        }
        parsedCertDate = d;
      }
    }

    const updateData: any = {};
    if (fullName !== undefined) updateData.fullName = String(fullName).trim();
    if (email !== undefined) updateData.email = cleanEmail;
    if (phone !== undefined) updateData.phone = String(phone || '').trim() || null;
    if (title !== undefined) updateData.title = String(title || '').trim() || null;
    if (department !== undefined) updateData.department = String(department || '').trim() || null;
    if (telegramChatId !== undefined) {
      const cleanTg = String(telegramChatId || '').trim();
      updateData.telegramChatId = cleanTg || null;
      if (!cleanTg) {
        updateData.telegramConnectToken = null;
      }
    }

    const updated = await prisma.user.update({
      where: { username },
      data: updateData,
      include: {
        roles: { include: { role: true } },
        facilities: true,
        modules: { include: { module: true } },
      },
    });

    const hasCertUpdates =
      titleClass !== undefined || certificateNo !== undefined || certificateDate !== undefined;

    if (hasCertUpdates) {
      const existingProf = await prisma.professional.findFirst({
        where: {
          isActive: true,
          OR: [
            { username },
            { fullName: { equals: updated.fullName, mode: 'insensitive' } },
          ],
        },
      });

      const cleanCertNo =
        certificateNo !== undefined ? String(certificateNo || '').trim() || null : undefined;
      const cleanTitleClass =
        titleClass !== undefined ? String(titleClass || '').trim() || undefined : undefined;

      if (existingProf) {
        await prisma.professional.update({
          where: { id: existingProf.id },
          data: {
            username,
            fullName: updated.fullName,
            email: updated.email,
            phone: updated.phone,
            ...(cleanTitleClass !== undefined ? { titleClass: cleanTitleClass } : {}),
            ...(cleanCertNo !== undefined ? { certificateNo: cleanCertNo } : {}),
            ...(parsedCertDate !== undefined ? { certificateDate: parsedCertDate } : {}),
          },
        });
      } else if (cleanCertNo || parsedCertDate || cleanTitleClass) {
        await prisma.professional.create({
          data: {
            username,
            fullName: updated.fullName,
            employmentType: updated.employmentType || 'Tesis Kadrosu',
            osgbName: updated.osgbName || null,
            titleClass: cleanTitleClass || updated.title || 'A Sınıfı IGU',
            certificateNo: cleanCertNo ?? null,
            certificateDate: parsedCertDate ?? null,
            phone: updated.phone,
            email: updated.email,
            isActive: true,
          },
        });
      }
    }

    const payload = {
      username: updated.username,
      fullName: updated.fullName,
      roles: updated.roles.map((r: any) => r.role.name),
      facilities: updated.facilities.map((f: any) => f.facilityId),
      modules: updated.modules ? updated.modules.map((m: any) => m.module.code) : [],
      isAdmin: updated.roles.some((r: any) => r.role.name === 'admin'),
      isManagement: updated.roles.some((r: any) => r.role.name === 'management'),
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET || 'secret', {
      expiresIn: (process.env.JWT_EXPIRES_IN || '8h') as any,
    });

    res.json({
      success: true,
      token,
      user: {
        ...payload,
        email: updated.email,
        phone: updated.phone,
        title: updated.title,
        department: updated.department,
        telegramChatId: updated.telegramChatId,
        hasTelegram: !!updated.telegramChatId,
      },
    });
  } catch (error: any) {
    if (error?.code === 'P2002') {
      return res.status(409).json({
        error: 'Bu Telegram Chat ID zaten başka bir kullanıcı hesabına bağlı.',
      });
    }
    console.error('PUT /auth/me error:', error);
    res.status(500).json({ error: 'Profil bilgileri güncellenemedi.' });
  }
});

// Active user count endpoint (authenticated)
router.get('/active-count', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const count = await prisma.user.count({
      where: { isActive: true }
    });
    res.json({ count });
  } catch (error) {
    console.error('Active count error:', error);
    res.status(500).json({ error: 'Kullanıcı sayısı alınamadı.' });
  }
});

export default router;
