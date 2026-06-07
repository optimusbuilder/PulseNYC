import pool from '../db/pool.js';

const MTA_ALERTS_URL = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json';

const STATION_COORDS = {
  'default': { lat: 40.748, lng: -73.985 },
};

export async function pollMTA() {
  try {
    const response = await fetch(MTA_ALERTS_URL);
    if (!response.ok) {
      console.warn(`MTA API returned ${response.status}`);
      return;
    }

    const data = await response.json();
    const alerts = data.entity || [];

    for (const entity of alerts) {
      const alert = entity.alert;
      if (!alert) continue;

      const headerText = alert.header_text?.translation?.[0]?.text || '';
      if (!headerText) continue;

      const informedEntities = alert.informed_entity || [];
      for (const ie of informedEntities) {
        if (!ie.stop_id) continue;

        const coords = STATION_COORDS[ie.stop_id] || STATION_COORDS['default'];
        const externalId = `mta-${entity.id}-${ie.stop_id}`;

        await pool.query(
          `INSERT INTO reports (session_id, category, lat, lng, description, status, source, expires_at)
           SELECT $1, 'subway_unsafe', $2, $3, $4, 'auto', 'mta', NOW() + INTERVAL '2 hours'
           WHERE NOT EXISTS (
             SELECT 1 FROM reports
             WHERE session_id = $1 AND source = 'mta' AND created_at > NOW() - INTERVAL '2 hours'
           )`,
          [externalId, coords.lat, coords.lng, headerText.slice(0, 200)]
        );

        // Cross-reference: auto-confirm nearby user reports
        await pool.query(
          `UPDATE reports SET status = 'confirmed'
           WHERE status = 'unverified'
             AND category = 'subway_unsafe'
             AND source = 'user'
             AND haversine_distance(lat, lng, $1, $2) <= 300
             AND created_at > NOW() - INTERVAL '60 minutes'`,
          [coords.lat, coords.lng]
        );
      }
    }
  } catch (err) {
    console.error('MTA polling failed:', err.message);
  }
}
