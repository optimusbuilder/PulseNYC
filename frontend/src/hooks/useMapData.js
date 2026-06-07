import { useEffect, useRef, useCallback } from 'react';
import * as h3 from 'h3-js';
import { useApp } from '../context/AppContext';
import { fetchReports, fetchPulseScores } from '../utils/api';

export function useMapData(map) {
  const { dispatch } = useApp();
  const debounceRef = useRef(null);

  const loadData = useCallback(async () => {
    if (!map) return;

    const center = map.getCenter();
    const lat = center.lat;
    const lng = center.lng;

    try {
      const reports = await fetchReports(lat, lng, 5000);
      dispatch({ type: 'SET_REPORTS', payload: reports });
    } catch (err) {
      console.warn('Failed to fetch reports:', err.message);
    }

    try {
      const zoom = map.getZoom();
      if (zoom >= 11) {
        const bounds = map.getBounds();
        const hexes = getVisibleHexes(bounds);
        if (hexes.length > 0 && hexes.length <= 50) {
          const scores = await fetchPulseScores(hexes);
          dispatch({ type: 'SET_PULSE_SCORES', payload: scores });
        }
      }
    } catch (err) {
      console.warn('Failed to fetch pulse scores:', err.message);
    }
  }, [map, dispatch]);

  useEffect(() => {
    if (!map) return;

    function onMoveEnd() {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(loadData, 500);
    }

    map.on('load', loadData);
    map.on('moveend', onMoveEnd);

    return () => {
      map.off('load', loadData);
      map.off('moveend', onMoveEnd);
    };
  }, [map, loadData]);

  return { refresh: loadData };
}

function getVisibleHexes(bounds) {
  const ne = bounds.getNorthEast();
  const sw = bounds.getSouthWest();

  const centerLat = (ne.lat + sw.lat) / 2;
  const centerLng = (ne.lng + sw.lng) / 2;

  // Get hexes that cover the visible area (resolution 8 ≈ 0.7km²)
  const centerHex = h3.latLngToCell(centerLat, centerLng, 8);
  const ring = h3.gridDisk(centerHex, 3);
  return ring;
}
