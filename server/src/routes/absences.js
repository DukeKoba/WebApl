import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../database.js';
import { handleAbsence } from '../services/scheduler.js';

const router = Router();

router.get('/', (req, res) => {
  const { org_id, member_id, schedule_id } = req.query;
  let query = `
    SELECT a.*, m.name as member_name, rm.name as replacement_name
    FROM absences a
    LEFT JOIN members m ON a.member_id = m.id
    LEFT JOIN members rm ON a.replacement_member_id = rm.id
    WHERE 1=1`;
  const params = [];

  if (member_id) { query += ' AND a.member_id = ?'; params.push(member_id); }
  if (schedule_id) { query += ' AND a.schedule_id = ?'; params.push(schedule_id); }
  if (org_id) {
    query += ' AND m.org_id = ?'; params.push(org_id);
  }
  query += ' ORDER BY a.date DESC';

  res.json(db.prepare(query).all(...params));
});

router.post('/', (req, res) => {
  const { member_id, schedule_id, date, reason } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO absences (id, member_id, schedule_id, date, reason) VALUES (?, ?, ?, ?, ?)')
    .run(id, member_id, schedule_id || null, date, reason || '');

  // Auto-find replacement
  if (schedule_id) {
    const result = handleAbsence(id);
    return res.status(201).json(result);
  }

  res.status(201).json(db.prepare('SELECT * FROM absences WHERE id = ?').get(id));
});

router.put('/:id', (req, res) => {
  const { status, replacement_member_id } = req.body;

  if (replacement_member_id) {
    // Assign replacement to the affected shifts
    const absence = db.prepare('SELECT * FROM absences WHERE id = ?').get(req.params.id);
    if (absence && absence.schedule_id) {
      db.prepare(`UPDATE shifts SET member_id = ?, status = 'reassigned'
        WHERE schedule_id = ? AND member_id = ? AND date = ?`)
        .run(replacement_member_id, absence.schedule_id, absence.member_id, absence.date);
    }
  }

  db.prepare('UPDATE absences SET status = COALESCE(?, status), replacement_member_id = COALESCE(?, replacement_member_id) WHERE id = ?')
    .run(status, replacement_member_id, req.params.id);
  res.json(db.prepare('SELECT * FROM absences WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM absences WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
