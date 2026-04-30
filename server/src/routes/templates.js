import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../database.js';

const router = Router();

router.get('/', (req, res) => {
  const { org_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });
  const templates = db.prepare('SELECT * FROM shift_templates WHERE org_id = ? ORDER BY start_time').all(org_id);
  res.json(templates);
});

router.post('/', (req, res) => {
  const { org_id, name, start_time, end_time, required_count, required_skills, color, break_minutes } = req.body;
  const id = uuid();
  db.prepare(`INSERT INTO shift_templates (id, org_id, name, start_time, end_time, required_count, required_skills, color, break_minutes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, org_id, name, start_time, end_time, required_count || 1, JSON.stringify(required_skills || []), color || '#3B82F6', break_minutes || 0);
  res.status(201).json(db.prepare('SELECT * FROM shift_templates WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const { name, start_time, end_time, required_count, required_skills, color, break_minutes } = req.body;
  db.prepare(`UPDATE shift_templates SET
    name = COALESCE(?, name), start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
    required_count = COALESCE(?, required_count), required_skills = COALESCE(?, required_skills),
    color = COALESCE(?, color), break_minutes = COALESCE(?, break_minutes) WHERE id = ?`)
    .run(name, start_time, end_time, required_count, required_skills ? JSON.stringify(required_skills) : null, color, break_minutes, req.params.id);
  res.json(db.prepare('SELECT * FROM shift_templates WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM shift_templates WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
