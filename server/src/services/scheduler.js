import { v4 as uuid } from 'uuid';
import db from '../database.js';

/**
 * Auto-generate shifts for a schedule based on templates and member availability
 */
export function autoGenerateShifts(schedule) {
  const templates = db.prepare('SELECT * FROM shift_templates WHERE org_id = ?').all(schedule.org_id);
  const members = db.prepare('SELECT * FROM members WHERE org_id = ? AND is_active = 1').all(schedule.org_id);
  const allAvailability = db.prepare(`
    SELECT a.* FROM availability a
    JOIN members m ON a.member_id = m.id
    WHERE m.org_id = ? AND m.is_active = 1
  `).all(schedule.org_id);

  // Build availability map: memberId -> dayOfWeek -> [{start, end}]
  const availMap = {};
  for (const a of allAvailability) {
    if (!a.is_available) continue;
    if (!availMap[a.member_id]) availMap[a.member_id] = {};
    if (!availMap[a.member_id][a.day_of_week]) availMap[a.member_id][a.day_of_week] = [];
    availMap[a.member_id][a.day_of_week].push({ start: a.start_time, end: a.end_time });
  }

  // Get existing absences for this period
  const absences = db.prepare(`
    SELECT * FROM absences WHERE date >= ? AND date <= ? AND status != 'cancelled'
  `).all(schedule.start_date, schedule.end_date);
  const absenceSet = new Set(absences.map(a => `${a.member_id}_${a.date}`));

  // Track hours assigned to each member this schedule
  const memberHours = {};
  members.forEach(m => { memberHours[m.id] = 0; });

  // Track shifts per day per member to avoid double-booking
  const memberDayShifts = {};

  const insertStmt = db.prepare(`INSERT INTO shifts (id, schedule_id, template_id, member_id, date, start_time, end_time, break_minutes, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`);

  // Delete existing auto-generated shifts
  db.prepare("DELETE FROM shifts WHERE schedule_id = ? AND status = 'assigned'").run(schedule.id);

  const generatedShifts = [];
  const warnings = [];

  const startDate = new Date(schedule.start_date);
  const endDate = new Date(schedule.end_date);

  const tx = db.transaction(() => {
    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay(); // 0=Sun

      for (const template of templates) {
        const shiftHours = calcHours(template.start_time, template.end_time) - (template.break_minutes / 60);
        const requiredSkills = JSON.parse(template.required_skills || '[]');

        // Find available members for this template on this day
        const candidates = members.filter(m => {
          // Check absence
          if (absenceSet.has(`${m.id}_${dateStr}`)) return false;

          // Check availability
          const dayAvail = availMap[m.id]?.[dayOfWeek];
          if (!dayAvail || dayAvail.length === 0) {
            // If no availability set, assume available (flexible)
            if (availMap[m.id] && Object.keys(availMap[m.id]).length > 0) return false;
          } else {
            const covers = dayAvail.some(a => a.start <= template.start_time && a.end >= template.end_time);
            if (!covers) return false;
          }

          // Check skills
          if (requiredSkills.length > 0) {
            const memberSkills = JSON.parse(m.skills || '[]');
            if (!requiredSkills.every(s => memberSkills.includes(s))) return false;
          }

          // Check not already booked this day/time
          const key = `${m.id}_${dateStr}`;
          const existing = memberDayShifts[key] || [];
          const overlaps = existing.some(e =>
            (template.start_time < e.end && template.end_time > e.start)
          );
          if (overlaps) return false;

          // Check weekly hours limit
          const maxHours = m.max_hours_per_week || 40;
          if (memberHours[m.id] + shiftHours > maxHours) return false;

          return true;
        });

        // Sort by least hours (fairness)
        candidates.sort((a, b) => (memberHours[a.id] || 0) - (memberHours[b.id] || 0));

        const needed = template.required_count || 1;
        for (let i = 0; i < needed; i++) {
          const member = candidates[i];
          const shiftId = uuid();

          if (member) {
            insertStmt.run(shiftId, schedule.id, template.id, member.id, dateStr,
              template.start_time, template.end_time, template.break_minutes, 'assigned');
            memberHours[member.id] = (memberHours[member.id] || 0) + shiftHours;
            const key = `${member.id}_${dateStr}`;
            if (!memberDayShifts[key]) memberDayShifts[key] = [];
            memberDayShifts[key].push({ start: template.start_time, end: template.end_time });
            generatedShifts.push({ id: shiftId, member: member.name, date: dateStr, template: template.name });
          } else {
            // Create unassigned shift (shortage)
            insertStmt.run(shiftId, schedule.id, template.id, null, dateStr,
              template.start_time, template.end_time, template.break_minutes, 'unassigned');
            warnings.push({ date: dateStr, template: template.name, message: 'スタッフ不足 - 未割当のシフトがあります' });
          }
        }
      }
    }
  });

  tx();

  // Log activity
  db.prepare('INSERT INTO activity_log (org_id, action, details) VALUES (?, ?, ?)')
    .run(schedule.org_id, 'shifts_generated', JSON.stringify({
      schedule_id: schedule.id, count: generatedShifts.length, warnings: warnings.length
    }));

  return {
    generated: generatedShifts.length,
    warnings,
    shifts: db.prepare(`
      SELECT s.*, m.name as member_name, m.color as member_color, t.name as template_name
      FROM shifts s LEFT JOIN members m ON s.member_id = m.id LEFT JOIN shift_templates t ON s.template_id = t.id
      WHERE s.schedule_id = ? ORDER BY s.date, s.start_time
    `).all(schedule.id)
  };
}

