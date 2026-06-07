export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

export const NYC_CENTER = {
  lng: -73.985,
  lat: 40.748,
  zoom: 12,
};

export const REPORT_CATEGORIES = [
  { id: 'flooding', label: 'Flooding / Standing Water', icon: '🌊', severity: 'high' },
  { id: 'power_outage', label: 'Power Outage', icon: '⚡', severity: 'high' },
  { id: 'subway_unsafe', label: 'Subway Unsafe / Closed', icon: '🚇', severity: 'medium' },
  { id: 'altercation', label: 'Active Altercation', icon: '⚠️', severity: 'high' },
  { id: 'protest', label: 'Protest / Large Crowd', icon: '📢', severity: 'medium' },
  { id: 'road_blocked', label: 'Road Blocked / Accident', icon: '🚧', severity: 'medium' },
  { id: 'infrastructure', label: 'Broken Infrastructure', icon: '🔧', severity: 'low' },
  { id: 'harassment', label: 'Harassment on Transit', icon: '🚨', severity: 'high' },
  { id: 'medical', label: 'Medical Emergency', icon: '🏥', severity: 'high' },
];

export const HALF_LIVES = {
  flooding: 120,
  power_outage: 360,
  protest: 180,
  altercation: 45,
  road_blocked: 90,
  subway_unsafe: 60,
  infrastructure: 720,
  medical: 30,
  harassment: 60,
};

export const PULSE_COLORS = {
  calm: '#22c55e',
  elevated: '#f59e0b',
  active: '#ef4444',
};
