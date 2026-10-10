import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import { useAuth } from '../../context/AuthContext';
import { api } from '../../services/api';
import EcoScoreBadge from '../../components/common/EcoScoreBadge';
import LoadingSpinner from '../../components/common/LoadingSpinner';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function Dashboard() {
  const { user, profile } = useAuth();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchSummary() {
      try {
        setLoading(true);
        const data = await api.dashboard.getSummary();
        setSummary(data);
      } catch (err) {
        console.error('Failed to load dashboard summary:', err);
        setError(err.message || 'Could not load dashboard data.');
      } finally {
        setLoading(false);
      }
    }

    fetchSummary();
  }, []);

  if (loading) {
    return <LoadingSpinner message="Loading your environmental overview..." />;
  }

  const latest = summary?.latest_calculation;
  const ecoScore = summary?.eco_score ?? profile?.eco_score ?? 100;
  const ecoLevel = summary?.eco_level ?? 'Eco Champion';
  const totalEmissions = summary?.total_emissions ?? (latest?.total_emission ?? 0);
  const calculationCount = summary?.total_calculations ?? 0;

  // Breakdown across the 7 categories
  const breakdown = latest?.breakdown || summary?.breakdown || {
    transportation: 0,
    electricity: 0,
    diet: 0,
    waste: 0,
    lpg: 0,
    flight: 0,
    water: 0,
  };

  const categoryLabels = [
    'Transportation',
    'Electricity',
    'Diet',
    'Waste',
    'LPG',
    'Flight',
    'Water',
  ];

  const categoryValues = [
    Number(breakdown.transportation || 0),
    Number(breakdown.electricity || 0),
    Number(breakdown.diet || 0),
    Number(breakdown.waste || 0),
    Number(breakdown.lpg || 0),
    Number(breakdown.flight || 0),
    Number(breakdown.water || 0),
  ];

  const chartColors = [
    '#3b82f6', // Transportation - blue
    '#f59e0b', // Electricity - amber
    '#10b981', // Diet - emerald
    '#6366f1', // Waste - indigo
    '#ef4444', // LPG - red
    '#8b5cf6', // Flight - purple
    '#06b6d4', // Water - cyan
  ];

  const hasData = categoryValues.some((v) => v > 0);

  const doughnutData = {
    labels: categoryLabels,
    datasets: [
      {
        data: hasData ? categoryValues : [1, 1, 1, 1, 1, 1, 1],
        backgroundColor: hasData
          ? chartColors
          : ['#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0', '#e2e8f0'],
        borderWidth: 2,
        borderColor: '#ffffff',
      },
    ],
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          boxWidth: 12,
          padding: 12,
          font: { family: 'Poppins', size: 12 },
        },
      },
      tooltip: {
        callbacks: {
          label: (ctx) => {
            if (!hasData) return 'No data logged yet';
            const val = ctx.raw || 0;
            return ` ${ctx.label}: ${val.toFixed(2)} kg CO2e`;
          },
        },
      },
    },
    cutout: '68%',
  };

  return (
    <div className="py-4">
      <div className="container">
        {/* Welcome Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill small fw-semibold">
              <i className="bi bi-clock me-1"></i> Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
            </span>
            <h2 className="fw-bold text-dark mt-2 mb-0">
              Welcome back, {profile?.full_name || user?.email?.split('@')[0]}!
            </h2>
            <p className="text-muted small mb-0">Here is your updated carbon footprint and environmental score overview.</p>
          </div>
          <div className="d-flex gap-2">
            <Link to="/calculator" className="btn btn-eco-primary d-flex align-items-center gap-2">
              <i className="bi bi-plus-circle"></i> Log Calculation
            </Link>
            <Link to="/recommendations" className="btn btn-outline-secondary d-flex align-items-center gap-2">
              <i className="bi bi-stars text-warning"></i> AI Insights
            </Link>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i> {error}
          </div>
        )}

        {/* 4 Metric Cards */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">Eco Score</span>
                <div className="icon-circle bg-success-subtle text-success" style={{ width: '38px', height: '38px' }}>
                  <i className="bi bi-speedometer2"></i>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-success">{Math.round(ecoScore)}</h3>
                <span className="text-muted small">/ 100</span>
              </div>
              <div className="mt-2">
                <EcoScoreBadge score={ecoScore} level={ecoLevel} size="sm" />
              </div>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">Total Footprint</span>
                <div className="icon-circle bg-primary-subtle text-primary" style={{ width: '38px', height: '38px' }}>
                  <i className="bi bi-cloud-haze2"></i>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-dark">{Number(totalEmissions).toFixed(1)}</h3>
                <span className="text-muted small">kg CO2e</span>
              </div>
              <p className="text-muted small mt-2 mb-0">
                {totalEmissions > 160 ? (
                  <span className="text-danger"><i className="bi bi-arrow-up-right me-1"></i>Above national avg</span>
                ) : (
                  <span className="text-success"><i className="bi bi-arrow-down-right me-1"></i>Within green limits</span>
                )}
              </p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">Logged Records</span>
                <div className="icon-circle bg-warning-subtle text-warning-emphasis" style={{ width: '38px', height: '38px' }}>
                  <i className="bi bi-journal-check"></i>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-dark">{calculationCount}</h3>
                <span className="text-muted small">audits</span>
              </div>
              <p className="text-muted small mt-2 mb-0">
                <Link to="/history" className="text-decoration-none text-muted">
                  View full history <i className="bi bi-chevron-right small"></i>
                </Link>
              </p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <div className="d-flex justify-content-between align-items-start mb-2">
                <span className="text-muted small fw-semibold">Target Reduction</span>
                <div className="icon-circle bg-info-subtle text-info" style={{ width: '38px', height: '38px' }}>
                  <i className="bi bi-bullseye"></i>
                </div>
              </div>
              <div className="d-flex align-items-baseline gap-2">
                <h3 className="fw-bold mb-0 text-info">15%</h3>
                <span className="text-muted small">monthly goal</span>
              </div>
              <p className="text-muted small mt-2 mb-0">
                <span className="badge bg-info-subtle text-info">On Track</span>
              </p>
            </div>
          </div>
        </div>

        {/* Charts and Category breakdown */}
        <div className="row g-4 mb-4">
          <div className="col-lg-5">
            <div className="eco-card p-4 h-100 d-flex flex-column">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">Emissions Breakdown</h5>
                <span className="badge bg-light text-muted border">Latest Audit</span>
              </div>
              <div className="flex-grow-1 position-relative" style={{ minHeight: '260px' }}>
                <Doughnut data={doughnutData} options={doughnutOptions} />
              </div>
              {!hasData && (
                <div className="text-center mt-3">
                  <p className="text-muted small mb-2">No emission data recorded yet.</p>
                  <Link to="/calculator" className="btn btn-sm btn-outline-success">
                    Run First Calculation
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-7">
            <div className="eco-card p-4 h-100">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">Sector Breakdown (kg CO2e)</h5>
                <Link to="/analytics" className="text-success small fw-semibold text-decoration-none">
                  Detailed Trends <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              <div className="d-flex flex-column gap-3">
                {categoryLabels.map((cat, idx) => {
                  const val = categoryValues[idx];
                  const percent = totalEmissions > 0 ? ((val / totalEmissions) * 100).toFixed(1) : 0;
                  const icons = [
                    'bi-car-front',
                    'bi-lightning-charge',
                    'bi-cup-hot',
                    'bi-trash',
                    'bi-fire',
                    'bi-airplane',
                    'bi-droplet',
                  ];

                  return (
                    <div key={cat}>
                      <div className="d-flex justify-content-between align-items-center mb-1 small">
                        <span className="fw-semibold text-dark d-flex align-items-center gap-2">
                          <i className={`bi ${icons[idx]}`} style={{ color: chartColors[idx] }}></i>
                          {cat}
                        </span>
                        <div className="text-muted">
                          <span className="fw-bold text-dark">{val.toFixed(2)}</span> kg ({percent}%)
                        </div>
                      </div>
                      <div className="progress" style={{ height: '7px' }}>
                        <div
                          className="progress-bar rounded-pill"
                          role="progressbar"
                          style={{
                            width: `${Math.min(percent, 100)}%`,
                            backgroundColor: chartColors[idx],
                          }}
                          aria-valuenow={percent}
                          aria-valuemin="0"
                          aria-valuemax="100"
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions & AI Recommendations Highlight */}
        <div className="row g-4">
          <div className="col-lg-8">
            <div className="eco-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-stars text-warning"></i> AI Action Recommendations
                </h5>
                <Link to="/recommendations" className="text-success small fw-semibold text-decoration-none">
                  All Recommendations <i className="bi bi-arrow-right"></i>
                </Link>
              </div>

              {summary?.recommendations && summary.recommendations.length > 0 ? (
                <div className="d-flex flex-column gap-3">
                  {summary.recommendations.slice(0, 3).map((rec, i) => (
                    <div key={i} className="p-3 rounded-3 bg-light border d-flex gap-3 align-items-start">
                      <div className="rounded-circle bg-success-subtle text-success p-2 fs-5 mt-1">
                        <i className="bi bi-lightbulb"></i>
                      </div>
                      <div className="flex-grow-1">
                        <h6 className="fw-bold mb-1 text-dark">{rec.title || `Eco Action #${i + 1}`}</h6>
                        <p className="text-muted small mb-1">{rec.description || rec.action || rec}</p>
                        {rec.potential_saving && (
                          <span className="badge bg-success-subtle text-success small">
                            Save ~{rec.potential_saving} kg CO2e / month
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 rounded-3 bg-light text-center">
                  <i className="bi bi-stars fs-1 text-warning mb-2 d-block"></i>
                  <h6 className="fw-bold">Ready for Personalized AI Climate Tips?</h6>
                  <p className="text-muted small mb-3">
                    Our Groq AI engine analyzes your carbon footprint profile to recommend the most cost-effective green swaps.
                  </p>
                  <Link to="/recommendations" className="btn btn-eco-primary btn-sm px-3">
                    Generate AI Eco Tips
                  </Link>
                </div>
              )}
            </div>
          </div>

          <div className="col-lg-4">
            <div className="eco-card p-4 h-100 d-flex flex-column">
              <h5 className="fw-bold text-dark mb-3">Quick Actions</h5>
              <div className="d-flex flex-column gap-2 flex-grow-1">
                <Link to="/calculator" className="btn btn-light border text-start py-2 d-flex align-items-center gap-3">
                  <i className="bi bi-calculator text-success fs-5"></i>
                  <div>
                    <div className="fw-semibold small text-dark">Run New Calculation</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Quantify 7 sectors</div>
                  </div>
                </Link>
                <Link to="/analytics" className="btn btn-light border text-start py-2 d-flex align-items-center gap-3">
                  <i className="bi bi-graph-up text-primary fs-5"></i>
                  <div>
                    <div className="fw-semibold small text-dark">Emission Analytics</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Historical line graphs</div>
                  </div>
                </Link>
                <Link to="/history" className="btn btn-light border text-start py-2 d-flex align-items-center gap-3">
                  <i className="bi bi-file-earmark-arrow-down text-info fs-5"></i>
                  <div>
                    <div className="fw-semibold small text-dark">Export CSV / PDF</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Download reports</div>
                  </div>
                </Link>
                <Link to="/feedback" className="btn btn-light border text-start py-2 d-flex align-items-center gap-3">
                  <i className="bi bi-chat-heart text-danger fs-5"></i>
                  <div>
                    <div className="fw-semibold small text-dark">Give Feedback</div>
                    <div className="text-muted" style={{ fontSize: '0.75rem' }}>Share suggestions</div>
                  </div>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
