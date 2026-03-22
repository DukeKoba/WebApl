import { Router } from 'express';
import db from '../database.js';

const router = Router();

// Dashboard stats
router.get('/dashboard', (req, res) => {
  const { org_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const memberCount = db.prepare('SELECT COUNT(*) as count FROM members WHERE org_id = ? AND is_active = 1').get(org_id).count;
  const activeSchedules = db.prepare("SELECT COUNT(*) as count FROM schedules WHERE org_id = ? AND status != 'archived'").get(org_id).count;
  const pendingAbsences = db.prepare(`
    SELECT COUNT(*) as count FROM absences a
    JOIN members m ON a.member_id = m.id
    WHERE m.org_id = ? AND a.status = 'pending'`).get(org_id).count;
  const openSwaps = db.prepare(`
    SELECT COUNT(*) as count FROM swap_requests sr
    JOIN shifts s ON sr.shift_id = s.id
    JOIN schedules sc ON s.schedule_id = sc.id
    WHERE sc.org_id = ? AND sr.status IN ('open', 'pending')`).get(org_id).count;

  // Hours this week per member
  const memberHours = db.prepare(`
    SELECT m.id, m.name, m.color,
      COALESCE(SUM(
        (CAST(SUBSTR(s.end_time, 1, 2) AS REAL) + CAST(SUBSTR(s.end_time, 4, 2) AS REAL)/60)
        - (CAST(SUBSTR(s.start_time, 1, 2) AS REAL) + CAST(SUBSTR(s.start_time, 4, 2) AS REAL)/60)
        - s.break_minutes / 60.0
      ), 0) as total_hours
    FROM members m
    LEFT JOIN shifts s ON m.id = s.member_id AND s.status != 'cancelled'
      AND s.date >= date('now', 'weekday 1', '-7 days') AND s.date <= date('now', 'weekday 0')
    WHERE m.org_id = ? AND m.is_active = 1
    GROUP BY m.id ORDER BY total_hours DESC
  `).all(org_id);

  const recentActivity = db.prepare('SELECT * FROM activity_log WHERE org_id = ? ORDER BY created_at DESC LIMIT 10').all(org_id);

  res.json({ memberCount, activeSchedules, pendingAbsences, openSwaps, memberHours, recentActivity });
});

// Member workload analysis
router.get('/workload', (req, res) => {
  const { org_id, start_date, end_date } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const workload = db.prepare(`
    SELECT m.id, m.name, m.color, m.max_hours_per_week,
      COUNT(s.id) as shift_count,
      COALESCE(SUM(
        (CAST(SUBSTR(s.end_time, 1, 2) AS REAL) + CAST(SUBSTR(s.end_time, 4, 2) AS REAL)/60)
        - (CAST(SUBSTR(s.start_time, 1, 2) AS REAL) + CAST(SUBSTR(s.start_time, 4, 2) AS REAL)/60)
        - s.break_minutes / 60.0
      ), 0) as total_hours
    FROM members m
    LEFT JOIN shifts s ON m.id = s.member_id AND s.status != 'cancelled'
      ${start_date ? "AND s.date >= ?" : ""}
      ${end_date ? "AND s.date <= ?" : ""}
    WHERE m.org_id = ? AND m.is_active = 1
    GROUP BY m.id ORDER BY total_hours DESC
  `).all(...[start_date, end_date, org_id].filter(Boolean));

  res.json(workload);
});

export default router;
