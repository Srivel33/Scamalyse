import React, { useState } from 'react';
import './ExtractedFacts.css';

const LABELS = {
  company: 'Organisation',
  role: 'Role',
  opportunityType: 'Opportunity type',
  salaryClaim: 'Claimed earnings',
  paymentRequest: 'Payment request',
  paymentMethod: 'Payment method',
  contactMethod: 'Contact method',
  website: 'Website',
  urgency: 'Urgency',
  selectionProcess: 'Selection process',
  sensitiveInfoRequested: 'Sensitive info requested',
};

// Keys shown by default; rest expand with toggle.
const PRIMARY_KEYS = ['company', 'role', 'opportunityType', 'salaryClaim', 'paymentRequest'];

export default function ExtractedFacts({ facts }) {
  const [expanded, setExpanded] = useState(false);

  const entries = Object.entries(facts).filter(([, v]) => v != null);
  const primary = entries.filter(([k]) => PRIMARY_KEYS.includes(k));
  const secondary = entries.filter(([k]) => !PRIMARY_KEYS.includes(k));

  const visibleSecondary = expanded ? secondary : [];

  return (
    <div className="extracted-section">
      <div className="result-section-header">
        <h2 className="result-section-title">What we found</h2>
        <p className="result-section-sub">Structured details identified from the information you submitted.</p>
      </div>

      <div className="summary-grid extracted-grid">
        {primary.map(([key, value]) => {
          const valStr = String(value);
          const isNeutral = valStr.toLowerCase() === 'unknown' || valStr.toLowerCase() === 'not provided' || valStr.toLowerCase() === 'none' || valStr.toLowerCase() === 'n/a';
          const isWarning = key === 'paymentRequest' && valStr.toLowerCase() !== 'none' && valStr.toLowerCase() !== 'none mentioned';
          const displayValue = valStr.toLowerCase() === 'unknown' ? 'Not detected' : valStr;
          
          return (
            <div key={key} className="summary-item">
              <span className="summary-key">{LABELS[key] || key}</span>
              <span className={`summary-value ${isNeutral ? 'value-neutral' : ''} ${isWarning ? 'value-warning' : ''}`}>
                {displayValue}
              </span>
            </div>
          );
        })}
        {visibleSecondary.map(([key, value]) => {
          const valStr = String(value);
          const isNeutral = valStr.toLowerCase() === 'unknown' || valStr.toLowerCase() === 'not provided' || valStr.toLowerCase() === 'none' || valStr.toLowerCase() === 'n/a';
          const displayValue = valStr.toLowerCase() === 'unknown' ? 'Not detected' : valStr;
          return (
            <div key={key} className="summary-item animate-fade-in">
              <span className="summary-key">{LABELS[key] || key}</span>
              <span className={`summary-value ${isNeutral ? 'value-neutral' : ''}`}>{displayValue}</span>
            </div>
          );
        })}
      </div>

      <div className="extracted-footer">
        <span className="source-indicator">Source: Submitted opportunity</span>
        {secondary.length > 0 && (
          <button
            className="btn-ghost-subtle facts-toggle"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
          >
            {expanded
              ? `Hide ${secondary.length} additional fields`
              : `Show ${secondary.length} more extracted fields`}
          </button>
        )}
      </div>
    </div>
  );
}
