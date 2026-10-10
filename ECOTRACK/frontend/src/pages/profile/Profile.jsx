import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import EcoScoreBadge from '../../components/common/EcoScoreBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

export default function Profile() {
  const { user, profile, refreshProfile } = useAuth();

  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [avatarUploading, setAvatarUploading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // Form states
  const [fullName, setFullName] = useState('');
  const [dietaryPreference, setDietaryPreference] = useState('');
  const [primaryTransport, setPrimaryTransport] = useState('');

  // Password state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);

  useEffect(() => {
    async function initProfile() {
      try {
        setLoading(true);
        const res = await api.profile.get();
        const p = res?.profile || profile || {};
        setFullName(p.full_name || '');
        setDietaryPreference(p.dietary_preference || 'medium_meat');
        setPrimaryTransport(p.primary_transport || 'petrol_car');
      } catch (err) {
        console.error('Failed to load profile:', err);
      } finally {
        setLoading(false);
      }
    }

    initProfile();
  }, []);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setUpdating(true);
    setMsg({ type: '', text: '' });

    try {
      await api.profile.update({
        full_name: fullName,
        dietary_preference: dietaryPreference,
        primary_transport: primaryTransport,
      });
      await refreshProfile();
      setMsg({ type: 'success', text: 'Profile preferences updated successfully!' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.message || 'Failed to update profile.' });
    } finally {
      setUpdating(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setMsg({ type: 'danger', text: 'Please upload an image file (PNG, JPG, WebP).' });
      return;
    }

    const formData = new FormData();
    formData.append('avatar', file);

    setAvatarUploading(true);
    setMsg({ type: '', text: '' });

    try {
      await api.profile.uploadAvatar(formData);
      await refreshProfile();
      setMsg({ type: 'success', text: 'Profile photo updated successfully!' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.message || 'Failed to upload profile picture.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleDeleteAvatar = async () => {
    if (!window.confirm('Remove profile photo?')) return;
    setAvatarUploading(true);
    try {
      await api.profile.deleteAvatar();
      await refreshProfile();
      setMsg({ type: 'success', text: 'Profile picture removed.' });
    } catch (err) {
      setMsg({ type: 'danger', text: err.message || 'Failed to remove picture.' });
    } finally {
      setAvatarUploading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setMsg({ type: '', text: '' });

    if (newPassword.length < 6) {
      setMsg({ type: 'danger', text: 'New password must be at least 6 characters long.' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMsg({ type: 'danger', text: 'New passwords do not match.' });
      return;
    }

    setPasswordLoading(true);
    try {
      await api.profile.changePassword(oldPassword, newPassword);
      setMsg({ type: 'success', text: 'Password changed successfully!' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setMsg({ type: 'danger', text: err.message || 'Failed to change password.' });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <LoadingSpinner message="Loading profile settings..." />;
  }

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="mb-4">
          <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill small fw-semibold">
            <i className="bi bi-person-gear me-1"></i> Account Management
          </span>
          <h2 className="fw-bold text-dark mt-2 mb-1">My Eco Profile</h2>
          <p className="text-muted small mb-0">Configure your personal environmental settings and account credentials.</p>
        </div>

        {msg.text && (
          <div className={`alert alert-${msg.type} alert-dismissible fade show small py-2`} role="alert">
            {msg.text}
            <button type="button" className="btn-close" onClick={() => setMsg({ type: '', text: '' })}></button>
          </div>
        )}

        <div className="row g-4">
          {/* Left Column: Avatar & Eco Badge Card */}
          <div className="col-lg-4">
            <div className="eco-card p-4 text-center">
              <div className="position-relative d-inline-block mb-3">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || 'User Avatar'}
                    className="rounded-circle shadow-sm"
                    style={{ width: '110px', height: '110px', objectFit: 'cover' }}
                  />
                ) : (
                  <div
                    className="rounded-circle bg-success text-white d-inline-flex align-items-center justify-content-center fw-bold shadow-sm"
                    style={{ width: '110px', height: '110px', fontSize: '2.5rem' }}
                  >
                    {(profile?.full_name || user?.email || 'U')[0].toUpperCase()}
                  </div>
                )}

                <label
                  htmlFor="avatarInput"
                  className="position-absolute bottom-0 end-0 bg-white border rounded-circle p-2 shadow-sm cursor-pointer"
                  title="Upload new photo"
                  style={{ width: '36px', height: '36px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <i className="bi bi-camera-fill text-success small"></i>
                </label>
                <input
                  id="avatarInput"
                  type="file"
                  accept="image/*"
                  className="d-none"
                  onChange={handleAvatarUpload}
                  disabled={avatarUploading}
                />
              </div>

              {avatarUploading && (
                <div className="small text-muted mb-2">
                  <span className="spinner-border spinner-border-sm me-1"></span> Uploading photo to Supabase Storage...
                </div>
              )}

              {profile?.avatar_url && (
                <button
                  type="button"
                  className="btn btn-link text-danger p-0 small text-decoration-none d-block mx-auto mb-3"
                  onClick={handleDeleteAvatar}
                >
                  Remove Photo
                </button>
              )}

              <h5 className="fw-bold text-dark mb-1">{profile?.full_name || 'Eco Advocate'}</h5>
              <p className="text-muted small mb-3">{user?.email}</p>

              <div className="p-3 rounded-3 bg-light border text-center mb-3">
                <span className="text-muted small d-block mb-1">Current Standing</span>
                <EcoScoreBadge
                  score={profile?.eco_score ?? 100}
                  level={profile?.eco_level || 'Eco Champion'}
                  size="md"
                />
              </div>

              <div className="small text-muted text-start border-top pt-3">
                <div className="d-flex justify-content-between mb-1">
                  <span>Role:</span>
                  <span className="fw-semibold text-capitalize text-dark">{profile?.role || 'User'}</span>
                </div>
                <div className="d-flex justify-content-between mb-1">
                  <span>Member Since:</span>
                  <span className="fw-semibold text-dark">
                    {profile?.created_at ? new Date(profile.created_at).toLocaleDateString() : 'Active'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Profile Preferences & Security */}
          <div className="col-lg-8">
            {/* Preferences Form */}
            <div className="eco-card p-4 mb-4">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-sliders text-success"></i> Environmental Lifestyle Preferences
              </h5>

              <form onSubmit={handleUpdateProfile}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Display Full Name</label>
                  <input
                    type="text"
                    className="form-control"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Primary Dietary Habit</label>
                    <select
                      className="form-select"
                      value={dietaryPreference}
                      onChange={(e) => setDietaryPreference(e.target.value)}
                    >
                      <option value="vegan">🌱 Vegan (Zero animal products)</option>
                      <option value="vegetarian">🥗 Vegetarian (Dairy & eggs)</option>
                      <option value="pescatarian">🐟 Pescatarian</option>
                      <option value="low_meat">🍗 Low Meat (1-2x per week)</option>
                      <option value="medium_meat">🥩 Regular Omnivore</option>
                      <option value="heavy_meat">🍖 Heavy Meat Consumer</option>
                    </select>
                  </div>

                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Default Daily Transport</label>
                    <select
                      className="form-select"
                      value={primaryTransport}
                      onChange={(e) => setPrimaryTransport(e.target.value)}
                    >
                      <option value="petrol_car">Petrol Car</option>
                      <option value="diesel_car">Diesel Car</option>
                      <option value="electric_car">Electric Vehicle</option>
                      <option value="motorcycle">Motorcycle / Scooter</option>
                      <option value="bus">Public Bus</option>
                      <option value="train">Metro / Train</option>
                      <option value="bicycle">Bicycle / Walking</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-eco-primary btn-sm px-4"
                  disabled={updating}
                >
                  {updating ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span> Saving...
                    </>
                  ) : (
                    'Save Preferences'
                  )}
                </button>
              </form>
            </div>

            {/* Password Change Form */}
            <div className="eco-card p-4">
              <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                <i className="bi bi-shield-lock text-primary"></i> Change Security Password
              </h5>

              <form onSubmit={handleChangePassword}>
                <div className="mb-3">
                  <label className="form-label small fw-semibold">Current Password</label>
                  <input
                    type="password"
                    className="form-control"
                    placeholder="••••••••"
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                  />
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Minimum 6 characters"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div className="col-md-6">
                    <label className="form-label small fw-semibold">Confirm New Password</label>
                    <input
                      type="password"
                      className="form-control"
                      placeholder="Repeat new password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="btn btn-outline-primary btn-sm px-4"
                  disabled={passwordLoading}
                >
                  {passwordLoading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-1"></span> Updating Password...
                    </>
                  ) : (
                    'Update Password'
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
