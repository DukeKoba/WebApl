import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../database.js';

const router = Router();

router.get('/', (req, res) => {
  const { org_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });
  const members = db.prepare('SELECT * FROM members WHERE org_id = ? AND is_active = 1 ORDER BY name').all(org_id);
  res.json(members);
});

router.get('/:id', (req, res) => {
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });
  res.json(member);
});

router.post('/', (req, res) => {
  const { org_id, name, email, phone, role, hourly_rate, max_hours_per_week, skills, color } = req.body;
  const id = uuid();
  const colors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];
  const memberColor = color || colors[Math.floor(Math.random() * colors.length)];
  db.prepare(`INSERT INTO members (id, org_id, name, email, phone, role, hourly_rate, max_hours_per_week, skills, color)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, org_id, name, email || '', phone || '', role || 'staff', hourly_rate || 0, max_hours_per_week || 40, JSON.stringify(skills || []), memberColor);
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(id);
  res.status(201).json(member);
});

router.put('/:id', (req, res) => {
  const { name, email, phone, role, hourly_rate, max_hours_per_week, skills, color, is_active } = req.body;
  const member = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  if (!member) return res.status(404).json({ error: 'Not found' });

  db.prepare(`UPDATE members SET
    name = COALESCE(?, name), email = COALESCE(?, email), phone = COALESCE(?, phone),
    role = COALESCE(?, role), hourly_rate = COALESCE(?, hourly_rate),
    max_hours_per_week = COALESCE(?, max_hours_per_week),
    skills = COALESCE(?, skills), color = COALESCE(?, color),
    is_active = COALESCE(?, is_active) WHERE id = ?`)
    .run(name, email, phone, role, hourly_rate, max_hours_per_week,
      skills ? JSON.stringify(skills) : null, color, is_active, req.params.id);

  const updated = db.prepare('SELECT * FROM members WHERE id = ?').get(req.params.id);
  res.json(updated);
});

// Member availability
router.get('/:id/availability', (req, res) => {
  const avail = db.prepare('SELECT * FROM availability WHERE member_id = ? ORDER BY day_of_week, start_time').all(req.params.id);
  res.json(avail);
});

router.post('/:id/availability', (req, res) => {
  const { day_of_week, start_time, end_time, is_available } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO availability (id, member_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, day_of_week, start_time, end_time, is_available ?? 1);
  res.status(201).json(db.prepare('SELECT * FROM availability WHERE id = ?').get(id));
});

router.put('/:id/availability/bulk', (req, res) => {
  const { availability } = req.body;
  const memberId = req.params.id;

  const deleteStmt = db.prepare('DELETE FROM availability WHERE member_id = ?');
  const insertStmt = db.prepare('INSERT INTO availability (id, member_id, day_of_week, start_time, end_time, is_available) VALUES (?, ?, ?, ?, ?, ?)');

  const tx = db.transaction(() => {
    deleteStmt.run(memberId);
    for (const a of availability) {
      insertStmt.run(uuid(), memberId, a.day_of_week, a.start_time, a.end_time, a.is_available ?? 1);
    }
  });
  tx();

  const avail = db.prepare('SELECT * FROM availability WHERE member_id = ? ORDER BY day_of_week, start_time').all(memberId);
  res.json(avail);
});

router.delete('/:id', (req, res) => {
  db.prepare('UPDATE members SET is_active = 0 WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
