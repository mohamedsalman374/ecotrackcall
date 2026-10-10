import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import LoadingSpinner from '../../components/common/LoadingSpinner';

/**
 * Parses and formats AI markdown responses into structured, aligned React elements
 * Eliminates raw markdown syntax (**, ###, ---, -) and hanging dash misalignments
 */
function renderFormattedMarkdown(content) {
  if (!content) return null;

  const renderInline = (str) => {
    if (!str) return '';
    let text = str;
    const count = (text.match(/\*\*/g) || []).length;
    if (count % 2 !== 0) {
      text = text + '**';
    }
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i} className="text-dark fw-semibold">{part.slice(2, -2)}</strong>;
      }
      return part;
    });
  };

  const lines = content.split('\n');
  const elements = [];
  let listBuffer = [];

  const flushList = () => {
    if (listBuffer.length > 0) {
      elements.push(
        <ul key={`list-${elements.length}`} className="list-unstyled ps-0 mb-3 d-flex flex-column gap-2">
          {listBuffer.map((item, idx) => (
            <li key={idx} className="d-flex align-items-start gap-2">
              <i className="bi bi-check2-circle text-success flex-shrink-0 mt-1" style={{ fontSize: '0.95rem' }}></i>
              <span className="small text-secondary lh-base flex-grow-1">
                {renderInline(item)}
              </span>
            </li>
          ))}
        </ul>
      );
      listBuffer = [];
    }
  };

  lines.forEach((rawLine, idx) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      return;
    }

    // Dividers: --- or ***
    if (/^[-*_]{3,}$/.test(line)) {
      flushList();
      elements.push(<hr key={`hr-${idx}`} className="my-3 border-secondary border-opacity-25" />);
      return;
    }

    // Headings: ###
    if (line.startsWith('###')) {
      flushList();
      const text = line.replace(/^###\s*/, '');
      elements.push(
        <h6 key={`h6-${idx}`} className="fw-bold text-dark mt-3 mb-2 d-flex align-items-center gap-2">
          <i className="bi bi-bookmark-star-fill text-success small"></i>
          {renderInline(text)}
        </h6>
      );
      return;
    }

    // Headings: ##
    if (line.startsWith('##')) {
      flushList();
      const text = line.replace(/^##\s*/, '');
      elements.push(
        <h5 key={`h5-${idx}`} className="fw-bold text-dark mt-3 mb-2">
          {renderInline(text)}
        </h5>
      );
      return;
    }

    // Headings: #
    if (line.startsWith('#')) {
      flushList();
      const text = line.replace(/^#\s*/, '');
      elements.push(
        <h5 key={`h4-${idx}`} className="fw-bold text-dark mt-3 mb-2">
          {renderInline(text)}
        </h5>
      );
      return;
    }

    // Bullet items: - or *
    if (/^[-*]\s+/.test(line)) {
      listBuffer.push(line.replace(/^[-*]\s+/, ''));
      return;
    }

    // Numbered list items: 1. or 2.
    if (/^\d+\.\s+/.test(line)) {
      listBuffer.push(line.replace(/^\d+\.\s+/, ''));
      return;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${idx}`} className="small text-secondary mb-2 lh-base">
        {renderInline(line)}
      </p>
    );
  });

  flushList();
  return elements;
}

export default function Recommendations() {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [customPrompt, setCustomPrompt] = useState('');
  const [customResponse, setCustomResponse] = useState('');
  const [error, setError] = useState('');

  // Local interactive challenges state
  const [challenges, setChallenges] = useState([
    { id: 1, title: 'Meatless Monday', desc: 'Swap out meat for whole plant protein for an entire day.', completed: false, saving: '3.5 kg' },
    { id: 2, title: 'Off-Peak Appliance Run', desc: 'Run washing machines and heavy appliances during off-peak grid hours.', completed: true, saving: '1.2 kg' },
    { id: 3, title: 'Active Transit Day', desc: 'Walk, cycle, or take the metro instead of a personal vehicle.', completed: false, saving: '4.8 kg' },
    { id: 4, title: 'Zero Food Waste Week', desc: 'Plan meals in advance and compost organic vegetable peelings.', completed: false, saving: '2.0 kg' },
  ]);

  useEffect(() => {
    async function fetchRecs() {
      try {
        setLoading(true);
        const data = await api.ai.getRecommendations();
        if (data && data.recommendations) {
          setRecommendations(data.recommendations);
        }
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        setError('Could not load AI recommendations. You can generate custom tips below.');
      } finally {
        setLoading(false);
      }
    }

    fetchRecs();
  }, []);

  const handleCustomGenerate = async (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;

    setGenerating(true);
    setCustomResponse('');
    setError('');

    try {
      const res = await api.ai.generate(customPrompt);
      if (res && res.response) {
        setCustomResponse(res.response);
      } else if (res && res.text) {
        setCustomResponse(res.text);
      } else {
        setCustomResponse(JSON.stringify(res, null, 2));
      }
    } catch (err) {
      console.error('AI generation error:', err);
      setError(err.message || 'Failed to generate custom AI recommendations.');
    } finally {
      setGenerating(false);
    }
  };

  const toggleChallenge = (id) => {
    setChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, completed: !c.completed } : c))
    );
  };

  return (
    <div className="py-4">
      <div className="container">
        {/* Header */}
        <div className="d-flex flex-column flex-md-row justify-content-between align-items-md-center gap-3 mb-4">
          <div>
            <span className="badge bg-warning-subtle text-warning-emphasis px-3 py-1 rounded-pill small fw-semibold">
              <i className="bi bi-cpu-fill me-1"></i> Groq AI Ultra-Fast Intelligence
            </span>
            <h2 className="fw-bold text-dark mt-2 mb-1">Personalized Eco Recommendations</h2>
            <p className="text-muted small mb-0">
              Science-backed, prioritized action items tailored to your highest emission sectors.
            </p>
          </div>
          <div>
            <span className="badge bg-success-subtle text-success p-2 px-3 rounded-pill">
              <i className="bi bi-shield-check me-1"></i> Tailored to Your Profile
            </span>
          </div>
        </div>

        {error && (
          <div className="alert alert-warning alert-dismissible fade show" role="alert">
            <i className="bi bi-exclamation-triangle me-2"></i> {error}
          </div>
        )}

        {/* AI Recommendations Grid */}
        <div className="mb-5">
          <h4 className="fw-bold text-dark mb-3 d-flex align-items-center gap-2">
            <i className="bi bi-lightbulb-fill text-warning"></i> Recommended Action Plan
          </h4>

          {loading ? (
            <LoadingSpinner message="Consulting Groq AI engine for your personalized reduction plan..." />
          ) : recommendations.length > 0 ? (
            <div className="row g-4">
              {recommendations.map((rec, idx) => (
                <div key={idx} className="col-md-6 col-lg-4">
                  <div className="eco-card p-4 h-100 d-flex flex-column">
                    <div className="d-flex justify-content-between align-items-start mb-2">
                      <span className="badge bg-success-subtle text-success small">
                        {rec.category || 'Lifestyle Swap'}
                      </span>
                      {rec.impact && (
                        <span className={`badge ${rec.impact === 'High' ? 'bg-danger-subtle text-danger' : 'bg-primary-subtle text-primary'} small`}>
                          {rec.impact} Impact
                        </span>
                      )}
                    </div>

                    <h5 className="fw-bold text-dark mt-2 mb-2">{rec.title || `Eco Action #${idx + 1}`}</h5>
                    <p className="text-muted small flex-grow-1 mb-3">
                      {rec.description || rec.action || rec}
                    </p>

                    <div className="pt-3 border-top d-flex justify-content-between align-items-center small">
                      {rec.potential_saving ? (
                        <span className="text-success fw-bold">
                          <i className="bi bi-arrow-down me-1"></i>-{rec.potential_saving} kg CO2e
                        </span>
                      ) : (
                        <span className="text-muted">High ROI green action</span>
                      )}
                      <span className="text-muted">Sector priority</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="eco-card p-4 text-center">
              <p className="text-muted mb-3">
                No specific recommendations found. Please log a calculation first so Groq AI can evaluate your sectors.
              </p>
            </div>
          )}
        </div>

        {/* Ask Groq AI Anything (Interactive AI Query) */}
        <div className="row g-4 mb-5 align-items-start">
          <div className="col-lg-7">
            <div className="eco-card p-4">
              <h5 className="fw-bold text-dark mb-2 d-flex align-items-center gap-2">
                <i className="bi bi-chat-left-dots-fill text-success"></i> Ask Groq AI Eco-Coach
              </h5>
              <p className="text-muted small mb-3">
                Have specific constraints (e.g. rented apartment, frequent commuter, college student budget)? Ask for customized strategies.
              </p>

              <form onSubmit={handleCustomGenerate}>
                <div className="mb-3">
                  <textarea
                    className="form-control"
                    rows="3"
                    placeholder="e.g., How can I reduce electricity consumption during summer in a shared 2BHK apartment without compromising cooling?"
                    value={customPrompt}
                    onChange={(e) => setCustomPrompt(e.target.value)}
                    required
                  ></textarea>
                </div>
                <button
                  type="submit"
                  className="btn btn-eco-primary btn-sm d-flex align-items-center gap-2"
                  disabled={generating}
                >
                  {generating ? (
                    <>
                      <span className="spinner-border spinner-border-sm" role="status"></span>
                      Generating Advice with Groq AI...
                    </>
                  ) : (
                    <>
                      <i className="bi bi-stars text-warning"></i> Generate Custom AI Strategy
                    </>
                  )}
                </button>
              </form>

              {customResponse && (
                <div className="mt-4 p-4 rounded-3 bg-white border shadow-sm animate-fade-in">
                  <div className="d-flex justify-content-between align-items-center pb-2 mb-3 border-bottom">
                    <div className="d-flex align-items-center gap-2">
                      <span className="badge bg-success-subtle text-success px-2 py-1 small fw-semibold">
                        <i className="bi bi-robot me-1"></i> Groq Advisor
                      </span>
                      <span className="text-muted small">Personalized Sustainability Strategy</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline-secondary btn-sm py-0 px-2"
                      onClick={() => setCustomResponse('')}
                      title="Clear Response"
                    >
                      <i className="bi bi-x-lg"></i>
                    </button>
                  </div>
                  <div className="ai-formatted-response text-start">
                    {renderFormattedMarkdown(customResponse)}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Green Challenges Tracker */}
          <div className="col-lg-5">
            <div className="eco-card p-4">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <h5 className="fw-bold text-dark mb-0 d-flex align-items-center gap-2">
                  <i className="bi bi-trophy-fill text-warning"></i> Weekly Challenges
                </h5>
                <span className="badge bg-success-subtle text-success small">
                  {challenges.filter((c) => c.completed).length} / {challenges.length} Done
                </span>
              </div>

              <div className="d-flex flex-column gap-3">
                {challenges.map((c) => (
                  <div
                    key={c.id}
                    className={`p-3 rounded-3 border cursor-pointer d-flex gap-3 align-items-start ${
                      c.completed ? 'bg-success-subtle border-success' : 'bg-light'
                    }`}
                    onClick={() => toggleChallenge(c.id)}
                  >
                    <input
                      type="checkbox"
                      className="form-check-input mt-1"
                      checked={c.completed}
                      onChange={() => toggleChallenge(c.id)}
                    />
                    <div className="flex-grow-1">
                      <div className="d-flex justify-content-between">
                        <h6 className={`fw-bold mb-1 small ${c.completed ? 'text-decoration-line-through text-success' : 'text-dark'}`}>
                          {c.title}
                        </h6>
                        <span className="badge bg-light text-muted border" style={{ fontSize: '0.7rem' }}>
                          Save ~{c.saving}
                        </span>
                      </div>
                      <p className="text-muted mb-0" style={{ fontSize: '0.8rem' }}>
                        {c.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
