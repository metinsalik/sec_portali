import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware, AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Helper function to calculate grade
function calculateGrade(percentage: number): string {
    if (percentage >= 90) return 'A';
    if (percentage >= 80) return 'B';
    if (percentage >= 70) return 'C';
    if (percentage >= 60) return 'D';
    if (percentage >= 50) return 'E';
    return 'F';
}

// GET /api/safety-management/fire-doors/doors/:doorId/inspections
router.get('/doors/:doorId/inspections', async (req: AuthRequest, res: Response) => {
  try {
    const { doorId } = req.params;
    const inspections = await prisma.fireDoorInspection.findMany({
      where: { fireDoorId: doorId },
      include: {
        items: {
            include: {
                question: true
            }
        }
      },
      orderBy: { inspectionDate: 'desc' },
    });
    res.json(inspections);
  } catch (error) {
    console.error('Error fetching inspections:', error);
    res.status(500).json({ error: 'Failed to fetch inspections' });
  }
});

// POST /api/safety-management/fire-doors/doors/:doorId/inspections
router.post('/doors/:doorId/inspections', async (req: AuthRequest, res: Response) => {
  try {
    const { doorId } = req.params;
    const { items, notes } = req.body; // items: [{ questionId, answer, comment, photoUrl }]
    
    if (!items || !Array.isArray(items)) {
        return res.status(400).json({ error: 'Items array is required' });
    }

    // Fetch questions to get weights
    const questionIds = items.map(item => item.questionId);
    const questions = await prisma.fireDoorQuestion.findMany({
        where: { id: { in: questionIds } }
    });

    let totalScore = 0;
    let maxPossibleScore = 0;

    const inspectionItemsData = items.map(item => {
        const question = questions.find(q => q.id === item.questionId);
        if (!question) throw new Error(`Question ${item.questionId} not found`);

        let earnedScore = 0;
        let isApplicable = true;

        switch (item.answer) {
            case 'PASS':
                earnedScore = question.weightPass;
                break;
            case 'PARTIAL':
                earnedScore = question.weightPartial;
                break;
            case 'FAIL':
                earnedScore = question.weightFail;
                break;
            case 'NA':
                earnedScore = 0;
                isApplicable = false;
                break;
            default:
                earnedScore = 0;
        }

        totalScore += earnedScore;
        if (isApplicable) {
            // max possible score for a question is its PASS weight
            maxPossibleScore += question.weightPass;
        }

        return {
            questionId: item.questionId,
            answer: item.answer,
            earnedScore,
            comment: item.comment,
            photoUrl: item.photoUrl,
            photos: item.photos || [],
        };
    });

    const percentage = maxPossibleScore > 0 ? (totalScore / maxPossibleScore) * 100 : 0;
    const grade = calculateGrade(Math.max(0, percentage));

    const result = await prisma.$transaction(async (tx) => {
        const inspection = await tx.fireDoorInspection.create({
            data: {
                fireDoorId: doorId,
                inspectionDate: new Date(),
                inspectorId: req.user!.username,
                totalScore,
                maxPossibleScore,
                grade,
                notes,
                items: {
                    create: inspectionItemsData
                }
            }
        });

        // Update FireDoor lastGrade and lastScore
        await tx.fireDoor.update({
            where: { id: doorId },
            data: {
                lastScore: totalScore,
                lastGrade: grade
            }
        });

        return inspection;
    });

    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating inspection:', error);
    res.status(500).json({ error: 'Failed to create inspection' });
  }
});

export default router;
