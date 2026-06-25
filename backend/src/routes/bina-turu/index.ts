import { Router } from 'express';
import ayarlarRoutes from './ayarlar';
import soruBankasiRoutes from './soru-bankasi';
import turlerRoutes from './turler';
import denetimRoutes from './denetim';
import uygunsuzluklarRoutes from './uygunsuzluklar';
import dashboardRoutes from './dashboard';
import analizRoutes from './analiz';
import raporRoutes from './rapor';
import yillikRaporRoutes from './yillik-rapor';
import uygunsuzlukRaporlariRoutes from './uygunsuzluk-raporlari';

const router = Router();

router.use('/ayarlar', ayarlarRoutes);
router.use('/soru-bankasi', soruBankasiRoutes);
router.use('/turler', turlerRoutes);
router.use('/denetim', denetimRoutes);
router.use('/uygunsuzluklar', uygunsuzluklarRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/analiz', analizRoutes);
router.use('/rapor', raporRoutes);
router.use('/yillik-rapor', yillikRaporRoutes);
router.use('/uygunsuzluk-raporlari', uygunsuzlukRaporlariRoutes);

export default router;
