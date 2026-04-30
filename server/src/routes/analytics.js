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

  const params = [];
  let dateFilter = '';
  if (start_date) { dateFilter += " AND s.date >= ?"; params.push(start_date); }
  if (end_date) { dateFilter += " AND s.date <= ?"; params.push(end_date); }
  params.push(org_id);

  const workload = db.prepare(`
    SELECT m.id, m.name, m.color, m.max_hours_per_week, m.hourly_rate,
      COUNT(s.id) as shift_count,
      COALESCE(SUM(
        (CAST(SUBSTR(s.end_time, 1, 2) AS REAL) + CAST(SUBSTR(s.end_time, 4, 2) AS REAL)/60)
        - (CAST(SUBSTR(s.start_time, 1, 2) AS REAL) + CAST(SUBSTR(s.start_time, 4, 2) AS REAL)/60)
        - s.break_minutes / 60.0
      ), 0) as total_hours
    FROM members m
    LEFT JOIN shifts s ON m.id = s.member_id AND s.status != 'cancelled' ${dateFilter}
    WHERE m.org_id = ? AND m.is_active = 1
    GROUP BY m.id ORDER BY total_hours DESC
  `).all(...params);

  res.json(workload);
});

// Fairness score - how evenly distributed are hours among members
router.get('/fairness', (req, res) => {
  const { org_id, schedule_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  let shiftFilter = "AND s.status != 'cancelled'";
  const params = [org_id];
  if (schedule_id) {
    shiftFilter += " AND s.schedule_id = ?";
    params.push(schedule_id);
  }

  const workload = db.prepare(`
    SELECT m.id, m.name, m.color, m.max_hours_per_week,
      COUNT(s.id) as shift_count,
      COALESCE(SUM(
        (CAST(SUBSTR(s.end_time, 1, 2) AS REAL) + CAST(SUBSTR(s.end_time, 4, 2) AS REAL)/60)
        - (CAST(SUBSTR(s.start_time, 1, 2) AS REAL) + CAST(SUBSTR(s.start_time, 4, 2) AS REAL)/60)
        - s.break_minutes / 60.0
      ), 0) as total_hours,
      COUNT(DISTINCT s.date) as days_worked,
      COUNT(CASE WHEN strftime('%w', s.date) IN ('0','6') THEN 1 END) as weekend_shifts
    FROM members m
    LEFT JOIN shifts s ON m.id = s.member_id ${shiftFilter}
    WHERE m.org_id = ? AND m.is_active = 1
    GROUP BY m.id
  `).all(...params);

  if (workload.length === 0) return res.json({ score: 100, members: [], details: {} });

  const totalHours = workload.reduce((s, w) => s + w.total_hours, 0);
  const avgHours = totalHours / workload.length;
  const maxDeviation = avgHours > 0
    ? Math.max(...workload.map(w => Math.abs(w.total_hours - avgHours) / avgHours))
    : 0;
  // Fairness: 100 = perfectly even, 0 = wildly uneven
  const fairnessScore = Math.max(0, Math.round((1 - maxDeviation) * 100));

  // Weekend fairness
  const totalWeekends = workload.reduce((s, w) => s + w.weekend_shifts, 0);
  const avgWeekends = totalWeekends / workload.length;
  const weekendDeviation = avgWeekends > 0
    ? Math.max(...workload.map(w => Math.abs(w.weekend_shifts - avgWeekends) / avgWeekends))
    : 0;
  const weekendFairness = Math.max(0, Math.round((1 - weekendDeviation) * 100));

  res.json({
    score: fairnessScore,
    weekendFairness,
    avgHours: Math.round(avgHours * 10) / 10,
    members: workload,
    details: {
      totalHours: Math.round(totalHours * 10) / 10,
      memberCount: workload.length,
      maxDeviation: Math.round(maxDeviation * 100),
    }
  });
});

// Labor cost projection
router.get('/labor-cost', (req, res) => {
  const { org_id, schedule_id } = req.query;
  if (!org_id) return res.status(400).json({ error: 'org_id required' });

  const params = [org_id];
  let scheduleFilter = '';
  if (schedule_id) {
    scheduleFilter = 'AND s.schedule_id = ?';
    params.push(schedule_id);
  }

  const costs = db.prepare(`
    SELECT m.id, m.name, m.color, m.hourly_rate,
      s.date,
      COALESCE(
        (CAST(SUBSTR(s.end_time, 1, 2) AS REAL) + CAST(SUBSTR(s.end_time, 4, 2) AS REAL)/60)
        - (CAST(SUBSTR(s.start_time, 1, 2) AS REAL) + CAST(SUBSTR(s.start_time, 4, 2) AS REAL)/60)
        - s.break_minutes / 60.0
      , 0) as hours
    FROM shifts s
    JOIN members m ON s.member_id = m.id
    JOIN schedules sc ON s.schedule_id = sc.id
    WHERE sc.org_id = ? ${scheduleFilter} AND s.status != 'cancelled'
    ORDER BY s.date
  `).all(...params);

  const byDate = {};
  let totalCost = 0;
  let totalHours = 0;
  for (const row of costs) {
    const cost = row.hours * row.hourly_rate;
    totalCost += cost;
    totalHours += row.hours;
    if (!byDate[row.date]) byDate[row.date] = { date: row.date, cost: 0, hours: 0 };
    byDate[row.date].cost += cost;
    byDate[row.date].hours += row.hours;
  }

  res.json({
    totalCost: Math.round(totalCost),
    totalHours: Math.round(totalHours * 10) / 10,
    dailyCosts: Object.values(byDate),
  });
});

// Availability heatmap for a schedule period
router.get('/availability-map', (req, res) => {
  const { org_id, start_date, end_date } = req.query;
  if (!org_id || !start_date || !end_date) return res.status(400).json({ error: 'org_id, start_date, end_date required' });

  const members = db.prepare('SELECT id, name, color FROM members WHERE org_id = ? AND is_active = 1 ORDER BY name').all(org_id);
  const allAvail = db.prepare(`
    SELECT a.* FROM availability a
    JOIN members m ON a.member_id = m.id
    WHERE m.org_id = ? AND m.is_active = 1 AND a.is_available = 1
  `).all(org_id);
  const absences = db.prepare('SELECT member_id, date FROM absences WHERE date >= ? AND date <= ? AND status != ?')
    .all(start_date, end_date, 'cancelled');
  const absenceSet = new Set(absences.map(a => `${a.member_id}_${a.date}`));

  const availMap = {};
  for (const a of allAvail) {
    if (!availMap[a.member_id]) availMap[a.member_id] = {};
    if (!availMap[a.member_id][a.day_of_week]) availMap[a.member_id][a.day_of_week] = [];
    availMap[a.member_id][a.day_of_week].push({ start: a.start_time, end: a.end_time });
  }

  const dates = [];
  const start = new Date(start_date);
  const end = new Date(end_date);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  const result = members.map(m => ({
    id: m.id,
    name: m.name,
    color: m.color,
    dates: dates.map(date => {
      const d = new Date(date);
      const dow = d.getDay();
      if (absenceSet.has(`${m.id}_${date}`)) return { date, status: 'absent' };
      const slots = availMap[m.id]?.[dow];
      if (!slots && availMap[m.id] && Object.keys(availMap[m.id]).length > 0) return { date, status: 'unavailable' };
      if (slots) return { date, status: 'available', slots };
      return { date, status: 'flexible' };
    })
  }));

  res.json({ dates, members: result });
});

export default router;
