import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import { format } from 'date-fns';
import { tr } from 'date-fns/locale';

const router = Router();
const prisma = new PrismaClient();

router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, year, groupId, templateId, categoryId } = req.query;

    let whereClause: any = {};

    // 1. Facility Filtering
    if (facilityId && facilityId !== 'all' && typeof facilityId === 'string') {
      whereClause.facilityId = facilityId;
    }

    if (req.user && !req.user.isAdmin && !req.user.isManagement && !req.user.roles?.includes('admin')) {
      if (req.user.facilities && req.user.facilities.length > 0) {
        if (whereClause.facilityId) {
          if (!req.user.facilities.includes(whereClause.facilityId)) {
            whereClause.facilityId = 'UNAUTHORIZED';
          }
        } else {
          whereClause.facilityId = { in: req.user.facilities };
        }
      } else {
        whereClause.facilityId = 'UNAUTHORIZED';
      }
    }

    // 2. Year / Date Filtering
    if (year && year !== 'all' && typeof year === 'string') {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        whereClause.auditDate = {
          gte: new Date(yearNum, 0, 1),
          lt: new Date(yearNum + 1, 0, 1)
        };
      }
    }

    // 3. Template/Group Filtering via Relation
    let templateWhere: any = {};
    if (groupId && groupId !== 'all' && typeof groupId === 'string') {
      templateWhere.groupId = groupId;
    }
    if (templateId && templateId !== 'all' && typeof templateId === 'string') {
      templateWhere.id = templateId;
    }
    
    // Fetch Submissions
    const submissions = await prisma.checklistSubmission.findMany({
      where: Object.keys(templateWhere).length > 0 ? {
        ...whereClause,
        template: templateWhere
      } : whereClause,
      include: {
        template: {
          select: { id: true, title: true, groupId: true }
        },
        facility: {
          select: { id: true, name: true }
        }
      },
      orderBy: { auditDate: 'asc' } // Ascending to process chronological history
    });

    const completed = submissions.filter(s => s.status === 'TAMAMLANDI');
    const completedIds = completed.map(s => s.id);

    // Dropdowns data (fast execution)
    const groups = await prisma.checklistTemplateGroup.findMany({ orderBy: { name: 'asc' } });
    const templates = await prisma.checklistTemplate.findMany({
      where: groupId && groupId !== 'all' ? { groupId: String(groupId) } : {},
      select: { id: true, title: true, groupId: true }
    });
    const categories = await prisma.checklistCategory.findMany({ orderBy: { name: 'asc' } });

    // Filter Answers if Category is selected, otherwise fetch all answers for completed
    let answerWhere: any = { submissionId: { in: completedIds } };
    if (categoryId && categoryId !== 'all' && typeof categoryId === 'string') {
      answerWhere.item = { categoryId };
    }

    let answers: any[] = [];
    if (completedIds.length > 0) {
      answers = await prisma.checklistAnswer.findMany({
        where: answerWhere,
        include: {
          item: { 
            include: { category: true }
          },
          scaleOption: { select: { label: true, multiplier: true } },
          attachments: true,
          submission: {
            include: { facility: true, template: true }
          }
        },
        orderBy: {
          submission: { auditDate: 'asc' }
        }
      });
    }

    // Helper: Determine status of answer
    const getAnswerStatus = (ans: any): 'KARŞILIYOR' | 'KISMEN' | 'KARŞILAMIYOR' | 'KAPSAM DIŞI' => {
      if (ans.notApplicable) return 'KAPSAM DIŞI';
      
      if (ans.item.questionType === 'YES_NO' || ans.item.questionType === 'YES_NO_NA') {
        return ans.yesNoValue === true ? 'KARŞILIYOR' : 'KARŞILAMIYOR';
      } 
      
      if (ans.item.questionType === 'SCALE' && ans.scaleOption) {
         const m = ans.scaleOption.multiplier;
         if (m === null) return 'KAPSAM DIŞI';
         if (m >= 0.8) return 'KARŞILIYOR';
         if (m >= 0.4 && m < 0.8) return 'KISMEN';
         return 'KARŞILAMIYOR';
      }
      
      return 'KAPSAM DIŞI';
    };

    // Analytics state variables
    const facilityScoreMap: Record<string, { totalScore: number, count: number, name: string }> = {};
    const statusCounts = { 'KARŞILIYOR': 0, 'KISMEN': 0, 'KARŞILAMIYOR': 0, 'KAPSAM DIŞI': 0 };
    
    // Facility scores mapping
    completed.forEach(sub => {
      const facId = sub.facilityId;
      const facName = sub.facility?.name || 'Bilinmiyor';
      if (!facilityScoreMap[facId]) {
         facilityScoreMap[facId] = { totalScore: 0, count: 0, name: facName };
      }
      facilityScoreMap[facId].totalScore += (sub.percentScore || 0);
      facilityScoreMap[facId].count += 1;
    });

    const facilityScores = Object.values(facilityScoreMap).map(f => ({
      name: f.name,
      score: Number((f.totalScore / f.count).toFixed(1))
    })).sort((a,b) => b.score - a.score);

    const auditedFacilitiesCount = Object.keys(facilityScoreMap).length;
    const totalScoreAll = completed.reduce((sum, s) => sum + (s.percentScore || 0), 0);
    const avgGroupScore = completed.length > 0 ? (totalScoreAll / completed.length) : 0;

    // LIFECYCLE TRACKING
    // Track by "FacilityId_QuestionId"
    // Since answers are already sorted ascending by date (due to completedIds ordering / answer ordering)
    const lifecycleMap: Record<string, any[]> = {};
    
    answers.forEach(ans => {
      const status = getAnswerStatus(ans);
      statusCounts[status]++;

      if (status === 'KAPSAM DIŞI') return;

      const key = `${ans.submission.facilityId}_${ans.itemId}`;
      if (!lifecycleMap[key]) {
         lifecycleMap[key] = [];
      }
      lifecycleMap[key].push({
         status,
         date: ans.submission.auditDate,
         answerId: ans.id,
         questionText: ans.item.questionText,
         facilityName: ans.submission.facility?.name,
         templateName: ans.submission.template?.title,
         note: ans.note,
         photoPath: ans.photoPath,
         attachments: ans.attachments
      });
    });

    const lifecycleFindings: any[] = [];
    let totalFindingsEver = 0;
    let closedFindings = 0;
    let ongoingFindings = 0;

    Object.values(lifecycleMap).forEach(history => {
      // Find the first time it was a finding (KARŞILAMIYOR or KISMEN)
      const firstFindingIndex = history.findIndex(h => h.status === 'KARŞILAMIYOR' || h.status === 'KISMEN');
      
      if (firstFindingIndex !== -1) {
        totalFindingsEver++;
        const initial = history[firstFindingIndex];
        const latest = history[history.length - 1];
        
        let finalStatus = 'DEVAM EDİYOR';
        
        // If the latest is KARŞILIYOR, and it happened AFTER the initial finding
        if (latest.status === 'KARŞILIYOR') {
          finalStatus = 'KAPATILDI';
          closedFindings++;
        } else {
          ongoingFindings++;
        }

        lifecycleFindings.push({
          facilityName: initial.facilityName,
          questionText: initial.questionText,
          templateName: initial.templateName,
          initialStatus: initial.status,
          latestStatus: latest.status,
          currentStatus: finalStatus,
          initialDate: initial.date,
          latestDate: latest.date,
          initialNote: initial.note,
          latestNote: latest.note,
          initialPhoto: initial.photoPath,
          latestPhoto: latest.photoPath,
          initialAttachments: initial.attachments,
          latestAttachments: latest.attachments
        });
      }
    });

    const closedImprovementRate = totalFindingsEver > 0 ? (closedFindings / totalFindingsEver) * 100 : 0;
    
    // Format status distribution for pie chart
    const statusDistribution = [
      { name: 'Karşılıyor', value: statusCounts['KARŞILIYOR'], color: '#10b981' },
      { name: 'Kısmen', value: statusCounts['KISMEN'], color: '#eab308' },
      { name: 'Karşılamıyor', value: statusCounts['KARŞILAMIYOR'], color: '#ef4444' },
      { name: 'Kapsam Dışı', value: statusCounts['KAPSAM DIŞI'], color: '#94a3b8' }
    ].filter(s => s.value > 0);

    res.json({
      groups,
      templates,
      categories,
      stats: {
        avgGroupScore,
        auditedFacilitiesCount,
        totalPriorityFindings: ongoingFindings,
        closedImprovementRate
      },
      facilityScores,
      statusDistribution,
      lifecycleFindings: lifecycleFindings.sort((a,b) => new Date(b.latestDate).getTime() - new Date(a.latestDate).getTime())
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// Consolidated Template x Facility & Question Matrix + Burn-Up & Chart Data
router.get('/consolidated', async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, year, groupId } = req.query;

    const allTemplates = await prisma.checklistTemplate.findMany({
      where: {
        isActive: true,
        ...(groupId && groupId !== 'all' && groupId !== 'null' && typeof groupId === 'string' ? { groupId } : {}),
      },
      select: {
        id: true,
        title: true,
        group: { select: { name: true } },
        _count: { select: { submissions: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (allTemplates.length === 0) {
      return res.json({
        templates: [],
        selectedTemplateId: null,
        summary: null,
        facilityMatrix: [],
        questionSummary: [],
        categorySummary: [],
        burnUpSeries: [],
        answerDistribution: [],
        statusDistribution: [],
      });
    }

    const defaultTemplate =
      allTemplates.find((t) => (t._count?.submissions || 0) > 0) || allTemplates[0];

    const isValidTemplateParam =
      typeof templateId === 'string' &&
      templateId.trim() !== '' &&
      templateId !== 'all' &&
      templateId !== 'null' &&
      templateId !== 'undefined' &&
      allTemplates.some((t) => t.id === templateId);

    const targetTemplateId = isValidTemplateParam ? templateId : defaultTemplate.id;

    const template = await prisma.checklistTemplate.findUnique({
      where: { id: targetTemplateId },
      include: {
        sections: {
          orderBy: { sortOrder: 'asc' },
          include: {
            items: { orderBy: { sortOrder: 'asc' } },
          },
        },
        assignments: true,
      },
    });

    if (!template) {
      return res.status(404).json({ error: 'Şablon bulunamadı' });
    }

    const isAdminOrMgmt =
      req.user?.isAdmin ||
      req.user?.isManagement ||
      req.user?.roles?.includes('admin') ||
      req.user?.roles?.includes('management');

    const allowedFacilityIds = !isAdminOrMgmt ? req.user?.facilities || [] : null;

    const activeFacilities = await prisma.facility.findMany({
      where: {
        isActive: true,
        ...(allowedFacilityIds ? { id: { in: allowedFacilityIds } } : {}),
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    });

    const assignedFacilitySet = new Set<string>();
    template.assignments.forEach((a) => {
      (a.facilityIds || []).forEach((fid) => assignedFacilitySet.add(fid));
    });

    const subWhere: any = { templateId: targetTemplateId };
    if (allowedFacilityIds) {
      subWhere.facilityId = { in: allowedFacilityIds };
    }
    if (year && year !== 'all' && typeof year === 'string') {
      const yearNum = parseInt(year, 10);
      if (!isNaN(yearNum)) {
        subWhere.auditDate = {
          gte: new Date(yearNum, 0, 1),
          lt: new Date(yearNum + 1, 0, 1),
        };
      }
    }

    const submissions = await prisma.checklistSubmission.findMany({
      where: subWhere,
      include: {
        facility: { select: { id: true, name: true } },
        conductedBy: { select: { fullName: true } },
        answers: {
          include: {
            item: true,
            scaleOption: { select: { label: true, multiplier: true } },
          },
        },
      },
      orderBy: { auditDate: 'desc' },
    });

    // Her tesis için en güncel submission'ı al (aynı yıl/şablonda birden fazla varsa)
    const latestByFacility = new Map<string, any>();
    submissions.forEach((sub) => {
      if (!latestByFacility.has(sub.facilityId)) {
        latestByFacility.set(sub.facilityId, sub);
      }
    });

    const relevantFacilities = activeFacilities.filter(
      (f) => assignedFacilitySet.has(f.id) || latestByFacility.has(f.id)
    );

    const facilityMatrix = relevantFacilities.map((fac) => {
      const sub = latestByFacility.get(fac.id);
      return {
        facilityId: fac.id,
        facilityName: fac.name,
        isAssigned: assignedFacilitySet.has(fac.id),
        status: sub ? sub.status : 'ATANMADI',
        percentScore: sub?.percentScore ?? null,
        auditDate: sub?.auditDate ?? null,
        conductedBy: sub?.conductedBy?.fullName || null,
        submissionId: sub?.id || null,
      };
    });

    // Tamamlanan denetimler üzerinden soru bazlı konsolide sonuçlar
    const completedLatestSubs = Array.from(latestByFacility.values()).filter(
      (s) => s.status === 'TAMAMLANDI'
    );

    const questionStatsMap = new Map<
      string,
      {
        itemId: string;
        sectionTitle: string;
        itemNo: number;
        questionText: string;
        questionType: string;
        categoryLabel: string;
        mainCategoryName: string;
        compliantCount: number;
        partialCount: number;
        nonCompliantCount: number;
        naCount: number;
        nonCompliantFacilities: string[];
        optionCounts: Record<string, { label: string; count: number; color: string }>;
        facilityAnswers: {
          facilityId: string;
          facilityName: string;
          answerLabel: string;
          status: 'KARŞILIYOR' | 'KISMEN' | 'KARŞILAMIYOR' | 'KAPSAM DIŞI';
          note: string | null;
          auditDate: string;
          submissionId: string;
        }[];
      }
    >();

    template.sections.forEach((sec) => {
      sec.items.forEach((item: any) => {
        const cfg = (item.config || {}) as any;
        const catParts = [cfg.mainCategoryName, cfg.categoryName, cfg.subCategoryName].filter(Boolean);
        questionStatsMap.set(item.id, {
          itemId: item.id,
          sectionTitle: sec.title,
          itemNo: item.itemNo,
          questionText: item.questionText,
          questionType: item.questionType,
          categoryLabel: catParts.length > 0 ? catParts.join(' › ') : 'Kategorisiz',
          mainCategoryName: cfg.mainCategoryName || 'Kategorisiz',
          compliantCount: 0,
          partialCount: 0,
          nonCompliantCount: 0,
          naCount: 0,
          nonCompliantFacilities: [],
          optionCounts: {},
          facilityAnswers: [],
        });
      });
    });

    const categoryStatsMap = new Map<
      string,
      {
        categoryName: string;
        questionIds: Set<string>;
        compliantCount: number;
        partialCount: number;
        nonCompliantCount: number;
        naCount: number;
      }
    >();

    const bumpCategory = (catName: string, itemId: string, status: 'KARŞILIYOR' | 'KISMEN' | 'KARŞILAMIYOR' | 'KAPSAM DIŞI') => {
      if (!categoryStatsMap.has(catName)) {
        categoryStatsMap.set(catName, {
          categoryName: catName,
          questionIds: new Set<string>(),
          compliantCount: 0,
          partialCount: 0,
          nonCompliantCount: 0,
          naCount: 0,
        });
      }
      const c = categoryStatsMap.get(catName)!;
      c.questionIds.add(itemId);
      if (status === 'KARŞILIYOR') c.compliantCount++;
      else if (status === 'KISMEN') c.partialCount++;
      else if (status === 'KARŞILAMIYOR') c.nonCompliantCount++;
      else c.naCount++;
    };

    completedLatestSubs.forEach((sub) => {
      const facName = sub.facility?.name || sub.facilityId;
      (sub.answers || []).forEach((ans: any) => {
        const stat = questionStatsMap.get(ans.itemId);
        if (!stat) return;

        let status: 'KARŞILIYOR' | 'KISMEN' | 'KARŞILAMIYOR' | 'KAPSAM DIŞI' = 'KAPSAM DIŞI';
        let answerLabel = 'Kapsam Dışı';
        let optColor = '#94a3b8';

        if (ans.notApplicable) {
          stat.naCount++;
          status = 'KAPSAM DIŞI';
          answerLabel = 'Kapsam Dışı';
        } else if (ans.item?.questionType === 'YES_NO' || ans.item?.questionType === 'YES_NO_NA') {
          if (ans.yesNoValue === true) {
            stat.compliantCount++;
            status = 'KARŞILIYOR';
            answerLabel = 'Evet';
            optColor = '#10b981';
          } else {
            stat.nonCompliantCount++;
            stat.nonCompliantFacilities.push(facName);
            status = 'KARŞILAMIYOR';
            answerLabel = 'Hayır';
            optColor = '#ef4444';
          }
        } else if (ans.item?.questionType === 'SCALE' && ans.scaleOption) {
          const m = ans.scaleOption.multiplier;
          answerLabel = ans.scaleOption.label;
          if (m === null || m === undefined) {
            stat.naCount++;
            status = 'KAPSAM DIŞI';
          } else if (m >= 0.8) {
            stat.compliantCount++;
            status = 'KARŞILIYOR';
            optColor = '#10b981';
          } else if (m >= 0.4) {
            stat.partialCount++;
            stat.nonCompliantFacilities.push(`${facName} (Kısmen)`);
            status = 'KISMEN';
            optColor = '#f59e0b';
          } else {
            stat.nonCompliantCount++;
            stat.nonCompliantFacilities.push(facName);
            status = 'KARŞILAMIYOR';
            optColor = '#ef4444';
          }
        } else {
          stat.naCount++;
          answerLabel = ans.textValue || (ans.numberValue != null ? String(ans.numberValue) : 'Yanıtlandı');
        }

        if (!stat.optionCounts[answerLabel]) {
          stat.optionCounts[answerLabel] = { label: answerLabel, count: 0, color: optColor };
        }
        stat.optionCounts[answerLabel].count++;

        stat.facilityAnswers.push({
          facilityId: sub.facilityId,
          facilityName: facName,
          answerLabel,
          status,
          note: ans.note || null,
          auditDate: sub.auditDate,
          submissionId: sub.id,
        });

        bumpCategory(stat.mainCategoryName, stat.itemId, status);
      });
    });

    const questionSummary = Array.from(questionStatsMap.values()).map((q) => {
      const evaluated = q.compliantCount + q.partialCount + q.nonCompliantCount;
      const complianceRate =
        evaluated > 0 ? Number(((q.compliantCount / evaluated) * 100).toFixed(1)) : null;
      return {
        itemId: q.itemId,
        sectionTitle: q.sectionTitle,
        itemNo: q.itemNo,
        questionText: q.questionText,
        questionType: q.questionType,
        categoryLabel: q.categoryLabel,
        mainCategoryName: q.mainCategoryName,
        compliantCount: q.compliantCount,
        partialCount: q.partialCount,
        nonCompliantCount: q.nonCompliantCount,
        naCount: q.naCount,
        complianceRate,
        nonCompliantFacilities: q.nonCompliantFacilities,
        optionBreakdown: Object.values(q.optionCounts),
        facilityAnswers: q.facilityAnswers.sort((a, b) => a.facilityName.localeCompare(b.facilityName, 'tr')),
      };
    });

    const categorySummary = Array.from(categoryStatsMap.values()).map((c) => {
      const evaluated = c.compliantCount + c.partialCount + c.nonCompliantCount;
      const complianceRate =
        evaluated > 0 ? Number(((c.compliantCount / evaluated) * 100).toFixed(1)) : null;
      return {
        categoryName: c.categoryName,
        questionCount: c.questionIds.size,
        compliantCount: c.compliantCount,
        partialCount: c.partialCount,
        nonCompliantCount: c.nonCompliantCount,
        naCount: c.naCount,
        complianceRate,
      };
    });

    const completedCount = facilityMatrix.filter((f) => f.status === 'TAMAMLANDI').length;
    const pendingCount = facilityMatrix.filter(
      (f) => f.status === 'BEKLEYEN' || f.status === 'TASLAK'
    ).length;
    const draftCount = facilityMatrix.filter((f) => f.status === 'TASLAK').length;
    const waitingCount = facilityMatrix.filter((f) => f.status === 'BEKLEYEN').length;
    const scored = facilityMatrix.filter(
      (f) => f.status === 'TAMAMLANDI' && f.percentScore !== null
    );
    const avgScore =
      scored.length > 0
        ? Number(
            (scored.reduce((s, f) => s + (f.percentScore || 0), 0) / scored.length).toFixed(1)
          )
        : 0;

    // Burn-up grafiği için tarihsel kümülatif tamamlanma serisi
    const completedByDateMap = new Map<string, number>();
    completedLatestSubs
      .slice()
      .sort((a, b) => new Date(a.auditDate).getTime() - new Date(b.auditDate).getTime())
      .forEach((sub) => {
        const dayKey = format(new Date(sub.auditDate), 'dd.MM.yyyy');
        completedByDateMap.set(dayKey, (completedByDateMap.get(dayKey) || 0) + 1);
      });

    let cumulative = 0;
    const targetTotal = facilityMatrix.length;
    const burnUpSeries = Array.from(completedByDateMap.entries()).map(([date, count]) => {
      cumulative += count;
      return {
        date,
        completed: cumulative,
        dailyCount: count,
        target: targetTotal,
      };
    });

    // Genel cevap dağılımı (Pasta grafik)
    const totalCompliant = questionSummary.reduce((s, q) => s + q.compliantCount, 0);
    const totalPartial = questionSummary.reduce((s, q) => s + q.partialCount, 0);
    const totalNonCompliant = questionSummary.reduce((s, q) => s + q.nonCompliantCount, 0);
    const totalNa = questionSummary.reduce((s, q) => s + q.naCount, 0);

    const answerDistribution = [
      { name: 'Uygun', value: totalCompliant, color: '#10b981' },
      { name: 'Kısmen', value: totalPartial, color: '#f59e0b' },
      { name: 'Uygun Değil', value: totalNonCompliant, color: '#ef4444' },
      { name: 'Kapsam Dışı', value: totalNa, color: '#94a3b8' },
    ].filter((x) => x.value > 0);

    const statusDistribution = [
      { name: 'Tamamlandı', value: completedCount, color: '#10b981' },
      { name: 'Bekliyor', value: waitingCount, color: '#f59e0b' },
      { name: 'Taslak', value: draftCount, color: '#3b82f6' },
    ].filter((x) => x.value > 0);

    res.json({
      templates: allTemplates.map((t) => ({
        id: t.id,
        title: t.title,
        groupName: t.group?.name || null,
      })),
      selectedTemplateId: targetTemplateId,
      summary: {
        templateTitle: template.title,
        totalFacilities: facilityMatrix.length,
        completedCount,
        pendingCount,
        completionRate:
          facilityMatrix.length > 0
            ? Number(((completedCount / facilityMatrix.length) * 100).toFixed(1))
            : 0,
        avgScore,
      },
      burnUpSeries,
      answerDistribution,
      statusDistribution,
      facilityMatrix,
      questionSummary,
      categorySummary,
    });
  } catch (error) {
    console.error('Error fetching consolidated checklist data:', error);
    res.status(500).json({ error: 'Konsolide veriler alınamadı' });
  }
});

export default router;
