import { Router } from 'express';
import pool from '../db/pool.js';
import * as h3 from 'h3-js';

const router = Router();

const SEVERITY_BONUS = {
  flooding: 10,
  altercation: 10,
  power_outage: 8,
  harassment: 8,
  medical: 8,
  protest: 5,
  road_blocked: 5,
  subway_unsafe: 5,
  infrastructure: 3,
};

router.get('/', async (req, res) => {
  const { hexes } = req.query;

  if (!hexes) return res.status(400).json({ error: 'hexes parameter required' });

  const hexIds = hexes.split(',');

  try {
    const scores = {};

    for (const hexId of hexIds) {
      const boundary = h3.cellToBoundary(hexId);
      const center = h3.cellToLatLng(hexId);

      const result = await pool.query(
        `SELECT category, status, created_at FROM reports
         WHERE haversine_distance(lat, lng, $1, $2) <= 500
           AND status IN ('unverified', 'confirmed', 'auto')
           AND created_at > NOW() - INTERVAL '12 hours'`,
        [center[0], center[1]]
      );

      const reports = result.rows;
      let score = 0;

      const confirmed = reports.filter(r => r.status === 'confirmed' || r.status === 'auto');
      const unverified = reports.filter(r => r.status === 'unverified');

      score += confirmed.length * 15;
      score += unverified.length * 5;

      for (const r of reports) {
        score += SEVERITY_BONUS[r.category] || 0;
      }

      const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
      const hasRecent = reports.some(r => new Date(r.created_at).getTime() > fifteenMinsAgo);
      if (hasRecent) score += 10;

      score = Math.min(100, score);

      const polygon = boundary.map(([lat, lng]) => [lng, lat]);
      polygon.push(polygon[0]);

      scores[hexId] = {
        score,
        geometry: {
          type: 'Polygon',
          coordinates: [polygon],
        },
      };
    }

    res.json(scores);
  } catch (err) {
    console.error('Error computing pulse scores:', err);
    res.status(500).json({ error: 'Failed to compute scores' });
  }
});

export default router;
