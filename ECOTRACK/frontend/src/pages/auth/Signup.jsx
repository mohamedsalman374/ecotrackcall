import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Signup() {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [agreeTerms, setAgreeTerms] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    if (!fullName.trim() || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (!agreeTerms) {
      setError('You must accept the terms and privacy conditions.');
      return;
    }

    setLoading(true);
    try {
      const data = await signup(email, password, fullName.trim());
      // Check if email confirmation is required by Supabase project settings
      if (data.session) {
        navigate('/dashboard', { replace: true });
      } else {
        setSuccessMsg('Account created successfully! Check your email inbox to confirm your account, then sign in.');
      }
    } catch (err) {
      console.error('Signup error:', err);
      setError(err.message || 'Registration failed. Please check your inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-5" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #f8fafc 100%)', minHeight: '80vh' }}>
      <div className="container py-4">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="eco-card p-4 p-md-5">
              <div className="text-center mb-4">
                <span className="fs-1">🌱</span>
                <h3 className="fw-bold mt-2 mb-1 text-dark">Join EcoTrack</h3>
                <p className="text-muted small">Begin monitoring and reducing your carbon footprint today</p>
              </div>

              {error && (
                <div className="alert alert-danger d-flex align-items-center gap-2 small py-2" role="alert">
                  <i className="bi bi-exclamation-triangle-fill"></i>
                  <div>{error}</div>
                </div>
              )}

              {successMsg && (
                <div className="alert alert-success d-flex align-items-center gap-2 small py-2" role="alert">
                  <i className="bi bi-check-circle-fill"></i>
                  <div>{successMsg}</div>
                </div>
              )}

              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Full Name</label>
                  <div className="input-group">
                    <span className="input-group-text bg-light border-end-0 text-muted">
                      <i className="bi bi-person"></i>
                    </span>
                    <input
                      type="text"
                      className="form-control border-start-0"
                      placeholder="Jane Doe"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                </div>

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
                      autoComplete="email"
                    />
                  </div>
                </div>

                <div className="row g-2 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-lock"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0"
                        placeholder="••••••••"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Confirm Password</label>
                    <div className="input-group">
                      <span className="input-group-text bg-light border-end-0 text-muted">
                        <i className="bi bi-shield-check"></i>
                      </span>
                      <input
                        type="password"
                        className="form-control border-start-0"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        autoComplete="new-password"
                      />
                    </div>
                  </div>
                </div>

                <div className="form-check mb-4 small">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    id="termsCheck"
                    checked={agreeTerms}
                    onChange={(e) => setAgreeTerms(e.target.checked)}
                  />
                  <label className="form-check-label text-muted" htmlFor="termsCheck">
                    I agree to the environmental pledge and platform terms of service.
                  </label>
                </div>

                <button
                  type="submit"
                  className="btn btn-eco-primary w-100 py-2 d-flex align-items-center justify-content-center gap-2"
                  disabled={loading}
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Free Account <i className="bi bi-arrow-right"></i>
                    </>
                  )}
                </button>
              </form>

              <div className="text-center mt-4 pt-3 border-top">
                <p className="small text-muted mb-0">
                  Already registered?{' '}
                  <Link to="/login" className="text-success fw-semibold text-decoration-none">
                    Sign In Here
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
