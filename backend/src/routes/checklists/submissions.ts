import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();
const prisma = new PrismaClient();

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    const dir = path.join(process.cwd(), 'uploads', 'checklists');
    fs.mkdirSync(dir, { recursive: true });
    cb(null, dir);
  },
  filename: (_req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ storage });

// Get submissions for a facility
router.get('/', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, year } = req.query;
    
    let whereClause: any = {};
    if (facilityId && typeof facilityId === 'string') {
      whereClause.facilityId = facilityId;
    }

    if (year && typeof year === 'string') {
      const yearNum = parseInt(year);
      if (!isNaN(yearNum)) {
        whereClause.auditDate = {
          gte: new Date(yearNum, 0, 1),
          lt: new Date(yearNum + 1, 0, 1)
        };
      }
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

    let submissions = await prisma.checklistSubmission.findMany({
      where: whereClause,
      include: {
        template: {
          select: { id: true, title: true, version: true, group: true }
        },
        conductedBy: {
          select: { fullName: true }
        },
        facility: {
          select: { name: true }
        }
      },
      orderBy: { auditDate: 'desc' }
    });

    // Atamaları (Assignments) toplu çekelim (N+1 problemini azaltmak ve isPeriodic flag'ini eklemek için)
    const templateIds = [...new Set(submissions.map(s => s.templateId))];
    const assignments = await prisma.checklistAssignment.findMany({
      where: { templateId: { in: templateIds } },
      orderBy: { createdAt: 'desc' }
    });

    const enrichedSubmissions = [];

    // Auto-close expired ones ve isPeriodic flag ekleme
    for (let sub of submissions) {
      const assignment = assignments.find(a => a.templateId === sub.templateId && a.facilityIds.includes(sub.facilityId));
      let isPeriodic = assignment?.isPeriodic || false;

      if (sub.status === 'TASLAK' || sub.status === 'BEKLEYEN') {
        if (
          assignment && 
          assignment.endDate && 
          new Date(assignment.endDate) < new Date() && 
          new Date(sub.updatedAt) <= new Date(assignment.endDate)
        ) {
          const updated = await prisma.checklistSubmission.update({
            where: { id: sub.id },
            data: { status: 'TAMAMLANDI' }
          });
          sub.status = updated.status;
        }
      }

      enrichedSubmissions.push({
        ...sub,
        isPeriodic
      });
    }

    res.json(enrichedSubmissions);
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
            scaleSet: {
              include: { options: true }
            },
            sections: {
              include: { items: true }
            }
          }
        },
        answers: {
          include: { attachments: true }
        },
        attachments: true,
        conductedBy: { select: { fullName: true } }
      }
    });

    if (!submission) {
      return res.status(404).json({ error: 'Submission not found' });
    }

    if (req.user && !req.user.isAdmin && !req.user.isManagement && !req.user.roles?.includes('admin')) {
      if (!req.user.facilities || !req.user.facilities.includes(submission.facilityId)) {
        return res.status(403).json({ error: 'Bu denetime erişim yetkiniz yok' });
      }
    }

    // Auto-close if assignment endDate passed
    if (submission.status === 'TASLAK' || submission.status === 'BEKLEYEN') {
      const assignment = await prisma.checklistAssignment.findFirst({
        where: {
          templateId: submission.templateId,
          facilityIds: { has: submission.facilityId }
        },
        orderBy: { createdAt: 'desc' }
      });
      if (
        assignment && 
        assignment.endDate && 
        new Date(assignment.endDate) < new Date() &&
        new Date(submission.updatedAt) <= new Date(assignment.endDate)
      ) {
        const updated = await prisma.checklistSubmission.update({
          where: { id: submission.id },
          data: { status: 'TAMAMLANDI' }
        });
        submission.status = updated.status;
      }
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
    res.status(500).json({ error: 'Denetim iptal edilemedi.' });
  }
});

router.post('/upload', upload.single('file'), async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Dosya bulunamadı' });
    }
    const fileUrl = `/uploads/checklists/${req.file.filename}`;
    res.json({ url: fileUrl });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Dosya yüklenemedi' });
  }
});

export default router;
