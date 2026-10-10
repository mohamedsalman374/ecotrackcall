import React from 'react';

export default function EcoScoreBadge({ score = 100, level, showLabel = true, size = 'md' }) {
  const numScore = Number(score) || 0;

  let badgeClass = 'badge-eco-excellent';
  let badgeText = 'Eco Champion';
  let badgeIcon = 'bi-patch-check-fill';

  if (numScore >= 80) {
    badgeClass = 'badge-eco-excellent';
    badgeText = level || 'Eco Champion';
    badgeIcon = 'bi-patch-check-fill text-success';
  } else if (numScore >= 60) {
    badgeClass = 'badge-eco-good';
    badgeText = level || 'Eco Conscious';
    badgeIcon = 'bi-shield-check text-info';
  } else if (numScore >= 40) {
    badgeClass = 'badge-eco-moderate';
    badgeText = level || 'Needs Improvement';
    badgeIcon = 'bi-exclamation-triangle-fill text-warning';
  } else {
    badgeClass = 'badge-eco-high';
    badgeText = level || 'High Carbon Impact';
    badgeIcon = 'bi-fire text-danger';
  }

  const sizeClasses = {
    sm: 'px-2 py-1 fs-7',
    md: 'px-3 py-1 fs-6',
    lg: 'px-4 py-2 fs-5',
  };

  return (
    <span className={`d-inline-flex align-items-center gap-1 ${badgeClass} ${sizeClasses[size] || sizeClasses.md}`}>
      <i className={`bi ${badgeIcon}`}></i>
      <span className="fw-bold">{numScore}/100</span>
      {showLabel && <span className="ms-1 fw-medium opacity-75">· {badgeText}</span>}
    </span>
  );
}
