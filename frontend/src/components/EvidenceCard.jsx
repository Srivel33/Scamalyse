import React from 'react';
import './EvidenceCard.css';

/**
 * A single evidence signal card.
 * Props: { title, points, evidence, explanation }
 */
export default function EvidenceCard({ title, points, evidence, explanation }) {
  // Determine severity based on points
  let severity = 'Low';
  let severityClass = 'ev-low';
  if (points >= 30) {
    severity = 'High';
    severityClass = 'ev-high';
  } else if (points >= 15) {
    severity = 'Moderate';
    severityClass = 'ev-medium';
  }

  return (
    <div className={`evidence-card ${severityClass}`}>
      <div className="ev-header">
        <div className="ev-severity-badge">
          {severity} severity
        </div>
        <div className="ev-points" aria-label={`Contribution: +${points} points`}>
          +{points}
        </div>
      </div>
      
      <h4 className="ev-title">{title}</h4>

      <div className="ev-body">
        <div className="ev-block">
          <span className="ev-label">Evidence</span>
          <blockquote className="ev-quote">{evidence}</blockquote>
        </div>

        <div className="ev-block">
          <span className="ev-label">Why this matters</span>
          <p className="ev-explanation">{explanation}</p>
        </div>
        
        <div className="ev-block ev-source-block">
          <span className="ev-label">Evidence source</span>
          <span className="ev-source-text">Submitted opportunity</span>
        </div>
      </div>
    </div>
  );
}
