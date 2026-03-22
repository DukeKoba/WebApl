const API_BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 204) return null;
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  // Organizations
  getOrgs: () => request('/organizations'),
  createOrg: (data) => request('/organizations', { method: 'POST', body: data }),
  updateOrg: (id, data) => request(`/organizations/${id}`, { method: 'PUT', body: data }),
  deleteOrg: (id) => request(`/organizations/${id}`, { method: 'DELETE' }),

  // Members
  getMembers: (orgId) => request(`/members?org_id=${orgId}`),
  getMember: (id) => request(`/members/${id}`),
  createMember: (data) => request('/members', { method: 'POST', body: data }),
  updateMember: (id, data) => request(`/members/${id}`, { method: 'PUT', body: data }),
  deleteMember: (id) => request(`/members/${id}`, { method: 'DELETE' }),
  getAvailability: (id) => request(`/members/${id}/availability`),
  setAvailability: (id, availability) => request(`/members/${id}/availability/bulk`, { method: 'PUT', body: { availability } }),

  // Templates
  getTemplates: (orgId) => request(`/templates?org_id=${orgId}`),
  createTemplate: (data) => request('/templates', { method: 'POST', body: data }),
  updateTemplate: (id, data) => request(`/templates/${id}`, { method: 'PUT', body: data }),
  deleteTemplate: (id) => request(`/templates/${id}`, { method: 'DELETE' }),

  // Schedules
  getSchedules: (orgId) => request(`/schedules?org_id=${orgId}`),
  getSchedule: (id) => request(`/schedules/${id}`),
  createSchedule: (data) => request('/schedules', { method: 'POST', body: data }),
  updateSchedule: (id, data) => request(`/schedules/${id}`, { method: 'PUT', body: data }),
  deleteSchedule: (id) => request(`/schedules/${id}`, { method: 'DELETE' }),
  autoGenerate: (id) => request(`/schedules/${id}/auto-generate`, { method: 'POST' }),
  publishSchedule: (id) => request(`/schedules/${id}/publish`, { method: 'POST' }),

  // Shifts
  getShifts: (params) => request(`/shifts?${new URLSearchParams(params)}`),
  createShift: (data) => request('/shifts', { method: 'POST', body: data }),
  updateShift: (id, data) => request(`/shifts/${id}`, { method: 'PUT', body: data }),
  deleteShift: (id) => request(`/shifts/${id}`, { method: 'DELETE' }),
  getReplacements: (id) => request(`/shifts/${id}/replacements`),
  requestSwap: (id, data) => request(`/shifts/${id}/swap`, { method: 'POST', body: data }),
  acceptSwap: (swapId, data) => request(`/shifts/swap/${swapId}/accept`, { method: 'POST', body: data }),

  // Absences
  getAbsences: (params) => request(`/absences?${new URLSearchParams(params)}`),
  createAbsence: (data) => request('/absences', { method: 'POST', body: data }),
  updateAbsence: (id, data) => request(`/absences/${id}`, { method: 'PUT', body: data }),

  // Analytics
  getDashboard: (orgId) => request(`/analytics/dashboard?org_id=${orgId}`),
  getWorkload: (orgId, start, end) => request(`/analytics/workload?org_id=${orgId}${start ? `&start_date=${start}` : ''}${end ? `&end_date=${end}` : ''}`),
  getFairness: (orgId, scheduleId) => request(`/analytics/fairness?org_id=${orgId}${scheduleId ? `&schedule_id=${scheduleId}` : ''}`),
  getLaborCost: (orgId, scheduleId) => request(`/analytics/labor-cost?org_id=${orgId}${scheduleId ? `&schedule_id=${scheduleId}` : ''}`),
  getAvailabilityMap: (orgId, start, end) => request(`/analytics/availability-map?org_id=${orgId}&start_date=${start}&end_date=${end}`),
};
