import { Router } from 'express';
import pool from '../db/pool.js';
import { checkCorroboration } from '../services/corroboration.js';
import { computeExpiresAt } from '../services/decay.js';

const router = Router();

// Submit a new report
router.post('/', async (req, res) => {
  const { session_id, category, lat, lng, description } = req.body;

  if (!session_id || !category || lat == null || lng == null) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  const expires_at = computeExpiresAt(category);

  try {
    const result = await pool.query(
      `INSERT INTO reports (session_id, category, lat, lng, description, status, source, expires_at)
       VALUES ($1, $2, $3, $4, $5, 'unverified', 'user', $6)
       RETURNING *`,
      [session_id, category, lat, lng, description || '', expires_at]
    );

    const report = result.rows[0];
    await checkCorroboration(report);

    const updated = await pool.query('SELECT * FROM reports WHERE id = $1', [report.id]);
    res.status(201).json(updated.rows[0]);
  } catch (err) {
    console.error('Error creating report:', err);
    res.status(500).json({ error: 'Failed to create report' });
  }
});

// Fetch reports within radius
router.get('/', async (req, res) => {
  const { lat, lng, r = 5000 } = req.query;

  if (!lat || !lng) {
    return res.status(400).json({ error: 'lat and lng required' });
  }

  try {
    const result = await pool.query(
      `SELECT * FROM reports
       WHERE haversine_distance(lat, lng, $1, $2) <= $3
         AND (status != 'expired' OR created_at > NOW() - INTERVAL '2 hours')
       ORDER BY created_at DESC
       LIMIT 200`,
      [parseFloat(lat), parseFloat(lng), parseInt(r)]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching reports:', err);
    res.status(500).json({ error: 'Failed to fetch reports' });
  }
});

// Get a single report (for shared links)
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch report' });
  }
});

// Corroborate / "still here" an existing report
router.post('/:id/confirm', async (req, res) => {
  const { session_id } = req.body;
  const { id } = req.params;

  if (!session_id) return res.status(400).json({ error: 'session_id required' });

  try {
    await pool.query(
      `INSERT INTO corroborations (report_id, session_id)
       VALUES ($1, $2)
       ON CONFLICT (report_id, session_id) DO NOTHING`,
      [id, session_id]
    );

    await pool.query(
      `UPDATE reports SET refreshed_at = NOW() WHERE id = $1`,
      [id]
    );

    const countResult = await pool.query(
      `SELECT COUNT(DISTINCT session_id) as cnt FROM corroborations WHERE report_id = $1`,
      [id]
    );

    if (parseInt(countResult.rows[0].cnt) >= 2) {
      await pool.query(
        `UPDATE reports SET status = 'confirmed' WHERE id = $1 AND status = 'unverified'`,
        [id]
      );
    }

    const result = await pool.query('SELECT * FROM reports WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error confirming report:', err);
    res.status(500).json({ error: 'Failed to confirm report' });
  }
});

export default router;
