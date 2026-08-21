import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import orgRoutes from './routes/organizations.js';
import memberRoutes from './routes/members.js';
import scheduleRoutes from './routes/schedules.js';
import shiftRoutes from './routes/shifts.js';
import absenceRoutes from './routes/absences.js';
import templateRoutes from './routes/templates.js';
import analyticsRoutes from './routes/analytics.js';
import eikenRoutes from './routes/eiken.js';
import ramenRoutes from './routes/ramen.js';
import aieduRoutes from './routes/aiedu.js';
import itpassRoutes from './routes/itpass.js';
import agentdxRoutes from './routes/agentdx.js';
import igAnalyticsRoutes from './routes/instagramAnalytics.js';
import familySheetRoutes from './routes/familySheet.js';
import authRoutes, { getToken } from './routes/auth.js';
import mediaRoutes from './routes/media.js';
import koyomiRoutes from './routes/koyomi.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded ramen photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Auth
app.use('/api/auth', authRoutes);

// 公開ツール(認証不要): 家族共有シートのOCR。必ず /api 認証ミドルウェアより前に置く。
app.use('/api/family-sheet', familySheetRoutes);

// Auth middleware
app.use('/api', (req, res, next) => {
  const isMediaPreview = req.method === 'GET' && req.path === '/media/file';
  const isMediaDownload = req.method === 'GET' && req.path.startsWith('/media/download/');
  const token = req.headers['x-auth-token'] || (isMediaPreview || isMediaDownload ? req.query.token : '');
  if (token !== getToken()) return res.status(401).json({ error: 'Unauthorized' });
  next();
});

// ShiftSync API routes
app.use('/api/organizations', orgRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);

// SNS poster API routes
app.use('/api/eiken', eikenRoutes);
app.use('/api/koyomi', koyomiRoutes);
app.use('/api/ramen', ramenRoutes);
app.use('/api/aiedu', aieduRoutes);
app.use('/api/itpass', itpassRoutes);
app.use('/api/agentdx', agentdxRoutes);
app.use('/api/instagram', igAnalyticsRoutes);
app.use('/api/media', mediaRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`API running on http://localhost:${PORT}`);
});
