import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../../services/api';
import EcoScoreBadge from '../../components/common/EcoScoreBadge';

export default function Calculator() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);

  // Form state across 7 categories
  const [formData, setFormData] = useState({
    // 1. Transportation
    transport_type: 'petrol_car',
    distance_km: 150,
    carpool_passengers: 1,

    // 2. Electricity
    electricity_kwh: 180,
    renewable_percentage: 0,

    // 3. Diet
    diet_type: 'medium_meat',
    local_food_ratio: 50,

    // 4. Waste
    waste_kg: 25,
    recycling_percent: 20,
    composting: false,

    // 5. LPG
    lpg_cylinders: 1,

    // 6. Flight
    flight_short_haul_hours: 0,
    flight_long_haul_hours: 0,

    // 7. Water
    water_liters: 150,
  });

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const tabs = [
    { id: 'transport', label: '🚗 Transport', icon: 'bi-car-front' },
    { id: 'electricity', label: '⚡ Electricity', icon: 'bi-lightning-charge' },
    { id: 'diet', label: '🥗 Diet', icon: 'bi-cup-hot' },
    { id: 'waste', label: '🗑️ Waste', icon: 'bi-trash' },
    { id: 'lpg', label: '🔥 LPG Gas', icon: 'bi-fire' },
    { id: 'flight', label: '✈️ Flights', icon: 'bi-airplane' },
    { id: 'water', label: '💧 Water', icon: 'bi-droplet' },
  ];

  const handleSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const data = await api.calculator.calculate(formData);
      setResult(data);
      // Scroll to results
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    } catch (err) {
      console.error('Calculation error:', err);
      setError(err.message || 'Failed to complete calculation. Please verify all inputs.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-4">
          <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill small fw-semibold mb-2">
            7-Sector Quantitative Assessment
          </span>
          <h2 className="fw-bold text-dark mb-1">Carbon Footprint Calculator</h2>
          <p className="text-muted small">
            Calculate your estimated monthly greenhouse gas emissions (in kg CO2e) calibrated to official IPCC emission standards.
          </p>
        </div>

        {error && (
          <div className="alert alert-danger d-flex align-items-center gap-2 mb-4" role="alert">
            <i className="bi bi-exclamation-triangle-fill"></i>
            <div>{error}</div>
          </div>
        )}

        <div className="row g-4">
          {/* Main Calculator Form */}
          <div className="col-lg-8">
            <div className="eco-card p-4">
              {/* Category Nav Tabs */}
              <div className="nav nav-pills nav-fill mb-4 p-1 bg-light rounded-3 gap-1 overflow-auto flex-nowrap flex-md-wrap">
                {tabs.map((tab, idx) => (
                  <button
                    key={tab.id}
                    type="button"
                    className={`nav-link text-nowrap rounded-2 small fw-semibold py-2 px-3 ${
                      activeTab === idx ? 'bg-success text-white shadow-sm' : 'text-secondary'
                    }`}
                    onClick={() => setActiveTab(idx)}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <form onSubmit={handleSubmit}>
                {/* 1. TRANSPORTATION */}
                {activeTab === 0 && (
                  <div className="animate-fade-in">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-car-front text-primary"></i> Daily & Monthly Travel
                    </h5>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Primary Mode of Commute</label>
                      <select
                        className="form-select"
                        value={formData.transport_type}
                        onChange={(e) => handleChange('transport_type', e.target.value)}
                      >
                        <option value="petrol_car">Petrol Car (Medium Sedan / Hatchback)</option>
                        <option value="diesel_car">Diesel Car (SUV / Sedan)</option>
                        <option value="electric_car">Electric Vehicle (Grid Charged)</option>
                        <option value="hybrid_car">Hybrid Vehicle</option>
                        <option value="motorcycle">Motorcycle / Scooter</option>
                        <option value="bus">Public City Bus</option>
                        <option value="train">Train / Metro Rail</option>
                        <option value="bicycle">Bicycle / Walking (Zero Emission)</option>
                      </select>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Monthly Travel Distance: <span className="text-success fw-bold">{formData.distance_km} km</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="2500"
                        step="10"
                        value={formData.distance_km}
                        onChange={(e) => handleChange('distance_km', Number(e.target.value))}
                      />
                      <div className="d-flex justify-content-between small text-muted">
                        <span>0 km</span>
                        <span>1,250 km</span>
                        <span>2,500 km</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 2. ELECTRICITY */}
                {activeTab === 1 && (
                  <div className="animate-fade-in">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-lightning-charge text-warning"></i> Household Electricity
                    </h5>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Monthly Electricity Consumption: <span className="text-success fw-bold">{formData.electricity_kwh} kWh</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="1000"
                        step="10"
                        value={formData.electricity_kwh}
                        onChange={(e) => handleChange('electricity_kwh', Number(e.target.value))}
                      />
                      <div className="d-flex justify-content-between small text-muted">
                        <span>0 kWh (Off-grid)</span>
                        <span>500 kWh</span>
                        <span>1000 kWh</span>
                      </div>
                      <small className="text-muted d-block mt-1">
                        Average 2-3 person household consumes ~150 - 250 kWh/month.
                      </small>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Renewable / Rooftop Solar Share: <span className="text-success fw-bold">{formData.renewable_percentage}%</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.renewable_percentage}
                        onChange={(e) => handleChange('renewable_percentage', Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {/* 3. DIET */}
                {activeTab === 2 && (
                  <div className="animate-fade-in">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-cup-hot text-success"></i> Dietary Pattern
                    </h5>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">Food Lifestyle</label>
                      <div className="row g-2">
                        {[
                          { val: 'vegan', label: '🌱 Vegan', sub: '100% plant based' },
                          { val: 'vegetarian', label: '🥗 Vegetarian', sub: 'Dairy & eggs included' },
                          { val: 'pescatarian', label: '🐟 Pescatarian', sub: 'Fish and plant-based' },
                          { val: 'low_meat', label: '🍗 Low Meat', sub: 'Meat 1-2 times weekly' },
                          { val: 'medium_meat', label: '🥩 Medium Meat', sub: 'Regular omnivore' },
                          { val: 'heavy_meat', label: '🍖 Heavy Meat', sub: 'Meat daily or multiple meals' },
                        ].map((d) => (
                          <div key={d.val} className="col-sm-6">
                            <div
                              className={`p-3 rounded-3 border cursor-pointer h-100 ${
                                formData.diet_type === d.val
                                  ? 'border-success bg-success-subtle text-dark'
                                  : 'bg-light text-secondary'
                              }`}
                              onClick={() => handleChange('diet_type', d.val)}
                            >
                              <div className="fw-bold small">{d.label}</div>
                              <div className="text-muted" style={{ fontSize: '0.75rem' }}>{d.sub}</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* 4. WASTE */}
                {activeTab === 3 && (
                  <div className="animate-fade-in">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-trash text-secondary"></i> Domestic Solid Waste
                    </h5>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Monthly Waste Generated: <span className="text-success fw-bold">{formData.waste_kg} kg</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="5"
                        max="150"
                        step="5"
                        value={formData.waste_kg}
                        onChange={(e) => handleChange('waste_kg', Number(e.target.value))}
                      />
                      <div className="d-flex justify-content-between small text-muted">
                        <span>5 kg</span>
                        <span>75 kg</span>
                        <span>150 kg</span>
                      </div>
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Percentage Recycled: <span className="text-success fw-bold">{formData.recycling_percent}%</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="100"
                        step="5"
                        value={formData.recycling_percent}
                        onChange={(e) => handleChange('recycling_percent', Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {/* 5. LPG */}
                {activeTab === 4 && (
                  <div className="animate-fade-in">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-fire text-danger"></i> LPG / Piped Natural Gas
                    </h5>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Monthly Cooking Gas (14.2 kg LPG Cylinders / Equivalents): <span className="text-success fw-bold">{formData.lpg_cylinders}</span>
                      </label>
                      <div className="d-flex align-items-center gap-3">
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleChange('lpg_cylinders', Math.max(0, formData.lpg_cylinders - 0.5))}
                        >
                          -
                        </button>
                        <span className="fs-4 fw-bold text-dark">{formData.lpg_cylinders}</span>
                        <button
                          type="button"
                          className="btn btn-outline-secondary"
                          onClick={() => handleChange('lpg_cylinders', formData.lpg_cylinders + 0.5)}
                        >
                          +
                        </button>
                        <span className="text-muted small">cylinders/mo</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* 6. FLIGHT */}
                {activeTab === 5 && (
                  <div className="animate-fade-in">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-airplane text-info"></i> Aviation & Flight Hours
                    </h5>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Short-haul Flight Hours (&lt; 3 hrs) per month: <span className="text-success fw-bold">{formData.flight_short_haul_hours} hrs</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="20"
                        step="1"
                        value={formData.flight_short_haul_hours}
                        onChange={(e) => handleChange('flight_short_haul_hours', Number(e.target.value))}
                      />
                    </div>

                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Long-haul Flight Hours (≥ 3 hrs) per month: <span className="text-success fw-bold">{formData.flight_long_haul_hours} hrs</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="0"
                        max="30"
                        step="1"
                        value={formData.flight_long_haul_hours}
                        onChange={(e) => handleChange('flight_long_haul_hours', Number(e.target.value))}
                      />
                    </div>
                  </div>
                )}

                {/* 7. WATER */}
                {activeTab === 6 && (
                  <div className="animate-fade-in">
                    <h5 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
                      <i className="bi bi-droplet text-primary"></i> Daily Water Consumption
                    </h5>
                    <div className="mb-3">
                      <label className="form-label small fw-semibold">
                        Daily Liters Used: <span className="text-success fw-bold">{formData.water_liters} L/day</span>
                      </label>
                      <input
                        type="range"
                        className="form-range"
                        min="50"
                        max="600"
                        step="25"
                        value={formData.water_liters}
                        onChange={(e) => handleChange('water_liters', Number(e.target.value))}
                      />
                      <div className="d-flex justify-content-between small text-muted">
                        <span>50 L</span>
                        <span>300 L</span>
                        <span>600 L</span>
                      </div>
                      <small className="text-muted d-block mt-1">Includes bathing, laundry, kitchen, and toilet flushing.</small>
                    </div>
                  </div>
                )}

                {/* Navigation and Submit Buttons */}
                <div className="d-flex justify-content-between align-items-center mt-4 pt-3 border-top">
                  <button
                    type="button"
                    className="btn btn-outline-secondary btn-sm"
                    disabled={activeTab === 0}
                    onClick={() => setActiveTab((prev) => Math.max(0, prev - 1))}
                  >
                    <i className="bi bi-arrow-left me-1"></i> Previous Sector
                  </button>

                  <div className="d-flex gap-2">
                    {activeTab < tabs.length - 1 ? (
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={() => setActiveTab((prev) => Math.min(tabs.length - 1, prev + 1))}
                      >
                        Next Sector <i className="bi bi-arrow-right ms-1"></i>
                      </button>
                    ) : null}

                    <button
                      type="submit"
                      className="btn btn-eco-primary btn-sm px-4"
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                          Calculating...
                        </>
                      ) : (
                        <>
                          <i className="bi bi-calculator me-1"></i> Calculate Footprint
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </div>
          </div>

          {/* Quick Summary Sidebar */}
          <div className="col-lg-4">
            <div className="eco-card p-4 h-100">
              <h5 className="fw-bold text-dark mb-3">Live Parameters</h5>
              <div className="d-flex flex-column gap-2 small">
                <div className="d-flex justify-content-between p-2 rounded bg-light">
                  <span className="text-muted">Travel:</span>
                  <span className="fw-semibold text-dark">{formData.distance_km} km ({formData.transport_type.replace('_', ' ')})</span>
                </div>
                <div className="d-flex justify-content-between p-2 rounded bg-light">
                  <span className="text-muted">Electricity:</span>
                  <span className="fw-semibold text-dark">{formData.electricity_kwh} kWh/mo</span>
                </div>
                <div className="d-flex justify-content-between p-2 rounded bg-light">
                  <span className="text-muted">Diet:</span>
                  <span className="fw-semibold text-dark text-capitalize">{formData.diet_type.replace('_', ' ')}</span>
                </div>
                <div className="d-flex justify-content-between p-2 rounded bg-light">
                  <span className="text-muted">Waste:</span>
                  <span className="fw-semibold text-dark">{formData.waste_kg} kg/mo ({formData.recycling_percent}% recycled)</span>
                </div>
                <div className="d-flex justify-content-between p-2 rounded bg-light">
                  <span className="text-muted">LPG:</span>
                  <span className="fw-semibold text-dark">{formData.lpg_cylinders} cylinders</span>
                </div>
                <div className="d-flex justify-content-between p-2 rounded bg-light">
                  <span className="text-muted">Flights:</span>
                  <span className="fw-semibold text-dark">{formData.flight_short_haul_hours + formData.flight_long_haul_hours} total hrs</span>
                </div>
                <div className="d-flex justify-content-between p-2 rounded bg-light">
                  <span className="text-muted">Water:</span>
                  <span className="fw-semibold text-dark">{formData.water_liters} L/day</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-top">
                <button
                  type="button"
                  className="btn btn-eco-primary w-100 py-2"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  <i className="bi bi-lightning-charge me-1"></i> Compute Total Footprint
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Results Showcase Section */}
        {result && (
          <div className="mt-5 animate-fade-in" id="resultsSection">
            <div className="eco-card p-4 p-md-5 border-success">
              <div className="row align-items-center g-4">
                <div className="col-md-5 text-center text-md-start">
                  <span className="badge bg-success-subtle text-success px-3 py-1 rounded-pill small fw-semibold mb-2">
                    Audit Result Generated
                  </span>
                  <h2 className="display-6 fw-bold text-dark mb-1">
                    {Number(result.total_emission).toFixed(2)}{' '}
                    <span className="fs-5 text-muted fw-normal">kg CO2e / month</span>
                  </h2>
                  <div className="my-3">
                    <EcoScoreBadge score={result.eco_score} level={result.eco_level} size="lg" />
                  </div>
                  <p className="text-muted small">
                    This footprint record is permanently saved in your Supabase profile. Compare with previous audits in Analytics.
                  </p>
                  <div className="d-flex flex-wrap gap-2 mt-3">
                    <button
                      type="button"
                      className="btn btn-eco-primary btn-sm"
                      onClick={() => navigate('/recommendations')}
                    >
                      <i className="bi bi-stars text-warning me-1"></i> AI Recommendations
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => navigate('/history')}
                    >
                      <i className="bi bi-clock-history me-1"></i> View History
                    </button>
                  </div>
                </div>

                <div className="col-md-7">
                  <h6 className="fw-bold text-dark mb-3">Emissions by Sector</h6>
                  <div className="row g-2">
                    {result.breakdown &&
                      Object.entries(result.breakdown).map(([cat, val]) => (
                        <div key={cat} className="col-6 col-sm-4">
                          <div className="p-3 rounded-3 bg-light border text-center">
                            <span className="text-muted small text-capitalize d-block">{cat}</span>
                            <span className="fw-bold fs-5 text-dark">{Number(val).toFixed(1)}</span>
                            <span className="text-muted" style={{ fontSize: '0.75rem' }}> kg</span>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
