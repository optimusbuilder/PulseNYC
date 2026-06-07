import { useApp } from '../context/AppContext';
import { confirmReport } from '../utils/api';
import { REPORT_CATEGORIES } from '../utils/constants';

export default function ReportDetail() {
  const { state, dispatch } = useApp();
  const report = state.selectedReport;

  if (!report) return null;

  const category = REPORT_CATEGORIES.find((c) => c.id === report.category);
  const timeAgo = getTimeAgo(report.created_at);

  async function handleConfirm() {
    try {
      await confirmReport(report.id);
      dispatch({
        type: 'SELECT_REPORT',
        payload: { ...report, status: 'confirmed' },
      });
    } catch (err) {
      console.error('Confirm failed:', err);
    }
  }

  function handleClose() {
    dispatch({ type: 'CLOSE_REPORT_DETAIL' });
  }

  function handleShare() {
    const url = `${window.location.origin}/r/${report.id}`;
    navigator.clipboard.writeText(url);
  }

  return (
    <div className="report-detail">
      <div className="panel-header">
        <h2>{category?.icon} {category?.label}</h2>
        <button className="close-btn" onClick={handleClose}>✕</button>
      </div>

      <div className="detail-body">
        <div className={`status-badge status-${report.status}`}>
          {report.status}
        </div>
        <p className="detail-time">{timeAgo}</p>
        {report.description && <p className="detail-desc">{report.description}</p>}
        <p className="detail-source">
          Source: {report.source === 'user' ? 'Community report' : report.source.toUpperCase()}
        </p>
      </div>

      <div className="detail-actions">
        {report.status === 'unverified' && (
          <button className="confirm-btn" onClick={handleConfirm}>
            👁 Still Here — Confirm
          </button>
        )}
        <button className="share-btn" onClick={handleShare}>
          🔗 Copy Share Link
        </button>
      </div>
    </div>
  );
}

function getTimeAgo(timestamp) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  return `${hours}h ago`;
}
