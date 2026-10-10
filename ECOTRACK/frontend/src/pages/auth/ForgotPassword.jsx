import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../../services/supabase';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setMessage('');

    if (!email) {
      setError('Please enter your account email.');
      return;
    }

    setLoading(true);
    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (resetError) throw resetError;
      setMessage('Password reset link sent! Please check your email inbox.');
    } catch (err) {
      setError(err.message || 'Failed to send password reset instructions.');
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
                  <i className="bi bi-key-fill fs-2"></i>
                </div>
                <h3 className="fw-bold mb-1 text-dark">Reset Password</h3>
                <p className="text-muted small">Enter your verified email to receive recovery instructions</p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small py-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{error}</div>
                </div>
              )}

              {message && (
                <div className="alert alert-success d-flex align-items-center gap-2 small py-2" role="alert">
                  <i className="bi bi-check-circle-fill"></i>
                  <div>{message}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Email Address</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-envelope"></i>
                    </span>
                    <input
                      type="email"
                      className="form-control border-start-0"
                      placeholder="name@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-eco-primary w-100 py-2 mt-2 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Sending Link...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <Link to="/login" className="small text-muted text-decoration-none">
                  <i className="bi bi-arrow-left me-1"></i> Back to Sign In
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
