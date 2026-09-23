import React from 'react';
import './EvidenceCard.css';

/**
 * Modern Forensic Evidence Card
 * Supports both risk warning signals and safe trust markers.
 */
export default function EvidenceCard({
  title,
  points,
  severity = 'Moderate',
  evidence,
  explanation,
  isSafe = false,
}) {
  // Normalized severity
  let severityType = (severity || 'moderate').toLowerCase();
  let severityLabel = `${severityType.charAt(0).toUpperCase() + severityType.slice(1)} Risk`;

  if (isSafe) {
    severityType = 'safe';
    severityLabel = 'Trust Marker';
  } else if (points >= 20 || severityType === 'high' || severityType === 'critical') {
    severityType = 'high';
    severityLabel = 'High Severity';
  } else if (points >= 15 || severityType === 'medium' || severityType === 'moderate') {
    severityType = 'medium';
    severityLabel = 'Moderate Severity';
  } else {
    severityType = 'low';
    severityLabel = 'Low Severity';
  }

  const hasEvidence = evidence && evidence.trim() !== '' && evidence !== 'Found in submitted offer details';

  return (
    <div className={`evidence-card card-${severityType}`}>
      <div className="ev-header">
        <div className="ev-badge-group">
          <span className={`ev-badge badge-${severityType}`}>
            {isSafe ? '🛡️ Trust Factor' : `⚠️ ${severityLabel}`}
          </span>
        </div>
        <div className={`ev-points points-${severityType}`}>
          {isSafe ? `−${Math.abs(points || 10)} pts` : `+${points || 10} pts`}
        </div>
      </div>

      <h4 className="ev-title">{title}</h4>

      {hasEvidence && (
        <div className="ev-quote-wrap">
          <span className="ev-quote-label">Quoted Evidence</span>
          <blockquote className="ev-quote">
            <span className="quote-mark">“</span>
            {evidence.replace(/^["']|["']$/g, '')}
            <span className="quote-mark">”</span>
          </blockquote>
        </div>
      )}

      {explanation && (
        <div className="ev-analysis-wrap">
          <span className="ev-analysis-label">Analyst Takeaway</span>
          <p className="ev-explanation">{explanation}</p>
        </div>
      )}
    </div>
  );
}
