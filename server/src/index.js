import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { getRaces, getRaceById, getPrediction } from './raceData.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API routes
app.get('/api/races', (req, res) => {
  res.json(getRaces());
});

app.get('/api/races/:id', (req, res) => {
  const race = getRaceById(parseInt(req.params.id));
  if (!race) return res.status(404).json({ error: 'レースが見つかりません' });
  res.json(race);
});

app.get('/api/races/:id/prediction', (req, res) => {
  const prediction = getPrediction(parseInt(req.params.id));
  if (!prediction) return res.status(404).json({ error: 'レースが見つかりません' });
  res.json(prediction);
});

// Serve frontend in production
if (process.env.NODE_ENV === 'production') {
  const clientDist = path.join(__dirname, '..', '..', 'client', 'dist');
  app.use(express.static(clientDist));
  app.get('*', (req, res) => {
    res.sendFile(path.join(clientDist, 'index.html'));
  });
}

app.listen(PORT, () => {
  console.log(`大井競馬場予想サーバー起動: http://localhost:${PORT}`);
});
