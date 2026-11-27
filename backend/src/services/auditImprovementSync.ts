import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

function mapFindingStatusToImprovement(status?: string | null, progress?: number | null): {
  status: string;
  progress: number;
} {
  if (status === 'Tamamlanan') {
    return { status: 'Tamamlandı', progress: 100 };
  }
  if (status === 'Kısmen İyileştirilen') {
    return { status: 'Devam Ediyor', progress: Math.max(15, Math.min(99, progress || 25)) };
  }
  if (progress && progress > 0) {
    return { status: 'Devam Ediyor', progress: Math.min(99, progress) };
  }
  return { status: 'Başlamadı', progress: 0 };
}

/**
 * Yayınlanan (PUBLISHED) Entegre Denetim Raporundaki bulguları
 * İyileştirme Modülü'ndeki "MERKEZI_DENETIMLER" sekmesine otomatik aktarır / günceller.
 */
export async function syncPublishedAuditToImprovements(
  auditId: string,
  actorUsername?: string
): Promise<void> {
  try {
    const audit = await prisma.integratedAudit.findUnique({
      where: { id: auditId },
      include: {
        findings: {
          include: {
            files: true,
            actions: {
              include: { files: true },
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    if (!audit || audit.status !== 'PUBLISHED') return;

    const actorUser = actorUsername
      ? await prisma.user.findUnique({
          where: { username: actorUsername },
          select: { username: true, fullName: true, title: true },
        })
      : null;

    // Sıradaki rowNo başlangıcını bul
    const lastRecord = await prisma.improvementRecord.findFirst({
      where: { facilityId: audit.facilityId, sheetType: 'MERKEZI_DENETIMLER' },
      orderBy: { rowNo: 'desc' },
      select: { rowNo: true },
    });
    let nextRowNo = (lastRecord?.rowNo || 0) + 1;

    for (const finding of audit.findings) {
      const rootKey = finding.rootFindingId || finding.id;
      const locationStr = [finding.area, finding.subarea].filter(Boolean).join(' — ') || null;
      const assignedStr = (finding.departments || []).filter(Boolean).join(', ') || null;
      const auditLabel = audit.reportNo
        ? `Merkezi Denetim (${audit.reportNo})`
        : 'Merkezi Denetim';

      const imagePhotos = (finding.files || [])
        .filter((f) => !f.type || f.type.startsWith('image/'))
        .slice(0, 3)
        .map((f) => ({
          url: f.url,
          name: f.name || 'bulgu.webp',
          type: f.type || 'image/webp',
          uploadedAt: new Date().toISOString(),
        }));

      const docFiles = (finding.files || [])
        .filter((f) => f.type && !f.type.startsWith('image/'))
        .map((f) => ({
          url: f.url,
          name: f.name || 'dokuman.pdf',
          type: f.type,
          uploadedAt: new Date().toISOString(),
        }));

      const mapped = mapFindingStatusToImprovement(finding.status, finding.progress);
      const latestAction =
        finding.actions && finding.actions.length > 0
          ? finding.actions[finding.actions.length - 1]
          : null;

      const existingRecord = await prisma.improvementRecord.findUnique({
        where: { sourceFindingId: rootKey },
        include: { histories: true },
      });

      let targetRecordId: string;

      if (!existingRecord) {
        const created = await prisma.improvementRecord.create({
          data: {
            facilityId: audit.facilityId,
            moduleGroup: 'DENETIMLER',
            sheetType: 'MERKEZI_DENETIMLER',
            rowNo: nextRowNo++,
            equipmentNo: finding.no,
            equipment: finding.no,
            location: locationStr,
            finding: finding.findingDesc,
            riskScore: finding.risk || 'Önemli',
            assignedTo: assignedStr,
            status: mapped.status,
            progress: mapped.progress,
            actionPlan: finding.recommendation || null,
            currentNote: latestAction?.explanation || null,
            auditName: auditLabel,
            category: finding.category || null,
            recordDate: finding.originReportDate || audit.reportDate,
            dueDate: finding.targetDate || null,
            findingPhotos: imagePhotos as any,
            documents: docFiles as any,
            sourceModule: 'IRSC_AUDIT',
            sourceFindingId: rootKey,
            sourceReportNo: finding.originReportNo || audit.reportNo,
            verificationStatus: finding.status === 'Tamamlanan' ? 'DOGRULANDI' : 'BEKLIYOR',
            verifiedAt: finding.status === 'Tamamlanan' ? new Date() : null,
            verifiedBy: finding.status === 'Tamamlanan' ? (actorUsername || null) : null,
            createdBy: actorUsername || audit.createdBy || 'system',
          },
        });
        targetRecordId = created.id;
      } else {
        targetRecordId = existingRecord.id;
        const shouldCloseFromAudit = finding.status === 'Tamamlanan';
        await prisma.improvementRecord.update({
          where: { id: existingRecord.id },
          data: {
            location: locationStr || existingRecord.location,
            finding: finding.findingDesc || existingRecord.finding,
            riskScore: finding.risk || existingRecord.riskScore,
            assignedTo: assignedStr || existingRecord.assignedTo,
            actionPlan: finding.recommendation || existingRecord.actionPlan,
            category: finding.category || existingRecord.category,
            dueDate: finding.targetDate || existingRecord.dueDate,
            ...(imagePhotos.length > 0 ? { findingPhotos: imagePhotos as any } : {}),
            ...(shouldCloseFromAudit
              ? {
                  status: 'Tamamlandı',
                  progress: 100,
                  verificationStatus: 'DOGRULANDI',
                  verifiedAt: new Date(),
                  verifiedBy: actorUsername || existingRecord.verifiedBy,
                  currentNote:
                    latestAction?.explanation ||
                    existingRecord.currentNote ||
                    `${audit.reportNo} saha denetiminde kontrol edilerek kapatıldı.`,
                }
              : {}),
            updatedBy: actorUsername || existingRecord.updatedBy,
          },
        });
      }

      // Denetim içinden girilmiş (sourceHistoryId olmayan) aksiyon adımlarını ImprovementRecordHistory'ye aktar
      for (const act of finding.actions || []) {
        if (act.sourceHistoryId) continue;

        const actPhotos = (act.files || [])
          .filter((f) => !f.type || f.type.startsWith('image/'))
          .map((f) => ({ url: f.url, name: f.name, type: f.type }));
        const actDocs = (act.files || [])
          .filter((f) => f.type && !f.type.startsWith('image/'))
          .map((f) => ({ url: f.url, name: f.name, type: f.type }));

        const createdHistory = await prisma.improvementRecordHistory.create({
          data: {
            recordId: targetRecordId,
            newNote: act.explanation || act.title || 'Denetim aksiyon kaydı',
            newStatus:
              act.status === 'Tamamlandı'
                ? 'Tamamlandı'
                : act.status === 'Devam Ediyor'
                  ? 'Devam Ediyor'
                  : 'Başlamadı',
            progress:
              act.progress !== null && act.progress !== undefined
                ? act.progress
                : act.status === 'Tamamlandı'
                  ? 100
                  : null,
            progressAdded: act.progressAdded ?? null,
            stepType: act.stepType || 'SAHA_CALISMASI',
            stepTitle: act.title || 'Denetim Aksiyon Kaydı',
            evidencePhotos: {
              photos: actPhotos,
              documents: actDocs,
              stepType: act.stepType || 'SAHA_CALISMASI',
              stepTitle: act.title || 'Denetim Aksiyon Kaydı',
              performedByTitle: act.performedByTitle || actorUser?.title || null,
            } as any,
            changedBy: act.performedBy || actorUsername || 'system',
            changedByName:
              act.performedByName || actorUser?.fullName || actorUsername || 'Sistem',
          },
        });

        await prisma.integratedAction.update({
          where: { id: act.id },
          data: { sourceHistoryId: createdHistory.id },
        });
      }
    }
  } catch (err) {
    console.error('[AuditImprovementSync] syncPublishedAuditToImprovements error:', err);
  }
}

/**
 * İyileştirme Modülü'nde ("MERKEZI_DENETIMLER") bir kayda aksiyon girildiğinde,
 * bağlı olduğu Entegre Denetim bulgusunun (IntegratedFinding) aksiyon geçmişine
 * kullanıcı adı, unvanı, ilerleme yüzdesi ve kanıt görselleriyle otomatik yansıtır.
 *
 * NOT: İyileştirme modülünde "Tamamlandı" yapılsa bile denetim bulgusu otomatik "Tamamlanan"
 * olarak kapatılmaz; "Kısmen İyileştirilen" (%100 saha doğrulaması bekliyor) olarak işaretlenir
 * ki bir sonraki saha denetiminde denetçi yerinde kontrol edip onaylayarak kapatsın.
 */
export async function syncImprovementHistoryToAuditFinding(recordId: string): Promise<void> {
  try {
    const record = await prisma.improvementRecord.findUnique({
      where: { id: recordId },
      include: {
        histories: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!record || record.sourceModule !== 'IRSC_AUDIT' || !record.sourceFindingId) {
      return;
    }

    const rootKey = record.sourceFindingId;

    // Bu kök kimliğe sahip tüm bulguları (en son denetimdeki dahil) getir
    const matchingFindings = await prisma.integratedFinding.findMany({
      where: {
        OR: [{ rootFindingId: rootKey }, { id: rootKey }],
      },
      include: {
        audit: { select: { createdAt: true, status: true } },
        actions: true,
      },
      orderBy: { audit: { createdAt: 'desc' } },
    });

    if (matchingFindings.length === 0) return;

    // Kullanıcıların ad soyad ve unvan bilgilerini tek sorguda çek
    const usernames = Array.from(
      new Set(record.histories.map((h) => h.changedBy).filter(Boolean))
    );
    const users = usernames.length
      ? await prisma.user.findMany({
          where: { username: { in: usernames } },
          select: { username: true, fullName: true, title: true, department: true },
        })
      : [];
    const userInfoMap = new Map(users.map((u) => [u.username, u]));

    // En güncel bulgu kaydına (ve varsa açık taslağa) yeni tarihçe adımlarını işle
    const targetFindings = matchingFindings.filter(
      (f, index) => index === 0 || f.audit.status === 'DRAFT'
    );

    for (const targetFinding of targetFindings) {
      const existingHistoryIds = new Set(
        targetFinding.actions.map((a) => a.sourceHistoryId).filter(Boolean)
      );
      let nextOrder =
        targetFinding.actions.reduce((max, a) => Math.max(max, a.order || 0), 0) + 1;

      for (const h of record.histories) {
        if (existingHistoryIds.has(h.id)) continue;

        const uInfo = userInfoMap.get(h.changedBy);
        let photos: any[] = [];
        let docs: any[] = [];
        let rawTitle: string | null = h.stepTitle || null;
        let rawType: string | null = h.stepType || null;
        let storedTitle: string | null = uInfo?.title || null;

        if (Array.isArray(h.evidencePhotos)) {
          photos = h.evidencePhotos as any[];
        } else if (h.evidencePhotos && typeof h.evidencePhotos === 'object') {
          const obj = h.evidencePhotos as any;
          photos = Array.isArray(obj.photos) ? obj.photos : [];
          docs = Array.isArray(obj.documents) ? obj.documents : [];
          rawTitle = rawTitle || obj.stepTitle || null;
          rawType = rawType || obj.stepType || null;
          storedTitle = storedTitle || obj.performedByTitle || null;
        }

        const mappedStepStatus =
          h.newStatus === 'Tamamlandı'
            ? 'Tamamlandı'
            : h.newStatus === 'İptal Edildi'
              ? 'İptal Edildi'
              : h.newStatus === 'Başlamadı'
                ? 'Başlamadı'
                : 'Devam Ediyor';

        const createdAction = await prisma.integratedAction.create({
          data: {
            findingId: targetFinding.id,
            department:
              uInfo?.department ||
              record.assignedTo?.split(',')[0]?.trim() ||
              'İlgili Birim',
            order: nextOrder++,
            status: mappedStepStatus,
            actionDate: h.createdAt,
            title: rawTitle || 'Merkezi Denetim Aksiyon Girişi',
            explanation: h.newNote,
            completedAt: mappedStepStatus === 'Tamamlandı' ? h.createdAt : null,
            stepType: rawType,
            progress: h.progress ?? null,
            progressAdded: h.progressAdded ?? null,
            performedBy: h.changedBy,
            performedByName: uInfo?.fullName || h.changedByName || h.changedBy,
            performedByTitle: storedTitle || null,
            sourceHistoryId: h.id,
          },
        });

        const allFiles = [...photos, ...docs].filter((f) => f && f.url);
        if (allFiles.length > 0) {
          await prisma.integratedFile.createMany({
            data: allFiles.map((f) => ({
              actionId: createdAction.id,
              name: f.name || 'kanit.webp',
              url: f.url,
              type: f.type || 'image/webp',
            })),
          });
        }
      }

      // Bulgunun ilerleme yüzdesini ve durumunu güncelle:
      // İyileştirme modülünde "Tamamlandı" olsa dahi saha denetçisi onaylayana kadar "Tamamlanan" yapma,
      // "Kısmen İyileştirilen" ve progress=100 yap ki yeni denetimde denetçinin önüne kontrol için gelsin!
      if (targetFinding.status !== 'Tamamlanan') {
        const nextProgress =
          record.status === 'Tamamlandı' ? 100 : Math.max(targetFinding.progress || 0, record.progress || 0);
        const nextFindingStatus =
          nextProgress > 0 || record.histories.length > 0
            ? 'Kısmen İyileştirilen'
            : targetFinding.status;

        await prisma.integratedFinding.update({
          where: { id: targetFinding.id },
          data: {
            progress: nextProgress,
            isStarted: nextProgress > 0 || record.histories.length > 0,
            status: nextFindingStatus,
          },
        });
      }
    }
  } catch (err) {
    console.error('[AuditImprovementSync] syncImprovementHistoryToAuditFinding error:', err);
  }
}
