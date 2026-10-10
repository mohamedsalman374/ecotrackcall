import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Feedback() {
  const [feedbackList, setFeedbackList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  // Form states
  const [category, setCategory] = useState('general');
  const [rating, setRating] = useState(5);
  const [subject, setSubject] = useState('');
  const [feedbackText, setFeedbackText] = useState('');
  const [screenshot, setScreenshot] = useState(null);

  const fetchMyFeedback = async () => {
    try {
      setLoading(true);
      const res = await api.feedback.getMyFeedback();
      if (Array.isArray(res)) {
        setFeedbackList(res);
      } else if (res && Array.isArray(res.feedback)) {
        setFeedbackList(res.feedback);
      } else {
        setFeedbackList([]);
      }
    } catch (err) {
      console.error('Failed to fetch feedback:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMyFeedback();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage({ type: '', text: '' });

    try {
      const formData = new FormData();
      formData.append('category', category);
      formData.append('rating', rating);
      formData.append('subject', subject);
      formData.append('message', feedbackText);
      if (screenshot) {
        formData.append('screenshot', screenshot);
      }

      await api.feedback.submit(formData);
      setMessage({ type: 'success', text: 'Thank you! Your feedback has been submitted to the EcoTrack team.' });
      setSubject('');
      setFeedbackText('');
      setScreenshot(null);
      // Reset file input if present
      const fileInput = document.getElementById('screenshotInput');
      if (fileInput) fileInput.value = '';

      await fetchMyFeedback();
    } catch (err) {
      setMessage({ type: 'danger', text: err.message || 'Failed to submit feedback.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this feedback submission?')) return;
    try {
      await api.feedback.delete(id);
      setFeedbackList((prev) => prev.filter((item) => (item.id || item.feedback_id) !== id));
      setMessage({ type: 'success', text: 'Feedback deleted successfully.' });
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    }
  };

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-4">
          <span className="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill small fw-semibold mb-2">
            <i className="bi bi-chat-heart-fill me-1"></i> Community Voice
          </span>
          <h2 className="fw-bold text-dark mb-1">Feedback & Feature Requests</h2>
          <p className="text-muted small">
            Help us refine the EcoTrack platform. Report calculation discrepancies, suggest UI improvements, or submit feature requests.
          </p>
        </div>

        {message.text && (
          <div className={`alert alert-${message.type} alert-dismissible fade show small py-2`} role="alert">
            {message.text}
            <button type="button" className="btn-close" onClick={() => setMessage({ type: '', text: '' })}></button>
          </div>
        )}

        <div className="row g-4">
          {/* Submission Form */}
          <div className="col-lg-6">
            <div className="eco-card p-4 h-100">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-pencil-square text-success"></i> Submit Feedback
              </h5>

              <form onSubmit={handleSubmit}>
                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Feedback Category</label>
                    <select
                      className="form-select"
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                    >
                      <option value="general">💬 General Experience</option>
                      <option value="bug_report">🐛 Bug / Defect Report</option>
                      <option value="feature_request">💡 Feature Request</option>
                      <option value="emission_accuracy">📊 Emission Factor Precision</option>
                      <option value="ui_ux">🎨 UI / UX Aesthetic</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Platform Rating</label>
                    <div className="d-flex align-items-center gap-2 pt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          className="btn btn-link p-0 border-0"
                          onClick={() => setRating(star)}
                        >
                          <i
                            className={`bi ${star <= rating ? 'bi-star-fill text-warning' : 'bi-star text-muted'} fs-5`}
                          ></i>
                        </button>
                      ))}
                      <span className="small text-muted fw-bold ms-1">({rating}/5)</span>
                    </div>
                  </div>
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Subject / Title</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="Brief summary of your feedback"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="mb-3">
                  <label className="form-label small fw-semibold">Detailed Description</label>
                  <textarea
                    className="form-control"
                    rows="4"
                    placeholder="Provide details, steps to reproduce, or suggestions..."
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    required
                  ></textarea>
                </div>

                <div className="mb-4">
                  <label className="form-label small fw-semibold">
                    Optional Screenshot (Uploaded to Supabase Storage)
                  </label>
                  <input
                    id="screenshotInput"
                    type="file"
                    className="form-control form-control-sm"
                    accept="image/*"
                    onChange={(e) => setScreenshot(e.target.files?.[0] || null)}
                  />
                  <small className="text-muted">Supports PNG, JPG, WebP up to 5MB.</small>
                </div>

                <button
                  type="submit"
                  className="btn btn-eco-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  disabled={submitting}
                >
                  {submitting ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Submitting Feedback...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-send-fill"></i> Submit Feedback
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>

          {/* Previous Feedback List */}
          <div className="col-lg-6">
            <div className="eco-card p-4 h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-clock-history text-secondary"></i> My Submissions
                </h5>
                <span className="badge bg-light text-muted border">{feedbackList.length} items</span>
              </div>

              {loading ? (
                <LoadingSpinner message="Loading your previous feedback..." />
              ) : feedbackList.length > 0 ? (
                <div className="d-flex flex-column gap-3 overflow-auto flex-grow-1" style={{ maxHeight: '520px' }}>
                  {feedbackList.map((item) => {
                    const id = item.id || item.feedback_id;
                    const statusClass =
                      item.status === 'resolved'
                        ? 'bg-success-subtle text-success'
                        : item.status === 'reviewed'
                        ? 'bg-info-subtle text-info'
                        : 'bg-warning-subtle text-warning-emphasis';

                    return (
                      <div key={id} className="p-3 rounded-3 bg-light border position-relative">
                        <div className="d-flex justify-content-between align-items-start mb-2">
                          <div>
                            <span className="badge bg-dark-subtle text-dark text-capitalize small me-2">
                              {item.category?.replace('_', ' ') || 'General'}
                            </span>
                            <span className={`badge ${statusClass} small text-capitalize`}>
                              {item.status || 'Pending'}
                            </span>
                          </div>

                          <button
                            type="button"
                            className="btn btn-link text-danger p-0 small text-decoration-none"
                            title="Delete submission"
                            onClick={() => handleDelete(id)}
                          >
                            <i className="bi bi-trash"></i>
                          </button>
                        </div>

                        <h6 className="fw-bold text-dark mb-1">{item.subject || 'Feedback'}</h6>
                        <p className="text-muted small mb-2">{item.message}</p>

                        <div className="d-flex justify-content-between align-items-center small text-muted border-top pt-2">
                          <div>
                            {Array.from({ length: 5 }).map((_, i) => (
                              <i
                                key={i}
                                className={`bi ${i < (item.rating || 5) ? 'bi-star-fill text-warning' : 'bi-star text-muted'} small me-1`}
                              ></i>
                            ))}
                          </div>

                          {item.screenshot_url && (
                            <a
                              href={item.screenshot_url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-success small fw-semibold text-decoration-none"
                            >
                              <i className="bi bi-paperclip me-1"></i> Screenshot
                            </a>
                          )}

                          <span>
                            {item.created_at ? new Date(item.created_at).toLocaleDateString() : 'Recent'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-5 my-auto">
                  <i className="bi bi-inbox fs-1 text-muted mb-2 d-block"></i>
                  <h6 className="fw-bold text-dark">No feedback submitted yet</h6>
                  <p className="text-muted small mb-0">Your shared feedback and bug reports will show up here.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
