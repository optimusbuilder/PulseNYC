const HALF_LIVES_MINUTES = {
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

/**
 * Compute when a report should expire based on its category.
 * We set expires_at to 2x the half-life (effectively full decay).
 */
export function computeExpiresAt(category) {
  const halfLife = HALF_LIVES_MINUTES[category] || 60;
  const ttlMs = halfLife * 2 * 60 * 1000;
  return new Date(Date.now() + ttlMs);
}
