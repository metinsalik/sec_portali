import { startCronJobs } from './jobs/cronTasks';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import path from 'path';
import { createServer } from 'http';
import { Server } from 'socket.io';

// Routes
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import telegramRoutes from './routes/settings/telegram';
import hazmatKitItemsRoutes from './routes/settings/hazmat-kit-items';
import panelRoutes from './routes/panel';
import operationsRoutes from './routes/operations';
import notificationRoutes from './routes/notifications';
import notebookRoutes from './routes/notebooks';
import incidentRoutes from './routes/incidents';
import workflowRoutes from './routes/workflow';
import riskRoutes from './routes/risks';
import riskReportsRoutes from './routes/risks/reports';
import hazmatRoutes from './routes/hazmat';
import fireEquipmentRoutes from './routes/fire_equipment';
import buildManagementRoutes from './routes/build_management';
import checklistRoutes from './routes/checklists';
import ohsBoardRoutes from './routes/ohs_boards';
import publicRoutes from './routes/public';
import fireDoorsRoutes from './routes/fire_doors';
import isgDefterRoutes from './routes/isgDefter.routes';
import elevatorRoutes from './routes/elevator.routes';
import elevatorSettingsRoutes from './routes/elevator-settings.routes';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json({ limit: '500mb' }));
app.use(express.urlencoded({ limit: '500mb', extended: true }));
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

import buildSettingsRoutes from './routes/build_settings';
import binaTuruRoutes from './routes/bina-turu';

import renovationReportRoutes from './routes/renovation_report';

// Servis statik dosyalar (Yüklemeler için)
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Route Entegrasyonu
app.use('/api/public', publicRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/settings/telegram', telegramRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/settings/hazmat-kit-items', hazmatKitItemsRoutes);
app.use('/api/panel', panelRoutes);
app.use('/api/operations', operationsRoutes);
app.use('/api/operations/board', ohsBoardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/notebooks', notebookRoutes);
app.use('/api/incidents', incidentRoutes);
app.use('/api/workflow', workflowRoutes);
app.use('/api/risks/reports', riskReportsRoutes);
app.use('/api/risks', riskRoutes);
app.use('/api/hazmat', hazmatRoutes);
app.use('/api/fire-equipment', fireEquipmentRoutes);
app.use('/api/build-management', buildManagementRoutes);
app.use('/api/build-management/settings', buildSettingsRoutes);
app.use('/api/bina-turu', binaTuruRoutes);
app.use('/api/renovation-reports', renovationReportRoutes);
app.use('/api/locations', require('./routes/locations').default);
app.use('/api/checklists', checklistRoutes);
app.use('/api/safety-management/fire-doors', fireDoorsRoutes);
app.use('/api/safety-management/isg-defter', isgDefterRoutes);
app.use('/api/safety-management/elevators', elevatorRoutes);
app.use('/api/safety-management/elevator-settings', elevatorSettingsRoutes);

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler - tüm route'ların sonunda
app.use(notFoundHandler);

// Global error handler - en son middleware
app.use(errorHandler);

import { initTelegramBot } from './services/telegramService';

const httpServer = createServer(app);
export const io = new Server(httpServer, {
  cors: {
    origin: [
      process.env.FRONTEND_URL || '*',
      'http://localhost',
      'http://localhost:3005',
      'http://localhost:5173'
    ],
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    credentials: true
  }
});

io.on('connection', (socket) => {
  // Join a room specifically for a task
  socket.on('joinTask', (taskId) => {
    socket.join(`task_${taskId}`);
  });
  socket.on('leaveTask', (taskId) => {
    socket.leave(`task_${taskId}`);
  });
});

httpServer.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
  initTelegramBot(); // Start Telegram bot polling
  startCronJobs();
  
  const { startChecklistCronJobs } = require('./jobs/checklistCron');
  startChecklistCronJobs();
});
