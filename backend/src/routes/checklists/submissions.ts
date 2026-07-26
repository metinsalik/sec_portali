import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get submissions for a facility
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;
    
    if (!facilityId || typeof facilityId !== 'string') {
      return res.status(400).json({ error: 'facilityId is required' });
    }

    const submissions = await prisma.checklistSubmission.findMany({
      where: { facilityId },
      include: {
        template: {
          select: { title: true, version: true }
        },
        conductedBy: {
          select: { fullName: true }
        }
      },
      orderBy: { auditDate: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching submissions:', error);
    res.status(500).json({ error: 'Failed to fetch submissions' });
  }
});

// Get a single submission details
router.get('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const submission = await prisma.checklistSubmission.findUnique({
      where: { id },
      include: {
        template: {
          include: {
            scale: true,
            sections: {
              include: { items: true }
            }
          }
        },
        answers: true,
        attachments: true,
        conductedBy: { select: { fullName: true } }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    res.json(submission);
  } catch (error) {
    console.error('Error fetching submission:', error);
    res.status(500).json({ error: 'Failed to fetch submission' });
  }
});

// Create a new submission
router.post('/', async (req: AuthRequest, res: Response) => {
  try {
    const { templateId, facilityId, auditDate, auditTimeStart, auditTimeEnd, auditTeam } = req.body;
    const username = req.user?.username;

    if (!username) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const submission = await prisma.checklistSubmission.create({
      data: {
        templateId,
        facilityId,
        auditDate: new Date(auditDate),
        auditTimeStart,
        auditTimeEnd,
        auditTeam,
        conductedById: username,
        status: 'TASLAK'
      }
    });

    res.status(201).json(submission);
  } catch (error) {
    console.error('Error creating submission:', error);
    res.status(500).json({ error: 'Failed to create submission' });
  }
});

// Update submission (answers)
router.put('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { answers, status, totalScore, maxScore, percentScore, notes } = req.body;

    const submission = await prisma.checklistSubmission.update({
      where: { id },
      data: {
        status,
        totalScore,
        maxScore,
        percentScore,
        notes
      }
    });

    if (answers && answers.length > 0) {
      // For simplicity: delete existing answers and re-insert
      await prisma.checklistAnswer.deleteMany({
        where: { submissionId: id }
      });
      
      for (const a of answers) {
        await prisma.checklistAnswer.create({
          data: {
            submissionId: id,
            itemId: a.itemId,
            scaleOptionId: a.scaleOptionId,
            yesNoValue: a.yesNoValue,
            numberValue: a.numberValue,
            textValue: a.textValue,
            dateValue: a.dateValue ? new Date(a.dateValue) : null,
            multiSelectVal: a.multiSelectVal,
            photoPath: a.photoPath,
            notApplicable: a.notApplicable || false,
            earnedScore: a.earnedScore,
            note: a.note,
            attachments: a.attachments && a.attachments.length > 0 ? {
              create: a.attachments.map((att: any, idx: number) => ({
                submissionId: id,
                filePath: att.filePath || (typeof att === 'string' ? att : ''),
                sortOrder: idx
              }))
            } : undefined
          }
        });
      }
    }

    res.json({ success: true, submissionId: id });
  } catch (error) {
    console.error('Error updating submission:', error);
    res.status(500).json({ error: 'Failed to update submission' });
  }
});

export default router;
