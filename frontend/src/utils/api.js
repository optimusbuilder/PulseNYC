import { API_URL } from './constants';
import { getSessionId } from './session';

async function request(path, options = {}) {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) throw new Error(`API error: ${res.status}`);
  return res.json();
}

export function submitReport({ category, lat, lng, description }) {
  return request('/reports', {
    method: 'POST',
    body: JSON.stringify({
      session_id: getSessionId(),
      category,
      lat,
      lng,
      description,
    }),
  });
}

export function fetchReports(lat, lng, radius = 5000) {
  return request(`/reports?lat=${lat}&lng=${lng}&r=${radius}`);
}

export function confirmReport(reportId) {
  return request(`/reports/${reportId}/confirm`, {
    method: 'POST',
    body: JSON.stringify({ session_id: getSessionId() }),
  });
}

export function fetchPulseScores(hexIds) {
  return request(`/pulse?hexes=${hexIds.join(',')}`);
}

export function fetchBrief(lat, lng) {
  return request(`/brief?lat=${lat}&lng=${lng}`);
}

export function fetchReport(reportId) {
  return request(`/reports/${reportId}`);
}
