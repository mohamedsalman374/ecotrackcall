import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LandingPage() {
  const { user } = useAuth();

  return (
    <div>
      {/* Hero Section */}
      <section className="py-5 py-lg-6" style={{ background: 'linear-gradient(135deg, #ecfdf5 0%, #f0fdf4 50%, #ffffff 100%)' }}>
        <div className="container py-4">
          <div className="row align-items-center g-5">
            <div className="col-lg-6">
              <span className="badge bg-success-subtle text-success px-3 py-2 rounded-pill fw-semibold mb-3">
                <i className="bi bi-stars me-1 text-warning"></i> AI-Powered Climate Action
              </span>
              <h1 className="display-4 fw-bold text-dark lh-sm mb-3">
                Track, Reduce & Neutralize Your <span className="text-success">Carbon Footprint</span>
              </h1>
              <p className="lead text-secondary mb-4">
                Calculate your exact greenhouse gas emissions across 7 everyday categories using scientifically calibrated
                emission factors. Unlock custom AI-driven eco recommendations powered by Groq AI.
              </p>
              <div className="d-flex flex-wrap gap-3">
                <Link to={user ? "/calculator" : "/signup"} className="btn btn-eco-primary btn-lg px-4 py-3">
                  <i className="bi bi-lightning-charge me-2"></i> Calculate Your Impact
                </Link>
                <Link to={user ? "/dashboard" : "/login"} className="btn btn-eco-outline btn-lg px-4 py-3">
                  <i className="bi bi-speedometer2 me-2"></i> {user ? "Go to Dashboard" : "Sign In to Account"}
                </Link>
              </div>

              <div className="row mt-5 pt-3 border-top g-4">
                <div className="col-4">
                  <h4 className="fw-bold text-dark mb-0">7</h4>
                  <p className="text-muted small mb-0">Sector Modules</p>
                </div>
                <div className="col-4">
                  <h4 className="fw-bold text-dark mb-0">100%</h4>
                  <p className="text-muted small mb-0">IPCC Calibrated</p>
                </div>
                <div className="col-4">
                  <h4 className="fw-bold text-dark mb-0">Instant</h4>
                  <p className="text-muted small mb-0">Groq AI Tips</p>
                </div>
              </div>
            </div>

            <div className="col-lg-6 text-center">
              <div className="position-relative d-inline-block">
                <div
                  className="position-absolute w-100 h-100 rounded-4"
                  style={{
                    background: 'radial-gradient(circle, rgba(16,185,129,0.2) 0%, rgba(255,255,255,0) 70%)',
                    transform: 'scale(1.1)',
                    zIndex: 0,
                  }}
                ></div>
                <img
                  src="/images/hero_image.png"
                  alt="EcoTrack Illustration"
                  className="img-fluid rounded-4 shadow-lg position-relative"
                  style={{ maxHeight: '460px', objectFit: 'cover', zIndex: 1 }}
                  onError={(e) => {
                    // Fallback visual if image fails to load
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7 Sectors Section */}
      <section id="features" className="py-5 bg-white">
        <div className="container py-4">
          <div className="text-center max-w-2xl mx-auto mb-5">
            <span className="badge bg-light text-success border px-3 py-1 rounded-pill mb-2 fw-semibold">
              Comprehensive Analysis
            </span>
            <h2 className="fw-bold text-dark">7 Quantified Carbon Categories</h2>
            <p className="text-muted">
              Every aspect of daily living contributes to your carbon footprint. EcoTrack analyzes each domain accurately.
            </p>
          </div>

          <div className="row g-4">
            {[
              {
                icon: 'bi-car-front',
                title: 'Transportation',
                desc: 'Petrol, diesel, electric vehicles, buses, trains, and two-wheelers quantified in km.',
                color: '#3b82f6',
              },
              {
                icon: 'bi-lightning-charge',
                title: 'Electricity',
                desc: 'Grid electrical usage (kWh) computed against regional grid carbon intensity.',
                color: '#f59e0b',
              },
              {
                icon: 'bi-cup-hot',
                title: 'Diet & Nutrition',
                desc: 'Vegan, vegetarian, pescatarian, omnivore, and heavy meat emissions factoring supply chains.',
                color: '#10b981',
              },
              {
                icon: 'bi-trash',
                title: 'Waste & Recycling',
                desc: 'Solid municipal waste generation, organic composting, and recyclables diverted from landfills.',
                color: '#6366f1',
              },
              {
                icon: 'bi-fire',
                title: 'LPG & Cooking Gas',
                desc: 'Domestic cylinder refills and piped natural gas quantified in kilograms of CO2e.',
                color: '#ef4444',
              },
              {
                icon: 'bi-airplane',
                title: 'Flight Travel',
                desc: 'Short-haul domestic and long-haul international flights including radiative forcing.',
                color: '#8b5cf6',
              },
              {
                icon: 'bi-droplet',
                title: 'Water Consumption',
                desc: 'Municipal pumping, domestic water treatment, and greywater recycling offsets.',
                color: '#06b6d4',
              },
              {
                icon: 'bi-cpu',
                title: 'Groq AI Advisor',
                desc: 'Customized action plans, cost-benefit trade-offs, and localized lifestyle advice.',
                color: '#ec4899',
              },
            ].map((cat, idx) => (
              <div key={idx} className="col-lg-3 col-md-6">
                <div className="eco-card p-4 h-100 d-flex flex-column">
                  <div
                    className="icon-circle mb-3 text-white"
                    style={{ backgroundColor: cat.color }}
                  >
                    <i className={`bi ${cat.icon}`}></i>
                  </div>
                  <h5 className="fw-bold text-dark mb-2">{cat.title}</h5>
                  <p className="text-muted small mb-0 flex-grow-1">{cat.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="about" className="py-5" style={{ backgroundColor: '#f8fafc' }}>
        <div className="container py-4">
          <div className="text-center mb-5">
            <h2 className="fw-bold text-dark">How EcoTrack Works</h2>
            <p className="text-muted">A streamlined, 3-step science-backed workflow to climate empowerment</p>
          </div>

          <div className="row g-4 justify-content-center">
            <div className="col-md-4">
              <div className="eco-card p-4 text-center h-100">
                <div className="rounded-circle bg-success-subtle text-success d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3" style={{ width: '60px', height: '60px' }}>
                  1
                </div>
                <h5 className="fw-bold">Input Your Data</h5>
                <p className="text-muted small">
                  Fill in easy-to-use forms for travel, utility bills, diet habits, cooking fuels, and water consumption.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="eco-card p-4 text-center h-100">
                <div className="rounded-circle bg-primary-subtle text-primary d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3" style={{ width: '60px', height: '60px' }}>
                  2
                </div>
                <h5 className="fw-bold">Instant Analysis</h5>
                <p className="text-muted small">
                  The backend engine computes CO2e totals, sector breakdown, and awards a normalized 0-100 Eco Score.
                </p>
              </div>
            </div>

            <div className="col-md-4">
              <div className="eco-card p-4 text-center h-100">
                <div className="rounded-circle bg-warning-subtle text-warning-emphasis d-inline-flex align-items-center justify-content-center fw-bold fs-4 mb-3" style={{ width: '60px', height: '60px' }}>
                  3
                </div>
                <h5 className="fw-bold">AI Green Recommendations</h5>
                <p className="text-muted small">
                  Groq AI delivers high-impact, achievable reduction strategies customized to your highest footprint sectors.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Banner */}
      <section className="py-5 bg-dark text-white text-center">
        <div className="container py-4">
          <h2 className="display-6 fw-bold mb-3">Ready to Lower Your Environmental Footprint?</h2>
          <p className="lead text-secondary max-w-xl mx-auto mb-4">
            Join the EcoTrack community today. Calculate your score, track your monthly progress, and become an Eco Champion.
          </p>
          <Link to={user ? "/calculator" : "/signup"} className="btn btn-eco-primary btn-lg px-5 py-3">
            Start Free Calculation <i className="bi bi-arrow-right ms-2"></i>
          </Link>
        </div>
      </section>
    </div>
  );
}
