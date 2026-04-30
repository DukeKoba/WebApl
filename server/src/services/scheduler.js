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

/**
 * AI-powered schedule optimizer: rebalances shifts for fairness
 * Competitive edge: No competitor does explainable auto-rebalancing
 */
export function optimizeSchedule(scheduleId) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  if (!schedule) throw new Error('Schedule not found');

  const shifts = db.prepare("SELECT * FROM shifts WHERE schedule_id = ? AND status != 'cancelled'").all(scheduleId);
  const members = db.prepare('SELECT * FROM members WHERE org_id = ? AND is_active = 1').all(schedule.org_id);
  if (members.length < 2 || shifts.length === 0) return { changes: [], suggestions: [] };

  const allAvailability = db.prepare(`
    SELECT a.* FROM availability a JOIN members m ON a.member_id = m.id
    WHERE m.org_id = ? AND m.is_active = 1
  `).all(schedule.org_id);
  const availMap = {};
  for (const a of allAvailability) {
    if (!a.is_available) continue;
    if (!availMap[a.member_id]) availMap[a.member_id] = {};
    if (!availMap[a.member_id][a.day_of_week]) availMap[a.member_id][a.day_of_week] = [];
    availMap[a.member_id][a.day_of_week].push({ start: a.start_time, end: a.end_time });
  }

  const absences = db.prepare("SELECT * FROM absences WHERE date >= ? AND date <= ? AND status != 'cancelled'")
    .all(schedule.start_date, schedule.end_date);
  const absenceSet = new Set(absences.map(a => `${a.member_id}_${a.date}`));

  // Calculate current hours per member
  const memberHours = {};
  const memberShifts = {};
  members.forEach(m => { memberHours[m.id] = 0; memberShifts[m.id] = []; });
  for (const s of shifts) {
    if (!s.member_id) continue;
    const h = calcHours(s.start_time, s.end_time) - (s.break_minutes / 60);
    memberHours[s.member_id] = (memberHours[s.member_id] || 0) + h;
    if (!memberShifts[s.member_id]) memberShifts[s.member_id] = [];
    memberShifts[s.member_id].push(s);
  }

  const totalHours = Object.values(memberHours).reduce((a, b) => a + b, 0);
  const avgHours = totalHours / members.length;

  // Find overloaded and underloaded members
  const overloaded = members.filter(m => memberHours[m.id] > avgHours * 1.2).sort((a, b) => memberHours[b.id] - memberHours[a.id]);
  const underloaded = members.filter(m => memberHours[m.id] < avgHours * 0.8).sort((a, b) => memberHours[a.id] - memberHours[b.id]);

  const changes = [];
  const suggestions = [];

  // Try to move shifts from overloaded to underloaded
  for (const over of overloaded) {
    if (memberHours[over.id] <= avgHours * 1.1) continue;

    const movableShifts = (memberShifts[over.id] || []).filter(s => s.status === 'assigned');
    for (const shift of movableShifts) {
      if (memberHours[over.id] <= avgHours * 1.1) break;

      const dow = new Date(shift.date).getDay();
      const shiftHours = calcHours(shift.start_time, shift.end_time) - (shift.break_minutes / 60);

      // Find best underloaded candidate
      for (const under of underloaded) {
        if (memberHours[under.id] + shiftHours > avgHours * 1.2) continue;
        if (absenceSet.has(`${under.id}_${shift.date}`)) continue;

        // Check availability
        const dayAvail = availMap[under.id]?.[dow];
        if (availMap[under.id] && Object.keys(availMap[under.id]).length > 0) {
          if (!dayAvail || !dayAvail.some(a => a.start <= shift.start_time && a.end >= shift.end_time)) continue;
        }

        // Check no overlap
        const underShifts = memberShifts[under.id] || [];
        const overlaps = underShifts.some(s =>
          s.date === shift.date && s.start_time < shift.end_time && s.end_time > shift.start_time
        );
        if (overlaps) continue;

        // Check skills
        if (shift.template_id) {
          const template = db.prepare('SELECT required_skills FROM shift_templates WHERE id = ?').get(shift.template_id);
          if (template) {
            const reqSkills = JSON.parse(template.required_skills || '[]');
            const memSkills = JSON.parse(under.skills || '[]');
            if (reqSkills.length > 0 && !reqSkills.every(s => memSkills.includes(s))) continue;
          }
        }

        // Record the change
        changes.push({
          shift_id: shift.id,
          date: shift.date,
          time: `${shift.start_time}〜${shift.end_time}`,
          from_member: over.name,
          from_member_id: over.id,
          to_member: under.name,
          to_member_id: under.id,
          reason: `${over.name}（${memberHours[over.id].toFixed(1)}h）→ ${under.name}（${memberHours[under.id].toFixed(1)}h）: ${shiftHours.toFixed(1)}h移動で均等化`,
        });

        memberHours[over.id] -= shiftHours;
        memberHours[under.id] += shiftHours;
        if (!memberShifts[under.id]) memberShifts[under.id] = [];
        memberShifts[under.id].push(shift);
        memberShifts[over.id] = memberShifts[over.id].filter(s => s.id !== shift.id);
        break;
      }
    }
  }

  return { changes, suggestions, beforeAvg: avgHours };
}

