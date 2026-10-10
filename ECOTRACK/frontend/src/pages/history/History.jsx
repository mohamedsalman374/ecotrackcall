import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import EcoScoreBadge from '../../components/common/EcoScoreBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function History() {
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);
  const [activeModalItem, setActiveModalItem] = useState(null);
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await api.history.getList();
      if (Array.isArray(data)) {
        setHistoryList(data);
      } else if (data && Array.isArray(data.calculations)) {
        setHistoryList(data.calculations);
      } else if (data && Array.isArray(data.history)) {
        setHistoryList(data.history);
      } else {
        setHistoryList([]);
      }
    } catch (err) {
      console.error('History fetch error:', err);
      setError(err.message || 'Failed to fetch calculation history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this calculation record?')) return;
    try {
      setActionLoading(true);
      await api.history.delete(id);
      setHistoryList((prev) => prev.filter((item) => (item.id || item.calculation_id) !== id));
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    } catch (err) {
      alert(`Delete error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!window.confirm(`Delete ${selectedIds.length} selected records permanently?`)) return;

    try {
      setActionLoading(true);
      await api.history.batchDelete(selectedIds);
      setHistoryList((prev) => prev.filter((item) => !selectedIds.includes(item.id || item.calculation_id)));
      setSelectedIds([]);
    } catch (err) {
      alert(`Batch delete error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!window.confirm('WARNING: Are you sure you want to wipe ALL your calculation history? This action cannot be reversed.')) return;

    try {
      setActionLoading(true);
      await api.history.deleteAll();
      setHistoryList([]);
      setSelectedIds([]);
    } catch (err) {
      alert(`Delete all error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownload = async (type) => {
    try {
      setActionLoading(true);
      const blob = type === 'csv' ? await api.history.exportCSV() : await api.history.exportPDF();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ecotrack_history_${new Date().toISOString().slice(0, 10)}.${type}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      alert(`Export error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const toggleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(historyList.map((item) => item.id || item.calculation_id));
    } else {
      setSelectedIds([]);
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  // Filter list
  const filteredList = historyList.filter((item) => {
    const term = searchTerm.toLowerCase();
    const dateStr = item.created_at || item.date || '';
    const levelStr = item.eco_level || '';
    return dateStr.toLowerCase().includes(term) || levelStr.toLowerCase().includes(term);
  });

  return (
    <div className="py-4">
      <div className="container">
        {/* Header and Export Controls */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <span className="badge bg-secondary-subtle text-secondary px-3 py-1 rounded-pill small fw-semibold">
              <i className="bi bi-clock-history me-1"></i> Audit Logs
            </span>
            <h2 className="fw-bold text-dark mt-2 mb-1">Calculation History</h2>
            <p className="text-muted small mb-0">
              Complete archive of your greenhouse gas calculations, sector breakdowns, and downloadable reports.
            </p>
          </div>

          <div className="d-flex flex-wrap gap-2">
            <button
              type="button"
              className="btn btn-outline-success btn-sm d-flex align-items-center gap-1"
              onClick={() => handleDownload('csv')}
              disabled={actionLoading || historyList.length === 0}
            >
              <i className="bi bi-file-earmark-spreadsheet"></i> Export CSV
            </button>
            <button
              type="button"
              className="btn btn-outline-danger btn-sm d-flex align-items-center gap-1"
              onClick={() => handleDownload('pdf')}
              disabled={actionLoading || historyList.length === 0}
            >
              <i className="bi bi-file-earmark-pdf"></i> Export PDF
            </button>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i> {error}
          </div>
        )}

        {/* Toolbar: Search & Batch actions */}
        <div className="eco-card p-3 mb-4">
          <div className="row g-2 align-items-center justify-content-between">
            <div className="col-md-5">
              <div className="input-group input-group-sm">
                <span className="input-group-text bg-light border-end-0">
                  <i className="bi bi-search text-muted"></i>
                </span>
                <input
                  type="text"
                  className="form-control border-start-0"
                  placeholder="Filter by date or eco level..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="col-md-7 d-flex justify-content-md-end gap-2">
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  className="btn btn-danger btn-sm"
                  onClick={handleBatchDelete}
                  disabled={actionLoading}
                >
                  <i className="bi bi-trash me-1"></i> Delete Selected ({selectedIds.length})
                </button>
              )}
              {historyList.length > 0 && (
                <button
                  type="button"
                  className="btn btn-outline-danger btn-sm"
                  onClick={handleDeleteAll}
                  disabled={actionLoading}
                >
                  <i className="bi bi-trash3 me-1"></i> Wipe All History
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table / List */}
        <div className="eco-card overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Fetching calculation log..." />
          ) : filteredList.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th style={{ width: '40px' }} className="text-center">
                      <input
                        type="checkbox"
                        className="form-check-input"
                        checked={selectedIds.length === filteredList.length && filteredList.length > 0}
                        onChange={toggleSelectAll}
                      />
                    </th>
                    <th>Date & Time</th>
                    <th>Total Emissions</th>
                    <th>Eco Score</th>
                    <th>Highest Sector</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredList.map((item) => {
                    const itemId = item.id || item.calculation_id;
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
                      <tr key={itemId}>
                        <td className="text-center">
                          <input
                            type="checkbox"
                            className="form-check-input"
                            checked={selectedIds.includes(itemId)}
                            onChange={() => toggleSelectOne(itemId)}
                          />
                        </td>
                        <td>
                          <div className="fw-semibold text-dark">{dateFormatted}</div>
                          <span className="text-muted" style={{ fontSize: '0.75rem' }}>
                            ID: {itemId?.slice(0, 8)}...
                          </span>
                        </td>
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
                            {item.highest_category || item.top_category || 'Balanced'}
                          </span>
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <button
                              type="button"
                              className="btn btn-outline-primary btn-sm px-2"
                              title="View Details"
                              onClick={() => setActiveModalItem(item)}
                            >
                              <i className="bi bi-eye"></i>
                            </button>
                            <button
                              type="button"
                              className="btn btn-outline-danger btn-sm px-2"
                              title="Delete Record"
                              onClick={() => handleDelete(itemId)}
                              disabled={actionLoading}
                            >
                              <i className="bi bi-trash"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-5 text-center">
              <i className="bi bi-journal-x fs-1 text-muted mb-2 d-block"></i>
              <h5 className="fw-bold text-dark">No calculation logs found</h5>
              <p className="text-muted small">
                {searchTerm ? 'Try adjusting your search criteria.' : 'Calculate your carbon footprint to begin tracking history.'}
              </p>
            </div>
          )}
        </div>

        {/* Details Modal */}
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
                  <h5 className="modal-title fw-bold">Calculation Breakdown Details</h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={() => setActiveModalItem(null)}
                  ></button>
                </div>
                <div className="modal-body p-4">
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

                  {activeModalItem.created_at && (
                    <div className="mt-3 text-muted" style={{ fontSize: '0.8rem' }}>
                      Logged at: {new Date(activeModalItem.created_at).toLocaleString()}
                    </div>
                  )}
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
