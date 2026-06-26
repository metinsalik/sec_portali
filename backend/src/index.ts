import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
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

// Servis statik dosyalar (Yüklemeler için)
app.use('/uploads', express.static('uploads'));

// Route Entegrasyonu
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/settings/hazmat-kit-items', hazmatKitItemsRoutes);
app.use('/api/panel', panelRoutes);
app.use('/api/operations', operationsRoutes);
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

// Sağlık kontrolü
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 handler - tüm route'ların sonunda
app.use(notFoundHandler);

// Global error handler - en son middleware
app.use(errorHandler);

// Start Server
app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`Backend server running on http://0.0.0.0:${PORT}`);
});
