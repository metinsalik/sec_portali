import express, { Request, Response } from 'express';
import { AuthRequest, authMiddleware } from '../../middleware/auth';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();
// Helper to check facility access
async function checkFacilityAccess(req: AuthRequest, facilityId: string): Promise<boolean> {
  const user = req.user;
  if (!user) return false;
  if (user.isAdmin || user.isManagement) return true;
  
  const access = await prisma.userFacility.findUnique({
    where: {
      username_facilityId: {
        username: user.username,
        facilityId: facilityId
      }
    }
  });
  return !!access;
}

// GET /api/risks/reports
router.get('/', authMiddleware, async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId, startDate, endDate, statuses } = req.query as Record<string, string>;

    if (!facilityId) {
      return res.status(400).json({ error: 'facilityId zorunludur.' });
    }

    const hasAccess = await checkFacilityAccess(req, facilityId);
    if (!hasAccess) {
      return res.status(403).json({ error: 'Bu tesis için yetkiniz yok.' });
    }

    const whereClause: any = {
      department: { facilityId },
    };

    if (startDate || endDate) {
      const dateFilter: any = {};
      if (startDate) dateFilter.gte = new Date(startDate);
      if (endDate) dateFilter.lte = new Date(endDate);
      whereClause.detectionDate = dateFilter;
    }

    if (statuses) {
      const statusList = statuses.split(',');
      if (statusList.length > 0) {
        whereClause.status = { in: statusList };
      }
    }

    const risks = await prisma.riskLifecycle.findMany({
      where: whereClause,
      include: {
        department: true,
      },
      orderBy: { detectionDate: 'desc' }
    });

    // Analiz için gruplama
    const byStatus = risks.reduce((acc: any, risk: any) => {
      acc[risk.status] = (acc[risk.status] || 0) + 1;
      return acc;
    }, {});

    const byLevel = risks.reduce((acc: any, risk: any) => {
      const level = risk.finalLevel || risk.initialLevel || 'Bilinmiyor';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});

    const byDepartment = risks.reduce((acc: any, risk: any) => {
      const deptName = risk.department?.name || 'Bilinmiyor';
      acc[deptName] = (acc[deptName] || 0) + 1;
      return acc;
    }, {});

    res.json({
      risks,
      analysis: {
        byStatus: Object.keys(byStatus).map(name => ({ name, value: byStatus[name] })),
        byLevel: Object.keys(byLevel).map(name => ({ name, value: byLevel[name] })),
        byDepartment: Object.keys(byDepartment).map(name => ({ name, value: byDepartment[name] }))
      }
    });

  } catch (error) {
    console.error('Risk reports fetch error:', error);
    res.status(500).json({ error: 'Rapor alınırken hata oluştu.' });
  }
});

export default router;
