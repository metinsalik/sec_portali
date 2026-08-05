import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const router = Router();

// GET /api/public/isg-kurul/dashboard - Get all data for the public dashboard
router.get('/isg-kurul/dashboard', async (req: Request, res: Response) => {
  try {
    const { facilityId } = req.query;

    const whereClause: any = {};
    if (facilityId && facilityId !== 'all') {
      whereClause.facilityId = String(facilityId);
    }

    const meetings = await prisma.ohsBoardMeeting.findMany({
      where: whereClause,
      include: {
        facility: { select: { name: true } },
        decisions: {
          include: {
            category: { select: { id: true, name: true, color: true } },
            department: { select: { id: true, name: true } },
            actions: { select: { id: true, text: true, isCompleted: true } }
          }
        }
      },
      orderBy: { meetingDate: 'desc' }
    });

    const categories = await prisma.definitionCategory.findMany();
    const departments = await prisma.definitionDepartment.findMany();
    const facilities = await prisma.facility.findMany();

    res.json({
      meetings,
      categories,
      departments,
      facilities
    });
  } catch (error) {
    console.error('Error fetching public dashboard data:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
