import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function ResetPassword() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateError) throw updateError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/login');
      }, 2500);
    } catch (err) {
      setError(err.message || 'Failed to update password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)', minHeight: '80vh' }}>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-7 col-lg-5">
            <div className="eco-card p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="rounded-circle bg-success-subtle text-success d-inline-flex align-items-center justify-content-center p-3 mb-2">
                  <i className="bi bi-shield-lock-fill fs-2"></i>
                </div>
                <h3 className="fw-bold mb-1 text-dark">Set New Password</h3>
                <p className="text-muted small">Choose a strong password to protect your account</p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small py-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{error}</div>
                </div>
              )}

              {success ? (
                <div className="alert alert-success text-center py-3" role="alert">
                  <i className="bi bi-check-circle-fill fs-3 d-block mb-2 text-success"></i>
                  <h6 className="fw-bold mb-1">Password Updated Successfully!</h6>
                  <p className="small mb-0">Redirecting to sign in page...</p>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mb-3">
                    <label className="form-label small fw-semibold">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <div className="mb-4">
                    <label className="form-label small fw-semibold">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                    />
                  </div>

                  <button
                    type="submit"
                    className="btn btn-eco-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                        Updating Password...
                      </>
                    ) : (
                      'Save New Password'
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
