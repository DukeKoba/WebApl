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

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.use('/api/organizations', orgRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/shifts', shiftRoutes);
app.use('/api/absences', absenceRoutes);
app.use('/api/templates', templateRoutes);
app.use('/api/analytics', analyticsRoutes);

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`ShiftScheduler API running on http://localhost:${PORT}`);
});
