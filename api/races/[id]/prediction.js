import { getPrediction } from '../../_raceData.js';

export default function handler(req, res) {
  const id = parseInt(req.query.id);
  const prediction = getPrediction(id);
  if (!prediction) return res.status(404).json({ error: 'レースが見つかりません' });
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(prediction);
}
