import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

router.use(authMiddleware);

// Get assignments for a template
router.get('/template/:templateId', async (req, res) => {
  try {
    const { templateId } = req.params;
    const assignments = await prisma.checklistAssignment.findMany({
      where: { templateId },
      orderBy: { createdAt: 'desc' }
    });
    res.json(assignments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch assignments' });
  }
});

// Create assignment
router.post('/', async (req, res) => {
  try {
    const { templateId, facilityIds, isPeriodic, periodValue, periodType, startDate, endDate } = req.body;

    if (!templateId || !facilityIds || !Array.isArray(facilityIds) || facilityIds.length === 0) {
      return res.status(400).json({ error: 'templateId and facilityIds array are required' });
    }

    const assignment = await prisma.checklistAssignment.create({
      data: {
        templateId,
        facilityIds,
        isPeriodic: isPeriodic || false,
        periodValue,
        periodType,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      }
    });

    // Also immediately create BEKLEYEN submissions for these facilities if not strictly periodic in the future
    // For simplicity, we just create the first batch now if startDate is <= today or null
    const now = new Date();
    const shouldCreateInitial = !isPeriodic || !startDate || new Date(startDate) <= now;
    
    if (shouldCreateInitial) {
      const submissionsToCreate = facilityIds.map((facilityId: string) => ({
        templateId,
        facilityId,
        auditDate: now,
        status: 'BEKLEYEN',
      }));

      await prisma.checklistSubmission.createMany({
        data: submissionsToCreate
      });
    }

    res.status(201).json(assignment);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create assignment' });
  }
});

// Delete assignment
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.checklistAssignment.delete({
      where: { id }
    });
    res.json({ message: 'Assignment deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete assignment' });
  }
});

export default router;
