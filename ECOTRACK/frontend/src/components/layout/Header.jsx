import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Header() {
  const { user, profile, isAdmin, logout } = useAuth();
  const [navCollapsed, setNavCollapsed] = useState(true);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const toggleNav = () => setNavCollapsed(!navCollapsed);
  const closeNav = () => setNavCollapsed(true);

  return (
    <header className="sticky-top">
      <nav className="navbar navbar-expand-lg eco-navbar shadow-sm">
        <div className="container">
          <Link className="navbar-brand d-flex align-items-center gap-2" to="/" onClick={closeNav}>
            <span className="fs-3">🌱</span>
            <span className="fw-bold tracking-tight text-success fs-4">EcoTrack</span>
          </Link>

          <button
            className="navbar-toggler border-0"
            type="button"
            onClick={toggleNav}
            aria-controls="ecoNavbarNav"
            aria-expanded={!navCollapsed}
            aria-label="Toggle navigation"
          >
            <span className="navbar-toggler-icon"></span>
          </button>

          <div className={`collapse navbar-collapse ${!navCollapsed ? 'show' : ''}`} id="ecoNavbarNav">
            <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-3">
              {user ? (
                <>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/dashboard"
                      onClick={closeNav}
                    >
                      <i className="bi bi-speedometer2 me-1"></i> Dashboard
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/calculator"
                      onClick={closeNav}
                    >
                      <i className="bi bi-calculator me-1"></i> Calculator
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/recommendations"
                      onClick={closeNav}
                    >
                      <i className="bi bi-stars me-1 text-warning"></i> AI Recommendations
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/analytics"
                      onClick={closeNav}
                    >
                      <i className="bi bi-graph-up-arrow me-1"></i> Analytics
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/history"
                      onClick={closeNav}
                    >
                      <i className="bi bi-clock-history me-1"></i> History
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/feedback"
                      onClick={closeNav}
                    >
                      <i className="bi bi-chat-heart me-1"></i> Feedback
                    </NavLink>
                  </li>
                  {isAdmin && (
                    <li className="nav-item">
                      <NavLink
                        className={({ isActive }) => `nav-link text-danger ${isActive ? 'active' : ''}`}
                        to="/admin"
                        onClick={closeNav}
                      >
                        <i className="bi bi-shield-lock me-1"></i> Admin Panel
                      </NavLink>
                    </li>
                  )}
                </>
              ) : (
                <>
                  <li className="nav-item">
                    <NavLink
                      className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                      to="/"
                      onClick={closeNav}
                    >
                      Home
                    </NavLink>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#features" onClick={closeNav}>
                      Features
                    </a>
                  </li>
                  <li className="nav-item">
                    <a className="nav-link" href="#about" onClick={closeNav}>
                      About
                    </a>
                  </li>
                </>
              )}
            </ul>

            <div className="d-flex align-items-center gap-2 mt-2 mt-lg-0">
              {user ? (
                <div className="position-relative">
                  <div
                    className="d-flex align-items-center gap-2 p-1 pe-3 rounded-pill bg-light border cursor-pointer"
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                  >
                    {profile?.avatar_url ? (
                      <img
                        src={profile.avatar_url}
                        alt={profile.full_name || 'User'}
                        className="rounded-circle"
                        style={{ width: '36px', height: '36px', objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        className="rounded-circle bg-success text-white d-flex align-items-center justify-content-center fw-bold"
                        style={{ width: '36px', height: '36px', fontSize: '0.9rem' }}
                      >
                        {(profile?.full_name || user.email || 'U')[0].toUpperCase()}
                      </div>
                    )}
                    <span className="small fw-semibold text-truncate" style={{ maxWidth: '120px' }}>
                      {profile?.full_name || user.email?.split('@')[0]}
                    </span>
                    <i className="bi bi-chevron-down small text-muted"></i>
                  </div>

                  {dropdownOpen && (
                    <div
                      className="dropdown-menu dropdown-menu-end show position-absolute end-0 shadow-lg border-0 rounded-3 mt-2 py-2"
                      style={{ minWidth: '220px', zIndex: 1050 }}
                      onMouseLeave={() => setDropdownOpen(false)}
                    >
                      <div className="px-3 py-2 border-bottom">
                        <p className="mb-0 fw-semibold text-dark small text-truncate">
                          {profile?.full_name || 'Eco Warrior'}
                        </p>
                        <p className="mb-0 text-muted small text-truncate">{user.email}</p>
                        {profile?.eco_score !== undefined && (
                          <div className="mt-1 badge bg-success-subtle text-success border border-success-subtle">
                            Eco Score: {profile.eco_score}
                          </div>
                        )}
                      </div>
                      <Link
                        to="/profile"
                        className="dropdown-item py-2 d-flex align-items-center gap-2"
                        onClick={() => {
                          setDropdownOpen(false);
                          closeNav();
                        }}
                      >
                        <i className="bi bi-person-circle text-muted"></i> My Profile
                      </Link>
                      <Link
                        to="/history"
                        className="dropdown-item py-2 d-flex align-items-center gap-2"
                        onClick={() => {
                          setDropdownOpen(false);
                          closeNav();
                        }}
                      >
                        <i className="bi bi-journal-text text-muted"></i> Activity Records
                      </Link>
                      {isAdmin && (
                        <Link
                          to="/admin"
                          className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                          onClick={() => {
                            setDropdownOpen(false);
                            closeNav();
                          }}
                        >
                          <i className="bi bi-shield-lock"></i> Administration
                        </Link>
                      )}
                      <div className="dropdown-divider"></div>
                      <button
                        className="dropdown-item py-2 d-flex align-items-center gap-2 text-danger"
                        onClick={() => {
                          setDropdownOpen(false);
                          handleLogout();
                        }}
                      >
                        <i className="bi bi-box-arrow-right"></i> Sign Out
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="d-flex align-items-center gap-2">
                  <Link to="/login" className="btn btn-outline-success btn-sm px-3 rounded-pill" onClick={closeNav}>
                    Sign In
                  </Link>
                  <Link to="/signup" className="btn btn-success btn-sm px-3 rounded-pill" onClick={closeNav}>
                    Get Started
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>
    </header>
  );
}
