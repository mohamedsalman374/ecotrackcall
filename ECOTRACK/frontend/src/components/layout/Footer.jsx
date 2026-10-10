import React from 'react';
import { Link } from 'react-router-dom';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="eco-footer py-5 mt-auto">
      <div className="container">
        <div className="row g-4 justify-content-between">
          <div className="col-lg-4 col-md-6">
            <div className="d-flex align-items-center gap-2 mb-3">
              <span className="fs-3">🌱</span>
              <span className="fw-bold fs-4 text-white">EcoTrack</span>
            </div>
            <p className="text-secondary small pe-lg-4">
              AI-Based Carbon Footprint Calculator & Eco Recommendation System. Empowering individuals and
              organizations with actionable intelligence to quantify emissions across 7 life sectors and achieve net-zero milestones.
            </p>
            <div className="d-flex gap-3 text-secondary mt-3">
              <span className="badge bg-dark border border-secondary text-light">Final Year CSE Project</span>
              <span className="badge bg-success-subtle text-success">AI & Sustainability</span>
            </div>
          </div>

          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="text-white fw-semibold mb-3">Quick Links</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>
                <Link to="/dashboard">Dashboard</Link>
              </li>
              <li>
                <Link to="/calculator">Carbon Calculator</Link>
              </li>
              <li>
                <Link to="/recommendations">AI Recommendations</Link>
              </li>
              <li>
                <Link to="/analytics">Analytics & Trends</Link>
              </li>
              <li>
                <Link to="/history">Calculation History</Link>
              </li>
            </ul>
          </div>

          <div className="col-lg-2 col-md-3 col-6">
            <h6 className="text-white fw-semibold mb-3">Categories</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-0">
              <li>🚗 Transportation</li>
              <li>⚡ Electricity</li>
              <li>🥗 Diet & Food</li>
              <li>🗑️ Waste Disposal</li>
              <li>🔥 LPG & Cooking</li>
              <li>✈️ Flight Travel</li>
              <li>💧 Water Consumption</li>
            </ul>
          </div>

          <div className="col-lg-3 col-md-6">
            <h6 className="text-white fw-semibold mb-3">Community & Support</h6>
            <ul className="list-unstyled small d-flex flex-column gap-2 mb-3">
              <li>
                <Link to="/feedback">Submit Feedback & Bug Reports</Link>
              </li>
              <li>
                <Link to="/profile">Profile & Eco Preferences</Link>
              </li>
            </ul>
            <div className="p-3 rounded-3 bg-dark border border-secondary border-opacity-25 small text-secondary">
              <i className="bi bi-cpu me-2 text-warning"></i>
              Powered by Groq AI & Supabase Cloud
            </div>
          </div>
        </div>

        <hr className="my-4 border-secondary border-opacity-25" />

        <div className="row align-items-center justify-content-between small text-secondary">
          <div className="col-md-6 text-center text-md-start mb-2 mb-md-0">
            &copy; {currentYear} EcoTrack. All rights reserved. Designed for sustainable living.
          </div>
          <div className="col-md-6 text-center text-md-end">
            <span className="me-3">Final Year B.Tech Computer Science Engineering</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
