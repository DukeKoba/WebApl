import { getRaceById } from '../../_raceData.js';

export default function handler(req, res) {
  const id = parseInt(req.query.id);
  const race = getRaceById(id);
  if (!race) return res.status(404).json({ error: 'レースが見つかりません' });
  res.setHeader('Content-Type', 'application/json');
  res.status(200).json(race);
}
