import pool from '../db/pool.js';

const MTA_ALERTS_URL = 'https://api-endpoint.mta.info/Dataservice/mtagtfsfeeds/camsys%2Fsubway-alerts.json';

// Approximate station coordinates for common subway stations
// In production, this would be a full GTFS stops.txt lookup
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

      // Extract affected stops/stations
      const informedEntities = alert.informed_entity || [];
      for (const ie of informedEntities) {
        if (!ie.stop_id) continue;

        const coords = STATION_COORDS[ie.stop_id] || STATION_COORDS['default'];
        const externalId = `mta-${entity.id}-${ie.stop_id}`;

        // Upsert: don't duplicate if already exists
        await pool.query(
          `INSERT INTO reports (session_id, category, lat, lng, description, status, source, expires_at)
           SELECT $1, 'subway_unsafe', $2, $3, $4, 'auto', 'mta', NOW() + INTERVAL '2 hours'
           WHERE NOT EXISTS (
             SELECT 1 FROM reports
             WHERE session_id = $1 AND source = 'mta' AND created_at > NOW() - INTERVAL '2 hours'
           )`,
          [externalId, coords.lat, coords.lng, headerText.slice(0, 200)]
        );

        // Cross-reference: auto-confirm matching user reports nearby
        await pool.query(
          `UPDATE reports SET status = 'confirmed'
           WHERE status = 'unverified'
             AND category = 'subway_unsafe'
             AND source = 'user'
             AND ST_DWithin(
               geom,
               ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
               300
             )
             AND created_at > NOW() - INTERVAL '60 minutes'`,
          [coords.lng, coords.lat]
        );
      }
    }
  } catch (err) {
    console.error('MTA polling failed:', err.message);
  }
}
