import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { improvementAnalyticsService } from '../../services/improvements/improvementAnalytics.service';

export const analyticsRouter = Router();

// GET /api/operations/improvements/dashboard-stats?facilityId=...
analyticsRouter.get('/dashboard-stats', async (req: AuthRequest, res: Response) => {
  try {
    const { facilityId } = req.query;
    const stats = await improvementAnalyticsService.getDashboardStats({
      facilityId: facilityId as string,
    });
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// GET /api/operations/improvements/group-stats?group=ELEKTRIK_BAKIM_KONTROL&facilityId=...
analyticsRouter.get('/group-stats', async (req: AuthRequest, res: Response) => {
  try {
    const { group = 'ELEKTRIK_BAKIM_KONTROL', facilityId } = req.query;
    const stats = await improvementAnalyticsService.getGroupStats({
      group: group as string,
      facilityId: facilityId as string,
    });
    res.json({ success: true, data: stats });
  } catch (error: any) {
    console.error('Error fetching group stats:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});