/**
 * Apply optimizer changes to the database
 */
export function applyOptimization(scheduleId, changeIds) {
  const result = optimizeSchedule(scheduleId);
  const toApply = changeIds
    ? result.changes.filter(c => changeIds.includes(c.shift_id))
    : result.changes;

  const updateStmt = db.prepare("UPDATE shifts SET member_id = ?, status = 'optimized' WHERE id = ?");
  const tx = db.transaction(() => {
    for (const change of toApply) {
      updateStmt.run(change.to_member_id, change.shift_id);
    }
  });
  tx();

  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  db.prepare('INSERT INTO activity_log (org_id, action, details) VALUES (?, ?, ?)')
    .run(schedule.org_id, 'schedule_optimized', JSON.stringify({ schedule_id: scheduleId, changes: toApply.length }));

  return {
    applied: toApply.length,
    shifts: db.prepare(`
      SELECT s.*, m.name as member_name, m.color as member_color, t.name as template_name
      FROM shifts s LEFT JOIN members m ON s.member_id = m.id LEFT JOIN shift_templates t ON s.template_id = t.id
      WHERE s.schedule_id = ? ORDER BY s.date, s.start_time
    `).all(scheduleId)
  };
}

/**
 * Staffing gap analysis: required vs actual per template per day
 * Competitive edge: Most competitors don't surface this inline
 */
export function analyzeStaffingGaps(scheduleId) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  if (!schedule) return null;

  const templates = db.prepare('SELECT * FROM shift_templates WHERE org_id = ?').all(schedule.org_id);
  const shifts = db.prepare("SELECT * FROM shifts WHERE schedule_id = ? AND status != 'cancelled'").all(scheduleId);

  const dates = [];
  const start = new Date(schedule.start_date);
  const end = new Date(schedule.end_date);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    dates.push(d.toISOString().split('T')[0]);
  }

  const gaps = [];
  let totalRequired = 0;
  let totalAssigned = 0;
  let totalUnassigned = 0;

  for (const date of dates) {
    for (const tpl of templates) {
      const required = tpl.required_count || 1;
      const assigned = shifts.filter(s => s.date === date && s.template_id === tpl.id && s.member_id).length;
      const unassigned = shifts.filter(s => s.date === date && s.template_id === tpl.id && !s.member_id).length;
      totalRequired += required;
      totalAssigned += assigned;
      totalUnassigned += unassigned;

      if (assigned < required) {
        gaps.push({
          date,
          template_id: tpl.id,
          template_name: tpl.name,
          time: `${tpl.start_time}〜${tpl.end_time}`,
          required,
          assigned,
          shortage: required - assigned,
          severity: assigned === 0 ? 'critical' : (assigned / required < 0.5 ? 'high' : 'medium'),
        });
      }
    }
  }

  const coverageRate = totalRequired > 0 ? Math.round((totalAssigned / totalRequired) * 100) : 100;

  // Per-day summary
  const dailySummary = dates.map(date => {
    const dayRequired = templates.reduce((s, t) => s + (t.required_count || 1), 0);
    const dayAssigned = shifts.filter(s => s.date === date && s.member_id).length;
    return {
      date,
      required: dayRequired,
      assigned: dayAssigned,
      status: dayAssigned >= dayRequired ? 'ok' : dayAssigned >= dayRequired * 0.7 ? 'warning' : 'critical',
    };
  });

  return { gaps, dailySummary, coverageRate, totalRequired, totalAssigned, totalUnassigned };
}

/**
 * Burnout detection: consecutive days, short turnarounds, overwork patterns
 * Competitive edge: Only Sling detects clopening; nobody does comprehensive burnout analysis
 */
