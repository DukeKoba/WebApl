import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../database.js';
import { findReplacements } from '../services/scheduler.js';

const router = Router();

router.get('/', (req, res) => {
  const { schedule_id, member_id, date } = req.query;
  let query = `
    SELECT s.*, m.name as member_name, m.color as member_color, t.name as template_name
    FROM shifts s
    LEFT JOIN members m ON s.member_id = m.id
    LEFT JOIN shift_templates t ON s.template_id = t.id WHERE 1=1`;
  const params = [];

  if (schedule_id) { query += ' AND s.schedule_id = ?'; params.push(schedule_id); }
  if (member_id) { query += ' AND s.member_id = ?'; params.push(member_id); }
  if (date) { query += ' AND s.date = ?'; params.push(date); }
  query += ' ORDER BY s.date, s.start_time';

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { schedule_id, template_id, member_id, date, start_time, end_time, break_minutes, notes } = req.body;
  const id = uuid();
  db.prepare(`INSERT INTO shifts (id, schedule_id, template_id, member_id, date, start_time, end_time, break_minutes, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
    .run(id, schedule_id, template_id || null, member_id || null, date, start_time, end_time, break_minutes || 0, notes || '');
  const shift = db.prepare(`
    SELECT s.*, m.name as member_name, m.color as member_color
    FROM shifts s LEFT JOIN members m ON s.member_id = m.id WHERE s.id = ?`).get(id);
  res.status(201).json(shift);
});

router.put('/:id', (req, res) => {
  const { member_id, date, start_time, end_time, break_minutes, status, notes } = req.body;
  db.prepare(`UPDATE shifts SET
    member_id = COALESCE(?, member_id), date = COALESCE(?, date),
    start_time = COALESCE(?, start_time), end_time = COALESCE(?, end_time),
    break_minutes = COALESCE(?, break_minutes), status = COALESCE(?, status),
    notes = COALESCE(?, notes) WHERE id = ?`)
    .run(member_id, date, start_time, end_time, break_minutes, status, notes, req.params.id);
  const shift = db.prepare(`
    SELECT s.*, m.name as member_name, m.color as member_color
    FROM shifts s LEFT JOIN members m ON s.member_id = m.id WHERE s.id = ?`).get(req.params.id);
  res.json(shift);
});

// Find replacement candidates for a shift
router.get('/:id/replacements', (req, res) => {
  const shift = db.prepare('SELECT * FROM shifts WHERE id = ?').get(req.params.id);
  if (!shift) return res.status(404).json({ error: 'Not found' });
  const candidates = findReplacements(shift);
  res.json(candidates);
});

// Swap request
router.post('/:id/swap', (req, res) => {
  const { requester_id, target_id, message } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO swap_requests (id, shift_id, requester_id, target_id, status, message) VALUES (?, ?, ?, ?, ?, ?)')
    .run(id, req.params.id, requester_id, target_id || null, target_id ? 'pending' : 'open', message || '');
  res.status(201).json(db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(id));
});

// Accept swap
router.post('/swap/:swapId/accept', (req, res) => {
  const swap = db.prepare('SELECT * FROM swap_requests WHERE id = ?').get(req.params.swapId);
  if (!swap) return res.status(404).json({ error: 'Not found' });

  const { accepter_id } = req.body;
  const targetId = swap.target_id || accepter_id;

  db.prepare('UPDATE swap_requests SET status = ?, target_id = ? WHERE id = ?')
    .run('accepted', targetId, req.params.swapId);
  db.prepare('UPDATE shifts SET member_id = ? WHERE id = ?')
    .run(targetId, swap.shift_id);

  res.json({ success: true });
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM shifts WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
