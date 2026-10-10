import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="py-5 text-center d-flex align-items-center justify-content-center" style={{ minHeight: '65vh' }}>
      <div className="container">
        <span className="display-1 fw-bold text-success d-block mb-2">404</span>
        <h2 className="fw-bold text-dark mb-2">Page Not Found</h2>
        <p className="text-muted small max-w-md mx-auto mb-4">
          The requested page could not be located in the EcoTrack carbon portal.
        </p>
        <Link to="/" className="btn btn-eco-primary px-4 py-2">
          <i className="bi bi-house-door me-1"></i> Return Home
        </Link>
      </div>
    </div>
  );
}
