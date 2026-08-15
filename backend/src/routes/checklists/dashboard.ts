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
         templateName: ans.submission.template?.title
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
          latestDate: latest.date
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

export default router;
