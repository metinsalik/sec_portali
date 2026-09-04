import express from 'express';
import facilityRoutes from './facilities';
import locationRoutes from './locations';
import lifecycleRoutes from './lifecycle';
import uploadRoutes from './upload';
import settingsRoutes from './settings';

const router = express.Router();

router.get('/health', (_req, res) => {
  res.json({ status: 'Risk Lifecycle module is running' });
});

// /api/risks/facilities  → uzmanın tesis listesi + yönetim
router.use('/facilities', facilityRoutes);

// /api/risks/locations & /api/risks/departments → departman (bölüm) ve lokasyon yönetimi
router.use('/locations', locationRoutes);
router.use('/departments', locationRoutes);

// /api/risks/lifecycle   → risk yaşam döngüsü CRUD + Excel import
router.use('/lifecycle', lifecycleRoutes);

// /api/risks/upload      → fotoğraf yükleme
router.use('/upload', uploadRoutes);

// /api/risks/settings    → tesis bazlı risk ayarları (departmanlar, kategoriler, vb.)
router.use('/settings', settingsRoutes);

export default router;
