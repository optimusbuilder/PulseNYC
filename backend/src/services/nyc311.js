import pool from '../db/pool.js';

const NYC_311_URL = 'https://data.cityofnewyork.us/resource/erm2-nwe9.json';

const COMPLAINT_TO_CATEGORY = {
  'Water System': 'flooding',
  'Sewer': 'flooding',
  'Street Light Condition': 'infrastructure',
  'Broken Muni Meter': 'infrastructure',
  'Sidewalk Condition': 'infrastructure',
  'Street Condition': 'road_blocked',
  'Traffic Signal Condition': 'infrastructure',
};

export async function poll311() {
  try {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
    const url = `${NYC_311_URL}?$where=created_date > '${twoHoursAgo}'&$limit=50&$order=created_date DESC`;

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`311 API returned ${response.status}`);
      return;
    }

    const complaints = await response.json();

    for (const complaint of complaints) {
      const category = COMPLAINT_TO_CATEGORY[complaint.complaint_type];
      if (!category) continue;

      const lat = parseFloat(complaint.latitude);
      const lng = parseFloat(complaint.longitude);
      if (!lat || !lng) continue;

      const externalId = `311-${complaint.unique_key}`;

      await pool.query(
        `INSERT INTO reports (session_id, category, lat, lng, description, status, source, expires_at)
         SELECT $1, $2, $3, $4, $5, 'auto', '311', NOW() + INTERVAL '4 hours'
         WHERE NOT EXISTS (
           SELECT 1 FROM reports WHERE session_id = $1
         )`,
        [externalId, category, lat, lng, (complaint.descriptor || '').slice(0, 200)]
      );

      // Cross-reference: auto-confirm nearby user reports
      await pool.query(
        `UPDATE reports SET status = 'confirmed'
         WHERE status = 'unverified'
           AND category = $1
           AND source = 'user'
           AND haversine_distance(lat, lng, $2, $3) <= 300
           AND created_at > NOW() - INTERVAL '60 minutes'`,
        [category, lat, lng]
      );
    }
  } catch (err) {
    console.error('311 polling failed:', err.message);
  }
}
