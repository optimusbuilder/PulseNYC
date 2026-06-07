import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { fetchBrief } from '../utils/api';

export default function BriefPanel() {
  const { state, dispatch } = useApp();
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState(false);

  async function handleFetchBrief() {
    setLoading(true);
    setExpanded(true);
    try {
      const data = await fetchBrief(NYC_CENTER_LAT, NYC_CENTER_LNG);
      dispatch({ type: 'SET_BRIEF', payload: data.brief });
    } catch (err) {
      dispatch({ type: 'SET_BRIEF', payload: 'Unable to load neighborhood brief.' });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className={`brief-panel ${expanded ? 'expanded' : ''}`}>
      <button className="brief-toggle" onClick={handleFetchBrief}>
        <span>📍</span> Neighborhood Brief
      </button>
      {expanded && (
        <div className="brief-content">
          {loading ? (
            <p className="brief-loading">Analyzing your area...</p>
          ) : (
            <p>{state.brief || 'Tap to load a summary of your area.'}</p>
          )}
        </div>
      )}
    </div>
  );
}

const NYC_CENTER_LAT = 40.748;
const NYC_CENTER_LNG = -73.985;
