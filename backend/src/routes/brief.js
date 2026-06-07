import { Router } from 'express';
import pool from '../db/pool.js';
import { generateBrief } from '../services/ai.js';

const router = Router();

const briefCache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

router.get('/', async (req, res) => {
  const { lat, lng } = req.query;

  if (!lat || !lng) return res.status(400).json({ error: 'lat and lng required' });

  const cacheKey = `${parseFloat(lat).toFixed(3)},${parseFloat(lng).toFixed(3)}`;
  const cached = briefCache.get(cacheKey);

  if (cached && Date.now() - cached.time < CACHE_TTL) {
    return res.json({ brief: cached.brief });
  }

  try {
    const result = await pool.query(
      `SELECT category, status, description, source, created_at FROM reports
       WHERE ST_DWithin(
         geom,
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         1000
       )
       AND status IN ('unverified', 'confirmed', 'auto')
       AND created_at > NOW() - INTERVAL '6 hours'
       ORDER BY created_at DESC
       LIMIT 20`,
      [parseFloat(lng), parseFloat(lat)]
    );

    if (result.rows.length === 0) {
      const brief = 'No active alerts in your area. Conditions are calm.';
      briefCache.set(cacheKey, { brief, time: Date.now() });
      return res.json({ brief });
    }

    const brief = await generateBrief(result.rows);
    briefCache.set(cacheKey, { brief, time: Date.now() });
    res.json({ brief });
  } catch (err) {
    console.error('Error generating brief:', err);
    res.status(500).json({ error: 'Failed to generate brief' });
  }
});

export default router;
