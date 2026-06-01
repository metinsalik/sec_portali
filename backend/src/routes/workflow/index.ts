import express from 'express';
import taskRoutes from './tasks';
// import settingsRoutes from './settings';

const router = express.Router();

router.get('/health', (req, res) => {
  res.json({ status: 'Workflow module is running' });
});

router.use('/tasks', taskRoutes);
// router.use('/settings', settingsRoutes);

export default router;
