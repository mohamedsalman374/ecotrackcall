import React, { useState, useEffect } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export default function Analytics() {
  const [range, setRange] = useState('all');
  const [analyticsData, setAnalyticsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await api.analytics.getData(range);
        setAnalyticsData(data);
      } catch (err) {
        console.error('Analytics load error:', err);
        setError(err.message || 'Failed to load analytics.');
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, [range]);

  if (loading) {
    return <LoadingSpinner message="Calculating trends and generating analytical models..." />;
  }

  const trends = analyticsData?.trends || analyticsData?.history || [];
  const averages = analyticsData?.averages || {};
  const totalAudits = trends.length;

  // Prepare line chart labels and data points
  const lineLabels = trends.map((item, idx) => {
    if (item.date) {
      return new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
    return `Audit #${idx + 1}`;
  });

  const emissionValues = trends.map((item) => Number(item.total_emission || item.total || 0));
  const scoreValues = trends.map((item) => Number(item.eco_score || 0));

  const lineChartData = {
    labels: lineLabels.length > 0 ? lineLabels : ['No records'],
    datasets: [
      {
        label: 'Your Emissions (kg CO2e)',
        data: emissionValues.length > 0 ? emissionValues : [0],
        borderColor: '#10b981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        tension: 0.35,
        fill: true,
        pointBackgroundColor: '#059669',
        pointRadius: 5,
      },
      {
        label: 'Target Benchmark (160 kg CO2e)',
        data: Array(lineLabels.length || 1).fill(160),
        borderColor: '#ef4444',
        borderDash: [5, 5],
        borderWidth: 1.5,
        pointRadius: 0,
        fill: false,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top' },
      tooltip: { mode: 'index', intersect: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'kg CO2e' },
      },
    },
  };

  // Category comparisons bar chart
  const categories = ['transportation', 'electricity', 'diet', 'waste', 'lpg', 'flight', 'water'];
  const catLabels = ['Transport', 'Electricity', 'Diet', 'Waste', 'LPG', 'Flight', 'Water'];
  const catAvgValues = categories.map((cat) => Number(averages[cat] || 0));

  const barChartData = {
    labels: catLabels,
    datasets: [
      {
        label: 'Average Emissions (kg CO2e)',
        data: catAvgValues,
        backgroundColor: [
          '#3b82f6',
          '#f59e0b',
          '#10b981',
          '#6366f1',
          '#ef4444',
          '#8b5cf6',
          '#06b6d4',
        ],
        borderRadius: 8,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        title: { display: true, text: 'kg CO2e' },
      },
    },
  };

  return (
    <div className="py-4">
      <div className="container">
        {/* Header & Filter Controls */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <span className="badge bg-primary-subtle text-primary px-3 py-1 rounded-pill small fw-semibold">
              <i className="bi bi-graph-up-arrow me-1"></i> Longitudinal Performance
            </span>
            <h2 className="fw-bold text-dark mt-2 mb-1">Analytics & Emission Trends</h2>
            <p className="text-muted small mb-0">Track your environmental trajectory over time and benchmark against targets.</p>
          </div>

          <div className="d-flex align-items-center gap-2">
            <span className="small text-muted fw-semibold">Period:</span>
            <div className="btn-group btn-group-sm" role="group">
              {[
                { id: '1m', label: '1M' },
                { id: '3m', label: '3M' },
                { id: '6m', label: '6M' },
                { id: '1y', label: '1Y' },
                { id: 'all', label: 'All' },
              ].map((p) => (
                <button
                  key={p.id}
                  type="button"
                  className={`btn ${range === p.id ? 'btn-success' : 'btn-outline-secondary'}`}
                  onClick={() => setRange(p.id)}
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i> {error}
          </div>
        )}

        {/* 4 Summary Stat Cards */}
        <div className="row g-3 mb-4">
          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Average Emission</span>
              <h3 className="fw-bold text-dark mt-2 mb-1">
                {Number(analyticsData?.average_emission || 0).toFixed(1)}{' '}
                <span className="fs-6 text-muted fw-normal">kg/mo</span>
              </h3>
              <p className="text-muted small mb-0">Mean per recorded period</p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Highest Sector</span>
              <h3 className="fw-bold text-danger mt-2 mb-1 text-capitalize">
                {analyticsData?.highest_category || 'N/A'}
              </h3>
              <p className="text-muted small mb-0">Prime target for reduction</p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Net Reduction</span>
              <h3 className="fw-bold text-success mt-2 mb-1">
                {Number(analyticsData?.total_reduction || 0).toFixed(1)}{' '}
                <span className="fs-6 text-muted fw-normal">kg CO2e</span>
              </h3>
              <p className="text-muted small mb-0">Avoided from initial baseline</p>
            </div>
          </div>

          <div className="col-sm-6 col-lg-3">
            <div className="eco-card p-3 p-xl-4 h-100">
              <span className="text-muted small fw-semibold">Tracked Audits</span>
              <h3 className="fw-bold text-primary mt-2 mb-1">{totalAudits}</h3>
              <p className="text-muted small mb-0">Total logged entries</p>
            </div>
          </div>
        </div>

        {/* Line Chart */}
        <div className="row g-4 mb-4">
          <div className="col-12">
            <div className="eco-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">Carbon Emission Progression (kg CO2e)</h5>
                <span className="badge bg-light text-muted border">Trend Trajectory</span>
              </div>
              <div style={{ minHeight: '320px', height: '360px' }}>
                <Line data={lineChartData} options={lineChartOptions} />
              </div>
            </div>
          </div>
        </div>

        {/* Category Distribution Bar Chart */}
        <div className="row g-4">
          <div className="col-12">
            <div className="eco-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0">Average Sector Contribution Comparison</h5>
                <span className="badge bg-light text-muted border">Cross-Domain Breakdown</span>
              </div>
              <div style={{ minHeight: '300px', height: '320px' }}>
                <Bar data={barChartData} options={barChartOptions} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
