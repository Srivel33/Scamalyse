import React, { useState } from 'react';
import { submitFeedback } from '../services/api';
import './FeedbackSection.css';

const OPTIONS = [
  { id: 'suspicious', label: 'Confirmed suspicious', icon: '🚩', colorClass: 'opt-high' },
  { id: 'legitimate', label: 'Verified legitimate', icon: '✓', colorClass: 'opt-low' },
  { id: 'unsure', label: 'Still unsure', icon: '?', colorClass: 'opt-neutral' },
];

export default function FeedbackSection({ analysisHash }) {
  const [selected, setSelected] = useState(null);
  const [context, setContext] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  function handleSelect(id) {
    if (submitted || isSubmitting) return;
    setSelected(id);
    setError(null);
  }

  async function handleSubmit() {
    if (!selected || !analysisHash) return;
    setIsSubmitting(true);
    setError(null);
    try {
      let mappedType = selected;
      if (selected === 'suspicious') mappedType = 'scam';
      if (selected === 'legitimate') mappedType = 'not_scam';
      
      await submitFeedback(analysisHash, mappedType, context);
      setSubmitted(true);
    } catch (err) {
      setError(err.message || 'Failed to submit feedback.');
    } finally {
      setIsSubmitting(false);
    }
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
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Submitting...' : 'Submit feedback'}
              </button>
            </div>
          )}
          {error && <p className="validation-msg" style={{marginTop: '12px'}}>{error}</p>}
        </div>
      )}

      <p className="feedback-caveat">
        Your feedback is treated as unverified context and does not automatically change the risk indicator.
      </p>
    </div>
  );
}
