import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminFeedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getFeedback();
      if (Array.isArray(res)) {
        setFeedbackList(res);
      } else if (res && Array.isArray(res.feedback)) {
        setFeedbackList(res.feedback);
      } else {
        setFeedbackList([]);
      }
    } catch (err) {
      console.error('Fetch feedback error:', err);
      setError(err.message || 'Failed to fetch feedback tickets.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const handleStatusChange = async (id, newStatus) => {
    try {
      setActionLoading(true);
      await api.admin.updateFeedbackStatus(id, newStatus);
      setFeedbackList((prev) =>
        prev.map((item) => ((item.id || item.feedback_id) === id ? { ...item, status: newStatus } : item))
      );
    } catch (err) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredList = feedbackList.filter((item) => {
    if (statusFilter === 'all') return true;
    return item.status === statusFilter;
  });

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <div className="d-flex align-items-center gap-2 mb-1">
              <Link to="/admin" className="text-muted text-decoration-none small">
                <i className="bi bi-arrow-left me-1"></i> Admin Dashboard
              </Link>
            </div>
            <h2 className="fw-bold text-dark mb-0">Feedback & Ticket Moderation</h2>
            <p className="text-muted small mb-0">Inspect user reviews, investigate bug reports, and update ticket statuses.</p>
          </div>

          <div className="d-flex gap-2 align-items-center">
            <span className="small text-muted fw-semibold">Filter:</span>
            <select
              className="form-select form-select-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ width: '130px' }}
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="reviewed">Reviewed</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 small py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Feedback Table */}
        <div className="eco-card overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading user feedback submissions..." />
          ) : filteredList.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th>Sender / Date</th>
                    <th>Category</th>
                    <th>Rating</th>
                    <th>Feedback Details</th>
                    <th>Attachment</th>
                    <th>Status Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const id = item.id || item.feedback_id;
                    const dateFormatted = item.created_at
                      ? new Date(item.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                        })
                      : 'N/A';

                    return (
                      <tr key={id}>
                        <td>
                          <div className="fw-semibold text-dark small">
                            {item.user_email || item.email || 'User'}
                          </div>
                          <div className="text-muted" style={{ fontSize: '0.75rem' }}>{dateFormatted}</div>
                        </td>
                        <td>
                          <span className="badge bg-light text-dark border text-capitalize small">
                            {item.category?.replace('_', ' ') || 'General'}
                          </span>
                        </td>
                        <td>
                          <div className="text-nowrap">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i
                                key={i}
                                className={`bi ${i < (item.rating || 5) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} small me-1`}
                              ></i>
                            ))}
                          </div>
                        </td>
                        <td style={{ maxWidth: '320px' }}>
                          <div className="fw-semibold text-dark small">{item.subject}</div>
                          <p className="text-muted small mb-0 text-truncate" title={item.message}>
                            {item.message}
                          </p>
                        </td>
                        <td>
                          {item.screenshot_url ? (
                            <a
                              href={item.screenshot_url}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-outline-success btn-sm py-0 px-2"
                              style={{ fontSize: '0.75rem' }}
                            >
                              <i className="bi bi-image me-1"></i> View Screenshot
                            </a>
                          ) : (
                            <span className="text-muted small">None</span>
                          )}
                        </td>
                        <td>
                          <select
                            className={`form-select form-select-sm small fw-semibold ${
                              item.status === 'resolved'
                                ? 'text-success'
                                : item.status === 'reviewed'
                                ? 'text-info'
                                : 'text-warning-emphasis'
                            }`}
                            value={item.status || 'pending'}
                            onChange={(e) => handleStatusChange(id, e.target.value)}
                            disabled={actionLoading}
                            style={{ width: '120px' }}
                          >
                            <option value="pending">Pending</option>
                            <option value="reviewed">Reviewed</option>
                            <option value="resolved">Resolved</option>
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-center">
              <i className="bi bi-chat-square-text fs-1 text-muted mb-2 d-block"></i>
              <h5 className="fw-bold text-dark">No feedback entries found</h5>
              <p className="text-muted small">No submitted tickets matching this status filter.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
