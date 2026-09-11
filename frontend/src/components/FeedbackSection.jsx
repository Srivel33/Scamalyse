import React, { useState } from 'react';
import './FeedbackSection.css';

const OPTIONS = [
  { id: 'suspicious', label: 'Confirmed suspicious', icon: '🚩', colorClass: 'opt-high' },
  { id: 'legitimate', label: 'Verified legitimate', icon: '✓', colorClass: 'opt-low' },
  { id: 'unsure', label: 'Still unsure', icon: '?', colorClass: 'opt-neutral' },
];

export default function FeedbackSection() {
  const [selected, setSelected] = useState(null);
  const [context, setContext] = useState('');
  const [submitted, setSubmitted] = useState(false);

  function handleSelect(id) {
    if (submitted) return;
    setSelected(id);
  }

  function handleSubmit() {
    if (!selected) return;
    setSubmitted(true);
  }

  return (
    <div className="feedback-section">
      <div className="result-section-header">
        <h2 className="result-section-title">Help us understand what you found</h2>
        <p className="result-section-sub">Did you independently verify this opportunity?</p>
      </div>

      {submitted ? (
        <div className="feedback-thanks animate-fade-in">
          <div className="thanks-icon-wrap"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg></div>
          <p>Thank you for your feedback. It helps us improve.</p>
        </div>
      ) : (
        <div className="feedback-form">
          <div className="feedback-options" role="group" aria-label="Verification outcome">
            {OPTIONS.map((opt) => (
              <button
                key={opt.id}
                id={`feedback-${opt.id}`}
                type="button"
                className={`feedback-option ${selected === opt.id ? 'is-selected' : ''} ${opt.colorClass}`}
                onClick={() => handleSelect(opt.id)}
                aria-pressed={selected === opt.id}
              >
                <span className="feedback-opt-icon" aria-hidden="true">{opt.icon}</span>
                <span className="feedback-opt-label">{opt.label}</span>
              </button>
            ))}
          </div>

          {selected && (
            <div className="feedback-context animate-fade-in">
              <label htmlFor="feedback-context-input" className="sr-only">Additional context (optional)</label>
              <textarea
                id="feedback-context-input"
                className="feedback-textarea"
                rows="3"
                placeholder="Additional context (optional)"
                value={context}
                onChange={(e) => setContext(e.target.value)}
              />
              <button
                id="feedback-submit-btn"
                className="btn btn-secondary feedback-submit"
                onClick={handleSubmit}
              >
                Submit feedback
              </button>
            </div>
          )}
        </div>
      )}

      <p className="feedback-caveat">
        Your feedback is treated as unverified context and does not automatically change the risk indicator.
      </p>
    </div>
  );
}
