import React, { useState } from 'react';
import './ClarificationState.css';

/**
 * Presents one clarification question at a time.
 * onAnswer(value) — called with user's text input or null ("I don't know").
 */
export default function ClarificationState({ question, onAnswer }) {
  const [value, setValue] = useState('');
  const [skipped, setSkipped] = useState(false);

  if (skipped) {
    return (
      <section className="clarification-section animate-fade-in">
        <div className="clarification-card">
          <div className="clarification-skipped">
            <span className="skip-icon" aria-hidden="true">✓</span>
            <p>No problem. We'll continue with the information available.</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="clarification-section animate-fade-in">
      <div className="clarification-card">
        <div className="clarification-badge">
          <span>One detail could improve this assessment</span>
        </div>

        <p className="clarification-context">{question.context}</p>

        <h2 className="clarification-question">{question.question}</h2>

        <div className="clarification-input-row">
          <input
            id="clarification-input"
            type="text"
            className="field-input clarification-input"
            placeholder="Enter your answer..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && value.trim() && onAnswer(value.trim())}
            autoFocus
          />
        </div>

        <div className="clarification-actions">
          <button
            id="clarification-continue-btn"
            className="btn btn-primary"
            disabled={!value.trim()}
            onClick={() => onAnswer(value.trim())}
          >
            Continue
          </button>
          <button
            id="clarification-skip-btn"
            className="btn btn-ghost"
            onClick={() => {
              setSkipped(true);
              setTimeout(() => onAnswer(null), 1200);
            }}
          >
            I don't know
          </button>
        </div>
      </div>
    </section>
  );
}