/**
 * Find replacement candidates for a shift
 */
export function findReplacements(shift) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(shift.schedule_id);
  if (!schedule) return [];

  const members = db.prepare('SELECT * FROM members WHERE org_id = ? AND is_active = 1 AND id != ?')
    .all(schedule.org_id, shift.member_id || '');

  const date = new Date(shift.date);
  const dayOfWeek = date.getDay();

  const absences = db.prepare('SELECT member_id FROM absences WHERE date = ? AND status != ?')
    .all(shift.date, 'cancelled');
  const absentIds = new Set(absences.map(a => a.member_id));

  const existingShifts = db.prepare('SELECT * FROM shifts WHERE schedule_id = ? AND date = ? AND status != ?')
    .all(shift.schedule_id, shift.date, 'cancelled');

  const candidates = members.map(m => {
    if (absentIds.has(m.id)) return null;

    // Check availability
    const avail = db.prepare('SELECT * FROM availability WHERE member_id = ? AND day_of_week = ?').all(m.id, dayOfWeek);
    let availScore = 50;
    if (avail.length > 0) {
      const covers = avail.some(a => a.is_available && a.start_time <= shift.start_time && a.end_time >= shift.end_time);
      if (!covers) return null;
      availScore = 100;
    }

    // Check not already working
    const conflict = existingShifts.some(s =>
      s.member_id === m.id && s.start_time < shift.end_time && s.end_time > shift.start_time
    );
    if (conflict) return null;

    // Check hours
    const weekShifts = db.prepare(`
      SELECT COALESCE(SUM(
        (CAST(SUBSTR(end_time, 1, 2) AS REAL) + CAST(SUBSTR(end_time, 4, 2) AS REAL)/60)
        - (CAST(SUBSTR(start_time, 1, 2) AS REAL) + CAST(SUBSTR(start_time, 4, 2) AS REAL)/60)
        - break_minutes / 60.0
      ), 0) as hours
      FROM shifts WHERE member_id = ? AND date >= date(?, 'weekday 1', '-7 days') AND date <= date(?, 'weekday 0')
    `).get(m.id, shift.date, shift.date);

    const hoursLeft = (m.max_hours_per_week || 40) - weekShifts.hours;
    const shiftHours = calcHours(shift.start_time, shift.end_time);
    if (hoursLeft < shiftHours) return null;

    return {
      ...m,
      score: availScore + (hoursLeft / (m.max_hours_per_week || 40)) * 50,
      current_weekly_hours: weekShifts.hours,
      hours_remaining: hoursLeft
    };
  }).filter(Boolean);

  candidates.sort((a, b) => b.score - a.score);
  return candidates;
}

/**
 * Handle an absence - find and suggest replacements
 */
export function handleAbsence(absenceId) {
  const absence = db.prepare('SELECT * FROM absences WHERE id = ?').get(absenceId);
  if (!absence) return null;

  const affectedShifts = db.prepare('SELECT * FROM shifts WHERE schedule_id = ? AND member_id = ? AND date = ?')
    .all(absence.schedule_id, absence.member_id, absence.date);

  const results = affectedShifts.map(shift => {
    const candidates = findReplacements(shift);
    // Auto-assign best candidate if score > 80
    if (candidates.length > 0 && candidates[0].score > 80) {
      db.prepare("UPDATE shifts SET member_id = ?, status = 'reassigned' WHERE id = ?")
        .run(candidates[0].id, shift.id);
      db.prepare('UPDATE absences SET replacement_member_id = ?, status = ? WHERE id = ?')
        .run(candidates[0].id, 'auto_replaced', absenceId);
      return { shift, replacement: candidates[0], autoAssigned: true };
    }
    return { shift, candidates: candidates.slice(0, 5), autoAssigned: false };
  });

  return {
    absence,
    affectedShifts: results,
    message: results.some(r => !r.autoAssigned) ? '一部のシフトに手動割当が必要です' : '全シフトが自動で代替割当されました'
  };
}

function calcHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let h = (eh + em / 60) - (sh + sm / 60);
  if (h < 0) h += 24; // overnight
  return h;
}
