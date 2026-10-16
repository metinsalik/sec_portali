import { Router, Response } from 'express';
import { AuthRequest } from '../../middleware/auth';
import { improvementReportService } from '../../services/improvements/improvementReport.service';
import { ImprovementSheetType } from '@sec-portali/shared';

export const reportsRouter = Router();

// 1. SEKME ÜSTÜ KOMPAKT RAPOR ÖZETİ
reportsRouter.get('/overview', async (req: AuthRequest, res: Response) => {
  try {
    const { sheetType, facilityId } = req.query;

    if (!sheetType) {
      return res.status(400).json({ success: false, message: 'sheetType parametresi zorunludur.' });
    }

    const data = await improvementReportService.getReportsOverview({
      sheetType: sheetType as ImprovementSheetType,
      facilityId: facilityId as string,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching reports overview:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 2. RAPOR GEÇMİŞİ
reportsRouter.get('/history', async (req: AuthRequest, res: Response) => {
  try {
    const { sheetType, facilityId } = req.query;

    if (!sheetType || !facilityId) {
      return res.status(400).json({ success: false, message: 'sheetType ve facilityId parametreleri zorunludur.' });
    }

    const data = await improvementReportService.getReportHistory({
      sheetType: sheetType as ImprovementSheetType,
      facilityId: facilityId as string,
    });

    res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching report history:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// 3. PERİYODİK KONTROL & DENETİM SİHİRBAZI KAYDI
reportsRouter.post('/wizard', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    const report = await improvementReportService.createWizardReport(req.body, userId);
    res.json({ success: true, message: 'Rapor ve bulgular başarıyla kaydedildi.', data: report });
  } catch (error: any) {
    console.error('Error creating wizard report:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});

// 4. RAPORU SİL
reportsRouter.delete('/:id', async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.username || 'system';
    await improvementReportService.deleteReport(req.params.id, userId);
    res.json({ success: true, message: 'Rapor silindi.' });
  } catch (error: any) {
    console.error('Error deleting report:', error);
    res.status(400).json({ success: false, message: error.message });
  }
});
