import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import db from '../database.js';
import { autoGenerateShifts, optimizeSchedule, applyOptimization, analyzeStaffingGaps, detectBurnoutRisks, generateSuggestions, calculatePreferenceSatisfaction } from '../services/scheduler.js';

const router = Router();

router.get('/', (req, res) => {
  const { org_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });
  const schedules = db.prepare('SELECT * FROM schedules WHERE org_id = ? ORDER BY start_date DESC').all(org_id);
  res.json(schedules);
});

router.get('/:id', (req, res) => {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Not found' });

  const shifts = db.prepare(`
    SELECT s.*, m.name as member_name, m.color as member_color, t.name as template_name
    FROM shifts s
    LEFT JOIN members m ON s.member_id = m.id
    LEFT JOIN shift_templates t ON s.template_id = t.id
    WHERE s.schedule_id = ?
    ORDER BY s.date, s.start_time
  `).all(req.params.id);

  res.json({ ...schedule, shifts });
});

router.post('/', (req, res) => {
  const { org_id, name, start_date, end_date } = req.body;
  const id = uuid();
  db.prepare('INSERT INTO schedules (id, org_id, name, start_date, end_date) VALUES (?, ?, ?, ?, ?)')
    .run(id, org_id, name, start_date, end_date);
  res.status(201).json(db.prepare('SELECT * FROM schedules WHERE id = ?').get(id));
});

// Auto-generate shifts
router.post('/:id/auto-generate', (req, res) => {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id);
  if (!schedule) return res.status(404).json({ error: 'Not found' });

  try {
    const result = autoGenerateShifts(schedule);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Publish schedule
router.post('/:id/publish', (req, res) => {
  db.prepare('UPDATE schedules SET status = ?, published_at = CURRENT_TIMESTAMP WHERE id = ?')
    .run('published', req.params.id);
  db.prepare(`INSERT INTO activity_log (org_id, action, details)
    SELECT org_id, 'schedule_published', ? FROM schedules WHERE id = ?`)
    .run(JSON.stringify({ schedule_id: req.params.id }), req.params.id);
  res.json(db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id));
});

// AI optimizer - analyze and suggest rebalancing
router.get('/:id/optimize', (req, res) => {
  try {
    const result = optimizeSchedule(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Apply optimization changes
router.post('/:id/optimize', (req, res) => {
  try {
    const { changeIds } = req.body || {};
    const result = applyOptimization(req.params.id, changeIds);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Staffing gap analysis
router.get('/:id/staffing-gaps', (req, res) => {
  const result = analyzeStaffingGaps(req.params.id);
  if (!result) return res.status(404).json({ error: 'Not found' });
  res.json(result);
});

// Burnout risk detection
router.get('/:id/burnout-risks', (req, res) => {
  const alerts = detectBurnoutRisks(req.params.id);
  res.json(alerts);
});

// AI suggestions
router.get('/:id/suggestions', (req, res) => {
  const suggestions = generateSuggestions(req.params.id);
  res.json(suggestions);
});

// Preference satisfaction
router.get('/:id/preference-satisfaction', (req, res) => {
  const result = calculatePreferenceSatisfaction(req.params.id);
  res.json(result);
});

router.put('/:id', (req, res) => {
  const { name, start_date, end_date, status } = req.body;
  db.prepare('UPDATE schedules SET name = COALESCE(?, name), start_date = COALESCE(?, start_date), end_date = COALESCE(?, end_date), status = COALESCE(?, status) WHERE id = ?')
    .run(name, start_date, end_date, status, req.params.id);
  res.json(db.prepare('SELECT * FROM schedules WHERE id = ?').get(req.params.id));
});

router.delete('/:id', (req, res) => {
  db.prepare('DELETE FROM schedules WHERE id = ?').run(req.params.id);
  res.status(204).end();
});

export default router;
