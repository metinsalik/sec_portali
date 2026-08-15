import { Router } from 'express';
import settingsRoutes from './settings';
import doorsRoutes from './doors';
import inspectionsRoutes from './inspections';
import analyticsRoutes from './analytics';

const router = Router();

router.use('/settings', settingsRoutes);
router.use('/doors', doorsRoutes);
router.use('/analytics', analyticsRoutes);
router.use('/', inspectionsRoutes); // since inspections are mapped under /doors/:doorId/inspections

export default router;
