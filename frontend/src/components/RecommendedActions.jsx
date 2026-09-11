import React from 'react';
import './RecommendedActions.css';

export default function RecommendedActions({ actions }) {
  if (!actions || actions.length === 0) return null;

  return (
    <div className="recommended-actions">
      <div className="result-section-header">
        <h2 className="result-section-title">What you should do next</h2>
        <p className="result-section-sub">
          Practical steps to verify the opportunity before proceeding.
        </p>
      </div>

      <div className="actions-list">
        {actions.map((action, i) => (
          <div key={i} className="action-row">
            <div className="action-number">
              {String(i + 1).padStart(2, '0')}
            </div>
            <div className="action-content">
              <p className="action-text">{action}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="actions-buttons">
        <button id="find-website-btn" className="btn btn-secondary btn-sm" type="button">
          Find official website
        </button>
        <button id="search-complaints-btn" className="btn btn-secondary btn-sm" type="button">
          Search company + complaints
        </button>
      </div>
    </div>
  );
}
