import { useState } from 'react';
import { useApp } from '../context/AppContext';
import { REPORT_CATEGORIES } from '../utils/constants';
import { submitReport } from '../utils/api';

export default function ReportPanel() {
  const { state, dispatch } = useApp();
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  if (!state.showReportPanel || !state.selectedLocation) return null;

  async function handleSubmit() {
    if (!selectedCategory) return;
    setSubmitting(true);
    try {
      const report = await submitReport({
        category: selectedCategory,
        lat: state.selectedLocation.lat,
        lng: state.selectedLocation.lng,
        description,
      });
      dispatch({ type: 'ADD_REPORT', payload: report });
      setSubmitted(true);
      setTimeout(() => {
        dispatch({ type: 'CLOSE_REPORT_PANEL' });
        setSubmitted(false);
        setSelectedCategory(null);
        setDescription('');
      }, 1500);
    } catch (err) {
      console.error('Submit failed:', err);
    } finally {
      setSubmitting(false);
    }
  }

  function handleClose() {
    dispatch({ type: 'CLOSE_REPORT_PANEL' });
    setSelectedCategory(null);
    setDescription('');
    setSubmitted(false);
  }

  return (
    <div className="report-panel">
      <div className="panel-header">
        <h2>Report an Issue</h2>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

      {submitted ? (
        <div className="submit-success">
          <span className="success-icon">✓</span>
          <p>Report submitted</p>
        </div>
      ) : (
        <>
          <p className="panel-subtitle">What's happening here?</p>
          <div className="category-grid">
            {REPORT_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                className={`category-btn ${selectedCategory === cat.id ? 'selected' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
              >
                <span className="category-icon">{cat.icon}</span>
                <span className="category-label">{cat.label}</span>
              </button>
            ))}
          </div>

          <textarea
            className="report-description"
            placeholder="Optional: add a brief description..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            maxLength={200}
          />

          <button
            className="submit-btn"
            disabled={!selectedCategory || submitting}
            onClick={handleSubmit}
          >
            {submitting ? 'Submitting...' : 'Submit Report'}
          </button>
        </>
      )}
    </div>
  );
}
