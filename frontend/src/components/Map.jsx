import { useRef, useEffect, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, NYC_CENTER, PULSE_COLORS } from '../utils/constants';
import { useApp } from '../context/AppContext';
import { useMapData } from '../hooks/useMapData';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function Map() {
  const mapContainer = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const markersRef = useRef([]);
  const { state, dispatch } = useApp();

  useMapData(mapInstance);

  useEffect(() => {
    if (mapInstance) return;

    const m = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [NYC_CENTER.lng, NYC_CENTER.lat],
      zoom: NYC_CENTER.zoom,
    });

    m.addControl(new mapboxgl.NavigationControl(), 'top-right');
    m.addControl(
      new mapboxgl.GeolocateControl({ trackUserLocation: true }),
      'top-right'
    );

    m.on('click', (e) => {
      dispatch({
        type: 'SELECT_LOCATION',
        payload: { lng: e.lngLat.lng, lat: e.lngLat.lat },
      });
    });

    setMapInstance(m);
  }, [dispatch, mapInstance]);

  useEffect(() => {
    if (!mapInstance) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    state.reports.forEach((report) => {
      const color = getMarkerColor(report);
      const opacity = getMarkerOpacity(report);

      const el = document.createElement('div');
      el.className = 'pulse-marker';
      el.style.cssText = `
        width: 18px;
        height: 18px;
        border-radius: 50%;
        background: ${color};
        opacity: ${opacity};
        border: 2px solid rgba(255,255,255,0.8);
        cursor: pointer;
        transition: transform 0.2s;
      `;
      el.addEventListener('mouseenter', () => { el.style.transform = 'scale(1.4)'; });
      el.addEventListener('mouseleave', () => { el.style.transform = 'scale(1)'; });

      const marker = new mapboxgl.Marker(el)
        .setLngLat([report.lng, report.lat])
        .addTo(mapInstance);

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        dispatch({ type: 'SELECT_REPORT', payload: report });
      });

      markersRef.current.push(marker);
    });
  }, [state.reports, dispatch, mapInstance]);

  useEffect(() => {
    if (!mapInstance) return;

    function applyHexLayer() {
      const hexFeatures = Object.entries(state.pulseScores).map(([hexId, data]) => ({
        type: 'Feature',
        properties: { score: data.score, hexId },
        geometry: data.geometry,
      }));

      const geojson = { type: 'FeatureCollection', features: hexFeatures };
      const source = mapInstance.getSource('pulse-hexes');

      if (source) {
        source.setData(geojson);
      } else if (hexFeatures.length > 0) {
        mapInstance.addSource('pulse-hexes', { type: 'geojson', data: geojson });
        mapInstance.addLayer({
          id: 'pulse-hex-fill',
          type: 'fill',
          source: 'pulse-hexes',
          paint: {
            'fill-color': [
              'interpolate', ['linear'], ['get', 'score'],
              0, PULSE_COLORS.calm,
              30, PULSE_COLORS.calm,
              31, PULSE_COLORS.elevated,
              60, PULSE_COLORS.elevated,
              61, PULSE_COLORS.active,
              100, PULSE_COLORS.active,
            ],
            'fill-opacity': 0.25,
          },
        });
        mapInstance.addLayer({
          id: 'pulse-hex-outline',
          type: 'line',
          source: 'pulse-hexes',
          paint: {
            'line-color': [
              'interpolate', ['linear'], ['get', 'score'],
              0, PULSE_COLORS.calm,
              50, PULSE_COLORS.elevated,
              100, PULSE_COLORS.active,
            ],
            'line-width': 1,
            'line-opacity': 0.6,
          },
        });
      }
    }

    if (mapInstance.isStyleLoaded()) {
      applyHexLayer();
    } else {
      mapInstance.on('style.load', applyHexLayer);
    }
  }, [state.pulseScores, mapInstance]);

  return <div ref={mapContainer} className="map-container" />;
}

function getMarkerColor(report) {
  switch (report.status) {
    case 'confirmed': return '#ef4444';
    case 'unverified': return '#9ca3af';
    case 'auto': return '#3b82f6';
    default: return '#9ca3af';
  }
}

function getMarkerOpacity(report) {
  if (report.status === 'expired') return 0.3;
  const age = Date.now() - new Date(report.created_at).getTime();
  const maxAge = 3600000 * 2;
  return Math.max(0.4, 1 - age / maxAge);
}
