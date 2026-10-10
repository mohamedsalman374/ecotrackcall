import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.admin.getUsers();
      if (Array.isArray(res)) {
        setUsers(res);
      } else if (res && Array.isArray(res.users)) {
        setUsers(res.users);
      } else {
        setUsers([]);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
      setError(err.message || 'Failed to fetch users list.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleRoleToggle = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    if (!window.confirm(`Change role of this user to '${newRole}'?`)) return;

    try {
      setActionLoading(true);
      await api.admin.toggleRole(userId, newRole);
      setUsers((prev) =>
        prev.map((u) => ((u.id || u.user_id) === userId ? { ...u, role: newRole } : u))
      );
    } catch (err) {
      alert(`Role update error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusToggle = async (userId, currentStatus) => {
    const newStatus = !currentStatus;
    if (!window.confirm(`${newStatus ? 'Activate' : 'Deactivate'} account for this user?`)) return;

    try {
      setActionLoading(true);
      await api.admin.toggleStatus(userId, newStatus);
      setUsers((prev) =>
        prev.map((u) => ((u.id || u.user_id) === userId ? { ...u, is_active: newStatus } : u))
      );
    } catch (err) {
      alert(`Status update error: ${err.message}`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const term = searchTerm.toLowerCase();
    const name = (u.full_name || '').toLowerCase();
    const email = (u.email || '').toLowerCase();
    return name.includes(term) || email.includes(term);
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
            <h2 className="fw-bold text-dark mb-0">User Directory & Governance</h2>
            <p className="text-muted small mb-0">Manage platform permissions, account roles, and membership statuses.</p>
          </div>
          <span className="badge bg-light text-muted border px-3 py-2">
            Total Accounts: {users.length}
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
              placeholder="Search by full name or email address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Users Table */}
        <div className="eco-card overflow-hidden">
          {loading ? (
            <LoadingSpinner message="Loading user directory..." />
          ) : filteredUsers.length > 0 ? (
            <div className="table-responsive">
              <table className="table table-hover align-middle mb-0">
                <thead className="table-light">
                  <tr className="small text-muted">
                    <th>User</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Eco Score</th>
                    <th>Status</th>
                    <th>Registered</th>
                    <th className="text-end">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((u) => {
                    const id = u.id || u.user_id;
                    const isActive = u.is_active !== false;

                    return (
                      <tr key={id}>
                        <td>
                          <div className="d-flex align-items-center gap-2">
                            {u.avatar_url ? (
                              <img
                                src={u.avatar_url}
                                alt="avatar"
                                className="rounded-circle"
                                style={{ width: '34px', height: '34px', objectFit: 'cover' }}
                              />
                            ) : (
                              <div
                                className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold"
                                style={{ width: '34px', height: '34px', fontSize: '0.85rem' }}
                              >
                                {(u.full_name || u.email || 'U')[0].toUpperCase()}
                              </div>
                            )}
                            <div>
                              <div className="fw-semibold text-dark small">{u.full_name || 'N/A'}</div>
                            </div>
                          </div>
                        </td>
                        <td className="small text-muted">{u.email}</td>
                        <td>
                          <span
                            className={`badge ${
                              u.role === 'admin' ? 'bg-danger-subtle text-danger border border-danger-subtle' : 'bg-secondary-subtle text-secondary'
                            } text-capitalize small`}
                          >
                            {u.role || 'user'}
                          </span>
                        </td>
                        <td>
                          <span className="fw-bold text-success small">{u.eco_score ?? 100}</span>
                        </td>
                        <td>
                          <span className={`badge ${isActive ? 'bg-success-subtle text-success' : 'bg-secondary-subtle text-secondary'} small`}>
                            {isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="small text-muted">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="text-end">
                          <div className="d-inline-flex gap-1">
                            <button
                              type="button"
                              className={`btn btn-sm ${u.role === 'admin' ? 'btn-outline-secondary' : 'btn-outline-danger'}`}
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => handleRoleToggle(id, u.role || 'user')}
                              disabled={actionLoading}
                              title="Toggle Administrator Role"
                            >
                              {u.role === 'admin' ? 'Demote' : 'Make Admin'}
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${isActive ? 'btn-outline-warning' : 'btn-outline-success'}`}
                              style={{ fontSize: '0.75rem' }}
                              onClick={() => handleStatusToggle(id, isActive)}
                              disabled={actionLoading}
                              title="Toggle Status"
                            >
                              {isActive ? 'Suspend' : 'Activate'}
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
              <i className="bi bi-people fs-1 text-muted mb-2 d-block"></i>
              <h5 className="fw-bold text-dark">No accounts found</h5>
              <p className="text-muted small">Try modifying your search term.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
