import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    async function loadStats() {
      try {
        setLoading(true);
        const data = await api.admin.getStats();
        setStats(data);
      } catch (err) {
        console.error('Failed to load admin stats:', err);
        setError(err.message || 'Failed to load administrator statistics.');
      } finally {
        setLoading(false);
      }
    }

    loadStats();
  }, []);

  const handleExportAnalytics = async () => {
    try {
      setExporting(true);
      const blob = await api.admin.exportAnalytics();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrack_platform_analytics_${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading administrator management portal..." />;
  }

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <span className="badge bg-danger-subtle text-danger px-3 py-1 rounded-pill small fw-semibold">
              <i className="bi bi-shield-lock-fill me-1"></i> Administrator Control Center
            </span>
            <h2 className="fw-bold text-dark mt-2 mb-1">System Overview & Governance</h2>
            <p className="text-muted small mb-0">Platform metrics, user directory, calculation logs, and moderation tools.</p>
          </div>

          <div className="d-flex gap-2">
            <button
              type="button"
              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
              onClick={handleExportAnalytics}
              disabled={exporting}
            >
              {exporting ? (
                <>
                  <span className="spinner-border spinner-border-sm"></span> Exporting...
                </>
              ) : (
                <>
                  <i className="bi bi-download"></i> Export Analytics CSV
                </>
              )}
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 small py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {/* 4 Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Total Registered Users</span>
              <h3 className="fw-bold text-dark mt-2 mb-1">{stats?.total_users ?? 0}</h3>
              <p className="text-muted small mb-0">
                <Link to="/admin/users" className="text-success text-decoration-none">
                  Manage users <i className="bi bi-arrow-right"></i>
                </Link>
              </p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Total Calculations</span>
              <h3 className="fw-bold text-primary mt-2 mb-1">{stats?.total_calculations ?? 0}</h3>
              <p className="text-muted small mb-0">
                <Link to="/admin/calculations" className="text-primary text-decoration-none">
                  Inspect audits <i className="bi bi-arrow-right"></i>
                </Link>
              </p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Total CO2 Tracked</span>
              <h3 className="fw-bold text-danger mt-2 mb-1">
                {Number(stats?.total_co2_kg ?? 0).toFixed(1)} <span className="fs-6 fw-normal text-muted">kg</span>
              </h3>
              <p className="text-muted small mb-0">Cumulative platform footprint</p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Feedback Inquiries</span>
              <h3 className="fw-bold text-warning-emphasis mt-2 mb-1">{stats?.total_feedback ?? 0}</h3>
              <p className="text-muted small mb-0">
                <Link to="/admin/feedback" className="text-warning text-decoration-none">
                  Review feedback <i className="bi bi-arrow-right"></i>
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Admin Navigation Hub Cards */}
        <div className="row g-4">
          <div className="col-md-4">
            <div className="eco-card p-4 h-100 d-flex flex-column">
              <div className="icon-circle bg-success-subtle text-success mb-3">
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <h5 className="fw-bold text-dark">User Management</h5>
              <p className="text-muted small flex-grow-1">
                View user profiles, promote accounts to Administrator role, and toggle active status.
              </p>
              <Link to="/admin/users" className="btn btn-outline-success btn-sm mt-2">
                Open Directory <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          <div className="col-md-4">
            <div className="eco-card p-4 h-100 d-flex flex-column">
              <div className="icon-circle bg-primary-subtle text-primary mb-3">
                <i className="bi bi-calculator-fill fs-4"></i>
              </div>
              <h5 className="fw-bold text-dark">Global Calculations</h5>
              <p className="text-muted small flex-grow-1">
                Audit carbon calculations recorded across all users with sector breakdowns and timestamp filters.
              </p>
              <Link to="/admin/calculations" className="btn btn-outline-primary btn-sm mt-2">
                Audit Calculations <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>

          <div className="col-md-4">
            <div className="eco-card p-4 h-100 d-flex flex-column">
              <div className="icon-circle bg-warning-subtle text-warning-emphasis mb-3">
                <i className="bi bi-chat-dots-fill fs-4"></i>
              </div>
              <h5 className="fw-bold text-dark">Feedback & Tickets</h5>
              <p className="text-muted small flex-grow-1">
                Examine bug reports, suggestions, user ratings, attached screenshots, and change resolution statuses.
              </p>
              <Link to="/admin/feedback" className="btn btn-outline-warning btn-sm mt-2">
                Moderate Tickets <i className="bi bi-arrow-right ms-1"></i>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
