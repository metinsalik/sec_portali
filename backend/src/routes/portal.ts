import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../middleware/auth';
import { getCertificateStatus } from '../services/isgCalculator';

const router = Router();
const prisma = new PrismaClient();

export interface CockpitItem {
  id: string;
  bucket: 'critical' | 'checklist' | 'routine' | 'announcement';
  source:
    | 'WORKFLOW'
    | 'CHECKLIST'
    | 'IMPROVEMENT'
    | 'FIRE_SAFETY'
    | 'BINA_TURU'
    | 'ELEVATOR'
    | 'FIRE_EQUIPMENT'
    | 'PERIODIC_REPORT'
    | 'NOTIFICATION'
    | 'CERTIFICATE';
  sourceLabel: string;
  title: string;
  subtitle: string;
  facilityName?: string | null;
  dueDate?: string | null;
  isOverdue: boolean;
  daysDiff?: number | null;
  severity: 'critical' | 'warning' | 'info';
  link: string;
  actionLabel: string;
  createdAt: string;
}

router.get('/cockpit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user!.username;
    const requestedFacilityId = typeof req.query.facilityId === 'string' ? req.query.facilityId : '';

    const dbUser = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: { include: { role: true } },
        facilities: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const userRoles = dbUser.roles.map((r) => r.role.name);
    const isAdminOrMgmt = userRoles.includes('admin') || userRoles.includes('management');

    const professional = await prisma.professional.findFirst({
      where: {
        isActive: true,
        OR: [
          { username },
          { fullName: { equals: dbUser.fullName, mode: 'insensitive' } },
        ],
      },
      include: {
        assignments: {
          where: { status: { in: ['Aktif', 'ACTIVE'] } },
          select: { facilityId: true },
        },
      },
    });

    const userFacilityIds = Array.from(
      new Set([
        ...dbUser.facilities.map((f) => f.facilityId),
        ...(professional?.assignments.map((a) => a.facilityId) || []),
      ])
    );

    let scopeFacilityIds: string[] | null = null;
    if (requestedFacilityId && requestedFacilityId !== 'all') {
      scopeFacilityIds =
        isAdminOrMgmt || userFacilityIds.includes(requestedFacilityId)
          ? [requestedFacilityId]
          : userFacilityIds;
    } else if (!isAdminOrMgmt) {
      scopeFacilityIds = userFacilityIds;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plus7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    const plus30Days = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);

    const calcDaysDiff = (d: Date) =>
      Math.floor((new Date(d).getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

    const emptyFacilityScope = scopeFacilityIds !== null && scopeFacilityIds.length === 0;
    const facilityFilter = scopeFacilityIds ? { facilityId: { in: scopeFacilityIds } } : {};

    const [
      wfTasks,
      pendingSubmissions,
      checklistAssignments,
      improvementRecords,
      fireSafetyItems,
      btNonConformities,
      elevatorsDue,
      fireEquipmentsDue,
      periodicReportsDue,
      unreadNotifications,
      activeUsersCount,
    ] = await Promise.all([
      prisma.wfTask.findMany({
        where: {
          status: { not: 'DONE' },
          OR: [{ assigneeId: username }, { followerId: username }],
        },
        orderBy: [{ dueDate: 'asc' }, { updatedAt: 'desc' }],
        take: 20,
      }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.checklistSubmission.findMany({
            where: {
              status: { in: ['BEKLEYEN', 'TASLAK'] },
              OR: [
                { conductedById: username },
                ...(scopeFacilityIds ? [{ facilityId: { in: scopeFacilityIds } }] : []),
              ],
            },
            include: {
              template: { select: { title: true } },
              facility: { select: { name: true } },
            },
            orderBy: { auditDate: 'asc' },
            take: 12,
          }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.checklistAssignment.findMany({
            where: {
              template: { isActive: true },
              ...(scopeFacilityIds ? { facilityIds: { hasSome: scopeFacilityIds } } : {}),
            },
            include: {
              template: { select: { id: true, title: true } },
            },
            orderBy: { createdAt: 'desc' },
            take: 10,
          }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.improvementRecord.findMany({
            where: {
              isArchived: false,
              status: { notIn: ['Tamamlandı', 'İptal Edildi'] },
              OR: [
                { dueDate: { not: null, lte: plus7Days } },
                { riskScore: { in: ['Kritik', 'Yüksek'] } },
              ],
              ...facilityFilter,
            },
            include: { facility: { select: { name: true } } },
            orderBy: { dueDate: 'asc' },
            take: 15,
          }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.fireSafetyItem.findMany({
            where: {
              status: { in: ['ACIK', 'DEVAM_EDIYOR'] },
              OR: [
                { deadlineDate: { not: null, lte: plus7Days } },
                { riskLevel: 'Yüksek' },
              ],
              ...(scopeFacilityIds ? { audit: { facilityId: { in: scopeFacilityIds } } } : {}),
            },
            include: {
              audit: {
                select: { id: true, facility: { select: { name: true } } },
              },
            },
            orderBy: { deadlineDate: 'asc' },
            take: 12,
          }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.bTUygunsuzluk.findMany({
            where: {
              durum: { in: ['ACIK', 'DEVAM_EDIYOR'] },
              terminTarihi: { not: null, lte: plus7Days },
              ...facilityFilter,
            },
            include: { facility: { select: { name: true } } },
            orderBy: { terminTarihi: 'asc' },
            take: 10,
          }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.elevator.findMany({
            where: {
              nextInspectionDate: { not: null, lte: plus30Days },
              ...facilityFilter,
            },
            include: { facility: { select: { name: true } } },
            orderBy: { nextInspectionDate: 'asc' },
            take: 10,
          }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.fireEquipment.findMany({
            where: {
              status: 'AKTIF',
              nextMaintenanceDate: { not: null, lte: plus30Days },
              ...facilityFilter,
            },
            include: {
              facility: { select: { name: true } },
              category: { select: { name: true } },
            },
            orderBy: { nextMaintenanceDate: 'asc' },
            take: 10,
          }),

      emptyFacilityScope
        ? Promise.resolve([])
        : prisma.improvementPeriodicReport.findMany({
            where: {
              nextInspectionDate: { not: null, lte: plus30Days },
              ...facilityFilter,
            },
            include: { facility: { select: { name: true } } },
            orderBy: { nextInspectionDate: 'asc' },
            take: 8,
          }),

      prisma.notification.findMany({
        where: {
          isRead: false,
          OR: [
            { username },
            ...(userRoles.length > 0 ? [{ targetRole: { in: userRoles } }] : []),
            { username: null, targetRole: null },
          ],
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),

      prisma.user.count({ where: { isActive: true } }),
    ]);

    const criticalItems: CockpitItem[] = [];
    const checklistItems: CockpitItem[] = [];
    const routineItems: CockpitItem[] = [];
    const announcements: CockpitItem[] = [];

    let wfBadge = 0;
    let opsMgmtBadge = 0;
    let safetyMgmtBadge = 0;
    let fireEqBadge = 0;
    let binaTuruBadge = 0;

    // 1. İş Takip Görevleri -> Kritik veya Rutin
    wfTasks.forEach((task) => {
      const diff = task.dueDate ? calcDaysDiff(task.dueDate) : null;
      const isOverdue = diff !== null && diff < 0;
      const isCritical =
        isOverdue || task.priority === 'CRITICAL' || task.priority === 'HIGH' || task.status === 'BLOCKED';
      wfBadge++;

      const item: CockpitItem = {
        id: `wf-${task.id}`,
        bucket: isCritical ? 'critical' : 'routine',
        source: 'WORKFLOW',
        sourceLabel: task.assigneeId === username ? 'Bana Atanan Görev' : 'Takip Ettiğim Görev',
        title: task.title,
        subtitle: `Durum: ${task.status} • Öncelik: ${task.priority}`,
        dueDate: task.dueDate ? task.dueDate.toISOString() : null,
        isOverdue,
        daysDiff: diff,
        severity: isOverdue || task.priority === 'CRITICAL' ? 'critical' : isCritical ? 'warning' : 'info',
        link: `/workflow/tasks/${task.id}`,
        actionLabel: 'Göreve Git',
        createdAt: task.updatedAt.toISOString(),
      };
      if (isCritical) criticalItems.push(item);
      else routineItems.push(item);
    });

    // 2. İyileştirme & Aksiyon Kayıtları
    improvementRecords.forEach((rec) => {
      const diff = rec.dueDate ? calcDaysDiff(rec.dueDate) : null;
      const isOverdue = diff !== null && diff < 0;
      const isCrit = isOverdue || rec.riskScore === 'Kritik' || rec.riskScore === 'Yüksek';
      opsMgmtBadge++;

      const item: CockpitItem = {
        id: `imp-${rec.id}`,
        bucket: isCrit ? 'critical' : 'routine',
        source: 'IMPROVEMENT',
        sourceLabel: rec.riskScore ? `İyileştirme (${rec.riskScore})` : 'İyileştirme Aksiyonu',
        title: rec.finding.length > 95 ? `${rec.finding.slice(0, 95)}...` : rec.finding,
        subtitle: `${rec.facility?.name || ''}${rec.assignedTo ? ` • Sorumlu: ${rec.assignedTo}` : ''}`,
        facilityName: rec.facility?.name,
        dueDate: rec.dueDate ? rec.dueDate.toISOString() : null,
        isOverdue,
        daysDiff: diff,
        severity: isOverdue || rec.riskScore === 'Kritik' ? 'critical' : 'warning',
        link: `/operations-management/improvements/records/${rec.id}`,
        actionLabel: 'İncele',
        createdAt: rec.createdAt.toISOString(),
      };
      if (isCrit) criticalItems.push(item);
      else routineItems.push(item);
    });

    // 3. Yangın Güvenliği Maddeleri
    fireSafetyItems.forEach((item) => {
      const diff = item.deadlineDate ? calcDaysDiff(item.deadlineDate) : null;
      const isOverdue = diff !== null && diff < 0;
      const isCrit = isOverdue || item.riskLevel === 'Yüksek';
      opsMgmtBadge++;

      const cockpitItem: CockpitItem = {
        id: `fs-${item.id}`,
        bucket: isCrit ? 'critical' : 'routine',
        source: 'FIRE_SAFETY',
        sourceLabel: 'Yangın Güvenliği',
        title: item.topic.length > 95 ? `${item.topic.slice(0, 95)}...` : item.topic,
        subtitle: `${item.audit?.facility?.name || ''} • Sorumlu: ${item.responsible}`,
        facilityName: item.audit?.facility?.name,
        dueDate: item.deadlineDate ? item.deadlineDate.toISOString() : null,
        isOverdue,
        daysDiff: diff,
        severity: isOverdue ? 'critical' : 'warning',
        link: `/fire-safety-control/audit/${item.auditId}`,
        actionLabel: 'Tutanağa Git',
        createdAt: item.createdAt.toISOString(),
      };
      if (isCrit) criticalItems.push(cockpitItem);
      else routineItems.push(cockpitItem);
    });

    // 4. Bina Turu Uygunsuzlukları
    btNonConformities.forEach((bt) => {
      const diff = bt.terminTarihi ? calcDaysDiff(bt.terminTarihi) : null;
      const isOverdue = diff !== null && diff < 0;
      binaTuruBadge++;

      const cockpitItem: CockpitItem = {
        id: `bt-${bt.id}`,
        bucket: isOverdue ? 'critical' : 'routine',
        source: 'BINA_TURU',
        sourceLabel: 'Bina Turu',
        title: bt.yapilacaklar || 'Bina Turu Uygunsuzluğu',
        subtitle: `${bt.facility?.name || ''} • Durum: ${bt.durum}`,
        facilityName: bt.facility?.name,
        dueDate: bt.terminTarihi ? bt.terminTarihi.toISOString() : null,
        isOverdue,
        daysDiff: diff,
        severity: isOverdue ? 'critical' : 'warning',
        link: '/bina-turu/uygunsuzluklar',
        actionLabel: 'Görüntüle',
        createdAt: bt.createdAt.toISOString(),
      };
      if (isOverdue) criticalItems.push(cockpitItem);
      else routineItems.push(cockpitItem);
    });

    // 5. Tanımlanmış & Bekleyen Kontrol Listeleri (Ayrı Kart)
    pendingSubmissions.forEach((sub) => {
      const diff = calcDaysDiff(sub.auditDate);
      const isOverdue = diff < 0;
      safetyMgmtBadge++;
      checklistItems.push({
        id: `chk-sub-${sub.id}`,
        bucket: 'checklist',
        source: 'CHECKLIST',
        sourceLabel: sub.status === 'TASLAK' ? 'Taslak Denetim' : 'Bekleyen Denetim',
        title: sub.template?.title || 'Kontrol Listesi',
        subtitle: `${sub.facility?.name || ''} • Durum: ${sub.status}`,
        facilityName: sub.facility?.name,
        dueDate: sub.auditDate.toISOString(),
        isOverdue,
        daysDiff: diff,
        severity: isOverdue ? 'critical' : 'warning',
        link: `/checklists/submissions/${sub.id}`,
        actionLabel: 'Devam Et',
        createdAt: sub.createdAt.toISOString(),
      });
    });

    checklistAssignments.forEach((asg) => {
      if (!asg.template) return;
      safetyMgmtBadge++;
      checklistItems.push({
        id: `chk-asg-${asg.id}`,
        bucket: 'checklist',
        source: 'CHECKLIST',
        sourceLabel: asg.isPeriodic ? 'Periyodik Kontrol Listesi' : 'Yayınlanan Kontrol Listesi',
        title: asg.template.title,
        subtitle: asg.isPeriodic
          ? `Periyot: Her ${asg.periodValue || 1} ${asg.periodType || 'Dönem'}`
          : 'Tanımlanmış Kontrol Listesi',
        dueDate: asg.endDate ? asg.endDate.toISOString() : null,
        isOverdue: false,
        daysDiff: asg.endDate ? calcDaysDiff(asg.endDate) : null,
        severity: 'info',
        link: `/checklists/submissions/new?templateId=${asg.template.id}`,
        actionLabel: 'Doldur',
        createdAt: asg.createdAt.toISOString(),
      });
    });

    // 6. Rutin & Zamanı Yaklaşanlar (Asansör, Yangın Ekipmanı, Periyodik Kontrol, Sertifika)
    elevatorsDue.forEach((el) => {
      const diff = el.nextInspectionDate ? calcDaysDiff(el.nextInspectionDate) : null;
      const isOverdue = diff !== null && diff < 0;
      safetyMgmtBadge++;
      routineItems.push({
        id: `elv-${el.id}`,
        bucket: 'routine',
        source: 'ELEVATOR',
        sourceLabel: 'Asansör Muayenesi',
        title: `${el.elevatorNo}${el.name ? ` — ${el.name}` : ''}`,
        subtitle: `${el.facility?.name || ''}${el.label ? ` • Etiket: ${el.label}` : ''}`,
        facilityName: el.facility?.name,
        dueDate: el.nextInspectionDate ? el.nextInspectionDate.toISOString() : null,
        isOverdue,
        daysDiff: diff,
        severity: isOverdue ? 'critical' : diff !== null && diff <= 10 ? 'warning' : 'info',
        link: `/safety-management/elevator-tracking/${el.id}`,
        actionLabel: 'Asansöre Git',
        createdAt: el.updatedAt.toISOString(),
      });
    });

    fireEquipmentsDue.forEach((eq) => {
      const diff = eq.nextMaintenanceDate ? calcDaysDiff(eq.nextMaintenanceDate) : null;
      const isOverdue = diff !== null && diff < 0;
      fireEqBadge++;
      routineItems.push({
        id: `feq-${eq.id}`,
        bucket: 'routine',
        source: 'FIRE_EQUIPMENT',
        sourceLabel: 'Yangın Ekipmanı Bakımı',
        title: `${eq.category?.name || 'Ekipman'} (${eq.equipmentNo})`,
        subtitle: `${eq.facility?.name || ''}`,
        facilityName: eq.facility?.name,
        dueDate: eq.nextMaintenanceDate ? eq.nextMaintenanceDate.toISOString() : null,
        isOverdue,
        daysDiff: diff,
        severity: isOverdue ? 'critical' : diff !== null && diff <= 10 ? 'warning' : 'info',
        link: `/fire-equipment/view/${eq.id}`,
        actionLabel: 'Ekipmana Git',
        createdAt: eq.updatedAt.toISOString(),
      });
    });

    periodicReportsDue.forEach((rep) => {
      const diff = rep.nextInspectionDate ? calcDaysDiff(rep.nextInspectionDate) : null;
      const isOverdue = diff !== null && diff < 0;
      opsMgmtBadge++;
      routineItems.push({
        id: `pk-${rep.id}`,
        bucket: 'routine',
        source: 'PERIODIC_REPORT',
        sourceLabel: `Periyodik Kontrol (${rep.sheetType})`,
        title: rep.reportNo ? `Rapor No: ${rep.reportNo}` : `${rep.sheetType} Kontrolü`,
        subtitle: `${rep.facility?.name || ''}${rep.firmName ? ` • ${rep.firmName}` : ''}`,
        facilityName: rep.facility?.name,
        dueDate: rep.nextInspectionDate ? rep.nextInspectionDate.toISOString() : null,
        isOverdue,
        daysDiff: diff,
        severity: isOverdue ? 'critical' : 'warning',
        link: '/operations-management/improvements',
        actionLabel: 'Kontrole Git',
        createdAt: rep.updatedAt.toISOString(),
      });
    });

    if (professional?.certificateDate) {
      const certStatus = getCertificateStatus(professional.certificateDate);
      if (certStatus.isExpired || certStatus.isCritical || certStatus.isWarning) {
        const certItem: CockpitItem = {
          id: `cert-${professional.id}`,
          bucket: certStatus.isExpired ? 'critical' : 'routine',
          source: 'CERTIFICATE',
          sourceLabel: 'Sertifika Vize Takibi',
          title: certStatus.isExpired
            ? 'İSG Sertifika Vize Süresi Dolmuş'
            : `İSG Sertifika Vizesine ${certStatus.daysLeft} Gün Kaldı`,
          subtitle: `${professional.titleClass}${professional.certificateNo ? ` • Belge No: ${professional.certificateNo}` : ''}`,
          isOverdue: certStatus.isExpired,
          daysDiff: certStatus.daysLeft,
          severity: certStatus.isExpired || certStatus.isCritical ? 'critical' : 'warning',
          link: '/profile',
          actionLabel: 'Profili Aç',
          createdAt: now.toISOString(),
        };
        if (certStatus.isExpired) criticalItems.push(certItem);
        else routineItems.push(certItem);
      }
    }

    // 7. Okunmamış Bildirimler
    unreadNotifications.forEach((n) => {
      announcements.push({
        id: `notif-${n.id}`,
        bucket: 'announcement',
        source: 'NOTIFICATION',
        sourceLabel: n.module || 'Sistem Duyurusu',
        title: n.title,
        subtitle: n.message.length > 100 ? `${n.message.slice(0, 100)}...` : n.message,
        isOverdue: false,
        severity: n.type === 'ERROR' || n.type === 'CRITICAL' ? 'critical' : n.type === 'WARNING' ? 'warning' : 'info',
        link: n.link || '/notifications',
        actionLabel: 'Aç',
        createdAt: n.createdAt.toISOString(),
      });
    });

    const sortByDue = (arr: CockpitItem[]) =>
      arr.sort((a, b) => {
        if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
        if (a.daysDiff !== undefined && a.daysDiff !== null && b.daysDiff !== undefined && b.daysDiff !== null) {
          return a.daysDiff - b.daysDiff;
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

    sortByDue(criticalItems);
    sortByDue(checklistItems);
    sortByDue(routineItems);

    res.json({
      summary: {
        criticalCount: criticalItems.length,
        checklistCount: checklistItems.length,
        routineCount: routineItems.length,
        unreadNotificationsCount: announcements.length,
        activeUsersCount,
      },
      moduleBadges: {
        WORKFLOW: wfBadge,
        OPERATIONS_MANAGEMENT: opsMgmtBadge,
        SAFETY_MANAGEMENT: safetyMgmtBadge,
        FIRE_EQUIPMENT: fireEqBadge,
        BUILDING_TOUR: binaTuruBadge,
      },
      criticalItems: criticalItems.slice(0, 20),
      checklistItems: checklistItems.slice(0, 15),
      routineItems: routineItems.slice(0, 20),
      announcements: announcements.slice(0, 10),
    });
  } catch (error) {
    console.error('GET /portal/cockpit error:', error);
    res.status(500).json({ error: 'Kokpit verileri yüklenemedi.' });
  }
});

// Domain-specific Cockpit for /operations-management and /safety-management
router.get('/domain-cockpit', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const username = req.user!.username;
    const domain = req.query.domain === 'safety' ? 'safety' : 'operations';
    const requestedFacilityId = typeof req.query.facilityId === 'string' ? req.query.facilityId : '';

    const dbUser = await prisma.user.findUnique({
      where: { username },
      include: {
        roles: { include: { role: true } },
        facilities: true,
      },
    });

    if (!dbUser) {
      return res.status(404).json({ error: 'Kullanıcı bulunamadı.' });
    }

    const userRoles = dbUser.roles.map((r) => r.role.name);
    const isAdminOrMgmt = userRoles.includes('admin') || userRoles.includes('management');

    const professional = await prisma.professional.findFirst({
      where: {
        isActive: true,
        OR: [
          { username },
          { fullName: { equals: dbUser.fullName, mode: 'insensitive' } },
        ],
      },
      include: {
        assignments: {
          where: { status: { in: ['Aktif', 'ACTIVE'] } },
          select: { facilityId: true },
        },
      },
    });

    const userFacilityIds = Array.from(
      new Set([
        ...dbUser.facilities.map((f) => f.facilityId),
        ...(professional?.assignments.map((a) => a.facilityId) || []),
      ])
    );

    let scopeFacilityIds: string[] | null = null;
    if (requestedFacilityId && requestedFacilityId !== 'all') {
      scopeFacilityIds =
        isAdminOrMgmt || userFacilityIds.includes(requestedFacilityId)
          ? [requestedFacilityId]
          : userFacilityIds;
    } else if (!isAdminOrMgmt) {
      scopeFacilityIds = userFacilityIds;
    }

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const plus7Days = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000);
    const plus30Days = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000);

    const calcDaysDiff = (d: Date) =>
      Math.floor((new Date(d).getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

    const emptyScope = scopeFacilityIds !== null && scopeFacilityIds.length === 0;
    const facilityFilter = scopeFacilityIds ? { facilityId: { in: scopeFacilityIds } } : {};

    const fullNameLower = (dbUser.fullName || '').toLowerCase();
    const deptLower = (dbUser.department || '').toLowerCase();
    const matchesPerson = (text?: string | null) => {
      if (!text) return false;
      const t = text.toLowerCase();
      return (fullNameLower && t.includes(fullNameLower)) || (deptLower && t.includes(deptLower));
    };

    interface DomainItem {
      id: string;
      moduleKey: string;
      moduleLabel: string;
      title: string;
      subtitle: string;
      isMine: boolean;
      isOverdue: boolean;
      daysDiff: number | null;
      severity: 'critical' | 'warning' | 'info';
      link: string;
      actionLabel: string;
    }

    const items: DomainItem[] = [];
    const moduleCounts: Record<string, number> = {};

    if (domain === 'operations') {
      const [
        fireSafetyItems,
        fm200Orders,
        improvementRecords,
        thermalItems,
        integratedFindings,
      ] = emptyScope
        ? [[], [], [], [], []]
        : await Promise.all([
            prisma.fireSafetyItem.findMany({
              where: {
                status: { in: ['ACIK', 'DEVAM_EDIYOR'] },
                ...(scopeFacilityIds ? { audit: { facilityId: { in: scopeFacilityIds } } } : {}),
              },
              include: { audit: { select: { id: true, facility: { select: { name: true } } } } },
              orderBy: { deadlineDate: 'asc' },
              take: 25,
            }),
            prisma.fm200WorkOrder.findMany({
              where: {
                status: { not: 'Tamamlandi' },
                ...(scopeFacilityIds ? { location: { facilityId: { in: scopeFacilityIds } } } : {}),
              },
              include: { location: { select: { systemUid: true, facility: { select: { name: true } } } } },
              orderBy: { dueDate: 'asc' },
              take: 20,
            }),
            prisma.improvementRecord.findMany({
              where: {
                isArchived: false,
                status: { notIn: ['Tamamlandı', 'İptal Edildi'] },
                ...facilityFilter,
              },
              include: { facility: { select: { name: true } } },
              orderBy: { dueDate: 'asc' },
              take: 30,
            }),
            prisma.thermalInspectionItem.findMany({
              where: {
                status: { in: ['Kritik', 'Dikkat'] },
                actionStatus: { notIn: ['TAMAMLANDI', 'IPTAL'] },
                ...(scopeFacilityIds ? { session: { facilityId: { in: scopeFacilityIds } } } : {}),
              },
              include: { session: { select: { facility: { select: { name: true } } } } },
              orderBy: { actionDueDate: 'asc' },
              take: 15,
            }),
            prisma.integratedFinding.findMany({
              where: {
                status: { notIn: ['Tamamlandı', 'Kapatıldı', 'Kapalı'] },
                ...(scopeFacilityIds ? { audit: { facilityId: { in: scopeFacilityIds } } } : {}),
              },
              include: { audit: { select: { id: true, reportNo: true, facility: { select: { name: true } } } } },
              orderBy: { targetDate: 'asc' },
              take: 15,
            }),
          ]);

      moduleCounts.FIRE_SAFETY_CONTROL = fireSafetyItems.length;
      moduleCounts.FM200_TRACKING = fm200Orders.length;
      moduleCounts.IMPROVEMENTS_TRACKING = improvementRecords.length;
      moduleCounts.THERMAL_CAMERA = thermalItems.length;
      moduleCounts.RENOVATION_REPORT = integratedFindings.length;
      moduleCounts.PANEL = 0;

      if (professional?.certificateDate) {
        const cert = getCertificateStatus(professional.certificateDate);
        if (cert.isExpired || cert.isCritical || cert.isWarning) {
          moduleCounts.PANEL = 1;
          items.push({
            id: `op-panel-cert`,
            moduleKey: 'PANEL',
            moduleLabel: 'İSG Atama Paneli',
            title: cert.isExpired ? 'Sertifika Vize Süresi Dolmuş' : `Sertifika Vizesine ${cert.daysLeft} Gün`,
            subtitle: `${professional.titleClass}`,
            isMine: true,
            isOverdue: cert.isExpired,
            daysDiff: cert.daysLeft,
            severity: cert.isExpired || cert.isCritical ? 'critical' : 'warning',
            link: '/panel',
            actionLabel: 'Panele Git',
          });
        }
      }

      fireSafetyItems.forEach((f) => {
        const diff = f.deadlineDate ? calcDaysDiff(f.deadlineDate) : null;
        const isOverdue = diff !== null && diff < 0;
        const isMine = matchesPerson(f.responsible);
        if (isMine || isOverdue || f.riskLevel === 'Yüksek') {
          items.push({
            id: `op-fs-${f.id}`,
            moduleKey: 'FIRE_SAFETY_CONTROL',
            moduleLabel: 'Yangın Güvenliği',
            title: f.topic.length > 80 ? `${f.topic.slice(0, 80)}...` : f.topic,
            subtitle: `${f.audit?.facility?.name || ''} • ${f.responsible}`,
            isMine,
            isOverdue,
            daysDiff: diff,
            severity: isOverdue ? 'critical' : f.riskLevel === 'Yüksek' ? 'warning' : 'info',
            link: `/fire-safety-control/audit/${f.auditId}`,
            actionLabel: 'Tutanağa Git',
          });
        }
      });

      fm200Orders.forEach((wo) => {
        const diff = wo.dueDate ? calcDaysDiff(wo.dueDate) : null;
        const isOverdue = diff !== null && diff < 0;
        const isMine = matchesPerson(wo.responsible);
        items.push({
          id: `op-fm-${wo.id}`,
          moduleKey: 'FM200_TRACKING',
          moduleLabel: 'FM-200 İş Emri',
          title: wo.title,
          subtitle: `${wo.location?.facility?.name || ''} • ${wo.location?.systemUid || ''} (${wo.responsible})`,
          isMine,
          isOverdue,
          daysDiff: diff,
          severity: isOverdue || wo.status === 'Revize_Gerekli' ? 'critical' : 'warning',
          link: '/fm200/work-orders',
          actionLabel: 'İş Emrine Git',
        });
      });

      improvementRecords.forEach((rec) => {
        const diff = rec.dueDate ? calcDaysDiff(rec.dueDate) : null;
        const isOverdue = diff !== null && diff < 0;
        const isMine = matchesPerson(rec.assignedTo);
        if (isMine || isOverdue || rec.riskScore === 'Kritik') {
          items.push({
            id: `op-imp-${rec.id}`,
            moduleKey: 'IMPROVEMENTS_TRACKING',
            moduleLabel: 'İyileştirme Takibi',
            title: rec.finding.length > 80 ? `${rec.finding.slice(0, 80)}...` : rec.finding,
            subtitle: `${rec.facility?.name || ''}${rec.assignedTo ? ` • ${rec.assignedTo}` : ''}`,
            isMine,
            isOverdue,
            daysDiff: diff,
            severity: isOverdue || rec.riskScore === 'Kritik' ? 'critical' : 'warning',
            link: `/operations-management/improvements/records/${rec.id}`,
            actionLabel: 'İncele',
          });
        }
      });

      thermalItems.forEach((th) => {
        const diff = th.actionDueDate ? calcDaysDiff(th.actionDueDate) : null;
        const isOverdue = diff !== null && diff < 0;
        const isMine = matchesPerson(th.actionAssignee);
        items.push({
          id: `op-th-${th.id}`,
          moduleKey: 'THERMAL_CAMERA',
          moduleLabel: 'Termal Kamera',
          title: `${th.panelName}${th.measuredTemp != null ? ` (${th.measuredTemp}°C)` : ''}`,
          subtitle: `${th.session?.facility?.name || ''} • Durum: ${th.status}`,
          isMine,
          isOverdue,
          daysDiff: diff,
          severity: th.status === 'Kritik' || isOverdue ? 'critical' : 'warning',
          link: '/operations-management/thermal-camera?tab=table',
          actionLabel: 'Panoya Git',
        });
      });

      integratedFindings.forEach((inf) => {
        const diff = inf.targetDate ? calcDaysDiff(inf.targetDate) : null;
        const isOverdue = diff !== null && diff < 0;
        const isMine = inf.departments.some((d) => matchesPerson(d));
        if (isMine || isOverdue) {
          items.push({
            id: `op-ir-${inf.id}`,
            moduleKey: 'RENOVATION_REPORT',
            moduleLabel: 'Entegre Denetim',
            title: inf.findingDesc.length > 80 ? `${inf.findingDesc.slice(0, 80)}...` : inf.findingDesc,
            subtitle: `${inf.audit?.facility?.name || ''} • Rapor: ${inf.audit?.reportNo || ''}`,
            isMine,
            isOverdue,
            daysDiff: diff,
            severity: isOverdue ? 'critical' : 'warning',
            link: '/renovation-report',
            actionLabel: 'Denetime Git',
          });
        }
      });
    } else {
      // domain === 'safety' (İSG Kurul hariç!)
      const [
        pendingSubmissions,
        checklistAssignments,
        elevatorsDue,
        risksOpen,
        notebookItems,
        electricItems,
        spillActions,
      ] = emptyScope
        ? [[], [], [], [], [], [], []]
        : await Promise.all([
            prisma.checklistSubmission.findMany({
              where: {
                status: { in: ['BEKLEYEN', 'TASLAK'] },
                OR: [
                  { conductedById: username },
                  ...(scopeFacilityIds ? [{ facilityId: { in: scopeFacilityIds } }] : []),
                ],
              },
              include: { template: { select: { title: true } }, facility: { select: { name: true } } },
              orderBy: { auditDate: 'asc' },
              take: 12,
            }),
            prisma.checklistAssignment.findMany({
              where: {
                template: { isActive: true },
                ...(scopeFacilityIds ? { facilityIds: { hasSome: scopeFacilityIds } } : {}),
              },
              include: { template: { select: { id: true, title: true } } },
              orderBy: { createdAt: 'desc' },
              take: 10,
            }),
            prisma.elevator.findMany({
              where: {
                nextInspectionDate: { not: null, lte: plus30Days },
                ...facilityFilter,
              },
              include: { facility: { select: { name: true } } },
              orderBy: { nextInspectionDate: 'asc' },
              take: 15,
            }),
            prisma.riskLifecycle.findMany({
              where: {
                status: { notIn: ['KAPALI', 'TAMAMLANDI', 'KAPATILDI'] },
                dueDate: { not: null, lte: plus7Days },
                ...(scopeFacilityIds ? { location: { facilityId: { in: scopeFacilityIds } } } : {}),
              },
              include: { location: { select: { facility: { select: { name: true } } } } },
              orderBy: { dueDate: 'asc' },
              take: 15,
            }),
            prisma.notebookItem.findMany({
              where: {
                status: { in: ['Açık', 'Devam Ediyor'] },
                ...(scopeFacilityIds ? { page: { facilityId: { in: scopeFacilityIds } } } : {}),
              },
              include: { page: { select: { facility: { select: { name: true } } } } },
              orderBy: { createdAt: 'desc' },
              take: 12,
            }),
            prisma.electricInfrastructureRecord.findMany({
              where: {
                actionStatus: { in: ['Açık', 'Devam Ediyor'] },
                ...facilityFilter,
              },
              include: { facility: { select: { name: true } } },
              orderBy: { deadlineDate: 'asc' },
              take: 12,
            }),
            prisma.hazmatSpillKitAction.findMany({
              where: {
                status: { in: ['Açık', 'Devam Ediyor'] },
                ...(scopeFacilityIds ? { placement: { kit: { facilityId: { in: scopeFacilityIds } } } } : {}),
              },
              include: { placement: { select: { unit: true, kit: { select: { kitName: true, facility: { select: { name: true } } } } } } },
              orderBy: { dueDate: 'asc' },
              take: 10,
            }),
          ]);

      moduleCounts.CHECKLISTS = pendingSubmissions.length + checklistAssignments.length;
      moduleCounts.ELEVATOR_TRACKING = elevatorsDue.length;
      moduleCounts.RISKS = risksOpen.length;
      moduleCounts.ISG_DEFTER = notebookItems.length;
      moduleCounts.ELECTRIC_INFRASTRUCTURE = electricItems.length;
      moduleCounts.HAZMAT = spillActions.length;

      pendingSubmissions.forEach((sub) => {
        const diff = calcDaysDiff(sub.auditDate);
        const isOverdue = diff < 0;
        items.push({
          id: `sf-sub-${sub.id}`,
          moduleKey: 'CHECKLISTS',
          moduleLabel: 'Kontrol Listesi',
          title: sub.template?.title || 'Bekleyen Denetim',
          subtitle: `${sub.facility?.name || ''} • ${sub.status}`,
          isMine: sub.conductedById === username,
          isOverdue,
          daysDiff: diff,
          severity: isOverdue ? 'critical' : 'warning',
          link: `/checklists/submissions/${sub.id}`,
          actionLabel: 'Devam Et',
        });
      });

      checklistAssignments.forEach((asg) => {
        if (!asg.template) return;
        items.push({
          id: `sf-asg-${asg.id}`,
          moduleKey: 'CHECKLISTS',
          moduleLabel: 'Tanımlı Kontrol Listesi',
          title: asg.template.title,
          subtitle: asg.isPeriodic
            ? `Periyot: ${asg.periodValue || 1} ${asg.periodType || 'Dönem'}`
            : 'Yayınlanan Liste',
          isMine: true,
          isOverdue: false,
          daysDiff: asg.endDate ? calcDaysDiff(asg.endDate) : null,
          severity: 'info',
          link: `/checklists/submissions/new?templateId=${asg.template.id}`,
          actionLabel: 'Doldur',
        });
      });

      elevatorsDue.forEach((el) => {
        const diff = el.nextInspectionDate ? calcDaysDiff(el.nextInspectionDate) : null;
        const isOverdue = diff !== null && diff < 0;
        items.push({
          id: `sf-elv-${el.id}`,
          moduleKey: 'ELEVATOR_TRACKING',
          moduleLabel: 'Asansör Muayenesi',
          title: `${el.elevatorNo}${el.name ? ` — ${el.name}` : ''}`,
          subtitle: `${el.facility?.name || ''}${el.label ? ` • ${el.label}` : ''}`,
          isMine: false,
          isOverdue,
          daysDiff: diff,
          severity: isOverdue ? 'critical' : 'warning',
          link: `/safety-management/elevator-tracking/${el.id}`,
          actionLabel: 'İncele',
        });
      });

      risksOpen.forEach((rk) => {
        const diff = rk.dueDate ? calcDaysDiff(rk.dueDate) : null;
        const isOverdue = diff !== null && diff < 0;
        const isMine = matchesPerson(rk.improvementResponsible);
        items.push({
          id: `sf-rk-${rk.id}`,
          moduleKey: 'RISKS',
          moduleLabel: `Risk #${rk.riskNo}`,
          title: rk.hazard.length > 80 ? `${rk.hazard.slice(0, 80)}...` : rk.hazard,
          subtitle: `${rk.location?.facility?.name || ''} • ${rk.initialLevel}`,
          isMine,
          isOverdue,
          daysDiff: diff,
          severity: isOverdue ? 'critical' : 'warning',
          link: '/risks',
          actionLabel: 'Riske Git',
        });
      });

      notebookItems.forEach((nb) => {
        items.push({
          id: `sf-nb-${nb.id}`,
          moduleKey: 'ISG_DEFTER',
          moduleLabel: 'Tespit & Öneri Defteri',
          title: nb.content.length > 80 ? `${nb.content.slice(0, 80)}...` : nb.content,
          subtitle: `${nb.page?.facility?.name || ''} • ${nb.riskLevel}`,
          isMine: matchesPerson(nb.authorName),
          isOverdue: false,
          daysDiff: null,
          severity: nb.riskLevel === 'Yüksek' ? 'warning' : 'info',
          link: `/safety-management/isg-defter/items/${nb.id}`,
          actionLabel: 'Deftere Git',
        });
      });

      electricItems.forEach((el) => {
        const diff = el.deadlineDate ? calcDaysDiff(el.deadlineDate) : null;
        const isOverdue = diff !== null && diff < 0;
        items.push({
          id: `sf-elc-${el.id}`,
          moduleKey: 'ELECTRIC_INFRASTRUCTURE',
          moduleLabel: 'Elektrik Altyapı',
          title: `${el.equipmentCodeName} — ${el.detectedRisk || 'Açık Aksiyon'}`,
          subtitle: `${el.facility?.name || ''}${el.responsiblePerson ? ` • ${el.responsiblePerson}` : ''}`,
          isMine: matchesPerson(el.responsiblePerson),
          isOverdue,
          daysDiff: diff,
          severity: isOverdue ? 'critical' : 'warning',
          link: `/safety-management/electric-infrastructure/${el.id}`,
          actionLabel: 'Forma Git',
        });
      });

      spillActions.forEach((sp) => {
        const diff = sp.dueDate ? calcDaysDiff(sp.dueDate) : null;
        const isOverdue = diff !== null && diff < 0;
        items.push({
          id: `sf-sp-${sp.id}`,
          moduleKey: 'HAZMAT',
          moduleLabel: 'Dökülme Kiti Aksiyonu',
          title: sp.description || sp.placement?.kit?.kitName || 'Kit Aksiyonu',
          subtitle: `${sp.placement?.kit?.facility?.name || ''} • ${sp.placement?.unit || ''}`,
          isMine: matchesPerson(sp.owner),
          isOverdue,
          daysDiff: diff,
          severity: isOverdue ? 'critical' : 'warning',
          link: '/hazmat/dashboard',
          actionLabel: 'Modüle Git',
        });
      });
    }

    // Öncelik sırası: Bana atanmış/geciken -> Geciken -> Kritik -> Yaklaşan
    items.sort((a, b) => {
      if (a.isMine !== b.isMine) return a.isMine ? -1 : 1;
      if (a.isOverdue !== b.isOverdue) return a.isOverdue ? -1 : 1;
      const sevW = { critical: 0, warning: 1, info: 2 };
      if (sevW[a.severity] !== sevW[b.severity]) return sevW[a.severity] - sevW[b.severity];
      return (a.daysDiff ?? 999) - (b.daysDiff ?? 999);
    });

    res.json({
      domain,
      moduleCounts,
      items: items.slice(0, 18),
    });
  } catch (error) {
    console.error('GET /portal/domain-cockpit error:', error);
    res.status(500).json({ error: 'Alan kokpit verileri yüklenemedi.' });
  }
});

export default router;
