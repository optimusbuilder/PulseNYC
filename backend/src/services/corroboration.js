import pool from '../db/pool.js';

/**
 * After a new report is submitted, check if there are 2+ existing
 * unverified reports of the same category within 300m and 60 minutes.
 * If so, promote them all to "confirmed".
 */
export async function checkCorroboration(newReport) {
  const { id, category, lat, lng, session_id } = newReport;

  const result = await pool.query(
    `SELECT id, session_id FROM reports
     WHERE status = 'unverified'
       AND category = $1
       AND id != $2
       AND ST_DWithin(
         geom,
         ST_SetSRID(ST_MakePoint($3, $4), 4326)::geography,
         300
       )
       AND created_at > NOW() - INTERVAL '60 minutes'`,
    [category, id, lng, lat]
  );

  // Collect unique session IDs (excluding the new reporter)
  const uniqueSessions = new Set(
    result.rows
      .map(r => r.session_id)
      .filter(sid => sid !== session_id)
  );

  // Need 2 other unique sessions (total 3 including the new reporter)
  if (uniqueSessions.size >= 2) {
    const idsToConfirm = result.rows.map(r => r.id);
    idsToConfirm.push(id);

    await pool.query(
      `UPDATE reports SET status = 'confirmed'
       WHERE id = ANY($1) AND status = 'unverified'`,
      [idsToConfirm]
    );
  }
}
