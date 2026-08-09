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
      orderBy: { auditDate: 'desc' }
    });

    const completed = submissions.filter(s => s.status === 'TAMAMLANDI');
    const completedIds = completed.map(s => s.id);

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
        }
      });
    }

    // Helper: Determine if answer is negative (finding/uygunsuzluk)
    const isNegativeAnswer = (ans: any) => {
      if (ans.notApplicable) return false;
      if (ans.item.questionType === 'YES_NO' || ans.item.questionType === 'YES_NO_NA') {
        return ans.yesNoValue === false;
      } 
      if (ans.item.questionType === 'SCALE' && ans.scaleOption) {
         const label = ans.scaleOption.label.toLowerCase();
         if (label.includes('değil') || label.includes('kötü') || label.includes('risk') || label.includes('yok') || (ans.scaleOption.multiplier !== null && ans.scaleOption.multiplier <= 0.5)) {
           return true;
         }
      }
      return false;
    };

    // Calculate advanced stats
    let totalFindings = 0;
    const categoryStats: Record<string, { id: string, name: string, findingCount: number, totalQuestions: number }> = {};
    const itemStats: Record<string, any> = {};
    const recentFindingsList: any[] = [];

    answers.forEach(ans => {
      if (ans.notApplicable) return;
      
      const isFinding = isNegativeAnswer(ans);
      const catId = ans.item.categoryId || 'uncategorized';
      const catName = ans.item.category?.name || 'Kategorisiz';

      // Category Grouping
      if (!categoryStats[catId]) {
        categoryStats[catId] = { id: catId, name: catName, findingCount: 0, totalQuestions: 0 };
      }
      categoryStats[catId].totalQuestions += 1;
      if (isFinding) {
        categoryStats[catId].findingCount += 1;
        totalFindings += 1;

        // Add to recent findings
        recentFindingsList.push({
          id: ans.id,
          date: ans.submission.auditDate,
          facilityName: ans.submission.facility?.name,
          templateName: ans.submission.template?.title,
          categoryName: catName,
          questionText: ans.item.questionText,
          answerLabel: ans.item.questionType === 'SCALE' ? ans.scaleOption?.label : 'Hayır'
        });
      }

      // Item Level Grouping
      const qId = ans.itemId;
      if (!itemStats[qId]) {
        itemStats[qId] = {
          id: qId,
          text: ans.item.itemNo ? `${ans.item.itemNo}. ${ans.item.questionText}` : ans.item.questionText,
          categoryName: catName,
          total: 0,
          negative: 0,
          positive: 0
        };
      }
      itemStats[qId].total += 1;
      if (isFinding) itemStats[qId].negative += 1;
      else itemStats[qId].positive += 1;
    });

    // Formatting outputs
    const categoryAnalysis = Object.values(categoryStats)
      .filter(c => c.totalQuestions > 0)
      .map(c => ({
        name: c.name,
        findings: c.findingCount,
        rate: c.findingCount > 0 ? Number(((c.findingCount / c.totalQuestions) * 100).toFixed(1)) : 0
      }))
      .sort((a, b) => b.findings - a.findings);

    const itemAnalysis = Object.values(itemStats)
      .filter(stat => stat.negative > 0)
      .sort((a, b) => b.negative - a.negative);

    // Sort recent findings by date descending
    recentFindingsList.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const topRecentFindings = recentFindingsList.slice(0, 50); // Return top 50 recent issues

    // Dropdowns data
    const groups = await prisma.checklistTemplateGroup.findMany({ orderBy: { name: 'asc' } });
    const templates = await prisma.checklistTemplate.findMany({
      where: groupId && groupId !== 'all' ? { groupId: String(groupId) } : {},
      select: { id: true, title: true, groupId: true }
    });
    const categories = await prisma.checklistCategory.findMany({ orderBy: { name: 'asc' } });

    // Status / Trend
    const draft = submissions.filter(s => s.status === 'TASLAK' || s.status === 'BEKLEYEN');
    const totalScore = completed.reduce((sum, s) => sum + (s.percentScore || 0), 0);
    const avgScore = completed.length > 0 ? (totalScore / completed.length) : 0;
    const trendData = [...completed].sort((a, b) => new Date(a.auditDate).getTime() - new Date(b.auditDate).getTime()).map(s => ({
      date: format(new Date(s.auditDate), 'dd MMM', { locale: tr }),
      score: s.percentScore || 0
    }));

    res.json({
      groups,
      templates,
      categories,
      stats: {
        total: submissions.length,
        completed: completed.length,
        draft: draft.length,
        avgScore,
        totalFindings
      },
      categoryAnalysis,
      itemAnalysis,
      recentFindings: topRecentFindings,
      trendData
    });

  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

export default router;
