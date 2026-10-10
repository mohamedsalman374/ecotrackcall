import React from 'react';

export default function LoadingSpinner({ message = 'Loading...', fullScreen = false }) {
  if (fullScreen) {
    return (
      <div className="d-flex flex-column align-items-center justify-content-center min-vh-100 bg-light">
        <div className="spinner-border text-success mb-3" style={{ width: '3rem', height: '3rem' }} role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
        <p className="text-muted fw-semibold">{message}</p>
      </div>
    );
  }

  return (
    <div className="d-flex flex-column align-items-center justify-content-center py-5">
      <div className="spinner-border text-success mb-2" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
      <span className="text-muted small">{message}</span>
    </div>
  );
}
