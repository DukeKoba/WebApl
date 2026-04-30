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
import authRoutes, { getToken } from './routes/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

// Serve uploaded ramen photos
app.use('/uploads', express.static(path.join(__dirname, '..', 'uploads')));

// Auth
app.use('/api/auth', authRoutes);

// Auth middleware
app.use('/api', (req, res, next) => {
  const token = req.headers['x-auth-token'];
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
app.use('/api/ramen', ramenRoutes);
app.use('/api/aiedu', aieduRoutes);
app.use('/api/itpass', itpassRoutes);
app.use('/api/agentdx', agentdxRoutes);
app.use('/api/instagram', igAnalyticsRoutes);

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
