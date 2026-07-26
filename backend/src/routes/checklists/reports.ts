import { Router, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { AuthRequest } from '../../middleware/auth';

const router = Router();
const prisma = new PrismaClient();

// Get basic report for a facility
router.get('/facility/:facilityId', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.params;

    const submissions = await prisma.checklistSubmission.findMany({
      where: { facilityId, status: 'TAMAMLANDI' },
      include: {
        template: { select: { title: true } }
      },
      orderBy: { auditDate: 'desc' }
    });

    res.json(submissions);
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

export default router;
