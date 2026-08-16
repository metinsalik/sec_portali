import { Router } from 'express';
import settingsRoutes from './settings';
import doorsRoutes from './doors';
import inspectionsRoutes from './inspections';
import analyticsRoutes from './analytics';

import { exportDoors } from './export';
import { authMiddleware } from '../../middleware/auth';

const router = Router();

router.use('/settings', settingsRoutes);
router.use('/doors', doorsRoutes);
router.use('/analytics', analyticsRoutes);
router.get('/export', authMiddleware, exportDoors);
router.use('/', inspectionsRoutes); // since inspections are mapped under /doors/:doorId/inspections

export default router;
