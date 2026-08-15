import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// GET /api/safety-management/fire-doors/analytics
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, grade, doorType, filters } = req.query;
    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const facilityIdStr = String(facilityId);
    
    // Build where clause for door filtering
    const doorWhere: any = {};
    if (facilityIdStr !== 'all') {
        doorWhere.facilityId = facilityIdStr;
    }
    const andConditions: any[] = [];
    
    if (grade && grade !== 'all' && grade !== 'Tümü' && grade !== '') {
      doorWhere.lastGrade = String(grade);
    }
    
    if (doorType && doorType !== 'all' && doorType !== 'Tümü' && doorType !== '') {
      andConditions.push({
        properties: { path: ['Kapı Çeşidi'], equals: String(doorType) }
      });
    }

    // Dynamic JSON filters support
    if (filters) {
        try {
            const parsedFilters = JSON.parse(String(filters));
            for (const [key, value] of Object.entries(parsedFilters)) {
                if (!value || value === 'Tümü') continue;
                
                if (key === 'grade') {
                    doorWhere.lastGrade = String(value);
                } else {
                    andConditions.push({
                        properties: { path: [key], equals: String(value) }
                    });
                }
            }
        } catch (e) {
            console.error("Error parsing filters JSON:", e);
        }
    }

    if (andConditions.length > 0) {
        doorWhere.AND = andConditions;
    }

    // 1. Total Doors
    const totalDoors = await prisma.fireDoor.count({
      where: doorWhere,
    });

    // 2. Average Score
    const doors = await prisma.fireDoor.findMany({
      where: { ...doorWhere, lastScore: { not: null } },
      select: { lastScore: true },
    });

    let averageScore = 0;
    if (doors.length > 0) {
        const sum = doors.reduce((acc, door) => acc + (door.lastScore || 0), 0);
        averageScore = sum / doors.length;
    }

    // 3. Grade Distribution
    const gradeDistributionRaw = await prisma.fireDoor.groupBy({
        by: ['lastGrade'],
        where: { ...doorWhere, lastGrade: { not: null } },
        _count: {
            lastGrade: true
        }
    });

    const gradeDistribution = gradeDistributionRaw.map(g => ({
        grade: g.lastGrade,
        count: g._count.lastGrade
    }));

    // Fetch all inspection items for doors matching criteria to calculate advanced metrics
    const inspectionItems = await prisma.fireDoorInspectionItem.findMany({
        where: {
            inspection: {
                fireDoor: doorWhere
            }
        },
        select: {
            answer: true,
            inspection: {
                select: {
                    fireDoorId: true
                }
            },
            question: {
                select: {
                    text: true
                }
            }
        }
    });

    // 4. Top Failed Questions
    const failCounts: Record<string, number> = {};
    const categoryStats: Record<string, { total: number, pass: number }> = {
        'Kapanma Sistemi': { total: 0, pass: 0 },
        'İzolasyon (Conta)': { total: 0, pass: 0 },
        'Mekanik (Menteşe)': { total: 0, pass: 0 },
        'Güvenlik (Kilit)': { total: 0, pass: 0 },
        'İşaretleme': { total: 0, pass: 0 },
    };

    const criticalRiskDoorIds = new Set<string>();

    inspectionItems.forEach(item => {
        const qText = item.question?.text || '';
        const qTextLower = qText.toLowerCase();
        
        // Count fails for Top Failed Questions
        if (item.answer === 'FAIL') {
            const q = qText || 'Bilinmeyen Soru';
            failCounts[q] = (failCounts[q] || 0) + 1;

            // Critical Risk Doors Logic: If it fails on closing or hinges
            if (qTextLower.includes('kapan') || qTextLower.includes('menteşe')) {
                criticalRiskDoorIds.add(item.inspection.fireDoorId);
            }
        }

        // Category Health Logic
        let category = null;
        if (qTextLower.includes('kapan')) category = 'Kapanma Sistemi';
        else if (qTextLower.includes('conta') || qTextLower.includes('sızdırmaz')) category = 'İzolasyon (Conta)';
        else if (qTextLower.includes('menteşe')) category = 'Mekanik (Menteşe)';
        else if (qTextLower.includes('kilit')) category = 'Güvenlik (Kilit)';
        else if (qTextLower.includes('işaret') || qTextLower.includes('levha')) category = 'İşaretleme';

        if (category && (item.answer === 'PASS' || item.answer === 'FAIL' || item.answer === 'PARTIAL')) {
            categoryStats[category].total += 1;
            if (item.answer === 'PASS') {
                categoryStats[category].pass += 1;
            } else if (item.answer === 'PARTIAL') {
                categoryStats[category].pass += 0.5; // Give partial credit for health score
            }
        }
    });

    const topFailedQuestions = Object.entries(failCounts)
        .map(([question, count]) => ({ question, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5); // top 5

    // 5. Category Health (Radar Chart data)
    const categoryHealth = Object.entries(categoryStats).map(([subject, stats]) => {
        return {
            subject,
            A: stats.total > 0 ? Math.round((stats.pass / stats.total) * 100) : 0, // A is the value key for recharts
            fullMark: 100,
        };
    });

    // 6. Critical Risk Doors count
    const criticalRiskCount = criticalRiskDoorIds.size;

    res.json({
        totalDoors,
        averageScore,
        gradeDistribution,
        topFailedQuestions,
        categoryHealth,
        criticalRiskCount
    });

  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

export default router;
