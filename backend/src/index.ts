import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';

// Routes
import authRoutes from './routes/auth';
import settingsRoutes from './routes/settings';
import panelRoutes from './routes/panel';
import operationsRoutes from './routes/operations';

// Middleware
import { errorHandler, notFoundHandler } from './middleware/errorHandler';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3005;

app.use(express.json());
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(helmet());

// Route Entegrasyonu
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/panel', panelRoutes);
app.use('/api/operations', operationsRoutes);

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