export function detectBurnoutRisks(scheduleId) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  if (!schedule) return [];

  const members = db.prepare('SELECT * FROM members WHERE org_id = ? AND is_active = 1').all(schedule.org_id);
  const shifts = db.prepare(`
    SELECT s.*, m.name as member_name FROM shifts s
    LEFT JOIN members m ON s.member_id = m.id
    WHERE s.schedule_id = ? AND s.member_id IS NOT NULL AND s.status != 'cancelled'
    ORDER BY s.member_id, s.date, s.start_time
  `).all(scheduleId);

  const alerts = [];

  for (const member of members) {
    const memberShifts = shifts.filter(s => s.member_id === member.id).sort((a, b) => a.date.localeCompare(b.date) || a.start_time.localeCompare(b.start_time));
    if (memberShifts.length === 0) continue;

    // 1. Consecutive days detection (>=6 days)
    let consecutive = 1;
    let streak = [memberShifts[0].date];
    const uniqueDates = [...new Set(memberShifts.map(s => s.date))].sort();
    for (let i = 1; i < uniqueDates.length; i++) {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diff = (curr - prev) / (1000 * 60 * 60 * 24);
      if (diff === 1) {
        consecutive++;
        streak.push(uniqueDates[i]);
      } else {
        if (consecutive >= 6) {
          alerts.push({
            type: 'consecutive_days',
            severity: consecutive >= 7 ? 'high' : 'medium',
            member_id: member.id,
            member_name: member.name,
            member_color: member.color,
            message: `${consecutive}日連勤（${streak[0]}〜${streak[streak.length - 1]}）`,
            details: { days: consecutive, start: streak[0], end: streak[streak.length - 1] },
          });
        }
        consecutive = 1;
        streak = [uniqueDates[i]];
      }
    }
    if (consecutive >= 6) {
      alerts.push({
        type: 'consecutive_days',
        severity: consecutive >= 7 ? 'high' : 'medium',
        member_id: member.id,
        member_name: member.name,
        member_color: member.color,
        message: `${consecutive}日連勤（${streak[0]}〜${streak[streak.length - 1]}）`,
        details: { days: consecutive, start: streak[0], end: streak[streak.length - 1] },
      });
    }

    // 2. Short turnaround / clopening detection (<10 hours between shifts)
    for (let i = 1; i < memberShifts.length; i++) {
      const prev = memberShifts[i - 1];
      const curr = memberShifts[i];
      const prevEnd = new Date(`${prev.date}T${prev.end_time}`);
      const currStart = new Date(`${curr.date}T${curr.start_time}`);
      const gap = (currStart - prevEnd) / (1000 * 60 * 60);
      if (gap > 0 && gap < 10) {
        const isClopening = prev.end_time >= '21:00' && curr.start_time <= '08:00';
        alerts.push({
          type: isClopening ? 'clopening' : 'short_turnaround',
          severity: gap < 6 ? 'high' : 'medium',
          member_id: member.id,
          member_name: member.name,
          member_color: member.color,
          message: isClopening
            ? `クロージング→オープニング（${prev.date} ${prev.end_time} → ${curr.date} ${curr.start_time}、休息${gap.toFixed(1)}h）`
            : `短い休息時間（${prev.date} ${prev.end_time} → ${curr.date} ${curr.start_time}、${gap.toFixed(1)}h）`,
          details: { gap: Math.round(gap * 10) / 10, prev_shift: prev.id, curr_shift: curr.id },
        });
      }
    }

    // 3. Weekly overwork (>max_hours)
    const totalHours = memberShifts.reduce((sum, s) => sum + calcHours(s.start_time, s.end_time) - (s.break_minutes / 60), 0);
    const maxHours = member.max_hours_per_week || 40;
    if (totalHours > maxHours) {
      alerts.push({
        type: 'overwork',
        severity: totalHours > maxHours * 1.2 ? 'high' : 'medium',
        member_id: member.id,
        member_name: member.name,
        member_color: member.color,
        message: `上限超過（${totalHours.toFixed(1)}h / 上限${maxHours}h）`,
        details: { hours: Math.round(totalHours * 10) / 10, max: maxHours, overBy: Math.round((totalHours - maxHours) * 10) / 10 },
      });
    }
  }

  alerts.sort((a, b) => {
    const sev = { high: 0, medium: 1, low: 2 };
    return (sev[a.severity] || 2) - (sev[b.severity] || 2);
  });

  return alerts;
}

/**
 * AI smart suggestions: actionable recommendations
 * Competitive edge: No competitor provides explainable scheduling suggestions
 */
