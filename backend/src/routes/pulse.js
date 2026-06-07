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

      // Get all active reports in this hex
      const result = await pool.query(
        `SELECT category, status, created_at FROM reports
         WHERE ST_DWithin(
           geom,
           ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
           500
         )
         AND status IN ('unverified', 'confirmed', 'auto')
         AND created_at > NOW() - INTERVAL '12 hours'`,
        [center[1], center[0]]
      );

      const reports = result.rows;
      let score = 0;

      const confirmed = reports.filter(r => r.status === 'confirmed' || r.status === 'auto');
      const unverified = reports.filter(r => r.status === 'unverified');

      score += confirmed.length * 15;
      score += unverified.length * 5;

      // Severity bonus
      for (const r of reports) {
        score += SEVERITY_BONUS[r.category] || 0;
      }

      // Recency bonus
      const fifteenMinsAgo = Date.now() - 15 * 60 * 1000;
      const hasRecent = reports.some(r => new Date(r.created_at).getTime() > fifteenMinsAgo);
      if (hasRecent) score += 10;

      score = Math.min(100, score);

      // Build hex polygon for GeoJSON
      const polygon = boundary.map(([lat, lng]) => [lng, lat]);
      polygon.push(polygon[0]); // close the ring

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
