import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import EcoScoreBadge from '../../components/common/EcoScoreBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminCalculations() {
  const [calculations, setCalculations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const res = await api.admin.getCalculations();
        if (Array.isArray(res)) {
          setCalculations(res);
        } else if (res && Array.isArray(res.calculations)) {
          setCalculations(res.calculations);
        } else {
          setCalculations([]);
        }
      } catch (err) {
        console.error('Failed to load calculations:', err);
        setError(err.message || 'Failed to fetch platform calculation logs.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const filteredList = calculations.filter((item) => {
    const term = searchTerm.toLowerCase();
    const userEmail = (item.user_email || item.email || '').toLowerCase();
    const dateStr = (item.created_at || '').toLowerCase();
    return userEmail.includes(term) || dateStr.includes(term);
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
            <h2 className="fw-bold text-dark mb-0">Platform Calculation Audits</h2>
            <p className="text-muted small mb-0">Cross-user greenhouse gas assessments and sector footprint logs.</p>
          </div>
          <span className="badge bg-light text-muted border px-3 py-2">
            Total Audits: {calculations.length}
          </span>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 small py-2" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        {/* Search */}
        <div className="eco-card p-3 mb-4">
          <div className="input-group input-group-sm" style={{ maxWidth: '400px' }}>
            <span className="input-group-text bg-light border-end-0">
              <i className="bi bi-search text-muted"></i>
            </span>
            <input
              type="text"
              className="form-control border-start-0"
              placeholder="Search by user email or audit date..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <div className="eco-card overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Retrieving platform calculations..." />
          ) : filteredList.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th>User / Account</th>
                    <th>Date & Time</th>
                    <th>Total Emissions</th>
                    <th>Eco Score</th>
                    <th>Dominant Sector</th>
                    <th className="text-end">Details</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const id = item.id || item.calculation_id;
                    const dateFormatted = item.created_at
                      ? new Date(item.created_at).toLocaleString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A';

                    return (
                      <tr key={id}>
                        <td>
                          <div className="fw-semibold text-dark small">
                            {item.user_email || item.email || 'Registered User'}
                          </div>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            ID: {id?.slice(0, 8)}...
                          </span>
                        </td>
                        <td className="small text-muted">{dateFormatted}</td>
                        <td>
                          <span className="fw-bold text-dark fs-6">
                            {Number(item.total_emission ?? item.total ?? 0).toFixed(2)}
                          </span>{' '}
                          <span className="text-muted small">kg CO2e</span>
                        </td>
                        <td>
                          <EcoScoreBadge
                            score={item.eco_score ?? 100}
                            level={item.eco_level}
                            size="sm"
                          />
                        </td>
                        <td>
                          <span className="badge bg-light text-secondary border text-capitalize">
                            {item.highest_category || item.top_category || 'N/A'}
                          </span>
                        </td>
                        <td className="text-end">
                          <button
                            type="button"
                            className="btn btn-outline-primary btn-sm px-2"
                            title="Inspect Breakdown"
                            onClick={() => setActiveModalItem(item)}
                          >
                            <i className="bi bi-eye"></i>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-center">
              <i className="bi bi-calculator fs-1 text-muted mb-2 d-block"></i>
              <h5 className="fw-bold text-dark">No calculation logs found</h5>
              <p className="text-muted small">No user carbon calculations recorded matching the search query.</p>
            </div>
          )}
        </div>

        {/* Modal */}
        {activeModalItem && (
          <div
            className="modal fade show d-block"
            tabIndex="-1"
            style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
            onClick={() => setActiveModalItem(null)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content rounded-4 border-0 shadow-lg">
                <div className="modal-header border-bottom">
                  <h5 className="modal-title fw-bold">Platform Audit Breakdown</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setActiveModalItem(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
                  <div className="mb-2 text-muted small">
                    User: <strong>{activeModalItem.user_email || activeModalItem.email || 'User'}</strong>
                  </div>
                  <div className="d-flex justify-content-between align-items-center mb-3">
                    <div>
                      <div className="text-muted small">Total CO2e</div>
                      <div className="fs-3 fw-bold text-dark">
                        {Number(activeModalItem.total_emission ?? activeModalItem.total ?? 0).toFixed(2)} kg
                      </div>
                    </div>
                    <EcoScoreBadge
                      score={activeModalItem.eco_score ?? 100}
                      level={activeModalItem.eco_level}
                      size="md"
                    />
                  </div>

                  <h6 className="fw-bold text-dark mb-2">Category Breakdown (kg CO2e)</h6>
                  <div className="row g-2">
                    {activeModalItem.breakdown &&
                      Object.entries(activeModalItem.breakdown).map(([cat, val]) => (
                        <div key={cat} className="col-6">
                          <div className="p-2 rounded bg-light border d-flex justify-content-between small">
                            <span className="text-capitalize text-muted">{cat}:</span>
                            <span className="fw-bold text-dark">{Number(val).toFixed(2)} kg</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
                <div className="modal-footer border-top">
                  <button
                    type="button"
                    className="btn btn-secondary btn-sm"
                    onClick={() => setActiveModalItem(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