export function generateSuggestions(scheduleId) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  if (!schedule) return [];

  const suggestions = [];
  const members = db.prepare('SELECT * FROM members WHERE org_id = ? AND is_active = 1').all(schedule.org_id);
  const shifts = db.prepare("SELECT * FROM shifts WHERE schedule_id = ? AND status != 'cancelled'").all(scheduleId);
  const templates = db.prepare('SELECT * FROM shift_templates WHERE org_id = ?').all(schedule.org_id);

  // 1. Check staffing gaps
  const gaps = analyzeStaffingGaps(scheduleId);
  if (gaps && gaps.gaps.length > 0) {
    suggestions.push({
      type: 'staffing',
      priority: 'high',
      icon: 'users',
      title: `${gaps.gaps.length}件の人員不足`,
      description: `カバー率${gaps.coverageRate}%。${gaps.gaps.filter(g => g.severity === 'critical').length}件が緊急対応必要。`,
      action: 'staffing_gaps',
    });
  }

  // 2. Check burnout risks
  const burnout = detectBurnoutRisks(scheduleId);
  const highRisks = burnout.filter(a => a.severity === 'high');
  if (highRisks.length > 0) {
    suggestions.push({
      type: 'burnout',
      priority: 'high',
      icon: 'alert',
      title: `${highRisks.length}件の燃え尽きリスク`,
      description: highRisks.slice(0, 2).map(a => a.message).join('、'),
      action: 'burnout_alerts',
    });
  }

  // 3. Check fairness
  const memberHours = {};
  members.forEach(m => { memberHours[m.id] = 0; });
  for (const s of shifts) {
    if (!s.member_id) continue;
    memberHours[s.member_id] = (memberHours[s.member_id] || 0) + calcHours(s.start_time, s.end_time) - (s.break_minutes / 60);
  }
  const hours = Object.values(memberHours);
  if (hours.length >= 2) {
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    const maxDev = Math.max(...hours.map(h => Math.abs(h - avg)));
    if (avg > 0 && maxDev / avg > 0.3) {
      suggestions.push({
        type: 'fairness',
        priority: 'medium',
        icon: 'scale',
        title: '時間配分に偏り',
        description: `最大偏差${Math.round(maxDev)}時間。AI最適化で自動調整できます。`,
        action: 'optimize',
      });
    }
  }

  // 4. Unassigned shifts
  const unassigned = shifts.filter(s => !s.member_id);
  if (unassigned.length > 0) {
    suggestions.push({
      type: 'unassigned',
      priority: 'high',
      icon: 'user-x',
      title: `${unassigned.length}件の未割当シフト`,
      description: '自動生成または手動で割当してください。',
      action: 'auto_generate',
    });
  }

  // 5. Preference satisfaction
  const prefSatisfaction = calculatePreferenceSatisfaction(scheduleId, members, shifts);
  if (prefSatisfaction.overall < 70) {
    suggestions.push({
      type: 'preference',
      priority: 'low',
      icon: 'heart',
      title: `希望充足率${prefSatisfaction.overall}%`,
      description: `${prefSatisfaction.unsatisfied.length}名のメンバーの希望が十分に反映されていません。`,
      action: 'preferences',
    });
  }

  suggestions.sort((a, b) => {
    const pri = { high: 0, medium: 1, low: 2 };
    return (pri[a.priority] || 2) - (pri[b.priority] || 2);
  });

  return suggestions;
}

/**
 * Preference satisfaction rate per member
 */
export function calculatePreferenceSatisfaction(scheduleId, membersArg, shiftsArg) {
  const schedule = db.prepare('SELECT * FROM schedules WHERE id = ?').get(scheduleId);
  if (!schedule) return { overall: 100, members: [] };

  const members = membersArg || db.prepare('SELECT * FROM members WHERE org_id = ? AND is_active = 1').all(schedule.org_id);
  const shifts = shiftsArg || db.prepare("SELECT * FROM shifts WHERE schedule_id = ? AND status != 'cancelled'").all(scheduleId);

  const allAvailability = db.prepare(`
    SELECT a.* FROM availability a JOIN members m ON a.member_id = m.id
    WHERE m.org_id = ? AND m.is_active = 1
  `).all(schedule.org_id);

  const availMap = {};
  for (const a of allAvailability) {
    if (!availMap[a.member_id]) availMap[a.member_id] = {};
    if (!availMap[a.member_id][a.day_of_week]) availMap[a.member_id][a.day_of_week] = a.is_available ? 'preferred' : 'avoided';
  }

  const results = [];
  let totalScore = 0;
  let counted = 0;

  for (const member of members) {
    const memberShifts = shifts.filter(s => s.member_id === member.id);
    if (memberShifts.length === 0) continue;

    let matched = 0;
    let total = memberShifts.length;

    for (const shift of memberShifts) {
      const dow = new Date(shift.date).getDay();
      const pref = availMap[member.id]?.[dow];
      if (pref === 'preferred' || !pref) matched++;
      // If assigned on an 'avoided' day, don't count it
    }

    const satisfaction = total > 0 ? Math.round((matched / total) * 100) : 100;
    totalScore += satisfaction;
    counted++;

    results.push({ id: member.id, name: member.name, color: member.color, satisfaction, shifts: total, matched });
  }

  const overall = counted > 0 ? Math.round(totalScore / counted) : 100;
  const unsatisfied = results.filter(r => r.satisfaction < 70);

  return { overall, members: results, unsatisfied };
}

function calcHours(start, end) {
  const [sh, sm] = start.split(':').map(Number);
  const [eh, em] = end.split(':').map(Number);
  let h = (eh + em / 60) - (sh + sm / 60);
  if (h < 0) h += 24; // overnight
  return h;
}
