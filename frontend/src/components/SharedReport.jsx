import { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { MAPBOX_TOKEN, REPORT_CATEGORIES } from '../utils/constants';
import { fetchReport, confirmReport } from '../utils/api';

mapboxgl.accessToken = MAPBOX_TOKEN;

export default function SharedReport() {
  const { reportId } = useParams();
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState(null);
  const mapContainer = useRef(null);
  const map = useRef(null);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchReport(reportId);
        setReport(data);
      } catch (err) {
        setError('Report not found');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [reportId]);

  useEffect(() => {
    if (!report || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/dark-v11',
      center: [report.lng, report.lat],
      zoom: 15,
    });

    new mapboxgl.Marker({ color: '#ef4444' })
      .setLngLat([report.lng, report.lat])
      .addTo(map.current);
  }, [report]);

  async function handleConfirm() {
    try {
      await confirmReport(reportId);
      setConfirmed(true);
    } catch (err) {
      console.error('Confirm failed:', err);
    }
  }

  if (loading) {
    return (
      <div className="shared-page">
        <div className="shared-loading">Loading report...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="shared-page">
        <div className="shared-error">{error}</div>
      </div>
    );
  }

  const category = REPORT_CATEGORIES.find((c) => c.id === report.category);

  return (
    <div className="shared-page">
      <div ref={mapContainer} className="shared-map" />
      <div className="shared-panel">
        <div className="shared-brand">
          <h1>Pulse<span className="accent">NYC</span></h1>
        </div>
        <div className="shared-info">
          <h2>{category?.icon} {category?.label}</h2>
          <p className="shared-desc">{report.description || 'No description provided'}</p>
          <div className={`status-badge status-${report.status}`}>{report.status}</div>
        </div>
        {confirmed ? (
          <div className="shared-confirmed">
            <span className="success-icon">✓</span>
            <p>Thanks! Your confirmation helps verify this report.</p>
          </div>
        ) : (
          <button className="confirm-btn shared-confirm-btn" onClick={handleConfirm}>
            👁 Confirm This Report
          </button>
        )}
        <a href="/" className="shared-cta">Open PulseNYC →</a>
      </div>
    </div>
  );
}
