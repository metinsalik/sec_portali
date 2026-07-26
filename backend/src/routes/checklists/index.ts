import express from 'express';
import { authMiddleware } from '../../middleware/auth';
import templateRoutes from './templates';
import submissionRouter from './submissions';
import reportsRouter from './reports';
import categoriesRouter from './categories';
import scalesRouter from './scales';
import assignmentsRouter from './assignments';

const router = express.Router();

router.use(authMiddleware);

router.use('/templates', templateRoutes);
router.use('/submissions', submissionRouter);
router.use('/reports', reportsRouter);
router.use('/categories', categoriesRouter);
router.use('/scales', scalesRouter);
router.use('/assignments', assignmentsRouter);

export default router;
