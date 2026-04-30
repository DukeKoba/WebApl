import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../database.js';

const router = Router();

router.get('/', (req, res) => {
  const orgs = db.prepare('SELECT * FROM organizations ORDER BY created_at DESC').all();
  res.json(orgs);
});

router.get('/:id', (req, res) => {
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  if (!org) return res.status(404).json({ error: 'Not found' });
  res.json(org);
});

router.post('/', (req, res) => {
  const { name, type, timezone } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO organizations (id, name, type, timezone) VALUES (?, ?, ?, ?)').run(id, name, type || 'general', timezone || 'Asia/Tokyo');
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(id);
  res.status(201).json(org);
});

router.put('/:id', (req, res) => {
  const { name, type, timezone, settings } = req.body;
  db.prepare('UPDATE organizations SET name = COALESCE(?, name), type = COALESCE(?, type), timezone = COALESCE(?, timezone), settings = COALESCE(?, settings) WHERE id = ?')
    .run(name, type, timezone, settings ? JSON.stringify(settings) : null, req.params.id);
  const org = db.prepare('SELECT * FROM organizations WHERE id = ?').get(req.params.id);
  res.json(org);
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM organizations WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
