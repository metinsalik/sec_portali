import express from 'express';
import materialsRouter from './materials';
import settingsRouter from './settings';
import uploadRouter from './upload';
import inventoryRouter from './inventory';
import spillKitsRouter from './spill-kits';

const router = express.Router();

router.use('/materials', materialsRouter);
router.use('/settings', settingsRouter);
router.use('/upload', uploadRouter);
router.use('/inventory', inventoryRouter);
router.use('/spill-kits', spillKitsRouter);

export default router;
